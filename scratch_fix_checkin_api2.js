const fs = require('fs');

let c = fs.readFileSync('src/app/api/hotel/bookings/check-in/route.ts', 'utf8');

c = c.replace(
  /console\.log\("Creating Reservation record"\);\s*\/\/\ 2\. Create Reservation\s*const reservation = await tx\.reservation\.create\(\{\s*data: \{\s*hotelId: hotelId,\s*guestId: guest\.id,\s*status: 'CHECKED_IN',\s*totalAmount: Math\.round\(totalAmount \* 100\),\s*advancePaid: Math\.round\(advancePaid \* 100\),\s*\}\s*\}\);/,
  `console.log("Handling Reservation record");
      let reservationIdToUse = reservationId;
      if (reservationId) {
         await tx.reservation.update({
           where: { id: reservationId },
           data: {
             guestId: guest.id,
             status: 'CHECKED_IN',
             totalAmount: Math.round(totalAmount * 100),
             advancePaid: Math.round(advancePaid * 100)
           }
         });
         await tx.reservationRoom.deleteMany({ where: { reservationId: reservationId } });
      } else {
         const newRes = await tx.reservation.create({
           data: {
             hotelId: hotelId,
             guestId: guest.id,
             status: 'CHECKED_IN',
             totalAmount: Math.round(totalAmount * 100),
             advancePaid: Math.round(advancePaid * 100),
           }
         });
         reservationIdToUse = newRes.id;
      }`
);

fs.writeFileSync('src/app/api/hotel/bookings/check-in/route.ts', c);
