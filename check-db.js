const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    const business = await prisma.business.findFirst({ where: { createdBy: user.id } });
    const hotel = business ? await prisma.hotel.findFirst({ where: { businessId: business.id } }) : null;
    console.log('User:', user.id, 'Role:', user.role, 'Business:', business?.id, 'Hotel:', hotel?.id);
  }
}
run().finally(() => prisma.$disconnect());
