import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  FileText,
  Mail,
  UserCheck,
  Search,
  Copy,
  Check,
  Share2,
  QrCode,
  HeartPulse,
  GraduationCap,
  Network,
  Terminal,
  Code2,
  Layers,
  RefreshCw,
  X,
  ExternalLink,
  Clock,
  Globe,
  ShieldCheck,
  Database,
  Cpu,
  Play
} from 'lucide-react';
import { AMAL_INFO } from '../data';
import HeroTelemetry from './HeroTelemetry';
import PartnershipMarquee from './PartnershipMarquee';

interface HeroProps {
  onNavigate: (tab: string) => void;
}

interface SystemCaseStudy {
  id: string;
  index: string;
  title: string;
  subtitle: string;
  category: 'institutional' | 'healthcare' | 'p2p';
  categoryLabel: string;
  stack: string[];
  metricValue: string;
  metricLabel: string;
  summary: string;
  architecture: {
    client: string;
    engine: string;
    storage: string;
  };
  deliverables: string[];
  miniAppTarget: string;
  miniAppLabel: string;
  repoUrl: string;
}

interface BlueprintModule {
  id: string;
  index: string;
  title: string;
  language: string;
  filePath: string;
  description: string;
  metrics: string;
  miniAppTarget: string;
  code: string;
}

const CASE_STUDIES: SystemCaseStudy[] = [
  {
    id: 'libcode-jnias',
    index: '01',
    title: 'LibCode JNIAS — Library Automation Suite',
    subtitle: 'Institutional Circulation & Barcode Cataloging Engine',
    category: 'institutional',
    categoryLabel: 'Institutional Portal',
    stack: ['PHP', 'MySQL', 'JavaScript', 'Barcode Scanning', 'Tailwind CSS'],
    metricValue: '< 40ms',
    metricLabel: 'ISBN & Barcode Query Speed',
    summary:
      'Engineered and deployed for Jawaharlal Nehru Institute of Arts and Science (JNIAS) to automate physical book cataloging, barcode-driven desk circulation, student borrowing ledgers, and automated overdue fine computation.',
    architecture: {
      client: 'Responsive Circulation Desk UI + Laser Barcode Scanner Input Hook',
      engine: 'PHP 8 Circulation Controller + Automated Fine & Due-Date Rules Engine',
      storage: 'Normalized MySQL Relational Ledger with Indexed ISBN & Accession Keys'
    },
    deliverables: [
      'Instant Code-128 barcode & ISBN lookup for rapid desk check-in and check-out',
      'Automated student membership ledger with real-time borrow limits and fine calculation',
      'Printable accession tag and spine label studio for new library acquisitions',
      'Role-based administrative reporting for audit trails and inventory verification'
    ],
    miniAppTarget: 'apps:libcode',
    miniAppLabel: 'Open Barcode Studio',
    repoUrl: 'https://jnias.com'
  },
  {
    id: 'bank-exam-portal',
    index: '02',
    title: 'Co-operative Bank Examination Portal',
    subtitle: 'High-Concurrency Recruitment & Auto-Grading Platform',
    category: 'institutional',
    categoryLabel: 'Assessment System',
    stack: ['PHP', 'MySQL', 'JavaScript', 'Session Auditing', 'HTML5'],
    metricValue: '100%',
    metricLabel: 'Automated Score & Audit Accuracy',
    summary:
      'Built to conduct secure, timed recruitment assessments for Co-operative Bank candidates. Features cryptographic question pool randomization, anti-tamper countdown timers, and instant score tabulation.',
    architecture: {
      client: 'Locked Candidate Assessment Viewport + Heartbeat Timer Sync',
      engine: 'Fisher-Yates Question Pool Shuffler + Atomic Auto-Submission Handler',
      storage: 'MySQL Candidate Response Audit Log & Instant Rank Matrix'
    },
    deliverables: [
      'Dynamic per-candidate question and option shuffling to prevent adjacent copying',
      'Server-synchronized countdown timer with automatic state persistence on disconnect',
      'Zero-latency objective grading engine with category-wise aptitude breakdown',
      'Comprehensive administrator dashboard for question bank and candidate management'
    ],
    miniAppTarget: 'apps:bankexam',
    miniAppLabel: 'Try Speed-Trainer',
    repoUrl: 'https://github.com/amalkochuparambilp'
  },
  {
    id: 'hrdiya-health',
    index: '03',
    title: 'Hrdiya — Cardiac Risk Analytics Platform',
    subtitle: 'Clinical Cardiovascular Stratification & Tele-Consultation',
    category: 'healthcare',
    categoryLabel: 'Healthcare AI',
    stack: ['Python', 'Django', 'SQLite', 'React', 'Clinical Algorithms'],
    metricValue: '10-Yr',
    metricLabel: 'Framingham Risk Projection Model',
    summary:
      'Full-stack healthcare application built in Python and Django that evaluates physiological markers—blood pressure, lipid panels, age, and clinical history—to compute 10-year cardiovascular risk and route high-risk patients to cardiologists.',
    architecture: {
      client: 'Patient Biometric Intake Dashboard & Interactive Risk Gauge',
      engine: 'Django Clinical Risk Stratification Service (Framingham Multivariable Model)',
      storage: 'Encrypted Patient Longitudinal Record Store & Specialist Triage Queue'
    },
    deliverables: [
      'Multivariable physiological risk scoring across systolic BP, cholesterol, and smoking status',
      'Longitudinal patient metric tracking to visualize intervention progress over time',
      'Direct specialist consultation routing for elevated and high-risk profiles',
      'Clean clinical interface translating complex biomarkers into actionable guidance'
    ],
    miniAppTarget: 'apps:hrdiya',
    miniAppLabel: 'Launch Risk Calculator',
    repoUrl: 'https://github.com/amalkochuparambilp'
  },
  {
    id: 'dzt-drop-p2p',
    index: '04',
    title: 'DZt Drop — Zero-Cloud P2P File Engine',
    subtitle: 'Encrypted Browser-to-Browser WebRTC DataChannel Mesh',
    category: 'p2p',
    categoryLabel: 'P2P & Ecosystem',
    stack: ['TypeScript', 'WebRTC DataChannel', 'DTLS/SCTP', 'Node.js', 'WebSockets'],
    metricValue: '0 Bytes',
    metricLabel: 'Cloud Storage Footprint (Direct P2P)',
    summary:
      'Flagship utility of the DZt MiniApp Ecosystem enabling direct browser-to-browser file and clipboard transfers with end-to-end DTLS encryption, backpressure-aware binary chunking, and instant QR mobile pairing.',
    architecture: {
      client: 'React Drag-and-Drop Beam Interface + QR Room Pairing Generator',
      engine: '64KB ArrayBuffer Chunk Streamer with BufferedAmount Backpressure Control',
      storage: 'Direct Peer-to-Peer SCTP/DTLS DataChannel with Hybrid WS/MQTT Signaling'
    },
    deliverables: [
      'Direct device-to-device binary streaming without intermediate cloud storage limits',
      'Automatic room code generation and QR pairing for instant desktop-to-phone transfers',
      'Real-time throughput telemetry (MB/s), progress bars, and SHA-verified completion',
      'Multi-peer room mesh supporting simultaneous text clipboard and multi-file drops'
    ],
    miniAppTarget: 'apps:drop',
    miniAppLabel: 'Launch DZt Drop',
    repoUrl: 'https://amalkp.online/apps?app=drop'
  }
];

const BLUEPRINT_MODULES: BlueprintModule[] = [
  {
    id: 'webrtc-chunker',
    index: '01',
    title: 'WebRTC DataChannel Backpressure Streamer',
    language: 'TypeScript',
    filePath: 'src/utils/p2pFileTransfer.ts',
    description: 'Streams arbitrary-sized files over WebRTC SCTP DataChannels in 64KB binary chunks while regulating buffer pressure.',
    metrics: '64 KB Chunk Size · DTLS Encrypted · Zero Server Relay',
    miniAppTarget: 'apps:drop',
    code: `const CHUNK_SIZE = 64 * 1024; // 64KB optimal SCTP frame
const MAX_BUFFER = 4 * 1024 * 1024;

export async function streamFileOverChannel(
  channel: RTCDataChannel,
  file: File,
  onProgress: (sentBytes: number) => void
): Promise<void> {
  channel.binaryType = 'arraybuffer';
  let offset = 0;

  while (offset < file.size) {
    if (channel.bufferedAmount > MAX_BUFFER) {
      await new Promise<void>((resolve) => {
        channel.onbufferedamountlow = () => {
          channel.onbufferedamountlow = null;
          resolve();
        };
      });
    }
    const slice = file.slice(offset, offset + CHUNK_SIZE);
    const buffer = await slice.arrayBuffer();
    channel.send(buffer);
    offset += buffer.byteLength;
    onProgress(offset);
  }
}`
  },
  {
    id: 'libcode-ledger',
    index: '02',
    title: 'LibCode Circulation & Overdue Ledger Query',
    language: 'PHP / SQL',
    filePath: 'libcode/core/CirculationEngine.php',
    description: 'Resolves barcode scans against active library holdings and computes dynamic overdue penalties in a single indexed transaction.',
    metrics: 'Indexed B-Tree Lookup · ACID Compliant · JNIAS Production',
    miniAppTarget: 'apps:libcode',
    code: `public function checkoutByBarcode(string $accessionCode, int $studentId): array {
    $stmt = $this->db->prepare("
        SELECT b.book_id, b.title, b.isbn, b.available_copies,
               COUNT(c.loan_id) AS active_student_loans
        FROM library_books b
        LEFT JOIN circulation_ledger c
          ON c.student_id = :student_id AND c.returned_at IS NULL
        WHERE b.barcode_tag = :barcode
        GROUP BY b.book_id
        FOR UPDATE
    ");
    $stmt->execute([
        ':barcode' => trim($accessionCode),
        ':student_id' => $studentId
    ]);
    $record = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$record || (int)$record['available_copies'] < 1) {
        throw new DomainException('Accession copy unavailable for loan.');
    }
    return $this->commitLoanTransaction($record['book_id'], $studentId);
}`
  },
  {
    id: 'hrdiya-framingham',
    index: '03',
    title: 'Hrdiya Cardiovascular Risk Stratification',
    language: 'Python / Django',
    filePath: 'hrdiya/diagnostics/risk_model.py',
    description: 'Computes 10-year cardiovascular event probability from patient systolic blood pressure, lipid ratio, and clinical co-factors.',
    metrics: 'Framingham Coeffs · Clinical Triage · Automated Routing',
    miniAppTarget: 'apps:hrdiya',
    code: `from dataclasses import dataclass
import math

@dataclass(frozen=True)
class PatientBiometrics:
    age: int
    systolic_bp: int
    total_cholesterol: int
    hdl_cholesterol: int
    smoker: bool
    on_hypertension_meds: bool

def evaluate_ten_year_cardiac_risk(bio: PatientBiometrics) -> dict:
    ln_age = math.log(bio.age) * 3.06117
    ln_tc = math.log(bio.total_cholesterol) * 1.12370
    ln_hdl = math.log(bio.hdl_cholesterol) * -0.93263
    bp_coeff = 1.99881 if bio.on_hypertension_meds else 1.93303
    ln_sbp = math.log(bio.systolic_bp) * bp_coeff
    smoke_term = 0.65451 if bio.smoker else 0.0

    score_sum = ln_age + ln_tc + ln_hdl + ln_sbp + smoke_term
    risk_pct = round((1.0 - pow(0.88936, math.exp(score_sum - 23.9802))) * 100, 1)
    triage = "HIGH" if risk_pct >= 20.0 else ("MODERATE" if risk_pct >= 10.0 else "LOW")
    return {"ten_year_risk_percent": risk_pct, "triage_tier": triage}`
  }
];

const QUICK_MINIAPPS = [
  {
    id: 'drop',
    index: '01',
    name: 'DZt Drop P2P',
    category: 'WebRTC File Beam',
    description: 'Direct browser-to-browser encrypted file & text transfer with QR phone pairing.',
    icon: Share2,
    target: 'apps:drop',
    accent: 'text-emerald-400'
  },
  {
    id: 'libcode',
    index: '02',
    name: 'LibCode Barcode Studio',
    category: 'Library Automation',
    description: 'Generate printable Code-128 barcodes, QR accession tags, and spine labels.',
    icon: QrCode,
    target: 'apps:libcode',
    accent: 'text-cyan-400'
  },
  {
    id: 'hrdiya',
    index: '03',
    name: 'Hrdiya Heart Risk',
    category: 'Clinical Analytics',
    description: 'Interactive 10-year Framingham cardiovascular risk & blood pressure evaluator.',
    icon: HeartPulse,
    target: 'apps:hrdiya',
    accent: 'text-rose-400'
  },
  {
    id: 'bankexam',
    index: '04',
    name: 'Bank Exam Trainer',
    category: 'Timed Assessment',
    description: 'Practice Co-operative Bank recruitment mock drills with live countdown scoring.',
    icon: GraduationCap,
    target: 'apps:bankexam',
    accent: 'text-amber-400'
  },
  {
    id: 'subnet',
    index: '05',
    name: 'CIDR Subnet Inspector',
    category: 'Network Engineering',
    description: 'Compute IPv4 CIDR host ranges, wildcard masks, and binary bitmask topologies.',
    icon: Network,
    target: 'apps:subnet',
    accent: 'text-purple-400'
  }
];

export default function Hero({ onNavigate }: HeroProps) {
  // Instant P2P Room state
  const [p2pRoomCode, setP2pRoomCode] = useState<string>(() => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `dzt-${randomNum}`;
  });
  const [copiedRoomLink, setCopiedRoomLink] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Project Bento Filter & Active Case Study Modal
  const [systemFilter, setSystemFilter] = useState<'all' | 'institutional' | 'healthcare' | 'p2p'>('all');
  const [activeCaseStudy, setActiveCaseStudy] = useState<SystemCaseStudy | null>(null);

  // Blueprint Code Inspector state
  const [activeBlueprintId, setActiveBlueprintId] = useState<string>(BLUEPRINT_MODULES[0].id);
  const [copiedCode, setCopiedCode] = useState(false);

  // Command Palette (⌘K / Ctrl+K) state
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');

  // Local Kerala Time & Visitor Offset
  const [keralaTime, setKeralaTime] = useState<string>('');
  const [tzComparison, setTzComparison] = useState<string>('IST (UTC+05:30)');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const formatted = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Kolkata'
      });
      setKeralaTime(`${formatted} IST`);

      // Compute offset difference vs visitor local time
      // IST is UTC+330 minutes
      const visitorOffsetMinutes = -now.getTimezoneOffset();
      const istOffsetMinutes = 330;
      const diffMinutes = istOffsetMinutes - visitorOffsetMinutes;
      if (diffMinutes === 0) {
        setTzComparison('Same timezone as you (UTC+05:30)');
      } else {
        const absHours = Math.abs(diffMinutes) / 60;
        const direction = diffMinutes > 0 ? 'ahead of' : 'behind';
        setTzComparison(`${absHours}h ${direction} your local time`);
      }
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Global Keyboard Shortcut for Command Palette (Cmd+K / Ctrl+K & Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsCommandOpen(false);
        setActiveCaseStudy(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const regenerateRoomCode = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setP2pRoomCode(`dzt-${randomNum}`);
  };

  const handleCopyRoomInvite = () => {
    const cleanRoom = p2pRoomCode.trim() || 'dzt-room';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://amalkp.online';
    const inviteUrl = `${origin}/apps?app=drop&room=${encodeURIComponent(cleanRoom)}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedRoomLink(true);
    setTimeout(() => setCopiedRoomLink(false), 2000);
  };

  const handleLaunchP2PRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRoom = p2pRoomCode.trim() || 'dzt-room';
    onNavigate(`apps:drop:${cleanRoom}`);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(AMAL_INFO.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const activeBlueprint = useMemo(
    () => BLUEPRINT_MODULES.find((b) => b.id === activeBlueprintId) || BLUEPRINT_MODULES[0],
    [activeBlueprintId]
  );

  const handleCopyBlueprintCode = () => {
    navigator.clipboard.writeText(activeBlueprint.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const filteredCaseStudies = useMemo(() => {
    if (systemFilter === 'all') return CASE_STUDIES;
    return CASE_STUDIES.filter((item) => item.category === systemFilter);
  }, [systemFilter]);

  const commandActions = useMemo(
    () => [
      {
        id: 'cmd-drop',
        title: 'Launch DZt Drop (P2P File Transfer)',
        category: 'Live MiniApp',
        shortcut: 'P2P',
        action: () => onNavigate('apps:drop')
      },
      {
        id: 'cmd-libcode',
        title: 'Launch LibCode Barcode & Label Studio',
        category: 'Live MiniApp',
        shortcut: 'BARCODE',
        action: () => onNavigate('apps:libcode')
      },
      {
        id: 'cmd-hrdiya',
        title: 'Launch Hrdiya Cardiac Risk Diagnostic',
        category: 'Live MiniApp',
        shortcut: 'HEALTH',
        action: () => onNavigate('apps:hrdiya')
      },
      {
        id: 'cmd-bankexam',
        title: 'Launch Co-op Bank Exam Speed-Trainer',
        category: 'Live MiniApp',
        shortcut: 'QUIZ',
        action: () => onNavigate('apps:bankexam')
      },
      {
        id: 'cmd-subnet',
        title: 'Launch CIDR & Subnet Calculator',
        category: 'Live MiniApp',
        shortcut: 'NET',
        action: () => onNavigate('apps:subnet')
      },
      {
        id: 'cmd-projects',
        title: 'Explore All Software Projects & Repositories',
        category: 'Navigation',
        shortcut: 'PROJECTS',
        action: () => onNavigate('projects')
      },
      {
        id: 'cmd-collaborate',
        title: 'View Institutional Collaborations (JNIAS, Bank, Hrdiya)',
        category: 'Navigation',
        shortcut: 'COLLAB',
        action: () => onNavigate('collaborate')
      },
      {
        id: 'cmd-resume',
        title: 'Open Curriculum Vitae / Printable Resume',
        category: 'Navigation',
        shortcut: 'CV',
        action: () => onNavigate('resume')
      },
      {
        id: 'cmd-skills',
        title: 'Inspect Full-Stack Technical Matrix',
        category: 'Navigation',
        shortcut: 'SKILLS',
        action: () => onNavigate('skills')
      },
      {
        id: 'cmd-contact',
        title: 'Send Direct Message / Collaboration Inquiry',
        category: 'Navigation',
        shortcut: 'CONTACT',
        action: () => onNavigate('contact')
      },
      {
        id: 'cmd-copy-email',
        title: `Copy Direct Email (${AMAL_INFO.email})`,
        category: 'Quick Action',
        shortcut: 'COPY',
        action: () => {
          navigator.clipboard.writeText(AMAL_INFO.email);
          setCopiedEmail(true);
          setTimeout(() => setCopiedEmail(false), 2000);
        }
      }
    ],
    [onNavigate]
  );

  const filteredCommands = useMemo(() => {
    const q = commandQuery.trim().toLowerCase();
    if (!q) return commandActions;
    return commandActions.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.shortcut.toLowerCase().includes(q)
    );
  }, [commandQuery, commandActions]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { y: 14, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <section className="relative py-10 md:py-16 px-4 sm:px-6 max-w-7xl mx-auto space-y-16">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-16"
      >
        {/* =====================================================================
            1. SPLIT-SCREEN EDITORIAL HERO & INSTANT P2P WORKSPACE LAUNCHER
           ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Column: Editorial Identity, Value Proposition & Primary Actions */}
          <div className="lg:col-span-7 space-y-6">
            {/* Unboxed Editorial Metadata Line (Zero-Pill Discipline) */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-mono text-white/60"
            >
              <span className="inline-flex items-center gap-2 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Available for Engineering & Collaborations</span>
              </span>
              <span aria-hidden="true" className="text-white/20">·</span>
              <span>JNIAS Balagram (BCA 2026)</span>
              <span aria-hidden="true" className="text-white/20">·</span>
              <span className="text-white/80">Founder & Lead at DZt</span>
            </motion.div>

            {/* Primary Display Headline */}
            <div className="space-y-4">
              <motion.h1
                variants={itemVariants}
                className="text-4xl sm:text-6xl xl:text-[64px] font-display font-light leading-[1.08] tracking-tight text-white [text-wrap:balance]"
              >
                Crafting digital <span className="italic font-serif text-white/95">ecosystems</span> with precision & purpose.
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="text-gray-400 text-base sm:text-lg max-w-2xl font-sans font-light leading-relaxed"
              >
                Hi, I'm <span className="text-white font-medium">{AMAL_INFO.name}</span>—full-stack systems developer, BCA candidate at JNIAS, and Founder of <span className="text-white/90">DZt</span>. I architect institutional automation platforms, clinical risk engines, and browser-native peer-to-peer utilities.
              </motion.p>
            </div>

            {/* Action CTA Cluster + Command Palette Trigger */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-1"
            >
              <button
                id="btn-hero-projects"
                onClick={() => onNavigate('projects')}
                className="min-h-[44px] px-6 py-2.5 bg-white text-black text-xs font-mono font-bold uppercase tracking-widest hover:bg-white/90 transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-xs whitespace-nowrap"
              >
                <span>Explore Systems</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="btn-hero-launch-apps"
                onClick={() => onNavigate('apps')}
                className="min-h-[44px] px-5 py-2.5 border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 text-xs font-mono font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-xs whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch DZt MiniApps</span>
              </button>

              <button
                id="btn-hero-resume"
                onClick={() => onNavigate('resume')}
                className="min-h-[44px] px-5 py-2.5 border border-white/15 bg-white/[0.03] text-white/80 hover:text-white hover:border-white/30 text-xs font-mono transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-xs whitespace-nowrap"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View CV</span>
              </button>

              <button
                id="btn-hero-cmd-palette"
                onClick={() => setIsCommandOpen(true)}
                className="min-h-[44px] px-4 py-2.5 border border-white/10 bg-[#0c0c0c] text-white/60 hover:text-white hover:border-white/25 text-xs font-mono transition-colors flex items-center justify-between sm:justify-center gap-3 cursor-pointer rounded-xs whitespace-nowrap"
                title="Open Quick Command Palette (Ctrl+K or Cmd+K)"
              >
                <span className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-white/40" />
                  <span>Quick Jump...</span>
                </span>
                <kbd className="text-[10px] font-mono text-white/40 border border-white/15 px-1.5 py-0.5 rounded-2xs">
                  ⌘K
                </kbd>
              </button>
            </motion.div>

            {/* Quantitative Proof & Engineering Metrics Bar */}
            <motion.div
              variants={itemVariants}
              className="pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-6"
            >
              <div>
                <div className="text-2xl sm:text-3xl font-display font-light text-white tabular-nums">
                  04
                </div>
                <div className="text-xs font-mono text-white/50 mt-0.5">
                  Production Platforms
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-display font-light text-white tabular-nums">
                  05
                </div>
                <div className="text-xs font-mono text-white/50 mt-0.5">
                  Live Browser MiniApps
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-display font-light text-emerald-400 tabular-nums">
                  0 B
                </div>
                <div className="text-xs font-mono text-white/50 mt-0.5">
                  Cloud Relay in DZt Drop
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-display font-light text-white tabular-nums">
                  2026
                </div>
                <div className="text-xs font-mono text-white/50 mt-0.5">
                  BCA Cohort · JNIAS
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Interactive DZt Drop P2P Instant Launcher + Live Kerala Node Card */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-5 bg-[#0b0b0b] border border-white/15 rounded-sm p-5 sm:p-6 space-y-5"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-2">
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Direct WebRTC DataChannel Utility</span>
                </div>
                <h2 className="text-lg font-medium text-white tracking-tight">
                  DZt Drop — Instant P2P File Beam
                </h2>
              </div>
              <button
                type="button"
                onClick={regenerateRoomCode}
                className="p-2 text-white/50 hover:text-white border border-white/10 hover:border-white/25 rounded-xs transition-colors cursor-pointer shrink-0"
                title="Generate new random P2P room code"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-white/60 leading-relaxed">
              Create or join an end-to-end DTLS encrypted peer-to-peer room directly from the landing page. Share files and clipboard text across devices with zero cloud storage limits.
            </p>

            <form onSubmit={handleLaunchP2PRoom} className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="hero-p2p-room-input" className="block text-[11px] font-mono text-white/50">
                  Session Room Identifier
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="hero-p2p-room-input"
                    type="text"
                    value={p2pRoomCode}
                    onChange={(e) => setP2pRoomCode(e.target.value)}
                    placeholder="e.g. dzt-8492"
                    className="flex-1 min-h-[42px] px-3.5 py-2 bg-[#050505] border border-white/15 focus:border-white/40 rounded-xs text-sm font-mono text-white outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleCopyRoomInvite}
                    className="min-h-[42px] px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono text-white/80 hover:text-white rounded-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                    title="Copy direct invite link for this room"
                  >
                    {copiedRoomLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Invite URL</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full min-h-[44px] px-4 py-2.5 bg-white text-black hover:bg-white/90 text-xs font-mono font-bold uppercase tracking-widest rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Launch Encrypted P2P Room</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </form>

            {/* Live Base Station & Direct Contact Strip */}
            <div className="pt-4 border-t border-white/10 space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between text-white/70">
                <span className="flex items-center gap-2 text-white/50">
                  <Globe className="w-3.5 h-3.5 text-white/40" />
                  <span>Balagram, Kerala</span>
                </span>
                <span className="text-white tabular-nums font-medium">
                  {keralaTime || '12:00:00 IST'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-white/40">
                <span>Timezone Sync</span>
                <span className="tabular-nums">{tzComparison}</span>
              </div>

              <div className="pt-1 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="flex-1 min-h-[40px] px-3 py-1.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-xs text-[11px] text-white/80 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer truncate"
                >
                  {copiedEmail ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-emerald-400">Email Copied to Clipboard</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-3.5 h-3.5 text-white/50 shrink-0" />
                      <span className="truncate">{AMAL_INFO.email}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('about')}
                  className="min-h-[40px] px-3 py-1.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-xs text-[11px] text-white/70 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Bio</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* =====================================================================
            2. SELECTED SYSTEMS & ARCHITECTURE BENTO SHOWCASE
           ===================================================================== */}
        <motion.div variants={itemVariants} className="space-y-6 pt-4 border-t border-white/10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-mono text-white/40">
                Selected Production Works · 2023—2026
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-light text-white tracking-tight">
                Flagship Software Systems & Architecture
              </h2>
            </div>

            {/* Interactive Category Filter Segmented Control */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-[#0c0c0c] border border-white/10 rounded-xs self-start">
              {[
                { id: 'all', label: 'All Systems' },
                { id: 'institutional', label: 'Institutional Portals' },
                { id: 'healthcare', label: 'Healthcare AI' },
                { id: 'p2p', label: 'P2P & Ecosystem' }
              ].map((tab) => {
                const active = systemFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSystemFilter(tab.id as any)}
                    className={`px-3 py-1.5 text-xs font-mono transition-colors rounded-2xs cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-white text-black font-semibold'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2x2 Bento Grid of Systems */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCaseStudies.map((sys) => (
              <article
                key={sys.id}
                className="bg-[#0b0b0b] border border-white/10 hover:border-white/25 rounded-sm p-6 flex flex-col justify-between gap-6 transition-colors group"
              >
                <div className="space-y-4">
                  {/* Quiet 1-line Kicker & Quantitative Metric */}
                  <div className="flex items-center justify-between gap-4 text-xs font-mono">
                    <span className="text-white/50">
                      {sys.index}. {sys.categoryLabel}
                    </span>
                    <span className="text-emerald-400 tabular-nums font-medium">
                      {sys.metricValue} · {sys.metricLabel}
                    </span>
                  </div>

                  {/* Primary Title & Subtitle */}
                  <div className="space-y-1">
                    <h3 className="text-xl font-medium text-white group-hover:text-white transition-colors">
                      {sys.title}
                    </h3>
                    <p className="text-xs font-mono text-white/50">
                      {sys.subtitle}
                    </p>
                  </div>

                  {/* Concise Summary */}
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {sys.summary}
                  </p>

                  {/* Unboxed Stack Metadata with Typographic Separators */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono text-white/60 pt-1">
                    {sys.stack.map((tech, idx) => (
                      <span key={tech} className="inline-flex items-center gap-2">
                        <span>{tech}</span>
                        {idx < sys.stack.length - 1 && (
                          <span aria-hidden="true" className="text-white/20">·</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveCaseStudy(sys)}
                    className="min-h-[40px] px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono text-white rounded-xs transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Layers className="w-3.5 h-3.5 text-white/60" />
                    <span>Inspect Architecture</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigate(sys.miniAppTarget)}
                    className="min-h-[40px] px-4 py-2 text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <span>{sys.miniAppLabel}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </motion.div>

        {/* =====================================================================
            3. INTERACTIVE DZT MINIAPP SUITE QUICK-LAUNCHER DOCK
           ===================================================================== */}
        <motion.div variants={itemVariants} className="space-y-6 pt-4 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-mono text-white/40">
                Interactive Browser Utilities · Zero Installation Required
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-light text-white tracking-tight">
                DZt MiniApp Ecosystem Quick-Launcher
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('apps')}
              className="min-h-[40px] px-4 py-2 border border-white/15 hover:border-white/30 text-xs font-mono text-white/80 hover:text-white rounded-xs transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto whitespace-nowrap"
            >
              <span>Open Full MiniApp Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {QUICK_MINIAPPS.map((app) => {
              const Icon = app.icon;
              return (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => onNavigate(app.target)}
                  className="p-4 bg-[#0b0b0b] border border-white/10 hover:border-white/30 rounded-sm text-left transition-all flex flex-col justify-between gap-4 cursor-pointer group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-white/40">
                      <span className="tabular-nums">{app.index}</span>
                      <Icon className={`w-4 h-4 ${app.accent} transition-transform group-hover:scale-110`} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-white group-hover:text-white">
                        {app.name}
                      </h3>
                      <div className="text-[11px] font-mono text-white/45">
                        {app.category}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {app.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/60 group-hover:text-white">
                    <span>Launch Tool</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* =====================================================================
            4. ENGINEERING BLUEPRINT & PRODUCTION CODE INSPECTOR
           ===================================================================== */}
        <motion.div variants={itemVariants} className="space-y-6 pt-4 border-t border-white/10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-mono text-white/40">
                Production Code Verification · Full-Stack Architecture
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-light text-white tracking-tight">
                Engineering Blueprints & Core Algorithms
              </h2>
            </div>

            {/* Module Selector Tabs */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-[#0c0c0c] border border-white/10 rounded-xs self-start">
              {BLUEPRINT_MODULES.map((mod) => {
                const isSelected = mod.id === activeBlueprint.id;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setActiveBlueprintId(mod.id)}
                    className={`px-3 py-1.5 text-xs font-mono rounded-2xs transition-colors cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-white text-black font-semibold'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {mod.index}. {mod.language}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#0b0b0b] border border-white/10 rounded-sm p-5 sm:p-6">
            {/* Blueprint Context Left Column */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="text-xs font-mono text-emerald-400">
                  {activeBlueprint.index} · {activeBlueprint.language} Module
                </div>
                <h3 className="text-xl font-medium text-white">
                  {activeBlueprint.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {activeBlueprint.description}
                </p>
                <div className="pt-2 border-t border-white/10 text-xs font-mono text-white/50">
                  {activeBlueprint.metrics}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate(activeBlueprint.miniAppTarget)}
                  className="min-h-[40px] px-4 py-2 bg-white text-black hover:bg-white/90 text-xs font-mono font-bold uppercase tracking-wider rounded-xs transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Live Interactive Module</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyBlueprintCode}
                  className="min-h-[40px] px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono text-white/80 hover:text-white rounded-xs transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied Snippet</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Code Viewport Right Column */}
            <div className="lg:col-span-7 bg-[#050505] border border-white/10 rounded-xs overflow-hidden flex flex-col">
              <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between text-xs font-mono text-white/50 bg-[#080808]">
                <span className="flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{activeBlueprint.filePath}</span>
                </span>
                <span>UTF-8 · {activeBlueprint.language}</span>
              </div>
              <pre className="p-4 text-xs font-mono text-gray-300 overflow-x-auto leading-relaxed">
                <code>{activeBlueprint.code}</code>
              </pre>
            </div>
          </div>
        </motion.div>

        {/* =====================================================================
            5. INSTITUTIONAL PARTNERSHIP MARQUEE & LIVE SYSTEM TELEMETRY
           ===================================================================== */}
        <motion.div variants={itemVariants} className="pt-2">
          <PartnershipMarquee onNavigate={onNavigate} />
        </motion.div>

        <motion.div variants={itemVariants} className="pt-2">
          <HeroTelemetry />
        </motion.div>
      </motion.div>

      {/* =====================================================================
          MODAL 1: SYSTEM ARCHITECTURE CASE STUDY INSPECTOR
         ===================================================================== */}
      <AnimatePresence>
        {activeCaseStudy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveCaseStudy(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0a0a0a] border border-white/20 rounded-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6"
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <div className="text-xs font-mono text-emerald-400">
                    {activeCaseStudy.index}. {activeCaseStudy.categoryLabel} · {activeCaseStudy.metricValue} {activeCaseStudy.metricLabel}
                  </div>
                  <h3 className="text-2xl font-display font-light text-white">
                    {activeCaseStudy.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveCaseStudy(null)}
                  className="p-2 text-white/50 hover:text-white border border-white/10 hover:border-white/30 rounded-xs transition-colors cursor-pointer"
                  aria-label="Close Architecture Inspector"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-gray-300 leading-relaxed">
                {activeCaseStudy.summary}
              </p>

              {/* 3-Tier Architecture Flow */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-white/50">
                  Three-Tier System Architecture
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-[#050505] border border-white/10 rounded-xs space-y-1">
                    <div className="text-[11px] font-mono text-emerald-400">01. Client Layer</div>
                    <p className="text-xs text-white/80 leading-relaxed">{activeCaseStudy.architecture.client}</p>
                  </div>
                  <div className="p-3.5 bg-[#050505] border border-white/10 rounded-xs space-y-1">
                    <div className="text-[11px] font-mono text-cyan-400">02. Core Engine</div>
                    <p className="text-xs text-white/80 leading-relaxed">{activeCaseStudy.architecture.engine}</p>
                  </div>
                  <div className="p-3.5 bg-[#050505] border border-white/10 rounded-xs space-y-1">
                    <div className="text-[11px] font-mono text-amber-400">03. Data & Protocol</div>
                    <p className="text-xs text-white/80 leading-relaxed">{activeCaseStudy.architecture.storage}</p>
                  </div>
                </div>
              </div>

              {/* Key Engineering Deliverables */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-mono uppercase tracking-wider text-white/50">
                  Key Production Capabilities
                </h4>
                <ul className="space-y-2 text-xs text-gray-300 font-mono">
                  {activeCaseStudy.deliverables.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="text-emerald-400 mt-0.5">→</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const target = activeCaseStudy.miniAppTarget;
                    setActiveCaseStudy(null);
                    onNavigate(target);
                  }}
                  className="min-h-[42px] px-5 py-2 bg-white text-black hover:bg-white/90 text-xs font-mono font-bold uppercase tracking-wider rounded-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{activeCaseStudy.miniAppLabel}</span>
                </button>

                <div className="flex items-center gap-3">
                  <a
                    href={activeCaseStudy.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[42px] px-4 py-2 border border-white/15 hover:border-white/30 text-xs font-mono text-white/80 hover:text-white rounded-xs transition-colors flex items-center gap-2"
                  >
                    <span>External Reference</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setActiveCaseStudy(null)}
                    className="min-h-[42px] px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-mono text-white/70 hover:text-white rounded-xs transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================================
          MODAL 2: QUICK COMMAND PALETTE (⌘K / Ctrl+K)
         ===================================================================== */}
      <AnimatePresence>
        {isCommandOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCommandOpen(false)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4"
          >
            <motion.div
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0b0b0b] border border-white/20 rounded-sm max-w-xl w-full overflow-hidden shadow-2xl"
            >
              <div className="p-3.5 border-b border-white/10 flex items-center gap-3">
                <Search className="w-4 h-4 text-emerald-400 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={commandQuery}
                  onChange={(e) => setCommandQuery(e.target.value)}
                  placeholder="Type a command, MiniApp name, or section (e.g. drop, libcode, cv)..."
                  className="flex-1 bg-transparent text-xs font-mono text-white outline-none placeholder:text-white/35"
                />
                <button
                  type="button"
                  onClick={() => setIsCommandOpen(false)}
                  className="px-2 py-1 text-[10px] font-mono text-white/50 hover:text-white border border-white/10 rounded-2xs cursor-pointer"
                >
                  ESC
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-white/5 p-1.5">
                {filteredCommands.length === 0 ? (
                  <div className="p-6 text-center text-xs font-mono text-white/40">
                    No matching commands or tools found for "{commandQuery}".
                  </div>
                ) : (
                  filteredCommands.map((cmd) => (
                    <button
                      key={cmd.id}
                      type="button"
                      onClick={() => {
                        setIsCommandOpen(false);
                        setCommandQuery('');
                        cmd.action();
                      }}
                      className="w-full px-3.5 py-2.5 hover:bg-white/[0.06] text-left rounded-2xs transition-colors flex items-center justify-between gap-4 cursor-pointer group"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-mono text-white group-hover:text-emerald-300 transition-colors">
                          {cmd.title}
                        </div>
                        <div className="text-[10px] font-mono text-white/40">
                          {cmd.category}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-white/40 group-hover:text-white tabular-nums">
                        {cmd.shortcut} →
                      </span>
                    </button>
                  ))
                )}
              </div>

              <div className="px-4 py-2 bg-[#060606] border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-white/40">
                <span>Press ESC to close</span>
                <span>DZt Quick Command Launcher</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
