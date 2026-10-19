import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Share2,
  HardDriveDownload,
  UploadCloud,
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  ShieldCheck,
  QrCode,
  Copy,
  Check,
  X,
  Users,
  RefreshCw,
  Trash2,
  Download,
  MessageSquare,
  Send,
  Eye,
  Sliders,
  Radio,
  ArrowRight,
  Info,
  Smartphone,
  Laptop
} from 'lucide-react';
import {
  P2PFileManager,
  TransferMeta,
  TransferProgress,
  P2PTextMessage,
  P2PPeerState,
  playP2PSound
} from '../../utils/p2pFileTransfer';
import { generatePeerId } from '../../utils/webrtc';
import QRCodeDisplay from '../QRCodeDisplay';

interface FileShareRoomProps {
  initialRoomId?: string;
  onExit?: () => void;
}

interface QueuedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
}

export default function FileShareRoom({ initialRoomId, onExit }: FileShareRoomProps) {
  // Room identity
  const [roomId, setRoomId] = useState<string>(() => {
    if (initialRoomId) return initialRoomId.trim().toLowerCase();
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const room = searchParams.get('room');
      if (room) return room.trim().toLowerCase();
    }
    return `dzt-drop-${Math.floor(100 + Math.random() * 900)}`;
  });

  const [peerId] = useState<string>(() => generatePeerId());
  const [displayName, setDisplayName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dzt_drop_username') || `Device-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    return `Device-${Math.floor(1000 + Math.random() * 9000)}`;
  });

  // State
  const [isJoined, setIsJoined] = useState(true);
  const [signalingState, setSignalingState] = useState<'connecting' | 'connected' | 'error' | 'closed'>('connecting');
  const [peers, setPeers] = useState<P2PPeerState[]>([]);
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [activeTransfers, setActiveTransfers] = useState<Map<string, TransferProgress>>(new Map());
  const [completedTransfers, setCompletedTransfers] = useState<TransferProgress[]>([]);
  const [textMessages, setTextMessages] = useState<P2PTextMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  
  // Settings & Toggles
  const [autoDownload, setAutoDownload] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dzt_auto_download') !== 'false';
    }
    return true;
  });
  const [autoSendOnDrop, setAutoSendOnDrop] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dzt_auto_send_on_drop') !== 'false';
    }
    return true;
  });
  const [selectedTargetPeer, setSelectedTargetPeer] = useState<string>('all');
  const [showSwitchRoomModal, setShowSwitchRoomModal] = useState(false);
  const [customRoomInput, setCustomRoomInput] = useState('');

  // UI states
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<TransferProgress | null>(null);
  const [recentReceivedToast, setRecentReceivedToast] = useState<TransferProgress | null>(null);

  // Stats
  const [totalBytesSent, setTotalBytesSent] = useState(0);
  const [totalBytesReceived, setTotalBytesReceived] = useState(0);

  const fileManagerRef = useRef<P2PFileManager | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const autoDownloadRef = useRef(autoDownload);
  const autoSendOnDropRef = useRef(autoSendOnDrop);
  const queuedFilesRef = useRef(queuedFiles);
  const peersRef = useRef(peers);

  useEffect(() => {
    autoDownloadRef.current = autoDownload;
    if (typeof window !== 'undefined') {
      localStorage.setItem('dzt_auto_download', autoDownload ? 'true' : 'false');
    }
  }, [autoDownload]);

  useEffect(() => {
    autoSendOnDropRef.current = autoSendOnDrop;
    if (typeof window !== 'undefined') {
      localStorage.setItem('dzt_auto_send_on_drop', autoSendOnDrop ? 'true' : 'false');
    }
  }, [autoSendOnDrop]);

  useEffect(() => {
    queuedFilesRef.current = queuedFiles;
  }, [queuedFiles]);

  useEffect(() => {
    peersRef.current = peers;
  }, [peers]);

  // Helper to trigger browser download
  const triggerFileDownload = (transfer: TransferProgress) => {
    if (!transfer.blobUrl) return;
    try {
      const a = document.createElement('a');
      a.href = transfer.blobUrl;
      a.download = transfer.meta.name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try {
          document.body.removeChild(a);
        } catch {}
      }, 200);
    } catch (err) {
      console.error('Error triggering download:', err);
    }
  };

  // Initialize P2P File Manager upon joining
  const handleJoin = () => {
    if (!roomId.trim()) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem('dzt_drop_username', displayName);
    }
    setIsJoined(true);
  };

  useEffect(() => {
    if (!isJoined) return;

    const manager = new P2PFileManager(roomId, peerId, displayName, {
      onPeerJoin: (newPeer) => {
        setPeers((prev) => {
          const filtered = prev.filter((p) => p.peerId !== newPeer.peerId);
          return [...filtered, newPeer];
        });

        // Auto-stream queued files if any
        if (autoSendOnDropRef.current && queuedFilesRef.current.length > 0 && fileManagerRef.current) {
          const toSend = [...queuedFilesRef.current];
          setQueuedFiles([]);
          setTimeout(async () => {
            for (const item of toSend) {
              try {
                await fileManagerRef.current?.sendFile(item.file, newPeer.peerId);
              } catch (e) {
                console.error('Error auto-sending to new peer:', e);
              }
            }
          }, 300);
        }
      },
      onPeerLeave: (leftPeerId) => {
        setPeers((prev) => prev.filter((p) => p.peerId !== leftPeerId));
      },
      onPeerStatusChange: (updatedPeers: P2PPeerState[]) => {
        setPeers([...updatedPeers]);
      },
      onTransferProgress: (transfer: TransferProgress) => {
        setActiveTransfers((prev) => {
          const map = new Map<string, TransferProgress>(prev);
          map.set(transfer.id, transfer);
          return map;
        });
      },
      onTransferComplete: (transfer: TransferProgress) => {
        setActiveTransfers((prev) => {
          const map = new Map<string, TransferProgress>(prev);
          map.delete(transfer.id);
          return map;
        });
        setCompletedTransfers((prev) => [transfer, ...prev]);

        if (transfer.direction === 'send') {
          setTotalBytesSent((b) => b + transfer.meta.size);
        } else {
          setTotalBytesReceived((b) => b + transfer.meta.size);
          setRecentReceivedToast(transfer);

          // If auto-download is enabled, immediately trigger download
          if (autoDownloadRef.current && transfer.blobUrl) {
            triggerFileDownload(transfer);
          }
        }
      },
      onTransferError: (transferId: string, errorMsg: string) => {
        setActiveTransfers((prev) => {
          const map = new Map<string, TransferProgress>(prev);
          const t = map.get(transferId);
          if (t) {
            map.set(transferId, { ...t, status: 'error', error: errorMsg });
          }
          return map;
        });
      },
      onTextMessage: (msg) => {
        setTextMessages((prev) => [...prev, msg]);
      },
      onSignalingState: (state) => {
        setSignalingState(state);
      }
    });

    fileManagerRef.current = manager;

    return () => {
      manager.close();
      fileManagerRef.current = null;
    };
  }, [isJoined, roomId, peerId, displayName]);

  // Handle Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const addFilesToQueue = async (files: File[]) => {
    if (autoSendOnDropRef.current && peersRef.current.length > 0 && fileManagerRef.current) {
      const target = selectedTargetPeer !== 'all' ? selectedTargetPeer : undefined;
      for (const file of files) {
        try {
          await fileManagerRef.current.sendFile(file, target);
        } catch (err) {
          console.error('Failed to auto-stream file:', err);
        }
      }
      return;
    }

    const newItems: QueuedFile[] = files.map((file) => ({
      id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type
    }));
    setQueuedFiles((prev) => [...prev, ...newItems]);
  };

  const removeQueuedFile = (id: string) => {
    setQueuedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearQueue = () => {
    setQueuedFiles([]);
  };

  // Send queued files
  const handleSendQueuedFiles = async (targetPeerId?: string) => {
    if (!fileManagerRef.current || queuedFiles.length === 0) return;

    const filesToSend = [...queuedFiles];
    clearQueue();

    const target = targetPeerId || (selectedTargetPeer !== 'all' ? selectedTargetPeer : undefined);

    for (const item of filesToSend) {
      try {
        await fileManagerRef.current.sendFile(item.file, target);
      } catch (err: any) {
        console.error('Failed to send file:', err);
      }
    }
  };

  const handleSendSingleFile = async (item: QueuedFile, targetPeerId?: string) => {
    if (!fileManagerRef.current) return;
    removeQueuedFile(item.id);
    const target = targetPeerId || (selectedTargetPeer !== 'all' ? selectedTargetPeer : undefined);
    try {
      await fileManagerRef.current.sendFile(item.file, target);
    } catch (err: any) {
      console.error('Failed to send single file:', err);
    }
  };

  const handleCancelTransfer = (transferId: string) => {
    if (fileManagerRef.current) {
      fileManagerRef.current.cancelTransfer(transferId);
    }
    setActiveTransfers((prev) => {
      const map = new Map(prev);
      map.delete(transferId);
      return map;
    });
  };

  // Send text / note
  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim() || !fileManagerRef.current) return;

    const msg = fileManagerRef.current.sendTextMessage(textInput);
    if (msg) {
      setTextMessages((prev) => [...prev, msg]);
      setTextInput('');
    }
  };

  const handleCopyLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/apps?app=drop&room=${encodeURIComponent(roomId)}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    });
  };

  const handleCopyNote = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedTextId(id);
      setTimeout(() => setCopiedTextId(null), 2000);
    });
  };

  // Download all completed received files
  const handleDownloadAllReceived = () => {
    const received = completedTransfers.filter((t) => t.direction === 'receive' && t.blobUrl);
    received.forEach((t) => {
      triggerFileDownload(t);
    });
  };

  // Formatters
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatSpeed = (bytesPerSec: number) => {
    if (bytesPerSec <= 0) return '0 KB/s';
    if (bytesPerSec < 1024 * 1024) {
      return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
    }
    return `${(bytesPerSec / (1024 * 1024)).toFixed(2)} MB/s`;
  };

  const formatEta = (seconds: number) => {
    if (seconds <= 0) return '0s';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const rem = seconds % 60;
    return `${mins}m ${rem}s`;
  };

  const getFileIcon = (mimeType: string, filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      return FileImage;
    }
    if (mimeType.startsWith('video/') || ['mp4', 'mkv', 'webm', 'mov'].includes(ext)) {
      return FileVideo;
    }
    if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) {
      return FileAudio;
    }
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
      return FileArchive;
    }
    if (['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'c', 'cpp', 'html', 'css', 'json', 'sql'].includes(ext)) {
      return FileCode;
    }
    if (mimeType.includes('pdf') || ['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext)) {
      return FileText;
    }
    return File;
  };

  // Connected peers
  const readyPeers = peers.filter((p) => p.channelReady || p.connected);

  // Lobby Screen before entering room
  if (!isJoined) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          {onExit && (
            <button
              onClick={onExit}
              className="text-xs font-mono text-white/50 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>← Back to MiniApps</span>
            </button>
          )}
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
            WebRTC DataChannel • Zero-Server Storage
          </span>
        </div>

        {/* Hero Card */}
        <div className="bg-[#0c0c0c] border border-white/10 rounded-sm p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xs bg-white/5 border border-white/15 flex items-center justify-center text-cyan-400">
              <Share2 className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-tight font-mono flex items-center gap-2">
                DZt Drop (P2P File Transfer)
              </h1>
              <p className="text-xs sm:text-sm text-white/50">
                Direct browser-to-browser encrypted file sharing with instant chunk streaming, auto-download, and zero size limits.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Room ID input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-white/70 uppercase tracking-wider block">
                Transfer Room ID / Pairing Key
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                  placeholder="e.g. dzt-drop-101"
                  className="flex-1 bg-black/60 border border-white/15 rounded-xs px-3.5 py-2.5 text-xs font-mono text-white placeholder-white/30 focus:outline-hidden focus:border-cyan-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setRoomId(`dzt-drop-${Math.floor(100 + Math.random() * 900)}`)}
                  className="px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-mono rounded-xs transition-colors cursor-pointer"
                  title="Generate New Room ID"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Display name input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-white/70 uppercase tracking-wider block">
                Your Device / Sender Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. MacBook Pro / Phone"
                className="w-full bg-black/60 border border-white/15 rounded-xs px-3.5 py-2.5 text-xs font-mono text-white placeholder-white/30 focus:outline-hidden focus:border-cyan-400 transition-colors"
              />
            </div>
          </div>

          {/* Key Advantages Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-black/40 border border-white/5 p-3 rounded-xs space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-mono font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>End-to-End Encrypted</span>
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed">
                Files are transferred directly over DTLS/SCTP WebRTC channels with zero intermediate cloud storage.
              </p>
            </div>

            <div className="bg-black/40 border border-white/5 p-3 rounded-xs space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono font-bold">
                <Zap className="w-4 h-4" />
                <span>Wire-Speed & No Limits</span>
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed">
                Share full resolution 4K videos, raw archives, or codebases without size compression or bandwidth caps.
              </p>
            </div>

            <div className="bg-black/40 border border-white/5 p-3 rounded-xs space-y-1">
              <div className="flex items-center gap-1.5 text-purple-400 text-xs font-mono font-bold">
                <QrCode className="w-4 h-4" />
                <span>Cross-Device Pairing</span>
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed">
                Pair iOS, Android, macOS, Linux, and Windows seamlessly via instant QR code or room link.
              </p>
            </div>
          </div>

          {/* Enter Action */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10">
            <div className="text-xs text-white/40 font-mono">
              Ready to pair as: <span className="text-white font-bold">{displayName}</span>
            </div>
            <button
              onClick={handleJoin}
              disabled={!roomId.trim()}
              className="w-full sm:w-auto px-8 py-3 bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.25)] disabled:opacity-40"
            >
              <span>Enter Drop Room</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active P2P Transfer Room View
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a0a0a] border border-white/10 p-4 rounded-xs">
        <div className="flex items-center gap-3">
          {onExit && (
            <button
              onClick={onExit}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-xs transition-colors cursor-pointer"
              title="Back to MiniApps"
            >
              ←
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${signalingState === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <h2 className="text-sm font-bold font-mono text-white uppercase tracking-tight">
                DZt Drop Room: <span className="text-cyan-400">{roomId}</span>
              </h2>
            </div>
            <p className="text-[11px] text-white/50 font-mono">
              Signed in as: <strong className="text-white/80">{displayName}</strong> • {peers.length} Peer(s) Connected ({readyPeers.length} active)
            </p>
          </div>
        </div>

        {/* Quick Tools & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Instant Stream toggle */}
          <button
            onClick={() => setAutoSendOnDrop(!autoSendOnDrop)}
            className={`px-3 py-1.5 border text-xs font-mono rounded-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
              autoSendOnDrop
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
            }`}
            title="Instantly stream files upon selection or drop"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Instant Stream: {autoSendOnDrop ? 'ON' : 'OFF'}</span>
          </button>

          {/* Auto-download toggle */}
          <button
            onClick={() => setAutoDownload(!autoDownload)}
            className={`px-3 py-1.5 border text-xs font-mono rounded-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
              autoDownload
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
            }`}
            title="Automatically save received files to device"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Auto-Save: {autoDownload ? 'ON' : 'OFF'}</span>
          </button>

          {/* Copy Link Button */}
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-mono rounded-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied' : 'Share Link'}</span>
          </button>

          {/* QR Code Button */}
          <button
            onClick={() => setShowQrModal(true)}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-mono rounded-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>QR Code</span>
          </button>

          {/* Switch Room Button */}
          <button
            onClick={() => {
              setCustomRoomInput(roomId);
              setShowSwitchRoomModal(true);
            }}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-mono rounded-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Switch Room</span>
          </button>
        </div>
      </div>

      {/* Live Toast: File Received Alert */}
      <AnimatePresence>
        {recentReceivedToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-950/80 border border-emerald-500/40 p-3.5 rounded-xs flex items-center justify-between gap-3 shadow-xl"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-mono font-bold text-white truncate">
                  File Received: {recentReceivedToast.meta.name}
                </p>
                <p className="text-[10px] font-mono text-emerald-300/70">
                  {formatBytes(recentReceivedToast.meta.size)} • Transferred from {recentReceivedToast.meta.senderName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => triggerFileDownload(recentReceivedToast)}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono font-bold rounded-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save to Device</span>
              </button>
              <button
                onClick={() => setRecentReceivedToast(null)}
                className="p-1 text-white/50 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid: Left Panel (Dropzone & Queue & Transfers) + Right Panel (Peers, Notes & File Cabinet) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Cols: Dropzone & File Queue */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Interactive Drag & Drop Area */}
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xs p-8 sm:p-12 text-center transition-all cursor-pointer select-none overflow-hidden ${
              isDraggingOver
                ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
                : 'border-white/20 hover:border-white/40 bg-[#0c0c0c] hover:bg-[#111111]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
              <motion.div
                animate={isDraggingOver ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
                className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400"
              >
                <UploadCloud className="w-8 h-8" />
              </motion.div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white uppercase tracking-tight font-mono">
                  {isDraggingOver ? 'Release to queue files' : 'Drop files here or click to browse'}
                </p>
                <p className="text-xs text-white/40">
                  Select any file type • Direct chunk stream • End-to-end encrypted P2P
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1 text-[10px] font-mono text-white/50 uppercase">
                <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-2xs">Images</span>
                <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-2xs">Videos</span>
                <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-2xs">PDFs</span>
                <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-2xs">Archives</span>
              </div>
            </div>
          </div>

          {/* Target Peer Selector (If multiple peers) */}
          {peers.length > 1 && (
            <div className="flex items-center justify-between bg-black/40 border border-white/10 p-2.5 rounded-xs text-xs font-mono">
              <span className="text-white/60">Send Destination:</span>
              <select
                value={selectedTargetPeer}
                onChange={(e) => setSelectedTargetPeer(e.target.value)}
                className="bg-black border border-white/20 text-cyan-400 rounded-xs px-2 py-1 text-xs font-mono focus:outline-hidden"
              >
                <option value="all">Broadcast to All Peers ({peers.length})</option>
                {peers.map((p) => (
                  <option key={p.peerId} value={p.peerId}>
                    {p.displayName} ({p.channelReady ? 'Ready' : 'Connected'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Queued Files Box (If files selected) */}
          {queuedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0e0e0e] border border-cyan-500/30 rounded-xs p-4 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Ready to Send ({queuedFiles.length} {queuedFiles.length === 1 ? 'file' : 'files'})
                  </h3>
                </div>
                <button
                  onClick={clearQueue}
                  className="text-[10px] font-mono text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              </div>

              {/* Queue List */}
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {queuedFiles.map((q) => {
                  const Icon = getFileIcon(q.type, q.name);
                  return (
                    <div
                      key={q.id}
                      className="flex items-center justify-between bg-black/50 border border-white/10 p-2.5 rounded-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <Icon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-white font-medium truncate font-mono">{q.name}</p>
                          <p className="text-[10px] text-white/40 font-mono">{formatBytes(q.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleSendSingleFile(q)}
                          disabled={peers.length === 0}
                          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[10px] font-mono rounded-xs transition-colors cursor-pointer disabled:opacity-40"
                        >
                          Send
                        </button>
                        <button
                          onClick={() => removeQueuedFile(q.id)}
                          className="p-1 text-white/40 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Send All Action */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] font-mono text-white/50">
                  Total: {formatBytes(queuedFiles.reduce((acc, f) => acc + f.size, 0))}
                </span>
                <button
                  onClick={() => handleSendQueuedFiles()}
                  disabled={peers.length === 0}
                  className="px-5 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.2)] disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send All to {peers.length} Peer(s)</span>
                </button>
              </div>

              {peers.length === 0 && (
                <p className="text-[10px] font-mono text-amber-400/90 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>Waiting for another device to join before sending. Scan QR or share room link.</span>
                </p>
              )}
            </motion.div>
          )}

          {/* Active Transfers HUD */}
          {activeTransfers.size > 0 && (
            <div className="bg-[#0a0a0a] border border-white/15 rounded-xs p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  Active P2P Transfers ({activeTransfers.size})
                </span>
              </div>

              <div className="space-y-3">
                {Array.from(activeTransfers.values()).map((transfer: TransferProgress) => {
                  const Icon = getFileIcon(transfer.meta.type, transfer.meta.name);
                  const isSending = transfer.direction === 'send';

                  return (
                    <div
                      key={transfer.id}
                      className="bg-black/60 border border-white/10 p-3 rounded-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-white font-mono font-bold truncate">
                              {transfer.meta.name}
                            </p>
                            <p className="text-[10px] font-mono text-white/50">
                              {isSending ? `Sending to peer...` : `Receiving from ${transfer.meta.senderName}...`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCancelTransfer(transfer.id)}
                          className="text-[10px] font-mono text-rose-400 hover:underline cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/10">
                          <motion.div
                            className={`h-full ${isSending ? 'bg-cyan-400' : 'bg-emerald-400'}`}
                            style={{ width: `${transfer.progress}%` }}
                            transition={{ ease: 'easeOut', duration: 0.1 }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-mono text-white/60">
                          <span>{transfer.progress}% • {formatBytes(transfer.bytesTransferred)} / {formatBytes(transfer.meta.size)}</span>
                          <span>{formatSpeed(transfer.speed)} • ETA: {formatEta(transfer.eta)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Received & Completed Files Cabinet */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xs p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <HardDriveDownload className="w-3.5 h-3.5 text-emerald-400" />
                Session File Cabinet ({completedTransfers.length})
              </span>
              {completedTransfers.some((t) => t.direction === 'receive' && t.blobUrl) && (
                <button
                  onClick={handleDownloadAllReceived}
                  className="text-[10px] font-mono text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Download All</span>
                </button>
              )}
            </div>

            {completedTransfers.length === 0 ? (
              <div className="py-8 text-center text-white/30 text-xs font-mono space-y-1">
                <File className="w-6 h-6 mx-auto opacity-40 mb-1" />
                <p>No files transferred yet in this session.</p>
                <p className="text-[10px] text-white/20">Drop files above or have a connected peer send files to you.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                {completedTransfers.map((item) => {
                  const Icon = getFileIcon(item.meta.type, item.meta.name);
                  const isReceived = item.direction === 'receive';

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-black/40 border border-white/10 p-2.5 rounded-xs hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <Icon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-white font-mono font-bold truncate">{item.meta.name}</p>
                          <p className="text-[10px] font-mono text-white/40">
                            {formatBytes(item.meta.size)} • {isReceived ? `Received from ${item.meta.senderName}` : 'Sent'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Preview button */}
                        {item.blobUrl && (
                          <button
                            onClick={() => setPreviewFile(item)}
                            className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-xs text-[10px] font-mono transition-colors cursor-pointer"
                            title="Preview File"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Download link / button */}
                        {item.blobUrl ? (
                          <button
                            onClick={() => triggerFileDownload(item)}
                            className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold rounded-xs transition-colors flex items-center gap-1 cursor-pointer"
                            title="Save file to your device"
                          >
                            <Download className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-2xs">
                            Sent ✓
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right 5 Cols: Connected Peers, Live Clipboard/Notes, Diagnostics */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Connected Peers Matrix */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xs p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                Connected Peers ({peers.length})
              </span>
              <span className="text-[10px] font-mono text-emerald-400">
                {readyPeers.length} Active Channel(s)
              </span>
            </div>

            {peers.length === 0 ? (
              <div className="p-4 bg-black/40 border border-white/5 rounded-xs text-center space-y-2">
                <p className="text-xs text-white/70 font-mono">No other peers currently in this room.</p>
                <p className="text-[11px] text-white/40">
                  Open another browser tab, or scan the QR code on your phone to connect!
                </p>
                <div className="flex justify-center gap-2 pt-1">
                  <button
                    onClick={() => setShowQrModal(true)}
                    className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-mono rounded-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <QrCode className="w-3 h-3" />
                    <span>Show QR Code</span>
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-mono rounded-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Room URL</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {peers.map((peer) => (
                  <div
                    key={peer.peerId}
                    className="flex items-center justify-between bg-black/50 border border-white/10 p-2.5 rounded-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${peer.channelReady ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`} />
                      <div>
                        <p className="text-xs text-white font-mono font-bold">{peer.displayName}</p>
                        <p className="text-[9px] font-mono text-white/40">
                          {peer.channelReady ? 'P2P Direct • WebRTC Ready' : 'Connected via Relay'}
                        </p>
                      </div>
                    </div>
                    {queuedFiles.length > 0 && (
                      <button
                        onClick={() => handleSendQueuedFiles(peer.peerId)}
                        className="px-2 py-1 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 text-[10px] font-mono rounded-xs cursor-pointer"
                      >
                        Send Queue
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instant P2P Clipboard / Text Notes */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xs p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                P2P Clipboard & Notes
              </span>
              <span className="text-[10px] font-mono text-white/40">
                Direct text sharing
              </span>
            </div>

            {/* Note Messages Stream */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {textMessages.length === 0 ? (
                <p className="text-center py-4 text-[11px] font-mono text-white/30">
                  Send code snippets, links, or notes directly between paired devices.
                </p>
              ) : (
                textMessages.map((msg) => {
                  const isMine = msg.senderId === peerId;
                  return (
                    <div
                      key={msg.id}
                      className={`p-2 rounded-xs border text-xs font-mono ${
                        isMine
                          ? 'bg-cyan-500/5 border-cyan-500/20 ml-4'
                          : 'bg-white/5 border-white/10 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[9px] text-white/40 pb-1 mb-1 border-b border-white/5">
                        <span className="font-bold text-white/70">{msg.senderName}</span>
                        <div className="flex items-center gap-1.5">
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <button
                            onClick={() => handleCopyNote(msg.id, msg.text)}
                            className="hover:text-white cursor-pointer"
                            title="Copy to clipboard"
                          >
                            {copiedTextId === msg.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                      <p className="text-white/90 break-words whitespace-pre-wrap select-all font-sans text-xs">
                        {msg.text}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Note Input */}
            <form onSubmit={handleSendText} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type note, link, or code..."
                className="flex-1 bg-black/60 border border-white/15 rounded-xs px-3 py-2 text-xs font-mono text-white placeholder-white/30 focus:outline-hidden focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={!textInput.trim()}
                className="p-2 bg-white text-black rounded-xs hover:bg-white/90 transition-colors disabled:opacity-40 cursor-pointer"
                title="Send Note"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Transfer Telemetry & Security Metrics */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xs p-4 space-y-2.5 font-mono text-xs">
            <div className="flex items-center justify-between text-white/70 border-b border-white/10 pb-1.5 text-[11px] uppercase tracking-wider">
              <span>Session Telemetry</span>
              <span className="text-cyan-400">P2P DIRECT MESH</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-black/40 border border-white/5 p-2 rounded-xs">
                <span className="text-white/40 block text-[9px] uppercase">Data Sent</span>
                <span className="text-white font-bold">{formatBytes(totalBytesSent)}</span>
              </div>
              <div className="bg-black/40 border border-white/5 p-2 rounded-xs">
                <span className="text-white/40 block text-[9px] uppercase">Data Received</span>
                <span className="text-white font-bold">{formatBytes(totalBytesReceived)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-white/40 pt-1">
              <span>Protocol: WebRTC DataChannel / DTLS</span>
              <span className="text-emerald-400">Direct Browser-to-Browser</span>
            </div>
          </div>

        </div>

      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQrModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0e0e0e] border border-white/20 max-w-sm w-full p-6 rounded-xs space-y-4 text-center shadow-2xl relative"
            >
              <button
                onClick={() => setShowQrModal(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <h3 className="text-base font-bold font-mono text-white uppercase tracking-tight">
                  Scan to Connect Phone
                </h3>
                <p className="text-xs text-white/50">
                  Scan this QR code with your mobile camera to join room <strong className="text-cyan-400">{roomId}</strong>.
                </p>
              </div>

              {/* High-Resolution ISO QR Code */}
              <div className="py-2 flex justify-center">
                <QRCodeDisplay
                  value={
                    typeof window !== 'undefined'
                      ? `${window.location.origin}/apps?app=drop&room=${encodeURIComponent(roomId)}`
                      : `https://dzt-drop/apps?app=drop&room=${roomId}`
                  }
                  size={180}
                  fileName={`dzt-drop-room-${roomId}.png`}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Switch Room Modal */}
      <AnimatePresence>
        {showSwitchRoomModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0e0e0e] border border-white/20 max-w-sm w-full p-6 rounded-xs space-y-4 shadow-2xl relative font-mono"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <h3 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-amber-400" />
                  <span>Switch Drop Room</span>
                </h3>
                <button
                  onClick={() => setShowSwitchRoomModal(false)}
                  className="text-white/50 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] text-white/70 uppercase tracking-wider block">
                  Enter Room ID or Pairing Key
                </label>
                <input
                  type="text"
                  value={customRoomInput}
                  onChange={(e) => setCustomRoomInput(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                  placeholder="e.g. dzt-drop-456"
                  className="w-full bg-black border border-white/20 rounded-xs px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-hidden focus:border-cyan-400"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    setCustomRoomInput(`dzt-drop-${Math.floor(100 + Math.random() * 900)}`);
                  }}
                  type="button"
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs rounded-xs"
                >
                  Random PIN
                </button>
                <button
                  onClick={() => {
                    if (customRoomInput.trim()) {
                      setRoomId(customRoomInput.trim());
                      setPeers([]);
                      setActiveTransfers(new Map());
                      setShowSwitchRoomModal(false);
                    }
                  }}
                  disabled={!customRoomInput.trim()}
                  className="flex-1 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs uppercase tracking-wider rounded-xs transition-colors disabled:opacity-40"
                >
                  Join Room
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Preview Modal */}
      <AnimatePresence>
        {previewFile && previewFile.blobUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#0e0e0e] border border-white/20 max-w-2xl w-full p-6 rounded-xs space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold font-mono text-white truncate">{previewFile.meta.name}</h3>
                  <p className="text-[11px] font-mono text-white/40">{formatBytes(previewFile.meta.size)} • {previewFile.meta.type}</p>
                </div>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="text-white/50 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Preview Body */}
              <div className="flex-1 overflow-auto flex items-center justify-center p-2 bg-black/60 border border-white/5 rounded-xs min-h-64">
                {previewFile.meta.type.startsWith('image/') ? (
                  <img
                    src={previewFile.blobUrl}
                    alt={previewFile.meta.name}
                    className="max-h-[55vh] object-contain rounded-xs"
                  />
                ) : previewFile.meta.type.startsWith('audio/') ? (
                  <audio controls className="w-full">
                    <source src={previewFile.blobUrl} type={previewFile.meta.type} />
                  </audio>
                ) : previewFile.meta.type.startsWith('video/') ? (
                  <video controls className="max-h-[55vh] max-w-full rounded-xs">
                    <source src={previewFile.blobUrl} type={previewFile.meta.type} />
                  </video>
                ) : (
                  <div className="text-center space-y-2 p-6 font-mono text-xs text-white/60">
                    <File className="w-12 h-12 mx-auto text-white/30" />
                    <p>Inline preview not supported for this format.</p>
                    <p className="text-[11px] text-white/40">You can safely save this file to your device below.</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => triggerFileDownload(previewFile)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download / Save File</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
