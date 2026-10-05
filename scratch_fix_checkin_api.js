const fs = require('fs');

let c = fs.readFileSync('src/app/api/hotel/bookings/check-in/route.ts', 'utf8');

c = c.replace(
  'const { roomIds, roomPricing, roomGuests, totalAmount, advancePaid, paymentMode, checkInDate, checkOutDate } = payload;',
  'const { reservationId, roomIds, roomPricing, roomGuests, totalAmount, advancePaid, paymentMode, checkInDate, checkOutDate } = payload;'
);

const createResString = `      console.log("Creating Reservation record");
      // 2. Create Reservation
      const reservation = await tx.reservation.create({
        data: {
          hotelId: hotelId,
          guestId: guest.id,
          status: 'CHECKED_IN',
          totalAmount: Math.round(totalAmount * 100),
          advancePaid: Math.round(advancePaid * 100),
        }
      });`;

const updatedResString = `      console.log("Handling Reservation record");
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
      }`;

c = c.replace(createResString, updatedResString);

c = c.replace(/reservation\.id/g, 'reservationIdToUse');

fs.writeFileSync('src/app/api/hotel/bookings/check-in/route.ts', c);
