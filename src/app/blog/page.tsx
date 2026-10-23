'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  Search,
  Clock,
  Calendar,
  ArrowRight,
  Sparkles,
  ArrowLeft,
  Brain,
  Cpu,
  Layers,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { blogPosts, BlogPost } from '@/data/blogs';

export default function BlogArchivePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = [
    'All',
    'Machine Learning',
    'Data Science',
    'MERN Architecture',
    'CTO Leadership',
  ];

  const categoryIcons: Record<string, React.ReactNode> = {
    'Machine Learning': <Brain className="w-3.5 h-3.5 text-[#0066CC]" />,
    'Data Science': <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />,
    'MERN Architecture': <Cpu className="w-3.5 h-3.5 text-sky-600" />,
    'CTO Leadership': <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />,
  };

  const filteredPosts = blogPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'All' || post.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const featuredPost = blogPosts[0];

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#FCFCFC] text-[#09090B]">
      {/* Dynamic Navbar */}
      <Navbar />

      <SectionWrapper className="pt-28 pb-16 md:pt-40 md:pb-24">
        {/* Ambient Glow */}
        <div className="aurora-background pointer-events-none opacity-40" />

        {/* Header Breadcrumb & Title */}
        <div className="relative z-10 max-w-5xl mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F2F2F7] border border-black/[0.06] text-xs font-mono text-[#0066CC] font-medium hover:bg-black/[0.06] transition-colors mb-6 min-h-[44px] touch-target"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Portfolio
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-black/[0.08] rounded-full text-xs font-mono text-[#0066CC] font-semibold shadow-2xs mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#0066CC]" />
            <span>ENGINEERING INSIGHTS // 08 ESSAYS</span>
          </div>

          <h1 className="text-[clamp(2.5rem,5.5vw,4.5rem)] font-heading font-extrabold tracking-tight text-[#09090B] leading-[1.05] mb-4">
            Architectural Insights &{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#09090B] via-[#0066CC] to-[#09090B]">
              Engineering Notes
            </span>
          </h1>

          <p className="font-sans text-base sm:text-lg text-[#71717A] max-w-2xl leading-relaxed">
            Written by <strong>Dhruvil Thummar</strong> (Co-founder & CTO at The Intelliverse). Practical engineering deep dives into machine learning algorithms, production MERN microservices, database tuning, and technical leadership.
          </p>
        </div>

        {/* ── Search & Filter Controls ─────────────────────────────── */}
        <div className="relative z-10 max-w-5xl mb-10 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, keyword, or technology..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/90 backdrop-blur-md border border-black/[0.08] focus:border-[#0066CC] rounded-full text-xs sm:text-sm text-[#09090B] placeholder:text-[#71717A] shadow-xs outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#71717A] hover:text-[#09090B]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all min-h-[38px] touch-target cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-[#09090B] text-white shadow-xs'
                    : 'bg-white/80 backdrop-blur-md border border-black/[0.06] text-[#71717A] hover:text-[#09090B] hover:bg-white'
                }`}
              >
                {categoryIcons[cat]}
                <span>{cat}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Featured Spotlight Article (Shown when no search query) ── */}
        {!searchQuery && selectedCategory === 'All' && featuredPost && (
          <div className="relative z-10 max-w-5xl mb-12">
            <Link href={`/blog/${featuredPost.slug}`} className="block group">
              <GlassCard
                variant="glow"
                className="p-6 sm:p-8 md:p-10 border border-black/[0.08] hover:border-[#0066CC]/30 transition-all duration-300 relative overflow-hidden"
              >
                <div
                  className={`absolute -right-20 -top-20 w-80 h-80 bg-gradient-to-br ${featuredPost.gradient} rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500`}
                />

                <div className="relative z-10">
                  <div className="flex flex-wrap items-center gap-2.5 mb-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#0066CC]/10 text-[#0066CC] font-mono text-xs font-bold border border-[#0066CC]/20">
                      ★ FEATURED ARCHITECTURE ESSAY
                    </span>
                    <span className="font-mono text-xs text-[#71717A] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {featuredPost.date}
                    </span>
                    <span className="font-mono text-xs text-[#71717A] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {featuredPost.readTime}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-extrabold text-[#09090B] mb-3 group-hover:text-[#0066CC] transition-colors leading-tight">
                    {featuredPost.title}
                  </h2>

                  <p className="font-sans text-sm sm:text-base text-[#71717A] max-w-3xl mb-6 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>

                  {/* Metrics Row */}
                  {featuredPost.metrics && (
                    <div className="grid grid-cols-3 gap-3 max-w-lg mb-6">
                      {featuredPost.metrics.map((m) => (
                        <div
                          key={m.label}
                          className="bg-white/80 border border-black/[0.06] p-2.5 rounded-xl text-center"
                        >
                          <span className="block font-heading font-bold text-sm sm:text-base text-[#09090B]">
                            {m.value}
                          </span>
                          <span className="block font-mono text-[10px] text-[#71717A] uppercase">
                            {m.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-black/[0.06]">
                    <div className="flex flex-wrap gap-1.5">
                      {featuredPost.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 rounded-full bg-[#F2F2F7] font-mono text-[11px] text-[#71717A]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-[#0066CC] group-hover:translate-x-1 transition-transform">
                      Read Essay <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </GlassCard>
            </Link>
          </div>
        )}

        {/* ── Article Cards Grid ─────────────────────────────────── */}
        <div className="relative z-10 max-w-5xl">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-20 bg-white/70 border border-black/[0.06] rounded-2xl p-8">
              <p className="font-heading font-bold text-lg text-[#09090B] mb-2">
                No matching articles found
              </p>
              <p className="font-sans text-sm text-[#71717A] mb-4">
                Try searching for different keywords like &quot;CatBoost&quot;, &quot;MongoDB&quot;, or &quot;Microservices&quot;.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="px-4 py-2 bg-[#09090B] text-white rounded-full text-xs font-mono font-medium"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPosts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group block h-full">
                  <GlassCard
                    variant="default"
                    className="p-6 sm:p-7 border border-black/[0.08] hover:border-[#0066CC]/30 transition-all duration-300 h-full flex flex-col justify-between relative overflow-hidden"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F2F2F7] border border-black/[0.06] font-mono text-[11px] font-semibold text-[#09090B]">
                          {categoryIcons[post.category]}
                          <span>{post.category}</span>
                        </span>

                        <div className="flex items-center gap-2 font-mono text-[11px] text-[#71717A]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.readTime}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="font-heading font-bold text-lg sm:text-xl text-[#09090B] group-hover:text-[#0066CC] transition-colors mb-2.5 leading-snug">
                        {post.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="font-sans text-xs sm:text-sm text-[#71717A] line-clamp-3 mb-5 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>

                    <div>
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-[#F2F2F7] text-[#71717A] rounded font-mono text-[10px]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Footer Read Action */}
                      <div className="pt-3 border-t border-black/[0.04] flex items-center justify-between font-mono text-xs">
                        <span className="text-[#71717A]">{post.date}</span>
                        <span className="font-semibold text-[#0066CC] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Read Essay <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>
          )}
        </div>
      </SectionWrapper>
    </main>
  );
}
