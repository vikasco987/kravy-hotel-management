import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthContext } from '@/lib/authContext';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ stayId: string }> }) {
  try {
    const resolvedParams = await params;
    const authContext = await getAuthContext();
    if (!authContext || !authContext.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stayId = resolvedParams.stayId;

    const stay = await prisma.stay.findUnique({
      where: { id: stayId },
      include: {
        reservation: {
          include: {
            hotel: true,
            guest: true
          }
        },
        stayRooms: {
          include: { room: { include: { roomType: true } } }
        },
        invoice: true
      }
    });

    if (!stay) {
      return NextResponse.json({ error: 'Stay not found' }, { status: 404 });
    }

    const hotel = stay.reservation.hotel;
    const guest = stay.reservation.guest;
    const leadStayRoom = stay.stayRooms[0];
    
    // Create draft invoice if it doesn't exist
    let invoice = stay.invoice;
    if (!invoice) {
        // Find latest invoice number for this hotel to generate the next one
        const count = await prisma.invoice.count();
        const nextInvoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;
        
        invoice = await prisma.invoice.create({
           data: {
              stayId: stay.id,
              guestId: guest.id,
              invoiceNumber: nextInvoiceNumber,
              subtotal: leadStayRoom.grossAmount,
              discountAmount: leadStayRoom.discountAmount,
              taxableAmount: leadStayRoom.taxableAmount,
              cgstAmount: leadStayRoom.cgstAmount,
              sgstAmount: leadStayRoom.sgstAmount,
              taxAmount: leadStayRoom.taxAmount,
              totalAmount: leadStayRoom.finalAmount,
              status: "DRAFT"
           }
        });
    }

    return NextResponse.json({ 
       success: true, 
       data: { stay, hotel, guest, leadStayRoom, invoice } 
    });
  } catch (error) {
    console.error('Invoice Data Error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice data' }, { status: 500 });
  }
}
