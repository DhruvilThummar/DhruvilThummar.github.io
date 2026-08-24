'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Zap, Activity, Brain, ShieldCheck, Layers, Terminal } from 'lucide-react';

export function QuantumNeuralCore() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const nodes = [
    { id: 'ml', label: 'ML / AI Pipeline', icon: Brain, color: '#0066CC', angle: 0 },
    { id: 'web', label: '3-Tier Web Systems', icon: Layers, color: '#38BDF8', angle: 72 },
    { id: 'realtime', label: 'Real-Time Engines', icon: Zap, color: '#10B981', angle: 144 },
    { id: 'cloud', label: 'Microservices & API', icon: Terminal, color: '#6366F1', angle: 216 },
    { id: 'cert', label: 'IBM Certified Spec.', icon: ShieldCheck, color: '#8B5CF6', angle: 288 },
  ];

  return (
    <div className="w-full h-full min-h-[320px] sm:min-h-[380px] relative flex flex-col items-center justify-center p-4 select-none overflow-hidden">
      {/* Dynamic Background Pulse Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
        <div className="w-72 h-72 rounded-full border border-[#0066CC]/20 animate-ping" style={{ animationDuration: '6s' }} />
        <div className="w-56 h-56 rounded-full border border-sky-400/20 animate-pulse" />
        <div className="w-40 h-40 rounded-full border border-indigo-500/20" />
      </div>

      {/* SVG Interactive Cyber Core Diagram */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 300">
          <defs>
            <linearGradient id="coreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0066CC" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.8" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Rotating HUD Orbit Ring */}
          <g className="origin-center animate-[spin_25s_linear_infinite]">
            <circle cx="150" cy="150" r="125" fill="none" stroke="#0066CC" strokeWidth="1" strokeDasharray="6 8" strokeOpacity="0.4" />
            <circle cx="150" cy="150" r="105" fill="none" stroke="#38BDF8" strokeWidth="1" strokeDasharray="30 15 5 15" strokeOpacity="0.5" />
          </g>

          {/* Counter-rotating Inner Orbit Ring */}
          <g className="origin-center animate-[spin_18s_linear_infinite_reverse]">
            <circle cx="150" cy="150" r="80" fill="none" stroke="#10B981" strokeWidth="1.5" strokeDasharray="40 20" strokeOpacity="0.6" />
          </g>

          {/* Connecting Node Beams */}
          {nodes.map((node, i) => {
            const rad = (node.angle * Math.PI) / 180;
            const x2 = 150 + 105 * Math.cos(rad);
            const y2 = 150 + 105 * Math.sin(rad);
            return (
              <line
                key={`beam-${i}`}
                x1="150"
                y1="150"
                x2={x2}
                y2={y2}
                stroke={node.color}
                strokeWidth={hoveredNode === node.id ? '2.5' : '1'}
                strokeOpacity={hoveredNode === node.id ? '0.9' : '0.3'}
                strokeDasharray="4 4"
              />
            );
          })}
        </svg>

        {/* Central Luminous Quantum Core */}
        <motion.div
          animate={{ scale: [1, 1.06, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-[#09090B] via-[#0066CC] to-sky-400 p-[2px] shadow-lg shadow-[#0066CC]/20 flex items-center justify-center cursor-pointer"
        >
          <div className="w-full h-full rounded-full bg-[#09090B]/90 backdrop-blur-md flex flex-col items-center justify-center p-2 text-center border border-white/20">
            <Cpu className="w-6 h-6 text-[#38BDF8] animate-pulse mb-1" />
            <span className="font-mono text-[9px] font-bold text-white tracking-widest uppercase">
              NEURAL CORE
            </span>
            <span className="font-mono text-[8px] text-[#38BDF8] font-medium">
              v3.6 ACTIVE
            </span>
          </div>
        </motion.div>

        {/* Outer Orbit Node Badges */}
        {nodes.map((node) => {
          const rad = (node.angle * Math.PI) / 180;
          // Radius: 105px
          const x = 150 + 105 * Math.cos(rad) - 20; // 40px width offset
          const y = 150 + 105 * Math.sin(rad) - 20;
          const NodeIcon = node.icon;

          return (
            <motion.div
              key={node.id}
              style={{ left: `${(x / 300) * 100}%`, top: `${(y / 300) * 100}%` }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              className="absolute z-20 w-10 h-10 rounded-xl bg-white/90 backdrop-blur-md border border-black/10 shadow-md flex items-center justify-center cursor-pointer touch-target"
              title={node.label}
            >
              <NodeIcon className="w-5 h-5" style={{ color: node.color }} />
            </motion.div>
          );
        })}
      </div>

      {/* Dynamic Interactive Telemetry Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 px-4 py-2 bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-full shadow-xs flex items-center gap-2 font-mono text-[11px] text-[#09090B]"
      >
        <Activity className="w-3.5 h-3.5 text-[#0066CC] animate-pulse" />
        <span className="text-[#71717A]">FOCUS:</span>
        <span className="font-bold text-[#0066CC]">
          {hoveredNode
            ? nodes.find((n) => n.id === hoveredNode)?.label
            : 'MACHINE LEARNING & SYSTEMS ARCHITECTURE'}
        </span>
      </motion.div>
    </div>
  );
}

export default QuantumNeuralCore;
