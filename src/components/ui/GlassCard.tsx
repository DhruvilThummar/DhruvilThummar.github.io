'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface GlassCardProps extends HTMLMotionProps<'div'> {
  children?: React.ReactNode;
  variant?: 'default' | 'elevated' | 'bordered';
  hoverEffect?: boolean;
  className?: string;
}

/**
 * GlassCard — Apple-style physical frosted glass container.
 *
 * Features:
 * - Ultra-clean off-white backdrop blur with 180% saturation (`backdrop-blur-xl backdrop-saturate-180`).
 * - Soft physical drop shadow (`shadow-[0_8px_30px_rgb(0,0,0,0.04)]`).
 * - Fluid padding (`p-6 md:p-8 lg:p-10`) and rounded corners (`rounded-2xl md:rounded-3xl`).
 * - Multi-browser compatibility across Chrome, Safari, and Firefox.
 */
export function GlassCard({
  children,
  variant = 'default',
  hoverEffect = true,
  className = '',
  style,
  ...props
}: GlassCardProps) {
  const baseStyles =
    'relative overflow-hidden rounded-2xl md:rounded-3xl transition-all duration-300 glass-panel';

  const variants = {
    default:
      'bg-white/60 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]',
    elevated:
      'bg-white/80 border border-white shadow-[0_20px_50px_rgb(0,0,0,0.06)]',
    bordered:
      'bg-white/40 border border-slate-200/70 shadow-sm',
  };

  // Hover effect guarded for fine pointers
  const hoverStyles = hoverEffect
    ? 'hover-elevate cursor-pointer'
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`${baseStyles} ${variants[variant]} ${hoverStyles} ${className}`}
      style={{
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        backdropFilter: 'blur(20px) saturate(180%)',
        ...style,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
