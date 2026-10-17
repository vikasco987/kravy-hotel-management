import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthContext } from '@/lib/authContext';
import { isAdminOrOwner, hasPermission } from '@/lib/permissions';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ stayId: string }> }) {
  try {
    const resolvedParams = await params;
    const authContext = await getAuthContext();
    if (!authContext || !authContext.user || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authContext.user.isStaff && authContext.user.status !== 'active') {
      return NextResponse.json({ error: 'Forbidden: Account is inactive' }, { status: 403 });
    }

    // Centralized invoice & receipt authorization.
    // If a format query parameter is provided (A4, 80MM, 58MM), enforce its corresponding centralized permission.
    // Otherwise require at least one of the printing permissions.
    if (!isAdminOrOwner(authContext.user)) {
      const url = new URL(req.url);
      const requestedFormat = (url.searchParams.get('format') || '').toUpperCase();

      let isAuthorized = false;
      let requiredKey = 'action:printing:invoice_a4';

      if (requestedFormat === 'A4') {
        requiredKey = 'action:printing:invoice_a4';
        isAuthorized = hasPermission(authContext.user, 'action:printing:invoice_a4');
      } else if (requestedFormat === '80MM') {
        requiredKey = 'action:printing:invoice_80mm';
        isAuthorized = hasPermission(authContext.user, 'action:printing:invoice_80mm');
      } else if (requestedFormat === '58MM') {
        requiredKey = 'action:printing:invoice_58mm';
        isAuthorized = hasPermission(authContext.user, 'action:printing:invoice_58mm');
      } else {
        // No explicit format requested: check if user holds any of the print permissions
        isAuthorized =
          hasPermission(authContext.user, 'action:printing:invoice_a4') ||
          hasPermission(authContext.user, 'action:printing:invoice_80mm') ||
          hasPermission(authContext.user, 'action:printing:invoice_58mm') ||
          hasPermission(authContext.user, 'action:printing:payment_receipt') ||
          hasPermission(authContext.user, 'action:printing:guest_registration_card');
      }

      if (!isAuthorized) {
        return NextResponse.json({
          error: `Forbidden: Missing required printing permission (${requiredKey})`,
          code: 'FORBIDDEN',
          requiredPermission: requiredKey
        }, { status: 403 });
      }
    }

    const stayId = resolvedParams.stayId;

    const stay = await prisma.stay.findUnique({
      where: { id: stayId },
      include: {
        reservation: {
          include: {
            hotel: true,
            guest: true
          }
        },
        stayRooms: {
          include: { room: { include: { roomType: true } } }
        },
        roomCharges: true,
        invoice: true
      }
    });

    if (!stay) {
      return NextResponse.json({ error: 'Stay not found' }, { status: 404 });
    }

    if (stay.reservation.hotelId !== authContext.hotel.id) {
      return NextResponse.json({ error: 'Forbidden: Stay does not belong to your hotel' }, { status: 403 });
    }

    const hotel = stay.reservation.hotel;
    const guest = stay.reservation.guest;
    const leadStayRoom = stay.stayRooms[0];

    // Resolve businessProfile: for staff users, query using hotel's owner/creator ID
    const businessOwnerId = authContext.hotel.createdBy || authContext.business?.createdBy || authContext.user.id;
    const businessProfile = await prisma.businessProfile.findFirst({
        where: { userId: businessOwnerId }
    });

    if (businessProfile) {
      const { parsePrintBranding } = await import('@/lib/printBranding');
      (businessProfile as any).printBranding = parsePrintBranding(businessProfile.servedStatusLabel);
    }

    const { PricingService } = await import('@/lib/pricing/PricingService');
    const todayDate = new Date();
    const firstStayRoom = stay.stayRooms.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];

    for (const sr of stay.stayRooms) {
        const checkIn = new Date(sr.checkInDate);
        checkIn.setHours(0, 0, 0, 0);

        const outDate = sr.checkOutDate ? new Date(sr.checkOutDate) : new Date(todayDate);
        outDate.setHours(0, 0, 0, 0);

        let actualNights = Math.round((outDate.getTime() - checkIn.getTime()) / 86400000);
        if (actualNights < 1) actualNights = 1;

        // If it's active and nights don't match today, OR if it's checked out but the DB is stale/corrupt
        if (actualNights !== sr.nights) {
            const pricing = PricingService.calculateRoomPricing({
                baseRate: sr.baseRate,
                nights: actualNights,
                discountType: sr.discountType as any,
                discountValue: sr.discountValue,
                taxMode: sr.taxMode as any,
                taxRate: sr.taxRate,
                extraCharges: stay.roomCharges
                    .filter((c: any) => c.stayRoomId === sr.id || (!c.stayRoomId && firstStayRoom?.id === sr.id))
                    .map((c: any) => ({
                        amount: c.amount,
                        quantity: c.quantity,
                        chargeMode: c.chargeMode || 'FIXED'
                    }))
            });

            sr.nights = actualNights;
            sr.grossAmount = pricing.grossAmount;
            sr.discountAmount = pricing.discountAmount;
            sr.taxableAmount = pricing.taxableAmount;
            sr.cgstAmount = pricing.cgstAmount;
            sr.sgstAmount = pricing.sgstAmount;
            sr.taxAmount = pricing.taxAmount;
            sr.extraChargesAmount = pricing.extraChargesAmount;
            sr.finalAmount = pricing.finalAmount;

            // Optional: Auto-heal the actual persistence if it was completed
            if (sr.checkOutDate) {
               await prisma.stayRoom.update({
                  where: { id: sr.id },
                  data: {
                    nights: actualNights,
                    grossAmount: pricing.grossAmount,
                    discountAmount: pricing.discountAmount,
                    taxableAmount: pricing.taxableAmount,
                    cgstAmount: pricing.cgstAmount,
                    sgstAmount: pricing.sgstAmount,
                    taxAmount: pricing.taxAmount,
                    extraChargesAmount: pricing.extraChargesAmount,
                    finalAmount: pricing.finalAmount
                  }
               });
            }
        }
    }    // Create draft invoice if it doesn't exist
    let invoice = stay.invoice;
    if (!invoice) {
        // Find latest invoice number for this hotel to generate the next one
        const count = await prisma.invoice.count();
        const nextInvoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

        invoice = await prisma.invoice.create({
           data: {
              stayId: stay.id,
              guestId: guest.id,
              invoiceNumber: nextInvoiceNumber,
              subtotal: leadStayRoom.grossAmount,
              discountAmount: leadStayRoom.discountAmount,
              taxableAmount: leadStayRoom.taxableAmount,
              cgstAmount: leadStayRoom.cgstAmount,
              sgstAmount: leadStayRoom.sgstAmount,
              taxAmount: leadStayRoom.taxAmount,
              totalAmount: leadStayRoom.finalAmount,
              status: "DRAFT"
           }
        });
    }

    if (invoice && invoice.status === 'DRAFT' && stay.reservation.status === 'CHECKED_IN') {
        let invSubtotal = 0, invTax = 0, invTotal = 0, invTaxable = 0, invCgst = 0, invSgst = 0;
        for (const sr of stay.stayRooms) {
            invSubtotal += (sr.grossAmount - (sr.discountAmount || 0));
            invTaxable += sr.taxableAmount;
            invCgst += sr.cgstAmount;
            invSgst += sr.sgstAmount;
            invTax += sr.taxAmount;
            invTotal += sr.finalAmount;
        }
        const extrasTotal = stay.roomCharges.reduce((acc: number, c: any) => acc + (c.amount * (c.quantity || 1)), 0);
        invoice.subtotal = invSubtotal + extrasTotal;
        invoice.taxAmount = invTax;
        invoice.taxableAmount = invTaxable;
        invoice.cgstAmount = invCgst;
        invoice.sgstAmount = invSgst;
        invoice.totalAmount = invTotal;
    }

    return NextResponse.json({
       success: true,
       data: { stay, hotel, guest, leadStayRoom, invoice, businessProfile }
    });
  } catch (error) {
    console.error('Invoice Data Error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice data' }, { status: 500 });
  }
}
