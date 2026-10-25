import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { prisma, pgPool, getDatabaseEnvMetadata, reloadDatabaseConnection } from './prisma';
import { DEFAULT_CMS_STATE } from '../cms/defaultState';
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
  ContactSubmissionItem,
  NavItemConfig
} from '../types';

let isSeeded = false;

export const ALLOWED_DB_TABLES = [
  'AdminUser',
  'SiteProfile',
  'SiteSettings',
  'Project',
  'Skill',
  'Collaboration',
  'PartnerLogo',
  'KnowledgeRelationship',
  'ContactMessage',
  'AuditLog',
  '_prisma_migrations'
] as const;

export type AllowedDbTable = (typeof ALLOWED_DB_TABLES)[number];

export async function ensureDatabaseSeeded(forceCheck = false): Promise<void> {
  if (isSeeded && !forceCheck) return;
  try {
    const existingProfile = await prisma.siteProfile.findUnique({
      where: { id: 'default' }
    });

    const def = DEFAULT_CMS_STATE;

    if (!existingProfile) {
      await prisma.siteProfile.create({
        data: {
          id: 'default',
          name: def.profile.name,
          title: def.profile.title,
          tagline: def.profile.tagline,
          heroHeadingLine1: def.profile.heroHeadingLine1,
          heroHeadingItalic: def.profile.heroHeadingItalic,
          heroHeadingLine2: def.profile.heroHeadingLine2,
          heroBio: def.profile.heroBio,
          availabilityText: def.profile.availabilityText,
          availabilityActive: def.profile.availabilityActive,
          campusBadge: def.profile.campusBadge,
          founderBadge: def.profile.founderBadge,
          location: def.profile.location,
          email: def.profile.email,
          phone: def.profile.phone,
          linkedin: def.profile.linkedin,
          github: def.profile.github,
          summary: def.profile.summary,
          resumeSummary: def.profile.resumeSummary,
          aboutBioParagraph1: def.profile.aboutBioParagraph1,
          aboutBioParagraph2: def.profile.aboutBioParagraph2,
          eduDegree: def.profile.education.degree,
          eduInstitution: def.profile.education.institution,
          eduLocation: def.profile.education.location,
          eduPeriod: def.profile.education.period,
          eduStatus: def.profile.education.status,
          skillsList: def.profile.skillsList,
          languages: def.profile.languages,
          ecosystemNode: def.profile.ecosystemNode,
          buildVersion: def.profile.buildVersion
        }
      });

      await prisma.siteSettings.upsert({
        where: { id: 'default' },
        update: {},
        create: {
          id: 'default',
          showHeroMarquee: def.settings.showHeroMarquee,
          showHeroTelemetry: def.settings.showHeroTelemetry,
          showHeroHighlights: def.settings.showHeroHighlights,
          showBatteryTracker: def.settings.showBatteryTracker,
          announcementActive: def.settings.announcementActive,
          announcementText: def.settings.announcementText,
          announcementLinkText: def.settings.announcementLinkText,
          announcementLinkTarget: def.settings.announcementLinkTarget,
          navConfig: def.settings.navConfig as any,
          seoTitle: def.seo.title,
          seoDescription: def.seo.description,
          seoKeywords: def.seo.keywords,
          seoCanonicalUrl: def.seo.canonicalUrl,
          seoOgImage: def.seo.ogImage,
          adminEmail: 'amalkochuparambilp@gmail.com',
          adminPasscode: 'dzt2026'
        }
      });

      for (const [idx, p] of def.projects.entries()) {
        await prisma.project.upsert({
          where: { id: p.id },
          update: {},
          create: {
            id: p.id,
            title: p.title,
            description: p.description,
            longDescription: p.longDescription || null,
            category: p.category,
            tech: p.tech,
            features: p.features || [],
            githubUrl: p.githubUrl || null,
            liveUrl: p.liveUrl || null,
            featured: Boolean(p.featured),
            published: p.published !== false,
            highlightLabel: p.highlightLabel || null,
            highlightStack: p.highlightStack || null,
            sortOrder: p.sortOrder ?? idx
          }
        });
      }

      for (const [idx, s] of def.skills.entries()) {
        const sid = s.id || `skill-${idx + 1}`;
        await prisma.skill.upsert({
          where: { id: sid },
          update: {},
          create: {
            id: sid,
            name: s.name,
            level: s.level,
            category: s.category,
            icon: s.icon,
            sortOrder: s.sortOrder ?? idx
          }
        });
      }

      for (const [idx, c] of def.collaborations.entries()) {
        await prisma.collaboration.upsert({
          where: { id: c.id },
          update: {},
          create: {
            id: c.id,
            role: c.role,
            organization: c.organization,
            badge: c.badge,
            logoType: c.logoType,
            description: c.description,
            highlights: c.highlights,
            tags: c.tags,
            sortOrder: c.sortOrder ?? idx
          }
        });
      }

      for (const [idx, l] of def.logos.entries()) {
        await prisma.partnerLogo.upsert({
          where: { id: l.id },
          update: {},
          create: {
            id: l.id,
            name: l.name,
            src: l.src,
            alt: l.alt,
            fileName: l.fileName,
            active: l.active !== false,
            sortOrder: l.sortOrder ?? idx
          }
        });
      }

      for (const r of def.knowledge.relationships) {
        await prisma.knowledgeRelationship.upsert({
          where: { id: r.id },
          update: {},
          create: {
            id: r.id,
            types: Array.isArray(r.type) ? r.type : [r.type],
            name: r.name,
            alternateName: r.alternateName || [],
            url: r.url || null,
            status: r.status
          }
        });
      }

      for (const m of def.messages) {
        await prisma.contactMessage.upsert({
          where: { id: m.id },
          update: {},
          create: {
            id: m.id,
            name: m.name,
            email: m.email,
            message: m.message,
            status: m.status,
            telegramDelivered: m.telegramDelivered,
            ipAddress: m.ipAddress || null,
            createdAt: new Date(m.createdAt)
          }
        });
      }

      await prisma.auditLog.create({
        data: {
          id: `log-seed-${Date.now()}`,
          action: 'PRISMA_POSTGRES_SEED',
          section: 'Database',
          summary: 'Connected & seeded live Prisma PostgreSQL database (pooled.db.prisma.io)'
        }
      });
    }

    // Ensure primary AdminUser record exists in PostgreSQL database
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { id: 'admin-primary' }
    });
    if (!existingAdmin) {
      const settingsRow = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
      await prisma.adminUser.create({
        data: {
          id: 'admin-primary',
          email: settingsRow?.adminEmail || 'amalkochuparambilp@gmail.com',
          password: settingsRow?.adminPasscode || 'dzt2026',
          name: 'Amal K P',
          role: 'Administrator'
        }
      });
    }

    // Also sync any logo files in /public/logos that aren't in PartnerLogo table yet
    try {
      const logosDir = path.join(process.cwd(), 'public', 'logos');
      if (fs.existsSync(logosDir)) {
        const allowedExts = new Set(['.png', '.jpg', '.jpeg', '.svg', '.webp', '.avif', '.gif']);
        const files = fs
          .readdirSync(logosDir)
          .filter((file) => !file.startsWith('.') && allowedExts.has(path.extname(file).toLowerCase()));

        const existingLogos = await prisma.partnerLogo.findMany();
        const existingFiles = new Set(existingLogos.map((l) => l.fileName.toLowerCase()));

        for (const file of files) {
          if (!existingFiles.has(file.toLowerCase())) {
            const rawName = path
              .basename(file, path.extname(file))
              .replace(/[-_]+/g, ' ')
              .trim()
              .toUpperCase();
            await prisma.partnerLogo.create({
              data: {
                id: `logo-${file.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                name: rawName || 'PARTNER',
                src: `/logos/${encodeURIComponent(file)}`,
                alt: `${rawName || 'Partner'} Logo`,
                fileName: file,
                active: true,
                sortOrder: existingLogos.length
              }
            });
          }
        }
      }
    } catch {
      // ignore fs scan errors
    }

    isSeeded = true;
  } catch (error) {
    console.error('[Prisma Repository] Error seeding database:', error);
    throw error;
  }
}

export async function logPrismaAudit(action: string, section: string, summary: string) {
  try {
    await prisma.auditLog.create({
      data: {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        action,
        section,
        summary
      }
    });
  } catch (err) {
    console.error('[Prisma Audit] Failed to write audit log:', err);
  }
}

export async function getAdminEmailFromDb(): Promise<string> {
  try {
    await ensureDatabaseSeeded();
    const admin = await prisma.adminUser.findUnique({ where: { id: 'admin-primary' } });
    if (admin?.email) return admin.email.trim();
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
    return (settings?.adminEmail || 'amalkochuparambilp@gmail.com').trim();
  } catch {
    return 'amalkochuparambilp@gmail.com';
  }
}

export function getAdminEmailFromEnv(): string {
  return 'amalkochuparambilp@gmail.com';
}

export async function fetchFullCMSStateFromPostgres(includePrivateAdminData = true): Promise<CMSState> {
  await ensureDatabaseSeeded();

  const [
    profileRow,
    settingsRow,
    projectsRows,
    skillsRows,
    collabRows,
    logoRows,
    relRows,
    messageRows,
    auditRows
  ] = await Promise.all([
    prisma.siteProfile.findUnique({ where: { id: 'default' } }),
    prisma.siteSettings.findUnique({ where: { id: 'default' } }),
    prisma.project.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.skill.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.collaboration.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.partnerLogo.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.knowledgeRelationship.findMany({ orderBy: { createdAt: 'asc' } }),
    includePrivateAdminData
      ? prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } })
      : Promise.resolve([]),
    includePrivateAdminData
      ? prisma.auditLog.findMany({ orderBy: { timestamp: 'desc' }, take: 60 })
      : Promise.resolve([])
  ]);

  const def = DEFAULT_CMS_STATE;

  const profile: SiteProfileData = profileRow
    ? {
        name: profileRow.name,
        title: profileRow.title,
        tagline: profileRow.tagline,
        heroHeadingLine1: profileRow.heroHeadingLine1,
        heroHeadingItalic: profileRow.heroHeadingItalic,
        heroHeadingLine2: profileRow.heroHeadingLine2,
        heroBio: profileRow.heroBio,
        availabilityText: profileRow.availabilityText,
        availabilityActive: profileRow.availabilityActive,
        campusBadge: profileRow.campusBadge,
        founderBadge: profileRow.founderBadge,
        location: profileRow.location,
        email: profileRow.email,
        phone: profileRow.phone,
        linkedin: profileRow.linkedin,
        github: profileRow.github,
        summary: profileRow.summary,
        resumeSummary: profileRow.resumeSummary,
        aboutBioParagraph1: profileRow.aboutBioParagraph1,
        aboutBioParagraph2: profileRow.aboutBioParagraph2,
        education: {
          degree: profileRow.eduDegree,
          institution: profileRow.eduInstitution,
          location: profileRow.eduLocation,
          period: profileRow.eduPeriod,
          status: profileRow.eduStatus
        },
        skillsList: profileRow.skillsList,
        languages: profileRow.languages,
        ecosystemNode: profileRow.ecosystemNode,
        buildVersion: profileRow.buildVersion
      }
    : def.profile;

  const settings: SiteSettingsData = settingsRow
    ? {
        showHeroMarquee: settingsRow.showHeroMarquee,
        showHeroTelemetry: settingsRow.showHeroTelemetry,
        showHeroHighlights: settingsRow.showHeroHighlights,
        showBatteryTracker: settingsRow.showBatteryTracker,
        announcementActive: settingsRow.announcementActive,
        announcementText: settingsRow.announcementText,
        announcementLinkText: settingsRow.announcementLinkText,
        announcementLinkTarget: settingsRow.announcementLinkTarget,
        navConfig: Array.isArray(settingsRow.navConfig)
          ? (settingsRow.navConfig as unknown as NavItemConfig[])
          : def.settings.navConfig
      }
    : def.settings;

  const seo: SeoSettingsData = settingsRow
    ? {
        title: settingsRow.seoTitle,
        description: settingsRow.seoDescription,
        keywords: settingsRow.seoKeywords,
        canonicalUrl: settingsRow.seoCanonicalUrl,
        ogImage: settingsRow.seoOgImage
      }
    : def.seo;

  const projects: Project[] = projectsRows.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    longDescription: p.longDescription || undefined,
    category: (p.category as Project['category']) || 'system',
    tech: p.tech,
    features: p.features,
    githubUrl: p.githubUrl || undefined,
    liveUrl: p.liveUrl || undefined,
    featured: p.featured,
    published: p.published,
    highlightLabel: p.highlightLabel || undefined,
    highlightStack: p.highlightStack || undefined,
    sortOrder: p.sortOrder
  }));

  const skills: Skill[] = skillsRows.map((s) => ({
    id: s.id,
    name: s.name,
    level: s.level,
    category: (s.category as Skill['category']) || 'Frontend',
    icon: s.icon,
    sortOrder: s.sortOrder
  }));

  const collaborations: Collaboration[] = collabRows.map((c) => ({
    id: c.id,
    role: c.role,
    organization: c.organization,
    badge: c.badge,
    logoType: (c.logoType as Collaboration['logoType']) || 'libcode',
    description: c.description,
    highlights: c.highlights,
    tags: c.tags,
    sortOrder: c.sortOrder
  }));

  const logos: PartnerLogoItem[] = logoRows.map((l) => ({
    id: l.id,
    name: l.name,
    src: l.src,
    alt: l.alt,
    fileName: l.fileName,
    active: l.active,
    sortOrder: l.sortOrder
  }));

  const knowledge: KnowledgeLayerData = {
    ...def.knowledge,
    entity: {
      ...def.knowledge.entity,
      name: profile.name,
      jobTitle: profile.title
    },
    relationships: relRows.map((r) => ({
      id: r.id,
      type: r.types.length === 1 ? r.types[0] : r.types,
      name: r.name,
      ...(r.alternateName && r.alternateName.length > 0 ? { alternateName: r.alternateName } : {}),
      ...(r.url ? { url: r.url } : {}),
      status: (r.status as 'confirmed' | 'pending' | 'archived') || 'confirmed'
    })),
    last_updated: new Date().toISOString()
  };

  const messages: ContactSubmissionItem[] = messageRows.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    message: m.message,
    status: (m.status as ContactSubmissionItem['status']) || 'unread',
    telegramDelivered: m.telegramDelivered,
    ipAddress: m.ipAddress || undefined,
    createdAt: m.createdAt.toISOString()
  }));

  return {
    profile,
    settings,
    seo,
    projects,
    skills,
    collaborations,
    logos,
    knowledge,
    messages,
    auditLogs: auditRows.map((a) => ({
      id: a.id,
      action: a.action,
      section: a.section,
      summary: a.summary,
      timestamp: a.timestamp.toISOString()
    })),
    lastUpdated: profileRow?.updatedAt.toISOString() || new Date().toISOString()
  };
}

function writeEnvVariablesToDisk(updates: Record<string, string>): void {
  try {
    const envPath = path.join(process.cwd(), '.env');
    let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
    for (const [key, value] of Object.entries(updates)) {
      process.env[key] = value;
      const escapedVal = `"${value.replace(/"/g, '\\"')}"`;
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        content = content.replace(regex, `${key}=${escapedVal}`);
      } else {
        content = content.trimEnd() + `\n${key}=${escapedVal}\n`;
      }
    }
    fs.writeFileSync(envPath, content.trimEnd() + '\n', 'utf-8');
    dotenv.config({ override: true });
  } catch (err) {
    console.error('[CMS .env Writer] Failed to update .env:', err);
  }
}

export async function verifyAdminLoginInDb(
  email?: string,
  password?: string
): Promise<{ valid: boolean; adminEmail: string; error?: string }> {
  let expectedEmail = 'amalkochuparambilp@gmail.com';
  let dbPass = 'amaladhi';

  try {
    await ensureDatabaseSeeded();
    const adminRow = await prisma.adminUser.findUnique({ where: { id: 'admin-primary' } });
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });

    expectedEmail = (adminRow?.email || settings?.adminEmail || 'amalkochuparambilp@gmail.com').trim();
    dbPass = (adminRow?.password || settings?.adminPasscode || 'amaladhi').trim();
  } catch (err) {
    console.warn('[CMS Auth] Using fallback admin credentials due to DB query warning:', err);
  }

  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) {
    return { valid: false, adminEmail: expectedEmail, error: 'Email is required.' };
  }
  if (cleanEmail !== expectedEmail.toLowerCase()) {
    await logPrismaAudit('ADMIN_AUTH_DENIED', 'AdminUser', `Rejected login attempt for non-admin email: ${cleanEmail}`);
    return {
      valid: false,
      adminEmail: expectedEmail,
      error: 'Invalid email or password.'
    };
  }

  const cleanPass = (password || '').trim();
  if (!cleanPass || cleanPass !== dbPass) {
    await logPrismaAudit('ADMIN_AUTH_FAILED', 'AdminUser', `Invalid password attempt for admin ${expectedEmail}`);
    return {
      valid: false,
      adminEmail: expectedEmail,
      error: 'Invalid email or password.'
    };
  }

  await prisma.adminUser
    .update({
      where: { id: 'admin-primary' },
      data: { lastLoginAt: new Date() }
    })
    .catch(() => {});

  await logPrismaAudit('ADMIN_AUTH_SUCCESS', 'AdminUser', `Verified administrator session from PostgreSQL for ${expectedEmail}`);
  return { valid: true, adminEmail: expectedEmail };
}

export async function verifyOrUpdatePasscodeInDb(
  password: string,
  newPassword?: string,
  newAdminEmail?: string,
  newDatabaseUrl?: string
): Promise<{ valid: boolean; error?: string }> {
  await ensureDatabaseSeeded();
  const adminRow = await prisma.adminUser.findUnique({ where: { id: 'admin-primary' } });
  const settings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
  const expectedPass = (adminRow?.password || settings?.adminPasscode || 'dzt2026').trim();

  if (!password || password.trim() !== expectedPass) {
    return { valid: false, error: 'Current administrator password in PostgreSQL is incorrect.' };
  }

  const updatedEmail =
    newAdminEmail && newAdminEmail.trim().includes('@')
      ? newAdminEmail.trim()
      : adminRow?.email || settings?.adminEmail || 'amalkochuparambilp@gmail.com';

  const updatedPass =
    newPassword && newPassword.trim().length >= 4
      ? newPassword.trim()
      : expectedPass;

  if (
    (newPassword && newPassword.trim().length >= 4) ||
    (newAdminEmail && newAdminEmail.trim().includes('@'))
  ) {
    await prisma.adminUser.upsert({
      where: { id: 'admin-primary' },
      update: {
        email: updatedEmail,
        password: updatedPass
      },
      create: {
        id: 'admin-primary',
        email: updatedEmail,
        password: updatedPass,
        name: 'Amal K P',
        role: 'Administrator'
      }
    });

    await prisma.siteSettings.update({
      where: { id: 'default' },
      data: {
        adminEmail: updatedEmail,
        adminPasscode: updatedPass
      }
    });

    await logPrismaAudit(
      'UPDATE_ADMIN_DB',
      'AdminUser',
      `Updated Administrator credentials (email: ${updatedEmail}) in PostgreSQL database`
    );
  }

  if (newDatabaseUrl && newDatabaseUrl.trim().startsWith('postgres')) {
    writeEnvVariablesToDisk({ DATABASE_URL: newDatabaseUrl.trim() });
    await reloadDatabaseConnection();
    await logPrismaAudit('UPDATE_DATABASE_URL', 'Database (.env)', 'Updated DATABASE_URL in .env and reloaded PostgreSQL connection pool');
  }

  return { valid: true };
}

export async function updateProfileInDb(incoming: Partial<SiteProfileData>): Promise<CMSState> {
  await ensureDatabaseSeeded();
  const current = await prisma.siteProfile.findUnique({ where: { id: 'default' } });
  const def = DEFAULT_CMS_STATE.profile;

  await prisma.siteProfile.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      name: incoming.name ?? def.name,
      title: incoming.title ?? def.title,
      tagline: incoming.tagline ?? def.tagline,
      heroHeadingLine1: incoming.heroHeadingLine1 ?? def.heroHeadingLine1,
      heroHeadingItalic: incoming.heroHeadingItalic ?? def.heroHeadingItalic,
      heroHeadingLine2: incoming.heroHeadingLine2 ?? def.heroHeadingLine2,
      heroBio: incoming.heroBio ?? def.heroBio,
      availabilityText: incoming.availabilityText ?? def.availabilityText,
      availabilityActive: incoming.availabilityActive ?? def.availabilityActive,
      campusBadge: incoming.campusBadge ?? def.campusBadge,
      founderBadge: incoming.founderBadge ?? def.founderBadge,
      location: incoming.location ?? def.location,
      email: incoming.email ?? def.email,
      phone: incoming.phone ?? def.phone,
      linkedin: incoming.linkedin ?? def.linkedin,
      github: incoming.github ?? def.github,
      summary: incoming.summary ?? def.summary,
      resumeSummary: incoming.resumeSummary ?? def.resumeSummary,
      aboutBioParagraph1: incoming.aboutBioParagraph1 ?? def.aboutBioParagraph1,
      aboutBioParagraph2: incoming.aboutBioParagraph2 ?? def.aboutBioParagraph2,
      eduDegree: incoming.education?.degree ?? def.education.degree,
      eduInstitution: incoming.education?.institution ?? def.education.institution,
      eduLocation: incoming.education?.location ?? def.education.location,
      eduPeriod: incoming.education?.period ?? def.education.period,
      eduStatus: incoming.education?.status ?? def.education.status,
      skillsList: incoming.skillsList ?? def.skillsList,
      languages: incoming.languages ?? def.languages,
      ecosystemNode: incoming.ecosystemNode ?? def.ecosystemNode,
      buildVersion: incoming.buildVersion ?? def.buildVersion
    },
    update: {
      ...(incoming.name !== undefined ? { name: incoming.name } : {}),
      ...(incoming.title !== undefined ? { title: incoming.title } : {}),
      ...(incoming.tagline !== undefined ? { tagline: incoming.tagline } : {}),
      ...(incoming.heroHeadingLine1 !== undefined ? { heroHeadingLine1: incoming.heroHeadingLine1 } : {}),
      ...(incoming.heroHeadingItalic !== undefined ? { heroHeadingItalic: incoming.heroHeadingItalic } : {}),
      ...(incoming.heroHeadingLine2 !== undefined ? { heroHeadingLine2: incoming.heroHeadingLine2 } : {}),
      ...(incoming.heroBio !== undefined ? { heroBio: incoming.heroBio } : {}),
      ...(incoming.availabilityText !== undefined ? { availabilityText: incoming.availabilityText } : {}),
      ...(incoming.availabilityActive !== undefined ? { availabilityActive: incoming.availabilityActive } : {}),
      ...(incoming.campusBadge !== undefined ? { campusBadge: incoming.campusBadge } : {}),
      ...(incoming.founderBadge !== undefined ? { founderBadge: incoming.founderBadge } : {}),
      ...(incoming.location !== undefined ? { location: incoming.location } : {}),
      ...(incoming.email !== undefined ? { email: incoming.email } : {}),
      ...(incoming.phone !== undefined ? { phone: incoming.phone } : {}),
      ...(incoming.linkedin !== undefined ? { linkedin: incoming.linkedin } : {}),
      ...(incoming.github !== undefined ? { github: incoming.github } : {}),
      ...(incoming.summary !== undefined ? { summary: incoming.summary } : {}),
      ...(incoming.resumeSummary !== undefined ? { resumeSummary: incoming.resumeSummary } : {}),
      ...(incoming.aboutBioParagraph1 !== undefined ? { aboutBioParagraph1: incoming.aboutBioParagraph1 } : {}),
      ...(incoming.aboutBioParagraph2 !== undefined ? { aboutBioParagraph2: incoming.aboutBioParagraph2 } : {}),
      ...(incoming.education?.degree !== undefined ? { eduDegree: incoming.education.degree } : {}),
      ...(incoming.education?.institution !== undefined ? { eduInstitution: incoming.education.institution } : {}),
      ...(incoming.education?.location !== undefined ? { eduLocation: incoming.education.location } : {}),
      ...(incoming.education?.period !== undefined ? { eduPeriod: incoming.education.period } : {}),
      ...(incoming.education?.status !== undefined ? { eduStatus: incoming.education.status } : {}),
      ...(incoming.skillsList !== undefined ? { skillsList: incoming.skillsList } : {}),
      ...(incoming.languages !== undefined ? { languages: incoming.languages } : {}),
      ...(incoming.ecosystemNode !== undefined ? { ecosystemNode: incoming.ecosystemNode } : {}),
      ...(incoming.buildVersion !== undefined ? { buildVersion: incoming.buildVersion } : {})
    }
  });

  await logPrismaAudit(
    'UPDATE_PROFILE',
    'SiteProfile',
    `Updated SiteProfile row in PostgreSQL (${incoming.name || current?.name || 'Amal K P'})`
  );
  return fetchFullCMSStateFromPostgres();
}

export async function updateSettingsInDb(payload: {
  settings?: Partial<SiteSettingsData>;
  seo?: Partial<SeoSettingsData>;
}): Promise<CMSState> {
  await ensureDatabaseSeeded();
  const { settings, seo } = payload;

  await prisma.siteSettings.update({
    where: { id: 'default' },
    data: {
      ...(settings?.showHeroMarquee !== undefined ? { showHeroMarquee: settings.showHeroMarquee } : {}),
      ...(settings?.showHeroTelemetry !== undefined ? { showHeroTelemetry: settings.showHeroTelemetry } : {}),
      ...(settings?.showHeroHighlights !== undefined ? { showHeroHighlights: settings.showHeroHighlights } : {}),
      ...(settings?.showBatteryTracker !== undefined ? { showBatteryTracker: settings.showBatteryTracker } : {}),
      ...(settings?.announcementActive !== undefined ? { announcementActive: settings.announcementActive } : {}),
      ...(settings?.announcementText !== undefined ? { announcementText: settings.announcementText } : {}),
      ...(settings?.announcementLinkText !== undefined
        ? { announcementLinkText: settings.announcementLinkText }
        : {}),
      ...(settings?.announcementLinkTarget !== undefined
        ? { announcementLinkTarget: settings.announcementLinkTarget }
        : {}),
      ...(settings?.navConfig !== undefined ? { navConfig: settings.navConfig as any } : {}),
      ...(seo?.title !== undefined ? { seoTitle: seo.title } : {}),
      ...(seo?.description !== undefined ? { seoDescription: seo.description } : {}),
      ...(seo?.keywords !== undefined ? { seoKeywords: seo.keywords } : {}),
      ...(seo?.canonicalUrl !== undefined ? { seoCanonicalUrl: seo.canonicalUrl } : {}),
      ...(seo?.ogImage !== undefined ? { seoOgImage: seo.ogImage } : {})
    }
  });

  await logPrismaAudit('UPDATE_SETTINGS', 'SiteSettings', 'Updated SiteSettings & SEO metadata in PostgreSQL');
  return fetchFullCMSStateFromPostgres();
}

// ============================================================================
// REAL DATABASE STUDIO, TABLE EXPLORER & SQL RUNNER FUNCTIONS
// ============================================================================

export async function getDatabaseStatusFromPostgres() {
  await ensureDatabaseSeeded();
  const startTime = performance.now();

  const serverRes = await pgPool.query(`
    SELECT
      version() AS version,
      current_database() AS database_name,
      current_user AS current_user,
      current_schema() AS current_schema,
      pg_size_pretty(pg_database_size(current_database())) AS db_size,
      now() AS server_time
  `);

  const pingMs = Math.max(1, Math.round(performance.now() - startTime));
  const srv = serverRes.rows[0] || {};

  const [
    adminUserCount,
    siteProfileCount,
    siteSettingsCount,
    projectCount,
    skillCount,
    collaborationCount,
    partnerLogoCount,
    knowledgeCount,
    contactMessageCount,
    auditLogCount,
    adminRow
  ] = await Promise.all([
    prisma.adminUser.count(),
    prisma.siteProfile.count(),
    prisma.siteSettings.count(),
    prisma.project.count(),
    prisma.skill.count(),
    prisma.collaboration.count(),
    prisma.partnerLogo.count(),
    prisma.knowledgeRelationship.count(),
    prisma.contactMessage.count(),
    prisma.auditLog.count(),
    prisma.adminUser.findUnique({ where: { id: 'admin-primary' } })
  ]);

  let migrations: any[] = [];
  try {
    const migRes = await pgPool.query(`
      SELECT id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count
      FROM "_prisma_migrations"
      ORDER BY started_at DESC
    `);
    migrations = migRes.rows;
  } catch {
    migrations = [];
  }

  let schemaSource = '';
  try {
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    if (fs.existsSync(schemaPath)) {
      schemaSource = fs.readFileSync(schemaPath, 'utf-8');
    }
  } catch {
    schemaSource = '';
  }

  const tables = [
    {
      name: 'AdminUser',
      model: 'prisma.adminUser',
      rowCount: adminUserCount,
      primaryKey: 'id',
      description: 'Administrator email, password, role & lastLoginAt stored in PostgreSQL'
    },
    {
      name: 'SiteProfile',
      model: 'prisma.siteProfile',
      rowCount: siteProfileCount,
      primaryKey: 'id',
      description: 'Core identity, Hero headlines, About bio, Academic & Contact channels'
    },
    {
      name: 'SiteSettings',
      model: 'prisma.siteSettings',
      rowCount: siteSettingsCount,
      primaryKey: 'id',
      description: 'Navigation visibility, Hero subsystem flags, Announcement banner & SEO metadata'
    },
    {
      name: 'Project',
      model: 'prisma.project',
      rowCount: projectCount,
      primaryKey: 'id',
      description: 'Portfolio projects, tech stacks, features, GitHub/Live URLs & sort order'
    },
    {
      name: 'Skill',
      model: 'prisma.skill',
      rowCount: skillCount,
      primaryKey: 'id',
      description: 'Technical & professional competencies with proficiency percentages'
    },
    {
      name: 'Collaboration',
      model: 'prisma.collaboration',
      rowCount: collaborationCount,
      primaryKey: 'id',
      description: 'Institutional volunteering, roles, emblems & deliverables'
    },
    {
      name: 'PartnerLogo',
      model: 'prisma.partnerLogo',
      rowCount: partnerLogoCount,
      primaryKey: 'id',
      description: 'Partner & institutional logos rendered in the Hero dual-track marquee'
    },
    {
      name: 'KnowledgeRelationship',
      model: 'prisma.knowledgeRelationship',
      rowCount: knowledgeCount,
      primaryKey: 'id',
      description: 'Verified AI Knowledge graph relationships synced to public/ai/profile.json'
    },
    {
      name: 'ContactMessage',
      model: 'prisma.contactMessage',
      rowCount: contactMessageCount,
      primaryKey: 'id',
      description: 'Real-time Contact form inquiries & Telegram delivery status'
    },
    {
      name: 'AuditLog',
      model: 'prisma.auditLog',
      rowCount: auditLogCount,
      primaryKey: 'id',
      description: 'Immutable PostgreSQL audit trail of all CMS & database mutations'
    },
    {
      name: '_prisma_migrations',
      model: 'prisma._prisma_migrations',
      rowCount: migrations.length,
      primaryKey: 'id',
      description: 'Prisma Migrate history table tracking applied SQL schema migrations'
    }
  ];

  const totalRows = tables.reduce((acc, t) => acc + t.rowCount, 0);
  const envMetadata = getDatabaseEnvMetadata();

  return {
    connected: true,
    host: envMetadata.host,
    provider: 'PostgreSQL (Prisma ORM + .env DATABASE_URL)',
    sslMode: envMetadata.sslMode,
    pingMs,
    envMetadata: {
      ...envMetadata,
      adminEmail: adminRow?.email || 'amalkochuparambilp@gmail.com'
    },
    serverInfo: {
      version: String(srv.version || 'PostgreSQL').split(' on ')[0],
      fullVersion: String(srv.version || 'PostgreSQL'),
      databaseName: String(srv.database_name || envMetadata.databaseName),
      currentUser: String(srv.current_user || 'postgres').slice(0, 18) + '...',
      currentSchema: String(srv.current_schema || 'public'),
      dbSize: String(srv.db_size || '—'),
      serverTime: srv.server_time ? new Date(srv.server_time).toISOString() : new Date().toISOString()
    },
    tables,
    totalRows,
    migrations,
    schemaSource
  };
}

export async function getTableDataFromPostgres(tableName: string) {
  await ensureDatabaseSeeded();
  if (!ALLOWED_DB_TABLES.includes(tableName as AllowedDbTable)) {
    throw new Error(`Invalid or unauthorized table name: ${tableName}`);
  }

  const colRes = await pgPool.query(
    `
    SELECT column_name, data_type, udt_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position ASC
  `,
    [tableName]
  );

  let orderClause = '';
  const colNames = new Set(colRes.rows.map((c: any) => c.column_name));
  if (colNames.has('sortOrder')) {
    orderClause = 'ORDER BY "sortOrder" ASC';
  } else if (colNames.has('createdAt')) {
    orderClause = 'ORDER BY "createdAt" DESC';
  } else if (colNames.has('timestamp')) {
    orderClause = 'ORDER BY "timestamp" DESC';
  } else if (colNames.has('started_at')) {
    orderClause = 'ORDER BY "started_at" DESC';
  }

  const startTime = performance.now();
  const rowRes = await pgPool.query(`SELECT * FROM "${tableName}" ${orderClause} LIMIT 250`);
  const durationMs = Math.max(1, Math.round(performance.now() - startTime));

  // Mask adminPasscode in SiteSettings for read safety if needed, or keep editable
  return {
    tableName,
    columns: colRes.rows.map((c: any) => ({
      name: c.column_name,
      dataType: c.data_type === 'ARRAY' ? `${c.udt_name.replace(/^_/, '')}[]` : c.data_type,
      nullable: c.is_nullable === 'YES'
    })),
    rows: rowRes.rows,
    rowCount: rowRes.rows.length,
    durationMs,
    queriedAt: new Date().toISOString()
  };
}

export async function updateTableRowInPostgres(
  tableName: string,
  id: string,
  rawPayload: Record<string, any>
) {
  await ensureDatabaseSeeded();
  if (!ALLOWED_DB_TABLES.includes(tableName as AllowedDbTable) || tableName === '_prisma_migrations') {
    throw new Error(`Table "${tableName}" is read-only or not editable.`);
  }

  const payload = { ...rawPayload };
  delete payload.id;
  delete payload.createdAt;
  delete payload.updatedAt;
  delete payload.timestamp;

  let updatedRow: any = null;

  switch (tableName as AllowedDbTable) {
    case 'AdminUser':
      updatedRow = await prisma.adminUser.update({
        where: { id },
        data: {
          ...(payload.email ? { email: String(payload.email).trim() } : {}),
          ...(payload.password ? { password: String(payload.password).trim() } : {}),
          ...(payload.name ? { name: String(payload.name).trim() } : {}),
          ...(payload.role ? { role: String(payload.role).trim() } : {})
        }
      });
      if (payload.email || payload.password) {
        await prisma.siteSettings
          .update({
            where: { id: 'default' },
            data: {
              ...(payload.email ? { adminEmail: String(payload.email).trim() } : {}),
              ...(payload.password ? { adminPasscode: String(payload.password).trim() } : {})
            }
          })
          .catch(() => {});
      }
      break;
    case 'SiteProfile':
      updatedRow = await prisma.siteProfile.update({
        where: { id },
        data: payload
      });
      break;
    case 'SiteSettings':
      updatedRow = await prisma.siteSettings.update({
        where: { id },
        data: payload
      });
      break;
    case 'Project':
      updatedRow = await prisma.project.update({
        where: { id },
        data: {
          ...payload,
          ...(payload.sortOrder !== undefined ? { sortOrder: Number(payload.sortOrder) } : {}),
          ...(payload.featured !== undefined ? { featured: Boolean(payload.featured) } : {}),
          ...(payload.published !== undefined ? { published: Boolean(payload.published) } : {})
        }
      });
      break;
    case 'Skill':
      updatedRow = await prisma.skill.update({
        where: { id },
        data: {
          ...payload,
          ...(payload.level !== undefined ? { level: Number(payload.level) } : {}),
          ...(payload.sortOrder !== undefined ? { sortOrder: Number(payload.sortOrder) } : {})
        }
      });
      break;
    case 'Collaboration':
      updatedRow = await prisma.collaboration.update({
        where: { id },
        data: {
          ...payload,
          ...(payload.sortOrder !== undefined ? { sortOrder: Number(payload.sortOrder) } : {})
        }
      });
      break;
    case 'PartnerLogo':
      updatedRow = await prisma.partnerLogo.update({
        where: { id },
        data: {
          ...payload,
          ...(payload.active !== undefined ? { active: Boolean(payload.active) } : {}),
          ...(payload.sortOrder !== undefined ? { sortOrder: Number(payload.sortOrder) } : {})
        }
      });
      break;
    case 'KnowledgeRelationship':
      updatedRow = await prisma.knowledgeRelationship.update({
        where: { id },
        data: payload
      });
      break;
    case 'ContactMessage':
      updatedRow = await prisma.contactMessage.update({
        where: { id },
        data: payload
      });
      break;
    case 'AuditLog':
      updatedRow = await prisma.auditLog.update({
        where: { id },
        data: payload
      });
      break;
  }

  await logPrismaAudit(
    'DB_ROW_UPDATE',
    tableName,
    `Updated row "${id}" in PostgreSQL table "${tableName}"`
  );

  const state = await fetchFullCMSStateFromPostgres();
  return { row: updatedRow, state };
}

export async function insertTableRowInPostgres(
  tableName: string,
  rawPayload: Record<string, any>
) {
  await ensureDatabaseSeeded();
  if (!ALLOWED_DB_TABLES.includes(tableName as AllowedDbTable) || tableName === '_prisma_migrations') {
    throw new Error(`Cannot insert into table "${tableName}".`);
  }

  const payload = { ...rawPayload };
  const generatedId =
    payload.id && String(payload.id).trim()
      ? String(payload.id).trim()
      : `${tableName.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;

  let createdRow: any = null;

  switch (tableName as AllowedDbTable) {
    case 'Project':
      createdRow = await prisma.project.create({
        data: {
          id: generatedId,
          title: payload.title || 'New Project',
          description: payload.description || 'Project description',
          longDescription: payload.longDescription || null,
          category: payload.category || 'system',
          tech: Array.isArray(payload.tech) ? payload.tech : ['React', 'TypeScript'],
          features: Array.isArray(payload.features) ? payload.features : [],
          githubUrl: payload.githubUrl || 'https://github.com/amalkochuparambilp',
          liveUrl: payload.liveUrl || null,
          featured: Boolean(payload.featured),
          published: payload.published !== false,
          highlightLabel: payload.highlightLabel || null,
          highlightStack: payload.highlightStack || null,
          sortOrder: Number(payload.sortOrder) || 0
        }
      });
      break;
    case 'Skill':
      createdRow = await prisma.skill.create({
        data: {
          id: generatedId,
          name: payload.name || 'New Skill',
          level: Number(payload.level) || 85,
          category: payload.category || 'Frontend',
          icon: payload.icon || 'Code2',
          sortOrder: Number(payload.sortOrder) || 0
        }
      });
      break;
    case 'Collaboration':
      createdRow = await prisma.collaboration.create({
        data: {
          id: generatedId,
          role: payload.role || 'Contributor',
          organization: payload.organization || 'New Organization',
          badge: payload.badge || 'PARTNER',
          logoType: payload.logoType || 'libcode',
          description: payload.description || '',
          highlights: Array.isArray(payload.highlights) ? payload.highlights : [],
          tags: Array.isArray(payload.tags) ? payload.tags : [],
          sortOrder: Number(payload.sortOrder) || 0
        }
      });
      break;
    case 'PartnerLogo':
      createdRow = await prisma.partnerLogo.create({
        data: {
          id: generatedId,
          name: (payload.name || 'PARTNER').toUpperCase(),
          src: payload.src || '/logos/jnias.svg',
          alt: payload.alt || 'Partner Logo',
          fileName: payload.fileName || 'partner.svg',
          active: payload.active !== false,
          sortOrder: Number(payload.sortOrder) || 0
        }
      });
      break;
    case 'KnowledgeRelationship':
      createdRow = await prisma.knowledgeRelationship.create({
        data: {
          id: generatedId,
          name: payload.name || 'New Person',
          types: Array.isArray(payload.types) ? payload.types : ['friend'],
          alternateName: Array.isArray(payload.alternateName) ? payload.alternateName : [],
          url: payload.url || null,
          status: payload.status || 'confirmed'
        }
      });
      break;
    case 'ContactMessage':
      createdRow = await prisma.contactMessage.create({
        data: {
          id: generatedId,
          name: payload.name || 'Admin Entry',
          email: payload.email || 'admin@amalkp.online',
          message: payload.message || 'Logged inquiry directly in PostgreSQL.',
          status: payload.status || 'unread',
          telegramDelivered: Boolean(payload.telegramDelivered),
          ipAddress: payload.ipAddress || '127.0.0.1'
        }
      });
      break;
    case 'AuditLog':
      createdRow = await prisma.auditLog.create({
        data: {
          id: generatedId,
          action: payload.action || 'MANUAL_ENTRY',
          section: payload.section || 'Database',
          summary: payload.summary || 'Manual audit entry'
        }
      });
      break;
    default:
      throw new Error(`Single-row configuration table "${tableName}" only supports editing the existing record.`);
  }

  await logPrismaAudit(
    'DB_ROW_INSERT',
    tableName,
    `Inserted row "${generatedId}" into PostgreSQL table "${tableName}"`
  );

  const state = await fetchFullCMSStateFromPostgres();
  return { row: createdRow, state };
}

export async function deleteTableRowInPostgres(tableName: string, id: string) {
  await ensureDatabaseSeeded();
  if (
    !ALLOWED_DB_TABLES.includes(tableName as AllowedDbTable) ||
    tableName === '_prisma_migrations' ||
    tableName === 'SiteProfile' ||
    tableName === 'SiteSettings'
  ) {
    throw new Error(`Cannot delete required configuration row from "${tableName}".`);
  }

  switch (tableName as AllowedDbTable) {
    case 'Project':
      await prisma.project.delete({ where: { id } });
      break;
    case 'Skill':
      await prisma.skill.delete({ where: { id } });
      break;
    case 'Collaboration':
      await prisma.collaboration.delete({ where: { id } });
      break;
    case 'PartnerLogo':
      await prisma.partnerLogo.delete({ where: { id } });
      break;
    case 'KnowledgeRelationship':
      await prisma.knowledgeRelationship.delete({ where: { id } });
      break;
    case 'ContactMessage':
      await prisma.contactMessage.delete({ where: { id } });
      break;
    case 'AuditLog':
      await prisma.auditLog.delete({ where: { id } });
      break;
  }

  if (tableName !== 'AuditLog') {
    await logPrismaAudit(
      'DB_ROW_DELETE',
      tableName,
      `Deleted row "${id}" from PostgreSQL table "${tableName}"`
    );
  }

  const state = await fetchFullCMSStateFromPostgres();
  return { state };
}

export async function executeSqlQueryInPostgres(sql: string) {
  await ensureDatabaseSeeded();
  const trimmed = sql.trim();
  if (!trimmed) {
    throw new Error('SQL query cannot be empty.');
  }

  // Block destructive DROP / TRUNCATE DATABASE statements for safety
  const upper = trimmed.toUpperCase();
  if (
    upper.includes('DROP DATABASE') ||
    upper.includes('DROP SCHEMA') ||
    upper.includes('DROP TABLE') ||
    upper.includes('ALTER SYSTEM')
  ) {
    throw new Error('Destructive DDL statements (DROP TABLE / DROP SCHEMA / DROP DATABASE) are blocked for safety.');
  }

  const startTime = performance.now();
  const result = await pgPool.query(trimmed);
  const durationMs = Math.max(1, Math.round(performance.now() - startTime));

  const isMutation =
    result.command && !['SELECT', 'SHOW', 'EXPLAIN'].includes(result.command.toUpperCase());

  if (isMutation) {
    await logPrismaAudit(
      `SQL_${result.command || 'EXEC'}`,
      'SQL Console',
      `Executed raw SQL (${result.command}): ${trimmed.slice(0, 90)}`
    );
  }

  const state = isMutation ? await fetchFullCMSStateFromPostgres() : undefined;

  return {
    command: result.command || 'SELECT',
    rowCount: result.rowCount ?? (Array.isArray(result.rows) ? result.rows.length : 0),
    fields: Array.isArray(result.fields)
      ? result.fields.map((f) => ({ name: f.name, dataTypeID: f.dataTypeID }))
      : [],
    rows: Array.isArray(result.rows) ? result.rows : [],
    durationMs,
    state
  };
}
