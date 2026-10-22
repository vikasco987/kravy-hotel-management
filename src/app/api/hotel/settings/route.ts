import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/authContext';
import { requirePermission, isAdminOrOwner } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hotel } = authContext;

    let settings = await prisma.hotelSettings.findUnique({
      where: { hotelId: hotel.id }
    });

    if (!settings) {
      // Default initial record for the hotel: 12% INCLUSIVE
      settings = await prisma.hotelSettings.create({
        data: {
          hotelId: hotel.id,
          taxRate: 1200,
          checkoutTime: '11:00 AM',
          maxDiscountPercent: 10,
          maxFixedDiscount: 100000
        }
      });
    }

    // Retrieve raw MongoDB document to guarantee taxEnabled and taxMode are read accurately
    let rawTaxEnabled: boolean | null = null;
    let rawTaxMode: string | null = null;
    try {
      const rawDoc: any = await prisma.$runCommandRaw({
        find: 'HotelSettings',
        filter: {
          $or: [
            { hotelId: { $oid: hotel.id } },
            { hotelId: hotel.id }
          ]
        },
        limit: 1
      });
      const firstDoc = rawDoc?.cursor?.firstBatch?.[0];
      if (firstDoc) {
        if (typeof firstDoc.taxEnabled === 'boolean') {
          rawTaxEnabled = firstDoc.taxEnabled;
        }
        if (typeof firstDoc.taxMode === 'string') {
          rawTaxMode = firstDoc.taxMode;
        }
      }
    } catch (rawErr) {
      console.warn('Could not read raw HotelSettings doc:', rawErr);
    }

    const rawSettings = settings as any;
    const isExplicitlyDisabled = rawTaxEnabled !== null ? rawTaxEnabled === false : rawSettings.taxEnabled === false;
    const taxEnabled = !isExplicitlyDisabled;
    const taxRate = typeof settings.taxRate === 'number' ? settings.taxRate : 1200;
    const taxMode = rawTaxMode || rawSettings.taxMode || 'INCLUSIVE';

    return NextResponse.json({
      success: true,
      data: {
        id: settings.id,
        hotelId: settings.hotelId,
        taxEnabled,
        taxRate, // basis points, e.g. 1200
        taxMode, // 'INCLUSIVE' | 'EXCLUSIVE'
        checkoutTime: settings.checkoutTime,
        maxDiscountPercent: settings.maxDiscountPercent,
        maxFixedDiscount: settings.maxFixedDiscount
      }
    });
  } catch (error: any) {
    console.error('Error fetching hotel settings:', error);
    return NextResponse.json({ error: 'Failed to fetch hotel settings', details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Server-side permission check: Only Owners and Admins are allowed to change hotel settings
    if (!isAdminOrOwner(authContext.user)) {
      return NextResponse.json(
        { error: 'Forbidden: Only hotel owners or administrators can modify hotel settings' },
        { status: 403 }
      );
    }

    const { hotel } = authContext;
    const body = await request.json();

    // Validate inputs
    const taxEnabled = typeof body.taxEnabled === 'boolean' ? body.taxEnabled : true;
    let taxRate = typeof body.taxRate === 'number' ? Math.round(body.taxRate) : 1200;
    if (taxRate < 0) taxRate = 0;
    if (taxRate > 10000) taxRate = 10000; // max 100%

    // Allowable tax modes
    const taxMode = body.taxMode === 'EXCLUSIVE' ? 'EXCLUSIVE' : 'INCLUSIVE';

    // Store taxRate directly as configured (e.g. 1200 or 1800), and use taxEnabled to toggle application
    const storedRate = taxRate;

    const updated = await prisma.hotelSettings.upsert({
      where: { hotelId: hotel.id },
      create: {
        hotelId: hotel.id,
        taxRate: storedRate,
        checkoutTime: body.checkoutTime || '11:00 AM',
        maxDiscountPercent: typeof body.maxDiscountPercent === 'number' ? body.maxDiscountPercent : 10,
        maxFixedDiscount: typeof body.maxFixedDiscount === 'number' ? body.maxFixedDiscount : 100000
      },
      update: {
        taxRate: storedRate,
        ...(body.checkoutTime ? { checkoutTime: body.checkoutTime } : {}),
        ...(typeof body.maxDiscountPercent === 'number' ? { maxDiscountPercent: body.maxDiscountPercent } : {}),
        ...(typeof body.maxFixedDiscount === 'number' ? { maxFixedDiscount: body.maxFixedDiscount } : {})
      }
    });

    // Also persist taxMode & taxEnabled onto MongoDB document safely via runCommandRaw
    await prisma.$runCommandRaw({
      update: 'HotelSettings',
      updates: [
        {
          q: {
            $or: [
              { hotelId: { $oid: hotel.id } },
              { hotelId: hotel.id },
              { _id: { $oid: updated.id } }
            ]
          },
          u: {
            $set: {
              taxEnabled,
              taxRate: storedRate,
              taxMode
            }
          }
        }
      ]
    });

    return NextResponse.json({
      success: true,
      message: 'Hotel GST settings updated successfully',
      data: {
        ...updated,
        taxEnabled,
        taxRate: storedRate,
        taxMode
      }
    });
  } catch (error: any) {
    console.error('Error saving hotel settings:', error);
    return NextResponse.json({ error: 'Failed to save hotel settings', details: error.message }, { status: 500 });
  }
}
