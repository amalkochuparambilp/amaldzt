// src/serverApp.ts
import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

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
  heroHeadingLine1: "Crafting digital",
  heroHeadingItalic: "ecosystems",
  heroHeadingLine2: "with precision & purpose.",
  heroBio: "Founder & Lead of DZt. A full-stack developer and BCA candidate passionate about building high-performance web systems, intuitive interfaces, and scalable digital platforms.",
  availabilityText: "AVAILABLE FOR COLLABORATIONS",
  availabilityActive: true,
  campusBadge: "JNIAS BALAGRAM (BCA 2026)",
  founderBadge: "Founder / Lead @ DZt",
  resumeSummary: "Recent BCA graduate seeking entry-level opportunity to apply foundational skills and grow professionally. Passionate developer specializing in high-performance user interfaces, Python/Django health analytics platforms, and co-operative bank portal solutions.",
  aboutBioParagraph1: "I am a passionate software developer and Founder/Lead at DZt, currently pursuing my Bachelor of Computer Application (BCA) degree at Jawaharlal Nehru Institute of Arts and Science (JNIAS) in Balagram, Idukki.",
  aboutBioParagraph2: "My technical expertise bridges full-stack application development, database design, and creative media. I specialize in building robust web applications with React, TypeScript, Python, Django, PHP, and MySQL. From engineering specialized college management software to crafting AI-assisted health diagnostic platforms, my goal is to deliver clean, scalable, and high-impact digital solutions.",
  ecosystemNode: "BALAGRAM_NODE",
  buildVersion: "STABLE_BUILD_v2.0",
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
var PARTNER_LOGOS = [
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
];
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

// src/serverApp.ts
dotenv.config();
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
  res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get("/api/contact/status", (_req, res) => {
  const hasToken = Boolean(process.env.TELEGRAM_BOT_TOKEN);
  const hasChatId = Boolean(process.env.TELEGRAM_CHAT_ID);
  res.json({
    configured: hasToken && hasChatId,
    service: "telegram-direct"
  });
});
app.get("/api/logos", (_req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  const activeLogos = PARTNER_LOGOS.filter((l) => l.active !== false);
  return res.json({ logos: activeLogos, count: activeLogos.length });
});
app.get("/api/knowledge/profile", (_req, res) => {
  const profilePath = path.join(process.cwd(), "public", "ai", "profile.json");
  if (fs.existsSync(profilePath)) {
    return res.sendFile(profilePath);
  }
  return res.json({
    schema_version: "1.0",
    entity: {
      id: "https://amalkp.online/#amal-k-p",
      "@type": "Person",
      name: AMAL_INFO.name,
      jobTitle: AMAL_INFO.title,
      description: AMAL_INFO.summary,
      url: "https://amalkp.online/"
    },
    projects: PROJECTS.map((p) => ({
      id: p.id,
      name: p.title,
      description: p.description,
      url: p.liveUrl,
      source_url: p.githubUrl
    })),
    last_updated: (/* @__PURE__ */ new Date()).toISOString()
  });
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
        await fetch(telegramApiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: formattedTelegramMessage,
            disable_web_page_preview: true
          })
        });
      } catch (tgErr) {
        console.warn("[Contact API] Telegram transmission warning:", tgErr);
      }
    }
    return res.json({
      success: true,
      message: "Message delivered successfully!"
    });
  } catch (error) {
    console.error("[Contact API] Internal error processing submission:", error);
    return res.status(500).json({
      success: false,
      error: "An internal server error occurred while sending your message. Please try again later."
    });
  }
});
app.get("/api/registration/status", (_req, res) => {
  const hasToken = Boolean(process.env.TELEGRAM_BOT_TOKEN);
  const hasChatId = Boolean(process.env.TELEGRAM_CHAT_ID);
  res.json({
    configured: hasToken && hasChatId,
    telegramConfigured: hasToken && hasChatId
  });
});
app.post("/api/register", async (req, res) => {
  try {
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
        registrationId: "STA-RECEIVED",
        message: "Course registration confirmed successfully."
      });
    }
    if (!course || typeof course !== "string" || !course.trim()) {
      return res.status(400).json({ success: false, field: "course", error: "Please select a course." });
    }
    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
      return res.status(400).json({ success: false, field: "fullName", error: "Full name must be at least 2 characters." });
    }
    if (!phoneNumber || typeof phoneNumber !== "string" || phoneNumber.replace(/\D/g, "").length < 6) {
      return res.status(400).json({ success: false, field: "phoneNumber", error: "Please enter a valid phone number." });
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, field: "email", error: "Please enter a valid email address." });
    }
    const regId = `STA-${Date.now().toString().slice(-6)}-${Math.floor(1e3 + Math.random() * 9e3)}`;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (botToken && chatId) {
      try {
        const msg = [
          "\u{1F393} New Course Registration",
          "",
          `\u{1F194} Reg ID: ${regId}`,
          `\u{1F4DA} Course: ${course}`,
          `\u{1F464} Full Name: ${fullName.trim()}`,
          `\u{1F4DE} Phone: ${countryCode || "+91"} ${phoneNumber.replace(/\D/g, "")}`,
          `\u{1F4E7} Email: ${email.trim()}`,
          collegeName ? `\u{1F3DB} College: ${collegeName.trim()}` : "",
          location ? `\u{1F4CD} Location: ${location.trim()}` : "",
          additionalNotes ? `\u{1F4DD} Notes: ${additionalNotes.trim()}` : ""
        ].filter(Boolean).join("\n");
        const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        await fetch(telegramApiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: msg,
            disable_web_page_preview: true
          })
        });
      } catch (tgErr) {
        console.warn("[Registration API] Telegram dispatch warning:", tgErr);
      }
    }
    return res.json({
      success: true,
      registrationId: regId,
      message: "Course registration confirmed successfully."
    });
  } catch (error) {
    console.error("[Registration API] Error processing registration:", error);
    return res.status(500).json({
      success: false,
      error: "An unexpected error occurred while processing your registration. Please try again."
    });
  }
});
app.get("/robots.txt", (_req, res) => {
  const filePath = path.join(process.cwd(), "public", "robots.txt");
  if (fs.existsSync(filePath)) {
    res.type("text/plain").sendFile(filePath);
  } else {
    res.type("text/plain").send("User-agent: *\nAllow: /\nSitemap: https://amalkp.online/sitemap.xml\n");
  }
});
app.get("/sitemap.xml", (_req, res) => {
  const filePath = path.join(process.cwd(), "public", "sitemap.xml");
  if (fs.existsSync(filePath)) {
    res.type("application/xml").sendFile(filePath);
  } else {
    res.status(404).send("Not Found");
  }
});
app.get(["/llms.txt", "/.well-known/llms.txt"], (_req, res) => {
  const filePath = path.join(process.cwd(), "public", "llms.txt");
  if (fs.existsSync(filePath)) {
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
