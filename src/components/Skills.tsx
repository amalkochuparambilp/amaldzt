import { motion } from 'motion/react';
import { SKILLS, AMAL_INFO } from '../data';
import * as Icons from 'lucide-react';

export default function Skills() {
  const renderIcon = (iconName: string) => {
    const LucideIcon = (Icons as any)[iconName];
    if (LucideIcon) {
      return <LucideIcon className="w-4 h-4 text-white/80" />;
    }
    return <Icons.Code2 className="w-4 h-4 text-white/80" />;
  };

  const categories = ['Frontend', 'Backend', 'Core & Tools', 'Professional'] as const;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <section id="skills" className="py-12 md:py-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1">
          <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-mono">Competencies</span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white uppercase">
            TECHNICAL & PROFESSIONAL GRID
          </h2>
        </div>
        <p className="text-xs text-white/50 max-w-sm font-sans leading-relaxed">
          Full stack proficiency spanning React, Python Django, PHP, database engines and team leadership.
        </p>
      </div>

      {/* Core Quick Stack Badges */}
      <div className="space-y-3">
        <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-mono">Core Stack Overview</span>
        <div className="flex flex-wrap gap-2">
          {AMAL_INFO.skillsList.map((skill) => (
            <span key={skill} className="px-3 py-1.5 bg-[#111] border border-white/10 text-xs font-mono text-white/90">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {categories.map((category) => {
          const categorySkills = SKILLS.filter(s => s.category === category);
          if (categorySkills.length === 0) return null;

          return (
            <div key={category} className="space-y-4">
              <h3 className="text-xs font-mono uppercase text-white/60 tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white"></span>
                {category} Competencies
              </h3>

              <motion.div 
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {categorySkills.map((skill) => (
                  <motion.div
                    key={skill.name}
                    variants={cardVariants}
                    className="bg-[#111] border border-white/10 rounded-sm p-4 flex flex-col gap-3 hover:border-white/30 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        {renderIcon(skill.icon)}
                        <span className="font-sans text-xs text-gray-200 font-medium">{skill.name}</span>
                      </div>
                      <span className="font-mono text-xs text-white/80">{skill.level}%</span>
                    </div>
                    
                    {/* Meter bar */}
                    <div className="w-full h-1 bg-black rounded-sm overflow-hidden border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${skill.level}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-white"
                      />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
