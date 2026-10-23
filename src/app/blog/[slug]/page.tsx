import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Sparkles,
  Share2,
  Linkedin,
  Github,
  ArrowRight,
  Brain,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { blogPosts, BlogPost } from '@/data/blogs';

// ── 1. Static Params Generation for High-Speed Static Export ──
export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

// ── 2. Dynamic Server Metadata for SEO ───────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return {
      title: 'Post Not Found | Dhruvil Thummar',
    };
  }

  return {
    title: `${post.title} | Dhruvil Thummar`,
    description: post.excerpt,
    keywords: [
      ...post.tags,
      'Dhruvil Thummar',
      'D R Thummar',
      'The Intelliverse',
      'Machine Learning Engineer',
      'MERN Stack Developer',
      'Data Scientist',
    ],
    alternates: {
      canonical: `https://drthummar.me/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://drthummar.me/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.date,
      authors: ['Dhruvil Thummar'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
  };
}

// Simple Markdown Content Formatter
function MarkdownRenderer({ content }: { content: string }) {
  const sections = content.trim().split('\n\n');

  return (
    <div className="space-y-6 text-[#27272A] leading-relaxed font-sans text-sm sm:text-base">
      {sections.map((sec, idx) => {
        const trimmed = sec.trim();

        // Level 3 Heading
        if (trimmed.startsWith('### ')) {
          return (
            <h3
              key={idx}
              className="text-xl sm:text-2xl font-heading font-bold text-[#09090B] pt-6 pb-1 border-b border-black/[0.04]"
            >
              {trimmed.replace('### ', '')}
            </h3>
          );
        }

        // Level 4 Heading
        if (trimmed.startsWith('#### ')) {
          return (
            <h4
              key={idx}
              className="text-lg font-heading font-semibold text-[#09090B] pt-4"
            >
              {trimmed.replace('#### ', '')}
            </h4>
          );
        }

        // Code Block
        if (trimmed.startsWith('```')) {
          const lines = trimmed.split('\n');
          const language = lines[0].replace('```', '') || 'code';
          const codeBody = lines.slice(1, -1).join('\n');

          return (
            <div
              key={idx}
              className="my-4 rounded-xl overflow-hidden border border-black/[0.08] bg-[#09090B] text-white shadow-sm font-mono text-xs sm:text-[13px]"
            >
              <div className="flex items-center justify-between px-4 py-2 bg-white/[0.04] border-b border-white/[0.08] text-[#A1A1AA] text-[11px]">
                <span className="uppercase tracking-wider font-semibold">
                  {language}
                </span>
                <span>Production Snippet</span>
              </div>
              <pre className="p-4 overflow-x-auto leading-relaxed text-[#E4E4E7]">
                <code>{codeBody}</code>
              </pre>
            </div>
          );
        }

        // Bullet / Ordered List
        if (trimmed.startsWith('- ') || trimmed.startsWith('1. ')) {
          const items = trimmed.split('\n');
          return (
            <ul key={idx} className="space-y-2 pl-5 list-disc marker:text-[#0066CC]">
              {items.map((item, itemIdx) => {
                const text = item.replace(/^[-\d.]\s+/, '');
                return (
                  <li key={itemIdx} className="text-[#3F3F46]">
                    <span
                      dangerouslySetInnerHTML={{
                        __html: text.replace(
                          /\*\*(.*?)\*\*/g,
                          '<strong class="text-[#09090B] font-semibold">$1</strong>'
                        ),
                      }}
                    />
                  </li>
                );
              })}
            </ul>
          );
        }

        // Standard Paragraph with Bold formatting
        return (
          <p
            key={idx}
            className="text-[#3F3F46]"
            dangerouslySetInnerHTML={{
              __html: trimmed
                .replace(
                  /\*\*(.*?)\*\*/g,
                  '<strong class="text-[#09090B] font-semibold">$1</strong>'
                )
                .replace(
                  /`([^`]+)`/g,
                  '<code class="px-1.5 py-0.5 bg-[#F2F2F7] border border-black/[0.06] rounded font-mono text-xs text-[#09090B]">$1</code>'
                ),
            }}
          />
        );
      })}
    </div>
  );
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  // Find next / previous posts
  const currentIndex = blogPosts.findIndex((p) => p.slug === slug);
  const prevPost = currentIndex > 0 ? blogPosts[currentIndex - 1] : null;
  const nextPost =
    currentIndex < blogPosts.length - 1 ? blogPosts[currentIndex + 1] : null;

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#FCFCFC] text-[#09090B]">
      {/* Dynamic Navbar */}
      <Navbar />

      <SectionWrapper className="pt-28 pb-20 md:pt-40 md:pb-28">
        <div className="aurora-background pointer-events-none opacity-30" />

        <article className="relative z-10 max-w-4xl mx-auto">
          {/* Back Navigation & Breadcrumb */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F2F2F7] border border-black/[0.06] text-xs font-mono text-[#0066CC] font-medium hover:bg-black/[0.06] transition-colors min-h-[44px] touch-target"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> All Articles
            </Link>

            <span className="font-mono text-xs text-[#71717A] hidden sm:inline">
              Category: <strong className="text-[#09090B] font-semibold">{post.category}</strong>
            </span>
          </div>

          {/* Article Header Card */}
          <div className="mb-10 pb-8 border-b border-black/[0.08]">
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <span className="px-3 py-1 bg-[#0066CC]/10 text-[#0066CC] border border-[#0066CC]/20 rounded-full font-mono text-xs font-bold">
                {post.category}
              </span>
              <span className="font-mono text-xs text-[#71717A] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {post.date}
              </span>
              <span className="font-mono text-xs text-[#71717A] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {post.readTime}
              </span>
            </div>

            <h1 className="text-[clamp(2rem,4.5vw,3.75rem)] font-heading font-extrabold text-[#09090B] tracking-tight leading-[1.1] mb-6">
              {post.title}
            </h1>

            <p className="font-sans text-base sm:text-lg md:text-xl text-[#71717A] leading-relaxed mb-8">
              {post.excerpt}
            </p>

            {/* Metrics Ribbon (if available) */}
            {post.metrics && (
              <div className="grid grid-cols-3 gap-3 p-4 bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-2xl shadow-2xs mb-8">
                {post.metrics.map((m) => (
                  <div key={m.label} className="text-center">
                    <span className="block font-heading font-bold text-base sm:text-xl text-[#09090B]">
                      {m.value}
                    </span>
                    <span className="block font-mono text-[10px] sm:text-xs text-[#71717A] uppercase font-semibold">
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Author Profile Bar */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-black/[0.04]">
              <div className="flex items-center gap-3">
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-10 h-10 rounded-full border border-black/[0.08] shadow-xs"
                />
                <div>
                  <span className="block font-heading font-bold text-sm text-[#09090B]">
                    {post.author.name}
                  </span>
                  <span className="block font-mono text-xs text-[#71717A]">
                    {post.author.role}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <a
                  href="https://www.linkedin.com/in/dhruvil-thummar-54422731a"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-[#F2F2F7] hover:bg-black/[0.06] text-[#71717A] hover:text-[#0066CC] transition-colors"
                  title="Connect on LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a
                  href="https://github.com/DhruvilThummar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-[#F2F2F7] hover:bg-black/[0.06] text-[#71717A] hover:text-[#09090B] transition-colors"
                  title="View GitHub"
                >
                  <Github className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Article Markdown Body */}
          <div className="prose prose-neutral max-w-none mb-12">
            <MarkdownRenderer content={post.content} />
          </div>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-6 pb-8 border-t border-black/[0.08]">
            <span className="font-mono text-xs text-[#71717A] mr-2">Topics:</span>
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full bg-[#F2F2F7] border border-black/[0.06] text-xs font-mono text-[#09090B]"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Author Bio Box */}
          <GlassCard variant="default" className="p-6 sm:p-8 mb-12 border border-black/[0.08]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <img
                src="/assets/dt-logo-circle.svg"
                alt="Dhruvil Thummar"
                className="w-14 h-14 rounded-full border border-black/[0.08] shadow-xs"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-heading font-bold text-base text-[#09090B]">
                    About Dhruvil Thummar
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-[#0066CC]/10 text-[#0066CC] font-mono text-[10px] font-bold">
                    AUTHOR
                  </span>
                </div>
                <p className="font-sans text-xs sm:text-sm text-[#71717A] leading-relaxed">
                  Co-founder & CTO at <strong>The Intelliverse</strong>. Machine Learning Engineer, Data Scientist (IBM Certified), and MERN Stack Architect specializing in distributed systems, predictive modeling, and sub-50ms database architecture.
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Next / Previous Article Navigation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prevPost ? (
              <Link
                href={`/blog/${prevPost.slug}`}
                className="p-5 rounded-2xl bg-white/80 border border-black/[0.08] hover:border-[#0066CC]/30 transition-all group block"
              >
                <span className="font-mono text-[10px] text-[#71717A] uppercase block mb-1">
                  ← Previous Article
                </span>
                <span className="font-heading font-bold text-sm text-[#09090B] group-hover:text-[#0066CC] transition-colors line-clamp-2">
                  {prevPost.title}
                </span>
              </Link>
            ) : <div />}

            {nextPost ? (
              <Link
                href={`/blog/${nextPost.slug}`}
                className="p-5 rounded-2xl bg-white/80 border border-black/[0.08] hover:border-[#0066CC]/30 transition-all group block text-right"
              >
                <span className="font-mono text-[10px] text-[#71717A] uppercase block mb-1">
                  Next Article →
                </span>
                <span className="font-heading font-bold text-sm text-[#09090B] group-hover:text-[#0066CC] transition-colors line-clamp-2">
                  {nextPost.title}
                </span>
              </Link>
            ) : <div />}
          </div>
        </article>
      </SectionWrapper>
    </main>
  );
}
