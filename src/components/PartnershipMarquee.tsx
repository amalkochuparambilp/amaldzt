import { useState, useEffect, useMemo } from 'react';

interface PartnershipMarqueeProps {
  onNavigate?: (tab: string) => void;
}

export interface LogoItem {
  id: string;
  name: string;
  src: string;
  alt: string;
  fileName?: string;
}

// Resilient default logo list from /public/logos/ ensuring instant rendering on all hosting environments
const DEFAULT_LOGOS: LogoItem[] = [
  {
    id: 'logo-openai',
    name: 'OPENAI',
    src: '/logos/openai-wordmark-dark.svg',
    alt: 'OpenAI Logo',
    fileName: 'openai-wordmark-dark.svg'
  },
  {
    id: 'logo-axis-bank',
    name: 'AXIS BANK',
    src: '/logos/axis-bank.svg',
    alt: 'Axis Bank Logo',
    fileName: 'axis-bank.svg'
  },
  {
    id: 'logo-shopify',
    name: 'SHOPIFY',
    src: '/logos/shopify.svg',
    alt: 'Shopify Logo',
    fileName: 'shopify.svg'
  },
  {
    id: 'logo-bajaj-auto',
    name: 'BAJAJ AUTO',
    src: '/logos/bajaj-auto.svg',
    alt: 'Bajaj Auto Logo',
    fileName: 'bajaj-auto.svg'
  },
  {
    id: 'logo-nss',
    name: 'NATIONAL SERVICE SCHEME (NSS)',
    src: '/logos/new-nss-seeklogo.png',
    alt: 'NSS SeekLogo',
    fileName: 'new-nss-seeklogo.png'
  }
];

export default function PartnershipMarquee({ onNavigate }: PartnershipMarqueeProps) {
  // Initialize with DEFAULT_LOGOS so it renders instantly on production without waiting for /api/logos
  const [fetchedLogos, setFetchedLogos] = useState<LogoItem[]>(DEFAULT_LOGOS);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Background auto-poller to dynamically discover any newly added logos in /public/logos/
  useEffect(() => {
    let isMounted = true;

    const loadLogos = async () => {
      try {
        const res = await fetch(`/api/logos?t=${Date.now()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.logos && Array.isArray(data.logos) && data.logos.length > 0) {
          setFetchedLogos(data.logos);
        }
      } catch {
        // Silently preserve DEFAULT_LOGOS on static hosts or offline
      }
    };

    loadLogos();

    // Fast re-poll every 4 seconds to sync newly dropped files
    const interval = setInterval(loadLogos, 4000);
    const handleFocus = () => loadLogos();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  const handleImageError = (logoId: string) => {
    setFailedImages((prev) => ({ ...prev, [logoId]: true }));
  };

  // Prepare and distribute dynamically fetched logos across Track 1 and Track 2
  const { track1, track2 } = useMemo(() => {
    const list = fetchedLogos.length > 0 ? fetchedLogos : DEFAULT_LOGOS;

    let t1: LogoItem[] = [];
    let t2: LogoItem[] = [];

    if (list.length === 1) {
      t1 = [list[0]];
      t2 = [list[0]];
    } else {
      list.forEach((item, index) => {
        if (index % 2 === 0) {
          t1.push(item);
        } else {
          t2.push(item);
        }
      });

      if (t2.length === 0) t2 = [...t1];
      if (t1.length === 0) t1 = [...t2];
    }

    // Multiply track items so there are enough elements for a continuous -50% translateX loop
    const tileTrack = (arr: LogoItem[], minCount = 8): LogoItem[] => {
      if (arr.length === 0) return [];
      let res = [...arr];
      while (res.length < minCount) {
        res = [...res, ...arr];
      }
      // Duplicate for seamless 50% translation loop
      return [...res, ...res];
    };

    return {
      track1: tileTrack(t1, 6),
      track2: tileTrack(t2, 6)
    };
  }, [fetchedLogos]);

  return (
    <div id="partnership-marquee-section" className="relative py-6 sm:py-8 border-y border-white/10 bg-[#050505] overflow-hidden select-none space-y-3">
      
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.015] to-transparent pointer-events-none" />

      {/* Subtle Section Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-2 flex items-center justify-between">
        <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.25em] text-white/50 font-semibold">
          PARTNERSHIPS, INSTITUTIONS & CLIENTS
        </span>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('collaborate')}
            className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 hover:text-white transition-colors cursor-pointer"
          >
            Partner with DZt →
          </button>
        )}
      </div>

      {/* Track 1: Sliding Left */}
      <div className="relative w-full overflow-hidden pause-hover flex items-center">
        {/* Left and Right edge fade masks */}
        <div className="absolute top-0 bottom-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-[#050505] via-[#050505]/90 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-[#050505] via-[#050505]/90 to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee-left flex items-center gap-4 sm:gap-6 py-1">
          {track1.map((item, idx) => {
            const isFailed = failedImages[`track1-${item.id}-${idx}`] || failedImages[item.id];
            return (
              <div
                key={`track1-${item.id}-${idx}`}
                className="flex-shrink-0 flex items-center justify-center px-4 py-2.5 rounded-xs border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/30 transition-all duration-200 group min-w-[120px] sm:min-w-[140px] h-14"
                title={item.name}
              >
                {!isFailed ? (
                  <img
                    src={item.src}
                    alt={item.alt || `${item.name} Logo`}
                    referrerPolicy="no-referrer"
                    onError={() => handleImageError(`track1-${item.id}-${idx}`)}
                    className="w-auto h-7 sm:h-8 max-h-9 max-w-[130px] object-contain brightness-95 contrast-125 opacity-70 group-hover:opacity-100 group-hover:brightness-100 transition-all duration-200"
                  />
                ) : (
                  <span className="text-[11px] font-mono font-bold tracking-wider text-white/60 group-hover:text-white transition-colors uppercase">
                    {item.name}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Track 2: Sliding Right */}
      <div className="relative w-full overflow-hidden pause-hover flex items-center">
        {/* Left and Right edge fade masks */}
        <div className="absolute top-0 bottom-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-[#050505] via-[#050505]/90 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-[#050505] via-[#050505]/90 to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee-right flex items-center gap-4 sm:gap-6 py-1">
          {track2.map((item, idx) => {
            const isFailed = failedImages[`track2-${item.id}-${idx}`] || failedImages[item.id];
            return (
              <div
                key={`track2-${item.id}-${idx}`}
                className="flex-shrink-0 flex items-center justify-center px-4 py-2.5 rounded-xs border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/30 transition-all duration-200 group min-w-[120px] sm:min-w-[140px] h-14"
                title={item.name}
              >
                {!isFailed ? (
                  <img
                    src={item.src}
                    alt={item.alt || `${item.name} Logo`}
                    referrerPolicy="no-referrer"
                    onError={() => handleImageError(`track2-${item.id}-${idx}`)}
                    className="w-auto h-7 sm:h-8 max-h-9 max-w-[130px] object-contain brightness-95 contrast-125 opacity-70 group-hover:opacity-100 group-hover:brightness-100 transition-all duration-200"
                  />
                ) : (
                  <span className="text-[11px] font-mono font-bold tracking-wider text-white/60 group-hover:text-white transition-colors uppercase">
                    {item.name}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
