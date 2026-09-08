// Universal Vercel Serverless Function for /api/diya
import { GoogleGenAI } from '@google/genai';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default async function handler(req: any, res?: any) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
  };

  const isWebRequest = req instanceof Request || (!res && typeof (req as any)?.headers?.get === 'function');

  if ((req.method || (req as Request).method) === 'OPTIONS') {
    if (isWebRequest) return new Response(null, { status: 204, headers: corsHeaders });
    return res.status(204).end();
  }

  const method = req.method || (req as Request).method;
  const urlStr = isWebRequest ? (req as Request).url : req.url || '';
  const isStatusReq = method === 'GET' || urlStr.includes('/status');

  // 1. Status Request
  if (isStatusReq) {
    let botUsername: string | undefined;
    if (BOT_TOKEN) {
      try {
        const resp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
        if (resp.ok) {
          const data = (await resp.json()) as any;
          if (data.ok && data.result) {
            botUsername = data.result.username;
          }
        }
      } catch (err) {
        console.warn('[Diya Vercel API] Failed getMe:', err);
      }
    }

    const payload = {
      online: true,
      telegramConfigured: Boolean(BOT_TOKEN && CHAT_ID),
      botUsername,
      geminiConfigured: Boolean(GEMINI_API_KEY)
    };

    if (isWebRequest) {
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    return res.status(200).json(payload);
  }

  // 2. Chat / Telegram Dispatch
  let body: any = {};
  if (isWebRequest) {
    try {
      body = await (req as Request).json();
    } catch {
      body = {};
    }
  } else {
    body = req.body || {};
  }

  const { message, visitorInfo, forwardToTelegram } = body;
  if (!message || typeof message !== 'string') {
    const errPayload = { success: false, error: 'Message content is required.' };
    if (isWebRequest) {
      return new Response(JSON.stringify(errPayload), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    return res.status(400).json(errPayload);
  }

  let telegramSent = false;
  if ((forwardToTelegram || message.toLowerCase().includes('telegram')) && BOT_TOKEN && CHAT_ID) {
    try {
      const name = visitorInfo?.name || 'Anonymous Visitor';
      const contact = visitorInfo?.contact || 'Not provided';
      const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

      const text = [
        '✨ <b>Diya AI Chatbot • New Message</b> ✨',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        `👤 <b>Visitor:</b> ${escapeHtml(name)}`,
        `📫 <b>Contact:</b> ${escapeHtml(contact)}`,
        `🕒 <b>Time:</b> ${escapeHtml(time)} IST`,
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '💬 <b>Message Content:</b>',
        escapeHtml(message.trim()),
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '⚡ <i>Sent live from Diya Chatbot on amalkp.online</i>'
      ].join('\n');

      const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      });
      const tgData = (await tgRes.json()) as any;
      if (tgRes.ok && tgData.ok) {
        telegramSent = true;
      }
    } catch (e) {
      console.error('[Diya Vercel API] Telegram forward error:', e);
    }
  }

  // Answer using Gemini or fallback
  let reply = '';
  if (GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const resp = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: message }] }],
        config: {
          systemInstruction: 'You are Diya, the friendly AI assistant and digital companion for Amal K P (BCA candidate, founder of DZt in Balagram, Idukki, Kerala) on his website amalkp.online. You are connected directly to Amal\'s Telegram Bot. Answer questions about Amal\'s projects (LibCode, Bank Exam Portal, Hrdiya, DZt Drop, DZt Meet), skills, and education helpfully and warmly.'
        }
      });
      reply = resp.text || '';
    } catch (e) {
      reply = `I'm Diya, Amal's AI assistant connected directly to his Telegram bot. Amal is a full-stack developer and founder of DZt, skilled in React, Python, Django, PHP, and TypeScript. Let me know if you'd like me to send a message to his Telegram!`;
    }
  } else {
    reply = `I'm Diya, Amal's AI assistant connected directly to his Telegram bot. Amal is a full-stack developer and founder of DZt, skilled in React, Python, Django, PHP, and TypeScript. Let me know if you'd like me to send a message to his Telegram!`;
  }

  if (telegramSent) {
    reply += `\n\n*(✓ Forwarded directly to Amal's Telegram bot!)*`;
  }

  const successPayload = {
    success: true,
    reply,
    telegramSent,
    telegramConfigured: Boolean(BOT_TOKEN && CHAT_ID)
  };

  if (isWebRequest) {
    return new Response(JSON.stringify(successPayload), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  return res.status(200).json(successPayload);
}
