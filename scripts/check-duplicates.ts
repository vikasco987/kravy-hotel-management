import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Checking for duplicate reservation numbers...");
  
  try {
    const duplicates = await prisma.reservation.groupBy({
      by: ['reservationNumber'],
      having: { reservationNumber: { _count: { gt: 1 } } }
    });

    // We filter out 'null' because nulls are not considered duplicates for our purpose yet.
    const actualDuplicates = duplicates.filter(d => d.reservationNumber !== null);

    if (actualDuplicates.length > 0) {
      console.log(`Found ${actualDuplicates.length} duplicate numbers:`, actualDuplicates);
    } else {
      console.log("No duplicate reservation numbers found. Safe to proceed with unique index.");
    }
  } catch (error) {
    console.log("Database connector does not support groupBy/having. Using in-memory check fallback.");
    
    // In-memory fallback
    const all = await prisma.reservation.findMany({
      where: { reservationNumber: { not: null } },
      select: { reservationNumber: true }
    });
    
    const seen = new Set();
    const dups = new Set();
    
    for (const r of all) {
      if (seen.has(r.reservationNumber)) {
        dups.add(r.reservationNumber);
      }
      seen.add(r.reservationNumber);
    }
    
    if (dups.size > 0) {
      console.log(`Found ${dups.size} duplicate numbers:`, Array.from(dups));
    } else {
      console.log("No duplicate reservation numbers found via memory check. Safe to proceed.");
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
