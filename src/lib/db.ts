import { Pool, QueryResultRow } from '@neondatabase/serverless';
import { Pool as PgPool } from 'pg';
import { Redis } from '@upstash/redis';

// Lazy Initialization for connections
let poolNeon: Pool | null = null;
let poolSupabase: PgPool | null = null;

const getPoolNeon = () => {
  if (!poolNeon) {
    if (!process.env.NEON_DATABASE_URL) {
      // Warn but don't crash at module load time (allows build to pass)
      console.warn('NEON_DATABASE_URL is not defined');
    }
    poolNeon = new Pool({
      connectionString: process.env.NEON_DATABASE_URL,
    });
  }
  return poolNeon;
};

const getPoolSupabase = () => {
  if (!poolSupabase) {
    if (!process.env.SUPABASE_DATABASE_URL) {
      console.warn('SUPABASE_DATABASE_URL is not defined - Shard B will be unavailable');
    }
    poolSupabase = new PgPool({
      connectionString: process.env.SUPABASE_DATABASE_URL,
    });
  }
  return poolSupabase;
};

export const dbNeon = {
  query: async <T extends QueryResultRow = any>(text: string, params?: (string | number | boolean | null | any[])[]) => {
    const pool = getPoolNeon();
    if (!pool) throw new Error("Neon Configuration Missing");
    return pool.query<T>(text, params);
  },
};

export const dbSupabase = {
  query: async <T extends QueryResultRow = any>(text: string, params?: (string | number | boolean | null | any[])[]) => {
    const pool = getPoolSupabase();
    if (!pool) throw new Error("Supabase Configuration Missing");
    return pool.query<T>(text, params);
  },
};

// Re-export Redis from clean module
export { redis } from './redis';

