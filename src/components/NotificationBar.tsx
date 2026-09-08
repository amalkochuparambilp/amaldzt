import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, ExternalLink, ShieldCheck, Volume2, Sparkles, ChevronRight } from 'lucide-react';
import { WebsiteNotificationBar } from '../types';

const DISMISSED_BAR_KEY = 'dzt_dismissed_bar_id';

// High-tech notification bar chime
function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Gentle triple ping: E6 -> G#6
    osc.frequency.setValueAtTime(1318.51, now);
    osc.frequency.exponentialRampToValueAtTime(1661.22, now + 0.08);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  } catch {
    // Audio autoplay restricted or unavailable
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
          className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2 break-all inline-flex items-center gap-1 font-medium mx-1"
        >
          <span>{part}</span>
          <ExternalLink className="w-3 h-3 inline-block" />
        </a>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export function NotificationBar() {
  const [notification, setNotification] = useState<WebsiteNotificationBar | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [hasNewArrival, setHasNewArrival] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);
  const lastSeenIdRef = useRef<string | null>(null);

  // Fetch notification bar from server
  const fetchNotification = useCallback(async () => {
    try {
      const res = await fetch('/api/notification-bar', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.notification) {
          handleIncomingNotification(data.notification);
          return;
        }
      }
    } catch {}

    // Fallback to static public file
    try {
      const staticRes = await fetch('/notification-bar.json?t=' + Date.now(), { cache: 'no-store' });
      if (staticRes.ok) {
        const data = await staticRes.json();
        if (data && typeof data === 'object') {
          handleIncomingNotification(data);
        }
      }
    } catch {}
  }, []);

  const handleIncomingNotification = (newBar: WebsiteNotificationBar | null) => {
    if (!newBar || !newBar.active || !newBar.message?.trim()) {
      setNotification(null);
      return;
    }

    const dismissedId = localStorage.getItem(DISMISSED_BAR_KEY);
    const isAlreadyDismissed = dismissedId === newBar.id;

    // Trigger audio chime & highlight if brand new notification arrived
    if (lastSeenIdRef.current && lastSeenIdRef.current !== newBar.id) {
      playNotificationChime();
      setHasNewArrival(true);
      setTimeout(() => setHasNewArrival(false), 3000);

      // Trigger Web Notification API if permitted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('Amal K P • Live Notification', {
            body: newBar.message,
            icon: '/favicon.ico'
          });
        } catch {}
      }
    }

    lastSeenIdRef.current = newBar.id;
    setNotification(newBar);
    setIsDismissed(isAlreadyDismissed);
  };

  // Connect WebSocket for live broadcasts
  useEffect(() => {
    let reconnectTimeout: any;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          ws.send(JSON.stringify({ type: 'get-notification-bar' }));
        };

        ws.onmessage = (evt) => {
          try {
            const data = JSON.parse(evt.data);
            if (data.type === 'website-notification-bar') {
              handleIncomingNotification(data.notification);
            }
          } catch {}
        };

        ws.onclose = () => {
          reconnectTimeout = setTimeout(connectWebSocket, 4000);
        };

        ws.onerror = () => {
          try {
            ws.close();
          } catch {}
        };
      } catch {
        reconnectTimeout = setTimeout(connectWebSocket, 5000);
      }
    };

    connectWebSocket();
    fetchNotification();

    // Polling fallback every 12s
    const pollInterval = setInterval(fetchNotification, 12000);

    return () => {
      clearTimeout(reconnectTimeout);
      clearInterval(pollInterval);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {}
      }
    };
  }, [fetchNotification]);

  const handleDismiss = () => {
    if (notification) {
      localStorage.setItem(DISMISSED_BAR_KEY, notification.id);
      setIsDismissed(true);
    }
  };

  const isVisible = Boolean(notification && notification.active && !isDismissed && notification.message?.trim());

  return (
    <AnimatePresence>
      {isVisible && notification && (
        <motion.aside
          id="website-top-notification-bar"
          role="region"
          aria-label="Website Notification Bar"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className={`relative z-50 w-full overflow-hidden border-b transition-colors ${
            hasNewArrival 
              ? 'bg-cyan-950/90 border-cyan-400 shadow-[0_4px_20px_rgba(6,182,212,0.25)]' 
              : 'bg-[#080d14] border-cyan-500/30 shadow-[0_2px_15px_rgba(0,0,0,0.5)]'
          }`}
        >
          {/* Subtle Cyber Accent Line at Top Edge */}
          <div className="h-[2px] w-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-500" />

          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-3 text-xs">
            
            {/* Left: Indicator Badge + Message */}
            <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
              
              {/* Pulsing Notification Pill */}
              <div 
                id="notification-bar-badge"
                className="flex-shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/40 text-cyan-300 font-mono text-[10px] font-semibold tracking-wider uppercase select-none"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
                </span>
                <Bell className="w-3 h-3 text-cyan-300" />
                <span className="hidden sm:inline">NOTIFICATION</span>
              </div>

              {/* Author Attribution Tag */}
              <div className="hidden md:flex items-center gap-1 text-[11px] text-white/50 font-mono flex-shrink-0">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span className="text-white/80 font-medium">{notification.author || 'Amal K P'}</span>
                <span>•</span>
                <span>{formatRelativeTime(notification.timestamp)}</span>
              </div>

              {/* Notification Message Text */}
              <div 
                id="notification-bar-message"
                className="text-white/90 text-xs sm:text-[13px] leading-snug font-sans truncate sm:whitespace-normal break-words flex-1 min-w-0"
              >
                {renderFormattedMessage(notification.message)}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              
              {/* Re-play audio chime button */}
              <button
                id="btn-notification-sound"
                onClick={playNotificationChime}
                className="p-1 sm:p-1.5 rounded-xs text-white/50 hover:text-cyan-300 hover:bg-white/5 transition-colors cursor-pointer"
                title="Play notification sound"
                aria-label="Play sound"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>

              {/* Dismiss Button */}
              <button
                id="btn-dismiss-notification-bar"
                onClick={handleDismiss}
                className="flex items-center gap-1 px-2 py-1 rounded-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors font-mono text-[11px] cursor-pointer"
                title="Dismiss notification bar"
                aria-label="Dismiss notification"
              >
                <span className="hidden sm:inline text-[10px] uppercase tracking-wider">Dismiss</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export default NotificationBar;
