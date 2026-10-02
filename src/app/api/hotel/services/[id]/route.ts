import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/authContext';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, price, description, isActive } = body;

    const existingService = await prisma.extraService.findFirst({
      where: { id, hotelId: authContext.hotel.id }
    });

    if (!existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const updatedData: any = {};
    if (name !== undefined) updatedData.name = name;
    if (price !== undefined) updatedData.price = Math.round(Number(price) * 100);
    if (description !== undefined) updatedData.description = description;
    if (isActive !== undefined) updatedData.isActive = isActive;

    const updatedService = await prisma.extraService.update({
      where: { id },
      data: updatedData
    });

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
