import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { VaultRepositoryImpl } from '@/repositories/VaultRepositoryImpl';

/**
 * SYNC WORKER ENDPOINT
 * 
 * Flushes parked Redis data to SQL Storage.
 * Triggered by GitHub Action Cron (Every 15 mins).
 */
export async function GET(req: NextRequest) {
    // 1. Auth Check
    const authHeader = req.headers.get('Authorization');
    const workerSecret = process.env.WORKER_SECRET;

    if (!workerSecret || authHeader !== `Bearer ${workerSecret}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        console.log('[SYNC WORKER] Starting Sync Job...');
        const repo = new VaultRepositoryImpl();

        // 2. Scan Redis for parked items
        // Note: 'keys' can be slow on massive DBs, but for temp_vault holding pen it's acceptable.
        // In high scale, use SCAN instead.
        const keys = await redis.keys('temp_vault:*');

        if (keys.length === 0) {
            return NextResponse.json({ status: 'Idle', synced: 0 });
        }

        let syncedCount = 0;
        let failCount = 0;

        for (const key of keys) {
            try {
                const rawData = await redis.get(key);
                if (!rawData) continue;

                const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

                // 3. Attempt Write to SQL (Force Mode)
                await repo.save(
                    data.id,
                    data.ownerHash,
                    data.encryptedBlob,
                    data.iv,
                    data.orderIndex,
                    true // forceSql = true (Do not park again if fail)
                );

                // 4. Cleanup on Success
                await redis.del(key);
                syncedCount++;

            } catch (e) {
                console.error(`[SYNC WORKER] Failed to sync key ${key}`, e);
                failCount++;
            }
        }

        return NextResponse.json({
            status: 'Complete',
            synced: syncedCount,
            failed: failCount
        });

    } catch (error) {
        console.error('[SYNC WORKER] Critical Failure', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
