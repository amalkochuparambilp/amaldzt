import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AMAL_INFO } from '../data';
import { Mail, Phone, MapPin, Linkedin, Github, Send, Check, MessageSquare } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    const subject = encodeURIComponent(`Portfolio message from ${formData.name}`);
    const body = encodeURIComponent(`${formData.message}\n\nReply to: ${formData.email}`);
    window.location.href = `mailto:${AMAL_INFO.email}?subject=${subject}&body=${body}`;
    setStatus('success');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <section id="contact-section" className="py-12 md:py-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1">
          <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-mono">Transmission Relay</span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white uppercase">
            GET IN TOUCH
          </h2>
        </div>
        <p className="text-xs text-white/50 max-w-sm font-sans leading-relaxed">
          Reach out for collaborations, project inquiries, or software discussions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 5 cols: Info Cards */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#111] border border-white/10 p-6 space-y-6">
            <h3 className="text-lg font-bold text-white uppercase tracking-tight">Direct Channels</h3>

            <div className="space-y-4 text-xs font-mono">
              <a 
                href={`mailto:${AMAL_INFO.email}`}
                className="flex items-center gap-4 p-4 bg-black/60 border border-white/10 hover:border-white/30 transition-all group"
              >
                <div className="p-2.5 bg-white/5 border border-white/10">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-[10px] text-white/40 uppercase block">Email Address</span>
                  <span className="text-white group-hover:underline">{AMAL_INFO.email}</span>
                </div>
              </a>

              <a 
                href={`tel:${AMAL_INFO.phone}`}
                className="flex items-center gap-4 p-4 bg-black/60 border border-white/10 hover:border-white/30 transition-all group"
              >
                <div className="p-2.5 bg-white/5 border border-white/10">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-[10px] text-white/40 uppercase block">Phone / Mobile</span>
                  <span className="text-white group-hover:underline">{AMAL_INFO.phone}</span>
                </div>
              </a>

              <div className="flex items-center gap-4 p-4 bg-black/60 border border-white/10">
                <div className="p-2.5 bg-white/5 border border-white/10">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-[10px] text-white/40 uppercase block">Location</span>
                  <span className="text-white">{AMAL_INFO.location}</span>
                </div>
              </div>
            </div>

            {/* Social links */}
            <div className="pt-2 border-t border-white/10 flex gap-3">
              <a 
                href={AMAL_INFO.github}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-mono text-center text-white transition-colors flex items-center justify-center gap-2"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </a>

              <a 
                href={AMAL_INFO.linkedin}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-mono text-center text-white transition-colors flex items-center justify-center gap-2"
              >
                <Linkedin className="w-4 h-4" />
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right 7 cols: Interactive Form */}
        <div className="lg:col-span-7 bg-[#111] border border-white/10 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-white/60" />
              <span>SEND DIRECT MESSAGE</span>
            </h3>
            <span className="text-[10px] font-mono text-white/40">RELAY ACTIVE</span>
          </div>

          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-12 text-center space-y-4"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 border border-white mx-auto flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white">Email Ready</h4>
                <p className="text-xs text-white/60 max-w-sm mx-auto font-sans leading-relaxed">
                  Your email client is opening with the message pre-filled. Complete and send to reach Amal K P.
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-4 px-4 py-2 border border-white/20 bg-white/10 text-xs font-mono text-white hover:bg-white/20 transition-colors cursor-pointer"
                >
                  Send Another Message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
                <div className="space-y-1">
                  <label htmlFor="contact-name" className="text-white/60 uppercase">Your Full Name</label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full p-3 bg-black border border-white/10 rounded-sm text-white focus:outline-none focus:border-white/40"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="contact-email" className="text-white/60 uppercase">Email Address</label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. john@example.com"
                    className="w-full p-3 bg-black border border-white/10 rounded-sm text-white focus:outline-none focus:border-white/40"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="contact-message" className="text-white/60 uppercase">Message / Proposal</label>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Write your message here..."
                    className="w-full p-3 bg-black border border-white/10 rounded-sm text-white focus:outline-none focus:border-white/40 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Open Email</span>
                </button>
              </form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
