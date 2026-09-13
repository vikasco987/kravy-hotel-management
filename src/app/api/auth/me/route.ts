import { getEffectiveClerkId } from "@/lib/auth-utils";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await getEffectiveClerkId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        clerkId: true,
        role: true,
        name: true,
        email: true,
        allowedPaths: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
