import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthContext } from '@/lib/authContext';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hotelId = authContext.hotel.id;
    const url = new URL(req.url);
    const checkIn = url.searchParams.get('checkIn');
    const checkOut = url.searchParams.get('checkOut');
    const skipReservationId = url.searchParams.get('skipReservationId');

    if (!checkIn || !checkOut) {
       return NextResponse.json({ error: 'checkIn and checkOut dates are required' }, { status: 400 });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Fetch all active rooms
    const allRooms = await prisma.room.findMany({
      where: { hotelId, isActive: true },
      include: {
        floor: true,
        roomType: true,
      }
    });

    // Find conflicting reservations
    const conflicts = await prisma.reservationRoom.findMany({
       where: {
          reservation: {
             hotelId,
             status: {
                in: ['RESERVED', 'CONFIRMED', 'CHECKED_IN']
             },
             ...(skipReservationId ? { id: { not: skipReservationId } } : {})
          },
          OR: [
             {
                checkInDate: { lt: checkOutDate },
                checkOutDate: { gt: checkInDate }
             }
          ]
       },
       select: { roomId: true }
    });

    const conflictingRoomIds = new Set(conflicts.map(c => c.roomId));

    const availableRooms = allRooms.filter(room => !conflictingRoomIds.has(room.id));

    return NextResponse.json({ success: true, availableRooms, totalRooms: allRooms.length });

  } catch (error: any) {
    console.error('Error fetching available rooms:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
