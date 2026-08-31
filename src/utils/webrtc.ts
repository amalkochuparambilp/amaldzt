import mqtt, { MqttClient } from 'mqtt';
import { VCPeer, VCChatMessage } from '../types';

export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.services.mozilla.com' },
  ],
  iceCandidatePoolSize: 10,
};

export type SignalData =
  | { type: 'offer'; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; sdp: RTCSessionDescriptionInit }
  | { type: 'ice-candidate'; candidate: RTCIceCandidateInit }
  | { type: 'mute-status'; isAudioMuted: boolean; isVideoMuted: boolean; isScreenSharing: boolean; isHandRaised: boolean };

export interface SignalingCallbacks {
  onPeerJoined: (peerId: string, displayName: string) => void;
  onPeerLeft: (peerId: string) => void;
  onSignal: (senderId: string, signalData: SignalData) => void;
  onChatMessage: (message: VCChatMessage) => void;
  onReaction: (senderId: string, senderName: string, emoji: string) => void;
  onConnected: (peerId: string) => void;
  onError: (error: string) => void;
  onFileHeader?: (senderId: string, meta: any) => void;
  onFileChunk?: (senderId: string, chunkPayload: { fileId: string; chunkIndex: number; data: string; totalChunks: number; bytes: number }) => void;
  onFileCancel?: (senderId: string, fileId: string, reason?: string) => void;
}

export class SignalingClient {
  private ws: WebSocket | null = null;
  private mqttClient: MqttClient | null = null;
  private bc: BroadcastChannel | null = null;
  private roomId: string;
  private peerId: string;
  private displayName: string;
  private callbacks: SignalingCallbacks;
  private isClosed = false;
  private reconnectTimeout: any = null;
  private seenMessageIds = new Set<string>();
  private announcedPeers = new Set<string>();
  private heartbeatInterval: any = null;

  constructor(
    roomId: string,
    peerId: string,
    displayName: string,
    callbacks: SignalingCallbacks
  ) {
    this.roomId = roomId.trim().toLowerCase();
    this.peerId = peerId;
    this.displayName = displayName;
    this.callbacks = callbacks;

    // 1. BroadcastChannel for instant multi-tab same-browser mesh
    try {
      this.bc = new BroadcastChannel(`dzt_vc_${this.roomId}`);
      this.bc.onmessage = (event) => {
        this.handleIncomingPayload(event.data);
      };
    } catch {
      // BroadcastChannel optional fallback
    }

    // 2. Primary local WebSocket (runs on Node server / Cloud Run)
    this.initLocalWebSocket();

    // 3. Global Public MQTT-over-WSS Relay (Ensures amaldzt.vercel.app and static deployments work anywhere)
    this.initGlobalMqttRelay();

    // 4. Periodic peer announce / heartbeat
    this.heartbeatInterval = setInterval(() => {
      if (!this.isClosed) {
        this.broadcast({
          type: 'peer-heartbeat',
          msgId: `hb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          roomId: this.roomId,
          peerId: this.peerId,
          displayName: this.displayName
        });
      }
    }, 5000);
  }

  // --- Local Backend WebSocket ---
  private initLocalWebSocket() {
    if (this.isClosed) return;

    try {
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
      const wsUrl = `${wsProtocol}//${host}/ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        if (this.isClosed) {
          this.ws?.close();
          return;
        }
        this.sendWs({
          type: 'join',
          msgId: `ws-join-${Date.now()}`,
          roomId: this.roomId,
          peerId: this.peerId,
          displayName: this.displayName
        });
        this.callbacks.onConnected(this.peerId);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingPayload(data);
        } catch {
          // ignore
        }
      };

      this.ws.onclose = () => {
        // WS closed (expected on static Vercel host); global MQTT handles cross-network signaling seamlessly
      };

      this.ws.onerror = () => {
        // Will fallback to MQTT automatically
      };
    } catch {
      // fallback to MQTT
    }
  }

  // --- Global Public MQTT WSS Signaling Relay (Zero backend setup required) ---
  private initGlobalMqttRelay() {
    if (this.isClosed) return;

    try {
      const brokerUrl = 'wss://broker.hivemq.com:8884/mqtt';
      const topic = `dzt/webrtc/v1/${this.roomId}`;

      const client = mqtt.connect(brokerUrl, {
        clientId: `dzt_${this.peerId}_${Math.random().toString(36).substring(2, 6)}`,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 3000,
        keepalive: 30
      });

      this.mqttClient = client;

      client.on('connect', () => {
        if (this.isClosed) {
          client.end(true);
          return;
        }

        client.subscribe(topic, { qos: 0 }, (err) => {
          if (!err) {
            // Announce presence to all peers in this room
            this.broadcast({
              type: 'peer-announce',
              msgId: `ann-${Date.now()}-${this.peerId}`,
              roomId: this.roomId,
              peerId: this.peerId,
              displayName: this.displayName
            });

            this.callbacks.onConnected(this.peerId);
          }
        });
      });

      client.on('message', (_t, payload) => {
        try {
          const raw = payload.toString();
          const data = JSON.parse(raw);
          this.handleIncomingPayload(data);
        } catch {
          // ignore
        }
      });

      client.on('error', (err) => {
        console.warn('MQTT relay warning:', err.message);
      });
    } catch (e) {
      console.warn('Could not initialize global MQTT relay:', e);
    }
  }

  // Handle incoming message from any transport (WS, MQTT, BroadcastChannel)
  private handleIncomingPayload(data: any) {
    if (!data || this.isClosed) return;

    // Filter by room
    if (data.roomId && data.roomId !== this.roomId) return;

    // Filter out messages from self
    if (data.peerId === this.peerId || data.senderId === this.peerId) return;

    // Message Deduplication
    if (data.msgId) {
      if (this.seenMessageIds.has(data.msgId)) return;
      this.seenMessageIds.add(data.msgId);
      // Keep set bounded
      if (this.seenMessageIds.size > 500) {
        const first = this.seenMessageIds.values().next().value;
        if (first) this.seenMessageIds.delete(first);
      }
    }

    switch (data.type) {
      // 1. Peer announce (newcomer arrived)
      case 'peer-announce': {
        const pId = data.peerId;
        const pName = data.displayName || 'Peer';
        if (pId && pId !== this.peerId) {
          this.callbacks.onPeerJoined(pId, pName);

          // Reply with our presence so the newcomer knows about us
          this.broadcast({
            type: 'peer-presence',
            msgId: `pres-${Date.now()}-${this.peerId}-${pId}`,
            roomId: this.roomId,
            targetId: pId,
            peerId: this.peerId,
            displayName: this.displayName
          });
        }
        break;
      }

      // 2. Peer presence (response from existing peer)
      case 'peer-presence': {
        const pId = data.peerId;
        const pName = data.displayName || 'Peer';
        if (pId && pId !== this.peerId && (!data.targetId || data.targetId === this.peerId)) {
          this.callbacks.onPeerJoined(pId, pName);
        }
        break;
      }

      // 3. Backend WebSocket room member list
      case 'joined-room': {
        if (data.peers && Array.isArray(data.peers)) {
          data.peers.forEach((p: { peerId: string; displayName: string }) => {
            if (p.peerId !== this.peerId) {
              this.callbacks.onPeerJoined(p.peerId, p.displayName);
            }
          });
        }
        break;
      }

      case 'peer-joined': {
        if (data.peerId && data.peerId !== this.peerId) {
          this.callbacks.onPeerJoined(data.peerId, data.displayName || 'Peer');
        }
        break;
      }

      case 'peer-left': {
        if (data.peerId && data.peerId !== this.peerId) {
          this.callbacks.onPeerLeft(data.peerId);
        }
        break;
      }

      case 'peer-heartbeat': {
        if (data.peerId && data.peerId !== this.peerId && !this.announcedPeers.has(data.peerId)) {
          this.announcedPeers.add(data.peerId);
          this.callbacks.onPeerJoined(data.peerId, data.displayName || 'Peer');
        }
        break;
      }

      case 'signal': {
        if (data.senderId && data.senderId !== this.peerId && data.signalData) {
          if (!data.targetId || data.targetId === this.peerId) {
            this.callbacks.onSignal(data.senderId, data.signalData);
          }
        }
        break;
      }

      case 'chat': {
        if (data.text) {
          this.callbacks.onChatMessage({
            id: data.msgId || `msg-${data.timestamp || Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            senderId: data.senderId,
            senderName: data.senderName,
            text: data.text,
            timestamp: data.timestamp || Date.now(),
            isSelf: data.senderId === this.peerId
          });
        }
        break;
      }

      case 'reaction': {
        if (data.emoji) {
          this.callbacks.onReaction(
            data.senderId,
            data.senderName || 'Peer',
            data.emoji
          );
        }
        break;
      }

      case 'file-header': {
        if (data.meta && (!data.targetId || data.targetId === this.peerId)) {
          this.callbacks.onFileHeader?.(data.senderId, data.meta);
        }
        break;
      }

      case 'file-chunk': {
        if (data.chunkPayload && (!data.targetId || data.targetId === this.peerId)) {
          this.callbacks.onFileChunk?.(data.senderId, data.chunkPayload);
        }
        break;
      }

      case 'file-cancel': {
        if (data.fileId && (!data.targetId || data.targetId === this.peerId)) {
          this.callbacks.onFileCancel?.(data.senderId, data.fileId, data.reason);
        }
        break;
      }
    }
  }

  private sendWs(payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(payload));
      } catch {
        // ignore
      }
    }
  }

  private broadcast(payload: any) {
    const raw = JSON.stringify(payload);

    // 1. Local WebSocket
    this.sendWs(payload);

    // 2. Global MQTT Relay
    if (this.mqttClient && this.mqttClient.connected) {
      try {
        const topic = `dzt/webrtc/v1/${this.roomId}`;
        this.mqttClient.publish(topic, raw, { qos: 0 });
      } catch {
        // ignore
      }
    }

    // 3. BroadcastChannel (Same origin)
    try {
      this.bc?.postMessage(payload);
    } catch {
      // ignore
    }
  }

  public sendSignal(targetId: string, signalData: SignalData) {
    const msgId = `sig-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    this.broadcast({
      type: 'signal',
      msgId,
      roomId: this.roomId,
      senderId: this.peerId,
      targetId,
      signalData
    });
  }

  public sendChat(text: string) {
    const msgId = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    this.broadcast({
      type: 'chat',
      msgId,
      roomId: this.roomId,
      senderId: this.peerId,
      senderName: this.displayName,
      text,
      timestamp: Date.now()
    });
  }

  public sendReaction(emoji: string) {
    const msgId = `rx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    this.broadcast({
      type: 'reaction',
      msgId,
      roomId: this.roomId,
      senderId: this.peerId,
      senderName: this.displayName,
      emoji
    });
  }

  public sendFileHeader(meta: any, targetId?: string) {
    const msgId = `fh-${meta.id}-${Date.now()}`;
    this.broadcast({
      type: 'file-header',
      msgId,
      roomId: this.roomId,
      senderId: this.peerId,
      targetId,
      meta
    });
  }

  public sendFileChunk(chunkPayload: { fileId: string; chunkIndex: number; data: string; totalChunks: number; bytes: number }, targetId?: string) {
    const msgId = `fc-${chunkPayload.fileId}-${chunkPayload.chunkIndex}`;
    this.broadcast({
      type: 'file-chunk',
      msgId,
      roomId: this.roomId,
      senderId: this.peerId,
      targetId,
      chunkPayload
    });
  }

  public sendFileCancel(fileId: string, reason?: string, targetId?: string) {
    const msgId = `fcan-${fileId}-${Date.now()}`;
    this.broadcast({
      type: 'file-cancel',
      msgId,
      roomId: this.roomId,
      senderId: this.peerId,
      targetId,
      fileId,
      reason
    });
  }

  public close() {
    this.isClosed = true;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

    this.broadcast({
      type: 'peer-left',
      msgId: `leave-${Date.now()}-${this.peerId}`,
      roomId: this.roomId,
      peerId: this.peerId
    });

    try {
      this.ws?.close();
    } catch {
      // ignore
    }
    try {
      this.mqttClient?.end(true);
    } catch {
      // ignore
    }
    try {
      this.bc?.close();
    } catch {
      // ignore
    }
  }
}

// Generate human-readable clean room IDs (e.g., dzt-collab-429, jnias-lab-473)
export function generateRoomId(): string {
  const prefixes = ['dzt-mesh', 'jnias-lab', 'amal-net', 'dev-lounge', 'p2p-node', 'sec-ops'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${num}`;
}

export function generatePeerId(): string {
  return 'peer_' + Math.random().toString(36).substring(2, 10);
}

// Format duration in HH:MM:SS or MM:SS
export function formatCallDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
