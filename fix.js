const fs = require('fs');
const path = 'C:/studio/kravy-hotel-management/src/app/api/hotel/bookings/check-in/route.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/fileReference: url\r?\n\s+\}/g, "fileReference: url,\n                  verificationStatus: 'VERIFIED'\n               }");
content = content.replace(/fileReference: doc\.url\r?\n\s+\}/g, "fileReference: doc.url,\n                  verificationStatus: 'VERIFIED'\n               }");
content = content.replace(/fileReference: leadGuestData\.idUrl\r?\n\s+\}/g, "fileReference: leadGuestData.idUrl,\n               verificationStatus: 'VERIFIED'\n            }");
content = content.replace(/fileReference: url \}/g, "fileReference: url, verificationStatus: 'VERIFIED' }");
content = content.replace(/fileReference: g\.idUrl \}/g, "fileReference: g.idUrl, verificationStatus: 'VERIFIED' }");

fs.writeFileSync(path, content);
console.log('Replaced successfully');
