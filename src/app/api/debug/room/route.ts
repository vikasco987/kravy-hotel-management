import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET() {
  const room = await prisma.room.findUnique({
    where: { id: '6ab3e4c35b009ab2d8497580' },
    include: { roomType: true }
  });
  return NextResponse.json({ room });
}
