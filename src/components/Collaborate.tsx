import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { COLLABORATIONS, AMAL_INFO } from '../data';
import { Collaboration } from '../types';
import { 
  Heart, 
  BookOpen, 
  Building2, 
  Activity, 
  CheckCircle2, 
  ChevronRight, 
  Sparkles, 
  Handshake, 
  Users, 
  MessageSquare,
  ArrowRight,
  Award
} from 'lucide-react';

interface CollaborateProps {
  onNavigate?: (tab: string) => void;
}

export default function Collaborate({ onNavigate }: CollaborateProps) {
  const [selectedCollab, setSelectedCollab] = useState<Collaboration | null>(null);

  // Helper render function for custom logos/emblems
  const renderLogo = (logoType: Collaboration['logoType']) => {
    if (logoType === 'libcode') {
      return (
        <div className="w-16 h-16 rounded-sm bg-gradient-to-br from-blue-900/80 to-black border border-blue-500/40 flex flex-col items-center justify-center p-2 text-blue-400 shadow-xl relative group-hover:border-blue-400 transition-colors">
          <div className="flex items-center gap-1 font-mono font-black text-xs tracking-tight text-white">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span>LIB</span>
          </div>
          <span className="text-[9px] font-mono text-blue-300 font-extrabold tracking-widest mt-0.5">&lt;CODE&gt;</span>
        </div>
      );
    }
    if (logoType === 'bank') {
      return (
        <div className="w-16 h-16 rounded-sm bg-gradient-to-br from-amber-900/80 to-black border border-amber-500/40 flex flex-col items-center justify-center p-2 text-amber-400 shadow-xl relative group-hover:border-amber-400 transition-colors">
          <Building2 className="w-6 h-6 text-amber-400" />
          <span className="text-[9px] font-mono text-amber-300 font-bold tracking-tighter mt-1 uppercase">CO-OP</span>
        </div>
      );
    }
    if (logoType === 'hrdiya') {
      return (
        <div className="w-16 h-16 rounded-sm bg-gradient-to-br from-cyan-900/80 to-black border border-cyan-500/40 flex flex-col items-center justify-center p-2 text-cyan-400 shadow-xl relative group-hover:border-cyan-400 transition-colors">
          <Activity className="w-6 h-6 text-cyan-400" />
          <span className="text-[9px] font-mono text-cyan-300 font-black tracking-widest mt-1 uppercase">HRDIYA</span>
        </div>
      );
    }
    return <Sparkles className="w-8 h-8 text-white" />;
  };

  return (
    <section className="py-12 md:py-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-12">
      
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1">
          <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-mono flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-white/60" />
            <span>Community Impact & Volunteering</span>
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white uppercase font-display">
            COLLABORATE & VOLUNTEERING
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-white/60 bg-white/5 px-3.5 py-2 border border-white/10">
          <Handshake className="w-4 h-4 text-white" />
          <span>Community Projects • Open Source • Creative Media</span>
        </div>
      </div>

      {/* Intro Banner */}
      <div className="bg-[#0e0e0e] border border-white/10 p-6 sm:p-8 relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 border border-white/20 text-white rounded-xs">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-xs font-mono text-white/40 uppercase tracking-widest">ECOSYSTEM VOLUNTEERING & LEADERSHIP</span>
        </div>
        <p className="text-sm sm:text-base text-gray-200 leading-relaxed max-w-4xl font-sans">
          Beyond core engineering, I actively volunteer and collaborate with educational institutions, security research initiatives, and digital broadcasting channels. Here is an overview of my key software implementations, cybersecurity visual designs, and media branding leadership.
        </p>
      </div>

      {/* Main Collaborations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {COLLABORATIONS.map((collab) => {
          return (
            <motion.div
              key={collab.id}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedCollab(collab)}
              className="bg-[#0e0e0e] border border-white/10 hover:border-white/30 p-6 sm:p-7 flex flex-col justify-between space-y-6 cursor-pointer group relative overflow-hidden rounded-xs"
            >
              <div className="space-y-5">
                {/* Header: Logo & Badge */}
                <div className="flex items-start justify-between gap-3">
                  {renderLogo(collab.logoType)}
                  <span className="text-[9px] font-mono text-white/60 bg-white/5 border border-white/15 px-2.5 py-1 uppercase tracking-widest font-bold text-right">
                    {collab.badge}
                  </span>
                </div>

                {/* Organization & Role */}
                <div className="space-y-1.5 pt-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-white transition-colors leading-snug">
                    {collab.organization}
                  </h3>
                  <p className="text-xs font-mono text-white/50">{collab.role}</p>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-300 leading-relaxed font-sans line-clamp-3">
                  {collab.description}
                </p>
              </div>

              {/* Footer Tags & Inspect Action */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex flex-wrap gap-1.5">
                  {collab.tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="text-[9px] font-mono bg-black border border-white/10 text-white/70 px-2.5 py-1">
                      #{tag}
                    </span>
                  ))}
                  {collab.tags.length > 3 && (
                    <span className="text-[9px] font-mono text-white/40 self-center">
                      +{collab.tags.length - 3}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-white/70 group-hover:text-white pt-1">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">Inspect Details</span>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Call to Action Box */}
      <div className="bg-[#0e0e0e] border border-white/15 p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-2">
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-white/60" />
            <span>Open for Collaboration</span>
          </span>
          <h3 className="text-xl font-bold text-white uppercase">Have a Project or Initiative in Mind?</h3>
          <p className="text-xs text-gray-400 max-w-xl font-sans">
            I am always open to collaborating on student projects, open-source tools, technical content design, or community software initiatives.
          </p>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('contact')}
            className="px-6 py-3 bg-white text-black text-xs font-bold font-mono uppercase tracking-widest hover:bg-neutral-200 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Get In Touch</span>
          </button>
        )}
      </div>

      {/* Detailed Modal Popup */}
      <AnimatePresence>
        {selectedCollab && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0d0d0d] border border-white/20 p-6 sm:p-8 max-w-2xl w-full space-y-6 relative rounded-sm shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start border-b border-white/10 pb-4 pr-6">
                <div className="flex items-center gap-4">
                  {renderLogo(selectedCollab.logoType)}
                  <div>
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">
                      {selectedCollab.badge}
                    </span>
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">
                      {selectedCollab.organization}
                    </h3>
                    <p className="text-xs text-white/60 font-mono mt-0.5">{selectedCollab.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCollab(null)}
                  className="p-2 text-white/50 hover:text-white border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Description & Details */}
              <div className="space-y-4">
                <p className="text-xs sm:text-sm text-gray-200 font-sans leading-relaxed">
                  {selectedCollab.description}
                </p>

                {/* Key Deliverables */}
                <div className="space-y-2 bg-black/60 border border-white/10 p-4">
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-2">
                    Key Deliverables & Responsibilities:
                  </span>
                  {selectedCollab.highlights.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-300 font-sans">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                {/* Tag List */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedCollab.tags.map((t, i) => (
                    <span key={i} className="text-[10px] font-mono bg-white/5 border border-white/10 text-white/70 px-2.5 py-1">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setSelectedCollab(null)}
                  className="px-5 py-2.5 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
}
