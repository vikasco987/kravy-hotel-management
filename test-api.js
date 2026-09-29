const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function testAPI() {
  const hotel = await prisma.hotel.findFirst();
  
  const floors = await prisma.floor.findMany({
    where: { hotelId: hotel.id },
    include: {
      rooms: {
        where: { isActive: true },
        include: { roomType: true }
      }
    }
  });

  let totalRooms = 0;
  let available = 0;
  let allRooms = await prisma.room.findMany({ where: { hotelId: hotel.id } });
  let allActiveRooms = await prisma.room.findMany({ where: { hotelId: hotel.id, isActive: true } });

  floors.forEach(floor => {
    floor.rooms.forEach(room => {
      totalRooms++;
      if (room.status === 'AVAILABLE') available++;
    });
  });

  console.log('Total rooms in DB (including inactive):', allRooms.length);
  console.log('Total active rooms in DB:', allActiveRooms.length);
  console.log('Dashboard logic - Total Rooms:', totalRooms);
  console.log('Dashboard logic - Available Rooms:', available);
}
testAPI().finally(() => prisma.$disconnect());
