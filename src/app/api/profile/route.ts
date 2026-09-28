import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =============================
   GET BUSINESS PROFILE
============================= */
async function ensureValidDates() {
  try {
    // We execute a raw MongoDB update command to fix null/missing fields directly in the DB
    // without fetching them to the client (which prevents type-conversion serialization crashes).
    await prisma.$runCommandRaw({
      update: "BusinessProfile",
      updates: [
        {
          q: { 
            $or: [ 
              { createdAt: null }, 
              { createdAt: { $exists: false } } 
            ] 
          },
          u: { 
            $set: { createdAt: { $date: new Date().toISOString() } } 
          },
          multi: true
        }
      ]
    });

    await prisma.$runCommandRaw({
      update: "BusinessProfile",
      updates: [
        {
          q: { 
            $or: [ 
              { updatedAt: null }, 
              { updatedAt: { $exists: false } } 
            ] 
          },
          u: { 
            $set: { updatedAt: { $date: new Date().toISOString() } } 
          },
          multi: true
        }
      ]
    });
    console.log("✨ Self-healed BusinessProfile dates.");
  } catch (err) {
    console.error("⚠️ Self-healing BusinessProfile dates failed:", err);
  }
}

export async function GET(request: Request) {
  try {
    const effectiveId = await getEffectiveClerkId();

    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let profile = null;
    try {
      profile = await prisma.businessProfile.findFirst({
        where: { userId: effectiveId },
      });

      const user = await prisma.user.findUnique({
        where: { clerkId: effectiveId }
      });
      if (profile && user) {
        (profile as any).enableMultipleProfiles = user.enableMultipleProfiles;
        (profile as any).subscriptionAmountPaid = (user.privateMetadata as any)?.subscriptionAmountPaid || 4000;
      }
    } catch (e: any) {
      if (e.code === 'P2032' || e.message?.includes('createdAt') || e.message?.includes('updatedAt')) {
        console.log("⚠️ Prisma P2032 error detected. Running self-healing for missing dates...");
        await prisma.$runCommandRaw({
          update: "BusinessProfile",
          updates: [
            { q: { $or: [{ createdAt: null }, { createdAt: { $exists: false } }] }, u: { $set: { createdAt: { $date: new Date().toISOString() } } }, multi: true },
            { q: { $or: [{ updatedAt: null }, { updatedAt: { $exists: false } }] }, u: { $set: { updatedAt: { $date: new Date().toISOString() } } }, multi: true }
          ]
        });
        profile = await prisma.businessProfile.findFirst({
          where: { userId: effectiveId },
        });
        const user = await prisma.user.findUnique({
          where: { clerkId: effectiveId }
        });
        if (profile && user) {
          (profile as any).enableMultipleProfiles = user.enableMultipleProfiles;
          (profile as any).subscriptionAmountPaid = (user.privateMetadata as any)?.subscriptionAmountPaid || 4000;
        }
      } else {
        throw e;
      }
    }

    // Removed SaaS logic for premium popup
    return NextResponse.json(profile, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

/* =============================
   CREATE / UPDATE PROFILE
============================= */
export async function POST(request: Request) {
  console.log("API VERSION: 1.0.6 - Debug Status");
  try {
    const effectiveId = await getEffectiveClerkId();

    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: any = {};
    try {
      const textBody = await request.text();
      if (textBody) {
        body = JSON.parse(textBody);
      }
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // --- Data Sanitization ---
    const s = (val: any) => {
      if (val === undefined) return undefined;
      if (val === null) return null;
      const trimmed = String(val).trim();
      return trimmed === "" ? null : trimmed;
    };
    const b = (val: any) => (typeof val === 'boolean' ? val : (val === 'true' ? true : (val === 'false' ? false : undefined)));
    const n = (val: any) => {
      if (val === undefined || val === null || val === "") return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    };

    const updateData: any = {};
    
    // Removed enableMultipleProfiles
    // ✅ QR Ordering Status & Timing (MOVE TO TOP FOR PRIORITY)
    // Removed POS specific online status
    // Basic Info
    if (body.businessType !== undefined) updateData.businessType = s(body.businessType);
    if (body.businessName !== undefined) updateData.businessName = s(body.businessName);
    if (body.businessTagline !== undefined || body.businessTagLine !== undefined) {
      updateData.businessTagLine = s(body.businessTagline ?? body.businessTagLine);
    }

    // Contact
    if (body.contactName !== undefined || body.contactPersonName !== undefined) {
      updateData.contactPersonName = s(body.contactName ?? body.contactPersonName);
    }
    if (body.contactPhone !== undefined || body.contactPersonPhone !== undefined) {
      updateData.contactPersonPhone = s(body.contactPhone ?? body.contactPersonPhone);
    }
    if (body.contactEmail !== undefined || body.contactPersonEmail !== undefined) {
      updateData.contactPersonEmail = s(body.contactEmail ?? body.contactPersonEmail);
    }
    // Only include businessEmail IF explicitly provided, otherwise let it be null/omit
    if (body.businessEmail !== undefined) updateData.businessEmail = s(body.businessEmail);
    if (body.upi !== undefined) updateData.upi = s(body.upi);

    // Images
    if (body.profileImage !== undefined || body.profileImageUrl !== undefined) {
      updateData.profileImageUrl = s(body.profileImage ?? body.profileImageUrl);
    }
    if (body.logo !== undefined || body.logoUrl !== undefined) {
      updateData.logoUrl = s(body.logo ?? body.logoUrl);
    }
    if (body.signature !== undefined || body.signatureUrl !== undefined) {
      updateData.signatureUrl = s(body.signature ?? body.signatureUrl);
    }

    // Address & Tax
    if (body.gstNumber !== undefined) updateData.gstNumber = s(body.gstNumber);
    if (body.businessAddress !== undefined) updateData.businessAddress = s(body.businessAddress);
    if (body.state !== undefined) updateData.state = s(body.state);
    if (body.district !== undefined) updateData.district = s(body.district);
    if (body.pinCode !== undefined) updateData.pinCode = s(body.pinCode);
    
    if (body.taxEnabled !== undefined) updateData.taxEnabled = b(body.taxEnabled);
    if (body.taxInclusive !== undefined) updateData.taxInclusive = b(body.taxInclusive);
    if (body.taxRate !== undefined) updateData.taxRate = n(body.taxRate);
    if (body.upiQrEnabled !== undefined) updateData.upiQrEnabled = b(body.upiQrEnabled);
    if (body.menuLinkEnabled !== undefined) updateData.menuLinkEnabled = b(body.menuLinkEnabled);
    // Removed POS specific invoice settings

    // ✅ QR Menu Checkout Payment Visibility Settings
    if (body.currencyCode !== undefined) updateData.currencyCode = s(body.currencyCode);
    if (body.currencySymbol !== undefined) updateData.currencySymbol = s(body.currencySymbol);
    // Removed POS specific auth and inventory settings

    // ✅ TAX & PRICING (MISSING FIELDS FIX)
    if (body.perProductTaxEnabled !== undefined) updateData.perProductTaxEnabled = b(body.perProductTaxEnabled);
    // Removed POS specific KOT settings
    
    // Removed POS specific additional charges and SaaS settings
    if (body.enableFuelBilling !== undefined) updateData.enableFuelBilling = b(body.enableFuelBilling);

    // ✅ MISC SETTINGS
    if (body.gstType !== undefined) updateData.gstType = s(body.gstType);
    if (body.servedStatusLabel !== undefined) updateData.servedStatusLabel = s(body.servedStatusLabel);
    if (body.collectCustomerName !== undefined) updateData.collectCustomerName = b(body.collectCustomerName);
    if (body.requireCustomerName !== undefined) updateData.requireCustomerName = b(body.requireCustomerName);
    if (body.collectCustomerPhone !== undefined) updateData.collectCustomerPhone = b(body.collectCustomerPhone);
    if (body.requireCustomerPhone !== undefined) updateData.requireCustomerPhone = b(body.requireCustomerPhone);
    if (body.collectCustomerAddress !== undefined) updateData.collectCustomerAddress = b(body.collectCustomerAddress);
    if (body.requireCustomerAddress !== undefined) updateData.requireCustomerAddress = b(body.requireCustomerAddress);
    if (body.enableFuelBilling !== undefined) updateData.enableFuelBilling = b(body.enableFuelBilling);
    if (body.enableHotelManagement !== undefined) updateData.enableHotelManagement = b(body.enableHotelManagement);

    console.log("SERVER DEBUG: Final Update Data:", JSON.stringify(updateData, null, 2));

    // ✅ FIX: Find specific profile if body.id is provided, otherwise find the first one unless it's a new profile
    const existingProfile = body.id 
      ? await prisma.businessProfile.findFirst({ where: { id: body.id, userId: effectiveId } })
      : (body.isNewProfile ? null : await prisma.businessProfile.findFirst({ where: { userId: effectiveId } }));

    let profile;
    if (existingProfile) {
      profile = await prisma.businessProfile.update({
        where: { id: existingProfile.id },
        data: updateData
      });
    } else {
      profile = await prisma.businessProfile.create({
        data: {
          ...updateData, // Use the fields we have in updateData
          userId: effectiveId,
          // Ensure mandatory fields have defaults if missing in updateData
          businessName: updateData.businessName ?? s(body.businessName) ?? "My Business",
          taxEnabled: updateData.taxEnabled ?? b(body.taxEnabled) ?? false,
          taxInclusive: updateData.taxInclusive ?? b(body.taxInclusive) ?? false,
          taxRate: updateData.taxRate ?? n(body.taxRate) ?? 5.0,
          upiQrEnabled: updateData.upiQrEnabled ?? b(body.upiQrEnabled) ?? true,
          menuLinkEnabled: updateData.menuLinkEnabled ?? b(body.menuLinkEnabled) ?? true,
          gstType: updateData.gstType ?? s(body.gstType) ?? "PRODUCT",
        }
      });
    }

    return NextResponse.json(profile, { status: 200 });
  } catch (error: any) {
    console.error("POST /api/profile error DETAILS:", error);
    return NextResponse.json(
      { 
        error: "Failed to save profile", 
        details: error.message || String(error),
        code: error.code 
      },
      { status: 500 }
    );
  }
}
