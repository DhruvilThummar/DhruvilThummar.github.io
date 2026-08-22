'use client';

import React from 'react';

export interface FluidGridProps {
  children: React.ReactNode;
  minWidth?: number; // Minimum card width before wrapping (e.g. 300px)
  gap?: string; // e.g., '1.5rem' or '2rem'
  className?: string;
}

/**
 * FluidGrid — Bulletproof zero-breakpoint responsive grid container.
 *
 * Uses CSS Grid `repeat(auto-fit, minmax(min(100%, minWidth), 1fr))` to create
 * a water-like layout adaptivity without fragile media-query breakpoint jumps.
 */
export function FluidGrid({
  children,
  minWidth = 300,
  gap = '1.5rem',
  className = '',
}: FluidGridProps) {
  return (
    <div
      className={`grid w-full ${className}`}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minWidth}px), 1fr))`,
        gap,
      }}
    >
      {children}
    </div>
  );
}

export default FluidGrid;
