import { Project, Skill, Collaboration } from './types';

export const AMAL_INFO = {
  name: 'Amal K P',
  title: 'BCA Candidate & Founder of DZt',
  tagline: 'Building high-performance web applications, intuitive interfaces & scalable digital platforms.',
  location: 'Balagram, Idukki, Kerala, India',
  email: 'amalkochuparambilp@gmail.com',
  phone: '+91 7510211318',
  linkedin: 'https://linkedin.com/in/amalkochuparambilp',
  github: 'https://github.com/amalkp',
  summary: 'BCA candidate at Jawaharlal Nehru Institute of Arts and Science (JNIAS) with strong technical expertise in React, Python, Django, PHP, MySQL, and modern web architectures. Founder and Lead at DZt digital platform, developer of LibCode JNIAS, Co-operative Bank Exam Portal, and Hrdiya health analytics application.',
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
    githubUrl: 'https://github.com/amalkp/libcode-jnias',
    featured: true
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
    featured: true
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
    featured: true
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
    featured: false
  }
];

export const SKILLS: Skill[] = [
  { name: 'React', level: 90, category: 'Frontend', icon: 'Code2' },
  { name: 'PHP', level: 85, category: 'Backend', icon: 'Server' },
  { name: 'Python', level: 88, category: 'Backend', icon: 'Terminal' },
  { name: 'Django', level: 85, category: 'Backend', icon: 'Database' },
  { name: 'SQLite / MySQL', level: 82, category: 'Backend', icon: 'HardDrive' },
  { name: 'JavaScript / TS', level: 88, category: 'Frontend', icon: 'Cpu' },
  { name: 'Tailwind CSS', level: 92, category: 'Frontend', icon: 'Layout' },
  { name: 'Computer Literacy', level: 95, category: 'Core & Tools', icon: 'Monitor' },
  { name: 'Git & Version Control', level: 85, category: 'Core & Tools', icon: 'GitBranch' },
  { name: 'Team Work & Collaboration', level: 95, category: 'Professional', icon: 'Users' },
  { name: 'System Architecture', level: 80, category: 'Core & Tools', icon: 'Layers' },
  { name: 'UI/UX Design', level: 86, category: 'Frontend', icon: 'Palette' }
];

export const ECOSYSTEM_NODES = [
  { id: 'libcode-node', name: 'LibCode JNIAS Core', status: 'ACTIVE', type: 'Library Engine', latency: '3ms' },
  { id: 'bankexam-node', name: 'Co-op Bank Exam Portal', status: 'ONLINE', type: 'Exam Engine', latency: '4ms' },
  { id: 'hrdiya-node', name: 'Hrdiya Health Analytics', status: 'OPERATIONAL', type: 'Django Hub', latency: '5ms' },
  { id: 'dzt-core', name: 'DZt Platform Kernel', status: 'READY', type: 'Interface', latency: '1ms' }
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
    tags: ['Library Management', 'JNIAS', 'PHP / MySQL', 'Barcode Scanning', 'System Automation']
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
    tags: ['Bank Recruitment', 'PHP / MySQL', 'Exam Automation', 'Auto Grading', 'Security Audit']
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
    tags: ['Python', 'Django', 'Healthcare Tech', 'Cardiac Risk Analysis', 'SQLite']
  }
];
