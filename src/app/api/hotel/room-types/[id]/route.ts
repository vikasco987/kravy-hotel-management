import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthContext } from '@/lib/authContext';

const prisma = new PrismaClient();

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hotel } = authContext;
    const { id } = await params;
    const body = await req.json();
    const { name, basePrice } = body;

    const roomType = await prisma.roomType.findFirst({
      where: { id, hotelId: hotel.id }
    });

    if (!roomType) {
      return NextResponse.json({ error: 'Room category not found' }, { status: 404 });
    }

    const trimmedName = name ? String(name).trim() : undefined;
    if (trimmedName !== undefined && trimmedName.length === 0) {
      return NextResponse.json({ error: 'Category name cannot be blank' }, { status: 400 });
    }

    if (trimmedName && trimmedName.toLowerCase() !== roomType.name.toLowerCase()) {
      // Check for duplicate name in the same hotel (case-insensitive)
      const existing = await prisma.roomType.findFirst({
        where: {
          hotelId: hotel.id,
          name: { equals: trimmedName, mode: 'insensitive' },
          id: { not: roomType.id },
          isActive: true
        }
      });

      if (existing) {
        return NextResponse.json({ error: 'A room category with this name already exists' }, { status: 400 });
      }
    }

    let parsedPrice: number | undefined = undefined;
    if (basePrice !== undefined) {
      parsedPrice = parseInt(String(basePrice), 10);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        return NextResponse.json({ error: 'Base price must be a positive number' }, { status: 400 });
      }
    }

    const updated = await prisma.roomType.update({
      where: { id: roomType.id },
      data: {
        ...(trimmedName && { name: trimmedName }),
        ...(parsedPrice !== undefined && { basePrice: parsedPrice })
      }
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error('Error updating room category:', error);
    if (error?.code === 'P2023' || error?.message?.includes('ObjectId')) {
      return NextResponse.json({ error: 'Invalid ID format provided' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update room category' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hotel } = authContext;
    const { id } = await params;

    const roomType = await prisma.roomType.findFirst({
      where: { id, hotelId: hotel.id },
      include: {
        _count: {
          select: {
            rooms: {
              where: { isActive: true }
            }
          }
        }
      }
    });

    if (!roomType) {
      return NextResponse.json({ error: 'Room category not found' }, { status: 404 });
    }

    // Safeguard: Check if any active rooms are assigned to this room type
    if (roomType._count.rooms > 0) {
      return NextResponse.json({
        error: `Cannot delete category "${roomType.name}": There are ${roomType._count.rooms} active room(s) assigned to this category. Please reassign or delete those rooms first.`
      }, { status: 400 });
    }

    // Safe deactivation: soft-delete to preserve foreign key integrity on historical reservations/stays
    await prisma.roomType.update({
      where: { id: roomType.id },
      data: {
        isActive: false,
        name: `${roomType.name}_deleted_${Date.now()}` // frees up the category name for reuse
      }
    });

    return NextResponse.json({ success: true, message: 'Room category deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting room category:', error);
    if (error?.code === 'P2023' || error?.message?.includes('ObjectId')) {
      return NextResponse.json({ error: 'Invalid ID format provided' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to delete room category' }, { status: 500 });
  }
}
