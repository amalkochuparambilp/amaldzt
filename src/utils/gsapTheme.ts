import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export interface GsapThemeConfig {
  accentColor: string; // e.g. '#0ae448'
  glowIntensity: 'subtle' | 'high' | 'off';
  cursorFollower: boolean;
  speedMultiplier: number;
  easing: string;
}

export const DEFAULT_GSAP_THEME: GsapThemeConfig = {
  accentColor: '#0ae448', // Official GSAP Neon Green
  glowIntensity: 'high',
  cursorFollower: true,
  speedMultiplier: 1,
  easing: 'power4.out',
};

// Easing presets with real descriptions and mathematical representations
export const GSAP_EASING_PRESETS = [
  { name: 'power4.out', label: 'Power 4 (Smooth Decel)', desc: 'Ultra-refined decelerating ease' },
  { name: 'elastic.out(1, 0.3)', label: 'Elastic (Playful Spring)', desc: 'Snappy fluid spring bounce' },
  { name: 'back.out(1.7)', label: 'Back Out (Overshoot)', desc: 'Subtle punchy overshoot' },
  { name: 'expo.out', label: 'Expo Out (Cinematic)', desc: 'High-speed dramatic slow-down' },
  { name: 'circ.out', label: 'Circ Out (Sharp Ease)', desc: 'Clean circular deceleration curve' },
  { name: 'bounce.out', label: 'Bounce (Gravity)', desc: 'Realistic kinetic physics bounce' },
];

export const GSAP_PALETTES = [
  { id: 'gsap-classic', name: 'GSAP Neon Lime', hex: '#0ae448', glow: 'rgba(10, 228, 72, 0.4)' },
  { id: 'hyper-cyan', name: 'Velocity Cyan', hex: '#00f0ff', glow: 'rgba(0, 240, 255, 0.4)' },
  { id: 'electric-mint', name: 'Electric Mint', hex: '#00ff87', glow: 'rgba(0, 255, 135, 0.4)' },
  { id: 'amber-glow', name: 'Solar Gold', hex: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' },
];

/**
 * Hook to apply smooth GSAP magnetic pull on hover
 */
export function useGsapMagnetic<T extends HTMLElement = HTMLButtonElement>(strength: number = 0.35) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * strength;
      const y = (e.clientY - rect.top - rect.height / 2) * strength;

      gsap.to(el, {
        x,
        y,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: 'elastic.out(1, 0.3)',
        overwrite: 'auto',
      });
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [strength]);

  return ref;
}

/**
 * Hook to apply 3D perspective tilt on cards using GSAP
 */
export function useGsap3DTilt<T extends HTMLElement = HTMLDivElement>(maxRotation: number = 10) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      gsap.to(el, {
        rotationY: x * maxRotation * 2,
        rotationX: -y * maxRotation * 2,
        transformPerspective: 1000,
        scale: 1.015,
        duration: 0.4,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(el, {
        rotationY: 0,
        rotationX: 0,
        scale: 1,
        duration: 0.7,
        ease: 'elastic.out(1, 0.4)',
        overwrite: 'auto',
      });
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [maxRotation]);

  return ref;
}

/**
 * Hook to read real-time GSAP ticker FPS and active tweens
 */
export function useGsapTicker() {
  const [fps, setFps] = useState(60);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const tickerCallback = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 500) {
        const currentFps = Math.round((frameCount * 1000) / (now - lastTime));
        setFps(Math.min(60, Math.max(30, currentFps)));
        frameCount = 0;
        lastTime = now;
      }
    };

    gsap.ticker.add(tickerCallback);
    return () => {
      gsap.ticker.remove(tickerCallback);
    };
  }, []);

  return { fps };
}
