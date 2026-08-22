'use client';

import React, { useState } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { Search, FileDown, Menu, X, ArrowRight } from 'lucide-react';
import { profileData } from '@/data/profile';

export function Navbar() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 50);
  });

  const navLinks = [
    { label: 'About', href: '#about' },
    { label: 'Skills', href: '#skills' },
    { label: 'Projects', href: '#projects' },
    { label: 'Credentials', href: '#certifications' },
    { label: 'Team', href: '#team' },
    { label: 'Contact', href: '#contact' },
  ];

  function handleNavClick(href: string) {
    setMobileMenuOpen(false);
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4 md:p-6 transition-all duration-300 pointer-events-none">
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className={`pointer-events-auto flex items-center justify-between transition-all duration-300 ${
            isScrolled
              ? 'w-full max-w-4xl bg-white/85 backdrop-blur-2xl border border-black/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.08)] rounded-full px-5 py-2'
              : 'w-full max-w-7xl bg-white/75 backdrop-blur-md border border-black/[0.08] shadow-xs rounded-full px-6 py-2.5'
          }`}
        >
          {/* Brand Identity */}
          <a href="#" className="flex items-center gap-3 group min-h-[44px] min-w-[44px] touch-target">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-black/[0.08] shadow-xs flex items-center justify-center bg-white">
              <img src="/assets/dt-logo.svg" alt="DT Logo" className="w-5 h-5 object-contain" />
            </div>
            <span className="font-sans font-extrabold text-[#09090B] text-sm tracking-tight group-hover:text-[#0066CC] transition-colors">
              D R Thummar
            </span>
            <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F2F2F7] border border-black/[0.06] text-[11px] font-mono text-[#0066CC] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              CTO @ The Intelliverse
            </span>
          </a>

          {/* Desktop Navigation Links - High-Contrast & Frosted Glass Legibility */}
          <nav className="hidden md:flex items-center gap-1.5 font-sans text-xs font-semibold text-[#09090B]">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[#09090B] hover:text-[#0066CC] hover:bg-black/[0.05] px-3.5 py-1.5 rounded-full transition-all duration-200 font-medium"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right CTA Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop CMD+K Trigger Badge */}
            <button
              onClick={() => {
                const event = new KeyboardEvent('keydown', {
                  key: 'k',
                  metaKey: true,
                  bubbles: true,
                });
                document.dispatchEvent(event);
              }}
              aria-label="Open Command Palette"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F2F2F7] hover:bg-slate-200/80 border border-black/[0.06] text-xs text-[#09090B] font-mono font-medium transition-colors min-h-[44px] touch-target cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-[#71717A]" />
              <span>⌘K</span>
            </button>

            {/* Resume CTA */}
            <a
              href={profileData.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-[#09090B] text-white rounded-full text-xs font-mono font-medium hover:bg-[#0066CC] transition-colors shadow-xs min-h-[44px] touch-target cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Resume</span>
            </a>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="md:hidden flex items-center justify-center w-11 h-11 rounded-full bg-white/90 border border-black/[0.1] text-[#09090B] shadow-xs active:scale-95 transition-all touch-target cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </motion.div>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-4 top-20 z-40 md:hidden bg-white/95 backdrop-blur-2xl border border-black/[0.08] rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.12)] space-y-4"
          >
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(link.href);
                  }}
                  className="flex items-center justify-between px-4 py-3 rounded-2xl text-[#09090B] font-sans font-semibold text-base hover:bg-[#F2F2F7] transition-colors min-h-[44px] touch-target"
                >
                  <span>{link.label}</span>
                  <ArrowRight className="w-4 h-4 text-[#71717A]" />
                </a>
              ))}
            </div>

            <div className="pt-4 border-t border-black/[0.06] flex flex-col gap-3">
              <a
                href={profileData.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#09090B] text-white font-mono text-sm font-medium hover:bg-[#0066CC] transition-colors shadow-xs min-h-[44px] touch-target"
              >
                <FileDown className="w-4 h-4" />
                <span>View / Download CV</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
