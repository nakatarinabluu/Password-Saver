import { NextRequest, NextResponse } from 'next/server';
import { db, redis } from '@/lib/db';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const status = {
        neon: 'UNKNOWN',
        redis: 'UNKNOWN',
        timestamp: new Date().toISOString()
    };

    try {
        // Check Neon (Postgres)
        const startNeon = performance.now();
        await db.query('SELECT 1');
        const endNeon = performance.now();
        status.neon = `OK (${(endNeon - startNeon).toFixed(2)}ms)`;

        // Check Redis
        const startRedis = performance.now();
        await redis.ping();
        const endRedis = performance.now();
        status.redis = `OK (${(endRedis - startRedis).toFixed(2)}ms)`;

        return NextResponse.json(status, { status: 200 });

    } catch (error: any) {
        console.error('Health Check Failed:', error);
        return NextResponse.json({
            ...status,
            error: error.message || 'Connectivity Check Failed'
        }, { status: 500 });
    }
}
