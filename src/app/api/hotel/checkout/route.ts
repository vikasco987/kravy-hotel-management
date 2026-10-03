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

    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json({ error: 'roomId is required' }, { status: 400 });
    }

    // Find the active stay room for the given room ID
    const activeStayRoom = await prisma.stayRoom.findFirst({
      where: { 
        roomId, 
        checkOutDate: null, // null means currently checked in
        stay: {
          reservation: {
            status: 'CHECKED_IN'
          }
        }
      },
      orderBy: { checkInDate: 'desc' }
    });

    if (!activeStayRoom) {
      return NextResponse.json({ error: 'No active stay found for this room' }, { status: 404 });
    }

    // Fetch the full stay context, including all linked rooms, the reservation, and charges
    const stayContext = await prisma.stay.findUnique({
      where: { id: activeStayRoom.stayId },
      include: {
        reservation: {
          include: {
            guest: true
          }
        },
        stayRooms: {
          where: {
            checkOutDate: null // Only bring linked rooms that are currently occupied
          },
          include: {
            room: {
              include: {
                roomType: true,
                floor: true
              }
            }
          }
        },
        roomCharges: true
      }
    });

    if (!stayContext) {
      return NextResponse.json({ error: 'Stay context not found' }, { status: 404 });
    }

    // We also need to fetch guests that might be registered directly to the StayRoom
    // But in Kravy schema, guests are typically on the reservation, or we can just fetch the lead guest.
    // Let's also grab advance paid from the reservation
    
    // Assemble payload for the checkout suite
    const payload = {
      stayId: stayContext.id,
      reservationId: stayContext.reservationId,
      groupId: `GRP-${stayContext.reservationId.slice(-10).toUpperCase()}`, // Generate a friendly Group ID
      leadGuest: stayContext.reservation.guest,
      advancePaid: stayContext.reservation.advancePaid,
      linkedRooms: stayContext.stayRooms.map(sr => ({
        stayRoomId: sr.id,
        roomId: sr.roomId,
        roomNumber: sr.room.roomNumber,
        roomType: sr.room.roomType.name,
        floor: sr.room.floor?.name || '',
        status: sr.room.status,
        tariff: sr.grossAmount - sr.discountAmount, // Net room rent
        baseRate: sr.baseRate,
        nights: sr.nights,
        checkInDate: sr.checkInDate,
        taxMode: sr.taxMode,
        taxRate: sr.taxRate,
        taxAmount: sr.taxAmount,
        extraChargesAmount: sr.extraChargesAmount,
        finalAmount: sr.finalAmount,
        guestsData: sr.guestsData,
      })),
      extraCharges: stayContext.roomCharges.map(charge => ({
        id: charge.id,
        stayRoomId: charge.stayRoomId,
        description: charge.description,
        type: charge.chargeType,
        amount: charge.amount, // minor units (paise)
        quantity: charge.quantity,
        total: charge.totalAmount

      }))
    };

    return NextResponse.json(payload, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching checkout context:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
