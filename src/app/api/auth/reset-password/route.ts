import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // 1. Find User & Check OTP
    const user = await prisma.user.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        otpCode: otp,
        otpExpiry: { gt: new Date() } // Not expired
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    // 2. Hash New Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Update User & Linked Accounts
    await prisma.user.updateMany({
      where: {
        OR: [
          { id: user.id },
          { email: user.email },
          { secondaryEmails: { has: user.email } },
          ...(user.phone ? [{ phone: user.phone }, { secondaryPhones: { has: user.phone } }] : [])
        ]
      },
      data: {
        password: hashedPassword,
        otpCode: null, // Clear OTP
        otpExpiry: null,
        isVerified: true // Auto-verify if they reset password
      }
    });

    return NextResponse.json({ success: true, message: "Password updated successfully" });

  } catch (error) {
    console.error("RESET_PASS_ERROR:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
