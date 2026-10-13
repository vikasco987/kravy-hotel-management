import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { RoomStatus } from '@prisma/client';
import { getAuthContext } from '@/lib/authContext';
import { getStandardChecklistJson, isChecklistEmpty } from '@/lib/housekeeping';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hotel } = authContext;
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    const validStatuses = ['AVAILABLE', 'RESERVED', 'OCCUPIED', 'DIRTY', 'CLEANING', 'MAINTENANCE', 'BLOCKED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid room status' }, { status: 400 });
    }

    // Ensure the room belongs to the authenticated hotel and check for active stays
    const room = await prisma.room.findFirst({
      where: { id, hotelId: hotel.id },
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
        tasks: {
          where: {
            status: { in: ['PENDING', 'IN_PROGRESS'] },
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found or unauthorized' }, { status: 404 });
    }

    // Prevent overriding room status while a guest is actively staying
    const hasActiveStay = (room.stays && room.stays.length > 0) || room.status === 'OCCUPIED';
    if (hasActiveStay && (status === 'AVAILABLE' || status === 'MAINTENANCE' || status === 'BLOCKED')) {
      return NextResponse.json({
        error: 'Cannot change room status to AVAILABLE, MAINTENANCE, or BLOCKED while a guest is staying. Please use the check-out process.',
      }, { status: 400 });
    }

    // Prevent setting room directly to AVAILABLE if room is DIRTY or has an active unresolved cleaning task
    // Room availability must go through the housekeeping cleaning and inspection workflow
    const hasUnresolvedTask = room.tasks && room.tasks.length > 0;
    if (status === 'AVAILABLE' && (room.status === 'DIRTY' || hasUnresolvedTask)) {
      return NextResponse.json({
        error: 'Cannot set room directly to AVAILABLE while dirty or undergoing cleaning. Please complete cleaning and supervisor inspection in Housekeeping.',
      }, { status: 400 });
    }

    // Do not create cleaning tasks for MAINTENANCE or BLOCKED rooms
    // Or if room is occupied / active stay
    if (status === 'DIRTY' && (hasActiveStay || room.status === 'MAINTENANCE' || room.status === 'BLOCKED')) {
      return NextResponse.json({
        error: `Cannot set room to DIRTY while in '${room.status}' state or occupied by a guest.`,
      }, { status: 400 });
    }

    // Use transaction for atomic room status update and housekeeping task creation
    const updatedRoom = await prisma.$transaction(async (tx) => {
      const updated = await tx.room.update({
        where: { id },
        data: { status: status as RoomStatus },
        include: {
          roomType: true,
        },
      });

      // If room is set to DIRTY, ensure an unresolved PENDING task exists with standard 6-item checklist
      if (status === 'DIRTY') {
        const existingActiveTask = await tx.housekeepingTask.findFirst({
          where: {
            roomId: id,
            status: { in: ['PENDING', 'IN_PROGRESS'] },
          },
        });

        if (!existingActiveTask) {
          await tx.housekeepingTask.create({
            data: {
              roomId: id,
              status: 'PENDING',
              priority: 'MEDIUM',
              checklist: getStandardChecklistJson(),
              notes: 'Created via Set Dirty action',
            },
          });
        } else if (isChecklistEmpty(existingActiveTask.checklist)) {
          // If task exists but checklist was empty, initialize it safely without touching progress or notes
          await tx.housekeepingTask.update({
            where: { id: existingActiveTask.id },
            data: {
              checklist: getStandardChecklistJson(),
            },
          });
        }
      }

      return updated;
    });

    return NextResponse.json(updatedRoom, { status: 200 });
  } catch (error) {
    console.error('Error updating room status:', error);
    return NextResponse.json({ error: 'Failed to update room status' }, { status: 500 });
  }
}
