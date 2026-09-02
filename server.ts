import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

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
  const heartbeatSocket = ws as WebSocket & { isAlive?: boolean };
  heartbeatSocket.isAlive = true;

  ws.on('pong', () => {
    heartbeatSocket.isAlive = true;
  });

  ws.on('message', (rawMessage: string) => {
    try {
      if (rawMessage.length > 1024 * 1024) return;
      const data = JSON.parse(rawMessage.toString());
      const { type } = data;

      switch (type) {
        case 'join': {
          const { roomId, peerId, displayName } = data;
          if (!roomId || !peerId) return;
          if (currentRoomId || currentPeerId || typeof roomId !== 'string' || typeof peerId !== 'string') return;
          if (!/^[a-z0-9][a-z0-9-]{2,63}$/i.test(roomId) || !/^[a-zA-Z0-9_-]{4,64}$/.test(peerId)) return;

          currentRoomId = roomId.trim().toLowerCase();
          currentPeerId = peerId;

          if (!rooms.has(currentRoomId)) {
            rooms.set(currentRoomId, new Map());
          }

          const room = rooms.get(currentRoomId)!;
          if (room.has(peerId)) return;
          const clientInfo: ClientInfo = {
            ws,
            peerId,
            displayName: typeof displayName === 'string' ? displayName.trim().slice(0, 80) || `Peer-${peerId.slice(0, 4)}` : `Peer-${peerId.slice(0, 4)}`,
            roomId: currentRoomId,
            isAlive: true
          };

          room.set(peerId, clientInfo);

          // Get list of existing peers in the room
          const existingPeers = getRoomPeers(currentRoomId, peerId);

          // Send confirmation & existing peer list to the joining peer
          ws.send(JSON.stringify({
            type: 'joined-room',
            roomId: currentRoomId,
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
          const { targetId, signalData } = data;
          if (!currentRoomId || !currentPeerId || !targetId || !signalData) return;

          const room = rooms.get(currentRoomId);
          if (room) {
            const targetClient = room.get(targetId);
            if (targetClient && targetClient.ws.readyState === WebSocket.OPEN) {
              targetClient.ws.send(JSON.stringify({
                type: 'signal',
                roomId: currentRoomId,
                senderId: currentPeerId,
                signalData
              }));
            }
          }
          break;
        }

        case 'chat': {
          const { text, timestamp } = data;
          if (!currentRoomId || !currentPeerId || typeof text !== 'string' || !text.trim()) return;

          const room = rooms.get(currentRoomId);
          if (room) {
            const payload = JSON.stringify({
              type: 'chat',
              roomId: currentRoomId,
              senderId: currentPeerId,
              senderName: room.get(currentPeerId)?.displayName || 'Anonymous',
              text: text.trim().slice(0, 2000),
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
          const { emoji } = data;
          if (!currentRoomId || !currentPeerId || typeof emoji !== 'string' || emoji.length > 32) return;

          const room = rooms.get(currentRoomId);
          if (room) {
            const payload = JSON.stringify({
              type: 'reaction',
              roomId: currentRoomId,
              senderId: currentPeerId,
              senderName: room.get(currentPeerId)?.displayName || 'Peer',
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
          const { targetId } = data;
          if (!currentRoomId || !currentPeerId) return;

          const room = rooms.get(currentRoomId);
          if (room) {
            const rawPayload = JSON.stringify({ ...data, roomId: currentRoomId, senderId: currentPeerId });
            if (targetId) {
              const targetClient = room.get(targetId);
              if (targetClient && targetClient.ws.readyState === WebSocket.OPEN) {
                targetClient.ws.send(rawPayload);
              }
            } else {
              // Broadcast to all other peers in the room
              room.forEach((client, pid) => {
                if (pid !== currentPeerId && client.ws.readyState === WebSocket.OPEN) {
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

// API Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/knowledge/profile', (_req, res) => {
  const profilePath = process.env.NODE_ENV === 'production'
    ? path.join(process.cwd(), 'dist', 'ai', 'profile.json')
    : path.join(process.cwd(), 'public', 'ai', 'profile.json');

  try {
    const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
    res.type('application/json').json(profile);
  } catch {
    res.status(500).json({ error: 'Knowledge profile unavailable' });
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
