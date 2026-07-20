import { motion } from 'motion/react';
import { Terminal, ArrowRight, Sparkles, MapPin, Code2 } from 'lucide-react';
import { AMAL_INFO } from '../data';

interface HeroProps {
  onNavigate: (tab: string) => void;
  onLaunchTerminal: () => void;
}

export default function Hero({ onNavigate, onLaunchTerminal }: HeroProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section id="hero" className="relative min-h-[90vh] flex flex-col justify-center items-center px-4 py-16 overflow-hidden">
      {/* Absolute Ambient Background Lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full bg-neon-cyan/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] rounded-full bg-neon-purple/5 blur-[80px] pointer-events-none" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl w-full text-center z-10 space-y-8"
      >
        {/* DZt Core Badge */}
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyber-border bg-cyber-card/60 backdrop-blur-md text-xs font-mono text-neon-cyan select-none">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>DZt ECOSYSTEM FOUNDER & LEAD</span>
        </motion.div>

        {/* Main Heading Typography */}
        <div className="space-y-4">
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-6xl md:text-7.5xl font-display font-light leading-tight tracking-tight text-white"
          >
            Crafting digital <span className="italic font-serif text-white/95">ecosystems</span> <br className="hidden sm:inline" />
            with precision & purpose.
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto font-sans font-light leading-relaxed"
          >
            Hi, I'm <span className="text-white font-medium">{AMAL_INFO.name}</span>. A passionate developer from Balagram building beautifully aligned, high-density digital architectures.
          </motion.p>
        </div>

        {/* Info Grid (Location & College) */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 font-mono"
        >
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-cyber-card/30 border border-cyber-border/40">
            <MapPin className="w-3.5 h-3.5 text-neon-cyan" />
            <span>{AMAL_INFO.location}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-cyber-card/30 border border-cyber-border/40">
            <Code2 className="w-3.5 h-3.5 text-neon-purple" />
            <span>BCA Student @ JNIAS, Balagram</span>
          </div>
        </motion.div>

        {/* Call to Actions */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4"
        >
          <button
            id="btn-explore-projects"
            onClick={() => onNavigate('projects')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-lg font-mono text-sm font-medium bg-white text-black hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/5 cursor-pointer"
          >
            Explore Projects
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="btn-launch-terminal"
            onClick={onLaunchTerminal}
            className="w-full sm:w-auto px-6 py-3.5 rounded-lg font-mono text-sm font-medium border border-cyber-border hover:bg-cyber-card text-gray-300 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Terminal className="w-4 h-4 text-neon-cyan" />
            DZt OS Terminal
          </button>
        </motion.div>

        {/* Live System Status Ticker */}
        <motion.div
          variants={itemVariants}
          className="pt-12 flex justify-center items-center gap-6"
        >
          <div className="flex items-center gap-2 text-xs font-mono text-gray-600">
            <span className="w-2 h-2 rounded-full bg-neon-cyan animate-ping" />
            <span>DZt_OS v1.4 LIVE</span>
          </div>
          <div className="h-4 w-[1px] bg-cyber-border" />
          <div className="flex items-center gap-2 text-xs font-mono text-gray-600">
            <span className="w-2 h-2 rounded-full bg-neon-purple animate-pulse" />
            <span>JNIAS PORTAL DEPLOYED</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Decorative Cybernetic Side Borders */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-center gap-3 select-none">
        <span className="text-[10px] font-mono text-gray-700 tracking-widest uppercase rotate-90 my-8">
          DZt_CORE_INITIATIVE
        </span>
        <div className="w-[1px] h-20 bg-cyber-border" />
      </div>

      <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-center gap-3 select-none">
        <div className="w-[1px] h-20 bg-cyber-border" />
        <span className="text-[10px] font-mono text-gray-700 tracking-widest uppercase -rotate-90 my-8">
          BALAGRAM_LABS_99
        </span>
      </div>
    </section>
  );
}
