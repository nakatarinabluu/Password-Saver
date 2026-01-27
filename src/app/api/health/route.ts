import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const status: any = {
        redis: 'UNKNOWN',
        timestamp: new Date().toISOString()
    };

    try {
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
