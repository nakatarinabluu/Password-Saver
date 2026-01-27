import { NextResponse } from 'next/server';
import { LoggerService } from '@/services/LoggerService';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { timestamp, thread, exception, stacktrace, device, os_version, app_version } = body;

        // Capture IP from Headers
        const forwarded = request.headers.get("x-forwarded-for");
        const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1";

        // Save to MongoDB via LoggerService (Pillar 2/10 Fix)
        LoggerService.error(`CRASH: ${exception}`, {
            device,
            os_version,
            app_version, // Captured Version
            thread,
            ip, // Added IP to metadata
            stacktrace, // Already sanitized by Android Client
            originalTimestamp: timestamp
        });

        console.log(`✅ Crash Logged to Mongo: ${exception} from ${device}`);

        return NextResponse.json({ success: true, message: "Crash logged successfully" });
    } catch (error) {
        console.error("Failed to save crash log", error);
        return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
    }
}
