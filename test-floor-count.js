const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const hotel = await prisma.hotel.findFirst();
  const floor = await prisma.floor.findFirst({
    where: { hotelId: hotel.id },
    include: {
      _count: {
        select: {
          rooms: {
            where: { isActive: true }
          }
        }
      }
    }
  });
  console.log(floor._count.rooms);
}
test().finally(() => prisma.$disconnect());
