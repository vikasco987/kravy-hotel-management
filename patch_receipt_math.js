const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/book/page.tsx', 'utf8');
c = c.replace(
  /let totalRoomCharge = 0;[\s\S]*?totalAmount \+= base \* 1\.12;\n       \}\n    \}\);/,
  "let totalRoomCharge = 0;\n  let totalExtraCharges = 0;\n  let totalGst = 0;\n  let totalAmount = 0;\n\n  fetchedRooms.forEach(room => {\n     const pricing = roomPricing[room.id];\n     if (pricing) {\n        const netRoomAmount = pricing.baseRate / 100 - pricing.discountAmount / 100;\n        const extraCharges = (pricing.extraChargesAmount || 0) / 100;\n        const taxMode = pricing.taxMode || 'INCLUSIVE';\n        const taxRate = pricing.taxRate || 1200;\n\n        if (taxMode === 'INCLUSIVE') {\n           const netRoomTaxable = netRoomAmount * 10000 / (10000 + taxRate);\n           const extraTaxable = extraCharges * 10000 / (10000 + taxRate);\n           totalRoomCharge += netRoomTaxable;\n           totalExtraCharges += extraTaxable;\n        } else {\n           totalRoomCharge += netRoomAmount;\n           totalExtraCharges += extraCharges;\n        }\n\n        totalGst += (pricing.cgstAmount + pricing.sgstAmount) / 100;\n        totalAmount += pricing.finalAmount / 100;\n     } else {\n        const base = (room.roomType?.basePrice || 0) / 100;\n        totalRoomCharge += base;\n        totalGst += base * 0.12;\n        totalAmount += base * 1.12;\n     }\n  });"
);

// Also fix subtotal calculation in setReceiptData
c = c.replace(
  /subtotal: totalRoomCharge \+ totalExtraCharges \+ totalGst,/,
  "subtotal: totalRoomCharge + totalExtraCharges,"
);

fs.writeFileSync('src/app/dashboard/book/page.tsx', c);
