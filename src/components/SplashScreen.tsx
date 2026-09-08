import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Cpu, Activity, Terminal, ArrowRight, Zap } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

interface DiagnosticStep {
  tag: string;
  label: string;
  detail: string;
  code: string;
}

const DIAGNOSTIC_STEPS: DiagnosticStep[] = [
  {
    tag: '01/04',
    label: 'Core Runtime & Cache',
    detail: 'Synchronizing client memory space and high-density UI assets',
    code: 'SYS_CORE_OK'
  },
  {
    tag: '02/04',
    label: 'DZt Ecosystem Services',
    detail: 'Binding MiniApp runtime, P2P network conduits & state engines',
    code: 'DZT_MESH_SYNC'
  },
  {
    tag: '03/04',
    label: 'Project & Telemetry Stack',
    detail: 'Indexing production archives, credentials & interactive modules',
    code: 'MODULES_READY'
  },
  {
    tag: '04/04',
    label: 'Workspace Verified',
    detail: 'Environment checks passed • Initializing interactive viewport',
    code: 'STABLE_ONLINE'
  }
];

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const handleFinish = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 400);
  }, [isExiting, onComplete]);

  // Keyboard shortcut listener to quickly enter workspace
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

  // Smooth engineered progress simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          handleFinish();
          return 100;
        }

        // Natural stepped progression with slight variable rate
        const increment = prev < 30 ? Math.floor(Math.random() * 12 + 10)
          : prev < 70 ? Math.floor(Math.random() * 14 + 12)
          : Math.floor(Math.random() * 18 + 14);

        const next = Math.min(prev + increment, 100);

        if (next >= 75) setActiveStep(3);
        else if (next >= 50) setActiveStep(2);
        else if (next >= 25) setActiveStep(1);
        else setActiveStep(0);

        return next;
      });
    }, 140);

    return () => clearInterval(interval);
  }, [handleFinish]);

  const current = DIAGNOSTIC_STEPS[activeStep] || DIAGNOSTIC_STEPS[0];

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          id="splash-screen-container"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.985, filter: 'blur(6px)' }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 bg-[#050608] text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden"
        >
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-cyan-500/[0.04] via-white/[0.02] to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

          {/* Corner Precision Technical Badges */}
          <div className="relative z-10 flex items-center justify-between w-full text-[10px] font-mono text-white/40 tracking-wider">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/70 font-semibold">AMAL.KP // SYS_SPEC</span>
              <span className="text-white/20 hidden sm:inline">|</span>
              <span className="hidden sm:inline text-white/40">DZt OS v2.6.4</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:flex items-center gap-1.5 text-white/40">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/80" />
                <span>TLS SECURE</span>
              </span>
              <span className="text-white/30 border border-white/10 px-2 py-0.5 rounded-xs">
                PROD BUILD
              </span>
            </div>
          </div>

          {/* Centerpiece: Identity & Loading Matrix */}
          <div className="relative z-10 max-w-md w-full mx-auto my-auto flex flex-col items-center text-center space-y-8">
            
            {/* Architectural Monogram Emblem */}
            <div className="relative group">
              {/* Outer Precision Reticle Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 28, ease: 'linear' }}
                className="absolute -inset-3.5 rounded-full border border-dashed border-white/15 pointer-events-none"
              />

              {/* Secondary Concentric Glow */}
              <div className="absolute -inset-1 rounded-sm bg-gradient-to-b from-white/20 via-transparent to-white/5 blur-sm opacity-50" />

              {/* Main Emblem Block */}
              <div className="relative w-20 h-20 bg-gradient-to-b from-neutral-900 to-black border border-white/20 rounded-sm flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.8)] overflow-hidden">
                {/* Internal light sweep */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
                
                {/* Monogram A with DZt geometry */}
                <span className="font-display font-black text-3xl tracking-tight text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                  A
                </span>

                {/* Micro accent corner pips */}
                <div className="absolute top-1 left-1 w-1 h-1 bg-white/40" />
                <div className="absolute top-1 right-1 w-1 h-1 bg-white/40" />
                <div className="absolute bottom-1 left-1 w-1 h-1 bg-white/40" />
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-white/40" />
              </div>

              {/* Sub-label badge */}
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-[#0d0e12] border border-white/20 px-2 py-0.5 rounded-2xs text-[9px] font-mono text-cyan-300 font-bold uppercase tracking-widest shadow-md">
                DZt
              </div>
            </div>

            {/* Typography Header */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-white/70 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Executive Portfolio & MiniApps</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-medium text-white tracking-[0.18em] uppercase">
                Amal K P
              </h1>
              <p className="text-xs text-white/50 font-mono tracking-wide max-w-xs mx-auto">
                BCA Candidate '26 • JNIAS Balagram • Founder @ DZt
              </p>
            </div>

            {/* Diagnostic Progress Container */}
            <div className="w-full bg-[#0c0d12]/90 border border-white/10 rounded-sm p-5 shadow-2xl backdrop-blur-md space-y-4 text-left">
              
              {/* Header Status & Percentage */}
              <div className="flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="text-cyan-400 font-bold">{current.tag}</span>
                  <span className="text-white/80 font-medium truncate">{current.label}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 font-bold text-white tracking-wider">
                  <span className="tabular-nums text-sm">{progress}</span>
                  <span className="text-[10px] text-white/50">%</span>
                </div>
              </div>

              {/* Precision Hairline Progress Bar */}
              <div className="relative w-full h-1.5 bg-black/80 rounded-full overflow-hidden border border-white/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-neutral-400 via-cyan-400 to-white relative"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: 'easeOut', duration: 0.15 }}
                >
                  {/* Glowing leading head */}
                  <div className="absolute right-0 top-0 bottom-0 w-2 bg-white shadow-[0_0_8px_#ffffff]" />
                </motion.div>
              </div>

              {/* Detail message & diagnostics */}
              <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] font-mono text-white/40">
                <div className="flex items-center gap-1.5 truncate max-w-[280px]">
                  <Activity className="w-3 h-3 text-cyan-400/80 shrink-0" />
                  <span className="truncate">{current.detail}</span>
                </div>
                <span className="text-white/60 font-semibold uppercase tracking-wider shrink-0 pl-2">
                  {current.code}
                </span>
              </div>

            </div>

            {/* Quick Skip Control */}
            <div className="flex items-center gap-3 pt-1">
              <button
                id="btn-skip-splash"
                type="button"
                onClick={handleFinish}
                className="group inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 rounded-xs text-xs font-mono text-white/80 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <span>Enter Workspace</span>
                <ArrowRight className="w-3.5 h-3.5 text-white/60 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

          </div>

          {/* Bottom Diagnostics Bar & Hotkey Hint */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-mono text-white/40 pt-4 border-t border-white/5">
            <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-white/50" />
                <span>REACT 18 + TYPESCRIPT</span>
              </span>
              <span className="hidden sm:inline text-white/20">•</span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-white/50" />
                <span>P2P ENCRYPTION ENGINE</span>
              </span>
              <span className="hidden sm:inline text-white/20">•</span>
              <span className="text-white/50">BALAGRAM, KERALA</span>
            </div>

            <div className="flex items-center gap-1.5 text-white/40">
              <span>Press</span>
              <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 rounded-2xs text-[9px] text-white/80 font-semibold font-mono">
                SPACE
              </kbd>
              <span>or</span>
              <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 rounded-2xs text-[9px] text-white/80 font-semibold font-mono">
                ESC
              </kbd>
              <span>to skip</span>
            </div>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
