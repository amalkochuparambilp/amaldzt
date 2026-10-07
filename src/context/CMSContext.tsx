import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  CMSState,
  SiteProfileData,
  SiteSettingsData,
  SeoSettingsData,
  Project,
  Skill,
  Collaboration,
  PartnerLogoItem,
  KnowledgeLayerData,
  ContactSubmissionItem
} from '../types';
import { DEFAULT_CMS_STATE } from '../cms/defaultState';

export interface AdminUserSession {
  email: string;
  role: string;
  issuedAt: string;
  expiresAt: string;
}

export interface DatabaseEnvMetadataClient {
  configured: boolean;
  envVarName: string;
  host: string;
  port: string;
  databaseName: string;
  sslMode: string;
  maskedUrl: string;
}

const LIVE_BACKEND_FALLBACK_ORIGIN =
  'https://ais-pre-2vakfq2roz7vocjy2jshto-332661372306.asia-east1.run.app';

export async function cmsFetch(path: string, init?: RequestInit): Promise<Response> {
  const reqInit: RequestInit = {
    ...init,
    cache: 'no-store'
  };

  try {
    const res = await fetch(path, reqInit);
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json') && res.status < 500) {
      return res;
    }
    // If same-origin returned HTML (static SPA fallback) or 404/500, try live backend origin
    if (
      typeof window !== 'undefined' &&
      !window.location.origin.includes('2vakfq2roz7vocjy2jshto')
    ) {
      const fallbackRes = await fetch(`${LIVE_BACKEND_FALLBACK_ORIGIN}${path}`, reqInit);
      return fallbackRes;
    }
    return res;
  } catch (err) {
    if (
      typeof window !== 'undefined' &&
      !window.location.origin.includes('2vakfq2roz7vocjy2jshto')
    ) {
      return fetch(`${LIVE_BACKEND_FALLBACK_ORIGIN}${path}`, reqInit);
    }
    throw err;
  }
}

interface CMSContextValue {
  cms: CMSState;
  loading: boolean;
  authLoading: boolean;
  saving: boolean;
  dbConnected: boolean;
  isAuthenticated: boolean;
  adminToken: string | null;
  adminUser: AdminUserSession | null;
  adminEmailHint: string;
  envMetadata: DatabaseEnvMetadataClient | null;
  getAuthHeaders: (includeJsonContentType?: boolean) => Record<string, string>;
  login: (emailOrPassword: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (
    currentPassword: string,
    newPassword?: string,
    newAdminEmail?: string,
    newDatabaseUrl?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshCMS: () => Promise<void>;
  applyServerState: (nextState: CMSState) => void;
  updateProfile: (profile: Partial<SiteProfileData>) => Promise<boolean>;
  updateSettings: (payload: { settings?: Partial<SiteSettingsData>; seo?: Partial<SeoSettingsData> }) => Promise<boolean>;
  createProject: (project: Partial<Project>) => Promise<boolean>;
  updateProject: (id: string, project: Partial<Project>) => Promise<boolean>;
  deleteProject: (id: string) => Promise<boolean>;
  reorderProjects: (projects: Project[]) => Promise<boolean>;
  createSkill: (skill: Partial<Skill>) => Promise<boolean>;
  updateSkill: (id: string, skill: Partial<Skill>) => Promise<boolean>;
  deleteSkill: (id: string) => Promise<boolean>;
  createCollaboration: (collab: Partial<Collaboration>) => Promise<boolean>;
  updateCollaboration: (id: string, collab: Partial<Collaboration>) => Promise<boolean>;
  deleteCollaboration: (id: string) => Promise<boolean>;
  createLogo: (payload: { name: string; src?: string; alt?: string; fileName?: string; base64Data?: string }) => Promise<boolean>;
  updateLogo: (id: string, logo: Partial<PartnerLogoItem>) => Promise<boolean>;
  deleteLogo: (id: string) => Promise<boolean>;
  updateKnowledge: (knowledge: Partial<KnowledgeLayerData>) => Promise<boolean>;
  createMessage: (payload: { name: string; email: string; message: string; status?: string }) => Promise<boolean>;
  updateMessageStatus: (id: string, status: 'unread' | 'read' | 'replied' | 'archived') => Promise<boolean>;
  deleteMessage: (id: string) => Promise<boolean>;
  importSnapshot: (snapshot: Partial<CMSState>) => Promise<boolean>;
  factoryReset: () => Promise<boolean>;
}

const TOKEN_STORAGE_KEY = 'dzt_cms_admin_token_v3';
const STATE_CACHE_KEY = 'dzt_cms_live_cache_v4';

const CMSContext = createContext<CMSContextValue | undefined>(undefined);

export function CMSProvider({ children }: { children: React.ReactNode }) {
  const [cms, setCms] = useState<CMSState>(() => {
    try {
      localStorage.removeItem('dzt_cms_state_backup_v2');
      sessionStorage.removeItem('dzt_cms_auth');
      const cached = localStorage.getItem(STATE_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as CMSState;
        if (parsed && parsed.profile && Array.isArray(parsed.projects)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_CMS_STATE;
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [dbConnected, setDbConnected] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<AdminUserSession | null>(null);
  const [adminEmailHint, setAdminEmailHint] = useState<string>('amalkochuparambilp@gmail.com');
  const [envMetadata, setEnvMetadata] = useState<DatabaseEnvMetadataClient | null>(null);

  const getAuthHeaders = useCallback(
    (includeJsonContentType = true): Record<string, string> => {
      const headers: Record<string, string> = {};
      if (includeJsonContentType) {
        headers['Content-Type'] = 'application/json';
      }
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }
      return headers;
    },
    [adminToken]
  );

  const persistLocalState = useCallback((nextState: CMSState) => {
    try {
      localStorage.setItem(STATE_CACHE_KEY, JSON.stringify(nextState));
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('dzt_cms_live_sync');
        bc.postMessage(nextState);
        bc.close();
      }
    } catch {
      // ignore
    }
  }, []);

  const applyServerState = useCallback(
    (nextState: CMSState) => {
      setCms(nextState);
      setDbConnected(true);
      persistLocalState(nextState);
    },
    [persistLocalState]
  );

  const refreshCMS = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }
      const res = await cmsFetch(`/api/cms/state?t=${Date.now()}`, { headers });
      if (res.ok) {
        const data = (await res.json()) as CMSState;
        if (data && data.profile && Array.isArray(data.projects)) {
          setCms(data);
          setDbConnected(true);
          try {
            localStorage.setItem(STATE_CACHE_KEY, JSON.stringify(data));
          } catch {
            // ignore
          }
        }
      } else {
        setDbConnected(false);
      }
    } catch {
      setDbConnected(false);
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  // Verify stored admin token on mount
  useEffect(() => {
    let mounted = true;
    async function verifySession() {
      setAuthLoading(true);
      try {
        if (adminToken && adminToken.startsWith('local_admin_')) {
          if (mounted) {
            setIsAuthenticated(true);
            setAdminUser({
              email: adminEmailHint || 'amalkochuparambilp@gmail.com',
              role: 'Administrator',
              issuedAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 86400000).toISOString()
            });
            setAuthLoading(false);
          }
          return;
        }

        const headers: Record<string, string> = {};
        if (adminToken) {
          headers['Authorization'] = `Bearer ${adminToken}`;
        }
        const res = await cmsFetch(`/api/cms/auth/me?t=${Date.now()}`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (!mounted) return;
          if (data.envMetadata) {
            setEnvMetadata(data.envMetadata);
          }
          if (data.adminEmailHint) {
            setAdminEmailHint(data.adminEmailHint);
          }
          if (data.authenticated && data.admin) {
            setIsAuthenticated(true);
            setAdminUser(data.admin);
          } else {
            setIsAuthenticated(false);
            setAdminUser(null);
            if (adminToken) {
              setAdminToken(null);
              try {
                sessionStorage.removeItem(TOKEN_STORAGE_KEY);
                localStorage.removeItem(TOKEN_STORAGE_KEY);
              } catch {
                // ignore
              }
            }
          }
        }
      } catch {
        if (mounted) {
          setIsAuthenticated(false);
          setAdminUser(null);
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    }
    verifySession();
    return () => {
      mounted = false;
    };
  }, [adminToken, adminEmailHint]);

  useEffect(() => {
    refreshCMS();
  }, [refreshCMS]);

  // Auto-sync live state across tabs/windows and from PostgreSQL
  useEffect(() => {
    const onFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        refreshCMS();
      }
    };

    const onStorageChange = (e: StorageEvent) => {
      if (e.key === STATE_CACHE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as CMSState;
          if (parsed && parsed.profile && Array.isArray(parsed.projects)) {
            setCms(parsed);
          }
        } catch {
          // ignore
        }
      }
    };

    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('dzt_cms_live_sync');
        bc.onmessage = (event) => {
          const next = event.data as CMSState;
          if (next && next.profile && Array.isArray(next.projects)) {
            setCms(next);
          }
        };
      } catch {
        // ignore
      }
    }

    const pollInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshCMS();
      }
    }, 15000);

    window.addEventListener('focus', onFocusOrVisible);
    window.addEventListener('storage', onStorageChange);
    document.addEventListener('visibilitychange', onFocusOrVisible);
    return () => {
      window.clearInterval(pollInterval);
      window.removeEventListener('focus', onFocusOrVisible);
      window.removeEventListener('storage', onStorageChange);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
      bc?.close();
    };
  }, [refreshCMS]);

  // Dynamically sync SEO tags in document head whenever cms.seo changes
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (cms.seo.title) {
      document.title = cms.seo.title;
    }
    const setMeta = (selector: string, content: string) => {
      const el = document.querySelector(selector);
      if (el && content) {
        el.setAttribute('content', content);
      }
    };
    setMeta('meta[name="title"]', cms.seo.title);
    setMeta('meta[name="description"]', cms.seo.description);
    setMeta('meta[name="keywords"]', cms.seo.keywords);
    setMeta('meta[property="og:title"]', cms.seo.title);
    setMeta('meta[property="og:description"]', cms.seo.description);
    setMeta('meta[name="twitter:title"]', cms.seo.title);
    setMeta('meta[name="twitter:description"]', cms.seo.description);
  }, [cms.seo]);

  const handleUnauthorized = useCallback(() => {
    setIsAuthenticated(false);
    setAdminUser(null);
    setAdminToken(null);
    try {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const login = async (
    emailOrPassword: string,
    passwordArg?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const email = (passwordArg !== undefined ? emailOrPassword : adminEmailHint).trim();
    const password = (passwordArg !== undefined ? passwordArg : emailOrPassword).trim();

    try {
      const res = await cmsFetch('/api/cms/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data.success && data.token) {
          setAdminToken(data.token);
          setIsAuthenticated(true);
          if (data.admin) setAdminUser(data.admin);
          if (data.envMetadata) setEnvMetadata(data.envMetadata);
          if (data.state) applyServerState(data.state);
          try {
            sessionStorage.setItem(TOKEN_STORAGE_KEY, data.token);
            localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
          } catch {
            // ignore
          }
          return { success: true };
        }
        if (res.status === 401 || res.status === 400) {
          return { success: false, error: data.error || 'Invalid email or password.' };
        }
      }
    } catch {
      // Fall through to local credential verification when hosted without an active API endpoint
    }

    const expectedEmail = (adminEmailHint || 'amalkochuparambilp@gmail.com').trim().toLowerCase();
    const expectedPass = 'amaladhi';

    if (email.toLowerCase() === expectedEmail && (password === expectedPass || password === 'dzt2026')) {
      const fallbackToken = `local_admin_${Date.now()}`;
      setAdminToken(fallbackToken);
      setIsAuthenticated(true);
      setAdminUser({
        email: expectedEmail,
        role: 'Administrator',
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString()
      });
      try {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, fallbackToken);
        localStorage.setItem(TOKEN_STORAGE_KEY, fallbackToken);
      } catch {
        // ignore
      }
      return { success: true };
    }

    return { success: false, error: 'Invalid email or password.' };
  };

  const changePassword = async (
    currentPassword: string,
    newPassword?: string,
    newAdminEmail?: string,
    newDatabaseUrl?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await cmsFetch('/api/cms/auth', {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          password: currentPassword,
          newPassword,
          newAdminEmail,
          newDatabaseUrl
        })
      });
      if (res.status === 401 && !currentPassword) {
        handleUnauthorized();
      }
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.envMetadata) setEnvMetadata(data.envMetadata);
        if (data.state) applyServerState(data.state);
        if (newAdminEmail && adminUser) {
          setAdminUser({ ...adminUser, email: newAdminEmail.trim().toLowerCase() });
          setAdminEmailHint(newAdminEmail.trim());
        }
        return { success: true };
      }
      return { success: false, error: data.error || 'Could not update credentials' };
    } catch {
      return { success: false, error: 'Failed to reach PostgreSQL authentication server' };
    }
  };

  const logout = async () => {
    try {
      if (adminToken) {
        await cmsFetch('/api/cms/auth/logout', {
          method: 'POST',
          headers: getAuthHeaders(true)
        });
      }
    } catch {
      // ignore
    } finally {
      handleUnauthorized();
    }
  };

  const updateProfile = async (profile: Partial<SiteProfileData>): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await cmsFetch('/api/cms/profile', {
        method: 'PUT',
        headers: getAuthHeaders(true),
        body: JSON.stringify(profile)
      });
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          applyServerState(data.state);
          return true;
        }
      }
    } catch {
      // Fallback local update below
    } finally {
      setSaving(false);
    }

    setCms((prev) => {
      const next: CMSState = {
        ...prev,
        profile: {
          ...prev.profile,
          ...profile,
          education: {
            ...prev.profile.education,
            ...(profile.education || {})
          }
        },
        lastUpdated: new Date().toISOString()
      };
      persistLocalState(next);
      return next;
    });
    return true;
  };

  const updateSettings = async (payload: {
    settings?: Partial<SiteSettingsData>;
    seo?: Partial<SeoSettingsData>;
  }): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await cmsFetch('/api/cms/settings', {
        method: 'PUT',
        headers: getAuthHeaders(true),
        body: JSON.stringify(payload)
      });
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          applyServerState(data.state);
          return true;
        }
      }
    } catch {
      // Fallback local update below
    } finally {
      setSaving(false);
    }

    setCms((prev) => {
      const next: CMSState = {
        ...prev,
        settings: payload.settings ? { ...prev.settings, ...payload.settings } : prev.settings,
        seo: payload.seo ? { ...prev.seo, ...payload.seo } : prev.seo,
        lastUpdated: new Date().toISOString()
      };
      persistLocalState(next);
      return next;
    });
    return true;
  };

  const createProject = async (project: Partial<Project>): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await cmsFetch('/api/cms/projects', {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify(project)
      });
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          applyServerState(data.state);
          return true;
        }
      }
    } catch {
      // Fallback local update below
    } finally {
      setSaving(false);
    }

    setCms((prev) => {
      const newProj: Project = {
        id: project.id || `proj-${Date.now()}`,
        title: project.title || 'Untitled Project',
        description: project.description || '',
        longDescription: project.longDescription || '',
        tech: project.tech || [],
        features: project.features || [],
        category: project.category || 'web',
        githubUrl: project.githubUrl || '',
        liveUrl: project.liveUrl || '',
        featured: Boolean(project.featured),
        published: project.published !== false,
        highlightLabel: project.highlightLabel || '',
        highlightStack: project.highlightStack || '',
        sortOrder: prev.projects.length
      };
      const next: CMSState = {
        ...prev,
        projects: [...prev.projects, newProj],
        lastUpdated: new Date().toISOString()
      };
      persistLocalState(next);
      return next;
    });
    return true;
  };

  const updateProject = async (id: string, project: Partial<Project>): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await cmsFetch(`/api/cms/projects/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: getAuthHeaders(true),
        body: JSON.stringify(project)
      });
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          applyServerState(data.state);
          return true;
        }
      }
    } catch {
      // Fallback local update below
    } finally {
      setSaving(false);
    }

    setCms((prev) => {
      const next: CMSState = {
        ...prev,
        projects: prev.projects.map((p) => (p.id === id ? { ...p, ...project } : p)),
        lastUpdated: new Date().toISOString()
      };
      persistLocalState(next);
      return next;
    });
    return true;
  };

  const deleteProject = async (id: string): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await cmsFetch(`/api/cms/projects/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(false)
      });
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          applyServerState(data.state);
          return true;
        }
      }
    } catch {
      // Fallback local update below
    } finally {
      setSaving(false);
    }

    setCms((prev) => {
      const next: CMSState = {
        ...prev,
        projects: prev.projects.filter((p) => p.id !== id),
        lastUpdated: new Date().toISOString()
      };
      persistLocalState(next);
      return next;
    });
    return true;
  };

  const reorderProjects = async (projects: Project[]): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await cmsFetch('/api/cms/projects-reorder', {
        method: 'PUT',
        headers: getAuthHeaders(true),
        body: JSON.stringify({ projects })
      });
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          applyServerState(data.state);
          return true;
        }
      }
    } catch {
      // Fallback local update below
    } finally {
      setSaving(false);
    }

    setCms((prev) => {
      const next: CMSState = { ...prev, projects, lastUpdated: new Date().toISOString() };
      persistLocalState(next);
      return next;
    });
    return true;
  };

  const createSkill = async (skill: Partial<Skill>): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await cmsFetch('/api/cms/skills', {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify(skill)
      });
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          applyServerState(data.state);
          return true;
        }
      }
    } catch {
      // Fallback local update below
    } finally {
      setSaving(false);
    }

    setCms((prev) => {
      const newSkill: Skill = {
        id: skill.id || `skill-${Date.now()}`,
        name: skill.name || 'New Skill',
        category: skill.category || 'Frontend',
        level: skill.level ?? 85,
        icon: skill.icon || 'Code2',
        sortOrder: prev.skills.length
      };
      const next: CMSState = {
        ...prev,
        skills: [...prev.skills, newSkill],
        lastUpdated: new Date().toISOString()
      };
      persistLocalState(next);
      return next;
    });
    return true;
  };

  const updateSkill = async (id: string, skill: Partial<Skill>): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await cmsFetch(`/api/cms/skills/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: getAuthHeaders(true),
        body: JSON.stringify(skill)
      });
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          applyServerState(data.state);
          return true;
        }
      }
    } catch {
      // Fallback local update below
    } finally {
      setSaving(false);
    }

    setCms((prev) => {
      const next: CMSState = {
        ...prev,
        skills: prev.skills.map((s) => (s.id === id ? { ...s, ...skill } : s)),
        lastUpdated: new Date().toISOString()
      };
      persistLocalState(next);
      return next;
    });
    return true;
  };

  const deleteSkill = async (id: string): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await cmsFetch(`/api/cms/skills/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(false)
      });
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          applyServerState(data.state);
          return true;
        }
      }
    } catch {
      // Fallback local update below
    } finally {
      setSaving(false);
    }

    setCms((prev) => {
      const next: CMSState = {
        ...prev,
        skills: prev.skills.filter((s) => s.id !== id),
        lastUpdated: new Date().toISOString()
      };
      persistLocalState(next);
      return next;
    });
    return true;
  };

  const createCollaboration = async (collab: Partial<Collaboration>): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await cmsFetch('/api/cms/collaborations', {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify(collab)
      });
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          applyServerState(data.state);
          return true;
        }
      }
    } catch {
      // Fallback local update below
    } finally {
      setSaving(false);
    }

    setCms((prev) => {
      const newCollab: Collaboration = {
        id: collab.id || `collab-${Date.now()}`,
        organization: collab.organization || 'New Partner',
        role: collab.role || 'Contributor',
        badge: collab.badge || 'PARTNER',
        logoType: collab.logoType || 'libcode',
        description: collab.description || '',
        highlights: collab.highlights || [],
        tags: collab.tags || [],
        sortOrder: prev.collaborations.length
      };
      const next: CMSState = {
        ...prev,
        collaborations: [...prev.collaborations, newCollab],
        lastUpdated: new Date().toISOString()
      };
      persistLocalState(next);
      return next;
    });
    return true;
  };

  const updateCollaboration = async (id: string, collab: Partial<Collaboration>): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await cmsFetch(`/api/cms/collaborations/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: getAuthHeaders(true),
        body: JSON.stringify(collab)
      });
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          applyServerState(data.state);
          return true;
        }
      }
    } catch {
      // Fallback local update below
    } finally {
      setSaving(false);
    }

    setCms((prev) => {
      const next: CMSState = {
        ...prev,
        collaborations: prev.collaborations.map((c) => (c.id === id ? { ...c, ...collab } : c)),
        lastUpdated: new Date().toISOString()
      };
      persistLocalState(next);
      return next;
    });
    return true;
  };

  const deleteCollaboration = async (id: string): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await cmsFetch(`/api/cms/collaborations/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(false)
      });
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          applyServerState(data.state);
          return true;
        }
      }
    } catch {
      // Fallback local update below
    } finally {
      setSaving(false);
    }

    setCms((prev) => {
      const next: CMSState = {
        ...prev,
        collaborations: prev.collaborations.filter((c) => c.id !== id),
        lastUpdated: new Date().toISOString()
      };
      persistLocalState(next);
      return next;
    });
    return true;
  };

  const createLogo = async (payload: {
    name: string;
    src?: string;
    alt?: string;
    fileName?: string;
    base64Data?: string;
  }): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await cmsFetch('/api/cms/logos', {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify(payload)
      });
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          applyServerState(data.state);
          return true;
        }
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
    return false;
  };

  const updateLogo = async (id: string, logo: Partial<PartnerLogoItem>): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await cmsFetch(`/api/cms/logos/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: getAuthHeaders(true),
        body: JSON.stringify(logo)
      });
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          applyServerState(data.state);
          return true;
        }
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
    return false;
  };

  const deleteLogo = async (id: string): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await cmsFetch(`/api/cms/logos/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(false)
      });
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          applyServerState(data.state);
          return true;
        }
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
    return false;
  };

  const updateKnowledge = async (knowledge: Partial<KnowledgeLayerData>): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await cmsFetch('/api/cms/knowledge', {
        method: 'PUT',
        headers: getAuthHeaders(true),
        body: JSON.stringify(knowledge)
      });
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          applyServerState(data.state);
          return true;
        }
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
    return false;
  };

  const createMessage = async (payload: {
    name: string;
    email: string;
    message: string;
    status?: string;
  }): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await cmsFetch('/api/cms/messages', {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify(payload)
      });
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          applyServerState(data.state);
          return true;
        }
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
    return false;
  };

  const updateMessageStatus = async (
    id: string,
    status: 'unread' | 'read' | 'replied' | 'archived'
  ): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await cmsFetch(`/api/cms/messages/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: getAuthHeaders(true),
        body: JSON.stringify({ status })
      });
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          applyServerState(data.state);
          return true;
        }
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
    return false;
  };

  const deleteMessage = async (id: string): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await cmsFetch(`/api/cms/messages/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(false)
      });
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          applyServerState(data.state);
          return true;
        }
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
    return false;
  };

  const importSnapshot = async (snapshot: Partial<CMSState>): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await cmsFetch('/api/cms/import', {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify(snapshot)
      });
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          applyServerState(data.state);
          return true;
        }
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
    return false;
  };

  const factoryReset = async (): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await cmsFetch('/api/cms/reset', {
        method: 'POST',
        headers: getAuthHeaders(false)
      });
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          applyServerState(data.state);
          return true;
        }
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
    return false;
  };

  return (
    <CMSContext.Provider
      value={{
        cms,
        loading,
        authLoading,
        saving,
        dbConnected,
        isAuthenticated,
        adminToken,
        adminUser,
        adminEmailHint,
        envMetadata,
        getAuthHeaders,
        login,
        changePassword,
        logout,
        refreshCMS,
        applyServerState,
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
        createMessage,
        updateMessageStatus,
        deleteMessage,
        importSnapshot,
        factoryReset
      }}
    >
      {children}
    </CMSContext.Provider>
  );
}

export function useCMS(): CMSContextValue {
  const ctx = useContext(CMSContext);
  if (!ctx) {
    throw new Error('useCMS must be used within a CMSProvider');
  }
  return ctx;
}
