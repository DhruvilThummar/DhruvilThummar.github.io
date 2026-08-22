'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePortfolioStore } from '@/store/usePortfolioStore';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function ScrollAnimator({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setActiveChapter, isPreloaderComplete } = usePortfolioStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Refresh ScrollTrigger after preloader animation finishes
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 400);

    const ctx = gsap.context(() => {
      // 1. Header & Metadata Stagger Reveals (power3.out custom easing)
      const headers = gsap.utils.toArray<HTMLElement>('.gsap-reveal-header');
      headers.forEach((header) => {
        gsap.fromTo(
          header,
          { opacity: 0, y: 35 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: header,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });

      // 2. Project Card Depth Parallax & Slide Reveal
      const cards = gsap.utils.toArray<HTMLElement>('.project-card');
      cards.forEach((card, index) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 60, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            delay: (index % 2) * 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 88%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });

      // 3. Section Chapter Observer for IndexedDB State Persistence
      const sections = gsap.utils.toArray<HTMLElement>('section[id]');
      sections.forEach((section) => {
        ScrollTrigger.create({
          trigger: section,
          start: 'top 40%',
          end: 'bottom 40%',
          onEnter: () => {
            const id = section.getAttribute('id');
            if (id) setActiveChapter(id);
          },
          onEnterBack: () => {
            const id = section.getAttribute('id');
            if (id) setActiveChapter(id);
          },
        });
      });
    }, containerRef);

    // Debounced Window Resize Handler for ScrollTrigger Refresh Safety
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 200);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      ctx.revert();
    };
  }, [setActiveChapter, isPreloaderComplete]);

  return <div ref={containerRef}>{children}</div>;
}

export default ScrollAnimator;
