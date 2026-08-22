'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { ArrowRight, Download, Sparkles, Github, Linkedin, Mail, Cpu, Zap } from 'lucide-react';
import { profileData } from '@/data/profile';

// ==========================================
// 💡 Feature 4: Suspense Skeleton Loader for Seamless Boot
// ==========================================
function HeroSkeleton() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#FCFCFC] relative overflow-hidden">
      {/* Subtle Alabaster Grid Background Overlay */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #E4E4E7 1px, transparent 1px), linear-gradient(to bottom, #E4E4E7 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/90 backdrop-blur-md border border-black/[0.08] rounded-full shadow-xs">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0066CC]" />
          </span>
          <span className="font-mono text-xs font-bold text-[#09090B] tracking-wider animate-pulse">
            [ ENGINE BOOTING... ]
          </span>
        </div>
        <p className="font-mono text-[11px] text-[#71717A] tracking-tight">
          INITIALIZING R3F RAPIER VEHICLE PHYSICS
        </p>
      </div>
    </div>
  );
}

// Dynamically import InteractiveHeroCar with ssr: false for optimal client-side WebGL compilation
const InteractiveHeroCar = dynamic(() => import('@/components/InteractiveHeroCar'), {
  ssr: false,
  loading: () => <HeroSkeleton />,
});

// Framer Motion Stagger Variants for Entrance Choreography
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1], // Custom Apple-grade cubic-bezier
    },
  },
};

export function HeroSection() {
  return (
    <section className="relative h-[100dvh] w-full overflow-hidden bg-[#FCFCFC]">
      {/* ==========================================
          1. 3D WebGL Game Canvas Background (z-0) wrapped in Suspense
          ========================================== */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<HeroSkeleton />}>
          <InteractiveHeroCar />
        </Suspense>
      </div>

      {/* Ambient Subtle Aurora Overlay (pointer-events-none) */}
      <div className="aurora-background pointer-events-none opacity-40 z-0" />

      {/* ==========================================
          2. Hero HTML Content Overlay (z-10, pointer-events-none)
          ========================================== */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between pt-24 pb-8 md:pt-28 md:pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Top & Main Headline Content Container */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-2xl space-y-4 sm:space-y-6 pt-4"
        >
          {/* A. Live Status & Sub-Headline Pill Bar */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/85 backdrop-blur-md border border-black/[0.08] rounded-full shadow-xs pointer-events-auto">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-mono text-xs font-semibold text-[#09090B] tracking-tight">
                SYSTEM ONLINE: AHMEDABAD, IN
              </span>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/70 backdrop-blur-md border border-black/[0.06] rounded-full pointer-events-auto">
              <Sparkles className="w-3.5 h-3.5 text-[#0066CC]" />
              <span className="font-mono text-xs font-medium text-[#71717A]">
                Co-founder &amp; CTO @ The Intelliverse
              </span>
            </div>
          </motion.div>

          {/* B. Main Fluid Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-[clamp(2.75rem,5.5vw,5.25rem)] font-heading font-extrabold tracking-tight text-[#09090B] leading-[0.98] drop-shadow-xs"
          >
            D R Thummar
          </motion.h1>

          {/* C. Role Sub-headline & Bio */}
          <motion.div variants={itemVariants} className="space-y-3">
            <h2 className="text-lg md:text-xl font-heading font-semibold text-[#09090B] tracking-tight leading-snug">
              Machine Learning, Data Analytics &amp;{' '}
              <span className="font-serif-italic font-normal italic text-[#0066CC]">
                Systems Architect
              </span>
            </h2>

            <p className="text-xs sm:text-sm md:text-base font-sans leading-[1.6] text-[#3F3F46] max-w-xl bg-white/60 backdrop-blur-sm p-3.5 sm:p-4 rounded-2xl border border-black/[0.04]">
              Computer Engineering student specializing in{' '}
              <strong className="font-semibold text-[#09090B]">Machine Learning</strong>,{' '}
              <strong className="font-semibold text-[#09090B]">Data Analytics</strong>, and{' '}
              <strong className="font-semibold text-[#09090B]">MERN Stack</strong> web engineering.{' '}
              <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#F2F2F7] border border-black/[0.08] text-[#0066CC] font-semibold align-middle mx-0.5 pointer-events-auto">
                IBM-CERTIFIED
              </span>{' '}
              Architecting 3-tier platforms, predictive ML pipelines, real-time engines, and high-performance WebGL experiences.
            </p>
          </motion.div>

          {/* D. Apple-Grade CTAs (pointer-events-auto for full clickability) */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3.5 pt-1">
            {/* Primary Jet Black Button */}
            <a
              href="#projects"
              className="bg-[#09090B] text-white hover:bg-black/90 px-6 py-3.5 rounded-full font-medium transition-all shadow-sm hover:shadow-md flex items-center gap-2 group touch-target text-xs sm:text-sm pointer-events-auto cursor-pointer"
            >
              <span>View Projects</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>

            {/* Secondary Frosted Glass Button */}
            <a
              href={profileData.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/80 backdrop-blur-md border border-black/[0.08] text-[#09090B] hover:bg-white hover:border-black/20 px-6 py-3.5 rounded-full font-medium transition-all shadow-xs flex items-center gap-2 touch-target text-xs sm:text-sm pointer-events-auto cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#71717A]" />
              <span>Resume Protocol</span>
            </a>
          </motion.div>
        </motion.div>

        {/* Bottom Social & Telemetry Bar (pointer-events-auto) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full pt-4 border-t border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs text-[#71717A] bg-white/40 backdrop-blur-xs px-4 py-2.5 rounded-xl"
        >
          {/* Social Links */}
          <div className="flex items-center gap-4 pointer-events-auto">
            <a
              href={profileData.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#09090B] transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
            >
              <Github className="w-4 h-4 text-[#09090B]" />
              <span>GitHub</span>
            </a>
            <a
              href={profileData.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#09090B] transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
            >
              <Linkedin className="w-4 h-4 text-[#0066CC]" />
              <span>LinkedIn</span>
            </a>
            <a
              href={`mailto:${profileData.email}`}
              className="hover:text-[#09090B] transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
            >
              <Mail className="w-4 h-4 text-[#71717A]" />
              <span>Contact</span>
            </a>
          </div>

          {/* Micro Telemetry Badges */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] sm:text-[11px] pointer-events-auto">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-black/[0.08] rounded-md text-[#09090B] font-medium shadow-2xs hover:border-[#0066CC]/30 transition-all">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="text-[#71717A]">PHYSICS:</span>
              <span className="font-semibold text-[#0066CC]">RAPIER 60FPS</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F2F2F7] border border-black/[0.04] rounded-md text-[#09090B] font-medium hover:bg-white hover:border-black/[0.08] transition-all">
              <Cpu className="w-3 h-3 text-[#0066CC]" />
              <span className="text-[#71717A]">STACK:</span>
              <span className="font-semibold text-[#09090B]">R3F + NEXT.JS</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default HeroSection;
