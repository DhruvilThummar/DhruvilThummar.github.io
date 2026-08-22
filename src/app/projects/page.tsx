'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { FluidGrid } from '@/components/ui/FluidGrid';
import {
  ArrowLeft,
  ExternalLink,
  Code2,
  Activity,
  Search,
} from 'lucide-react';
import { projectsData, ProjectMission } from '@/data/projects';

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');

  const categories = ['All', 'React', 'Python', 'WebSockets', 'MERN Stack', 'TypeScript'];

  const filteredProjects = projectsData.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.problem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.solution.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag =
      selectedTag === 'All' ||
      project.tags.some((t) => t.toLowerCase().includes(selectedTag.toLowerCase()));

    return matchesSearch && matchesTag;
  });

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#FCFCFC] text-[#09090B]">
      {/* Dynamic Navbar */}
      <Navbar />

      {/* Hero Header */}
      <SectionWrapper className="pt-28 pb-12 md:pt-40 md:pb-16">
        <div className="aurora-background" />

        <div className="relative z-10 max-w-4xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F2F2F7] border border-black/[0.06] text-xs font-mono text-[#0066CC] font-medium hover:bg-black/[0.06] transition-colors mb-6 min-h-[44px] touch-target"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Overview
          </Link>

          <span className="font-mono text-xs text-[#0066CC] uppercase tracking-widest font-semibold block mb-2">
            COMPLETE ARCHIVE // 05 SYSTEMS
          </span>

          <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-heading font-bold tracking-tighter text-[#09090B] leading-[1.05] mb-4">
            Mission Archives &amp; Systems
          </h1>

          <p className="text-[#71717A] text-base md:text-xl max-w-2xl leading-relaxed">
            Full repository showcase of enterprise SaaS platforms, real-time telemetry engines, AST parsers, and quantitative ML pipelines engineered by D R Thummar.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-10 pt-8 border-t border-black/[0.06] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 relative z-10">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects by keyword, tech, or problem..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-black/[0.08] text-xs text-[#09090B] placeholder:text-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#0066CC] shadow-sm min-h-[44px]"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedTag(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all min-h-[44px] touch-target ${
                  selectedTag === cat
                    ? 'bg-[#09090B] text-white shadow-sm font-semibold'
                    : 'bg-[#F2F2F7] border border-black/[0.06] text-[#71717A] hover:text-[#0066CC] hover:bg-black/[0.03]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* Projects Grid */}
      <SectionWrapper className="py-8 md:py-12">
        {filteredProjects.length === 0 ? (
          <div className="py-20 text-center text-[#71717A]">
            <p className="text-base font-mono mb-2">No projects matched your criteria.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTag('All');
              }}
              className="text-xs font-mono underline text-[#0066CC]"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <FluidGrid minWidth={340} gap="2rem">
            {filteredProjects.map((project: ProjectMission) => (
              <GlassCard
                key={project.id}
                variant="default"
                className="p-8 flex flex-col justify-between group hover:border-[#0066CC]/20 transition-all duration-300"
              >
                <div>
                  {/* Card Header Telemetry */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-[#F2F2F7] text-[#09090B] rounded-full text-xs font-mono font-semibold">
                      {project.missionNumber}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#71717A] bg-white border border-black/[0.06] px-2.5 py-0.5 rounded-full">
                      <Activity className="w-3 h-3 text-[#0066CC] animate-pulse" />
                      {project.telemetry.fps}
                    </span>
                  </div>

                  <h2 className="text-2xl font-heading font-bold text-[#09090B] mb-1 group-hover:text-[#0066CC] transition-colors">
                    {project.title}
                  </h2>
                  <p className="text-xs font-sans text-[#71717A] font-medium mb-6">
                    {project.subtitle}
                  </p>

                  {/* Telemetry Metrics Row */}
                  <div className="grid grid-cols-2 gap-2 mb-6 p-3 rounded-2xl bg-[#F2F2F7]/70 border border-black/[0.04] font-mono text-[11px]">
                    <div>
                      <span className="text-[#71717A] block text-[10px]">LATENCY:</span>
                      <span className="text-[#09090B] font-semibold">{project.telemetry.latency}</span>
                    </div>
                    <div>
                      <span className="text-[#71717A] block text-[10px]">SCALE:</span>
                      <span className="text-[#09090B] font-semibold">{project.telemetry.downloads}</span>
                    </div>
                  </div>

                  {/* Problem & Solution */}
                  <div className="space-y-3 mb-6 text-xs text-[#71717A]">
                    <div className="p-3.5 rounded-xl bg-[#F2F2F7]/50 border border-black/[0.04]">
                      <strong className="text-[#09090B] block font-semibold mb-1 uppercase tracking-wider text-[10px]">
                        PROBLEM STATEMENT:
                      </strong>
                      <p className="leading-relaxed">{project.problem}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#F2F2F7]/50 border border-black/[0.04]">
                      <strong className="text-[#09090B] block font-semibold mb-1 uppercase tracking-wider text-[10px]">
                        ENGINEERED SOLUTION:
                      </strong>
                      <p className="leading-relaxed">{project.solution}</p>
                    </div>
                  </div>

                  {/* Architectural Highlights */}
                  {project.highlights && (
                    <div className="mb-6 space-y-1.5">
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#0066CC] block">
                        ARCHITECTURAL HIGHLIGHTS:
                      </span>
                      <ul className="space-y-1 text-xs text-[#71717A] list-disc list-inside">
                        {project.highlights.map((h, i) => (
                          <li key={i} className="leading-relaxed">
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  {/* Tech Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 bg-[#F2F2F7] border border-black/[0.04] text-[#71717A] rounded-lg text-[11px] font-mono font-medium group-hover:text-[#09090B] transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Action CTA Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-black/[0.06]">
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#71717A] hover:text-[#0066CC] transition-colors py-1 min-h-[44px] touch-target"
                    >
                      <Code2 className="w-4 h-4" /> Source Code
                    </a>
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 bg-[#09090B] text-white rounded-full hover:bg-[#0066CC] transition-colors shadow-sm min-h-[44px] touch-target font-medium"
                    >
                      Live Demo <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </GlassCard>
            ))}
          </FluidGrid>
        )}
      </SectionWrapper>

      {/* Footer */}
      <footer className="py-12 border-t border-black/[0.06] relative z-10 text-center font-sans text-xs text-[#71717A]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2025 D R Thummar · Co-founder &amp; CTO at The Intelliverse</p>
          <Link href="/" className="hover:text-[#0066CC] font-mono transition-colors">
            ← Back to Overview
          </Link>
        </div>
      </footer>
    </main>
  );
}
