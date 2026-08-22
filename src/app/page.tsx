'use client';

import React from 'react';
import Link from 'next/link';
import { Preloader } from '@/components/Preloader';
import { HeroSection } from '@/components/HeroSection';
import { ScrollAnimator } from '@/components/ScrollAnimator';
import { ContactForm } from '@/components/ContactForm';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Tooltip } from '@/components/ui/Tooltip';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { FluidGrid } from '@/components/ui/FluidGrid';
import { SectionHeader } from '@/components/ui/SectionHeader';
import {
  ArrowRight,
  GraduationCap,
  Briefcase,
  Mail,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Cpu,
  Code2,
  Globe,
  Activity,
  Layers,
  Database,
  Brain,
  Wrench,
  Server,
  Award,
  CheckCircle2,
  Trophy,
} from 'lucide-react';
import { profileData } from '@/data/profile';
import { projectsData } from '@/data/projects';
import { skillsCategories } from '@/data/skills';
import { certificationsData, achievementsData } from '@/data/certifications';

export default function HomePage() {
  // Main home page displays the TOP 3 featured projects
  const mainProjects = projectsData.slice(0, 3);

  // Icon mapping for skill categories matching LaTeX resume
  const skillIcons: Record<string, React.ReactNode> = {
    'machine-learning': <Brain className="w-4 h-4 text-[#0066CC]" />,
    'mern-webdev': <ShieldCheck className="w-4 h-4 text-[#0066CC]" />,
    'languages-core': <Cpu className="w-4 h-4 text-[#0066CC]" />,
  };

  return (
    <>
      <Preloader />
      <ScrollAnimator>
        <main className="min-h-screen relative overflow-hidden bg-[#FCFCFC] text-[#09090B]">
          {/* ── Dynamic Island Navbar ─────────────────────────────── */}
          <Navbar />

          {/* ── 1. HERO SECTION ───────────────────────────────────── */}
          <HeroSection />

          {/* ── 2. ABOUT / GENESIS DUAL TIMELINE ──────────────────── */}
          <SectionWrapper id="about">
            <SectionHeader
              eyebrow="DUAL REALITY"
              title="The Genesis"
              italicAccent="Timeline"
              description="Bridging academic computer engineering rigor at L.J. University with active CTO leadership at The Intelliverse."
            />

            <FluidGrid minWidth={340} gap="2rem">
              {/* Scholar Card */}
              <GlassCard variant="default" className="p-8 group hover:border-[#0066CC]/20 transition-all duration-300 project-card">
                <div className="flex items-center justify-between mb-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F2F2F7] text-[#09090B] rounded-full font-mono text-xs font-semibold">
                    <GraduationCap className="w-3.5 h-3.5 text-[#0066CC]" /> The Scholar
                  </span>
                  <span className="font-mono text-xs text-[#71717A] bg-white border border-black/[0.06] px-2.5 py-0.5 rounded-full">
                    2024 — 2028
                  </span>
                </div>
                <h3 className="text-2xl font-heading font-bold text-[#09090B] mb-1 group-hover:text-[#0066CC] transition-colors">
                  {profileData.academic.institution}
                </h3>
                <p className="font-sans text-sm font-medium text-[#71717A] mb-4">
                  {profileData.academic.degree}
                </p>
                <p className="text-[#71717A] text-sm mb-6 leading-relaxed">
                  {profileData.academic.description}
                </p>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-black/[0.04]">
                  {profileData.academic.coursework.map((course) => (
                    <span
                      key={course}
                      className="px-3 py-1 bg-[#F2F2F7] border border-black/[0.04] text-[#71717A] rounded-full font-mono text-xs font-medium hover:text-[#0066CC] hover:border-[#0066CC]/30 transition-colors"
                    >
                      #{course}
                    </span>
                  ))}
                </div>
              </GlassCard>

              {/* CTO Leader Card */}
              <GlassCard variant="elevated" className="p-8 group hover:border-[#0066CC]/30 transition-all duration-300 project-card">
                <div className="flex items-center justify-between mb-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#09090B] text-white rounded-full font-mono text-xs font-semibold shadow-sm">
                    <Briefcase className="w-3.5 h-3.5 text-[#0066CC]" /> The Leader
                  </span>
                  <span className="font-mono text-xs text-[#71717A] bg-white border border-black/[0.06] px-2.5 py-0.5 rounded-full">
                    Jan 2025 — Present
                  </span>
                </div>
                <h3 className="text-2xl font-heading font-bold text-[#09090B] mb-1 group-hover:text-[#0066CC] transition-colors">
                  {profileData.industry.company}
                </h3>
                <p className="font-sans text-sm font-medium text-[#71717A] mb-4">
                  {profileData.industry.position}
                </p>
                <p className="text-[#71717A] text-sm mb-6 leading-relaxed">
                  {profileData.industry.description}
                </p>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-black/[0.04]">
                  {profileData.industry.focus.map((focus) => (
                    <span
                      key={focus}
                      className="px-3 py-1 bg-[#0066CC]/10 border border-[#0066CC]/20 text-[#0066CC] rounded-full font-mono text-xs font-medium"
                    >
                      #{focus}
                    </span>
                  ))}
                </div>
              </GlassCard>
            </FluidGrid>
          </SectionWrapper>

          {/* ── 3. SKILLS MATRIX ─────────────────────────────────── */}
          <SectionWrapper id="skills">
            <SectionHeader
              eyebrow="TECHNICAL ARSENAL"
              title="Engineering"
              italicAccent="Proficiency"
              description="Hover over any skill badge to inspect its architectural context across real-world systems."
            />

        {/* Skill Categories matching LaTeX Resume */}
        <FluidGrid minWidth={340} gap="1.5rem">
          {skillsCategories.map((category) => (
            <GlassCard
              key={category.id}
              variant="default"
              className="p-7 flex flex-col justify-between hover:border-[#0066CC]/20 transition-all duration-300 group"
            >
              <div>
                {/* Category Title Header */}
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-heading font-bold text-[#09090B] text-lg flex items-center gap-2.5 group-hover:text-[#0066CC] transition-colors">
                    <div className="p-2 rounded-xl bg-[#F2F2F7] border border-black/[0.06]">
                      {skillIcons[category.id] || <Cpu className="w-4 h-4 text-[#0066CC]" />}
                    </div>
                    {category.title}
                  </h3>
                  <span className="font-mono text-[11px] text-[#71717A] bg-[#F2F2F7] border border-black/[0.04] px-2 py-0.5 rounded">
                    {category.tabName}
                  </span>
                </div>

                {/* Skill Badges List */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {category.skills.map((skill) => (
                    <Tooltip key={skill.name} content={`${skill.desc} (${skill.level}% proficiency)`}>
                      <span className="px-3.5 py-2 bg-white border border-black/[0.06] text-[#09090B] rounded-xl text-xs font-mono font-medium shadow-sm hover:border-[#0066CC] hover:text-[#0066CC] hover:bg-[#F2F2F7]/50 transition-all cursor-pointer inline-flex items-center gap-1.5">
                        <span>{skill.name}</span>
                        <span className="text-[10px] text-[#71717A] font-sans">· {skill.level}%</span>
                      </span>
                    </Tooltip>
                  ))}
                </div>
              </div>

              {/* Code Snippet Context Preview */}
              {category.codeSnippet && (
                <div className="p-3.5 rounded-xl bg-[#09090B] text-slate-200 font-mono text-[11px] overflow-x-auto leading-relaxed border border-black/10">
                  <pre className="whitespace-pre-wrap text-slate-300">
                    {category.codeSnippet.split('\n').slice(0, 3).join('\n')}
                    {category.codeSnippet.split('\n').length > 3 && '\n...'}
                  </pre>
                </div>
              )}
            </GlassCard>
          ))}
        </FluidGrid>
      </SectionWrapper>

      {/* ── 4. PROJECTS / MISSION ARCHIVES ───────────────────── */}
      <SectionWrapper id="projects">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <SectionHeader
            eyebrow="MISSION ARCHIVES"
            title="Featured"
            italicAccent="Systems"
            description="Top architectural systems engineered by D R Thummar. Presented as Problem ➔ Solution breakdowns."
            className="!mb-0"
          />

          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#09090B] text-white text-xs font-mono font-medium hover:bg-[#0066CC] transition-colors shadow-sm self-start md:self-auto min-h-[44px] touch-target"
          >
            <span>View All Systems ({projectsData.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Display TOP 3 Main Projects directly */}
        <FluidGrid minWidth={320} gap="1.5rem">
          {mainProjects.map((project) => (
            <GlassCard key={project.id} variant="default" className="p-7 flex flex-col justify-between group hover:border-[#0066CC]/20 transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-[#F2F2F7] text-[#09090B] rounded-full text-xs font-mono font-semibold">
                    {project.missionNumber}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#71717A] bg-white border border-black/[0.06] px-2.5 py-0.5 rounded-full">
                    <Activity className="w-3 h-3 text-[#0066CC] animate-pulse" />
                    {project.telemetry.fps}
                  </span>
                </div>
                
                <h3 className="text-xl font-heading font-bold text-[#09090B] mb-1 group-hover:text-[#0066CC] transition-colors">
                  {project.title}
                </h3>
                <p className="text-xs font-sans text-[#71717A] font-medium mb-5">
                  {project.subtitle}
                </p>

                <div className="space-y-3 mb-6 text-xs text-[#71717A]">
                  <div className="p-3 rounded-xl bg-[#F2F2F7]/60 border border-black/[0.04]">
                    <strong className="text-[#09090B] block font-semibold mb-1 uppercase tracking-wider text-[10px]">
                      PROBLEM STATEMENT:
                    </strong>
                    <p className="leading-relaxed">{project.problem}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F2F2F7]/60 border border-black/[0.04]">
                    <strong className="text-[#09090B] block font-semibold mb-1 uppercase tracking-wider text-[10px]">
                      ENGINEERED SOLUTION:
                    </strong>
                    <p className="leading-relaxed">{project.solution}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 bg-[#F2F2F7] border border-black/[0.04] text-[#71717A] rounded-lg text-[11px] font-mono font-medium group-hover:text-[#09090B] transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-black/[0.06]">
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#71717A] hover:text-[#0066CC] transition-colors py-1 min-h-[44px] touch-target"
                  >
                    <Code2 className="w-3.5 h-3.5" /> Source Code
                  </a>
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0066CC] hover:underline py-1 min-h-[44px] touch-target font-semibold"
                  >
                    Live Demo <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </GlassCard>
          ))}
        </FluidGrid>

        {/* View All Projects CTA Banner */}
        <div className="mt-12 pt-8 text-center border-t border-black/[0.04]">
          <Link
            href="/projects"
            className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-[#09090B] text-white font-sans font-medium text-sm hover:bg-[#0066CC] transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] min-h-[48px] touch-target"
          >
            <Layers className="w-4 h-4 text-[#0066CC]" />
            <span>Explore All {projectsData.length} Systems in Full Archive</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </SectionWrapper>

      {/* ── 5. VERIFIED CREDENTIALS & CERTIFICATIONS ─────────── */}
      <SectionWrapper id="certifications">
        <SectionHeader
          eyebrow="VERIFIED CREDENTIALS"
          title="Certifications &"
          italicAccent="Achievements"
          description="Official verified credentials from IBM, Penn Engineering, LearnQuest, and competitive hackathons."
        />

        <FluidGrid minWidth={300} gap="1.5rem" className="mb-12">
          {certificationsData.map((cert) => (
            <GlassCard key={cert.id} variant="default" className="p-7 flex flex-col justify-between group hover:border-[#0066CC]/20 transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-[#F2F2F7] text-[#0066CC] rounded-full text-xs font-mono font-semibold">
                    {cert.issuer}
                  </span>
                  <span className="font-mono text-xs text-[#71717A]">
                    ID: {cert.credentialId}
                  </span>
                </div>

                <h3 className="text-lg font-heading font-bold text-[#09090B] mb-2 group-hover:text-[#0066CC] transition-colors">
                  {cert.title}
                </h3>

                <p className="text-xs text-[#71717A] mb-5 leading-relaxed">
                  {cert.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-6">
                  {cert.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-0.5 bg-[#F2F2F7] text-[#71717A] rounded text-[11px] font-mono"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-black/[0.06] flex items-center justify-between">
                <span className="text-xs font-mono text-[#71717A]">{cert.platform} ({cert.date})</span>
                <a
                  href={cert.verifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0066CC] hover:underline min-h-[44px] touch-target"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verify Credential ↗
                </a>
              </div>
            </GlassCard>
          ))}
        </FluidGrid>

        {/* Achievements Banner */}
        <div className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#F2F2F7] border border-black/[0.06]">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h4 className="text-sm font-heading font-bold text-[#09090B]">Hackovate LJ 2025 Participation</h4>
              <p className="text-xs text-[#71717A]">Organized by LFA (LJ University Association)</p>
            </div>
          </div>
          <span className="px-3.5 py-1.5 bg-[#F2F2F7] text-[#0066CC] rounded-full text-xs font-mono font-medium">
            2025 Hackathon
          </span>
        </div>
      </SectionWrapper>

      {/* ── 6. TEAM & COMMUNITY ALLIANCES ────────────────────── */}
      <SectionWrapper id="team">
        <SectionHeader
          eyebrow="LEADERSHIP & ALLIANCES"
          title="The Intelliverse"
          italicAccent="Guild"
          description="Leading technical vision alongside industry founders & driving community developer alliances."
        />

        <FluidGrid minWidth={300} gap="1.5rem" className="mb-12">
          {profileData.guildMembers.map((member) => (
            <GlassCard key={member.name} variant="default" className="p-7 group hover:border-[#0066CC]/20 transition-all duration-300">
              <span className="px-3 py-1 bg-[#F2F2F7] text-[#0066CC] rounded-full text-xs font-mono font-semibold inline-block mb-4">
                {member.badge}
              </span>
              <h3 className="text-xl font-heading font-bold text-[#09090B] mb-1 group-hover:text-[#0066CC] transition-colors">{member.name}</h3>
              <p className="text-xs font-medium text-[#71717A] mb-3">{member.role}</p>
              <p className="text-xs text-[#71717A] leading-relaxed">{member.focus}</p>
            </GlassCard>
          ))}
        </FluidGrid>

        {/* Community Alliances */}
        <div className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-sm flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs font-mono text-[#71717A] uppercase tracking-wider font-semibold">
            COMMUNITY ALLIANCES:
          </span>
          <div className="flex flex-wrap gap-3 font-mono text-xs text-[#09090B]">
            <span className="px-3.5 py-1.5 bg-[#F2F2F7] border border-black/[0.04] rounded-full">
              <span className="text-[#0066CC]">●</span> Google Cloud Developer Community
            </span>
            <span className="px-3.5 py-1.5 bg-[#F2F2F7] border border-black/[0.04] rounded-full">
              <span className="text-[#0066CC]">●</span> NVIDIA Developer Program
            </span>
            <span className="px-3.5 py-1.5 bg-[#F2F2F7] border border-black/[0.04] rounded-full">
              <span className="text-[#0066CC]">●</span> LJU Computer Engineering Network
            </span>
          </div>
        </div>
      </SectionWrapper>

      {/* ── 7. CONTACT SECTION ────────────────────────────────── */}
      <SectionWrapper id="contact">
        <SectionHeader
          eyebrow="GET IN TOUCH"
          title="Let's Build"
          italicAccent="Together"
          description="Reach out for technical consultations, software architecture, or partnership opportunities."
          align="center"
          className="max-w-2xl mx-auto text-center"
        />

        <GlassCard variant="elevated" className="max-w-xl mx-auto p-8 sm:p-10 border-[#0066CC]/10 shadow-[0_20px_50px_rgba(0,102,204,0.05)]">
          <ContactForm />
        </GlassCard>
      </SectionWrapper>

      {/* ── 8. FOOTER ─────────────────────────────────────────── */}
      <footer className="py-12 border-t border-black/[0.06] relative z-10 text-center font-sans text-xs text-[#71717A]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2025 D R Thummar · Co-founder &amp; CTO at The Intelliverse</p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/DhruvilThummar"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#0066CC] transition-colors p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
              aria-label="GitHub Profile"
            >
              <Code2 className="w-4 h-4" />
            </a>
            <a
              href="https://www.linkedin.com/in/dhruvil-thummar-54422731a"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#0066CC] transition-colors p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
              aria-label="LinkedIn Profile"
            >
              <Globe className="w-4 h-4" />
            </a>
            <a
              href="mailto:dhruvilthummar1303@gmail.com"
              className="hover:text-[#0066CC] transition-colors p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
              aria-label="Email D R Thummar"
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>
      </footer>
    </main>
    </ScrollAnimator>
    </>
  );
}

