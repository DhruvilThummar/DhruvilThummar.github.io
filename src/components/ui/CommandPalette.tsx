'use client';

import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileDown,
  User,
  FolderKanban,
  Mail,
  Search,
  ArrowRight,
  Users,
  Code2,
} from 'lucide-react';
import { profileData } from '@/data/profile';

interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
  group: string;
}

/**
 * CommandPalette — CMD+K / Ctrl+K powered command menu.
 *
 * Frosted glassmorphic modal using the `cmdk` library.
 * Provides instant keyboard-driven navigation to any section,
 * resume download, and contact — like Linear/Raycast/Arc.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);

  // ── Keyboard shortcut listener ────────────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev: boolean) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // ── Smooth scroll helper ──────────────────────────────────
  function scrollTo(id: string) {
    setOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  const commands: CommandItem[] = [
    {
      id: 'resume',
      label: 'View / Download CV (PDF)',
      shortcut: '⌘R',
      icon: <FileDown className="w-4 h-4 text-[#0066CC]" />,
      action: () => {
        setOpen(false);
        window.open(profileData.resumeUrl, '_blank');
      },
      group: 'Actions',
    },
    {
      id: 'about',
      label: 'Go to About & Timeline',
      shortcut: '⌘1',
      icon: <User className="w-4 h-4" />,
      action: () => scrollTo('about'),
      group: 'Navigate',
    },
    {
      id: 'skills',
      label: 'View Technical Arsenal & Stack',
      shortcut: '⌘2',
      icon: <Code2 className="w-4 h-4" />,
      action: () => scrollTo('skills'),
      group: 'Navigate',
    },
    {
      id: 'projects',
      label: 'View Mission Archives & Projects',
      shortcut: '⌘3',
      icon: <FolderKanban className="w-4 h-4" />,
      action: () => scrollTo('projects'),
      group: 'Navigate',
    },
    {
      id: 'team',
      label: 'Meet The Intelliverse Guild',
      shortcut: '⌘4',
      icon: <Users className="w-4 h-4" />,
      action: () => scrollTo('team'),
      group: 'Navigate',
    },
    {
      id: 'contact',
      label: 'Contact D R Thummar',
      shortcut: '⌘5',
      icon: <Mail className="w-4 h-4" />,
      action: () => scrollTo('contact'),
      group: 'Navigate',
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Command Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[201] w-full max-w-lg px-4"
          >
            <Command
              className="bg-white/90 backdrop-blur-2xl border border-white rounded-2xl shadow-[0_25px_60px_rgb(0,0,0,0.12)] overflow-hidden"
              label="Command palette"
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[0.06]">
                <Search className="w-4 h-4 text-[#0066CC] flex-shrink-0" />
                <Command.Input
                  placeholder="Type a command or search..."
                  className="w-full bg-transparent text-sm text-[#09090B] placeholder:text-[#71717A] outline-none font-sans"
                />
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-[#F2F2F7] border border-black/[0.06] rounded text-[10px] text-[#71717A] font-mono flex-shrink-0">
                  ESC
                </kbd>
              </div>

              {/* Command List */}
              <Command.List className="max-h-72 overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-sm text-[#71717A]">
                  No results found.
                </Command.Empty>

                {/* Group: Actions */}
                <Command.Group
                  heading="Actions"
                  className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-[#0066CC]"
                >
                  {commands
                    .filter((c) => c.group === 'Actions')
                    .map((cmd) => (
                      <Command.Item
                        key={cmd.id}
                        value={cmd.label}
                        onSelect={cmd.action}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm text-[#09090B] cursor-pointer transition-colors data-[selected=true]:bg-[#F2F2F7] data-[selected=true]:text-[#0066CC]"
                      >
                        <span className="flex items-center gap-3">
                          <span className="text-[#0066CC]">{cmd.icon}</span>
                          {cmd.label}
                        </span>
                        <span className="flex items-center gap-2">
                          {cmd.shortcut && (
                            <kbd className="px-1.5 py-0.5 bg-white border border-black/[0.06] rounded text-[10px] text-[#71717A] font-mono">
                              {cmd.shortcut}
                            </kbd>
                          )}
                          <ArrowRight className="w-3 h-3 text-slate-300" />
                        </span>
                      </Command.Item>
                    ))}
                </Command.Group>

                {/* Group: Navigate */}
                <Command.Group
                  heading="Navigate"
                  className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-[#71717A]"
                >
                  {commands
                    .filter((c) => c.group === 'Navigate')
                    .map((cmd) => (
                      <Command.Item
                        key={cmd.id}
                        value={cmd.label}
                        onSelect={cmd.action}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm text-[#09090B] cursor-pointer transition-colors data-[selected=true]:bg-[#F2F2F7] data-[selected=true]:text-[#0066CC]"
                      >
                        <span className="flex items-center gap-3">
                          <span className="text-slate-400">{cmd.icon}</span>
                          {cmd.label}
                        </span>
                        <span className="flex items-center gap-2">
                          {cmd.shortcut && (
                            <kbd className="px-1.5 py-0.5 bg-white border border-black/[0.06] rounded text-[10px] text-[#71717A] font-mono">
                              {cmd.shortcut}
                            </kbd>
                          )}
                          <ArrowRight className="w-3 h-3 text-slate-300" />
                        </span>
                      </Command.Item>
                    ))}
                </Command.Group>
              </Command.List>

              {/* Footer hint */}
              <div className="px-5 py-3 border-t border-black/[0.06] flex items-center justify-between bg-[#F2F2F7]/40">
                <span className="text-[11px] text-[#71717A]">
                  D R Thummar · Co-founder &amp; CTO at The Intelliverse
                </span>
                <span className="text-[11px] text-[#71717A] flex items-center gap-2">
                  <kbd className="px-1 py-0.5 bg-white border border-black/[0.06] rounded text-[10px] font-mono">↵</kbd>
                  to select
                </span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
