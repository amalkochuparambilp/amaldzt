import { Project, Skill } from './types';

export const AMAL_INFO = {
  name: 'Amal K P',
  title: 'BCA Student & Lead UI Developer',
  college: 'JNIAS, Balagram',
  location: 'Kerala, India',
  bio: 'A passionate developer who enjoys building responsive, high-fidelity user interfaces with fluid animations. Founder and lead engineer of the DZt ecosystem.',
  tagline: 'Symmetry. Simplicity. Speed.',
  email: 'amalkochuparambilp@gmail.com',
  github: 'https://github.com', // Placeholder or standard github link
  linkedin: 'https://linkedin.com',
  resumeFileName: 'Amal_K_P_Resume.pdf'
};

export const PROJECTS: Project[] = [
  {
    id: 'dzt-os',
    title: 'DZt OS Terminal',
    description: 'A fully interactive web-based console environment built with React and Tailwind, simulating a custom Unix-like developer workspace.',
    longDescription: 'DZt OS is the interactive console layer of the DZt ecosystem. It features simulated file system navigation, command histories, system configuration adjustments, a hacking matrix visualizer, and customizable terminal colors. Engineered with TypeScript for high-reliability command evaluation.',
    category: 'system',
    tech: ['React', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
    features: [
      'Interactive command shell with autocomplete',
      'Dynamic folder navigation and file reading',
      'Fully customizable neon and retro themes',
      'Interactive matrix digital rain script'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&q=80&w=800',
    githubUrl: '#',
    liveUrl: '#',
    featured: true
  },
  {
    id: 'symmetry-ui',
    title: 'Symmetry Component Engine',
    description: 'A micro-library of high-contrast, accessibility-oriented React components with motion interactions baked into the core.',
    longDescription: 'Symmetry UI provides dark-themed, sleek user interface elements optimized for speed and fluidity. Built on top of Tailwind CSS and motion/react, it offers lightweight alternatives to bulky UI toolkits, targeting rapid mockups and portfolio-level projects.',
    category: 'web',
    tech: ['React', 'Tailwind CSS', 'Motion', 'Vite'],
    features: [
      '100% responsive responsive layouts out-of-the-box',
      'Glow-ambient styling helpers',
      'High accessibility (A11Y) focus rings and keyboard support',
      'Staggered entrance animations'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=800',
    githubUrl: '#',
    liveUrl: '#',
    featured: true
  },
  {
    id: 'jnias-campus-hub',
    title: 'JNIAS Academic Organizer',
    description: 'A custom student-centric organizer dashboard designed specifically for BCA students at JNIAS Balagram to manage schedules and assignments.',
    longDescription: 'Developed to address the day-to-day organizational needs of students at JNIAS, Balagram. This hub aggregates semester schedules, lecture notes, lab guides, and marks calculators in a highly sleek, off-grid dark interface.',
    category: 'web',
    tech: ['React', 'TypeScript', 'LocalStorage', 'Tailwind CSS'],
    features: [
      'Interactive semester schedule planner',
      'Lab record manager with code snippet copying',
      'BCA percentage & grade point average calculator',
      'Local draft system with auto-save'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800',
    githubUrl: '#',
    liveUrl: '#',
    featured: false
  },
  {
    id: 'dzt-sync-engine',
    title: 'DZt Local Sync Core',
    description: 'An offline-first browser database proxy that syncs client state to remote cloud storage with automatic conflict resolution.',
    longDescription: 'DZt Sync serves as the persistent data backbone for DZt web utilities. It transparently buffers database mutations in IndexedDB when offline, and synchronizes with Firestore or server endpoints once connectivity is restored, featuring a custom timestamp-based delta resolver.',
    category: 'system',
    tech: ['TypeScript', 'IndexedDB', 'WebSocket', 'Node.js'],
    features: [
      'Zero-dependency sync wrapper for web environments',
      'Interactive visual syncing state indicators',
      'Optimistic state updates for instant UI rendering',
      'Sub-10ms operational latency'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=800',
    githubUrl: '#',
    liveUrl: '#',
    featured: true
  },
  {
    id: 'vortex-metrics',
    title: 'Vortex Developer Dashboard',
    description: 'A dark, high-contrast dashboard displaying CPU, RAM, API response times, and pipeline statistics with smooth canvas graphs.',
    longDescription: 'Vortex provides real-time system visualization. It connects to server monitoring webhooks and renders interactive canvas-based performance charts, event timelines, and custom alerting thresholds tailored for micro-environments.',
    category: 'web',
    tech: ['React', 'D3.js', 'Vite', 'CSS Gradients'],
    features: [
      'Real-time streaming telemetry visualization',
      'Interactive filters and responsive zooming',
      'Exportable JSON metrics and CSV logging',
      'Ultra-dark cyberpunk theme aesthetics'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800',
    githubUrl: '#',
    liveUrl: '#',
    featured: false
  }
];

export const SKILLS: Skill[] = [
  // Frontend
  { name: 'React.js & Hooks', level: 92, category: 'Frontend', icon: 'Code2' },
  { name: 'TypeScript', level: 85, category: 'Frontend', icon: 'ShieldCheck' },
  { name: 'Tailwind CSS', level: 96, category: 'Frontend', icon: 'Palette' },
  { name: 'HTML5 & CSS3 Modern', level: 95, category: 'Frontend', icon: 'Layers' },
  { name: 'Motion (Framer)', level: 88, category: 'Frontend', icon: 'Sparkles' },

  // Backend
  { name: 'Node.js & Express', level: 80, category: 'Backend', icon: 'Server' },
  { name: 'REST APIs & WebSockets', level: 84, category: 'Backend', icon: 'Network' },
  { name: 'SQL Databases', level: 75, category: 'Backend', icon: 'Database' },
  { name: 'Python Scripting', level: 78, category: 'Backend', icon: 'Binary' },

  // Design & Tools
  { name: 'UI/UX Wireframing', level: 85, category: 'Design', icon: 'Framer' },
  { name: 'Git & GitHub Workflow', level: 90, category: 'Tools', icon: 'GitBranch' },
  { name: 'Vite & Build Tooling', level: 88, category: 'Tools', icon: 'Zap' },
  { name: 'Linux Commands & SSH', level: 82, category: 'Tools', icon: 'Terminal' }
];

export const DZT_ECOSYSTEM = {
  brand: 'DZt',
  tagline: 'The Autonomous Digital Ecosystem',
  description: 'An interconnected suite of software components, developer utilities, and user interfaces designed under a unified aesthetic of absolute minimalism, symmetry, and ultra-responsiveness. Built and designed from Balagram.',
  pillars: [
    {
      title: 'Symmetry',
      description: 'Interfaces aligned to strict geometric grids. Perfectly balanced margins, clean borders, and mathematically consistent scaling systems.',
      icon: 'Grid3X3'
    },
    {
      title: 'Simplicity',
      description: 'Stripping away decorative clutter. Focusing strictly on functional components, elegant layout hierarchies, and high-impact micro-animations.',
      icon: 'Square'
    },
    {
      title: 'Speed',
      description: 'Zero bloat, instant response. Light bundle sizes, GPU-accelerated motion rendering, and high-performance client state machines.',
      icon: 'Zap'
    }
  ]
};
