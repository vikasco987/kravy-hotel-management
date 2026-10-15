import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthContext } from '@/lib/authContext';
import { requirePermission } from '@/lib/permissions';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasFloors = requirePermission(authContext.user, 'page:floors').authorized;
    const hasRooms = requirePermission(authContext.user, 'page:rooms').authorized;
    if (!hasFloors && !hasRooms) {
      const authCheck = requirePermission(authContext.user, 'page:floors');
      return NextResponse.json(authCheck.errorResponse, { status: 403 });
    }

    const { hotel } = authContext;
    const floors = await prisma.floor.findMany({
      where: { hotelId: hotel.id, isActive: true },
      include: {
        rooms: {
          where: { isActive: true },
        },
      },
      orderBy: { floorNumber: 'asc' },
    });

    return NextResponse.json(floors);
  } catch (error) {
    console.error('Error fetching floors:', error);
    return NextResponse.json({ error: 'Failed to fetch floors' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authCheck = requirePermission(authContext.user, 'action:floors:create');
    if (!authCheck.authorized) {
      return NextResponse.json(authCheck.errorResponse, { status: 403 });
    }

    const { hotel } = authContext;
    const body = await req.json();
    const { name, floorNumber } = body;

    let finalFloorNumber = floorNumber !== undefined ? parseInt(floorNumber) : 1;
    if (floorNumber === undefined) {
      const maxFloor = await prisma.floor.aggregate({
        where: { hotelId: hotel.id, isActive: true },
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
