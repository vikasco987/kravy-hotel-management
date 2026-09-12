import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getAuthContext() {
  let business = await prisma.business.findFirst();
  
  if (!business) {
    business = await prisma.business.create({
      data: { name: 'Kravy Default Business' }
    });
  }

  let hotel = await prisma.hotel.findFirst({
    where: { businessId: business.id }
  });

  if (!hotel) {
    hotel = await prisma.hotel.create({
      data: {
        businessId: business.id,
        name: 'Kravy Grand Hotel'
      }
    });

    // Create default room types since we are at it
    await prisma.roomType.createMany({
      data: [
        { hotelId: hotel.id, name: 'Standard', basePrice: 150000 },
        { hotelId: hotel.id, name: 'Deluxe', basePrice: 250000 },
        { hotelId: hotel.id, name: 'Suite', basePrice: 500000 },
      ]
    });
  }

  return { business, hotel };
}
