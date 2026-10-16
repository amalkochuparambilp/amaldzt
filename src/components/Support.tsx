import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, ArrowLeft, Mail, ChevronDown, Wrench, FileCode, HardDrive, Layout, Compass, ShieldAlert, Sparkles } from 'lucide-react';

interface SupportProps {
  onNavigate?: (tab: string) => void;
}

export default function Support({ onNavigate }: SupportProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is WebDev?',
      a: 'WebDev is a lightweight, browser-based website building and configuration tool powered by Devzoft. It allows you to preview design themes, assemble structured layouts, customize your site, and export your website files directly from your browser.'
    },
    {
      q: 'Is WebDev free?',
      a: 'Yes! Core features of WebDev are provided free of charge during the preview and release preparation phase. Future premium capabilities or cloud deployment tiers will have clearly disclosed pricing before any purchase.'
    },
    {
      q: 'Where are project settings saved?',
      a: 'Project settings and workspace configurations are saved locally in your browser using local storage. This ensures your progress persists between visits on the same device without requiring a server login.'
    },
    {
      q: 'How do I export my website?',
      a: 'You can export your configured project files instantly from the WebDev interface. The exported package contains standard HTML, CSS, and asset files ready for your web server or static hosting provider.'
    },
    {
      q: 'Does WebDev currently connect to an AI service?',
      a: 'The current WebDev release operates as a self-contained browser interface without a mandatory AI-service connection or cloud backend dependency.'
    },
    {
      q: 'How can I contact support?',
      a: 'You can reach out to our support team anytime by emailing connect@amalkp.online with details of your inquiry or feedback.'
    }
  ];

  return (
    <article className="py-12 md:py-20 px-4 sm:px-6 max-w-5xl mx-auto space-y-12 text-gray-200 font-sans">
      {/* Back Navigation */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6 no-print">
        <button
          onClick={() => onNavigate && onNavigate('home')}
          className="inline-flex items-center gap-2 text-xs font-mono text-white/60 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 uppercase tracking-widest">
          WebDev Help Center
        </span>
      </div>

      {/* Hero Section */}
      <div className="bg-[#111] border border-white/10 p-8 sm:p-12 rounded-sm text-center space-y-6 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="w-14 h-14 bg-white/10 border border-white/20 mx-auto flex items-center justify-center rounded-sm text-white">
          <HelpCircle className="w-7 h-7" />
        </div>

        <div className="space-y-2 max-w-2xl mx-auto relative z-10">
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] block">Devzoft Support Portal</span>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white uppercase font-display">
            How can we help?
          </h1>
          <p className="text-sm sm:text-base text-gray-300 font-light leading-relaxed">
            Find help with WebDev, the website-building tool powered by Devzoft. Explore guides, troubleshooting steps, or contact our support team.
          </p>
        </div>

        <div className="pt-2 relative z-10">
          <a
            href="mailto:connect@amalkp.online"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-black text-xs font-bold font-mono uppercase tracking-widest hover:bg-neutral-200 transition-colors rounded-xs shadow-lg"
          >
            <Mail className="w-4 h-4" />
            <span>Contact Support</span>
          </a>
        </div>
      </div>

      {/* Help Categories */}
      <div className="space-y-6">
        <div className="border-b border-white/10 pb-4">
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">Documentation & Guides</span>
          <h2 className="text-2xl font-bold tracking-tight text-white uppercase font-display mt-1">Help Categories</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-[#111] border border-white/10 p-6 rounded-sm space-y-3 hover:border-white/30 transition-colors">
            <div className="p-2.5 bg-white/5 w-fit border border-white/10 text-white">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white uppercase text-sm">1. Getting Started</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-light">
              Learn how to launch WebDev, explore the workspace interface, and initialize your first website project in seconds.
            </p>
          </div>

          <div className="bg-[#111] border border-white/10 p-6 rounded-sm space-y-3 hover:border-white/30 transition-colors">
            <div className="p-2.5 bg-white/5 w-fit border border-white/10 text-white">
              <Layout className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white uppercase text-sm">2. Templates & Themes</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-light">
              Choose professional layout templates, adjust design accents, and customize typography to match your brand identity.
            </p>
          </div>

          <div className="bg-[#111] border border-white/10 p-6 rounded-sm space-y-3 hover:border-white/30 transition-colors">
            <div className="p-2.5 bg-white/5 w-fit border border-white/10 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white uppercase text-sm">3. Previewing Designs</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-light">
              Use live multi-device preview modes to test your website layout across desktop, tablet, and mobile viewports.
            </p>
          </div>

          <div className="bg-[#111] border border-white/10 p-6 rounded-sm space-y-3 hover:border-white/30 transition-colors">
            <div className="p-2.5 bg-white/5 w-fit border border-white/10 text-white">
              <HardDrive className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white uppercase text-sm">4. Saving Project Settings</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-light">
              Understand how local storage preserves your project data safely in your browser between sessions.
            </p>
          </div>

          <div className="bg-[#111] border border-white/10 p-6 rounded-sm space-y-3 hover:border-white/30 transition-colors">
            <div className="p-2.5 bg-white/5 w-fit border border-white/10 text-white">
              <FileCode className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white uppercase text-sm">5. Exporting Website Files</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-light">
              Export clean static HTML/CSS files ready for immediate deployment on Vercel, Netlify, or custom web servers.
            </p>
          </div>

          <div className="bg-[#111] border border-white/10 p-6 rounded-sm space-y-3 hover:border-white/30 transition-colors">
            <div className="p-2.5 bg-white/5 w-fit border border-white/10 text-white">
              <Wrench className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white uppercase text-sm">6. Troubleshooting</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-light">
              Quick solutions for common browser rendering snags, storage clearing, and export package unpacking.
            </p>
          </div>
        </div>
      </div>

      {/* Troubleshooting Section */}
      <div className="bg-[#111] border border-white/10 p-6 sm:p-8 rounded-sm space-y-6">
        <div className="border-b border-white/10 pb-4">
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">Diagnostic Assistance</span>
          <h2 className="text-2xl font-bold tracking-tight text-white uppercase font-display mt-1">Troubleshooting Common Problems</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm font-light">
          <div className="bg-black/40 border border-white/10 p-5 space-y-2">
            <h3 className="font-bold text-white uppercase font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              Project preview not appearing correctly
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Ensure your browser allows local script execution and is not running overly aggressive tracking blockers that restrict local canvas or iframe previews. Try performing a hard refresh (Ctrl+F5 or Cmd+Shift+R).
            </p>
          </div>

          <div className="bg-black/40 border border-white/10 p-5 space-y-2">
            <h3 className="font-bold text-white uppercase font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              Project settings not persisting
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Local storage requires cookies/storage permissions to be enabled. If you are browsing in private/incognito mode or have automated cache-clearing extensions installed, saved drafts may clear on window close.
            </p>
          </div>

          <div className="bg-black/40 border border-white/10 p-5 space-y-2">
            <h3 className="font-bold text-white uppercase font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              Exported HTML file not opening as expected
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Unzip the exported archive completely before opening index.html in your browser. Opening files directly inside a compressed zip container can prevent relative CSS and image assets from loading properly.
            </p>
          </div>

          <div className="bg-black/40 border border-white/10 p-5 space-y-2">
            <h3 className="font-bold text-white uppercase font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              Browser compatibility issues
            </h3>
            <p className="text-gray-400 leading-relaxed">
              WebDev is optimized for modern Evergreen browsers (Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge). Ensure your browser is updated to the latest stable release for optimal Web APIs performance.
            </p>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="space-y-6">
        <div className="border-b border-white/10 pb-4">
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">Got Questions?</span>
          <h2 className="text-2xl font-bold tracking-tight text-white uppercase font-display mt-1">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-[#111] border border-white/10 rounded-sm overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-5 text-left flex justify-between items-center gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
              >
                <span className="font-bold text-white text-sm uppercase font-mono tracking-tight">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${openFaq === idx ? 'transform rotate-180 text-cyan-400' : ''}`} />
              </button>
              <AnimatePresence>
                {openFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-gray-300 font-light border-t border-white/5 leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support Box */}
      <div className="bg-[#0e0e0e] border border-white/15 p-8 sm:p-10 rounded-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 border border-white/20 text-white">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">Direct Support Channel</span>
            <h3 className="text-lg font-bold text-white uppercase">Still Need Assistance?</h3>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-gray-300 font-light leading-relaxed">
          When contacting our support team at <strong className="text-white font-mono">connect@amalkp.online</strong>, please include:
        </p>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-white/80">
          <li className="p-3 bg-black/60 border border-white/10 flex items-center gap-2">
            <span className="text-cyan-400">01.</span> A detailed description of your issue
          </li>
          <li className="p-3 bg-black/60 border border-white/10 flex items-center gap-2">
            <span className="text-cyan-400">02.</span> Step-by-step reproduction notes
          </li>
          <li className="p-3 bg-black/60 border border-white/10 flex items-center gap-2">
            <span className="text-cyan-400">03.</span> Browser & device information
          </li>
          <li className="p-3 bg-black/60 border border-white/10 flex items-center gap-2">
            <span className="text-cyan-400">04.</span> Screenshots if helpful
          </li>
        </ul>

        {/* Security warning */}
        <div className="p-3.5 bg-red-950/40 border border-red-500/40 text-red-200 text-xs font-mono rounded-xs">
          <strong>Security Notice:</strong> Never include passwords, private API keys, or sensitive personal data in support emails.
        </div>

        <div className="pt-2">
          <a
            href="mailto:connect@amalkp.online"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-black text-xs font-bold font-mono uppercase tracking-widest hover:bg-neutral-200 transition-colors rounded-xs shadow-md"
          >
            <Mail className="w-4 h-4" />
            <span>Email connect@amalkp.online</span>
          </a>
        </div>
      </div>

      {/* Footer Navigation Back */}
      <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono text-white/50">
        <button
          onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="hover:text-white transition-colors cursor-pointer"
        >
          ↑ Back to Top
        </button>
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate && onNavigate('privacy')} className="hover:text-white transition-colors cursor-pointer">Privacy Policy</button>
          <span>•</span>
          <button onClick={() => onNavigate && onNavigate('terms')} className="hover:text-white transition-colors cursor-pointer">Terms of Service</button>
        </div>
      </div>
    </article>
  );
}
