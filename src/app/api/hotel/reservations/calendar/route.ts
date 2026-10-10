import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthContext } from '@/lib/authContext';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.user || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hotelId = authContext.hotel.id;
    const { searchParams } = new URL(req.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    if (!startDateStr || !endDateStr) {
      return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 });
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Fetch all active rooms
    const rooms = await prisma.room.findMany({
      where: { hotelId, isActive: true },
      include: { roomType: true },
      orderBy: { roomNumber: 'asc' }
    });

    // Fetch reservations that overlap with the date range
    // Overlap condition: checkInDate < endDate AND checkOutDate > startDate
    // Exclude cancelled/no show if needed, but we will return all and filter on frontend or return specific statuses.
    const reservations = await prisma.reservation.findMany({
      where: { 
        hotelId,
        rooms: {
          some: {
            checkInDate: { lt: endDate },
            checkOutDate: { gt: startDate }
          }
        }
      },
      include: {
        guest: true,
        rooms: true
      }
    });

    // We can flat map reservation rooms for the calendar blocks
    const blocks: any[] = [];

    for (const res of reservations) {
       for (const rr of res.rooms) {
          // Verify overlap again for the specific room booking
          const rrCheckIn = new Date(rr.checkInDate);
          const rrCheckOut = new Date(rr.checkOutDate);
          
          if (rrCheckIn < endDate && rrCheckOut > startDate) {
             blocks.push({
                reservationId: res.id,
                shortId: String(res.reservationNumber),
                reservationNumber: res.reservationNumber,
                guestName: res.guest.name,
                roomId: rr.roomId,
                checkInDate: rr.checkInDate,
                checkOutDate: rr.checkOutDate,
                nights: rr.nights,
                status: res.status, // RESERVED, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED, NO_SHOW
                totalAmount: res.totalAmount,
                advancePaid: res.advancePaid,
                guestsCount: Array.isArray(rr.guestsData) ? rr.guestsData.length : 1
             });
          }
       }
    }

    return NextResponse.json({
      success: true,
      rooms: rooms.map((r: any) => ({
         id: r.id,
         roomNumber: r.roomNumber,
         roomType: r.roomType.name
      })),
      blocks
    });
  } catch (error: any) {
    console.error('Calendar API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
