import { CMSState } from '../types';
import { AMAL_INFO, PROJECTS, SKILLS, COLLABORATIONS } from '../data';

export const DEFAULT_CMS_STATE: CMSState = {
  profile: {
    name: AMAL_INFO.name,
    title: AMAL_INFO.title,
    tagline: AMAL_INFO.tagline,
    heroHeadingLine1: 'Crafting digital',
    heroHeadingItalic: 'ecosystems',
    heroHeadingLine2: 'with precision & purpose.',
    heroBio:
      "Founder & Lead of DZt. A full-stack developer and BCA candidate passionate about building high-performance web systems, intuitive interfaces, and scalable digital platforms.",
    availabilityText: 'AVAILABLE FOR COLLABORATIONS',
    availabilityActive: true,
    campusBadge: 'JNIAS BALAGRAM (BCA 2026)',
    founderBadge: 'Founder / Lead @ DZt',
    location: AMAL_INFO.location,
    email: AMAL_INFO.email,
    phone: AMAL_INFO.phone,
    linkedin: AMAL_INFO.linkedin,
    github: AMAL_INFO.github,
    summary: AMAL_INFO.summary,
    resumeSummary:
      'Recent BCA graduate seeking entry-level opportunity to apply foundational skills and grow professionally. Passionate developer specializing in high-performance user interfaces, Python/Django health analytics platforms, and co-operative bank portal solutions.',
    aboutBioParagraph1:
      'I am a passionate software developer and Founder/Lead at DZt, currently pursuing my Bachelor of Computer Application (BCA) degree at Jawaharlal Nehru Institute of Arts and Science (JNIAS) in Balagram, Idukki.',
    aboutBioParagraph2:
      'My technical expertise bridges full-stack application development, database design, and creative media. I specialize in building robust web applications with React, TypeScript, Python, Django, PHP, and MySQL. From engineering specialized college management software to crafting AI-assisted health diagnostic platforms, my goal is to deliver clean, scalable, and high-impact digital solutions.',
    education: {
      ...AMAL_INFO.education
    },
    skillsList: [...AMAL_INFO.skillsList],
    languages: [...AMAL_INFO.languages],
    ecosystemNode: 'BALAGRAM_NODE',
    buildVersion: 'STABLE_BUILD_v2.0'
  },
  settings: {
    showHeroMarquee: true,
    showHeroTelemetry: true,
    showHeroHighlights: true,
    showBatteryTracker: true,
    announcementActive: false,
    announcementText: 'DZt Ecosystem v2.5 Released — Explore P2P Encrypted File Sharing & Live MiniApps',
    announcementLinkText: 'Launch MiniApps',
    announcementLinkTarget: 'apps',
    navConfig: [
      { id: 'home', label: 'Home', visible: true },
      { id: 'about', label: 'About', visible: true },
      { id: 'collaborate', label: 'Collaborate', visible: true },
      { id: 'projects', label: 'Projects', visible: true },
      { id: 'skills', label: 'Skills', visible: true },
      { id: 'resume', label: 'Resume', visible: true },
      { id: 'apps', label: 'DZt MiniApp', visible: true },
      { id: 'contact', label: 'Contact', visible: true }
    ]
  },
  seo: {
    title: 'Amal K P | Full-Stack Developer & DZt Founder',
    description:
      "Official portfolio and software ecosystem of Amal K P — Full-Stack Developer, Founder of DZt, and BCA '26 at JNIAS Balagram, Kerala. Creator of LibCode JNIAS, Co-operative Bank Exam Portal, and P2P WebRTC DZt MiniApps.",
    keywords:
      'Amal K P, DZt, DZt Ecosystem, DZt Drop, LibCode JNIAS, Co-operative Bank Exam Portal, Hrdiya, Full Stack Developer Kerala, React Developer India, Python Django Developer, WebRTC P2P Developer, BCA JNIAS, Balagram Idukki',
    canonicalUrl: 'https://amalkp.online/',
    ogImage: 'https://amalkp.online/logos/openai-wordmark-dark.svg'
  },
  projects: PROJECTS.map((p, index) => ({
    ...p,
    published: true,
    sortOrder: index,
    highlightLabel:
      p.id === 'libcode-jnias'
        ? '01. LIBCODE JNIAS'
        : p.id === 'bank-exam-portal'
          ? '02. BANK EXAM PORTAL'
          : p.id === 'hrdiya-health-analysis'
            ? '03. HRDIYA HEALTH'
            : `0${index + 1}. ${p.title.toUpperCase().slice(0, 18)}`,
    highlightStack:
      p.id === 'hrdiya-health-analysis' ? 'Python / Django' : 'PHP / MySQL'
  })),
  skills: SKILLS.map((s, index) => ({
    ...s,
    id: `skill-${index + 1}-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    sortOrder: index
  })),
  collaborations: COLLABORATIONS.map((c, index) => ({
    ...c,
    sortOrder: index
  })),
  logos: [
    {
      id: 'logo-openai',
      name: 'OPENAI',
      src: '/logos/openai-wordmark-dark.svg',
      alt: 'OpenAI Logo',
      fileName: 'openai-wordmark-dark.svg',
      active: true,
      sortOrder: 0
    },
    {
      id: 'logo-axis-bank',
      name: 'AXIS BANK',
      src: '/logos/axis-bank.svg',
      alt: 'Axis Bank Logo',
      fileName: 'axis-bank.svg',
      active: true,
      sortOrder: 1
    },
    {
      id: 'logo-shopify',
      name: 'SHOPIFY',
      src: '/logos/shopify.svg',
      alt: 'Shopify Logo',
      fileName: 'shopify.svg',
      active: true,
      sortOrder: 2
    },
    {
      id: 'logo-nss',
      name: 'NSS',
      src: '/logos/new-nss-seeklogo.png',
      alt: 'National Service Scheme',
      fileName: 'new-nss-seeklogo.png',
      active: true,
      sortOrder: 3
    },
    {
      id: 'logo-uxbjxoi',
      name: 'PARTNER LOGO',
      src: '/logos/idUxbjXOi-_logos.svg',
      alt: 'Partner Logo',
      fileName: 'idUxbjXOi-_logos.svg',
      active: true,
      sortOrder: 4
    },
    {
      id: 'logo-hf5lcjo',
      name: 'TECH PARTNER',
      src: '/logos/idhf5lcjoR_1789676848779.svg',
      alt: 'Tech Partner Logo',
      fileName: 'idhf5lcjoR_1789676848779.svg',
      active: true,
      sortOrder: 5
    },
    {
      id: 'logo-jps0yq',
      name: 'CLOUD ECOSYSTEM',
      src: '/logos/idJPs0Yq7Y_1789677081540.svg',
      alt: 'Cloud Ecosystem Logo',
      fileName: 'idJPs0Yq7Y_1789677081540.svg',
      active: true,
      sortOrder: 6
    },
    {
      id: 'logo-jsce-imz',
      name: 'DZT NETWORK',
      src: '/logos/idJsCe_Imz_1789677158066.png',
      alt: 'DZt Network Logo',
      fileName: 'idJsCe_Imz_1789677158066.png',
      active: true,
      sortOrder: 7
    }
  ],
  knowledge: {
    schema_version: '1.0',
    entity: {
      id: 'https://amalkp.online/#amal-k-p',
      '@type': 'Person',
      name: 'Amal K P',
      alternateName: ['Amal KP', 'amalkp'],
      url: 'https://amalkp.online/',
      jobTitle: 'Full-Stack Developer and Founder of DZt',
      description: 'Full-stack developer and BCA candidate based in Idukki, Kerala, India.',
      public_profiles: [
        {
          platform: 'GitHub',
          url: 'https://github.com/amalkochuparambilp'
        },
        {
          platform: 'LinkedIn',
          url: 'https://linkedin.com/in/amalkochuparambilp'
        }
      ]
    },
    relationships: [
      {
        id: 'relationship-adhithya-k-p',
        type: 'brother',
        name: 'Adhithya K P',
        url: 'https://instagram.com/4dth.__._',
        status: 'confirmed'
      },
      {
        id: 'relationship-diya',
        type: ['friend', 'non_blood_sister'],
        name: 'Diya',
        url: 'https://instagram.com/diiiyyhhh_',
        status: 'confirmed'
      },
      {
        id: 'relationship-vandana-udayan',
        type: ['friend', 'non_blood_sister'],
        name: 'Vandana Udayan',
        url: 'https://instagram.com/vandana_udayan',
        status: 'confirmed'
      },
      {
        id: 'relationship-vrunda',
        type: 'best_friend',
        name: 'Vrunda',
        url: 'https://instagram.com/its_me_jayasree__',
        status: 'confirmed'
      },
      {
        id: 'relationship-arya-latheesh',
        type: 'best_friend',
        name: 'Arya Latheesh',
        url: 'https://instagram.com/s__aryaaaaa',
        status: 'confirmed'
      },
      {
        id: 'relationship-sivah',
        type: 'best_friend',
        name: 'Sivah',
        url: 'https://instagram.com/ft.Sivah',
        status: 'confirmed'
      },
      {
        id: 'relationship-joel-joy',
        type: 'best_friend',
        name: 'Joel Joy',
        alternateName: ['JoKuttan'],
        url: 'https://instagram.com/_joeljoy_',
        status: 'confirmed'
      }
    ],
    relationship_policy: 'Only relationships explicitly added here with status confirmed are published.',
    official_sources: [
      {
        type: 'personal_website',
        url: 'https://amalkp.online/'
      },
      {
        type: 'GitHub_profile',
        url: 'https://github.com/amalkochuparambilp'
      },
      {
        type: 'LinkedIn_profile',
        url: 'https://linkedin.com/in/amalkochuparambilp'
      }
    ],
    last_updated: '2026-10-06T00:00:00Z'
  },
  messages: [
    {
      id: 'msg-initial-1',
      name: 'JNIAS Library Department',
      email: 'library@jnias.com',
      message: 'LibCode barcode circulation module is running smoothly across the main campus desk. Looking forward to the v2.2 analytics report export.',
      status: 'read',
      telegramDelivered: true,
      ipAddress: '103.142.118.14',
      createdAt: '2026-10-04T09:30:00Z'
    }
  ],
  auditLogs: [
    {
      id: 'log-init-1',
      action: 'SYSTEM_BOOT',
      section: 'Database Engine',
      summary: 'Initialized DZt Full-Control CMS Engine with Prisma PostgreSQL schema & synchronized site records.',
      timestamp: '2026-10-06T13:50:00Z'
    }
  ],
  lastUpdated: new Date().toISOString()
};
