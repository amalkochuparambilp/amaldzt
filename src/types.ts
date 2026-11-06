export interface Project {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  category: 'web' | 'django' | 'system' | 'portal';
  tech: string[];
  features?: string[];
  imageUrl?: string;
  githubUrl?: string;
  liveUrl?: string;
  featured?: boolean;
  published?: boolean;
  highlightLabel?: string;
  highlightStack?: string;
  sortOrder?: number;
}

export interface Skill {
  id?: string;
  name: string;
  level: number; // 0 to 100
  category: 'Frontend' | 'Backend' | 'Core & Tools' | 'Professional';
  icon: string;
  sortOrder?: number;
}

export interface Collaboration {
  id: string;
  role: string;
  organization: string;
  badge: string;
  logoType: 'libcode' | 'bank' | 'hrdiya' | 'hgema' | 'medialoom';
  description: string;
  highlights: string[];
  tags: string[];
  sortOrder?: number;
}

export interface VCChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSelf: boolean;
}

export interface SiteProfileData {
  name: string;
  title: string;
  tagline: string;
  heroHeadingLine1: string;
  heroHeadingItalic: string;
  heroHeadingLine2: string;
  heroBio: string;
  availabilityText: string;
  availabilityActive: boolean;
  campusBadge: string;
  founderBadge: string;
  location: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  summary: string;
  resumeSummary: string;
  aboutBioParagraph1: string;
  aboutBioParagraph2: string;
  education: {
    degree: string;
    institution: string;
    location: string;
    period: string;
    status: string;
  };
  skillsList: string[];
  languages: string[];
  ecosystemNode: string;
  buildVersion: string;
}

export interface PartnerLogoItem {
  id: string;
  name: string;
  src: string;
  alt: string;
  fileName: string;
  active: boolean;
  sortOrder: number;
}
