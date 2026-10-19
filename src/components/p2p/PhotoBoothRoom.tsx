import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  Download,
  Sparkles,
  Users,
  Check,
  Copy,
  ArrowLeft,
  Image as ImageIcon,
  Upload,
  RotateCcw,
  Video,
  VideoOff,
  Smile,
  Palette,
  AlertCircle
} from 'lucide-react';
import { P2PFileManager, P2PPeerState, playP2PSound } from '../../utils/p2pFileTransfer';
import { generatePeerId } from '../../utils/webrtc';

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

// Offline & CORS-safe vector studio poses
const DEMO_POSES = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    tagline: 'Futuristic Glow',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#090a10"/>
            <stop offset="50%" stop-color="#140f26"/>
            <stop offset="100%" stop-color="#05060a"/>
          </linearGradient>
          <radialGradient id="neonGlow" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stop-color="#00f3ff" stop-opacity="0.3"/>
            <stop offset="60%" stop-color="#ff007a" stop-opacity="0.15"/>
            <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#ff007a"/>
            <stop offset="100%" stop-color="#00f3ff"/>
          </linearGradient>
        </defs>
        <rect width="800" height="600" fill="url(#bg)"/>
        <rect width="800" height="600" fill="url(#neonGlow)"/>
        <!-- Studio Rim Lights -->
        <circle cx="200" cy="180" r="140" fill="#ff007a" opacity="0.1" filter="blur(40px)"/>
        <circle cx="600" cy="200" r="150" fill="#00f3ff" opacity="0.12" filter="blur(40px)"/>
        <!-- Torso & Shoulders -->
        <path d="M220 520 C220 390 320 370 400 370 C480 370 580 390 580 520 L580 600 L220 600 Z" fill="#13151f" stroke="#252a3d" stroke-width="2"/>
        <path d="M340 370 L400 450 L460 370 Z" fill="#1f2333"/>
        <path d="M400 450 L400 600" stroke="#00f3ff" stroke-width="2" stroke-dasharray="6,6" opacity="0.6"/>
        <!-- Neck & Head -->
        <path d="M365 310 L365 380 C365 400 435 400 435 380 L435 310 Z" fill="#2d2638"/>
        <ellipse cx="400" cy="250" rx="95" ry="120" fill="#2b2d3d"/>
        <!-- Stylized Hair -->
        <path d="M295 240 C290 140 360 110 400 110 C460 110 515 150 505 240 C490 150 450 140 400 140 C350 140 310 170 295 240 Z" fill="url(#hairGrad)"/>
        <!-- Cyber Shades -->
        <polygon points="310,230 385,230 375,265 320,265" fill="#050608" stroke="#00f3ff" stroke-width="3"/>
        <polygon points="415,230 490,230 480,265 425,265" fill="#050608" stroke="#00f3ff" stroke-width="3"/>
        <line x1="385" y1="235" x2="415" y2="235" stroke="#ff007a" stroke-width="3"/>
        <!-- Smile -->
        <path d="M375 305 Q400 325 425 305" stroke="#00f3ff" stroke-width="3" fill="none" stroke-linecap="round"/>
        <!-- Studio Label -->
        <text x="400" y="555" fill="#00f3ff" font-family="monospace" font-size="16" font-weight="bold" text-anchor="middle" letter-spacing="4">POSE 01 • CYBERPUNK LIVE</text>
        <text x="400" y="575" fill="#ffffff" opacity="0.4" font-family="monospace" font-size="11" text-anchor="middle">DZt VIRTUAL PHOTOBOOTH ENGINE</text>
      </svg>
    `)}`
  },
  {
    id: 'editorial',
    name: 'Golden Studio',
    tagline: 'Warm Editorial',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <defs>
          <linearGradient id="warmBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#18130e"/>
            <stop offset="50%" stop-color="#221a11"/>
            <stop offset="100%" stop-color="#0d0a06"/>
          </linearGradient>
          <radialGradient id="sunGlow" cx="50%" cy="35%" r="45%">
            <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.25"/>
            <stop offset="70%" stop-color="#d97706" stop-opacity="0.08"/>
            <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="800" height="600" fill="url(#warmBg)"/>
        <rect width="800" height="600" fill="url(#sunGlow)"/>
        <!-- Soft Studio Background Arch -->
        <path d="M260 600 L260 250 A140 140 0 0 1 540 250 L540 600 Z" fill="#2d2215" opacity="0.3"/>
        <!-- Silhouette Subject -->
        <path d="M240 530 C240 410 330 380 400 380 C470 380 560 410 560 530 L560 600 L240 600 Z" fill="#1b150f" stroke="#45341e" stroke-width="2"/>
        <ellipse cx="400" cy="250" rx="90" ry="115" fill="#322416"/>
        <path d="M305 220 C310 130 370 115 400 115 C440 115 490 135 495 220 C480 145 440 135 400 135 C360 135 320 150 305 220 Z" fill="#4d351b"/>
        <!-- Glasses & Warm Highlight -->
        <rect x="330" y="230" width="55" height="35" rx="6" fill="#0f0c08" stroke="#f59e0b" stroke-width="2.5"/>
        <rect x="415" y="230" width="55" height="35" rx="6" fill="#0f0c08" stroke="#f59e0b" stroke-width="2.5"/>
        <line x1="385" y1="245" x2="415" y2="245" stroke="#f59e0b" stroke-width="2.5"/>
        <path d="M370 300 Q400 318 430 300" stroke="#f59e0b" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <text x="400" y="555" fill="#f59e0b" font-family="monospace" font-size="16" font-weight="bold" text-anchor="middle" letter-spacing="4">POSE 02 • GOLDEN HOUR STUDIO</text>
        <text x="400" y="575" fill="#ffffff" opacity="0.4" font-family="monospace" font-size="11" text-anchor="middle">EDITORIAL PORTRAIT FRAME</text>
      </svg>
    `)}`
  },
  {
    id: 'noir',
    name: 'Noir Chic',
    tagline: 'Classic Minimalist',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <defs>
          <linearGradient id="noirBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#121212"/>
            <stop offset="50%" stop-color="#1e1e1e"/>
            <stop offset="100%" stop-color="#0a0a0a"/>
          </linearGradient>
        </defs>
        <rect width="800" height="600" fill="url(#noirBg)"/>
        <!-- Clean Geometry Backdrop -->
        <circle cx="400" cy="260" r="170" fill="#282828" stroke="#ffffff" stroke-width="1" stroke-dasharray="4,8" opacity="0.3"/>
        <path d="M250 530 C250 400 330 380 400 380 C470 380 550 400 550 530 L550 600 L250 600 Z" fill="#080808" stroke="#333333" stroke-width="2"/>
        <ellipse cx="400" cy="250" rx="90" ry="115" fill="#181818" stroke="#444444" stroke-width="1.5"/>
        <path d="M305 210 C310 135 365 115 400 115 C440 115 490 135 495 210 C480 145 440 135 400 135 C360 135 320 150 305 210 Z" fill="#303030"/>
        <!-- Glasses Minimalist -->
        <circle cx="355" cy="245" r="24" fill="#050505" stroke="#ffffff" stroke-width="2"/>
        <circle cx="445" cy="245" r="24" fill="#050505" stroke="#ffffff" stroke-width="2"/>
        <line x1="379" y1="245" x2="421" y2="245" stroke="#ffffff" stroke-width="2"/>
        <path d="M375 305 Q400 320 425 305" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <text x="400" y="555" fill="#ffffff" font-family="monospace" font-size="16" font-weight="bold" text-anchor="middle" letter-spacing="4">POSE 03 • MONOCHROME NOIR</text>
        <text x="400" y="575" fill="#ffffff" opacity="0.4" font-family="monospace" font-size="11" text-anchor="middle">TIMELESS BOOTH APPARATUS</text>
      </svg>
    `)}`
  }
];

export default function PhotoBoothRoom({ initialRoomId, onExit }: PhotoBoothRoomProps) {
  const [roomId] = useState<string>(() => {
    if (initialRoomId) return initialRoomId.trim().toLowerCase();
    return `dzt-booth-${Math.floor(100 + Math.random() * 900)}`;
  });
  const [peerId] = useState<string>(() => generatePeerId());
  const [displayName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dzt_booth_username') || `Photographer-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    return `Photographer-${Math.floor(1000 + Math.random() * 9000)}`;
  });

  const [, setSignalingState] = useState<'connecting' | 'connected' | 'error' | 'closed'>('connecting');
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera & Studio Pose States
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unavailable' | 'idle'>('idle');
  const [cameraNotice, setCameraNotice] = useState<string | null>(null);
  const [selectedDemoIndex, setSelectedDemoIndex] = useState<number>(0);
  const [fallbackImage, setFallbackImage] = useState<string>(DEMO_POSES[0].url);
  const [isUsingDemo, setIsUsingDemo] = useState<boolean>(true);

  // Gracefully stop camera streams
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraLoading(false);
  };

  // Safe camera starter that prevents uncaught permission errors
  const startCamera = async (isUserInitiated = true) => {
    setCameraNotice(null);
    setCameraLoading(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraPermissionStatus('unavailable');
      setCameraNotice('Webcam API is not supported in this browser environment. Virtual Studio Demo mode is active.');
      setCameraLoading(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setCameraActive(true);
        setCameraLoading(false);
        setCameraPermissionStatus('granted');
        setCameraNotice(null);
        setIsUsingDemo(false);
      }
    } catch (err: any) {
      // Cleanly intercept errors without throwing or logging console.error
      stopCamera();
      const isDenied =
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError' ||
        err?.message?.toLowerCase().includes('denied') ||
        err?.message?.toLowerCase().includes('permission');

      setCameraPermissionStatus(isDenied ? 'denied' : 'unavailable');
      setCameraNotice(
        isDenied
          ? 'Webcam permission was not granted by browser settings. Virtual Studio Demo mode is active — you can take photostrips with demo poses or upload your own photos.'
          : 'Camera device is currently unavailable. Using Virtual Studio Demo mode.'
      );

      // Ensure fallback pose is active so booth is immediately usable
      if (!fallbackImage) {
        setFallbackImage(DEMO_POSES[selectedDemoIndex]?.url || DEMO_POSES[0].url);
        setIsUsingDemo(true);
      }
    } finally {
      setCameraLoading(false);
    }
  };

  // On mount, check if camera permission was ALREADY granted; never prompt unexpectedly on mount
  useEffect(() => {
    let isMounted = true;

    const checkInitialPermission = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const res = await navigator.permissions.query({ name: 'camera' as PermissionName });
          if (!isMounted) return;
          if (res.state === 'granted') {
            // Safe to start without prompting since user already allowed it
            startCamera(false);
          } else if (res.state === 'denied') {
            setCameraPermissionStatus('denied');
          } else {
            setCameraPermissionStatus('prompt');
          }
        }
      } catch {
        // Permissions query restricted or not supported in iframe environment; fallback smoothly
      }
    };

    checkInitialPermission();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, []);

  // Handle local file upload
  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          stopCamera();
          setFallbackImage(event.target.result);
          setIsUsingDemo(false);
          setCameraNotice(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Switch to one of the demo poses
  const handleSelectDemoPose = (index: number) => {
    stopCamera();
    setSelectedDemoIndex(index);
    setFallbackImage(DEMO_POSES[index].url);
    setIsUsingDemo(true);
    setCameraNotice(null);
  };

  // Initialize P2P Signaling & File Manager
  useEffect(() => {
    const manager = new P2PFileManager(roomId, peerId, displayName, {
      onPeerJoin: (peer) => {
        setPeers((prev) => [...prev.filter((p) => p.peerId !== peer.peerId), peer]);
        playP2PSound('connect');
      },
      onPeerLeave: (pId) => {
        setPeers((prev) => prev.filter((p) => p.peerId !== pId));
      },
      onPeerStatusChange: (updatedPeers) => {
        setPeers(updatedPeers);
      },
      onTransferProgress: () => {},
      onTransferComplete: (tr) => {
        playP2PSound('receive_complete');
        if (tr.blob && tr.meta.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (typeof e.target?.result === 'string') {
              const newPhoto: BoothPhoto = {
                id: `peer-photo-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                dataUrl: e.target.result,
                senderName: tr.meta.senderName || 'Peer',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                filterName: 'Shared P2P'
              };
              setPhotos((p) => [newPhoto, ...p]);
            }
          };
          reader.readAsDataURL(tr.blob);
        }
      },
      onTransferError: () => {},
      onTextMessage: () => {},
      onSignalingState: (st) => {
        setSignalingState(st);
      }
    });

    fileManagerRef.current = manager;

    return () => {
      manager.close();
    };
  }, [roomId, peerId, displayName]);

  // Visual source check (always true thanks to built-in studio poses)
  const hasVisualSource = cameraActive || Boolean(fallbackImage);

  const handleTriggerCapture = () => {
    if (!hasVisualSource || countdown !== null) return;

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

  const getSourceElement = (): Promise<HTMLVideoElement | HTMLImageElement> => {
    return new Promise((resolve) => {
      if (cameraActive && videoRef.current && videoRef.current.videoWidth > 0) {
        resolve(videoRef.current);
      } else {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => {
          // Guaranteed fallback to first demo pose
          img.src = DEMO_POSES[0].url;
          img.onload = () => resolve(img);
        };
        img.src = fallbackImage || DEMO_POSES[0].url;
      }
    });
  };

  const executeCapture = async () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const source = await getSourceElement();
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 250);
      playP2PSound('message');

      const sWidth = source instanceof HTMLVideoElement ? source.videoWidth : (source.naturalWidth || 800);
      const sHeight = source instanceof HTMLVideoElement ? source.videoHeight : (source.naturalHeight || 600);

      if (mode === 'single') {
        canvas.width = sWidth;
        canvas.height = sHeight;

        ctx.filter = selectedFilter.css || 'none';
        if (source instanceof HTMLVideoElement) {
          // Mirror live webcam to match user preview
          ctx.save();
          ctx.translate(sWidth, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(source, 0, 0, sWidth, sHeight);
          ctx.restore();
        } else {
          ctx.drawImage(source, 0, 0, sWidth, sHeight);
        }

        // Draw footer caption
        ctx.filter = 'none';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, sHeight - 70, sWidth, 70);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px monospace';
        ctx.fillText(customCaption, 30, sHeight - 35);
        ctx.fillStyle = '#00ffff';
        ctx.font = '15px monospace';
        ctx.fillText(`@ ${displayName}`, Math.max(30, sWidth - 240), sHeight - 35);

        const dataUrl = canvas.toDataURL('image/png');
        const newPhoto: BoothPhoto = {
          id: `photo-${Date.now()}`,
          dataUrl,
          senderName: displayName,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          filterName: selectedFilter.name
        };

        setPhotos((prev) => [newPhoto, ...prev]);
        beamPhotoToPeers(dataUrl, `booth-${Date.now()}.png`);
      } else {
        // 3-Shot Photostrip mode
        const stripWidth = 600;
        const shotHeight = 400;
        const headerHeight = 80;
        const footerHeight = 100;
        const padding = 20;
        const totalHeight = headerHeight + shotHeight * 3 + padding * 4 + footerHeight;

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

        // Take 3 sequential shots with brief interval
        for (let i = 0; i < 3; i++) {
          const yOffset = headerHeight + padding + i * (shotHeight + padding);
          ctx.fillStyle = '#161616';
          ctx.fillRect(padding, yOffset, stripWidth - padding * 2, shotHeight);

          ctx.save();
          ctx.filter = selectedFilter.css || 'none';

          if (source instanceof HTMLVideoElement) {
            ctx.translate(padding + 10 + (stripWidth - padding * 2 - 20), 0);
            ctx.scale(-1, 1);
            ctx.drawImage(source, 0, 0, sWidth, sHeight, 0, yOffset + 10, stripWidth - padding * 2 - 20, shotHeight - 20);
          } else {
            ctx.drawImage(
              source,
              0,
              0,
              sWidth,
              sHeight,
              padding + 10,
              yOffset + 10,
              stripWidth - padding * 2 - 20,
              shotHeight - 20
            );
          }
          ctx.restore();

          if (i < 2) {
            await new Promise((r) => setTimeout(r, 350));
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

        setPhotos((prev) => [newPhoto, ...prev]);
        beamPhotoToPeers(dataUrl, `photostrip-${Date.now()}.png`);
      }
    } catch {
      // Graceful capture error suppression
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
    } catch {
      // Ignored non-fatal network error
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
              <p className="text-[10px] text-white/50 font-mono">
                Room: <span className="text-cyan-300 font-bold">{roomId}</span>
              </p>
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

      {/* Camera / Permission Notice Banner if applicable */}
      {cameraNotice && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xs flex items-start sm:items-center justify-between gap-3 text-xs font-mono text-amber-200">
          <div className="flex items-start sm:items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <span>{cameraNotice}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => startCamera(true)}
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-[11px] rounded-xs cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry Webcam</span>
            </button>
            <button
              onClick={() => setCameraNotice(null)}
              className="text-amber-300/60 hover:text-amber-200 px-1.5 py-0.5 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Viewport & Live Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#0a0a0a] border border-white/15 p-6 rounded-xs space-y-6 relative overflow-hidden">
            {/* Shutter Flash Overlay */}
            {isFlashing && <div className="absolute inset-0 bg-white z-30 pointer-events-none animate-ping" />}

            {/* Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-30 flex items-center justify-center">
                <span className="text-8xl font-black font-mono text-cyan-400 animate-bounce">{countdown}</span>
              </div>
            )}

            {/* Top Viewport Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`}
                />
                <span className="text-xs font-mono text-white/70 uppercase">
                  {cameraActive
                    ? 'Live Webcam Stream'
                    : isUsingDemo
                    ? `Studio Pose: ${DEMO_POSES[selectedDemoIndex]?.name}`
                    : 'Uploaded Subject'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMode('strip')}
                  className={`px-3 py-1 text-xs font-mono rounded-xs border transition-colors cursor-pointer ${
                    mode === 'strip'
                      ? 'bg-white text-black font-bold border-white'
                      : 'bg-white/5 text-white/60 border-white/15 hover:text-white'
                  }`}
                >
                  3-Shot Strip
                </button>
                <button
                  onClick={() => setMode('single')}
                  className={`px-3 py-1 text-xs font-mono rounded-xs border transition-colors cursor-pointer ${
                    mode === 'single'
                      ? 'bg-white text-black font-bold border-white'
                      : 'bg-white/5 text-white/60 border-white/15 hover:text-white'
                  }`}
                >
                  Single Shot
                </button>
              </div>
            </div>

            {/* Viewport Box */}
            <div className="relative bg-black rounded-xs overflow-hidden border border-white/20 aspect-video flex items-center justify-center shadow-2xl">
              {cameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ filter: selectedFilter.css }}
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <img
                  src={fallbackImage}
                  alt="Booth Subject"
                  referrerPolicy="no-referrer"
                  style={{ filter: selectedFilter.css }}
                  className="w-full h-full object-cover"
                />
              )}

              {/* In-viewport Camera Toggle Overlay */}
              <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                {cameraActive ? (
                  <button
                    onClick={stopCamera}
                    className="px-3 py-1.5 bg-black/80 hover:bg-black border border-red-500/50 text-red-300 text-xs font-mono rounded-xs backdrop-blur-md flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <VideoOff className="w-3.5 h-3.5" />
                    <span>Stop Camera</span>
                  </button>
                ) : (
                  <button
                    onClick={() => startCamera(true)}
                    disabled={cameraLoading}
                    className="px-3 py-1.5 bg-black/80 hover:bg-black/90 border border-cyan-400/60 text-cyan-300 text-xs font-mono rounded-xs backdrop-blur-md flex items-center gap-1.5 transition-colors cursor-pointer hover:border-cyan-300"
                  >
                    <Video className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{cameraLoading ? 'Starting...' : 'Turn On Webcam'}</span>
                  </button>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadFile}
                className="hidden"
              />
            </div>

            {/* Studio Pose Presets & Source Selector */}
            <div className="space-y-2 border-t border-white/10 pt-3">
              <div className="flex items-center justify-between text-[11px] font-mono text-white/50">
                <span className="flex items-center gap-1.5 text-white/70">
                  <Palette className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Virtual Studio Poses:</span>
                </span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="hover:text-cyan-300 underline flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload Custom Photo</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {DEMO_POSES.map((pose, idx) => (
                  <button
                    key={pose.id}
                    onClick={() => handleSelectDemoPose(idx)}
                    className={`p-2 rounded-xs border text-left transition-all cursor-pointer ${
                      !cameraActive && isUsingDemo && selectedDemoIndex === idx
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="text-xs font-mono font-bold truncate">{pose.name}</span>
                    </div>
                    <span className="text-[10px] font-mono opacity-60 block truncate">{pose.tagline}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hidden Canvas for capture rendering */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Live Color Filters Selector */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">
                Select Photo Filter:
              </span>
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
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">
                Photo Strip Footer Caption:
              </label>
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
              disabled={!hasVisualSource || countdown !== null}
              className="w-full py-4 bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-mono font-bold uppercase tracking-widest rounded-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Camera className="w-4 h-4 fill-current" />
              <span>
                {countdown !== null
                  ? `Capturing in ${countdown}...`
                  : mode === 'strip'
                  ? 'Take 3-Shot PhotoStrip'
                  : 'Take Snapshot'}
              </span>
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
                <p className="text-[10px] font-mono text-white/30">
                  Hit the shutter button to create a 3-shot strip and beam it to all peers!
                </p>
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
                  <p className="text-[10px] font-mono text-white/50">
                    Captured by {activePreview.senderName} at {activePreview.timestamp}
                  </p>
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
