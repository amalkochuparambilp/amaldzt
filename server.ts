import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { prisma, getDatabaseEnvMetadata } from './src/db/prisma.ts';
import {
  ensureDatabaseSeeded,
  fetchFullCMSStateFromPostgres,
  logPrismaAudit,
  getAdminEmailFromDb,
  verifyAdminLoginInDb,
  verifyOrUpdatePasscodeInDb,
  updateProfileInDb,
  updateSettingsInDb,
  getDatabaseStatusFromPostgres,
  getTableDataFromPostgres,
  updateTableRowInPostgres,
  insertTableRowInPostgres,
  deleteTableRowInPostgres,
  executeSqlQueryInPostgres
} from './src/db/cmsRepository.ts';
import { DEFAULT_CMS_STATE } from './src/cms/defaultState.ts';
import {
  CMSState,
  Project,
  Skill,
  Collaboration
} from './src/types.ts';

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
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
app.use(express.json({ limit: '10mb' }));

function syncPublicKnowledgeProfile(state: CMSState) {
  try {
    const profilePath = path.join(process.cwd(), 'public', 'ai', 'profile.json');
    const dir = path.dirname(profilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const payload = {
      schema_version: state.knowledge.schema_version || '1.0',
      entity: {
        ...state.knowledge.entity,
        name: state.profile.name,
        jobTitle: state.profile.title
      },
      relationships: state.knowledge.relationships,
      relationship_policy: state.knowledge.relationship_policy,
      projects: state.projects
        .filter((p) => p.published !== false)
        .map((p) => ({
          id: p.id,
          name: p.title,
          description: p.description,
          ...(p.liveUrl ? { url: p.liveUrl } : {}),
          source_url: p.githubUrl || 'https://github.com/amalkochuparambilp'
        })),
      official_sources: state.knowledge.official_sources,
      last_updated: new Date().toISOString()
    };
    fs.writeFileSync(profilePath, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
  } catch (err) {
    console.error('[CMS] Failed to sync public/ai/profile.json:', err);
  }
}

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

// ============================================================================
// ADMIN-ONLY JWT / HMAC-SHA256 SESSION AUTHENTICATION (.env CREDENTIALS)
// ============================================================================

interface AdminTokenPayload {
  email: string;
  role: 'admin';
  iat: number;
  exp: number;
}

const revokedTokens = new Set<string>();

function getJwtSecret(): string {
  return process.env.CMS_JWT_SECRET || 'dzt_cms_hmac_sha256_secret_2026_amalkp';
}

function createAdminToken(email: string): { token: string; payload: AdminTokenPayload } {
  const now = Date.now();
  const payload: AdminTokenPayload = {
    email: email.toLowerCase(),
    role: 'admin',
    iat: now,
    exp: now + 24 * 60 * 60 * 1000 // 24 hours
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', getJwtSecret())
    .update(encodedPayload)
    .digest('base64url');
  return {
    token: `${encodedPayload}.${signature}`,
    payload
  };
}

function verifyAdminToken(rawToken?: string | null): AdminTokenPayload | null {
  if (!rawToken || typeof rawToken !== 'string' || revokedTokens.has(rawToken)) {
    return null;
  }
  const parts = rawToken.split('.');
  if (parts.length !== 2) return null;
  const [encodedPayload, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', getJwtSecret())
    .update(encodedPayload)
    .digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8')) as AdminTokenPayload;
    if (!payload || payload.role !== 'admin' || Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function extractAdminSession(req: express.Request): AdminTokenPayload | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return verifyAdminToken(token);
}

const requireAdminAuth: express.RequestHandler = (req, res, next) => {
  const session = extractAdminSession(req);
  if (!session) {
    return res.status(401).json({
      success: false,
      authenticated: false,
      error: 'Unauthorized: Administrator authentication is required to access this CMS endpoint.'
    });
  }
  (req as any).adminSession = session;
  next();
};

// ============================================================================
// PRISMA POSTGRESQL CMS API ENDPOINTS
// ============================================================================

app.get('/api/cms/state', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const isAdmin = Boolean(extractAdminSession(req));
    const state = await fetchFullCMSStateFromPostgres(isAdmin);
    res.json(state);
  } catch (error: any) {
    console.error('[Prisma CMS] Error fetching state:', error);
    res.status(500).json({ error: 'Failed to load CMS state from PostgreSQL' });
  }
});

// ============================================================================
// ADMIN AUTHENTICATION & .ENV CONFIGURATION ENDPOINTS (/api/cms/auth/*)
// ============================================================================

app.get('/api/cms/auth/me', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
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
      role: 'Administrator',
      issuedAt: new Date(session.iat).toISOString(),
      expiresAt: new Date(session.exp).toISOString()
    },
    envMetadata
  });
});

app.post('/api/cms/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const verification = await verifyAdminLoginInDb(email, password);
    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: verification.error || 'Invalid administrator credentials.'
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
        role: 'Administrator',
        issuedAt: new Date(payload.iat).toISOString(),
        expiresAt: new Date(payload.exp).toISOString()
      },
      envMetadata,
      state
    });
  } catch (error) {
    console.error('[Prisma CMS] Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Administrator authentication failed.'
    });
  }
});

app.post('/api/cms/auth/logout', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    revokedTokens.add(token);
  }
  await logPrismaAudit('ADMIN_LOGOUT', 'Security', 'Administrator locked and signed out of CMS Console');
  return res.json({ success: true, authenticated: false });
});

app.post('/api/cms/auth', async (req, res) => {
  try {
    const { email, password, newPassword, newAdminEmail, newDatabaseUrl } = req.body || {};

    // If updating .env or admin credentials, require an active admin session
    if (newPassword || newAdminEmail || newDatabaseUrl) {
      const session = extractAdminSession(req);
      if (!session) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Must be signed in as Administrator to modify .env credentials.'
        });
      }
      const result = await verifyOrUpdatePasscodeInDb(password, newPassword, newAdminEmail, newDatabaseUrl);
      if (!result.valid) {
        return res.status(401).json({ success: false, error: result.error || 'Invalid current administrator password.' });
      }
      const status = await getDatabaseStatusFromPostgres().catch(() => null);
      const state = await fetchFullCMSStateFromPostgres(true);
      return res.json({
        success: true,
        authenticated: true,
        envMetadata: getDatabaseEnvMetadata(),
        status,
        state
      });
    }

    // Otherwise perform login verification
    const effectiveEmail = email || (await getAdminEmailFromDb());
    const verification = await verifyAdminLoginInDb(effectiveEmail, password);
    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        error: verification.error || 'Invalid administrator credentials.'
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
        role: 'Administrator',
        issuedAt: new Date(payload.iat).toISOString(),
        expiresAt: new Date(payload.exp).toISOString()
      },
      envMetadata: getDatabaseEnvMetadata(),
      state
    });
  } catch (error) {
    console.error('[Prisma CMS] Auth error:', error);
    return res.status(500).json({ success: false, error: 'Authentication verification failed.' });
  }
});

// ============================================================================
// REAL DATABASE STUDIO, TABLE EXPLORER & SQL RUNNER ENDPOINTS (/api/cms/db/*)
// Protected by requireAdminAuth
// ============================================================================

app.get('/api/cms/db/status', requireAdminAuth, async (_req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const status = await getDatabaseStatusFromPostgres();
    return res.json(status);
  } catch (error: any) {
    console.error('[Prisma DB Status] Error:', error);
    return res.status(500).json({
      connected: false,
      error: error?.message || 'Failed to query PostgreSQL server status'
    });
  }
});

app.get('/api/cms/db/table/:tableName', requireAdminAuth, async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const { tableName } = req.params;
    const data = await getTableDataFromPostgres(tableName);
    return res.json(data);
  } catch (error: any) {
    console.error('[Prisma DB Table] Error:', error);
    return res.status(400).json({
      error: error?.message || 'Failed to load PostgreSQL table rows'
    });
  }
});

app.post('/api/cms/db/table/:tableName', requireAdminAuth, async (req, res) => {
  try {
    const { tableName } = req.params;
    const result = await insertTableRowInPostgres(tableName, req.body || {});
    syncPublicKnowledgeProfile(result.state);
    return res.json({ success: true, row: result.row, state: result.state });
  } catch (error: any) {
    console.error('[Prisma DB Insert Row] Error:', error);
    return res.status(400).json({
      error: error?.message || 'Failed to insert row into PostgreSQL'
    });
  }
});

app.put('/api/cms/db/table/:tableName/:id', requireAdminAuth, async (req, res) => {
  try {
    const { tableName, id } = req.params;
    const result = await updateTableRowInPostgres(tableName, id, req.body || {});
    syncPublicKnowledgeProfile(result.state);
    return res.json({ success: true, row: result.row, state: result.state });
  } catch (error: any) {
    console.error('[Prisma DB Update Row] Error:', error);
    return res.status(400).json({
      error: error?.message || 'Failed to update row in PostgreSQL'
    });
  }
});

app.delete('/api/cms/db/table/:tableName/:id', requireAdminAuth, async (req, res) => {
  try {
    const { tableName, id } = req.params;
    const result = await deleteTableRowInPostgres(tableName, id);
    syncPublicKnowledgeProfile(result.state);
    return res.json({ success: true, state: result.state });
  } catch (error: any) {
    console.error('[Prisma DB Delete Row] Error:', error);
    return res.status(400).json({
      error: error?.message || 'Failed to delete row from PostgreSQL'
    });
  }
});

app.post('/api/cms/db/query', requireAdminAuth, async (req, res) => {
  try {
    const { sql } = req.body || {};
    if (typeof sql !== 'string' || !sql.trim()) {
      return res.status(400).json({ error: 'SQL statement is required.' });
    }
    const result = await executeSqlQueryInPostgres(sql);
    if (result.state) {
      syncPublicKnowledgeProfile(result.state);
    }
    return res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('[Prisma DB SQL Query] Error:', error);
    return res.status(400).json({
      success: false,
      error: error?.message || 'SQL execution failed in PostgreSQL'
    });
  }
});

app.post('/api/cms/db/sync', requireAdminAuth, async (_req, res) => {
  try {
    await ensureDatabaseSeeded(true);
    await logPrismaAudit(
      'DB_SYNC_VERIFY',
      'Database',
      'Verified & synchronized all 9 PostgreSQL tables via .env DATABASE_URL'
    );
    const state = await fetchFullCMSStateFromPostgres(true);
    syncPublicKnowledgeProfile(state);
    const status = await getDatabaseStatusFromPostgres();
    return res.json({ success: true, state, status });
  } catch (error: any) {
    console.error('[Prisma DB Sync] Error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to synchronize PostgreSQL tables'
    });
  }
});

app.put('/api/cms/profile', requireAdminAuth, async (req, res) => {
  try {
    const incoming = req.body;
    if (!incoming || typeof incoming !== 'object') {
      return res.status(400).json({ error: 'Invalid profile payload' });
    }
    const state = await updateProfileInDb(incoming);
    syncPublicKnowledgeProfile(state);
    return res.json({ success: true, state });
  } catch (error) {
    console.error('[Prisma CMS] Profile update error:', error);
    return res.status(500).json({ error: 'Failed to update profile in PostgreSQL' });
  }
});

app.put('/api/cms/settings', requireAdminAuth, async (req, res) => {
  try {
    const { settings, seo } = req.body || {};
    const state = await updateSettingsInDb({ settings, seo });
    return res.json({ success: true, state });
  } catch (error) {
    console.error('[Prisma CMS] Settings update error:', error);
    return res.status(500).json({ error: 'Failed to update settings in PostgreSQL' });
  }
});

// Projects CRUD (Prisma PostgreSQL)
app.post('/api/cms/projects', requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const project = req.body as Project;
    if (!project || !project.title) {
      return res.status(400).json({ error: 'Project title is required' });
    }
    const count = await prisma.project.count();
    const id =
      project.id?.trim() ||
      project.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
        '-' +
        Date.now().toString().slice(-4);

    await prisma.project.create({
      data: {
        id,
        title: project.title.trim(),
        description: project.description || '',
        longDescription: project.longDescription || project.description || null,
        category: project.category || 'system',
        tech: Array.isArray(project.tech) ? project.tech : [],
        features: Array.isArray(project.features) ? project.features : [],
        githubUrl: project.githubUrl || 'https://github.com/amalkochuparambilp',
        liveUrl: project.liveUrl || null,
        featured: Boolean(project.featured),
        published: project.published !== false,
        highlightLabel: project.highlightLabel || `0${count + 1}. ${project.title.toUpperCase().slice(0, 18)}`,
        highlightStack: project.highlightStack || (project.tech?.slice(0, 2).join(' / ') || 'Full-Stack'),
        sortOrder: count
      }
    });

    await logPrismaAudit('CREATE_PROJECT', 'Project', `Created project "${project.title.trim()}" in PostgreSQL`);
    const state = await fetchFullCMSStateFromPostgres();
    syncPublicKnowledgeProfile(state);
    return res.json({ success: true, state });
  } catch (error) {
    console.error('[Prisma CMS] Create project error:', error);
    return res.status(500).json({ error: 'Failed to create project in PostgreSQL' });
  }
});

app.put('/api/cms/projects/:id', requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const { id } = req.params;
    const body = req.body as Partial<Project>;

    await prisma.project.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.longDescription !== undefined ? { longDescription: body.longDescription } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
        ...(body.tech !== undefined ? { tech: body.tech } : {}),
        ...(body.features !== undefined ? { features: body.features } : {}),
        ...(body.githubUrl !== undefined ? { githubUrl: body.githubUrl } : {}),
        ...(body.liveUrl !== undefined ? { liveUrl: body.liveUrl } : {}),
        ...(body.featured !== undefined ? { featured: Boolean(body.featured) } : {}),
        ...(body.published !== undefined ? { published: Boolean(body.published) } : {}),
        ...(body.highlightLabel !== undefined ? { highlightLabel: body.highlightLabel } : {}),
        ...(body.highlightStack !== undefined ? { highlightStack: body.highlightStack } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {})
      }
    });

    await logPrismaAudit('UPDATE_PROJECT', 'Project', `Updated project "${body.title || id}" in PostgreSQL`);
    const state = await fetchFullCMSStateFromPostgres();
    syncPublicKnowledgeProfile(state);
    return res.json({ success: true, state });
  } catch (error) {
    console.error('[Prisma CMS] Update project error:', error);
    return res.status(500).json({ error: 'Failed to update project in PostgreSQL' });
  }
});

app.put('/api/cms/projects-reorder', requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const { projects } = req.body || {};
    if (!Array.isArray(projects)) {
      return res.status(400).json({ error: 'Invalid projects list' });
    }
    await Promise.all(
      projects.map((p: Project, index: number) =>
        prisma.project.update({
          where: { id: p.id },
          data: { sortOrder: index }
        })
      )
    );
    await logPrismaAudit('REORDER_PROJECTS', 'Project', 'Reordered portfolio project sequence in PostgreSQL');
    const state = await fetchFullCMSStateFromPostgres();
    syncPublicKnowledgeProfile(state);
    return res.json({ success: true, state });
  } catch (error) {
    console.error('[Prisma CMS] Reorder projects error:', error);
    return res.status(500).json({ error: 'Failed to reorder projects' });
  }
});

app.delete('/api/cms/projects/:id', requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const { id } = req.params;
    await prisma.project.delete({ where: { id } });
    await logPrismaAudit('DELETE_PROJECT', 'Project', `Deleted project "${id}" from PostgreSQL`);
    const state = await fetchFullCMSStateFromPostgres();
    syncPublicKnowledgeProfile(state);
    return res.json({ success: true, state });
  } catch (error) {
    console.error('[Prisma CMS] Delete project error:', error);
    return res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Skills CRUD (Prisma PostgreSQL)
app.post('/api/cms/skills', requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const skill = req.body as Skill;
    if (!skill || !skill.name) {
      return res.status(400).json({ error: 'Skill name is required' });
    }
    const count = await prisma.skill.count();
    const id = `skill-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;

    await prisma.skill.create({
      data: {
        id,
        name: skill.name.trim(),
        level: Math.min(100, Math.max(0, Number(skill.level) || 85)),
        category: skill.category || 'Frontend',
        icon: skill.icon || 'Code2',
        sortOrder: count
      }
    });

    await logPrismaAudit('CREATE_SKILL', 'Skill', `Added competency "${skill.name.trim()}" in PostgreSQL`);
    const state = await fetchFullCMSStateFromPostgres();
    return res.json({ success: true, state });
  } catch (error) {
    console.error('[Prisma CMS] Create skill error:', error);
    return res.status(500).json({ error: 'Failed to create skill' });
  }
});

app.put('/api/cms/skills/:id', requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const { id } = req.params;
    const body = req.body as Partial<Skill>;

    await prisma.skill.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.level !== undefined ? { level: Math.min(100, Math.max(0, Number(body.level))) } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
        ...(body.icon !== undefined ? { icon: body.icon } : {})
      }
    });

    await logPrismaAudit('UPDATE_SKILL', 'Skill', `Updated competency "${body.name || id}" in PostgreSQL`);
    const state = await fetchFullCMSStateFromPostgres();
    return res.json({ success: true, state });
  } catch (error) {
    console.error('[Prisma CMS] Update skill error:', error);
    return res.status(500).json({ error: 'Failed to update skill' });
  }
});

app.delete('/api/cms/skills/:id', requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const { id } = req.params;
    await prisma.skill.delete({ where: { id } });
    await logPrismaAudit('DELETE_SKILL', 'Skill', `Deleted competency "${id}" from PostgreSQL`);
    const state = await fetchFullCMSStateFromPostgres();
    return res.json({ success: true, state });
  } catch (error) {
    console.error('[Prisma CMS] Delete skill error:', error);
    return res.status(500).json({ error: 'Failed to delete skill' });
  }
});

// Collaborations CRUD (Prisma PostgreSQL)
app.post('/api/cms/collaborations', requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const collab = req.body as Collaboration;
    if (!collab || !collab.organization) {
      return res.status(400).json({ error: 'Organization name is required' });
    }
    const count = await prisma.collaboration.count();
    const id =
      collab.id?.trim() ||
      `collab-${collab.organization.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

    await prisma.collaboration.create({
      data: {
        id,
        role: collab.role || 'Lead Contributor',
        organization: collab.organization.trim(),
        badge: collab.badge || 'ECOSYSTEM INITIATIVE',
        logoType: collab.logoType || 'libcode',
        description: collab.description || '',
        highlights: Array.isArray(collab.highlights) ? collab.highlights : [],
        tags: Array.isArray(collab.tags) ? collab.tags : [],
        sortOrder: count
      }
    });

    await logPrismaAudit('CREATE_COLLAB', 'Collaboration', `Added collaboration "${collab.organization}" in PostgreSQL`);
    const state = await fetchFullCMSStateFromPostgres();
    return res.json({ success: true, state });
  } catch (error) {
    console.error('[Prisma CMS] Create collaboration error:', error);
    return res.status(500).json({ error: 'Failed to create collaboration' });
  }
});

app.put('/api/cms/collaborations/:id', requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const { id } = req.params;
    const body = req.body as Partial<Collaboration>;

    await prisma.collaboration.update({
      where: { id },
      data: {
        ...(body.role !== undefined ? { role: body.role } : {}),
        ...(body.organization !== undefined ? { organization: body.organization } : {}),
        ...(body.badge !== undefined ? { badge: body.badge } : {}),
        ...(body.logoType !== undefined ? { logoType: body.logoType } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.highlights !== undefined ? { highlights: body.highlights } : {}),
        ...(body.tags !== undefined ? { tags: body.tags } : {})
      }
    });

    await logPrismaAudit('UPDATE_COLLAB', 'Collaboration', `Updated collaboration "${body.organization || id}" in PostgreSQL`);
    const state = await fetchFullCMSStateFromPostgres();
    return res.json({ success: true, state });
  } catch (error) {
    console.error('[Prisma CMS] Update collaboration error:', error);
    return res.status(500).json({ error: 'Failed to update collaboration' });
  }
});

app.delete('/api/cms/collaborations/:id', requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const { id } = req.params;
    await prisma.collaboration.delete({ where: { id } });
    await logPrismaAudit('DELETE_COLLAB', 'Collaboration', `Removed collaboration "${id}" from PostgreSQL`);
    const state = await fetchFullCMSStateFromPostgres();
    return res.json({ success: true, state });
  } catch (error) {
    console.error('[Prisma CMS] Delete collaboration error:', error);
    return res.status(500).json({ error: 'Failed to delete collaboration' });
  }
});

// Partner Logos CRUD (Prisma PostgreSQL)
app.post('/api/cms/logos', requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const { name, src, alt, fileName, base64Data } = req.body || {};
    if (!name) {
      return res.status(400).json({ error: 'Partner name is required' });
    }

    let finalSrc = src || '';
    let finalFileName = fileName || `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.svg`;

    if (base64Data && typeof base64Data === 'string' && base64Data.startsWith('data:')) {
      try {
        const logosDir = path.join(process.cwd(), 'public', 'logos');
        if (!fs.existsSync(logosDir)) {
          fs.mkdirSync(logosDir, { recursive: true });
        }
        const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const buffer = Buffer.from(matches[2], 'base64');
          const safeFile = finalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
          fs.writeFileSync(path.join(logosDir, safeFile), buffer);
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
      return res.status(400).json({ error: 'Logo image source or upload is required' });
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

    await logPrismaAudit('ADD_LOGO', 'PartnerLogo', `Added partner logo "${name.trim().toUpperCase()}" in PostgreSQL`);
    const state = await fetchFullCMSStateFromPostgres();
    return res.json({ success: true, state });
  } catch (error) {
    console.error('[Prisma CMS] Create logo error:', error);
    return res.status(500).json({ error: 'Failed to create partner logo' });
  }
});

app.put('/api/cms/logos/:id', requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const { id } = req.params;
    const body = req.body;

    await prisma.partnerLogo.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.src !== undefined ? { src: body.src } : {}),
        ...(body.alt !== undefined ? { alt: body.alt } : {}),
        ...(body.active !== undefined ? { active: Boolean(body.active) } : {})
      }
    });

    await logPrismaAudit('UPDATE_LOGO', 'PartnerLogo', `Updated partner logo "${body.name || id}" in PostgreSQL`);
    const state = await fetchFullCMSStateFromPostgres();
    return res.json({ success: true, state });
  } catch (error) {
    console.error('[Prisma CMS] Update logo error:', error);
    return res.status(500).json({ error: 'Failed to update partner logo' });
  }
});

app.delete('/api/cms/logos/:id', requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const { id } = req.params;
    await prisma.partnerLogo.delete({ where: { id } });
    await logPrismaAudit('DELETE_LOGO', 'PartnerLogo', `Removed partner logo "${id}" from PostgreSQL`);
    const state = await fetchFullCMSStateFromPostgres();
    return res.json({ success: true, state });
  } catch (error) {
    console.error('[Prisma CMS] Delete logo error:', error);
    return res.status(500).json({ error: 'Failed to delete partner logo' });
  }
});

// AI Knowledge Layer CRUD (Prisma PostgreSQL)
app.put('/api/cms/knowledge', requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const incoming = req.body;
    if (!incoming || !Array.isArray(incoming.relationships)) {
      return res.status(400).json({ error: 'Invalid knowledge payload' });
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
          status: rel.status || 'confirmed'
        }
      });
    }

    await logPrismaAudit(
      'UPDATE_KNOWLEDGE',
      'KnowledgeRelationship',
      `Synchronized ${incoming.relationships.length} relationships to PostgreSQL & public/ai/profile.json`
    );
    const state = await fetchFullCMSStateFromPostgres();
    syncPublicKnowledgeProfile(state);
    return res.json({ success: true, state });
  } catch (error) {
    console.error('[Prisma CMS] Knowledge update error:', error);
    return res.status(500).json({ error: 'Failed to update knowledge layer' });
  }
});

// Contact Messages Inbox Management (Prisma PostgreSQL)
app.post('/api/cms/messages', requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const { name, email, message, status } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    await prisma.contactMessage.create({
      data: {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: String(name).trim(),
        email: String(email).trim(),
        message: String(message).trim(),
        status: status || 'unread',
        telegramDelivered: false,
        ipAddress: 'cms-console'
      }
    });

    await logPrismaAudit('CREATE_MESSAGE', 'ContactMessage', `Logged inquiry for "${name}" in PostgreSQL`);
    const state = await fetchFullCMSStateFromPostgres();
    return res.json({ success: true, state });
  } catch (error) {
    console.error('[Prisma CMS] Create message error:', error);
    return res.status(500).json({ error: 'Failed to create message in PostgreSQL' });
  }
});

app.patch('/api/cms/messages/:id', requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const { id } = req.params;
    const { status } = req.body || {};

    await prisma.contactMessage.update({
      where: { id },
      data: { status }
    });

    await logPrismaAudit('UPDATE_MESSAGE', 'ContactMessage', `Marked message ${id} as ${status} in PostgreSQL`);
    const state = await fetchFullCMSStateFromPostgres();
    return res.json({ success: true, state });
  } catch (error) {
    console.error('[Prisma CMS] Message status error:', error);
    return res.status(500).json({ error: 'Failed to update message status' });
  }
});

app.delete('/api/cms/messages/:id', requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const { id } = req.params;
    await prisma.contactMessage.delete({ where: { id } });
    await logPrismaAudit('DELETE_MESSAGE', 'ContactMessage', `Deleted message ${id} from PostgreSQL`);
    const state = await fetchFullCMSStateFromPostgres();
    return res.json({ success: true, state });
  } catch (error) {
    console.error('[Prisma CMS] Delete message error:', error);
    return res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Full Snapshot Import / Reset State in PostgreSQL
app.post('/api/cms/import', requireAdminAuth, async (req, res) => {
  try {
    await ensureDatabaseSeeded();
    const incoming = req.body as Partial<CMSState>;
    if (!incoming || !incoming.profile || !Array.isArray(incoming.projects)) {
      return res.status(400).json({ error: 'Invalid CMS state snapshot format' });
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
          category: p.category || 'system',
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
            logoType: c.logoType || 'libcode',
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
            status: rel.status || 'confirmed'
          }
        });
      }
    }

    await logPrismaAudit('IMPORT_SNAPSHOT', 'Database', 'Restored full CMS database snapshot into PostgreSQL');
    const state = await fetchFullCMSStateFromPostgres();
    syncPublicKnowledgeProfile(state);
    return res.json({ success: true, state });
  } catch (error) {
    console.error('[Prisma CMS] Import error:', error);
    return res.status(500).json({ error: 'Failed to import snapshot into PostgreSQL' });
  }
});

app.post('/api/cms/reset', requireAdminAuth, async (_req, res) => {
  try {
    await prisma.siteProfile.deleteMany({});
    await prisma.siteSettings.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.skill.deleteMany({});
    await prisma.collaboration.deleteMany({});
    await prisma.partnerLogo.deleteMany({});
    await prisma.knowledgeRelationship.deleteMany({});

    // Re-seed defaults
    const def = DEFAULT_CMS_STATE;
    await updateProfileInDb(def.profile);
    await ensureDatabaseSeeded(true);
    const state = await fetchFullCMSStateFromPostgres();
    syncPublicKnowledgeProfile(state);
    return res.json({ success: true, state });
  } catch (error) {
    console.error('[Prisma CMS] Reset error:', error);
    return res.status(500).json({ error: 'Failed to reset PostgreSQL database' });
  }
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

setInterval(() => {
  const now = Date.now();
  contactRateLimits.forEach((record, ip) => {
    if (now > record.resetTime) {
      contactRateLimits.delete(ip);
    }
  });
}, 120000);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', database: 'prisma-postgresql', time: new Date().toISOString() });
});

app.get('/api/contact/status', (_req, res) => {
  const hasToken = Boolean(process.env.TELEGRAM_BOT_TOKEN);
  const hasChatId = Boolean(process.env.TELEGRAM_CHAT_ID);
  res.json({
    configured: hasToken && hasChatId,
    cmsInboxActive: true,
    service: 'prisma-postgres+telegram'
  });
});

app.get('/api/knowledge/profile', (_req, res) => {
  const profilePath = path.join(process.cwd(), 'public', 'ai', 'profile.json');
  res.sendFile(profilePath, (err) => {
    if (err) {
      res.status(404).json({ error: 'Profile not found' });
    }
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

    let telegramDelivered = false;
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
        const response = await fetch(telegramApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: formattedTelegramMessage,
            disable_web_page_preview: true
          })
        });
        const data = (await response.json()) as { ok: boolean };
        if (response.ok && data.ok) {
          telegramDelivered = true;
        }
      } catch (tgErr) {
        console.warn('[Contact API] Telegram relay warning, saving to Prisma PostgreSQL:', tgErr);
      }
    }

    await ensureDatabaseSeeded();
    await prisma.contactMessage.create({
      data: {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: cleanName,
        email: cleanEmail,
        message: cleanMessage,
        status: 'unread',
        telegramDelivered,
        ipAddress: rawIp
      }
    });

    await logPrismaAudit('NEW_INQUIRY', 'ContactMessage', `Stored inquiry from ${cleanName} (${cleanEmail}) in PostgreSQL`);

    return res.json({
      success: true,
      message: 'Message recorded in Prisma PostgreSQL Inbox and transmitted successfully!'
    });
  } catch (error: any) {
    console.error('[Contact API] Internal error processing submission:', error);
    return res.status(500).json({
      success: false,
      error: 'An internal server error occurred while sending your message. Please try again later.'
    });
  }
});

app.get('/api/logos', async (_req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    await ensureDatabaseSeeded();
    const activeLogos = await prisma.partnerLogo.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' }
    });
    return res.json({ logos: activeLogos, count: activeLogos.length });
  } catch (error) {
    console.error('[API Logos] Error querying Prisma PostgreSQL logos:', error);
    return res.json({ logos: [], count: 0 });
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

// Start server with Vite middleware in dev or static files in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
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
    console.log(`DZt Server & Prisma PostgreSQL CMS running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export { app };
export default app;
