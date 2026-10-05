const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/book/page.tsx', 'utf8');
c = c.replace(
  /pricing\[rr\.roomId\] = \{[\s\S]*?nights: rr\.nights[\s\S]*?\};/,
  "pricing[rr.roomId] = {\n                     baseRate: rr.baseRate,\n                     discountAmount: discount > 0 ? discount : 0,\n                     extraChargesAmount: 0,\n                     cgstAmount: 0,\n                     sgstAmount: 0,\n                     taxAmount: 0,\n                     taxableAmount: (rr.appliedRate || rr.baseRate),\n                     taxMode: 'INCLUSIVE',\n                     taxRate: 1200,\n                     finalAmount: (rr.appliedRate || rr.baseRate),\n                     nights: rr.nights || Math.max(1, (new Date(rr.checkOutDate).getTime() - new Date(rr.checkInDate).getTime()) / (1000 * 3600 * 24))\n                  };"
);
fs.writeFileSync('src/app/dashboard/book/page.tsx', c);
