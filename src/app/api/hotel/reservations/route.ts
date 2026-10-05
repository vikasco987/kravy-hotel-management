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
        stay: {
          include: { stayRooms: true }
        }
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

      let totalGuests = 0;
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
         
         if (rr.guestsData && Array.isArray(rr.guestsData)) {
            totalGuests += rr.guestsData.length;
         } else {
            totalGuests += 1;
         }
      }

      if (res.status === 'RESERVED' || res.status === 'CONFIRMED') {
         if (minCheckIn && minCheckIn >= todayStart) upcomingCheckIns++;
      }
      if (res.status === 'CHECKED_IN') {
         if (maxCheckOut && maxCheckOut >= todayStart) upcomingCheckOuts++;
      }

      let firstActiveRoomId = null;
      if (res.stay && res.stay.stayRooms) {
         firstActiveRoomId = res.stay.stayRooms.find((sr: any) => !sr.checkOutDate)?.roomId;
      }
      if (!firstActiveRoomId && res.rooms && res.rooms.length > 0) {
         firstActiveRoomId = res.rooms[0].roomId;
      }

      return {
        firstActiveRoomId,
        id: res.id,
        shortId: res.id.substring(res.id.length - 4).toUpperCase(),
        guestName: res.guest.name,
        guestPhone: res.guest.phone,
        rooms: roomNames,
        checkInDate: minCheckIn,
        checkOutDate: maxCheckOut,
        nights: totalNights || 1,
        guests: totalGuests || 1,
        totalAmount: res.totalAmount,
        status: res.status,
        source: 'Direct',
        createdAt: res.createdAt
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


export async function POST(req: Request) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.user || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hotelId = authContext.hotel.id;
    const body = await req.json();
    const { 
      guestName, guestPhone, guestEmail, guestAddress,
      checkInDate, checkOutDate, nights,
      rooms, // Array of { roomId, baseRate, guestsData }
      totalAmount, advanceAmount, paymentMode,
      source
    } = body;

    if (!rooms || rooms.length === 0) {
      return NextResponse.json({ error: 'At least one room must be selected' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Guest
      const guest = await tx.guest.create({
         data: {
            businessId: authContext.business.id,
            name: guestName,
            phone: guestPhone,
            email: guestEmail
         }
      });

      // 2. Create Reservation
      const reservation = await tx.reservation.create({
         data: {
            hotelId,
            guestId: guest.id,
            status: 'RESERVED',
            totalAmount: Math.round(totalAmount * 100),
            advancePaid: advanceAmount ? Math.round(advanceAmount * 100) : 0,
         }
      });

      // 3. Create Reservation Rooms
      for (const room of rooms) {
         // Overlap protection
         const existing = await tx.reservationRoom.findFirst({
            where: {
               roomId: room.roomId,
               reservation: { status: { in: ['RESERVED', 'CONFIRMED', 'CHECKED_IN'] } },
               OR: [
                  { checkInDate: { lt: new Date(checkOutDate) }, checkOutDate: { gt: new Date(checkInDate) } }
               ]
            }
         });
         
         if (existing) {
             throw new Error(`Room ${room.roomId} is already booked for these dates.`);
         }

         await tx.reservationRoom.create({
            data: {
               reservationId: reservation.id,
               roomId: room.roomId,
               checkInDate: new Date(checkInDate),
               checkOutDate: new Date(checkOutDate),
               baseRate: room.baseRate ? Math.round(room.baseRate * 100) : 0,
               appliedRate: room.baseRate ? Math.round(room.baseRate * 100) : 0,
               guestsData: room.guestsData || null
            }
         });
      }

      return reservation;
    });

    return NextResponse.json({ success: true, reservation: result }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating reservation:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
