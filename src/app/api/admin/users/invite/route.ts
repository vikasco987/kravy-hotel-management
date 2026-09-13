import { getEffectiveClerkId } from "@/lib/auth-utils";
// src/app/api/admin/users/invite/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // 🔐 Auth (App Router safe)
    const userId = await getEffectiveClerkId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 🔐 Admin check (DB is source of truth)
    const me = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    });

    if (!me || me.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // 📦 Parse body
    const body = await req.json();
    const { email, role } = body;

    if (
      typeof email !== "string" ||
      !["USER", "SELLER", "ADMIN"].includes(role)
    ) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }
// Invitations are disabled in custom auth for now
return NextResponse.json({ error: "Invitations are not supported in Custom Auth mode yet." }, { status: 400 });
    // 🧾 Audit log
    await prisma.activityLog.create({
      data: {
        userId: me.id,
        action: "USER_INVITED",
        meta: `Invited ${email} as ${role}`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        invitationId: invite.id,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("INVITE USER ERROR:", error);

    if (error?.status === 422) {
      return NextResponse.json(
        {
          error:
            "Invitation failed. Email may already exist or invitations are disabled in Clerk.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { error: "Failed to invite user" },
      { status: 500 }
    );
  }
}
