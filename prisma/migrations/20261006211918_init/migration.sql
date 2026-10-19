-- CreateTable
CREATE TABLE "SiteProfile" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL DEFAULT 'Amal K P',
    "title" TEXT NOT NULL DEFAULT 'BCA Candidate & Founder of DZt',
    "tagline" TEXT NOT NULL,
    "heroHeadingLine1" TEXT NOT NULL DEFAULT 'Crafting digital',
    "heroHeadingItalic" TEXT NOT NULL DEFAULT 'ecosystems',
    "heroHeadingLine2" TEXT NOT NULL DEFAULT 'with precision & purpose.',
    "heroBio" TEXT NOT NULL,
    "availabilityText" TEXT NOT NULL DEFAULT 'AVAILABLE FOR COLLABORATIONS',
    "availabilityActive" BOOLEAN NOT NULL DEFAULT true,
    "campusBadge" TEXT NOT NULL DEFAULT 'JNIAS BALAGRAM (BCA 2026)',
    "founderBadge" TEXT NOT NULL DEFAULT 'Founder / Lead @ DZt',
    "location" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "linkedin" TEXT NOT NULL,
    "github" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "resumeSummary" TEXT NOT NULL,
    "aboutBioParagraph1" TEXT NOT NULL,
    "aboutBioParagraph2" TEXT NOT NULL,
    "eduDegree" TEXT NOT NULL,
    "eduInstitution" TEXT NOT NULL,
    "eduLocation" TEXT NOT NULL,
    "eduPeriod" TEXT NOT NULL,
    "eduStatus" TEXT NOT NULL,
    "skillsList" TEXT[],
    "languages" TEXT[],
    "ecosystemNode" TEXT NOT NULL DEFAULT 'BALAGRAM_NODE',
    "buildVersion" TEXT NOT NULL DEFAULT 'STABLE_BUILD_v2.0',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "showHeroMarquee" BOOLEAN NOT NULL DEFAULT true,
    "showHeroTelemetry" BOOLEAN NOT NULL DEFAULT true,
    "showHeroHighlights" BOOLEAN NOT NULL DEFAULT true,
    "showBatteryTracker" BOOLEAN NOT NULL DEFAULT true,
    "announcementActive" BOOLEAN NOT NULL DEFAULT false,
    "announcementText" TEXT NOT NULL DEFAULT '',
    "announcementLinkText" TEXT NOT NULL DEFAULT '',
    "announcementLinkTarget" TEXT NOT NULL DEFAULT 'projects',
    "navConfig" JSONB NOT NULL,
    "seoTitle" TEXT NOT NULL,
    "seoDescription" TEXT NOT NULL,
    "seoKeywords" TEXT NOT NULL,
    "seoCanonicalUrl" TEXT NOT NULL DEFAULT 'https://amalkp.online/',
    "seoOgImage" TEXT NOT NULL DEFAULT 'https://amalkp.online/logos/openai-wordmark-dark.svg',
    "adminPasscode" TEXT NOT NULL DEFAULT 'dzt2026',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "longDescription" TEXT,
    "category" TEXT NOT NULL DEFAULT 'system',
    "tech" TEXT[],
    "features" TEXT[],
    "githubUrl" TEXT,
    "liveUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "highlightLabel" TEXT,
    "highlightStack" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 85,
    "category" TEXT NOT NULL DEFAULT 'Frontend',
    "icon" TEXT NOT NULL DEFAULT 'Code2',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collaboration" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "badge" TEXT NOT NULL,
    "logoType" TEXT NOT NULL DEFAULT 'libcode',
    "description" TEXT NOT NULL,
    "highlights" TEXT[],
    "tags" TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collaboration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerLogo" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "src" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerLogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeRelationship" (
    "id" TEXT NOT NULL,
    "types" TEXT[],
    "name" TEXT NOT NULL,
    "alternateName" TEXT[],
    "url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unread',
    "telegramDelivered" BOOLEAN NOT NULL DEFAULT false,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
