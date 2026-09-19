import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthContext } from '@/lib/authContext';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hotelId = authContext.hotel.id;

    // Fetch reservations with necessary relations
    const reservations = await prisma.reservation.findMany({
      where: { hotelId },
      include: {
        guest: true,
        rooms: {
          include: {
            // we don't have direct relation to Room here?
            // Let's check prisma schema. Wait, we'll just return what's available
          }
        },
        stay: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // We need room names. Wait, ReservationRoom has roomId?
    // Let's pull rooms data as well
    const allRooms = await prisma.room.findMany({ where: { hotelId }, include: { roomType: true } });
    const roomMap = new Map();
    allRooms.forEach((r: any) => roomMap.set(r.id, r));

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let totalReservations = reservations.length;
    let checkedIn = 0;
    let checkedOut = 0;
    let upcomingCheckIns = 0;
    let upcomingCheckOuts = 0;

    const formattedReservations = reservations.map((res: any) => {
      if (res.status === 'CHECKED_IN') checkedIn++;
      if (res.status === 'CHECKED_OUT') checkedOut++;
      
      let minCheckIn: Date | null = null;
      let maxCheckOut: Date | null = null;
      let totalNights = 0;
      let roomNames = [];

      for (const rr of res.rooms) {
         if (!minCheckIn || new Date(rr.checkInDate) < minCheckIn) minCheckIn = new Date(rr.checkInDate);
         if (!maxCheckOut || new Date(rr.checkOutDate) > maxCheckOut) maxCheckOut = new Date(rr.checkOutDate);
         if (rr.nights > totalNights) totalNights = rr.nights;
         
         if (rr.roomId && roomMap.has(rr.roomId)) {
           const rObj = roomMap.get(rr.roomId);
           roomNames.push(`Room ${rObj.roomNumber} (${rObj.roomType.name})`);
         } else {
           roomNames.push(`Unassigned`);
         }
      }

      if (res.status === 'RESERVED' || res.status === 'CONFIRMED') {
         if (minCheckIn && minCheckIn >= todayStart) upcomingCheckIns++;
      }
      if (res.status === 'CHECKED_IN') {
         if (maxCheckOut && maxCheckOut >= todayStart) upcomingCheckOuts++;
      }

      return {
        id: res.id,
        shortId: res.id.substring(res.id.length - 4).toUpperCase(),
        guestName: res.guest.name,
        guestPhone: res.guest.phone,
        rooms: roomNames,
        checkInDate: minCheckIn,
        checkOutDate: maxCheckOut,
        nights: totalNights || 1,
        totalAmount: res.totalAmount,
        status: res.status,
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        total: totalReservations,
        checkedIn,
        checkedOut,
        upcomingCheckIns,
        upcomingCheckOuts
      },
      reservations: formattedReservations
    });
  } catch (error: any) {
    console.error('Failed to fetch reservations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
