import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Network, Cpu, Layers, Terminal, Sparkles, Zap, ArrowRight, CornerDownRight } from 'lucide-react';
import { DZT_ECOSYSTEM } from '../data';

interface EcosystemNode {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'stable' | 'experimental';
  metrics: { label: string; value: string }[];
  details: string[];
  icon: any;
}

export default function DZtEcosystem() {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('core');

  const nodes: EcosystemNode[] = [
    {
      id: 'core',
      name: 'DZt Core Engine',
      description: 'The central orchestration layer handling overall state, animations schema, and shared utility pipelines.',
      status: 'stable',
      metrics: [
        { label: 'Bundle Size', value: '4.2 KB' },
        { label: 'Sync Latency', value: 'sub-12ms' },
        { label: 'GPU Threads', value: 'Thread-0' }
      ],
      details: [
        'Shared global state architecture across sub-nodes',
        'Built-in bezier easing animation presets',
        'Responsive boundary detection for multi-view scopes'
      ],
      icon: Cpu
    },
    {
      id: 'os',
      name: 'DZt OS Terminal',
      description: 'An interactive developer shell and console interface designed for systems management and portfolio showcase.',
      status: 'active',
      metrics: [
        { label: 'CLI Parser', value: 'Lexical' },
        { label: 'Buffered Logs', value: '1000+' },
        { label: 'Theme Engines', value: '4 (Neon/Green/Amber/Dark)' }
      ],
      details: [
        'Fully simulated shell pipeline',
        'Direct connection to contact & project state controllers',
        'Built-in terminal matrix rain screensaver'
      ],
      icon: Terminal
    },
    {
      id: 'symmetry',
      name: 'Symmetry UI Hub',
      description: 'A component design library built upon strict geometric grids, absolute symmetry, and fluid motion.',
      status: 'stable',
      metrics: [
        { label: 'Framework', value: 'React / Tailwind' },
        { label: 'Design Grid', value: '8px Base' },
        { label: 'Contrast Ratio', value: '18:1 (Safe)' }
      ],
      details: [
        'Zero bloated styles, pure utility mapping',
        'Keyboard navigation baked into all modals',
        'Responsive container scaling'
      ],
      icon: Layers
    },
    {
      id: 'sync',
      name: 'DZt Local Sync',
      description: 'An offline-first proxy storage driver built to run web database synchronizations seamlessly.',
      status: 'experimental',
      metrics: [
        { label: 'DB Client', value: 'IndexedDB' },
        { label: 'Sync Channel', value: 'WebSockets' },
        { label: 'Buffer Cache', value: 'Up to 50MB' }
      ],
      details: [
        'Optimistic rendering state buffers',
        'Automatic offline network recovery detection',
        'Conflict resolvers with delta-clocks'
      ],
      icon: Network
    }
  ];

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  return (
    <section id="ecosystem" className="py-20 px-4 max-w-6xl mx-auto space-y-16">
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center gap-1.5 text-xs font-mono text-neon-cyan px-2.5 py-1 rounded bg-neon-cyan/5 border border-neon-cyan/10 uppercase select-none">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The DZt Vision</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight">
          The {DZT_ECOSYSTEM.brand} Ecosystem
        </h2>
        <p className="text-gray-400 font-light max-w-2xl mx-auto font-sans text-sm sm:text-base leading-relaxed">
          {DZT_ECOSYSTEM.description}
        </p>
      </div>

      {/* Pillars of DZt */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {DZT_ECOSYSTEM.pillars.map((pillar, idx) => {
          const PillarIcon = pillar.title === 'Symmetry' ? Cpu : pillar.title === 'Simplicity' ? Layers : Zap;
          return (
            <div 
              key={idx}
              className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-4 relative overflow-hidden group hover:border-cyber-border/80 transition-all"
            >
              <div className="p-3 rounded-lg bg-cyber-dark border border-cyber-border/40 w-fit">
                <PillarIcon className="w-5 h-5 text-neon-cyan" />
              </div>
              <h3 className="text-lg font-display font-semibold text-white group-hover:text-neon-cyan transition-colors">
                {pillar.title}
              </h3>
              <p className="text-gray-400 font-light text-xs sm:text-sm leading-relaxed">
                {pillar.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Interactive System Architecture Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
        {/* Left 7 Columns: Visual Architectural Topology Diagram */}
        <div className="lg:col-span-7 bg-cyber-card border border-cyber-border rounded-xl p-6 sm:p-8 flex flex-col justify-between min-h-[400px] relative overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
          
          <div className="space-y-1 z-10">
            <h3 className="text-xs font-mono uppercase text-gray-500 tracking-wider">System Topology</h3>
            <p className="text-[10px] font-mono text-neon-cyan uppercase animate-pulse">DZt_OS://topology_live_feed</p>
          </div>

          {/* Topology Node Map */}
          <div className="relative py-12 flex justify-center items-center z-10 min-h-[220px]">
            {/* Center Orbital Ring */}
            <div className="absolute w-[220px] h-[220px] rounded-full border border-cyber-border/40 animate-[spin_40s_linear_infinite] pointer-events-none" />
            <div className="absolute w-[140px] h-[140px] rounded-full border border-dashed border-cyber-border/20 animate-[spin_20s_linear_infinite_reverse] pointer-events-none" />

            {/* Central Node (DZt Core) */}
            <button
              onClick={() => setSelectedNodeId('core')}
              className={`absolute w-16 h-16 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                selectedNodeId === 'core'
                  ? 'bg-neon-cyan/10 border-neon-cyan scale-110 shadow-[0_0_20px_rgba(0,240,255,0.15)] text-white'
                  : 'bg-cyber-dark border-cyber-border hover:border-gray-500 text-gray-400'
              }`}
            >
              <Cpu className="w-6 h-6" />
              <span className="text-[9px] font-mono font-bold mt-1">CORE</span>
            </button>

            {/* Satellite 1: DZt OS (Top) */}
            <button
              onClick={() => setSelectedNodeId('os')}
              className={`absolute -translate-y-24 w-12 h-12 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${
                selectedNodeId === 'os'
                  ? 'bg-neon-cyan/10 border-neon-cyan scale-110 shadow-[0_0_20px_rgba(0,240,255,0.15)] text-white'
                  : 'bg-cyber-dark border-cyber-border hover:border-gray-500 text-gray-400'
              }`}
            >
              <Terminal className="w-5 h-5" />
              <span className="text-[8px] font-mono mt-0.5">OS</span>
            </button>

            {/* Satellite 2: Symmetry UI (Right) */}
            <button
              onClick={() => setSelectedNodeId('symmetry')}
              className={`absolute translate-x-24 w-12 h-12 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${
                selectedNodeId === 'symmetry'
                  ? 'bg-neon-cyan/10 border-neon-cyan scale-110 shadow-[0_0_20px_rgba(0,240,255,0.15)] text-white'
                  : 'bg-cyber-dark border-cyber-border hover:border-gray-500 text-gray-400'
              }`}
            >
              <Layers className="w-5 h-5" />
              <span className="text-[8px] font-mono mt-0.5">SYM</span>
            </button>

            {/* Satellite 3: Sync Engine (Bottom) */}
            <button
              onClick={() => setSelectedNodeId('sync')}
              className={`absolute translate-y-24 w-12 h-12 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${
                selectedNodeId === 'sync'
                  ? 'bg-neon-cyan/10 border-neon-cyan scale-110 shadow-[0_0_20px_rgba(0,240,255,0.15)] text-white'
                  : 'bg-cyber-dark border-cyber-border hover:border-gray-500 text-gray-400'
              }`}
            >
              <Network className="w-5 h-5" />
              <span className="text-[8px] font-mono mt-0.5">SYNC</span>
            </button>
          </div>

          <div className="z-10 text-[10px] font-mono text-gray-500 flex items-center justify-between border-t border-cyber-border/40 pt-4">
            <span>[SELECT ANY NODE TO ACCESS PROTOCOL]</span>
            <span className="text-neon-cyan flex items-center gap-1">Amal K P // Lead Leader</span>
          </div>
        </div>

        {/* Right 5 Columns: Dynamic Node Protocol Details */}
        <div className="lg:col-span-5 bg-cyber-card border border-cyber-border rounded-xl p-6 sm:p-8 flex flex-col justify-between min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedNode.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Node Basic Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono border ${
                    selectedNode.status === 'stable' 
                      ? 'bg-neon-emerald/5 border-neon-emerald/20 text-neon-emerald'
                      : selectedNode.status === 'active'
                      ? 'bg-neon-cyan/5 border-neon-cyan/20 text-neon-cyan'
                      : 'bg-neon-purple/5 border-neon-purple/20 text-neon-purple'
                  }`}>
                    STATUS: {selectedNode.status.toUpperCase()}
                  </span>
                  <span className="font-mono text-[10px] text-gray-600">ID: {selectedNode.id.toUpperCase()}_NET</span>
                </div>
                
                <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  <selectedNode.icon className="w-5 h-5 text-neon-cyan" />
                  {selectedNode.name}
                </h3>
                <p className="text-gray-400 font-sans font-light text-xs sm:text-sm leading-relaxed">
                  {selectedNode.description}
                </p>
              </div>

              {/* Node Tech Specs */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase text-gray-500 tracking-wider">Active Telemetry</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {selectedNode.metrics.map((m, i) => (
                    <div key={i} className="bg-cyber-dark/40 border border-cyber-border/40 rounded p-2">
                      <p className="text-[9px] font-mono text-gray-500 uppercase">{m.label}</p>
                      <p className="text-xs font-mono font-semibold text-white mt-0.5">{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Node Sub-Details */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase text-gray-500 tracking-wider">Ecosystem Specifications</h4>
                <ul className="space-y-1.5">
                  {selectedNode.details.map((detail, index) => (
                    <li key={index} className="flex items-start gap-1.5 text-xs text-gray-400 font-mono">
                      <CornerDownRight className="w-3.5 h-3.5 text-neon-cyan flex-shrink-0 mt-0.5" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="pt-6 border-t border-cyber-border/40 flex justify-between items-center text-xs">
            <span className="font-mono text-gray-500">DZt://protocol_initialized</span>
            <div className="w-2.5 h-2.5 rounded-full bg-neon-cyan animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
}
