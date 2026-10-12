import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/authContext';
import { Role, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

const ALLOWED_STAFF_ROLES: Role[] = ['HOUSEKEEPING', 'RECEPTIONIST', 'MANAGER', 'STAFF'];

/**
 * PATCH /api/hotel/staff/[id]
 * Updates an existing staff member's profile, role, contact info, or active status.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized or Hotel not found' }, { status: 401 });
    }

    const { id } = await params;
    if (!id || id.length !== 24) {
      return NextResponse.json({ error: 'Invalid staff ID' }, { status: 400 });
    }

    // Ensure staff belongs to the authenticated hotel
    const staff = await prisma.staff.findFirst({
      where: {
        id,
        hotelId: authContext.hotel.id,
      }
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found or unauthorized' }, { status: 404 });
    }

    const body = await req.json();
    const { name, role, email, phone, status, password } = body;

    const updateData: Prisma.StaffUpdateInput = {};

    // 1. Name validation
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    // 2. Role validation
    if (role !== undefined) {
      const cleanRole = role.toUpperCase() as Role;
      if (!ALLOWED_STAFF_ROLES.includes(cleanRole)) {
        return NextResponse.json({ 
          error: `Invalid role. Allowed roles are: ${ALLOWED_STAFF_ROLES.join(', ')}` 
        }, { status: 400 });
      }
      updateData.role = cleanRole;
      updateData.accessType = cleanRole;
    }

    // 3. Email validation & duplicate check
    if (email !== undefined) {
      const cleanEmail = email && typeof email === 'string' && email.trim() !== '' 
        ? email.trim().toLowerCase() 
        : null;

      if (cleanEmail && cleanEmail !== staff.email) {
        const existing = await prisma.staff.findUnique({
          where: { email: cleanEmail }
        });
        if (existing && existing.id !== id) {
          return NextResponse.json({ error: 'Another staff member is already using this email' }, { status: 409 });
        }
      }
      updateData.email = cleanEmail;
    }

    // 4. Phone validation
    if (phone !== undefined) {
      updateData.phone = phone && typeof phone === 'string' && phone.trim() !== '' ? phone.trim() : null;
    }

    // 5. Status validation (active/inactive)
    if (status !== undefined) {
      if (status !== 'active' && status !== 'inactive') {
        return NextResponse.json({ error: "Status must be either 'active' or 'inactive'" }, { status: 400 });
      }
      // Safety safeguard: Prevent user from deactivating themselves
      if (status === 'inactive' && authContext.user.id === id) {
        return NextResponse.json({ error: 'You cannot deactivate your own active account' }, { status: 400 });
      }
      updateData.status = status;
    }

    // 6. Optional Password update
    if (password && typeof password === 'string' && password.trim() !== '') {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedStaff = await prisma.staff.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        role: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { tasks: true }
        }
      }
    });

    return NextResponse.json(updatedStaff, { status: 200 });
  } catch (error: unknown) {
    console.error('Error updating staff member:', error);
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Email address is already in use' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update staff member' }, { status: 500 });
  }
}

/**
 * DELETE /api/hotel/staff/[id]
 * Safely deactivates staff member to preserve task and activity history.
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized or Hotel not found' }, { status: 401 });
    }

    const { id } = await params;
    if (!id || id.length !== 24) {
      return NextResponse.json({ error: 'Invalid staff ID' }, { status: 400 });
    }

    const staff = await prisma.staff.findFirst({
      where: {
        id,
        hotelId: authContext.hotel.id,
      },
      include: {
        _count: {
          select: { tasks: true }
        }
      }
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found or unauthorized' }, { status: 404 });
    }

    // Safety safeguard: Prevent user from deleting/deactivating themselves
    if (authContext.user.id === id) {
      return NextResponse.json({ error: 'You cannot deactivate your own active account' }, { status: 400 });
    }

    // Safe deactivation: Retain past history, tasks, and activity logs
    const deactivatedStaff = await prisma.staff.update({
      where: { id },
      data: { status: 'inactive' },
      select: {
        id: true,
        name: true,
        role: true,
        status: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Staff member deactivated successfully',
      staff: deactivatedStaff
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error deactivating staff member:', error);
    return NextResponse.json({ error: 'Failed to deactivate staff member' }, { status: 500 });
  }
}
