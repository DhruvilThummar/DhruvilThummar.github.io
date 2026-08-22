'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom';
  className?: string;
}

/**
 * Tooltip — Framer Motion spring-animated contextual popover tooltip.
 *
 * Used on skill badges to display architectural context (e.g., "Architected backends for Appointory & BUS-IQ").
 */
export function Tooltip({
  content,
  children,
  position = 'top',
  className = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.9,
              y: position === 'top' ? 4 : -4,
            }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: position === 'top' ? 4 : -4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`absolute left-1/2 -translate-x-1/2 z-50 whitespace-nowrap pointer-events-none ${
              position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}
          >
            <div className="bg-slate-900/90 text-white text-xs font-sans font-medium px-3 py-1.5 rounded-lg shadow-lg border border-slate-700/50 backdrop-blur-md">
              {content}
            </div>
            {/* Arrow indicator */}
            <div
              className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-slate-900/90 ${
                position === 'top' ? '-bottom-1' : '-top-1'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
