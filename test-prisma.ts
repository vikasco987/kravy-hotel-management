const { default: prisma } = require('./src/lib/prisma.ts');

async function test() {
  try {
    console.log("Checking prisma.extraService:", !!prisma.extraService);
    
    const hotel = await prisma.hotel.findFirst();
    if (!hotel) {
      console.log("No hotel found");
      return;
    }
    console.log("Found hotel:", hotel.id);

    const service = await prisma.extraService.create({
      data: {
        hotelId: hotel.id,
        name: 'Laundry',
        price: 15000,
        description: '',
        isActive: true
      }
    });
    console.log("Created successfully:", service);
  } catch (error) {
    console.error("Failed to create:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
