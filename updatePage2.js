const fs = require('fs');
const path = 'C:/studio/kravy-hotel-management/src/app/dashboard/book/page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'const showSelection = !resIdParam && rooms.length === 0 && !isFetching && !roomsParam;',
  'const showSelection = !resIdParam && !roomsParam && !isFetching;'
);

content = content.replace(
  '<AvailableRoomSelection onComplete={(ids) => router.push(\'/dashboard/book?rooms=\' + ids.join(\',\'))} />',
  '<AvailableRoomSelection initialRooms={rooms} onComplete={(ids) => { setRooms(ids); router.push(\'/dashboard/book?rooms=\' + ids.join(\',\')); }} />'
);

fs.writeFileSync(path, content);
console.log('Updated showSelection');
