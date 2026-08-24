'use client';

import { ReactLenis } from '@studio-freight/react-lenis';
import { ReactNode } from 'react';

interface SmoothScrollProviderProps {
  children: ReactNode;
}

/**
 * Apple/Vercel-Grade Lenis Smooth Scroll Engine.
 * Configured with custom exponential momentum physics easing and adaptive touch response for mobile phones.
 */
export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  return (
    <ReactLenis
      root
      options={{
        duration: 1.2,
        // Apple-grade exponential momentum deceleration easing curve
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.8, // Enhanced touch sensitivity for butter-smooth mobile swipes
        infinite: false,
      }}
    >
      {children as any}
    </ReactLenis>
  );
}

export default SmoothScrollProvider;
