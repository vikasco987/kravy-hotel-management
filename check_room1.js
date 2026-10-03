const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const room1 = await prisma.room.findFirst({ where: { roomNumber: '1' } });
  console.log('Room 1 ID:', room1.id);
  const resRoom = await prisma.reservationRoom.findMany({ 
      where: { roomId: room1.id },
      include: { reservation: true }
  });
  console.log('ReservationRooms for Room 1:', JSON.stringify(resRoom.map(r => ({
      id: r.id,
      checkInDate: r.checkInDate,
      checkOutDate: r.checkOutDate,
      status: r.reservation.status
  })), null, 2));
}
main().finally(() => prisma.$disconnect());
