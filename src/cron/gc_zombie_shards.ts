import { dbNeon, dbSupabase } from '@/lib/db';

/**
 * ZOMBIE SHARD GARBAGE COLLECTOR
 * 
 * Purpose: Finds and deletes "PENDING" records that failed to activate within 15 minutes.
 * Frequency: Run every 5-10 minutes via Cron.
 */
export async function cleanupZombies() {
    console.log('[GC] Starting Zombie Cleanup...');

    try {
        // 1. Find Stale PENDING records in Neon (Timeout > 15m)
        const result = await dbNeon.query(
            `SELECT id FROM vault_shards_a 
             WHERE status = 'PENDING' 
             AND cleanup_timestamp < NOW()`
            // Note: cleanup_timestamp defaults to NOW() + 15m, so we check if it is in the past.
        );

        const zombies = result.rows.map((r: any) => r.id);

        if (zombies.length === 0) {
            console.log('[GC] System Clean. No zombies found.');
            return;
        }

        console.log(`[GC] Found ${zombies.length} zombies. Exterminating... IDs: ${zombies.slice(0, 5)}...`);

        // 2. Kill Supabase Replicas first
        // (Always clean secondary first to avoid creating orphans if *this* script crashes)
        // Using 'ANY' operator for efficient bulk delete
        await dbSupabase.query(
            `DELETE FROM vault_shards_b WHERE id = ANY($1::uuid[])`,
            [zombies]
        );

        // 3. Kill Neon Primary
        await dbNeon.query(
            `DELETE FROM vault_shards_a WHERE id = ANY($1::uuid[])`,
            [zombies]
        );

        console.log('[GC] Extermination Complete. Space Reclaimed.');

    } catch (error) {
        console.error('[GC] Critical Failure during Cleanup', error);
    }
}
