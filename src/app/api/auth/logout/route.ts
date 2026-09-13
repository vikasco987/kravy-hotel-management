import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "kravy_pos_secret_key_123";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const kravyRefreshStr = cookieStore.get("kravy_refresh_token")?.value;

    if (kravyRefreshStr) {
        try {
            const decoded: any = jwt.verify(kravyRefreshStr, JWT_SECRET, { ignoreExpiration: true });
            const { userId, jti } = decoded;

            if (userId && jti) {
                const hashedJti = crypto.createHash('sha256').update(jti).digest('hex');
                const user = await prisma.user.findUnique({ where: { id: userId } });

                if (user) {
                    const currentMeta = (user.privateMetadata as any) || {};
                    const existingTokens = currentMeta.refreshTokens || [];
                    const updatedTokens = existingTokens.filter((t: any) => t.jtiHash !== hashedJti);

                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            privateMetadata: {
                                ...currentMeta,
                                refreshTokens: updatedTokens
                            }
                        }
                    });
                }
            }
        } catch (err) {
            console.error("Logout: Failed to decode/revoke auth refresh token", err);
        }
    }

    const response = NextResponse.json({ success: true, message: "Logged out successfully" });

    // Clear authentication cookies by setting them with an expired date and maxAge 0
    response.cookies.set("kravy_auth_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      maxAge: 0,
      path: "/",
    });

    response.cookies.set("kravy_refresh_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      maxAge: 0,
      path: "/",
    });

    response.cookies.set("staff_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      maxAge: 0,
      path: "/",
    });

    response.cookies.set("staff_refresh_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("LOGOUT_ERROR:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
