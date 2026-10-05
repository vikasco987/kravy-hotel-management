const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        const hotel = await prisma.hotel.findFirst();
        const hotelId = hotel.id;

        const reservations = await prisma.reservation.findMany({
            where: { hotelId },
            include: {
              guest: {
                include: { documents: true }
              },
              rooms: true,
              stay: { include: { rooms: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`Found ${reservations.length} reservations`);
        const res = reservations[0];
        console.log("First reservation status:", res?.status);
        console.log("Guest:", res?.guest?.name);

        const allRooms = await prisma.room.findMany({ 
            where: { hotelId, isActive: true }, 
            include: { roomType: true } 
        });
        const roomMap = new Map();
        allRooms.forEach(r => roomMap.set(r.id, r));

        const checkIns = [];

        reservations.forEach(res => {
            let minCheckIn = null;
            let maxCheckOut = null;
            let totalNights = 0;
            let roomNames = [];
      
            const roomsToMap = res.rooms && res.rooms.length > 0 ? res.rooms : (res.stay?.rooms || []);
            
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
            }
      
            let idDocumentType = null;
            let isVerified = false;
            const guestDocs = res.guest?.documents || [];
            if (guestDocs.length > 0) {
              idDocumentType = guestDocs[0].documentType || "ID"; 
              isVerified = guestDocs.some(d => d.verificationStatus === 'VERIFIED');
            }
      
            const formatted = {
              id: res.id,
              shortId: res.id.substring(res.id.length - 6).toUpperCase(),
              guestName: res.guest?.name,
              guestPhone: res.guest?.phone,
              guestIdProof: idDocumentType,
              isGuestVerified: isVerified,
              hasDocument: guestDocs.length > 0,
              rooms: roomNames,
              checkInDate: minCheckIn,
              checkOutDate: maxCheckOut,
              nights: totalNights || 1,
              totalAmount: res.totalAmount,
              status: res.status,
            };
      
            if (res.status === 'RESERVED' || res.status === 'CONFIRMED') {
               checkIns.push(formatted);
            }
        });

        console.log(`checkIns length: ${checkIns.length}`);

    } catch (err) {
        console.error(err);
    }
}
run();
