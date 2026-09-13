import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "kravy_pos_secret_key_123";

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const refreshTokenStr = cookieStore.get("kravy_refresh_token")?.value;

        if (!refreshTokenStr) {
            return NextResponse.json({ success: false, message: "No refresh token provided" }, { status: 401 });
        }

        // 1. Verify Refresh Token
        let decoded: any;
        try {
            decoded = jwt.verify(refreshTokenStr, JWT_SECRET);
        } catch (err) {
            return NextResponse.json({ success: false, message: "Invalid or expired refresh token" }, { status: 401 });
        }

        const { userId, jti } = decoded;
        if (!userId || !jti) {
            return NextResponse.json({ success: false, message: "Malformed refresh token" }, { status: 401 });
        }

        // 2. Fetch User & Validate Token Hash
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user || user.isDisabled) {
            return NextResponse.json({ success: false, message: "User not found or disabled" }, { status: 401 });
        }

        const hashedJti = crypto.createHash('sha256').update(jti).digest('hex');
        const currentMeta = (user.privateMetadata as any) || {};
        const existingTokens = currentMeta.refreshTokens || [];

        // Find the token in DB
        const activeToken = existingTokens.find((t: any) => t.jtiHash === hashedJti);
        if (!activeToken || activeToken.status === "revoked") {
            return NextResponse.json({ success: false, message: "Refresh token revoked or already used" }, { status: 401 });
        }

        // 3. NO Token Rotation (Fixes race conditions on concurrent requests)
        const newAccessToken = jwt.sign(
            { 
                userId: user.id, 
                clerkId: user.ownerId || user.clerkId, 
                role: user.role,
                email: user.email,
                name: user.name,
                jtiHash: hashedJti // Keep the same hashedJti
            },
            JWT_SECRET,
            { expiresIn: "90d" }
        );

        const response = NextResponse.json({
            success: true,
            message: "Tokens refreshed successfully"
        });

        // 4. Set Cookies on the response object
        response.cookies.set("kravy_auth_token", newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 90 * 24 * 60 * 60, // 15 minutes
            path: "/",
        });
        
        response.cookies.set("kravy_refresh_token", refreshTokenStr, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 90, // 90 days
            path: "/",
        });

        return response;

    } catch (error) {
        console.error("Custom Auth Refresh Token Error:", error);
        return NextResponse.json(
            { success: false, message: "Server error during refresh" },
            { status: 500 }
        );
    }
}
