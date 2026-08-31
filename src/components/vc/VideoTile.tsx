import { useEffect, useRef, useState } from 'react';
import { 
  Mic, 
  MicOff, 
  VideoOff, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Hand, 
  Tv, 
  Signal, 
  User
} from 'lucide-react';
import { VCPeer } from '../../types';

interface VideoTileProps {
  key?: string;
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
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTileMuted, setIsTileMuted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

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
      className={`relative w-full h-full min-h-[220px] sm:min-h-[280px] bg-[#0c0c0e] rounded-sm overflow-hidden border transition-all flex flex-col items-center justify-center group ${
        isSpeaking && !isAudioMuted
          ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
          : isHandRaised
          ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.25)]'
          : 'border-white/15 hover:border-white/30'
      }`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal || isTileMuted}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isVideoMuted ? 'opacity-0' : 'opacity-100'
        } ${isLocal && !isScreenSharing ? 'scale-x-[-1]' : ''}`}
      />

      {/* Video Paused / Avatar Placeholder */}
      {isVideoMuted && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d0d10] text-white p-6 space-y-3 select-none">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-bold font-mono uppercase text-white shadow-xl">
              {displayName.charAt(0) || <User className="w-8 h-8" />}
            </div>
            {isSpeaking && !isAudioMuted && (
              <div className="absolute -inset-1 rounded-full border-2 border-emerald-400 animate-ping opacity-75 pointer-events-none" />
            )}
          </div>
          <div className="text-center">
            <span className="text-sm font-semibold tracking-wide block">{displayName}</span>
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
              {isVideoMuted ? 'Camera Inactive' : 'Ready'}
            </span>
          </div>
        </div>
      )}

      {/* Top HUD Badges */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
        {/* Name & Role Badge */}
        <div className="flex items-center gap-2 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-xs border border-white/15 text-xs font-mono text-white pointer-events-auto">
          {isScreenSharing ? (
            <Tv className="w-3.5 h-3.5 text-cyan-400" />
          ) : (
            <div className={`w-2 h-2 rounded-full ${isLocal ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
          )}
          <span className="font-semibold text-[11px] truncate max-w-[130px] sm:max-w-[200px]">
            {displayName} {isLocal ? '(You)' : ''}
          </span>
          {isScreenSharing && (
            <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1 py-0.2 rounded-2xs border border-cyan-500/30 uppercase">
              Screen
            </span>
          )}
        </div>

        {/* Status Indicators (Hand Raised, Connection, Mute) */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {isHandRaised && (
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/90 text-black font-bold text-[10px] font-mono rounded-xs animate-bounce shadow-lg">
              <Hand className="w-3 h-3" />
              <span>HAND RAISED</span>
            </div>
          )}

          {!isLocal && connectionState && connectionState !== 'connected' && (
            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-[10px] font-mono rounded-xs">
              <Signal className="w-3 h-3 animate-pulse" />
              <span className="uppercase">{connectionState}</span>
            </div>
          )}

          {isAudioMuted ? (
            <div className="w-7 h-7 bg-red-500/90 text-white rounded-xs flex items-center justify-center shadow-md">
              <MicOff className="w-3.5 h-3.5" />
            </div>
          ) : (
            <div className="w-7 h-7 bg-black/75 backdrop-blur-md border border-white/15 text-white/80 rounded-xs flex items-center justify-center">
              <Mic className={`w-3.5 h-3.5 ${isSpeaking ? 'text-emerald-400' : 'text-white/60'}`} />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Audio Level Indicator & Tile Quick Controls */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Audio Visualizer Bar */}
        <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md px-2 py-1 rounded-xs border border-white/15">
          <div className="flex items-end gap-0.5 h-3 w-8">
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
          <span className="text-[9px] font-mono text-white/50 uppercase ml-1">
            {isAudioMuted ? 'Muted' : isSpeaking ? 'Audio In' : 'Silent'}
          </span>
        </div>

        {/* Quick Tile Actions */}
        <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md p-1 rounded-xs border border-white/15">
          {!isLocal && (
            <button
              onClick={() => setIsTileMuted(!isTileMuted)}
              className="p-1.5 hover:bg-white/20 text-white/70 hover:text-white rounded-xs transition-colors cursor-pointer"
              title={isTileMuted ? 'Unmute Audio' : 'Mute Audio for me'}
            >
              {isTileMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-1.5 hover:bg-white/20 text-white/70 hover:text-white rounded-xs transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
