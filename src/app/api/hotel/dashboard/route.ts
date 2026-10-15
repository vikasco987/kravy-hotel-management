import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/authContext';
import { requirePermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized or Hotel not found for this business' }, { status: 401 });
    }

    // Authorize if user has access to Dashboard or any page that consumes hotel room/floor layout
    const hasDashboard = requirePermission(authContext.user, 'page:dashboard').authorized;
    const hasRooms = requirePermission(authContext.user, 'page:rooms').authorized;
    const hasFloors = requirePermission(authContext.user, 'page:floors').authorized;
    const hasCheckin = requirePermission(authContext.user, 'page:checkin').authorized;
    const hasReservations = requirePermission(authContext.user, 'page:reservations').authorized;

    if (!hasDashboard && !hasRooms && !hasFloors && !hasCheckin && !hasReservations) {
      const authCheck = requirePermission(authContext.user, 'page:dashboard');
      return NextResponse.json(authCheck.errorResponse, { status: 403 });
    }

    const { hotel } = authContext;

    // Securely scoped query to ONLY the authenticated business's hotel
    const floors = await prisma.floor.findMany({
      where: { hotelId: hotel.id, isActive: true },
      select: {
        id: true,
        name: true,
        floorNumber: true,
        rooms: {
          where: { isActive: true },
          select: {
            id: true,
            roomNumber: true,
            status: true,
            customPrice: true,
            roomType: { select: { name: true, basePrice: true } },
            tasks: {
              where: { status: 'COMPLETED' },
              orderBy: { updatedAt: 'desc' },
              take: 1,
              select: { updatedAt: true }
            },
            stays: {
              where: { checkOutDate: null },
              orderBy: { checkInDate: 'desc' },
              select: {
                checkInDate: true,
                checkOutDate: true,
                appliedRate: true,
                stay: {
                  select: {
                    reservation: {
                      select: {
                        status: true,
                        advancePaid: true,
                        totalAmount: true,
                        guest: { select: { name: true, phone: true, idProof: true } },
                        rooms: { select: { roomId: true, checkOutDate: true } }
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
        let guestInfo = undefined;
        // Strictly use active stay where checkOutDate is null and reservation is active
        const activeStayRoom = room.stays?.find(s =>
          s.checkOutDate === null &&
          s.stay?.reservation?.status === 'CHECKED_IN'
        );

        let derivedStatus = room.status;

        if (activeStayRoom && activeStayRoom.stay && activeStayRoom.stay.reservation) {
          derivedStatus = 'OCCUPIED';
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
            balance: (reservation.totalAmount || 0) - (reservation.advancePaid || 0)
          };
        }

        switch (derivedStatus) {
          case 'AVAILABLE': available++; break;
          case 'RESERVED': reserved++; break;
          case 'OCCUPIED': occupied++; break;
          case 'DIRTY': dirty++; break;
          case 'CLEANING': cleaning++; break;
          case 'MAINTENANCE': maintenance++; break;
          case 'BLOCKED': blocked++; break;
        }

        // Get last cleaned timestamp if available
        const lastCleaned = (room.tasks && room.tasks.length > 0) ? room.tasks[0].updatedAt : null;

        return {
          id: room.id,
          roomNumber: room.roomNumber,
          status: derivedStatus,
          housekeepingStatus: room.status,
          roomType: room.roomType?.name || 'Unknown',
          price: (room.customPrice !== null && room.customPrice !== undefined) ? room.customPrice : (room.roomType?.basePrice || 0),
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

    const canCreateRoom = requirePermission(authContext.user, 'action:rooms:create').authorized;
    const canEditRoom = requirePermission(authContext.user, 'action:rooms:edit').authorized;
    const canDeleteRoom = requirePermission(authContext.user, 'action:rooms:delete').authorized;
    const canChangeStatus = requirePermission(authContext.user, 'action:rooms:change_status').authorized;
    const canViewGuestDetails = requirePermission(authContext.user, 'action:rooms:view_guest_details').authorized;
    const canBulkBooking = requirePermission(authContext.user, 'action:rooms:bulk_booking').authorized;
    const canCheckin = requirePermission(authContext.user, 'action:checkin:perform').authorized;
    const canCreateReservation = requirePermission(authContext.user, 'action:reservations:create').authorized;
    const canManageFloors = requirePermission(authContext.user, 'action:floors:create').authorized;
    const canSettlePayment = requirePermission(authContext.user, 'action:checkout:settle_payment').authorized;

    const canViewKpi = requirePermission(authContext.user, 'action:dashboard:view_kpi').authorized;

    return NextResponse.json({
      rooms: roomsRecord,
      occupancy: canViewKpi ? occupancyPercent : 0,
      checkIns: 0,
      checkOuts: 0,
      revenueToday: 0,
      pendingArrivals: 0,
      pendingDepartures: 0,
      floors: formattedFloors,
      vacatingRooms: [], // Stub for Phase 2 Check-out workflow
      isAdmin: authContext.user?.type === 'ADMIN' || authContext.user?.type === 'OWNER' || authContext.business?.createdBy === authContext.user?.id,
      canViewKpi,
      canCreateRoom,
      canEditRoom,
      canDeleteRoom,
      canChangeStatus,
      canViewGuestDetails,
      canBulkBooking,
      canCheckin,
      canCreateReservation,
      canManageFloors,
      canSettlePayment,
      permissions: authContext.user?.permissions || []
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
