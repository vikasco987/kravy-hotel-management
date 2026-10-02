import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/authContext';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const services = await prisma.extraService.findMany({
      where: { hotelId: authContext.hotel.id },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    console.log('[API] POST /api/hotel/services called');
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      console.log('[API] Unauthorized: no auth context or hotel');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bodyText = await req.text();
    console.log('[API] POST body text:', bodyText);
    const body = JSON.parse(bodyText);
    const { name, price, description, isActive } = body;

    console.log('[API] parsed body:', { name, price, description, isActive });

    if (!name || price === undefined) {
      console.log('[API] Missing name or price');
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
    }

    const service = await prisma.extraService.create({
      data: {
        hotelId: authContext.hotel.id,
        name,
        price: Math.round(Number(price) * 100), // Convert to paise
        description,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json(service);
  } catch (error: any) {
    console.error('POST /api/hotel/services FATAL ERROR:', error);
    let errorMsg = 'Unable to create extra service';
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error;
    } else if (error && typeof error === 'object') {
      errorMsg = JSON.stringify(error);
    }
    
    return NextResponse.json(
      { 
        error: errorMsg,
        success: false,
        debug: "from_catch_block"
      }, 
      { status: 500 }
    );
  }
}
