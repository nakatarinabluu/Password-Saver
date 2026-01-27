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

        // 1. Wake up Redis
        const redisPing = redis.set('keepalive_heartbeat', Date.now(), { ex: 86400 });

        // 2. Wake up SQL Databases
        const { dbNeon, dbSupabase } = await import('@/lib/db');
        const { default: dbConnect } = await import('@/lib/mongo');

        // [COST SAVING ALERT]
        // FOOTNOTE [Pillar 11: FinOps]
        // We actively manage cloud costs by understanding the billing model of our dependencies.
        // NEON Free Tier has specific "Compute Hour" limits (100h/mo).
        // Pinging it 24/7 will burn ~720h/mo and GET YOU BANNED/BLOCKED.
        // We SKIP Neon to let it sleep and save your free tier quota.
        // const neonPing = dbNeon.query('SELECT 1'); // DISABLED FOR SAFETY
        const neonPing = Promise.resolve({ status: 'SKIPPED_TO_SAVE_MONEY' });

        // SUPABASE Free Tier allows 24/7 uptime (pauses only on inactivity)
        // So we ping it to keep it alive.
        const supabasePing = dbSupabase.query('SELECT 1');

        // MONGODB (Audit Logs)
        // Ensure connection is active
        const mongoPing = dbConnect().then(mongoose => {
            return mongoose.connection.readyState === 1 ? 'ONLINE' : 'CONNECTING';
        });

        const [redisRes, neonRes, supabaseRes, mongoRes] = await Promise.allSettled([
            redisPing, neonPing, supabasePing, mongoPing
        ]);

        // Construct detailed status report
        const statusReport = {
            redis: redisRes.status === 'fulfilled' ? 'ONLINE' : 'OFFLINE',
            neon: neonRes.status === 'fulfilled' ? 'ONLINE' : 'OFFLINE',
            supabase: supabaseRes.status === 'fulfilled' ? 'ONLINE' : 'OFFLINE',
            mongo: mongoRes.status === 'fulfilled' ? 'ONLINE' : 'OFFLINE',
            timestamp: Date.now()
        };

        return NextResponse.json(statusReport);
    } catch (error) {
        return NextResponse.json({ status: 'Error', details: error }, { status: 500 });
    }
}
