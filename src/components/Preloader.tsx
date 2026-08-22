'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { AnimatedSignature } from '@/components/ui/AnimatedSignature';

export function Preloader() {
  const [progress, setProgress] = useState(0);
  const [isExitReady, setIsExitReady] = useState(false);
  const { hydrateFromDB, setPreloaderComplete } = usePortfolioStore();

  useEffect(() => {
    let animationFrameId: number;
    let isMounted = true;

    async function initPreloader() {
      const startTime = performance.now();
      const TOTAL_DURATION = 2000; // 2 seconds minimum display time

      // Fire IndexedDB hydration in background
      hydrateFromDB().catch(console.warn);

      // Smooth 2-second (2000ms) counter step function
      const step = (timestamp: number) => {
        const elapsed = timestamp - startTime;
        // Ease-out cubic progression for smooth counting feeling
        const progressRatio = Math.min(1, elapsed / TOTAL_DURATION);
        const easedProgress = Math.floor(100 * (1 - Math.pow(1 - progressRatio, 3)));

        if (isMounted) {
          setProgress(easedProgress);
        }

        if (elapsed < TOTAL_DURATION) {
          animationFrameId = requestAnimationFrame(step);
        } else {
          if (isMounted) {
            setProgress(100);
            setTimeout(() => {
              if (isMounted) {
                setIsExitReady(true);
                setPreloaderComplete(true);
              }
            }, 300); // Elegant 300ms completion hold
          }
        }
      };

      animationFrameId = requestAnimationFrame(step);
    }

    initPreloader();

    return () => {
      isMounted = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [hydrateFromDB, setPreloaderComplete]);

  return (
    <AnimatePresence>
      {!isExitReady && (
        <div className="fixed inset-0 z-[9999] pointer-events-auto flex flex-col justify-between overflow-hidden bg-[#FCFCFC] select-none">
          {/* Top Curtain Panel */}
          <motion.div
            initial={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            className="absolute top-0 left-0 right-0 h-1/2 bg-[#FCFCFC] z-10"
          />

          {/* Bottom Curtain Panel */}
          <motion.div
            initial={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            className="absolute bottom-0 left-0 right-0 h-1/2 bg-[#FCFCFC] z-10"
          />

          {/* Center Counter Content Overlay */}
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="relative z-20 flex flex-col items-center justify-center w-full h-full p-6"
          >
            {/* Top Brand Monogram */}
            <div className="absolute top-8 left-8 md:top-12 md:left-12 flex items-center gap-3">
              <img src="/assets/dt-logo.svg" alt="DT Monogram" className="w-7 h-7 object-contain" />
              <span className="font-mono text-xs font-semibold tracking-widest text-[#09090B] uppercase">
                D R THUMMAR • ARCHITECT
              </span>
            </div>

            {/* Core Animated Progress Counter */}
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              {/* Animated Live Vector Signature Drawing */}
              <AnimatedSignature progress={progress} className="mb-2" />

              {/* Minimal Progress Bar Track */}
              <div className="w-48 md:w-64 h-[2px] bg-[#F2F2F7] rounded-full overflow-hidden relative">
                <motion.div
                  className="h-full bg-[#09090B]"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: 'linear', duration: 0.1 }}
                />
              </div>

              <span className="font-mono text-xs text-[#71717A] tracking-wider uppercase pt-2">
                {progress < 100 ? 'HYDRATING SYSTEM DATA & INDEXEDDB' : 'INITIALIZATION COMPLETE'}
              </span>
            </div>

            {/* Bottom Status Metadata */}
            <div className="absolute bottom-8 right-8 md:bottom-12 md:right-12 font-mono text-[10px] text-[#71717A] uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>[ CTO @ THE INTELLIVERSE ]</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default Preloader;
