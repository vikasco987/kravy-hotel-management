import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthContext } from '@/lib/authContext';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ stayId: string }> }) {
  try {
    const resolvedParams = await params;
    const authContext = await getAuthContext();
    if (!authContext || !authContext.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const hotel = stay.reservation.hotel;
    const guest = stay.reservation.guest;
    const leadStayRoom = stay.stayRooms[0];
    
    const businessProfile = await prisma.businessProfile.findFirst({
        where: { userId: authContext.user.clerkId || authContext.user.id }
    });

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
