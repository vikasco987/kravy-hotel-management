import { PrismaClient, RoomStatus } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Kravy Grand Hotel...')
  
  // 1. Create Business
  const business = await prisma.business.create({
    data: {
      name: 'Kravy Hospitality Group',
    }
  })

  // 2. Create Hotel
  const hotel = await prisma.hotel.create({
    data: {
      name: 'Kravy Grand Hotel',
      businessId: business.id
    }
  })

  // 3. Create Floors
  const floor1 = await prisma.floor.create({
    data: { name: '1ST FLOOR', floorNumber: 1, hotelId: hotel.id }
  })
  
  const floor2 = await prisma.floor.create({
    data: { name: '2ND FLOOR', floorNumber: 2, hotelId: hotel.id }
  })

  // 4. Create Room Types
  const standardType = await prisma.roomType.create({
    data: { name: 'Standard', basePrice: 1500.00, hotelId: hotel.id }
  })
  
  const deluxeType = await prisma.roomType.create({
    data: { name: 'Deluxe', basePrice: 2500.00, hotelId: hotel.id }
  })
  
  const suiteType = await prisma.roomType.create({
    data: { name: 'Suite', basePrice: 4500.00, hotelId: hotel.id }
  })

  // 5. Create Rooms
  // 1st Floor
  await prisma.room.createMany({
    data: [
      { hotelId: hotel.id, floorId: floor1.id, roomTypeId: deluxeType.id, roomNumber: '101', status: RoomStatus.AVAILABLE },
      { hotelId: hotel.id, floorId: floor1.id, roomTypeId: deluxeType.id, roomNumber: '102', status: RoomStatus.OCCUPIED },
      { hotelId: hotel.id, floorId: floor1.id, roomTypeId: standardType.id, roomNumber: '103', status: RoomStatus.DIRTY },
      { hotelId: hotel.id, floorId: floor1.id, roomTypeId: suiteType.id, roomNumber: '104', status: RoomStatus.AVAILABLE },
      { hotelId: hotel.id, floorId: floor1.id, roomTypeId: deluxeType.id, roomNumber: '105', status: RoomStatus.BLOCKED },
    ]
  })

  // 2nd Floor
  await prisma.room.createMany({
    data: [
      { hotelId: hotel.id, floorId: floor2.id, roomTypeId: standardType.id, roomNumber: '201', status: RoomStatus.MAINTENANCE },
      { hotelId: hotel.id, floorId: floor2.id, roomTypeId: deluxeType.id, roomNumber: '202', status: RoomStatus.AVAILABLE },
      { hotelId: hotel.id, floorId: floor2.id, roomTypeId: suiteType.id, roomNumber: '203', status: RoomStatus.OCCUPIED },
      { hotelId: hotel.id, floorId: floor2.id, roomTypeId: deluxeType.id, roomNumber: '204', status: RoomStatus.DIRTY },
      { hotelId: hotel.id, floorId: floor2.id, roomTypeId: standardType.id, roomNumber: '205', status: RoomStatus.AVAILABLE },
    ]
  })

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
