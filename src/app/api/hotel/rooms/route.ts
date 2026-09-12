import { NextResponse } from 'next/server';
import { PrismaClient, RoomStatus } from '@prisma/client';
import { getAuthContext } from '@/lib/authContext';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hotel } = authContext;

    // Securely filtered to the authenticated hotel
    const rooms = await prisma.room.findMany({
      where: { hotelId: hotel.id },
      include: {
        floor: true,
        roomType: true,
      }
    });
    return NextResponse.json(rooms);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hotel } = authContext;
    const body = await req.json();
    const { floorId, roomTypeId, roomNumber, status } = body;

    // 1. Validate Floor belongs to current hotel
    const floor = await prisma.floor.findFirst({
      where: { id: floorId, hotelId: hotel.id }
    });
    if (!floor) return NextResponse.json({ error: 'Invalid floor for this hotel' }, { status: 400 });

    // 2. Validate RoomType belongs to current hotel
    const roomType = await prisma.roomType.findFirst({
      where: { id: roomTypeId, hotelId: hotel.id }
    });
    if (!roomType) return NextResponse.json({ error: 'Invalid room type for this hotel' }, { status: 400 });

    // 3. Validate unique room number within the hotel
    const existingRoom = await prisma.room.findUnique({
      where: {
        hotelId_roomNumber: {
          hotelId: hotel.id,
          roomNumber,
        }
      }
    });

    if (existingRoom) {
      return NextResponse.json({ error: 'Room number already exists in this hotel' }, { status: 400 });
    }

    // 4. Validate Status (basic validation, ideally use Zod)
    const validStatuses = ['AVAILABLE', 'RESERVED', 'OCCUPIED', 'DIRTY', 'CLEANING', 'MAINTENANCE', 'BLOCKED'];
    const safeStatus = validStatuses.includes(status) ? status : 'AVAILABLE';

    const newRoom = await prisma.room.create({
      data: {
        hotelId: hotel.id,
        floorId,
        roomTypeId,
        roomNumber,
        status: safeStatus as RoomStatus,
      },
      include: {
        roomType: true,
      }
    });

    return NextResponse.json(newRoom, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
