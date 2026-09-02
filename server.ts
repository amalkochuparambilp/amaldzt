import express from 'express';
import http from 'http';
import path from 'path';
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
app.use(express.json());

// In-memory rooms for WebRTC Signaling
// roomId -> Map<peerId, ClientInfo>
const rooms = new Map<string, Map<string, ClientInfo>>();

// WebSocket Server for WebRTC Signaling
const wss = new WebSocketServer({ server, path: '/ws' });

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

  ws.on('pong', () => {
    isAlive = true;
  });

  ws.on('message', (rawMessage: string) => {
    try {
      const data = JSON.parse(rawMessage.toString());
      const { type } = data;

      switch (type) {
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

// Contact API status check
app.get('/api/contact/status', (_req, res) => {
  const hasToken = Boolean(process.env.TELEGRAM_BOT_TOKEN || '8698327116:AAElplFCAnxuyC0gVORQEAll8qP70btDwUk');
  const hasChatId = Boolean(process.env.TELEGRAM_CHAT_ID || '7814866194');
  res.json({
    configured: hasToken && hasChatId,
    service: 'telegram'
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
    const botToken = process.env.TELEGRAM_BOT_TOKEN || '8698327116:AAElplFCAnxuyC0gVORQEAll8qP70btDwUk';
    const chatId = process.env.TELEGRAM_CHAT_ID || '7814866194';

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
  });
}

startServer();
