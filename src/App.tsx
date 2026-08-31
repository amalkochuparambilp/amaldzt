import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Cpu, Layers, Mail, BookOpen, Sparkles, Brain, Bot, Zap, Activity, UserCheck, Handshake, Battery, BatteryCharging, Video, Radio } from 'lucide-react';

import Hero from './components/Hero';
import About from './components/About';
import Collaborate from './components/Collaborate';
import Projects from './components/Projects';
import Skills from './components/Skills';
import Resume from './components/Resume';
import Contact from './components/Contact';
import VideoCallRoom from './components/vc/VideoCallRoom';
import { AMAL_INFO } from './data';

type Tab = 'home' | 'about' | 'collaborate' | 'projects' | 'skills' | 'resume' | 'contact' | 'vc';

export default function App() {
  const getInitialTab = (): Tab => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search;
      if (path.startsWith('/vc') || hash.startsWith('#vc') || hash.includes('/vc') || search.includes('room=')) {
        return 'vc';
      }
    }
    return 'home';
  };

  const getInitialRoom = (): string | undefined => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const r = searchParams.get('room');
      if (r) return r;

      // Also check hash query params like #vc?room=abc or #/vc?room=abc
      if (window.location.hash.includes('room=')) {
        const hashQuery = window.location.hash.split('?')[1];
        if (hashQuery) {
          const hashParams = new URLSearchParams(hashQuery);
          const hashRoom = hashParams.get('room');
          if (hashRoom) return hashRoom;
        }
      }

      const pathParts = window.location.pathname.split('/').filter(Boolean);
      if (pathParts[0] === 'vc' && pathParts[1]) {
        return pathParts[1];
      }
    }
    return undefined;
  };

  const initialTabState = getInitialTab();
  const [activeTab, setActiveTab] = useState<Tab>(initialTabState);
  const [initialRoomId, setInitialRoomId] = useState<string | undefined>(getInitialRoom);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // If user opens a direct VC link, boot immediately
  const [isSystemBooted, setIsSystemBooted] = useState<boolean>(() => initialTabState === 'vc');
  const [bootProgress, setBootProgress] = useState<number>(() => initialTabState === 'vc' ? 100 : 0);
  const [bootStep, setBootStep] = useState(0);

  const [batteryStatus, setBatteryStatus] = useState<{
    level: number | null;
    charging: boolean | null;
    supported: boolean;
  }>({
    level: null,
    charging: null,
    supported: false,
  });

  const bootLogs = [
    { label: 'LIBRARY CORE', text: 'Initializing LibCode JNIAS Database & Barcode Engines...' },
    { label: 'P2P WEBRTC', text: 'Binding /vc Mesh Video Signaling Socket & STUN Gateways...' },
    { label: 'EXAM PLATFORM', text: 'Syncing Co-operative Bank Testing Suite & Hrdiya Hub...' },
    { label: 'SYSTEM READY', text: 'Launching Amal K P DZt Digital Workspace & VC Suite...' }
  ];

  // URL sync and popstate listener
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search;
      const hash = window.location.hash.toLowerCase();

      if (path.startsWith('/vc') || hash.startsWith('#vc') || hash.includes('/vc') || search.includes('room=')) {
        setActiveTab('vc');
        setIsSystemBooted(true);
        const room = getInitialRoom();
        if (room) setInitialRoomId(room);
      } else {
        const cleanHash = window.location.hash.replace('#', '') as Tab;
        const validTabs: Tab[] = ['home', 'about', 'collaborate', 'projects', 'skills', 'resume', 'contact', 'vc'];
        if (validTabs.includes(cleanHash)) {
          setActiveTab(cleanHash);
        } else {
          setActiveTab('home');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setBootProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => setIsSystemBooted(true), 300);
          return 100;
        }
        const next = prev + Math.floor(Math.random() * 18 + 12);
        if (next > 25 && next <= 50) setBootStep(1);
        if (next > 50 && next <= 75) setBootStep(2);
        if (next > 75) setBootStep(3);
        return Math.min(next, 100);
      });
    }, 160);

    return () => clearInterval(progressInterval);
  }, []);

  // Battery Status API listener for real-time tracking
  useEffect(() => {
    let batteryObj: any = null;

    const initBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          // @ts-ignore
          batteryObj = await navigator.getBattery();
          const update = () => {
            setBatteryStatus({
              level: Math.round(batteryObj.level * 100),
              charging: batteryObj.charging,
              supported: true,
            });
          };
          update();
          batteryObj.addEventListener('levelchange', update);
          batteryObj.addEventListener('chargingchange', update);
        } catch {
          setBatteryStatus({ level: 100, charging: true, supported: false });
        }
      } else {
        setBatteryStatus({ level: 100, charging: true, supported: false });
      }
    };

    initBattery();
  }, []);

  const handleNavigate = (tab: string, customRoomId?: string) => {
    const targetTab = tab as Tab;
    setActiveTab(targetTab);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (targetTab === 'vc') {
      if (customRoomId) {
        setInitialRoomId(customRoomId);
        window.history.pushState(null, '', `/vc?room=${encodeURIComponent(customRoomId)}`);
      } else {
        const search = window.location.search;
        const targetUrl = search.includes('room=') ? `/vc${search}` : '/vc';
        window.history.pushState(null, '', targetUrl);
      }
    } else {
      window.history.pushState(null, '', `/#${targetTab}`);
    }
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Sparkles },
    { id: 'about', label: 'About', icon: UserCheck },
    { id: 'collaborate', label: 'Collaborate', icon: Handshake },
    { id: 'projects', label: 'Projects', icon: Layers },
    { id: 'skills', label: 'Skills', icon: Cpu },
    { id: 'resume', label: 'Resume', icon: BookOpen },
    { id: 'vc', label: 'VC Room', icon: Video, isLive: true },
    { id: 'contact', label: 'Contact', icon: Mail }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] flex flex-col font-sans selection:bg-white/20 selection:text-white relative overflow-x-hidden">
      
      {/* Tech & AI Level Bootscreen Loader Animation */}
      <AnimatePresence>
        {!isSystemBooted && (
          <motion.div 
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="fixed inset-0 bg-[#050505] z-50 flex flex-col items-center justify-center p-6 font-mono text-xs text-white select-none overflow-hidden"
          >
            {/* Ambient Background Tech Grid & Pulse */}
            <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
            <div className="absolute w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-3xl pointer-events-none animate-pulse" />

            <div className="relative z-10 max-w-lg w-full bg-[#0a0a0a] border border-white/15 rounded-sm p-6 sm:p-8 space-y-6 shadow-2xl">
              
              {/* Header HUD Bar */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 text-[10px] text-white/50">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-white animate-pulse" />
                  <span className="font-bold uppercase tracking-widest text-white">AMAL_AI_KERNEL_BOOT</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>LATENCY: 1.2ms</span>
                </div>
              </div>

              {/* Central Visual Neural Radar */}
              <div className="flex flex-col items-center justify-center py-4 relative">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
                    className="absolute inset-0 rounded-full border border-dashed border-white/30"
                  />
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                    className="w-16 h-16 rounded-full bg-white/5 border border-white/20 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                  >
                    <Bot className="w-8 h-8 text-white" />
                  </motion.div>
                </div>
                <div className="mt-3 text-center space-y-0.5">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 block">AI INITIALIZATION SEQUENCE</span>
                  <span className="text-xl font-bold tracking-widest text-white font-display">
                    {bootProgress}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono text-white/50 uppercase">
                  <span>Progress</span>
                  <span>{bootProgress < 100 ? 'Compiling Weights...' : 'Boot Complete'}</span>
                </div>
                <div className="w-full h-1.5 bg-black border border-white/10 rounded-xs overflow-hidden p-0.5">
                  <motion.div 
                    className="h-full bg-white"
                    style={{ width: `${bootProgress}%` }}
                    transition={{ ease: 'easeOut', duration: 0.2 }}
                  />
                </div>
              </div>

              {/* Telemetry Step Log Display */}
              <div className="bg-black/60 border border-white/10 p-3 rounded-xs font-mono text-[11px] space-y-1.5">
                <div className="flex items-center justify-between text-[9px] text-white/30 uppercase tracking-wider pb-1 border-b border-white/5">
                  <span>Log Channel 01</span>
                  <span className="text-emerald-400">ACTIVE</span>
                </div>
                <div className="text-white font-medium flex items-start gap-2">
                  <Zap className="w-3.5 h-3.5 text-white/70 flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest block">
                      [{bootLogs[bootStep].label}]
                    </span>
                    <span className="text-white text-xs leading-tight block">
                      {bootLogs[bootStep].text}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer System Spec Bar */}
              <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[9px] text-white/40 uppercase tracking-widest">
                <span>JNIAS_BALAGRAM_NODE</span>
                <span>STATUS: OPERATIONAL</span>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Ambient grid background */}
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none z-0" />

      {/* Printable Header */}
      <div className="hidden print-only text-black p-4 font-mono text-xs border-b border-gray-300">
        AMAL K P // PORTFOLIO & RESUME DOCUMENT
      </div>

      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-10 h-20 flex items-center justify-between no-print select-none">
        {/* Brand Logo - High Density Signature with Glitch Hover */}
        <button
          id="btn-nav-brand-logo"
          onClick={() => handleNavigate('home')}
          className="flex items-center gap-3 py-1 text-white hover:opacity-90 transition-all cursor-pointer text-left glitch-hover group"
        >
          <div className="w-9 h-9 bg-white text-black flex items-center justify-center rounded-sm font-black text-lg shadow-sm glitch-icon transition-transform group-hover:scale-105">
            <span>A</span>
          </div>
          <div className="space-y-0.5">
            <h1 className="text-sm font-bold tracking-tight uppercase leading-none text-white flex items-center gap-1.5">
              <span>Amal K P</span>
              <span className="text-[9px] font-mono text-white/30 border border-white/20 px-1 py-0.2 rounded-xs font-normal">DZt</span>
            </h1>
            <p className="text-[10px] text-white/40 tracking-[0.1em] uppercase leading-none">BCA Candidate • JNIAS Balagram</p>
          </div>
        </button>

        {/* Desktop Minimalist Navigation Bar */}
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`tab-btn-${item.id}`}
                onClick={() => handleNavigate(item.id)}
                className={`px-3.5 py-2 border text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer relative ${
                  isActive 
                    ? 'text-white font-semibold bg-white/5 border-white/20 shadow-sm' 
                    : 'text-white/50 border-transparent hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : item.id === 'vc' ? 'text-cyan-400' : 'text-white/40'}`} />
                <span className="uppercase tracking-wider">{item.label}</span>
                {item.id === 'vc' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                )}
                {isActive && (
                  <motion.span 
                    layoutId="active-tab-glow"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-white"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Header CTA Right */}
        <div className="flex items-center gap-3 no-print">
          {/* Header Battery Status Tracker */}
          <div 
            id="header-battery-tracker"
            className="flex items-center gap-2 px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-xs font-mono text-[11px] text-white/80 select-none hover:bg-white/10 transition-colors"
            title={batteryStatus.charging ? 'Battery: Charging' : 'Battery: Discharging'}
          >
            {batteryStatus.charging ? (
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            ) : (
              <Battery className="w-3.5 h-3.5 text-white/70" />
            )}
            <span className="font-bold">{batteryStatus.level !== null ? `${batteryStatus.level}%` : '100%'}</span>
            {batteryStatus.charging && (
              <span className="hidden sm:inline-block text-[9px] font-semibold text-emerald-400 bg-emerald-500/20 px-1 py-0.2 rounded-2xs border border-emerald-500/30">
                CHG
              </span>
            )}
          </div>

          <div className="hidden lg:flex items-center text-right pr-1">
            <div>
              <span className="block text-[10px] text-white/30 uppercase tracking-widest font-mono">Ecosystem</span>
              <span className="text-xs font-medium tracking-tight text-white">Founder / Lead at <span className="italic font-serif">DZt</span></span>
            </div>
          </div>

          <button
            id="btn-nav-resume-pdf"
            onClick={() => handleNavigate('resume')}
            className="hidden sm:inline-block px-5 py-2.5 bg-white text-black text-xs font-bold font-mono uppercase tracking-widest hover:bg-white/90 transition-colors cursor-pointer rounded-xs glitch-button"
          >
            Resume.pdf
          </button>

          {/* Mobile hamburger menu toggle */}
          <button
            id="btn-mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden min-w-[44px] min-h-[44px] p-2.5 rounded-sm border border-white/10 hover:bg-white/5 text-white/60 hover:text-white transition-all cursor-pointer flex items-center justify-center"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10 px-4 py-4 z-30 space-y-2 no-print relative"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full min-h-[44px] px-4 py-3 rounded-sm text-xs font-mono uppercase tracking-wider flex items-center gap-3 transition-colors cursor-pointer ${
                    isActive 
                      ? 'bg-white/10 text-white border border-white/20 font-bold' 
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.id === 'vc' ? 'text-cyan-400' : 'text-white/40'}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.id === 'vc' && (
                    <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-xs border border-emerald-500/30">
                      P2P LIVE
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Dynamic Workspace Frame */}
      <main className="flex-1 z-10 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === 'home' && (
              <Hero onNavigate={handleNavigate} />
            )}
            {activeTab === 'about' && (
              <About />
            )}
            {activeTab === 'collaborate' && (
              <Collaborate onNavigate={handleNavigate} />
            )}
            {activeTab === 'projects' && (
              <Projects />
            )}
            {activeTab === 'skills' && (
              <Skills />
            )}
            {activeTab === 'resume' && (
              <Resume />
            )}
            {activeTab === 'vc' && (
              <VideoCallRoom initialRoomId={initialRoomId} onExit={() => handleNavigate('home')} />
            )}
            {activeTab === 'contact' && (
              <Contact />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="h-20 px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between bg-[#080808] border-t border-white/10 gap-4 no-print select-none">
        <div className="flex gap-6 text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">
          <a href={AMAL_INFO.github} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
          <a href={AMAL_INFO.linkedin} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">LinkedIn</a>
          <a href={`mailto:${AMAL_INFO.email}`} className="hover:text-white transition-colors">Email</a>
        </div>
        <div className="text-[10px] uppercase tracking-[0.1em] text-white/30 text-center">
          © 2026 {AMAL_INFO.name} — Founder of DZt — All Rights Reserved
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-white/40 hidden md:flex">
          <span>BALAGRAM_NODE</span>
          <span className="text-white/10">|</span>
          <span>STABLE_BUILD_v2.0</span>
        </div>
      </footer>

    </div>
  );
}
