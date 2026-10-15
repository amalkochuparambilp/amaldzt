import { Project, Skill, Collaboration } from './types';

export const AMAL_INFO = {
  name: 'Amal K P',
  title: 'BCA Candidate & Founder of DZt',
  tagline: 'Building high-performance web applications, intuitive interfaces & scalable digital platforms.',
  location: 'Balagram, Idukki, Kerala, India',
  email: 'amalkochuparambilp@gmail.com',
  phone: '+91 7510211318',
  linkedin: 'https://linkedin.com/in/amalkochuparambilp',
  github: 'https://github.com/amalkochuparambilp',
  summary: 'BCA candidate at Jawaharlal Nehru Institute of Arts and Science (JNIAS) with strong technical expertise in React, Python, Django, PHP, MySQL, and modern web architectures. Founder and Lead at DZt digital platform, developer of LibCode JNIAS, Co-operative Bank Exam Portal, and Hrdiya health analytics application.',
  campusBadge: 'JNIAS BALAGRAM (BCA 2026)',
  ecosystemNode: 'BALAGRAM_NODE',
  resumeSummary: 'Recent BCA graduate seeking entry-level opportunity to apply foundational skills and grow professionally. Passionate developer specializing in high-performance user interfaces, Python/Django health analytics platforms, and co-operative bank portal solutions.',
  aboutBioParagraph1: 'I am a passionate software developer and Founder/Lead at DZt, currently pursuing my Bachelor of Computer Application (BCA) degree at Jawaharlal Nehru Institute of Arts and Science (JNIAS) in Balagram, Idukki.',
  aboutBioParagraph2: 'My technical expertise bridges full-stack application development, database design, and creative media. I specialize in building robust web applications with React, TypeScript, Python, Django, PHP, and MySQL. From engineering specialized college management software to crafting AI-assisted health diagnostic platforms, my goal is to deliver clean, scalable, and high-impact digital solutions.',
  education: {
    degree: 'Bachelor of Computer Application (BCA)',
    institution: 'Jawaharlal Nehru Institute of Arts and Science (JNIAS)',
    location: 'Balagram, Idukki, Kerala',
    period: 'Mar 2026',
    status: 'Graduating Batch 2026'
  },
  skillsList: ['Team Work', 'Computer Literacy', 'PHP', 'React', 'Python', 'Django', 'SQLite', 'JavaScript', 'TypeScript', 'Tailwind CSS', 'Git', 'Node.js'],
  languages: ['English', 'Malayalam']
};

export const PROJECTS: Project[] = [
  {
    id: 'libcode-jnias',
    title: 'LibCode — JNIAS Library Software',
    description: 'All-in-one digital college library management software engineered for JNIAS with ISBN lookup, barcode inventory, and student borrow logs.',
    longDescription: 'LibCode JNIAS is a dedicated library automation platform deployed for Jawaharlal Nehru Institute of Arts and Science. It streamlines circulation desks with barcode scanning, automated book inventory cataloging, student membership tracking, and overdue fine management.',
    category: 'portal',
    tech: ['PHP', 'MySQL', 'JavaScript', 'Tailwind CSS', 'Barcode Scanning'],
    features: [
      'Automated ISBN book lookup & barcode cataloging',
      'Student membership ledger with real-time issue/return logs',
      'High-speed search engine across thousands of library records',
      'Admin analytics dashboard for circulation & fine tracking'
    ],
    githubUrl: 'https://jnias.com',
    published: true,
    featured: true,
    sortOrder: 0,
    highlightLabel: '01. LIBCODE JNIAS',
    highlightStack: 'PHP / MySQL'
  },
  {
    id: 'bank-exam-portal',
    title: 'Co-operative Bank Exam Portal',
    description: 'Complete online examination & testing portal engineered for Co-operative Bank with auto-grading, randomized question pools, and timing modules.',
    longDescription: 'A robust web application designed for conducting candidate recruitment and evaluation exams for Co-operative Banks. Built with PHP and MySQL, featuring timed assessment tests, randomized question randomization, instant auto-scoring, and secure candidate log audit trails.',
    category: 'system',
    tech: ['PHP', 'MySQL', 'JavaScript', 'HTML/CSS', 'Security Auditing'],
    features: [
      'Randomized question bank generator for leak-proof test papers',
      'Countdown timer engine with auto-submission on expiration',
      'Instant grading and score calculation algorithms',
      'Admin portal for candidate management, question creation, and score export'
    ],
    githubUrl: 'https://github.com/amalkp/co-operative-bank-exam-portal',
    published: true,
    featured: true,
    sortOrder: 1,
    highlightLabel: '02. BANK EXAM PORTAL',
    highlightStack: 'PHP / MySQL'
  },
  {
    id: 'hrdiya-health-analysis',
    title: 'Hrdiya — Cardiac Risk Analysis Platform',
    description: 'Web application built with Python & Django to analyze heart disease risk parameters and consult cardiologists directly.',
    longDescription: 'Hrdiya is a healthcare diagnostic & consultation platform developed in Python and Django. It evaluates key physiological risk factors (blood pressure, cholesterol, ECG indicators) using medical assessment logic, offering user risk stratification and direct communication channels with cardiologists.',
    category: 'django',
    tech: ['Python', 'Django', 'SQLite', 'React', 'Tailwind CSS'],
    features: [
      'Automated cardiac risk calculation engine based on clinical parameters',
      'Patient health metric logging & historical trend visualization',
      'Direct message & consultation request routing to cardiologists',
      'Responsive patient portal and admin medical record panel'
    ],
    githubUrl: 'https://github.com/amalkp/hrdiya-health-analysis',
    published: true,
    featured: true,
    sortOrder: 2,
    highlightLabel: '03. HRDIYA HEALTH',
    highlightStack: 'Python / Django'
  },
  {
    id: 'gemini-watermark-remover',
    title: 'Gemini & Veo Watermark Remover',
    description: '100% client-side mathematical reverse-alpha watermark remover for Google Gemini, Nano Banana, Flow, and Veo 3 images and videos.',
    longDescription: 'Integrated client-side media unblending tool using exact mathematical reverse-alpha subtraction, multi-scale NCC + gradient edge auto-detection, live dual-zoomed ROI alignment, and WebCodecs H.264 MP4 muxing with audio passthrough.',
    category: 'web',
    tech: ['TypeScript', 'Canvas 2D API', 'WebCodecs', 'MediaBunny', 'Reverse-Alpha Math'],
    features: [
      'Mathematical reverse-alpha pixel restoration with zero quality loss',
      'Fused multi-scale NCC & gradient edge watermark auto-detection',
      'Live interactive tuner with dual zoomed ROI comparison views',
      'WebCodecs hardware-accelerated Veo 3 & Google Flow MP4 video cleaning with audio preservation'
    ],
    githubUrl: 'https://github.com/ishara-madu/gemini-watermark-remover',
    liveUrl: '/apps?app=watermark',
    published: true,
    featured: true,
    sortOrder: 3,
    highlightLabel: '04. WATERMARK REMOVER',
    highlightStack: 'TypeScript / Canvas'
  },
  {
    id: 'dzt-developer-platform',
    title: 'DZt Developer Platform & Ecosystem',
    description: 'Modern developer suite, portfolio engine, and diagnostic console built for the DZt initiative.',
    longDescription: 'The central digital platform for DZt, featuring interactive live system diagnostics, developer CLI shell, portfolio showcases, and responsive web component design systems.',
    category: 'system',
    tech: ['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'Node.js'],
    features: [
      'Interactive CLI shell with command parser and typewriter output',
      'Real-time IP & network latency diagnostic telemetry',
      'High-contrast accessible dark theme design system'
    ],
    githubUrl: 'https://github.com/amalkp/dzt-platform',
    published: true,
    featured: false,
    sortOrder: 4,
    highlightLabel: '05. DZT PLATFORM',
    highlightStack: 'React / Vite'
  }
];

export const SKILLS: Skill[] = [
  { id: 'skill-1', name: 'React', level: 90, category: 'Frontend', icon: 'Code2', sortOrder: 0 },
  { id: 'skill-2', name: 'PHP', level: 85, category: 'Backend', icon: 'Server', sortOrder: 1 },
  { id: 'skill-3', name: 'Python', level: 88, category: 'Backend', icon: 'Terminal', sortOrder: 2 },
  { id: 'skill-4', name: 'Django', level: 85, category: 'Backend', icon: 'Database', sortOrder: 3 },
  { id: 'skill-5', name: 'SQLite / MySQL', level: 82, category: 'Backend', icon: 'HardDrive', sortOrder: 4 },
  { id: 'skill-6', name: 'JavaScript / TS', level: 88, category: 'Frontend', icon: 'Cpu', sortOrder: 5 },
  { id: 'skill-7', name: 'Tailwind CSS', level: 92, category: 'Frontend', icon: 'Layout', sortOrder: 6 },
  { id: 'skill-8', name: 'Computer Literacy', level: 95, category: 'Core & Tools', icon: 'Monitor', sortOrder: 7 },
  { id: 'skill-9', name: 'Git & Version Control', level: 85, category: 'Core & Tools', icon: 'GitBranch', sortOrder: 8 },
  { id: 'skill-10', name: 'Team Work & Collaboration', level: 95, category: 'Professional', icon: 'Users', sortOrder: 9 },
  { id: 'skill-11', name: 'System Architecture', level: 80, category: 'Core & Tools', icon: 'Layers', sortOrder: 10 },
  { id: 'skill-12', name: 'UI/UX Design', level: 86, category: 'Frontend', icon: 'Palette', sortOrder: 11 },
  { id: 'skill-13', name: 'Affinity', level: 89, category: 'Core & Tools', icon: 'Palette', sortOrder: 12 }
];

export const COLLABORATIONS: Collaboration[] = [
  {
    id: 'libcode-jnias',
    role: 'Lead Architect & Library Systems Engineer',
    organization: 'LibCode for JNIAS',
    badge: 'COLLEGE LIBRARY SOFTWARE',
    logoType: 'libcode',
    description: 'Designed and deployed LibCode, an all-in-one digital college library management software platform built specifically for Jawaharlal Nehru Institute of Arts and Science (JNIAS).',
    highlights: [
      'Automated book cataloging, ISBN lookup, and barcode inventory management',
      'Student membership tracking, borrow/return logs & overdue fine calculator',
      'High-throughput search engine for fast library book discovery',
      'Admin analytics dashboard for library usage and book circulation statistics'
    ],
    tags: ['Library Management', 'JNIAS', 'PHP / MySQL', 'Barcode Scanning', 'System Automation'],
    sortOrder: 0
  },
  {
    id: 'coop-bank-portal',
    role: 'Lead Developer & Examination Systems Specialist',
    organization: 'Co-operative Bank Exam Portal',
    badge: 'EXAMINATION & TESTING PLATFORM',
    logoType: 'bank',
    description: 'Engineered a secure online candidate evaluation and exam portal for Co-operative Bank recruitment drives.',
    highlights: [
      'Randomized question pool generation and auto-grading algorithms',
      'Timed assessment engine with automatic submission safeguard',
      'Candidate verification, score audit trails, and result export options',
      'High-concurrency PHP & MySQL database architecture'
    ],
    tags: ['Bank Recruitment', 'PHP / MySQL', 'Exam Automation', 'Auto Grading', 'Security Audit'],
    sortOrder: 1
  },
  {
    id: 'hrdiya-health',
    role: 'Full-Stack Python & Django Developer',
    organization: 'Hrdiya Cardiac Risk Platform',
    badge: 'HEALTHCARE ANALYTICS',
    logoType: 'hrdiya',
    description: 'Developed Hrdiya, a Python Django web application for evaluating cardiac health risk factors and connecting patients with cardiologists.',
    highlights: [
      'Algorithmic assessment of physiological health metrics',
      'Historical health metric logs and user trend visualization',
      'Doctor appointment and consultation message routing',
      'Secure healthcare data handling and responsive user dashboard'
    ],
    tags: ['Python', 'Django', 'Healthcare Tech', 'Cardiac Risk Analysis', 'SQLite'],
    sortOrder: 2
  }
];

export const PARTNER_LOGOS = [
  { id: 'logo-openai', name: 'OPENAI', src: '/logos/openai-wordmark-dark.svg', alt: 'OpenAI Logo', fileName: 'openai-wordmark-dark.svg', active: true, sortOrder: 0 },
  { id: 'logo-axis-bank', name: 'AXIS BANK', src: '/logos/axis-bank.svg', alt: 'Axis Bank Logo', fileName: 'axis-bank.svg', active: true, sortOrder: 1 },
  { id: 'logo-shopify', name: 'SHOPIFY', src: '/logos/shopify.svg', alt: 'Shopify Logo', fileName: 'shopify.svg', active: true, sortOrder: 2 },
  { id: 'logo-nss', name: 'NSS', src: '/logos/new-nss-seeklogo.png', alt: 'National Service Scheme', fileName: 'new-nss-seeklogo.png', active: true, sortOrder: 3 },
  { id: 'logo-uxbjxoi', name: 'PARTNER LOGO', src: '/logos/idUxbjXOi-_logos.svg', alt: 'Partner Logo', fileName: 'idUxbjXOi-_logos.svg', active: true, sortOrder: 4 },
  { id: 'logo-hf5lcjo', name: 'TECH PARTNER', src: '/logos/idhf5lcjoR_1789676848779.svg', alt: 'Tech Partner Logo', fileName: 'idhf5lcjoR_1789676848779.svg', active: true, sortOrder: 5 },
  { id: 'logo-jps0yq', name: 'CLOUD ECOSYSTEM', src: '/logos/idJPs0Yq7Y_1789677081540.svg', alt: 'Cloud Ecosystem Logo', fileName: 'idJPs0Yq7Y_1789677081540.svg', active: true, sortOrder: 6 },
  { id: 'logo-jsce-imz', name: 'DZT NETWORK', src: '/logos/idJsCe_Imz_1789677158066.png', alt: 'DZt Network Logo', fileName: 'idJsCe_Imz_1789677158066.png', active: true, sortOrder: 7 }
];
