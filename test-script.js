const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  try {
    const hotel = await prisma.hotel.findFirst();
    let floor = await prisma.floor.create({
      data: { hotelId: hotel.id, name: 'TEST_FLOOR', floorNumber: 999 }
    });
    
    // Simulate what the UI sends
    const reqBody = {
      floorId: floor.id,
      roomTypeName: 'Standard',
      roomNumber: 'TEST-999',
      status: 'AVAILABLE'
    };
    
    const { floorId, roomTypeId, roomTypeName, roomNumber, status, basePrice } = reqBody;

    // 1. Validate Floor belongs to current hotel
    floor = await prisma.floor.findFirst({
      where: { id: floorId, hotelId: hotel.id }
    });
    if (!floor) throw new Error('Invalid floor for this hotel');

    // 2. Resolve RoomType
    let roomType = await prisma.roomType.findFirst({
        where: { name: roomTypeName, hotelId: hotel.id }
    });
    if (!roomType) {
        roomType = await prisma.roomType.create({
          data: {
            hotelId: hotel.id,
            name: roomTypeName,
            basePrice: 150000
          }
        });
    }
    const finalRoomTypeId = roomType.id;

    // 4. Create room
    const newRoom = await prisma.room.create({
      data: {
        hotelId: hotel.id,
        floorId,
        roomTypeId: finalRoomTypeId,
        roomNumber,
        status: status,
      }
    });

    console.log('ROOM CREATED:', newRoom);
    await prisma.room.delete({ where: { id: newRoom.id } });
    await prisma.floor.delete({ where: { id: floor.id } });
  } catch (err) {
    console.error("CAUGHT ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
