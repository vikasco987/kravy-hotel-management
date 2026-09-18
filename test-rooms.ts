import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const rooms = await prisma.room.findMany({ take: 2 });
  console.log(rooms);
}
main();
