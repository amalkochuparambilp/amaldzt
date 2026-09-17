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

// Guaranteed baseline list of all current logos in /public/logos/
const ALL_CURRENT_LOGOS: LogoItem[] = [
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
    id: 'logo-nss',
    name: 'NSS',
    src: '/logos/new-nss-seeklogo.png',
    alt: 'National Service Scheme',
    fileName: 'new-nss-seeklogo.png'
  },
  {
    id: 'logo-partner-1',
    name: 'TECH PARTNER',
    src: '/logos/idhf5lcjoR_1789676848779.svg',
    alt: 'Partner Logo',
    fileName: 'idhf5lcjoR_1789676848779.svg'
  },
  {
    id: 'logo-partner-2',
    name: 'CLOUD ECOSYSTEM',
    src: '/logos/idJPs0Yq7Y_1789677081540.svg',
    alt: 'Ecosystem Logo',
    fileName: 'idJPs0Yq7Y_1789677081540.svg'
  },
  {
    id: 'logo-partner-3',
    name: 'DZt NETWORK',
    src: '/logos/idJsCe_Imz_1789677158066.png',
    alt: 'Network Partner',
    fileName: 'idJsCe_Imz_1789677158066.png'
  }
];

export default function PartnershipMarquee({ onNavigate }: PartnershipMarqueeProps) {
  const [logoList, setLogoList] = useState<LogoItem[]>(ALL_CURRENT_LOGOS);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Dynamic fetcher to discover new uploads in real-time
  useEffect(() => {
    let isMounted = true;

    const syncLogos = async () => {
      try {
        const res = await fetch(`/api/logos?t=${Date.now()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.logos && Array.isArray(data.logos) && data.logos.length > 0) {
          setLogoList(data.logos);
        }
      } catch {
        // Fallback safely preserved
      }
    };

    syncLogos();

    const interval = setInterval(syncLogos, 4000);
    const onFocus = () => syncLogos();
    window.addEventListener('focus', onFocus);
    window.addEventListener('visibilitychange', onFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  const handleImageError = (uniqueKey: string) => {
    setFailedImages((prev) => ({ ...prev, [uniqueKey]: true }));
  };

  // Build continuous looping arrays for Track 1 and Track 2
  const { track1, track2 } = useMemo(() => {
    const source = logoList.length > 0 ? logoList : ALL_CURRENT_LOGOS;

    const t1: LogoItem[] = [];
    const t2: LogoItem[] = [];

    source.forEach((item, index) => {
      if (index % 2 === 0) {
        t1.push(item);
      } else {
        t2.push(item);
      }
    });

    if (t2.length === 0) t2.push(...t1);
    if (t1.length === 0) t1.push(...t2);

    // Quadruple items to guarantee infinite seamless scrolling across ultra-wide monitors
    const duplicateForSeamlessLoop = (arr: LogoItem[]) => {
      if (arr.length === 0) return [];
      let expanded = [...arr];
      while (expanded.length < 8) {
        expanded = [...expanded, ...arr];
      }
      return [...expanded, ...expanded];
    };

    return {
      track1: duplicateForSeamlessLoop(t1),
      track2: duplicateForSeamlessLoop(t2)
    };
  }, [logoList]);

  return (
    <div id="partnership-marquee-section" className="relative w-full py-6 sm:py-8 border-y border-white/10 bg-[#060606] overflow-hidden select-none space-y-3 z-10">
      
      {/* Self-contained CSS Animation Styles for 100% Cross-Browser / Cross-Domain Reliability */}
      <style>{`
        @keyframes scrollTrackLeft {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes scrollTrackRight {
          0% { transform: translate3d(-50%, 0, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        .marquee-scroll-left {
          display: flex;
          width: max-content;
          animation: scrollTrackLeft 26s linear infinite;
          will-change: transform;
        }
        .marquee-scroll-right {
          display: flex;
          width: max-content;
          animation: scrollTrackRight 26s linear infinite;
          will-change: transform;
        }
        .marquee-wrapper:hover .marquee-scroll-left,
        .marquee-wrapper:hover .marquee-scroll-right {
          animation-play-state: paused;
        }
      `}</style>

      {/* Header Info Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.25em] text-white/60 font-semibold">
            PARTNERSHIPS, INSTITUTIONS & CLIENTS
          </span>
        </div>
        {onNavigate && (
          <button
            type="button"
            id="btn-partner-with-dzt"
            onClick={() => onNavigate('collaborate')}
            className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-cyan-400 hover:text-white transition-colors cursor-pointer"
          >
            Partner with DZt →
          </button>
        )}
      </div>

      {/* Track 1: Leftward Scroll */}
      <div className="relative w-full overflow-hidden marquee-wrapper flex items-center">
        <div className="absolute top-0 bottom-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-[#060606] via-[#060606]/90 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-[#060606] via-[#060606]/90 to-transparent z-10 pointer-events-none" />

        <div className="marquee-scroll-left flex items-center gap-4 sm:gap-6 py-1">
          {track1.map((item, idx) => {
            const key = `t1-${item.id}-${idx}`;
            const isFailed = failedImages[key] || failedImages[item.id];
            return (
              <div
                key={key}
                className="flex-shrink-0 flex items-center justify-center px-4 py-2 rounded-xs border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/30 transition-all duration-200 group min-w-[130px] sm:min-w-[150px] h-14"
                title={item.name}
              >
                {!isFailed ? (
                  <img
                    src={item.src}
                    alt={item.alt || `${item.name} Logo`}
                    referrerPolicy="no-referrer"
                    onError={() => handleImageError(key)}
                    className="w-auto h-7 sm:h-8 max-h-9 max-w-[130px] object-contain brightness-110 contrast-125 opacity-80 group-hover:opacity-100 group-hover:brightness-125 transition-all duration-200"
                  />
                ) : (
                  <span className="text-[11px] font-mono font-bold tracking-wider text-white/70 group-hover:text-white transition-colors uppercase">
                    {item.name}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Track 2: Rightward Scroll */}
      <div className="relative w-full overflow-hidden marquee-wrapper flex items-center">
        <div className="absolute top-0 bottom-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-[#060606] via-[#060606]/90 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-[#060606] via-[#060606]/90 to-transparent z-10 pointer-events-none" />

        <div className="marquee-scroll-right flex items-center gap-4 sm:gap-6 py-1">
          {track2.map((item, idx) => {
            const key = `t2-${item.id}-${idx}`;
            const isFailed = failedImages[key] || failedImages[item.id];
            return (
              <div
                key={key}
                className="flex-shrink-0 flex items-center justify-center px-4 py-2 rounded-xs border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/30 transition-all duration-200 group min-w-[130px] sm:min-w-[150px] h-14"
                title={item.name}
              >
                {!isFailed ? (
                  <img
                    src={item.src}
                    alt={item.alt || `${item.name} Logo`}
                    referrerPolicy="no-referrer"
                    onError={() => handleImageError(key)}
                    className="w-auto h-7 sm:h-8 max-h-9 max-w-[130px] object-contain brightness-110 contrast-125 opacity-80 group-hover:opacity-100 group-hover:brightness-125 transition-all duration-200"
                  />
                ) : (
                  <span className="text-[11px] font-mono font-bold tracking-wider text-white/70 group-hover:text-white transition-colors uppercase">
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
