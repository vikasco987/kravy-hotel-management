const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTests() {
  const hotel = await prisma.hotel.findFirst();
  if (!hotel) return console.log('No hotel found');

  // Test 1: Empty floor
  const floor1 = await prisma.floor.create({
    data: { name: 'Test Empty Floor', floorNumber: 900, hotelId: hotel.id }
  });

  // Verify deletion directly using the logic from the API route
  let check = await prisma.floor.findFirst({
    where: { id: floor1.id },
    include: { _count: { select: { rooms: { where: { isActive: true } } } } }
  });
  console.log('Empty Floor rooms count:', check._count.rooms);
  
  if (check._count.rooms === 0) {
    await prisma.floor.delete({ where: { id: floor1.id } });
    console.log('Empty floor successfully deleted');
  }

  // Test 2: Floor with ONLY soft-deleted rooms
  const floor2 = await prisma.floor.create({
    data: { name: 'Test Soft-deleted Floor', floorNumber: 901, hotelId: hotel.id }
  });
  const roomType = await prisma.roomType.findFirst({ where: { hotelId: hotel.id } });
  await prisma.room.create({
    data: {
      hotelId: hotel.id,
      floorId: floor2.id,
      roomTypeId: roomType.id,
      roomNumber: 'SD-1',
      status: 'BLOCKED',
      isActive: false
    }
  });

  check = await prisma.floor.findFirst({
    where: { id: floor2.id },
    include: { _count: { select: { rooms: { where: { isActive: true } } } } }
  });
  console.log('Soft-deleted Floor rooms count:', check._count.rooms);

  if (check._count.rooms === 0) {
    await prisma.floor.delete({ where: { id: floor2.id } });
    console.log('Soft-deleted floor successfully deleted');
  }

  // Test 3: Floor with an active room
  const floor3 = await prisma.floor.create({
    data: { name: 'Test Active Floor', floorNumber: 902, hotelId: hotel.id }
  });
  await prisma.room.create({
    data: {
      hotelId: hotel.id,
      floorId: floor3.id,
      roomTypeId: roomType.id,
      roomNumber: 'ACT-1',
      status: 'AVAILABLE',
      isActive: true
    }
  });

  check = await prisma.floor.findFirst({
    where: { id: floor3.id },
    include: { _count: { select: { rooms: { where: { isActive: true } } } } }
  });
  console.log('Active Floor rooms count:', check._count.rooms);

  if (check._count.rooms > 0) {
    console.log('Active floor blocked from deletion (Expected behavior)');
  }
}
runTests().catch(console.error).finally(() => prisma.$disconnect());
