import { NextResponse } from 'next/server';
import { PrismaClient, RoomStatus } from '@prisma/client';
import { getAuthContext } from '@/lib/authContext';

const prisma = new PrismaClient();

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hotel } = authContext;
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    const validStatuses = ['AVAILABLE', 'RESERVED', 'OCCUPIED', 'DIRTY', 'CLEANING', 'MAINTENANCE', 'BLOCKED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid room status' }, { status: 400 });
    }

    // Ensure the room belongs to the authenticated hotel
    const room = await prisma.room.findFirst({
      where: { id, hotelId: hotel.id }
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found or unauthorized' }, { status: 404 });
    }

    const updatedRoom = await prisma.room.update({
      where: { id },
      data: { status: status as RoomStatus },
      include: {
        roomType: true,
      }
    });

    return NextResponse.json(updatedRoom, { status: 200 });
  } catch (error) {
    console.error('Error updating room status:', error);
    return NextResponse.json({ error: 'Failed to update room status' }, { status: 500 });
  }
}
