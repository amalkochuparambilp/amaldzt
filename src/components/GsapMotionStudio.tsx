import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { 
  Sparkles, 
  Zap, 
  Play, 
  RotateCcw, 
  Sliders, 
  Check, 
  X, 
  Activity, 
  Palette, 
  Eye, 
  Code,
  Gauge
} from 'lucide-react';
import { 
  GsapThemeConfig, 
  GSAP_EASING_PRESETS, 
  GSAP_PALETTES, 
  useGsapTicker 
} from '../utils/gsapTheme';

interface GsapMotionStudioProps {
  isOpen: boolean;
  onClose: () => void;
  config: GsapThemeConfig;
  onChangeConfig: (newConfig: Partial<GsapThemeConfig>) => void;
}

export default function GsapMotionStudio({
  isOpen,
  onClose,
  config,
  onChangeConfig
}: GsapMotionStudioProps) {
  const { fps } = useGsapTicker();
  const [selectedEase, setSelectedEase] = useState<string>(config.easing || 'power4.out');
  const [activeTab, setActiveTab] = useState<'easing' | 'palettes' | 'code'>('easing');

  // Animation playground demo targets
  const box1Ref = useRef<HTMLDivElement>(null);
  const box2Ref = useRef<HTMLDivElement>(null);
  const box3Ref = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const runGsapDemo = () => {
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    const tl = gsap.timeline();
    timelineRef.current = tl;

    // Reset initial positions
    gsap.set([box1Ref.current, box2Ref.current, box3Ref.current], { x: 0, rotation: 0, scale: 1 });
    gsap.set(textRef.current, { opacity: 0, y: 15 });

    // Choreograph with selected GSAP ease
    tl.to(box1Ref.current, {
      x: 120,
      rotation: 180,
      scale: 1.15,
      duration: 0.9 / config.speedMultiplier,
      ease: selectedEase,
    })
    .to(box2Ref.current, {
      x: 120,
      rotation: -180,
      scale: 1.15,
      duration: 0.9 / config.speedMultiplier,
      ease: selectedEase,
    }, '-=0.7')
    .to(box3Ref.current, {
      x: 120,
      rotation: 360,
      scale: 1.25,
      duration: 1.1 / config.speedMultiplier,
      ease: selectedEase,
    }, '-=0.6')
    .to(textRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power2.out',
    }, '-=0.4');
  };

  const resetGsapDemo = () => {
    if (timelineRef.current) {
      timelineRef.current.kill();
    }
    gsap.to([box1Ref.current, box2Ref.current, box3Ref.current], {
      x: 0,
      rotation: 0,
      scale: 1,
      duration: 0.5,
      ease: 'power3.out',
    });
    gsap.to(textRef.current, {
      opacity: 0,
      y: 15,
      duration: 0.3,
    });
  };

  // Run once when dialog opens or ease changes
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        runGsapDemo();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, selectedEase]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-[#0e1011] border border-[#0ae448]/30 shadow-[0_0_50px_rgba(10,228,72,0.18)] rounded-sm overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#131618]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xs bg-[#0ae448] text-black font-black flex items-center justify-center text-sm shadow-[0_0_12px_rgba(10,228,72,0.6)]">
              G
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  GSAP Motion Studio
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#0ae448]/20 text-[#0ae448] border border-[#0ae448]/40 rounded-xs font-semibold">
                  v3.12 Core
                </span>
              </div>
              <p className="text-[11px] text-white/50 font-mono">GreenSock Animation Platform Theme Controller</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Realtime FPS counter */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-black/60 border border-white/10 rounded-xs font-mono text-[11px] text-white/70">
              <Activity className="w-3.5 h-3.5 text-[#0ae448] animate-pulse" />
              <span>{fps} FPS</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-xs transition-colors cursor-pointer"
              aria-label="Close GSAP Motion Studio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center border-b border-white/10 px-5 bg-black/40 text-xs font-mono">
          <button
            onClick={() => setActiveTab('easing')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'easing'
                ? 'border-[#0ae448] text-white font-bold'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Interactive Easing</span>
          </button>

          <button
            onClick={() => setActiveTab('palettes')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'palettes'
                ? 'border-[#0ae448] text-white font-bold'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Color Palettes</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'code'
                ? 'border-[#0ae448] text-white font-bold'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>GSAP Code</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-sm font-sans">
          
          {/* Live Animation Interactive Stage */}
          <div className="p-4 bg-black/60 border border-[#0ae448]/20 rounded-xs space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                <Play className="w-3 h-3 text-[#0ae448]" />
                Live Tween Stage: <strong className="text-[#0ae448]">{selectedEase}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={runGsapDemo}
                  className="px-2.5 py-1 bg-[#0ae448] text-black text-[11px] font-bold font-mono uppercase tracking-wider hover:bg-[#00ff87] transition-colors rounded-xs flex items-center gap-1 cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Re-Play</span>
                </button>
                <button
                  onClick={resetGsapDemo}
                  className="px-2 py-1 bg-white/10 text-white text-[11px] font-mono hover:bg-white/20 transition-colors rounded-xs flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Animation Canvas */}
            <div className="h-28 bg-[#090b0c] border border-white/5 rounded-xs p-4 flex flex-col justify-center space-y-3 relative">
              <div className="flex items-center gap-4">
                <div 
                  ref={box1Ref}
                  className="w-10 h-10 rounded-xs bg-[#0ae448] text-black font-black font-mono text-xs flex items-center justify-center shadow-[0_0_15px_rgba(10,228,72,0.4)]"
                >
                  01
                </div>
                <div 
                  ref={box2Ref}
                  className="w-10 h-10 rounded-xs bg-white text-black font-black font-mono text-xs flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                >
                  02
                </div>
                <div 
                  ref={box3Ref}
                  className="w-10 h-10 rounded-xs border-2 border-[#0ae448] text-[#0ae448] font-black font-mono text-xs flex items-center justify-center shadow-[0_0_15px_rgba(10,228,72,0.3)]"
                >
                  03
                </div>
              </div>

              <div ref={textRef} className="opacity-0 font-mono text-xs text-[#0ae448] flex items-center gap-2">
                <Check className="w-3.5 h-3.5" />
                <span>Tween choreographed with <strong>{selectedEase}</strong></span>
              </div>
            </div>
          </div>

          {/* Tab Content: Easing */}
          {activeTab === 'easing' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono uppercase tracking-wider text-white/70">
                  Select GSAP Easing Curve
                </h4>
                <span className="text-[11px] font-mono text-white/40">
                  Click to preview instant kinetic response
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {GSAP_EASING_PRESETS.map((preset) => {
                  const isSelected = selectedEase === preset.name;
                  return (
                    <button
                      key={preset.name}
                      onClick={() => {
                        setSelectedEase(preset.name);
                        onChangeConfig({ easing: preset.name });
                      }}
                      className={`p-3 text-left border rounded-xs transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#0ae448]/10 border-[#0ae448] text-white shadow-[0_0_15px_rgba(10,228,72,0.2)]'
                          : 'bg-[#121415] border-white/10 text-white/70 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-white">
                          {preset.name}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#0ae448]" />}
                      </div>
                      <span className="text-[11px] text-white/50 mt-1">{preset.desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* Speed & Cursor settings */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/10">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-white/60">Animation Speed</span>
                    <span className="text-[#0ae448] font-bold">{config.speedMultiplier}x</span>
                  </div>
                  <div className="flex gap-2">
                    {[0.75, 1, 1.25, 1.5].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => onChangeConfig({ speedMultiplier: speed })}
                        className={`flex-1 py-1.5 text-xs font-mono border rounded-xs transition-colors cursor-pointer ${
                          config.speedMultiplier === speed
                            ? 'bg-[#0ae448] text-black font-bold border-[#0ae448]'
                            : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-white/60">GSAP Magnetic Cursor</span>
                    <span className="text-[#0ae448] font-bold">{config.cursorFollower ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <button
                    onClick={() => onChangeConfig({ cursorFollower: !config.cursorFollower })}
                    className={`w-full py-1.5 text-xs font-mono border rounded-xs transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                      config.cursorFollower
                        ? 'bg-[#0ae448]/15 border-[#0ae448] text-[#0ae448] font-semibold'
                        : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{config.cursorFollower ? 'Cursor Glow Active' : 'Enable Cursor Glow'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Palettes */}
          {activeTab === 'palettes' && (
            <div className="space-y-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-white/70">
                GSAP Accent Themes
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GSAP_PALETTES.map((palette) => {
                  const isSelected = config.accentColor === palette.hex;
                  return (
                    <button
                      key={palette.id}
                      onClick={() => {
                        onChangeConfig({ accentColor: palette.hex });
                        document.documentElement.style.setProperty('--gsap-primary', palette.hex);
                        document.documentElement.style.setProperty('--gsap-glow', palette.glow);
                      }}
                      className={`p-3 text-left border rounded-xs transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-white/10 border-white text-white'
                          : 'bg-[#121415] border-white/10 hover:border-white/30 text-white/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: palette.hex }}
                        />
                        <div>
                          <span className="text-xs font-bold font-mono block">{palette.name}</span>
                          <span className="text-[10px] text-white/40 font-mono">{palette.hex}</span>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab Content: GSAP Code */}
          {activeTab === 'code' && (
            <div className="space-y-3 font-mono text-xs">
              <span className="text-white/60 block">Production GSAP Code Snippet:</span>
              <pre className="p-4 bg-[#08090a] border border-[#0ae448]/30 rounded-xs text-[#0ae448] overflow-x-auto text-[11px] leading-relaxed">
{`// GSAP v3.12 Choreographed Micro-interaction
import gsap from 'gsap';

const tl = gsap.timeline({
  defaults: {
    duration: ${(0.8 / config.speedMultiplier).toFixed(2)},
    ease: "${selectedEase}"
  }
});

tl.from(".portfolio-card", {
  y: 40,
  opacity: 0,
  stagger: 0.08,
  clearProps: "all"
})
.to(".gsap-badge", {
  scale: 1.05,
  boxShadow: "0 0 20px rgba(10, 228, 72, 0.4)",
  repeat: 1,
  yoyo: true
});`}
              </pre>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-[#131618] flex items-center justify-between text-xs font-mono">
          <span className="text-white/40">
            Current Ease: <strong className="text-white">{selectedEase}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0ae448] text-black font-bold uppercase tracking-wider hover:bg-[#00ff87] transition-colors rounded-xs cursor-pointer shadow-[0_0_15px_rgba(10,228,72,0.3)]"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
