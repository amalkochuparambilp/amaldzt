import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  Share2,
  Download,
  RefreshCw,
  Sparkles,
  Users,
  Check,
  Copy,
  ArrowLeft,
  Sliders,
  Radio,
  Zap,
  Clock,
  Trash2,
  ShieldCheck,
  Maximize2,
  Send,
  Image as ImageIcon
} from 'lucide-react';
import { P2PFileManager, P2PPeerState, TransferProgress, playP2PSound } from '../../utils/p2pFileTransfer';
import { generatePeerId } from '../../utils/webrtc';
import QRCodeDisplay from '../QRCodeDisplay';

interface PhotoBoothRoomProps {
  initialRoomId?: string;
  onExit?: () => void;
}

interface BoothPhoto {
  id: string;
  dataUrl: string;
  senderName: string;
  timestamp: string;
  filterName: string;
}

const PHOTO_FILTERS = [
  { id: 'normal', name: 'Normal', css: '' },
  { id: 'noir', name: 'Noir / Mono', css: 'grayscale(100%) contrast(120%)' },
  { id: 'cyber', name: 'Cyberpunk', css: 'contrast(150%) saturate(200%) hue-rotate(290deg)' },
  { id: 'sepia', name: 'Retro Sepia', css: 'sepia(80%) contrast(110%)' },
  { id: 'matrix', name: 'Matrix Green', css: 'grayscale(50%) sepia(100%) hue-rotate(70deg) contrast(140%)' },
  { id: 'dramatic', name: 'High Contrast', css: 'contrast(200%) brightness(90%)' }
];

export default function PhotoBoothRoom({ initialRoomId, onExit }: PhotoBoothRoomProps) {
  const [roomId, setRoomId] = useState<string>(() => {
    if (initialRoomId) return initialRoomId.trim().toLowerCase();
    return `dzt-booth-${Math.floor(100 + Math.random() * 900)}`;
  });
  const [peerId] = useState<string>(() => generatePeerId());
  const [displayName, setDisplayName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dzt_booth_username') || `Photographer-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    return `Photographer-${Math.floor(1000 + Math.random() * 9000)}`;
  });

  const [signalingState, setSignalingState] = useState<'connecting' | 'connected' | 'error' | 'closed'>('connecting');
  const [peers, setPeers] = useState<P2PPeerState[]>([]);
  const [selectedFilter, setSelectedFilter] = useState(PHOTO_FILTERS[0]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [mode, setMode] = useState<'single' | 'strip'>('strip');
  const [customCaption, setCustomCaption] = useState<string>('DZt Live PhotoBooth • 2026');
  
  // Gallery of photos
  const [photos, setPhotos] = useState<BoothPhoto[]>([]);
  const [activePreview, setActivePreview] = useState<BoothPhoto | null>(null);

  // WebRTC P2P manager ref
  const fileManagerRef = useRef<P2PFileManager | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Initialize Webcam
  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
          setCameraError(null);
        }
      } catch (err: any) {
        console.error('Webcam error:', err);
        setCameraError('Unable to access webcam. Please allow camera permissions.');
        setCameraActive(false);
      }
    };
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Initialize P2P Signaling & File Manager
  useEffect(() => {
    const manager = new P2PFileManager(roomId, peerId, displayName, {
      onPeerJoin: (peer) => {
        setPeers(prev => [...prev.filter(p => p.peerId !== peer.peerId), peer]);
        playP2PSound('connect');
      },
      onPeerLeave: (pId) => {
        setPeers(prev => prev.filter(p => p.peerId !== pId));
      },
      onPeerStatusChange: (updatedPeers) => {
        setPeers(updatedPeers);
      },
      onTransferProgress: (_tr) => {},
      onTransferComplete: (tr) => {
        playP2PSound('receive_complete');
        // If received blob is an image, load into booth gallery
        if (tr.blob && tr.meta.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (typeof e.target?.result === 'string') {
              const newPhoto: BoothPhoto = {
                id: `peer-photo-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                dataUrl: e.target.result,
                senderName: tr.meta.senderName || 'Peer',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                filterName: 'Shared'
              };
              setPhotos(p => [newPhoto, ...p]);
            }
          };
          reader.readAsDataURL(tr.blob);
        }
      },
      onTransferError: (_id, err) => {
        console.error('P2P transfer error:', err);
      },
      onTextMessage: (_msg) => {},
      onSignalingState: (st) => {
        setSignalingState(st);
      }
    });

    fileManagerRef.current = manager;

    return () => {
      manager.close();
    };
  }, [roomId, peerId, displayName]);

  // Capture Snapshot / Strip
  const handleTriggerCapture = () => {
    if (!cameraActive || countdown !== null) return;

    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          executeCapture();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const executeCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 250);
    playP2PSound('message');

    const vWidth = video.videoWidth || 1280;
    const vHeight = video.videoHeight || 720;

    if (mode === 'single') {
      canvas.width = vWidth;
      canvas.height = vHeight;
      ctx.filter = selectedFilter.css;
      ctx.drawImage(video, 0, 0, vWidth, vHeight);

      // Draw footer caption
      ctx.filter = 'none';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, vHeight - 70, vWidth, 70);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(customCaption, 30, vHeight - 35);
      ctx.fillStyle = '#00ffff';
      ctx.font = '16px monospace';
      ctx.fillText(`@ ${displayName}`, vWidth - 250, vHeight - 35);

      const dataUrl = canvas.toDataURL('image/png');
      const newPhoto: BoothPhoto = {
        id: `photo-${Date.now()}`,
        dataUrl,
        senderName: displayName,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        filterName: selectedFilter.name
      };

      setPhotos(prev => [newPhoto, ...prev]);
      beamPhotoToPeers(dataUrl, `booth-${Date.now()}.png`);
    } else {
      // 3-Shot Photostrip mode
      const stripWidth = 600;
      const shotHeight = 400;
      const headerHeight = 80;
      const footerHeight = 100;
      const padding = 20;
      const totalHeight = headerHeight + (shotHeight * 3) + (padding * 4) + footerHeight;

      canvas.width = stripWidth;
      canvas.height = totalHeight;

      // Draw dark sleek background
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, stripWidth, totalHeight);

      // Header title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DZt LIVE PHOTOBOOTH', stripWidth / 2, 45);
      ctx.fillStyle = '#00ffff';
      ctx.font = '12px monospace';
      ctx.fillText(new Date().toLocaleDateString(), stripWidth / 2, 65);

      // Take 3 sequential shots with brief intervals
      for (let i = 0; i < 3; i++) {
        // Draw frame background
        const yOffset = headerHeight + padding + (i * (shotHeight + padding));
        ctx.fillStyle = '#161616';
        ctx.fillRect(padding, yOffset, stripWidth - (padding * 2), shotHeight);

        // Draw video frame with filter
        ctx.save();
        ctx.filter = selectedFilter.css;
        ctx.drawImage(video, 0, 0, vWidth, vHeight, padding + 10, yOffset + 10, stripWidth - (padding * 2) - 20, shotHeight - 20);
        ctx.restore();

        // Small delay between shots if we want multi-shot animation
        if (i < 2) {
          await new Promise(r => setTimeout(r, 400));
        }
      }

      // Draw footer caption
      const footerY = totalHeight - footerHeight;
      ctx.fillStyle = '#111111';
      ctx.fillRect(0, footerY, stripWidth, footerHeight);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(customCaption, stripWidth / 2, footerY + 40);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '11px monospace';
      ctx.fillText(`Photographer: ${displayName} • Room: ${roomId}`, stripWidth / 2, footerY + 70);

      const dataUrl = canvas.toDataURL('image/png');
      const newPhoto: BoothPhoto = {
        id: `strip-${Date.now()}`,
        dataUrl,
        senderName: displayName,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        filterName: `${selectedFilter.name} (Strip)`
      };

      setPhotos(prev => [newPhoto, ...prev]);
      beamPhotoToPeers(dataUrl, `photostrip-${Date.now()}.png`);
    }
  };

  // Beam photo to all peers via P2P DataChannel
  const beamPhotoToPeers = async (dataUrl: string, filename: string) => {
    if (!fileManagerRef.current) return;
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: 'image/png' });
      fileManagerRef.current.sendFile(file, 'all');
    } catch (err) {
      console.error('Failed to beam photo to peers:', err);
    }
  };

  const handleDownloadPhoto = (photo: BoothPhoto) => {
    const a = document.createElement('a');
    a.href = photo.dataUrl;
    a.download = `dzt-booth-${photo.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const [copiedLink, setCopiedLink] = useState(false);
  const handleCopyLink = () => {
    const url = `${window.location.origin}/apps?app=photobooth&room=${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto pb-16">
      {/* Top Header & Room Info */}
      <div className="bg-[#0e0e0e] border border-white/15 p-4 sm:p-6 rounded-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onExit && (
            <button
              onClick={onExit}
              className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-mono rounded-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit Booth</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="p-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-xs">
              <Camera className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-base font-bold text-white uppercase tracking-tight font-mono">
                DZt P2P Live PhotoBooth
              </h1>
              <p className="text-[10px] text-white/50 font-mono">Room: <span className="text-cyan-300 font-bold">{roomId}</span></p>
            </div>
          </div>
        </div>

        {/* Peers & Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black/60 border border-white/10 px-3 py-1.5 rounded-xs font-mono text-xs">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-bold">{peers.length + 1} Connected</span>
          </div>
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-mono rounded-xs border border-white/20 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied Room Link' : 'Invite Peers'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Viewport & Camera Live Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#0a0a0a] border border-white/15 p-6 rounded-xs space-y-6 relative overflow-hidden">
            {/* Shutter Flash Overlay */}
            {isFlashing && (
              <div className="absolute inset-0 bg-white z-30 pointer-events-none animate-ping" />
            )}

            {/* Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-30 flex items-center justify-center">
                <span className="text-8xl font-black font-mono text-cyan-400 animate-bounce">
                  {countdown}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono text-white/70 uppercase">Live Camera Feed</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMode('strip')}
                  className={`px-3 py-1 text-xs font-mono rounded-xs border transition-colors cursor-pointer ${
                    mode === 'strip' ? 'bg-white text-black font-bold border-white' : 'bg-white/5 text-white/60 border-white/15'
                  }`}
                >
                  3-Shot Strip
                </button>
                <button
                  onClick={() => setMode('single')}
                  className={`px-3 py-1 text-xs font-mono rounded-xs border transition-colors cursor-pointer ${
                    mode === 'single' ? 'bg-white text-black font-bold border-white' : 'bg-white/5 text-white/60 border-white/15'
                  }`}
                >
                  Single Shot
                </button>
              </div>
            </div>

            {/* Video Element with CSS filter */}
            <div className="relative bg-black rounded-xs overflow-hidden border border-white/20 aspect-video flex items-center justify-center shadow-2xl">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ filter: selectedFilter.css }}
                className="w-full h-full object-cover transform -scale-x-100"
              />
              {!cameraActive && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 font-mono text-xs text-white/50">
                  Initializing Webcam...
                </div>
              )}
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center space-y-2">
                  <span className="text-xs font-mono text-red-400">{cameraError}</span>
                </div>
              )}
            </div>

            {/* Hidden Canvas for capture rendering */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Filters Selector */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">Select Live Filter:</span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PHOTO_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFilter(f)}
                    className={`py-2 px-2 text-[11px] font-mono rounded-xs border transition-colors cursor-pointer truncate ${
                      selectedFilter.id === f.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Caption Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">Photo Strip Footer Caption:</label>
              <input
                type="text"
                value={customCaption}
                onChange={(e) => setCustomCaption(e.target.value)}
                maxLength={45}
                className="w-full bg-black/60 border border-white/20 p-2.5 text-xs font-mono text-white rounded-xs focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Shutter Button */}
            <button
              onClick={handleTriggerCapture}
              disabled={!cameraActive || countdown !== null}
              className="w-full py-4 bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-mono font-bold uppercase tracking-widest rounded-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Camera className="w-4 h-4 fill-current" />
              <span>{countdown !== null ? `Capturing in ${countdown}...` : mode === 'strip' ? 'Take 3-Shot PhotoStrip' : 'Take Snapshot'}</span>
            </button>
          </div>
        </div>

        {/* Right Gallery & Live Peer Stream (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0a0a0a] border border-white/15 p-6 rounded-xs space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span>Room Photo Gallery ({photos.length})</span>
              </h2>
              <span className="text-[10px] font-mono text-cyan-300">P2P Shared</span>
            </div>

            {photos.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <Camera className="w-8 h-8 text-white/20 mx-auto" />
                <p className="text-xs font-mono text-white/40">No photos taken yet in this room.</p>
                <p className="text-[10px] font-mono text-white/30">Snap a photo to beam it instantly to all connected peers!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-[550px] overflow-y-auto pr-1">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => setActivePreview(photo)}
                    className="bg-black border border-white/15 rounded-xs overflow-hidden group cursor-pointer relative space-y-1 hover:border-cyan-400 transition-all"
                  >
                    <div className="aspect-square bg-neutral-900 flex items-center justify-center overflow-hidden">
                      <img
                        src={photo.dataUrl}
                        alt="Booth snapshot"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-2 space-y-0.5">
                      <div className="flex items-center justify-between text-[10px] font-mono text-white/70">
                        <span className="truncate font-bold">{photo.senderName}</span>
                        <span className="text-[9px] text-white/40">{photo.timestamp}</span>
                      </div>
                      <span className="text-[9px] font-mono text-cyan-400 block truncate">{photo.filterName}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Photo Preview Modal */}
      <AnimatePresence>
        {activePreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f0f0f] border border-white/25 p-6 max-w-xl w-full space-y-4 rounded-xs shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase font-mono">Photo Details</h3>
                  <p className="text-[10px] font-mono text-white/50">Captured by {activePreview.senderName} at {activePreview.timestamp}</p>
                </div>
                <button
                  onClick={() => setActivePreview(null)}
                  className="p-1.5 text-white/50 hover:text-white border border-white/10 hover:bg-white/10 cursor-pointer rounded-xs"
                >
                  ✕
                </button>
              </div>

              <div className="bg-black p-2 border border-white/15 flex items-center justify-center max-h-[60vh] overflow-hidden rounded-xs">
                <img
                  src={activePreview.dataUrl}
                  alt="Preview full"
                  referrerPolicy="no-referrer"
                  className="max-h-[55vh] w-auto object-contain"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => handleDownloadPhoto(activePreview)}
                  className="px-5 py-2.5 bg-white text-black text-xs font-mono font-bold uppercase tracking-wider rounded-xs hover:bg-neutral-200 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PNG</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
