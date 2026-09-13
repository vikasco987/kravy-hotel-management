import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "kravy_pos_secret_key_123";

export async function POST(req: Request) {
  try {
    const admin = await getAuthUser();
    
    // 1. Safety check: Only ADMIN can impersonate
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Only Admins can impersonate users" }, { status: 403 });
    }

    const { userId, loginType } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Target User ID required" }, { status: 400 });
    }

    // 2. Fetch target user
    let targetUser;
    if (loginType === "STAFF") {
      targetUser = await prisma.staff.findUnique({ where: { id: userId } });
    } else {
      targetUser = await prisma.user.findUnique({ where: { id: userId } });
    }

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Generate token for target user
    const tokenPayload = {
      userId: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: (targetUser as any).role || (targetUser as any).accessType || "USER",
      businessId: (targetUser as any).ownerId || (targetUser as any).clerkId || (targetUser as any).businessId || "",
      isImpersonated: true,
      adminId: admin.id
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "2h" });

    // 4. Set cookie
    const cookieStore = await cookies();
    cookieStore.set("kravy_auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7200 // 2 hours
    });

    return NextResponse.json({ success: true, redirect: "/dashboard" });
  } catch (error: any) {
    console.error("IMPERSONATION ERROR:", error);
    return NextResponse.json({ error: "Impersonation failed: " + error.message }, { status: 500 });
  }
}
