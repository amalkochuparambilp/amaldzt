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
  summary: 'BCA candidate at Jawaharlal Nehru Institute of Arts and Science (JNIAS) with strong technical expertise in React, Python, Django, PHP, and modern web architectures. Founder and Lead at DZt digital ecosystem, developer of LibCode JNIAS, cybersecurity content designer, and visual lead for MediaLoom news channel.',
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
    id: 'hgema-exploit-visualizer',
    title: 'Hgema Exploit Security Visualizer',
    description: 'Interactive security research tool providing a clear visual breakdown of hgema exploit attack vectors, memory payloads, and mitigation guides.',
    longDescription: 'Designed for cybersecurity educational research, this platform transforms complex hgema exploit vectors into step-by-step visual infographics and animated memory buffer diagrams for technical audiences and threat analysts.',
    category: 'system',
    tech: ['React', 'TypeScript', 'Tailwind CSS', 'Cybersecurity', 'Canvas'],
    features: [
      'Interactive memory buffer allocation & payload simulation',
      'Step-by-step visual exploit attack tree breakdown',
      'Security patch verification & mitigation checklist export',
      'High-contrast threat analysis documentation layout'
    ],
    githubUrl: 'https://github.com/amalkp/hgema-exploit-visualizer',
    featured: true
  },
  {
    id: 'medialoom-broadcast-suite',
    title: 'MediaLoom Broadcast & Design Suite',
    description: 'Digital media design and broadcast workflow hub powering high-CTR YouTube thumbnails, news banners, and media automation for MediaLoom channel.',
    longDescription: 'A tailored web design suite built for MediaLoom news channel workflows. Features asset management, automated lower-third graphics generation, thumbnail contrast auditing, and YouTube publishing template pipelines.',
    category: 'django',
    tech: ['Python', 'Django', 'React', 'Tailwind CSS', 'Canvas API'],
    features: [
      'High-CTR news thumbnail generator with live preview',
      'MediaLoom brand asset vault and lower-thirds overlay suite',
      'Typographic contrast & readability compliance checking',
      'Multi-format export for YouTube and social media publishing'
    ],
    githubUrl: 'https://github.com/amalkp/medialoom-broadcast-suite',
    featured: true
  },
  {
    id: 'dzt-terminal-shell',
    title: 'DZt Command Terminal Shell',
    description: 'Lightweight web-based developer console and ecosystem diagnostic dashboard built for the DZt initiative.',
    longDescription: 'An interactive browser terminal interface providing rapid dev environment tools, system health monitoring, and modular UI component debugging.',
    category: 'system',
    tech: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js'],
    features: [
      'Browser command-line interface with custom command parsers',
      'Real-time system node latency monitor',
      'Keyboard-navigable developer workbench'
    ],
    githubUrl: 'https://github.com/amalkp/dzt-terminal-shell',
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
  { id: 'hgema-node', name: 'Hgema Exploit Visualizer', status: 'ONLINE', type: 'Security Engine', latency: '6ms' },
  { id: 'medialoom-node', name: 'MediaLoom Broadcast Suite', status: 'OPERATIONAL', type: 'Media Hub', latency: '5ms' },
  { id: 'dzt-core', name: 'DZt Command Kernel', status: 'READY', type: 'Interface', latency: '1ms' }
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
    id: 'creative-content-hgema',
    role: 'Creative Content Designer & Security Explainer Visualist',
    organization: 'Creative Content Design — Hgema Exploit Analysis',
    badge: 'SECURITY & TECH GRAPHICS',
    logoType: 'hgema',
    description: 'Specialized in creating high-impact technical visual assets, infographic diagrams, and vulnerability breakdown graphics explaining the hgema exploit mechanics.',
    highlights: [
      'Simple, highly accessible visual breakdown of the hgema exploit attack vectors & memory payloads',
      'Created step-by-step security patch guides and threat model diagrams',
      'Designed technical social media visual cards & community security advisories',
      'Combined cybersecurity research with modern graphic communication'
    ],
    tags: ['Cybersecurity Graphics', 'Hgema Exploit Breakdown', 'Infographic Design', 'Visual Explainer']
  },
  {
    id: 'yt-graphic-medialoom',
    role: 'YT Graphic Designer & Visual Branding Lead',
    organization: 'MediaLoom News Channel',
    badge: 'NEWS BROADCAST MEDIA',
    logoType: 'medialoom',
    description: 'Lead YouTube Graphic Designer for MediaLoom, an influential digital news channel. Responsible for high-CTR YouTube thumbnails, broadcast overlays, and news branding identity.',
    highlights: [
      'Crafted 100+ high-CTR news YouTube thumbnails optimized for mobile and desktop feeds',
      'Designed news broadcast lower-thirds, headline banners, and breaking news graphics',
      'Maintained consistent visual style guidelines across MediaLoom digital publishing channels',
      'Boosted audience engagement through bold typographic hierarchy and news art direction'
    ],
    tags: ['MediaLoom News', 'YouTube Thumbnails', 'Broadcast Graphics', 'Visual Identity', 'News Media']
  }
];
