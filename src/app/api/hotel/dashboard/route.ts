import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthContext } from '@/lib/authContext';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized or Hotel not found for this business' }, { status: 401 });
    }

    const { hotel } = authContext;

    // Securely scoped query to ONLY the authenticated business's hotel
    const floors = await prisma.floor.findMany({
      where: { hotelId: hotel.id, isActive: true },
      include: {
        rooms: {
          where: { isActive: true },
          include: {
            roomType: true,
            tasks: {
              where: { status: 'COMPLETED' },
              orderBy: { updatedAt: 'desc' },
              take: 1
            },
            stays: {
              where: { 
                checkOutDate: null,
                stay: {
                  reservation: {
                    status: 'CHECKED_IN'
                  }
                }
              },
              orderBy: { checkInDate: 'desc' },
              include: {
                stay: {
                  include: {
                    reservation: {
                      include: {
                        guest: true,
                        rooms: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: { roomNumber: 'asc' }
        }
      },
      orderBy: { floorNumber: 'asc' }
    });

    // Calculate summary statistics
    let totalRooms = 0;
    let available = 0;
    let reserved = 0;
    let occupied = 0;
    let dirty = 0;
    let cleaning = 0;
    let maintenance = 0;
    let blocked = 0;

    const formattedFloors = floors.map((floor) => {
      const formattedRooms = floor.rooms.map((room) => {
        totalRooms++;
        
        switch (room.status) {
          case 'AVAILABLE': available++; break;
          case 'RESERVED': reserved++; break;
          case 'OCCUPIED': occupied++; break;
          case 'DIRTY': dirty++; break;
          case 'CLEANING': cleaning++; break;
          case 'MAINTENANCE': maintenance++; break;
          case 'BLOCKED': blocked++; break;
        }

        let guestInfo = undefined;
        // Strictly use active stay where checkOutDate is null and reservation is active
        const activeStayRoom = room.stays?.find(s => 
          s.checkOutDate === null && 
          s.stay?.reservation?.status === 'CHECKED_IN'
        );
        
        if (room.status === 'OCCUPIED' && activeStayRoom && activeStayRoom.stay && activeStayRoom.stay.reservation) {
          const reservation = activeStayRoom.stay.reservation;
          const guest = reservation.guest;
          // Match the exact reservation room
          const reservationRoom = reservation.rooms?.find(r => r.roomId === room.id);
          
          guestInfo = {
            name: guest.name,
            phone: guest.phone,
            idProof: guest.idProof || 'Not Provided',
            checkInDate: activeStayRoom.checkInDate,
            expectedCheckOutDate: reservationRoom ? reservationRoom.checkOutDate : undefined,
            roomRate: activeStayRoom.appliedRate || room.roomType?.basePrice || 0,
            amountPaid: reservation.advancePaid || 0,
            totalAmount: reservation.totalAmount || 0,
            balance: (reservation.totalAmount || 0) - (reservation.advancePaid || 0),
            guestsData: activeStayRoom.guestsData || null
          };
        }

        // Get last cleaned timestamp if available
        const lastCleaned = (room.tasks && room.tasks.length > 0) ? room.tasks[0].updatedAt : null;

        return {
          id: room.id,
          roomNumber: room.roomNumber,
          status: room.status,
          roomType: room.roomType?.name || 'Unknown',
          price: room.roomType?.basePrice || 0,
          lastCleaned,
          guestInfo
        };
      });

      return {
        id: floor.id,
        name: floor.name,
        floorNumber: floor.floorNumber,
        rooms: formattedRooms
      };
    });

    const occupancyPercent = totalRooms > 0 ? Math.round(((occupied + reserved) / totalRooms) * 100) : 0;

    const roomsRecord = {
      total: totalRooms,
      available,
      reserved,
      occupied,
      dirty,
      cleaning,
      maintenance,
      blocked,
    };

    return NextResponse.json({
      rooms: roomsRecord,
      occupancy: occupancyPercent,
      checkIns: 0,
      checkOuts: 0,
      revenueToday: 0,
      pendingArrivals: 0,
      pendingDepartures: 0,
      floors: formattedFloors,
      vacatingRooms: [] // Stub for Phase 2 Check-out workflow
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
