import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthContext } from '@/lib/authContext';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hotel } = authContext;

    const roomTypes = await prisma.roomType.findMany({
      where: { hotelId: hotel.id },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(roomTypes);
  } catch (error) {
    console.error('Error fetching room types:', error);
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
    const { name, basePrice } = body;

    if (!name || basePrice === undefined) {
      return NextResponse.json({ error: 'Name and Base Price are required' }, { status: 400 });
    }

    // Check for duplicate name in the same hotel
    const existing = await prisma.roomType.findFirst({
      where: { hotelId: hotel.id, name: name }
    });

    if (existing) {
      return NextResponse.json({ error: 'Room Type already exists' }, { status: 400 });
    }

    const newRoomType = await prisma.roomType.create({
      data: {
        hotelId: hotel.id,
        name: name,
        basePrice: parseInt(basePrice, 10)
      }
    });

    return NextResponse.json(newRoomType);
  } catch (error) {
    console.error('Error creating room type:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
