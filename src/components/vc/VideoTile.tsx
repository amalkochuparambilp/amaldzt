import { useEffect, useRef, useState } from 'react';
import { 
  Mic, 
  MicOff, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Hand, 
  Tv, 
  Signal, 
  User,
  Pin,
  PinOff,
  Scan,
  Sparkles,
  FlipHorizontal
} from 'lucide-react';
import { VCPeer } from '../../types';

interface VideoTileProps {
  key?: string | number;
  stream?: MediaStream | null;
  peer?: VCPeer;
  isLocal?: boolean;
  displayName: string;
  isAudioMuted?: boolean;
  isVideoMuted?: boolean;
  isScreenSharing?: boolean;
  isHandRaised?: boolean;
  audioLevel?: number;
  connectionState?: string;
  isSpeaking?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
  aspectFill?: 'cover' | 'contain';
  onToggleAspectFill?: () => void;
}

export default function VideoTile({
  stream,
  isLocal = false,
  displayName,
  isAudioMuted = false,
  isVideoMuted = false,
  isScreenSharing = false,
  isHandRaised = false,
  audioLevel = 0,
  connectionState = 'connected',
  isSpeaking = false,
  isPinned = false,
  onTogglePin,
  aspectFill = 'cover',
  onToggleAspectFill,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTileMuted, setIsTileMuted] = useState(false);
  const [isMirrored, setIsMirrored] = useState(isLocal && !isScreenSharing);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync stream to video element
  useEffect(() => {
    if (videoRef.current) {
      if (stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {
          // Autoplay policy fallback
        });
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  // Keep mirror state synced with screen share changes
  useEffect(() => {
    if (isScreenSharing) {
      setIsMirrored(false);
    } else if (isLocal) {
      setIsMirrored(true);
    }
  }, [isLocal, isScreenSharing]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[190px] sm:min-h-[240px] md:min-h-[280px] bg-[#0a0a0d] rounded-sm overflow-hidden border transition-all duration-200 flex flex-col items-center justify-center group select-none shadow-xl ${
        isSpeaking && !isAudioMuted
          ? 'border-emerald-400 ring-2 ring-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.3)] z-10'
          : isHandRaised
          ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.3)] z-10'
          : isPinned
          ? 'border-cyan-400/70 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
          : 'border-white/15 hover:border-white/35'
      }`}
    >
      {/* Background Ambience Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none z-10" />

      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal || isTileMuted}
        className={`w-full h-full transition-all duration-300 ${
          aspectFill === 'contain' ? 'object-contain bg-black' : 'object-cover'
        } ${isVideoMuted ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} ${
          isMirrored ? 'scale-x-[-1]' : ''
        }`}
      />

      {/* Video Paused / Camera Off Avatar Placeholder */}
      {isVideoMuted && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d0d12] text-white p-4 space-y-3 select-none z-0">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-neutral-800 to-neutral-700 border border-white/20 flex items-center justify-center text-xl sm:text-2xl font-bold font-mono uppercase text-white shadow-2xl">
              {displayName.charAt(0) || <User className="w-8 h-8 text-white/60" />}
            </div>
            {isSpeaking && !isAudioMuted && (
              <>
                <div className="absolute -inset-2 rounded-full border-2 border-emerald-400 animate-ping opacity-60 pointer-events-none" />
                <div className="absolute -inset-1 rounded-full border border-emerald-300 opacity-90 pointer-events-none" />
              </>
            )}
          </div>
          <div className="text-center space-y-0.5">
            <span className="text-xs sm:text-sm font-semibold tracking-wide block text-white/95">
              {displayName}
            </span>
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">
              {isLocal ? 'Camera Inactive' : 'Video Off'}
            </span>
          </div>
        </div>
      )}

      {/* TOP HUD BAR: Name Tag, Live Badge, Hand Raised, Pin */}
      <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 right-2.5 sm:right-3 flex items-center justify-between z-20 pointer-events-none">
        {/* Left: Name, Role & Screen Share indicator */}
        <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-xs border border-white/15 text-xs font-mono text-white pointer-events-auto max-w-[70%] sm:max-w-[75%] shadow-lg">
          {isScreenSharing ? (
            <div className="flex items-center gap-1 text-cyan-400">
              <Tv className="w-3.5 h-3.5" />
              <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1 py-0.2 rounded-2xs border border-cyan-500/30 uppercase font-bold">
                Screen
              </span>
            </div>
          ) : (
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isSpeaking && !isAudioMuted ? 'bg-emerald-400 animate-pulse' : isLocal ? 'bg-cyan-400' : 'bg-emerald-500'}`} />
          )}

          <span className="font-semibold text-[11px] sm:text-xs truncate text-white">
            {displayName} {isLocal ? '(You)' : ''}
          </span>

          {isSpeaking && !isAudioMuted && (
            <span className="hidden sm:inline-flex items-center gap-0.5 text-emerald-400 text-[10px] font-bold">
              <Sparkles className="w-2.5 h-2.5" />
            </span>
          )}
        </div>

        {/* Right Status Badges */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {isPinned && (
            <div className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 text-[10px] font-mono font-bold rounded-xs flex items-center gap-1 shadow-md">
              <Pin className="w-2.5 h-2.5" />
              <span className="hidden sm:inline">PINNED</span>
            </div>
          )}

          {isHandRaised && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-400 text-black font-bold text-[10px] font-mono rounded-xs animate-bounce shadow-lg">
              <Hand className="w-3 h-3" />
              <span className="hidden sm:inline">HAND</span>
            </div>
          )}

          {!isLocal && connectionState && connectionState !== 'connected' && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-[10px] font-mono rounded-xs">
              <Signal className="w-3 h-3 animate-pulse" />
              <span className="uppercase text-[9px]">{connectionState}</span>
            </div>
          )}

          {/* Mic Status Indicator */}
          {isAudioMuted ? (
            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-red-500/90 text-white rounded-xs flex items-center justify-center shadow-md border border-red-400/50" title="Microphone Muted">
              <MicOff className="w-3.5 h-3.5" />
            </div>
          ) : (
            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-black/80 backdrop-blur-md border border-white/20 text-white/90 rounded-xs flex items-center justify-center" title="Microphone Active">
              <Mic className={`w-3.5 h-3.5 ${isSpeaking ? 'text-emerald-400' : 'text-white/60'}`} />
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM HUD: Visualizer & Quick Actions (Always visible on mobile or hover on desktop) */}
      <div className="absolute bottom-2.5 sm:bottom-3 left-2.5 sm:left-3 right-2.5 sm:right-3 flex items-center justify-between z-20 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {/* Left: Audio Spectrum Wave Bar */}
        <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2 py-1 rounded-xs border border-white/15 pointer-events-auto shadow-md">
          <div className="flex items-end gap-0.5 h-3 w-7 sm:w-8">
            {[1, 2, 3, 4].map((bar) => {
              const heightPct = isAudioMuted ? 15 : Math.max(15, Math.min(100, (audioLevel / 25) * bar * 20));
              return (
                <div
                  key={bar}
                  className={`w-1 rounded-2xs transition-all duration-75 ${
                    isAudioMuted
                      ? 'bg-red-500/40'
                      : isSpeaking
                      ? 'bg-emerald-400'
                      : 'bg-white/30'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              );
            })}
          </div>
          <span className="text-[9px] font-mono text-white/60 uppercase">
            {isAudioMuted ? 'Muted' : isSpeaking ? 'Speaking' : 'Live'}
          </span>
        </div>

        {/* Right: Quick Tile Controls (Pin, Fit, Mute Audio, Fullscreen) */}
        <div className="flex items-center gap-1 bg-black/85 backdrop-blur-md p-1 rounded-xs border border-white/15 pointer-events-auto shadow-lg">
          {/* Toggle Aspect Ratio: Cover vs Contain */}
          {onToggleAspectFill && (
            <button
              onClick={onToggleAspectFill}
              className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
                aspectFill === 'contain' ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-white/20 text-white/70 hover:text-white'
              }`}
              title={aspectFill === 'contain' ? 'Fill Tile (Crop)' : 'Fit Entire Video (Contain)'}
            >
              <Scan className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Mirror toggle for local */}
          {isLocal && (
            <button
              onClick={() => setIsMirrored(!isMirrored)}
              className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
                isMirrored ? 'hover:bg-white/20 text-white/70 hover:text-white' : 'bg-cyan-500/20 text-cyan-300'
              }`}
              title={isMirrored ? 'Disable Mirroring' : 'Enable Mirroring'}
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Pin/Spotlight Toggle */}
          {onTogglePin && (
            <button
              onClick={onTogglePin}
              className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
                isPinned ? 'bg-cyan-500/30 text-cyan-300' : 'hover:bg-white/20 text-white/70 hover:text-white'
              }`}
              title={isPinned ? 'Unpin Tile' : 'Pin Spotlight Tile'}
            >
              {isPinned ? <PinOff className="w-3.5 h-3.5 text-cyan-300" /> : <Pin className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Remote audio mute */}
          {!isLocal && (
            <button
              onClick={() => setIsTileMuted(!isTileMuted)}
              className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
                isTileMuted ? 'bg-red-500/30 text-red-400' : 'hover:bg-white/20 text-white/70 hover:text-white'
              }`}
              title={isTileMuted ? 'Unmute Audio for me' : 'Mute Audio for me'}
            >
              {isTileMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Fullscreen Tile */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 hover:bg-white/20 text-white/70 hover:text-white rounded-xs transition-colors cursor-pointer"
            title="Toggle Fullscreen Video"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
