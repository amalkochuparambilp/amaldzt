import { useState, useEffect, useMemo } from 'react';

interface PartnershipMarqueeProps {
  onNavigate?: (tab: string) => void;
}

export interface LogoItem {
  id: string;
  name: string;
  src: string;
  alt: string;
  fileName: string;
}

// Baseline known logo registry to render immediately with 0ms delay
const INITIAL_LOGOS: LogoItem[] = [
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
    id: 'logo-uxbjxoi',
    name: 'PARTNER LOGO',
    src: '/logos/idUxbjXOi-_logos.svg',
    alt: 'Partner Logo',
    fileName: 'idUxbjXOi-_logos.svg'
  },
  {
    id: 'logo-hf5lcjo',
    name: 'TECH PARTNER',
    src: '/logos/idhf5lcjoR_1789676848779.svg',
    alt: 'Tech Partner Logo',
    fileName: 'idhf5lcjoR_1789676848779.svg'
  },
  {
    id: 'logo-jps0yq',
    name: 'CLOUD ECOSYSTEM',
    src: '/logos/idJPs0Yq7Y_1789677081540.svg',
    alt: 'Cloud Ecosystem Logo',
    fileName: 'idJPs0Yq7Y_1789677081540.svg'
  },
  {
    id: 'logo-jsce-imz',
    name: 'DZT NETWORK',
    src: '/logos/idJsCe_Imz_1789677158066.png',
    alt: 'DZt Network Logo',
    fileName: 'idJsCe_Imz_1789677158066.png'
  }
];

export default function PartnershipMarquee({ onNavigate }: PartnershipMarqueeProps) {
  const [logos, setLogos] = useState<LogoItem[]>(INITIAL_LOGOS);
  const [erroredLogos, setErroredLogos] = useState<Record<string, boolean>>({});

  // Dynamic Poller: automatically fetches any newly uploaded files in /public/logos/
  useEffect(() => {
    let isMounted = true;

    const fetchDynamicLogos = async () => {
      try {
        const response = await fetch(`/api/logos?t=${Date.now()}`);
        if (!response.ok) return;
        const data = await response.json();
        if (isMounted && data.logos && Array.isArray(data.logos) && data.logos.length > 0) {
          setLogos(data.logos);
        }
      } catch {
        // Retains base list safely on static edge hosts
      }
    };

    fetchDynamicLogos();

    const interval = setInterval(fetchDynamicLogos, 2500);
    const onFocus = () => fetchDynamicLogos();
    window.addEventListener('focus', onFocus);
    window.addEventListener('visibilitychange', onFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  const handleImageError = (logoSrc: string) => {
    setErroredLogos((prev) => ({ ...prev, [logoSrc]: true }));
  };

  // Keep only active, working logo items
  const validLogos = useMemo(() => {
    const list = logos.length > 0 ? logos : INITIAL_LOGOS;
    return list.filter((item) => !erroredLogos[item.src]);
  }, [logos, erroredLogos]);

  // Distribute across Track 1 and Track 2
  const { track1, track2 } = useMemo(() => {
    if (validLogos.length === 0) return { track1: [], track2: [] };

    const t1: LogoItem[] = [];
    const t2: LogoItem[] = [];

    if (validLogos.length === 1) {
      t1.push(validLogos[0]);
      t2.push(validLogos[0]);
    } else {
      validLogos.forEach((logo, i) => {
        if (i % 2 === 0) {
          t1.push(logo);
        } else {
          t2.push(logo);
        }
      });
      if (t2.length === 0) t2.push(...t1);
      if (t1.length === 0) t1.push(...t2);
    }

    // Multiply elements so track length is sufficient for seamless continuous loop
    const makeSeamlessTrack = (arr: LogoItem[]): LogoItem[] => {
      if (arr.length === 0) return [];
      let expanded = [...arr];
      while (expanded.length < 8) {
        expanded = [...expanded, ...arr];
      }
      return [...expanded, ...expanded];
    };

    return {
      track1: makeSeamlessTrack(t1),
      track2: makeSeamlessTrack(t2)
    };
  }, [validLogos]);

  if (validLogos.length === 0) {
    return null;
  }

  return (
    <div id="partnership-marquee-section" className="relative w-full py-6 sm:py-8 border-y border-white/10 bg-[#060606] overflow-hidden select-none space-y-3.5 z-10">
      
      {/* Self-contained CSS Animation */}
      <style>{`
        @keyframes marqueeLoopLeft {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes marqueeLoopRight {
          0% { transform: translate3d(-50%, 0, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        .marquee-track-left {
          display: flex;
          width: max-content;
          animation: marqueeLoopLeft 24s linear infinite;
          will-change: transform;
        }
        .marquee-track-right {
          display: flex;
          width: max-content;
          animation: marqueeLoopRight 24s linear infinite;
          will-change: transform;
        }
        .marquee-container:hover .marquee-track-left,
        .marquee-container:hover .marquee-track-right {
          animation-play-state: paused;
        }
      `}</style>

      {/* Header Info Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.25em] text-white/60 font-semibold">
            PARTNERSHIPS, INSTITUTIONS & CLIENTS
          </span>
        </div>
        {onNavigate && (
          <button
            type="button"
            id="btn-partner-collaborate"
            onClick={() => onNavigate('collaborate')}
            className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-cyan-400 hover:text-white transition-colors cursor-pointer"
          >
            Partner with DZt →
          </button>
        )}
      </div>

      {/* Track 1: Smooth Leftward Scroll — ONLY Pure Logos */}
      <div className="relative w-full overflow-hidden marquee-container flex items-center">
        <div className="absolute top-0 bottom-0 left-0 w-16 sm:w-36 bg-gradient-to-r from-[#060606] via-[#060606]/90 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-16 sm:w-36 bg-gradient-to-l from-[#060606] via-[#060606]/90 to-transparent z-10 pointer-events-none" />

        <div className="marquee-track-left flex items-center gap-4 sm:gap-6 py-1">
          {track1.map((logo, idx) => (
            <div
              key={`track1-${logo.id}-${idx}`}
              className="flex-shrink-0 flex items-center justify-center px-6 py-2 rounded-xs border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/30 transition-all duration-200 group min-w-[120px] sm:min-w-[150px] h-14"
              title={logo.name}
            >
              <img
                src={logo.src}
                alt={logo.alt}
                referrerPolicy="no-referrer"
                onError={() => handleImageError(logo.src)}
                className="w-auto h-7 sm:h-8 max-h-9 max-w-[130px] object-contain brightness-105 contrast-125 opacity-80 group-hover:opacity-100 group-hover:brightness-125 transition-all duration-200 pointer-events-none select-none"
                loading="eager"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Track 2: Smooth Rightward Scroll — ONLY Pure Logos */}
      <div className="relative w-full overflow-hidden marquee-container flex items-center">
        <div className="absolute top-0 bottom-0 left-0 w-16 sm:w-36 bg-gradient-to-r from-[#060606] via-[#060606]/90 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-16 sm:w-36 bg-gradient-to-l from-[#060606] via-[#060606]/90 to-transparent z-10 pointer-events-none" />

        <div className="marquee-track-right flex items-center gap-4 sm:gap-6 py-1">
          {track2.map((logo, idx) => (
            <div
              key={`track2-${logo.id}-${idx}`}
              className="flex-shrink-0 flex items-center justify-center px-6 py-2 rounded-xs border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/30 transition-all duration-200 group min-w-[120px] sm:min-w-[150px] h-14"
              title={logo.name}
            >
              <img
                src={logo.src}
                alt={logo.alt}
                referrerPolicy="no-referrer"
                onError={() => handleImageError(logo.src)}
                className="w-auto h-7 sm:h-8 max-h-9 max-w-[130px] object-contain brightness-105 contrast-125 opacity-80 group-hover:opacity-100 group-hover:brightness-125 transition-all duration-200 pointer-events-none select-none"
                loading="eager"
              />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
