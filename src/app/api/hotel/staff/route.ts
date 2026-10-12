import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/authContext';
import { Role, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

const ALLOWED_STAFF_ROLES: Role[] = ['HOUSEKEEPING', 'RECEPTIONIST', 'MANAGER', 'STAFF'];

/**
 * GET /api/hotel/staff
 * Returns staff members belonging to the authenticated hotel.
 * Supports search (name, email, phone) and role/status filtering.
 */
export async function GET(req: Request) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized or Hotel not found' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();
    const roleParam = searchParams.get('role')?.trim();
    const statusParam = searchParams.get('status')?.trim();

    const whereClause: Prisma.StaffWhereInput = {
      hotelId: authContext.hotel.id,
    };

    if (roleParam && roleParam !== 'ALL') {
      if (ALLOWED_STAFF_ROLES.includes(roleParam as Role)) {
        whereClause.role = roleParam as Role;
      }
    }

    if (statusParam && statusParam !== 'ALL') {
      whereClause.status = statusParam;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const staffList = await prisma.staff.findMany({
      where: whereClause,
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
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(staffList, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching hotel staff:', error);
    return NextResponse.json({ error: 'Failed to fetch staff members' }, { status: 500 });
  }
}

/**
 * POST /api/hotel/staff
 * Creates a new staff member for the authenticated hotel.
 */
export async function POST(req: Request) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized or Hotel not found' }, { status: 401 });
    }

    const body = await req.json();
    const { name, role, email, phone, password, status } = body;

    // 1. Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Full name is required (minimum 2 characters)' }, { status: 400 });
    }

    const cleanRole = (role || 'STAFF').toUpperCase() as Role;
    if (!ALLOWED_STAFF_ROLES.includes(cleanRole)) {
      return NextResponse.json({ 
        error: `Invalid role. Allowed operational roles are: ${ALLOWED_STAFF_ROLES.join(', ')}` 
      }, { status: 400 });
    }

    const cleanEmail = email && typeof email === 'string' && email.trim() !== '' 
      ? email.trim().toLowerCase() 
      : undefined;

    const cleanPhone = phone && typeof phone === 'string' && phone.trim() !== '' 
      ? phone.trim() 
      : undefined;

    // 2. Email uniqueness check
    if (cleanEmail) {
      const existing = await prisma.staff.findUnique({
        where: { email: cleanEmail }
      });
      if (existing) {
        return NextResponse.json({ error: 'A staff member with this email already exists' }, { status: 409 });
      }
    }

    // 3. Password handling
    let hashedPassword: string | undefined = undefined;
    if (password && typeof password === 'string' && password.trim() !== '') {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const cleanStatus = status === 'inactive' ? 'inactive' : 'active';

    // 4. Create Staff record
    const staff = await prisma.staff.create({
      data: {
        hotelId: authContext.hotel.id,
        businessId: authContext.business.id,
        name: name.trim(),
        role: cleanRole,
        accessType: cleanRole,
        status: cleanStatus,
        permissions: [],
        ...(cleanEmail ? { email: cleanEmail } : {}),
        ...(cleanPhone ? { phone: cleanPhone } : {}),
        ...(hashedPassword ? { password: hashedPassword } : {}),
      },
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

    return NextResponse.json(staff, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating hotel staff:', error);
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Email address is already in use' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 });
  }
}
