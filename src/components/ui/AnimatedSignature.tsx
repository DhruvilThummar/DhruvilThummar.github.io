'use client';

import React from 'react';

interface AnimatedSignatureProps {
  progress: number; // 0 to 100
  className?: string;
}

export function AnimatedSignature({ progress, className = '' }: AnimatedSignatureProps) {
  // Synchronize stroke-dashoffset with preloader progress (0 -> 100%)
  const PATH_TOTAL_LENGTH = 1500;
  
  // Main signature stroke finishes drawing by 80% progress
  const mainProgress = Math.min(1, progress / 80);
  const mainDashoffset = PATH_TOTAL_LENGTH * (1 - mainProgress);

  // Underline flourish stroke draws from 70% to 100% progress
  const strikeProgress = Math.max(0, Math.min(1, (progress - 70) / 30));
  const strikeDashoffset = PATH_TOTAL_LENGTH * (1 - strikeProgress);

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* Luminous Apple Blue Ambient Backdrop Glow */}
      <div className="absolute inset-0 bg-[#0066CC]/15 blur-3xl rounded-full scale-150 pointer-events-none" />

      <svg
        width="340"
        height="120"
        viewBox="0 0 280 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[280px] sm:w-[340px] h-auto relative z-10 drop-shadow-sm"
      >
        <defs>
          <linearGradient id="sig-stroke-blue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0066CC" />
            <stop offset="50%" stopColor="#00BFFF" />
            <stop offset="100%" stopColor="#09090B" />
          </linearGradient>
        </defs>

        <g>
          {/* Main Signature Path - Live Handcrafted Drawing */}
          <path
            id="signature-path-live"
            d="M40 75 C 10 10, 100 10, 100 50 C 100 90, 40 95, 40 75 L 90 30 C 110 40, 115 75, 130 65 L 140 50 C 145 70, 155 70, 160 50 L 170 70 L 180 50 L 190 70 L 200 50 L 210 70 L 220 50 L 230 70 L 260 40"
            stroke="url(#sig-stroke-blue)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            style={{
              strokeDasharray: PATH_TOTAL_LENGTH,
              strokeDashoffset: mainDashoffset,
              transition: 'stroke-dashoffset 0.1s linear',
            }}
          />

          {/* Underline Flourish Path */}
          <path
            id="strike-path-live"
            d="M20 68 C 100 55, 180 75, 270 62"
            stroke="url(#sig-stroke-blue)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            style={{
              strokeDasharray: PATH_TOTAL_LENGTH,
              strokeDashoffset: strikeDashoffset,
              transition: 'stroke-dashoffset 0.1s ease-out',
            }}
          />
        </g>
      </svg>
    </div>
  );
}

export default AnimatedSignature;
