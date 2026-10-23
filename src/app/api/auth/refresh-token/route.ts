import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import crypto from "crypto";
import { getAuthCookieOptions } from "@/lib/auth-utils";

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

        // 2. Fetch User or Staff & Validate Token Hash
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        const hashedJti = crypto.createHash('sha256').update(jti).digest('hex');

        if (user && !user.isDisabled) {
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

            const cookieOptions = getAuthCookieOptions(req);
            response.cookies.set("kravy_auth_token", newAccessToken, cookieOptions);
            response.cookies.set("kravy_refresh_token", refreshTokenStr, cookieOptions);

            return response;
        }

        // Check if token belongs to active Staff
        const staff = await prisma.staff.findUnique({
            where: { id: userId }
        });

        if (staff && staff.status === 'active') {
            const currentMeta = (staff.privateMetadata as any) || {};
            const existingTokens = currentMeta.refreshTokens || [];

            const activeToken = existingTokens.find((t: any) => t.jtiHash === hashedJti);
            if (!activeToken || activeToken.status === "revoked") {
                return NextResponse.json({ success: false, message: "Refresh token revoked or already used" }, { status: 401 });
            }

            const newAccessToken = jwt.sign(
                {
                    staffId: staff.id,
                    userId: staff.id,
                    hotelId: staff.hotelId,
                    businessId: staff.businessId,
                    role: staff.role || "STAFF",
                    isStaff: true,
                    email: staff.email,
                    name: staff.name,
                    permissions: Array.isArray(staff.permissions) ? staff.permissions : [],
                    jtiHash: hashedJti
                },
                JWT_SECRET,
                { expiresIn: "90d" }
            );

            const response = NextResponse.json({
                success: true,
                message: "Tokens refreshed successfully"
            });

            const cookieOptions = getAuthCookieOptions(req);

            response.cookies.set("kravy_auth_token", newAccessToken, cookieOptions);
            response.cookies.set("kravy_refresh_token", refreshTokenStr, cookieOptions);
            response.cookies.set("staff_token", newAccessToken, cookieOptions);
            response.cookies.set("staff_refresh_token", refreshTokenStr, cookieOptions);

            return response;
        }

        return NextResponse.json({ success: false, message: "User not found or disabled" }, { status: 401 });

    } catch (error) {
        console.error("Custom Auth Refresh Token Error:", error);
        return NextResponse.json(
            { success: false, message: "Server error during refresh" },
            { status: 500 }
        );
    }
}
