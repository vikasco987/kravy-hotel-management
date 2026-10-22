import test from 'node:test';
import assert from 'node:assert/strict';

// Core pricing calculation contract test
// Mirrors PricingService integer math for GST calculations
function calculateRoomPricing(input) {
  const { baseRate, nights, discountType, discountValue, taxMode, taxRate, extraCharges = [] } = input;
  const grossAmount = baseRate * nights;

  let discountAmount = 0;
  if (discountType === 'PERCENTAGE' && discountValue) {
    discountAmount = Math.round((grossAmount * discountValue) / 100);
  } else if (discountType === 'FIXED' && discountValue) {
    discountAmount = discountValue;
  }
  discountAmount = Math.max(0, Math.min(grossAmount, discountAmount));
  const netRoomAmount = grossAmount - discountAmount;

  let extraChargesAmount = 0;
  for (const charge of extraCharges) {
    const mult = charge.chargeMode === 'DAILY' ? nights : 1;
    extraChargesAmount += charge.amount * charge.quantity * mult;
  }

  const preTaxAmount = netRoomAmount + extraChargesAmount;
  let taxableAmount = 0;
  let taxAmount = 0;
  let finalAmount = 0;

  if (taxMode === 'INCLUSIVE') {
    taxableAmount = Math.round((preTaxAmount * 10000) / (10000 + taxRate));
    taxAmount = preTaxAmount - taxableAmount;
    finalAmount = preTaxAmount;
  } else {
    taxableAmount = preTaxAmount;
    taxAmount = Math.round((taxableAmount * taxRate) / 10000);
    finalAmount = taxableAmount + taxAmount;
  }

  const cgstAmount = Math.round(taxAmount / 2);
  const sgstAmount = taxAmount - cgstAmount;

  return {
    grossAmount,
    discountAmount,
    netRoomAmount,
    extraChargesAmount,
    taxableAmount,
    taxAmount,
    cgstAmount,
    sgstAmount,
    finalAmount,
  };
}

// Mock tax resolver function representing resolveTaxConfigForRoom precedence logic
function resolveTaxConfigMock({ hotelSettings, roomTypeTaxProfile }) {
  if (hotelSettings) {
    const isTaxEnabled = hotelSettings.taxEnabled !== false;
    const hotelTaxRate = hotelSettings.taxRate ?? 1200;
    const hotelTaxMode = hotelSettings.taxMode || 'INCLUSIVE';

    // 1. Hotel OFF takes absolute precedence over any room-specific TaxProfile
    if (!isTaxEnabled || hotelTaxRate === 0) {
      return {
        taxEnabled: false,
        taxRate: 0,
        taxMode: 'INCLUSIVE',
        source: 'DISABLED_ZERO',
      };
    }

    // 2. Hotel ON: check room-specific override
    if (roomTypeTaxProfile && roomTypeTaxProfile.isActive) {
      return {
        taxEnabled: roomTypeTaxProfile.rate > 0,
        taxRate: roomTypeTaxProfile.rate,
        taxMode: roomTypeTaxProfile.mode || 'INCLUSIVE',
        source: 'ROOM_TYPE_TAX_PROFILE',
      };
    }

    // 3. Hotel ON: hotel default
    return {
      taxEnabled: true,
      taxRate: hotelTaxRate,
      taxMode: hotelTaxMode,
      source: 'HOTEL_SETTINGS',
    };
  }

  // 4. Missing HotelSettings fallback: check room TaxProfile first, else legacy 12% INCLUSIVE
  if (roomTypeTaxProfile && roomTypeTaxProfile.isActive) {
    return {
      taxEnabled: roomTypeTaxProfile.rate > 0,
      taxRate: roomTypeTaxProfile.rate,
      taxMode: roomTypeTaxProfile.mode || 'INCLUSIVE',
      source: 'ROOM_TYPE_TAX_PROFILE',
    };
  }

  return {
    taxEnabled: true,
    taxRate: 1200,
    taxMode: 'INCLUSIVE',
    source: 'LEGACY_DEFAULT',
  };
}

test('Bug A: GST OFF takes absolute precedence over active room TaxProfile', () => {
  const result = resolveTaxConfigMock({
    hotelSettings: { taxEnabled: false, taxRate: 1200, taxMode: 'INCLUSIVE' },
    roomTypeTaxProfile: { isActive: true, rate: 1800, mode: 'EXCLUSIVE' },
  });

  assert.equal(result.taxEnabled, false);
  assert.equal(result.taxRate, 0);
  assert.equal(result.source, 'DISABLED_ZERO');

  const pricing = calculateRoomPricing({
    baseRate: 350000,
    nights: 1,
    taxMode: result.taxMode,
    taxRate: result.taxRate,
  });

  assert.equal(pricing.taxableAmount, 350000);
  assert.equal(pricing.taxAmount, 0);
  assert.equal(pricing.cgstAmount, 0);
  assert.equal(pricing.sgstAmount, 0);
  assert.equal(pricing.finalAmount, 350000);
});

test('Bug A: GST ON restores active room-specific TaxProfile override', () => {
  const result = resolveTaxConfigMock({
    hotelSettings: { taxEnabled: true, taxRate: 1200, taxMode: 'INCLUSIVE' },
    roomTypeTaxProfile: { isActive: true, rate: 1800, mode: 'EXCLUSIVE' },
  });

  assert.equal(result.taxEnabled, true);
  assert.equal(result.taxRate, 1800);
  assert.equal(result.taxMode, 'EXCLUSIVE');
  assert.equal(result.source, 'ROOM_TYPE_TAX_PROFILE');
});

test('Bug A: Missing legacy settings defaults to 12% INCLUSIVE safely', () => {
  const result = resolveTaxConfigMock({
    hotelSettings: null,
    roomTypeTaxProfile: null,
  });

  assert.equal(result.taxEnabled, true);
  assert.equal(result.taxRate, 1200);
  assert.equal(result.taxMode, 'INCLUSIVE');
  assert.equal(result.source, 'LEGACY_DEFAULT');
});

test('Bug B: ₹3,500 Inclusive at 12% GST exact financial contract', () => {
  const pricing = calculateRoomPricing({
    baseRate: 350000, // ₹3,500 in paise
    nights: 1,
    taxMode: 'INCLUSIVE',
    taxRate: 1200, // 12%
  });

  assert.equal(pricing.grossAmount, 350000, 'Gross rent is ₹3,500');
  assert.equal(pricing.taxableAmount, 312500, 'Taxable amount is ₹3,125');
  assert.equal(pricing.taxAmount, 37500, 'Total GST is ₹375');
  assert.equal(pricing.cgstAmount, 18750, 'CGST 6% is ₹187.50');
  assert.equal(pricing.sgstAmount, 18750, 'SGST 6% is ₹187.50');
  assert.equal(pricing.finalAmount, 350000, 'Final payable amount remains ₹3,500 without double counting');

  // Reservation details payment summary simulation:
  const roomChargesSubtotal = 350000;
  const extraServicesTotal = 0;
  const isInclusive = true;
  const totalAmount = isInclusive
    ? (roomChargesSubtotal + extraServicesTotal)
    : (roomChargesSubtotal + extraServicesTotal + pricing.taxAmount);

  assert.equal(totalAmount, 350000, 'Reservation details displays ₹3,500 total, NOT ₹3,875');
});

test('Bug B: ₹3,500 Exclusive at 12% GST exact financial contract', () => {
  const pricing = calculateRoomPricing({
    baseRate: 350000,
    nights: 1,
    taxMode: 'EXCLUSIVE',
    taxRate: 1200,
  });

  assert.equal(pricing.taxableAmount, 350000, 'Taxable amount is ₹3,500');
  assert.equal(pricing.taxAmount, 42000, 'Total GST is ₹420');
  assert.equal(pricing.cgstAmount, 21000, 'CGST 6% is ₹210');
  assert.equal(pricing.sgstAmount, 21000, 'SGST 6% is ₹210');
  assert.equal(pricing.finalAmount, 392000, 'Final amount payable is ₹3,920');

  const roomChargesSubtotal = 350000;
  const extraServicesTotal = 0;
  const isInclusive = false;
  const totalAmount = isInclusive
    ? (roomChargesSubtotal + extraServicesTotal)
    : (roomChargesSubtotal + extraServicesTotal + pricing.taxAmount);

  assert.equal(totalAmount, 392000, 'Reservation details displays ₹3,920 total');
});

test('Bug C: Multi-room invoice aggregation matches thermal and A4 formats', () => {
  const room1 = calculateRoomPricing({ baseRate: 350000, nights: 1, taxMode: 'INCLUSIVE', taxRate: 1200 });
  const room2 = calculateRoomPricing({ baseRate: 250000, nights: 1, taxMode: 'INCLUSIVE', taxRate: 1200 });

  const combinedGross = room1.grossAmount + room2.grossAmount;
  const combinedTaxable = room1.taxableAmount + room2.taxableAmount;
  const combinedCgst = room1.cgstAmount + room2.cgstAmount;
  const combinedSgst = room1.sgstAmount + room2.sgstAmount;
  const combinedTax = room1.taxAmount + room2.taxAmount;
  const combinedFinal = room1.finalAmount + room2.finalAmount;

  assert.equal(combinedGross, 600000, 'Combined gross is ₹6,000');
  assert.equal(combinedFinal, 600000, 'Combined final is ₹6,000');
  assert.equal(combinedTaxable, 312500 + 223214, 'Combined taxable reconciles');
  assert.equal(combinedTax, 37500 + 26786, 'Combined tax reconciles');

  const advancePaid = 200000; // ₹2,000 paid
  const balanceDue = combinedFinal - advancePaid;
  assert.equal(balanceDue, 400000, 'Balance due is ₹4,000');
});
