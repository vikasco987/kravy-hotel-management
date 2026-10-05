const fs = require('fs');
let c = fs.readFileSync('src/app/api/hotel/reservations/[id]/route.ts', 'utf8');

if (!c.includes('export async function PUT')) {
    const putCode = `
export async function PUT(
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
    const body = await req.json();
    
    const { 
      guestName, guestPhone, guestEmail, guestAddress,
      checkInDate, checkOutDate, nights,
      rooms, 
      totalAmount, advanceAmount, paymentMode,
      source
    } = body;

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { stay: true }
    });

    if (!reservation || reservation.hotelId !== hotelId) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Basic edit: update guest info, dates, and amounts
    const result = await prisma.$transaction(async (tx) => {
       // Update Guest
       await tx.guest.update({
          where: { id: reservation.guestId },
          data: {
             name: guestName,
             phone: guestPhone,
             email: guestEmail,
             address: guestAddress
          }
       });

       // Update Reservation
       const updatedRes = await tx.reservation.update({
          where: { id: reservationId },
          data: {
             guestName,
             guestPhone,
             guestEmail,
             totalAmount: Math.round(totalAmount * 100),
             advanceAmount: advanceAmount ? Math.round(advanceAmount * 100) : reservation.advanceAmount,
             checkInDate: new Date(checkInDate),
             checkOutDate: new Date(checkOutDate),
             nights,
             source: source || reservation.source
          }
       });

       // For rooms, it's safer to delete existing reservationRooms and recreate them 
       // if the reservation is not yet checked in.
       if (!reservation.stay) {
           await tx.reservationRoom.deleteMany({
              where: { reservationId }
           });

           for (const room of rooms) {
               // Overlap protection
               const existing = await tx.reservationRoom.findFirst({
                  where: {
                     roomId: room.roomId,
                     reservation: { status: { in: ['RESERVED', 'CONFIRMED', 'CHECKED_IN'] }, id: { not: reservationId } },
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
                     reservationId,
                     roomId: room.roomId,
                     checkInDate: new Date(checkInDate),
                     checkOutDate: new Date(checkOutDate),
                     baseRate: room.baseRate ? Math.round(room.baseRate * 100) : 0,
                     appliedRate: room.baseRate ? Math.round(room.baseRate * 100) : 0,
                     guestsData: room.guestsData || null
                  }
               });
           }
       }
       return updatedRes;
    });

    return NextResponse.json({ success: true, reservation: result }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating reservation:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
`;
    c = c + '\n' + putCode;
    fs.writeFileSync('src/app/api/hotel/reservations/[id]/route.ts', c);
}
