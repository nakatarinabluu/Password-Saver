import { Pool, QueryResultRow } from '@neondatabase/serverless';
import { Redis } from '@upstash/redis';

// Use Lazy Initialization for connections to prevent build-time crashes
// when environment variables are missing (common in CI/CD).

let pool: Pool | null = null;

const getPool = () => {
  if (!pool) {
    if (!process.env.NEON_DATABASE_URL) {
      throw new Error('NEON_DATABASE_URL is not defined');
    }
    pool = new Pool({
      connectionString: process.env.NEON_DATABASE_URL,
    });
  }
  return pool;
};

export const db = {
  query: async <T extends QueryResultRow = any>(text: string, params?: (string | number | boolean | null)[]) => {
    return getPool().query<T>(text, params);
  },
};

// Lazy Redis wrapper
export const redis = {
  get: async (key: string) => {
    return Redis.fromEnv().get(key);
  },
  set: async (key: string, value: any, opts?: any) => {
    return Redis.fromEnv().set(key, value, opts);
  },
  del: async (key: string) => {
    return Redis.fromEnv().del(key);
  },
  mget: async <TData extends unknown[] = any[]>(...keys: string[]) => {
    return Redis.fromEnv().mget<TData>(...keys);
  },
  flushdb: async () => {
    return Redis.fromEnv().flushdb();
  },
  ping: async () => {
    return Redis.fromEnv().ping();
  }
};

