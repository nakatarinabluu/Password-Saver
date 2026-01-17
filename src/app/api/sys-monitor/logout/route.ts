import { NextResponse } from "next/server";

export async function POST() {
    const response = NextResponse.json({ message: "Logged out" });

    // Destroy Cookie
    response.cookies.set("admin_session", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        expires: new Date(0), // Expire immediately
        sameSite: "strict",
    });

    return response;
}
