const fs = require('fs');
const path = 'C:/studio/kravy-hotel-management/src/app/dashboard/checkout/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Inject Import
content = content.replace(
  "import dayjs from 'dayjs';",
  "import dayjs from 'dayjs';\nimport OccupiedRoomSelection from \"./OccupiedRoomSelection\";"
);

// Inject searchParams extraction
content = content.replace(
  "const roomId = searchParams.get('roomId');",
  "const roomId = searchParams.get('roomId');\n  const selectedRoomsParam = searchParams.get('selectedRooms');"
);

// Inject Branch logic before `if (isLoading)`
content = content.replace(
  "if (isLoading) return <div className=\"h-screen",
  "if (!roomId) {\n     return <OccupiedRoomSelection onComplete={(ids) => router.push(`/dashboard/checkout?roomId=${ids[0]}&selectedRooms=${ids.join(',')}`)} />;\n  }\n\n  if (isLoading) return <div className=\"h-screen"
);

// Inject Selection logic
content = content.replace(
  "// By default, select all linked rooms\r\n          setSelectedStayRoomIds(json.linkedRooms.map((r: any) => r.stayRoomId));",
  "// By default, select all linked rooms or use selectedRooms param\r\n          if (selectedRoomsParam) {\r\n            const selectedRoomIds = selectedRoomsParam.split(',');\r\n            const stayRoomIds = json.linkedRooms.filter((r: any) => selectedRoomIds.includes(r.roomId)).map((r: any) => r.stayRoomId);\r\n            setSelectedStayRoomIds(stayRoomIds.length > 0 ? stayRoomIds : json.linkedRooms.map((r: any) => r.stayRoomId));\r\n          } else {\r\n            setSelectedStayRoomIds(json.linkedRooms.map((r: any) => r.stayRoomId));\r\n          }"
);

content = content.replace(
  "// By default, select all linked rooms\n          setSelectedStayRoomIds(json.linkedRooms.map((r: any) => r.stayRoomId));",
  "// By default, select all linked rooms or use selectedRooms param\n          if (selectedRoomsParam) {\n            const selectedRoomIds = selectedRoomsParam.split(',');\n            const stayRoomIds = json.linkedRooms.filter((r: any) => selectedRoomIds.includes(r.roomId)).map((r: any) => r.stayRoomId);\n            setSelectedStayRoomIds(stayRoomIds.length > 0 ? stayRoomIds : json.linkedRooms.map((r: any) => r.stayRoomId));\n          } else {\n            setSelectedStayRoomIds(json.linkedRooms.map((r: any) => r.stayRoomId));\n          }"
);


fs.writeFileSync(path, content);
console.log('CheckoutSuite updated');
