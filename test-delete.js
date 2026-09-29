const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hotel = await prisma.hotel.findFirst();
  console.log('Hotel:', hotel.id);
  const rooms = await prisma.room.findMany({ where: { hotelId: hotel.id, isActive: true } });
  console.log('Active rooms count:', rooms.length);
  if (rooms.length > 0) {
    const room = rooms[0];
    console.log('Deleting room:', room.id, room.roomNumber);
    await prisma.room.update({
      where: { id: room.id },
      data: { isActive: false, roomNumber: room.roomNumber + '_deleted' }
    });
    
    // Check dashboard query equivalent
    const floors = await prisma.floor.findMany({
      where: { hotelId: hotel.id },
      include: {
        rooms: {
          where: { isActive: true }
        }
      }
    });
    const dashboardRoomsCount = floors.reduce((acc, f) => acc + f.rooms.length, 0);
    console.log('Dashboard active rooms count after delete:', dashboardRoomsCount);
  }
}
main().finally(() => prisma.$disconnect());
