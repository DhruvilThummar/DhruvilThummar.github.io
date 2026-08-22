'use client';

import { ReactLenis } from '@studio-freight/react-lenis';
import { ReactNode } from 'react';

interface SmoothScrollProviderProps {
  children: ReactNode;
}

/**
 * Premium Lenis Smooth Scroll Provider for Next.js 14 App Router.
 * Configured with physics matching Apple & Vercel tier web performance.
 */
export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.08,
        duration: 1.2,
        smoothWheel: true,
        syncTouch: true,
      }}
    >
      {children as any}
    </ReactLenis>
  );
}

export default SmoothScrollProvider;
