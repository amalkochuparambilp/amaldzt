export interface Project {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  category: 'web' | 'mobile' | 'system' | 'design';
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
  category: 'Frontend' | 'Backend' | 'Design' | 'Tools';
  icon: string; // lucide icon name
}

export interface TerminalCommand {
  command: string;
  description: string;
  usage?: string;
}

export interface TerminalLog {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'system';
  text: string;
  timestamp: string;
}
