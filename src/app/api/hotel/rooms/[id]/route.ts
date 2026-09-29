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
