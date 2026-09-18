import { PricingService, RoomPricingInput } from '../lib/pricing/PricingService';
import { PricingMode } from '@prisma/client';

describe('PricingService', () => {
  it('should calculate ₹2500 + 12% exclusive GST', () => {
    const input: RoomPricingInput = {
      baseRate: 250000,
      nights: 1,
      taxMode: 'EXCLUSIVE',
      taxRate: 1200,
      extraCharges: []
    };
    const result = PricingService.calculateRoomPricing(input);
    expect(result.grossAmount).toBe(250000);
    expect(result.taxableAmount).toBe(250000);
    expect(result.taxAmount).toBe(30000); // 12% of 2500
    expect(result.finalAmount).toBe(280000);
  });

  it('should calculate ₹2500 inclusive GST', () => {
    const input: RoomPricingInput = {
      baseRate: 250000,
      nights: 1,
      taxMode: 'INCLUSIVE',
      taxRate: 1200,
      extraCharges: []
    };
    const result = PricingService.calculateRoomPricing(input);
    // 2500 / 1.12 = 2232.14 -> 223214 paise
    expect(result.grossAmount).toBe(250000);
    expect(result.finalAmount).toBe(250000);
    expect(result.taxableAmount).toBe(223214);
    expect(result.taxAmount).toBe(26786); // 250000 - 223214
  });

  it('should apply a 10% discount correctly', () => {
    const input: RoomPricingInput = {
      baseRate: 250000,
      nights: 1,
      discountType: 'PERCENTAGE',
      discountValue: 10,
      taxMode: 'EXCLUSIVE',
      taxRate: 1200,
      extraCharges: []
    };
    const result = PricingService.calculateRoomPricing(input);
    expect(result.discountAmount).toBe(25000);
    expect(result.netRoomAmount).toBe(225000);
    expect(result.taxableAmount).toBe(225000);
    expect(result.taxAmount).toBe(27000);
    expect(result.finalAmount).toBe(252000);
  });

  it('should apply a fixed discount of ₹300 correctly', () => {
    const input: RoomPricingInput = {
      baseRate: 250000,
      nights: 1,
      discountType: 'FIXED',
      discountValue: 30000,
      taxMode: 'EXCLUSIVE',
      taxRate: 1200,
      extraCharges: []
    };
    const result = PricingService.calculateRoomPricing(input);
    expect(result.discountAmount).toBe(30000);
    expect(result.netRoomAmount).toBe(220000);
  });

  it('should scale gross amount and daily extra bed across a 5-night stay', () => {
    const input: RoomPricingInput = {
      baseRate: 250000,
      nights: 5,
      taxMode: 'EXCLUSIVE',
      taxRate: 1200,
      extraCharges: [
        { amount: 50000, quantity: 1, chargeMode: 'DAILY' }
      ]
    };
    const result = PricingService.calculateRoomPricing(input);
    expect(result.grossAmount).toBe(1250000); // 2500 * 5
    expect(result.extraChargesAmount).toBe(250000); // 500 * 5
    expect(result.taxableAmount).toBe(1500000); // 1250000 + 250000
    expect(result.taxAmount).toBe(180000); // 12% of 1500000
    expect(result.finalAmount).toBe(1680000);
  });

  it('should handle negative discount as zero', () => {
    const input: RoomPricingInput = {
      baseRate: 250000,
      nights: 1,
      discountType: 'FIXED',
      discountValue: -50000, // Should be clamped to 0
      taxMode: 'EXCLUSIVE',
      taxRate: 1200,
      extraCharges: []
    };
    const result = PricingService.calculateRoomPricing(input);
    expect(result.discountAmount).toBe(0);
    expect(result.netRoomAmount).toBe(250000);
  });
});
