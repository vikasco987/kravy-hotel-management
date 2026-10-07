import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthContext } from '@/lib/authContext';

const prisma = new PrismaClient();

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const authContext = await getAuthContext();
    if (!authContext || !authContext.user || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hotelId = authContext.hotel.id;
    const reservationId = params.id;

    if (!reservationId) {
      return NextResponse.json({ error: 'Reservation ID is required' }, { status: 400 });
    }

    // Check if the reservation exists and belongs to this hotel
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { stay: true }
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    if (reservation.hotelId !== hotelId) {
      return NextResponse.json({ error: 'Unauthorized to delete this reservation' }, { status: 403 });
    }

    // Safety constraint: Do not delete if a Stay has been created (to preserve financial and historical data)
    if (reservation.stay) {
      return NextResponse.json(
        { error: 'Cannot delete reservation because it has an associated Stay record (financial/historical data exists). Please Cancel the reservation instead.' },
        { status: 400 }
      );
    }

    // Safe to delete. Use a transaction to delete dependencies first.
    await prisma.$transaction([
      prisma.reservationRoom.deleteMany({
        where: { reservationId }
      }),
      prisma.reservation.delete({
        where: { id: reservationId }
      })
    ]);

    return NextResponse.json({ success: true, message: 'Reservation safely deleted' }, { status: 200 });

  } catch (error: any) {
    console.error('Error deleting reservation:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}


export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const authContext = await getAuthContext();
    if (!authContext || !authContext.user || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hotelId = authContext.hotel.id;
    const reservationId = params.id;

    if (!reservationId) {
      return NextResponse.json({ error: 'Reservation ID is required' }, { status: 400 });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { 
        guest: true,
        rooms: true,
        stay: {
           include: {
              stayRooms: true,
              roomCharges: true,
              payments: true,
              invoice: true
           }
        }
      }
    });

    if (!reservation || reservation.hotelId !== hotelId) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Since we only get roomIds, we may want to fetch room details to show names.
    const roomIds = reservation.rooms.map(r => r.roomId).filter(Boolean) as string[];
    if (reservation.stay) {
        reservation.stay.stayRooms.forEach(sr => {
           if (sr.roomId && !roomIds.includes(sr.roomId)) roomIds.push(sr.roomId);
        });
    }

    const rooms = await prisma.room.findMany({
       where: { id: { in: roomIds } },
       include: { roomType: true }
    });

    return NextResponse.json({ success: true, reservation, roomDetails: rooms }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching reservation:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}


export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const authContext = await getAuthContext();
    if (!authContext || !authContext.user || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hotelId = authContext.hotel.id;
    const reservationId = params.id;
    const body = await req.json();
    
    const { 
      guestName, guestPhone, guestEmail, guestAddress,
      checkInDate, checkOutDate, nights,
      rooms, 
      totalAmount, advanceAmount, paymentMode,
      source
    } = body;

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { stay: true }
    });

    if (!reservation || reservation.hotelId !== hotelId) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Basic edit: update guest info, dates, and amounts
    const result = await prisma.$transaction(async (tx) => {
       // Update Guest
       await tx.guest.update({
          where: { id: reservation.guestId },
          data: {
             name: guestName,
             phone: guestPhone,
             email: guestEmail
          }
       });

       // Update Reservation
       const updatedRes = await tx.reservation.update({
          where: { id: reservationId },
          data: {
             totalAmount: Math.round(totalAmount * 100),
             advancePaid: advanceAmount ? Math.round(advanceAmount * 100) : reservation.advancePaid
          }
       });

       // For rooms, it's safer to delete existing reservationRooms and recreate them 
       // if the reservation is not yet checked in.
       if (!reservation.stay) {
           await tx.reservationRoom.deleteMany({
              where: { reservationId }
           });

           for (const room of rooms) {
               // Overlap protection
               const existing = await tx.reservationRoom.findFirst({
                  where: {
                     roomId: room.roomId,
                     reservation: { status: { in: ['RESERVED', 'CONFIRMED', 'CHECKED_IN'] }, id: { not: reservationId } },
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
                     reservationId,
                     roomId: room.roomId,
                     checkInDate: new Date(checkInDate),
                     checkOutDate: new Date(checkOutDate),
                     baseRate: room.baseRate ? Math.round(room.baseRate * 100) : 0,
                     appliedRate: room.baseRate ? Math.round(room.baseRate * 100) : 0,
                     guestsData: room.guestsData || null,
                     guestsCount: Array.isArray(room.guestsData) ? room.guestsData.length : 1
                  }
               });
           }
       }
       return updatedRes;
    });

    return NextResponse.json({ success: true, reservation: result }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating reservation:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
