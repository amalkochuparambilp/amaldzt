import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Cpu, ArrowRight, Sparkles, Terminal, Globe2, Radio, CheckCircle2 } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

interface TelemetryStep {
  index: string;
  phase: string;
  status: string;
  detail: string;
  metric: string;
}

const TELEMETRY_PHASES: TelemetryStep[] = [
  {
    index: '01',
    phase: 'CORE ARCHITECTURE',
    status: 'OPTIMIZED',
    detail: 'Initializing high-concurrency client state & shader caches',
    metric: '60 FPS / VSYNC'
  },
  {
    index: '02',
    phase: 'DZT P2P PROTOCOLS',
    status: 'SYNCED',
    detail: 'Binding WebRTC DataChannel relays & zero-knowledge keys',
    metric: 'AES-256-GCM'
  },
  {
    index: '03',
    phase: 'MINIAPP RUNTIMES',
    status: 'MOUNTED',
    detail: 'Preloading LibCode ERP, Bank Exam Portal & Hrdiya Hub',
    metric: '8 NODES READY'
  },
  {
    index: '04',
    phase: 'EXECUTIVE WORKSPACE',
    status: 'ONLINE',
    detail: 'Security verification complete • Launching portfolio console',
    metric: 'BALAGRAM NODE'
  }
];

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const handleFinish = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 450);
  }, [isExiting, onComplete]);

  // Global hotkey skip handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFinish]);

  // Luxury stepped progress animation with organic micro-delays
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          handleFinish();
          return 100;
        }

        const delta = prev < 25 ? Math.floor(Math.random() * 8 + 6)
          : prev < 60 ? Math.floor(Math.random() * 10 + 8)
          : prev < 90 ? Math.floor(Math.random() * 12 + 10)
          : 15;

        const next = Math.min(prev + delta, 100);

        if (next >= 85) setCurrentStepIndex(3);
        else if (next >= 55) setCurrentStepIndex(2);
        else if (next >= 25) setCurrentStepIndex(1);
        else setCurrentStepIndex(0);

        return next;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [handleFinish]);

  const activePhase = TELEMETRY_PHASES[currentStepIndex] || TELEMETRY_PHASES[0];

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          id="premium-splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.015, filter: 'blur(10px)' }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 bg-[#040405] text-[#EDEDED] flex flex-col justify-between p-6 sm:p-12 select-none overflow-hidden"
        >
          {/* Subtle Ambient Vignette & Mesh Backdrops */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.07),rgba(255,255,255,0))] pointer-events-none" />
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-500/[0.03] rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

          {/* Top Bar: Executive Telemetry & Security Header */}
          <div className="relative z-10 flex items-center justify-between w-full max-w-7xl mx-auto border-b border-white/[0.08] pb-4">
            {/* System Node Identifier */}
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse" />
              <div className="flex items-center gap-2 font-mono text-[11px] text-white/70 tracking-widest uppercase">
                <span className="font-bold text-white">AMAL K P</span>
                <span className="text-white/20">/</span>
                <span className="text-white/50">DZt ECOSYSTEM</span>
                <span className="text-white/20 hidden sm:inline">/</span>
                <span className="text-cyan-400 hidden sm:inline">v2.6.4 PROD</span>
              </div>
            </div>

            {/* Security Certification Chip */}
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-white/[0.03] border border-white/10 text-white/60">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>TLS SECURE CHANNEL</span>
              </div>
              <div className="px-2.5 py-1 rounded-xs bg-white/[0.05] border border-white/15 text-white/80 font-bold tracking-wider">
                NODE: BALAGRAM
              </div>
            </div>
          </div>

          {/* Center Stage: Monogram Emblem, Identity & Cinematic Gauge */}
          <div className="relative z-10 max-w-lg w-full mx-auto my-auto flex flex-col items-center text-center space-y-8 py-6">
            
            {/* Architectural Emblem with Dual Orbiting Rings */}
            <div className="relative flex items-center justify-center">
              {/* Outer Slow Orbit Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 32, ease: 'linear' }}
                className="absolute -inset-6 rounded-full border border-dashed border-white/[0.12] pointer-events-none"
              />

              {/* Inner Reverse Orbit Ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
                className="absolute -inset-3 rounded-full border border-dotted border-cyan-400/20 pointer-events-none"
              />

              {/* Monogram Core Plaque */}
              <div className="relative w-24 h-24 rounded-xs bg-gradient-to-b from-[#161618] to-[#080809] border border-white/20 p-2 shadow-[0_0_40px_rgba(0,0,0,0.9)] flex items-center justify-center overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-transparent to-white/5 pointer-events-none" />
                
                {/* Brand Logo image from /logos/logo.png with fallback */}
                <img
                  src="/logos/logo.png"
                  alt="Amal K P - DZt"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-2xs group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    const target = e.target as HTMLElement;
                    target.style.display = 'none';
                  }}
                />

                {/* Sub corner precision pips */}
                <div className="absolute top-1.5 left-1.5 w-1 h-1 bg-white/40" />
                <div className="absolute top-1.5 right-1.5 w-1 h-1 bg-white/40" />
                <div className="absolute bottom-1.5 left-1.5 w-1 h-1 bg-white/40" />
                <div className="absolute bottom-1.5 right-1.5 w-1 h-1 bg-white/40" />
              </div>
            </div>

            {/* Typography Identity Group */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[10px] font-mono text-white/70 uppercase tracking-[0.2em]">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Executive Digital Platform</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-display font-light text-white tracking-[0.22em] uppercase leading-none">
                Amal K P
              </h1>

              <p className="text-xs text-white/50 font-mono tracking-widest uppercase max-w-sm mx-auto">
                BCA Candidate '26 • JNIAS Balagram • Founder @ DZt
              </p>
            </div>

            {/* Step Progression Pillars */}
            <div className="grid grid-cols-4 gap-2 w-full pt-1">
              {TELEMETRY_PHASES.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div
                    key={step.index}
                    className={`p-2.5 rounded-xs border text-left transition-all duration-300 ${
                      isCurrent
                        ? 'bg-white/[0.08] border-white/40 shadow-sm'
                        : isPassed
                        ? 'bg-white/[0.03] border-white/20 opacity-80'
                        : 'bg-transparent border-white/5 opacity-30'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[9px]">
                      <span className={isCurrent ? 'text-cyan-400 font-bold' : 'text-white/40'}>
                        {step.index}
                      </span>
                      {isPassed && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                    </div>
                    <div className="text-[10px] font-mono font-bold text-white/90 truncate mt-1">
                      {step.phase.split(' ')[0]}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Precision Diagnostic Progress Deck */}
            <div className="w-full bg-[#0b0c10]/95 border border-white/10 rounded-xs p-5 shadow-2xl backdrop-blur-xl space-y-3.5 text-left">
              
              {/* Header Status & Percentage */}
              <div className="flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="text-cyan-400 font-bold">{activePhase.index} //</span>
                  <span className="text-white font-medium tracking-wide uppercase truncate">{activePhase.phase}</span>
                </div>
                <div className="flex items-baseline gap-0.5 shrink-0 font-bold text-white tracking-wider">
                  <span className="tabular-nums text-base">{progress}</span>
                  <span className="text-[10px] text-white/40">%</span>
                </div>
              </div>

              {/* Continuous Precision Hairline Progress Bar */}
              <div className="relative w-full h-1 bg-black/90 rounded-full overflow-hidden border border-white/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-white/40 via-cyan-400 to-white relative"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: 'easeOut', duration: 0.12 }}
                >
                  <div className="absolute right-0 top-0 bottom-0 w-3 bg-white shadow-[0_0_12px_#ffffff]" />
                </motion.div>
              </div>

              {/* Sub-status & Real-Time Parameter */}
              <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] font-mono text-white/50">
                <div className="flex items-center gap-2 truncate max-w-[280px]">
                  <Terminal className="w-3 h-3 text-cyan-400/80 shrink-0" />
                  <span className="truncate">{activePhase.detail}</span>
                </div>
                <span className="text-emerald-400 font-semibold uppercase tracking-wider shrink-0 pl-2">
                  {activePhase.metric}
                </span>
              </div>

            </div>

            {/* Instant Entrance Button */}
            <div className="flex items-center justify-center pt-1">
              <button
                id="btn-enter-workspace"
                type="button"
                onClick={handleFinish}
                className="group px-6 py-2.5 bg-white text-black hover:bg-white/90 rounded-xs text-xs font-mono font-bold uppercase tracking-widest transition-all cursor-pointer shadow-lg active:scale-95 flex items-center gap-2"
              >
                <span>Enter Workspace</span>
                <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>

          {/* Bottom Bar: System Architecture & Hotkey Tips */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-mono text-white/40 pt-4 border-t border-white/[0.08] max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
              <span className="flex items-center gap-1.5 text-white/60">
                <Cpu className="w-3.5 h-3.5 text-white/40" />
                <span>REACT 19 + TYPESCRIPT</span>
              </span>
              <span className="hidden sm:inline text-white/20">|</span>
              <span className="flex items-center gap-1.5 text-white/60">
                <Radio className="w-3.5 h-3.5 text-white/40" />
                <span>WEBRTC ENCRYPTED MESH</span>
              </span>
              <span className="hidden sm:inline text-white/20">|</span>
              <span className="flex items-center gap-1.5 text-white/60">
                <Globe2 className="w-3.5 h-3.5 text-white/40" />
                <span>BALAGRAM, KERALA</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-white/50">
              <span>Press</span>
              <kbd className="px-2 py-0.5 bg-white/10 border border-white/20 rounded-2xs text-[9px] text-white font-mono font-bold shadow-xs">
                SPACE
              </kbd>
              <span>or</span>
              <kbd className="px-2 py-0.5 bg-white/10 border border-white/20 rounded-2xs text-[9px] text-white font-mono font-bold shadow-xs">
                ESC
              </kbd>
              <span>to bypass</span>
            </div>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
