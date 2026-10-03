const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const room2 = await prisma.room.findFirst({ where: { roomNumber: '2' } });
  const resRoom = await prisma.reservationRoom.findFirst({ 
      where: { roomId: room2.id },
      include: { reservation: true }
  });
  console.log('ReservationRoom checkInDate:', resRoom.checkInDate);
  console.log('ReservationRoom checkOutDate:', resRoom.checkOutDate);
}
main().finally(() => prisma.$disconnect());
