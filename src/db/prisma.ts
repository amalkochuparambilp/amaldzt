import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const FALLBACK_PRISMA_POSTGRES_URL =
  'postgres://739ce7167273e9693b50f2ebcb6168685f8781fae04236f48a4cbf41c85fe538:sk_PxqeqYeRAoqSNujWlZhh-@pooled.db.prisma.io:5432/postgres?sslmode=require';

export function getActiveDatabaseUrl(): string {
  const envUrl = (process.env.DATABASE_URL || '').trim();
  return envUrl || FALLBACK_PRISMA_POSTGRES_URL;
}

declare global {
  var _prismaPgPool: pg.Pool | undefined;
  var _prismaConnectionString: string | undefined;
}

export interface DatabaseEnvMetadata {
  configured: boolean;
  envVarName: string;
  host: string;
  port: string;
  databaseName: string;
  sslMode: string;
  maskedUrl: string;
}

export function getDatabaseEnvMetadata(): DatabaseEnvMetadata {
  const rawUrl = getActiveDatabaseUrl();

  try {
    const parsed = new URL(rawUrl);
    const user = parsed.username
      ? `${parsed.username.slice(0, 6)}...${parsed.username.slice(-4)}`
      : 'user';
    const maskedPassword = parsed.password ? '••••••••••••••••' : '';
    const sslMode = parsed.searchParams.get('sslmode') || 'require';
    const dbName = parsed.pathname.replace(/^\//, '') || 'postgres';
    const port = parsed.port || '5432';
    const host = parsed.hostname || 'localhost';
    const maskedUrl = `${parsed.protocol}//${user}:${maskedPassword}@${host}:${port}/${dbName}?sslmode=${sslMode}`;

    return {
      configured: true,
      envVarName: 'DATABASE_URL (.env)',
      host: `${host}:${port}/${dbName}`,
      port,
      databaseName: dbName,
      sslMode: `SSL (${sslMode})`,
      maskedUrl
    };
  } catch {
    return {
      configured: true,
      envVarName: 'DATABASE_URL (.env)',
      host: 'pooled.db.prisma.io:5432/postgres',
      port: '5432',
      databaseName: 'postgres',
      sslMode: 'SSL (require)',
      maskedUrl: 'postgres://••••••:••••••@pooled.db.prisma.io:5432/postgres'
    };
  }
}

export function getPgPool(): pg.Pool {
  const currentUrl = getActiveDatabaseUrl();
  if (!global._prismaPgPool || global._prismaConnectionString !== currentUrl) {
    if (global._prismaPgPool) {
      global._prismaPgPool.end().catch(() => {});
    }
    global._prismaConnectionString = currentUrl;
    global._prismaPgPool = new pg.Pool({
      connectionString: currentUrl,
      ssl: currentUrl.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : undefined,
      max: 10,
      connectionTimeoutMillis: 15000
    });

    global._prismaPgPool.on('error', (err) => {
      console.error('[Prisma PG Pool] Unexpected idle client error:', err);
    });
  }
  return global._prismaPgPool;
}

export async function reloadDatabaseConnection(): Promise<void> {
  dotenv.config({ override: true });
  if (global._prismaPgPool) {
    await global._prismaPgPool.end().catch(() => {});
    global._prismaPgPool = undefined;
  }
  global._prismaConnectionString = undefined;
  getPgPool();
}

export const pgPool = new Proxy({} as pg.Pool, {
  get(_target, prop) {
    const pool = getPgPool() as any;
    const val = pool[prop];
    return typeof val === 'function' ? val.bind(pool) : val;
  }
});

interface TableConfig {
  tableName: string;
  hasUpdatedAt: boolean;
  hasCreatedAt: boolean;
  hasTimestamp: boolean;
  jsonCols: string[];
}

const DATE_COLUMNS = new Set(['updatedAt', 'createdAt', 'timestamp', 'lastLoginAt']);

function createPgModelDelegate<T = any>(config: TableConfig) {
  const { tableName, hasUpdatedAt, hasCreatedAt, hasTimestamp, jsonCols } = config;

  const normalizeRow = (row: any): T => {
    if (!row || typeof row !== 'object') return row;
    const out: Record<string, any> = { ...row };
    for (const key of Object.keys(out)) {
      const val = out[key];
      if (DATE_COLUMNS.has(key) && val !== null && val !== undefined && !(val instanceof Date)) {
        out[key] = new Date(val);
      } else if (jsonCols.includes(key) && typeof val === 'string') {
        try {
          out[key] = JSON.parse(val);
        } catch {
          // keep as string
        }
      }
    }
    return out as T;
  };

  const prepareVal = (col: string, val: any) => {
    if (jsonCols.includes(col) && val !== null && val !== undefined && typeof val !== 'string') {
      return JSON.stringify(val);
    }
    return val;
  };

  return {
    async findUnique(args: { where: Record<string, any> }): Promise<T | null> {
      const entries = Object.entries(args.where || {}).filter(([, v]) => v !== undefined);
      if (entries.length === 0) return null;
      const [col, val] = entries[0];
      const res = await getPgPool().query(
        `SELECT * FROM "${tableName}" WHERE "${col}" = $1 LIMIT 1`,
        [val]
      );
      return res.rows[0] ? normalizeRow(res.rows[0]) : null;
    },

    async findMany(args?: {
      where?: Record<string, any>;
      orderBy?: Record<string, 'asc' | 'desc'>;
      take?: number;
    }): Promise<T[]> {
      const params: any[] = [];
      let sql = `SELECT * FROM "${tableName}"`;

      const whereEntries = Object.entries(args?.where || {}).filter(([, v]) => v !== undefined);
      if (whereEntries.length > 0) {
        const clauses = whereEntries.map(([col, val], idx) => {
          params.push(prepareVal(col, val));
          return `"${col}" = $${idx + 1}`;
        });
        sql += ` WHERE ${clauses.join(' AND ')}`;
      }

      const orderEntries = Object.entries(args?.orderBy || {}).filter(([, v]) => v !== undefined);
      if (orderEntries.length > 0) {
        const [col, dir] = orderEntries[0];
        sql += ` ORDER BY "${col}" ${String(dir).toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;
      }

      if (typeof args?.take === 'number' && args.take > 0) {
        sql += ` LIMIT ${Math.floor(args.take)}`;
      }

      const res = await getPgPool().query(sql, params);
      return res.rows.map(normalizeRow);
    },

    async create(args: { data: Record<string, any> }): Promise<T> {
      const payload: Record<string, any> = { ...(args.data || {}) };
      const now = new Date();
      if (hasUpdatedAt && payload.updatedAt === undefined) {
        payload.updatedAt = now;
      }
      if (hasCreatedAt && payload.createdAt === undefined) {
        payload.createdAt = now;
      }
      if (hasTimestamp && payload.timestamp === undefined) {
        payload.timestamp = now;
      }

      const entries = Object.entries(payload).filter(([, v]) => v !== undefined);
      const cols = entries.map(([k]) => `"${k}"`).join(', ');
      const placeholders = entries.map((_, idx) => `$${idx + 1}`).join(', ');
      const values = entries.map(([k, v]) => prepareVal(k, v));

      const res = await getPgPool().query(
        `INSERT INTO "${tableName}" (${cols}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      return normalizeRow(res.rows[0]);
    },

    async update(args: { where: Record<string, any>; data: Record<string, any> }): Promise<T> {
      const whereEntries = Object.entries(args.where || {}).filter(([, v]) => v !== undefined);
      if (whereEntries.length === 0) {
        throw new Error(`Missing where clause for ${tableName}.update`);
      }
      const [whereCol, whereVal] = whereEntries[0];

      const payload: Record<string, any> = { ...(args.data || {}) };
      if (hasUpdatedAt && payload.updatedAt === undefined) {
        payload.updatedAt = new Date();
      }

      const dataEntries = Object.entries(payload).filter(([, v]) => v !== undefined);
      if (dataEntries.length === 0) {
        const existing = await this.findUnique({ where: args.where });
        if (!existing) throw new Error(`Record not found in ${tableName}`);
        return existing;
      }

      const setClauses = dataEntries.map(([k], idx) => `"${k}" = $${idx + 1}`).join(', ');
      const values = dataEntries.map(([k, v]) => prepareVal(k, v));
      values.push(whereVal);

      const res = await getPgPool().query(
        `UPDATE "${tableName}" SET ${setClauses} WHERE "${whereCol}" = $${values.length} RETURNING *`,
        values
      );
      if (!res.rows[0]) {
        throw new Error(`Record to update not found in ${tableName}`);
      }
      return normalizeRow(res.rows[0]);
    },

    async upsert(args: {
      where: Record<string, any>;
      create: Record<string, any>;
      update: Record<string, any>;
    }): Promise<T> {
      const existing = await this.findUnique({ where: args.where });
      if (existing) {
        const updateEntries = Object.entries(args.update || {}).filter(([, v]) => v !== undefined);
        if (updateEntries.length === 0) {
          return existing;
        }
        return this.update({ where: args.where, data: args.update });
      }
      return this.create({ data: { ...(args.where || {}), ...(args.create || {}) } });
    },

    async delete(args: { where: Record<string, any> }): Promise<T> {
      const whereEntries = Object.entries(args.where || {}).filter(([, v]) => v !== undefined);
      const [whereCol, whereVal] = whereEntries[0];
      const res = await getPgPool().query(
        `DELETE FROM "${tableName}" WHERE "${whereCol}" = $1 RETURNING *`,
        [whereVal]
      );
      return normalizeRow(res.rows[0]);
    },

    async deleteMany(args?: { where?: Record<string, any> }): Promise<{ count: number }> {
      const params: any[] = [];
      let sql = `DELETE FROM "${tableName}"`;
      const whereEntries = Object.entries(args?.where || {}).filter(([, v]) => v !== undefined);
      if (whereEntries.length > 0) {
        const clauses = whereEntries.map(([col, val], idx) => {
          params.push(prepareVal(col, val));
          return `"${col}" = $${idx + 1}`;
        });
        sql += ` WHERE ${clauses.join(' AND ')}`;
      }
      const res = await getPgPool().query(sql, params);
      return { count: res.rowCount || 0 };
    },

    async count(args?: { where?: Record<string, any> }): Promise<number> {
      const params: any[] = [];
      let sql = `SELECT COUNT(*)::int AS count FROM "${tableName}"`;
      const whereEntries = Object.entries(args?.where || {}).filter(([, v]) => v !== undefined);
      if (whereEntries.length > 0) {
        const clauses = whereEntries.map(([col, val], idx) => {
          params.push(prepareVal(col, val));
          return `"${col}" = $${idx + 1}`;
        });
        sql += ` WHERE ${clauses.join(' AND ')}`;
      }
      const res = await getPgPool().query(sql, params);
      return Number(res.rows[0]?.count ?? 0);
    }
  };
}

export const prisma = {
  siteProfile: createPgModelDelegate({
    tableName: 'SiteProfile',
    hasUpdatedAt: true,
    hasCreatedAt: false,
    hasTimestamp: false,
    jsonCols: []
  }),
  siteSettings: createPgModelDelegate({
    tableName: 'SiteSettings',
    hasUpdatedAt: true,
    hasCreatedAt: false,
    hasTimestamp: false,
    jsonCols: ['navConfig']
  }),
  adminUser: createPgModelDelegate({
    tableName: 'AdminUser',
    hasUpdatedAt: true,
    hasCreatedAt: true,
    hasTimestamp: false,
    jsonCols: []
  }),
  project: createPgModelDelegate({
    tableName: 'Project',
    hasUpdatedAt: true,
    hasCreatedAt: true,
    hasTimestamp: false,
    jsonCols: []
  }),
  skill: createPgModelDelegate({
    tableName: 'Skill',
    hasUpdatedAt: true,
    hasCreatedAt: true,
    hasTimestamp: false,
    jsonCols: []
  }),
  collaboration: createPgModelDelegate({
    tableName: 'Collaboration',
    hasUpdatedAt: true,
    hasCreatedAt: true,
    hasTimestamp: false,
    jsonCols: []
  }),
  partnerLogo: createPgModelDelegate({
    tableName: 'PartnerLogo',
    hasUpdatedAt: false,
    hasCreatedAt: true,
    hasTimestamp: false,
    jsonCols: []
  }),
  knowledgeRelationship: createPgModelDelegate({
    tableName: 'KnowledgeRelationship',
    hasUpdatedAt: false,
    hasCreatedAt: true,
    hasTimestamp: false,
    jsonCols: []
  }),
  contactMessage: createPgModelDelegate({
    tableName: 'ContactMessage',
    hasUpdatedAt: false,
    hasCreatedAt: true,
    hasTimestamp: false,
    jsonCols: []
  }),
  auditLog: createPgModelDelegate({
    tableName: 'AuditLog',
    hasUpdatedAt: false,
    hasCreatedAt: false,
    hasTimestamp: true,
    jsonCols: []
  }),
  async $disconnect() {
    if (global._prismaPgPool) {
      await global._prismaPgPool.end().catch(() => {});
      global._prismaPgPool = undefined;
    }
  }
};
