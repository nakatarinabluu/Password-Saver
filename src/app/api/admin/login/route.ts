import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function POST(req: NextRequest) {
    const ip = (req as any).ip || req.headers.get('x-forwarded-for') || '127.0.0.1';

    // TRIGGER THE TRAP
    // Ban IP for 24 hours (86400 seconds)
    await redis.set(`ban:${ip}`, 'true', { ex: 86400 });

    // Log the capture (Optional)
    await redis.incr('honeypot_captures');

    // Return standard failure to maintain illusion
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}
