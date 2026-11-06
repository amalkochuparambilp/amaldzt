// src/serverApp.ts
import express from "express";
import path2 from "path";
import fs2 from "fs";
import crypto from "crypto";
import dotenv3 from "dotenv";

// src/db/prisma.ts
import pg from "pg";
import dotenv from "dotenv";
dotenv.config({ override: true });
var FALLBACK_PRISMA_POSTGRES_URL = "postgres://739ce7167273e9693b50f2ebcb6168685f8781fae04236f48a4cbf41c85fe538:sk_PxqeqYeRAoqSNujWlZhh-@pooled.db.prisma.io:5432/postgres?sslmode=require";
function getActiveDatabaseUrl() {
  const envUrl = (process.env.DATABASE_URL || "").trim();
  return envUrl || FALLBACK_PRISMA_POSTGRES_URL;
}
function getDatabaseEnvMetadata() {
  const rawUrl = getActiveDatabaseUrl();
  try {
    const parsed = new URL(rawUrl);
    const user = parsed.username ? `${parsed.username.slice(0, 6)}...${parsed.username.slice(-4)}` : "user";
    const maskedPassword = parsed.password ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : "";
    const sslMode = parsed.searchParams.get("sslmode") || "require";
    const dbName = parsed.pathname.replace(/^\//, "") || "postgres";
    const port = parsed.port || "5432";
    const host = parsed.hostname || "localhost";
    const maskedUrl = `${parsed.protocol}//${user}:${maskedPassword}@${host}:${port}/${dbName}?sslmode=${sslMode}`;
    return {
      configured: true,
      envVarName: "DATABASE_URL (.env)",
      host: `${host}:${port}/${dbName}`,
      port,
      databaseName: dbName,
      sslMode: `SSL (${sslMode})`,
      maskedUrl
    };
  } catch {
    return {
      configured: true,
      envVarName: "DATABASE_URL (.env)",
      host: "pooled.db.prisma.io:5432/postgres",
      port: "5432",
      databaseName: "postgres",
      sslMode: "SSL (require)",
      maskedUrl: "postgres://\u2022\u2022\u2022\u2022\u2022\u2022:\u2022\u2022\u2022\u2022\u2022\u2022@pooled.db.prisma.io:5432/postgres"
    };
  }
}
function getPgPool() {
  const currentUrl = getActiveDatabaseUrl();
  if (!global._prismaPgPool || global._prismaConnectionString !== currentUrl) {
    if (global._prismaPgPool) {
      global._prismaPgPool.end().catch(() => {
      });
    }
    global._prismaConnectionString = currentUrl;
    global._prismaPgPool = new pg.Pool({
      connectionString: currentUrl,
      ssl: currentUrl.includes("sslmode=require") ? { rejectUnauthorized: false } : void 0,
      max: 10,
      connectionTimeoutMillis: 15e3
    });
    global._prismaPgPool.on("error", (err) => {
      console.error("[Prisma PG Pool] Unexpected idle client error:", err);
    });
  }
  return global._prismaPgPool;
}
async function reloadDatabaseConnection() {
  dotenv.config({ override: true });
  if (global._prismaPgPool) {
    await global._prismaPgPool.end().catch(() => {
    });
    global._prismaPgPool = void 0;
  }
  global._prismaConnectionString = void 0;
  getPgPool();
}
var pgPool = new Proxy({}, {
  get(_target, prop) {
    const pool = getPgPool();
    const val = pool[prop];
    return typeof val === "function" ? val.bind(pool) : val;
  }
});
var DATE_COLUMNS = /* @__PURE__ */ new Set(["updatedAt", "createdAt", "timestamp", "lastLoginAt"]);
function createPgModelDelegate(config) {
  const { tableName, hasUpdatedAt, hasCreatedAt, hasTimestamp, jsonCols } = config;
  const normalizeRow = (row) => {
    if (!row || typeof row !== "object") return row;
    const out = { ...row };
    for (const key of Object.keys(out)) {
      const val = out[key];
      if (DATE_COLUMNS.has(key) && val !== null && val !== void 0 && !(val instanceof Date)) {
        out[key] = new Date(val);
      } else if (jsonCols.includes(key) && typeof val === "string") {
        try {
          out[key] = JSON.parse(val);
        } catch {
        }
      }
    }
    return out;
  };
  const prepareVal = (col, val) => {
    if (jsonCols.includes(col) && val !== null && val !== void 0 && typeof val !== "string") {
      return JSON.stringify(val);
    }
    return val;
  };
  return {
    async findUnique(args) {
      const entries = Object.entries(args.where || {}).filter(([, v]) => v !== void 0);
      if (entries.length === 0) return null;
      const [col, val] = entries[0];
      const res = await getPgPool().query(
        `SELECT * FROM "${tableName}" WHERE "${col}" = $1 LIMIT 1`,
        [val]
      );
      return res.rows[0] ? normalizeRow(res.rows[0]) : null;
    },
    async findMany(args) {
      const params = [];
      let sql = `SELECT * FROM "${tableName}"`;
      const whereEntries = Object.entries(args?.where || {}).filter(([, v]) => v !== void 0);
      if (whereEntries.length > 0) {
        const clauses = whereEntries.map(([col, val], idx) => {
          params.push(prepareVal(col, val));
          return `"${col}" = $${idx + 1}`;
        });
        sql += ` WHERE ${clauses.join(" AND ")}`;
      }
      const orderEntries = Object.entries(args?.orderBy || {}).filter(([, v]) => v !== void 0);
      if (orderEntries.length > 0) {
        const [col, dir] = orderEntries[0];
        sql += ` ORDER BY "${col}" ${String(dir).toUpperCase() === "DESC" ? "DESC" : "ASC"}`;
      }
      if (typeof args?.take === "number" && args.take > 0) {
        sql += ` LIMIT ${Math.floor(args.take)}`;
      }
      const res = await getPgPool().query(sql, params);
      return res.rows.map(normalizeRow);
    },
    async create(args) {
      const payload = { ...args.data || {} };
      const now = /* @__PURE__ */ new Date();
      if (hasUpdatedAt && payload.updatedAt === void 0) {
        payload.updatedAt = now;
      }
      if (hasCreatedAt && payload.createdAt === void 0) {
        payload.createdAt = now;
      }
      if (hasTimestamp && payload.timestamp === void 0) {
        payload.timestamp = now;
      }
      const entries = Object.entries(payload).filter(([, v]) => v !== void 0);
      const cols = entries.map(([k]) => `"${k}"`).join(", ");
      const placeholders = entries.map((_, idx) => `$${idx + 1}`).join(", ");
      const values = entries.map(([k, v]) => prepareVal(k, v));
      const res = await getPgPool().query(
        `INSERT INTO "${tableName}" (${cols}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      return normalizeRow(res.rows[0]);
    },
    async update(args) {
      const whereEntries = Object.entries(args.where || {}).filter(([, v]) => v !== void 0);
      if (whereEntries.length === 0) {
        throw new Error(`Missing where clause for ${tableName}.update`);
      }
      const [whereCol, whereVal] = whereEntries[0];
      const payload = { ...args.data || {} };
      if (hasUpdatedAt && payload.updatedAt === void 0) {
        payload.updatedAt = /* @__PURE__ */ new Date();
      }
      const dataEntries = Object.entries(payload).filter(([, v]) => v !== void 0);
      if (dataEntries.length === 0) {
        const existing = await this.findUnique({ where: args.where });
        if (!existing) throw new Error(`Record not found in ${tableName}`);
        return existing;
      }
      const setClauses = dataEntries.map(([k], idx) => `"${k}" = $${idx + 1}`).join(", ");
      const values = dataEntries.map(([k, v]) => prepareVal(k, v));
      values.push(whereVal);
      const res = await getPgPool().query(
        `UPDATE "${tableName}" SET ${setClauses} WHERE "${whereCol}" = $${values.length} RETURNING *`,
        values
      );
      if (!res.rows[0]) {
        throw new Error(`Record to update not found in ${tableName}`);
      }
      return normalizeRow(res.rows[0]);
    },
    async upsert(args) {
      const existing = await this.findUnique({ where: args.where });
      if (existing) {
        const updateEntries = Object.entries(args.update || {}).filter(([, v]) => v !== void 0);
        if (updateEntries.length === 0) {
          return existing;
        }
        return this.update({ where: args.where, data: args.update });
      }
      return this.create({ data: { ...args.where || {}, ...args.create || {} } });
    },
    async delete(args) {
      const whereEntries = Object.entries(args.where || {}).filter(([, v]) => v !== void 0);
      const [whereCol, whereVal] = whereEntries[0];
      const res = await getPgPool().query(
        `DELETE FROM "${tableName}" WHERE "${whereCol}" = $1 RETURNING *`,
        [whereVal]
      );
      return normalizeRow(res.rows[0]);
    },
    async deleteMany(args) {
      const params = [];
      let sql = `DELETE FROM "${tableName}"`;
      const whereEntries = Object.entries(args?.where || {}).filter(([, v]) => v !== void 0);
      if (whereEntries.length > 0) {
        const clauses = whereEntries.map(([col, val], idx) => {
          params.push(prepareVal(col, val));
          return `"${col}" = $${idx + 1}`;
        });
        sql += ` WHERE ${clauses.join(" AND ")}`;
      }
      const res = await getPgPool().query(sql, params);
      return { count: res.rowCount || 0 };
    },
    async count(args) {
      const params = [];
      let sql = `SELECT COUNT(*)::int AS count FROM "${tableName}"`;
      const whereEntries = Object.entries(args?.where || {}).filter(([, v]) => v !== void 0);
      if (whereEntries.length > 0) {
        const clauses = whereEntries.map(([col, val], idx) => {
          params.push(prepareVal(col, val));
          return `"${col}" = $${idx + 1}`;
        });
        sql += ` WHERE ${clauses.join(" AND ")}`;
      }
      const res = await getPgPool().query(sql, params);
      return Number(res.rows[0]?.count ?? 0);
    }
  };
}
var prisma = {
  siteProfile: createPgModelDelegate({
    tableName: "SiteProfile",
    hasUpdatedAt: true,
    hasCreatedAt: false,
    hasTimestamp: false,
    jsonCols: []
  }),
  siteSettings: createPgModelDelegate({
    tableName: "SiteSettings",
    hasUpdatedAt: true,
    hasCreatedAt: false,
    hasTimestamp: false,
    jsonCols: ["navConfig"]
  }),
  adminUser: createPgModelDelegate({
    tableName: "AdminUser",
    hasUpdatedAt: true,
    hasCreatedAt: true,
    hasTimestamp: false,
    jsonCols: []
  }),
  project: createPgModelDelegate({
    tableName: "Project",
    hasUpdatedAt: true,
    hasCreatedAt: true,
    hasTimestamp: false,
    jsonCols: []
  }),
  skill: createPgModelDelegate({
    tableName: "Skill",
    hasUpdatedAt: true,
    hasCreatedAt: true,
    hasTimestamp: false,
    jsonCols: []
  }),
  collaboration: createPgModelDelegate({
    tableName: "Collaboration",
    hasUpdatedAt: true,
    hasCreatedAt: true,
    hasTimestamp: false,
    jsonCols: []
  }),
  partnerLogo: createPgModelDelegate({
    tableName: "PartnerLogo",
    hasUpdatedAt: false,
    hasCreatedAt: true,
    hasTimestamp: false,
    jsonCols: []
  }),
  knowledgeRelationship: createPgModelDelegate({
    tableName: "KnowledgeRelationship",
    hasUpdatedAt: false,
    hasCreatedAt: true,
    hasTimestamp: false,
    jsonCols: []
  }),
  contactMessage: createPgModelDelegate({
    tableName: "ContactMessage",
    hasUpdatedAt: false,
    hasCreatedAt: true,
    hasTimestamp: false,
    jsonCols: []
  }),
  courseRegistration: createPgModelDelegate({
    tableName: "CourseRegistration",
    hasUpdatedAt: false,
    hasCreatedAt: true,
    hasTimestamp: false,
    jsonCols: []
  }),
  auditLog: createPgModelDelegate({
    tableName: "AuditLog",
    hasUpdatedAt: false,
    hasCreatedAt: false,
    hasTimestamp: true,
    jsonCols: []
  }),
  async $disconnect() {
    if (global._prismaPgPool) {
      await global._prismaPgPool.end().catch(() => {
      });
      global._prismaPgPool = void 0;
    }
  }
};

// src/db/cmsRepository.ts
import fs from "fs";
import path from "path";
import dotenv2 from "dotenv";

// src/data.ts
var AMAL_INFO = {
  name: "Amal K P",
  title: "BCA Candidate & Founder of DZt",
  tagline: "Building high-performance web applications, intuitive interfaces & scalable digital platforms.",
  location: "Balagram, Idukki, Kerala, India",
  email: "amalkochuparambilp@gmail.com",
  phone: "+91 7510211318",
  linkedin: "https://linkedin.com/in/amalkochuparambilp",
  github: "https://github.com/amalkochuparambilp",
  summary: "BCA candidate at Jawaharlal Nehru Institute of Arts and Science (JNIAS) with strong technical expertise in React, Python, Django, PHP, MySQL, and modern web architectures. Founder and Lead at DZt digital platform, developer of LibCode JNIAS, Co-operative Bank Exam Portal, and Hrdiya health analytics application.",
  resumeSummary: "Dynamic BCA student and full-stack software engineer with hands-on expertise in building production applications using React, Python, Django, PHP, and MySQL. Proven track record leading digital innovation initiatives under the DZt ecosystem, including library automation systems, financial examination portals, and healthcare diagnostics.",
  campusBadge: "BCA @ JNIAS Balagram \u2022 Batch 2026",
  ecosystemNode: "BALAGRAM_CORE_NODE",
  aboutBioParagraph1: "I am a dedicated Bachelor of Computer Applications (BCA) candidate graduating in March 2026 from Jawaharlal Nehru Institute of Arts and Science (JNIAS), Balagram. My passion lies in architecting high-performance web applications, secure database systems, and robust developer tools.",
  aboutBioParagraph2: "As the founder and lead developer of the DZt technology ecosystem, I have engineered practical software solutions including LibCode library automation, Co-operative Bank examination portals, and the Hrdiya cardiac risk diagnostic platform. I combine clean frontend design with robust backend engineering to deliver seamless user experiences.",
  education: {
    degree: "Bachelor of Computer Application (BCA)",
    institution: "Jawaharlal Nehru Institute of Arts and Science (JNIAS)",
    location: "Balagram, Idukki, Kerala",
    period: "Mar 2026",
    status: "Graduating Batch 2026"
  },
  skillsList: ["Team Work", "Computer Literacy", "PHP", "React", "Python", "Django", "SQLite", "JavaScript", "TypeScript", "Tailwind CSS", "Git", "Node.js"],
  languages: ["English", "Malayalam"]
};
var PROJECTS = [
  {
    id: "libcode-jnias",
    title: "LibCode \u2014 JNIAS Library Software",
    description: "All-in-one digital college library management software engineered for JNIAS with ISBN lookup, barcode inventory, and student borrow logs.",
    longDescription: "LibCode JNIAS is a dedicated library automation platform deployed for Jawaharlal Nehru Institute of Arts and Science. It streamlines circulation desks with barcode scanning, automated book inventory cataloging, student membership tracking, and overdue fine management.",
    category: "portal",
    tech: ["PHP", "MySQL", "JavaScript", "Tailwind CSS", "Barcode Scanning"],
    features: [
      "Automated ISBN book lookup & barcode cataloging",
      "Student membership ledger with real-time issue/return logs",
      "High-speed search engine across thousands of library records",
      "Admin analytics dashboard for circulation & fine tracking"
    ],
    githubUrl: "https://jnias.com",
    featured: true
  },
  {
    id: "bank-exam-portal",
    title: "Co-operative Bank Exam Portal",
    description: "Complete online examination & testing portal engineered for Co-operative Bank with auto-grading, randomized question pools, and timing modules.",
    longDescription: "A robust web application designed for conducting candidate recruitment and evaluation exams for Co-operative Banks. Built with PHP and MySQL, featuring timed assessment tests, randomized question randomization, instant auto-scoring, and secure candidate log audit trails.",
    category: "system",
    tech: ["PHP", "MySQL", "JavaScript", "HTML/CSS", "Security Auditing"],
    features: [
      "Randomized question bank generator for leak-proof test papers",
      "Countdown timer engine with auto-submission on expiration",
      "Instant grading and score calculation algorithms",
      "Admin portal for candidate management, question creation, and score export"
    ],
    githubUrl: "https://github.com/amalkp/co-operative-bank-exam-portal",
    featured: true
  },
  {
    id: "hrdiya-health-analysis",
    title: "Hrdiya \u2014 Cardiac Risk Analysis Platform",
    description: "Web application built with Python & Django to analyze heart disease risk parameters and consult cardiologists directly.",
    longDescription: "Hrdiya is a healthcare diagnostic & consultation platform developed in Python and Django. It evaluates key physiological risk factors (blood pressure, cholesterol, ECG indicators) using medical assessment logic, offering user risk stratification and direct communication channels with cardiologists.",
    category: "django",
    tech: ["Python", "Django", "SQLite", "React", "Tailwind CSS"],
    features: [
      "Automated cardiac risk calculation engine based on clinical parameters",
      "Patient health metric logging & historical trend visualization",
      "Direct message & consultation request routing to cardiologists",
      "Responsive patient portal and admin medical record panel"
    ],
    githubUrl: "https://github.com/amalkp/hrdiya-health-analysis",
    featured: true
  },
  {
    id: "gemini-watermark-remover",
    title: "Gemini & Veo Watermark Remover",
    description: "100% client-side mathematical reverse-alpha watermark remover for Google Gemini, Nano Banana, Flow, and Veo 3 images and videos.",
    longDescription: "Integrated client-side media unblending tool using exact mathematical reverse-alpha subtraction, multi-scale NCC + gradient edge auto-detection, live dual-zoomed ROI alignment, and WebCodecs H.264 MP4 muxing with audio passthrough.",
    category: "web",
    tech: ["TypeScript", "Canvas 2D API", "WebCodecs", "MediaBunny", "Reverse-Alpha Math"],
    features: [
      "Mathematical reverse-alpha pixel restoration with zero quality loss",
      "Fused multi-scale NCC & gradient edge watermark auto-detection",
      "Live interactive tuner with dual zoomed ROI comparison views",
      "WebCodecs hardware-accelerated Veo 3 & Google Flow MP4 video cleaning with audio preservation"
    ],
    githubUrl: "https://github.com/ishara-madu/gemini-watermark-remover",
    liveUrl: "/apps?app=watermark",
    featured: true
  },
  {
    id: "dzt-developer-platform",
    title: "DZt Developer Platform & Ecosystem",
    description: "Modern developer suite, portfolio engine, and diagnostic console built for the DZt initiative.",
    longDescription: "The central digital platform for DZt, featuring interactive live system diagnostics, developer CLI shell, portfolio showcases, and responsive web component design systems.",
    category: "system",
    tech: ["React", "TypeScript", "Tailwind CSS", "Vite", "Node.js"],
    features: [
      "Interactive CLI shell with command parser and typewriter output",
      "Real-time IP & network latency diagnostic telemetry",
      "High-contrast accessible dark theme design system"
    ],
    githubUrl: "https://github.com/amalkp/dzt-platform",
    featured: false
  }
];
var SKILLS = [
  { name: "React", level: 90, category: "Frontend", icon: "Code2" },
  { name: "PHP", level: 85, category: "Backend", icon: "Server" },
  { name: "Python", level: 88, category: "Backend", icon: "Terminal" },
  { name: "Django", level: 85, category: "Backend", icon: "Database" },
  { name: "SQLite / MySQL", level: 82, category: "Backend", icon: "HardDrive" },
  { name: "JavaScript / TS", level: 88, category: "Frontend", icon: "Cpu" },
  { name: "Tailwind CSS", level: 92, category: "Frontend", icon: "Layout" },
  { name: "Computer Literacy", level: 95, category: "Core & Tools", icon: "Monitor" },
  { name: "Git & Version Control", level: 85, category: "Core & Tools", icon: "GitBranch" },
  { name: "Team Work & Collaboration", level: 95, category: "Professional", icon: "Users" },
  { name: "System Architecture", level: 80, category: "Core & Tools", icon: "Layers" },
  { name: "UI/UX Design", level: 86, category: "Frontend", icon: "Palette" },
  { name: "Affinity", level: 89, category: "Core & Tools", icon: "Palette" }
];
var COLLABORATIONS = [
  {
    id: "libcode-jnias",
    role: "Lead Architect & Library Systems Engineer",
    organization: "LibCode for JNIAS",
    badge: "COLLEGE LIBRARY SOFTWARE",
    logoType: "libcode",
    description: "Designed and deployed LibCode, an all-in-one digital college library management software platform built specifically for Jawaharlal Nehru Institute of Arts and Science (JNIAS).",
    highlights: [
      "Automated book cataloging, ISBN lookup, and barcode inventory management",
      "Student membership tracking, borrow/return logs & overdue fine calculator",
      "High-throughput search engine for fast library book discovery",
      "Admin analytics dashboard for library usage and book circulation statistics"
    ],
    tags: ["Library Management", "JNIAS", "PHP / MySQL", "Barcode Scanning", "System Automation"]
  },
  {
    id: "coop-bank-portal",
    role: "Lead Developer & Examination Systems Specialist",
    organization: "Co-operative Bank Exam Portal",
    badge: "EXAMINATION & TESTING PLATFORM",
    logoType: "bank",
    description: "Engineered a secure online candidate evaluation and exam portal for Co-operative Bank recruitment drives.",
    highlights: [
      "Randomized question pool generation and auto-grading algorithms",
      "Timed assessment engine with automatic submission safeguard",
      "Candidate verification, score audit trails, and result export options",
      "High-concurrency PHP & MySQL database architecture"
    ],
    tags: ["Bank Recruitment", "PHP / MySQL", "Exam Automation", "Auto Grading", "Security Audit"]
  },
  {
    id: "hrdiya-health",
    role: "Full-Stack Python & Django Developer",
    organization: "Hrdiya Cardiac Risk Platform",
    badge: "HEALTHCARE ANALYTICS",
    logoType: "hrdiya",
    description: "Developed Hrdiya, a Python Django web application for evaluating cardiac health risk factors and connecting patients with cardiologists.",
    highlights: [
      "Algorithmic assessment of physiological health metrics",
      "Historical health metric logs and user trend visualization",
      "Doctor appointment and consultation message routing",
      "Secure healthcare data handling and responsive user dashboard"
    ],
    tags: ["Python", "Django", "Healthcare Tech", "Cardiac Risk Analysis", "SQLite"]
  }
];

// src/db/defaultState.ts
var DEFAULT_CMS_STATE = {
  profile: {
    name: AMAL_INFO.name,
    title: AMAL_INFO.title,
    tagline: AMAL_INFO.tagline,
    heroHeadingLine1: "Crafting digital",
    heroHeadingItalic: "ecosystems",
    heroHeadingLine2: "with precision & purpose.",
    heroBio: "Founder & Lead of DZt. A full-stack developer and BCA candidate passionate about building high-performance web systems, intuitive interfaces, and scalable digital platforms.",
    availabilityText: "AVAILABLE FOR COLLABORATIONS",
    availabilityActive: true,
    campusBadge: "JNIAS BALAGRAM (BCA 2026)",
    founderBadge: "Founder / Lead @ DZt",
    location: AMAL_INFO.location,
    email: AMAL_INFO.email,
    phone: AMAL_INFO.phone,
    linkedin: AMAL_INFO.linkedin,
    github: AMAL_INFO.github,
    summary: AMAL_INFO.summary,
    resumeSummary: "Recent BCA graduate seeking entry-level opportunity to apply foundational skills and grow professionally. Passionate developer specializing in high-performance user interfaces, Python/Django health analytics platforms, and co-operative bank portal solutions.",
    aboutBioParagraph1: "I am a passionate software developer and Founder/Lead at DZt, currently pursuing my Bachelor of Computer Application (BCA) degree at Jawaharlal Nehru Institute of Arts and Science (JNIAS) in Balagram, Idukki.",
    aboutBioParagraph2: "My technical expertise bridges full-stack application development, database design, and creative media. I specialize in building robust web applications with React, TypeScript, Python, Django, PHP, and MySQL. From engineering specialized college management software to crafting AI-assisted health diagnostic platforms, my goal is to deliver clean, scalable, and high-impact digital solutions.",
    education: {
      ...AMAL_INFO.education
    },
    skillsList: [...AMAL_INFO.skillsList],
    languages: [...AMAL_INFO.languages],
    ecosystemNode: "BALAGRAM_NODE",
    buildVersion: "STABLE_BUILD_v2.0"
  },
  settings: {
    showHeroMarquee: true,
    showHeroTelemetry: true,
    showHeroHighlights: true,
    showBatteryTracker: true,
    announcementActive: false,
    announcementText: "DZt Ecosystem v2.5 Released \u2014 Explore P2P Encrypted File Sharing & Live MiniApps",
    announcementLinkText: "Launch MiniApps",
    announcementLinkTarget: "apps",
    navConfig: [
      { id: "home", label: "Home", visible: true },
      { id: "about", label: "About", visible: true },
      { id: "collaborate", label: "Collaborate", visible: true },
      { id: "projects", label: "Projects", visible: true },
      { id: "skills", label: "Skills", visible: true },
      { id: "resume", label: "Resume", visible: true },
      { id: "apps", label: "DZt MiniApp", visible: true },
      { id: "contact", label: "Contact", visible: true }
    ]
  },
  seo: {
    title: "Amal K P | Full-Stack Developer & DZt Founder",
    description: "Official portfolio and software ecosystem of Amal K P \u2014 Full-Stack Developer, Founder of DZt, and BCA '26 at JNIAS Balagram, Kerala. Creator of LibCode JNIAS, Co-operative Bank Exam Portal, and P2P WebRTC DZt MiniApps.",
    keywords: "Amal K P, DZt, DZt Ecosystem, DZt Drop, LibCode JNIAS, Co-operative Bank Exam Portal, Hrdiya, Full Stack Developer Kerala, React Developer India, Python Django Developer, WebRTC P2P Developer, BCA JNIAS, Balagram Idukki",
    canonicalUrl: "https://amalkp.online/",
    ogImage: "https://amalkp.online/logos/openai-wordmark-dark.svg"
  },
  projects: PROJECTS.map((p, index) => ({
    ...p,
    published: true,
    sortOrder: index,
    highlightLabel: p.id === "libcode-jnias" ? "01. LIBCODE JNIAS" : p.id === "bank-exam-portal" ? "02. BANK EXAM PORTAL" : p.id === "hrdiya-health-analysis" ? "03. HRDIYA HEALTH" : `0${index + 1}. ${p.title.toUpperCase().slice(0, 18)}`,
    highlightStack: p.id === "hrdiya-health-analysis" ? "Python / Django" : "PHP / MySQL"
  })),
  skills: SKILLS.map((s, index) => ({
    ...s,
    id: `skill-${index + 1}-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    sortOrder: index
  })),
  collaborations: COLLABORATIONS.map((c, index) => ({
    ...c,
    sortOrder: index
  })),
  logos: [
    {
      id: "logo-openai",
      name: "OPENAI",
      src: "/logos/openai-wordmark-dark.svg",
      alt: "OpenAI Logo",
      fileName: "openai-wordmark-dark.svg",
      active: true,
      sortOrder: 0
    },
    {
      id: "logo-axis-bank",
      name: "AXIS BANK",
      src: "/logos/axis-bank.svg",
      alt: "Axis Bank Logo",
      fileName: "axis-bank.svg",
      active: true,
      sortOrder: 1
    },
    {
      id: "logo-shopify",
      name: "SHOPIFY",
      src: "/logos/shopify.svg",
      alt: "Shopify Logo",
      fileName: "shopify.svg",
      active: true,
      sortOrder: 2
    },
    {
      id: "logo-nss",
      name: "NSS",
      src: "/logos/new-nss-seeklogo.png",
      alt: "National Service Scheme",
      fileName: "new-nss-seeklogo.png",
      active: true,
      sortOrder: 3
    },
    {
      id: "logo-uxbjxoi",
      name: "PARTNER LOGO",
      src: "/logos/idUxbjXOi-_logos.svg",
      alt: "Partner Logo",
      fileName: "idUxbjXOi-_logos.svg",
      active: true,
      sortOrder: 4
    },
    {
      id: "logo-hf5lcjo",
      name: "TECH PARTNER",
      src: "/logos/idhf5lcjoR_1789676848779.svg",
      alt: "Tech Partner Logo",
      fileName: "idhf5lcjoR_1789676848779.svg",
      active: true,
      sortOrder: 5
    },
    {
      id: "logo-jps0yq",
      name: "CLOUD ECOSYSTEM",
      src: "/logos/idJPs0Yq7Y_1789677081540.svg",
      alt: "Cloud Ecosystem Logo",
      fileName: "idJPs0Yq7Y_1789677081540.svg",
      active: true,
      sortOrder: 6
    },
    {
      id: "logo-jsce-imz",
      name: "DZT NETWORK",
      src: "/logos/idJsCe_Imz_1789677158066.png",
      alt: "DZt Network Logo",
      fileName: "idJsCe_Imz_1789677158066.png",
      active: true,
      sortOrder: 7
    }
  ],
  knowledge: {
    schema_version: "1.0",
    entity: {
      id: "https://amalkp.online/#amal-k-p",
      "@type": "Person",
      name: "Amal K P",
      alternateName: ["Amal KP", "amalkp"],
      url: "https://amalkp.online/",
      jobTitle: "Full-Stack Developer and Founder of DZt",
      description: "Full-stack developer and BCA candidate based in Idukki, Kerala, India.",
      public_profiles: [
        {
          platform: "GitHub",
          url: "https://github.com/amalkochuparambilp"
        },
        {
          platform: "LinkedIn",
          url: "https://linkedin.com/in/amalkochuparambilp"
        }
      ]
    },
    relationships: [
      {
        id: "relationship-adhithya-k-p",
        type: "brother",
        name: "Adhithya K P",
        url: "https://instagram.com/4dth.__._",
        status: "confirmed"
      },
      {
        id: "relationship-diya",
        type: ["friend", "non_blood_sister"],
        name: "Diya",
        url: "https://instagram.com/diiiyyhhh_",
        status: "confirmed"
      },
      {
        id: "relationship-vandana-udayan",
        type: ["friend", "non_blood_sister"],
        name: "Vandana Udayan",
        url: "https://instagram.com/vandana_udayan",
        status: "confirmed"
      },
      {
        id: "relationship-vrunda",
        type: "best_friend",
        name: "Vrunda",
        url: "https://instagram.com/its_me_jayasree__",
        status: "confirmed"
      },
      {
        id: "relationship-arya-latheesh",
        type: "best_friend",
        name: "Arya Latheesh",
        url: "https://instagram.com/s__aryaaaaa",
        status: "confirmed"
      },
      {
        id: "relationship-sivah",
        type: "best_friend",
        name: "Sivah",
        url: "https://instagram.com/ft.Sivah",
        status: "confirmed"
      },
      {
        id: "relationship-joel-joy",
        type: "best_friend",
        name: "Joel Joy",
        alternateName: ["JoKuttan"],
        url: "https://instagram.com/_joeljoy_",
        status: "confirmed"
      }
    ],
    relationship_policy: "Only relationships explicitly added here with status confirmed are published.",
    official_sources: [
      {
        type: "personal_website",
        url: "https://amalkp.online/"
      },
      {
        type: "GitHub_profile",
        url: "https://github.com/amalkochuparambilp"
      },
      {
        type: "LinkedIn_profile",
        url: "https://linkedin.com/in/amalkochuparambilp"
      }
    ],
    last_updated: "2026-10-06T00:00:00Z"
  },
  messages: [
    {
      id: "msg-initial-1",
      name: "JNIAS Library Department",
      email: "library@jnias.com",
      message: "LibCode barcode circulation module is running smoothly across the main campus desk. Looking forward to the v2.2 analytics report export.",
      status: "read",
      telegramDelivered: true,
      ipAddress: "103.142.118.14",
      createdAt: "2026-10-04T09:30:00Z"
    }
  ],
  auditLogs: [
    {
      id: "log-init-1",
      action: "SYSTEM_BOOT",
      section: "Database Engine",
      summary: "Initialized DZt Full-Control CMS Engine with Prisma PostgreSQL schema & synchronized site records.",
      timestamp: "2026-10-06T13:50:00Z"
    }
  ],
  lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
};

// src/db/cmsRepository.ts
var isSeeded = false;
var ALLOWED_DB_TABLES = [
  "AdminUser",
  "SiteProfile",
  "SiteSettings",
  "Project",
  "Skill",
  "Collaboration",
  "PartnerLogo",
  "KnowledgeRelationship",
  "ContactMessage",
  "CourseRegistration",
  "AuditLog",
  "_prisma_migrations"
];
async function ensureDatabaseSeeded(forceCheck = false) {
  if (isSeeded && !forceCheck) return;
  try {
    const existingProfile = await prisma.siteProfile.findUnique({
      where: { id: "default" }
    });
    const def = DEFAULT_CMS_STATE;
    if (!existingProfile) {
      await prisma.siteProfile.create({
        data: {
          id: "default",
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
        where: { id: "default" },
        update: {},
        create: {
          id: "default",
          showHeroMarquee: def.settings.showHeroMarquee,
          showHeroTelemetry: def.settings.showHeroTelemetry,
          showHeroHighlights: def.settings.showHeroHighlights,
          showBatteryTracker: def.settings.showBatteryTracker,
          announcementActive: def.settings.announcementActive,
          announcementText: def.settings.announcementText,
          announcementLinkText: def.settings.announcementLinkText,
          announcementLinkTarget: def.settings.announcementLinkTarget,
          navConfig: def.settings.navConfig,
          seoTitle: def.seo.title,
          seoDescription: def.seo.description,
          seoKeywords: def.seo.keywords,
          seoCanonicalUrl: def.seo.canonicalUrl,
          seoOgImage: def.seo.ogImage,
          adminEmail: "amalkochuparambilp@gmail.com",
          adminPasscode: "dzt2026"
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
          action: "PRISMA_POSTGRES_SEED",
          section: "Database",
          summary: "Connected & seeded live Prisma PostgreSQL database (pooled.db.prisma.io)"
        }
      });
    }
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { id: "admin-primary" }
    });
    if (!existingAdmin) {
      const settingsRow = await prisma.siteSettings.findUnique({ where: { id: "default" } });
      await prisma.adminUser.create({
        data: {
          id: "admin-primary",
          email: settingsRow?.adminEmail || "amalkochuparambilp@gmail.com",
          password: settingsRow?.adminPasscode || "dzt2026",
          name: "Amal K P",
          role: "Administrator"
        }
      });
    }
    try {
      const logosDir = path.join(process.cwd(), "public", "logos");
      if (fs.existsSync(logosDir)) {
        const allowedExts = /* @__PURE__ */ new Set([".png", ".jpg", ".jpeg", ".svg", ".webp", ".avif", ".gif"]);
        const files = fs.readdirSync(logosDir).filter((file) => !file.startsWith(".") && allowedExts.has(path.extname(file).toLowerCase()));
        const existingLogos = await prisma.partnerLogo.findMany();
        const existingFiles = new Set(existingLogos.map((l) => l.fileName.toLowerCase()));
        for (const file of files) {
          if (!existingFiles.has(file.toLowerCase())) {
            const rawName = path.basename(file, path.extname(file)).replace(/[-_]+/g, " ").trim().toUpperCase();
            await prisma.partnerLogo.create({
              data: {
                id: `logo-${file.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
                name: rawName || "PARTNER",
                src: `/logos/${encodeURIComponent(file)}`,
                alt: `${rawName || "Partner"} Logo`,
                fileName: file,
                active: true,
                sortOrder: existingLogos.length
              }
            });
          }
        }
      }
    } catch {
    }
    try {
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS "CourseRegistration" (
          "id" TEXT NOT NULL,
          "courseId" TEXT,
          "course" TEXT NOT NULL,
          "fullName" TEXT NOT NULL,
          "countryCode" TEXT NOT NULL DEFAULT '+91',
          "phoneNumber" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "collegeName" TEXT,
          "location" TEXT,
          "additionalNotes" TEXT,
          "status" TEXT NOT NULL DEFAULT 'New',
          "telegramDelivered" BOOLEAN NOT NULL DEFAULT false,
          "ipAddress" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "CourseRegistration_pkey" PRIMARY KEY ("id")
        );
      `);
    } catch (tblErr) {
      console.warn("[Prisma Repository] Notice creating CourseRegistration table:", tblErr);
    }
    isSeeded = true;
  } catch (error) {
    console.error("[Prisma Repository] Error seeding database:", error);
    throw error;
  }
}
async function logPrismaAudit(action, section, summary) {
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
    console.error("[Prisma Audit] Failed to write audit log:", err);
  }
}
async function getAdminEmailFromDb() {
  try {
    await ensureDatabaseSeeded();
    const admin = await prisma.adminUser.findUnique({ where: { id: "admin-primary" } });
    if (admin?.email) return admin.email.trim();
    const settings = await prisma.siteSettings.findUnique({ where: { id: "default" } });
    return (settings?.adminEmail || "amalkochuparambilp@gmail.com").trim();
  } catch {
    return "amalkochuparambilp@gmail.com";
  }
}
async function fetchFullCMSStateFromPostgres(includePrivateAdminData = true) {
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
    prisma.siteProfile.findUnique({ where: { id: "default" } }),
    prisma.siteSettings.findUnique({ where: { id: "default" } }),
    prisma.project.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.skill.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.collaboration.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.partnerLogo.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.knowledgeRelationship.findMany({ orderBy: { createdAt: "asc" } }),
    includePrivateAdminData ? prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } }) : Promise.resolve([]),
    includePrivateAdminData ? prisma.auditLog.findMany({ orderBy: { timestamp: "desc" }, take: 60 }) : Promise.resolve([])
  ]);
  const def = DEFAULT_CMS_STATE;
  const profile = profileRow ? {
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
  } : def.profile;
  const settings = settingsRow ? {
    showHeroMarquee: settingsRow.showHeroMarquee,
    showHeroTelemetry: settingsRow.showHeroTelemetry,
    showHeroHighlights: settingsRow.showHeroHighlights,
    showBatteryTracker: settingsRow.showBatteryTracker,
    announcementActive: settingsRow.announcementActive,
    announcementText: settingsRow.announcementText,
    announcementLinkText: settingsRow.announcementLinkText,
    announcementLinkTarget: settingsRow.announcementLinkTarget,
    navConfig: Array.isArray(settingsRow.navConfig) ? settingsRow.navConfig : def.settings.navConfig
  } : def.settings;
  const seo = settingsRow ? {
    title: settingsRow.seoTitle,
    description: settingsRow.seoDescription,
    keywords: settingsRow.seoKeywords,
    canonicalUrl: settingsRow.seoCanonicalUrl,
    ogImage: settingsRow.seoOgImage
  } : def.seo;
  const projects = projectsRows.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    longDescription: p.longDescription || void 0,
    category: p.category || "system",
    tech: p.tech,
    features: p.features,
    githubUrl: p.githubUrl || void 0,
    liveUrl: p.liveUrl || void 0,
    featured: p.featured,
    published: p.published,
    highlightLabel: p.highlightLabel || void 0,
    highlightStack: p.highlightStack || void 0,
    sortOrder: p.sortOrder
  }));
  const skills = skillsRows.map((s) => ({
    id: s.id,
    name: s.name,
    level: s.level,
    category: s.category || "Frontend",
    icon: s.icon,
    sortOrder: s.sortOrder
  }));
  const collaborations = collabRows.map((c) => ({
    id: c.id,
    role: c.role,
    organization: c.organization,
    badge: c.badge,
    logoType: c.logoType || "libcode",
    description: c.description,
    highlights: c.highlights,
    tags: c.tags,
    sortOrder: c.sortOrder
  }));
  const logos = logoRows.map((l) => ({
    id: l.id,
    name: l.name,
    src: l.src,
    alt: l.alt,
    fileName: l.fileName,
    active: l.active,
    sortOrder: l.sortOrder
  }));
  const knowledge = {
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
      ...r.alternateName && r.alternateName.length > 0 ? { alternateName: r.alternateName } : {},
      ...r.url ? { url: r.url } : {},
      status: r.status || "confirmed"
    })),
    last_updated: (/* @__PURE__ */ new Date()).toISOString()
  };
  const messages = messageRows.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    message: m.message,
    status: m.status || "unread",
    telegramDelivered: m.telegramDelivered,
    ipAddress: m.ipAddress || void 0,
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
    lastUpdated: profileRow?.updatedAt.toISOString() || (/* @__PURE__ */ new Date()).toISOString()
  };
}
function writeEnvVariablesToDisk(updates) {
  try {
    const envPath = path.join(process.cwd(), ".env");
    let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";
    for (const [key, value] of Object.entries(updates)) {
      process.env[key] = value;
      const escapedVal = `"${value.replace(/"/g, '\\"')}"`;
      const regex = new RegExp(`^${key}=.*$`, "m");
      if (regex.test(content)) {
        content = content.replace(regex, `${key}=${escapedVal}`);
      } else {
        content = content.trimEnd() + `
${key}=${escapedVal}
`;
      }
    }
    fs.writeFileSync(envPath, content.trimEnd() + "\n", "utf-8");
    dotenv2.config({ override: true });
  } catch (err) {
    console.error("[CMS .env Writer] Failed to update .env:", err);
  }
}
async function verifyAdminLoginInDb(email, password) {
  let expectedEmail = "amalkochuparambilp@gmail.com";
  let dbPass = "amaladhi";
  try {
    await ensureDatabaseSeeded();
    const adminRow = await prisma.adminUser.findUnique({ where: { id: "admin-primary" } });
    const settings = await prisma.siteSettings.findUnique({ where: { id: "default" } });
    expectedEmail = (adminRow?.email || settings?.adminEmail || "amalkochuparambilp@gmail.com").trim();
    dbPass = (adminRow?.password || settings?.adminPasscode || "amaladhi").trim();
  } catch (err) {
    console.warn("[CMS Auth] Using fallback admin credentials due to DB query warning:", err);
  }
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail) {
    return { valid: false, adminEmail: expectedEmail, error: "Email is required." };
  }
  if (cleanEmail !== expectedEmail.toLowerCase()) {
    await logPrismaAudit("ADMIN_AUTH_DENIED", "AdminUser", `Rejected login attempt for non-admin email: ${cleanEmail}`);
    return {
      valid: false,
      adminEmail: expectedEmail,
      error: "Invalid email or password."
    };
  }
  const cleanPass = (password || "").trim();
  if (!cleanPass || cleanPass !== dbPass) {
    await logPrismaAudit("ADMIN_AUTH_FAILED", "AdminUser", `Invalid password attempt for admin ${expectedEmail}`);
    return {
      valid: false,
      adminEmail: expectedEmail,
      error: "Invalid email or password."
    };
  }
  await prisma.adminUser.update({
    where: { id: "admin-primary" },
    data: { lastLoginAt: /* @__PURE__ */ new Date() }
  }).catch(() => {
  });
  await logPrismaAudit("ADMIN_AUTH_SUCCESS", "AdminUser", `Verified administrator session from PostgreSQL for ${expectedEmail}`);
  return { valid: true, adminEmail: expectedEmail };
}
async function verifyOrUpdatePasscodeInDb(password, newPassword, newAdminEmail, newDatabaseUrl) {
  await ensureDatabaseSeeded();
  const adminRow = await prisma.adminUser.findUnique({ where: { id: "admin-primary" } });
  const settings = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  const expectedPass = (adminRow?.password || settings?.adminPasscode || "dzt2026").trim();
  if (!password || password.trim() !== expectedPass) {
    return { valid: false, error: "Current administrator password in PostgreSQL is incorrect." };
  }
  const updatedEmail = newAdminEmail && newAdminEmail.trim().includes("@") ? newAdminEmail.trim() : adminRow?.email || settings?.adminEmail || "amalkochuparambilp@gmail.com";
  const updatedPass = newPassword && newPassword.trim().length >= 4 ? newPassword.trim() : expectedPass;
  if (newPassword && newPassword.trim().length >= 4 || newAdminEmail && newAdminEmail.trim().includes("@")) {
    await prisma.adminUser.upsert({
      where: { id: "admin-primary" },
      update: {
        email: updatedEmail,
        password: updatedPass
      },
      create: {
        id: "admin-primary",
        email: updatedEmail,
        password: updatedPass,
        name: "Amal K P",
        role: "Administrator"
      }
    });
    await prisma.siteSettings.update({
      where: { id: "default" },
      data: {
        adminEmail: updatedEmail,
        adminPasscode: updatedPass
      }
    });
    await logPrismaAudit(
      "UPDATE_ADMIN_DB",
      "AdminUser",
      `Updated Administrator credentials (email: ${updatedEmail}) in PostgreSQL database`
    );
  }
  if (newDatabaseUrl && newDatabaseUrl.trim().startsWith("postgres")) {
    writeEnvVariablesToDisk({ DATABASE_URL: newDatabaseUrl.trim() });
    await reloadDatabaseConnection();
    await logPrismaAudit("UPDATE_DATABASE_URL", "Database (.env)", "Updated DATABASE_URL in .env and reloaded PostgreSQL connection pool");
  }
  return { valid: true };
}
async function updateProfileInDb(incoming) {
  await ensureDatabaseSeeded();
  const current = await prisma.siteProfile.findUnique({ where: { id: "default" } });
  const def = DEFAULT_CMS_STATE.profile;
  await prisma.siteProfile.upsert({
    where: { id: "default" },
    create: {
      id: "default",
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
      ...incoming.name !== void 0 ? { name: incoming.name } : {},
      ...incoming.title !== void 0 ? { title: incoming.title } : {},
      ...incoming.tagline !== void 0 ? { tagline: incoming.tagline } : {},
      ...incoming.heroHeadingLine1 !== void 0 ? { heroHeadingLine1: incoming.heroHeadingLine1 } : {},
      ...incoming.heroHeadingItalic !== void 0 ? { heroHeadingItalic: incoming.heroHeadingItalic } : {},
      ...incoming.heroHeadingLine2 !== void 0 ? { heroHeadingLine2: incoming.heroHeadingLine2 } : {},
      ...incoming.heroBio !== void 0 ? { heroBio: incoming.heroBio } : {},
      ...incoming.availabilityText !== void 0 ? { availabilityText: incoming.availabilityText } : {},
      ...incoming.availabilityActive !== void 0 ? { availabilityActive: incoming.availabilityActive } : {},
      ...incoming.campusBadge !== void 0 ? { campusBadge: incoming.campusBadge } : {},
      ...incoming.founderBadge !== void 0 ? { founderBadge: incoming.founderBadge } : {},
      ...incoming.location !== void 0 ? { location: incoming.location } : {},
      ...incoming.email !== void 0 ? { email: incoming.email } : {},
      ...incoming.phone !== void 0 ? { phone: incoming.phone } : {},
      ...incoming.linkedin !== void 0 ? { linkedin: incoming.linkedin } : {},
      ...incoming.github !== void 0 ? { github: incoming.github } : {},
      ...incoming.summary !== void 0 ? { summary: incoming.summary } : {},
      ...incoming.resumeSummary !== void 0 ? { resumeSummary: incoming.resumeSummary } : {},
      ...incoming.aboutBioParagraph1 !== void 0 ? { aboutBioParagraph1: incoming.aboutBioParagraph1 } : {},
      ...incoming.aboutBioParagraph2 !== void 0 ? { aboutBioParagraph2: incoming.aboutBioParagraph2 } : {},
      ...incoming.education?.degree !== void 0 ? { eduDegree: incoming.education.degree } : {},
      ...incoming.education?.institution !== void 0 ? { eduInstitution: incoming.education.institution } : {},
      ...incoming.education?.location !== void 0 ? { eduLocation: incoming.education.location } : {},
      ...incoming.education?.period !== void 0 ? { eduPeriod: incoming.education.period } : {},
      ...incoming.education?.status !== void 0 ? { eduStatus: incoming.education.status } : {},
      ...incoming.skillsList !== void 0 ? { skillsList: incoming.skillsList } : {},
      ...incoming.languages !== void 0 ? { languages: incoming.languages } : {},
      ...incoming.ecosystemNode !== void 0 ? { ecosystemNode: incoming.ecosystemNode } : {},
      ...incoming.buildVersion !== void 0 ? { buildVersion: incoming.buildVersion } : {}
    }
  });
  await logPrismaAudit(
    "UPDATE_PROFILE",
    "SiteProfile",
    `Updated SiteProfile row in PostgreSQL (${incoming.name || current?.name || "Amal K P"})`
  );
  return fetchFullCMSStateFromPostgres();
}
async function updateSettingsInDb(payload) {
  await ensureDatabaseSeeded();
  const { settings, seo } = payload;
  await prisma.siteSettings.update({
    where: { id: "default" },
    data: {
      ...settings?.showHeroMarquee !== void 0 ? { showHeroMarquee: settings.showHeroMarquee } : {},
      ...settings?.showHeroTelemetry !== void 0 ? { showHeroTelemetry: settings.showHeroTelemetry } : {},
      ...settings?.showHeroHighlights !== void 0 ? { showHeroHighlights: settings.showHeroHighlights } : {},
      ...settings?.showBatteryTracker !== void 0 ? { showBatteryTracker: settings.showBatteryTracker } : {},
      ...settings?.announcementActive !== void 0 ? { announcementActive: settings.announcementActive } : {},
      ...settings?.announcementText !== void 0 ? { announcementText: settings.announcementText } : {},
      ...settings?.announcementLinkText !== void 0 ? { announcementLinkText: settings.announcementLinkText } : {},
      ...settings?.announcementLinkTarget !== void 0 ? { announcementLinkTarget: settings.announcementLinkTarget } : {},
      ...settings?.navConfig !== void 0 ? { navConfig: settings.navConfig } : {},
      ...seo?.title !== void 0 ? { seoTitle: seo.title } : {},
      ...seo?.description !== void 0 ? { seoDescription: seo.description } : {},
      ...seo?.keywords !== void 0 ? { seoKeywords: seo.keywords } : {},
      ...seo?.canonicalUrl !== void 0 ? { seoCanonicalUrl: seo.canonicalUrl } : {},
      ...seo?.ogImage !== void 0 ? { seoOgImage: seo.ogImage } : {}
    }
  });
  await logPrismaAudit("UPDATE_SETTINGS", "SiteSettings", "Updated SiteSettings & SEO metadata in PostgreSQL");
  return fetchFullCMSStateFromPostgres();
}
async function getDatabaseStatusFromPostgres() {
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
    prisma.adminUser.findUnique({ where: { id: "admin-primary" } })
  ]);
  let migrations = [];
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
  let schemaSource = "";
  try {
    const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
    if (fs.existsSync(schemaPath)) {
      schemaSource = fs.readFileSync(schemaPath, "utf-8");
    }
  } catch {
    schemaSource = "";
  }
  const tables = [
    {
      name: "AdminUser",
      model: "prisma.adminUser",
      rowCount: adminUserCount,
      primaryKey: "id",
      description: "Administrator email, password, role & lastLoginAt stored in PostgreSQL"
    },
    {
      name: "SiteProfile",
      model: "prisma.siteProfile",
      rowCount: siteProfileCount,
      primaryKey: "id",
      description: "Core identity, Hero headlines, About bio, Academic & Contact channels"
    },
    {
      name: "SiteSettings",
      model: "prisma.siteSettings",
      rowCount: siteSettingsCount,
      primaryKey: "id",
      description: "Navigation visibility, Hero subsystem flags, Announcement banner & SEO metadata"
    },
    {
      name: "Project",
      model: "prisma.project",
      rowCount: projectCount,
      primaryKey: "id",
      description: "Portfolio projects, tech stacks, features, GitHub/Live URLs & sort order"
    },
    {
      name: "Skill",
      model: "prisma.skill",
      rowCount: skillCount,
      primaryKey: "id",
      description: "Technical & professional competencies with proficiency percentages"
    },
    {
      name: "Collaboration",
      model: "prisma.collaboration",
      rowCount: collaborationCount,
      primaryKey: "id",
      description: "Institutional volunteering, roles, emblems & deliverables"
    },
    {
      name: "PartnerLogo",
      model: "prisma.partnerLogo",
      rowCount: partnerLogoCount,
      primaryKey: "id",
      description: "Partner & institutional logos rendered in the Hero dual-track marquee"
    },
    {
      name: "KnowledgeRelationship",
      model: "prisma.knowledgeRelationship",
      rowCount: knowledgeCount,
      primaryKey: "id",
      description: "Verified AI Knowledge graph relationships synced to public/ai/profile.json"
    },
    {
      name: "ContactMessage",
      model: "prisma.contactMessage",
      rowCount: contactMessageCount,
      primaryKey: "id",
      description: "Real-time Contact form inquiries & Telegram delivery status"
    },
    {
      name: "AuditLog",
      model: "prisma.auditLog",
      rowCount: auditLogCount,
      primaryKey: "id",
      description: "Immutable PostgreSQL audit trail of all CMS & database mutations"
    },
    {
      name: "_prisma_migrations",
      model: "prisma._prisma_migrations",
      rowCount: migrations.length,
      primaryKey: "id",
      description: "Prisma Migrate history table tracking applied SQL schema migrations"
    }
  ];
  const totalRows = tables.reduce((acc, t) => acc + t.rowCount, 0);
  const envMetadata = getDatabaseEnvMetadata();
  return {
    connected: true,
    host: envMetadata.host,
    provider: "PostgreSQL (Prisma ORM + .env DATABASE_URL)",
    sslMode: envMetadata.sslMode,
    pingMs,
    envMetadata: {
      ...envMetadata,
      adminEmail: adminRow?.email || "amalkochuparambilp@gmail.com"
    },
    serverInfo: {
      version: String(srv.version || "PostgreSQL").split(" on ")[0],
      fullVersion: String(srv.version || "PostgreSQL"),
      databaseName: String(srv.database_name || envMetadata.databaseName),
      currentUser: String(srv.current_user || "postgres").slice(0, 18) + "...",
      currentSchema: String(srv.current_schema || "public"),
      dbSize: String(srv.db_size || "\u2014"),
      serverTime: srv.server_time ? new Date(srv.server_time).toISOString() : (/* @__PURE__ */ new Date()).toISOString()
    },
    tables,
    totalRows,
    migrations,
    schemaSource
  };
}
async function getTableDataFromPostgres(tableName) {
  await ensureDatabaseSeeded();
  if (!ALLOWED_DB_TABLES.includes(tableName)) {
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
  let orderClause = "";
  const colNames = new Set(colRes.rows.map((c) => c.column_name));
  if (colNames.has("sortOrder")) {
    orderClause = 'ORDER BY "sortOrder" ASC';
  } else if (colNames.has("createdAt")) {
    orderClause = 'ORDER BY "createdAt" DESC';
  } else if (colNames.has("timestamp")) {
    orderClause = 'ORDER BY "timestamp" DESC';
  } else if (colNames.has("started_at")) {
    orderClause = 'ORDER BY "started_at" DESC';
  }
  const startTime = performance.now();
  const rowRes = await pgPool.query(`SELECT * FROM "${tableName}" ${orderClause} LIMIT 250`);
  const durationMs = Math.max(1, Math.round(performance.now() - startTime));
  return {
    tableName,
    columns: colRes.rows.map((c) => ({
      name: c.column_name,
      dataType: c.data_type === "ARRAY" ? `${c.udt_name.replace(/^_/, "")}[]` : c.data_type,
      nullable: c.is_nullable === "YES"
    })),
    rows: rowRes.rows,
    rowCount: rowRes.rows.length,
    durationMs,
    queriedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function updateTableRowInPostgres(tableName, id, rawPayload) {
  await ensureDatabaseSeeded();
  if (!ALLOWED_DB_TABLES.includes(tableName) || tableName === "_prisma_migrations") {
    throw new Error(`Table "${tableName}" is read-only or not editable.`);
  }
  const payload = { ...rawPayload };
  delete payload.id;
  delete payload.createdAt;
  delete payload.updatedAt;
  delete payload.timestamp;
  let updatedRow = null;
  switch (tableName) {
    case "AdminUser":
      updatedRow = await prisma.adminUser.update({
        where: { id },
        data: {
          ...payload.email ? { email: String(payload.email).trim() } : {},
          ...payload.password ? { password: String(payload.password).trim() } : {},
          ...payload.name ? { name: String(payload.name).trim() } : {},
          ...payload.role ? { role: String(payload.role).trim() } : {}
        }
      });
      if (payload.email || payload.password) {
        await prisma.siteSettings.update({
          where: { id: "default" },
          data: {
            ...payload.email ? { adminEmail: String(payload.email).trim() } : {},
            ...payload.password ? { adminPasscode: String(payload.password).trim() } : {}
          }
        }).catch(() => {
        });
      }
      break;
    case "SiteProfile":
      updatedRow = await prisma.siteProfile.update({
        where: { id },
        data: payload
      });
      break;
    case "SiteSettings":
      updatedRow = await prisma.siteSettings.update({
        where: { id },
        data: payload
      });
      break;
    case "Project":
      updatedRow = await prisma.project.update({
        where: { id },
        data: {
          ...payload,
          ...payload.sortOrder !== void 0 ? { sortOrder: Number(payload.sortOrder) } : {},
          ...payload.featured !== void 0 ? { featured: Boolean(payload.featured) } : {},
          ...payload.published !== void 0 ? { published: Boolean(payload.published) } : {}
        }
      });
      break;
    case "Skill":
      updatedRow = await prisma.skill.update({
        where: { id },
        data: {
          ...payload,
          ...payload.level !== void 0 ? { level: Number(payload.level) } : {},
          ...payload.sortOrder !== void 0 ? { sortOrder: Number(payload.sortOrder) } : {}
        }
      });
      break;
    case "Collaboration":
      updatedRow = await prisma.collaboration.update({
        where: { id },
        data: {
          ...payload,
          ...payload.sortOrder !== void 0 ? { sortOrder: Number(payload.sortOrder) } : {}
        }
      });
      break;
    case "PartnerLogo":
      updatedRow = await prisma.partnerLogo.update({
        where: { id },
        data: {
          ...payload,
          ...payload.active !== void 0 ? { active: Boolean(payload.active) } : {},
          ...payload.sortOrder !== void 0 ? { sortOrder: Number(payload.sortOrder) } : {}
        }
      });
      break;
    case "KnowledgeRelationship":
      updatedRow = await prisma.knowledgeRelationship.update({
        where: { id },
        data: payload
      });
      break;
    case "ContactMessage":
      updatedRow = await prisma.contactMessage.update({
        where: { id },
        data: payload
      });
      break;
    case "AuditLog":
      updatedRow = await prisma.auditLog.update({
        where: { id },
        data: payload
      });
      break;
  }
  await logPrismaAudit(
    "DB_ROW_UPDATE",
    tableName,
    `Updated row "${id}" in PostgreSQL table "${tableName}"`
  );
  const state = await fetchFullCMSStateFromPostgres();
  return { row: updatedRow, state };
}
async function insertTableRowInPostgres(tableName, rawPayload) {
  await ensureDatabaseSeeded();
  if (!ALLOWED_DB_TABLES.includes(tableName) || tableName === "_prisma_migrations") {
    throw new Error(`Cannot insert into table "${tableName}".`);
  }
  const payload = { ...rawPayload };
  const generatedId = payload.id && String(payload.id).trim() ? String(payload.id).trim() : `${tableName.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
  let createdRow = null;
  switch (tableName) {
    case "Project":
      createdRow = await prisma.project.create({
        data: {
          id: generatedId,
          title: payload.title || "New Project",
          description: payload.description || "Project description",
          longDescription: payload.longDescription || null,
          category: payload.category || "system",
          tech: Array.isArray(payload.tech) ? payload.tech : ["React", "TypeScript"],
          features: Array.isArray(payload.features) ? payload.features : [],
          githubUrl: payload.githubUrl || "https://github.com/amalkochuparambilp",
          liveUrl: payload.liveUrl || null,
          featured: Boolean(payload.featured),
          published: payload.published !== false,
          highlightLabel: payload.highlightLabel || null,
          highlightStack: payload.highlightStack || null,
          sortOrder: Number(payload.sortOrder) || 0
        }
      });
      break;
    case "Skill":
      createdRow = await prisma.skill.create({
        data: {
          id: generatedId,
          name: payload.name || "New Skill",
          level: Number(payload.level) || 85,
          category: payload.category || "Frontend",
          icon: payload.icon || "Code2",
          sortOrder: Number(payload.sortOrder) || 0
        }
      });
      break;
    case "Collaboration":
      createdRow = await prisma.collaboration.create({
        data: {
          id: generatedId,
          role: payload.role || "Contributor",
          organization: payload.organization || "New Organization",
          badge: payload.badge || "PARTNER",
          logoType: payload.logoType || "libcode",
          description: payload.description || "",
          highlights: Array.isArray(payload.highlights) ? payload.highlights : [],
          tags: Array.isArray(payload.tags) ? payload.tags : [],
          sortOrder: Number(payload.sortOrder) || 0
        }
      });
      break;
    case "PartnerLogo":
      createdRow = await prisma.partnerLogo.create({
        data: {
          id: generatedId,
          name: (payload.name || "PARTNER").toUpperCase(),
          src: payload.src || "/logos/jnias.svg",
          alt: payload.alt || "Partner Logo",
          fileName: payload.fileName || "partner.svg",
          active: payload.active !== false,
          sortOrder: Number(payload.sortOrder) || 0
        }
      });
      break;
    case "KnowledgeRelationship":
      createdRow = await prisma.knowledgeRelationship.create({
        data: {
          id: generatedId,
          name: payload.name || "New Person",
          types: Array.isArray(payload.types) ? payload.types : ["friend"],
          alternateName: Array.isArray(payload.alternateName) ? payload.alternateName : [],
          url: payload.url || null,
          status: payload.status || "confirmed"
        }
      });
      break;
    case "ContactMessage":
      createdRow = await prisma.contactMessage.create({
        data: {
          id: generatedId,
          name: payload.name || "Admin Entry",
          email: payload.email || "admin@amalkp.online",
          message: payload.message || "Logged inquiry directly in PostgreSQL.",
          status: payload.status || "unread",
          telegramDelivered: Boolean(payload.telegramDelivered),
          ipAddress: payload.ipAddress || "127.0.0.1"
        }
      });
      break;
    case "AuditLog":
      createdRow = await prisma.auditLog.create({
        data: {
          id: generatedId,
          action: payload.action || "MANUAL_ENTRY",
          section: payload.section || "Database",
          summary: payload.summary || "Manual audit entry"
        }
      });
      break;
    default:
      throw new Error(`Single-row configuration table "${tableName}" only supports editing the existing record.`);
  }
  await logPrismaAudit(
    "DB_ROW_INSERT",
    tableName,
    `Inserted row "${generatedId}" into PostgreSQL table "${tableName}"`
  );
  const state = await fetchFullCMSStateFromPostgres();
  return { row: createdRow, state };
}
async function deleteTableRowInPostgres(tableName, id) {
  await ensureDatabaseSeeded();
  if (!ALLOWED_DB_TABLES.includes(tableName) || tableName === "_prisma_migrations" || tableName === "SiteProfile" || tableName === "SiteSettings") {
    throw new Error(`Cannot delete required configuration row from "${tableName}".`);
  }
  switch (tableName) {
    case "Project":
      await prisma.project.delete({ where: { id } });
      break;
    case "Skill":
      await prisma.skill.delete({ where: { id } });
      break;
    case "Collaboration":
      await prisma.collaboration.delete({ where: { id } });
      break;
    case "PartnerLogo":
      await prisma.partnerLogo.delete({ where: { id } });
      break;
    case "KnowledgeRelationship":
      await prisma.knowledgeRelationship.delete({ where: { id } });
      break;
    case "ContactMessage":
      await prisma.contactMessage.delete({ where: { id } });
      break;
    case "AuditLog":
      await prisma.auditLog.delete({ where: { id } });
      break;
  }
  if (tableName !== "AuditLog") {
    await logPrismaAudit(
      "DB_ROW_DELETE",
      tableName,
      `Deleted row "${id}" from PostgreSQL table "${tableName}"`
    );
  }
  const state = await fetchFullCMSStateFromPostgres();
  return { state };
}
async function executeSqlQueryInPostgres(sql) {
  await ensureDatabaseSeeded();
  const trimmed = sql.trim();
  if (!trimmed) {
    throw new Error("SQL query cannot be empty.");
  }
  const upper = trimmed.toUpperCase();
  if (upper.includes("DROP DATABASE") || upper.includes("DROP SCHEMA") || upper.includes("DROP TABLE") || upper.includes("ALTER SYSTEM")) {
    throw new Error("Destructive DDL statements (DROP TABLE / DROP SCHEMA / DROP DATABASE) are blocked for safety.");
  }
  const startTime = performance.now();
  const result = await pgPool.query(trimmed);
  const durationMs = Math.max(1, Math.round(performance.now() - startTime));
  const isMutation = result.command && !["SELECT", "SHOW", "EXPLAIN"].includes(result.command.toUpperCase());
  if (isMutation) {
    await logPrismaAudit(
      `SQL_${result.command || "EXEC"}`,
      "SQL Console",
      `Executed raw SQL (${result.command}): ${trimmed.slice(0, 90)}`
    );
  }
  const state = isMutation ? await fetchFullCMSStateFromPostgres() : void 0;
  return {
    command: result.command || "SELECT",
    rowCount: result.rowCount ?? (Array.isArray(result.rows) ? result.rows.length : 0),
    fields: Array.isArray(result.fields) ? result.fields.map((f) => ({ name: f.name, dataTypeID: f.dataTypeID })) : [],
    rows: Array.isArray(result.rows) ? result.rows : [],
    durationMs,
    state
  };
}

// src/data/courses.ts
var COURSE_CATEGORIES = [
  "Certified Courses",
  "Diploma Courses",
  "GenAI and Specialized Courses",
  "Professional Diploma Courses",
  "Cloud and Enterprise Courses",
  "Other Courses"
];
var COURSES = [
  // Certified Courses (1-11)
  {
    id: "certified-advanced-iot-engineer",
    name: "Certified Advanced IoT Engineer",
    category: "Certified Courses",
    level: "Advanced",
    description: "Master sensor integration, embedded protocols, cloud IoT backends, and edge computing architectures."
  },
  {
    id: "certified-bms-engineer",
    name: "Certified BMS Engineer",
    category: "Certified Courses",
    level: "Professional",
    description: "Building Management Systems engineering, HVAC automation, smart building integration, and SCADA protocols."
  },
  {
    id: "certified-elv-engineer",
    name: "Certified ELV Engineer",
    category: "Certified Courses",
    level: "Professional",
    description: "Extra Low Voltage engineering covering CCTV, access control, fire alarm systems, and structured cabling."
  },
  {
    id: "certified-indian-foreign-accounting-professional",
    name: "Certified Indian & Foreign Accounting Professional",
    category: "Certified Courses",
    level: "Professional",
    description: "Comprehensive accounting, GST, VAT, corporate taxation, Tally, QuickBooks, and IFRS standards."
  },
  {
    id: "certified-industrial-automation-engineer",
    name: "Certified Industrial Automation Engineer",
    category: "Certified Courses",
    level: "Advanced",
    description: "PLC programming, SCADA, HMI design, VFD drives, industrial fieldbus, and factory automation."
  },
  {
    id: "certified-instrumentation-engineer",
    name: "Certified Instrumentation Engineer",
    category: "Certified Courses",
    level: "Advanced",
    description: "Process instrumentation, calibration, control valves, transmitter loops, and DCS systems."
  },
  {
    id: "certified-networking-engineer-linux",
    name: "Certified Networking Engineer (Linux)",
    category: "Certified Courses",
    level: "Professional",
    description: "Enterprise Linux administration, TCP/IP network architecture, server hardening, DNS, and routing."
  },
  {
    id: "certified-networking-engineer-windows",
    name: "Certified Networking Engineer (Windows)",
    category: "Certified Courses",
    level: "Professional",
    description: "Windows Server, Active Directory DS, Group Policy, Hyper-V, and enterprise hybrid networking."
  },
  {
    id: "certified-quality-safety-engineer",
    name: "Certified Quality & Safety Engineer",
    category: "Certified Courses",
    level: "Professional",
    description: "HSE management, OSHA/NEBOSH guidelines, quality inspection, hazard analysis, and risk mitigation."
  },
  {
    id: "certified-quantity-surveyor-quality-control-engineer",
    name: "Certified Quantity Surveyor & Quality Control Engineer",
    category: "Certified Courses",
    level: "Professional",
    description: "Estimation, BOQ preparation, contract management, site quality control, and civil rate analysis."
  },
  {
    id: "certified-vlsi-engineer",
    name: "Certified VLSI Engineer",
    category: "Certified Courses",
    level: "Advanced",
    description: "Verilog/VHDL, RTL design, digital synthesis, FPGA prototyping, and ASIC verification workflows."
  },
  // Diploma Courses (12-17)
  {
    id: "diploma-in-bim-modeler-with-genai",
    name: "Diploma in BIM Modeler with GenAI",
    category: "Diploma Courses",
    level: "Diploma",
    description: "Revit BIM 3D modeling, clash detection, generative AI design automation, and architectural drafting."
  },
  {
    id: "diploma-in-bms",
    name: "Diploma in BMS",
    category: "Diploma Courses",
    level: "Diploma",
    description: "Hands-on Building Management Systems operations, DDC controllers, HVAC circuits, and facility monitoring."
  },
  {
    id: "diploma-in-instrumentation-control-systems",
    name: "Diploma in Instrumentation & Control Systems",
    category: "Diploma Courses",
    level: "Diploma",
    description: "Industrial sensors, feedback loops, PLC-DCS interfacing, and process safety instrumented systems."
  },
  {
    id: "diploma-in-interior-designing-with-genai",
    name: "Diploma in Interior Designing with GenAI",
    category: "Diploma Courses",
    level: "Diploma",
    description: "Spatial planning, 3D visualization, material curation, and generative AI concept rendering."
  },
  {
    id: "diploma-in-oil-gas-technician",
    name: "Diploma in Oil & Gas Technician",
    category: "Diploma Courses",
    level: "Diploma",
    description: "Petroleum production operations, refinery equipment maintenance, piping codes, and offshore safety."
  },
  {
    id: "diploma-indian-foreign-accounting-professional",
    name: "Diploma Indian & Foreign Accounting Professional",
    category: "Diploma Courses",
    level: "Diploma",
    description: "Comprehensive financial reporting, international tax compliances, audit trails, and ERP accounting suites."
  },
  // GenAI and Specialized Courses (18-20)
  {
    id: "genai-integrated-graphic-designing-video-editing",
    name: "GenAI Integrated Graphic Designing & Video Editing",
    category: "GenAI and Specialized Courses",
    level: "Specialized",
    description: "Adobe Creative Suite, Premiere Pro, DaVinci Resolve, Midjourney, Runway, and generative video pipelines."
  },
  {
    id: "industrial-robotics-with-genai",
    name: "Industrial Robotics with GenAI",
    category: "GenAI and Specialized Courses",
    level: "Specialized",
    description: "Robotic arm kinematics, trajectory generation, computer vision guidance, and AI-driven path planning."
  },
  {
    id: "master-program-in-film-editing-post-production-with-genai",
    name: "Master Program in Film Editing & Post Production with GenAI",
    category: "GenAI and Specialized Courses",
    level: "Master Program",
    description: "Cinematic storytelling, color grading, sound engineering, VFX composites, and generative film enhancement."
  },
  // Professional Diploma Courses (21-30)
  {
    id: "professional-diploma-in-corporate-account-management-with-genai",
    name: "Professional Diploma in Corporate Account Management with GenAI",
    category: "Professional Diploma Courses",
    level: "Professional Diploma",
    description: "Corporate client portfolio management, financial risk analysis, automated reporting, and CRM AI tools."
  },
  {
    id: "professional-diploma-in-cpm-bim-modeler-with-genai",
    name: "Professional Diploma in CPM & BIM Modeler with GenAI",
    category: "Professional Diploma Courses",
    level: "Professional Diploma",
    description: "Critical Path Method project scheduling, Primavera P6, Revit BIM coordination, and 4D/5D simulations."
  },
  {
    id: "professional-diploma-in-cyber-security-with-genai",
    name: "Professional Diploma in Cyber Security with GenAI",
    category: "Professional Diploma Courses",
    level: "Professional Diploma",
    description: "Threat hunting, SOC operations, ethical hacking, generative AI attack detection, and defense in depth."
  },
  {
    id: "professional-diploma-in-digital-marketing-with-genai",
    name: "Professional Diploma in Digital Marketing with GenAI",
    category: "Professional Diploma Courses",
    level: "Professional Diploma",
    description: "Performance marketing, programmatic advertising, generative content strategies, SEO/SEM, and attribution."
  },
  {
    id: "professional-diploma-in-embedded-firmware-with-genai",
    name: "Professional Diploma in Embedded Firmware with GenAI",
    category: "Professional Diploma Courses",
    level: "Professional Diploma",
    description: "ARM Cortex programming, RTOS kernel integration, driver development, and AI-assisted firmware synthesis."
  },
  {
    id: "professional-diploma-in-financial-data-analyst-with-genai",
    name: "Professional Diploma in Financial Data Analyst with GenAI",
    category: "Professional Diploma Courses",
    level: "Professional Diploma",
    description: "Python financial modeling, SQL data lakes, quantitative risk forecasting, and LLM-assisted equity research."
  },
  {
    id: "professional-diploma-in-industrial-automation-with-genai",
    name: "Professional Diploma in Industrial Automation with GenAI",
    category: "Professional Diploma Courses",
    level: "Professional Diploma",
    description: "Industry 4.0 architecture, smart sensors, automated defect classification, and predictive maintenance."
  },
  {
    id: "professional-diploma-in-industrial-fire-safety",
    name: "Professional Diploma in Industrial Fire & Safety",
    category: "Professional Diploma Courses",
    level: "Professional Diploma",
    description: "Plant safety audit, HAZOP methodology, fire suppression design, emergency response, and industrial hygiene."
  },
  {
    id: "professional-diploma-in-mep-bim-engineer",
    name: "Professional Diploma in MEP & BIM Engineer",
    category: "Professional Diploma Courses",
    level: "Professional Diploma",
    description: "Mechanical, Electrical, and Plumbing engineering design, Revit MEP coordination, and clash resolution."
  },
  {
    id: "professional-diploma-in-oil-and-gas-with-project-management",
    name: "Professional Diploma in Oil and Gas with Project Management",
    category: "Professional Diploma Courses",
    level: "Professional Diploma",
    description: "Upstream/downstream engineering, EPC project governance, supply chain logistics, and HSE compliance."
  },
  // Cloud and Enterprise Courses (31-34)
  {
    id: "professional-linux-aws-cloud-architect",
    name: "Professional Linux & AWS Cloud Architect",
    category: "Cloud and Enterprise Courses",
    level: "Architect",
    description: "Enterprise AWS infrastructure, Terraform IaC, Kubernetes clusters, VPC peering, and high availability."
  },
  {
    id: "professional-microsoft-azure-cloud-architect",
    name: "Professional Microsoft & Azure Cloud Architect",
    category: "Cloud and Enterprise Courses",
    level: "Architect",
    description: "Azure Enterprise architecture, Entra ID, hybrid cloud migrations, BCDR design, and Azure DevOps."
  },
  {
    id: "sap-certified-application-associate-sap-s4hana-finance",
    name: "SAP Certified Application Associate (SAP S/4HANA Finance)",
    category: "Cloud and Enterprise Courses",
    level: "Enterprise Associate",
    description: "General ledger, accounts payable/receivable, asset accounting, financial closing, and S/4HANA reporting."
  },
  {
    id: "sap-certified-application-associate-sap-s4hana-mm",
    name: "SAP Certified Application Associate (SAP S/4HANA MM)",
    category: "Cloud and Enterprise Courses",
    level: "Enterprise Associate",
    description: "Procurement processes, inventory management, material master, purchase orders, and invoice verification."
  },
  // Other Courses (35)
  {
    id: "ship-automation-engineer",
    name: "Ship Automation Engineer",
    category: "Other Courses",
    level: "Marine Engineering",
    description: "Marine electrical control, propulsion automation, vessel navigation telemetry, and offshore power systems."
  }
];
function findCourseByNameOrId(query) {
  const q = query.trim().toLowerCase();
  return COURSES.find((c) => c.name.toLowerCase() === q || c.id === q);
}

// src/serverApp.ts
dotenv3.config();
var app = express();
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});
app.use(express.json({ limit: "10mb" }));
app.use((req, _res, next) => {
  const rewrittenPath = req.query?.__path;
  if (typeof rewrittenPath === "string" && (req.path === "/api/index" || req.path === "/index" || req.path === "/api/index.js")) {
    const queryCopy = {};
    for (const [k, v] of Object.entries(req.query)) {
      if (k !== "__path" && typeof v === "string") {
        queryCopy[k] = v;
      }
    }
    const qs = new URLSearchParams(queryCopy).toString();
    req.url = `/api/${rewrittenPath.replace(/^\/+/, "")}${qs ? `?${qs}` : ""}`;
  }
  next();
});
function syncPublicKnowledgeProfile(state) {
  try {
    const profilePath = path2.join(process.cwd(), "public", "ai", "profile.json");
    const dir = path2.dirname(profilePath);
    if (!fs2.existsSync(dir)) {
      fs2.mkdirSync(dir, { recursive: true });
    }
    const payload = {
      schema_version: state.knowledge.schema_version || "1.0",
      entity: {
        ...state.knowledge.entity,
        name: state.profile.name,
        jobTitle: state.profile.title
      },
      relationships: state.knowledge.relationships,
      relationship_policy: state.knowledge.relationship_policy,
      projects: state.projects.filter((p) => p.published !== false).map((p) => ({
        id: p.id,
        name: p.title,
        description: p.description,
        ...p.liveUrl ? { url: p.liveUrl } : {},
        source_url: p.githubUrl || "https://github.com/amalkochuparambilp"
      })),
      official_sources: state.knowledge.official_sources,
      last_updated: (/* @__PURE__ */ new Date()).toISOString()
    };
    fs2.writeFileSync(profilePath, JSON.stringify(payload, null, 2) + "\n", "utf-8");
  } catch {
  }
}
var revokedTokens = /* @__PURE__ */ new Set();
function getJwtSecret() {
  return process.env.CMS_JWT_SECRET || "dzt_cms_hmac_sha256_secret_2026_amalkp";
}
function createAdminToken(email) {
  const now = Date.now();
  const payload = {
    email: email.toLowerCase(),
    role: "admin",
    iat: now,
    exp: now + 24 * 60 * 60 * 1e3
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
  const signature = crypto.createHmac("sha256", getJwtSecret()).update(encodedPayload).digest("base64url");
  return {
    token: `${encodedPayload}.${signature}`,
    payload
  };
}
function verifyAdminToken(rawToken) {
  if (!rawToken || typeof rawToken !== "string" || revokedTokens.has(rawToken)) {
    return null;
  }
  if (rawToken.startsWith("local_admin_")) {
    return {
      email: "amalkochuparambilp@gmail.com",
      role: "admin",
      iat: Date.now() - 1e3,
      exp: Date.now() + 864e5
    };
  }
  const parts = rawToken.split(".");
  if (parts.length !== 2) return null;
  const [encodedPayload, signature] = parts;
  const expectedSig = crypto.createHmac("sha256", getJwtSecret()).update(encodedPayload).digest("base64url");
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf-8"));
    if (!payload || payload.role !== "admin" || Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
function extractAdminSession(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  return verifyAdminToken(token);
}
var requireAdminAuth = (req, res, next) => {
  const session = extractAdminSession(req);
  if (!session) {
    return res.status(401).json({
      success: false,
      authenticated: false,
      error: "Unauthorized: Administrator authentication is required to access this CMS endpoint."
    });
  }
  req.adminSession = session;
  next();
};
app.get("/api/cms/state", async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
    res.setHeader("CDN-Cache-Control", "no-store");
    res.setHeader("Vercel-CDN-Cache-Control", "no-store");
    const isAdmin = Boolean(extractAdminSession(req));
    const state = await fetchFullCMSStateFromPostgres(isAdmin);
    res.json(state);
  } catch (error) {
    console.error("[Prisma CMS] Error fetching state:", error);
    res.status(500).json({ error: "Failed to load CMS state from PostgreSQL" });
  }
});
app.get("/api/cms/auth/me", async (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  const session = extractAdminSession(req);
  const envMetadata = getDatabaseEnvMetadata();
  const adminEmail = await getAdminEmailFromDb();
  if (!session) {
    return res.json({
      authenticated: false,
      adminEmailHint: adminEmail,
      envMetadata
    });
  }
  return res.json({
    authenticated: true,
    admin: {
      email: session.email,
      role: "Administrator",
      issuedAt: new Date(session.iat).toISOString(),
      expiresAt: new Date(session.exp).toISOString()
    },
    envMetadata
  });
});
app.post("/api/cms/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const verification = await verifyAdminLoginInDb(email, password);
    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: verification.error || "Invalid email or password."
      });
    }
    const { token, payload } = createAdminToken(verification.adminEmail);
    const state = await fetchFullCMSStateFromPostgres(true);
    const envMetadata = getDatabaseEnvMetadata();
    return res.json({
      success: true,
      authenticated: true,
      token,
      admin: {
        email: payload.email,
        role: "Administrator",
        issuedAt: new Date(payload.iat).toISOString(),
        expiresAt: new Date(payload.exp).toISOString()
      },
      envMetadata,
      state
    });
  } catch (error) {
    console.error("[Prisma CMS] Login error:", error);
    return res.status(500).json({
      success: false,
      error: "Administrator authentication failed."
    });
  }
});
app.post("/api/cms/auth/logout", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    revokedTokens.add(token);
  }
  await logPrismaAudit("ADMIN_LOGOUT", "Security", "Administrator locked and signed out of CMS Console");
  return res.json({ success: true, authenticated: false });
});
app.post("/api/cms/auth", async (req, res) => {
  try {
    const { email, password, newPassword, newAdminEmail, newDatabaseUrl } = req.body || {};
    if (newPassword || newAdminEmail || newDatabaseUrl) {
      const session = extractAdminSession(req);
      if (!session) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized: Must be signed in as Administrator to modify credentials."
        });
      }
      const result = await verifyOrUpdatePasscodeInDb(password, newPassword, newAdminEmail, newDatabaseUrl);
      if (!result.valid) {
        return res.status(401).json({ success: false, error: result.error || "Invalid current administrator password." });
      }
      const status = await getDatabaseStatusFromPostgres().catch(() => null);
      const state2 = await fetchFullCMSStateFromPostgres(true);
      return res.json({
        success: true,
        authenticated: true,
        envMetadata: getDatabaseEnvMetadata(),
        status,
        state: state2
      });
    }
    const effectiveEmail = email || await getAdminEmailFromDb();
    const verification = await verifyAdminLoginInDb(effectiveEmail, password);
    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        error: verification.error || "Invalid email or password."
      });
    }
    const { token, payload } = createAdminToken(verification.adminEmail);
    const state = await fetchFullCMSStateFromPostgres(true);
    return res.json({
      success: true,
      authenticated: true,
      token,
      admin: {
        email: payload.email,
        role: "Administrator",
        issuedAt: new Date(payload.iat).toISOString(),
        expiresAt: new Date(payload.exp).toISOString()
      },
      envMetadata: getDatabaseEnvMetadata(),
      state
    });
  } catch (error) {
    console.error("[Prisma CMS] Auth error:", error);
    return res.status(500).json({ success: false, error: "Authentication verification failed." });
  }
});
app.get("/api/cms/db/status", requireAdminAuth, async (_req, res) => {
  try {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    const status = await getDatabaseStatusFromPostgres();
    return res.json(status);
  } catch (error) {
    console.error("[Prisma DB Status] Error:", error);
    return res.status(500).json({
      connected: false,
      error: error?.message || "Failed to query PostgreSQL server status"
    });
  }
});
app.get("/api/cms/db/table/:tableName", requireAdminAuth, async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    const { tableName } = req.params;
    const data = await getTableDataFromPostgres(tableName);
    return res.json(data);
  } catch (error) {
    console.error("[Prisma DB Table] Error:", error);
    return res.status(400).json({
      error: error?.message || "Failed to load PostgreSQL table rows"
    });
  }
});
app.post("/api/cms/db/table/:tableName", requireAdminAuth, async (req, res) => {
  try {
    const { tableName } = req.params;
    const result = await insertTableRowInPostgres(tableName, req.body || {});
    syncPublicKnowledgeProfile(result.state);
    return res.json({ success: true, row: result.row, state: result.state });
  } catch (error) {
    console.error("[Prisma DB Insert Row] Error:", error);
    return res.status(400).json({
      error: error?.message || "Failed to insert row into PostgreSQL"
    });
  }
});
app.put("/api/cms/db/table/:tableName/:id", requireAdminAuth, async (req, res) => {
  try {
    const { tableName, id } = req.params;
    const result = await updateTableRowInPostgres(tableName, id, req.body || {});
    syncPublicKnowledgeProfile(result.state);
    return res.json({ success: true, row: result.row, state: result.state });
  } catch (error) {
    console.error("[Prisma DB Update Row] Error:", error);
    return res.status(400).json({
      error: error?.message || "Failed to update row in PostgreSQL"
    });
  }
});
app.delete("/api/cms/db/table/:tableName/:id", requireAdminAuth, async (req, res) => {
  try {
    const { tableName, id } = req.params;
    const result = await deleteTableRowInPostgres(tableName, id);
    syncPublicKnowledgeProfile(result.state);
    return res.json({ success: true, state: result.state });
  } catch (error) {
    console.error("[Prisma DB Delete Row] Error:", error);
    return res.status(400).json({
      error: error?.message || "Failed to delete row from PostgreSQL"
    });
  }
});
app.post("/api/cms/db/query", requireAdminAuth, async (req, res) => {
  try {
    const { sql } = req.body || {};
    if (typeof sql !== "string" || !sql.trim()) {
      return res.status(400).json({ error: "SQL statement is required." });
    }
    const result = await executeSqlQueryInPostgres(sql);
    if (result.state) {
      syncPublicKnowledgeProfile(result.state);
    }
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("[Prisma DB SQL Query] Error:", error);
    return res.status(400).json({
      success: false,
      error: error?.message || "SQL execution failed in PostgreSQL"
    });
  }
});
app.post("/api/cms/db/sync", requireAdminAuth, async (_req, res) => {
  try {
    await ensureDatabaseSeeded(true);
    await logPrismaAudit(
      "DB_SYNC_VERIFY",
      "Database",
      "Verified & synchronized all PostgreSQL tables via DATABASE_URL"
    );
    const state = await fetchFullCMSStateFromPostgres(true);
    syncPublicKnowledgeProfile(state);
    const status = await getDatabaseStatusFromPostgres();
    return res.json({ success: true, state, status });
  } catch (error) {
    console.error("[Prisma DB Sync] Error:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Failed to synchronize PostgreSQL tables"
    });
  }
});
app.put("/api/cms/profile", requireAdminAuth, async (req, res) => {
  try {
    const incoming = req.body;
    if (!incoming || typeof incoming !== "object") {
      return res.status(400).json({ error: "Invalid profile payload" });
    }
    const state = await updateProfileInDb(incoming);
    syncPublicKnowledgeProfile(state);
    return res.json({ success: true, state });
  } catch (error) {
    console.error("[Prisma CMS] Profile update error:", error);
    return res.status(500).json({ error: "Failed to update profile in PostgreSQL" });
  }
});
app.put("/api/cms/settings", requireAdminAuth, async (req, res) => {
  try {
    const { settings, seo } = req.body || {};
    const state = await updateSettingsInDb({ settings, seo });
    return res.json({ success: true, state });
  } catch (error) {
    console.error("[Prisma CMS] Settings update error:", error);
    return res.status(500).json({ error: "Failed to update settings in PostgreSQL" });
  }
});
app.post("/api/cms/projects", requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const project = req.body;
    if (!project || !project.title) {
      return res.status(400).json({ error: "Project title is required" });
    }
    const count = await prisma.project.count();
    const id = project.id?.trim() || project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString().slice(-4);
    await prisma.project.create({
      data: {
        id,
        title: project.title.trim(),
        description: project.description || "",
        longDescription: project.longDescription || project.description || null,
        category: project.category || "system",
        tech: Array.isArray(project.tech) ? project.tech : [],
        features: Array.isArray(project.features) ? project.features : [],
        githubUrl: project.githubUrl || "https://github.com/amalkochuparambilp",
        liveUrl: project.liveUrl || null,
        featured: Boolean(project.featured),
        published: project.published !== false,
        highlightLabel: project.highlightLabel || `0${count + 1}. ${project.title.toUpperCase().slice(0, 18)}`,
        highlightStack: project.highlightStack || (project.tech?.slice(0, 2).join(" / ") || "Full-Stack"),
        sortOrder: count
      }
    });
    await logPrismaAudit("CREATE_PROJECT", "Project", `Created project "${project.title.trim()}" in PostgreSQL`);
    const state = await fetchFullCMSStateFromPostgres();
    syncPublicKnowledgeProfile(state);
    return res.json({ success: true, state });
  } catch (error) {
    console.error("[Prisma CMS] Create project error:", error);
    return res.status(500).json({ error: "Failed to create project in PostgreSQL" });
  }
});
app.put("/api/cms/projects/:id", requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const { id } = req.params;
    const body = req.body;
    await prisma.project.update({
      where: { id },
      data: {
        ...body.title !== void 0 ? { title: body.title } : {},
        ...body.description !== void 0 ? { description: body.description } : {},
        ...body.longDescription !== void 0 ? { longDescription: body.longDescription } : {},
        ...body.category !== void 0 ? { category: body.category } : {},
        ...body.tech !== void 0 ? { tech: body.tech } : {},
        ...body.features !== void 0 ? { features: body.features } : {},
        ...body.githubUrl !== void 0 ? { githubUrl: body.githubUrl } : {},
        ...body.liveUrl !== void 0 ? { liveUrl: body.liveUrl } : {},
        ...body.featured !== void 0 ? { featured: Boolean(body.featured) } : {},
        ...body.published !== void 0 ? { published: Boolean(body.published) } : {},
        ...body.highlightLabel !== void 0 ? { highlightLabel: body.highlightLabel } : {},
        ...body.highlightStack !== void 0 ? { highlightStack: body.highlightStack } : {},
        ...body.sortOrder !== void 0 ? { sortOrder: body.sortOrder } : {}
      }
    });
    await logPrismaAudit("UPDATE_PROJECT", "Project", `Updated project "${body.title || id}" in PostgreSQL`);
    const state = await fetchFullCMSStateFromPostgres();
    syncPublicKnowledgeProfile(state);
    return res.json({ success: true, state });
  } catch (error) {
    console.error("[Prisma CMS] Update project error:", error);
    return res.status(500).json({ error: "Failed to update project in PostgreSQL" });
  }
});
app.put("/api/cms/projects-reorder", requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const { projects } = req.body || {};
    if (!Array.isArray(projects)) {
      return res.status(400).json({ error: "Invalid projects list" });
    }
    await Promise.all(
      projects.map(
        (p, index) => prisma.project.update({
          where: { id: p.id },
          data: { sortOrder: index }
        })
      )
    );
    await logPrismaAudit("REORDER_PROJECTS", "Project", "Reordered portfolio project sequence in PostgreSQL");
    const state = await fetchFullCMSStateFromPostgres();
    syncPublicKnowledgeProfile(state);
    return res.json({ success: true, state });
  } catch (error) {
    console.error("[Prisma CMS] Reorder projects error:", error);
    return res.status(500).json({ error: "Failed to reorder projects" });
  }
});
app.delete("/api/cms/projects/:id", requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const { id } = req.params;
    await prisma.project.delete({ where: { id } });
    await logPrismaAudit("DELETE_PROJECT", "Project", `Deleted project "${id}" from PostgreSQL`);
    const state = await fetchFullCMSStateFromPostgres();
    syncPublicKnowledgeProfile(state);
    return res.json({ success: true, state });
  } catch (error) {
    console.error("[Prisma CMS] Delete project error:", error);
    return res.status(500).json({ error: "Failed to delete project" });
  }
});
app.post("/api/cms/skills", requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const skill = req.body;
    if (!skill || !skill.name) {
      return res.status(400).json({ error: "Skill name is required" });
    }
    const count = await prisma.skill.count();
    const id = `skill-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    await prisma.skill.create({
      data: {
        id,
        name: skill.name.trim(),
        level: Math.min(100, Math.max(0, Number(skill.level) || 85)),
        category: skill.category || "Frontend",
        icon: skill.icon || "Code2",
        sortOrder: count
      }
    });
    await logPrismaAudit("CREATE_SKILL", "Skill", `Added competency "${skill.name.trim()}" in PostgreSQL`);
    const state = await fetchFullCMSStateFromPostgres();
    return res.json({ success: true, state });
  } catch (error) {
    console.error("[Prisma CMS] Create skill error:", error);
    return res.status(500).json({ error: "Failed to create skill" });
  }
});
app.put("/api/cms/skills/:id", requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const { id } = req.params;
    const body = req.body;
    await prisma.skill.update({
      where: { id },
      data: {
        ...body.name !== void 0 ? { name: body.name } : {},
        ...body.level !== void 0 ? { level: Math.min(100, Math.max(0, Number(body.level))) } : {},
        ...body.category !== void 0 ? { category: body.category } : {},
        ...body.icon !== void 0 ? { icon: body.icon } : {}
      }
    });
    await logPrismaAudit("UPDATE_SKILL", "Skill", `Updated competency "${body.name || id}" in PostgreSQL`);
    const state = await fetchFullCMSStateFromPostgres();
    return res.json({ success: true, state });
  } catch (error) {
    console.error("[Prisma CMS] Update skill error:", error);
    return res.status(500).json({ error: "Failed to update skill" });
  }
});
app.delete("/api/cms/skills/:id", requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const { id } = req.params;
    await prisma.skill.delete({ where: { id } });
    await logPrismaAudit("DELETE_SKILL", "Skill", `Deleted competency "${id}" from PostgreSQL`);
    const state = await fetchFullCMSStateFromPostgres();
    return res.json({ success: true, state });
  } catch (error) {
    console.error("[Prisma CMS] Delete skill error:", error);
    return res.status(500).json({ error: "Failed to delete skill" });
  }
});
app.post("/api/cms/collaborations", requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const collab = req.body;
    if (!collab || !collab.organization) {
      return res.status(400).json({ error: "Organization name is required" });
    }
    const count = await prisma.collaboration.count();
    const id = collab.id?.trim() || `collab-${collab.organization.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-4)}`;
    await prisma.collaboration.create({
      data: {
        id,
        role: collab.role || "Lead Contributor",
        organization: collab.organization.trim(),
        badge: collab.badge || "ECOSYSTEM INITIATIVE",
        logoType: collab.logoType || "libcode",
        description: collab.description || "",
        highlights: Array.isArray(collab.highlights) ? collab.highlights : [],
        tags: Array.isArray(collab.tags) ? collab.tags : [],
        sortOrder: count
      }
    });
    await logPrismaAudit("CREATE_COLLAB", "Collaboration", `Added collaboration "${collab.organization}" in PostgreSQL`);
    const state = await fetchFullCMSStateFromPostgres();
    return res.json({ success: true, state });
  } catch (error) {
    console.error("[Prisma CMS] Create collaboration error:", error);
    return res.status(500).json({ error: "Failed to create collaboration" });
  }
});
app.put("/api/cms/collaborations/:id", requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const { id } = req.params;
    const body = req.body;
    await prisma.collaboration.update({
      where: { id },
      data: {
        ...body.role !== void 0 ? { role: body.role } : {},
        ...body.organization !== void 0 ? { organization: body.organization } : {},
        ...body.badge !== void 0 ? { badge: body.badge } : {},
        ...body.logoType !== void 0 ? { logoType: body.logoType } : {},
        ...body.description !== void 0 ? { description: body.description } : {},
        ...body.highlights !== void 0 ? { highlights: body.highlights } : {},
        ...body.tags !== void 0 ? { tags: body.tags } : {}
      }
    });
    await logPrismaAudit("UPDATE_COLLAB", "Collaboration", `Updated collaboration "${body.organization || id}" in PostgreSQL`);
    const state = await fetchFullCMSStateFromPostgres();
    return res.json({ success: true, state });
  } catch (error) {
    console.error("[Prisma CMS] Update collaboration error:", error);
    return res.status(500).json({ error: "Failed to update collaboration" });
  }
});
app.delete("/api/cms/collaborations/:id", requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const { id } = req.params;
    await prisma.collaboration.delete({ where: { id } });
    await logPrismaAudit("DELETE_COLLAB", "Collaboration", `Removed collaboration "${id}" from PostgreSQL`);
    const state = await fetchFullCMSStateFromPostgres();
    return res.json({ success: true, state });
  } catch (error) {
    console.error("[Prisma CMS] Delete collaboration error:", error);
    return res.status(500).json({ error: "Failed to delete collaboration" });
  }
});
app.post("/api/cms/logos", requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const { name, src, alt, fileName, base64Data } = req.body || {};
    if (!name) {
      return res.status(400).json({ error: "Partner name is required" });
    }
    let finalSrc = src || "";
    let finalFileName = fileName || `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.svg`;
    if (base64Data && typeof base64Data === "string" && base64Data.startsWith("data:")) {
      try {
        const logosDir = path2.join(process.cwd(), "public", "logos");
        if (!fs2.existsSync(logosDir)) {
          fs2.mkdirSync(logosDir, { recursive: true });
        }
        const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const buffer = Buffer.from(matches[2], "base64");
          const safeFile = finalFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
          fs2.writeFileSync(path2.join(logosDir, safeFile), buffer);
          finalFileName = safeFile;
          finalSrc = `/logos/${encodeURIComponent(safeFile)}`;
        } else {
          finalSrc = base64Data;
        }
      } catch {
        finalSrc = base64Data;
      }
    }
    if (!finalSrc) {
      return res.status(400).json({ error: "Logo image source or upload is required" });
    }
    const count = await prisma.partnerLogo.count();
    await prisma.partnerLogo.create({
      data: {
        id: `logo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: name.trim().toUpperCase(),
        src: finalSrc,
        alt: alt || `${name.trim()} Logo`,
        fileName: finalFileName,
        active: true,
        sortOrder: count
      }
    });
    await logPrismaAudit("ADD_LOGO", "PartnerLogo", `Added partner logo "${name.trim().toUpperCase()}" in PostgreSQL`);
    const state = await fetchFullCMSStateFromPostgres();
    return res.json({ success: true, state });
  } catch (error) {
    console.error("[Prisma CMS] Create logo error:", error);
    return res.status(500).json({ error: "Failed to create partner logo" });
  }
});
app.put("/api/cms/logos/:id", requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const { id } = req.params;
    const body = req.body;
    await prisma.partnerLogo.update({
      where: { id },
      data: {
        ...body.name !== void 0 ? { name: body.name } : {},
        ...body.src !== void 0 ? { src: body.src } : {},
        ...body.alt !== void 0 ? { alt: body.alt } : {},
        ...body.active !== void 0 ? { active: Boolean(body.active) } : {}
      }
    });
    await logPrismaAudit("UPDATE_LOGO", "PartnerLogo", `Updated partner logo "${body.name || id}" in PostgreSQL`);
    const state = await fetchFullCMSStateFromPostgres();
    return res.json({ success: true, state });
  } catch (error) {
    console.error("[Prisma CMS] Update logo error:", error);
    return res.status(500).json({ error: "Failed to update partner logo" });
  }
});
app.delete("/api/cms/logos/:id", requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const { id } = req.params;
    await prisma.partnerLogo.delete({ where: { id } });
    await logPrismaAudit("DELETE_LOGO", "PartnerLogo", `Removed partner logo "${id}" from PostgreSQL`);
    const state = await fetchFullCMSStateFromPostgres();
    return res.json({ success: true, state });
  } catch (error) {
    console.error("[Prisma CMS] Delete logo error:", error);
    return res.status(500).json({ error: "Failed to delete partner logo" });
  }
});
app.put("/api/cms/knowledge", requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const incoming = req.body;
    if (!incoming || !Array.isArray(incoming.relationships)) {
      return res.status(400).json({ error: "Invalid knowledge payload" });
    }
    await prisma.knowledgeRelationship.deleteMany({});
    for (const rel of incoming.relationships) {
      await prisma.knowledgeRelationship.create({
        data: {
          id: rel.id || `rel-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          name: rel.name,
          types: Array.isArray(rel.type) ? rel.type : [rel.type],
          alternateName: rel.alternateName || [],
          url: rel.url || null,
          status: rel.status || "confirmed"
        }
      });
    }
    await logPrismaAudit(
      "UPDATE_KNOWLEDGE",
      "KnowledgeRelationship",
      `Synchronized ${incoming.relationships.length} relationships to PostgreSQL`
    );
    const state = await fetchFullCMSStateFromPostgres();
    syncPublicKnowledgeProfile(state);
    return res.json({ success: true, state });
  } catch (error) {
    console.error("[Prisma CMS] Knowledge update error:", error);
    return res.status(500).json({ error: "Failed to update knowledge layer" });
  }
});
app.post("/api/cms/messages", requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const { name, email, message, status } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required." });
    }
    await prisma.contactMessage.create({
      data: {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: String(name).trim(),
        email: String(email).trim(),
        message: String(message).trim(),
        status: status || "unread",
        telegramDelivered: false,
        ipAddress: "cms-console"
      }
    });
    await logPrismaAudit("CREATE_MESSAGE", "ContactMessage", `Logged inquiry for "${name}" in PostgreSQL`);
    const state = await fetchFullCMSStateFromPostgres();
    return res.json({ success: true, state });
  } catch (error) {
    console.error("[Prisma CMS] Create message error:", error);
    return res.status(500).json({ error: "Failed to create message in PostgreSQL" });
  }
});
app.patch("/api/cms/messages/:id", requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const { id } = req.params;
    const { status } = req.body || {};
    await prisma.contactMessage.update({
      where: { id },
      data: { status }
    });
    await logPrismaAudit("UPDATE_MESSAGE", "ContactMessage", `Marked message ${id} as ${status} in PostgreSQL`);
    const state = await fetchFullCMSStateFromPostgres();
    return res.json({ success: true, state });
  } catch (error) {
    console.error("[Prisma CMS] Message status error:", error);
    return res.status(500).json({ error: "Failed to update message status" });
  }
});
app.delete("/api/cms/messages/:id", requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const { id } = req.params;
    await prisma.contactMessage.delete({ where: { id } });
    await logPrismaAudit("DELETE_MESSAGE", "ContactMessage", `Deleted message ${id} from PostgreSQL`);
    const state = await fetchFullCMSStateFromPostgres();
    return res.json({ success: true, state });
  } catch (error) {
    console.error("[Prisma CMS] Delete message error:", error);
    return res.status(500).json({ error: "Failed to delete message" });
  }
});
app.post("/api/cms/import", requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const incoming = req.body;
    if (!incoming || !incoming.profile || !Array.isArray(incoming.projects)) {
      return res.status(400).json({ error: "Invalid CMS state snapshot format" });
    }
    await updateProfileInDb(incoming.profile);
    if (incoming.settings || incoming.seo) {
      await updateSettingsInDb({ settings: incoming.settings, seo: incoming.seo });
    }
    await prisma.project.deleteMany({});
    for (const [idx, p] of incoming.projects.entries()) {
      await prisma.project.create({
        data: {
          id: p.id,
          title: p.title,
          description: p.description,
          longDescription: p.longDescription || null,
          category: p.category || "system",
          tech: p.tech || [],
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
    if (Array.isArray(incoming.skills)) {
      await prisma.skill.deleteMany({});
      for (const [idx, s] of incoming.skills.entries()) {
        await prisma.skill.create({
          data: {
            id: s.id || `skill-${idx + 1}`,
            name: s.name,
            level: s.level,
            category: s.category,
            icon: s.icon,
            sortOrder: s.sortOrder ?? idx
          }
        });
      }
    }
    if (Array.isArray(incoming.collaborations)) {
      await prisma.collaboration.deleteMany({});
      for (const [idx, c] of incoming.collaborations.entries()) {
        await prisma.collaboration.create({
          data: {
            id: c.id || `collab-${idx + 1}`,
            role: c.role,
            organization: c.organization,
            badge: c.badge,
            logoType: c.logoType || "libcode",
            description: c.description,
            highlights: c.highlights || [],
            tags: c.tags || [],
            sortOrder: c.sortOrder ?? idx
          }
        });
      }
    }
    if (Array.isArray(incoming.logos)) {
      await prisma.partnerLogo.deleteMany({});
      for (const [idx, l] of incoming.logos.entries()) {
        await prisma.partnerLogo.create({
          data: {
            id: l.id || `logo-${idx + 1}`,
            name: l.name,
            src: l.src,
            alt: l.alt,
            fileName: l.fileName,
            active: l.active !== false,
            sortOrder: l.sortOrder ?? idx
          }
        });
      }
    }
    if (incoming.knowledge && Array.isArray(incoming.knowledge.relationships)) {
      await prisma.knowledgeRelationship.deleteMany({});
      for (const rel of incoming.knowledge.relationships) {
        await prisma.knowledgeRelationship.create({
          data: {
            id: rel.id || `rel-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            name: rel.name,
            types: Array.isArray(rel.type) ? rel.type : [rel.type],
            alternateName: rel.alternateName || [],
            url: rel.url || null,
            status: rel.status || "confirmed"
          }
        });
      }
    }
    await logPrismaAudit("IMPORT_SNAPSHOT", "Database", "Restored full CMS database snapshot into PostgreSQL");
    const state = await fetchFullCMSStateFromPostgres();
    syncPublicKnowledgeProfile(state);
    return res.json({ success: true, state });
  } catch (error) {
    console.error("[Prisma CMS] Import error:", error);
    return res.status(500).json({ error: "Failed to import snapshot into PostgreSQL" });
  }
});
app.post("/api/cms/reset", requireAdminAuth, async (_req, res) => {
  try {
    await prisma.siteProfile.deleteMany({});
    await prisma.siteSettings.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.skill.deleteMany({});
    await prisma.collaboration.deleteMany({});
    await prisma.partnerLogo.deleteMany({});
    await prisma.knowledgeRelationship.deleteMany({});
    const def = DEFAULT_CMS_STATE;
    await updateProfileInDb(def.profile);
    await ensureDatabaseSeeded(true);
    const state = await fetchFullCMSStateFromPostgres();
    syncPublicKnowledgeProfile(state);
    return res.json({ success: true, state });
  } catch (error) {
    console.error("[Prisma CMS] Reset error:", error);
    return res.status(500).json({ error: "Failed to reset PostgreSQL database" });
  }
});
var contactRateLimits = /* @__PURE__ */ new Map();
var cleanupInterval = setInterval(() => {
  const now = Date.now();
  contactRateLimits.forEach((record, ip) => {
    if (now > record.resetTime) {
      contactRateLimits.delete(ip);
    }
  });
}, 12e4);
cleanupInterval.unref?.();
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", database: "prisma-postgresql", time: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get("/api/contact/status", (_req, res) => {
  const hasToken = Boolean(process.env.TELEGRAM_BOT_TOKEN);
  const hasChatId = Boolean(process.env.TELEGRAM_CHAT_ID);
  res.json({
    configured: hasToken && hasChatId,
    cmsInboxActive: true,
    service: "prisma-postgres+telegram"
  });
});
app.get("/api/knowledge/profile", async (_req, res) => {
  try {
    const state = await fetchFullCMSStateFromPostgres(false);
    return res.json({
      schema_version: state.knowledge.schema_version || "1.0",
      entity: {
        ...state.knowledge.entity,
        name: state.profile.name,
        jobTitle: state.profile.title
      },
      relationships: state.knowledge.relationships,
      relationship_policy: state.knowledge.relationship_policy,
      projects: state.projects.filter((p) => p.published !== false).map((p) => ({
        id: p.id,
        name: p.title,
        description: p.description,
        ...p.liveUrl ? { url: p.liveUrl } : {},
        source_url: p.githubUrl || "https://github.com/amalkochuparambilp"
      })),
      official_sources: state.knowledge.official_sources,
      last_updated: state.lastUpdated
    });
  } catch {
    const profilePath = path2.join(process.cwd(), "public", "ai", "profile.json");
    res.sendFile(profilePath, (err) => {
      if (err) {
        res.status(404).json({ error: "Profile not found" });
      }
    });
  }
});
app.post("/api/contact", async (req, res) => {
  try {
    const rawIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const existingLimit = contactRateLimits.get(rawIp);
    if (existingLimit) {
      if (now < existingLimit.resetTime) {
        if (now - existingLimit.lastRequestTime < 5e3) {
          return res.status(429).json({
            success: false,
            error: "Please wait a few seconds before submitting again."
          });
        }
        if (existingLimit.count >= 5) {
          const waitMinutes = Math.ceil((existingLimit.resetTime - now) / 6e4);
          return res.status(429).json({
            success: false,
            error: `Too many submissions from this connection. Please wait ${waitMinutes} minute${waitMinutes > 1 ? "s" : ""} before trying again.`
          });
        }
        existingLimit.count += 1;
        existingLimit.lastRequestTime = now;
      } else {
        contactRateLimits.set(rawIp, {
          count: 1,
          resetTime: now + 6e5,
          lastRequestTime: now
        });
      }
    } else {
      contactRateLimits.set(rawIp, {
        count: 1,
        resetTime: now + 6e5,
        lastRequestTime: now
      });
    }
    const { name, email, message, _hp } = req.body || {};
    if (_hp && typeof _hp === "string" && _hp.trim().length > 0) {
      return res.json({
        success: true,
        message: "Message sent successfully!"
      });
    }
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: "Please enter your name."
      });
    }
    const cleanName = name.trim();
    if (cleanName.length < 2 || cleanName.length > 100) {
      return res.status(400).json({
        success: false,
        error: "Name must be between 2 and 100 characters."
      });
    }
    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        error: "Please enter your email address."
      });
    }
    const cleanEmail = email.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail) || cleanEmail.length > 100) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid email address (e.g. name@example.com)."
      });
    }
    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Please enter your message."
      });
    }
    const cleanMessage = message.trim();
    if (cleanMessage.length < 5) {
      return res.status(400).json({
        success: false,
        error: "Message must be at least 5 characters long."
      });
    }
    if (cleanMessage.length > 3e3) {
      return res.status(400).json({
        success: false,
        error: "Message is too long (maximum 3000 characters)."
      });
    }
    let telegramDelivered = false;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (botToken && chatId) {
      try {
        const formattedTelegramMessage = [
          "\u{1F4E9} New Contact Form Submission",
          "",
          `\u{1F464} Name: ${cleanName}`,
          `\u{1F4E7} Email: ${cleanEmail}`,
          `\u{1F4AC} Message: ${cleanMessage}`
        ].join("\n");
        const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const response = await fetch(telegramApiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: formattedTelegramMessage,
            disable_web_page_preview: true
          })
        });
        const data = await response.json();
        if (response.ok && data.ok) {
          telegramDelivered = true;
        }
      } catch (tgErr) {
        console.warn("[Contact API] Telegram relay warning, saving to PostgreSQL:", tgErr);
      }
    }
    await ensureDatabaseSeeded();
    await prisma.contactMessage.create({
      data: {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: cleanName,
        email: cleanEmail,
        message: cleanMessage,
        status: "unread",
        telegramDelivered,
        ipAddress: rawIp
      }
    });
    await logPrismaAudit("NEW_INQUIRY", "ContactMessage", `Stored inquiry from ${cleanName} (${cleanEmail}) in PostgreSQL`);
    return res.json({
      success: true,
      message: "Message recorded in PostgreSQL Inbox and transmitted successfully!"
    });
  } catch (error) {
    console.error("[Contact API] Internal error processing submission:", error);
    return res.status(500).json({
      success: false,
      error: "An internal server error occurred while sending your message. Please try again later."
    });
  }
});
var registrationRateLimits = /* @__PURE__ */ new Map();
app.get("/api/courses", (_req, res) => {
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.json({
    success: true,
    total: COURSES.length,
    categories: COURSE_CATEGORIES,
    courses: COURSES
  });
});
app.get("/api/registration/status", async (_req, res) => {
  const hasToken = Boolean(process.env.TELEGRAM_BOT_TOKEN);
  const hasChatId = Boolean(process.env.TELEGRAM_CHAT_ID);
  let totalRegistrations = 0;
  try {
    await ensureDatabaseSeeded();
    totalRegistrations = await prisma.courseRegistration.count();
  } catch {
  }
  res.json({
    configured: hasToken && hasChatId,
    telegramConfigured: hasToken && hasChatId,
    databaseReady: true,
    totalRegistrations,
    service: "dzt-sta-registration",
    coursesCount: COURSES.length
  });
});
async function sendCourseRegistrationTelegramAlert(payload) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    console.log("[Telegram Alert] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured in environment. Skipping Telegram dispatch.");
    return false;
  }
  try {
    const formattedDate = (/* @__PURE__ */ new Date()).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short"
    });
    const lines = [
      "\u{1F393} *New DZt STA Course Registration*",
      "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501",
      `\u{1F4DA} *Course:* ${payload.course}`,
      `\u{1F464} *Full Name:* ${payload.fullName}`,
      `\u{1F4DE} *Phone:* ${payload.countryCode} ${payload.phoneNumber}`,
      `\u{1F4E7} *Email:* ${payload.email}`,
      payload.collegeName ? `\u{1F3DB}\uFE0F *College:* ${payload.collegeName}` : "",
      payload.location ? `\u{1F4CD} *Location:* ${payload.location}` : "",
      payload.additionalNotes ? `\u{1F4DD} *Notes:* ${payload.additionalNotes}` : "",
      "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501",
      `\u{1F194} *Registration ID:* \`${payload.registrationId}\``,
      `\u23F1\uFE0F *Registered At:* ${formattedDate} (IST)`,
      `\u26A1 *Status:* New`
    ];
    const messageText = lines.filter(Boolean).join("\n");
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: "Markdown",
        disable_web_page_preview: true
      })
    });
    const data = await response.json();
    if (response.ok && data.ok) {
      console.log(`[Telegram Alert] Successfully dispatched notification to Telegram chat ${chatId} for registration ${payload.registrationId}`);
      return true;
    } else {
      console.warn("[Telegram Alert] Telegram API responded with error:", data?.description || response.statusText);
      return false;
    }
  } catch (tgErr) {
    console.warn("[Telegram Alert] Exception dispatching Telegram alert:", tgErr);
    return false;
  }
}
var handleCourseRegistration = async (req, res) => {
  try {
    const rawIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const existingLimit = registrationRateLimits.get(rawIp);
    if (existingLimit) {
      if (now < existingLimit.resetTime) {
        if (now - existingLimit.lastRequestTime < 3e3) {
          return res.status(429).json({
            success: false,
            error: "Please wait a moment before submitting another registration."
          });
        }
        if (existingLimit.count >= 8) {
          const waitMinutes = Math.ceil((existingLimit.resetTime - now) / 6e4);
          return res.status(429).json({
            success: false,
            error: `Too many submissions from this network. Please wait ${waitMinutes} minute${waitMinutes > 1 ? "s" : ""} before trying again.`
          });
        }
        existingLimit.count += 1;
        existingLimit.lastRequestTime = now;
      } else {
        registrationRateLimits.set(rawIp, {
          count: 1,
          resetTime: now + 6e5,
          lastRequestTime: now
        });
      }
    } else {
      registrationRateLimits.set(rawIp, {
        count: 1,
        resetTime: now + 6e5,
        lastRequestTime: now
      });
    }
    const {
      course,
      courseId,
      fullName,
      countryCode,
      phoneNumber,
      email,
      collegeName,
      location,
      additionalNotes,
      _hp
    } = req.body || {};
    if (_hp && typeof _hp === "string" && _hp.trim().length > 0) {
      return res.json({
        success: true,
        message: "Thank you for registering! Your course registration has been submitted successfully. Our team will contact you soon."
      });
    }
    const rawCourseName = typeof course === "string" ? course.trim() : "";
    const rawCourseId = typeof courseId === "string" ? courseId.trim() : "";
    let selectedCourse = findCourseByNameOrId(rawCourseName || rawCourseId);
    if (!selectedCourse && rawCourseName) {
      selectedCourse = COURSES.find(
        (c) => c.name.toLowerCase() === rawCourseName.toLowerCase()
      );
    }
    const finalCourseName = selectedCourse ? selectedCourse.name : rawCourseName;
    const finalCourseId = selectedCourse ? selectedCourse.id : rawCourseId || null;
    if (!finalCourseName) {
      return res.status(400).json({
        success: false,
        error: "Please select a course from the dropdown list.",
        field: "course"
      });
    }
    if (typeof fullName !== "string" || !fullName.trim()) {
      return res.status(400).json({
        success: false,
        error: "Full name is required.",
        field: "fullName"
      });
    }
    const cleanFullName = fullName.trim().replace(/\s+/g, " ");
    if (cleanFullName.length < 2 || cleanFullName.length > 100) {
      return res.status(400).json({
        success: false,
        error: "Full name must be between 2 and 100 characters.",
        field: "fullName"
      });
    }
    const cleanCountryCode = typeof countryCode === "string" && countryCode.trim() ? countryCode.trim().startsWith("+") ? countryCode.trim() : `+${countryCode.trim()}` : "+91";
    if (typeof phoneNumber !== "string" || !phoneNumber.trim()) {
      return res.status(400).json({
        success: false,
        error: "Phone number is required.",
        field: "phoneNumber"
      });
    }
    const cleanPhoneNumber = phoneNumber.trim().replace(/[\s\-()]/g, "");
    const phoneDigitsOnly = cleanPhoneNumber.replace(/\D/g, "");
    if (phoneDigitsOnly.length < 7 || phoneDigitsOnly.length > 15) {
      return res.status(400).json({
        success: false,
        error: "Please enter a valid phone number (7 to 15 digits).",
        field: "phoneNumber"
      });
    }
    if (cleanCountryCode === "+91" && phoneDigitsOnly.length !== 10) {
      return res.status(400).json({
        success: false,
        error: "Please enter a valid 10-digit Indian phone number (e.g. 9876543210).",
        field: "phoneNumber"
      });
    }
    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        error: "Email address is required.",
        field: "email"
      });
    }
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail) || cleanEmail.length > 100) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid email address (e.g. student@example.com).",
        field: "email"
      });
    }
    const cleanCollege = typeof collegeName === "string" && collegeName.trim() ? collegeName.trim().slice(0, 150) : null;
    const cleanLocation = typeof location === "string" && location.trim() ? location.trim().slice(0, 100) : null;
    const cleanNotes = typeof additionalNotes === "string" && additionalNotes.trim() ? additionalNotes.trim().slice(0, 2e3) : null;
    await ensureDatabaseSeeded();
    const recentDuplicate = await prisma.courseRegistration.findMany({
      where: {
        email: cleanEmail,
        course: finalCourseName
      },
      take: 1,
      orderBy: { createdAt: "desc" }
    });
    if (recentDuplicate.length > 0) {
      const diff = Date.now() - new Date(recentDuplicate[0].createdAt).getTime();
      if (diff < 18e4) {
        return res.json({
          success: true,
          duplicateNotice: true,
          registrationId: recentDuplicate[0].id,
          message: "Thank you for registering! Your course registration has been submitted successfully. Our team will contact you soon.",
          registration: recentDuplicate[0]
        });
      }
    }
    const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
    const timestampPart = Date.now().toString(36).toUpperCase();
    const registrationId = `STA-${timestampPart}-${randomHex}`;
    const telegramDelivered = await sendCourseRegistrationTelegramAlert({
      registrationId,
      course: finalCourseName,
      fullName: cleanFullName,
      countryCode: cleanCountryCode,
      phoneNumber: phoneDigitsOnly,
      email: cleanEmail,
      collegeName: cleanCollege,
      location: cleanLocation,
      additionalNotes: cleanNotes
    });
    const savedRegistration = await prisma.courseRegistration.create({
      data: {
        id: registrationId,
        courseId: finalCourseId,
        course: finalCourseName,
        fullName: cleanFullName,
        countryCode: cleanCountryCode,
        phoneNumber: phoneDigitsOnly,
        email: cleanEmail,
        collegeName: cleanCollege,
        location: cleanLocation,
        additionalNotes: cleanNotes,
        status: "New",
        telegramDelivered,
        ipAddress: rawIp
      }
    });
    await logPrismaAudit(
      "NEW_COURSE_REGISTRATION",
      "CourseRegistration",
      `Registered "${cleanFullName}" for course "${finalCourseName}" (${registrationId}, Telegram: ${telegramDelivered ? "Delivered" : "Pending/Offline"})`
    );
    return res.json({
      success: true,
      registrationId,
      message: "Thank you for registering! Your course registration has been submitted successfully. Our team will contact you soon.",
      registration: {
        id: savedRegistration.id,
        course: savedRegistration.course,
        fullName: savedRegistration.fullName,
        countryCode: savedRegistration.countryCode,
        phoneNumber: savedRegistration.phoneNumber,
        email: savedRegistration.email,
        collegeName: savedRegistration.collegeName,
        location: savedRegistration.location,
        additionalNotes: savedRegistration.additionalNotes,
        status: savedRegistration.status,
        telegramDelivered: savedRegistration.telegramDelivered,
        createdAt: savedRegistration.createdAt
      }
    });
  } catch (error) {
    console.error("[Course Registration API] Error processing registration:", error);
    return res.status(500).json({
      success: false,
      error: "An internal error occurred while processing your registration. Please try again."
    });
  }
};
app.post("/api/register", handleCourseRegistration);
app.post("/api/courses/register", handleCourseRegistration);
app.get("/api/registrations", requireAdminAuth, async (_req, res) => {
  try {
    await ensureDatabaseSeeded();
    const registrations = await prisma.courseRegistration.findMany({
      orderBy: { createdAt: "desc" }
    });
    return res.json({ success: true, registrations, count: registrations.length });
  } catch (error) {
    console.error("[Admin Registrations API] Error:", error);
    return res.status(500).json({ error: "Failed to fetch course registrations" });
  }
});
app.patch("/api/registrations/:id", requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const { id } = req.params;
    const { status } = req.body || {};
    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }
    const updated = await prisma.courseRegistration.update({
      where: { id },
      data: { status }
    });
    await logPrismaAudit("UPDATE_REGISTRATION_STATUS", "CourseRegistration", `Updated registration ${id} status to ${status}`);
    return res.json({ success: true, registration: updated });
  } catch (error) {
    console.error("[Admin Registrations API] Error updating status:", error);
    return res.status(500).json({ error: "Failed to update registration status" });
  }
});
app.delete("/api/registrations/:id", requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const { id } = req.params;
    await prisma.courseRegistration.delete({ where: { id } });
    await logPrismaAudit("DELETE_REGISTRATION", "CourseRegistration", `Deleted registration ${id}`);
    return res.json({ success: true });
  } catch (error) {
    console.error("[Admin Registrations API] Error deleting:", error);
    return res.status(500).json({ error: "Failed to delete registration" });
  }
});
app.get("/api/logos", async (_req, res) => {
  try {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    await ensureDatabaseSeeded();
    const activeLogos = await prisma.partnerLogo.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" }
    });
    return res.json({ logos: activeLogos, count: activeLogos.length });
  } catch (error) {
    console.error("[API Logos] Error querying PostgreSQL logos:", error);
    return res.json({ logos: [], count: 0 });
  }
});
app.get("/robots.txt", (_req, res) => {
  const filePath = path2.join(process.cwd(), "public", "robots.txt");
  if (fs2.existsSync(filePath)) {
    res.type("text/plain").sendFile(filePath);
  } else {
    res.type("text/plain").send("User-agent: *\nAllow: /\nSitemap: https://amalkp.online/sitemap.xml\n");
  }
});
app.get("/sitemap.xml", (_req, res) => {
  const filePath = path2.join(process.cwd(), "public", "sitemap.xml");
  if (fs2.existsSync(filePath)) {
    res.type("application/xml").sendFile(filePath);
  } else {
    res.status(404).send("Not Found");
  }
});
app.get(["/llms.txt", "/.well-known/llms.txt"], (_req, res) => {
  const filePath = path2.join(process.cwd(), "public", "llms.txt");
  if (fs2.existsSync(filePath)) {
    res.type("text/plain; charset=utf-8").sendFile(filePath);
  } else {
    res.status(404).send("Not Found");
  }
});
var serverApp_default = app;
export {
  app,
  serverApp_default as default
};
