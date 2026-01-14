import { NextRequest, NextResponse } from 'next/server';
import { db, redis } from '@/lib/db';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const wipeToken = req.headers.get('x-wipe-token');
        const validWipeToken = process.env.X_WIPE_TOKEN;

        if (!validWipeToken) {
            console.error('CRITICAL: X_WIPE_TOKEN is not configured on server');
            return NextResponse.json({ error: 'Server Configuration Error' }, { status: 500 });
        }

        // Constant-time check preferred but string strict equality okay for token provided sufficient length/entropy
        if (!wipeToken || wipeToken !== validWipeToken) {
            // Enterprise: Log unauthorized attempt
            const ip = (req as any).ip || req.headers.get('x-forwarded-for') || 'unknown';
            console.warn(`[SECURITY] Invalid Wipe Token from IP: ${ip}`);
            return NextResponse.json(null, { status: 403, statusText: 'Forbidden' });
        }

        // 1. Truncate Neon Table
        const wipeNeon = db.query('TRUNCATE TABLE vault_shards_a');

        // 2. Flush Redis
        const wipeRedis = redis.flushdb();

        await Promise.all([wipeNeon, wipeRedis]);

        const ip = (req as any).ip || req.headers.get('x-forwarded-for') || 'unknown';
        console.warn(`[CRITICAL] SYSTEM WIPE INITIATED BY IP: ${ip}`);

        return NextResponse.json({ message: 'System Wiped' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
