import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
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
  var _prismaClient: PrismaClient | undefined;
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

export function getPrisma(): PrismaClient {
  const currentUrl = getActiveDatabaseUrl();
  if (!global._prismaClient || global._prismaConnectionString !== currentUrl) {
    const pool = getPgPool();
    const adapter = new PrismaPg(pool);
    global._prismaClient = new PrismaClient({ adapter });
  }
  return global._prismaClient;
}

export async function reloadDatabaseConnection(): Promise<void> {
  dotenv.config({ override: true });
  if (global._prismaClient) {
    await global._prismaClient.$disconnect().catch(() => {});
    global._prismaClient = undefined;
  }
  if (global._prismaPgPool) {
    await global._prismaPgPool.end().catch(() => {});
    global._prismaPgPool = undefined;
  }
  global._prismaConnectionString = undefined;
  getPrisma();
}

export const pgPool = new Proxy({} as pg.Pool, {
  get(_target, prop) {
    const pool = getPgPool() as any;
    const val = pool[prop];
    return typeof val === 'function' ? val.bind(pool) : val;
  }
});

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma() as any;
    const val = client[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  }
});
