import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthContext } from '@/lib/authContext';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hotel } = authContext;
    const body = await req.json();
    const { name, floorNumber } = body;

    let finalFloorNumber = floorNumber !== undefined ? parseInt(floorNumber) : 1;
    if (floorNumber === undefined) {
      const maxFloor = await prisma.floor.aggregate({
        where: { hotelId: hotel.id },
        _max: { floorNumber: true }
      });
      finalFloorNumber = (maxFloor._max.floorNumber || 0) + 1;
    }

    if (!name) {
      return NextResponse.json({ error: 'Floor name is required' }, { status: 400 });
    }

    const existingFloor = await prisma.floor.findUnique({
      where: {
        hotelId_floorNumber: {
          hotelId: hotel.id,
          floorNumber: finalFloorNumber,
        }
      }
    });

    if (existingFloor) {
      return NextResponse.json({ error: 'Floor number already exists' }, { status: 400 });
    }

    const newFloor = await prisma.floor.create({
      data: {
        hotelId: hotel.id,
        name,
        floorNumber: finalFloorNumber,
      }
    });

    return NextResponse.json(newFloor, { status: 201 });
  } catch (error) {
    console.error('Error creating floor:', error);
    return NextResponse.json({ error: 'Failed to create floor' }, { status: 500 });
  }
}
