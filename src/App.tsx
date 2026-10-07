import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  X,
  Cpu,
  Layers,
  Mail,
  BookOpen,
  Sparkles,
  UserCheck,
  Handshake,
  Battery,
  BatteryCharging,
  LayoutGrid,
  Database,
  ArrowRight,
  Lock,
  ShieldCheck
} from 'lucide-react';

import Hero from './components/Hero';
import About from './components/About';
import Collaborate from './components/Collaborate';
import Projects from './components/Projects';
import Skills from './components/Skills';
import Resume from './components/Resume';
import Contact from './components/Contact';
import MiniApps from './components/MiniApps';
import CMSDashboard from './components/CMSDashboard';
import { useCMS } from './context/CMSContext';

type Tab = 'home' | 'about' | 'collaborate' | 'projects' | 'skills' | 'resume' | 'apps' | 'contact' | 'cms';

export default function App() {
  const { cms, isAuthenticated } = useCMS();
  const { profile, settings } = cms;

  const getInitialTab = (): Tab => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search;

      if (
        path.startsWith('/cms') ||
        path.startsWith('/admin') ||
        hash.startsWith('#cms') ||
        hash.startsWith('#admin')
      ) {
        return 'cms';
      }

      if (
        path.startsWith('/apps') ||
        path.startsWith('/miniapp') ||
        path.startsWith('/dzt-app') ||
        path.startsWith('/drop') ||
        path.startsWith('/share') ||
        path.startsWith('/send') ||
        path.startsWith('/files') ||
        hash.startsWith('#apps') ||
        hash.startsWith('#miniapp') ||
        hash.startsWith('#drop') ||
        hash.startsWith('#share') ||
        hash.includes('/apps') ||
        hash.includes('/drop') ||
        search.includes('room=') ||
        search.includes('app=')
      ) {
        return 'apps';
      }

      const cleanHash = hash.replace('#', '') as Tab;
      const validTabs: Tab[] = ['home', 'about', 'collaborate', 'projects', 'skills', 'resume', 'contact', 'cms'];
      if (validTabs.includes(cleanHash)) {
        return cleanHash;
      }
    }
    return 'home';
  };

  const getInitialApp = (): string | undefined => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const appParam = searchParams.get('app');
      if (appParam) return appParam;

      const path = window.location.pathname.toLowerCase();
      if (
        path.startsWith('/drop') ||
        path.startsWith('/share') ||
        path.startsWith('/send') ||
        path.startsWith('/files') ||
        path.startsWith('/p2p') ||
        window.location.hash.includes('drop') ||
        window.location.hash.includes('share')
      ) {
        return 'drop';
      }
    }
    return undefined;
  };

  const getInitialRoom = (): string | undefined => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const r = searchParams.get('room');
      if (r) return r;

      if (window.location.hash.includes('room=')) {
        const hashQuery = window.location.hash.split('?')[1];
        if (hashQuery) {
          const hashParams = new URLSearchParams(hashQuery);
          const hashRoom = hashParams.get('room');
          if (hashRoom) return hashRoom;
        }
      }

      const pathParts = window.location.pathname.split('/').filter(Boolean);
      const prefixes = ['drop', 'share', 'send'];
      if (prefixes.includes(pathParts[0]?.toLowerCase()) && pathParts[1]) {
        return pathParts[1];
      }
    }
    return undefined;
  };

  const [activeTab, setActiveTab] = useState<Tab>(getInitialTab);
  const [initialAppId, setInitialAppId] = useState<string | undefined>(getInitialApp);
  const [initialRoomId, setInitialRoomId] = useState<string | undefined>(getInitialRoom);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleRouteSync = () => {
      const tab = getInitialTab();
      const app = getInitialApp();
      const room = getInitialRoom();

      setActiveTab(tab);
      setInitialAppId(app);
      setInitialRoomId(room);
    };

    window.addEventListener('popstate', handleRouteSync);
    window.addEventListener('hashchange', handleRouteSync);
    return () => {
      window.removeEventListener('popstate', handleRouteSync);
      window.removeEventListener('hashchange', handleRouteSync);
    };
  }, []);

  const [batteryStatus, setBatteryStatus] = useState<{
    level: number | null;
    charging: boolean | null;
    supported: boolean;
  }>({
    level: null,
    charging: null,
    supported: false
  });

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
              supported: true
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

  const handleNavigate = (tab: string) => {
    let targetTab = tab as Tab;
    if (tab === 'miniapp' || tab === 'apps') {
      targetTab = 'apps';
      setInitialAppId(undefined);
    } else if (tab === 'admin' || tab === 'cms') {
      targetTab = 'cms';
    }

    setActiveTab(targetTab);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (targetTab === 'apps') {
      window.history.pushState(null, '', '/apps');
    } else if (targetTab === 'cms') {
      window.history.pushState(null, '', '/cms');
    } else {
      window.history.pushState(null, '', `/#${targetTab}`);
    }
  };

  const iconMap: Record<string, any> = {
    home: Sparkles,
    about: UserCheck,
    collaborate: Handshake,
    projects: Layers,
    skills: Cpu,
    resume: BookOpen,
    apps: LayoutGrid,
    contact: Mail
  };

  const visibleNavItems = settings.navConfig
    .filter((item) => item.visible !== false)
    .map((item) => ({
      id: item.id,
      label: item.label,
      icon: iconMap[item.id] || Sparkles,
      isLive: item.id === 'apps'
    }));

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] flex flex-col font-sans selection:bg-white/20 selection:text-white relative overflow-x-hidden">
      {/* Global Ambient grid background */}
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none z-0" />

      {/* Printable Header */}
      <div className="hidden print-only text-black p-4 font-mono text-xs border-b border-gray-300">
        {profile.name.toUpperCase()} // PORTFOLIO & RESUME DOCUMENT
      </div>

      {/* Optional Global Site Announcement Banner controlled by CMS */}
      {settings.announcementActive && settings.announcementText && (
        <div className="bg-emerald-950/80 border-b border-emerald-500/30 px-4 py-2 text-xs font-mono text-emerald-200 flex flex-wrap items-center justify-center gap-3 z-50 no-print">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{settings.announcementText}</span>
          {settings.announcementLinkTarget && (
            <button
              onClick={() => handleNavigate(settings.announcementLinkTarget)}
              className="text-white font-bold underline hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <span>{settings.announcementLinkText || 'Explore'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 xl:px-10 h-20 flex items-center justify-between no-print select-none gap-4">
        {/* Brand Logo */}
        <button
          id="btn-nav-brand-logo"
          onClick={() => handleNavigate('home')}
          className="flex items-center gap-3 py-1 text-white hover:opacity-90 transition-all cursor-pointer text-left glitch-hover group shrink-0 whitespace-nowrap"
        >
          <div className="w-9 h-9 bg-white text-black flex items-center justify-center rounded-sm font-black text-lg shadow-sm glitch-icon transition-transform group-hover:scale-105 shrink-0">
            <span>{profile.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="space-y-0.5">
            <h1 className="text-sm font-bold tracking-tight uppercase leading-none text-white flex items-center gap-1.5 whitespace-nowrap">
              <span>{profile.name}</span>
              <span className="text-[9px] font-mono text-white/30 border border-white/20 px-1 py-0.2 rounded-xs font-normal">
                DZt
              </span>
            </h1>
            <p className="text-[10px] text-white/40 tracking-[0.08em] uppercase leading-none whitespace-nowrap">
              BCA Candidate • JNIAS Balagram
            </p>
          </div>
        </button>

        {/* Desktop Minimalist Navigation Bar */}
        <nav className="hidden xl:flex items-center gap-1 2xl:gap-1.5">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`tab-btn-${item.id}`}
                onClick={() => handleNavigate(item.id)}
                className={`px-2.5 2xl:px-3 py-1.5 2xl:py-2 border text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer relative whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'text-white font-semibold bg-white/5 border-white/20 shadow-sm'
                    : 'text-white/50 border-transparent hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : item.isLive ? 'text-cyan-400' : 'text-white/40'}`} />
                <span className="uppercase tracking-wider">{item.label}</span>
                {item.isLive && (
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

          {/* Minimal Admin Button */}
          <button
            id="tab-btn-cms"
            onClick={() => handleNavigate('cms')}
            className={`px-2.5 2xl:px-3 py-1.5 2xl:py-2 border text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer relative whitespace-nowrap shrink-0 ${
              activeTab === 'cms'
                ? 'text-white font-semibold bg-white/5 border-white/20 shadow-sm'
                : 'text-white/50 border-transparent hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            <Lock className={`w-3.5 h-3.5 ${activeTab === 'cms' ? 'text-white' : 'text-white/40'}`} />
            <span className="uppercase tracking-wider">Admin</span>
            {activeTab === 'cms' && (
              <motion.span
                layoutId="active-tab-glow"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-white"
              />
            )}
          </button>
        </nav>

        {/* Header CTA Right */}
        <div className="flex items-center gap-2 sm:gap-3 no-print shrink-0">
          {settings.showBatteryTracker && (
            <div
              id="header-battery-tracker"
              className="flex items-center gap-2 px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-xs font-mono text-[11px] text-white/80 select-none hover:bg-white/10 transition-colors shrink-0 tabular-nums"
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
          )}

          <button
            id="btn-header-admin-compact"
            onClick={() => handleNavigate('cms')}
            className={`xl:hidden px-3 py-1.5 border text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer rounded-xs ${
              activeTab === 'cms'
                ? 'bg-white text-black border-white font-bold'
                : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/10'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>

          <button
            id="btn-nav-resume-pdf"
            onClick={() => handleNavigate('resume')}
            className="hidden sm:inline-block px-4 2xl:px-5 py-2 2xl:py-2.5 bg-white text-black text-xs font-bold font-mono uppercase tracking-widest hover:bg-white/90 transition-colors cursor-pointer rounded-xs glitch-button shrink-0 whitespace-nowrap"
          >
            Resume.pdf
          </button>

          {/* Navigation drawer toggle for screen sizes below 1280px */}
          <button
            id="btn-mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="xl:hidden min-w-[44px] min-h-[44px] p-2.5 rounded-sm border border-white/10 hover:bg-white/5 text-white/60 hover:text-white transition-all cursor-pointer flex items-center justify-center shrink-0"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Responsive Drawer Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="xl:hidden bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10 px-4 py-4 z-30 space-y-2 no-print relative"
          >
            {visibleNavItems.map((item) => {
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
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.isLive ? 'text-cyan-400' : 'text-white/40'}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.isLive && (
                    <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-xs border border-emerald-500/30">
                      P2P LIVE
                    </span>
                  )}
                </button>
              );
            })}
            <button
              onClick={() => handleNavigate('cms')}
              className={`w-full min-h-[44px] px-4 py-3 rounded-sm text-xs font-mono uppercase tracking-wider flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'cms'
                  ? 'bg-white/10 text-white border border-white/20 font-bold'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Lock className={`w-4 h-4 ${activeTab === 'cms' ? 'text-white' : 'text-white/40'}`} />
              <span className="flex-1 text-left">Admin</span>
            </button>
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
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === 'home' && <Hero onNavigate={handleNavigate} />}
            {activeTab === 'about' && <About />}
            {activeTab === 'collaborate' && <Collaborate onNavigate={handleNavigate} />}
            {activeTab === 'projects' && <Projects />}
            {activeTab === 'skills' && <Skills />}
            {activeTab === 'resume' && <Resume />}
            {activeTab === 'apps' && (
              <MiniApps
                initialAppId={initialAppId}
                initialRoomId={initialRoomId}
                onExitToHome={() => handleNavigate('home')}
              />
            )}
            {activeTab === 'contact' && <Contact />}
            {activeTab === 'cms' && (
              <CMSDashboard onExitToSite={(tab) => handleNavigate(tab || 'home')} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Sleek Minimalist Footer */}
      <footer
        id="portfolio-minimal-footer"
        className="py-5 px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between bg-[#080808] border-t border-white/10 gap-3 no-print select-none z-10"
      >
        <div className="flex items-center gap-6 text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">
          <a
            id="footer-link-github"
            href={profile.github}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            GitHub
          </a>
          <a
            id="footer-link-linkedin"
            href={profile.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            LinkedIn
          </a>
          <a id="footer-link-email" href={`mailto:${profile.email}`} className="hover:text-white transition-colors">
            Email
          </a>
        </div>
        <div className="text-[10px] uppercase tracking-[0.1em] text-white/30 text-center">
          © 2026 {profile.name} — Founder of DZt — All Rights Reserved
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-white/40 hidden md:flex">
          <span>{profile.ecosystemNode}</span>
          <span className="text-white/10">|</span>
          <span>{profile.buildVersion}</span>
        </div>
      </footer>
    </div>
  );
}
