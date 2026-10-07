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

export interface NavItemConfig {
  id: 'home' | 'about' | 'collaborate' | 'projects' | 'skills' | 'resume' | 'apps' | 'contact';
  label: string;
  visible: boolean;
}

export interface SiteSettingsData {
  showHeroMarquee: boolean;
  showHeroTelemetry: boolean;
  showHeroHighlights: boolean;
  showBatteryTracker: boolean;
  announcementActive: boolean;
  announcementText: string;
  announcementLinkText: string;
  announcementLinkTarget: string;
  navConfig: NavItemConfig[];
}

export interface SeoSettingsData {
  title: string;
  description: string;
  keywords: string;
  canonicalUrl: string;
  ogImage: string;
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

export interface KnowledgeRelationshipItem {
  id: string;
  type: string | string[];
  name: string;
  alternateName?: string[];
  url?: string;
  status: 'confirmed' | 'pending' | 'archived';
}

export interface KnowledgeLayerData {
  schema_version: string;
  entity: {
    id: string;
    '@type': string;
    name: string;
    alternateName: string[];
    url: string;
    jobTitle: string;
    description: string;
    public_profiles: { platform: string; url: string }[];
  };
  relationships: KnowledgeRelationshipItem[];
  relationship_policy: string;
  official_sources: { type: string; url: string }[];
  last_updated: string;
}

export interface ContactSubmissionItem {
  id: string;
  name: string;
  email: string;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  telegramDelivered: boolean;
  ipAddress?: string;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  section: string;
  summary: string;
  timestamp: string;
}

export interface CMSState {
  profile: SiteProfileData;
  settings: SiteSettingsData;
  seo: SeoSettingsData;
  projects: Project[];
  skills: Skill[];
  collaborations: Collaboration[];
  logos: PartnerLogoItem[];
  knowledge: KnowledgeLayerData;
  messages: ContactSubmissionItem[];
  auditLogs: AuditLogItem[];
  lastUpdated: string;
}
