import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { getOTPEmailTemplate } from "@/lib/mail-templates";
import { sendWhatsAppOTP } from "@/lib/whatsapp-bill";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body. Please provide JSON." }, { status: 400 });
    }

    const { name, email, phone, password } = body;

    // 🛑 1. Validation
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!email?.trim()) return NextResponse.json({ error: "Email is required" }, { status: 400 });
    if (!phone?.trim()) return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length !== 10) {
      return NextResponse.json({ 
        error: `Please provide a valid 10-digit phone number. You provided ${cleanPhone.length} digits.` 
      }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    // 🔍 2. Check if user already exists
    let existingUser;
    try {
      existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: cleanEmail },
            { phone: cleanPhone }
          ]
        }
      });
    } catch (dbErr: any) {
      console.error("DB_CHECK_ERROR:", dbErr);
      return NextResponse.json({ error: "Database connection failed. Please try again later." }, { status: 500 });
    }

    if (existingUser) {
      // Check for conflicts
      if (existingUser.email === cleanEmail && existingUser.phone !== cleanPhone && existingUser.phone) {
        return NextResponse.json({ error: `This email is already linked to a different phone number (${existingUser.phone}).` }, { status: 400 });
      }
      if (existingUser.phone === cleanPhone && existingUser.email !== cleanEmail) {
        return NextResponse.json({ error: `This phone number is already linked to a different email (${existingUser.email}).` }, { status: 400 });
      }

      // Safe Retry Flow
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60000);
      const hashedPassword = await bcrypt.hash(password, 10);

      await prisma.user.update({
        where: { id: existingUser.id },
        data: { otpCode, otpExpiry, password: hashedPassword, name }
      });

      if (resend) {
        try {
          await resend.emails.send({
            from: 'Kravy POS <auth@kravy.in>',
            to: cleanEmail,
            subject: 'Verify your Kravy POS Account',
            html: getOTPEmailTemplate(name, otpCode, 'Verification', { phone: cleanPhone, email: cleanEmail })
          });
        } catch (err) {
          console.error("RETRY_EMAIL_ERROR:", err);
        }
      }

      // 📲 Also try WhatsApp
      try {
        await sendWhatsAppOTP(name, cleanPhone, otpCode);
      } catch (waErr) {
        console.error("RETRY_WHATSAPP_ERROR:", waErr);
      }

      return NextResponse.json({ 
        message: "Account already exists. A new OTP has been sent for verification.",
        needsVerification: true,
        email: cleanEmail 
      });
    }

    // 🔐 3. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const customClerkId = `custom_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // 📧 4. Create User
    const user = await prisma.user.create({
      data: {
        name,
        email: cleanEmail,
        phone: cleanPhone,
        password: hashedPassword,
        clerkId: customClerkId,
        otpCode: otp,
        otpExpiry,
        isVerified: false,
        role: "USER"
      }
    });

    // 🚀 5. Send OTP
    if (resend) {
      try {
        await resend.emails.send({
          from: 'Kravy POS <auth@kravy.in>', 
          to: cleanEmail,
          subject: 'Verify your Kravy POS Account',
          html: getOTPEmailTemplate(name, otp, 'Verification', { phone: cleanPhone, email: cleanEmail })
        });
      } catch (emailErr) {
        console.error("SIGNUP_EMAIL_ERROR:", emailErr);
      }
    }

    // 📲 6. Send WhatsApp OTP
    let whatsappSent = false;
    try {
      const waRes = await sendWhatsAppOTP(name, cleanPhone, otp);
      whatsappSent = waRes.success;
    } catch (waErr) {
      console.error("SIGNUP_WHATSAPP_ERROR:", waErr);
    }

    const message = [];
    if (resend) message.push("Email");
    if (whatsappSent) message.push("WhatsApp");

    return NextResponse.json({ 
      success: true, 
      message: message.length > 0 
        ? `OTP sent via ${message.join(" and ")}` 
        : "Account created (OTP sent to console logs)",
      userId: user.id 
    });

  } catch (error: any) {
    console.error("REGISTER_CATCH_ERROR:", error);
    return NextResponse.json({ 
      error: "Registration crashed: " + (error.message || "Unknown error"),
      details: String(error)
    }, { status: 500 });
  }
}
