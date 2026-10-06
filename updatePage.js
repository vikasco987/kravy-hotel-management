const fs = require('fs');
const path = 'C:/studio/kravy-hotel-management/src/app/dashboard/book/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add import
content = content.replace(
  'import ColumnSettingsModal from "./ColumnSettingsModal";',
  'import ColumnSettingsModal from "./ColumnSettingsModal";\nimport AvailableRoomSelection from "./AvailableRoomSelection";'
);

// Add the rendering branch
const branchJSX = `  const showSelection = !resIdParam && rooms.length === 0 && !isFetching && !roomsParam;

  if (showSelection) {
     return <AvailableRoomSelection onComplete={(ids) => router.push('/dashboard/book?rooms=' + ids.join(','))} />;
  }
`;

content = content.replace('  return (\n    <div className="bg-[#f0f4f8]', branchJSX + '  return (\n    <div className="bg-[#f0f4f8]');

// Change Choose / Add Rooms button destination
content = content.replace(
  /onClick=\{\(\) => router\.push\('\/dashboard'\)\}[\s\S]*?<CheckCircle size=\{14\} \/> Choose \/ Add Rooms/,
  `onClick={() => router.push('/dashboard/book')}
             className="bg-[#0e2a6d] text-white px-4 py-1.5 rounded-md text-sm font-bold shadow-sm flex items-center gap-2 hover:bg-[#091a42]"
           >
              <CheckCircle size={14} /> Choose / Add Rooms`
);

fs.writeFileSync(path, content);
console.log('page.tsx updated with AvailableRoomSelection');
