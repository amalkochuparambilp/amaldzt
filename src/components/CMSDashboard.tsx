import React, { useState, useEffect, useRef } from 'react';
import { useCMS } from '../context/CMSContext';
import CMSDatabaseSection from './CMSDatabaseSection';
import {
  Project,
  Skill,
  Collaboration,
  KnowledgeRelationshipItem,
  NavItemConfig
} from '../types';
import {
  generatePostgresSqlDump
} from '../cms/prismaGenerators';
import {
  LayoutDashboard,
  UserCheck,
  Layers,
  Cpu,
  Handshake,
  Image as ImageIcon,
  Inbox,
  Globe,
  Sliders,
  Database,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Copy,
  Download,
  Upload,
  RotateCcw,
  ExternalLink,
  Search,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Save,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Mail,
  FileCode,
  HardDrive,
  ShieldCheck,
  KeyRound,
  LogOut
} from 'lucide-react';

type CMSSection =
  | 'overview'
  | 'profile'
  | 'projects'
  | 'skills'
  | 'collaborations'
  | 'logos'
  | 'inbox'
  | 'knowledge'
  | 'layout'
  | 'database';

interface CMSDashboardProps {
  onExitToSite: (tab?: string) => void;
}

export default function CMSDashboard({ onExitToSite }: CMSDashboardProps) {
  const {
    cms,
    saving,
    authLoading,
    isAuthenticated,
    adminUser,
    adminEmailHint,
    envMetadata,
    login,
    changePassword,
    logout,
    updateProfile,
    updateSettings,
    createProject,
    updateProject,
    deleteProject,
    reorderProjects,
    createSkill,
    updateSkill,
    deleteSkill,
    createCollaboration,
    updateCollaboration,
    deleteCollaboration,
    createLogo,
    updateLogo,
    deleteLogo,
    updateKnowledge,
    updateMessageStatus,
    deleteMessage,
    importSnapshot,
    factoryReset
  } = useCMS();

  const [activeSection, setActiveSection] = useState<CMSSection>('overview');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [emailInput, setEmailInput] = useState<string>('');
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [showPasscode, setShowPasscode] = useState<boolean>(false);
  const [authSubmitting, setAuthSubmitting] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const notify = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 3200);
  };

  // ==========================================================================
  // 1. PROFILE FORM STATE
  // ==========================================================================
  const [profileDraft, setProfileDraft] = useState(() => structuredClone(cms.profile));
  const [skillsListInput, setSkillsListInput] = useState(() => cms.profile.skillsList.join(', '));
  const [languagesInput, setLanguagesInput] = useState(() => cms.profile.languages.join(', '));

  const syncProfileDraft = () => {
    setProfileDraft(structuredClone(cms.profile));
    setSkillsListInput(cms.profile.skillsList.join(', '));
    setLanguagesInput(cms.profile.languages.join(', '));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSkillsList = skillsListInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const updatedLanguages = languagesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const ok = await updateProfile({
      ...profileDraft,
      skillsList: updatedSkillsList,
      languages: updatedLanguages
    });
    if (ok) {
      notify('Profile, Hero & About content saved and published live.');
    } else {
      notify('Failed to update profile.', 'error');
    }
  };

  // ==========================================================================
  // 2. PROJECTS MANAGER STATE
  // ==========================================================================
  const [projectSearch, setProjectSearch] = useState('');
  const [projectCatFilter, setProjectCatFilter] = useState<string>('all');
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [isNewProject, setIsNewProject] = useState(false);
  const [projTechInput, setProjTechInput] = useState('');
  const [projFeaturesInput, setProjFeaturesInput] = useState('');
  const [confirmDeleteProjId, setConfirmDeleteProjId] = useState<string | null>(null);

  const openNewProjectModal = () => {
    setIsNewProject(true);
    setEditingProject({
      id: '',
      title: '',
      description: '',
      longDescription: '',
      category: 'system',
      tech: ['React', 'TypeScript', 'Tailwind CSS'],
      features: ['High-concurrency architecture', 'Real-time analytics dashboard'],
      githubUrl: 'https://github.com/amalkochuparambilp',
      liveUrl: '',
      featured: true,
      published: true,
      highlightLabel: `0${cms.projects.length + 1}. NEW SYSTEM`,
      highlightStack: 'React / TypeScript'
    });
    setProjTechInput('React, TypeScript, Tailwind CSS');
    setProjFeaturesInput('High-concurrency architecture\nReal-time analytics dashboard');
  };

  const openEditProjectModal = (proj: Project) => {
    setIsNewProject(false);
    setEditingProject({ ...proj });
    setProjTechInput((proj.tech || []).join(', '));
    setProjFeaturesInput((proj.features || []).join('\n'));
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editingProject.title?.trim()) {
      notify('Project title is required.', 'error');
      return;
    }
    const payload: Partial<Project> = {
      ...editingProject,
      tech: projTechInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      features: projFeaturesInput
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean)
    };

    const ok = isNewProject
      ? await createProject(payload)
      : await updateProject(editingProject.id!, payload);

    if (ok) {
      notify(isNewProject ? `Created project "${payload.title}"` : `Updated project "${payload.title}"`);
      setEditingProject(null);
    } else {
      notify('Error saving project.', 'error');
    }
  };

  const handleMoveProject = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= cms.projects.length) return;
    const copy = [...cms.projects];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    const ok = await reorderProjects(copy);
    if (ok) notify('Project sequence updated.');
  };

  // ==========================================================================
  // 3. SKILLS MANAGER STATE
  // ==========================================================================
  const [skillCategoryFilter, setSkillCategoryFilter] = useState<string>('All');
  const [newSkill, setNewSkill] = useState<Partial<Skill>>({
    name: '',
    level: 88,
    category: 'Frontend',
    icon: 'Code2'
  });
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [editingSkillDraft, setEditingSkillDraft] = useState<Partial<Skill>>({});

  const availableIcons = [
    'Code2',
    'Server',
    'Terminal',
    'Database',
    'HardDrive',
    'Cpu',
    'Layout',
    'Monitor',
    'GitBranch',
    'Users',
    'Layers',
    'Palette',
    'ShieldCheck',
    'Globe',
    'Zap'
  ];

  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.name?.trim()) {
      notify('Enter a skill name.', 'error');
      return;
    }
    const ok = await createSkill(newSkill);
    if (ok) {
      notify(`Added competency "${newSkill.name}"`);
      setNewSkill({ name: '', level: 88, category: 'Frontend', icon: 'Code2' });
    }
  };

  // ==========================================================================
  // 4. COLLABORATIONS MANAGER STATE
  // ==========================================================================
  const [editingCollab, setEditingCollab] = useState<Partial<Collaboration> | null>(null);
  const [isNewCollab, setIsNewCollab] = useState(false);
  const [collabHighlightsInput, setCollabHighlightsInput] = useState('');
  const [collabTagsInput, setCollabTagsInput] = useState('');

  const openNewCollabModal = () => {
    setIsNewCollab(true);
    setEditingCollab({
      id: '',
      organization: '',
      role: 'Lead Systems Architect',
      badge: 'INSTITUTIONAL PARTNER',
      logoType: 'libcode',
      description: '',
      highlights: [],
      tags: []
    });
    setCollabHighlightsInput('Designed full-stack architecture\nAutomated workflow pipelines');
    setCollabTagsInput('Full-Stack, System Automation, Architecture');
  };

  const openEditCollabModal = (collab: Collaboration) => {
    setIsNewCollab(false);
    setEditingCollab({ ...collab });
    setCollabHighlightsInput((collab.highlights || []).join('\n'));
    setCollabTagsInput((collab.tags || []).join(', '));
  };

  const handleSaveCollab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCollab || !editingCollab.organization?.trim()) {
      notify('Organization name is required.', 'error');
      return;
    }
    const payload: Partial<Collaboration> = {
      ...editingCollab,
      highlights: collabHighlightsInput
        .split('\n')
        .map((h) => h.trim())
        .filter(Boolean),
      tags: collabTagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    };
    const ok = isNewCollab
      ? await createCollaboration(payload)
      : await updateCollaboration(editingCollab.id!, payload);
    if (ok) {
      notify(isNewCollab ? 'Added collaboration entry.' : 'Updated collaboration entry.');
      setEditingCollab(null);
    }
  };

  // ==========================================================================
  // 5. LOGOS & MARQUEE MANAGER STATE
  // ==========================================================================
  const [newLogoName, setNewLogoName] = useState('');
  const [newLogoSrc, setNewLogoSrc] = useState('');
  const [newLogoBase64, setNewLogoBase64] = useState<string | undefined>(undefined);
  const [newLogoFileName, setNewLogoFileName] = useState<string | undefined>(undefined);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewLogoFileName(file.name);
    if (!newLogoName) {
      setNewLogoName(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').toUpperCase());
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewLogoBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogoName.trim()) {
      notify('Partner name is required.', 'error');
      return;
    }
    if (!newLogoSrc.trim() && !newLogoBase64) {
      notify('Provide an image URL or upload an image file.', 'error');
      return;
    }
    const ok = await createLogo({
      name: newLogoName.trim(),
      src: newLogoSrc.trim() || undefined,
      fileName: newLogoFileName,
      base64Data: newLogoBase64,
      alt: `${newLogoName.trim()} Logo`
    });
    if (ok) {
      notify(`Added partner logo "${newLogoName.toUpperCase()}" to marquee.`);
      setNewLogoName('');
      setNewLogoSrc('');
      setNewLogoBase64(undefined);
      setNewLogoFileName(undefined);
      if (logoFileInputRef.current) logoFileInputRef.current.value = '';
    }
  };

  // ==========================================================================
  // 6. INBOX MESSAGES FILTER STATE
  // ==========================================================================
  const [inboxFilter, setInboxFilter] = useState<'all' | 'unread' | 'read' | 'replied' | 'archived'>('all');

  // ==========================================================================
  // 7. KNOWLEDGE LAYER & SEO STATE
  // ==========================================================================
  const [seoDraft, setSeoDraft] = useState(() => structuredClone(cms.seo));
  const [newRel, setNewRel] = useState<{
    name: string;
    type: string;
    url: string;
    status: 'confirmed' | 'pending';
  }>({
    name: '',
    type: 'best_friend',
    url: 'https://instagram.com/',
    status: 'confirmed'
  });

  const handleAddRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRel.name.trim()) {
      notify('Relationship person name is required.', 'error');
      return;
    }
    const types = newRel.type.includes(',')
      ? newRel.type
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : newRel.type.trim();
    const item: KnowledgeRelationshipItem = {
      id: `relationship-${newRel.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-3)}`,
      name: newRel.name.trim(),
      type: types,
      url: newRel.url.trim() || undefined,
      status: newRel.status
    };
    const nextRelationships = [...cms.knowledge.relationships, item];
    const ok = await updateKnowledge({
      ...cms.knowledge,
      relationships: nextRelationships
    });
    if (ok) {
      notify(`Added "${item.name}" to public/ai/profile.json`);
      setNewRel({ name: '', type: 'best_friend', url: 'https://instagram.com/', status: 'confirmed' });
    }
  };

  const handleRemoveRelationship = async (id: string) => {
    const nextRelationships = cms.knowledge.relationships.filter((r) => r.id !== id);
    const ok = await updateKnowledge({
      ...cms.knowledge,
      relationships: nextRelationships
    });
    if (ok) {
      notify('Removed relationship and synced public/ai/profile.json');
    }
  };

  const handleSaveSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await updateSettings({ seo: seoDraft });
    if (ok) {
      notify('SEO & OpenGraph metadata updated across the site.');
    }
  };

  // ==========================================================================
  // 8. LAYOUT & NAVIGATION SETTINGS STATE
  // ==========================================================================
  const [settingsDraft, setSettingsDraft] = useState(() => structuredClone(cms.settings));

  const syncAllDrafts = () => {
    setProfileDraft(structuredClone(cms.profile));
    setSkillsListInput(cms.profile.skillsList.join(', '));
    setLanguagesInput(cms.profile.languages.join(', '));
    setSettingsDraft(structuredClone(cms.settings));
    setSeoDraft(structuredClone(cms.seo));
  };

  useEffect(() => {
    setProfileDraft(structuredClone(cms.profile));
    setSkillsListInput(cms.profile.skillsList.join(', '));
    setLanguagesInput(cms.profile.languages.join(', '));
  }, [cms.profile]);

  useEffect(() => {
    setSettingsDraft(structuredClone(cms.settings));
  }, [cms.settings]);

  useEffect(() => {
    setSeoDraft(structuredClone(cms.seo));
  }, [cms.seo]);

  const handleToggleNavVisibility = (id: NavItemConfig['id']) => {
    setSettingsDraft((prev) => ({
      ...prev,
      navConfig: prev.navConfig.map((item) =>
        item.id === id ? { ...item, visible: !item.visible } : item
      )
    }));
  };

  const handleNavLabelChange = (id: NavItemConfig['id'], label: string) => {
    setSettingsDraft((prev) => ({
      ...prev,
      navConfig: prev.navConfig.map((item) => (item.id === id ? { ...item, label } : item))
    }));
  };

  const handleSaveLayoutSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await updateSettings({ settings: settingsDraft });
    if (ok) {
      notify('Site layout, navigation & announcement settings saved to PostgreSQL.');
    }
  };

  const handleDownloadFile = (filename: string, content: string, mime = 'text/plain') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify(`Downloaded ${filename}`);
  };

  if (authLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#050505]">
        <div className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-white tracking-tight">Admin Sign In</h2>
            <p className="text-xs text-white/45">Enter your credentials to access the dashboard.</p>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setAuthSubmitting(true);
              setAuthError(null);
              const res = await login(emailInput, passcodeInput);
              setAuthSubmitting(false);
              if (res.success) {
                setAuthError(null);
                setPasscodeInput('');
              } else {
                setAuthError(res.error || 'Invalid email or password.');
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-xs text-white/70 block">Email</label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="name@example.com"
                autoComplete="username"
                className="w-full bg-black border border-white/15 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/50 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-white/70 block">Password</label>
              <div className="relative">
                <input
                  type={showPasscode ? 'text' : 'password'}
                  required
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-black border border-white/15 px-3 py-2.5 pr-9 text-sm text-white focus:outline-none focus:border-white/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authError && (
              <p className="text-xs text-rose-400">{authError}</p>
            )}

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full py-2.5 bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              {authSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="pt-2 border-t border-white/10 text-center">
            <button
              type="button"
              onClick={() => onExitToSite('home')}
              className="text-xs text-white/45 hover:text-white transition-colors cursor-pointer"
            >
              ← Back to website
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalDbRecords =
    2 +
    cms.projects.length +
    cms.skills.length +
    cms.collaborations.length +
    cms.logos.length +
    cms.knowledge.relationships.length +
    cms.messages.length;

  const sidebarItems: { id: CMSSection; label: string; icon: any; count?: number }[] = [
    { id: 'overview', label: 'Overview & Activity', icon: LayoutDashboard },
    { id: 'database', label: 'Database', icon: Database, count: totalDbRecords },
    { id: 'profile', label: 'Identity, Hero & About', icon: UserCheck },
    { id: 'projects', label: 'Projects Manager', icon: Layers, count: cms.projects.length },
    { id: 'skills', label: 'Skills & Competencies', icon: Cpu, count: cms.skills.length },
    { id: 'collaborations', label: 'Collaborations', icon: Handshake, count: cms.collaborations.length },
    { id: 'logos', label: 'Partner Marquee Logos', icon: ImageIcon, count: cms.logos.length },
    {
      id: 'inbox',
      label: 'Contact Inbox (CRM)',
      icon: Inbox,
      count: cms.messages.filter((m) => m.status === 'unread').length
    },
    {
      id: 'knowledge',
      label: 'AI Knowledge & SEO',
      icon: Globe,
      count: cms.knowledge.relationships.length
    },
    { id: 'layout', label: 'Navigation & Layout', icon: Sliders }
  ];

  const unreadMessagesCount = cms.messages.filter((m) => m.status === 'unread').length;

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#050505] text-[#e0e0e0] flex flex-col lg:flex-row">
      {/* Left Workspace Sidebar (260px on Desktop) */}
      <aside className="w-full lg:w-64 xl:w-72 bg-[#0a0a0a] border-b lg:border-b-0 lg:border-r border-white/10 shrink-0 flex flex-col justify-between select-none">
        <div className="p-4 sm:p-5 space-y-5">
          {/* CMS Header Brand & Verified Admin Badge */}
          <div className="border-b border-white/10 pb-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                    DZt Admin CMS
                  </span>
                </div>
                <p className="text-[11px] font-mono text-white/40">
                  Prisma Postgres (.env Key) · v2.5
                </p>
              </div>
              <button
                onClick={async () => {
                  await logout();
                }}
                title="Sign Out & Lock CMS Console"
                className="px-2 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-white rounded-xs cursor-pointer transition-colors flex items-center gap-1 text-[10px] font-mono uppercase"
              >
                <LogOut className="w-3 h-3" />
                <span>Lock</span>
              </button>
            </div>

            <div className="p-2.5 bg-black border border-emerald-500/25 rounded-xs font-mono text-[10px] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  ADMIN VERIFIED
                </span>
                <span className="text-white/40">HMAC-SHA256</span>
              </div>
              <div className="text-white/80 truncate" title={adminUser?.email}>
                {adminUser?.email || 'amalkochuparambilp@gmail.com'}
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    if (item.id === 'profile') syncProfileDraft();
                    if (item.id === 'layout') setSettingsDraft(structuredClone(cms.settings));
                    if (item.id === 'knowledge') setSeoDraft(structuredClone(cms.seo));
                  }}
                  className={`px-3 py-2.5 text-xs font-mono flex items-center justify-between gap-2 rounded-xs transition-colors cursor-pointer text-left ${
                    isActive
                      ? 'bg-white text-black font-bold'
                      : 'text-white/65 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-black' : 'text-white/50'}`} />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {typeof item.count === 'number' && (
                    <span
                      className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded-2xs ${
                        isActive
                          ? 'bg-black/15 text-black font-bold'
                          : item.id === 'inbox' && item.count > 0
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'text-white/40'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Quick Actions */}
        <div className="p-4 sm:p-5 border-t border-white/10 space-y-2.5 hidden lg:block">
          <div className="text-[11px] font-mono text-white/40 flex items-center justify-between">
            <span>Last Synced</span>
            <span className="tabular-nums text-white/70">
              {new Date(cms.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
          <button
            onClick={() => onExitToSite('home')}
            className="w-full py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-mono flex items-center justify-center gap-2 rounded-xs transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Live Website</span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Contextual Top Bar */}
        <div className="bg-[#0a0a0a] border-b border-white/10 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-white/40">CMS Console</span>
            <span className="text-white/20">/</span>
            <span className="text-white font-semibold">
              {sidebarItems.find((i) => i.id === activeSection)?.label}
            </span>
            {saving && (
              <span className="ml-2 text-[11px] text-emerald-400 font-mono">
                · Saving changes...
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSection('database')}
              className={`px-3 py-1.5 border text-xs font-mono flex items-center gap-1.5 rounded-xs transition-colors cursor-pointer whitespace-nowrap ${
                activeSection === 'database'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                  : 'bg-white/5 hover:bg-white/10 border-white/15 text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Live Database</span>
            </button>
            <button
              onClick={() =>
                handleDownloadFile(
                  `dzt-cms-postgres-dump-${new Date().toISOString().slice(0, 10)}.sql`,
                  generatePostgresSqlDump(cms),
                  'application/sql'
                )
              }
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/15 text-white/80 hover:text-white text-xs font-mono flex items-center gap-1.5 rounded-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Postgres .SQL</span>
            </button>
            <button
              onClick={() => onExitToSite('home')}
              className="px-3.5 py-1.5 bg-white text-black hover:bg-neutral-200 text-xs font-mono font-bold flex items-center gap-1.5 rounded-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview Live Site</span>
            </button>
          </div>
        </div>

        {/* Toast Notification Banner */}
        {toast && (
          <div
            className={`mx-4 sm:mx-8 mt-4 p-3 border text-xs font-mono flex items-center justify-between rounded-xs ${
              toast.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{toast.text}</span>
            </div>
            <button onClick={() => setToast(null)} className="text-white/50 hover:text-white cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Active Section Body */}
        <div className="p-4 sm:p-8 max-w-6xl w-full space-y-8">
          {/* ================================================================
              SECTION 1: OVERVIEW & ACTIVITY
          ================================================================ */}
          {activeSection === 'overview' && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0d0d0d] border border-emerald-500/30 p-5">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                      Prisma PostgreSQL Connected via .env (DATABASE_URL)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-white/5 border border-white/15 text-white/70">
                      Admin: {adminUser?.email || 'amalkochuparambilp@gmail.com'}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    Administrator Content & Live Database Console
                  </h1>
                  <p className="text-xs text-white/50 font-sans">
                    Database key loaded securely from <code className="text-emerald-400 font-mono">.env (DATABASE_URL)</code>: <code className="text-white/70 font-mono">{envMetadata?.maskedUrl || 'postgres://••••••@pooled.db.prisma.io:5432/postgres?sslmode=require'}</code>
                  </p>
                </div>
                <button
                  onClick={() => setActiveSection('database')}
                  className="px-4 py-2.5 bg-emerald-400 text-black text-xs font-mono font-bold uppercase tracking-wider hover:bg-emerald-300 transition-colors flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <Database className="w-4 h-4" />
                  <span>Open Database & .env Studio</span>
                </button>
              </div>

              {/* High-Density Stat Grid (Tabular Numerals) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <button
                  onClick={() => setActiveSection('projects')}
                  className="p-4 bg-[#0d0d0d] border border-white/10 hover:border-white/30 text-left space-y-1 transition-colors cursor-pointer"
                >
                  <span className="text-[11px] font-mono text-white/40 block">Projects</span>
                  <span className="text-2xl font-mono font-bold text-white tabular-nums block">
                    {cms.projects.length}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 block">
                    {cms.projects.filter((p) => p.published !== false).length} Published
                  </span>
                </button>

                <button
                  onClick={() => setActiveSection('skills')}
                  className="p-4 bg-[#0d0d0d] border border-white/10 hover:border-white/30 text-left space-y-1 transition-colors cursor-pointer"
                >
                  <span className="text-[11px] font-mono text-white/40 block">Competencies</span>
                  <span className="text-2xl font-mono font-bold text-white tabular-nums block">
                    {cms.skills.length}
                  </span>
                  <span className="text-[11px] font-mono text-white/50 block">4 Categories</span>
                </button>

                <button
                  onClick={() => setActiveSection('collaborations')}
                  className="p-4 bg-[#0d0d0d] border border-white/10 hover:border-white/30 text-left space-y-1 transition-colors cursor-pointer"
                >
                  <span className="text-[11px] font-mono text-white/40 block">Collaborations</span>
                  <span className="text-2xl font-mono font-bold text-white tabular-nums block">
                    {cms.collaborations.length}
                  </span>
                  <span className="text-[11px] font-mono text-white/50 block">Active Roles</span>
                </button>

                <button
                  onClick={() => setActiveSection('logos')}
                  className="p-4 bg-[#0d0d0d] border border-white/10 hover:border-white/30 text-left space-y-1 transition-colors cursor-pointer"
                >
                  <span className="text-[11px] font-mono text-white/40 block">Partner Logos</span>
                  <span className="text-2xl font-mono font-bold text-white tabular-nums block">
                    {cms.logos.filter((l) => l.active !== false).length}
                  </span>
                  <span className="text-[11px] font-mono text-cyan-400 block">
                    of {cms.logos.length} Total
                  </span>
                </button>

                <button
                  onClick={() => setActiveSection('inbox')}
                  className="p-4 bg-[#0d0d0d] border border-white/10 hover:border-white/30 text-left space-y-1 transition-colors cursor-pointer"
                >
                  <span className="text-[11px] font-mono text-white/40 block">Contact Inbox</span>
                  <span className="text-2xl font-mono font-bold text-white tabular-nums block">
                    {cms.messages.length}
                  </span>
                  <span className="text-[11px] font-mono text-amber-400 block">
                    {unreadMessagesCount} Unread
                  </span>
                </button>

                <button
                  onClick={() => setActiveSection('knowledge')}
                  className="p-4 bg-[#0d0d0d] border border-white/10 hover:border-white/30 text-left space-y-1 transition-colors cursor-pointer"
                >
                  <span className="text-[11px] font-mono text-white/40 block">AI Knowledge</span>
                  <span className="text-2xl font-mono font-bold text-white tabular-nums block">
                    {cms.knowledge.relationships.length}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 block">Verified Graph</span>
                </button>
              </div>

              {/* Quick Global Announcement Banner Toggle */}
              <div className="bg-[#0d0d0d] border border-white/10 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      Global Site Announcement Banner
                    </h2>
                    <p className="text-xs text-white/50">
                      Broadcast a live announcement bar at the top of the portfolio website.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      const nextVal = !cms.settings.announcementActive;
                      await updateSettings({
                        settings: { ...cms.settings, announcementActive: nextVal }
                      });
                      notify(nextVal ? 'Announcement banner enabled on live site.' : 'Announcement banner hidden.');
                    }}
                    className={`px-4 py-2 text-xs font-mono font-bold rounded-xs cursor-pointer transition-colors ${
                      cms.settings.announcementActive
                        ? 'bg-emerald-500 text-black'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {cms.settings.announcementActive ? 'Banner: ACTIVE' : 'Banner: INACTIVE'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono items-end">
                  <div className="md:col-span-2">
                    <label className="text-[10px] text-white/40 uppercase block mb-1">Banner Message</label>
                    <input
                      type="text"
                      value={settingsDraft.announcementText}
                      onChange={(e) =>
                        setSettingsDraft({ ...settingsDraft, announcementText: e.target.value })
                      }
                      className="w-full bg-black border border-white/15 p-2.5 text-white focus:outline-none focus:border-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 uppercase block mb-1">Target Tab</label>
                    <select
                      value={settingsDraft.announcementLinkTarget}
                      onChange={(e) =>
                        setSettingsDraft({ ...settingsDraft, announcementLinkTarget: e.target.value })
                      }
                      className="w-full bg-black border border-white/15 p-2.5 text-white focus:outline-none focus:border-white"
                    >
                      <option value="projects">Projects</option>
                      <option value="apps">DZt MiniApps</option>
                      <option value="collaborate">Collaborate</option>
                      <option value="contact">Contact</option>
                      <option value="resume">Resume</option>
                    </select>
                  </div>
                  <button
                    onClick={async () => {
                      const ok = await updateSettings({ settings: settingsDraft });
                      if (ok) notify('Announcement banner saved to PostgreSQL.');
                    }}
                    className="py-2.5 px-4 bg-white text-black font-bold uppercase cursor-pointer hover:bg-neutral-200"
                  >
                    Save Banner
                  </button>
                </div>
              </div>

              {/* Recent Audit Logs Table */}
              <div className="bg-[#0d0d0d] border border-white/10">
                <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Recent CMS Mutation & Audit Log
                  </h2>
                  <span className="text-xs font-mono text-white/40 tabular-nums">
                    {cms.auditLogs.length} Events Recorded
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="border-b border-white/10 text-white/40 text-[11px]">
                        <th className="py-2.5 px-4">Timestamp</th>
                        <th className="py-2.5 px-4">Module</th>
                        <th className="py-2.5 px-4">Operation</th>
                        <th className="py-2.5 px-4">Summary</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {cms.auditLogs.slice(0, 10).map((log) => (
                        <tr key={log.id} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-4 text-white/50 tabular-nums whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString([], {
                              month: 'short',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </td>
                          <td className="py-2.5 px-4 text-white/80 whitespace-nowrap">{log.section}</td>
                          <td className="py-2.5 px-4 text-emerald-400 whitespace-nowrap">{log.action}</td>
                          <td className="py-2.5 px-4 text-white/70 font-sans">{log.summary}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              SECTION 2: IDENTITY, HERO & ABOUT
          ================================================================ */}
          {activeSection === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    Identity, Hero & About Content
                  </h1>
                  <p className="text-xs text-white/50">
                    Controls the Hero display headlines, badges, About section bio, Academic credentials, Resume summary, and Contact links.
                  </p>
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-white text-black text-xs font-mono font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Profile Changes</span>
                </button>
              </div>

              {/* Core Identity & Hero Section */}
              <div className="bg-[#0d0d0d] border border-white/10 p-6 space-y-5">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2">
                  01. Core Identity & Hero Headlines
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="space-y-1">
                    <label className="text-white/50 uppercase text-[10px] block">Full Name</label>
                    <input
                      type="text"
                      value={profileDraft.name}
                      onChange={(e) => setProfileDraft({ ...profileDraft, name: e.target.value })}
                      className="w-full bg-black border border-white/15 p-2.5 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-white/50 uppercase text-[10px] block">Primary Role / Title</label>
                    <input
                      type="text"
                      value={profileDraft.title}
                      onChange={(e) => setProfileDraft({ ...profileDraft, title: e.target.value })}
                      className="w-full bg-black border border-white/15 p-2.5 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="space-y-1">
                    <label className="text-white/50 uppercase text-[10px] block">Hero Headline Part 1</label>
                    <input
                      type="text"
                      value={profileDraft.heroHeadingLine1}
                      onChange={(e) => setProfileDraft({ ...profileDraft, heroHeadingLine1: e.target.value })}
                      className="w-full bg-black border border-white/15 p-2.5 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-white/50 uppercase text-[10px] block">Hero Italic Serif Word</label>
                    <input
                      type="text"
                      value={profileDraft.heroHeadingItalic}
                      onChange={(e) => setProfileDraft({ ...profileDraft, heroHeadingItalic: e.target.value })}
                      className="w-full bg-black border border-white/15 p-2.5 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-white/50 uppercase text-[10px] block">Hero Headline Line 2</label>
                    <input
                      type="text"
                      value={profileDraft.heroHeadingLine2}
                      onChange={(e) => setProfileDraft({ ...profileDraft, heroHeadingLine2: e.target.value })}
                      className="w-full bg-black border border-white/15 p-2.5 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-xs font-mono">
                  <label className="text-white/50 uppercase text-[10px] block">Hero Lead Paragraph</label>
                  <textarea
                    rows={2}
                    value={profileDraft.heroBio}
                    onChange={(e) => setProfileDraft({ ...profileDraft, heroBio: e.target.value })}
                    className="w-full bg-black border border-white/15 p-2.5 text-white font-sans text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="space-y-1">
                    <label className="text-white/50 uppercase text-[10px] block">Availability Status Text</label>
                    <input
                      type="text"
                      value={profileDraft.availabilityText}
                      onChange={(e) => setProfileDraft({ ...profileDraft, availabilityText: e.target.value })}
                      className="w-full bg-black border border-white/15 p-2.5 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-white/50 uppercase text-[10px] block">Campus Status Text</label>
                    <input
                      type="text"
                      value={profileDraft.campusBadge}
                      onChange={(e) => setProfileDraft({ ...profileDraft, campusBadge: e.target.value })}
                      className="w-full bg-black border border-white/15 p-2.5 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-white/50 uppercase text-[10px] block">Founder Tag Text</label>
                    <input
                      type="text"
                      value={profileDraft.founderBadge}
                      onChange={(e) => setProfileDraft({ ...profileDraft, founderBadge: e.target.value })}
                      className="w-full bg-black border border-white/15 p-2.5 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* About Bio & Resume Summary */}
              <div className="bg-[#0d0d0d] border border-white/10 p-6 space-y-5">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2">
                  02. About Page & Curriculum Vitae Narrative
                </h2>

                <div className="space-y-1 text-xs font-mono">
                  <label className="text-white/50 uppercase text-[10px] block">About Bio — Paragraph 1</label>
                  <textarea
                    rows={3}
                    value={profileDraft.aboutBioParagraph1}
                    onChange={(e) => setProfileDraft({ ...profileDraft, aboutBioParagraph1: e.target.value })}
                    className="w-full bg-black border border-white/15 p-2.5 text-white font-sans text-xs"
                  />
                </div>

                <div className="space-y-1 text-xs font-mono">
                  <label className="text-white/50 uppercase text-[10px] block">About Bio — Paragraph 2</label>
                  <textarea
                    rows={3}
                    value={profileDraft.aboutBioParagraph2}
                    onChange={(e) => setProfileDraft({ ...profileDraft, aboutBioParagraph2: e.target.value })}
                    className="w-full bg-black border border-white/15 p-2.5 text-white font-sans text-xs"
                  />
                </div>

                <div className="space-y-1 text-xs font-mono">
                  <label className="text-white/50 uppercase text-[10px] block">Resume / CV Formal Summary</label>
                  <textarea
                    rows={2}
                    value={profileDraft.resumeSummary}
                    onChange={(e) => setProfileDraft({ ...profileDraft, resumeSummary: e.target.value })}
                    className="w-full bg-black border border-white/15 p-2.5 text-white font-sans text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="space-y-1">
                    <label className="text-white/50 uppercase text-[10px] block">
                      Core Stack Overview Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={skillsListInput}
                      onChange={(e) => setSkillsListInput(e.target.value)}
                      className="w-full bg-black border border-white/15 p-2.5 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-white/50 uppercase text-[10px] block">
                      Spoken Languages (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={languagesInput}
                      onChange={(e) => setLanguagesInput(e.target.value)}
                      className="w-full bg-black border border-white/15 p-2.5 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Academic & Contact Channels */}
              <div className="bg-[#0d0d0d] border border-white/10 p-6 space-y-5">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2">
                  03. Academic Institution & Direct Contact Channels
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="space-y-1">
                    <label className="text-white/50 uppercase text-[10px] block">Degree Title</label>
                    <input
                      type="text"
                      value={profileDraft.education.degree}
                      onChange={(e) =>
                        setProfileDraft({
                          ...profileDraft,
                          education: { ...profileDraft.education, degree: e.target.value }
                        })
                      }
                      className="w-full bg-black border border-white/15 p-2.5 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-white/50 uppercase text-[10px] block">Institution Name</label>
                    <input
                      type="text"
                      value={profileDraft.education.institution}
                      onChange={(e) =>
                        setProfileDraft({
                          ...profileDraft,
                          education: { ...profileDraft.education, institution: e.target.value }
                        })
                      }
                      className="w-full bg-black border border-white/15 p-2.5 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-white/50 uppercase text-[10px] block">Graduation Period / Batch</label>
                    <input
                      type="text"
                      value={profileDraft.education.status}
                      onChange={(e) =>
                        setProfileDraft({
                          ...profileDraft,
                          education: { ...profileDraft.education, status: e.target.value }
                        })
                      }
                      className="w-full bg-black border border-white/15 p-2.5 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="space-y-1">
                    <label className="text-white/50 uppercase text-[10px] block">Email Address</label>
                    <input
                      type="email"
                      value={profileDraft.email}
                      onChange={(e) => setProfileDraft({ ...profileDraft, email: e.target.value })}
                      className="w-full bg-black border border-white/15 p-2.5 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-white/50 uppercase text-[10px] block">Phone Number</label>
                    <input
                      type="text"
                      value={profileDraft.phone}
                      onChange={(e) => setProfileDraft({ ...profileDraft, phone: e.target.value })}
                      className="w-full bg-black border border-white/15 p-2.5 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-white/50 uppercase text-[10px] block">Primary Location</label>
                    <input
                      type="text"
                      value={profileDraft.location}
                      onChange={(e) => setProfileDraft({ ...profileDraft, location: e.target.value })}
                      className="w-full bg-black border border-white/15 p-2.5 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-white/50 uppercase text-[10px] block">GitHub Profile URL</label>
                    <input
                      type="url"
                      value={profileDraft.github}
                      onChange={(e) => setProfileDraft({ ...profileDraft, github: e.target.value })}
                      className="w-full bg-black border border-white/15 p-2.5 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-white/50 uppercase text-[10px] block">LinkedIn Profile URL</label>
                    <input
                      type="url"
                      value={profileDraft.linkedin}
                      onChange={(e) => setProfileDraft({ ...profileDraft, linkedin: e.target.value })}
                      className="w-full bg-black border border-white/15 p-2.5 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-white/50 uppercase text-[10px] block">Footer Build Tag</label>
                    <input
                      type="text"
                      value={profileDraft.buildVersion}
                      onChange={(e) => setProfileDraft({ ...profileDraft, buildVersion: e.target.value })}
                      className="w-full bg-black border border-white/15 p-2.5 text-white"
                    />
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* ================================================================
              SECTION 3: PROJECTS MANAGER
          ================================================================ */}
          {activeSection === 'projects' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    Portfolio Projects Manager ({cms.projects.length})
                  </h1>
                  <p className="text-xs text-white/50">
                    Create, edit, reorder, or unpublish projects displayed across Hero, Projects, Resume, and AI Knowledge.
                  </p>
                </div>
                <button
                  onClick={openNewProjectModal}
                  className="px-4 py-2.5 bg-white text-black text-xs font-mono font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Project</span>
                </button>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                  {(['all', 'portal', 'system', 'django', 'web'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setProjectCatFilter(cat)}
                      className={`px-3 py-1.5 text-xs font-mono uppercase rounded-xs cursor-pointer transition-colors ${
                        projectCatFilter === cat
                          ? 'bg-white text-black font-bold'
                          : 'bg-[#0d0d0d] border border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    placeholder="Filter projects..."
                    className="w-full bg-[#0d0d0d] border border-white/15 pl-9 pr-3 py-1.5 text-xs font-mono text-white"
                  />
                </div>
              </div>

              {/* Project Editor Drawer / Panel */}
              {editingProject && (
                <form
                  onSubmit={handleSaveProject}
                  className="bg-[#0e0e0e] border border-white/25 p-6 space-y-5 rounded-xs"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="text-sm font-bold text-white uppercase font-mono">
                      {isNewProject ? 'Create New Portfolio Project' : `Editing: ${editingProject.title}`}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditingProject(null)}
                      className="text-white/50 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-white/50 uppercase text-[10px] block">Project Title *</label>
                      <input
                        type="text"
                        required
                        value={editingProject.title || ''}
                        onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                        className="w-full bg-black border border-white/20 p-2.5 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-white/50 uppercase text-[10px] block">Category</label>
                      <select
                        value={editingProject.category || 'system'}
                        onChange={(e) =>
                          setEditingProject({
                            ...editingProject,
                            category: e.target.value as Project['category']
                          })
                        }
                        className="w-full bg-black border border-white/20 p-2.5 text-white"
                      >
                        <option value="portal">portal</option>
                        <option value="system">system</option>
                        <option value="django">django</option>
                        <option value="web">web</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs font-mono">
                    <label className="text-white/50 uppercase text-[10px] block">Short Card Summary</label>
                    <textarea
                      rows={2}
                      value={editingProject.description || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                      className="w-full bg-black border border-white/20 p-2.5 text-white font-sans text-xs"
                    />
                  </div>

                  <div className="space-y-1 text-xs font-mono">
                    <label className="text-white/50 uppercase text-[10px] block">
                      Detailed Specification Description (Modal View)
                    </label>
                    <textarea
                      rows={3}
                      value={editingProject.longDescription || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, longDescription: e.target.value })}
                      className="w-full bg-black border border-white/20 p-2.5 text-white font-sans text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="space-y-1">
                      <label className="text-white/50 uppercase text-[10px] block">
                        Architecture Tech Stack (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={projTechInput}
                        onChange={(e) => setProjTechInput(e.target.value)}
                        placeholder="PHP, MySQL, React, Tailwind CSS"
                        className="w-full bg-black border border-white/20 p-2.5 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-white/50 uppercase text-[10px] block">Repository / Source URL</label>
                      <input
                        type="text"
                        value={editingProject.githubUrl || ''}
                        onChange={(e) => setEditingProject({ ...editingProject, githubUrl: e.target.value })}
                        className="w-full bg-black border border-white/20 p-2.5 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-xs font-mono">
                    <label className="text-white/50 uppercase text-[10px] block">
                      Key Functional Modules (one per line)
                    </label>
                    <textarea
                      rows={4}
                      value={projFeaturesInput}
                      onChange={(e) => setProjFeaturesInput(e.target.value)}
                      className="w-full bg-black border border-white/20 p-2.5 text-white font-mono text-xs"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/10 text-xs font-mono">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingProject.published !== false}
                          onChange={(e) =>
                            setEditingProject({ ...editingProject, published: e.target.checked })
                          }
                        />
                        <span className="text-white">Published on Site</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(editingProject.featured)}
                          onChange={(e) =>
                            setEditingProject({ ...editingProject, featured: e.target.checked })
                          }
                        />
                        <span className="text-emerald-400">Featured on Hero Strip</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingProject(null)}
                        className="px-4 py-2 bg-white/5 border border-white/15 text-white/70 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-white text-black font-bold uppercase tracking-wider hover:bg-neutral-200 cursor-pointer"
                      >
                        {isNewProject ? 'Create Project' : 'Save Project'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Projects Table / List */}
              <div className="space-y-3">
                {cms.projects
                  .filter((p) => {
                    const matchesCat = projectCatFilter === 'all' || p.category === projectCatFilter;
                    const matchesSearch =
                      p.title.toLowerCase().includes(projectSearch.toLowerCase()) ||
                      p.description.toLowerCase().includes(projectSearch.toLowerCase());
                    return matchesCat && matchesSearch;
                  })
                  .map((proj, index) => (
                    <div
                      key={proj.id}
                      className="bg-[#0d0d0d] border border-white/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/25 transition-colors"
                    >
                      <div className="space-y-1.5 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-white/50">
                          <span className="tabular-nums text-white/40">0{index + 1}</span>
                          <span>·</span>
                          <span className="uppercase">{proj.category}</span>
                          <span>·</span>
                          <span className={proj.published !== false ? 'text-emerald-400' : 'text-amber-400'}>
                            {proj.published !== false ? 'Published' : 'Draft'}
                          </span>
                          {proj.featured && (
                            <>
                              <span>·</span>
                              <span className="text-cyan-400">Hero Featured</span>
                            </>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-white">{proj.title}</h3>
                        <p className="text-xs text-white/60 font-sans line-clamp-2">{proj.description}</p>
                        <div className="text-[11px] font-mono text-white/40 pt-1">
                          {(proj.tech || []).join(' · ')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                        <button
                          onClick={() => handleMoveProject(index, 'up')}
                          disabled={index === 0}
                          title="Move Up"
                          className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveProject(index, 'down')}
                          disabled={index === cms.projects.length - 1}
                          title="Move Down"
                          className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditProjectModal(proj)}
                          className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        {confirmDeleteProjId === proj.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={async () => {
                                await deleteProject(proj.id);
                                setConfirmDeleteProjId(null);
                                notify(`Deleted project "${proj.title}"`);
                              }}
                              className="px-2.5 py-2 bg-rose-600 text-white font-bold cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeleteProjId(null)}
                              className="px-2 py-2 bg-white/10 text-white/70 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteProjId(proj.id)}
                            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 cursor-pointer"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ================================================================
              SECTION 4: SKILLS & COMPETENCIES
          ================================================================ */}
          {activeSection === 'skills' && (
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-4">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Technical & Professional Competencies ({cms.skills.length})
                </h1>
                <p className="text-xs text-white/50">
                  Add, edit, or adjust proficiency percentages for skills displayed in the Skills matrix.
                </p>
              </div>

              {/* Add New Skill Form */}
              <form
                onSubmit={handleCreateSkill}
                className="bg-[#0d0d0d] border border-white/10 p-5 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end text-xs font-mono"
              >
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] text-white/40 uppercase block">Skill / Technology Name</label>
                  <input
                    type="text"
                    value={newSkill.name || ''}
                    onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                    placeholder="e.g. PostgreSQL / Prisma"
                    className="w-full bg-black border border-white/15 p-2.5 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 uppercase block">Category</label>
                  <select
                    value={newSkill.category}
                    onChange={(e) =>
                      setNewSkill({ ...newSkill, category: e.target.value as Skill['category'] })
                    }
                    className="w-full bg-black border border-white/15 p-2.5 text-white"
                  >
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="Core & Tools">Core & Tools</option>
                    <option value="Professional">Professional</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 uppercase block">
                    Proficiency: <span className="text-white font-bold tabular-nums">{newSkill.level}%</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={newSkill.level || 85}
                    onChange={(e) => setNewSkill({ ...newSkill, level: Number(e.target.value) })}
                    className="w-full accent-white cursor-pointer"
                  />
                </div>
                <button
                  type="submit"
                  className="py-2.5 px-4 bg-white text-black font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Skill</span>
                </button>
              </form>

              {/* Category Filter Tabs */}
              <div className="flex flex-wrap gap-1.5">
                {(['All', 'Frontend', 'Backend', 'Core & Tools', 'Professional'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSkillCategoryFilter(cat)}
                    className={`px-3 py-1.5 text-xs font-mono rounded-xs cursor-pointer transition-colors ${
                      skillCategoryFilter === cat
                        ? 'bg-white text-black font-bold'
                        : 'bg-[#0d0d0d] border border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Skills Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cms.skills
                  .filter((s) => skillCategoryFilter === 'All' || s.category === skillCategoryFilter)
                  .map((skill) => {
                    const keyId = skill.id || skill.name;
                    const isEditing = editingSkillId === keyId;
                    return (
                      <div
                        key={keyId}
                        className="bg-[#0d0d0d] border border-white/10 p-4 flex flex-col justify-between gap-3"
                      >
                        {isEditing ? (
                          <div className="space-y-3 text-xs font-mono">
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={editingSkillDraft.name || ''}
                                onChange={(e) =>
                                  setEditingSkillDraft({ ...editingSkillDraft, name: e.target.value })
                                }
                                className="bg-black border border-white/20 p-2 text-white"
                              />
                              <select
                                value={editingSkillDraft.icon || 'Code2'}
                                onChange={(e) =>
                                  setEditingSkillDraft({ ...editingSkillDraft, icon: e.target.value })
                                }
                                className="bg-black border border-white/20 p-2 text-white"
                              >
                                {availableIcons.map((ic) => (
                                  <option key={ic} value={ic}>
                                    Icon: {ic}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-3">
                              <input
                                type="range"
                                min="10"
                                max="100"
                                value={editingSkillDraft.level ?? skill.level}
                                onChange={(e) =>
                                  setEditingSkillDraft({
                                    ...editingSkillDraft,
                                    level: Number(e.target.value)
                                  })
                                }
                                className="flex-1 accent-white"
                              />
                              <span className="tabular-nums text-white font-bold w-10 text-right">
                                {editingSkillDraft.level ?? skill.level}%
                              </span>
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingSkillId(null)}
                                className="px-3 py-1 bg-white/5 text-white/60 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={async () => {
                                  await updateSkill(keyId, editingSkillDraft);
                                  setEditingSkillId(null);
                                  notify(`Updated skill "${editingSkillDraft.name}"`);
                                }}
                                className="px-3 py-1 bg-white text-black font-bold cursor-pointer"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-sm font-bold text-white block">{skill.name}</span>
                                <span className="text-[11px] font-mono text-white/40">
                                  {skill.category} · Icon: {skill.icon}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono font-bold text-white tabular-nums">
                                  {skill.level}%
                                </span>
                                <button
                                  onClick={() => {
                                    setEditingSkillId(keyId);
                                    setEditingSkillDraft({ ...skill });
                                  }}
                                  className="p-1.5 bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 cursor-pointer"
                                  title="Edit Skill"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={async () => {
                                    await deleteSkill(keyId);
                                    notify(`Removed skill "${skill.name}"`);
                                  }}
                                  className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 cursor-pointer"
                                  title="Delete Skill"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="w-full h-1 bg-black overflow-hidden">
                              <div className="h-full bg-white" style={{ width: `${skill.level}%` }} />
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ================================================================
              SECTION 5: COLLABORATIONS & VOLUNTEERING
          ================================================================ */}
          {activeSection === 'collaborations' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    Collaborations & Institutional Volunteering ({cms.collaborations.length})
                  </h1>
                  <p className="text-xs text-white/50">
                    Manage organizations, roles, deliverables, and emblems shown on the Collaborate page.
                  </p>
                </div>
                <button
                  onClick={openNewCollabModal}
                  className="px-4 py-2.5 bg-white text-black text-xs font-mono font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Collaboration</span>
                </button>
              </div>

              {editingCollab && (
                <form
                  onSubmit={handleSaveCollab}
                  className="bg-[#0e0e0e] border border-white/25 p-6 space-y-4 text-xs font-mono"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="text-sm font-bold text-white uppercase">
                      {isNewCollab ? 'New Collaboration Record' : `Edit: ${editingCollab.organization}`}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditingCollab(null)}
                      className="text-white/50 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-white/40 uppercase block">Organization / Platform *</label>
                      <input
                        type="text"
                        required
                        value={editingCollab.organization || ''}
                        onChange={(e) =>
                          setEditingCollab({ ...editingCollab, organization: e.target.value })
                        }
                        className="w-full bg-black border border-white/20 p-2.5 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-white/40 uppercase block">Role Title</label>
                      <input
                        type="text"
                        value={editingCollab.role || ''}
                        onChange={(e) => setEditingCollab({ ...editingCollab, role: e.target.value })}
                        className="w-full bg-black border border-white/20 p-2.5 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-white/40 uppercase block">Domain Label</label>
                      <input
                        type="text"
                        value={editingCollab.badge || ''}
                        onChange={(e) => setEditingCollab({ ...editingCollab, badge: e.target.value })}
                        className="w-full bg-black border border-white/20 p-2.5 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-white/40 uppercase block">Emblem Style</label>
                      <select
                        value={editingCollab.logoType || 'libcode'}
                        onChange={(e) =>
                          setEditingCollab({
                            ...editingCollab,
                            logoType: e.target.value as Collaboration['logoType']
                          })
                        }
                        className="w-full bg-black border border-white/20 p-2.5 text-white"
                      >
                        <option value="libcode">LibCode Emblem (Blue)</option>
                        <option value="bank">Co-op Bank Emblem (Amber)</option>
                        <option value="hrdiya">Hrdiya Health Emblem (Cyan)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-white/40 uppercase block">Overview Description</label>
                    <textarea
                      rows={2}
                      value={editingCollab.description || ''}
                      onChange={(e) => setEditingCollab({ ...editingCollab, description: e.target.value })}
                      className="w-full bg-black border border-white/20 p-2.5 text-white font-sans"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-white/40 uppercase block">
                      Key Deliverables & Highlights (one per line)
                    </label>
                    <textarea
                      rows={4}
                      value={collabHighlightsInput}
                      onChange={(e) => setCollabHighlightsInput(e.target.value)}
                      className="w-full bg-black border border-white/20 p-2.5 text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-white/40 uppercase block">Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={collabTagsInput}
                      onChange={(e) => setCollabTagsInput(e.target.value)}
                      className="w-full bg-black border border-white/20 p-2.5 text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingCollab(null)}
                      className="px-4 py-2 bg-white/5 border border-white/15 text-white/70 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-white text-black font-bold uppercase cursor-pointer"
                    >
                      Save Collaboration
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cms.collaborations.map((collab) => (
                  <div
                    key={collab.id}
                    className="bg-[#0d0d0d] border border-white/10 p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono text-white/40 uppercase block">
                        {collab.badge}
                      </span>
                      <h3 className="text-base font-bold text-white">{collab.organization}</h3>
                      <p className="text-xs font-mono text-white/60">{collab.role}</p>
                      <p className="text-xs text-white/50 font-sans line-clamp-3">{collab.description}</p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs font-mono">
                      <button
                        onClick={() => openEditCollabModal(collab)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={async () => {
                          await deleteCollaboration(collab.id);
                          notify(`Deleted "${collab.organization}"`);
                        }}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================
              SECTION 6: PARTNER LOGOS & MARQUEE
          ================================================================ */}
          {activeSection === 'logos' && (
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-4">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Partnership Marquee Logos ({cms.logos.length})
                </h1>
                <p className="text-xs text-white/50">
                  Upload new partner SVG/PNG logos directly to `/public/logos/` or toggle visibility in the Hero dual-track marquee.
                </p>
              </div>

              {/* Upload / Add Partner Logo Form */}
              <form
                onSubmit={handleCreateLogo}
                className="bg-[#0d0d0d] border border-white/10 p-5 space-y-4 text-xs font-mono"
              >
                <h3 className="text-xs font-bold uppercase text-white tracking-wider">
                  Add or Upload New Partner Logo
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/40 uppercase block">Partner / Institution Name *</label>
                    <input
                      type="text"
                      value={newLogoName}
                      onChange={(e) => setNewLogoName(e.target.value)}
                      placeholder="e.g. JNIAS BALAGRAM"
                      className="w-full bg-black border border-white/15 p-2.5 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/40 uppercase block">Upload SVG/PNG File</label>
                    <input
                      ref={logoFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileUpload}
                      className="w-full bg-black border border-white/15 p-2 text-white text-[11px] file:mr-2 file:py-1 file:px-2 file:border-0 file:bg-white/10 file:text-white cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/40 uppercase block">Or Image URL / Path</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newLogoSrc}
                        onChange={(e) => setNewLogoSrc(e.target.value)}
                        placeholder="/logos/partner.svg"
                        className="flex-1 bg-black border border-white/15 p-2.5 text-white"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2.5 bg-white text-black font-bold uppercase hover:bg-neutral-200 cursor-pointer shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Logos Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {cms.logos.map((logo) => (
                  <div
                    key={logo.id}
                    className={`p-4 border flex flex-col justify-between space-y-4 ${
                      logo.active !== false
                        ? 'bg-[#0d0d0d] border-white/15'
                        : 'bg-black/40 border-white/5 opacity-50'
                    }`}
                  >
                    <div className="h-14 bg-white/[0.03] border border-white/10 flex items-center justify-center p-3">
                      <img
                        src={logo.src}
                        alt={logo.alt}
                        referrerPolicy="no-referrer"
                        className="max-h-8 max-w-[120px] object-contain"
                      />
                    </div>
                    <div className="space-y-1">
                      <input
                        type="text"
                        defaultValue={logo.name}
                        onBlur={async (e) => {
                          const nextName = e.target.value.trim().toUpperCase();
                          if (nextName && nextName !== logo.name) {
                            await updateLogo(logo.id, { name: nextName });
                            notify(`Updated partner name to "${nextName}" in PostgreSQL.`);
                          }
                        }}
                        className="w-full bg-transparent border-b border-transparent hover:border-white/20 focus:border-white text-xs font-mono font-bold text-white uppercase focus:outline-none"
                      />
                      <span className="text-[10px] font-mono text-white/40 truncate block">
                        {logo.fileName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs font-mono">
                      <button
                        onClick={async () => {
                          await updateLogo(logo.id, { active: logo.active === false });
                          notify(
                            logo.active === false
                              ? `Enabled "${logo.name}" in marquee`
                              : `Hidden "${logo.name}" from marquee`
                          );
                        }}
                        className="text-[11px] flex items-center gap-1 text-white/70 hover:text-white cursor-pointer"
                      >
                        {logo.active !== false ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-white/40" />
                            <span>Hidden</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={async () => {
                          await deleteLogo(logo.id);
                          notify(`Deleted logo "${logo.name}"`);
                        }}
                        className="text-rose-400 hover:text-rose-300 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================
              SECTION 7: CONTACT INBOX (CRM)
          ================================================================ */}
          {activeSection === 'inbox' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    Contact Submissions Inbox ({cms.messages.length})
                  </h1>
                  <p className="text-xs text-white/50">
                    All messages sent via the Contact page are recorded here in real time alongside Telegram bot delivery.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(['all', 'unread', 'read', 'replied', 'archived'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setInboxFilter(st)}
                      className={`px-3 py-1.5 text-xs font-mono uppercase rounded-xs cursor-pointer ${
                        inboxFilter === st
                          ? 'bg-white text-black font-bold'
                          : 'bg-[#0d0d0d] border border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {cms.messages
                  .filter((m) => inboxFilter === 'all' || m.status === inboxFilter)
                  .map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-5 border space-y-3 ${
                        msg.status === 'unread'
                          ? 'bg-[#111] border-emerald-500/40'
                          : 'bg-[#0d0d0d] border-white/10'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3 text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{msg.name}</span>
                          <span className="text-white/30">·</span>
                          <a href={`mailto:${msg.email}`} className="text-cyan-400 hover:underline">
                            {msg.email}
                          </a>
                          <span className="text-white/30">·</span>
                          <span className="uppercase text-[11px] text-emerald-400">{msg.status}</span>
                        </div>
                        <div className="text-white/40 text-[11px] tabular-nums">
                          {new Date(msg.createdAt).toLocaleString()} ·{' '}
                          {msg.telegramDelivered ? 'Telegram Delivered' : 'Stored in CMS'}
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-gray-200 font-sans leading-relaxed whitespace-pre-wrap">
                        {msg.message}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateMessageStatus(msg.id, 'read')}
                            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 cursor-pointer"
                          >
                            Mark Read
                          </button>
                          <button
                            onClick={() => updateMessageStatus(msg.id, 'replied')}
                            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-emerald-400 cursor-pointer"
                          >
                            Mark Replied
                          </button>
                          <button
                            onClick={() => updateMessageStatus(msg.id, 'archived')}
                            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 cursor-pointer"
                          >
                            Archive
                          </button>
                          <a
                            href={`mailto:${msg.email}?subject=Re: Your Inquiry to Amal K P (DZt)`}
                            className="px-2.5 py-1 bg-white text-black font-bold flex items-center gap-1"
                          >
                            <Mail className="w-3 h-3" />
                            <span>Reply via Email</span>
                          </a>
                        </div>
                        <button
                          onClick={async () => {
                            await deleteMessage(msg.id);
                            notify('Deleted message from inbox.');
                          }}
                          className="text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}

                {cms.messages.filter((m) => inboxFilter === 'all' || m.status === inboxFilter).length === 0 && (
                  <div className="p-12 bg-[#0d0d0d] border border-white/10 text-center space-y-2 font-mono">
                    <Inbox className="w-6 h-6 text-white/30 mx-auto" />
                    <p className="text-xs text-white/60">No contact inquiries match the current filter.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================
              SECTION 8: AI KNOWLEDGE LAYER & SEO
          ================================================================ */}
          {activeSection === 'knowledge' && (
            <div className="space-y-8">
              <div className="border-b border-white/10 pb-4">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  AI Knowledge Layer (`public/ai/profile.json`) & SEO Control
                </h1>
                <p className="text-xs text-white/50">
                  Manage verified public relationships for AI search engines (`/api/knowledge/profile`) and configure global SEO / OpenGraph metadata.
                </p>
              </div>

              {/* AI Knowledge Layer Relationships */}
              <div className="bg-[#0d0d0d] border border-white/10 p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      01. Verified Public Relationships (`public/ai/profile.json`)
                    </h2>
                    <p className="text-xs text-white/40 font-sans">
                      Changes here automatically write to `public/ai/profile.json` and update `/api/knowledge/profile`.
                    </p>
                  </div>
                  <a
                    href="/api/knowledge/profile"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <span>Inspect Live JSON</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Add Relationship Form */}
                <form
                  onSubmit={handleAddRelationship}
                  className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end text-xs font-mono bg-black/50 p-4 border border-white/10"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/40 uppercase block">Person Name *</label>
                    <input
                      type="text"
                      value={newRel.name}
                      onChange={(e) => setNewRel({ ...newRel, name: e.target.value })}
                      placeholder="e.g. Adhithya K P"
                      className="w-full bg-black border border-white/15 p-2 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/40 uppercase block">
                      Relationship Type(s)
                    </label>
                    <input
                      type="text"
                      value={newRel.type}
                      onChange={(e) => setNewRel({ ...newRel, type: e.target.value })}
                      placeholder="best_friend, brother, friend"
                      className="w-full bg-black border border-white/15 p-2 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/40 uppercase block">Public Profile URL</label>
                    <input
                      type="text"
                      value={newRel.url}
                      onChange={(e) => setNewRel({ ...newRel, url: e.target.value })}
                      placeholder="https://instagram.com/..."
                      className="w-full bg-black border border-white/15 p-2 text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="py-2 px-4 bg-white text-black font-bold uppercase hover:bg-neutral-200 cursor-pointer"
                  >
                    + Add Verified
                  </button>
                </form>

                {/* Relationships Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="border-b border-white/10 text-white/40 text-[11px]">
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3">Relationship Type</th>
                        <th className="py-2.5 px-3">Public URL</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {cms.knowledge.relationships.map((rel) => (
                        <tr key={rel.id} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 text-white font-bold">{rel.name}</td>
                          <td className="py-2.5 px-3 text-cyan-300">
                            {Array.isArray(rel.type) ? rel.type.join(' · ') : rel.type}
                          </td>
                          <td className="py-2.5 px-3 text-white/60 truncate max-w-[220px]">
                            {rel.url || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-emerald-400 uppercase">{rel.status}</td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleRemoveRelationship(rel.id)}
                              className="text-rose-400 hover:text-rose-300 cursor-pointer"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SEO & Meta Tags Editor */}
              <form onSubmit={handleSaveSeo} className="bg-[#0d0d0d] border border-white/10 p-6 space-y-4 text-xs font-mono">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    02. Search Engine Optimization (SEO) & OpenGraph Metadata
                  </h2>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-white text-black font-bold uppercase cursor-pointer"
                  >
                    Save SEO Settings
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/40 uppercase block">Document Title (`&lt;title&gt;`)</label>
                    <input
                      type="text"
                      value={seoDraft.title}
                      onChange={(e) => setSeoDraft({ ...seoDraft, title: e.target.value })}
                      className="w-full bg-black border border-white/15 p-2.5 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/40 uppercase block">Canonical URL</label>
                    <input
                      type="url"
                      value={seoDraft.canonicalUrl}
                      onChange={(e) => setSeoDraft({ ...seoDraft, canonicalUrl: e.target.value })}
                      className="w-full bg-black border border-white/15 p-2.5 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 uppercase block">Meta Description</label>
                  <textarea
                    rows={2}
                    value={seoDraft.description}
                    onChange={(e) => setSeoDraft({ ...seoDraft, description: e.target.value })}
                    className="w-full bg-black border border-white/15 p-2.5 text-white font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 uppercase block">Meta Keywords</label>
                  <input
                    type="text"
                    value={seoDraft.keywords}
                    onChange={(e) => setSeoDraft({ ...seoDraft, keywords: e.target.value })}
                    className="w-full bg-black border border-white/15 p-2.5 text-white"
                  />
                </div>
              </form>
            </div>
          )}

          {/* ================================================================
              SECTION 9: NAVIGATION & LAYOUT CONTROL
          ================================================================ */}
          {activeSection === 'layout' && (
            <form onSubmit={handleSaveLayoutSettings} className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    Navigation & Section Visibility Control
                  </h1>
                  <p className="text-xs text-white/50">
                    Customize navigation bar labels, show or hide sections, and toggle interactive Hero modules.
                  </p>
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-white text-black text-xs font-mono font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Layout Config</span>
                </button>
              </div>

              {/* Navigation Tabs Customizer */}
              <div className="bg-[#0d0d0d] border border-white/10 p-6 space-y-4">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2">
                  01. Header Navigation Tabs
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  {settingsDraft.navConfig.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-black border border-white/10 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={item.visible}
                          onChange={() => handleToggleNavVisibility(item.id)}
                          className="cursor-pointer"
                        />
                        <span className="text-white/40 uppercase w-20">#{item.id}</span>
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => handleNavLabelChange(item.id, e.target.value)}
                          className="bg-[#0d0d0d] border border-white/15 px-2.5 py-1 text-white flex-1"
                        />
                      </div>
                      <span className={item.visible ? 'text-emerald-400 text-[10px]' : 'text-white/30 text-[10px]'}>
                        {item.visible ? 'VISIBLE' : 'HIDDEN'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Component Visibility Toggles */}
              <div className="bg-[#0d0d0d] border border-white/10 p-6 space-y-4 text-xs font-mono">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2">
                  02. Interactive Subsystems & Hero Modules
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="p-4 bg-black border border-white/10 flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-white font-bold block">Hero Flagship Highlights Strip</span>
                      <span className="text-[11px] text-white/40">Show top 3 featured projects on Hero</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settingsDraft.showHeroHighlights}
                      onChange={(e) =>
                        setSettingsDraft({ ...settingsDraft, showHeroHighlights: e.target.checked })
                      }
                    />
                  </label>

                  <label className="p-4 bg-black border border-white/10 flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-white font-bold block">Partnership Dual-Track Marquee</span>
                      <span className="text-[11px] text-white/40">Show scrolling client & institution logos</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settingsDraft.showHeroMarquee}
                      onChange={(e) =>
                        setSettingsDraft({ ...settingsDraft, showHeroMarquee: e.target.checked })
                      }
                    />
                  </label>

                  <label className="p-4 bg-black border border-white/10 flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-white font-bold block">Interactive Live System Diagnostics</span>
                      <span className="text-[11px] text-white/40">Show telemetry grid & DZt CLI terminal on Hero</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settingsDraft.showHeroTelemetry}
                      onChange={(e) =>
                        setSettingsDraft({ ...settingsDraft, showHeroTelemetry: e.target.checked })
                      }
                    />
                  </label>

                  <label className="p-4 bg-black border border-white/10 flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-white font-bold block">Header Battery Status Indicator</span>
                      <span className="text-[11px] text-white/40">Show real-time battery percentage in top bar</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settingsDraft.showBatteryTracker}
                      onChange={(e) =>
                        setSettingsDraft({ ...settingsDraft, showBatteryTracker: e.target.checked })
                      }
                    />
                  </label>
                </div>
              </div>
            </form>
          )}

          {/* ================================================================
              SECTION 10: REAL PRISMA POSTGRESQL DATABASE STUDIO
          ================================================================ */}
          {activeSection === 'database' && (
            <CMSDatabaseSection notify={notify} onSyncDrafts={syncAllDrafts} />
          )}
        </div>
      </div>
    </div>
  );
}
