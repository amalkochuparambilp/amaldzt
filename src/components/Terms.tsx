import { FileText, ArrowLeft, Mail, ExternalLink, AlertTriangle } from 'lucide-react';

interface TermsProps {
  onNavigate?: (tab: string) => void;
}

export default function Terms({ onNavigate }: TermsProps) {
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
        <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2.5 py-1 uppercase tracking-widest">
          Devzoft Legal &bull; Review Required
        </span>
      </div>

      {/* Header */}
      <div className="space-y-4 border-b border-white/10 pb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/5 border border-white/10">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] block">Product: WebDev by Devzoft</span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white uppercase font-display mt-0.5">
              Terms of Service
            </h1>
          </div>
        </div>
        <p className="text-xs font-mono text-white/50">
          Last updated: October 16, 2026 • Website: <a href="https://amalkp.online" target="_blank" rel="noreferrer" className="text-white hover:underline inline-flex items-center gap-1">https://amalkp.online <ExternalLink className="w-3 h-3" /></a>
        </p>

        {/* Publisher Review Notice */}
        <div className="p-4 bg-amber-950/40 border border-amber-500/50 rounded-xs flex items-start gap-3 text-amber-200 text-xs font-mono">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block uppercase tracking-wide text-amber-300">Publisher Review Notice</strong>
            <span>These terms are prepared for preparation and public release of WebDev by Devzoft. Final legal commitments, jurisdiction clauses, and refund policies require formal publisher review prior to binding commercial operation.</span>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <nav className="bg-[#111] border border-white/10 p-6 rounded-sm space-y-3 font-mono text-xs">
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 block">Table of Contents</span>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-white/80">
          <li><a href="#acceptance" className="hover:text-amber-400 transition-colors">1. Acceptance of Terms</a></li>
          <li><a href="#about-webdev" className="hover:text-amber-400 transition-colors">2. About WebDev</a></li>
          <li><a href="#eligibility" className="hover:text-amber-400 transition-colors">3. Eligibility</a></li>
          <li><a href="#pricing" className="hover:text-amber-400 transition-colors">4. Pricing & Future Plans</a></li>
          <li><a href="#acceptable-use" className="hover:text-amber-400 transition-colors">5. Acceptable Use</a></li>
          <li><a href="#user-content" className="hover:text-amber-400 transition-colors">6. User Content & Projects</a></li>
          <li><a href="#exports" className="hover:text-amber-400 transition-colors">7. Generated Code & Exports</a></li>
          <li><a href="#ip" className="hover:text-amber-400 transition-colors">8. Intellectual Property</a></li>
          <li><a href="#availability" className="hover:text-amber-400 transition-colors">9. Availability & Changes</a></li>
          <li><a href="#third-party" className="hover:text-amber-400 transition-colors">10. Third-Party Services</a></li>
          <li><a href="#liability" className="hover:text-amber-400 transition-colors">11. Limitation of Liability</a></li>
          <li><a href="#contact" className="hover:text-amber-400 transition-colors">12. Contact & Support</a></li>
        </ul>
      </nav>

      {/* Content Sections */}
      <div className="space-y-8 text-sm sm:text-base leading-relaxed text-gray-300 font-light">
        <section id="acceptance" className="space-y-3 pt-4 border-t border-white/10">
          <h2 className="text-lg font-bold text-white uppercase font-mono tracking-tight flex items-center gap-2">
            <span className="text-amber-400">01.</span> Acceptance of Terms
          </h2>
          <p>
            By accessing or using WebDev (hosted at <a href="https://amalkp.online" target="_blank" rel="noreferrer" className="text-white underline">https://amalkp.online</a> and developed under the Devzoft brand), you agree to be bound by these Terms of Service. If you do not agree to these terms, please discontinue use of the platform immediately.
          </p>
        </section>

        <section id="about-webdev" className="space-y-3 pt-4 border-t border-white/10">
          <h2 className="text-lg font-bold text-white uppercase font-mono tracking-tight flex items-center gap-2">
            <span className="text-amber-400">02.</span> About WebDev
          </h2>
          <p>
            WebDev is a developer tool and website configuration utility intended to help users assemble website layouts, preview design themes, customize user interfaces, and export supported website files.
          </p>
          <p>
            Current features are provided as-is in prototype release. Planned features (such as advanced cloud deployment pipelines, multi-user real-time synchronization, and AI assistant connectors) are under active development and will be designated as available upon official release.
          </p>
        </section>

        <section id="eligibility" className="space-y-3 pt-4 border-t border-white/10">
          <h2 className="text-lg font-bold text-white uppercase font-mono tracking-tight flex items-center gap-2">
            <span className="text-amber-400">03.</span> Eligibility
          </h2>
          <p>
            You must be capable of forming a binding contract with Devzoft to use WebDev. Users under the age of 18 should use the platform under the supervision of a parent or legal guardian.
          </p>
        </section>

        <section id="pricing" className="space-y-3 pt-4 border-t border-white/10">
          <h2 className="text-lg font-bold text-white uppercase font-mono tracking-tight flex items-center gap-2">
            <span className="text-amber-400">04.</span> Pricing & Future Plans
          </h2>
          <p>
            WebDev core features are initially provided free of charge during the preview and release preparation phase. Future versions may introduce premium tiers or paid enterprise capabilities. Any future paid features will have clearly disclosed pricing, subscription terms, cancellation policies, and refund guidelines published before any payment transaction occurs. Automated payment processing is not currently active on this prototype.
          </p>
        </section>

        <section id="acceptable-use" className="space-y-3 pt-4 border-t border-white/10">
          <h2 className="text-lg font-bold text-white uppercase font-mono tracking-tight flex items-center gap-2">
            <span className="text-amber-400">05.</span> Acceptable Use
          </h2>
          <p>Users agree not to use WebDev to:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-gray-300 text-xs sm:text-sm font-mono">
            <li>Violate any applicable local, national, or international laws or regulations.</li>
            <li>Infringe upon intellectual property, copyright, or trademark rights of others.</li>
            <li>Distribute malware, malicious code, harmful scripts, or phishing payloads.</li>
            <li>Attempt unauthorized access to underlying server infrastructure, admin routes, or user accounts.</li>
            <li>Misrepresent ownership or forge attribution of generated website projects.</li>
            <li>Abuse, overload, or disrupt the availability or performance of WebDev services.</li>
          </ul>
        </section>

        <section id="user-content" className="space-y-3 pt-4 border-t border-white/10">
          <h2 className="text-lg font-bold text-white uppercase font-mono tracking-tight flex items-center gap-2">
            <span className="text-amber-400">06.</span> User Content and Projects
          </h2>
          <p>
            You retain full responsibility for all content, text, media, graphics, and code that you input or generate within your WebDev projects. You represent and warrant that you own or have obtained all necessary licenses to use such materials. Devzoft does not claim ownership over user-created project code.
          </p>
        </section>

        <section id="exports" className="space-y-3 pt-4 border-t border-white/10">
          <h2 className="text-lg font-bold text-white uppercase font-mono tracking-tight flex items-center gap-2">
            <span className="text-amber-400">07.</span> Generated Code and Exports
          </h2>
          <p>
            Website files and code exported from WebDev should be thoroughly reviewed, tested, and validated by the user before production deployment or commercial use. Devzoft does not guarantee that every generated file or component will be entirely error-free, universally accessible, or suitable for every specific production environment.
          </p>
        </section>

        <section id="ip" className="space-y-3 pt-4 border-t border-white/10">
          <h2 className="text-lg font-bold text-white uppercase font-mono tracking-tight flex items-center gap-2">
            <span className="text-amber-400">08.</span> Intellectual Property
          </h2>
          <p>
            The WebDev platform interface, Devzoft branding, source code, logos, and proprietary layout systems remain the exclusive property of Amal K P / Devzoft. Third-party libraries and icons used within the application are governed by their respective open-source licenses.
          </p>
        </section>

        <section id="availability" className="space-y-3 pt-4 border-t border-white/10">
          <h2 className="text-lg font-bold text-white uppercase font-mono tracking-tight flex items-center gap-2">
            <span className="text-amber-400">09.</span> Availability and Changes
          </h2>
          <p>
            We reserve the right to modify, suspend, or discontinue WebDev (or any part thereof) at any time with or without prior notice as the software evolves toward public release.
          </p>
        </section>

        <section id="third-party" className="space-y-3 pt-4 border-t border-white/10">
          <h2 className="text-lg font-bold text-white uppercase font-mono tracking-tight flex items-center gap-2">
            <span className="text-amber-400">10.</span> Third-Party Services
          </h2>
          <p>
            WebDev may interact with or link to third-party services and hosting providers. Devzoft is not responsible for the content, uptime, or privacy practices of external third-party platforms.
          </p>
        </section>

        <section id="liability" className="space-y-3 pt-4 border-t border-white/10">
          <h2 className="text-lg font-bold text-white uppercase font-mono tracking-tight flex items-center gap-2">
            <span className="text-amber-400">11.</span> Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by applicable law, WebDev and Devzoft shall not be held liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the platform or exported code files.
          </p>
        </section>

        <section id="contact" className="space-y-4 pt-4 border-t border-white/10 bg-[#0e0e0e] p-6 border-white/15">
          <h2 className="text-lg font-bold text-white uppercase font-mono tracking-tight flex items-center gap-2">
            <span className="text-amber-400">12.</span> Contact & Support
          </h2>
          <p className="text-xs sm:text-sm">
            For any inquiries regarding these Terms of Service or Devzoft policies, please contact:
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
          <button onClick={() => onNavigate && onNavigate('privacy')} className="hover:text-white transition-colors cursor-pointer">Privacy Policy</button>
          <span>•</span>
          <button onClick={() => onNavigate && onNavigate('support')} className="hover:text-white transition-colors cursor-pointer">Support</button>
        </div>
      </div>
    </article>
  );
}
