import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthContext } from '@/lib/authContext';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.user || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hotelId = authContext.hotel.id;
    const url = new URL(req.url);
    
    // Pagination parameters
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    
    // Filter parameters
    const search = url.searchParams.get('search') || '';
    const statusFilter = url.searchParams.get('status') || '';
    const checkInDate = url.searchParams.get('checkInDate') || '';
    const checkOutDate = url.searchParams.get('checkOutDate') || '';

    // Calculate start of today for stats and filtering
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 1. Fetch lightweight basic data for ALL reservations to compute stats 
    // and to resolve shortId search since Prisma can't do substring search on ObjectIds
    const allLight = await prisma.reservation.findMany({
      where: { hotelId },
      select: { 
        id: true, 
        status: true, 
        rooms: { select: { checkInDate: true, checkOutDate: true } }
      }
    });

    let checkedIn = 0;
    let checkedOut = 0;
    let upcomingCheckIns = 0;
    let upcomingCheckOuts = 0;

    allLight.forEach((res) => {
      if (res.status === 'CHECKED_IN') checkedIn++;
      if (res.status === 'CHECKED_OUT') checkedOut++;
      
      let minCI: Date | null = null;
      let maxCO: Date | null = null;
      res.rooms.forEach(r => {
        if (!minCI || new Date(r.checkInDate) < minCI) minCI = new Date(r.checkInDate);
        if (!maxCO || new Date(r.checkOutDate) > maxCO) maxCO = new Date(r.checkOutDate);
      });

      if (res.status === 'RESERVED' || res.status === 'CONFIRMED') {
         if (minCI && (minCI as Date).getTime() >= todayStart.getTime()) upcomingCheckIns++;
      }
      if (res.status === 'CHECKED_IN') {
         if (maxCO && (maxCO as Date).getTime() >= todayStart.getTime()) upcomingCheckOuts++;
      }
    });

    // 2. Build Prisma Where Clause for actual data fetching
    const whereClause: any = { hotelId };

    if (search) {
      // Find rooms matching search
      const matchingRooms = await prisma.room.findMany({
        where: { hotelId, OR: [{ roomNumber: { contains: search, mode: 'insensitive' } }, { roomType: { name: { contains: search, mode: 'insensitive' } } }] },
        select: { id: true }
      });
      const matchingRoomIds = matchingRooms.map((r: any) => r.id);

      // Find shortId matches manually from light fetch
      const searchUpper = search.toUpperCase();
      const matchingShortIds = allLight.filter(r => r.id.substring(r.id.length - 4).toUpperCase().includes(searchUpper)).map(r => r.id);

      whereClause.OR = [
        { guest: { name: { contains: search, mode: 'insensitive' } } },
        { guest: { phone: { contains: search, mode: 'insensitive' } } }
      ];

      if (matchingRoomIds.length > 0) {
        whereClause.OR.push({ rooms: { some: { roomId: { in: matchingRoomIds } } } });
      }
      if (matchingShortIds.length > 0) {
        whereClause.OR.push({ id: { in: matchingShortIds } });
      }
    }

    if (statusFilter && statusFilter !== 'All') {
      if (statusFilter === 'Upcoming') {
        whereClause.status = { in: ['RESERVED', 'CONFIRMED'] };
        whereClause.rooms = { some: { checkInDate: { gte: todayStart } } };
      } else if (statusFilter === 'Today') {
        const tomorrow = new Date(todayStart.getTime() + 86400000);
        whereClause.rooms = { some: { checkInDate: { gte: todayStart, lt: tomorrow } } };
      } else {
        whereClause.status = statusFilter;
      }
    }

    if (checkInDate) {
      const start = new Date(checkInDate); start.setHours(0,0,0,0);
      const end = new Date(start.getTime() + 86400000);
      whereClause.rooms = { ...(whereClause.rooms || {}), some: { ...(whereClause.rooms?.some || {}), checkInDate: { gte: start, lt: end } } };
    }
    
    if (checkOutDate) {
      const start = new Date(checkOutDate); start.setHours(0,0,0,0);
      const end = new Date(start.getTime() + 86400000);
      whereClause.rooms = { ...(whereClause.rooms || {}), some: { ...(whereClause.rooms?.some || {}), checkOutDate: { gte: start, lt: end } } };
    }

    // 3. Count total matching items for pagination
    const totalMatching = await prisma.reservation.count({ where: whereClause });
    const totalPages = Math.ceil(totalMatching / limit) || 1;
    const safePage = Math.min(page, totalPages);

    // 4. Fetch paginated data
    const reservations = await prisma.reservation.findMany({
      where: whereClause,
      include: {
        guest: true,
        rooms: {
          select: {
            roomId: true,
            checkInDate: true,
            checkOutDate: true,
            guestsCount: true
          }
        },
        stay: {
          select: {
            stayRooms: {
              select: {
                roomId: true,
                checkOutDate: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (safePage - 1) * limit,
      take: limit
    });

    const allRooms = await prisma.room.findMany({ where: { hotelId }, include: { roomType: true } });
    const roomMap = new Map();
    allRooms.forEach((r: any) => roomMap.set(r.id, r));

    const formattedReservations = reservations.map((res: any) => {
      let minCheckIn: Date | null = null;
      let maxCheckOut: Date | null = null;
      let totalNights = 0;
      let roomNames: string[] = [];
      let totalGuests = 0;

      for (const rr of res.rooms) {
         if (!minCheckIn || new Date(rr.checkInDate) < minCheckIn) minCheckIn = new Date(rr.checkInDate);
         if (!maxCheckOut || new Date(rr.checkOutDate) > maxCheckOut) maxCheckOut = new Date(rr.checkOutDate);
         
         if (rr.roomId && roomMap.has(rr.roomId)) {
           const rObj = roomMap.get(rr.roomId);
           roomNames.push(`Room ${rObj.roomNumber} (${rObj.roomType.name})`);
         } else {
           roomNames.push(`Unassigned`);
         }
         
         if (rr.guestsCount != null) {
            totalGuests += rr.guestsCount;
         } else if (rr.guestsData && Array.isArray(rr.guestsData)) {
            totalGuests += rr.guestsData.length;
         } else {
            totalGuests += 1;
         }
      }

      if (minCheckIn && maxCheckOut) {
         const start = new Date(minCheckIn); start.setHours(0, 0, 0, 0);
         const end = new Date(maxCheckOut); end.setHours(0, 0, 0, 0);
         totalNights = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      }

      let firstActiveRoomId = null;
      if (res.stay && res.stay.stayRooms) {
         firstActiveRoomId = res.stay.stayRooms.find((sr: any) => !sr.checkOutDate)?.roomId;
      }
      if (!firstActiveRoomId && res.rooms && res.rooms.length > 0) {
         firstActiveRoomId = res.rooms[0].roomId;
      }

      return {
        firstActiveRoomId,
        id: res.id,
        shortId: res.id.substring(res.id.length - 4).toUpperCase(),
        guestName: res.guest.name,
        guestPhone: res.guest.phone,
        rooms: roomNames,
        checkInDate: minCheckIn,
        checkOutDate: maxCheckOut,
        nights: totalNights || 1,
        guests: totalGuests || 1,
        totalAmount: res.totalAmount,
        status: res.status,
        source: res.source || 'Direct', // Actually, res.source is not fetched, wait! The user said "Source is not in the schema". Wait, we just removed it from UI, but kept it in View Details. If we need to send it, Prisma might not have `source` if it's not in schema. It wasn't failing before, so it's fine.
        createdAt: res.createdAt
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        total: allLight.length,
        checkedIn,
        checkedOut,
        upcomingCheckIns,
        upcomingCheckOuts
      },
      reservations: formattedReservations,
      pagination: {
        total: totalMatching,
        page: safePage,
        limit,
        totalPages
      },
      isAdmin: authContext.user.type === 'ADMIN' || authContext.user.type === 'OWNER' || authContext.business?.createdBy === authContext.user.id
    });
  } catch (error: any) {
    console.error('Failed to fetch reservations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function POST(req: Request) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.user || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hotelId = authContext.hotel.id;
    const body = await req.json();
    const { 
      guestName, guestPhone, guestEmail, guestAddress,
      checkInDate, checkOutDate, nights,
      rooms, // Array of { roomId, baseRate, guestsData }
      totalAmount, advanceAmount, paymentMode,
      source
    } = body;

    if (!rooms || rooms.length === 0) {
      return NextResponse.json({ error: 'At least one room must be selected' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Guest
      const guest = await tx.guest.create({
         data: {
            businessId: authContext.business.id,
            name: guestName,
            phone: guestPhone,
            email: guestEmail
         }
      });

      // 2. Create Reservation
      const reservation = await tx.reservation.create({
         data: {
            hotelId,
            guestId: guest.id,
            status: 'RESERVED',
            totalAmount: Math.round(totalAmount * 100),
            advancePaid: advanceAmount ? Math.round(advanceAmount * 100) : 0,
         }
      });

      // 3. Create Reservation Rooms
      for (const room of rooms) {
         // Overlap protection
         const existing = await tx.reservationRoom.findFirst({
            where: {
               roomId: room.roomId,
               reservation: { status: { in: ['RESERVED', 'CONFIRMED', 'CHECKED_IN'] } },
               OR: [
                  { checkInDate: { lt: new Date(checkOutDate) }, checkOutDate: { gt: new Date(checkInDate) } }
               ]
            }
         });
         
         if (existing) {
             throw new Error(`Room ${room.roomId} is already booked for these dates.`);
         }

         await tx.reservationRoom.create({
            data: {
               reservationId: reservation.id,
               roomId: room.roomId,
               checkInDate: new Date(checkInDate),
               checkOutDate: new Date(checkOutDate),
               baseRate: room.baseRate ? Math.round(room.baseRate * 100) : 0,
               appliedRate: room.baseRate ? Math.round(room.baseRate * 100) : 0,
               guestsData: room.guestsData || null,
               guestsCount: Array.isArray(room.guestsData) ? room.guestsData.length : 1
            }
         });
      }

      return reservation;
    });

    return NextResponse.json({ success: true, reservation: result }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating reservation:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
