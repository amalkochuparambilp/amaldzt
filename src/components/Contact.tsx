import { useState, FormEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AMAL_INFO } from '../data';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Linkedin, 
  Github, 
  Send, 
  Check, 
  MessageSquare, 
  AlertCircle, 
  Loader2,
  SendHorizontal
} from 'lucide-react';

interface FormState {
  name: string;
  email: string;
  message: string;
  honeypot: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

export default function Contact() {
  const [formData, setFormData] = useState<FormState>({
    name: '',
    email: '',
    message: '',
    honeypot: ''
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Client-side validation
  const validate = (): boolean => {
    const errors: FormErrors = {};
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedMessage = formData.message.message ? formData.message.trim() : formData.message.trim();

    if (!trimmedName) {
      errors.name = 'Full name is required.';
    } else if (trimmedName.length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    } else if (trimmedName.length > 100) {
      errors.name = 'Name cannot exceed 100 characters.';
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    } else if (trimmedEmail.length > 100) {
      errors.email = 'Email cannot exceed 100 characters.';
    }

    if (!trimmedMessage) {
      errors.message = 'Message content is required.';
    } else if (trimmedMessage.length < 5) {
      errors.message = 'Message must be at least 5 characters.';
    } else if (trimmedMessage.length > 3000) {
      errors.message = 'Message cannot exceed 3,000 characters.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error on user edit
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (status === 'error') {
      setStatus('idle');
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Client-side validation check
    if (!validate()) {
      return;
    }

    setStatus('submitting');
    setErrorMessage(null);

    const name = formData.name.trim();
    const email = formData.email.trim();
    const message = formData.message.trim();
    const honeypot = formData.honeypot.trim();

    // Honeypot spam interceptor
    if (honeypot) {
      setStatus('success');
      setFormData({ name: '', email: '', message: '', honeypot: '' });
      return;
    }

    // Attempt transmission via backend /api/contact
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ name, email, message, _hp: honeypot })
      });

      const contentType = response.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          data = null;
        }
      }

      if (response.ok && data?.success) {
        setStatus('success');
        setFormData({ name: '', email: '', message: '', honeypot: '' });
        setFormErrors({});
        return;
      }

      setStatus('error');
      if (data?.error) {
        setErrorMessage(data.error);
      } else if (response.status === 404) {
        setErrorMessage('The contact server route was not found. Please contact directly via email.');
      } else if (response.status === 429) {
        setErrorMessage('Please wait a moment before sending another message.');
      } else if (response.status >= 500) {
        setErrorMessage('The message dispatch service is temporarily unavailable. Please email directly.');
      } else {
        setErrorMessage('Unable to deliver message at this time. Please use direct email below.');
      }
    } catch (networkErr: any) {
      console.error('Contact submission error:', networkErr);
      setStatus('error');
      setErrorMessage(
        'Network error: Failed to connect to the messaging server. Please check your internet connection or use direct email.'
      );
    }
  };

  const resetForm = () => {
    setStatus('idle');
    setErrorMessage(null);
    setFormErrors({});
    setFormData({ name: '', email: '', message: '', honeypot: '' });
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
          Reach out for collaborations, project inquiries, or software discussions. Direct telegram notification configured.
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

            {/* Bot Integration Badge */}
            <div className="p-3 bg-black/40 border border-white/10 flex items-center gap-3 text-[11px] font-mono text-white/60">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <span>Telegram Bot Transmission Active</span>
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
            <span className="text-[10px] font-mono text-white/40">TELEGRAM GATEWAY</span>
          </div>

          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-12 text-center space-y-4"
              >
                <div className="w-14 h-14 rounded-full bg-white/10 border border-white mx-auto flex items-center justify-center">
                  <Check className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-white uppercase tracking-tight">Message Sent Successfully!</h4>
                  <p className="text-xs text-white/60 max-w-sm mx-auto font-sans leading-relaxed">
                    Your transmission was delivered directly to Amal's Telegram. You will receive a response at your email address shortly.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={resetForm}
                    className="px-5 py-2.5 border border-white/20 bg-white/10 text-xs font-mono text-white hover:bg-white/20 transition-colors cursor-pointer rounded-xs"
                  >
                    Send Another Message
                  </button>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4 text-xs font-mono">
                {/* Honeypot Spam Protection Field - Hidden from humans */}
                <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
                  <label htmlFor="contact-form-hp">Do not fill this field</label>
                  <input
                    id="contact-form-hp"
                    type="text"
                    name="honeypot"
                    tabIndex={-1}
                    autoComplete="off"
                    value={formData.honeypot}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Error Banner */}
                {status === 'error' && errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 bg-red-950/50 border border-red-500/60 rounded-xs space-y-2 text-red-200"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 text-[11px] leading-relaxed">
                        <strong className="font-bold block uppercase tracking-wide text-red-300">Transmission Error</strong>
                        <span>{errorMessage}</span>
                      </div>
                    </div>
                    <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-red-500/20 text-[11px]">
                      <a
                        href={`mailto:${AMAL_INFO.email}?subject=${encodeURIComponent(
                          `Portfolio Inquiry from ${formData.name.trim() || 'Visitor'}`
                        )}&body=${encodeURIComponent(
                          `Name: ${formData.name.trim()}\nEmail: ${formData.email.trim()}\n\nMessage:\n${formData.message.trim()}`
                        )}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-400/40 rounded-xs font-mono text-white transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5 text-red-300" />
                        <span>Send directly via Email Client</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => { setStatus('idle'); setErrorMessage(null); }}
                        className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xs font-mono text-white/70 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Name field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="contact-name" className="text-white/70 uppercase tracking-wide">
                      Your Full Name <span className="text-red-400">*</span>
                    </label>
                    <span className="text-[10px] text-white/40">{formData.name.length}/100</span>
                  </div>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    required
                    maxLength={100}
                    disabled={status === 'submitting'}
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Alex Rivera"
                    className={`w-full p-3 bg-black border rounded-xs text-white focus:outline-none transition-colors ${
                      formErrors.name 
                        ? 'border-red-500/80 focus:border-red-400' 
                        : 'border-white/15 focus:border-white/50'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-[10px] text-red-400 font-sans">{formErrors.name}</p>
                  )}
                </div>

                {/* Email field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="contact-email" className="text-white/70 uppercase tracking-wide">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <span className="text-[10px] text-white/40">{formData.email.length}/100</span>
                  </div>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    maxLength={100}
                    disabled={status === 'submitting'}
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g. alex@example.com"
                    className={`w-full p-3 bg-black border rounded-xs text-white focus:outline-none transition-colors ${
                      formErrors.email 
                        ? 'border-red-500/80 focus:border-red-400' 
                        : 'border-white/15 focus:border-white/50'
                    }`}
                  />
                  {formErrors.email && (
                    <p className="text-[10px] text-red-400 font-sans">{formErrors.email}</p>
                  )}
                </div>

                {/* Message field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="contact-message" className="text-white/70 uppercase tracking-wide">
                      Message / Proposal <span className="text-red-400">*</span>
                    </label>
                    <span className={`text-[10px] ${formData.message.length > 2900 ? 'text-amber-400' : 'text-white/40'}`}>
                      {formData.message.length}/3000
                    </span>
                  </div>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={5}
                    maxLength={3000}
                    disabled={status === 'submitting'}
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Write your project proposal, inquiry, or discussion note here..."
                    className={`w-full p-3 bg-black border rounded-xs text-white focus:outline-none transition-colors resize-none ${
                      formErrors.message 
                        ? 'border-red-500/80 focus:border-red-400' 
                        : 'border-white/15 focus:border-white/50'
                    }`}
                  />
                  {formErrors.message && (
                    <p className="text-[10px] text-red-400 font-sans">{formErrors.message}</p>
                  )}
                </div>

                {/* Submit button */}
                <button
                  id="btn-contact-submit"
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full min-h-[44px] py-3.5 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed rounded-xs shadow-md mt-2"
                >
                  {status === 'submitting' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Transmitting to Telegram...</span>
                    </>
                  ) : (
                    <>
                      <SendHorizontal className="w-4 h-4" />
                      <span>Transmit Message</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

