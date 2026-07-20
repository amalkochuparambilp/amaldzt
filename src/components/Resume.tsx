import { useRef } from 'react';
import { Download, Mail, Github, MapPin, Award, BookOpen, Layers, Briefcase, ExternalLink, Printer } from 'lucide-react';
import { AMAL_INFO, PROJECTS, SKILLS } from '../data';

export default function Resume() {
  const resumeRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <section id="resume-section" className="py-20 px-4 max-w-4xl mx-auto space-y-8">
      {/* Upper header action controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-6 no-print">
        <div className="space-y-1.5 text-center sm:text-left">
          <h2 className="text-3xl font-display font-bold text-white tracking-tight">Curriculum Vitae</h2>
          <p className="text-gray-400 font-light text-sm font-sans">
            A printable, high-symmetry overview of academic qualifications and project logs.
          </p>
        </div>

        <button
          id="btn-print-resume"
          onClick={handlePrint}
          className="px-5 py-3 rounded-sm bg-white text-black text-xs font-mono font-medium hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-white/5 cursor-pointer uppercase tracking-wider font-bold"
        >
          <Printer className="w-4 h-4" />
          Print / Download PDF Resume
        </button>
      </div>

      {/* Printable Sheet */}
      <div 
        ref={resumeRef}
        className="bg-cyber-card border border-white/10 rounded-sm p-6 sm:p-10 text-gray-300 font-sans space-y-8 shadow-2xl relative overflow-hidden"
      >
        {/* Dynamic Glow Accents (Hidden on Print) */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-[80px] no-print pointer-events-none" />

        {/* CV Header: Name, Title, Contacts */}
        <div className="border-b border-white/10 pb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">{AMAL_INFO.name}</h1>
            <p className="text-white font-mono text-sm tracking-wide uppercase">{AMAL_INFO.title}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-gray-500 pt-1.5">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-white" />
                {AMAL_INFO.location}
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-white/60" />
                BCA Student @ JNIAS Balagram
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 font-mono text-xs text-gray-400 sm:text-right w-full sm:w-auto">
            <a href={`mailto:${AMAL_INFO.email}`} className="hover:text-white flex items-center gap-1.5 sm:justify-end">
              <span>{AMAL_INFO.email}</span>
              <Mail className="w-3.5 h-3.5" />
            </a>
            <a href={AMAL_INFO.github} target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-1.5 sm:justify-end">
              <span>github.com/amalkp</span>
              <Github className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* CV Bio Statement */}
        <div className="space-y-2">
          <h3 className="text-xs font-mono uppercase text-white/60 tracking-wider">Professional Profile</h3>
          <p className="text-sm font-light leading-relaxed text-gray-400">
            {AMAL_INFO.bio} Focused on engineering responsive user interface architectures and modular web tools under the DZt initiative.
          </p>
        </div>

        {/* 2-Column Split: Experience/Education on Left, Skills/Ecosystem on Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-2">
          
          {/* Left Column: Academics & Projects (7 Columns) */}
          <div className="md:col-span-7 space-y-6">
            
            {/* Education section */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase text-white/60 tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Academic Background
              </h3>
              <div className="border-l border-white/10 pl-4 space-y-3 relative">
                <div className="space-y-1 relative">
                  {/* Visual Node Bullet */}
                  <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-cyber-card" />
                  <div className="flex justify-between items-center text-sm font-semibold text-white">
                    <h4>Bachelor of Computer Applications (BCA)</h4>
                    <span className="text-xs font-mono text-gray-500">2024 - 2027</span>
                  </div>
                  <p className="text-xs font-mono text-gray-400">Jawaharlal Nehru Institute of Advanced Studies (JNIAS), Balagram</p>
                  <p className="text-xs text-gray-500 font-light mt-1">Acquiring strong foundations in computer networks, relational databases, data structures, and responsive software application lifecycles.</p>
                </div>
              </div>
            </div>

            {/* Experience / Leadership section */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase text-white/60 tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Leadership & Initiative
              </h3>
              <div className="border-l border-white/10 pl-4 space-y-4 relative">
                <div className="space-y-1 relative">
                  <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-cyber-card" />
                  <div className="flex justify-between items-center text-sm font-semibold text-white">
                    <h4>Founder & Lead Architect</h4>
                    <span className="text-xs font-mono text-gray-500">2024 - Present</span>
                  </div>
                  <p className="text-xs font-mono text-gray-400">DZt Digital Ecosystem Initiative</p>
                  <p className="text-xs text-gray-500 font-light mt-1">Conceived, designed, and maintains DZt, an autonomous ecosystem of minimalist web components, interactive utilities, and offline-first proxies designed for rapid, low-latency client compilation.</p>
                </div>
              </div>
            </div>

            {/* Key Project Logs */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase text-white/60 tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4" />
                Featured Project Logs
              </h3>
              <div className="space-y-3">
                {PROJECTS.slice(0, 3).map((proj) => (
                  <div key={proj.id} className="bg-cyber-dark/40 border border-white/10 rounded-sm p-4 space-y-1">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-mono font-semibold text-white">{proj.title}</h4>
                      <span className="text-[10px] font-mono text-gray-500 uppercase">{proj.category}</span>
                    </div>
                    <p className="text-xs text-gray-400 font-light leading-relaxed">{proj.description}</p>
                    <p className="text-[10px] font-mono text-gray-500 pt-1">Stack: {proj.tech.slice(0, 4).join(', ')}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Skills & DZt Ecosystem Details (5 Columns) */}
          <div className="md:col-span-5 space-y-6">
            
            {/* Tech Stack List */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase text-white/60 tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Technical Competence
              </h3>
              <div className="space-y-3.5">
                {['Frontend', 'Backend', 'Tools'].map((cat) => {
                  const filtered = SKILLS.filter(s => s.category === cat);
                  return (
                    <div key={cat} className="space-y-1.5">
                      <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{cat} Stack</h4>
                      <div className="flex flex-wrap gap-1">
                        {filtered.map((s) => (
                          <span key={s.name} className="px-2 py-0.5 rounded-sm bg-cyber-dark text-[10px] font-mono text-white border border-white/10">
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DZt Core Philosophy */}
            <div className="bg-cyber-dark/30 border border-white/10 rounded-sm p-5 space-y-3">
              <h4 className="text-xs font-mono uppercase text-white/60 tracking-wider">The DZt Philosophy</h4>
              <p className="text-xs text-gray-400 font-light leading-relaxed">
                "Symmetry. Simplicity. Speed." Aligned strictly to modular grids, removing unnecessary UI decorations, and maintaining GPU-accelerated fluid motion transitions.
              </p>
              <div className="grid grid-cols-3 gap-1.5 text-center pt-1 text-[10px] font-mono text-gray-500">
                <div className="border border-white/10 py-1 bg-cyber-dark/40">SYMMETRY</div>
                <div className="border border-white/10 py-1 bg-cyber-dark/40">SIMPLICITY</div>
                <div className="border border-white/10 py-1 bg-cyber-dark/40">SPEED</div>
              </div>
            </div>

          </div>

        </div>

        {/* Resume Footer (Print Stamp) */}
        <div className="border-t border-white/10 pt-6 flex justify-between items-center text-xs font-mono text-gray-500">
          <span>DZt_OS_VERIFY://Amal_K_P_Resume</span>
          <span className="text-right">Balagram, Kerala, India</span>
        </div>
      </div>
    </section>
  );
}
