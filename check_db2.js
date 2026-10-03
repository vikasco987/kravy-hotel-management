const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const room2 = await prisma.room.findFirst({ where: { roomNumber: '2' } });
  const stays = await prisma.stayRoom.findMany({ where: { roomId: room2.id, checkOutDate: null } });
  console.log('Active StayRooms:', stays.length);
  if (stays.length > 0) {
      console.log('Stay 1 checkOutDate:', stays[0].checkOutDate, 'stayId:', stays[0].stayId);
  }
}
main().finally(() => prisma.$disconnect());
