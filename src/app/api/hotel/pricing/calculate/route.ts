import { NextResponse } from 'next/server';
import { PricingService } from '@/lib/pricing/PricingService';

function calculateNights(checkInStr: string, checkOutStr: string): number {
  // Parse date strings strictly as YYYY-MM-DD to avoid timezone shifting
  // "2026-09-10"
  const checkInParts = checkInStr.split('T')[0].split('-');
  const checkOutParts = checkOutStr.split('T')[0].split('-');
  
  if (checkInParts.length === 3 && checkOutParts.length === 3) {
    const ci = new Date(Date.UTC(Number(checkInParts[0]), Number(checkInParts[1]) - 1, Number(checkInParts[2])));
    const co = new Date(Date.UTC(Number(checkOutParts[0]), Number(checkOutParts[1]) - 1, Number(checkOutParts[2])));
    const diff = Math.round((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }
  
  return 1;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Expected payload:
    // checkInDate: string (e.g. "2026-09-10")
    // checkOutDate: string (e.g. "2026-09-11")
    // baseRate: number (paise)
    // discountType: "PERCENTAGE" | "FIXED" | null
    // discountValue: number | null
    // taxMode: "INCLUSIVE" | "EXCLUSIVE"
    // taxRate: number
    // extraCharges: Array<{ amount: number, quantity: number, chargeMode: "FIXED" | "DAILY" }>

    const nights = calculateNights(body.checkInDate, body.checkOutDate);

    const result = PricingService.calculateRoomPricing({
      baseRate: body.baseRate,
      nights,
      discountType: body.discountType,
      discountValue: body.discountValue,
      taxMode: body.taxMode,
      taxRate: body.taxRate,
      extraCharges: body.extraCharges || []
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Calculation failed' }, { status: 500 });
  }
}
