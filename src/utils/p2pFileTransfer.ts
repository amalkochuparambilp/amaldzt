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
  transport?: 'webrtc-datachannel' | 'relay';
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
const FILE_HEADER_BYTES = 36; // 32 bytes ASCII ID + 4 bytes Uint32 Chunk Index

// Generate 32-char hex file ID
export function generateFileId(): string {
  const arr = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < 16; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Convert ArrayBuffer to Base64 (for relay fallback)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to ArrayBuffer (for relay fallback)
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

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

interface ReceiveState {
  meta: TransferMeta;
  chunks: (ArrayBuffer | null)[];
  receivedChunks: number;
  totalChunks: number;
  receivedBytes: number;
  startTime: number;
  lastSpeedCalcTime: number;
  lastSpeedCalcBytes: number;
  currentSpeed: number;
}

export class P2PFileManager {
  private roomId: string;
  private peerId: string;
  private displayName: string;
  private callbacks: P2PTransferCallbacks;
  private signalingClient: SignalingClient | null = null;
  
  // Peer connections and data channels
  private peerConnections = new Map<string, RTCPeerConnection>();
  private dataChannels = new Map<string, RTCDataChannel>();
  private iceCandidatesQueue = new Map<string, RTCIceCandidateInit[]>();
  private peers = new Map<string, P2PPeerState>();
  
  // File receiving state: fileId -> ReceiveState
  private receivingFiles = new Map<string, ReceiveState>();

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
        },
        onFileHeader: (senderId, meta) => {
          this.handleIncomingFileHeader(meta);
        },
        onFileChunk: (senderId, chunkPayload) => {
          try {
            const chunkBuffer = base64ToArrayBuffer(chunkPayload.data);
            this.handleIncomingChunkData(chunkPayload.fileId, chunkPayload.chunkIndex, chunkBuffer);
          } catch (e) {
            console.error('Error decoding relay file chunk:', e);
          }
        },
        onFileCancel: (senderId, fileId, reason) => {
          this.handleIncomingFileCancel(fileId, reason);
        }
      }
    );
  }

  private handlePeerJoined(remotePeerId: string, remoteDisplayName: string) {
    if (remotePeerId === this.peerId) return;

    let peer = this.peers.get(remotePeerId);
    if (!peer) {
      peer = {
        peerId: remotePeerId,
        displayName: remoteDisplayName,
        connected: false,
        channelReady: false,
        joinedAt: Date.now()
      };
      this.peers.set(remotePeerId, peer);
      this.notifyPeersChanged();
      this.callbacks.onPeerJoin(peer);
    } else {
      peer.displayName = remoteDisplayName;
      this.notifyPeersChanged();
    }

    // Deterministic Initiator: Peer with smaller peerId initiates the WebRTC offer
    const isInitiator = this.peerId < remotePeerId;
    if (isInitiator) {
      this.createPeerConnection(remotePeerId, true);
    }
  }

  private handlePeerLeft(remotePeerId: string) {
    const pc = this.peerConnections.get(remotePeerId);
    if (pc) {
      try { pc.close(); } catch {}
      this.peerConnections.delete(remotePeerId);
    }
    const dc = this.dataChannels.get(remotePeerId);
    if (dc) {
      try { dc.close(); } catch {}
      this.dataChannels.delete(remotePeerId);
    }
    this.iceCandidatesQueue.delete(remotePeerId);
    this.peers.delete(remotePeerId);
    this.notifyPeersChanged();
    this.callbacks.onPeerLeave(remotePeerId);
  }

  private createPeerConnection(remotePeerId: string, isInitiator: boolean): RTCPeerConnection {
    // If existing connection already open, reuse or clean up
    let pc = this.peerConnections.get(remotePeerId);
    if (pc && pc.signalingState !== 'closed') {
      if (!isInitiator) return pc;
    }

    if (pc) {
      try { pc.close(); } catch {}
    }

    pc = new RTCPeerConnection(RTC_CONFIG);
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
      const state = pc?.connectionState;
      const peer = this.peers.get(remotePeerId);
      if (peer) {
        peer.connected = state === 'connected';
        this.notifyPeersChanged();
      }
    };

    if (isInitiator) {
      // Create DataChannel with high reliability
      try {
        const dc = pc.createDataChannel('dzt-drop-channel', {
          ordered: true
        });
        this.setupDataChannel(remotePeerId, dc);
      } catch (err) {
        console.error('Error creating RTCDataChannel:', err);
      }

      // Create and send Offer
      pc.createOffer()
        .then((offer) => pc?.setLocalDescription(offer))
        .then(() => {
          if (pc?.localDescription && this.signalingClient) {
            this.signalingClient.sendSignal(remotePeerId, {
              type: 'offer',
              sdp: pc.localDescription
            });
          }
        })
        .catch((err) => {
          console.error('Error creating WebRTC offer:', err);
        });
    } else {
      // Answering peer: listen for DataChannel from initiator
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

    const markReady = () => {
      const peer = this.peers.get(remotePeerId);
      if (peer) {
        peer.channelReady = true;
        peer.connected = true;
        peer.transport = 'webrtc-datachannel';
        this.notifyPeersChanged();
      }
      playP2PSound('connect');
    };

    if (dc.readyState === 'open') {
      markReady();
    } else {
      dc.onopen = markReady;
    }

    dc.onclose = () => {
      const peer = this.peers.get(remotePeerId);
      if (peer) {
        peer.channelReady = false;
        this.notifyPeersChanged();
      }
    };

    dc.onerror = (err) => {
      console.warn(`DataChannel warning with peer ${remotePeerId}:`, err);
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
        
        // Drain queued ICE candidates
        const queued = this.iceCandidatesQueue.get(senderId);
        if (queued && queued.length > 0) {
          for (const cand of queued) {
            try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch {}
          }
          this.iceCandidatesQueue.delete(senderId);
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (this.signalingClient && pc.localDescription) {
          this.signalingClient.sendSignal(senderId, {
            type: 'answer',
            sdp: pc.localDescription
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

          // Drain queued ICE candidates
          const queued = this.iceCandidatesQueue.get(senderId);
          if (queued && queued.length > 0) {
            for (const cand of queued) {
              try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch {}
            }
            this.iceCandidatesQueue.delete(senderId);
          }
        } catch (err) {
          console.error('Error setting RTC answer:', err);
        }
      }
    } else if (signalData.type === 'ice-candidate') {
      const pc = this.peerConnections.get(senderId);
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      } else {
        // Queue until remote description is set
        if (!this.iceCandidatesQueue.has(senderId)) {
          this.iceCandidatesQueue.set(senderId, []);
        }
        this.iceCandidatesQueue.get(senderId)!.push(signalData.candidate);
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
        console.error('Error parsing DataChannel payload:', err);
      }
    } else if (rawData instanceof ArrayBuffer) {
      this.handleIncomingBinaryPacket(rawData);
    }
  }

  // Binary Packet Header:
  // Bytes 0..31: 32-char ASCII fileId
  // Bytes 32..35: 4-byte Uint32 chunkIndex (big-endian)
  // Bytes 36..end: binary chunk payload
  private handleIncomingBinaryPacket(buffer: ArrayBuffer) {
    if (buffer.byteLength < FILE_HEADER_BYTES) return;

    const idBytes = new Uint8Array(buffer, 0, 32);
    const fileId = new TextDecoder('ascii').decode(idBytes).trim();
    const view = new DataView(buffer, 32, 4);
    const chunkIndex = view.getUint32(0, false);
    const chunkData = buffer.slice(FILE_HEADER_BYTES);

    this.handleIncomingChunkData(fileId, chunkIndex, chunkData);
  }

  private handleIncomingFileHeader(rawMeta: any) {
    if (!rawMeta || !rawMeta.id) return;
    const cleanId = String(rawMeta.id).trim();

    const meta: TransferMeta = {
      id: cleanId,
      name: rawMeta.name || 'unnamed_file',
      size: Number(rawMeta.size) || 0,
      type: rawMeta.type || 'application/octet-stream',
      lastModified: rawMeta.lastModified,
      totalChunks: Number(rawMeta.totalChunks) || 1,
      senderId: rawMeta.senderId || 'unknown',
      senderName: rawMeta.senderName || 'Remote Peer',
      timestamp: rawMeta.timestamp || Date.now()
    };

    this.receivingFiles.set(cleanId, {
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
      id: cleanId,
      meta,
      direction: 'receive',
      progress: 0,
      bytesTransferred: 0,
      speed: 0,
      eta: 0,
      status: 'transferring'
    });
  }

  private handleIncomingChunkData(fileId: string, chunkIndex: number, chunkData: ArrayBuffer) {
    const cleanId = fileId.trim();
    const state = this.receivingFiles.get(cleanId);
    if (!state) return;

    if (!state.chunks[chunkIndex]) {
      state.chunks[chunkIndex] = chunkData;
      state.receivedChunks += 1;
      state.receivedBytes += chunkData.byteLength;
    }

    const now = Date.now();
    const elapsed = (now - state.lastSpeedCalcTime) / 1000;
    if (elapsed >= 0.25) {
      const bytesDelta = state.receivedBytes - state.lastSpeedCalcBytes;
      state.currentSpeed = bytesDelta / elapsed;
      state.lastSpeedCalcTime = now;
      state.lastSpeedCalcBytes = state.receivedBytes;
    }

    const progress = Math.min(100, Math.round((state.receivedBytes / Math.max(1, state.meta.size)) * 100));
    const remainingBytes = Math.max(0, state.meta.size - state.receivedBytes);
    const eta = state.currentSpeed > 0 ? Math.ceil(remainingBytes / state.currentSpeed) : 0;

    const progressObj: TransferProgress = {
      id: cleanId,
      meta: state.meta,
      direction: 'receive',
      progress,
      bytesTransferred: state.receivedBytes,
      speed: state.currentSpeed,
      eta,
      status: 'transferring'
    };

    this.callbacks.onTransferProgress(progressObj);

    // Check if all chunks received
    if (state.receivedChunks >= state.totalChunks || state.receivedBytes >= state.meta.size) {
      const completeChunks = state.chunks.filter((c): c is ArrayBuffer => c !== null);
      const mimeType = state.meta.type || 'application/octet-stream';
      const blob = new Blob(completeChunks, { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);

      const completeObj: TransferProgress = {
        id: cleanId,
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

      this.receivingFiles.delete(cleanId);
      playP2PSound('receive_complete');
      this.callbacks.onTransferComplete(completeObj);
    }
  }

  private handleIncomingFileCancel(fileId: string, reason?: string) {
    const cleanId = fileId.trim();
    const state = this.receivingFiles.get(cleanId);
    if (state) {
      this.receivingFiles.delete(cleanId);
      this.callbacks.onTransferError(cleanId, reason || 'Remote sender cancelled transfer');
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
        try {
          dc.send(payload);
          sentViaChannel = true;
        } catch {}
      }
    });

    // Fallback broadcast through signaling
    if (!sentViaChannel && this.signalingClient) {
      this.signalingClient.sendChat(msg.text);
    }

    playP2PSound('message');
    return msg;
  }

  public async sendFile(file: File, targetPeerId?: string): Promise<string> {
    const fileId = generateFileId();
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

    // Step 1: Send Header (over DataChannel and/or Signaling Relay)
    const headerPayload = JSON.stringify({
      type: 'file-header',
      meta
    });

    if (channelsToSend.length > 0) {
      channelsToSend.forEach((dc) => {
        try { dc.send(headerPayload); } catch {}
      });
    } else if (this.signalingClient) {
      // Stream via Signaling Relay
      this.signalingClient.sendFileHeader(meta, targetPeerId);
    }

    // Step 2: Stream binary chunks
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

    this.streamFileChunks(file, meta, channelsToSend, targetPeerId).catch((err) => {
      console.error('Error streaming file chunks:', err);
      playP2PSound('error');
      this.callbacks.onTransferError(fileId, err.message || 'Transfer failed');
    });

    return fileId;
  }

  private async streamFileChunks(
    file: File, 
    meta: TransferMeta, 
    channels: RTCDataChannel[],
    targetPeerId?: string
  ) {
    const fileId = meta.id;
    let offset = 0;
    let chunkIndex = 0;
    let lastSpeedCalcTime = Date.now();
    let lastSpeedCalcBytes = 0;
    let currentSpeed = 0;

    const idEncoder = new TextEncoder();
    const idBytes = idEncoder.encode(fileId.padEnd(32, ' ').slice(0, 32));

    const useSignalingRelay = channels.length === 0;

    while (offset < file.size) {
      const uploadState = this.activeUploads.get(fileId);
      if (uploadState?.isCancelled || this.isClosed) {
        const cancelMsg = JSON.stringify({ type: 'file-cancel', fileId, reason: 'Sender cancelled' });
        channels.forEach((dc) => {
          if (dc.readyState === 'open') dc.send(cancelMsg);
        });
        if (useSignalingRelay && this.signalingClient) {
          this.signalingClient.sendFileCancel(fileId, 'Sender cancelled', targetPeerId);
        }
        return;
      }

      // Check backpressure if using DataChannels
      for (const dc of channels) {
        if (dc.bufferedAmount > BUFFER_THRESHOLD) {
          await new Promise<void>((resolve) => {
            const onLow = () => {
              dc.removeEventListener('bufferedamountlow', onLow);
              resolve();
            };
            dc.addEventListener('bufferedamountlow', onLow);
            setTimeout(resolve, 60);
          });
        }
      }

      const chunkSlice = file.slice(offset, offset + CHUNK_SIZE);
      const chunkBuffer = await chunkSlice.arrayBuffer();

      if (channels.length > 0) {
        // Direct WebRTC DataChannel Binary Packet
        // [32 bytes ASCII ID] + [4 bytes Uint32 Index] + [Data]
        const packet = new Uint8Array(FILE_HEADER_BYTES + chunkBuffer.byteLength);
        packet.set(idBytes, 0);
        const view = new DataView(packet.buffer, 32, 4);
        view.setUint32(0, chunkIndex, false); // Big-endian
        packet.set(new Uint8Array(chunkBuffer), FILE_HEADER_BYTES);

        for (const dc of channels) {
          if (dc.readyState === 'open') {
            try { dc.send(packet.buffer); } catch {}
          }
        }
      } else if (this.signalingClient) {
        // Signaling Relay Fallback
        const base64Data = arrayBufferToBase64(chunkBuffer);
        this.signalingClient.sendFileChunk({
          fileId,
          chunkIndex,
          data: base64Data,
          totalChunks: meta.totalChunks,
          bytes: chunkBuffer.byteLength
        }, targetPeerId);
      }

      offset += chunkBuffer.byteLength;
      chunkIndex++;

      const now = Date.now();
      const elapsed = (now - lastSpeedCalcTime) / 1000;
      if (elapsed >= 0.25) {
        const bytesDelta = offset - lastSpeedCalcBytes;
        currentSpeed = bytesDelta / elapsed;
        lastSpeedCalcTime = now;
        lastSpeedCalcBytes = offset;
      }

      const progress = Math.min(100, Math.round((offset / Math.max(1, file.size)) * 100));
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

      // Yield event loop every 3 chunks
      if (chunkIndex % 3 === 0) {
        await new Promise((r) => setTimeout(r, 4));
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
    const cleanId = fileId.trim();
    const upload = this.activeUploads.get(cleanId);
    if (upload) {
      upload.isCancelled = true;
      this.activeUploads.delete(cleanId);
    }
    const receiving = this.receivingFiles.get(cleanId);
    if (receiving) {
      this.receivingFiles.delete(cleanId);
    }
  }

  private notifyPeersChanged() {
    this.callbacks.onPeerStatusChange(this.getPeers());
  }

  public close() {
    this.isClosed = true;
    this.activeUploads.clear();
    this.receivingFiles.clear();

    this.dataChannels.forEach((dc) => {
      try { dc.close(); } catch {}
    });
    this.dataChannels.clear();

    this.peerConnections.forEach((pc) => {
      try { pc.close(); } catch {}
    });
    this.peerConnections.clear();
    this.iceCandidatesQueue.clear();

    if (this.signalingClient) {
      this.signalingClient.close();
      this.signalingClient = null;
    }
  }
}
