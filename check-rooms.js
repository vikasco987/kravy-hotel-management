const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRooms() {
  const hotel = await prisma.hotel.findFirst();
  if (!hotel) return console.log('No hotel found');

  const allRooms = await prisma.room.findMany({
    where: { hotelId: hotel.id },
    include: { floor: true }
  });

  const activeRooms = allRooms.filter(r => r.isActive);
  const inactiveRooms = allRooms.filter(r => !r.isActive);

  console.log('Total Room records:', allRooms.length);
  console.log('Active Room records:', activeRooms.length);
  console.log('Inactive Room records:', inactiveRooms.length);
  console.log('\n--- ACTIVE ROOMS ---');
  activeRooms.forEach(r => {
    console.log(`ID: ${r.id} | Number: ${r.roomNumber} | Floor: ${r.floor ? r.floor.name : 'NO FLOOR'} (ID: ${r.floorId}) | Status: ${r.status}`);
  });
  console.log('\n--- INACTIVE ROOMS ---');
  inactiveRooms.forEach(r => {
    console.log(`ID: ${r.id} | Number: ${r.roomNumber} | Floor: ${r.floor ? r.floor.name : 'NO FLOOR'} (ID: ${r.floorId}) | Status: ${r.status}`);
  });
}
checkRooms().finally(() => prisma.$disconnect());
