import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { AMAL_INFO, PARTNER_LOGOS, PROJECTS } from './data';

dotenv.config();

const app = express();

// CORS & Cache-Control Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));

// Normalize Vercel Serverless rewrite paths (/api/index?__path=...)
app.use((req, _res, next) => {
  const rewrittenPath = req.query?.__path;
  if (
    typeof rewrittenPath === 'string' &&
    (req.path === '/api/index' || req.path === '/index' || req.path === '/api/index.js')
  ) {
    const queryCopy: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.query)) {
      if (k !== '__path' && typeof v === 'string') {
        queryCopy[k] = v;
      }
    }
    const qs = new URLSearchParams(queryCopy).toString();
    req.url = `/api/${rewrittenPath.replace(/^\/+/, '')}${qs ? `?${qs}` : ''}`;
  }
  next();
});

// ============================================================================
// PUBLIC SITE & CONTACT API ENDPOINTS
// ============================================================================

interface ContactRateLimit {
  count: number;
  resetTime: number;
  lastRequestTime: number;
}
const contactRateLimits = new Map<string, ContactRateLimit>();

const cleanupInterval = setInterval(() => {
  const now = Date.now();
  contactRateLimits.forEach((record, ip) => {
    if (now > record.resetTime) {
      contactRateLimits.delete(ip);
    }
  });
}, 120000);
cleanupInterval.unref?.();

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/contact/status', (_req, res) => {
  const hasToken = Boolean(process.env.TELEGRAM_BOT_TOKEN);
  const hasChatId = Boolean(process.env.TELEGRAM_CHAT_ID);
  res.json({
    configured: hasToken && hasChatId,
    service: 'telegram-direct'
  });
});

app.get('/api/logos', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  const activeLogos = PARTNER_LOGOS.filter((l) => l.active !== false);
  return res.json({ logos: activeLogos, count: activeLogos.length });
});

app.get('/api/knowledge/profile', (_req, res) => {
  const profilePath = path.join(process.cwd(), 'public', 'ai', 'profile.json');
  if (fs.existsSync(profilePath)) {
    return res.sendFile(profilePath);
  }
  return res.json({
    schema_version: '1.0',
    entity: {
      id: 'https://amalkp.online/#amal-k-p',
      '@type': 'Person',
      name: AMAL_INFO.name,
      jobTitle: AMAL_INFO.title,
      description: AMAL_INFO.summary,
      url: 'https://amalkp.online/'
    },
    projects: PROJECTS.map((p) => ({
      id: p.id,
      name: p.title,
      description: p.description,
      url: p.liveUrl,
      source_url: p.githubUrl
    })),
    last_updated: new Date().toISOString()
  });
});

app.post('/api/contact', async (req, res) => {
  try {
    const rawIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';
    const now = Date.now();

    const existingLimit = contactRateLimits.get(rawIp);
    if (existingLimit) {
      if (now < existingLimit.resetTime) {
        if (now - existingLimit.lastRequestTime < 5000) {
          return res.status(429).json({
            success: false,
            error: 'Please wait a few seconds before submitting again.'
          });
        }
        if (existingLimit.count >= 5) {
          const waitMinutes = Math.ceil((existingLimit.resetTime - now) / 60000);
          return res.status(429).json({
            success: false,
            error: `Too many submissions from this connection. Please wait ${waitMinutes} minute${waitMinutes > 1 ? 's' : ''} before trying again.`
          });
        }
        existingLimit.count += 1;
        existingLimit.lastRequestTime = now;
      } else {
        contactRateLimits.set(rawIp, {
          count: 1,
          resetTime: now + 600000,
          lastRequestTime: now
        });
      }
    } else {
      contactRateLimits.set(rawIp, {
        count: 1,
        resetTime: now + 600000,
        lastRequestTime: now
      });
    }

    const { name, email, message, _hp } = req.body || {};

    if (_hp && typeof _hp === 'string' && _hp.trim().length > 0) {
      return res.json({
        success: true,
        message: 'Message sent successfully!'
      });
    }

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please enter your name.'
      });
    }
    const cleanName = name.trim();
    if (cleanName.length < 2 || cleanName.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Name must be between 2 and 100 characters.'
      });
    }

    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please enter your email address.'
      });
    }
    const cleanEmail = email.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail) || cleanEmail.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address (e.g. name@example.com).'
      });
    }

    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please enter your message.'
      });
    }
    const cleanMessage = message.trim();
    if (cleanMessage.length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Message must be at least 5 characters long.'
      });
    }
    if (cleanMessage.length > 3000) {
      return res.status(400).json({
        success: false,
        error: 'Message is too long (maximum 3000 characters).'
      });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (botToken && chatId) {
      try {
        const formattedTelegramMessage = [
          '📩 New Contact Form Submission',
          '',
          `👤 Name: ${cleanName}`,
          `📧 Email: ${cleanEmail}`,
          `💬 Message: ${cleanMessage}`
        ].join('\n');

        const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        await fetch(telegramApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: formattedTelegramMessage,
            disable_web_page_preview: true
          })
        });
      } catch (tgErr) {
        console.warn('[Contact API] Telegram transmission warning:', tgErr);
      }
    }

    return res.json({
      success: true,
      message: 'Message delivered successfully!'
    });
  } catch (error: any) {
    console.error('[Contact API] Internal error processing submission:', error);
    return res.status(500).json({
      success: false,
      error: 'An internal server error occurred while sending your message. Please try again later.'
    });
  }
});

// ============================================================================
// COURSE REGISTRATION ENDPOINTS (/api/register, /api/registration/status)
// ============================================================================

app.get('/api/registration/status', (_req, res) => {
  const hasToken = Boolean(process.env.TELEGRAM_BOT_TOKEN);
  const hasChatId = Boolean(process.env.TELEGRAM_CHAT_ID);
  res.json({
    configured: hasToken && hasChatId,
    telegramConfigured: hasToken && hasChatId
  });
});

app.post('/api/register', async (req, res) => {
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

    if (_hp && typeof _hp === 'string' && _hp.trim().length > 0) {
      return res.json({
        success: true,
        registrationId: 'STA-RECEIVED',
        message: 'Course registration confirmed successfully.'
      });
    }

    if (!course || typeof course !== 'string' || !course.trim()) {
      return res.status(400).json({ success: false, field: 'course', error: 'Please select a course.' });
    }
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return res.status(400).json({ success: false, field: 'fullName', error: 'Full name must be at least 2 characters.' });
    }
    if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.replace(/\D/g, '').length < 6) {
      return res.status(400).json({ success: false, field: 'phoneNumber', error: 'Please enter a valid phone number.' });
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, field: 'email', error: 'Please enter a valid email address.' });
    }

    const regId = `STA-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (botToken && chatId) {
      try {
        const msg = [
          '🎓 New Course Registration',
          '',
          `🆔 Reg ID: ${regId}`,
          `📚 Course: ${course}`,
          `👤 Full Name: ${fullName.trim()}`,
          `📞 Phone: ${countryCode || '+91'} ${phoneNumber.replace(/\D/g, '')}`,
          `📧 Email: ${email.trim()}`,
          collegeName ? `🏛 College: ${collegeName.trim()}` : '',
          location ? `📍 Location: ${location.trim()}` : '',
          additionalNotes ? `📝 Notes: ${additionalNotes.trim()}` : ''
        ].filter(Boolean).join('\n');

        const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        await fetch(telegramApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: msg,
            disable_web_page_preview: true
          })
        });
      } catch (tgErr) {
        console.warn('[Registration API] Telegram dispatch warning:', tgErr);
      }
    }

    return res.json({
      success: true,
      registrationId: regId,
      message: 'Course registration confirmed successfully.'
    });
  } catch (error: any) {
    console.error('[Registration API] Error processing registration:', error);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while processing your registration. Please try again.'
    });
  }
});

// SEO, AEO & AI Discovery Endpoints
app.get('/robots.txt', (_req, res) => {
  const filePath = path.join(process.cwd(), 'public', 'robots.txt');
  if (fs.existsSync(filePath)) {
    res.type('text/plain').sendFile(filePath);
  } else {
    res.type('text/plain').send('User-agent: *\nAllow: /\nSitemap: https://amalkp.online/sitemap.xml\n');
  }
});

app.get('/sitemap.xml', (_req, res) => {
  const filePath = path.join(process.cwd(), 'public', 'sitemap.xml');
  if (fs.existsSync(filePath)) {
    res.type('application/xml').sendFile(filePath);
  } else {
    res.status(404).send('Not Found');
  }
});

app.get(['/llms.txt', '/.well-known/llms.txt'], (_req, res) => {
  const filePath = path.join(process.cwd(), 'public', 'llms.txt');
  if (fs.existsSync(filePath)) {
    res.type('text/plain; charset=utf-8').sendFile(filePath);
  } else {
    res.status(404).send('Not Found');
  }
});

export { app };
export default app;
