import { motion } from 'motion/react';
import { AMAL_INFO } from '../data';
import { 
  UserCheck, 
  GraduationCap, 
  Code, 
  Award, 
  Users
} from 'lucide-react';

export default function About() {
  return (
    <section className="py-12 md:py-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1">
          <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-mono flex items-center gap-2">
            <UserCheck className="w-3.5 h-3.5 text-white/60" />
            <span>Profile & Background</span>
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white uppercase font-display">
            ABOUT AMAL K P
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-white/50 bg-white/5 px-3 py-1.5 border border-white/10">
          <GraduationCap className="w-4 h-4 text-white" />
          <span>BCA @ JNIAS Balagram • Batch 2026</span>
        </div>
      </div>

      {/* Main Bio & Story Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (7 cols): Detailed Bio */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#0e0e0e] border border-white/10 p-6 sm:p-8 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white text-black font-black text-xl flex items-center justify-center rounded-xs">
                A
              </div>
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">{AMAL_INFO.name}</h3>
                <p className="text-xs text-white/50 font-mono uppercase">{AMAL_INFO.title}</p>
              </div>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed font-sans">
              I am a passionate software developer and Founder/Lead at <strong className="text-white font-semibold">DZt</strong>, currently pursuing my Bachelor of Computer Application (BCA) degree at <strong className="text-white">Jawaharlal Nehru Institute of Arts and Science (JNIAS)</strong> in Balagram, Idukki.
            </p>

            <p className="text-sm text-gray-300 leading-relaxed font-sans">
              My technical expertise bridges full-stack application development, database design, and creative media. I specialize in building robust web applications with <strong className="text-white">React, TypeScript, Python, Django, PHP, and MySQL</strong>. From engineering specialized college management software to crafting AI-assisted health diagnostic platforms, my goal is to deliver clean, scalable, and high-impact digital solutions.
            </p>

            {/* Core Values Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10">
              <div className="p-3 bg-black/60 border border-white/10 space-y-1">
                <Code className="w-4 h-4 text-white/70" />
                <span className="text-xs font-bold text-white block">Full-Stack Dev</span>
                <span className="text-[10px] text-white/40 block">React, Django & PHP</span>
              </div>
              <div className="p-3 bg-black/60 border border-white/10 space-y-1">
                <Users className="w-4 h-4 text-white/70" />
                <span className="text-xs font-bold text-white block">DZt Founder</span>
                <span className="text-[10px] text-white/40 block">Tech Community Lead</span>
              </div>
              <div className="p-3 bg-black/60 border border-white/10 space-y-1 col-span-2 sm:col-span-1">
                <Award className="w-4 h-4 text-white/70" />
                <span className="text-xs font-bold text-white block">JNIAS Campus</span>
                <span className="text-[10px] text-white/40 block">BCA Candidate '26</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Education & Key Info */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Education Card */}
          <div className="bg-[#0e0e0e] border border-white/10 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-white/60" />
                <span>Academic Institution</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5">
                ACTIVE
              </span>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold text-white">{AMAL_INFO.education.degree}</h4>
              <p className="text-xs text-white/70 font-sans">{AMAL_INFO.education.institution}</p>
              <div className="flex justify-between text-[11px] text-white/40 font-mono pt-1">
                <span>{AMAL_INFO.education.location}</span>
                <span className="text-white/60 font-semibold">{AMAL_INFO.education.status}</span>
              </div>
            </div>
          </div>

          {/* Languages & Location */}
          <div className="bg-[#0e0e0e] border border-white/10 p-6 space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-white/10 pb-3">
              Languages & Location
            </span>
            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-white/40">Primary Location:</span>
                <span className="text-white font-semibold">{AMAL_INFO.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Spoken Languages:</span>
                <span className="text-white font-semibold">{AMAL_INFO.languages.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Ecosystem Node:</span>
                <span className="text-white font-semibold">Balagram Core</span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </section>
  );
}

