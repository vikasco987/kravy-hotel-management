import { getAuthUser } from "@/lib/auth-utils";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      id: authUser.id,
      name: authUser.name,
      email: authUser.email,
      role: authUser.role,
      type: authUser.type,
      isStaff: !!authUser.isStaff,
      permissions: authUser.permissions || [],
      hotelId: authUser.hotelId,
      status: authUser.status || "active"
    });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
