'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Activity, Brain, ShieldCheck, Layers, Terminal, Sparkles } from 'lucide-react';

// 💡 Center Interactive Brain & Bulb AI Core Container (Transparent Background & Larger Scale)
function CenterBrainBulbCore() {
  return (
    <div className="relative z-10 w-36 h-36 sm:w-44 sm:h-44 rounded-full flex flex-col items-center justify-center cursor-pointer pointer-events-auto bg-transparent transition-all hover:scale-105 group p-1">
      <img
        src="/assets/Brain+Bulb.svg"
        alt="Brain & Bulb AI Core"
        className="w-28 h-28 sm:w-36 sm:h-36 object-contain drop-shadow-[0_0_16px_rgba(59,130,246,0.5)] group-hover:scale-110 transition-transform duration-300"
      />
    </div>
  );
}

export function QuantumNeuralCore() {
  const [selectedNode, setSelectedNode] = useState<string>('ml');

  const nodes = [
    {
      id: 'ml',
      label: 'ML & Data Analytics',
      metric: 'ACCURACY: 99.4%',
      icon: Brain,
      color: '#0066CC',
      angle: 0,
      desc: 'Predictive neural pipelines & data intelligence systems.',
    },
    {
      id: 'web',
      label: '3-Tier Web Architecture',
      metric: 'LATENCY: <12ms',
      icon: Layers,
      color: '#38BDF8',
      angle: 72,
      desc: 'Scalable Next.js 16 + React 19 enterprise backend stack.',
    },
    {
      id: 'realtime',
      label: 'Real-Time Physics Engine',
      metric: 'PERFORMANCE: 60/120 FPS',
      icon: Zap,
      color: '#10B981',
      angle: 144,
      desc: 'Rapier 3D WebGL rigid-body simulation engine.',
    },
    {
      id: 'cloud',
      label: 'Microservices & REST APIs',
      metric: 'STATUS: ACTIVE CLUSTER',
      icon: Terminal,
      color: '#6366F1',
      angle: 216,
      desc: 'Distributed microservices, JWT auth & cloud infrastructure.',
    },
    {
      id: 'cert',
      label: 'IBM Certified Specialist',
      metric: 'CREDENTIAL: VERIFIED',
      icon: ShieldCheck,
      color: '#8B5CF6',
      angle: 288,
      desc: 'Certified expertise in Data Science and Machine Learning.',
    },
  ];

  const activeNodeData = nodes.find((n) => n.id === selectedNode) || nodes[0];

  return (
    <div className="w-full h-full min-h-[360px] sm:min-h-[440px] relative flex flex-col items-center justify-center p-4 select-none overflow-hidden">
      {/* Dynamic Background Pulse Rings & Glow Rays */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
        <div className="w-80 h-80 rounded-full border border-[#0066CC]/20 animate-ping" style={{ animationDuration: '6s' }} />
        <div className="w-64 h-64 rounded-full border border-sky-400/25 animate-pulse" />
        <div className="w-48 h-48 rounded-full border border-indigo-500/20" />
      </div>

      {/* SVG Interactive Cyber Core Diagram */}
      <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 300">
          <defs>
            <linearGradient id="coreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0066CC" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Outer Rotating HUD Orbit Ring */}
          <g className="origin-center animate-[spin_25s_linear_infinite]">
            <circle cx="150" cy="150" r="128" fill="none" stroke="#0066CC" strokeWidth="1" strokeDasharray="6 8" strokeOpacity="0.4" />
            <circle cx="150" cy="150" r="112" fill="none" stroke="#38BDF8" strokeWidth="1" strokeDasharray="30 15 5 15" strokeOpacity="0.5" />
          </g>

          {/* Counter-rotating Inner Orbit Ring */}
          <g className="origin-center animate-[spin_18s_linear_infinite_reverse]">
            <circle cx="150" cy="150" r="92" fill="none" stroke="#10B981" strokeWidth="1.5" strokeDasharray="40 20" strokeOpacity="0.6" />
          </g>

          {/* Connecting Node Beams */}
          {nodes.map((node, i) => {
            const rad = (node.angle * Math.PI) / 180;
            const x2 = 150 + 112 * Math.cos(rad);
            const y2 = 150 + 112 * Math.sin(rad);
            const isSelected = selectedNode === node.id;
            return (
              <line
                key={`beam-${i}`}
                x1="150"
                y1="150"
                x2={x2}
                y2={y2}
                stroke={node.color}
                strokeWidth={isSelected ? '2.5' : '1'}
                strokeOpacity={isSelected ? '0.9' : '0.3'}
                strokeDasharray={isSelected ? 'none' : '4 4'}
              />
            );
          })}
        </svg>

        {/* 🧠 Center Interactive Brain & Bulb AI Graphic Core (Transparent BG & Larger) */}
        <CenterBrainBulbCore />

        {/* Outer Orbit Node Badges */}
        {nodes.map((node) => {
          const rad = (node.angle * Math.PI) / 180;
          const x = 150 + 112 * Math.cos(rad) - 20;
          const y = 150 + 112 * Math.sin(rad) - 20;
          const NodeIcon = node.icon;
          const isSelected = selectedNode === node.id;

          return (
            <motion.div
              key={node.id}
              style={{ left: `${(x / 300) * 100}%`, top: `${(y / 300) * 100}%` }}
              whileHover={{ scale: 1.18 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedNode(node.id)}
              onMouseEnter={() => setSelectedNode(node.id)}
              className={`absolute z-20 w-10 h-10 rounded-xl backdrop-blur-md border shadow-md flex items-center justify-center cursor-pointer touch-target transition-all ${
                isSelected
                  ? 'bg-white border-[#0066CC] ring-2 ring-[#0066CC]/30 scale-110'
                  : 'bg-white/85 border-black/10'
              }`}
              title={node.label}
            >
              <NodeIcon className="w-5 h-5" style={{ color: node.color }} />
            </motion.div>
          );
        })}
      </div>

      {/* Dynamic Interactive Telemetry Info Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedNode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="mt-4 px-4 py-2.5 bg-white/90 backdrop-blur-md border border-black/[0.08] rounded-2xl shadow-xs max-w-sm w-full text-center flex flex-col items-center gap-1 font-mono"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-[#09090B]">
            <Sparkles className="w-3.5 h-3.5" style={{ color: activeNodeData.color }} />
            <span>{activeNodeData.label}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[#0066CC] font-semibold">
            <Activity className="w-3 h-3 animate-pulse" />
            <span>{activeNodeData.metric}</span>
          </div>
          <p className="text-[11px] font-sans text-[#71717A] leading-tight">
            {activeNodeData.desc}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default QuantumNeuralCore;
