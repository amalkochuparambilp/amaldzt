import { SignalingClient, RTC_CONFIG, SignalData } from './webrtc';

export interface TransferMeta {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified?: number;
  totalChunks: number;
  senderId: string;
  senderName: string;
  timestamp: number;
}

export interface TransferProgress {
  id: string;
  meta: TransferMeta;
  direction: 'send' | 'receive';
  progress: number; // 0 to 100
  bytesTransferred: number;
  speed: number; // bytes per second
  eta: number; // seconds remaining
  status: 'pending' | 'transferring' | 'completed' | 'error' | 'cancelled';
  blobUrl?: string;
  blob?: Blob;
  error?: string;
  completedAt?: number;
}

export interface P2PTextMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
}

export interface P2PPeerState {
  peerId: string;
  displayName: string;
  connected: boolean;
  channelReady: boolean;
  joinedAt: number;
  latency?: number;
}

export interface P2PTransferCallbacks {
  onPeerJoin: (peer: P2PPeerState) => void;
  onPeerLeave: (peerId: string) => void;
  onPeerStatusChange: (peers: P2PPeerState[]) => void;
  onTransferProgress: (transfer: TransferProgress) => void;
  onTransferComplete: (transfer: TransferProgress) => void;
  onTransferError: (transferId: string, error: string) => void;
  onTextMessage: (msg: P2PTextMessage) => void;
  onSignalingState: (state: 'connecting' | 'connected' | 'error' | 'closed') => void;
}

const CHUNK_SIZE = 64 * 1024; // 64KB binary chunk size for WebRTC DataChannel
const BUFFER_THRESHOLD = 512 * 1024; // 512KB backpressure threshold

// Audio synthesizer for pleasant sound feedback
export function playP2PSound(type: 'connect' | 'receive_complete' | 'send_complete' | 'message' | 'error') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'connect') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'receive_complete' || type === 'send_complete') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc1.frequency.setValueAtTime(783.99, now + 0.16); // G5
      osc2.frequency.setValueAtTime(1046.50, now + 0.16); // C6
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc1.start(now);
      osc2.start(now + 0.16);
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
    } else if (type === 'message') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.08);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'error') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.1);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch {
    // Ignore audio permission or context restrictions
  }
}

export class P2PFileManager {
  private roomId: string;
  private peerId: string;
  private displayName: string;
  private callbacks: P2PTransferCallbacks;
  private signalingClient: SignalingClient | null = null;
  
  // Peer connections and data channels: peerId -> RTCPeerConnection
  private peerConnections = new Map<string, RTCPeerConnection>();
  // peerId -> RTCDataChannel
  private dataChannels = new Map<string, RTCDataChannel>();
  // Active peer states
  private peers = new Map<string, P2PPeerState>();
  
  // File receiving state: fileId -> { meta, chunks: ArrayBuffer[], receivedChunks: number, startTime: number, lastUpdate: number, lastBytes: number }
  private receivingFiles = new Map<string, {
    meta: TransferMeta;
    chunks: (ArrayBuffer | null)[];
    receivedChunks: number;
    totalChunks: number;
    receivedBytes: number;
    startTime: number;
    lastSpeedCalcTime: number;
    lastSpeedCalcBytes: number;
    currentSpeed: number;
  }>();

  // Active outgoing transfer cancellation flags
  private activeUploads = new Map<string, { isCancelled: boolean }>();

  private isClosed = false;

  constructor(
    roomId: string,
    peerId: string,
    displayName: string,
    callbacks: P2PTransferCallbacks
  ) {
    this.roomId = roomId;
    this.peerId = peerId;
    this.displayName = displayName;
    this.callbacks = callbacks;

    this.initSignaling();
  }

  private initSignaling() {
    this.callbacks.onSignalingState('connecting');

    this.signalingClient = new SignalingClient(
      this.roomId,
      this.peerId,
      this.displayName,
      {
        onPeerJoined: (remotePeerId, remoteDisplayName) => {
          this.handlePeerJoined(remotePeerId, remoteDisplayName);
        },
        onPeerLeft: (remotePeerId) => {
          this.handlePeerLeft(remotePeerId);
        },
        onSignal: (senderId, signalData) => {
          this.handleSignal(senderId, signalData);
        },
        onChatMessage: (message) => {
          // Can also receive text from WebSocket if dataChannel is not yet open
          this.callbacks.onTextMessage({
            id: message.id,
            text: message.text,
            senderId: message.senderId,
            senderName: message.senderName,
            timestamp: message.timestamp
          });
        },
        onReaction: () => {},
        onConnected: () => {
          this.callbacks.onSignalingState('connected');
        },
        onError: () => {
          this.callbacks.onSignalingState('error');
        }
      }
    );
  }

  private handlePeerJoined(remotePeerId: string, remoteDisplayName: string) {
    if (remotePeerId === this.peerId) return;

    const newPeer: P2PPeerState = {
      peerId: remotePeerId,
      displayName: remoteDisplayName,
      connected: false,
      channelReady: false,
      joinedAt: Date.now()
    };

    this.peers.set(remotePeerId, newPeer);
    this.notifyPeersChanged();
    this.callbacks.onPeerJoin(newPeer);

    // As initiator, create RTCPeerConnection and RTCDataChannel
    this.createPeerConnection(remotePeerId, true);
  }

  private handlePeerLeft(remotePeerId: string) {
    const pc = this.peerConnections.get(remotePeerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(remotePeerId);
    }
    const dc = this.dataChannels.get(remotePeerId);
    if (dc) {
      dc.close();
      this.dataChannels.delete(remotePeerId);
    }
    this.peers.delete(remotePeerId);
    this.notifyPeersChanged();
    this.callbacks.onPeerLeave(remotePeerId);
  }

  private createPeerConnection(remotePeerId: string, isInitiator: boolean): RTCPeerConnection {
    // If existing, close it first
    if (this.peerConnections.has(remotePeerId)) {
      this.peerConnections.get(remotePeerId)?.close();
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    this.peerConnections.set(remotePeerId, pc);

    pc.onicecandidate = (event) => {
      if (event.candidate && this.signalingClient) {
        this.signalingClient.sendSignal(remotePeerId, {
          type: 'ice-candidate',
          candidate: event.candidate.toJSON()
        });
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      const peer = this.peers.get(remotePeerId);
      if (peer) {
        peer.connected = state === 'connected';
        this.notifyPeersChanged();
      }
    };

    if (isInitiator) {
      // Create DataChannel
      const dc = pc.createDataChannel('dzt-file-channel', {
        ordered: true
      });
      this.setupDataChannel(remotePeerId, dc);

      // Create Offer
      pc.createOffer().then((offer) => {
        return pc.setLocalDescription(offer);
      }).then(() => {
        if (pc.localDescription && this.signalingClient) {
          this.signalingClient.sendSignal(remotePeerId, {
            type: 'offer',
            sdp: pc.localDescription
          });
        }
      }).catch((err) => {
        console.error('Error creating WebRTC offer:', err);
      });
    } else {
      // Wait for DataChannel from remote peer
      pc.ondatachannel = (event) => {
        this.setupDataChannel(remotePeerId, event.channel);
      };
    }

    return pc;
  }

  private setupDataChannel(remotePeerId: string, dc: RTCDataChannel) {
    dc.binaryType = 'arraybuffer';
    dc.bufferedAmountLowThreshold = BUFFER_THRESHOLD;
    this.dataChannels.set(remotePeerId, dc);

    dc.onopen = () => {
      const peer = this.peers.get(remotePeerId);
      if (peer) {
        peer.channelReady = true;
        peer.connected = true;
        this.notifyPeersChanged();
      }
      playP2PSound('connect');
    };

    dc.onclose = () => {
      const peer = this.peers.get(remotePeerId);
      if (peer) {
        peer.channelReady = false;
        this.notifyPeersChanged();
      }
    };

    dc.onerror = (err) => {
      console.error(`DataChannel error with peer ${remotePeerId}:`, err);
    };

    dc.onmessage = (event) => {
      this.handleDataChannelMessage(remotePeerId, event.data);
    };
  }

  private async handleSignal(senderId: string, signalData: SignalData) {
    if (signalData.type === 'offer') {
      const pc = this.createPeerConnection(senderId, false);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (this.signalingClient) {
          this.signalingClient.sendSignal(senderId, {
            type: 'answer',
            sdp: answer
          });
        }
      } catch (err) {
        console.error('Error handling RTC offer:', err);
      }
    } else if (signalData.type === 'answer') {
      const pc = this.peerConnections.get(senderId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
        } catch (err) {
          console.error('Error setting RTC answer:', err);
        }
      }
    } else if (signalData.type === 'ice-candidate') {
      const pc = this.peerConnections.get(senderId);
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    }
  }

  private handleDataChannelMessage(remotePeerId: string, rawData: any) {
    if (typeof rawData === 'string') {
      try {
        const payload = JSON.parse(rawData);
        if (payload.type === 'file-header') {
          this.handleIncomingFileHeader(payload.meta);
        } else if (payload.type === 'file-cancel') {
          this.handleIncomingFileCancel(payload.fileId, payload.reason);
        } else if (payload.type === 'text-message') {
          playP2PSound('message');
          this.callbacks.onTextMessage({
            id: payload.id,
            text: payload.text,
            senderId: payload.senderId || remotePeerId,
            senderName: payload.senderName || 'Peer',
            timestamp: payload.timestamp || Date.now()
          });
        }
      } catch (err) {
        console.error('Error parsing DataChannel string payload:', err);
      }
    } else if (rawData instanceof ArrayBuffer) {
      this.handleIncomingBinaryChunk(rawData);
    }
  }

  // Binary Protocol:
  // First 36 bytes: File ID (UUID string padded or ASCII)
  // Next 4 bytes (Uint32): Chunk Index
  // Remaining bytes: Actual binary chunk data
  private handleIncomingFileHeader(meta: TransferMeta) {
    this.receivingFiles.set(meta.id, {
      meta,
      chunks: new Array(meta.totalChunks).fill(null),
      receivedChunks: 0,
      totalChunks: meta.totalChunks,
      receivedBytes: 0,
      startTime: Date.now(),
      lastSpeedCalcTime: Date.now(),
      lastSpeedCalcBytes: 0,
      currentSpeed: 0
    });

    this.callbacks.onTransferProgress({
      id: meta.id,
      meta,
      direction: 'receive',
      progress: 0,
      bytesTransferred: 0,
      speed: 0,
      eta: 0,
      status: 'transferring'
    });
  }

  private handleIncomingBinaryChunk(buffer: ArrayBuffer) {
    if (buffer.byteLength < 40) return; // Min header size

    const headerView = new DataView(buffer, 0, 40);
    // Read 36 byte fileId string
    const idBytes = new Uint8Array(buffer, 0, 36);
    const fileId = new TextDecoder().decode(idBytes).trim();
    const chunkIndex = headerView.getUint32(36, false); // Big-endian index

    const state = this.receivingFiles.get(fileId);
    if (!state) return;

    const chunkData = buffer.slice(40);
    if (!state.chunks[chunkIndex]) {
      state.chunks[chunkIndex] = chunkData;
      state.receivedChunks += 1;
      state.receivedBytes += chunkData.byteLength;
    }

    const now = Date.now();
    const elapsedSinceLastSpeed = (now - state.lastSpeedCalcTime) / 1000;
    if (elapsedSinceLastSpeed >= 0.35) {
      const bytesDelta = state.receivedBytes - state.lastSpeedCalcBytes;
      state.currentSpeed = bytesDelta / elapsedSinceLastSpeed;
      state.lastSpeedCalcTime = now;
      state.lastSpeedCalcBytes = state.receivedBytes;
    }

    const progress = Math.min(100, Math.round((state.receivedBytes / state.meta.size) * 100));
    const remainingBytes = Math.max(0, state.meta.size - state.receivedBytes);
    const eta = state.currentSpeed > 0 ? Math.ceil(remainingBytes / state.currentSpeed) : 0;

    const progressObj: TransferProgress = {
      id: fileId,
      meta: state.meta,
      direction: 'receive',
      progress,
      bytesTransferred: state.receivedBytes,
      speed: state.currentSpeed,
      eta,
      status: 'transferring'
    };

    this.callbacks.onTransferProgress(progressObj);

    // Check if transfer is complete
    if (state.receivedChunks >= state.totalChunks || state.receivedBytes >= state.meta.size) {
      // Reassemble blob
      const completeChunks = state.chunks.filter((c): c is ArrayBuffer => c !== null);
      const blob = new Blob(completeChunks, { type: state.meta.type || 'application/octet-stream' });
      const blobUrl = URL.createObjectURL(blob);

      const completeObj: TransferProgress = {
        id: fileId,
        meta: state.meta,
        direction: 'receive',
        progress: 100,
        bytesTransferred: state.meta.size,
        speed: 0,
        eta: 0,
        status: 'completed',
        blob,
        blobUrl,
        completedAt: Date.now()
      };

      this.receivingFiles.delete(fileId);
      playP2PSound('receive_complete');
      this.callbacks.onTransferComplete(completeObj);
    }
  }

  private handleIncomingFileCancel(fileId: string, reason?: string) {
    const state = this.receivingFiles.get(fileId);
    if (state) {
      this.receivingFiles.delete(fileId);
      this.callbacks.onTransferError(fileId, reason || 'Remote sender cancelled transfer');
    }
  }

  // --- Public API ---

  public getPeers(): P2PPeerState[] {
    return Array.from(this.peers.values());
  }

  public getReadyChannelsCount(): number {
    let count = 0;
    this.dataChannels.forEach((dc) => {
      if (dc.readyState === 'open') count++;
    });
    return count;
  }

  public sendTextMessage(text: string): P2PTextMessage | null {
    if (!text.trim()) return null;

    const msg: P2PTextMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: text.trim(),
      senderId: this.peerId,
      senderName: this.displayName,
      timestamp: Date.now()
    };

    const payload = JSON.stringify({
      type: 'text-message',
      ...msg
    });

    let sentViaChannel = false;
    this.dataChannels.forEach((dc) => {
      if (dc.readyState === 'open') {
        dc.send(payload);
        sentViaChannel = true;
      }
    });

    // Fallback broadcast through signaling if no direct data channels
    if (!sentViaChannel && this.signalingClient) {
      this.signalingClient.sendChat(msg.text);
    }

    playP2PSound('message');
    return msg;
  }

  public async sendFile(
    file: File, 
    targetPeerId?: string
  ): Promise<string> {
    const fileId = `${Math.random().toString(36).slice(2, 10)}-${Date.now()}`.padEnd(36, ' ').slice(0, 36);
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    const meta: TransferMeta = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      lastModified: file.lastModified,
      totalChunks,
      senderId: this.peerId,
      senderName: this.displayName,
      timestamp: Date.now()
    };

    this.activeUploads.set(fileId, { isCancelled: false });

    // Identify target channels
    const channelsToSend: RTCDataChannel[] = [];
    if (targetPeerId) {
      const dc = this.dataChannels.get(targetPeerId);
      if (dc && dc.readyState === 'open') {
        channelsToSend.push(dc);
      }
    } else {
      this.dataChannels.forEach((dc) => {
        if (dc.readyState === 'open') {
          channelsToSend.push(dc);
        }
      });
    }

    if (channelsToSend.length === 0) {
      const errorMsg = 'No connected peers ready. Invite a friend or scan the QR code first!';
      playP2PSound('error');
      this.callbacks.onTransferError(fileId, errorMsg);
      throw new Error(errorMsg);
    }

    // Step 1: Send Header
    const headerPayload = JSON.stringify({
      type: 'file-header',
      meta
    });

    channelsToSend.forEach((dc) => dc.send(headerPayload));

    // Step 2: Stream binary chunks with backpressure
    this.callbacks.onTransferProgress({
      id: fileId,
      meta,
      direction: 'send',
      progress: 0,
      bytesTransferred: 0,
      speed: 0,
      eta: 0,
      status: 'transferring'
    });

    this.streamFileChunks(file, meta, channelsToSend).catch((err) => {
      console.error('Error streaming file chunks:', err);
      playP2PSound('error');
      this.callbacks.onTransferError(fileId, err.message || 'Transfer failed');
    });

    return fileId;
  }

  private async streamFileChunks(
    file: File, 
    meta: TransferMeta, 
    channels: RTCDataChannel[]
  ) {
    const fileId = meta.id;
    let offset = 0;
    let chunkIndex = 0;
    const startTime = Date.now();
    let lastSpeedCalcTime = Date.now();
    let lastSpeedCalcBytes = 0;
    let currentSpeed = 0;

    const idEncoder = new TextEncoder();
    const idHeaderBytes = idEncoder.encode(fileId.padEnd(36, ' ').slice(0, 36));

    while (offset < file.size) {
      const uploadState = this.activeUploads.get(fileId);
      if (uploadState?.isCancelled || this.isClosed) {
        // Send cancel message
        const cancelMsg = JSON.stringify({ type: 'file-cancel', fileId, reason: 'Sender cancelled' });
        channels.forEach((dc) => {
          if (dc.readyState === 'open') dc.send(cancelMsg);
        });
        return;
      }

      // Check backpressure on all channels
      for (const dc of channels) {
        if (dc.bufferedAmount > BUFFER_THRESHOLD) {
          await new Promise<void>((resolve) => {
            const onLow = () => {
              dc.removeEventListener('bufferedamountlow', onLow);
              resolve();
            };
            dc.addEventListener('bufferedamountlow', onLow);
            // Safety timeout
            setTimeout(resolve, 50);
          });
        }
      }

      const chunkSlice = file.slice(offset, offset + CHUNK_SIZE);
      const chunkBuffer = await chunkSlice.arrayBuffer();

      // Build composite binary packet: [36 bytes ID] + [4 bytes Uint32 Index] + [Data]
      const packet = new Uint8Array(40 + chunkBuffer.byteLength);
      packet.set(idHeaderBytes, 0);
      const view = new DataView(packet.buffer, 0, 40);
      view.setUint32(36, chunkIndex, false); // Big endian
      packet.set(new Uint8Array(chunkBuffer), 40);

      // Send to all open channels
      for (const dc of channels) {
        if (dc.readyState === 'open') {
          dc.send(packet.buffer);
        }
      }

      offset += chunkBuffer.byteLength;
      chunkIndex++;

      const now = Date.now();
      const elapsedSinceLastSpeed = (now - lastSpeedCalcTime) / 1000;
      if (elapsedSinceLastSpeed >= 0.3) {
        const bytesDelta = offset - lastSpeedCalcBytes;
        currentSpeed = bytesDelta / elapsedSinceLastSpeed;
        lastSpeedCalcTime = now;
        lastSpeedCalcBytes = offset;
      }

      const progress = Math.min(100, Math.round((offset / file.size) * 100));
      const remainingBytes = Math.max(0, file.size - offset);
      const eta = currentSpeed > 0 ? Math.ceil(remainingBytes / currentSpeed) : 0;

      this.callbacks.onTransferProgress({
        id: fileId,
        meta,
        direction: 'send',
        progress,
        bytesTransferred: offset,
        speed: currentSpeed,
        eta,
        status: 'transferring'
      });

      // Yield event loop briefly every 4 chunks to keep UI responsive
      if (chunkIndex % 4 === 0) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    // Completed
    this.activeUploads.delete(fileId);
    playP2PSound('send_complete');

    this.callbacks.onTransferComplete({
      id: fileId,
      meta,
      direction: 'send',
      progress: 100,
      bytesTransferred: file.size,
      speed: 0,
      eta: 0,
      status: 'completed',
      completedAt: Date.now()
    });
  }

  public cancelTransfer(fileId: string) {
    const upload = this.activeUploads.get(fileId);
    if (upload) {
      upload.isCancelled = true;
      this.activeUploads.delete(fileId);
    }
    const receiving = this.receivingFiles.get(fileId);
    if (receiving) {
      this.receivingFiles.delete(fileId);
    }
  }

  private notifyPeersChanged() {
    this.callbacks.onPeerStatusChange(this.getPeers());
  }

  public close() {
    this.isClosed = true;
    this.activeUploads.clear();
    this.receivingFiles.clear();

    this.dataChannels.forEach((dc) => dc.close());
    this.dataChannels.clear();

    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();

    if (this.signalingClient) {
      this.signalingClient.close();
      this.signalingClient = null;
    }
  }
}
