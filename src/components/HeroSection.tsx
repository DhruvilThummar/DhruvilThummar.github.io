'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Download, Sparkles, Github, Linkedin, Mail, Cpu, Activity, Zap } from 'lucide-react';
import { AbstractHeroWrapper } from '@/components/AbstractHeroWrapper';
import { profileData } from '@/data/profile';

// Framer Motion Stagger Variants for Entrance Choreography
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
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
    <section className="relative min-h-[100dvh] w-full flex items-center justify-center overflow-hidden bg-[#FCFCFC] pt-24 pb-16 md:pt-32 md:pb-24">
      {/* Ambient Aurora Gradient Mesh with Apple Blue Glow */}
      <div className="aurora-background pointer-events-none" />

      {/* Grid Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Text & CTAs (Priority on Mobile & Desktop) */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-7 flex flex-col justify-center space-y-6 sm:space-y-8 z-10"
          >
            {/* 1. Live Status Trust Indicator & Sub-Headline Pill */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-full shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="font-mono text-xs font-semibold text-[#09090B] tracking-tight">
                  SYSTEM ONLINE: AHMEDABAD, IN
                </span>
              </div>

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#F2F2F7] border border-black/[0.04] rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-[#0066CC]" />
                <span className="font-mono text-xs font-medium text-[#71717A]">
                  Co-founder &amp; CTO @ The Intelliverse · B.Tech CE @ LJU
                </span>
              </div>
            </motion.div>

            {/* 2. Main Fluid Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-[clamp(3rem,6.5vw,5.75rem)] font-heading font-extrabold tracking-tight text-[#09090B] leading-[0.98]"
            >
              D R Thummar
            </motion.h1>

            {/* 3. Role Sub-headline & Editorial Bio Paragraph */}
            <motion.div variants={itemVariants} className="space-y-4 max-w-2xl">
              <h2 className="text-xl md:text-2xl font-heading font-semibold text-[#09090B] tracking-tight leading-snug">
                Machine Learning, Data Analytics &amp;{' '}
                <span className="font-serif-italic font-normal italic text-[#0066CC]">
                  Systems Architect
                </span>
              </h2>

              <p className="text-[clamp(1rem,1.15vw,1.125rem)] font-sans leading-[1.7] text-[#3F3F46]">
                Computer Engineering student specializing in{' '}
                <strong className="font-semibold text-[#09090B]">Machine Learning</strong> (Scikit-Learn, CatBoost),{' '}
                <strong className="font-semibold text-[#09090B]">Data Analytics</strong> (Pandas, EDA), and{' '}
                <strong className="font-semibold text-[#09090B]">MERN Stack</strong> web engineering.{' '}
                <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-[#F2F2F7] border border-black/[0.08] text-[#0066CC] font-semibold align-middle mx-0.5">
                  IBM-CERTIFIED
                </span>{' '}
                in Python for Data Science &amp; EDA for ML. Experienced in architecting{' '}
                <span className="font-medium text-[#09090B]">3-tier microservice platforms</span>, predictive modeling pipelines, real-time Socket.io applications, and sub-50ms database optimizations.
              </p>
            </motion.div>

            {/* 4. Apple-Grade CTAs */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4 pt-2">
              {/* Primary Jet Black Button */}
              <a
                href="#projects"
                className="bg-[#09090B] text-white hover:bg-black/90 px-7 py-4 rounded-full font-medium transition-all shadow-sm hover:shadow-md flex items-center gap-2 group touch-target text-sm"
              >
                <span>View Projects</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>

              {/* Secondary Frosted Glass Button */}
              <a
                href={profileData.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/80 backdrop-blur-md border border-black/[0.08] text-[#09090B] hover:bg-white hover:border-black/20 px-7 py-4 rounded-full font-medium transition-all shadow-xs flex items-center gap-2 touch-target text-sm"
              >
                <Download className="w-4 h-4 text-[#71717A]" />
                <span>Resume Protocol</span>
              </a>
            </motion.div>

            {/* 5. Social & Ultra-Refined Telemetry Badge Bar */}
            <motion.div
              variants={itemVariants}
              className="pt-6 border-t border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs text-[#71717A]"
            >
              <div className="flex items-center gap-5">
                <a
                  href={profileData.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#09090B] transition-colors flex items-center gap-1.5 font-medium"
                >
                  <Github className="w-4 h-4 text-[#09090B]" />
                  <span>GitHub</span>
                </a>
                <a
                  href={profileData.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#09090B] transition-colors flex items-center gap-1.5 font-medium"
                >
                  <Linkedin className="w-4 h-4 text-[#0066CC]" />
                  <span>LinkedIn</span>
                </a>
                <a
                  href={`mailto:${profileData.email}`}
                  className="hover:text-[#09090B] transition-colors flex items-center gap-1.5 font-medium"
                >
                  <Mail className="w-4 h-4 text-[#71717A]" />
                  <span>Contact</span>
                </a>
              </div>

              {/* Vercel-Tier Micro Telemetry Badges */}
              <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-black/[0.08] rounded-md text-[#09090B] font-medium shadow-2xs hover:border-[#0066CC]/30 transition-all">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  <span className="text-[#71717A]">LATENCY:</span>
                  <span className="font-semibold text-[#0066CC]">&lt;10ms</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F2F2F7] border border-black/[0.04] rounded-md text-[#09090B] font-medium hover:bg-white hover:border-black/[0.08] transition-all">
                  <Cpu className="w-3 h-3 text-[#0066CC]" />
                  <span className="text-[#71717A]">STACK:</span>
                  <span className="font-semibold text-[#09090B]">MERN + ML ENGINE</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column: Interactive 3D WebGL Canvas Container */}
          <div className="lg:col-span-5 relative w-full h-[380px] sm:h-[480px] lg:h-[550px] flex items-center justify-center">
            <div className="w-full h-full relative">
              <AbstractHeroWrapper />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default HeroSection;
