import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Github, ExternalLink, X, Tag, ShieldCheck, ArrowRight, BookOpen } from 'lucide-react';
import { PROJECTS } from '../data';
import { Project } from '../types';

interface ProjectsProps {
  onLaunchTerminal: () => void;
}

export default function Projects({ onLaunchTerminal }: ProjectsProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | 'web' | 'system'>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const categories = [
    { id: 'all', label: 'All Projects' },
    { id: 'web', label: 'Web Applications' },
    { id: 'system', label: 'Systems & Core' }
  ];

  const filteredProjects = PROJECTS.filter(project => {
    if (activeCategory === 'all') return true;
    return project.category === activeCategory;
  });

  return (
    <section id="projects" className="py-20 px-4 max-w-6xl mx-auto space-y-12">
      <div className="space-y-4 text-center sm:text-left">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight flex items-center justify-center sm:justify-start gap-3">
          <span className="w-8 h-[1px] bg-neon-cyan hidden sm:block"></span>
          Showcased Projects
        </h2>
        <p className="text-gray-400 font-light max-w-xl font-sans">
          A focused curation of web interfaces, student tools, and developer assets built under the DZt engineering ecosystem.
        </p>
      </div>

      {/* Category Filter Toggles */}
      <div className="flex flex-wrap justify-center sm:justify-start gap-2.5 border-b border-cyber-border/40 pb-4">
        {categories.map((category) => (
          <button
            key={category.id}
            id={`filter-btn-${category.id}`}
            onClick={() => setActiveCategory(category.id as any)}
            className={`px-4 py-2 rounded-md font-mono text-xs transition-all relative cursor-pointer ${
              activeCategory === category.id
                ? 'text-neon-cyan border-b-2 border-neon-cyan font-semibold'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Grid Layout */}
      <motion.div 
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              id={`project-card-${project.id}`}
              onClick={() => setSelectedProject(project)}
              className="group bg-cyber-card border border-white/10 rounded-sm p-6 hover:bg-white/[0.02] transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden relative glow-border-cyan hover:-translate-y-1 h-[320px]"
            >
              <div className="space-y-4">
                {/* Tech Tag Tickers */}
                <div className="flex flex-wrap gap-1.5">
                  {project.tech.slice(0, 3).map((t, idx) => (
                    <span key={idx} className="px-2 py-0.5 border border-white/10 rounded-sm bg-white/5 text-[10px] font-mono text-gray-400">
                      {t}
                    </span>
                  ))}
                  {project.tech.length > 3 && (
                    <span className="px-1.5 py-0.5 border border-white/10 rounded-sm bg-white/5 text-[10px] font-mono text-white">
                      +{project.tech.length - 3}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="space-y-2">
                  <h3 className="text-xl font-display font-bold text-white group-hover:text-white/80 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-gray-400 font-light text-sm line-clamp-4">
                    {project.description}
                  </p>
                </div>
              </div>

              {/* Bottom footer bar */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10 font-mono text-xs text-gray-500 group-hover:text-white transition-colors">
                <span className="text-[10px] uppercase tracking-wider">{project.category}</span>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Specifications &rarr;
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Project Details Modal */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="bg-cyber-card border border-white/10 rounded-sm max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative p-6 sm:p-8 space-y-6"
            >
              {/* Close Button */}
              <button
                id="btn-close-modal"
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 p-2 rounded-sm border border-white/10 hover:bg-white/5 transition-colors text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono text-white/50">
                  <Tag className="w-3.5 h-3.5" />
                  <span className="uppercase tracking-widest">{selectedProject.category} CORE</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-white">
                  {selectedProject.title}
                </h3>
              </div>

              {/* Long Description */}
              <p className="text-gray-300 font-sans font-light leading-relaxed text-sm sm:text-base">
                {selectedProject.longDescription || selectedProject.description}
              </p>

              {/* Core Feature Checklist */}
              {selectedProject.features && (
                <div className="space-y-3">
                  <h4 className="text-xs font-mono uppercase text-gray-500 tracking-wider">Key Specifications</h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-gray-400">
                    {selectedProject.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Technologies */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase text-gray-500 tracking-wider">Technology Stack</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProject.tech.map((t, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-sm bg-white/5 text-xs font-mono text-white border border-white/5">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
                {selectedProject.id === 'dzt-os' ? (
                  <button
                    id="btn-modal-launch-terminal"
                    onClick={() => {
                      setSelectedProject(null);
                      onLaunchTerminal();
                    }}
                    className="flex-1 px-5 py-3 rounded-sm bg-white text-black text-sm font-mono font-medium hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Launch Core Terminal OS
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <a
                    href={selectedProject.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 px-5 py-3 rounded-sm bg-white text-black text-sm font-mono font-medium hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Live Interface
                  </a>
                )}
                <a
                  href={selectedProject.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-3 rounded-sm border border-white/10 text-gray-300 text-sm font-mono font-medium hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                >
                  <Github className="w-4 h-4" />
                  Source Code
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
