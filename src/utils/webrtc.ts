import { VCPeer, VCChatMessage } from '../types';

export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
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
}

export class SignalingClient {
  private ws: WebSocket | null = null;
  private bc: BroadcastChannel | null = null;
  private roomId: string;
  private peerId: string;
  private displayName: string;
  private callbacks: SignalingCallbacks;
  private isClosed = false;
  private reconnectTimeout: any = null;

  constructor(
    roomId: string,
    peerId: string,
    displayName: string,
    callbacks: SignalingCallbacks
  ) {
    this.roomId = roomId;
    this.peerId = peerId;
    this.displayName = displayName;
    this.callbacks = callbacks;

    // BroadcastChannel backup for multi-tab same-origin instant fallback
    try {
      this.bc = new BroadcastChannel(`dzt_vc_${roomId}`);
      this.bc.onmessage = (event) => {
        this.handleMessage(event.data);
      };
    } catch {
      // Ignore if BroadcastChannel is unsupported
    }

    this.connect();
  }

  private connect() {
    if (this.isClosed) return;

    try {
      const isHttps = window.location.protocol === 'https:';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${wsProtocol}//${host}/ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        if (this.isClosed) {
          this.ws?.close();
          return;
        }
        // Send join payload
        this.send({
          type: 'join',
          roomId: this.roomId,
          peerId: this.peerId,
          displayName: this.displayName
        });
        this.callbacks.onConnected(this.peerId);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (e) {
          console.warn('Failed to parse WS message', e);
        }
      };

      this.ws.onclose = () => {
        if (!this.isClosed) {
          this.reconnectTimeout = setTimeout(() => this.connect(), 3000);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket signaling connection error, fallback enabled', err);
      };
    } catch (err) {
      console.warn('Failed to create WebSocket, fallback to BC', err);
    }
  }

  private handleMessage(data: any) {
    if (!data) return;

    switch (data.type) {
      case 'joined-room':
        if (data.peers && Array.isArray(data.peers)) {
          data.peers.forEach((p: { peerId: string; displayName: string }) => {
            if (p.peerId !== this.peerId) {
              this.callbacks.onPeerJoined(p.peerId, p.displayName);
            }
          });
        }
        break;

      case 'peer-joined':
        if (data.peerId && data.peerId !== this.peerId) {
          this.callbacks.onPeerJoined(data.peerId, data.displayName || 'Peer');
        }
        break;

      case 'peer-left':
        if (data.peerId && data.peerId !== this.peerId) {
          this.callbacks.onPeerLeft(data.peerId);
        }
        break;

      case 'signal':
        if (data.senderId && data.senderId !== this.peerId && data.signalData) {
          if (!data.targetId || data.targetId === this.peerId) {
            this.callbacks.onSignal(data.senderId, data.signalData);
          }
        }
        break;

      case 'chat':
        if (data.text) {
          this.callbacks.onChatMessage({
            id: `msg-${data.timestamp || Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            senderId: data.senderId,
            senderName: data.senderName,
            text: data.text,
            timestamp: data.timestamp || Date.now(),
            isSelf: data.senderId === this.peerId
          });
        }
        break;

      case 'reaction':
        if (data.emoji) {
          this.callbacks.onReaction(
            data.senderId,
            data.senderName || 'Peer',
            data.emoji
          );
        }
        break;
    }
  }

  public send(payload: any) {
    const raw = JSON.stringify(payload);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(raw);
    }
    // Also broadcast to same-origin channel
    try {
      this.bc?.postMessage(payload);
    } catch {
      // ignore
    }
  }

  public sendSignal(targetId: string, signalData: SignalData) {
    this.send({
      type: 'signal',
      roomId: this.roomId,
      senderId: this.peerId,
      targetId,
      signalData
    });
  }

  public sendChat(text: string) {
    this.send({
      type: 'chat',
      roomId: this.roomId,
      senderId: this.peerId,
      senderName: this.displayName,
      text,
      timestamp: Date.now()
    });
  }

  public sendReaction(emoji: string) {
    this.send({
      type: 'reaction',
      roomId: this.roomId,
      senderId: this.peerId,
      senderName: this.displayName,
      emoji
    });
  }

  public close() {
    this.isClosed = true;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.send({
      type: 'leave',
      roomId: this.roomId,
      peerId: this.peerId
    });
    try {
      this.ws?.close();
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

// Generate human-readable clean room IDs (e.g., dzt-collab-429, jnias-node-812)
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
