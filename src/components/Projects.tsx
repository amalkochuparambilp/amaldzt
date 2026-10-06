import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PROJECTS } from '../data';
import { Project } from '../types';
import { ExternalLink, Github, ArrowRight, Tag, ShieldCheck, X, Cpu } from 'lucide-react';

export default function Projects() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <section id="projects-section" className="py-12 md:py-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1">
          <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-mono">Selected Works</span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white uppercase">
            PROJECTS ({PROJECTS.length.toString().padStart(2, '0')})
          </h2>
        </div>
        <p className="text-xs text-white/50 max-w-sm font-sans leading-relaxed">
          Production systems built across PHP, Python Django, and modern React TypeScript frameworks.
        </p>
      </div>

      {/* Projects Grid - High Density layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PROJECTS.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            onClick={() => setSelectedProject(project)}
            className="group relative bg-[#111] border border-white/10 p-6 sm:p-8 flex flex-col justify-between hover:bg-[#161616] transition-all cursor-pointer overflow-hidden rounded-sm min-h-[260px]"
          >
            {/* Corner ambient shine */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors pointer-events-none" />

            {/* Top row */}
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                0{index + 1} / {project.category}
              </span>
              <div className="text-lg text-white/60 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                ↗
              </div>
            </div>

            {/* Content */}
            <div className="space-y-3 z-10">
              <h3 className="text-2xl font-bold tracking-tight text-white group-hover:text-white/90">
                {project.title}
              </h3>
              <p className="text-xs text-white/50 line-clamp-3 leading-relaxed font-sans">
                {project.description}
              </p>

              {/* Tech Tags */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {project.tech.map((t, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-white/5 border border-white/10 text-[10px] font-mono text-white/70">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Link indicator */}
            <div className="pt-4 border-t border-white/10 flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
              <span>View Specifications</span>
              <span>&rarr;</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Project Details Modal */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#111] border border-white/20 rounded-sm max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative p-6 sm:p-8 space-y-6 text-white"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 p-2 rounded-sm border border-white/10 hover:bg-white/10 transition-colors text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-white/50">
                  <Tag className="w-3.5 h-3.5" />
                  <span className="uppercase tracking-widest">{selectedProject.category} MODULE</span>
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-white">{selectedProject.title}</h3>
              </div>

              {/* Description */}
              <p className="text-sm font-sans text-gray-300 leading-relaxed font-light">
                {selectedProject.longDescription || selectedProject.description}
              </p>

              {/* Key Features */}
              {selectedProject.features && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-mono uppercase text-white/50 tracking-wider">Key Functional Modules</h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-gray-300">
                    {selectedProject.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-white/5 p-2 border border-white/5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tech Stack */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase text-white/50 tracking-wider">Architecture Stack</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProject.tech.map((t, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-sm bg-white/10 text-xs font-mono text-white border border-white/10">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
                <a
                  href={selectedProject.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 px-5 py-3 rounded-sm bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Github className="w-4 h-4" />
                  Source Repository
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
