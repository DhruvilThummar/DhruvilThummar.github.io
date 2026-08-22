'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface SectionWrapperProps extends HTMLMotionProps<'section'> {
  children: React.ReactNode;
  id?: string;
  className?: string;
  containerClassName?: string;
}

/**
 * SectionWrapper — Vercel/Linear-tier global section layout wrapper.
 *
 * Spacing ergonomics:
 * - Fluid padding horizontal: `px-[clamp(1rem,5vw,3rem)]`
 * - Fluid padding vertical: `py-[clamp(4rem,10vw,8rem)]`
 * - Maximum layout width: `max-w-7xl mx-auto`
 */
export function SectionWrapper({
  children,
  id,
  className = '',
  containerClassName = '',
  ...props
}: SectionWrapperProps) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`w-full py-[clamp(4rem,10vw,8rem)] relative z-10 ${className}`}
      {...props}
    >
      <div className={`w-full max-w-7xl mx-auto px-[clamp(1rem,5vw,3rem)] ${containerClassName}`}>
        {children}
      </div>
    </motion.section>
  );
}

export default SectionWrapper;
