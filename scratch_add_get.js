const fs = require('fs');
let c = fs.readFileSync('src/app/api/hotel/reservations/[id]/route.ts', 'utf8');

if (!c.includes('export async function GET')) {
    const getCode = `
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const authContext = await getAuthContext();
    if (!authContext || !authContext.user || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hotelId = authContext.hotel.id;
    const reservationId = params.id;

    if (!reservationId) {
      return NextResponse.json({ error: 'Reservation ID is required' }, { status: 400 });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { 
        guest: true,
        rooms: true,
        stay: {
           include: {
              stayRooms: true,
              roomCharges: true,
              payments: true,
              invoice: true
           }
        }
      }
    });

    if (!reservation || reservation.hotelId !== hotelId) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Since we only get roomIds, we may want to fetch room details to show names.
    const roomIds = reservation.rooms.map(r => r.roomId).filter(Boolean);
    if (reservation.stay) {
        reservation.stay.stayRooms.forEach(sr => {
           if (sr.roomId && !roomIds.includes(sr.roomId)) roomIds.push(sr.roomId);
        });
    }

    const rooms = await prisma.room.findMany({
       where: { id: { in: roomIds } },
       include: { roomType: true }
    });

    return NextResponse.json({ success: true, reservation, roomDetails: rooms }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching reservation:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
`;
    c = c + '\n' + getCode;
    fs.writeFileSync('src/app/api/hotel/reservations/[id]/route.ts', c);
}
