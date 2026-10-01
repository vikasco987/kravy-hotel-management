import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthContext } from '@/lib/authContext';

const prisma = new PrismaClient();

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hotel } = authContext;
    const { id } = await params;

    const room = await prisma.room.findFirst({
      where: { id, hotelId: hotel.id },
      include: {
        _count: {
          select: { stays: true }
        }
      }
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    await prisma.room.update({
      where: { id: room.id },
      data: { 
        isActive: false, 
        status: 'BLOCKED',
        roomNumber: `${room.roomNumber}_deleted_${Date.now()}`
      }
    });

    return NextResponse.json({ success: true, softDeleted: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting room:', error);
    if (error?.code === 'P2023' || error?.message?.includes('ObjectId')) {
      return NextResponse.json({ error: 'Invalid ID format provided' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hotel } = authContext;
    const { id } = await params;
    const body = await req.json();
    const { floorId, roomTypeName, roomNumber, status, basePrice } = body;

    const room = await prisma.room.findFirst({
      where: { id, hotelId: hotel.id },
      include: { roomType: true }
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // 1. Validate Floor belongs to current hotel
    if (floorId && floorId !== room.floorId) {
      const floor = await prisma.floor.findFirst({
        where: { id: floorId, hotelId: hotel.id }
      });
      if (!floor) return NextResponse.json({ error: 'Invalid floor for this hotel' }, { status: 400 });
    }

    // 2. Resolve RoomType
    let finalRoomTypeId = room.roomTypeId;
    if (roomTypeName && roomTypeName !== room.roomType?.name) {
      let roomType = await prisma.roomType.findFirst({
        where: { name: roomTypeName, hotelId: hotel.id }
      });
      if (!roomType) {
        roomType = await prisma.roomType.create({
          data: {
            hotelId: hotel.id,
            name: roomTypeName,
            basePrice: basePrice ? Math.round(basePrice * 100) : 150000
          }
        });
      } else if (basePrice) {
         roomType = await prisma.roomType.update({
            where: { id: roomType.id },
            data: { basePrice: Math.round(basePrice * 100) }
         });
      }
      finalRoomTypeId = roomType.id;
    } else if (basePrice && room.roomType && room.roomType.basePrice !== Math.round(basePrice * 100)) {
        await prisma.roomType.update({
            where: { id: room.roomTypeId },
            data: { basePrice: Math.round(basePrice * 100) }
         });
    }

    // 3. Validate unique room number within the hotel, ignoring the current room
    if (roomNumber && roomNumber !== room.roomNumber) {
      const existingRoom = await prisma.room.findUnique({
        where: {
          hotelId_roomNumber: {
            hotelId: hotel.id,
            roomNumber,
          }
        }
      });
      if (existingRoom && existingRoom.id !== room.id) {
        return NextResponse.json({ error: 'Room number already exists in this hotel' }, { status: 400 });
      }
    }

    const updatedRoom = await prisma.room.update({
      where: { id },
      data: {
        ...(floorId && { floorId }),
        ...(finalRoomTypeId && { roomTypeId: finalRoomTypeId }),
        ...(roomNumber && { roomNumber }),
        ...(status && { status })
      },
      include: {
        roomType: true,
      }
    });

    return NextResponse.json(updatedRoom, { status: 200 });
  } catch (error: any) {
    console.error('Error updating room:', error);
    if (error?.code === 'P2023' || error?.message?.includes('ObjectId')) {
      return NextResponse.json({ error: 'Invalid ID format provided' }, { status: 400 });
    }
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Room number already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
  }
}
