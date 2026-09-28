import re

# 1. Fix RoomDashboard payload
with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

payload_old = """        body: JSON.stringify({
          floorId: newRoomFloorId,
          roomTypeName: newRoomType,
          roomNumber: newRoomNumber,
          status: newRoomStatus
        })"""
payload_new = """        body: JSON.stringify({
          floorId: newRoomFloorId,
          roomTypeName: newRoomType,
          roomNumber: newRoomNumber,
          status: newRoomStatus,
          basePrice: newRoomPrice
        })"""
content = content.replace(payload_old, payload_new)
with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)


# 2. Fix rooms API to handle basePrice
with open('src/app/api/hotel/rooms/route.ts', 'r') as f:
    content = f.read()

content = content.replace("const { floorId, roomTypeId, roomTypeName, roomNumber, status } = body;", "const { floorId, roomTypeId, roomTypeName, roomNumber, status, basePrice } = body;")

room_type_create_old = """      // Fallback: if room type name doesn't exist, create it on the fly!
      if (!roomType) {
        roomType = await prisma.roomType.create({
          data: {
            hotelId: hotel.id,
            name: roomTypeName,
            basePrice: 150000 // default to 1500 INR
          }
        });
      }"""
room_type_create_new = """      // Fallback: if room type name doesn't exist, create it on the fly!
      if (!roomType) {
        roomType = await prisma.roomType.create({
          data: {
            hotelId: hotel.id,
            name: roomTypeName,
            basePrice: basePrice ? Math.round(basePrice * 100) : 150000
          }
        });
      } else if (basePrice) {
         roomType = await prisma.roomType.update({
            where: { id: roomType.id },
            data: { basePrice: Math.round(basePrice * 100) }
         });
      }"""
content = content.replace(room_type_create_old, room_type_create_new)
with open('src/app/api/hotel/rooms/route.ts', 'w') as f:
    f.write(content)


# 3. Fix check-in API to create ReservationRoom
with open('src/app/api/hotel/bookings/check-in/route.ts', 'r') as f:
    content = f.read()

checkin_old = """      console.log("Creating Reservation record");
      // 2. Create Reservation
      const reservation = await tx.reservation.create({
        data: {
          hotelId: authContext.hotel.id,
          guestId: guest.id,
          status: 'CHECKED_IN',
          totalAmount: Math.round(totalAmount * 100), // Note: We should ideally recalculate this total too, but keeping as is for now
          advancePaid: Math.round(advancePaid * 100),
        }
      });

      console.log("Creating Stay record");"""

checkin_new = """      console.log("Creating Reservation record");
      // 2. Create Reservation
      const reservation = await tx.reservation.create({
        data: {
          hotelId: authContext.hotel.id,
          guestId: guest.id,
          status: 'CHECKED_IN',
          totalAmount: Math.round(totalAmount * 100),
          advancePaid: Math.round(advancePaid * 100),
        }
      });

      console.log("Creating ReservationRoom records to persist check-in/out dates");
      const nights = calculateNights(checkInDate, checkOutDate);
      for (const roomId of roomIds) {
          if (roomId.length === 24) {
             const room = await tx.room.findFirst({ where: { id: roomId }, include: { roomType: true } });
             await tx.reservationRoom.create({
                data: {
                   reservationId: reservation.id,
                   roomId: roomId,
                   checkInDate: new Date(checkInDate),
                   checkOutDate: new Date(checkOutDate),
                   baseRate: room?.roomType?.basePrice || 250000,
                   appliedRate: Math.round((roomPricing?.[roomId]?.baseRate || 2500) * 100)
                }
             });
          }
      }

      console.log("Creating Stay record");"""
content = content.replace(checkin_old, checkin_new)

# Wait, calculateNights might not be available there. Let's see if nights is already calculated.
# `const nights = calculateNights(checkInDate, checkOutDate);` is already calculated BELOW this block! 
# Let me move the calculation UP or just re-calculate or just omit it since it's not needed for ReservationRoom? Wait, ReservationRoom doesn't have `nights`. It only has checkInDate and checkOutDate. So I don't need `nights`!

checkin_new = """      console.log("Creating Reservation record");
      // 2. Create Reservation
      const reservation = await tx.reservation.create({
        data: {
          hotelId: authContext.hotel.id,
          guestId: guest.id,
          status: 'CHECKED_IN',
          totalAmount: Math.round(totalAmount * 100),
          advancePaid: Math.round(advancePaid * 100),
        }
      });

      console.log("Creating ReservationRoom records to persist check-in/out dates");
      for (const roomId of roomIds) {
          if (roomId.length === 24) {
             const room = await tx.room.findFirst({ where: { id: roomId }, include: { roomType: true } });
             await tx.reservationRoom.create({
                data: {
                   reservationId: reservation.id,
                   roomId: roomId,
                   checkInDate: new Date(checkInDate),
                   checkOutDate: new Date(checkOutDate),
                   baseRate: room?.roomType?.basePrice || 250000,
                   appliedRate: Math.round((roomPricing?.[roomId]?.baseRate || 2500) * 100)
                }
             });
          }
      }

      console.log("Creating Stay record");"""
content = content.replace(checkin_new.replace("const nights = calculateNights(checkInDate, checkOutDate);\n      ", ""), checkin_new)

with open('src/app/api/hotel/bookings/check-in/route.ts', 'w') as f:
    f.write(content)

# 4. Fix checkin-data API
with open('src/app/api/hotel/checkin-data/route.ts', 'r') as f:
    content = f.read()

# Make sure the UI will display CheckOut properly. 
# Also, historical check-ins might not have ReservationRoom records, but they will have StayRoom records.
# Let's fallback to StayRoom if ReservationRoom is empty.
fallback_old = """      for (const rr of res.rooms) {
         if (!minCheckIn || new Date(rr.checkInDate) < minCheckIn) minCheckIn = new Date(rr.checkInDate);
         if (!maxCheckOut || new Date(rr.checkOutDate) > maxCheckOut) maxCheckOut = new Date(rr.checkOutDate);
         if (rr.nights > totalNights) totalNights = rr.nights;
         
         if (rr.roomId && roomMap.has(rr.roomId)) {
           const rObj = roomMap.get(rr.roomId);
           roomNames.push(`${rObj.roomNumber} - ${rObj.roomType.name} (₹${rr.appliedRate}/night)`);
         } else {
           roomNames.push(`Unassigned`);
         }
      }"""

fallback_new = """      const roomsToMap = res.rooms && res.rooms.length > 0 ? res.rooms : (res.stay?.rooms || []);
      
      for (const rr of roomsToMap) {
         if (rr.checkInDate && (!minCheckIn || new Date(rr.checkInDate) < minCheckIn)) minCheckIn = new Date(rr.checkInDate);
         if (rr.checkOutDate && (!maxCheckOut || new Date(rr.checkOutDate) > maxCheckOut)) maxCheckOut = new Date(rr.checkOutDate);
         if (rr.nights && rr.nights > totalNights) totalNights = rr.nights;
         
         if (rr.roomId && roomMap.has(rr.roomId)) {
           const rObj = roomMap.get(rr.roomId);
           roomNames.push(`${rObj.roomNumber} - ${rObj.roomType.name}`);
         } else {
           roomNames.push(`Unassigned`);
         }
      }"""

# Need to include stay.rooms in the Prisma query!
prisma_old = """    const reservations = await prisma.reservation.findMany({
      where: { hotelId },
      include: {
        guest: true,
        rooms: true,
        stay: true
      },
      orderBy: { createdAt: 'desc' }
    });"""

prisma_new = """    const reservations = await prisma.reservation.findMany({
      where: { hotelId },
      include: {
        guest: true,
        rooms: true,
        stay: { include: { rooms: true } }
      },
      orderBy: { createdAt: 'desc' }
    });"""

content = content.replace(fallback_old, fallback_new).replace(prisma_old, prisma_new)
with open('src/app/api/hotel/checkin-data/route.ts', 'w') as f:
    f.write(content)

print("Fixed checkin data, checkin api, and room price")
