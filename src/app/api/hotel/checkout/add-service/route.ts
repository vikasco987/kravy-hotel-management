import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthContext } from '@/lib/authContext';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { stayId, stayRoomId, name, price, quantity, type } = await req.json();

    if (!stayId || !stayRoomId || !name || price === undefined || quantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch StayRoom to ensure it exists and get current values
      const stayRoom = await tx.stayRoom.findUnique({
        where: { id: stayRoomId },
        include: { room: true }
      });

      if (!stayRoom) {
        throw new Error('StayRoom not found');
      }
      
      if (stayRoom.stayId !== stayId) {
         throw new Error('StayRoom does not belong to the provided Stay');
      }

      // 2. Check if a RoomCharge for this exact service already exists for this room
      const existingCharge = await tx.roomCharge.findFirst({
        where: {
          stayId,
          stayRoomId,
          description: name,
          chargeType: type || 'EXTRA_SERVICE'
        }
      });

      let chargeDifference = 0;
      let newTotal = price * quantity;

      if (existingCharge) {
        // If quantity becomes 0, remove the charge
        if (quantity === 0) {
           await tx.roomCharge.delete({ where: { id: existingCharge.id } });
           chargeDifference = -existingCharge.totalAmount;
        } else {
           // Update existing
           chargeDifference = newTotal - existingCharge.totalAmount;
           await tx.roomCharge.update({
             where: { id: existingCharge.id },
             data: {
               quantity,
               amount: price,
               totalAmount: newTotal
             }
           });
        }
      } else {
        if (quantity > 0) {
           chargeDifference = newTotal;
           await tx.roomCharge.create({
             data: {
               stayId,
               stayRoomId,
               description: name,
               chargeType: type || 'EXTRA_SERVICE',
               amount: price,
               quantity,
               totalAmount: newTotal
             }
           });
        }
      }

      // 3. Update StayRoom totals (we only modify extraChargesAmount, taxableAmount, taxAmount, grossAmount, finalAmount)
      // To be perfectly accurate, we should recalculate tax based on taxMode.
      // For EXTRA_SERVICES, tax is usually applied on top if EXCLUSIVE, or included if INCLUSIVE.
      
      let additionalTax = 0;
      let additionalGross = chargeDifference;
      let additionalFinal = chargeDifference;
      
      if (stayRoom.taxMode === 'EXCLUSIVE') {
         // Tax is applied on top of the charge
         additionalTax = Math.round(chargeDifference * (stayRoom.taxRate / 10000));
         additionalFinal = chargeDifference + additionalTax;
      } else if (stayRoom.taxMode === 'INCLUSIVE') {
         // Tax is included in the charge
         const taxFraction = stayRoom.taxRate / 10000;
         // Total = Base + Base*taxFraction = Base * (1 + taxFraction)
         // Base = Total / (1 + taxFraction)
         const baseAmt = Math.round(chargeDifference / (1 + taxFraction));
         additionalTax = chargeDifference - baseAmt;
         // Gross amount is the total before tax, but wait, in INCLUSIVE, finalAmount = grossAmount.
         additionalGross = chargeDifference; // we just add it to gross
         additionalFinal = chargeDifference;
      }

      const updatedStayRoom = await tx.stayRoom.update({
        where: { id: stayRoomId },
        data: {
           extraChargesAmount: { increment: chargeDifference },
           taxableAmount: { increment: stayRoom.taxMode === 'EXCLUSIVE' ? chargeDifference : chargeDifference - additionalTax },
           taxAmount: { increment: additionalTax },
           cgstAmount: { increment: Math.round(additionalTax / 2) },
           sgstAmount: { increment: Math.round(additionalTax / 2) },
           grossAmount: { increment: additionalGross },
           finalAmount: { increment: additionalFinal }
        }
      });
      
      return updatedStayRoom;
    });

    return NextResponse.json({ success: true, stayRoom: result }, { status: 200 });

  } catch (error: any) {
    console.error('Error adding checkout service:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
