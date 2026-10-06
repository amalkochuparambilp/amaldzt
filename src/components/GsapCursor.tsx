import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface GsapCursorProps {
  color?: string;
  enabled?: boolean;
}

export default function GsapCursor({ color = '#0ae448', enabled = true }: GsapCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isHoveringClickable, setIsHoveringClickable] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Detect touch device - disable custom cursor on touch
    if (window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);

      // Smooth GSAP follow
      gsap.to(cursorRef.current, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.1,
        ease: 'power2.out',
        overwrite: 'auto',
      });

      gsap.to(ringRef.current, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.35,
        ease: 'power3.out',
        overwrite: 'auto',
      });

      // Check if hovering clickable
      const target = e.target as HTMLElement;
      const isClickable = Boolean(
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]') ||
        target.closest('.cursor-pointer') ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA'
      );
      setIsHoveringClickable(isClickable);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enabled, isVisible]);

  if (!enabled || !isVisible) return null;

  return (
    <>
      {/* Outer Glow Ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 transition-all rounded-full"
        style={{
          width: isHoveringClickable ? '48px' : '28px',
          height: isHoveringClickable ? '48px' : '28px',
          border: `1.5px solid ${color}`,
          backgroundColor: isHoveringClickable ? `${color}15` : 'transparent',
          boxShadow: `0 0 15px ${color}40`,
          transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1), height 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
      {/* Inner Dot */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 rounded-full"
        style={{
          width: isHoveringClickable ? '6px' : '4px',
          height: isHoveringClickable ? '6px' : '4px',
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
    </>
  );
}
