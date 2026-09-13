import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Find User
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ error: "Account already verified" }, { status: 400 });
    }

    // 2. Generate New OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: otp,
        otpExpiry: otpExpiry
      }
    });

    // 3. Send Email
    await resend.emails.send({
      from: "Kravy POS <onboarding@resend.dev>",
      to: cleanEmail,
      subject: "Verify your Kravy POS Account",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 24px;">
          <h1 style="color: #0f172a; font-weight: 800; tracking: -0.05em;">Verify your account</h1>
          <p style="color: #64748b; font-size: 16px;">Welcome back! Use the following code to verify your account:</p>
          <div style="background: #f8fafc; padding: 24px; border-radius: 16px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: 900; letter-spacing: 0.5em; color: #10b981;">${otp}</span>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">This code will expire in 10 minutes. If you didn't request this, you can ignore this email.</p>
        </div>
      `
    });

    return NextResponse.json({ success: true, message: "OTP resent successfully" });

  } catch (error) {
    console.error("RESEND_OTP_ERROR:", error);
    return NextResponse.json({ error: "Failed to resend OTP" }, { status: 500 });
  }
}
