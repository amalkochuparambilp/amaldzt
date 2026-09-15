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
  logoType: 'libcode' | 'bank' | 'hrdiya' | 'hgema' | 'medialoom';
  description: string;
  highlights: string[];
  tags: string[];
}

export interface VCPeer {
  id: string;
  name: string;
  stream?: MediaStream;
  connectionState: RTCPeerConnectionState | 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';
  isAudioMuted?: boolean;
  isVideoMuted?: boolean;
  isScreenSharing?: boolean;
  isHandRaised?: boolean;
  audioLevel?: number;
  joinedAt?: number;
}

export interface VCChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSelf: boolean;
}

export interface VCReaction {
  id: string;
  senderName: string;
  emoji: string;
  x: number;
}

export interface MediaDeviceInfoOption {
  deviceId: string;
  label: string;
}

