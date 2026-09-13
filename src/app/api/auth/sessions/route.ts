import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET() {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userModel;
    if (authUser.type === "STAFF") {
      userModel = await prisma.staff.findUnique({ where: { id: authUser.id } });
    } else {
      userModel = await prisma.user.findUnique({ where: { id: authUser.id } });
    }

    if (!userModel) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentMeta = (userModel.privateMetadata as any) || {};
    const maxSessions = currentMeta.maxSessions || 15;
    const refreshTokens = currentMeta.refreshTokens || [];

    // Sort by createdAt desc
    const sortedTokens = refreshTokens.sort((a: any, b: any) => b.createdAt - a.createdAt);

    return NextResponse.json({
      success: true,
      maxSessions,
      sessions: sortedTokens
    });
  } catch (error) {
    console.error("GET_SESSIONS_ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { maxSessions } = await req.json();

    if (typeof maxSessions !== 'number' || maxSessions < 1 || maxSessions > 50) {
      return NextResponse.json({ error: "Invalid maxSessions value" }, { status: 400 });
    }

    let userModel;
    if (authUser.type === "STAFF") {
      userModel = await prisma.staff.findUnique({ where: { id: authUser.id } });
      if (userModel) {
        await prisma.staff.update({
          where: { id: authUser.id },
          data: {
            privateMetadata: {
              ...(userModel.privateMetadata as any || {}),
              maxSessions
            }
          }
        });
      }
    } else {
      userModel = await prisma.user.findUnique({ where: { id: authUser.id } });
      if (userModel) {
        await prisma.user.update({
          where: { id: authUser.id },
          data: {
            privateMetadata: {
              ...(userModel.privateMetadata as any || {}),
              maxSessions
            }
          }
        });
      }
    }

    if (!userModel) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Max sessions updated successfully",
      maxSessions
    });
  } catch (error) {
    console.error("UPDATE_SESSIONS_ERROR:", error);
    return NextResponse.json({ error: "Failed to update session limits" }, { status: 500 });
  }
}
