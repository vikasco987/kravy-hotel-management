import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/authContext';
import { getStandardChecklistJson, isChecklistEmpty, resolveChecklist } from '@/lib/housekeeping';
import { canConductInspection, requirePermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const ALLOWED_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

/**
 * PATCH /api/hotel/housekeeping/[id]
 * Updates a housekeeping task with strict lifecycle validation and room-status safety guards.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized or Hotel not found' }, { status: 401 });
    }

    const hotelId = authContext.hotel.id;
    const { id } = await params;

    if (!id || id.length !== 24) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    // 1. Fetch task and verify hotel isolation via room.hotelId
    const task = await prisma.housekeepingTask.findFirst({
      where: {
        id,
        room: { hotelId },
      },
      include: {
        room: {
          include: {
            stays: {
              where: {
                checkOutDate: null,
                stay: {
                  reservation: {
                    status: 'CHECKED_IN',
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Housekeeping task not found or unauthorized' }, { status: 404 });
    }

    const body = await req.json();
    const {
      action,
      staffId,
      status,
      priority,
      checklist,
      notes,
      inspectionStatus,
    } = body;

    const isInspectionAction = action === 'SUBMIT_INSPECTION' || inspectionStatus !== undefined;
    if (isInspectionAction) {
      // Inspection action checked later using canConductInspection
    } else if (staffId !== undefined && action === undefined && checklist === undefined) {
      // Pure staff assignment
      const assignCheck = requirePermission(authContext.user, 'action:housekeeping:assign_staff');
      const cleanCheck = requirePermission(authContext.user, 'action:housekeeping:clean');
      if (!assignCheck.authorized && !cleanCheck.authorized) {
        return NextResponse.json(assignCheck.errorResponse, { status: 403 });
      }
    } else {
      // General housekeeping actions (cleaning, checklists, task updates) require action:housekeeping:clean
      const authCheck = requirePermission(authContext.user, 'action:housekeeping:clean');
      if (!authCheck.authorized) {
        return NextResponse.json(authCheck.errorResponse, { status: 403 });
      }
    }

    const updateData: Record<string, unknown> = {};

    // 2. Staff Assignment / Reassignment
    if (staffId !== undefined) {
      if (staffId === null || staffId === '') {
        updateData.staffId = null;
      } else if (typeof staffId === 'string' && staffId.length === 24) {
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
        updateData.staffId = staff.id;
      } else {
        return NextResponse.json({ error: 'Invalid staffId' }, { status: 400 });
      }
    }

    // 3. Priority update
    if (priority !== undefined) {
      if (typeof priority === 'string' && ALLOWED_PRIORITIES.includes(priority.toUpperCase())) {
        updateData.priority = priority.toUpperCase();
      } else {
        return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
      }
    }

    // 4. Checklist update
    if (checklist !== undefined) {
      if (Array.isArray(checklist)) {
        updateData.checklist = checklist;
      } else {
        return NextResponse.json({ error: 'Checklist must be an array' }, { status: 400 });
      }
    }

    // 5. Notes update
    if (notes !== undefined) {
      updateData.notes = typeof notes === 'string' ? notes.trim() : null;
    }

    // 6. Action-based or Status Lifecycle Transitions
    // Check if room has an active stay
    const hasActiveStay = task.room.stays && task.room.stays.length > 0;
    const currentRoomStatus = task.room.status;

    // A. Start Cleaning
    if (action === 'START_CLEANING' || (status === 'IN_PROGRESS' && task.status === 'PENDING')) {
      if (task.status === 'COMPLETED') {
        return NextResponse.json({ error: 'Cannot start an already completed task' }, { status: 400 });
      }
      updateData.status = 'IN_PROGRESS';

      // If task currently has an empty checklist in database, initialize it with standard checklist
      if (isChecklistEmpty(task.checklist) && updateData.checklist === undefined) {
        updateData.checklist = getStandardChecklistJson();
      }

      // Update room to CLEANING only if safe (not occupied, not in maintenance/blocked)
      if (!hasActiveStay && (currentRoomStatus === 'DIRTY' || currentRoomStatus === 'AVAILABLE')) {
        await prisma.room.update({
          where: { id: task.roomId },
          data: { status: 'CLEANING' },
        });
      }
    }

    // B. Complete Cleaning (Awaiting Inspection)
    else if (action === 'COMPLETE_CLEANING' || (status === 'COMPLETED' && task.status === 'IN_PROGRESS')) {
      updateData.status = 'COMPLETED';
      updateData.inspectionStatus = 'PENDING';
      // Do NOT set room to AVAILABLE yet! Inspection must be passed first.
    }

    // C. Inspection Submission: PASSED or RE_CLEAN
    else if (action === 'SUBMIT_INSPECTION' || inspectionStatus !== undefined) {
      // Guard 1: Require cleaning completion before inspection can be submitted
      if (task.status !== 'COMPLETED') {
        return NextResponse.json({
          error: `Cannot inspect task in '${task.status}' state. Cleaning must be completed before inspection.`,
        }, { status: 400 });
      }

      // Guard 2: Enforce supervisory authorization server-side
      // Check caller's effective supervisory role & explicit permission
      const userType = (authContext.user.type || '').toUpperCase();
      const userRole = (authContext.user.role || '').toUpperCase();

      const isHotelCreator = authContext.hotel.createdBy === authContext.user.id || authContext.business.createdBy === authContext.user.id;
      const isAdminAccount = !authContext.user.isStaff && (isHotelCreator || [
        'OWNER',
        'ADMIN',
        'USER',
        'SELLER',
        'MASTER',
      ].includes(userType) || [
        'ADMIN',
        'USER',
        'SELLER',
        'MASTER',
      ].includes(userRole));

      // For staff accounts, verify explicit 'action:housekeeping:inspect' permission.
      // Mere housekeeping cleaning rights or staff status NEVER imply inspection rights.
      const hasExplicitInspectPermission = canConductInspection(authContext.user);

      if (!isAdminAccount && !hasExplicitInspectPermission) {
        return NextResponse.json({
          error: 'Forbidden: Only administrators or staff with explicit inspection permission can submit inspection results.',
        }, { status: 403 });
      }

      const decision = (inspectionStatus || body.decision || '').toUpperCase();
      if (!['PASSED', 'RE_CLEAN'].includes(decision)) {
        return NextResponse.json({ error: 'Inspection status must be PASSED or RE_CLEAN' }, { status: 400 });
      }

      const now = new Date();
      updateData.inspectionStatus = decision;
      updateData.inspectedAt = now;
      updateData.inspectedBy = authContext.user.id;

      if (decision === 'PASSED') {
        // Strict Room Availability Guards:
        // Room can ONLY become AVAILABLE if:
        // 1. Room is not currently occupied by an active guest stay
        // 2. Room is not in MAINTENANCE
        // 3. Room is not BLOCKED
        if (!hasActiveStay && currentRoomStatus !== 'MAINTENANCE' && currentRoomStatus !== 'BLOCKED') {
          await prisma.room.update({
            where: { id: task.roomId },
            data: { status: 'AVAILABLE' },
          });
        }
      } else if (decision === 'RE_CLEAN') {
        // Put task back into IN_PROGRESS or PENDING for re-cleaning
        updateData.status = 'IN_PROGRESS';
        // If room is not occupied/maintenance/blocked, put back to CLEANING or DIRTY
        if (!hasActiveStay && currentRoomStatus !== 'MAINTENANCE' && currentRoomStatus !== 'BLOCKED') {
          await prisma.room.update({
            where: { id: task.roomId },
            data: { status: 'DIRTY' },
          });
        }
      }
    }

    // 7. Execute Update
    const updatedTask = await prisma.housekeepingTask.update({
      where: { id },
      data: updateData,
      include: {
        room: {
          select: {
            id: true,
            roomNumber: true,
            status: true,
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
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
            status: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...updatedTask,
      checklist: resolveChecklist(updatedTask.checklist),
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error updating housekeeping task:', error);
    return NextResponse.json({ error: 'Failed to update housekeeping task' }, { status: 500 });
  }
}
