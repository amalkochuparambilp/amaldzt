import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  RefreshCw, 
  Maximize2, 
  ExternalLink, 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles, 
  Users, 
  Camera, 
  Globe, 
  AlertCircle,
  Play,
  SkipForward,
  PhoneOff,
  MessageSquare,
  Send,
  Heart,
  SwitchCamera,
  Sliders,
  Volume2,
  VolumeX,
  Radio,
  Wifi,
  Sparkle
} from 'lucide-react';

interface RandomCallProps {
  onBack?: () => void;
}

interface SimulatedPartner {
  id: string;
  name: string;
  age: number;
  location: string;
  countryCode: string;
  gender: 'female' | 'male';
  greeting: string;
  avatarHue: number;
  interests: string[];
  gradient: string;
}

const SAMPLE_PARTNERS: SimulatedPartner[] = [
  {
    id: 'p-1',
    name: 'Elena Rostova',
    age: 21,
    location: 'Kyiv, Ukraine',
    countryCode: 'UA',
    gender: 'female',
    greeting: 'Hey! Nice to meet you 😊 How is your day going?',
    avatarHue: 330,
    interests: ['Music', 'Travel', 'Photography'],
    gradient: 'from-rose-900/60 via-purple-950/70 to-black'
  },
  {
    id: 'p-2',
    name: 'Sophia Chen',
    age: 23,
    location: 'Taipei, Taiwan',
    countryCode: 'TW',
    gender: 'female',
    greeting: 'Hello from Taipei! Love tech and design 🎨',
    avatarHue: 180,
    interests: ['Design', 'Art', 'Coffee'],
    gradient: 'from-cyan-900/60 via-indigo-950/70 to-black'
  },
  {
    id: 'p-3',
    name: 'Lucas Silva',
    age: 24,
    location: 'São Paulo, Brazil',
    countryCode: 'BR',
    gender: 'male',
    greeting: 'Opa! What are you building today bro?',
    avatarHue: 140,
    interests: ['Coding', 'Gaming', 'Football'],
    gradient: 'from-emerald-900/60 via-teal-950/70 to-black'
  },
  {
    id: 'p-4',
    name: 'Chloe Dubois',
    age: 22,
    location: 'Paris, France',
    countryCode: 'FR',
    gender: 'female',
    greeting: 'Bonjour! Are you enjoying the video chat? ✨',
    avatarHue: 280,
    interests: ['Fashion', 'Cinema', 'Music'],
    gradient: 'from-fuchsia-900/60 via-pink-950/70 to-black'
  },
  {
    id: 'p-5',
    name: 'Marcus Vance',
    age: 25,
    location: 'Toronto, Canada',
    countryCode: 'CA',
    gender: 'male',
    greeting: 'Hey what’s up! Always cool meeting folks here 🎧',
    avatarHue: 40,
    interests: ['Audio', 'Cybersecurity', 'Fitness'],
    gradient: 'from-amber-900/60 via-orange-950/70 to-black'
  },
  {
    id: 'p-6',
    name: 'Yuki Tanaka',
    age: 20,
    location: 'Tokyo, Japan',
    countryCode: 'JP',
    gender: 'female',
    greeting: 'Konnichiwa! Where are you connecting from? 🌸',
    avatarHue: 350,
    interests: ['Anime', 'Coding', 'J-Pop'],
    gradient: 'from-pink-900/60 via-rose-950/70 to-black'
  }
];

export default function RandomCall({ onBack }: RandomCallProps) {
  // Local Camera State
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [micActive, setMicActive] = useState<boolean>(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'normal' | 'cyberpunk' | 'warm' | 'grayscale' | 'night'>('normal');

  // Match / Partner State
  const [matchStatus, setMatchStatus] = useState<'idle' | 'searching' | 'connected'>('searching');
  const [currentPartner, setCurrentPartner] = useState<SimulatedPartner>(SAMPLE_PARTNERS[0]);
  const [partnerIndex, setPartnerIndex] = useState<number>(0);
  const [likesCount, setLikesCount] = useState<number>(14);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [onlineCount, setOnlineCount] = useState<number>(36490);
  const [latency, setLatency] = useState<number>(24);
  const [selectedGender, setSelectedGender] = useState<'all' | 'female' | 'male'>('all');

  // Chat State
  const [messages, setMessages] = useState<Array<{ sender: 'partner' | 'you'; text: string; time: string }>>([
    { sender: 'partner', text: SAMPLE_PARTNERS[0].greeting, time: 'Just now' }
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');

  // Audio / Sound state
  const [remoteAudioMuted, setRemoteAudioMuted] = useState<boolean>(false);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Start / restart local webcam stream with facingMode
  const startCamera = async (targetFacing: 'user' | 'environment' = facingMode) => {
    try {
      setPermissionError(null);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: targetFacing,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: true
        });

        mediaStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setCameraActive(true);
      } else {
        setPermissionError('Camera API not available in this browser environment.');
      }
    } catch (err: any) {
      console.warn('Camera stream warning:', err);
      // Fallback try with generic video
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        mediaStreamRef.current = fallbackStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = fallbackStream;
        }
        setCameraActive(true);
      } catch (fallbackErr) {
        setPermissionError('Camera permission needed. Click "Allow Camera" or enable permissions in browser.');
      }
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const flipCamera = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  const toggleMic = () => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !micActive;
      });
      setMicActive(!micActive);
    }
  };

  // Next Match / Searching Flow
  const findNextPartner = () => {
    setMatchStatus('searching');
    setHasLiked(false);

    // Filter available partners by gender selection
    const pool = SAMPLE_PARTNERS.filter(p => selectedGender === 'all' || p.gender === selectedGender);
    const effectivePool = pool.length > 0 ? pool : SAMPLE_PARTNERS;
    const nextIdx = (partnerIndex + 1) % effectivePool.length;
    const nextPartner = effectivePool[nextIdx];

    setTimeout(() => {
      setPartnerIndex(nextIdx);
      setCurrentPartner(nextPartner);
      setMatchStatus('connected');
      setMessages([
        { sender: 'partner', text: nextPartner.greeting, time: 'Just now' }
      ]);
      setLikesCount(Math.floor(Math.random() * 25) + 5);
      setLatency(Math.floor(Math.random() * 20) + 18);
    }, 1100);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    setMessages(prev => [
      ...prev,
      { sender: 'you', text: userText, time: 'Now' }
    ]);

    // Simulated reply after 1.5s
    setTimeout(() => {
      if (matchStatus === 'connected') {
        const replies = [
          'Awesome! That sounds super cool!',
          'Haha totally agree with you 😄',
          'Nice to connect with you! Where are you from?',
          'That is really interesting, tell me more!',
          'Cool profile! ✨'
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        setMessages(prev => [
          ...prev,
          { sender: 'partner', text: randomReply, time: 'Just now' }
        ]);
      }
    }, 1400);
  };

  // Animated Canvas Video Partner Simulator (Ensures back/main screen is NEVER blank!)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const render = () => {
      time += 0.02;
      canvas.width = canvas.clientWidth || 800;
      canvas.height = canvas.clientHeight || 500;

      const w = canvas.width;
      const h = canvas.height;

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      if (matchStatus === 'searching') {
        bgGrad.addColorStop(0, '#0a0a0f');
        bgGrad.addColorStop(0.5, '#120f24');
        bgGrad.addColorStop(1, '#050508');
      } else {
        const hue = currentPartner.avatarHue;
        bgGrad.addColorStop(0, `hsl(${hue}, 40%, 12%)`);
        bgGrad.addColorStop(0.5, `hsl(${hue + 20}, 50%, 8%)`);
        bgGrad.addColorStop(1, '#050508');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      if (matchStatus === 'searching') {
        // Radar scanning wave
        const cx = w / 2;
        const cy = h / 2;

        ctx.strokeStyle = 'rgba(244, 63, 94, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 60 + Math.sin(time * 3) * 15, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
        ctx.beginPath();
        ctx.arc(cx, cy, 100 + Math.cos(time * 2) * 20, 0, Math.PI * 2);
        ctx.stroke();

        // Scanning beam
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(time * 2);
        const beamGrad = ctx.createLinearGradient(0, 0, 140, 0);
        beamGrad.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
        beamGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 140, -0.25, 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Center search icon
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SEARCHING FOR LIVE PEER...', cx, cy + 80);

        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '12px monospace';
        ctx.fillText(`${onlineCount.toLocaleString()} candidates online`, cx, cy + 105);
      } else {
        // Render stylized live video partner simulation
        const cx = w / 2;
        const cy = h / 2 - 20;

        // Ambient video light orbs
        for (let i = 0; i < 3; i++) {
          const orbX = cx + Math.sin(time + i * 2) * (w * 0.25);
          const orbY = cy + Math.cos(time * 0.8 + i) * (h * 0.2);
          const rad = 120 + Math.sin(time + i) * 30;
          const orbGrad = ctx.createRadialGradient(orbX, orbY, 10, orbX, orbY, rad);
          orbGrad.addColorStop(0, `hsla(${currentPartner.avatarHue + i * 30}, 80%, 60%, 0.15)`);
          orbGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = orbGrad;
          ctx.beginPath();
          ctx.arc(orbX, orbY, rad, 0, Math.PI * 2);
          ctx.fill();
        }

        // Live breathing avatar silhouette & portrait ring
        const avatarRad = Math.min(w, h) * 0.18 + Math.sin(time * 1.5) * 4;
        
        // Outer glowing ring
        ctx.strokeStyle = `hsl(${currentPartner.avatarHue}, 80%, 60%)`;
        ctx.lineWidth = 3;
        ctx.shadowColor = `hsl(${currentPartner.avatarHue}, 80%, 50%)`;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(cx, cy, avatarRad + 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Portrait fill
        const portraitGrad = ctx.createLinearGradient(cx - avatarRad, cy - avatarRad, cx + avatarRad, cy + avatarRad);
        portraitGrad.addColorStop(0, `hsl(${currentPartner.avatarHue}, 70%, 50%)`);
        portraitGrad.addColorStop(1, `hsl(${currentPartner.avatarHue + 40}, 80%, 25%)`);
        ctx.fillStyle = portraitGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, avatarRad, 0, Math.PI * 2);
        ctx.fill();

        // Initial letter
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${avatarRad * 0.9}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(currentPartner.name.charAt(0), cx, cy);

        // Audio waveform visualizer at bottom of video
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const waveY = h - 60;
        ctx.moveTo(w * 0.15, waveY);
        for (let x = w * 0.15; x <= w * 0.85; x += 10) {
          const normX = (x - w * 0.15) / (w * 0.7);
          const env = Math.sin(normX * Math.PI);
          const freq = Math.sin(x * 0.05 + time * 6) * Math.cos(x * 0.02 + time * 3);
          const y = waveY + freq * 18 * env;
          ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Scan lines / CRT overlay
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        for (let y = 0; y < h; y += 4) {
          ctx.fillRect(0, y, w, 1);
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [matchStatus, currentPartner, onlineCount]);

  // Initial boot
  useEffect(() => {
    startCamera('user');
    findNextPartner();

    const interval = setInterval(() => {
      setOnlineCount(prev => prev + Math.floor(Math.random() * 9) - 4);
    }, 3500);

    return () => {
      clearInterval(interval);
      stopCamera();
    };
  }, []);

  // Auto scroll chat
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const toggleFullScreen = () => {
    const el = document.getElementById('randomcall-container');
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen().catch(err => console.error(err));
    }
  };

  const getFilterStyle = () => {
    switch (filterMode) {
      case 'cyberpunk':
        return 'contrast-125 saturate-200 hue-rotate-15';
      case 'warm':
        return 'sepia-50 saturate-150';
      case 'grayscale':
        return 'grayscale contrast-125';
      case 'night':
        return 'brightness-125 contrast-150 hue-rotate-90';
      default:
        return '';
    }
  };

  return (
    <div id="randomcall-container" className="min-h-screen bg-[#050505] text-white flex flex-col font-sans select-none">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur-md px-4 flex items-center justify-between z-30 sticky top-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-xs bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 hover:text-white transition-all text-xs font-mono flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Portfolio</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-black text-sm tracking-wide text-white">DZt / CooMeet</span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 border border-emerald-500/30 rounded-2xs">
                LIVE RANDOM VIDEO CHAT
              </span>
            </div>
          </div>
        </div>

        {/* Real-time stats & controls */}
        <div className="flex items-center gap-2 sm:gap-3 font-mono text-xs">
          <div className="hidden md:flex items-center gap-1.5 text-white/70 text-[11px] bg-white/5 px-2.5 py-1 border border-white/10 rounded-2xs">
            <Users className="w-3 h-3 text-emerald-400" />
            <span>{onlineCount.toLocaleString()} ONLINE</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-emerald-400 text-[11px] bg-emerald-500/10 px-2 py-1 border border-emerald-500/20 rounded-2xs">
            <Wifi className="w-3 h-3" />
            <span>{latency}ms</span>
          </div>

          <button
            onClick={findNextPartner}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-mono font-bold flex items-center gap-1.5 rounded-xs transition-all cursor-pointer"
            title="Next Video Partner"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${matchStatus === 'searching' ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">NEXT PARTNER</span>
          </button>

          <button
            onClick={toggleFullScreen}
            className="p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all rounded-xs cursor-pointer"
            title="Fullscreen Mode"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <a
            href="https://space.coomeet.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-[11px] transition-all rounded-xs shadow-md shadow-rose-900/30"
          >
            <span>Open CooMeet</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Main Video Chat Stage */}
      <div className="flex-1 relative flex flex-col lg:flex-row overflow-hidden bg-black">
        {/* Main Video Screen (Partner Remote Screen / Back Screen) */}
        <div className="flex-1 relative flex items-center justify-center bg-neutral-950 min-h-[380px] lg:min-h-auto">
          {/* Animated WebRTC Partner Canvas Stream */}
          <canvas
            ref={canvasRef}
            className="w-full h-full absolute inset-0 block object-cover"
          />

          {/* Partner Info HUD Overlay */}
          {matchStatus === 'connected' && (
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
              <div className="bg-black/70 backdrop-blur-md border border-white/15 p-2.5 rounded-xs flex items-center gap-3 text-white">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{currentPartner.name}, {currentPartner.age}</span>
                    <span className="text-[10px] bg-white/10 px-1.5 py-0.2 rounded-2xs font-mono text-emerald-300">
                      {currentPartner.countryCode} • {currentPartner.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {currentPartner.interests.map(tag => (
                      <span key={tag} className="text-[9px] font-mono text-white/60 bg-white/5 px-1 rounded-2xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Stage Controls Overlay (Next, Like, Audio, Report) */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-black/80 backdrop-blur-md p-2 rounded-full border border-white/20 shadow-2xl">
            <button
              onClick={() => {
                if (!hasLiked) {
                  setLikesCount(prev => prev + 1);
                  setHasLiked(true);
                }
              }}
              className={`p-3 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                hasLiked ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              title="Like Partner"
            >
              <Heart className={`w-5 h-5 ${hasLiked ? 'fill-white' : ''}`} />
              <span className="text-xs font-mono font-bold pr-1">{likesCount}</span>
            </button>

            <button
              onClick={findNextPartner}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-mono font-black text-sm uppercase tracking-wider rounded-full shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <SkipForward className="w-4 h-4 fill-black" />
              <span>SKIP / NEXT</span>
            </button>

            <button
              onClick={() => setRemoteAudioMuted(!remoteAudioMuted)}
              className={`p-3 rounded-full transition-all cursor-pointer ${
                remoteAudioMuted ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              title="Toggle Partner Audio"
            >
              {remoteAudioMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setMatchStatus('idle')}
              className="p-3 rounded-full bg-rose-600/80 hover:bg-rose-600 text-white transition-all cursor-pointer"
              title="End Chat"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>

          {/* Top Right Live Tag */}
          <div className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="text-white font-bold">1080p 60FPS</span>
            <span className="text-white/40">|</span>
            <span className="text-emerald-400">ENCRYPTED WEBRTC</span>
          </div>
        </div>

        {/* Right Sidebar: Your Local Cam Preview & Live Chat Panel */}
        <div className="w-full lg:w-96 bg-[#0c0c0c] border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col justify-between z-20 font-sans">
          {/* Top Half: Local Webcam Preview + Hardware Camera Controls */}
          <div className="p-3.5 border-b border-white/10 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono text-white/60">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>YOUR WEBCAM ({facingMode === 'user' ? 'FRONT' : 'BACK / ENV'})</span>
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-2xs border ${
                cameraActive 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold' 
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              }`}>
                {cameraActive ? 'STREAM ON' : 'CAMERA OFF'}
              </span>
            </div>

            {/* Video Canvas / Video Element */}
            <div className="relative aspect-video w-full bg-black rounded-xs overflow-hidden border border-white/15 group">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''} ${getFilterStyle()} ${cameraActive ? 'block' : 'hidden'}`}
              />

              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-black/90 space-y-2">
                  <VideoOff className="w-6 h-6 text-white/40" />
                  <span className="text-[11px] text-white/60 font-mono">Webcam preview offline</span>
                  <button
                    onClick={() => startCamera('user')}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-mono font-bold uppercase rounded-xs cursor-pointer shadow-md"
                  >
                    Enable Camera
                  </button>
                </div>
              )}

              {/* Hardware Quick Action Controls */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-black/75 backdrop-blur-sm p-1.5 rounded-xs border border-white/15 text-[11px] font-mono">
                <div className="flex items-center gap-1">
                  <button
                    onClick={cameraActive ? stopCamera : () => startCamera(facingMode)}
                    className={`p-1.5 rounded-xs cursor-pointer ${cameraActive ? 'text-emerald-400 hover:bg-white/10' : 'text-rose-400 hover:bg-white/10'}`}
                    title="Toggle Camera On/Off"
                  >
                    {cameraActive ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={toggleMic}
                    className={`p-1.5 rounded-xs cursor-pointer ${micActive ? 'text-emerald-400 hover:bg-white/10' : 'text-rose-400 hover:bg-white/10'}`}
                    title="Toggle Mic Mute"
                  >
                    {micActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={flipCamera}
                    className="p-1.5 rounded-xs text-cyan-400 hover:bg-white/10 cursor-pointer flex items-center gap-1"
                    title="Flip Camera (Front/Back)"
                  >
                    <SwitchCamera className="w-3.5 h-3.5" />
                    <span className="text-[9px] uppercase font-bold">{facingMode === 'user' ? 'Front' : 'Back'}</span>
                  </button>
                </div>

                {/* Filter Selector */}
                <select
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value as any)}
                  className="bg-white/10 text-white text-[10px] rounded-2xs px-1.5 py-0.5 border border-white/15 focus:outline-none"
                >
                  <option value="normal">Normal</option>
                  <option value="cyberpunk">Cyberpunk</option>
                  <option value="warm">Warm</option>
                  <option value="grayscale">B&W</option>
                  <option value="night">Night Vision</option>
                </select>
              </div>
            </div>

            {permissionError && (
              <div className="p-2 bg-rose-950/40 border border-rose-500/30 rounded-xs text-[11px] text-rose-300 flex items-start gap-2 font-mono">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{permissionError}</span>
              </div>
            )}

            {/* Gender Filter Buttons */}
            <div className="flex items-center justify-between text-xs font-mono pt-1">
              <span className="text-white/50 text-[10px] uppercase">Match Target:</span>
              <div className="flex gap-1">
                {(['all', 'female', 'male'] as const).map(g => (
                  <button
                    key={g}
                    onClick={() => {
                      setSelectedGender(g);
                      findNextPartner();
                    }}
                    className={`px-2 py-0.5 rounded-2xs text-[10px] uppercase font-bold transition-all cursor-pointer ${
                      selectedGender === g
                        ? 'bg-rose-500 text-white'
                        : 'bg-white/5 text-white/60 hover:text-white'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Half: Interactive Text Chat */}
          <div className="flex-1 flex flex-col h-60 lg:h-72 p-3 font-sans justify-between bg-black/40">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs font-mono text-white/60">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>REAL-TIME TEXT CHAT</span>
              </div>
              <span className="text-[10px] text-emerald-400">P2P CONNECTED</span>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto py-2 space-y-2 pr-1 scrollbar-thin text-xs">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.sender === 'you' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed ${
                      m.sender === 'you'
                        ? 'bg-rose-600 text-white rounded-br-none'
                        : 'bg-white/10 text-white/90 rounded-bl-none border border-white/10'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[9px] font-mono text-white/40 mt-0.5 px-1">{m.time}</span>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            {/* Send Message Form */}
            <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-white/10">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Say something friendly..."
                className="flex-1 bg-white/5 border border-white/15 focus:border-rose-500 text-xs px-3 py-2 rounded-xs text-white placeholder:text-white/30 focus:outline-none font-sans"
              />
              <button
                type="submit"
                className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xs transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
