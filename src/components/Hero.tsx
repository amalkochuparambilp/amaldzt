import { motion } from 'motion/react';
import { ArrowRight, Cpu, FileText, Mail, UserCheck, Database } from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import HeroTelemetry from './HeroTelemetry';
import PartnershipMarquee from './PartnershipMarquee';

interface HeroProps {
  onNavigate: (tab: string) => void;
}

export default function Hero({ onNavigate }: HeroProps) {
  const { cms } = useCMS();
  const { profile, settings, projects } = cms;

  const featuredProjects = projects
    .filter((p) => p.published !== false && p.featured)
    .slice(0, 3);

  const highlightColors = ['text-emerald-400', 'text-amber-400', 'text-cyan-400'];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <section className="relative py-12 md:py-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-12">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Status bar */}
        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3 text-xs font-mono">
          {profile.availabilityActive && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
              <span className="text-white/90">{profile.availabilityText}</span>
            </div>
          )}

          {profile.campusBadge && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-sm text-white/60">
              <Cpu className="w-3.5 h-3.5 text-white" />
              <span>{profile.campusBadge}</span>
            </div>
          )}

          {profile.founderBadge && (
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/20 text-[10px] uppercase tracking-widest text-white/80">
              {profile.founderBadge}
            </div>
          )}
        </motion.div>

        {/* Hero Display Typography */}
        <div className="space-y-4">
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-6xl md:text-7xl font-display font-light leading-tight tracking-tight text-white"
          >
            {profile.heroHeadingLine1}{' '}
            <span className="italic font-serif text-white/95">{profile.heroHeadingItalic}</span>{' '}
            <br className="hidden sm:inline" />
            {profile.heroHeadingLine2}
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-gray-400 text-base sm:text-lg max-w-2xl font-sans font-light leading-relaxed"
          >
            Hi, I'm <span className="text-white font-medium">{profile.name}</span>. {profile.heroBio}
          </motion.p>
        </div>

        {/* Action button CTA cluster */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
          <button
            id="btn-hero-projects"
            onClick={() => onNavigate('projects')}
            className="w-full sm:w-auto min-h-[44px] px-6 py-3 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-xs whitespace-nowrap"
          >
            <span>Explore Projects</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="btn-hero-about"
            onClick={() => onNavigate('about')}
            className="w-full sm:w-auto min-h-[44px] px-6 py-3 border border-white/20 bg-white/5 text-white text-xs font-mono font-medium hover:bg-white/10 hover:border-white/40 transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-xs whitespace-nowrap"
          >
            <UserCheck className="w-4 h-4" />
            <span>About Me</span>
          </button>

          <button
            id="btn-hero-resume"
            onClick={() => onNavigate('resume')}
            className="w-full sm:w-auto min-h-[44px] px-6 py-3 border border-white/10 text-gray-300 hover:text-white text-xs font-mono transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-xs whitespace-nowrap"
          >
            <FileText className="w-4 h-4" />
            <span>View CV</span>
          </button>

          <button
            id="btn-hero-contact"
            onClick={() => onNavigate('contact')}
            className="w-full sm:w-auto min-h-[44px] px-6 py-3 border border-white/10 text-gray-400 hover:text-white text-xs font-mono transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-xs whitespace-nowrap"
          >
            <Mail className="w-4 h-4" />
            <span>Get In Touch</span>
          </button>
        </motion.div>

        {/* Flagship DZt Core Ecosystem Highlights Strip */}
        {settings.showHeroHighlights && featuredProjects.length > 0 && (
          <motion.div variants={itemVariants} className="pt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
            {featuredProjects.map((proj, idx) => (
              <div
                key={proj.id}
                onClick={() => onNavigate('projects')}
                className="p-3.5 bg-white/5 border border-white/10 hover:border-white/30 rounded-xs transition-all cursor-pointer group space-y-1"
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className={`${highlightColors[idx % highlightColors.length]} font-bold`}>
                    {proj.highlightLabel || `0${idx + 1}. ${proj.title.toUpperCase().slice(0, 18)}`}
                  </span>
                  <span className="text-white/40 group-hover:text-white transition-colors">
                    {proj.highlightStack || proj.tech.slice(0, 2).join(' / ')}
                  </span>
                </div>
                <p className="text-xs text-white/80 font-mono line-clamp-1">{proj.description}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Partnership and Colab Logo Marquee */}
        {settings.showHeroMarquee && (
          <motion.div variants={itemVariants} className="pt-2">
            <PartnershipMarquee onNavigate={onNavigate} />
          </motion.div>
        )}

        {/* Live Interactive Telemetry Dashboard */}
        {settings.showHeroTelemetry && (
          <motion.div variants={itemVariants} className="pt-2">
            <HeroTelemetry />
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
