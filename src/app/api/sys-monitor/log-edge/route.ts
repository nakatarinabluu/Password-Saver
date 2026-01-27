import { NextResponse } from 'next/server';
import { LoggerService } from '@/services/LoggerService';

// Internal Log Dump for Edge Middleware
// Since Middleware cannot connect to Mongo (TCP), it calls this API (Node.js) to do it.

export async function POST(req: Request) {
    // 1. Verify Internal Secret (Optional but good practice to prevent spam)
    // We can check a header or just rely on the fact it's internal? 
    // Middleware can inject a secret header.
    // For now, open (obscurity) or check 'x-internal-log-secret'.

    try {
        const body = await req.json();
        const { level, message, metadata } = body;

        // 2. Write to Mongo
        await LoggerService.write(level || 'WARN', message, metadata);

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
