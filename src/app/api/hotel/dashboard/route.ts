import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthContext } from '@/lib/authContext';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized or Hotel not found for this business' }, { status: 401 });
    }

    const { hotel } = authContext;

    // Securely scoped query to ONLY the authenticated business's hotel
    const floors = await prisma.floor.findMany({
      where: { hotelId: hotel.id },
      include: {
        rooms: {
          include: {
            roomType: true,
          },
          orderBy: { roomNumber: 'asc' }
        }
      },
      orderBy: { floorNumber: 'asc' }
    });

    // Calculate summary statistics
    let totalRooms = 0;
    let available = 0;
    let reserved = 0;
    let occupied = 0;
    let dirty = 0;
    let cleaning = 0;
    let maintenance = 0;
    let blocked = 0;

    const formattedFloors = floors.map((floor) => {
      const formattedRooms = floor.rooms.map((room) => {
        totalRooms++;
        
        switch (room.status) {
          case 'AVAILABLE': available++; break;
          case 'RESERVED': reserved++; break;
          case 'OCCUPIED': occupied++; break;
          case 'DIRTY': dirty++; break;
          case 'CLEANING': cleaning++; break;
          case 'MAINTENANCE': maintenance++; break;
          case 'BLOCKED': blocked++; break;
        }

        return {
          id: room.id,
          roomNumber: room.roomNumber,
          status: room.status,
          roomType: room.roomType?.name || 'Unknown',
          price: room.roomType?.basePrice || 0
        };
      });

      return {
        id: floor.id,
        name: floor.name,
        floorNumber: floor.floorNumber,
        rooms: formattedRooms
      };
    });

    const occupancyPercent = totalRooms > 0 ? Math.round(((occupied + reserved) / totalRooms) * 100) : 0;

    const summary = {
      totalRooms,
      available,
      reserved,
      occupied,
      dirty,
      cleaning,
      maintenance,
      blocked,
      occupancyPercent
    };

    return NextResponse.json({
      summary,
      floors: formattedFloors,
      vacatingRooms: [] // Stub for Phase 2 Check-out workflow
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
