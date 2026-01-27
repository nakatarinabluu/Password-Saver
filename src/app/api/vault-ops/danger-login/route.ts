import { NextResponse } from 'next/server';
import { authenticator } from '@otplib/preset-default';
import { createHmac } from "crypto";

export async function POST(req: Request) {
    try {
        let { username, password, pin } = await req.json();
        username = username?.trim();
        password = password?.trim();
        pin = pin?.trim();

        // 1. Verify Gate 2 Credentials (User + Pass)
        const validUser = process.env.GATE_2_USER;
        const validPass = process.env.GATE_2_PASSWORD;

        if (!validUser || !validPass) {
            console.error("Server Misconfiguration: Missing Gate 2 Env Vars");
            return new NextResponse("Server Error", { status: 500 });
        }

        if (username !== validUser || password !== validPass) {
            console.error(`FAIL: Gate 2 Auth Mismatch for user '${username}'`);
            return new NextResponse("Invalid Gate 2 Credentials", { status: 401 });
        }

        // 2. Verify DANGER TOTP (Dynamic Only)
        // User explicitly trusts TOTP. Static PIN fallback removed.
        const totpSecret = process.env.GATE_2_SECRET;

        if (!totpSecret) {
            console.error("Missing Security Secrets (TOTP)");
            return new NextResponse("Server Config Error", { status: 500 });
        }

        let isAuthorized = false;

        try {
            // authenticator.check handles the window verification
            if (authenticator.check(pin, totpSecret)) {
                isAuthorized = true;
                console.log(`[DANGER] Authorized via TOTP`);
            }
        } catch (e) {
            // Invalid TOTP format
        }

        if (!isAuthorized) {
            console.error(`FAIL: Invalid TOTP. Input: ${pin}`);
            return new NextResponse("Invalid Danger Code", { status: 401 });
        }

        // 3. Success -> Set Cookie
        // SECURITY UPGRADE: BLIND IP HASHING
        const ip = req.headers.get("x-forwarded-for") || "unknown";
        const privacyHash = createHmac('sha256', totpSecret).update(ip).digest('hex');

        const response = new NextResponse("Unlocked", { status: 200 });
        response.cookies.set('danger_zone_token', privacyHash, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 300,
            path: '/'
        });

        return response;

    } catch (error) {
        return new NextResponse("Error", { status: 500 });
    }
}
