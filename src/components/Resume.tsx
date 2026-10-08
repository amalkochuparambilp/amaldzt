import { useRef } from 'react';
import { useCMS } from '../context/CMSContext';
import { Printer, Mail, MapPin, Linkedin, Phone } from 'lucide-react';

export default function Resume() {
  const { cms } = useCMS();
  const { profile, projects } = cms;
  const resumeRef = useRef<HTMLDivElement>(null);

  const publishedProjects = projects.filter((p) => p.published !== false);

  const handlePrint = () => {
    window.print();
  };

  return (
    <section id="resume-section" className="py-12 md:py-20 px-4 sm:px-6 max-w-4xl mx-auto space-y-8">
      {/* Upper header action controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-6 no-print">
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-3xl font-bold tracking-tight text-white uppercase">Curriculum Vitae</h2>
          <p className="text-xs text-white/50 font-sans">
            Formal resume record derived from live CMS academic & project records.
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="px-5 py-3 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg rounded-xs glitch-button"
        >
          <Printer className="w-4 h-4" />
          Print / Save PDF
        </button>
      </div>

      {/* Printable Sheet */}
      <div
        ref={resumeRef}
        className="bg-[#111] border border-white/10 rounded-sm p-6 sm:p-10 text-gray-200 font-sans space-y-8 shadow-2xl relative overflow-hidden"
      >
        {/* Header Block */}
        <div className="border-b border-white/10 pb-6 space-y-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{profile.name}</h1>
            <p className="text-xs font-mono text-white/60 tracking-wider uppercase mt-1">
              {profile.title} • {profile.education.institution}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-white/70">
            <a href={`mailto:${profile.email}`} className="hover:text-white flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-white/50" />
              <span>{profile.email}</span>
            </a>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-white/50" />
              <span>{profile.phone}</span>
            </span>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-white/50" />
              <span>{profile.location}</span>
            </span>
            <span className="text-white/20">|</span>
            <a href={profile.linkedin} target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-1.5">
              <Linkedin className="w-3.5 h-3.5 text-white/50" />
              <span>{profile.linkedin.replace(/^https?:\/\//, '')}</span>
            </a>
          </div>
        </div>

        {/* Professional Summary */}
        <div className="space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-white/40 border-b border-white/5 pb-1">
            PROFESSIONAL SUMMARY
          </h3>
          <p className="text-sm text-white/80 leading-relaxed font-light">
            {profile.resumeSummary}
          </p>
        </div>

        {/* Skills */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-white/40 border-b border-white/5 pb-1">
            SKILLS
          </h3>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            {profile.skillsList.map((skill) => (
              <span key={skill} className="px-3 py-1 bg-white/5 border border-white/10 text-white">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Projects */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-white/40 border-b border-white/5 pb-1">
            PROJECTS
          </h3>
          <div className="space-y-4">
            {publishedProjects.map((proj) => (
              <div key={proj.id} className="space-y-1">
                <div className="flex justify-between items-baseline gap-2">
                  <h4 className="text-sm font-bold text-white">{proj.title}</h4>
                  <span className="text-xs font-mono text-white/40 shrink-0">
                    {(proj.tech || []).slice(0, 4).join(', ')}
                  </span>
                </div>
                <ul className="list-disc list-inside text-xs text-white/70 space-y-1 font-light">
                  <li>{proj.description}</li>
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-white/40 border-b border-white/5 pb-1">
            EDUCATION
          </h3>
          <div className="flex justify-between items-start text-xs">
            <div>
              <h4 className="text-sm font-bold text-white">{profile.education.degree}</h4>
              <p className="text-white/60 font-mono mt-0.5">{profile.education.institution}</p>
            </div>
            <div className="text-right font-mono text-white/50">
              <p>{profile.education.period}</p>
              <p>{profile.education.location}</p>
            </div>
          </div>
        </div>

        {/* Languages */}
        <div className="space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-white/40 border-b border-white/5 pb-1">
            LANGUAGES
          </h3>
          <p className="text-xs font-mono text-white/80">{profile.languages.join(', ')}</p>
        </div>

        {/* Resume Footer */}
        <div className="border-t border-white/10 pt-4 flex justify-between items-center text-[10px] font-mono text-white/40">
          <span>{profile.name.toUpperCase()} — RESUME DOCUMENT</span>
          <span>{profile.location.toUpperCase()}</span>
        </div>
      </div>
    </section>
  );
}
