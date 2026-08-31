import { useState, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Video, 
  QrCode, 
  HeartPulse, 
  GraduationCap, 
  Network, 
  ArrowLeft, 
  ExternalLink, 
  Copy, 
  Check, 
  Play, 
  Sparkles, 
  Search, 
  Terminal, 
  RefreshCw, 
  ShieldCheck, 
  Activity,
  Layers,
  Cpu,
  Share2,
  HardDriveDownload,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import VideoCallRoom from './vc/VideoCallRoom';
import FileShareRoom from './p2p/FileShareRoom';

interface MiniAppsProps {
  initialAppId?: string;
  initialRoomId?: string;
  onExitToHome?: () => void;
}

type MiniAppCategory = 'all' | 'communication' | 'dev' | 'health' | 'education';

interface MiniAppItem {
  id: string;
  title: string;
  tagline: string;
  category: 'communication' | 'dev' | 'health' | 'education';
  categoryLabel: string;
  badge: string;
  badgeColor: string;
  icon: typeof Video;
  description: string;
  features: string[];
  techStack: string[];
  directUrl: string;
}

export default function MiniApps({ initialAppId, initialRoomId, onExitToHome }: MiniAppsProps) {
  const [activeApp, setActiveApp] = useState<string | null>(initialAppId || null);
  const [selectedCategory, setSelectedCategory] = useState<MiniAppCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedAppUrl, setCopiedAppUrl] = useState<string | null>(null);
  const [copiedHubUrl, setCopiedHubUrl] = useState(false);

  // Sync initialAppId prop
  useEffect(() => {
    if (initialAppId) {
      setActiveApp(initialAppId);
    }
  }, [initialAppId]);

  // Update browser URL query parameter when app changes
  useEffect(() => {
    if (activeApp) {
      const url = `/apps?app=${encodeURIComponent(activeApp)}${initialRoomId ? `&room=${encodeURIComponent(initialRoomId)}` : ''}`;
      window.history.replaceState(null, '', url);
    } else {
      window.history.replaceState(null, '', '/apps');
    }
  }, [activeApp, initialRoomId]);

  const handleCopyHubUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const fullUrl = `${origin}/apps`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedHubUrl(true);
      setTimeout(() => setCopiedHubUrl(false), 2000);
    });
  };

  const handleCopyAppUrl = (appId: string, directPath: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const fullUrl = `${origin}${directPath}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedAppUrl(appId);
      setTimeout(() => setCopiedAppUrl(null), 2000);
    });
  };

  const miniAppsList: MiniAppItem[] = [
    {
      id: 'drop',
      title: 'DZt Drop (File Transfer)',
      tagline: 'Encrypted Browser-to-Browser File & Clipboard Beam',
      category: 'communication',
      categoryLabel: 'Communication',
      badge: 'DataChannel • Live',
      badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      icon: Share2,
      description: 'Direct browser-to-browser P2P file sharing with zero file size limits, end-to-end DTLS encryption, instant QR phone pairing, and realtime speed gauges.',
      features: ['WebRTC DataChannel Mesh', 'Zero Cloud File Storage', 'Live Speed & ETA Monitor', 'QR Code Phone Connect'],
      techStack: ['WebRTC DataChannel', 'DTLS/SCTP', 'Binary Chunks', 'Web Audio API'],
      directUrl: '/apps?app=drop'
    },
    {
      id: 'meet',
      title: 'DZt Meet (Video Call)',
      tagline: 'Encrypted Multi-Peer Video & Audio Transmission Hub',
      category: 'communication',
      categoryLabel: 'Communication',
      badge: 'WebRTC Mesh • Live',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      icon: Video,
      description: 'Zero-latency direct peer-to-peer audio/video calling suite with instant room creation, screen broadcasting, in-call chat, reaction animations, and shareable meeting invite links.',
      features: ['WebRTC Mesh Architecture', 'HD Screen Sharing', 'Live In-Call Chat & Reactions', 'Hardware Device Selector'],
      techStack: ['WebRTC', 'WebSocket', 'MQTT Signaling', 'STUN/ICE'],
      directUrl: '/apps?app=meet'
    },
    {
      id: 'libcode',
      title: 'LibCode Barcode & Label Studio',
      tagline: 'Automated Code-128 & QR Accession Tag Generator',
      category: 'dev',
      categoryLabel: 'Developer Tools',
      badge: 'Library Core • Interactive',
      badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      icon: QrCode,
      description: 'Utility for library inventory tracking inspired by JNIAS LibCode. Generates barcode tags, QR accession codes, and customizable book metadata printable labels.',
      features: ['Dynamic SVG Barcode Engine', 'QR Code Generator', 'Custom Prefix & Accession Range', 'Printable Tag Sheet'],
      techStack: ['TypeScript', 'SVG Generator', 'Canvas API', 'DOM Rasterizer'],
      directUrl: '/apps?app=libcode'
    },
    {
      id: 'hrdiya',
      title: 'Hrdiya Heart Risk Diagnostic',
      tagline: 'Framingham Cardiovascular Risk & Biometric Calculator',
      category: 'health',
      categoryLabel: 'Healthcare AI',
      badge: 'Clinical ML • Calculator',
      badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      icon: HeartPulse,
      description: 'Interactive cardiovascular health estimation tool inspired by the Hrdiya Cardiac Analysis project. Evaluates 10-year cardiac risk percentages based on blood pressure, lipid profile, and lifestyle markers.',
      features: ['Framingham 10-Year Score', 'Blood Pressure Classification', 'Lifestyle Guidance Engine', 'Interactive Risk Gauge'],
      techStack: ['Algorithmic Health Risk Model', 'React State', 'SVG Gauge'],
      directUrl: '/apps?app=hrdiya'
    },
    {
      id: 'bankexam',
      title: 'Bank Exam Speed-Trainer',
      tagline: 'Timed Mock Practice & Aptitude Quiz Engine',
      category: 'education',
      categoryLabel: 'Academic & Testing',
      badge: 'Co-op Bank • Practice',
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      icon: GraduationCap,
      description: 'Practice engine modeled after the Co-operative Bank Online Examination Portal. Features timed multiple-choice banking awareness questions, instant score calculation, and review analysis.',
      features: ['Timed Speed Drills', 'Banking Law & Aptitude Questions', 'Real-Time Score Breakdown', 'Detailed Solution Explanations'],
      techStack: ['Question Bank DB', 'Timer Hook', 'Quiz State Machine'],
      directUrl: '/apps?app=bankexam'
    },
    {
      id: 'subnet',
      title: 'DZt CIDR & Subnet Calculator',
      tagline: 'IP Network Topology & Host Range Inspector',
      category: 'dev',
      categoryLabel: 'Developer Tools',
      badge: 'Networking • Ops',
      badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      icon: Network,
      description: 'Network engineering utility to calculate CIDR prefixes, usable IP host ranges, broadcast addresses, wildcard masks, and binary network visualizations.',
      features: ['CIDR /0 to /32 Support', 'Usable Host Range Compute', 'Binary Bitmask View', 'Classful IP Breakdown'],
      techStack: ['Bitwise Arithmetic', 'CIDR Engine', 'IP Parser'],
      directUrl: '/apps?app=subnet'
    }
  ];

  const filteredApps = miniAppsList.filter((app) => {
    const matchesCat = selectedCategory === 'all' || app.category === selectedCategory;
    const matchesSearch = 
      app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.features.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* If an App is Active -> Show App Full View */}
      {activeApp ? (
        <div className="space-y-6">
          {/* Top Return & App Breadcrumb Bar */}
          <div className="bg-[#0e0e0e] border border-white/15 p-4 rounded-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveApp(null)}
                className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-mono rounded-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All MiniApps</span>
              </button>
              <div className="h-4 w-[1px] bg-white/20 hidden sm:block" />
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-white/40">DZt MiniApp:</span>
                <span className="text-white font-bold">
                  {miniAppsList.find(a => a.id === activeApp)?.title || activeApp.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-[11px] font-mono text-cyan-300 bg-black/60 border border-white/10 px-3 py-1.5 rounded-xs select-all hidden md:block">
                {typeof window !== 'undefined' ? `${window.location.origin}/apps?app=${activeApp}` : `/apps?app=${activeApp}`}
              </div>
              <button
                onClick={() => handleCopyAppUrl(activeApp, `/apps?app=${activeApp}`)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-mono rounded-xs border border-white/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copy Direct Link to this MiniApp"
              >
                {copiedAppUrl === activeApp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAppUrl === activeApp ? 'Copied' : 'Share App URL'}</span>
              </button>
            </div>
          </div>

          {/* Render Active MiniApp Container */}
          {(activeApp === 'drop' || activeApp === 'share' || activeApp === 'fileshare') && (
            <div className="border border-white/10 rounded-xs bg-[#080808]">
              <FileShareRoom initialRoomId={initialRoomId} onExit={() => setActiveApp(null)} />
            </div>
          )}

          {activeApp === 'meet' && (
            <div className="border border-white/10 rounded-xs bg-[#080808]">
              <VideoCallRoom initialRoomId={initialRoomId} onExit={() => setActiveApp(null)} />
            </div>
          )}

          {activeApp === 'libcode' && <LibCodeApp onBack={() => setActiveApp(null)} />}
          {activeApp === 'hrdiya' && <HrdiyaApp onBack={() => setActiveApp(null)} />}
          {activeApp === 'bankexam' && <BankExamApp onBack={() => setActiveApp(null)} />}
          {activeApp === 'subnet' && <SubnetCalculatorApp onBack={() => setActiveApp(null)} />}
        </div>
      ) : (
        /* MiniApp Hub Catalog View */
        <div className="space-y-8">
          {/* Header Banner */}
          <div className="bg-[#0a0a0a] border border-white/15 p-6 sm:p-8 space-y-4 relative overflow-hidden rounded-xs">
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase tracking-widest">
                  <Sparkles className="w-4 h-4" />
                  <span>DZt Cloud Micro-Application Ecosystem</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight uppercase">
                  DZt MiniApps Hub
                </h1>
                <p className="text-xs sm:text-sm text-gray-400 max-w-2xl font-sans">
                  Interactive real-time web applications, video communication rooms, and engineering calculators developed by Amal K P.
                </p>
              </div>

              {/* Shareable Hub URL Card */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-black/60 border border-white/15 p-3 rounded-xs">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block">Dedicated Hub URL</span>
                  <span className="text-xs font-mono text-cyan-300 font-bold">/apps</span>
                </div>
                <button
                  onClick={handleCopyHubUrl}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-mono rounded-xs border border-white/20 flex items-center gap-1.5 transition-colors cursor-pointer ml-auto"
                >
                  {copiedHubUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedHubUrl ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>
            </div>

            {/* Quick Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                {(
                  [
                    { id: 'all', label: 'All MiniApps' },
                    { id: 'communication', label: 'Communication' },
                    { id: 'dev', label: 'Dev & Utilities' },
                    { id: 'health', label: 'Healthcare AI' },
                    { id: 'education', label: 'Education' }
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 text-xs font-mono rounded-xs transition-all cursor-pointer whitespace-nowrap ${
                      selectedCategory === cat.id
                        ? 'bg-white text-black font-bold'
                        : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search MiniApps..."
                  className="w-full bg-black/60 border border-white/15 pl-9 pr-3 py-1.5 text-xs font-mono text-white placeholder:text-white/30 rounded-xs focus:outline-none focus:border-white/40"
                />
              </div>
            </div>
          </div>

          {/* MiniApps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredApps.map((app) => {
              const Icon = app.icon;
              const isMeet = app.id === 'meet';
              return (
                <div
                  key={app.id}
                  className={`border rounded-xs p-6 flex flex-col justify-between space-y-6 transition-all group ${
                    isMeet 
                      ? 'bg-gradient-to-br from-[#0c0c0c] via-[#090909] to-[#040404] border-cyan-500/40 hover:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.08)]' 
                      : 'bg-[#0a0a0a] border-white/15 hover:border-white/30'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Card Top Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xs border ${isMeet ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-white/10 text-white'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">
                            {app.categoryLabel}
                          </span>
                          <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors uppercase">
                            {app.title}
                          </h3>
                        </div>
                      </div>

                      <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-xs border uppercase tracking-wider ${app.badgeColor}`}>
                        {app.badge}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 font-sans leading-relaxed">
                      {app.description}
                    </p>

                    {/* Features List */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {app.features.map((feat, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px] font-mono text-white/70">
                          <span className="w-1 h-1 rounded-full bg-cyan-400" />
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* Tech Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {app.techStack.map((tech, i) => (
                        <span key={i} className="text-[9px] font-mono text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded-xs">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/10">
                    <button
                      onClick={() => handleCopyAppUrl(app.id, app.directUrl)}
                      className="text-[11px] font-mono text-white/50 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Copy Direct Link"
                    >
                      {copiedAppUrl === app.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                      <span>{copiedAppUrl === app.id ? 'Copied' : app.directUrl}</span>
                    </button>

                    <button
                      onClick={() => setActiveApp(app.id)}
                      className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-xs flex items-center gap-2 transition-all cursor-pointer ${
                        isMeet
                          ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                          : 'bg-white hover:bg-neutral-200 text-black'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Launch App</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredApps.length === 0 && (
            <div className="bg-[#0a0a0a] border border-white/15 p-12 text-center space-y-3 rounded-xs">
              <Search className="w-8 h-8 text-white/30 mx-auto" />
              <h3 className="text-sm font-bold uppercase text-white font-mono">No MiniApps Found</h3>
              <p className="text-xs text-white/50 font-mono">Try searching with different keywords or switch categories.</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-mono rounded-xs transition-colors cursor-pointer"
              >
                Reset Search
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// SUB-APP 1: LibCode Barcode & QR Label Studio
// -------------------------------------------------------------
function LibCodeApp({ onBack }: { onBack: () => void }) {
  const [accessionNumber, setAccessionNumber] = useState('JNIAS-CS-2024-042');
  const [bookTitle, setBookTitle] = useState('Operating Systems: Three Easy Pieces');
  const [authorName, setAuthorName] = useState('Remzi H. Arpaci-Dusseau');
  const [shelfLocation, setShelfLocation] = useState('RACK-04 / STACK-B');
  const [barcodeType, setBarcodeType] = useState<'code128' | 'qr'>('code128');
  const [isCopied, setIsCopied] = useState(false);

  // Generate pseudo SVG barcode bars from accession number
  const barcodeBars = accessionNumber.split('').map((char: string, index: number) => {
    const code = char.charCodeAt(0);
    const width = (code % 3) + 1; // 1, 2, or 3px
    const isSpace = (code + index) % 4 === 0;
    return { width, isSpace };
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopyTag = () => {
    const text = `LIBCODE ACCESSION TAG\nAccession ID: ${accessionNumber}\nTitle: ${bookTitle}\nAuthor: ${authorName}\nShelf: ${shelfLocation}`;
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/15 p-6 sm:p-8 space-y-6 rounded-xs">
      <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">LibCode JNIAS Subsystem</span>
          <h2 className="text-xl font-bold uppercase text-white font-mono">Barcode & Accession Label Studio</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyTag}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-mono rounded-xs border border-white/20 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Copied' : 'Copy Metadata'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-white text-black hover:bg-neutral-200 text-xs font-mono font-bold rounded-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Print Label Tag</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls Form */}
        <div className="space-y-4 font-mono text-xs">
          <div className="space-y-1.5">
            <label className="text-white/60 uppercase text-[10px] tracking-wider block">Accession Number / Barcode ID</label>
            <input
              type="text"
              value={accessionNumber}
              onChange={(e) => setAccessionNumber(e.target.value.toUpperCase())}
              className="w-full bg-black/60 border border-white/20 p-2.5 text-white rounded-xs focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-white/60 uppercase text-[10px] tracking-wider block">Book Title</label>
            <input
              type="text"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              className="w-full bg-black/60 border border-white/20 p-2.5 text-white rounded-xs focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-white/60 uppercase text-[10px] tracking-wider block">Author</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full bg-black/60 border border-white/20 p-2.5 text-white rounded-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-white/60 uppercase text-[10px] tracking-wider block">Shelf / Stack Location</label>
              <input
                type="text"
                value={shelfLocation}
                onChange={(e) => setShelfLocation(e.target.value)}
                className="w-full bg-black/60 border border-white/20 p-2.5 text-white rounded-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-white/60 uppercase text-[10px] tracking-wider block">Barcode Format</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBarcodeType('code128')}
                className={`flex-1 py-2 rounded-xs border text-xs font-mono transition-colors cursor-pointer ${
                  barcodeType === 'code128' ? 'bg-white text-black font-bold border-white' : 'bg-white/5 text-white/70 border-white/15'
                }`}
              >
                Code-128 Linear Barcode
              </button>
              <button
                type="button"
                onClick={() => setBarcodeType('qr')}
                className={`flex-1 py-2 rounded-xs border text-xs font-mono transition-colors cursor-pointer ${
                  barcodeType === 'qr' ? 'bg-white text-black font-bold border-white' : 'bg-white/5 text-white/70 border-white/15'
                }`}
              >
                2D QR Matrix Tag
              </button>
            </div>
          </div>
        </div>

        {/* Live Printable Label Preview Card */}
        <div className="space-y-3">
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">Live Label Sheet Preview</span>
          
          <div className="bg-white text-black p-6 rounded-xs shadow-xl border-2 border-dashed border-neutral-300 space-y-4 max-w-md mx-auto">
            <div className="border-b border-black/10 pb-2 flex items-center justify-between text-[9px] font-mono font-bold tracking-widest text-neutral-600 uppercase">
              <span>JNIAS CENTRAL LIBRARY</span>
              <span>PROPERTY OF DEPT</span>
            </div>

            <div className="space-y-1 text-left">
              <div className="text-xs font-bold font-mono uppercase text-black line-clamp-1">
                {bookTitle || 'UNTITLED RECORD'}
              </div>
              <div className="text-[11px] text-neutral-600 font-mono">
                Author: {authorName || 'N/A'}
              </div>
              <div className="text-[10px] text-neutral-500 font-mono">
                Location: {shelfLocation || 'GENERAL'}
              </div>
            </div>

            {/* Barcode Graphic */}
            {barcodeType === 'code128' ? (
              <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-2xs flex flex-col items-center justify-center space-y-2">
                <div className="flex items-center justify-center h-16 gap-[2px] w-full px-4 overflow-hidden">
                  {barcodeBars.map((bar, i) => (
                    <div
                      key={i}
                      style={{ width: `${bar.width * 2}px` }}
                      className={`h-full ${bar.isSpace ? 'bg-transparent' : 'bg-black'}`}
                    />
                  ))}
                </div>
                <span className="font-mono text-xs font-bold tracking-widest select-all">
                  *{accessionNumber}*
                </span>
              </div>
            ) : (
              <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-2xs flex flex-col items-center justify-center space-y-2">
                <div className="w-24 h-24 bg-black p-2 rounded-xs flex flex-wrap gap-1 items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white bg-black m-0.5" />
                  <div className="w-5 h-5 border-2 border-white bg-black m-0.5" />
                  <div className="w-5 h-5 border-2 border-white bg-black m-0.5" />
                  <div className="w-2 h-2 bg-white m-0.5" />
                  <div className="w-2 h-2 bg-white m-0.5" />
                  <div className="w-5 h-5 border-2 border-white bg-black m-0.5" />
                </div>
                <span className="font-mono text-[11px] font-bold tracking-wider select-all">
                  {accessionNumber}
                </span>
              </div>
            )}

            <div className="text-[8px] font-mono text-neutral-400 text-center uppercase tracking-widest pt-1 border-t border-black/5">
              SCAN WITH JNIAS LIBCODE BARCODE HANDHELD SCANNER
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// SUB-APP 2: Hrdiya Cardiac Health & Risk Diagnostic
// -------------------------------------------------------------
function HrdiyaApp({ onBack }: { onBack: () => void }) {
  const [age, setAge] = useState(42);
  const [systolicBP, setSystolicBP] = useState(132);
  const [cholesterol, setCholesterol] = useState(210);
  const [hdl, setHdl] = useState(48);
  const [isSmoker, setIsSmoker] = useState(false);
  const [isDiabetic, setIsDiabetic] = useState(false);

  // Framingham heuristic calculation model
  const calculateRisk = () => {
    let score = 0;
    // Age factor
    if (age > 50) score += 6;
    else if (age > 40) score += 4;
    else if (age > 30) score += 2;

    // Blood Pressure factor
    if (systolicBP >= 160) score += 5;
    else if (systolicBP >= 140) score += 3;
    else if (systolicBP >= 130) score += 1;

    // Cholesterol factor
    if (cholesterol >= 240) score += 4;
    else if (cholesterol >= 200) score += 2;

    // HDL protection
    if (hdl < 40) score += 2;
    else if (hdl >= 60) score -= 1;

    // Lifestyle
    if (isSmoker) score += 3;
    if (isDiabetic) score += 3;

    // Map to percentage
    const percent = Math.min(Math.max(Math.round((score / 22) * 35), 2), 65);
    return percent;
  };

  const riskPercent = calculateRisk();

  const getRiskTier = (pct: number) => {
    if (pct < 10) return { label: 'LOW RISK', color: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10' };
    if (pct < 20) return { label: 'MODERATE RISK', color: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-500/10' };
    return { label: 'HIGH RISK', color: 'text-rose-400', border: 'border-rose-500/40', bg: 'bg-rose-500/10' };
  };

  const tier = getRiskTier(riskPercent);

  return (
    <div className="bg-[#0a0a0a] border border-white/15 p-6 sm:p-8 space-y-6 rounded-xs">
      <div className="border-b border-white/10 pb-4">
        <span className="text-[10px] font-mono text-rose-400 uppercase tracking-widest block">Hrdiya Clinical AI Subsystem</span>
        <h2 className="text-xl font-bold uppercase text-white font-mono">10-Year Cardiovascular Risk Estimator</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sliders Input */}
        <div className="lg:col-span-2 space-y-5 font-mono text-xs">
          {/* Age */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-white/60 uppercase text-[10px]">Patient Age</span>
              <span className="text-white font-bold">{age} YEARS</span>
            </div>
            <input
              type="range"
              min="20"
              max="80"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full accent-rose-400 cursor-pointer"
            />
          </div>

          {/* Systolic BP */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-white/60 uppercase text-[10px]">Systolic Blood Pressure (mmHg)</span>
              <span className="text-white font-bold">{systolicBP} mmHg</span>
            </div>
            <input
              type="range"
              min="90"
              max="200"
              value={systolicBP}
              onChange={(e) => setSystolicBP(Number(e.target.value))}
              className="w-full accent-rose-400 cursor-pointer"
            />
          </div>

          {/* Cholesterol */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-white/60 uppercase text-[10px]">Total Cholesterol</span>
                <span className="text-white font-bold">{cholesterol} mg/dL</span>
              </div>
              <input
                type="range"
                min="130"
                max="320"
                value={cholesterol}
                onChange={(e) => setCholesterol(Number(e.target.value))}
                className="w-full accent-rose-400 cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-white/60 uppercase text-[10px]">HDL Good Cholesterol</span>
                <span className="text-white font-bold">{hdl} mg/dL</span>
              </div>
              <input
                type="range"
                min="20"
                max="90"
                value={hdl}
                onChange={(e) => setHdl(Number(e.target.value))}
                className="w-full accent-rose-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsSmoker(!isSmoker)}
              className={`p-3 rounded-xs border text-left font-mono transition-all cursor-pointer ${
                isSmoker ? 'bg-rose-500/15 border-rose-400 text-rose-300' : 'bg-black/40 border-white/15 text-white/60'
              }`}
            >
              <div className="text-xs font-bold uppercase">Smoker Status</div>
              <div className="text-[10px] text-white/40">{isSmoker ? 'Active Smoker (+Risk)' : 'Non-Smoker'}</div>
            </button>

            <button
              type="button"
              onClick={() => setIsDiabetic(!isDiabetic)}
              className={`p-3 rounded-xs border text-left font-mono transition-all cursor-pointer ${
                isDiabetic ? 'bg-rose-500/15 border-rose-400 text-rose-300' : 'bg-black/40 border-white/15 text-white/60'
              }`}
            >
              <div className="text-xs font-bold uppercase">Diabetic History</div>
              <div className="text-[10px] text-white/40">{isDiabetic ? 'Diagnosed Diabetes' : 'Non-Diabetic'}</div>
            </button>
          </div>
        </div>

        {/* Calculated Result Card */}
        <div className={`p-6 border rounded-xs flex flex-col justify-between space-y-4 ${tier.bg} ${tier.border}`}>
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest block">Framingham 10-Yr Estimate</span>
            <div className={`text-4xl font-bold font-mono ${tier.color}`}>
              {riskPercent}%
            </div>
            <div className={`text-xs font-mono font-bold uppercase tracking-wider ${tier.color}`}>
              {tier.label}
            </div>
          </div>

          <div className="space-y-2 font-mono text-[11px] text-white/70 border-t border-white/10 pt-4">
            <div className="flex justify-between">
              <span>BP Classification:</span>
              <span className="text-white font-bold">{systolicBP >= 140 ? 'Stage 2 HTN' : systolicBP >= 130 ? 'Stage 1 HTN' : 'Normal BP'}</span>
            </div>
            <div className="flex justify-between">
              <span>Chol/HDL Ratio:</span>
              <span className="text-white font-bold">{(cholesterol / hdl).toFixed(1)}</span>
            </div>
          </div>

          <div className="text-[10px] font-sans text-white/50 leading-relaxed pt-2">
            *Clinical advisory algorithm modeled after Framingham Risk Score. Consult a certified cardiologist for official diagnostic assessments.
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// SUB-APP 3: Co-op Bank Examination Speed-Trainer
// -------------------------------------------------------------
function BankExamApp({ onBack }: { onBack: () => void }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isFinished, setIsFinished] = useState(false);

  const questions = [
    {
      q: 'Which Section of the Kerala Co-operative Societies Act, 1969 empowers the Registrar to audit societies?',
      options: ['Section 63', 'Section 64', 'Section 65', 'Section 66'],
      correct: 0,
      explanation: 'Section 63 governs the audit of accounts of co-operative societies by the Director of Co-operative Audit.'
    },
    {
      q: 'What is the minimum statutory reserve fund contribution required from net profits for a Primary Agricultural Credit Society (PACS)?',
      options: ['10%', '15%', '25%', '33.3%'],
      correct: 2,
      explanation: 'Under co-operative rules, not less than 25% of the net profits of each year must be transferred to the Reserve Fund.'
    },
    {
      q: 'Which apex banking institution provides refinance assistance for rural credit cooperatives in India?',
      options: ['RBI', 'NABARD', 'SIDBI', 'IDBI'],
      correct: 1,
      explanation: 'NABARD (National Bank for Agriculture and Rural Development) is the apex development bank for agriculture and rural credit.'
    },
    {
      q: 'In banking bookkeeping, what is the effect of an overdue loan provision on the Profit & Loss statement?',
      options: ['Debited as an expense', 'Credited as income', 'No effect on P&L', 'Treated as an asset addition'],
      correct: 0,
      explanation: 'Provisions for Non-Performing Assets (NPAs) are debited to the Profit & Loss account as provisions and contingencies.'
    }
  ];

  const handleSelect = (optionIdx: number) => {
    setSelectedAnswers({ ...selectedAnswers, [currentIdx]: optionIdx });
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, i) => {
      if (selectedAnswers[i] === q.correct) score += 1;
    });
    return score;
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setCurrentIdx(0);
    setIsFinished(false);
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/15 p-6 sm:p-8 space-y-6 rounded-xs">
      <div className="border-b border-white/10 pb-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block">Bank Exam Portal Engine</span>
          <h2 className="text-xl font-bold uppercase text-white font-mono">Co-operative Bank Aptitude Speed Drill</h2>
        </div>
        <span className="text-xs font-mono text-white/50">
          Question {currentIdx + 1} of {questions.length}
        </span>
      </div>

      {!isFinished ? (
        <div className="space-y-6 font-mono">
          <div className="bg-black/40 border border-white/10 p-5 rounded-xs space-y-3">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Question {currentIdx + 1}:</span>
            <p className="text-sm text-white font-sans leading-relaxed">
              {questions[currentIdx].q}
            </p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {questions[currentIdx].options.map((opt, i) => {
              const isChosen = selectedAnswers[currentIdx] === i;
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className={`p-4 rounded-xs border text-left text-xs font-mono transition-all cursor-pointer ${
                    isChosen
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                      : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="text-white/40 mr-2">{String.fromCharCode(65 + i)}.</span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(currentIdx - 1)}
              className="px-4 py-2 bg-white/5 border border-white/15 text-white text-xs font-mono rounded-xs disabled:opacity-30 cursor-pointer"
            >
              Previous
            </button>

            {currentIdx < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIdx(currentIdx + 1)}
                className="px-5 py-2 bg-white text-black font-bold text-xs font-mono rounded-xs hover:bg-neutral-200 cursor-pointer"
              >
                Next Question
              </button>
            ) : (
              <button
                onClick={() => setIsFinished(true)}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-mono rounded-xs cursor-pointer shadow-lg"
              >
                Submit Exam
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6 font-mono">
          <div className="bg-black/60 border border-amber-500/30 p-6 rounded-xs text-center space-y-3">
            <span className="text-xs text-amber-400 uppercase tracking-widest">Mock Exam Results</span>
            <div className="text-4xl font-bold text-white">
              {calculateScore()} / {questions.length}
            </div>
            <p className="text-xs text-gray-400">
              Accuracy: {((calculateScore() / questions.length) * 100).toFixed(0)}%
            </p>
          </div>

          {/* Solutions Breakdown */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Review & Solutions:</h3>
            {questions.map((q, i) => {
              const isCorrect = selectedAnswers[i] === q.correct;
              return (
                <div key={i} className="bg-black/40 border border-white/10 p-4 rounded-xs space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Q{i + 1}: {q.q}</span>
                    {isCorrect ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                      </span>
                    ) : (
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Incorrect
                      </span>
                    )}
                  </div>
                  <div className="text-white/60">Correct Answer: <strong className="text-white">{q.options[q.correct]}</strong></div>
                  <div className="text-white/40 text-[11px]">{q.explanation}</div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleReset}
            className="w-full py-3 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-xs hover:bg-neutral-200 cursor-pointer"
          >
            Retake Exam Drill
          </button>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// SUB-APP 4: DZt Subnet & CIDR Calculator
// -------------------------------------------------------------
function SubnetCalculatorApp({ onBack }: { onBack: () => void }) {
  const [ipAddress, setIpAddress] = useState('192.168.1.100');
  const [cidr, setCidr] = useState(24);

  // Bitwise calculations
  const calculateSubnet = () => {
    try {
      const parts = ipAddress.trim().split('.').map(Number);
      if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
        return null;
      }

      const ipNum = ((parts[0] << 24) >>> 0) + ((parts[1] << 16) >>> 0) + ((parts[2] << 8) >>> 0) + (parts[3] >>> 0);
      const maskNum = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
      const netNum = (ipNum & maskNum) >>> 0;
      const broadcastNum = (netNum | (~maskNum >>> 0)) >>> 0;

      const numToIp = (num: number) => {
        return [
          (num >>> 24) & 255,
          (num >>> 16) & 255,
          (num >>> 8) & 255,
          num & 255
        ].join('.');
      };

      const maskIp = numToIp(maskNum);
      const netIp = numToIp(netNum);
      const broadcastIp = numToIp(broadcastNum);
      const totalHosts = cidr >= 31 ? (cidr === 31 ? 2 : 1) : Math.pow(2, 32 - cidr);
      const usableHosts = cidr >= 31 ? (cidr === 31 ? 2 : 1) : Math.max(totalHosts - 2, 0);
      const firstUsable = cidr >= 31 ? netIp : numToIp(netNum + 1);
      const lastUsable = cidr >= 31 ? broadcastIp : numToIp(broadcastNum - 1);

      return {
        maskIp,
        netIp,
        broadcastIp,
        totalHosts,
        usableHosts,
        firstUsable,
        lastUsable
      };
    } catch {
      return null;
    }
  };

  const results = calculateSubnet();

  return (
    <div className="bg-[#0a0a0a] border border-white/15 p-6 sm:p-8 space-y-6 rounded-xs">
      <div className="border-b border-white/10 pb-4">
        <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest block">DZt Network Ops Subsystem</span>
        <h2 className="text-xl font-bold uppercase text-white font-mono">CIDR & IP Subnet Mask Calculator</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-mono text-xs">
        {/* Controls */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-white/60 uppercase text-[10px]">IPv4 Host Address</label>
            <input
              type="text"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              className="w-full bg-black/60 border border-white/20 p-2.5 text-white rounded-xs focus:outline-none focus:border-purple-400"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-white/60 uppercase text-[10px]">CIDR Subnet Prefix</span>
              <span className="text-purple-400 font-bold">/{cidr}</span>
            </div>
            <input
              type="range"
              min="8"
              max="30"
              value={cidr}
              onChange={(e) => setCidr(Number(e.target.value))}
              className="w-full accent-purple-400 cursor-pointer"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {[8, 16, 24, 26, 28, 29, 30].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCidr(p)}
                className={`px-3 py-1 text-[11px] rounded-xs border transition-colors cursor-pointer ${
                  cidr === p ? 'bg-purple-500 text-white font-bold border-purple-400' : 'bg-white/5 border-white/10 text-white/60'
                }`}
              >
                /{p}
              </button>
            ))}
          </div>
        </div>

        {/* Results Matrix */}
        {results ? (
          <div className="bg-black/50 border border-white/15 p-5 rounded-xs space-y-3">
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-white/40 uppercase">Subnet Mask:</span>
              <span className="text-purple-300 font-bold">{results.maskIp}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-white/40 uppercase">Network ID:</span>
              <span className="text-white font-bold">{results.netIp}/{cidr}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-white/40 uppercase">Broadcast IP:</span>
              <span className="text-white font-bold">{results.broadcastIp}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-white/40 uppercase">Usable Range:</span>
              <span className="text-emerald-400 font-bold">{results.firstUsable} – {results.lastUsable}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-white/40 uppercase">Usable Hosts:</span>
              <span className="text-cyan-300 font-bold">{results.usableHosts.toLocaleString()} Devices</span>
            </div>
          </div>
        ) : (
          <div className="bg-black/50 border border-rose-500/30 p-6 rounded-xs text-center text-rose-400">
            Invalid IPv4 address format.
          </div>
        )}
      </div>
    </div>
  );
}
