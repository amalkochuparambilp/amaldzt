import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ShieldCheck, Zap, Cpu, Terminal, ArrowRight, Volume2, VolumeX } from 'lucide-react';

interface DZtSplashScreenProps {
  onComplete: () => void;
  appName?: string;
}

export default function DZtSplashScreen({ onComplete, appName }: DZtSplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const steps = [
    { title: 'Initializing DZt Micro-Runtime & Cryptographic Core', tech: 'Web Crypto API • AES-256-GCM' },
    { title: 'Establishing WebRTC DataChannel & STUN Discovery Mesh', tech: 'RFC 8831 SCTP • Zero Cloud Storage' },
    { title: 'Mounting Sandboxed Micro-Applications & Diagnostic Tools', tech: 'Drop • LibCode • Hrdiya • BankExam • Subnet' },
    { title: 'Decentralized Workspace Ready — Launching Experience', tech: 'All Systems Operational' }
  ];

  // Play subtle synthesized audio cue
  const playChime = (freq: number = 440) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  useEffect(() => {
    const startTime = Date.now();
    const duration = 1600; // 1.6s smooth boot

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(Math.round((elapsed / duration) * 100), 100);
      setProgress(pct);

      if (pct < 30) {
        setStepIndex(0);
      } else if (pct < 60) {
        setStepIndex(1);
      } else if (pct < 90) {
        setStepIndex(2);
      } else {
        setStepIndex(3);
      }

      if (pct >= 100) {
        clearInterval(interval);
        playChime(880);
        setTimeout(() => {
          onComplete();
        }, 300);
      }
    }, 30);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        clearInterval(interval);
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 bg-[#050505] text-white flex flex-col justify-between p-6 sm:p-12 select-none overflow-hidden"
    >
      {/* Background Ambience & Cyber Grid */}
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Controls */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white text-black font-mono font-bold flex items-center justify-center text-sm rounded-xs shadow-md">
            DZt
          </div>
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-white block">
              DZt MiniApp OS
            </span>
            <span className="text-[10px] font-mono text-white/40 block">
              Decentralized Zone Technology • v2.6
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 text-white/50 hover:text-white transition-colors cursor-pointer rounded-xs hover:bg-white/5 border border-transparent hover:border-white/10"
            title={soundEnabled ? 'Mute boot sound' : 'Enable boot sound'}
            aria-label="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={onComplete}
            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-mono uppercase tracking-wider rounded-xs border border-white/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Skip Intro</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center Hero Monogram & Status */}
      <div className="relative z-10 max-w-lg mx-auto w-full text-center space-y-8">
        {/* Animated Brand Emblem */}
        <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
          {/* Pulsing Outer Rings */}
          <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping opacity-30" />
          <div className="absolute inset-2 rounded-full border border-white/20 animate-spin" style={{ animationDuration: '8s' }} />
          <div className="absolute inset-4 rounded-full border-2 border-dashed border-cyan-400/40 animate-spin" style={{ animationDuration: '14s', animationDirection: 'reverse' }} />
          
          {/* Core Monogram Plate */}
          <div className="w-16 h-16 bg-[#0c0c0c] border border-white/30 rounded-xs flex items-center justify-center shadow-2xl relative z-10 group">
            <span className="text-2xl font-black font-mono tracking-tighter text-white">
              DZ<span className="text-cyan-400">t</span>
            </span>
          </div>
        </div>

        {/* Title & App Label */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase tracking-widest px-3 py-1 bg-cyan-950/40 border border-cyan-800/40 rounded-xs">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>DZt MiniApp Runtime Environment</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white font-mono">
            {appName ? appName : 'Decentralized Applications Hub'}
          </h1>
          
          <p className="text-xs text-white/50 font-sans max-w-md mx-auto">
            Direct browser-to-browser P2P WebRTC data channels, high-precision engineering calculators, and productivity studios.
          </p>
        </div>

        {/* Progress Bar & Telemetry */}
        <div className="space-y-3 font-mono">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span className="truncate pr-2 text-left text-white/80">{steps[stepIndex].title}</span>
            <span className="tabular-nums font-bold text-cyan-400 shrink-0">{progress}%</span>
          </div>

          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden relative">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 via-white to-cyan-400"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'linear' }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-white/40 pt-1">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3 h-3 text-cyan-400" />
              <span className="truncate">{steps[stepIndex].tech}</span>
            </div>
            <span>Press Esc to skip</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer Diagnostics Bar */}
      <div className="relative z-10 border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-white/40">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-white/60">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>End-to-End DTLS Encrypted</span>
          </span>
          <span className="text-white/20">|</span>
          <span className="flex items-center gap-1.5 text-white/60">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Zero-Cloud P2P Mesh</span>
          </span>
        </div>

        <div className="text-white/30 text-center sm:text-right">
          Amal K P • BCA '26 • JNIAS Balagram
        </div>
      </div>
    </motion.div>
  );
}
