import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Send, Github, Linkedin, MapPin, Check, Loader2, MessageSquare } from 'lucide-react';
import { AMAL_INFO } from '../data';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const validateEmail = (email: string) => {
    return email.includes('@') && email.includes('.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setStatus('error');
      setErrorMessage('Please provide your name.');
      return;
    }
    if (!formData.email.trim() || !validateEmail(formData.email)) {
      setStatus('error');
      setErrorMessage('Please provide a valid email address.');
      return;
    }
    if (!formData.message.trim()) {
      setStatus('error');
      setErrorMessage('Message cannot be empty.');
      return;
    }

    setStatus('sending');
    setErrorMessage('');

    // Simulate sending message
    setTimeout(() => {
      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
    }, 1500);
  };

  return (
    <section id="contact" className="py-20 px-4 max-w-6xl mx-auto space-y-12">
      <div className="space-y-4 text-center sm:text-left">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight flex items-center justify-center sm:justify-start gap-3">
          <span className="w-8 h-[1px] bg-neon-cyan hidden sm:block"></span>
          Connect With Me
        </h2>
        <p className="text-gray-400 font-light max-w-xl font-sans">
          Have an exciting project, research, or query? Fill out the contact terminal or reach out directly via standard relays.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 5 Columns: Direct Relays & Location Cards */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-cyber-card border border-white/10 rounded-sm p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-display font-semibold text-white">Direct Channels</h3>
            
            <div className="space-y-4">
              {/* Mail card */}
              <a 
                href={`mailto:${AMAL_INFO.email}`}
                className="flex items-center gap-4 p-4 rounded-sm bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/[0.04] transition-all group"
              >
                <div className="p-3 rounded-sm bg-black border border-white/10 group-hover:border-white/30">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-mono text-gray-500 uppercase">Primary Email</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{AMAL_INFO.email}</p>
                </div>
              </a>

              {/* Location card */}
              <div className="flex items-center gap-4 p-4 rounded-sm bg-white/5 border border-white/10">
                <div className="p-3 rounded-sm bg-black border border-white/10">
                  <MapPin className="w-5 h-5 text-white/70" />
                </div>
                <div>
                  <p className="text-xs font-mono text-gray-500 uppercase">Location</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{AMAL_INFO.location}, Kerala, India</p>
                </div>
              </div>
            </div>

            {/* Social handles */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-mono text-gray-500 uppercase tracking-wider">Social Relays</h4>
              <div className="flex gap-2">
                <a 
                  href={AMAL_INFO.github} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="p-3 rounded-sm border border-white/10 bg-white/5 hover:border-white/40 hover:text-white transition-all text-gray-400 cursor-pointer"
                >
                  <Github className="w-4 h-4" />
                </a>
                <a 
                  href={AMAL_INFO.linkedin} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="p-3 rounded-sm border border-white/10 bg-white/5 hover:border-white/40 hover:text-white transition-all text-gray-400 cursor-pointer"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* DZt Core OS terminal status block */}
          <div className="bg-cyber-card/30 border border-white/10 rounded-sm p-6 flex items-center justify-between font-mono text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>DZt_OS://mail_relay_active</span>
            </div>
            <span>v1.4.2</span>
          </div>
        </div>

        {/* Right 7 Columns: Form Container */}
        <div className="lg:col-span-7 bg-cyber-card border border-white/10 rounded-sm p-6 sm:p-8 relative">
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-12 text-center space-y-4"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 border border-white mx-auto flex items-center justify-center">
                  <Check className="w-6 h-6 text-white animate-[bounce_1s_infinite]" />
                </div>
                <h3 className="text-xl font-display font-semibold text-white">Message Transmitted</h3>
                <p className="text-gray-400 text-xs sm:text-sm font-light max-w-sm mx-auto font-sans leading-relaxed">
                  Your message has been processed and securely synchronized. I will review it and reply as soon as possible. Thank you!
                </p>
                <button
                  id="btn-send-another"
                  onClick={() => setStatus('idle')}
                  className="mt-4 px-4 py-2 rounded-sm bg-white/10 border border-white/20 text-xs font-mono text-white hover:bg-white/20 transition-colors cursor-pointer"
                >
                  Send Another Message
                </button>
              </motion.div>
            ) : (
              <motion.form 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="space-y-1 border-b border-white/10 pb-4 flex items-center gap-2 text-xs font-mono text-gray-500">
                  <MessageSquare className="w-4 h-4 text-white/50" />
                  <span>TRANSMIT_SECURE_PAYLOAD</span>
                </div>

                {errorMessage && (
                  <div className="p-3.5 bg-red-500/5 border border-red-500/20 text-red-400 text-xs font-mono rounded-sm">
                    [ERROR]: {errorMessage}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <label htmlFor="input-name" className="block text-xs font-mono text-gray-500 uppercase tracking-wider">Your Name</label>
                    <input
                      id="input-name"
                      type="text"
                      disabled={status === 'sending'}
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter full name"
                      className="w-full px-4 py-3 bg-black border border-white/10 rounded-sm text-sm text-white focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 disabled:opacity-50 transition-all font-sans"
                    />
                  </div>

                  {/* Email field */}
                  <div className="space-y-1.5">
                    <label htmlFor="input-email" className="block text-xs font-mono text-gray-500 uppercase tracking-wider">Email Address</label>
                    <input
                      id="input-email"
                      type="email"
                      disabled={status === 'sending'}
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="name@domain.com"
                      className="w-full px-4 py-3 bg-black border border-white/10 rounded-sm text-sm text-white focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 disabled:opacity-50 transition-all font-sans"
                    />
                  </div>

                  {/* Message field */}
                  <div className="space-y-1.5">
                    <label htmlFor="input-message" className="block text-xs font-mono text-gray-500 uppercase tracking-wider">Your Message</label>
                    <textarea
                      id="input-message"
                      rows={5}
                      disabled={status === 'sending'}
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="State your project, proposal, or general query..."
                      className="w-full px-4 py-3 bg-black border border-white/10 rounded-sm text-sm text-white focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 disabled:opacity-50 transition-all font-sans resize-none"
                    />
                  </div>
                </div>

                <button
                  id="btn-submit-contact"
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full px-5 py-3.5 rounded-sm bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-500 disabled:opacity-50 font-mono text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
                >
                  {status === 'sending' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      Relaying Message Package...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Transmit Payload
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
