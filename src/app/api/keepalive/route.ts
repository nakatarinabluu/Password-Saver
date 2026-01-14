import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    // SECURITY: Authenticate the cron job
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const redis = Redis.fromEnv();
        // Lightweight Operation: Just update a timestamp key
        await redis.set('keepalive_heartbeat', Date.now(), { ex: 86400 });

        return NextResponse.json({ status: 'Alive', timestamp: Date.now() });
    } catch (error) {
        return NextResponse.json({ status: 'Error', details: error }, { status: 500 });
    }
}
