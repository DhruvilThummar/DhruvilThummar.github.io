'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { MagneticWrapper } from './MagneticWrapper';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  magnetic?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/**
 * TouchTarget — Helper wrapper to ensure any custom interactive icon/link meets 44x44px Apple HIG.
 */
export function TouchTarget({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-[44px] min-h-[44px] inline-flex items-center justify-center ${className}`}>
      {children}
    </div>
  );
}

/**
 * Button — Premium Corporate Apple/Linear-style button component.
 *
 * Color Tokens:
 * - Primary: bg-[#09090B] (Jet Black with white text)
 * - Secondary: bg-white border border-[#F2F2F7] / border-black/[0.08] with #0066CC hover text
 * - Glass: bg-white/70 backdrop-blur-xl border border-white/80
 * - Ghost: bg-transparent text-slate-700 hover:text-[#0066CC] hover:bg-[#F2F2F7]
 */
export function Button({
  variant = 'primary',
  size = 'md',
  href,
  magnetic = true,
  children,
  className = '',
  ...props
}: ButtonProps) {
  // ── Variant & Touch Target Base Classes ───────────────────
  const baseStyles =
    'inline-flex items-center justify-center font-sans font-medium rounded-full cursor-pointer transition-all duration-200 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-2 min-h-[44px] min-w-[44px] touch-manipulation';

  const variants = {
    primary:
      'bg-[#09090B] text-white hover:bg-slate-900 shadow-sm active:scale-[0.98]',
    secondary:
      'bg-white border border-black/[0.08] text-[#09090B] hover:border-[#0066CC]/30 hover:text-[#0066CC] hover:bg-zinc-50 shadow-sm active:scale-[0.98]',
    glass:
      'bg-white/70 backdrop-blur-xl border border-white/80 text-[#09090B] hover:text-[#0066CC] hover:bg-white/90 shadow-[0_4px_20px_rgb(0,0,0,0.03)] active:scale-[0.98]',
    ghost:
      'bg-transparent text-[#71717A] hover:text-[#0066CC] hover:bg-[#F2F2F7] active:scale-[0.98]',
  };

  const sizes = {
    sm: 'text-xs px-4 py-2.5 gap-1.5 min-h-[44px]',
    md: 'text-sm px-5.5 py-3 gap-2 min-h-[44px]',
    lg: 'text-base px-7 py-3.5 gap-2.5 min-h-[48px]',
  };

  const combinedClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  const buttonContent = (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={combinedClasses}
      {...props}
    >
      {children}
    </motion.button>
  );

  const anchorContent = (
    <motion.a
      href={href}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={combinedClasses}
    >
      {children}
    </motion.a>
  );

  const content = href ? anchorContent : buttonContent;

  if (magnetic) {
    return <MagneticWrapper>{content}</MagneticWrapper>;
  }

  return content;
}
