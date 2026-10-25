import { CMSState } from '../types';

export const PRISMA_SCHEMA_SOURCE = `// Prisma PostgreSQL Schema for Amal K P — DZt Full-Control CMS
// Compatible with PostgreSQL 15+ and Prisma ORM

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model SiteProfile {
  id                  String   @id @default("default")
  name                String   @default("Amal K P")
  title               String   @default("BCA Candidate & Founder of DZt")
  tagline             String
  heroHeadingLine1    String   @default("Crafting digital")
  heroHeadingItalic   String   @default("ecosystems")
  heroHeadingLine2    String   @default("with precision & purpose.")
  heroBio             String
  availabilityText    String   @default("AVAILABLE FOR COLLABORATIONS")
  availabilityActive  Boolean  @default(true)
  campusBadge         String   @default("JNIAS BALAGRAM (BCA 2026)")
  founderBadge        String   @default("Founder / Lead @ DZt")
  location            String
  email               String
  phone               String
  linkedin            String
  github              String
  summary             String
  resumeSummary       String
  aboutBioParagraph1  String
  aboutBioParagraph2  String
  eduDegree           String
  eduInstitution      String
  eduLocation         String
  eduPeriod           String
  eduStatus           String
  skillsList          String[]
  languages           String[]
  ecosystemNode       String   @default("BALAGRAM_NODE")
  buildVersion        String   @default("STABLE_BUILD_v2.0")
  updatedAt           DateTime @updatedAt
}

model SiteSettings {
  id                     String   @id @default("default")
  showHeroMarquee        Boolean  @default(true)
  showHeroTelemetry      Boolean  @default(true)
  showHeroHighlights     Boolean  @default(true)
  showBatteryTracker     Boolean  @default(true)
  announcementActive     Boolean  @default(false)
  announcementText       String   @default("")
  announcementLinkText   String   @default("")
  announcementLinkTarget String   @default("projects")
  navConfig              Json
  seoTitle               String
  seoDescription         String
  seoKeywords            String
  seoCanonicalUrl        String   @default("https://amalkp.online/")
  seoOgImage             String   @default("https://amalkp.online/logos/openai-wordmark-dark.svg")
  adminEmail             String   @default("amalkochuparambilp@gmail.com")
  adminPasscode          String   @default("dzt2026")
  updatedAt              DateTime @updatedAt
}

model AdminUser {
  id          String    @id @default("admin-primary")
  email       String    @unique @default("amalkochuparambilp@gmail.com")
  password    String    @default("dzt2026")
  name        String    @default("Amal K P")
  role        String    @default("Administrator")
  lastLoginAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Project {
  id              String   @id
  title           String
  description     String
  longDescription String?
  category        String   @default("system")
  tech            String[]
  features        String[]
  githubUrl       String?
  liveUrl         String?
  featured        Boolean  @default(false)
  published       Boolean  @default(true)
  highlightLabel  String?
  highlightStack  String?
  sortOrder       Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Skill {
  id        String   @id
  name      String
  level     Int      @default(85)
  category  String   @default("Frontend")
  icon      String   @default("Code2")
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Collaboration {
  id           String   @id
  role         String
  organization String
  badge        String
  logoType     String   @default("libcode")
  description  String
  highlights   String[]
  tags         String[]
  sortOrder    Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model PartnerLogo {
  id        String   @id
  name      String
  src       String
  alt       String
  fileName  String
  active    Boolean  @default(true)
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
}

model KnowledgeRelationship {
  id            String   @id
  types         String[]
  name          String
  alternateName String[]
  url           String?
  status        String   @default("confirmed")
  createdAt     DateTime @default(now())
}

model ContactMessage {
  id                String   @id
  name              String
  email             String
  message           String
  status            String   @default("unread")
  telegramDelivered Boolean  @default(false)
  ipAddress         String?
  createdAt         DateTime @default(now())
}
`;

function escSql(val: string | undefined | null): string {
  if (val === undefined || val === null) return 'NULL';
  return `'${String(val).replace(/'/g, "''")}'`;
}

function escSqlArray(arr: string[] | undefined): string {
  if (!arr || arr.length === 0) return `'{}'::TEXT[]`;
  const items = arr.map((item) => `"${String(item).replace(/"/g, '\\"').replace(/'/g, "''")}"`).join(',');
  return `'{${items}}'::TEXT[]`;
}

export function generatePostgresSqlDump(state: CMSState): string {
  const lines: string[] = [
    '-- ============================================================================',
    '-- Amal K P | DZt Ecosystem — PostgreSQL Schema & Live Data Dump',
    `-- Generated at: ${new Date().toISOString()}`,
    '-- Compatible with PostgreSQL 15+ & Prisma ORM',
    '-- ============================================================================',
    '',
    'BEGIN;',
    '',
    'CREATE TABLE IF NOT EXISTS "SiteProfile" (',
    '  "id" TEXT PRIMARY KEY,',
    '  "name" TEXT NOT NULL,',
    '  "title" TEXT NOT NULL,',
    '  "tagline" TEXT NOT NULL,',
    '  "heroHeadingLine1" TEXT NOT NULL,',
    '  "heroHeadingItalic" TEXT NOT NULL,',
    '  "heroHeadingLine2" TEXT NOT NULL,',
    '  "heroBio" TEXT NOT NULL,',
    '  "availabilityText" TEXT NOT NULL,',
    '  "availabilityActive" BOOLEAN NOT NULL DEFAULT true,',
    '  "campusBadge" TEXT NOT NULL,',
    '  "founderBadge" TEXT NOT NULL,',
    '  "location" TEXT NOT NULL,',
    '  "email" TEXT NOT NULL,',
    '  "phone" TEXT NOT NULL,',
    '  "linkedin" TEXT NOT NULL,',
    '  "github" TEXT NOT NULL,',
    '  "summary" TEXT NOT NULL,',
    '  "resumeSummary" TEXT NOT NULL,',
    '  "aboutBioParagraph1" TEXT NOT NULL,',
    '  "aboutBioParagraph2" TEXT NOT NULL,',
    '  "eduDegree" TEXT NOT NULL,',
    '  "eduInstitution" TEXT NOT NULL,',
    '  "eduLocation" TEXT NOT NULL,',
    '  "eduPeriod" TEXT NOT NULL,',
    '  "eduStatus" TEXT NOT NULL,',
    '  "skillsList" TEXT[] NOT NULL,',
    '  "languages" TEXT[] NOT NULL,',
    '  "ecosystemNode" TEXT NOT NULL,',
    '  "buildVersion" TEXT NOT NULL,',
    '  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()',
    ');',
    '',
    'CREATE TABLE IF NOT EXISTS "Project" (',
    '  "id" TEXT PRIMARY KEY,',
    '  "title" TEXT NOT NULL,',
    '  "description" TEXT NOT NULL,',
    '  "longDescription" TEXT,',
    '  "category" TEXT NOT NULL,',
    '  "tech" TEXT[] NOT NULL,',
    '  "features" TEXT[] NOT NULL,',
    '  "githubUrl" TEXT,',
    '  "liveUrl" TEXT,',
    '  "featured" BOOLEAN NOT NULL DEFAULT false,',
    '  "published" BOOLEAN NOT NULL DEFAULT true,',
    '  "highlightLabel" TEXT,',
    '  "highlightStack" TEXT,',
    '  "sortOrder" INTEGER NOT NULL DEFAULT 0,',
    '  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()',
    ');',
    '',
    'CREATE TABLE IF NOT EXISTS "Skill" (',
    '  "id" TEXT PRIMARY KEY,',
    '  "name" TEXT NOT NULL,',
    '  "level" INTEGER NOT NULL,',
    '  "category" TEXT NOT NULL,',
    '  "icon" TEXT NOT NULL,',
    '  "sortOrder" INTEGER NOT NULL DEFAULT 0',
    ');',
    '',
    'CREATE TABLE IF NOT EXISTS "Collaboration" (',
    '  "id" TEXT PRIMARY KEY,',
    '  "role" TEXT NOT NULL,',
    '  "organization" TEXT NOT NULL,',
    '  "badge" TEXT NOT NULL,',
    '  "logoType" TEXT NOT NULL,',
    '  "description" TEXT NOT NULL,',
    '  "highlights" TEXT[] NOT NULL,',
    '  "tags" TEXT[] NOT NULL,',
    '  "sortOrder" INTEGER NOT NULL DEFAULT 0',
    ');',
    '',
    'CREATE TABLE IF NOT EXISTS "PartnerLogo" (',
    '  "id" TEXT PRIMARY KEY,',
    '  "name" TEXT NOT NULL,',
    '  "src" TEXT NOT NULL,',
    '  "alt" TEXT NOT NULL,',
    '  "fileName" TEXT NOT NULL,',
    '  "active" BOOLEAN NOT NULL DEFAULT true,',
    '  "sortOrder" INTEGER NOT NULL DEFAULT 0',
    ');',
    '',
    '-- Upsert SiteProfile',
    `INSERT INTO "SiteProfile" ("id", "name", "title", "tagline", "heroHeadingLine1", "heroHeadingItalic", "heroHeadingLine2", "heroBio", "availabilityText", "availabilityActive", "campusBadge", "founderBadge", "location", "email", "phone", "linkedin", "github", "summary", "resumeSummary", "aboutBioParagraph1", "aboutBioParagraph2", "eduDegree", "eduInstitution", "eduLocation", "eduPeriod", "eduStatus", "skillsList", "languages", "ecosystemNode", "buildVersion") VALUES (`,
    `  'default', ${escSql(state.profile.name)}, ${escSql(state.profile.title)}, ${escSql(state.profile.tagline)}, ${escSql(state.profile.heroHeadingLine1)}, ${escSql(state.profile.heroHeadingItalic)}, ${escSql(state.profile.heroHeadingLine2)}, ${escSql(state.profile.heroBio)}, ${escSql(state.profile.availabilityText)}, ${state.profile.availabilityActive}, ${escSql(state.profile.campusBadge)}, ${escSql(state.profile.founderBadge)}, ${escSql(state.profile.location)}, ${escSql(state.profile.email)}, ${escSql(state.profile.phone)}, ${escSql(state.profile.linkedin)}, ${escSql(state.profile.github)}, ${escSql(state.profile.summary)}, ${escSql(state.profile.resumeSummary)}, ${escSql(state.profile.aboutBioParagraph1)}, ${escSql(state.profile.aboutBioParagraph2)}, ${escSql(state.profile.education.degree)}, ${escSql(state.profile.education.institution)}, ${escSql(state.profile.education.location)}, ${escSql(state.profile.education.period)}, ${escSql(state.profile.education.status)}, ${escSqlArray(state.profile.skillsList)}, ${escSqlArray(state.profile.languages)}, ${escSql(state.profile.ecosystemNode)}, ${escSql(state.profile.buildVersion)}`,
    ') ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "title" = EXCLUDED."title", "tagline" = EXCLUDED."tagline", "updatedAt" = NOW();',
    '',
    '-- Seed Projects'
  ];

  state.projects.forEach((p, idx) => {
    lines.push(
      `INSERT INTO "Project" ("id", "title", "description", "longDescription", "category", "tech", "features", "githubUrl", "liveUrl", "featured", "published", "highlightLabel", "highlightStack", "sortOrder") VALUES (${escSql(p.id)}, ${escSql(p.title)}, ${escSql(p.description)}, ${escSql(p.longDescription)}, ${escSql(p.category)}, ${escSqlArray(p.tech)}, ${escSqlArray(p.features)}, ${escSql(p.githubUrl)}, ${escSql(p.liveUrl)}, ${Boolean(p.featured)}, ${p.published !== false}, ${escSql(p.highlightLabel)}, ${escSql(p.highlightStack)}, ${p.sortOrder ?? idx}) ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description", "longDescription" = EXCLUDED."longDescription", "tech" = EXCLUDED."tech", "features" = EXCLUDED."features", "featured" = EXCLUDED."featured", "published" = EXCLUDED."published", "sortOrder" = EXCLUDED."sortOrder";`
    );
  });

  lines.push('', '-- Seed Skills');
  state.skills.forEach((s, idx) => {
    const id = s.id || `skill-${idx + 1}`;
    lines.push(
      `INSERT INTO "Skill" ("id", "name", "level", "category", "icon", "sortOrder") VALUES (${escSql(id)}, ${escSql(s.name)}, ${s.level}, ${escSql(s.category)}, ${escSql(s.icon)}, ${s.sortOrder ?? idx}) ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "level" = EXCLUDED."level", "category" = EXCLUDED."category", "icon" = EXCLUDED."icon";`
    );
  });

  lines.push('', '-- Seed Collaborations');
  state.collaborations.forEach((c, idx) => {
    lines.push(
      `INSERT INTO "Collaboration" ("id", "role", "organization", "badge", "logoType", "description", "highlights", "tags", "sortOrder") VALUES (${escSql(c.id)}, ${escSql(c.role)}, ${escSql(c.organization)}, ${escSql(c.badge)}, ${escSql(c.logoType)}, ${escSql(c.description)}, ${escSqlArray(c.highlights)}, ${escSqlArray(c.tags)}, ${c.sortOrder ?? idx}) ON CONFLICT ("id") DO UPDATE SET "role" = EXCLUDED."role", "organization" = EXCLUDED."organization", "description" = EXCLUDED."description";`
    );
  });

  lines.push('', 'COMMIT;');
  return lines.join('\n');
}

export function generatePrismaSeedScript(state: CMSState): string {
  return `// prisma/seed.ts — Auto-generated from DZt Full-Control CMS
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Amal K P — DZt PostgreSQL Database via Prisma...');

  await prisma.siteProfile.upsert({
    where: { id: 'default' },
    update: {},
    create: ${JSON.stringify(
      {
        id: 'default',
        name: state.profile.name,
        title: state.profile.title,
        tagline: state.profile.tagline,
        heroHeadingLine1: state.profile.heroHeadingLine1,
        heroHeadingItalic: state.profile.heroHeadingItalic,
        heroHeadingLine2: state.profile.heroHeadingLine2,
        heroBio: state.profile.heroBio,
        availabilityText: state.profile.availabilityText,
        availabilityActive: state.profile.availabilityActive,
        campusBadge: state.profile.campusBadge,
        founderBadge: state.profile.founderBadge,
        location: state.profile.location,
        email: state.profile.email,
        phone: state.profile.phone,
        linkedin: state.profile.linkedin,
        github: state.profile.github,
        summary: state.profile.summary,
        resumeSummary: state.profile.resumeSummary,
        aboutBioParagraph1: state.profile.aboutBioParagraph1,
        aboutBioParagraph2: state.profile.aboutBioParagraph2,
        eduDegree: state.profile.education.degree,
        eduInstitution: state.profile.education.institution,
        eduLocation: state.profile.education.location,
        eduPeriod: state.profile.education.period,
        eduStatus: state.profile.education.status,
        skillsList: state.profile.skillsList,
        languages: state.profile.languages,
        ecosystemNode: state.profile.ecosystemNode,
        buildVersion: state.profile.buildVersion
      },
      null,
      4
    )}
  });

  const projects = ${JSON.stringify(state.projects, null, 2)};
  for (const proj of projects) {
    await prisma.project.upsert({
      where: { id: proj.id },
      update: proj,
      create: {
        id: proj.id,
        title: proj.title,
        description: proj.description,
        longDescription: proj.longDescription || null,
        category: proj.category,
        tech: proj.tech,
        features: proj.features || [],
        githubUrl: proj.githubUrl || null,
        liveUrl: proj.liveUrl || null,
        featured: Boolean(proj.featured),
        published: proj.published !== false,
        highlightLabel: proj.highlightLabel || null,
        highlightStack: proj.highlightStack || null,
        sortOrder: proj.sortOrder || 0
      }
    });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;
}
