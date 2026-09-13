import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Resend } from "resend";
import { getWelcomeEmailTemplate } from "@/lib/mail-templates";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const identifier = email.trim().toLowerCase();

    // 🔍 1. Find user and check OTP
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier },
          // Try to match if the user provided 10 digits but DB has +91
          { phone: { endsWith: identifier.length >= 10 ? identifier.slice(-10) : identifier } }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ error: `No account found for "${identifier}". Please signup first.` }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ message: "User already verified" }, { status: 200 });
    }

    // 🛑 2. Validate OTP and Expiry
    if (user.otpCode !== otp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    if (user.otpExpiry && new Date() > user.otpExpiry) {
      return NextResponse.json({ error: "OTP has expired" }, { status: 400 });
    }

    // ✅ 3. Mark as Verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        otpCode: null, // Clear OTP
        otpExpiry: null
      }
    });

    // 🚀 4. Send Welcome Email
    try {
      await resend.emails.send({
        from: 'Kravy POS <auth@kravy.in>',
        to: email,
        subject: 'Account Successfully Created! - Kravy POS',
        html: getWelcomeEmailTemplate(user.name, { phone: user.phone || "N/A", email: user.email })
      });
    } catch (emailErr) {
      console.error("WELCOME_EMAIL_ERROR:", emailErr);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Account verified successfully! You can now login." 
    });

  } catch (error) {
    console.error("VERIFY_OTP_ERROR:", error);
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 });
  }
}
