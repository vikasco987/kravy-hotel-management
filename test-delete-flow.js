const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTest() {
  const hotel = await prisma.hotel.findFirst();
  const floor = await prisma.floor.findFirst({ where: { hotelId: hotel.id } });
  const roomType = await prisma.roomType.findFirst({ where: { hotelId: hotel.id } });
  
  console.log('Creating Test Room...');
  const newRoom = await prisma.room.create({
    data: {
      hotelId: hotel.id,
      floorId: floor.id,
      roomTypeId: roomType.id,
      roomNumber: 'Test-999',
      status: 'AVAILABLE'
    }
  });
  console.log('Created room:', newRoom.id);

  console.log('Fetching active rooms from dashboard logic...');
  const floorsBefore = await prisma.floor.findMany({
    where: { hotelId: hotel.id },
    include: { rooms: { where: { isActive: true } } }
  });
  const countBefore = floorsBefore.reduce((acc, f) => acc + f.rooms.length, 0);
  console.log('Active rooms count before delete:', countBefore);

  console.log('Simulating DELETE API call...');
  await prisma.room.update({
    where: { id: newRoom.id },
    data: { 
      isActive: false, 
      status: 'BLOCKED',
      roomNumber: newRoom.roomNumber + '_deleted_' + Date.now()
    }
  });

  console.log('Fetching active rooms from dashboard logic AFTER delete...');
  const floorsAfter = await prisma.floor.findMany({
    where: { hotelId: hotel.id },
    include: { rooms: { where: { isActive: true } } }
  });
  const countAfter = floorsAfter.reduce((acc, f) => acc + f.rooms.length, 0);
  console.log('Active rooms count after delete:', countAfter);
}

runTest().catch(console.error).finally(() => prisma.$disconnect());
