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
}

export interface Skill {
  name: string;
  level: number; // 0 to 100
  category: 'Frontend' | 'Backend' | 'Core & Tools' | 'Professional';
  icon: string;
}

export interface Collaboration {
  id: string;
  role: string;
  organization: string;
  badge: string;
  logoType: 'libcode' | 'hgema' | 'medialoom';
  description: string;
  highlights: string[];
  tags: string[];
}
