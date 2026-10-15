import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthContext } from '@/lib/authContext';
import { requirePermission } from '@/lib/permissions';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Bulk room lookup is used during check-in, booking setup, and rooms management
    const hasCheckin = requirePermission(authContext.user, 'page:checkin').authorized;
    const hasReservations = requirePermission(authContext.user, 'page:reservations').authorized;
    const hasRooms = requirePermission(authContext.user, 'page:rooms').authorized;

    if (!hasCheckin && !hasReservations && !hasRooms) {
      const authCheck = requirePermission(authContext.user, 'page:checkin');
      return NextResponse.json(authCheck.errorResponse, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    
    if (!idsParam) {
      return NextResponse.json({ error: 'Missing ids parameter' }, { status: 400 });
    }

    const ids = idsParam.split(',');

    const rooms = await prisma.room.findMany({
      where: {
        id: { in: ids },
        hotelId: authContext.hotel.id
      },
      include: {
        roomType: true
      }
    });

    return NextResponse.json({ rooms });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
