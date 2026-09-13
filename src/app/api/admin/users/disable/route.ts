// src/app/api/admin/users/disable/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    // 1️⃣ Auth check
    const me = await getAuthUser();

    if (!me) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2️⃣ Verify ADMIN from DB
    if (me.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // 3️⃣ Parse request body
    const body = await req.json();
    const { targetUserId, disable, isStaffModel } = body;

    if (
      typeof targetUserId !== "string" ||
      typeof disable !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // 4️⃣ Handle Staff Model
    if (isStaffModel) {
        const staff = await prisma.staff.update({
            where: { id: targetUserId },
            data: { status: disable ? "inactive" : "active" }
        });
        
        await prisma.activityLog.create({
            data: {
                userId: me.id,
                action: disable ? "USER_DISABLED" : "USER_ENABLED",
                meta: `${disable ? "Disabled" : "Enabled"} Staff ${staff.email}`,
            },
        });

        return NextResponse.json({ success: true });
    }

    // 5️⃣ Find target user (User Model)
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // ❌ Prevent admin disabling self
    if (targetUser.id === me.id) {
      return NextResponse.json(
        { error: "You cannot disable your own account" },
        { status: 400 }
      );
    }



    // 8️⃣ Update DB status
    await prisma.user.update({
      where: { id: targetUserId },
      data: { isDisabled: disable },
    });

    // 9️⃣ Activity log
    await prisma.activityLog.create({
      data: {
        userId: me.id,
        action: disable ? "USER_DISABLED" : "USER_ENABLED",
        meta: `${disable ? "Disabled" : "Enabled"} ${targetUser.email}`,
      },
    });

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("ENABLE/DISABLE USER ERROR:", error);

    return NextResponse.json(
      { error: "Failed to update user status" },
      { status: 500 }
    );
  }
}
