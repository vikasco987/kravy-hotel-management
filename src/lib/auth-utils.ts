import prisma from './prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { cache } from 'react';

const JWT_SECRET = process.env.JWT_SECRET || "kravy_pos_secret_key_123";

/**
 * Determines whether cookies should have the `Secure` flag set.
 *
 * Defaults to true in production ONLY if:
 * 1. An incoming request explicitly indicates HTTPS via `x-forwarded-proto === 'https'` or `url.protocol === 'https:'`, OR
 * 2. `COOKIE_SECURE` is explicitly set to 'true'.
 *
 * If `COOKIE_SECURE` is explicitly 'false', or if deployed over plain HTTP (such as an EC2 IP
 * like http://13.206.229.179 behind standard HTTP Nginx/PM2), the `Secure` attribute is omitted.
 * This prevents modern browsers from silently dropping Set-Cookie over HTTP.
 */
export function isSecureCookie(req?: { headers?: Headers | { get(name: string): string | null } }): boolean {
  if (process.env.COOKIE_SECURE === "false") {
    return false;
  }
  if (process.env.COOKIE_SECURE === "true") {
    return true;
  }
  if (process.env.NODE_ENV !== "production") {
    return false;
  }
  // In production, check forwarded proto if available
  if (req?.headers) {
    const proto = typeof req.headers.get === "function" ? req.headers.get("x-forwarded-proto") : null;
    if (proto) {
      return proto.split(",")[0].trim().toLowerCase() === "https";
    }
  }
  // If NEXTAUTH_URL or APP_URL is configured with http://, respect HTTP
  const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (appUrl && appUrl.startsWith("http://")) {
    return false;
  }
  return false;
}

/**
 * Returns the standard cookie options for auth and refresh tokens.
 */
export function getAuthCookieOptions(req?: { headers?: Headers | { get(name: string): string | null } }, maxAgeSeconds = 90 * 24 * 60 * 60) {
  return {
    httpOnly: true,
    secure: isSecureCookie(req),
    sameSite: "lax" as const,
    maxAge: maxAgeSeconds,
    path: "/"
  };
}

/**
 * Returns the effective Clerk ID (the Owner's ID) for the current user.
 * Works for both Owners and Staff.
 * Supports Admin Impersonation (View-As) via 'x-impersonate-id' header or search params.
 */
export async function getEffectiveClerkId(): Promise<string | null> {
  const authUser = await getAuthUser();
  if (!authUser) return null;

  // Check for impersonation if user is ADMIN
  if (authUser.role === "ADMIN") {
    const headersList = await (await import('next/headers')).headers();
    const headerImpersonateId = headersList.get('x-impersonate-id');
    if (headerImpersonateId) {
      console.log("🎯 [getEffectiveClerkId] Admin impersonating via header:", headerImpersonateId);
      return headerImpersonateId;
    }
    const referer = headersList.get('referer') || 'http://localhost';
    const { searchParams } = new URL(referer);
    const impersonateId = searchParams.get('asUserId');
    if (impersonateId) {
      console.log("🎯 [getEffectiveClerkId] Admin impersonating via referer:", impersonateId);
      return impersonateId;
    }
  }

  return authUser.businessId || authUser.id;
}

export type AuthUser = {
    id: string;
    type: 'ADMIN' | 'SELLER' | 'STAFF' | 'OWNER' | 'USER';
    businessId: string;
    hotelId?: string;
    permissions: string[];
    name?: string;
    email?: string;
    role?: string;
    isStaff?: boolean;
    status?: string;
}

/**
 * High-level auth check to determine who is making the request.
 * Cached to prevent redundant DB queries and JWT verification during a single render cycle.
 */
export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
    const cookieStore = await cookies();
    const token = cookieStore.get('kravy_auth_token')?.value || cookieStore.get('staff_token')?.value;

    if (token) {
        try {
            const decoded: any = jwt.verify(token, JWT_SECRET);
            const userId = decoded.userId || decoded.staffId;

            // 🔍 ALWAYS FETCH LATEST DATA FROM DB (Sync Fix)
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, role: true, ownerId: true, clerkId: true, allowedPaths: true, name: true, email: true, privateMetadata: true, businessId: true, isDisabled: true }
            });

            if (user) {
                // If user account is disabled, deny
                if (user.isDisabled) {
                    return null;
                }

                // 🛑 Enforce session revocation via jtiHash for immediate logout
                if (decoded.jtiHash) {
                    const refreshTokens = (user.privateMetadata as any)?.refreshTokens || [];
                    const activeToken = refreshTokens.find((t: any) => t.jtiHash === decoded.jtiHash);
                    if (!activeToken || activeToken.status === "revoked") {
                        return null; // Session revoked
                    }
                }

                // Fallback global revocation check
                const revokedAt = (user.privateMetadata as any)?.sessionsRevokedAt;
                if (revokedAt && decoded.iat && (decoded.iat * 1000) < revokedAt) {
                    return null;
                }

                return {
                    id: user.id,
                    type: user.role as 'ADMIN' | 'SELLER' | 'STAFF' | 'OWNER' | 'USER',
                    businessId: user.businessId || user.ownerId || "",
                    permissions: user.allowedPaths,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isStaff: false,
                    status: 'active'
                };
            }

            // Fallback for staff model
            const staff = await prisma.staff.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    hotelId: true,
                    role: true,
                    accessType: true,
                    businessId: true,
                    permissions: true,
                    name: true,
                    email: true,
                    status: true,
                    privateMetadata: true
                }
            });
            if (staff) {
                // Enforce active status
                if (staff.status !== 'active') {
                    return null;
                }

                if (decoded.jtiHash) {
                    const refreshTokens = (staff.privateMetadata as any)?.refreshTokens || [];
                    const activeToken = refreshTokens.find((t: any) => t.jtiHash === decoded.jtiHash);
                    if (!activeToken || activeToken.status === "revoked") {
                        return null; // Session revoked
                    }
                }

                const revokedAt = (staff.privateMetadata as any)?.sessionsRevokedAt;
                if (revokedAt && decoded.iat && (decoded.iat * 1000) < revokedAt) {
                    return null;
                }

                return {
                    id: staff.id,
                    type: 'STAFF',
                    businessId: staff.businessId || "",
                    hotelId: staff.hotelId,
                    permissions: staff.permissions || [],
                    name: staff.name,
                    email: staff.email || undefined,
                    role: staff.role || 'STAFF',
                    isStaff: true,
                    status: staff.status
                };
            }
        } catch (err) {
            return null;
        }
    }

    return null;
});
