'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface MagneticWrapperProps {
  children: React.ReactNode;
  /** How far the element can shift toward the cursor (px). Default: 4 */
  strength?: number;
  /** Framer Motion spring stiffness. Default: 150 */
  stiffness?: number;
  /** Framer Motion spring damping. Default: 15 */
  damping?: number;
  className?: string;
}

/**
 * MagneticWrapper — Adds a subtle magnetic pull effect to any child element.
 *
 * On hover, the element shifts toward the cursor position within its bounds,
 * creating a physical, tactile depth reminiscent of Apple's interaction design.
 *
 * Uses Framer Motion spring physics for natural, organic movement.
 */
export function MagneticWrapper({
  children,
  strength = 4,
  stiffness = 150,
  damping = 15,
  className,
}: MagneticWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate offset from center, normalized to -1..1, then scaled by strength
    const deltaX = ((e.clientX - centerX) / (rect.width / 2)) * strength;
    const deltaY = ((e.clientY - centerY) / (rect.height / 2)) * strength;

    setPosition({ x: deltaX, y: deltaY });
  }

  function handleMouseLeave() {
    setPosition({ x: 0, y: 0 });
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{
        type: 'spring',
        stiffness,
        damping,
        mass: 0.1,
      }}
      className={className}
      style={{ display: 'inline-block' }}
    >
      {children}
    </motion.div>
  );
}
