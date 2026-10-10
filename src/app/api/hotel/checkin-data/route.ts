import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/authContext';

export async function GET(req: Request) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.user || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hotelId = authContext.hotel.id;

    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date');
    const today = dateParam ? new Date(dateParam) : new Date();
    today.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch all active reservations, plus any that were checked in/out on the selected date
    const reservations = await prisma.reservation.findMany({
      where: { 
        hotelId,
        OR: [
          { status: { in: ['RESERVED', 'CONFIRMED', 'CHECKED_IN'] } },
          { status: 'CHECKED_OUT', stay: { stayRooms: { some: { 
              OR: [
                { checkInDate: { gte: today, lte: endOfDay } },
                { checkOutDate: { gte: today, lte: endOfDay } }
              ]
          } } } }
        ]
      },
      select: {
        id: true,
        reservationNumber: true,
        status: true,
        totalAmount: true,
        advancePaid: true,
        guest: {
          select: {
            name: true,
            phone: true,
            documents: { select: { documentType: true, verificationStatus: true } }
          }
        },
        rooms: {
          select: { roomId: true, checkInDate: true, checkOutDate: true, nights: true }
        },
        stay: {
          select: {
            stayRooms: { select: { roomId: true, checkInDate: true, checkOutDate: true, nights: true } },
            payments: { select: { amount: true } },
            invoice: { select: { totalAmount: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const allRooms = await prisma.room.findMany({ 
      where: { hotelId, isActive: true }, 
      include: { roomType: true } 
    });
    
    const roomMap = new Map();
    let roomStats = { available: 0, occupied: 0, dirty: 0, maintenance: 0, blocked: 0 };
    
    allRooms.forEach((r: any) => {
      roomMap.set(r.id, r);
      if (r.status === 'AVAILABLE') roomStats.available++;
      else if (r.status === 'OCCUPIED') roomStats.occupied++;
      else if (r.status === 'DIRTY') roomStats.dirty++;
      else if (r.status === 'MAINTENANCE') roomStats.maintenance++;
      else if (r.status === 'BLOCKED') roomStats.blocked++;
    });

    const upcoming: any[] = [];
    const checkIns: any[] = [];
    const inHouse: any[] = [];
    const checkOuts: any[] = [];
    
    // Restore the original Total Bookings metric using a fast, lightweight database count
    const totalBookings = await prisma.reservation.count({ where: { hotelId } });

    reservations.forEach((res: any) => {
      let minCheckIn: Date | null = null;
      let maxCheckOut: Date | null = null;
      let totalNights = 0;
      let roomNames: string[] = [];
      let roomDetails: any[] = [];

      const roomsToMap = res.rooms && res.rooms.length > 0 ? res.rooms : (res.stay?.stayRooms || []);
      
      for (const rr of roomsToMap) {
         if (rr.checkInDate && (!minCheckIn || new Date(rr.checkInDate) < minCheckIn)) minCheckIn = new Date(rr.checkInDate);
         if (rr.checkOutDate && (!maxCheckOut || new Date(rr.checkOutDate) > maxCheckOut)) maxCheckOut = new Date(rr.checkOutDate);
         if (rr.nights && rr.nights > totalNights) totalNights = rr.nights;
         
         if (rr.roomId && roomMap.has(rr.roomId)) {
           const rObj = roomMap.get(rr.roomId);
           roomNames.push(`${rObj.roomNumber} - ${rObj.roomType.name}`);
           roomDetails.push({ name: `${rObj.roomNumber} - ${rObj.roomType.name}`, status: rObj.status, id: rObj.id, roomNumber: rObj.roomNumber });
         } else {
           roomNames.push(`Unassigned`);
           roomDetails.push({ name: `Unassigned`, status: null, id: null, roomNumber: null });
         }
      }

      // Determine Document Verification Status
      let idDocumentType = null;
      let isVerified = false;
      const guestDocs = res.guest.documents || [];
      if (guestDocs.length > 0) {
        idDocumentType = guestDocs[0].documentType || "ID"; // or map it better
        isVerified = guestDocs.some((d: any) => d.verificationStatus === 'VERIFIED');
      }

      const invoiceTotal = res.stay?.invoice?.totalAmount;
      const finalTotalAmount = invoiceTotal !== undefined ? invoiceTotal : (res.totalAmount || 0);

      let totalPaid = 0;
      if (res.stay && res.stay.payments && res.stay.payments.length > 0) {
        totalPaid = res.stay.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
      } else {
        totalPaid = res.advancePaid || 0;
      }

      const balance = Math.max(0, finalTotalAmount - totalPaid);

      let actualCheckOutDate: Date | null = null;
      if (res.stay && res.stay.stayRooms) {
         for (const sr of res.stay.stayRooms) {
            if (sr.checkOutDate && (!actualCheckOutDate || new Date(sr.checkOutDate) > actualCheckOutDate)) {
               actualCheckOutDate = new Date(sr.checkOutDate);
            }
         }
      }

      const formatted = {
        id: res.id,
        shortId: String(res.reservationNumber),
        reservationNumber: res.reservationNumber,
        guestName: res.guest.name,
        guestPhone: res.guest.phone,
        guestIdProof: idDocumentType,
        isGuestVerified: isVerified,
        hasDocument: guestDocs.length > 0,
        rooms: roomNames,
        roomDetails: roomDetails,
        checkInDate: minCheckIn,
        checkOutDate: maxCheckOut,
        actualCheckOutDate,
        nights: totalNights || 1,
        totalAmount: finalTotalAmount,
        amountPaid: totalPaid,
        balanceDue: balance,
        status: res.status,
      };

      let actualCheckInToday = false;
      let actualCheckOutToday = false;
      let isPendingUpcoming = false;

      if (res.status === 'RESERVED' || res.status === 'CONFIRMED') {
          const expectedArrival = res.rooms?.[0]?.checkInDate ? new Date(res.rooms[0].checkInDate) : null;
          if (expectedArrival) {
              expectedArrival.setHours(0,0,0,0);
              if (expectedArrival.getTime() >= today.getTime()) {
                  isPendingUpcoming = true;
              }
          }
      }

      if (res.stay?.stayRooms) {
          for (const sr of res.stay.stayRooms) {
              if (sr.checkInDate) {
                  const ci = new Date(sr.checkInDate);
                  ci.setHours(0,0,0,0);
                  if (ci.getTime() === today.getTime()) {
                      actualCheckInToday = true;
                  }
              }
              if (sr.checkOutDate) {
                  const co = new Date(sr.checkOutDate);
                  co.setHours(0,0,0,0);
                  if (co.getTime() === today.getTime()) {
                      actualCheckOutToday = true;
                  }
              }
          }
      }

      if (isPendingUpcoming) {
          upcoming.push(formatted);
      }
      
      if (actualCheckInToday) {
          checkIns.push(formatted);
      }

      if (res.status === 'CHECKED_IN') {
          inHouse.push(formatted);
      }

      if (actualCheckOutToday && res.status === 'CHECKED_OUT') {
          checkOuts.push(formatted);
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        checkInsToday: checkIns.length,
        checkOutsToday: checkOuts.length,
        inHouse: inHouse.length,
        upcoming: upcoming.length,
        totalBookings
      },
      roomStats,
      groups: {
        upcoming,
        checkIns,
        inHouse,
        checkOuts
      },
      isAdmin: authContext.user.type === 'ADMIN' || authContext.user.type === 'OWNER' || authContext.business?.createdBy === authContext.user.id
    });
  } catch (error: any) {
    console.error('Failed to fetch checkin data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
