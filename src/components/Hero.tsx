import { motion } from 'motion/react';
import { ArrowRight, Cpu, FileText, Mail, UserCheck } from 'lucide-react';
import { AMAL_INFO } from '../data';
import HeroTelemetry from './HeroTelemetry';

interface HeroProps {
  onNavigate: (tab: string) => void;
}

export default function Hero({ onNavigate }: HeroProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <section className="relative py-12 md:py-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-12">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Status badges bar */}
        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
            <span className="text-white/90">AVAILABLE FOR COLLABORATIONS</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-sm text-white/60">
            <Cpu className="w-3.5 h-3.5 text-white" />
            <span>JNIAS BALAGRAM (BCA 2026)</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/20 text-[10px] uppercase tracking-widest text-white/80">
            Founder / Lead @ DZt
          </div>
        </motion.div>

        {/* Hero Display Typography */}
        <div className="space-y-4">
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-6xl md:text-7xl font-display font-light leading-tight tracking-tight text-white"
          >
            Crafting digital <span className="italic font-serif text-white/95">ecosystems</span> <br className="hidden sm:inline" />
            with precision & purpose.
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-gray-400 text-base sm:text-lg max-w-2xl font-sans font-light leading-relaxed"
          >
            Hi, I'm <span className="text-white font-medium">{AMAL_INFO.name}</span>. Founder & Lead of DZt. A full-stack developer and BCA candidate passionate about building high-performance web systems, intuitive interfaces, and scalable digital platforms.
          </motion.p>
        </div>

        {/* Action button CTA cluster */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
          <button
            id="btn-hero-projects"
            onClick={() => onNavigate('projects')}
            className="w-full sm:w-auto min-h-[44px] px-6 py-3 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-xs"
          >
            <span>Explore Projects</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="btn-hero-about"
            onClick={() => onNavigate('about')}
            className="w-full sm:w-auto min-h-[44px] px-6 py-3 border border-white/20 bg-white/5 text-white text-xs font-mono font-medium hover:bg-white/10 hover:border-white/40 transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-xs"
          >
            <UserCheck className="w-4 h-4" />
            <span>About Me</span>
          </button>

          <button
            id="btn-hero-resume"
            onClick={() => onNavigate('resume')}
            className="w-full sm:w-auto min-h-[44px] px-6 py-3 border border-white/10 text-gray-300 hover:text-white text-xs font-mono transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-xs"
          >
            <FileText className="w-4 h-4" />
            <span>View CV</span>
          </button>

          <button
            id="btn-hero-contact"
            onClick={() => onNavigate('contact')}
            className="w-full sm:w-auto min-h-[44px] px-6 py-3 border border-white/10 text-gray-400 hover:text-white text-xs font-mono transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-xs"
          >
            <Mail className="w-4 h-4" />
            <span>Get In Touch</span>
          </button>
        </motion.div>

        {/* Flagship DZt Core Ecosystem Highlights Strip */}
        <motion.div variants={itemVariants} className="pt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div 
            onClick={() => onNavigate('projects')}
            className="p-3.5 bg-white/5 border border-white/10 hover:border-white/30 rounded-xs transition-all cursor-pointer group space-y-1"
          >
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-emerald-400 font-bold">01. LIBCODE JNIAS</span>
              <span className="text-white/40 group-hover:text-white transition-colors">PHP / MySQL</span>
            </div>
            <p className="text-xs text-white/80 font-mono">College Library Automation System with Barcode Scanning</p>
          </div>

          <div 
            onClick={() => onNavigate('projects')}
            className="p-3.5 bg-white/5 border border-white/10 hover:border-white/30 rounded-xs transition-all cursor-pointer group space-y-1"
          >
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-amber-400 font-bold">02. BANK EXAM PORTAL</span>
              <span className="text-white/40 group-hover:text-white transition-colors">PHP / MySQL</span>
            </div>
            <p className="text-xs text-white/80 font-mono">Co-operative Bank Online Examination & Grading Engine</p>
          </div>

          <div 
            onClick={() => onNavigate('projects')}
            className="p-3.5 bg-white/5 border border-white/10 hover:border-white/30 rounded-xs transition-all cursor-pointer group space-y-1"
          >
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-cyan-400 font-bold">03. HRDIYA HEALTH</span>
              <span className="text-white/40 group-hover:text-white transition-colors">Python / Django</span>
            </div>
            <p className="text-xs text-white/80 font-mono">Cardiac Disease Risk Analysis & Consultation Platform</p>
          </div>
        </motion.div>

        {/* Live Interactive Telemetry Dashboard */}
        <motion.div variants={itemVariants} className="pt-2">
          <HeroTelemetry />
        </motion.div>
      </motion.div>
    </section>
  );
}
