import { Redis } from '@upstash/redis';

// Lazy Redis wrapper clean of PG dependencies
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
    },
    exists: async (key: string) => {
        return Redis.fromEnv().exists(key);
    },
    incr: async (key: string) => {
        return Redis.fromEnv().incr(key);
    },
    expire: async (key: string, seconds: number) => {
        return Redis.fromEnv().expire(key, seconds);
    },
    keys: async (pattern: string) => {
        return Redis.fromEnv().keys(pattern);
    },
    dbsize: async () => {
        return Redis.fromEnv().dbsize();
    }
};
