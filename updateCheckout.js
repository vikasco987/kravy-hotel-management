const fs = require('fs');
const path = 'C:/studio/kravy-hotel-management/src/app/dashboard/checkout/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Inject Import
content = content.replace(
  "import dayjs from 'dayjs';",
  "import dayjs from 'dayjs';\nimport OccupiedRoomSelection from \"./OccupiedRoomSelection\";"
);

// Inject Branch logic
content = content.replace(
  "const roomId = searchParams.get('roomId');",
  "const roomId = searchParams.get('roomId');\n  const selectedRoomsParam = searchParams.get('selectedRooms');\n\n  if (!roomId) {\n     return <OccupiedRoomSelection onComplete={(ids) => router.push(`/dashboard/checkout?roomId=${ids[0]}&selectedRooms=${ids.join(',')}`)} />;\n  }"
);

// Remove the `if (!roomId)` check inside useEffect since it's already handled, or just leave it.
// Actually, since I added an early return, the useEffect won't run if !roomId, but wait: `useEffect` is declared AFTER the early return?
// Let's check where `useEffect` is.
