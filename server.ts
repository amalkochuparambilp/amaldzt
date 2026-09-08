import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

dotenv.config();

interface ClientInfo {
  ws: WebSocket;
  peerId: string;
  displayName: string;
  roomId: string;
  isAlive: boolean;
}

const app = express();
const PORT = 3000;
const server = http.createServer(app);

// Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
app.use(express.json());

// In-memory rooms for WebRTC Signaling
// roomId -> Map<peerId, ClientInfo>
const rooms = new Map<string, Map<string, ClientInfo>>();

// WebSocket Server for WebRTC Signaling & Realtime Broadcasting
const wss = new WebSocketServer({ server, path: '/ws' });

// Website Live Notice State & Persistence
interface WebsiteNotice {
  id: string;
  message: string;
  author: string;
  timestamp: number;
  active: boolean;
  type?: 'announcement' | 'maintenance' | 'alert' | 'update';
}

export interface WebsiteNotificationBar {
  id: string;
  message: string;
  author: string;
  timestamp: number;
  active: boolean;
  type?: 'announcement' | 'maintenance' | 'alert' | 'update';
}

const NOTICE_FILE_PATH = path.join(process.cwd(), 'public', 'notice.json');
let activeNotice: WebsiteNotice | null = null;

const NOTIFICATION_BAR_FILE_PATH = path.join(process.cwd(), 'public', 'notification-bar.json');
let activeNotificationBar: WebsiteNotificationBar | null = null;

function loadNoticeFromDisk(): WebsiteNotice | null {
  try {
    if (fs.existsSync(NOTICE_FILE_PATH)) {
      const raw = fs.readFileSync(NOTICE_FILE_PATH, 'utf8');
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        return data;
      }
    }
  } catch (err) {
    console.error('[Notice System] Error reading notice file:', err);
  }
  return null;
}

function saveNoticeToDisk(notice: WebsiteNotice) {
  try {
    fs.writeFileSync(NOTICE_FILE_PATH, JSON.stringify(notice, null, 2), 'utf8');
  } catch (err) {
    console.error('[Notice System] Error saving notice file:', err);
  }
}

function broadcastNotice(notice: WebsiteNotice | null) {
  const payload = JSON.stringify({
    type: 'website-notice',
    notice
  });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch {}
    }
  });
}

function loadNotificationBarFromDisk(): WebsiteNotificationBar | null {
  try {
    if (fs.existsSync(NOTIFICATION_BAR_FILE_PATH)) {
      const raw = fs.readFileSync(NOTIFICATION_BAR_FILE_PATH, 'utf8');
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        return data;
      }
    }
  } catch (err) {
    console.error('[Notification Bar System] Error reading notification-bar file:', err);
  }
  return null;
}

function saveNotificationBarToDisk(bar: WebsiteNotificationBar) {
  try {
    fs.writeFileSync(NOTIFICATION_BAR_FILE_PATH, JSON.stringify(bar, null, 2), 'utf8');
  } catch (err) {
    console.error('[Notification Bar System] Error saving notification-bar file:', err);
  }
}

function broadcastNotificationBar(notification: WebsiteNotificationBar | null) {
  const payload = JSON.stringify({
    type: 'website-notification-bar',
    notification
  });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch {}
    }
  });
}

// Load initial notices on server start
activeNotice = loadNoticeFromDisk();
activeNotificationBar = loadNotificationBarFromDisk();

function getRoomPeers(roomId: string, excludePeerId?: string) {
  const room = rooms.get(roomId);
  if (!room) return [];
  const list: { peerId: string; displayName: string }[] = [];
  room.forEach((client, pid) => {
    if (pid !== excludePeerId) {
      list.push({ peerId: pid, displayName: client.displayName });
    }
  });
  return list;
}

wss.on('connection', (ws: WebSocket) => {
  let currentRoomId: string | null = null;
  let currentPeerId: string | null = null;
  let isAlive = true;

  // Immediately send active notice if available
  if (activeNotice && activeNotice.active) {
    try {
      ws.send(JSON.stringify({
        type: 'website-notice',
        notice: activeNotice
      }));
    } catch {}
  }

  // Immediately send active notification bar if available
  if (activeNotificationBar && activeNotificationBar.active) {
    try {
      ws.send(JSON.stringify({
        type: 'website-notification-bar',
        notification: activeNotificationBar
      }));
    } catch {}
  }

  ws.on('pong', () => {
    isAlive = true;
  });

  ws.on('message', (rawMessage: string) => {
    try {
      const data = JSON.parse(rawMessage.toString());
      const { type } = data;

      switch (type) {
        case 'get-notice': {
          ws.send(JSON.stringify({
            type: 'website-notice',
            notice: activeNotice
          }));
          break;
        }

        case 'get-notification-bar': {
          ws.send(JSON.stringify({
            type: 'website-notification-bar',
            notification: activeNotificationBar
          }));
          break;
        }

        case 'join': {
          const { roomId, peerId, displayName } = data;
          if (!roomId || !peerId) return;

          currentRoomId = roomId;
          currentPeerId = peerId;

          if (!rooms.has(roomId)) {
            rooms.set(roomId, new Map());
          }

          const room = rooms.get(roomId)!;
          const clientInfo: ClientInfo = {
            ws,
            peerId,
            displayName: displayName || `Peer-${peerId.slice(0, 4)}`,
            roomId,
            isAlive: true
          };

          room.set(peerId, clientInfo);

          // Get list of existing peers in the room
          const existingPeers = getRoomPeers(roomId, peerId);

          // Send confirmation & existing peer list to the joining peer
          ws.send(JSON.stringify({
            type: 'joined-room',
            roomId,
            peerId,
            peers: existingPeers
          }));

          // Notify all existing peers that a new peer has joined
          room.forEach((client, pid) => {
            if (pid !== peerId && client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify({
                type: 'peer-joined',
                peerId,
                displayName: clientInfo.displayName
              }));
            }
          });
          break;
        }

        case 'signal': {
          const { roomId, targetId, senderId, signalData } = data;
          if (!roomId || !targetId || !signalData) return;

          const room = rooms.get(roomId);
          if (room) {
            const targetClient = room.get(targetId);
            if (targetClient && targetClient.ws.readyState === WebSocket.OPEN) {
              targetClient.ws.send(JSON.stringify({
                type: 'signal',
                roomId,
                senderId: senderId || currentPeerId,
                signalData
              }));
            }
          }
          break;
        }

        case 'chat': {
          const { roomId, senderId, senderName, text, timestamp } = data;
          if (!roomId || !text) return;

          const room = rooms.get(roomId);
          if (room) {
            const payload = JSON.stringify({
              type: 'chat',
              roomId,
              senderId: senderId || currentPeerId,
              senderName: senderName || 'Anonymous',
              text,
              timestamp: timestamp || Date.now()
            });

            room.forEach((client) => {
              if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(payload);
              }
            });
          }
          break;
        }

        case 'reaction': {
          const { roomId, senderId, senderName, emoji } = data;
          if (!roomId || !emoji) return;

          const room = rooms.get(roomId);
          if (room) {
            const payload = JSON.stringify({
              type: 'reaction',
              roomId,
              senderId: senderId || currentPeerId,
              senderName: senderName || 'Peer',
              emoji
            });

            room.forEach((client) => {
              if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(payload);
              }
            });
          }
          break;
        }

        case 'file-header':
        case 'file-chunk':
        case 'file-cancel':
        case 'file-ack': {
          const { roomId, targetId, senderId } = data;
          if (!roomId) return;

          const room = rooms.get(roomId);
          if (room) {
            const rawPayload = JSON.stringify(data);
            if (targetId) {
              const targetClient = room.get(targetId);
              if (targetClient && targetClient.ws.readyState === WebSocket.OPEN) {
                targetClient.ws.send(rawPayload);
              }
            } else {
              // Broadcast to all other peers in the room
              room.forEach((client, pid) => {
                if (pid !== (senderId || currentPeerId) && client.ws.readyState === WebSocket.OPEN) {
                  client.ws.send(rawPayload);
                }
              });
            }
          }
          break;
        }

        case 'leave': {
          cleanUpPeer(currentRoomId, currentPeerId);
          currentRoomId = null;
          currentPeerId = null;
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  const cleanUpPeer = (rId: string | null, pId: string | null) => {
    if (rId && pId && rooms.has(rId)) {
      const room = rooms.get(rId)!;
      room.delete(pId);

      // Notify remaining peers
      room.forEach((client) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify({
            type: 'peer-left',
            peerId: pId
          }));
        }
      });

      if (room.size === 0) {
        rooms.delete(rId);
      }
    }
  };

  ws.on('close', () => {
    cleanUpPeer(currentRoomId, currentPeerId);
  });

  ws.on('error', () => {
    cleanUpPeer(currentRoomId, currentPeerId);
  });
});

// Periodic heartbeat to keep connections healthy
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    const extWs = ws as WebSocket & { isAlive?: boolean };
    if (extWs.isAlive === false) {
      return ws.terminate();
    }
    extWs.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

// Rate Limiter for Contact Form Submissions
interface ContactRateLimit {
  count: number;
  resetTime: number;
  lastRequestTime: number;
}
const contactRateLimits = new Map<string, ContactRateLimit>();

// Clean up expired rate limit entries every 2 minutes
setInterval(() => {
  const now = Date.now();
  contactRateLimits.forEach((record, ip) => {
    if (now > record.resetTime) {
      contactRateLimits.delete(ip);
    }
  });
}, 120000);

// API Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Telegram Notification & Reply Helper
async function sendTelegramReply(chatId: string | number, text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    });
  } catch (err) {
    console.error('[Telegram Bot] Failed to send reply:', err);
  }
}

// Telegram Command Processor for /update
async function handleTelegramCommand(chatId: string | number, userId: string | number, text: string, senderName: string) {
  const expectedChatId = String(process.env.TELEGRAM_CHAT_ID || '').trim();
  const isAuthorized = Boolean(
    expectedChatId && (String(chatId) === expectedChatId || String(userId) === expectedChatId)
  );

  const trimmed = text.trim();
  const commandMatch = trimmed.match(/^\/([a-zA-Z0-9_]+)(?:@\w+)?(?:\s+([\s\S]*))?$/);
  if (!commandMatch) return;

  const command = commandMatch[1].toLowerCase();
  const args = (commandMatch[2] || '').trim();

  if (command === 'update' || command === 'notice' || command === 'broadcast') {
    if (!isAuthorized) {
      await sendTelegramReply(
        chatId,
        '⛔ *Access Denied*\n\nOnly the authorized website owner can broadcast notices to the website.'
      );
      return;
    }

    if (!args || args.toLowerCase() === 'help') {
      await sendTelegramReply(
        chatId,
        '📢 *Website Live Notice System*\n\n' +
        'Send `/update <your message>` to broadcast a live popup notice to all website visitors.\n\n' +
        '*Commands:*\n' +
        '• `/update <message>` — Broadcast new popup notice\n' +
        '• `/update clear` — Remove the active notice from the website\n' +
        '• `/update status` — View currently active notice\n\n' +
        '*Examples:*\n' +
        '• `/update Welcome to DZt! Our new P2P video call room is live.`\n' +
        '• `/update Website maintenance scheduled tonight at 11 PM IST.`\n' +
        '• `/update clear`'
      );
      return;
    }

    if (args.toLowerCase() === 'clear' || args.toLowerCase() === 'off' || args.toLowerCase() === 'remove') {
      activeNotice = {
        id: 'cleared_' + Date.now(),
        message: '',
        author: senderName || 'Amal K P',
        timestamp: Date.now(),
        active: false
      };
      saveNoticeToDisk(activeNotice);
      broadcastNotice(activeNotice);

      await sendTelegramReply(
        chatId,
        '✅ *Website Notice Cleared*\n\nThe active popup notice has been cleared. Visitors will no longer see the popup.'
      );
      return;
    }

    if (args.toLowerCase() === 'status') {
      if (activeNotice?.active) {
        await sendTelegramReply(
          chatId,
          `ℹ️ *Active Website Notice:*\n\n"${activeNotice.message}"\n\n` +
          `• Author: ${activeNotice.author || 'Amal K P'}\n` +
          `• Broadcasted: ${new Date(activeNotice.timestamp).toLocaleString()}\n\n` +
          `To clear it, send \`/update clear\``
        );
      } else {
        await sendTelegramReply(
          chatId,
          'ℹ️ No active notice is currently displayed on the website.\n\nSend `/update <message>` to broadcast one!'
        );
      }
      return;
    }

    // Broadcast new notice to everyone!
    activeNotice = {
      id: 'notice_' + Date.now(),
      message: args,
      author: senderName || 'Amal K P',
      timestamp: Date.now(),
      active: true,
      type: 'announcement'
    };

    saveNoticeToDisk(activeNotice);
    broadcastNotice(activeNotice);

    await sendTelegramReply(
      chatId,
      `📢 *Notice Broadcasted Successfully!*\n\n"${args}"\n\n` +
      `✅ All visitors on https://amalkp.online will now see this popup notice.\n` +
      `To remove it, send \`/update clear\``
    );
    return;
  }

  if (command === 'notification' || command === 'notify' || command === 'banner' || command === 'topbar') {
    if (!isAuthorized) {
      await sendTelegramReply(
        chatId,
        '⛔ *Access Denied*\n\nOnly the authorized website owner can send notifications to the website.'
      );
      return;
    }

    if (!args || args.toLowerCase() === 'help') {
      await sendTelegramReply(
        chatId,
        '🔔 *Website Notification Bar System*\n\n' +
        'Send `/notification <your message>` to display a live notification banner across the top of the website.\n\n' +
        '*Commands:*\n' +
        '• `/notification <message>` — Broadcast new notification bar\n' +
        '• `/notification clear` — Remove the notification bar from the website\n' +
        '• `/notification status` — View currently active notification\n\n' +
        '*Examples:*\n' +
        '• `/notification 🚀 New Project Released: P2P Encrypted Video Call is now live on DZt!`\n' +
        '• `/notification ⚠️ System maintenance tonight from 11:30 PM IST.`\n' +
        '• `/notification clear`'
      );
      return;
    }

    if (args.toLowerCase() === 'clear' || args.toLowerCase() === 'off' || args.toLowerCase() === 'remove') {
      activeNotificationBar = {
        id: 'cleared_' + Date.now(),
        message: '',
        author: senderName || 'Amal K P',
        timestamp: Date.now(),
        active: false
      };
      saveNotificationBarToDisk(activeNotificationBar);
      broadcastNotificationBar(activeNotificationBar);

      await sendTelegramReply(
        chatId,
        '✅ *Notification Bar Cleared*\n\nThe notification bar has been removed from the website.'
      );
      return;
    }

    if (args.toLowerCase() === 'status') {
      if (activeNotificationBar?.active) {
        await sendTelegramReply(
          chatId,
          `ℹ️ *Active Top Notification Bar:*\n\n"${activeNotificationBar.message}"\n\n` +
          `• Author: ${activeNotificationBar.author || 'Amal K P'}\n` +
          `• Broadcasted: ${new Date(activeNotificationBar.timestamp).toLocaleString()}\n\n` +
          `To clear it, send \`/notification clear\``
        );
      } else {
        await sendTelegramReply(
          chatId,
          'ℹ️ No active notification is currently displayed on the notification bar.\n\nSend `/notification <message>` to broadcast one!'
        );
      }
      return;
    }

    // Broadcast new notification bar to everyone!
    activeNotificationBar = {
      id: 'bar_' + Date.now(),
      message: args,
      author: senderName || 'Amal K P',
      timestamp: Date.now(),
      active: true,
      type: 'announcement'
    };

    saveNotificationBarToDisk(activeNotificationBar);
    broadcastNotificationBar(activeNotificationBar);

    await sendTelegramReply(
      chatId,
      `🔔 *Notification Bar Broadcasted!*\n\n"${args}"\n\n` +
      `✅ All visitors on https://amalkp.online will now see this notification in the top bar.\n` +
      `To remove it, send \`/notification clear\``
    );
    return;
  }

  if (command === 'start' || command === 'help') {
    await sendTelegramReply(
      chatId,
      '👋 *Welcome to Amal K P / DZt Portfolio Bot*\n\n' +
      '*Available Commands:*\n' +
      '• `/notification <message>` — Send notification via top notification bar\n' +
      '• `/notification clear` — Remove top notification bar\n' +
      '• `/notification status` — View active top notification bar\n\n' +
      '• `/update <message>` — Broadcast popup modal notice to visitors\n' +
      '• `/update clear` — Remove popup modal notice\n' +
      '• `/update status` — View active popup notice\n\n' +
      '• `/help` — Show help'
    );
  }
}

// Background Telegram Polling Loop
let pollingActive = false;
let pollingOffset = 0;

async function startTelegramPolling() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.log('[Telegram Bot] TELEGRAM_BOT_TOKEN not provided, skipping polling.');
    return;
  }
  if (pollingActive) return;
  pollingActive = true;
  console.log('[Telegram Bot] Starting live polling for /update commands...');

  while (pollingActive) {
    try {
      const url = `https://api.telegram.org/bot${botToken}/getUpdates?offset=${pollingOffset}&timeout=20`;
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
      const data = (await res.json()) as any;

      if (data && data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          pollingOffset = update.update_id + 1;
          const msg = update.message || update.edited_message;
          if (msg && msg.text) {
            await handleTelegramCommand(
              msg.chat.id,
              msg.from?.id,
              msg.text,
              msg.from?.first_name || 'Amal K P'
            );
          }
        }
      } else if (data && data.error_code === 409) {
        console.warn('[Telegram Bot] 409 Conflict (another instance or webhook active). Retrying in 10s...');
        await new Promise((r) => setTimeout(r, 10000));
      } else {
        await new Promise((r) => setTimeout(r, 2000));
      }
    } catch (err: any) {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

// Website Notice Endpoints
app.get('/api/notice', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({
    success: true,
    active: Boolean(activeNotice?.active),
    notice: activeNotice
  });
});

// Website Notification Bar Endpoints
app.get(['/api/notification-bar', '/api/notification'], (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({
    success: true,
    active: Boolean(activeNotificationBar?.active),
    notification: activeNotificationBar
  });
});

app.post('/api/telegram-webhook', async (req, res) => {
  try {
    const update = req.body;
    const msg = update?.message || update?.edited_message;
    if (msg && msg.text) {
      await handleTelegramCommand(
        msg.chat.id,
        msg.from?.id,
        msg.text,
        msg.from?.first_name || 'Amal K P'
      );
    }
    res.json({ ok: true });
  } catch (err: any) {
    console.error('[Telegram Webhook] Error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Contact API status check
app.get('/api/contact/status', (_req, res) => {
  const hasToken = Boolean(process.env.TELEGRAM_BOT_TOKEN);
  const hasChatId = Boolean(process.env.TELEGRAM_CHAT_ID);
  res.json({
    configured: hasToken && hasChatId,
    service: 'telegram'
  });
});

// Knowledge layer profile endpoint
app.get('/api/knowledge/profile', (_req, res) => {
  const profilePath = path.join(process.cwd(), 'public', 'ai', 'profile.json');
  res.sendFile(profilePath, (err) => {
    if (err) {
      res.status(404).json({ error: 'Profile not found' });
    }
  });
});

// Contact Form Submission Endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    // 1. Rate Limit Checks (max 5 per 10 minutes, minimum 5 seconds between consecutive attempts)
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

    // 2. Honeypot Spam Protection: If hidden bot field is filled, silently discard without notifying spammer
    if (_hp && typeof _hp === 'string' && _hp.trim().length > 0) {
      console.warn(`[Anti-Spam] Honeypot triggered from IP: ${rawIp}`);
      return res.json({
        success: true,
        message: 'Message sent successfully!'
      });
    }

    // 3. Server-side Validation
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

    // 4. Secure Telegram Configuration
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error('[Contact API] Telegram BOT token or Chat ID is not configured.');
      return res.status(500).json({
        success: false,
        error: 'Telegram delivery is currently unconfigured on the server. Please email directly.'
      });
    }

    // 5. Construct clearly formatted Telegram text
    const formattedTelegramMessage = [
      '📩 New Contact Form Submission',
      '',
      `👤 Name: ${cleanName}`,
      `📧 Email: ${cleanEmail}`,
      `💬 Message: ${cleanMessage}`
    ].join('\n');

    // 6. Send to Telegram Bot API
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: formattedTelegramMessage,
        disable_web_page_preview: true
      })
    });

    const data = (await response.json()) as { ok: boolean; description?: string; error_code?: number };

    if (!response.ok || !data.ok) {
      console.error('[Contact API] Telegram API error:', data);
      const errorMsg = data.description || 'Unable to deliver message to Telegram.';
      return res.status(502).json({
        success: false,
        error: `Telegram delivery failed: ${errorMsg}`
      });
    }

    return res.json({
      success: true,
      message: 'Message sent successfully!'
    });
  } catch (error: any) {
    console.error('[Contact API] Internal error processing submission:', error);
    return res.status(500).json({
      success: false,
      error: 'An internal server error occurred while sending your message. Please try again later.'
    });
  }
});

const getActiveRoomsList = () => {
  const activeRooms: { id: string; userCount: number }[] = [];
  rooms.forEach((room, id) => {
    activeRooms.push({ id, userCount: room.size });
  });
  return activeRooms;
};

app.get('/api/meet/rooms', (_req, res) => {
  res.json({ rooms: getActiveRoomsList() });
});

app.get('/api/meet/room/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  if (!room) {
    return res.json({ exists: false, count: 0, peers: [] });
  }
  return res.json({
    exists: true,
    count: room.size,
    peers: getRoomPeers(roomId)
  });
});

app.get('/api/vc/rooms', (_req, res) => {
  res.json({ rooms: getActiveRoomsList() });
});

app.get('/api/vc/room/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  if (!room) {
    return res.json({ exists: false, count: 0, peers: [] });
  }
  return res.json({
    exists: true,
    count: room.size,
    peers: getRoomPeers(roomId)
  });
});

// Start server with Vite middleware in dev or static files in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`P2P Video Call & DZt Server running on http://0.0.0.0:${PORT}`);
    startTelegramPolling();
  });
}

startServer();
