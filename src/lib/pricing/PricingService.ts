import { PricingMode, DiscountType, ChargeMode } from '@prisma/client';

export interface RoomPricingInput {
  baseRate: number; // paise
  nights: number;
  discountType?: DiscountType | null;
  discountValue?: number | null; // percentage (0-100) or fixed amount in paise
  taxMode: PricingMode;
  taxRate: number; // e.g. 1200 for 12%
  extraCharges: Array<{
    amount: number; // paise
    quantity: number;
    chargeMode: ChargeMode;
  }>;
}

export interface RoomPricingSnapshot {
  baseRate: number;
  nights: number;
  grossAmount: number;
  discountType: DiscountType | null;
  discountValue: number | null;
  discountAmount: number;
  netRoomAmount: number;
  
  extraChargesAmount: number;
  
  taxMode: PricingMode;
  taxRate: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  taxAmount: number;
  
  finalAmount: number;
}

export class PricingService {
  /**
   * Calculate exact pricing using strictly integer arithmetic (paise).
   */
  static calculateRoomPricing(input: RoomPricingInput): RoomPricingSnapshot {
    const { baseRate, nights, discountType, discountValue, taxMode, taxRate, extraCharges } = input;

    // 1. Gross Room Amount
    const grossAmount = baseRate * nights;

    // 2. Discount (Applied strictly to Gross Room Amount)
    let discountAmount = 0;
    if (discountType === 'PERCENTAGE' && discountValue) {
      // e.g. 10% = 10. (grossAmount * 10) / 100
      discountAmount = Math.round((grossAmount * discountValue) / 100);
    } else if (discountType === 'FIXED' && discountValue) {
      discountAmount = discountValue;
    }
    
    // Validate discount
    if (discountAmount < 0) discountAmount = 0;
    if (discountAmount > grossAmount) discountAmount = grossAmount;

    // 3. Net Room Amount
    const netRoomAmount = grossAmount - discountAmount;

    // 4. Extra Charges
    let extraChargesAmount = 0;
    for (const charge of extraCharges) {
      const chargeMultiplier = charge.chargeMode === 'DAILY' ? nights : 1;
      extraChargesAmount += charge.amount * charge.quantity * chargeMultiplier;
    }

    // 5. Tax Calculation
    const preTaxAmount = netRoomAmount + extraChargesAmount;
    let taxableAmount = 0;
    let taxAmount = 0;
    let finalAmount = 0;

    if (taxMode === 'INCLUSIVE') {
      // Taxable = PreTax / (1 + Rate)
      // e.g. PreTax / 1.12
      // Using integers: PreTax * 10000 / (10000 + taxRate)
      taxableAmount = Math.round((preTaxAmount * 10000) / (10000 + taxRate));
      taxAmount = preTaxAmount - taxableAmount;
      finalAmount = preTaxAmount;
    } else {
      // EXCLUSIVE
      taxableAmount = preTaxAmount;
      taxAmount = Math.round((taxableAmount * taxRate) / 10000);
      finalAmount = taxableAmount + taxAmount;
    }

    // Split CGST and SGST
    const cgstAmount = Math.round(taxAmount / 2);
    // Ensure they perfectly sum up to taxAmount (adjust SGST for any rounding difference)
    const sgstAmount = taxAmount - cgstAmount;

    return {
      baseRate,
      nights,
      grossAmount,
      discountType: discountType || null,
      discountValue: discountValue || null,
      discountAmount,
      netRoomAmount,
      extraChargesAmount,
      taxMode,
      taxRate,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      taxAmount,
      finalAmount,
    };
  }
}
