const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.findMany();
  console.log('Users:', users.length);
  const businesses = await prisma.business.findMany();
  console.log('Businesses:', businesses.length, businesses.map(b => b.id));
  const hotels = await prisma.hotel.findMany();
  console.log('Hotels:', hotels.length, hotels.map(h => ({id: h.id, businessId: h.businessId})));
}
run().finally(() => prisma.$disconnect());
