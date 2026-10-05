const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/book/page.tsx', 'utf8');
c = c.replace(
  /body: JSON\.stringify\(\{[\s\S]*?roomIds: rooms,/,
  "body: JSON.stringify({\n          reservationId: resIdParam || undefined,\n          roomIds: rooms,"
);
fs.writeFileSync('src/app/dashboard/book/page.tsx', c);
