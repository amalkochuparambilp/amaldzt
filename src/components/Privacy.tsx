import { Shield, ArrowLeft, Mail, ExternalLink } from 'lucide-react';

interface PrivacyProps {
  onNavigate?: (tab: string) => void;
}

export default function Privacy({ onNavigate }: PrivacyProps) {
  return (
    <article className="py-12 md:py-20 px-4 sm:px-6 max-w-4xl mx-auto space-y-10 text-gray-200 font-sans">
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
          Devzoft Legal
        </span>
      </div>

      {/* Header */}
      <div className="space-y-4 border-b border-white/10 pb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/5 border border-white/10">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] block">Product: WebDev by Devzoft</span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white uppercase font-display mt-0.5">
              Privacy Policy
            </h1>
          </div>
        </div>
        <p className="text-xs font-mono text-white/50">
          Last updated: October 16, 2026 • Website: <a href="https://amalkp.online" target="_blank" rel="noreferrer" className="text-white hover:underline inline-flex items-center gap-1">https://amalkp.online <ExternalLink className="w-3 h-3" /></a>
        </p>
      </div>

      {/* Table of Contents */}
      <nav className="bg-[#111] border border-white/10 p-6 rounded-sm space-y-3 font-mono text-xs">
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 block">Table of Contents</span>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-white/80">
          <li><a href="#introduction" className="hover:text-cyan-400 transition-colors">1. Introduction</a></li>
          <li><a href="#architecture" className="hover:text-cyan-400 transition-colors">2. Current Product Architecture</a></li>
          <li><a href="#local-storage" className="hover:text-cyan-400 transition-colors">3. Information Stored Locally</a></li>
          <li><a href="#servers" className="hover:text-cyan-400 transition-colors">4. Information Sent to Servers</a></li>
          <li><a href="#third-party" className="hover:text-cyan-400 transition-colors">5. Third-Party Services</a></li>
          <li><a href="#data-sharing" className="hover:text-cyan-400 transition-colors">6. Data Sharing</a></li>
          <li><a href="#retention" className="hover:text-cyan-400 transition-colors">7. Data Retention & Deletion</a></li>
          <li><a href="#security" className="hover:text-cyan-400 transition-colors">8. Security & Sensitivity</a></li>
          <li><a href="#children" className="hover:text-cyan-400 transition-colors">9. Children's Privacy</a></li>
          <li><a href="#changes" className="hover:text-cyan-400 transition-colors">10. Policy Changes</a></li>
          <li><a href="#contact" className="hover:text-cyan-400 transition-colors">11. Contact & Support</a></li>
        </ul>
      </nav>

      {/* Content Sections */}
      <div className="space-y-8 text-sm sm:text-base leading-relaxed text-gray-300 font-light">
        <section id="introduction" className="space-y-3 pt-4 border-t border-white/10">
          <h2 className="text-lg font-bold text-white uppercase font-mono tracking-tight flex items-center gap-2">
            <span className="text-cyan-400">01.</span> Introduction
          </h2>
          <p>
            Welcome to WebDev, a website-building and configuration tool developed under the Devzoft brand by individual developer Amal K P (accessible via <a href="https://amalkp.online" target="_blank" rel="noreferrer" className="text-white underline">https://amalkp.online</a>). This Privacy Policy describes how information is handled when users access, preview, configure, or utilize WebDev tools and interfaces.
          </p>
        </section>

        <section id="architecture" className="space-y-3 pt-4 border-t border-white/10">
          <h2 className="text-lg font-bold text-white uppercase font-mono tracking-tight flex items-center gap-2">
            <span className="text-cyan-400">02.</span> Current Product Architecture
          </h2>
          <p>
            The current WebDev release operates primarily as a self-contained, browser-based user interface. It is designed to assist users in configuring website projects, previewing themes, assembling page layouts, and exporting supported static website files directly within their browser session.
          </p>
          <p>
            In its current prototype configuration, WebDev operates without an active WebDev-operated backend database for personal user data or AI-service connections. Please note that future iterations of WebDev may introduce expanded cloud sync, authentication, or AI-assisted generation features, which will be governed by updated privacy disclosures at that time.
          </p>
        </section>

        <section id="local-storage" className="space-y-3 pt-4 border-t border-white/10">
          <h2 className="text-lg font-bold text-white uppercase font-mono tracking-tight flex items-center gap-2">
            <span className="text-cyan-400">03.</span> Information Stored Locally
          </h2>
          <p>
            To provide a seamless workflow, WebDev may utilize your browser's local storage mechanism to save user project settings, drafts, and configuration preferences between sessions.
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-gray-300 text-xs sm:text-sm font-mono">
            <li>Local storage preserves your active workspace state across browser visits on the same device.</li>
            <li>You maintain full control and can clear locally stored site data at any time through your browser settings.</li>
            <li>Clearing your browser site data will remove all locally saved project drafts and configurations.</li>
            <li>Local storage is managed entirely client-side and is not intended or designed as a secure vault for passwords, private API keys, or sensitive personal data.</li>
          </ul>
        </section>

        <section id="servers" className="space-y-3 pt-4 border-t border-white/10">
          <h2 className="text-lg font-bold text-white uppercase font-mono tracking-tight flex items-center gap-2">
            <span className="text-cyan-400">04.</span> Information Sent to Servers
          </h2>
          <p>
            When you visit <a href="https://amalkp.online" target="_blank" rel="noreferrer" className="text-white underline">https://amalkp.online</a>, standard web hosting infrastructure (such as Vercel) automatically receives standard connection metadata required for internet communication, including your IP address, browser type, operating system, and request timestamps. This ordinary diagnostic information is processed by our hosting providers in accordance with their respective server logs and infrastructure security policies.
          </p>
        </section>

        <section id="third-party" className="space-y-3 pt-4 border-t border-white/10">
          <h2 className="text-lg font-bold text-white uppercase font-mono tracking-tight flex items-center gap-2">
            <span className="text-cyan-400">05.</span> Third-Party Services
          </h2>
          <p>
            WebDev relies on underlying hosting infrastructure, content delivery networks, and browser APIs. These third-party services maintain their own terms of service and privacy practices. If future analytics, external AI APIs, or cloud storage integrations are added to WebDev, this policy will be updated to accurately detail their data handling procedures.
          </p>
        </section>

        <section id="data-sharing" className="space-y-3 pt-4 border-t border-white/10">
          <h2 className="text-lg font-bold text-white uppercase font-mono tracking-tight flex items-center gap-2">
            <span className="text-cyan-400">06.</span> Data Sharing
          </h2>
          <p>
            We do not sell, trade, or rent personal user data to third parties. Data processed within the current client-side prototype remains on your device or flows through standard secure hosting delivery channels necessary to serve the web application.
          </p>
        </section>

        <section id="retention" className="space-y-3 pt-4 border-t border-white/10">
          <h2 className="text-lg font-bold text-white uppercase font-mono tracking-tight flex items-center gap-2">
            <span className="text-cyan-400">07.</span> Data Retention and Deletion
          </h2>
          <p>
            Because project configurations are saved locally in your browser, retention is controlled entirely by your browser's storage cache. You can delete all locally saved project data instantly by clearing your browser cache and local storage for amalkp.online. We do not maintain server-side databases containing your private website project code.
          </p>
        </section>

        <section id="security" className="space-y-3 pt-4 border-t border-white/10">
          <h2 className="text-lg font-bold text-white uppercase font-mono tracking-tight flex items-center gap-2">
            <span className="text-cyan-400">08.</span> Security
          </h2>
          <p>
            While standard transport layer security (HTTPS) is enforced on <a href="https://amalkp.online" target="_blank" rel="noreferrer" className="text-white underline">https://amalkp.online</a>, users are advised not to store sensitive personal information, banking details, passwords, or production API keys in browser local storage or exported project files.
          </p>
        </section>

        <section id="children" className="space-y-3 pt-4 border-t border-white/10">
          <h2 className="text-lg font-bold text-white uppercase font-mono tracking-tight flex items-center gap-2">
            <span className="text-cyan-400">09.</span> Children's Privacy
          </h2>
          <p>
            WebDev is a general-purpose web development and educational tool. We do not knowingly collect personal information from children under the age of 13. If you believe a minor has provided information through our support channels, please contact us immediately for removal.
          </p>
        </section>

        <section id="changes" className="space-y-3 pt-4 border-t border-white/10">
          <h2 className="text-lg font-bold text-white uppercase font-mono tracking-tight flex items-center gap-2">
            <span className="text-cyan-400">10.</span> Changes to This Policy
          </h2>
          <p>
            This Privacy Policy may be updated periodically to reflect product evolution, new features, or regulatory updates. The revised date at the top of this page indicates when the latest modifications took effect.
          </p>
        </section>

        <section id="contact" className="space-y-4 pt-4 border-t border-white/10 bg-[#0e0e0e] p-6 border-white/15">
          <h2 className="text-lg font-bold text-white uppercase font-mono tracking-tight flex items-center gap-2">
            <span className="text-cyan-400">11.</span> Contact & Support
          </h2>
          <p className="text-xs sm:text-sm">
            If you have any questions, feedback, or privacy concerns regarding WebDev or Devzoft operations, please reach out via our official support channel:
          </p>
          <div className="pt-2">
            <a
              href="mailto:connect@amalkp.online"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white text-black text-xs font-bold font-mono uppercase tracking-widest hover:bg-neutral-200 transition-colors rounded-xs"
            >
              <Mail className="w-4 h-4" />
              <span>connect@amalkp.online</span>
            </a>
          </div>
        </section>
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
          <button onClick={() => onNavigate && onNavigate('terms')} className="hover:text-white transition-colors cursor-pointer">Terms of Service</button>
          <span>•</span>
          <button onClick={() => onNavigate && onNavigate('support')} className="hover:text-white transition-colors cursor-pointer">Support</button>
        </div>
      </div>
    </article>
  );
}
