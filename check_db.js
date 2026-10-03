const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const rooms = await prisma.room.findMany();
  for (const r of rooms) {
    if (r.roomNumber === '2') {
      console.log('Room 2 ID:', r.id);
      console.log('Room Status:', r.status);
      const stays = await prisma.stayRoom.findMany({ where: { roomId: r.id, checkOutDate: null } });
      console.log('Active StayRooms:', stays);
      const resRooms = await prisma.reservationRoom.findMany({ where: { roomId: r.id }, include: { reservation: true } });
      console.log('ReservationRooms:', JSON.stringify(resRooms, null, 2));
    }
  }
}
main().finally(() => prisma.$disconnect());
