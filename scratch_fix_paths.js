
const fs = require('fs');

function replaceFile(path) {
  let c = fs.readFileSync(path, 'utf8');
  c = c.replace(/\/dashboard\/checkin\?resId=/g, '/dashboard/book?resId=');
  fs.writeFileSync(path, c);
}

replaceFile('src/app/dashboard/reservations/page.tsx');
replaceFile('src/app/dashboard/reservations/[id]/page.tsx');
