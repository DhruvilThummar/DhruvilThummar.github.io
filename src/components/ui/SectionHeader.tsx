'use client';

import React from 'react';

export interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  italicAccent?: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
  headerId?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  italicAccent,
  description,
  align = 'left',
  className = '',
  headerId,
}: SectionHeaderProps) {
  const alignmentClasses = align === 'center' ? 'text-center mx-auto' : 'text-left';

  return (
    <div
      id={headerId}
      className={`max-w-3xl mb-12 md:mb-16 gsap-reveal-header ${alignmentClasses} ${className}`}
    >
      {/* 1. Uppercase Spaced Eyebrow (0.15em tracking) */}
      <span className="font-mono text-xs text-[#0066CC] uppercase tracking-[0.15em] font-semibold block mb-3">
        {eyebrow}
      </span>

      {/* 2. Bold Geometric Main Title with Optional Editorial Serif Accent */}
      <h2 className="text-3xl md:text-5xl lg:text-6xl font-heading font-bold tracking-tight text-[#09090B] leading-[1.08] mb-4">
        {title}{' '}
        {italicAccent && (
          <span className="font-serif-italic font-normal italic text-[#0066CC] font-serif">
            {italicAccent}
          </span>
        )}
      </h2>

      {/* 3. Clean Secondary Description Paragraph (1.65 line-height) */}
      {description && (
        <p className="text-[#71717A] text-base md:text-lg leading-relaxed font-sans font-normal">
          {description}
        </p>
      )}
    </div>
  );
}

export default SectionHeader;
