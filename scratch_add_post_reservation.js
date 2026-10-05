const fs = require('fs');
let c = fs.readFileSync('src/app/api/hotel/reservations/route.ts', 'utf8');

if (!c.includes('export async function POST')) {
    const postCode = `
export async function POST(req: Request) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.user || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hotelId = authContext.hotel.id;
    const body = await req.json();
    const { 
      guestName, guestPhone, guestEmail, guestAddress,
      checkInDate, checkOutDate, nights,
      rooms, // Array of { roomId, baseRate, guestsData }
      totalAmount, advanceAmount, paymentMode,
      source
    } = body;

    if (!rooms || rooms.length === 0) {
      return NextResponse.json({ error: 'At least one room must be selected' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Guest
      const guest = await tx.guest.create({
         data: {
            businessId: authContext.business.id,
            name: guestName,
            phone: guestPhone,
            email: guestEmail,
            address: guestAddress
         }
      });

      // 2. Create Reservation
      const reservation = await tx.reservation.create({
         data: {
            hotelId,
            guestId: guest.id,
            guestName,
            guestPhone,
            guestEmail,
            status: 'RESERVED',
            totalAmount: Math.round(totalAmount * 100),
            advanceAmount: advanceAmount ? Math.round(advanceAmount * 100) : 0,
            checkInDate: new Date(checkInDate),
            checkOutDate: new Date(checkOutDate),
            nights,
            source: source || 'Direct'
         }
      });

      // 3. Create Reservation Rooms
      for (const room of rooms) {
         // Overlap protection
         const existing = await tx.reservationRoom.findFirst({
            where: {
               roomId: room.roomId,
               reservation: { status: { in: ['RESERVED', 'CONFIRMED', 'CHECKED_IN'] } },
               OR: [
                  { checkInDate: { lt: new Date(checkOutDate) }, checkOutDate: { gt: new Date(checkInDate) } }
               ]
            }
         });
         
         if (existing) {
             throw new Error(\`Room \${room.roomId} is already booked for these dates.\`);
         }

         await tx.reservationRoom.create({
            data: {
               reservationId: reservation.id,
               roomId: room.roomId,
               checkInDate: new Date(checkInDate),
               checkOutDate: new Date(checkOutDate),
               baseRate: room.baseRate ? Math.round(room.baseRate * 100) : 0,
               appliedRate: room.baseRate ? Math.round(room.baseRate * 100) : 0,
               guestsData: room.guestsData || null
            }
         });
      }

      return reservation;
    });

    return NextResponse.json({ success: true, reservation: result }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating reservation:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
`;
    c = c + '\n' + postCode;
    fs.writeFileSync('src/app/api/hotel/reservations/route.ts', c);
}
