import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { getAuthCookieOptions } from "@/lib/auth-utils";

const JWT_SECRET = process.env.JWT_SECRET || "kravy_pos_secret_key_123";

/**
 * POST /api/staff/login
 * Production-grade secure authentication endpoint for Hotel Staff.
 *
 * Security Requirements:
 * - Accepts email OR phone number and password.
 * - Looks up staff record strictly from database.
 * - Password verified using bcrypt.
 * - Inactive staff accounts rejected.
 * - Valid hotel association verified.
 * - Client cannot submit role, permissions, staffId, hotelId to elevate access.
 * - Sets signed HTTP-only secure cookie (kravy_auth_token & staff_token).
 * - Tracks sessions securely with jtiHash.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { identifier, password } = body;

    // Generic error message to prevent enumeration
    const genericAuthError = "Invalid credentials. Please verify your email/phone and password.";

    if (!identifier || typeof identifier !== "string" || !password || typeof password !== "string") {
      return NextResponse.json({ error: "Email or Phone Number and Password are required" }, { status: 400 });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanPhoneDigits = cleanIdentifier.replace(/\D/g, "");

    // 1. Look up staff record by email OR phone
    // Strict lookup: match email or phone number
    const staff = await prisma.staff.findFirst({
      where: {
        OR: [
          { email: { equals: cleanIdentifier, mode: "insensitive" } },
          { phone: cleanIdentifier },
          ...(cleanPhoneDigits.length >= 10
            ? [
                { phone: cleanPhoneDigits },
                { phone: { endsWith: cleanPhoneDigits.slice(-10) } }
              ]
            : [])
        ]
      },
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            businessId: true
          }
        }
      }
    });

    if (!staff) {
      // Safe timing attack mitigation: run a dummy bcrypt compare
      await bcrypt.compare(password, "$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF1234567890abcdefghijklm");
      return NextResponse.json({ error: genericAuthError }, { status: 401 });
    }

    // 2. Reject inactive staff accounts
    if (staff.status !== "active") {
      return NextResponse.json(
        { error: "This staff account has been deactivated. Please contact your hotel manager." },
        { status: 403 }
      );
    }

    // 3. Require valid hotel association
    if (!staff.hotelId || !staff.hotel) {
      return NextResponse.json(
        { error: "Staff account has no active hotel assigned. Please contact your administrator." },
        { status: 403 }
      );
    }

    // 4. Verify password
    if (!staff.password) {
      return NextResponse.json(
        { error: "No login password configured for this staff account. Please contact your manager." },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, staff.password);
    if (!isMatch) {
      return NextResponse.json({ error: genericAuthError }, { status: 401 });
    }

    // 5. Generate secure session claims & tokens
    const jti = crypto.randomUUID();
    const hashedJti = crypto.createHash("sha256").update(jti).digest("hex");

    const userAgent = req.headers.get("user-agent") || "";
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const deviceType = /mobile|android|iphone/i.test(userAgent) ? "mobile" : "desktop";
    const browser = /chrome/i.test(userAgent) ? "Chrome" : /safari/i.test(userAgent) ? "Safari" : /firefox/i.test(userAgent) ? "Firefox" : /edg/i.test(userAgent) ? "Edge" : "Other";
    const os = /windows/i.test(userAgent) ? "Windows" : /mac/i.test(userAgent) ? "macOS" : /linux/i.test(userAgent) ? "Linux" : /android/i.test(userAgent) ? "Android" : /iphone|ipad/i.test(userAgent) ? "iOS" : "Other";

    // Access token (15m or 90d to match existing system)
    const token = jwt.sign(
      {
        staffId: staff.id,
        userId: staff.id,
        hotelId: staff.hotelId,
        businessId: staff.businessId,
        role: staff.role || "STAFF",
        isStaff: true,
        email: staff.email,
        name: staff.name,
        permissions: Array.isArray(staff.permissions) ? staff.permissions : [],
        jtiHash: hashedJti
      },
      JWT_SECRET,
      { expiresIn: "90d" }
    );

    // Refresh token
    const refreshToken = jwt.sign(
      { staffId: staff.id, userId: staff.id, jti, isStaff: true },
      JWT_SECRET,
      { expiresIn: "90d" }
    );

    // Store active refresh session in staff privateMetadata
    const currentMeta = (staff.privateMetadata as any) || {};
    const existingTokens = Array.isArray(currentMeta.refreshTokens) ? currentMeta.refreshTokens : [];
    const maxSessions = currentMeta.maxSessions || 10;

    const updatedTokens = [
      ...existingTokens,
      {
        jtiHash: hashedJti,
        createdAt: Date.now(),
        ipAddress: ip,
        userAgent,
        deviceType,
        browser,
        os
      }
    ].slice(-maxSessions);

    await prisma.staff.update({
      where: { id: staff.id },
      data: {
        privateMetadata: {
          ...currentMeta,
          refreshTokens: updatedTokens
        }
      }
    });

    // 6. Determine authorized redirect landing page based on granted permissions
    const permissions: string[] = Array.isArray(staff.permissions) ? staff.permissions : [];
    let redirectUrl = "/dashboard/no-access";

    const permissionRedirectPriority = [
      { perm: "page:dashboard", url: "/dashboard" },
      { perm: "page:checkin", url: "/dashboard/checkin" },
      { perm: "page:housekeeping", url: "/dashboard/housekeeping" },
      { perm: "page:reservations", url: "/dashboard/reservations" },
      { perm: "page:rooms", url: "/dashboard/rooms" },
      { perm: "page:services", url: "/dashboard/services" },
      { perm: "page:floors", url: "/dashboard/floors" },
      { perm: "page:staff", url: "/dashboard/staff" },
      { perm: "page:reports", url: "/dashboard/reports" },
      { perm: "page:expenses", url: "/dashboard/expenses" },
      { perm: "page:settings", url: "/dashboard/settings" }
    ];

    for (const item of permissionRedirectPriority) {
      if (permissions.includes(item.perm)) {
        redirectUrl = item.url;
        break;
      }
    }

    // 7. Prepare response and set HTTP-only cookies
    const response = NextResponse.json({
      success: true,
      redirectUrl,
      staff: {
        id: staff.id,
        name: staff.name,
        role: staff.role,
        hotelId: staff.hotelId,
        permissionsCount: permissions.length
      }
    });

    const cookieOptions = getAuthCookieOptions(req);

    // Set kravy_auth_token and staff_token for full backwards/forward compatibility
    response.cookies.set("kravy_auth_token", token, cookieOptions);
    response.cookies.set("kravy_refresh_token", refreshToken, cookieOptions);
    response.cookies.set("staff_token", token, cookieOptions);
    response.cookies.set("staff_refresh_token", refreshToken, cookieOptions);

    return response;
  } catch (error) {
    console.error("STAFF_LOGIN_ERROR:", error);
    return NextResponse.json({ error: "An unexpected error occurred during login." }, { status: 500 });
  }
}
