import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthContext } from '@/lib/authContext';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { stayId, stayRoomIds, payment } = body;

    if (!stayId || !stayRoomIds || !Array.isArray(stayRoomIds) || stayRoomIds.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Begin interactive transaction for concurrency safety
    const result = await prisma.$transaction(async (tx) => {
      // 1. Re-fetch StayRooms to verify they are still active
      const stayRooms = await tx.stayRoom.findMany({
        where: {
          id: { in: stayRoomIds },
          stayId: stayId
        },
        include: { room: true }
      });

      if (stayRooms.length !== stayRoomIds.length) {
        throw new Error('One or more selected rooms were not found in this stay.');
      }

      for (const sr of stayRooms) {
        if (sr.checkOutDate !== null) {
          throw new Error(`Room ${sr.room.roomNumber} has already been checked out.`);
        }
      }

      // 2. Re-fetch Stay & Reservation to calculate accurate financials
      const stay = await tx.stay.findUnique({
        where: { id: stayId },
        include: {
          reservation: true,
          roomCharges: true,
          stayRooms: true // To know if any rooms remain after this
        }
      });

      if (!stay) throw new Error('Stay not found');

      // Server-side calculation of the final bill
      // All calculations are done in minor units (paise) to prevent float issues
      let roomSubtotal = 0;
      let taxes = 0;
      let extras = 0;
      let grandTotal = 0;

      for (const sr of stayRooms) {
        roomSubtotal += (sr.grossAmount || (sr.baseRate * sr.nights)) - (sr.discountAmount || 0);
        taxes += sr.taxAmount || 0;
        extras += sr.extraChargesAmount || 0;
        grandTotal += sr.finalAmount || 0;
      }

      const combinedSubtotal = roomSubtotal + extras;

      // Deduct advance paid
      // We apply whatever advance is available on the reservation
      const advanceAvailable = stay.reservation.advancePaid;
      const remainingDue = Math.max(0, grandTotal - advanceAvailable);

      // 3. Payment Validation
      if (payment.amountReceived < remainingDue) {
        throw new Error(`Insufficient payment. Expected ₹${(remainingDue / 100).toFixed(2)}, received ₹${(payment.amountReceived / 100).toFixed(2)}.`);
      }

      const change = payment.amountReceived - remainingDue;

      // 4. Update StayRooms as Checked-Out
      const now = new Date();
      await tx.stayRoom.updateMany({
        where: { id: { in: stayRoomIds } },
        data: { checkOutDate: now }
      });

      // 5. Update Rooms to DIRTY status
      const roomIdsToUpdate = stayRooms.map(sr => sr.roomId);
      await tx.room.updateMany({
        where: { id: { in: roomIdsToUpdate } },
        data: { status: 'DIRTY' }
      });

      // 6. Generate Invoice
      const invoiceNumber = `INV-${randomBytes(4).toString('hex').toUpperCase()}`;
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          stayId: stay.id,
          guestId: stay.reservation.guestId,
          subtotal: combinedSubtotal,
          taxAmount: taxes,
          totalAmount: grandTotal,
          paidAmount: payment.amountReceived,
          balanceAmount: 0,
          status: 'PAID',
          issuedAt: now
        }
      });

      // 7. Check if this completes the entire reservation
      // A stay is complete if all of its StayRooms have a checkOutDate
      const allStayRooms = await tx.stayRoom.findMany({ where: { stayId: stay.id } });
      const activeRooms = allStayRooms.filter(sr => sr.checkOutDate === null);

      if (activeRooms.length === 0) {
        // Complete the reservation
        await tx.reservation.update({
          where: { id: stay.reservation.id },
          data: { status: 'CHECKED_OUT' }
        });
      } else {
        // Since we consumed the advance payment for this partial checkout invoice, 
        // we should deduct it from the reservation to prevent double-applying it.
        if (advanceAvailable > 0) {
          await tx.reservation.update({
            where: { id: stay.reservation.id },
            data: { advancePaid: Math.max(0, advanceAvailable - grandTotal) }
          });
        }
      }

      return {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalDue: remainingDue,
        amountReceived: payment.amountReceived,
        change,
        checkedOutStayRoomIds: stayRoomIds,
        remainingStayRoomIds: activeRooms.map(r => r.id)
      };
    });

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('Checkout settlement error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
