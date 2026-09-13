import prisma from './prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { cache } from 'react';

const JWT_SECRET = process.env.JWT_SECRET || "kravy_pos_secret_key_123";

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
    permissions: string[];
    name?: string;
    email?: string;
    role?: string; 
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
                select: { id: true, role: true, ownerId: true, clerkId: true, allowedPaths: true, name: true, email: true, privateMetadata: true }
            });
            
            if (user) {
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
                    businessId: user.ownerId || user.clerkId || "",
                    permissions: user.allowedPaths,
                    name: user.name,
                    email: user.email,
                    role: user.role
                };
            }

            // Fallback for legacy staff model if not in User table
            const staff = await prisma.staff.findUnique({ 
                where: { id: userId },
                select: { id: true, accessType: true, businessId: true, permissions: true, name: true, email: true, privateMetadata: true }
            });
            if (staff) {
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
                    type: (staff.accessType as any) || 'STAFF',
                    businessId: staff.businessId || "",
                    permissions: staff.permissions || [],
                    name: staff.name,
                    email: staff.email,
                    role: 'STAFF'
                };
            }
        } catch (err) {
            return null;
        }
    }

    return null;
});
