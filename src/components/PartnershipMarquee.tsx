import { useState, useEffect, useMemo } from 'react';

interface PartnershipMarqueeProps {
  onNavigate?: (tab: string) => void;
}

interface LogoItem {
  id: string;
  name: string;
  src: string;
  alt: string;
}

// Default preloaded fallback logos
const DEFAULT_LOGOS: LogoItem[] = [
  { id: 'logo-dzt-main', name: 'DZt Ecosystem', src: '/logos/logo.png', alt: 'DZt Logo' },
  { id: 'logo-jnias', name: 'JNIAS Balagram', src: '/logos/jnias.svg', alt: 'JNIAS Logo' },
  { id: 'logo-libcode', name: 'LibCode Library Systems', src: '/logos/libcode.svg', alt: 'LibCode Logo' },
  { id: 'logo-bank', name: 'Co-operative Bank Exam Portal', src: '/logos/bank.svg', alt: 'Co-operative Bank Logo' },
  { id: 'logo-hrdiya', name: 'Hrdiya Health Analytics', src: '/logos/hrdiya.svg', alt: 'Hrdiya Logo' },
  { id: 'logo-webrtc', name: 'WebRTC P2P Protocol', src: '/logos/webrtc.svg', alt: 'WebRTC Logo' },
  { id: 'logo-dzt-labs', name: 'DZt Platform & Labs', src: '/logos/dzt.svg', alt: 'DZt Labs Logo' },
  { id: 'logo-drop', name: 'DZt Drop P2P Relay', src: '/logos/drop.svg', alt: 'DZt Drop Logo' },
  { id: 'logo-meet', name: 'DZt Meet WebRTC Suite', src: '/logos/meet.svg', alt: 'DZt Meet Logo' },
  { id: 'logo-kerala-dev', name: 'Kerala Tech Community', src: '/logos/kerala-dev.svg', alt: 'Kerala Dev Logo' }
];

export default function PartnershipMarquee({ onNavigate }: PartnershipMarqueeProps) {
  const [fetchedLogos, setFetchedLogos] = useState<LogoItem[]>(DEFAULT_LOGOS);

  // Auto-fetch all logos from /api/logos (which reads the /public/logos directory)
  useEffect(() => {
    let isMounted = true;

    const loadLogos = async () => {
      try {
        const res = await fetch('/api/logos');
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.logos && Array.isArray(data.logos) && data.logos.length > 0) {
          setFetchedLogos(data.logos);
        }
      } catch (err) {
        // Silently use preloaded defaults if API is not accessible
      }
    };

    loadLogos();

    // Auto-poll every 15s to detect newly uploaded logo files in /public/logos/
    const interval = setInterval(loadLogos, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Split and prepare tracks for continuous infinite scroll
  const { track1, track2 } = useMemo(() => {
    const list = fetchedLogos.length > 0 ? fetchedLogos : DEFAULT_LOGOS;

    // Distribute into Track 1 and Track 2
    let t1: LogoItem[] = [];
    let t2: LogoItem[] = [];

    if (list.length === 1) {
      t1 = [list[0]];
      t2 = [list[0]];
    } else {
      // Split alternating items for variety
      list.forEach((item, index) => {
        if (index % 2 === 0) {
          t1.push(item);
        } else {
          t2.push(item);
        }
      });

      // Ensure each track has balanced items
      if (t2.length === 0) t2 = [...t1];
      if (t1.length === 0) t1 = [...t2];
    }

    // Multiply track array so that there are enough items for smooth -50% translateX loop
    const ensureMinItems = (arr: LogoItem[], min = 10): LogoItem[] => {
      let res = [...arr];
      while (res.length < min) {
        res = [...res, ...arr];
      }
      // Duplicate for seamless 50% translation loop
      return [...res, ...res];
    };

    return {
      track1: ensureMinItems(t1, 8),
      track2: ensureMinItems(t2, 8)
    };
  }, [fetchedLogos]);

  return (
    <div className="relative py-6 sm:py-8 border-y border-white/10 bg-[#050505] overflow-hidden select-none space-y-3">
      
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.015] to-transparent pointer-events-none" />

      {/* Subtle Minimalist Section Title */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-2 flex items-center justify-center">
        <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-white/40 font-semibold">
          PARTNERSHIPS & COLLABORATIONS
        </span>
      </div>

      {/* Track 1: Auto-fetched Logos (Sliding Left) */}
      <div className="relative w-full overflow-hidden pause-hover flex items-center">
        {/* Left and Right edge fade masks */}
        <div className="absolute top-0 bottom-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-[#050505] via-[#050505]/90 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-[#050505] via-[#050505]/90 to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee-left flex items-center gap-4 sm:gap-6 py-1">
          {track1.map((item, idx) => (
            <div
              key={`track1-${item.id}-${idx}`}
              className="flex-shrink-0 flex items-center justify-center px-4 py-2 rounded-xs border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/30 transition-all duration-200 group"
              title={item.name}
            >
              <img
                src={item.src}
                alt={item.alt || `${item.name} Logo`}
                referrerPolicy="no-referrer"
                className="w-auto h-9 sm:h-10 max-h-11 object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== `${window.location.origin}/logo.png`) {
                    target.src = '/logo.png';
                  }
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Track 2: Auto-fetched Logos (Sliding Right) */}
      <div className="relative w-full overflow-hidden pause-hover flex items-center">
        {/* Left and Right edge fade masks */}
        <div className="absolute top-0 bottom-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-[#050505] via-[#050505]/90 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-[#050505] via-[#050505]/90 to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee-right flex items-center gap-4 sm:gap-6 py-1">
          {track2.map((item, idx) => (
            <div
              key={`track2-${item.id}-${idx}`}
              className="flex-shrink-0 flex items-center justify-center px-4 py-2 rounded-xs border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/30 transition-all duration-200 group"
              title={item.name}
            >
              <img
                src={item.src}
                alt={item.alt || `${item.name} Logo`}
                referrerPolicy="no-referrer"
                className="w-auto h-9 sm:h-10 max-h-11 object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== `${window.location.origin}/logo.png`) {
                    target.src = '/logo.png';
                  }
                }}
              />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
