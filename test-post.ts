import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  try {
    const hotel = await prisma.hotel.findFirst();
    console.log("Hotel ID:", hotel?.id);
    
    if (!hotel) {
      console.log("No hotel found");
      return;
    }

    const payload = {
      name: "Laundry",
      price: 150,
      description: "",
      isActive: true
    };

    const service = await prisma.extraService.create({
      data: {
        hotelId: hotel.id,
        name: payload.name,
        price: Math.round(Number(payload.price) * 100),
        description: payload.description,
        isActive: payload.isActive !== undefined ? payload.isActive : true
      }
    });
    
    console.log("Success:", service);
  } catch (err) {
    console.error("Error creating:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
