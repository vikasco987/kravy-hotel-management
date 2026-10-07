const fs = require('fs');

const file = 'C:/studio/kravy-hotel-management/src/app/api/hotel/reservations/route.ts';
let code = fs.readFileSync(file, 'utf8');

// Replace the loop
const oldLoop = `      for (const rr of res.rooms) {
         if (!minCheckIn || new Date(rr.checkInDate) < minCheckIn) minCheckIn = new Date(rr.checkInDate);
         if (!maxCheckOut || new Date(rr.checkOutDate) > maxCheckOut) maxCheckOut = new Date(rr.checkOutDate);
         if (rr.nights > totalNights) totalNights = rr.nights;
         
         if (rr.roomId && roomMap.has(rr.roomId)) {
           const rObj = roomMap.get(rr.roomId);
           roomNames.push(\`Room \${rObj.roomNumber} (\${rObj.roomType.name})\`);
         } else {
           roomNames.push(\`Unassigned\`);
         }
         
         if (rr.guestsData && Array.isArray(rr.guestsData)) {
            totalGuests += rr.guestsData.length;
         } else {
            totalGuests += 1;
         }
      }`;

const newLoop = `      for (const rr of res.rooms) {
         if (!minCheckIn || new Date(rr.checkInDate) < minCheckIn) minCheckIn = new Date(rr.checkInDate);
         if (!maxCheckOut || new Date(rr.checkOutDate) > maxCheckOut) maxCheckOut = new Date(rr.checkOutDate);
         
         if (rr.roomId && roomMap.has(rr.roomId)) {
           const rObj = roomMap.get(rr.roomId);
           roomNames.push(\`Room \${rObj.roomNumber} (\${rObj.roomType.name})\`);
         } else {
           roomNames.push(\`Unassigned\`);
         }
         
         if (rr.guestsData && Array.isArray(rr.guestsData)) {
            totalGuests += rr.guestsData.length;
         } else {
            totalGuests += 1;
         }
      }

      if (minCheckIn && maxCheckOut) {
         const start = new Date(minCheckIn);
         start.setHours(0, 0, 0, 0);
         const end = new Date(maxCheckOut);
         end.setHours(0, 0, 0, 0);
         totalNights = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      }`;

// Do a fuzzy replace just in case of spaces
// let's do a regex replace
code = code.replace(/for\s*\(\s*const\s+rr\s+of\s+res\.rooms\s*\)\s*\{[\s\S]*?if\s*\(\s*rr\.guestsData\s*&&\s*Array\.isArray\(\s*rr\.guestsData\s*\)\s*\)\s*\{[\s\S]*?\}\s*else\s*\{[\s\S]*?\}\s*\}/, newLoop);

fs.writeFileSync(file, code);
console.log('Fixed route.ts successfully!');
