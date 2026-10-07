import express from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { app } from './src/serverApp';

dotenv.config();

interface ClientInfo {
  ws: WebSocket;
  peerId: string;
  displayName: string;
  roomId: string;
  isAlive: boolean;
}

const PORT = 3000;
const server = http.createServer(app);

// ============================================================================
// WEBRTC SIGNALING SERVER
// ============================================================================
const rooms = new Map<string, Map<string, ClientInfo>>();
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

  ws.on('pong', () => {
    (ws as WebSocket & { isAlive?: boolean }).isAlive = true;
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
          const existingPeers = getRoomPeers(roomId, peerId);

          ws.send(
            JSON.stringify({
              type: 'joined-room',
              roomId,
              peerId,
              peers: existingPeers
            })
          );

          room.forEach((client, pid) => {
            if (pid !== peerId && client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(
                JSON.stringify({
                  type: 'peer-joined',
                  peerId,
                  displayName: clientInfo.displayName
                })
              );
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
              targetClient.ws.send(
                JSON.stringify({
                  type: 'signal',
                  roomId,
                  senderId: senderId || currentPeerId,
                  signalData
                })
              );
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

      room.forEach((client) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(
            JSON.stringify({
              type: 'peer-left',
              peerId: pId
            })
          );
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

if (!process.env.VERCEL) {
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
  heartbeatInterval.unref?.();

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });
}

// Start server with Vite middleware in dev or static files in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
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
    console.log(`DZt Server & PostgreSQL CMS running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export { app };
export default app;
