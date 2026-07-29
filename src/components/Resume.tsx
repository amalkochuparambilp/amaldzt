import { useRef } from 'react';
import { AMAL_INFO, PROJECTS } from '../data';
import { Printer, Mail, MapPin, Linkedin, Phone, GraduationCap, Award, Languages, Code2 } from 'lucide-react';

export default function Resume() {
  const resumeRef = useRef<HTMLDivElement>(null);

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
            Formal resume record derived from academic & project telemetry.
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
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{AMAL_INFO.name}</h1>
            <p className="text-xs font-mono text-white/60 tracking-wider uppercase mt-1">
              BCA Candidate • Jawaharlal Nehru Institute of Art and Science
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-white/70">
            <a href={`mailto:${AMAL_INFO.email}`} className="hover:text-white flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-white/50" />
              <span>{AMAL_INFO.email}</span>
            </a>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-white/50" />
              <span>{AMAL_INFO.phone}</span>
            </span>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-white/50" />
              <span>{AMAL_INFO.location}</span>
            </span>
            <span className="text-white/20">|</span>
            <a href={AMAL_INFO.linkedin} target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-1.5">
              <Linkedin className="w-3.5 h-3.5 text-white/50" />
              <span>linkedin.com/in/amalkochuparambilp</span>
            </a>
          </div>
        </div>

        {/* Professional Summary */}
        <div className="space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-white/40 border-b border-white/5 pb-1">
            PROFESSIONAL SUMMARY
          </h3>
          <p className="text-sm text-white/80 leading-relaxed font-light">
            Recent BCA graduate seeking entry-level opportunity to apply foundational skills and grow professionally. Passionate developer specializing in high-performance user interfaces, Python/Django health analytics platforms, and co-operative bank portal solutions.
          </p>
        </div>

        {/* Skills */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-white/40 border-b border-white/5 pb-1">
            SKILLS
          </h3>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            {['Team Work', 'Computer Literacy', 'PHP', 'React', 'Python', 'Django', 'SQLite', 'JavaScript', 'TypeScript', 'Tailwind CSS'].map((skill) => (
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
            <div className="space-y-1">
              <div className="flex justify-between items-baseline">
                <h4 className="text-sm font-bold text-white">Co-operative bank Exam Portal</h4>
                <span className="text-xs font-mono text-white/40">PHP, MySQL, HTML/CSS</span>
              </div>
              <ul className="list-disc list-inside text-xs text-white/70 space-y-1 font-light">
                <li>Complete Exam portal engineered for Co-operative Bank with auto-grading, randomized question pools, and timing modules.</li>
              </ul>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-baseline">
                <h4 className="text-sm font-bold text-white">Hrdiya · Python, Django, Sqlite</h4>
                <span className="text-xs font-mono text-white/40">Python, Django, SQLite</span>
              </div>
              <ul className="list-disc list-inside text-xs text-white/70 space-y-1 font-light">
                <li>Web application made with Python & Django used to analyze heart disease risk parameters and consult cardiologists directly.</li>
              </ul>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-baseline">
                <h4 className="text-sm font-bold text-white">DZt Ecosystem & Interactive Web OS</h4>
                <span className="text-xs font-mono text-white/40">Founder & Lead Architect</span>
              </div>
              <ul className="list-disc list-inside text-xs text-white/70 space-y-1 font-light">
                <li>Command shell, web tools, and modular React component design systems created under the DZt initiative.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Education */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-white/40 border-b border-white/5 pb-1">
            EDUCATION
          </h3>
          <div className="flex justify-between items-start text-xs">
            <div>
              <h4 className="text-sm font-bold text-white">Bachelor of Computer Application (BCA)</h4>
              <p className="text-white/60 font-mono mt-0.5">Jawaharlal Nehru Institute of Art and Science</p>
            </div>
            <div className="text-right font-mono text-white/50">
              <p>Mar 2026</p>
              <p>Balagram, Idukki</p>
            </div>
          </div>
        </div>

        {/* Languages */}
        <div className="space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-white/40 border-b border-white/5 pb-1">
            LANGUAGES
          </h3>
          <p className="text-xs font-mono text-white/80">English, Malayalam</p>
        </div>

        {/* Resume Footer */}
        <div className="border-t border-white/10 pt-4 flex justify-between items-center text-[10px] font-mono text-white/40">
          <span>AMAL K P — RESUME DOCUMENT</span>
          <span>BALAGRAM, IDUKKI, KERALA</span>
        </div>
      </div>
    </section>
  );
}
