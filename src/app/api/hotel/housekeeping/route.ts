import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/authContext';
import { TaskStatus, Prisma } from '@prisma/client';
import { requirePermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

import {
  STANDARD_CHECKLIST,
  getStandardChecklist,
  getStandardChecklistJson,
  isChecklistEmpty,
  resolveChecklist,
} from '@/lib/housekeeping';

export { STANDARD_CHECKLIST };

const ALLOWED_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

/**
 * GET /api/hotel/housekeeping
 * Returns housekeeping tasks for the authenticated hotel with filters and summary counts.
 */
export async function GET(req: Request) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized or Hotel not found' }, { status: 401 });
    }

    const authCheck = requirePermission(authContext.user, 'page:housekeeping');
    if (!authCheck.authorized) {
      return NextResponse.json(authCheck.errorResponse, { status: 403 });
    }

    const hotelId = authContext.hotel.id;
    const { searchParams } = new URL(req.url);

    const statusParam = searchParams.get('status')?.trim().toUpperCase();
    const priorityParam = searchParams.get('priority')?.trim().toUpperCase();
    const staffIdParam = searchParams.get('staffId')?.trim();
    const floorIdParam = searchParams.get('floorId')?.trim();
    const searchParam = searchParams.get('search')?.trim();

    // Hotel isolation: task must belong to a room of the authenticated hotel
    const whereClause: Prisma.HousekeepingTaskWhereInput = {
      room: {
        hotelId: hotelId,
      },
    };

    if (statusParam && statusParam !== 'ALL') {
      if (['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(statusParam)) {
        whereClause.status = statusParam as TaskStatus;
      }
    }

    if (priorityParam && priorityParam !== 'ALL') {
      if (ALLOWED_PRIORITIES.includes(priorityParam)) {
        whereClause.priority = priorityParam;
      }
    }

    if (staffIdParam && staffIdParam !== 'ALL') {
      if (staffIdParam === 'UNASSIGNED') {
        whereClause.staffId = null;
      } else if (staffIdParam.length === 24) {
        whereClause.staffId = staffIdParam;
      }
    }

    const roomIdParam = searchParams.get('roomId')?.trim();

    const roomFilter: Prisma.RoomWhereInput = {
      hotelId: hotelId,
    };

    if (roomIdParam && roomIdParam.length === 24) {
      roomFilter.id = roomIdParam;
    }

    if (floorIdParam && floorIdParam !== 'ALL' && floorIdParam.length === 24) {
      roomFilter.floorId = floorIdParam;
    }

    whereClause.room = {
      is: roomFilter,
    };

    if (searchParam) {
      whereClause.OR = [
        { room: { roomNumber: { contains: searchParam, mode: 'insensitive' } } },
        { staff: { name: { contains: searchParam, mode: 'insensitive' } } },
        { notes: { contains: searchParam, mode: 'insensitive' } },
      ];
    }

    // 1. Fetch tasks
    const tasks = await prisma.housekeepingTask.findMany({
      where: whereClause,
      include: {
        room: {
          select: {
            id: true,
            roomNumber: true,
            status: true,
            floorId: true,
            floor: {
              select: {
                id: true,
                name: true,
                floorNumber: true,
              },
            },
            roomType: {
              select: {
                id: true,
                name: true,
              },
            },
            stays: {
              where: {
                checkOutDate: null,
                stay: {
                  reservation: {
                    status: 'CHECKED_IN',
                  },
                },
              },
              select: {
                id: true,
                checkInDate: true,
                stay: {
                  select: {
                    reservation: {
                      select: {
                        id: true,
                        guest: {
                          select: {
                            name: true,
                            phone: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
              take: 1,
            },
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
            email: true,
            phone: true,
            status: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // PENDING, IN_PROGRESS first
        { updatedAt: 'desc' },
      ],
    });

    // Safely self-heal any legacy tasks that have an empty/missing checklist
    const legacyEmptyTasks = tasks.filter((t) => isChecklistEmpty(t.checklist));
    if (legacyEmptyTasks.length > 0) {
      await Promise.all(
        legacyEmptyTasks.map((t) =>
          prisma.housekeepingTask.update({
            where: { id: t.id },
            data: { checklist: getStandardChecklistJson() },
          }).catch((err) => {
            console.error(`Failed to self-heal checklist for task ${t.id}:`, err);
          })
        )
      );
    }

    // 2. Fetch summary counts scoped to hotel
    const [allHotelTasks, maintenanceRoomsCount] = await Promise.all([
      prisma.housekeepingTask.findMany({
        where: {
          room: { hotelId },
        },
        select: {
          status: true,
          inspectionStatus: true,
        },
      }),
      prisma.room.count({
        where: {
          hotelId,
          status: 'MAINTENANCE',
          isActive: true,
        },
      }),
    ]);

    const counts = {
      total: allHotelTasks.length,
      pending: 0,
      inProgress: 0,
      completed: 0,
      awaitingInspection: 0,
      maintenance: maintenanceRoomsCount,
    };

    allHotelTasks.forEach((t) => {
      if (t.status === 'PENDING') counts.pending++;
      if (t.status === 'IN_PROGRESS') counts.inProgress++;
      if (t.status === 'COMPLETED') {
        counts.completed++;
        if (t.inspectionStatus === 'PENDING' || !t.inspectionStatus) {
          counts.awaitingInspection++;
        }
      }
    });

    // Format tasks for client
    const formattedTasks = tasks.map((task) => {
      const activeStay = task.room.stays && task.room.stays.length > 0 ? task.room.stays[0] : null;
      const isOccupied = !!activeStay;

      return {
        id: task.id,
        roomId: task.roomId,
        roomNumber: task.room.roomNumber,
        floorName: task.room.floor?.name || `Floor ${task.room.floor?.floorNumber || ''}`,
        floorNumber: task.room.floor?.floorNumber,
        roomTypeName: task.room.roomType?.name || 'Standard',
        roomStatus: task.room.status,
        isOccupied,
        occupantGuestName: activeStay?.stay?.reservation?.guest?.name || null,
        staffId: task.staffId,
        staff: task.staff ? {
          id: task.staff.id,
          name: task.staff.name,
          role: task.staff.role,
          phone: task.staff.phone,
          status: task.staff.status,
        } : null,
        status: task.status,
        priority: task.priority || 'MEDIUM',
        checklist: resolveChecklist(task.checklist),
        notes: task.notes || null,
        inspectionStatus: task.inspectionStatus || null,
        inspectedBy: task.inspectedBy || null,
        inspectedAt: task.inspectedAt || null,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      };
    });

    return NextResponse.json({
      tasks: formattedTasks,
      counts,
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error fetching housekeeping tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch housekeeping tasks' }, { status: 500 });
  }
}

/**
 * POST /api/hotel/housekeeping
 * Creates a new persistent cleaning task for a hotel room.
 */
export async function POST(req: Request) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized or Hotel not found' }, { status: 401 });
    }

    const authCheck = requirePermission(authContext.user, 'action:housekeeping:create_task');
    const legacyCheck = requirePermission(authContext.user, 'action:housekeeping:clean');
    if (!authCheck.authorized && !legacyCheck.authorized) {
      return NextResponse.json(authCheck.errorResponse, { status: 403 });
    }

    const hotelId = authContext.hotel.id;
    const body = await req.json();
    const { roomId, staffId, priority, notes } = body;

    if (!roomId || typeof roomId !== 'string' || roomId.length !== 24) {
      return NextResponse.json({ error: 'Valid roomId is required' }, { status: 400 });
    }

    // 1. Verify room belongs to authenticated hotel
    const room = await prisma.room.findFirst({
      where: { id: roomId, hotelId },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found or unauthorized' }, { status: 404 });
    }

    // 2. Prevent duplicate unresolved tasks (PENDING or IN_PROGRESS)
    const existingUnresolvedTask = await prisma.housekeepingTask.findFirst({
      where: {
        roomId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });

    if (existingUnresolvedTask) {
      return NextResponse.json({
        error: 'An active cleaning task already exists for this room',
        taskId: existingUnresolvedTask.id,
        status: existingUnresolvedTask.status,
      }, { status: 409 });
    }

    // 3. Optional Staff validation: must be active HOUSEKEEPING staff in this hotel
    let validStaffId: string | undefined = undefined;
    if (staffId && typeof staffId === 'string' && staffId.trim() !== '') {
      if (staffId.length !== 24) {
        return NextResponse.json({ error: 'Invalid staff ID' }, { status: 400 });
      }

      const staff = await prisma.staff.findFirst({
        where: {
          id: staffId,
          hotelId,
          role: 'HOUSEKEEPING',
          status: 'active',
        },
      });

      if (!staff) {
        return NextResponse.json({ error: 'Staff member not found, inactive, or not in Housekeeping' }, { status: 400 });
      }
      validStaffId = staff.id;
    }

    // 4. Validate Priority
    const cleanPriority = priority && ALLOWED_PRIORITIES.includes(priority.toUpperCase())
      ? priority.toUpperCase()
      : 'MEDIUM';

    // 5. Create Task with standard checklist
    const newTask = await prisma.housekeepingTask.create({
      data: {
        roomId,
        staffId: validStaffId,
        status: 'PENDING',
        priority: cleanPriority,
        checklist: getStandardChecklistJson(),
        notes: notes && typeof notes === 'string' ? notes.trim() : null,
      },
      include: {
        room: {
          select: {
            id: true,
            roomNumber: true,
            status: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
            status: true,
          },
        },
      },
    });

    // 6. Safe Room Status Transition:
    // If room is currently AVAILABLE, mark it DIRTY so it reflects cleaning is needed.
    // Never overwrite OCCUPIED, MAINTENANCE, or BLOCKED.
    if (room.status === 'AVAILABLE') {
      await prisma.room.update({
        where: { id: roomId },
        data: { status: 'DIRTY' },
      });
    }

    return NextResponse.json(newTask, { status: 201 });

  } catch (error: unknown) {
    console.error('Error creating housekeeping task:', error);
    return NextResponse.json({ error: 'Failed to create housekeeping task' }, { status: 500 });
  }
}
