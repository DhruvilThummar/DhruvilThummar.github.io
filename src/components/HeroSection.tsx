'use client';

import React, { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Download,
  Sparkles,
  Github,
  Linkedin,
  Mail,
  Cpu,
  Clock,
  Brain,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { profileData } from '@/data/profile';

// ==========================================
// 💡 Suspense Skeleton Loader for Seamless Boot
// ==========================================
function HeroSkeleton() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#FCFCFC] relative overflow-hidden">
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
            [ INITIALIZING 3D ENGINE... ]
          </span>
        </div>
      </div>
    </div>
  );
}

// Dynamic Imports for 3D Scenes
const InteractiveHeroCar = dynamic(() => import('@/components/InteractiveHeroCar'), {
  ssr: false,
  loading: () => <HeroSkeleton />,
});

const AbstractHeroWrapper = dynamic(() => import('@/components/AbstractHeroWrapper'), {
  ssr: false,
  loading: () => <HeroSkeleton />,
});

// Roles for Dynamic Carousel
const heroRoles = [
  { title: 'Co-founder & CTO', org: '@ The Intelliverse', icon: Sparkles, color: 'text-[#0066CC]' },
  { title: 'Machine Learning & Data Analytics', org: 'Engineer', icon: Brain, color: 'text-indigo-600' },
  { title: 'MERN Stack Systems', org: 'Architect', icon: Cpu, color: 'text-sky-600' },
  { title: 'IBM-Certified Data Science', org: 'Specialist', icon: ShieldCheck, color: 'text-blue-700' },
];



// Highlights / Metrics Strip
const heroMetrics = [
  { label: 'EXPERIENCE', value: '3+ Years', sub: 'ML & Full-Stack' },
  { label: 'LEADERSHIP', value: 'Co-founder & CTO', sub: 'The Intelliverse' },
  { label: 'EDUCATION', value: 'L.J. University', sub: 'B.E. Comp. Engg.' },
  { label: 'VERIFIED', value: 'IBM Certified', sub: 'Data Science' },
];

// Framer Motion Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export function HeroSection() {
  // Automatic device detection: 'car' on PC / Desktop, 'sphere' on Phone / Mobile
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [roleIndex, setRoleIndex] = useState(0);
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cycle roles every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRoleIndex((prev) => (prev + 1) % heroRoles.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Update live IST / Ahmedabad time string
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      setTimeString(new Intl.DateTimeFormat('en-US', options).format(now));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const ActiveRoleIcon = heroRoles[roleIndex].icon;

  return (
    <section className="relative min-h-[100dvh] w-full overflow-hidden bg-[#FCFCFC] flex flex-col justify-between pt-20 pb-6 md:pt-24 md:pb-8">
      {/* ==========================================
          1. 3D WebGL Canvas Background Layer (z-0)
             - PC (Desktop): 3D Arcade Car Game Engine
             - Phone (Mobile): Interactive Glass Sphere (smooth lag-free scrolling)
          ========================================== */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Suspense fallback={<HeroSkeleton />}>
          {isMobile === false && <InteractiveHeroCar />}
          {isMobile === true && <AbstractHeroWrapper />}
        </Suspense>
      </div>

      {/* Ambient Lighting Spotlights & Aurora Overlay */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-[#0066CC]/10 via-sky-400/10 to-transparent blur-3xl pointer-events-none z-0 rounded-full" />
      <div className="aurora-background pointer-events-none opacity-30 z-0" />

      {/* ==========================================
          2. Hero Content Overlay Container (z-10)
          ========================================== */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex-1 flex flex-col justify-between pointer-events-none">
        
        {/* Top Header Bar */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full flex flex-wrap items-center justify-between gap-3 pt-2 pointer-events-auto"
        >
          {/* Status & Live Clock Ticker */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/90 backdrop-blur-md border border-black/[0.08] rounded-full shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-mono text-xs font-semibold text-[#09090B] tracking-tight">
                SYSTEM ONLINE: AHMEDABAD, IN
              </span>
            </div>

            {timeString && (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/75 backdrop-blur-md border border-black/[0.06] rounded-full font-mono text-xs text-[#71717A]">
                <Clock className="w-3.5 h-3.5 text-[#0066CC]" />
                <span>{timeString} IST</span>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Main Body Headline & Role Container */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-3xl space-y-4 sm:space-y-6 my-auto pt-6 pb-6 pointer-events-auto"
        >
          {/* Dynamic Role Carousel Pill */}
          <motion.div variants={itemVariants} className="h-9 flex items-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={roleIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/90 backdrop-blur-md border border-black/[0.08] rounded-full shadow-xs"
              >
                <ActiveRoleIcon className={`w-4 h-4 ${heroRoles[roleIndex].color}`} />
                <span className="font-mono text-xs font-semibold text-[#09090B]">
                  {heroRoles[roleIndex].title}
                </span>
                <span className="font-mono text-xs text-[#71717A]">
                  {heroRoles[roleIndex].org}
                </span>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Main Shimmer Headline */}
          <motion.div variants={itemVariants} className="space-y-1">
            <h1 className="text-[clamp(3rem,6vw,5.5rem)] font-heading font-extrabold tracking-tight leading-[0.95] text-[#09090B]">
              D R{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#09090B] via-[#0066CC] to-[#09090B] animate-pulse">
                Thummar
              </span>
            </h1>
          </motion.div>

          {/* Bio & Architectural Summary */}
          <motion.div variants={itemVariants} className="space-y-3">
            <p className="text-sm sm:text-base md:text-lg font-sans leading-[1.65] text-[#3F3F46] max-w-2xl bg-white/75 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-black/[0.06] shadow-xs">
              Computer Engineering student specializing in{' '}
              <strong className="font-semibold text-[#09090B]">Machine Learning</strong>,{' '}
              <strong className="font-semibold text-[#09090B]">Data Analytics</strong>, and{' '}
              <strong className="font-semibold text-[#09090B]">MERN Stack</strong> systems.{' '}
              <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#0066CC]/10 border border-[#0066CC]/20 text-[#0066CC] font-bold align-middle mx-1">
                <CheckCircle2 className="w-3 h-3" /> IBM-CERTIFIED
              </span>{' '}
              Architecting 3-tier enterprise applications, predictive pipelines, and 60FPS WebGL engines.
            </p>
          </motion.div>



          {/* Apple-Grade CTAs */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3.5 pt-2">
            <a
              href="#projects"
              className="bg-[#09090B] text-white hover:bg-black/90 px-6 py-3.5 rounded-full font-medium transition-all shadow-sm hover:shadow-md flex items-center gap-2 group text-xs sm:text-sm min-h-[48px] touch-target cursor-pointer"
            >
              <span>View Projects</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>

            <a
              href={profileData.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/85 backdrop-blur-md border border-black/[0.08] text-[#09090B] hover:bg-white hover:border-black/20 px-6 py-3.5 rounded-full font-medium transition-all shadow-xs flex items-center gap-2 text-xs sm:text-sm min-h-[48px] touch-target cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#0066CC]" />
              <span>Resume Protocol</span>
            </a>
          </motion.div>
        </motion.div>

        {/* Highlights & Metrics Glass Strip */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full pt-4 pointer-events-auto"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            {heroMetrics.map((metric) => (
              <div
                key={metric.label}
                className="bg-white/70 backdrop-blur-md border border-black/[0.06] p-3 rounded-xl shadow-2xs hover:border-[#0066CC]/20 transition-all"
              >
                <span className="block font-mono text-[9px] sm:text-[10px] text-[#71717A] tracking-wider uppercase font-semibold">
                  {metric.label}
                </span>
                <span className="block font-heading font-bold text-sm sm:text-base text-[#09090B] truncate">
                  {metric.value}
                </span>
                <span className="block font-mono text-[10px] text-[#0066CC] font-medium truncate">
                  {metric.sub}
                </span>
              </div>
            ))}
          </div>

          {/* Bottom Social & Telemetry Bar */}
          <div className="mt-3 w-full border-t border-black/[0.06] pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs text-[#71717A] bg-white/50 backdrop-blur-xs px-4 py-2.5 rounded-xl">
            <div className="flex items-center gap-4">
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

            <div className="flex items-center gap-2 font-mono text-[10px] sm:text-[11px]">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-black/[0.08] rounded-md text-[#09090B] font-medium shadow-2xs">
                <Cpu className="w-3 h-3 text-[#0066CC]" />
                <span className="text-[#71717A]">ENGINE:</span>
                <span className="font-semibold text-[#0066CC] uppercase">
                  {isMobile ? '3D GLASS SPHERE' : '3D RAPIER CAR ENGINE'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default HeroSection;
