import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const totalReservations = await prisma.reservation.count();
  const nullNumbers = await prisma.reservation.count({ where: { reservationNumber: null } });
  console.log(`Total reservations: ${totalReservations}`);
  console.log(`Missing reservation numbers: ${nullNumbers}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
