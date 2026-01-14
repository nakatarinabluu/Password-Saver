import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
    return NextResponse.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        region: process.env.VERCEL_REGION || 'local'
    }, { status: 200 });
}
