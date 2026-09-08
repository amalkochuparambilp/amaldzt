import { GoogleGenAI } from '@google/genai';

interface VisitorInfo {
  name?: string;
  contact?: string;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface CachedBotInfo {
  username?: string;
  firstName?: string;
  fetchedAt: number;
}

let cachedBotInfo: CachedBotInfo | null = null;
let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

/**
 * Check and retrieve Telegram Bot status and cached info
 */
export async function getDiyaStatus(): Promise<{
  online: boolean;
  telegramConfigured: boolean;
  botUsername?: string;
  botName?: string;
  geminiConfigured: boolean;
}> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const telegramConfigured = Boolean(botToken && chatId);
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);

  let botUsername: string | undefined;
  let botName: string | undefined;

  if (botToken) {
    const now = Date.now();
    if (cachedBotInfo && now - cachedBotInfo.fetchedAt < 300000) {
      botUsername = cachedBotInfo.username;
      botName = cachedBotInfo.firstName;
    } else {
      try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
        if (res.ok) {
          const data = (await res.json()) as any;
          if (data.ok && data.result) {
            botUsername = data.result.username;
            botName = data.result.first_name;
            cachedBotInfo = {
              username: botUsername,
              firstName: botName,
              fetchedAt: now
            };
          }
        }
      } catch (err) {
        console.warn('[Diya] Failed to query Telegram getMe:', err);
      }
    }
  }

  return {
    online: true,
    telegramConfigured,
    botUsername,
    botName,
    geminiConfigured
  };
}

/**
 * Sends a message directly to Amal's Telegram Bot
 */
export async function sendTelegramNotification(params: {
  visitorName?: string;
  contact?: string;
  message: string;
  context?: string;
  isDirectNote?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return {
      success: false,
      error: 'Telegram Bot credentials (TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID) are not configured on the server.'
    };
  }

  const name = params.visitorName?.trim() || 'Anonymous Web Visitor';
  const contact = params.contact?.trim() || 'Not provided';
  const text = params.message.trim();
  const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const formattedLines = [
    '✨ <b>Diya AI Chatbot • New Message</b> ✨',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    `👤 <b>Visitor:</b> ${escapeHtml(name)}`,
    `📫 <b>Contact:</b> ${escapeHtml(contact)}`,
    `🕒 <b>Time:</b> ${escapeHtml(time)} IST`,
    params.context ? `🌐 <b>Page/App:</b> ${escapeHtml(params.context)}` : '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '💬 <b>Message Content:</b>',
    escapeHtml(text),
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '⚡ <i>Sent live from Diya Chatbot on amalkp.online</i>'
  ].filter(Boolean).join('\n');

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: formattedLines,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    const data = (await response.json()) as { ok: boolean; description?: string };
    if (!response.ok || !data.ok) {
      console.error('[Diya Telegram] API delivery error:', data);
      return {
        success: false,
        error: data.description || 'Failed to dispatch message to Telegram Bot.'
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Diya Telegram] Fetch error:', err);
    return {
      success: false,
      error: err?.message || 'Network error delivering to Telegram.'
    };
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Intelligent knowledge base for Diya when Gemini API key is unconfigured or offline.
 */
function getFallbackKnowledgeResponse(query: string, visitorInfo?: VisitorInfo): string {
  const q = query.toLowerCase();

  // Contact / Message Amal intent
  if (
    q.includes('telegram') ||
    q.includes('message amal') ||
    q.includes('contact amal') ||
    q.includes('reach amal') ||
    q.includes('send message') ||
    q.includes('tell amal')
  ) {
    return `I am directly connected to Amal's Telegram Bot! Any message you type with the **Forward to Telegram** toggle will ping Amal's personal device instantly.

You can also reach Amal directly through:
• **Email:** amalkochuparambilp@gmail.com
• **Phone / WhatsApp:** +91 7510211318
• **LinkedIn:** linkedin.com/in/amalkochuparambilp
• **GitHub:** github.com/amalkochuparambilp`;
  }

  // Who is Diya / Persona query
  if (q.includes('who are you') || q.includes('what are you') || q.includes('diya') || q.includes('what is your name')) {
    return `Hi! I'm **Diya**, Amal's digital companion and personal AI concierge on the **DZt Platform**!

I am linked directly to Amal's **Telegram Bot**, meaning I can answer any questions you have about Amal's engineering work, resume, and projects—or transmit your inquiries straight to his phone via Telegram in real time.`;
  }

  // Projects query
  if (q.includes('project') || q.includes('work') || q.includes('portfolio') || q.includes('built') || q.includes('apps')) {
    return `Amal has developed several impactful projects:

1. **LibCode JNIAS**: Full-featured digital library automation software for JNIAS College with barcode scanning, automated ISBN lookups, and circulation records (PHP, MySQL, JavaScript).
2. **Co-operative Bank Exam Portal**: High-security online examination platform with randomized question generation, timers, and real-time automated scoring (PHP, MySQL).
3. **Hrdiya Cardiac Risk Analysis**: Diagnostic healthcare system analyzing heart disease metrics and connecting users to cardiologists (Python, Django, SQLite, React).
4. **DZt Platform & MiniApps**:
   • **DZt Drop**: P2P browser-to-browser encrypted file sharing via WebRTC DataChannels.
   • **DZt Meet / VC**: Low-latency video conferencing platform with screen sharing.
   • **DZt Meta Ray-Ban**: Smart photo converter with 3024×4032 scaling and Meta AI EXIF injection.

Would you like more details on any specific project, or should I forward a message to Amal's Telegram for you?`;
  }

  // Specific project: LibCode
  if (q.includes('libcode') || q.includes('library')) {
    return `**LibCode JNIAS** is a comprehensive college library automation system designed and deployed by Amal for the Jawaharlal Nehru Institute of Arts and Science. It features barcode scanner integration, rapid ISBN book cataloging, student issue/return ledgers, and overdue fine management.`;
  }

  // Specific project: Bank Exam Portal
  if (q.includes('bank') || q.includes('exam')) {
    return `The **Co-operative Bank Exam Portal** is an online testing system engineered by Amal for recruitment assessments. It features randomized question pools to prevent test leaks, countdown timer engines with automatic submission, and instant automated grading.`;
  }

  // Specific project: Hrdiya
  if (q.includes('hrdiya') || q.includes('heart') || q.includes('cardiac')) {
    return `**Hrdiya** is a cardiac risk analytics platform built with Python & Django. It evaluates key physiological indicators (blood pressure, cholesterol, ECG trends) to generate risk stratification profiles and route consultation inquiries to cardiologists.`;
  }

  // Specific project: DZt Drop or P2P
  if (q.includes('drop') || q.includes('p2p') || q.includes('file')) {
    return `**DZt Drop** is a zero-cloud, peer-to-peer file transfer system built into this website. It establishes direct WebRTC DataChannels between devices with end-to-end encryption, QR code room pairing, and zero file size caps.`;
  }

  // Tech stack & skills query
  if (q.includes('skill') || q.includes('tech') || q.includes('stack') || q.includes('language') || q.includes('python') || q.includes('react')) {
    return `Amal's technical stack spans modern full-stack development and system engineering:

• **Frontend:** React 19, TypeScript, Tailwind CSS, Vite, motion, HTML5/CSS3.
• **Backend:** Python, Django, PHP, Node.js, Express, WebSocket, WebRTC.
• **Databases:** MySQL, SQLite.
• **Tools & Systems:** Git, Linux shell, Barcode & Camera vision APIs, MQTT, P2P networking.

He specializes in building fast, accessible web applications with clean architecture and responsive micro-interactions.`;
  }

  // Education / Bio query
  if (q.includes('education') || q.includes('college') || q.includes('bca') || q.includes('jnias') || q.includes('degree') || q.includes('amal') || q.includes('about')) {
    return `**Amal K P** is a final-year **Bachelor of Computer Application (BCA)** candidate at **Jawaharlal Nehru Institute of Arts and Science (JNIAS)**, Balagram, Idukki, Kerala, India (Graduating Batch 2026).

He is also the Founder & Lead at **DZt**, dedicated to crafting high-performance digital tools and modern software ecosystems.`;
  }

  // Hiring / Collaboration
  if (q.includes('hire') || q.includes('job') || q.includes('collab') || q.includes('opportunity') || q.includes('freelance') || q.includes('intern')) {
    return `Amal is open to full-stack developer roles, engineering internships, and collaborative software projects!

You can share your offer or project idea right here, and I will forward it straight to Amal's Telegram! You can also reach him at:
• **Email:** amalkochuparambilp@gmail.com
• **Phone:** +91 7510211318`;
  }

  // Default helpful response
  return `I'm **Diya**, Amal's digital companion and AI assistant on DZt. I'm connected directly to Amal's **Telegram Bot**!

Here is what I can help you with:
• **Projects:** Ask about LibCode JNIAS, Bank Exam Portal, Hrdiya, or DZt Drop.
• **Tech Stack:** Ask about Amal's experience with React, Python, Django, PHP, or TypeScript.
• **Telegram Message:** Type your note or inquiry and click send—I will relay it straight to Amal's Telegram!
• **Education:** Ask about his BCA studies at JNIAS in Idukki, Kerala.

How can I assist you right now?`;
}

/**
 * Handle incoming Diya chat interaction
 */
export async function processDiyaChat(params: {
  message: string;
  history?: ChatMessage[];
  visitorInfo?: VisitorInfo;
  forwardToTelegram?: boolean;
  context?: string;
}): Promise<{
  reply: string;
  telegramSent: boolean;
  telegramConfigured: boolean;
  botUsername?: string;
  error?: string;
}> {
  const { message, history = [], visitorInfo, forwardToTelegram = false, context } = params;
  const status = await getDiyaStatus();

  let telegramSent = false;
  let telegramError: string | undefined;

  // Auto-detect intent to notify or forward to Telegram
  const lowerMsg = message.toLowerCase();
  const shouldForward =
    forwardToTelegram ||
    lowerMsg.startsWith('/telegram') ||
    lowerMsg.startsWith('send to telegram') ||
    lowerMsg.includes('notify amal') ||
    lowerMsg.includes('forward to telegram') ||
    lowerMsg.includes('reach amal via telegram');

  if (shouldForward && status.telegramConfigured) {
    const tgResult = await sendTelegramNotification({
      visitorName: visitorInfo?.name,
      contact: visitorInfo?.contact,
      message,
      context,
      isDirectNote: true
    });
    telegramSent = tgResult.success;
    if (!tgResult.success) {
      telegramError = tgResult.error;
    }
  }

  // Try Gemini AI response if API key is present
  const ai = getAIClient();
  let reply = '';

  if (ai) {
    try {
      const systemInstruction = `You are Diya, the personal AI assistant, digital companion, and portfolio concierge for Amal K P on his official website (https://amalkp.online) and the DZt Platform.
You are smart, warm, polite, articulate, and technically proficient.
You are directly connected to Amal's Telegram Bot. When visitors ask you to send a message, get in touch, or relay an inquiry, you can transmit it to Amal's personal Telegram device.

Key Facts about Amal K P:
- Identity: Full-stack developer, founder and lead of DZt.
- Location: Balagram, Idukki, Kerala, India.
- Education: Final-year BCA Candidate (graduating batch 2026) at Jawaharlal Nehru Institute of Arts and Science (JNIAS), Balagram, Idukki.
- Official Email: amalkochuparambilp@gmail.com
- Phone / WhatsApp: +91 7510211318
- Profiles: GitHub (https://github.com/amalkochuparambilp), LinkedIn (https://linkedin.com/in/amalkochuparambilp).
- Core Projects:
  1. LibCode JNIAS: College library automation system with barcode scanning, auto ISBN lookup, and circulation ledgers (PHP, MySQL, JavaScript).
  2. Co-operative Bank Exam Portal: Online examination & assessment system with randomized questions, timers, and instant grading (PHP, MySQL).
  3. Hrdiya: Cardiac risk diagnostic platform analyzing physiological health markers (Python, Django, SQLite, React).
  4. DZt Platform & MiniApps:
     • DZt Drop: Zero-cloud encrypted P2P file sharing via WebRTC DataChannels.
     • DZt Meet: Low-latency peer-to-peer video calling room with screen share.
     • DZt Meta Ray-Ban: Image converter & Meta AI EXIF injector for smart glasses.
- Skills: React 19, TypeScript, Python, Django, PHP, MySQL, SQLite, Tailwind CSS, Vite, WebRTC, WebSocket, Linux.

Behavioral Guidelines:
- Answer questions with clarity, warmth, and brevity. Use bullet points where appropriate.
- If the visitor wants to contact Amal or hire him, remind them that you can forward their message directly to Amal's Telegram Bot, or provide Amal's contact details.
- When a message has been forwarded to Telegram (${telegramSent ? 'Telegram transmission was successful' : 'Not yet forwarded'}), acknowledge that to the user.
- Always maintain your persona as Diya.`;

      // Build conversation contents
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      // Add recent history (up to last 6 turns)
      const recentHistory = history.slice(-6);
      for (const h of recentHistory) {
        contents.push({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.text }]
        });
      }

      // Add latest message
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction
        }
      });

      reply = response.text || '';
    } catch (err: any) {
      console.warn('[Diya] Gemini API generation error, using fallback:', err?.message);
      reply = getFallbackKnowledgeResponse(message, visitorInfo);
    }
  } else {
    reply = getFallbackKnowledgeResponse(message, visitorInfo);
  }

  // Append Telegram status notice if message was transmitted
  if (telegramSent) {
    reply += `\n\n*(✓ Your message was forwarded directly to Amal's Telegram bot! He has received a notification on his device.)*`;
  } else if (shouldForward && !status.telegramConfigured) {
    reply += `\n\n*(Note: Telegram Bot credentials are not yet configured on this deployment, but your message has been processed.)*`;
  }

  return {
    reply,
    telegramSent,
    telegramConfigured: status.telegramConfigured,
    botUsername: status.botUsername,
    error: telegramError
  };
}
