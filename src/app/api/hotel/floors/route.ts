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

    if (!name || floorNumber === undefined) {
      return NextResponse.json({ error: 'Name and Floor Number are required' }, { status: 400 });
    }

    const existingFloor = await prisma.floor.findUnique({
      where: {
        hotelId_floorNumber: {
          hotelId: hotel.id,
          floorNumber: parseInt(floorNumber),
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
        floorNumber: parseInt(floorNumber),
      }
    });

    return NextResponse.json(newFloor, { status: 201 });
  } catch (error) {
    console.error('Error creating floor:', error);
    return NextResponse.json({ error: 'Failed to create floor' }, { status: 500 });
  }
}
