import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Reservation Number Backfill...");

  // 1. Fetch all reservations that do not have a reservationNumber yet, ordered by createdAt
  const pendingReservations = await prisma.reservation.findMany({
    where: {
      OR: [
        { reservationNumber: null },
        { reservationNumber: { isSet: false } }
      ]
    },
    orderBy: [
      { createdAt: 'asc' },
      { id: 'asc' } // tie-breaker
    ]
  });

  console.log(`Found ${pendingReservations.length} reservations needing a number.`);

  if (pendingReservations.length === 0) {
    console.log("Nothing to backfill. Exiting safely.");
    return;
  }

  // 2. Fetch the absolute highest assigned number from the database to prevent duplicates on restart
  const maxAgg = await prisma.reservation.aggregate({
    _max: { reservationNumber: true }
  });
  
  let nextSequence = maxAgg._max.reservationNumber ? maxAgg._max.reservationNumber : 1000;
  console.log(`Starting sequence from: ${nextSequence + 1}`);

  // Seed or correct the counter initially to guarantee it's at least at the absolute max
  const existingCounter = await prisma.counter.findUnique({
    where: { id: 'ReservationSequence' }
  });
  
  if (existingCounter) {
    if (existingCounter.value < nextSequence) {
      await prisma.counter.update({
        where: { id: 'ReservationSequence' },
        data: { value: nextSequence }
      });
      console.log(`Corrected desynced counter from ${existingCounter.value} to ${nextSequence}`);
    }
  } else {
    await prisma.counter.create({
      data: { id: 'ReservationSequence', value: nextSequence }
    });
  }

  // 3. Sequentially update each reservation
  let successCount = 0;
  for (const reservation of pendingReservations) {
    // Atomically increment the sequence first
    const counter = await prisma.counter.upsert({
      where: { id: 'ReservationSequence' },
      update: { value: { increment: 1 } },
      create: { id: 'ReservationSequence', value: nextSequence + 1 }
    });
    
    try {
      // Atomic condition: updateMany allows arbitrary where clauses in Prisma
      const result = await prisma.reservation.updateMany({
        where: { 
          id: reservation.id, 
          OR: [
            { reservationNumber: null },
            { reservationNumber: { isSet: false } }
          ]
        },
        data: { reservationNumber: counter.value }
      });
      
      if (result.count === 0) {
        console.log(`Skipped reservation ${reservation.id} - already numbered concurrently.`);
        continue;
      }
      successCount++;
      console.log(`Assigned RES-${counter.value} to reservation ${reservation.id}`);
    } catch (error: any) {
      console.error(`Failed to update reservation ${reservation.id}:`, error);
      console.log("Aborting backfill due to error. You can safely run this script again.");
      process.exit(1);
    }
  }

  console.log(`Backfill complete. Successfully updated ${successCount} reservations.`);
  console.log(`Counter updated to ${nextSequence}.`);
}

main()
  .catch((e) => {
    console.error("Unhandled error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
