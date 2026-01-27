import { dbNeon, dbSupabase, redis } from "@/lib/db";

/**
 * Performs a complete system wipe (Nuclear Option).
 * 1. Truncates Vault Data.
 * 2. Clears Logs.
 * 3. Flushes Cache.
 */
export async function nukeSystem() {
    console.warn("⚠️ SYSTEM NUKE INITIATED");

    // 1. Wipe Data (Critical)
    // 1. Wipe Data (Critical - BOTH SHARDS)
    const wipeVaultA = dbNeon.query('TRUNCATE TABLE vault_shards_a');
    const wipeVaultB = dbSupabase.query('TRUNCATE TABLE vault_shards_b');

    // 2. Wipe Logs (Evidence)
    const wipeCrash = dbNeon.query('DELETE FROM crash_logs');
    const wipeAudit = dbNeon.query('DELETE FROM audit_logs');

    // 3. Flush Cache
    const wipeRedis = redis.flushdb();

    // Execute in parallel
    await Promise.all([wipeVaultA, wipeVaultB, wipeCrash, wipeAudit, wipeRedis]);

    console.warn("✅ SYSTEM NUKE COMPLETED");
    return true;
}
