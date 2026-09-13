import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

export async function PUT(req: Request) {
  try {
    const me = await getAuthUser();
    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (me.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { targetUserId, role, isStaffModel } = await req.json();

    if (!["USER", "SELLER", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // 1. If it's a Staff Model entry
    if (isStaffModel) {
        const updatedStaff = await prisma.staff.update({
            where: { id: targetUserId },
            data: { 
                accessType: role === "ADMIN" ? "Full Access" : (role === "SELLER" ? "Manager Access" : "Sales Access")
            }
        });
        return NextResponse.json(updatedStaff);
    }

    // 2. If it's a User Model entry
    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { role },
    });



    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}
