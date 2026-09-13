import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Resend } from "resend";
import { getOTPEmailTemplate } from "@/lib/mail-templates";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 1. Find User
    const user = await prisma.user.findFirst({
      where: { email: email.trim().toLowerCase() }
    });

    if (!user) {
      return NextResponse.json({ error: "No account found with this email" }, { status: 404 });
    }

    // 2. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // 3. Save to DB
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: otp,
        otpExpiry
      }
    });

    // 4. Send Email
    await resend.emails.send({
      from: 'Kravy POS <auth@kravy.in>',
      to: email,
      subject: 'Reset your Kravy POS Password',
      html: getOTPEmailTemplate(user.name, otp, 'Password Reset')
    });

    return NextResponse.json({ success: true, message: "OTP sent to email" });

  } catch (error) {
    console.error("FORGOT_PASS_ERROR:", error);
    return NextResponse.json({ error: "Failed to send reset OTP" }, { status: 500 });
  }
}
