interface PartnershipMarqueeProps {
  onNavigate?: (tab: string) => void;
}

export default function PartnershipMarquee({ onNavigate }: PartnershipMarqueeProps) {
  // Row 1 Logos (Sliding Left)
  const track1Logos = [
    {
      id: 'dzt-logo-main',
      name: 'DZt Ecosystem',
      src: '/logos/logo.png',
      alt: 'DZt Logo',
      width: 'w-auto h-10 sm:h-11'
    },
    {
      id: 'jnias-logo',
      name: 'JNIAS Balagram',
      src: '/logos/jnias.svg',
      alt: 'JNIAS Logo',
      width: 'w-auto h-9 sm:h-10'
    },
    {
      id: 'libcode-logo',
      name: 'LibCode Library Systems',
      src: '/logos/libcode.svg',
      alt: 'LibCode Logo',
      width: 'w-auto h-9 sm:h-10'
    },
    {
      id: 'bank-logo',
      name: 'Co-operative Bank Exam Portal',
      src: '/logos/bank.svg',
      alt: 'Co-operative Bank Logo',
      width: 'w-auto h-9 sm:h-10'
    },
    {
      id: 'hrdiya-logo',
      name: 'Hrdiya Health Analytics',
      src: '/logos/hrdiya.svg',
      alt: 'Hrdiya Logo',
      width: 'w-auto h-9 sm:h-10'
    },
    {
      id: 'webrtc-logo',
      name: 'WebRTC P2P Protocol',
      src: '/logos/webrtc.svg',
      alt: 'WebRTC Logo',
      width: 'w-auto h-9 sm:h-10'
    }
  ];

  // Row 2 Logos (Sliding Right)
  const track2Logos = [
    {
      id: 'dzt-labs-logo',
      name: 'DZt Platform & Labs',
      src: '/logos/dzt.svg',
      alt: 'DZt Labs Logo',
      width: 'w-auto h-9 sm:h-10'
    },
    {
      id: 'dzt-drop-logo',
      name: 'DZt Drop P2P Relay',
      src: '/logos/drop.svg',
      alt: 'DZt Drop Logo',
      width: 'w-auto h-9 sm:h-10'
    },
    {
      id: 'dzt-meet-logo',
      name: 'DZt Meet WebRTC Suite',
      src: '/logos/meet.svg',
      alt: 'DZt Meet Logo',
      width: 'w-auto h-9 sm:h-10'
    },
    {
      id: 'kerala-dev-logo',
      name: 'Kerala Tech Community',
      src: '/logos/kerala-dev.svg',
      alt: 'Kerala Dev Logo',
      width: 'w-auto h-9 sm:h-10'
    },
    {
      id: 'dzt-symbol-logo',
      name: 'DZt Core Monogram',
      src: '/logos/logo.png',
      alt: 'DZt Symbol',
      width: 'w-auto h-10 sm:h-11'
    },
    {
      id: 'libcode-alt-logo',
      name: 'LibCode Systems',
      src: '/logos/libcode.svg',
      alt: 'LibCode Logo',
      width: 'w-auto h-9 sm:h-10'
    }
  ];

  const fullTrack1 = [...track1Logos, ...track1Logos];
  const fullTrack2 = [...track2Logos, ...track2Logos];

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

      {/* Track 1: Moving Left */}
      <div className="relative w-full overflow-hidden pause-hover flex items-center">
        {/* Left and Right edge fade masks */}
        <div className="absolute top-0 bottom-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-[#050505] via-[#050505]/90 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-[#050505] via-[#050505]/90 to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee-left flex items-center gap-4 sm:gap-6 py-1">
          {fullTrack1.map((item, idx) => (
            <div
              key={`track1-${item.id}-${idx}`}
              className="flex-shrink-0 flex items-center justify-center px-4 py-2 rounded-xs border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/30 transition-all duration-200 group"
              title={item.name}
            >
              <img
                src={item.src}
                alt={item.alt}
                referrerPolicy="no-referrer"
                className={`${item.width} max-h-11 object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-200`}
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

      {/* Track 2: Moving Right */}
      <div className="relative w-full overflow-hidden pause-hover flex items-center">
        {/* Left and Right edge fade masks */}
        <div className="absolute top-0 bottom-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-[#050505] via-[#050505]/90 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-[#050505] via-[#050505]/90 to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee-right flex items-center gap-4 sm:gap-6 py-1">
          {fullTrack2.map((item, idx) => (
            <div
              key={`track2-${item.id}-${idx}`}
              className="flex-shrink-0 flex items-center justify-center px-4 py-2 rounded-xs border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/30 transition-all duration-200 group"
              title={item.name}
            >
              <img
                src={item.src}
                alt={item.alt}
                referrerPolicy="no-referrer"
                className={`${item.width} max-h-11 object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-200`}
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
