import { PricingService } from './src/lib/pricing/PricingService';

const inclusive = PricingService.calculateRoomPricing({
  baseRate: 150000,
  nights: 1,
  discountType: null,
  discountValue: null,
  taxMode: 'INCLUSIVE',
  taxRate: 1200,
  extraCharges: []
});

const exclusive = PricingService.calculateRoomPricing({
  baseRate: 150000,
  nights: 1,
  discountType: null,
  discountValue: null,
  taxMode: 'EXCLUSIVE',
  taxRate: 1200,
  extraCharges: []
});

console.log("INCLUSIVE:", inclusive);
console.log("EXCLUSIVE:", exclusive);
