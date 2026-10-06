import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import { ArrowRight, Cpu, FileText, Mail, UserCheck, Zap, Sparkles } from 'lucide-react';
import { AMAL_INFO } from '../data';
import HeroTelemetry from './HeroTelemetry';
import PartnershipMarquee from './PartnershipMarquee';
import { useGsapMagnetic, useGsap3DTilt } from '../utils/gsapTheme';

interface HeroProps {
  onNavigate: (tab: string) => void;
  onOpenGsapStudio?: () => void;
}

export default function Hero({ onNavigate, onOpenGsapStudio }: HeroProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const btnProjectsRef = useGsapMagnetic<HTMLButtonElement>(0.3);
  const btnAboutRef = useGsapMagnetic<HTMLButtonElement>(0.3);
  const btnResumeRef = useGsapMagnetic<HTMLButtonElement>(0.3);
  const btnContactRef = useGsapMagnetic<HTMLButtonElement>(0.3);

  const card1Ref = useGsap3DTilt<HTMLDivElement>(6);
  const card2Ref = useGsap3DTilt<HTMLDivElement>(6);
  const card3Ref = useGsap3DTilt<HTMLDivElement>(6);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.gsap-hero-title',
        { y: 35, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power4.out', stagger: 0.15 }
      );
      gsap.fromTo(
        '.gsap-hero-badge',
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.7)', stagger: 0.08, delay: 0.2 }
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <section ref={heroRef} className="relative py-12 md:py-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-12">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Status badges bar with GSAP branding */}
        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="gsap-hero-badge inline-flex items-center gap-2 px-3 py-1 bg-[#0ae448]/10 border border-[#0ae448]/30 rounded-xs text-[#0ae448] shadow-[0_0_12px_rgba(10,228,72,0.15)]">
            <span className="w-2 h-2 rounded-full bg-[#0ae448] shadow-[0_0_10px_#0ae448] animate-pulse" />
            <span className="font-semibold tracking-wide">GSAP THEME ACTIVE</span>
          </div>

          <div className="gsap-hero-badge inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-xs text-white/80">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AVAILABLE FOR COLLABORATIONS</span>
          </div>

          <div className="gsap-hero-badge inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-xs text-white/60">
            <Cpu className="w-3.5 h-3.5 text-[#0ae448]" />
            <span>JNIAS BALAGRAM (BCA 2026)</span>
          </div>

          <div className="gsap-hero-badge inline-flex items-center gap-2 px-3 py-1 border border-[#0ae448]/20 bg-[#0ae448]/5 text-[10px] uppercase tracking-widest text-[#0ae448] font-bold">
            Founder / Lead @ DZt
          </div>

          {onOpenGsapStudio && (
            <button
              onClick={onOpenGsapStudio}
              className="gsap-hero-badge ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#0ae448]/15 border border-[#0ae448]/40 hover:bg-[#0ae448] hover:text-black text-[#0ae448] rounded-xs text-[11px] font-mono font-semibold transition-all cursor-pointer shadow-[0_0_15px_rgba(10,228,72,0.2)]"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>GSAP Studio</span>
            </button>
          )}
        </motion.div>

        {/* Hero Display Typography */}
        <div className="space-y-4">
          <h1 className="gsap-hero-title text-4xl sm:text-6xl md:text-7xl font-display font-light leading-tight tracking-tight text-white">
            Crafting digital <span className="italic font-serif text-[#0ae448] drop-shadow-[0_0_20px_rgba(10,228,72,0.35)]">ecosystems</span> <br className="hidden sm:inline" />
            with precision & motion.
          </h1>

          <p className="gsap-hero-title text-gray-300 text-base sm:text-lg max-w-2xl font-sans font-light leading-relaxed">
            Hi, I'm <span className="text-white font-medium">{AMAL_INFO.name}</span>. Founder & Lead of DZt. A full-stack developer and BCA candidate building high-performance web systems, kinetic GSAP interfaces, and scalable peer-to-peer digital platforms.
          </p>
        </div>

        {/* Action button CTA cluster with GSAP Magnetic physics */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
          <button
            ref={btnProjectsRef}
            id="btn-hero-projects"
            onClick={() => onNavigate('projects')}
            className="w-full sm:w-auto min-h-[44px] px-6 py-3 bg-[#0ae448] text-black text-xs font-bold font-mono uppercase tracking-widest hover:bg-[#00ff87] transition-all flex items-center justify-center gap-2 cursor-pointer rounded-xs shadow-[0_0_25px_rgba(10,228,72,0.4)]"
          >
            <span>Explore Projects</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            ref={btnAboutRef}
            id="btn-hero-about"
            onClick={() => onNavigate('about')}
            className="w-full sm:w-auto min-h-[44px] px-6 py-3 border border-[#0ae448]/30 bg-[#0ae448]/5 text-white text-xs font-mono font-medium hover:bg-[#0ae448]/15 hover:border-[#0ae448] transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-xs"
          >
            <UserCheck className="w-4 h-4 text-[#0ae448]" />
            <span>About Me</span>
          </button>

          <button
            ref={btnResumeRef}
            id="btn-hero-resume"
            onClick={() => onNavigate('resume')}
            className="w-full sm:w-auto min-h-[44px] px-6 py-3 border border-white/10 hover:border-[#0ae448]/40 text-gray-300 hover:text-white text-xs font-mono transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-xs"
          >
            <FileText className="w-4 h-4 text-white/70" />
            <span>View CV</span>
          </button>

          <button
            ref={btnContactRef}
            id="btn-hero-contact"
            onClick={() => onNavigate('contact')}
            className="w-full sm:w-auto min-h-[44px] px-6 py-3 border border-white/10 hover:border-[#0ae448]/40 text-gray-400 hover:text-white text-xs font-mono transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-xs"
          >
            <Mail className="w-4 h-4 text-white/70" />
            <span>Get In Touch</span>
          </button>
        </motion.div>

        {/* Flagship DZt Core Ecosystem Highlights Strip with 3D Tilt */}
        <motion.div variants={itemVariants} className="pt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div 
            ref={card1Ref}
            onClick={() => onNavigate('projects')}
            className="p-4 bg-[#121415] border border-[#0ae448]/20 hover:border-[#0ae448]/70 hover:shadow-[0_0_25px_rgba(10,228,72,0.2)] rounded-xs transition-all cursor-pointer group space-y-1.5"
          >
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#0ae448] font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0ae448]" />
                01. LIBCODE JNIAS
              </span>
              <span className="text-white/40 group-hover:text-white transition-colors">PHP / MySQL</span>
            </div>
            <p className="text-xs text-white/80 font-mono">College Library Automation System with Barcode Scanning</p>
          </div>

          <div 
            ref={card2Ref}
            onClick={() => onNavigate('projects')}
            className="p-4 bg-[#121415] border border-white/10 hover:border-[#0ae448]/70 hover:shadow-[0_0_25px_rgba(10,228,72,0.2)] rounded-xs transition-all cursor-pointer group space-y-1.5"
          >
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-amber-400 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                02. BANK EXAM PORTAL
              </span>
              <span className="text-white/40 group-hover:text-white transition-colors">PHP / MySQL</span>
            </div>
            <p className="text-xs text-white/80 font-mono">Co-operative Bank Online Examination & Grading Engine</p>
          </div>

          <div 
            ref={card3Ref}
            onClick={() => onNavigate('projects')}
            className="p-4 bg-[#121415] border border-white/10 hover:border-[#0ae448]/70 hover:shadow-[0_0_25px_rgba(10,228,72,0.2)] rounded-xs transition-all cursor-pointer group space-y-1.5"
          >
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                03. HRDIYA HEALTH
              </span>
              <span className="text-white/40 group-hover:text-white transition-colors">Python / Django</span>
            </div>
            <p className="text-xs text-white/80 font-mono">Cardiac Disease Risk Analysis & Consultation Platform</p>
          </div>
        </motion.div>

        {/* Partnership and Colab Logo Marquee */}
        <motion.div variants={itemVariants} className="pt-2">
          <PartnershipMarquee onNavigate={onNavigate} />
        </motion.div>

        {/* Live Interactive Telemetry Dashboard */}
        <motion.div variants={itemVariants} className="pt-2">
          <HeroTelemetry />
        </motion.div>
      </motion.div>
    </section>
  );
}
