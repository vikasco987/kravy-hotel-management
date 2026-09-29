import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
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
    const { name, floorNumber } = body;

    const floor = await prisma.floor.findFirst({
      where: { id, hotelId: hotel.id }
    });

    if (!floor) {
      return NextResponse.json({ error: 'Floor not found' }, { status: 404 });
    }

    if (floorNumber !== undefined) {
      const existingFloor = await prisma.floor.findUnique({
        where: {
          hotelId_floorNumber: {
            hotelId: hotel.id,
            floorNumber: parseInt(floorNumber),
          }
        }
      });

      if (existingFloor && existingFloor.id !== floor.id) {
        return NextResponse.json({ error: 'Floor number already exists' }, { status: 400 });
      }
    }

    const updatedFloor = await prisma.floor.update({
      where: { id: floor.id },
      data: {
        ...(name && { name }),
        ...(floorNumber !== undefined && { floorNumber: parseInt(floorNumber) })
      }
    });

    return NextResponse.json(updatedFloor, { status: 200 });
  } catch (error: any) {
    console.error('Error updating floor:', error);
    if (error?.code === 'P2023' || error?.message?.includes('ObjectId')) {
      return NextResponse.json({ error: 'Invalid ID format provided' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update floor' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hotel } = authContext;
    const { id } = await params;

    const floor = await prisma.floor.findFirst({
      where: { id, hotelId: hotel.id },
      include: {
        _count: {
          select: { 
            rooms: {
              where: { isActive: true }
            }
          }
        }
      }
    });

    if (!floor) {
      return NextResponse.json({ error: 'Floor not found' }, { status: 404 });
    }

    if (floor._count.rooms > 0) {
      return NextResponse.json({ error: 'This floor cannot be deleted because rooms are assigned to it. Remove or move the rooms first.' }, { status: 400 });
    }

    await prisma.floor.update({
      where: { id: floor.id },
      data: { 
        isActive: false,
        floorNumber: floor.floorNumber + 100000 + Math.floor(Math.random() * 1000) // free up the floor number for reuse
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting floor:', error);
    if (error?.code === 'P2023' || error?.message?.includes('ObjectId')) {
      return NextResponse.json({ error: 'Invalid ID format provided' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to delete floor' }, { status: 500 });
  }
}
