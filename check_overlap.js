const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const room1 = await prisma.room.findFirst({ where: { roomNumber: '1' } });
  const checkInParsed = new Date('2026-10-03');
  const checkOutParsed = new Date('2026-10-04');
  
  const existing = await prisma.reservationRoom.findFirst({
      where: {
         roomId: room1.id,
         reservation: {
            status: {
               in: ['RESERVED', 'CONFIRMED', 'CHECKED_IN']
            }
         },
         checkInDate: {
            lt: checkOutParsed
         },
         checkOutDate: {
            gt: checkInParsed
         }
      },
      include: { reservation: true }
  });
  console.log('Existing overlap:', existing);
}
main().finally(() => prisma.$disconnect());
