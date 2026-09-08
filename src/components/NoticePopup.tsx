import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, X, Check, Bell, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { WebsiteNotice } from '../types';

const DISMISSED_KEY = 'dzt_dismissed_notice_id';

// Subtle high-tech notification chime using Web Audio API
function playNoticeChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    // Gentle 2-tone futuristic chime
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    osc2.frequency.setValueAtTime(880, now);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.15); // D6

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  } catch {
    // Audio autoplay restrictions or not supported
  }
}

function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

// Convert URLs in string to clickable anchors
function renderFormattedMessage(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, idx) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={idx}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 break-all inline-flex items-center gap-1 font-mono text-xs"
        >
          {part}
          <ExternalLink className="w-3 h-3 inline-block" />
        </a>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export default function NoticePopup() {
  const [notice, setNotice] = useState<WebsiteNotice | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const previousNoticeIdRef = useRef<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const applyNoticeUpdate = useCallback((newNotice: WebsiteNotice | null) => {
    if (!newNotice || !newNotice.active || !newNotice.message?.trim()) {
      setNotice(null);
      setIsVisible(false);
      return;
    }

    setNotice(newNotice);

    // Check if this notice was previously dismissed
    const dismissedId = localStorage.getItem(DISMISSED_KEY);
    const isAlreadyDismissed = dismissedId === newNotice.id;

    if (!isAlreadyDismissed) {
      setIsVisible(true);
      setIsMinimized(false);

      // Play chime if this is a brand new broadcast ID
      if (previousNoticeIdRef.current !== newNotice.id) {
        playNoticeChime();
      }
    }

    previousNoticeIdRef.current = newNotice.id;
  }, []);

  // Polling fallback
  const fetchNotice = useCallback(async () => {
    try {
      // First try /api/notice
      const res = await fetch('/api/notice', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.active === 'boolean') {
          applyNoticeUpdate(data.notice);
          return;
        }
      }
    } catch {
      // Fallback directly to static /notice.json if serverless is not reachable
      try {
        const staticRes = await fetch(`/notice.json?t=${Date.now()}`);
        if (staticRes.ok) {
          const staticData = await staticRes.json();
          applyNoticeUpdate(staticData);
        }
      } catch {}
    }
  }, [applyNoticeUpdate]);

  // Connect WebSocket for instantaneous real-time updates
  useEffect(() => {
    fetchNotice();

    // Setup periodic polling every 12 seconds
    const interval = setInterval(fetchNotice, 12000);

    // WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Request current notice
        try {
          ws?.send(JSON.stringify({ type: 'get-notice' }));
        } catch {}
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'website-notice') {
            applyNoticeUpdate(data.notice);
          }
        } catch {}
      };
    } catch {
      // WebSocket not available, relying on polling
    }

    return () => {
      clearInterval(interval);
      if (ws) {
        try {
          ws.close();
        } catch {}
      }
    };
  }, [fetchNotice, applyNoticeUpdate]);

  const handleDismiss = () => {
    if (notice?.id) {
      localStorage.setItem(DISMISSED_KEY, notice.id);
    }
    setIsVisible(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    setIsVisible(false);
  };

  const handleReopen = () => {
    setIsVisible(true);
    setIsMinimized(false);
  };

  if (!notice || !notice.active) {
    return null;
  }

  return (
    <>
      {/* Minimized Floating Pill Indicator */}
      <AnimatePresence>
        {(!isVisible || isMinimized) && notice.active && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-5 right-5 z-40 no-print"
          >
            <button
              id="btn-reopen-notice-popup"
              onClick={handleReopen}
              className="group flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-[#0a0d14]/90 hover:bg-[#121722] text-white border border-cyan-500/40 hover:border-cyan-400 shadow-xl shadow-cyan-950/30 backdrop-blur-md transition-all cursor-pointer"
              title="Click to view broadcast notice"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
              </span>
              <Radio className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
              <span className="text-[11px] font-mono font-medium tracking-wide uppercase text-white/90 group-hover:text-white">
                Live Notice
              </span>
              <span className="text-[9px] px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 font-mono rounded-full border border-cyan-500/30">
                1
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Notice Broadcast Popup Modal */}
      <AnimatePresence>
        {isVisible && (
          <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 pt-20 sm:pt-4 pointer-events-none no-print">
            {/* Subtle backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleMinimize}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs pointer-events-auto"
            />

            {/* Popup Card */}
            <motion.div
              id="website-notice-popup"
              initial={{ opacity: 0, scale: 0.92, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -16 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="relative w-full max-w-lg bg-[#0a0d14] border border-cyan-500/40 rounded-xl shadow-2xl shadow-cyan-950/50 overflow-hidden pointer-events-auto"
            >
              {/* Cybernetic Header Bar with Beacon */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-transparent border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-cyan-300">
                      Live Broadcast Notice
                    </span>
                  </div>
                  <span className="text-white/20 text-xs">|</span>
                  <span className="text-[10px] font-mono text-white/50">
                    {formatRelativeTime(notice.timestamp)}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    id="btn-close-notice-popup"
                    onClick={handleDismiss}
                    className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                    aria-label="Dismiss Notice"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notice Body */}
              <div className="p-5 sm:p-6 space-y-4">
                {/* Author attribution chip */}
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <ShieldCheck className="w-3 h-3" />
                  </div>
                  <span className="font-medium text-white/90">
                    {notice.author || 'Amal K P'}
                  </span>
                  <span className="text-white/30">•</span>
                  <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                    Verified Broadcast via Telegram
                  </span>
                </div>

                {/* Message Box */}
                <div className="bg-[#05070a] border border-white/10 rounded-lg p-4 text-sm text-white/90 leading-relaxed font-sans whitespace-pre-wrap selection:bg-cyan-500/30">
                  {renderFormattedMessage(notice.message)}
                </div>

                {/* Action Controls */}
                <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] text-white/40 font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400/70" />
                    <span>Real-time update for website visitors</span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      id="btn-minimize-notice-popup"
                      onClick={handleMinimize}
                      className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-mono text-white/60 hover:text-white hover:bg-white/5 rounded-md border border-white/10 transition-colors cursor-pointer"
                    >
                      Minimize
                    </button>
                    <button
                      id="btn-acknowledge-notice-popup"
                      onClick={handleDismiss}
                      className="flex-1 sm:flex-initial px-5 py-2 text-xs font-mono font-bold uppercase tracking-wider bg-cyan-500 hover:bg-cyan-400 text-black rounded-md flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-400/30 transition-all cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Got It
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Subtle Terminal Status Bar */}
              <div className="px-5 py-2 bg-black/60 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/30">
                <span>CHANNEL: TELEGRAM_/UPDATE</span>
                <span>STATUS: DELIVERED</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
