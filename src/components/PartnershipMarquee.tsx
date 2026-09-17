import { useState, useEffect, useMemo } from 'react';

interface PartnershipMarqueeProps {
  onNavigate?: (tab: string) => void;
}

interface LogoItem {
  id: string;
  name: string;
  src: string;
  alt: string;
  fileName?: string;
}

export default function PartnershipMarquee({ onNavigate }: PartnershipMarqueeProps) {
  const [fetchedLogos, setFetchedLogos] = useState<LogoItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Auto-fetch ONLY the logos present in the /public/logos/ directory
  useEffect(() => {
    let isMounted = true;

    const loadLogos = async () => {
      try {
        const res = await fetch(`/api/logos?t=${Date.now()}`);
        if (!res.ok) {
          if (isMounted) setIsLoading(false);
          return;
        }
        const data = await res.json();
        if (isMounted) {
          if (data.logos && Array.isArray(data.logos)) {
            setFetchedLogos(data.logos);
          } else {
            setFetchedLogos([]);
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) setIsLoading(false);
      }
    };

    loadLogos();

    // Fast re-poll (every 3 seconds) to auto-update whenever a new logo is added or modified
    const interval = setInterval(loadLogos, 3000);

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

  // Prepare and distribute dynamically fetched logos across Track 1 and Track 2
  const { track1, track2, hasLogos } = useMemo(() => {
    if (fetchedLogos.length === 0) {
      return { track1: [], track2: [], hasLogos: false };
    }

    let t1: LogoItem[] = [];
    let t2: LogoItem[] = [];

    if (fetchedLogos.length === 1) {
      t1 = [fetchedLogos[0]];
      t2 = [fetchedLogos[0]];
    } else {
      fetchedLogos.forEach((item, index) => {
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
      track2: tileTrack(t2, 6),
      hasLogos: true
    };
  }, [fetchedLogos]);

  // If loading or no logos are in /public/logos/, render nothing
  if (!isLoading && !hasLogos) {
    return null;
  }

  if (isLoading && !hasLogos) {
    return null;
  }

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
              className="flex-shrink-0 flex items-center justify-center px-4 py-2.5 rounded-xs border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/30 transition-all duration-200 group"
              title={item.name}
            >
              <img
                src={item.src}
                alt={item.alt || `${item.name} Logo`}
                referrerPolicy="no-referrer"
                className="w-auto h-9 sm:h-10 max-h-11 object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-200"
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
              className="flex-shrink-0 flex items-center justify-center px-4 py-2.5 rounded-xs border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/30 transition-all duration-200 group"
              title={item.name}
            >
              <img
                src={item.src}
                alt={item.alt || `${item.name} Logo`}
                referrerPolicy="no-referrer"
                className="w-auto h-9 sm:h-10 max-h-11 object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-200"
              />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
