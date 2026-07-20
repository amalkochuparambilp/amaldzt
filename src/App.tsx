import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Menu, X, Cpu, Layers, Mail, BookOpen, Sparkles, Code2 } from 'lucide-react';

import Hero from './components/Hero';
import Projects from './components/Projects';
import Skills from './components/Skills';
import DZtEcosystem from './components/DZtEcosystem';
import TerminalComponent from './components/Terminal';
import Resume from './components/Resume';
import Contact from './components/Contact';
import { AMAL_INFO } from './data';

type Tab = 'home' | 'projects' | 'skills' | 'os' | 'resume' | 'contact';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSystemBooted, setIsSystemBooted] = useState(false);

  // Mock initial booting loader sequence to "make it gasp" right away
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSystemBooted(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleNavigate = (tab: string) => {
    setActiveTab(tab as Tab);
    setIsMobileMenuOpen(false);
    // Smooth scroll to top when changing tabs
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Sparkles },
    { id: 'projects', label: 'Projects', icon: Layers },
    { id: 'skills', label: 'Skills', icon: Cpu },
    { id: 'os', label: 'DZt OS', icon: Terminal },
    { id: 'resume', label: 'Resume', icon: BookOpen },
    { id: 'contact', label: 'Contact', icon: Mail }
  ];

  return (
    <div className="min-h-screen bg-cyber-dark text-gray-100 flex flex-col font-sans selection:bg-neon-cyan/25 selection:text-white relative overflow-x-hidden">
      
      {/* OS Booting Screen animation */}
      <AnimatePresence>
        {!isSystemBooted && (
          <motion.div 
            id="os-boot-loader"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="fixed inset-0 bg-[#050508] z-50 flex flex-col items-center justify-center p-4 font-mono text-xs text-neon-cyan space-y-4 select-none"
          >
            <div className="space-y-1 text-center">
              <p className="text-gray-600">--- DZT DIGITAL ECOSYSTEM BOOT SEQUENCE ---</p>
              <p className="animate-pulse text-sm font-semibold tracking-widest text-white mt-1">D Z T _ O S  v 1 . 4 . 2</p>
            </div>
            
            <div className="w-48 h-1 bg-cyber-border rounded-full overflow-hidden border border-cyber-border/40 relative">
              <motion.div 
                initial={{ left: '-100%' }}
                animate={{ left: '100%' }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full"
              />
            </div>

            <div className="text-[10px] text-gray-500 uppercase flex items-center gap-1.5 pt-4">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-ping" />
              <span>Initializing secure core kernels ...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Ambient grid layers */}
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none z-0" />
      
      {/* Print only Header (Hidden on screen) */}
      <div className="hidden print-only text-black p-4 font-mono text-xs border-b border-gray-300">
        AMAL K P // DZT ECOSYSTEM PORTFOLIO
      </div>

      {/* Global Navigation Header (Hidden on Print) */}
      <header className="sticky top-0 z-40 bg-cyber-dark/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-10 h-20 flex items-center justify-between no-print select-none">
        {/* Brand Logo - High Density Signature */}
        <button
          id="btn-nav-brand-logo"
          onClick={() => handleNavigate('home')}
          className="flex items-center gap-3 py-1 text-white hover:opacity-90 transition-all cursor-pointer text-left"
        >
          <div className="w-9 h-9 bg-white text-black flex items-center justify-center rounded-sm font-black text-lg shadow-sm">
            <span>A</span>
          </div>
          <div className="space-y-0.5">
            <span className="block font-display font-bold text-sm uppercase tracking-tight leading-none">Amal K P</span>
            <span className="block font-sans text-[9px] text-white/40 uppercase tracking-[0.1em] leading-none">Founder / Lead at DZt</span>
          </div>
        </button>

        {/* Desktop minimalist tab bar */}
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`tab-btn-${item.id}`}
                onClick={() => handleNavigate(item.id)}
                className={`px-4 py-2 border text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer relative ${
                  isActive 
                    ? 'text-white font-semibold bg-white/5 border-white/20 shadow-sm' 
                    : 'text-white/50 border-transparent hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-white/40'}`} />
                <span className="uppercase tracking-wider">{item.label}</span>
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

        {/* Quick launch terminal toggle */}
        <div className="flex items-center gap-3 no-print">
          <button
            id="btn-header-quick-terminal"
            onClick={() => handleNavigate('os')}
            className={`px-4 py-2 border text-xs font-mono transition-all items-center gap-1.5 hidden lg:flex cursor-pointer ${
              activeTab === 'os'
                ? 'bg-white/10 border-white text-white'
                : 'border-white/10 hover:border-white/30 text-white/60 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider">DZt_OS Console</span>
          </button>

          {/* Quick Resume Button */}
          <button
            onClick={() => handleNavigate('resume')}
            className="hidden sm:inline-block px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-colors cursor-pointer rounded-xs"
          >
            Resume
          </button>

          {/* Mobile hamburger menu toggle button */}
          <button
            id="btn-mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-sm border border-white/10 hover:bg-white/5 text-white/60 hover:text-white transition-all cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation (Hidden on Print) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-nav-drawer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-cyber-dark/95 border-b border-cyber-border/85 px-4 py-4 z-30 space-y-2 no-print relative"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`mobile-tab-btn-${item.id}`}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full px-4 py-3 rounded-lg text-sm font-mono flex items-center gap-3 transition-colors cursor-pointer ${
                    isActive 
                      ? 'bg-cyber-border/50 text-white border border-white/5' 
                      : 'text-gray-400 hover:bg-cyber-card/40 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-neon-cyan' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
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
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === 'home' && (
              <>
                <Hero onNavigate={handleNavigate} onLaunchTerminal={() => handleNavigate('os')} />
                <DZtEcosystem />
              </>
            )}
            {activeTab === 'projects' && (
              <Projects onLaunchTerminal={() => handleNavigate('os')} />
            )}
            {activeTab === 'skills' && (
              <Skills />
            )}
            {activeTab === 'os' && (
              <TerminalComponent />
            )}
            {activeTab === 'resume' && (
              <Resume />
            )}
            {activeTab === 'contact' && (
              <Contact />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Master Global Footer (Hidden on Print) */}
      <footer className="border-t border-cyber-border/80 py-8 px-4 text-center text-xs font-mono text-gray-500 no-print select-none">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="flex items-center justify-center gap-1">
            <span>© 2026</span>
            <span className="text-white font-medium">{AMAL_INFO.name}</span>
            <span>// Founder & Leader of DZt</span>
          </p>
          <div className="flex items-center gap-1 text-gray-600 text-[11px]">
            <Code2 className="w-3.5 h-3.5 text-neon-cyan" />
            <span>SYMMETRY // SIMPLICITY // SPEED</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
