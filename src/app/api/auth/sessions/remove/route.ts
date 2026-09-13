import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jtiHash } = await req.json();

    if (!jtiHash) {
      return NextResponse.json({ error: "Missing jtiHash" }, { status: 400 });
    }

    let userModel;
    if (authUser.type === "STAFF") {
      userModel = await prisma.staff.findUnique({ where: { id: authUser.id } });
      if (userModel) {
        const currentMeta = (userModel.privateMetadata as any) || {};
        const existingTokens = currentMeta.refreshTokens || [];
        const updatedTokens = existingTokens.filter((t: any) => t.jtiHash !== jtiHash);
        
        await prisma.staff.update({
          where: { id: authUser.id },
          data: {
            privateMetadata: {
              ...currentMeta,
              refreshTokens: updatedTokens
            }
          }
        });
      }
    } else {
      userModel = await prisma.user.findUnique({ where: { id: authUser.id } });
      if (userModel) {
        const currentMeta = (userModel.privateMetadata as any) || {};
        const existingTokens = currentMeta.refreshTokens || [];
        const updatedTokens = existingTokens.filter((t: any) => t.jtiHash !== jtiHash);
        
        await prisma.user.update({
          where: { id: authUser.id },
          data: {
            privateMetadata: {
              ...currentMeta,
              refreshTokens: updatedTokens
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
      message: "Session permanently removed"
    });
  } catch (error) {
    console.error("REMOVE_SESSION_ERROR:", error);
    return NextResponse.json({ error: "Failed to remove session" }, { status: 500 });
  }
}
