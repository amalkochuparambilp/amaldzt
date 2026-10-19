import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { AMAL_INFO, PROJECTS } from './data';

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
// PUBLIC API ENDPOINTS
// ============================================================================

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'dzt-portfolio-server', time: new Date().toISOString() });
});

app.get('/api/contact/status', (_req, res) => {
  const hasToken = Boolean(process.env.TELEGRAM_BOT_TOKEN);
  const hasChatId = Boolean(process.env.TELEGRAM_CHAT_ID);
  res.json({
    configured: hasToken && hasChatId,
    service: 'telegram-gateway'
  });
});

app.get('/api/knowledge/profile', (_req, res) => {
  try {
    const profilePath = path.join(process.cwd(), 'public', 'ai', 'profile.json');
    if (fs.existsSync(profilePath)) {
      return res.sendFile(profilePath);
    }
  } catch {
    // fallback
  }

  res.json({
    schema_version: '1.0',
    entity: {
      '@type': 'Person',
      name: AMAL_INFO.name,
      jobTitle: AMAL_INFO.title,
      url: 'https://amalkp.online/'
    },
    projects: PROJECTS.map((p) => ({
      id: p.id,
      name: p.title,
      description: p.description,
      ...(p.liveUrl ? { url: p.liveUrl } : {}),
      source_url: p.githubUrl || 'https://github.com/amalkochuparambilp'
    })),
    last_updated: new Date().toISOString()
  });
});

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message, _hp } = req.body || {};
    if (_hp) {
      return res.json({ success: true });
    }

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'Name, email, and message are required.' });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (botToken && chatId) {
      const text = `📬 New Portfolio Message\n\nName: ${name}\nEmail: ${email}\nMessage:\n${message}`;
      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text })
      }).catch(() => {});
    }

    return res.json({ success: true, message: 'Message transmitted successfully.' });
  } catch (error: any) {
    console.error('Contact error:', error);
    return res.status(500).json({ success: false, error: 'Failed to transmit message.' });
  }
});

export { app };
export default app;
