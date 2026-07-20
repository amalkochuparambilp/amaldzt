import { motion } from 'motion/react';
import * as Icons from 'lucide-react';
import { SKILLS } from '../data';
import { Skill } from '../types';

export default function Skills() {
  // Safe helper to render Lucide Icons by string name
  const renderIcon = (iconName: string) => {
    const LucideIcon = (Icons as any)[iconName];
    if (LucideIcon) {
      return <LucideIcon className="w-4 h-4 text-white/80" />;
    }
    return <Icons.Code2 className="w-4 h-4 text-white/80" />;
  };

  const categories = ['Frontend', 'Backend', 'Tools', 'Design'] as const;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <section id="skills" className="py-20 px-4 max-w-6xl mx-auto space-y-12">
      <div className="space-y-4 text-center sm:text-left">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight flex items-center justify-center sm:justify-start gap-3">
          <span className="w-8 h-[1px] bg-white hidden sm:block"></span>
          Capability Grid
        </h2>
        <p className="text-gray-400 font-light max-w-xl font-sans">
          A visual measurement of technology proficiencies and core competencies. Structured for speed and high-symmetry integration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Frontend & Design */}
        <div className="space-y-8">
          {['Frontend', 'Design'].map((category) => {
            const filtered = SKILLS.filter(s => s.category === category);
            if (filtered.length === 0) return null;

            return (
              <div key={category} className="space-y-4">
                <h3 className="text-xs font-mono uppercase text-gray-500 tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                  {category} Stack
                </h3>
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="space-y-3"
                >
                  {filtered.map((skill) => (
                    <motion.div
                      key={skill.name}
                      variants={cardVariants}
                      className="bg-cyber-card border border-white/10 rounded-sm p-4 flex flex-col gap-3 hover:border-white/25 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          {renderIcon(skill.icon)}
                          <span className="font-sans text-sm text-gray-200 font-medium">{skill.name}</span>
                        </div>
                        <span className="font-mono text-xs text-white">{skill.level}%</span>
                      </div>
                      
                      {/* Meter bar */}
                      <div className="w-full h-1 bg-black rounded-sm overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${skill.level}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: 'easeOut' }}
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

        {/* Right Column: Backend & Tools */}
        <div className="space-y-8">
          {['Backend', 'Tools'].map((category) => {
            const filtered = SKILLS.filter(s => s.category === category);
            if (filtered.length === 0) return null;

            return (
              <div key={category} className="space-y-4">
                <h3 className="text-xs font-mono uppercase text-gray-500 tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40"></span>
                  {category} Ecosystem
                </h3>
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="space-y-3"
                >
                  {filtered.map((skill) => (
                    <motion.div
                      key={skill.name}
                      variants={cardVariants}
                      className="bg-cyber-card border border-white/10 rounded-sm p-4 flex flex-col gap-3 hover:border-white/25 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          {renderIcon(skill.icon)}
                          <span className="font-sans text-sm text-gray-200 font-medium">{skill.name}</span>
                        </div>
                        <span className="font-mono text-xs text-white">{skill.level}%</span>
                      </div>
                      
                      {/* Meter bar */}
                      <div className="w-full h-1 bg-black rounded-sm overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${skill.level}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full bg-white/80"
                        />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
