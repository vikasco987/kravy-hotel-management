const fs = require('fs');
const path = 'C:/studio/kravy-hotel-management/src/app/dashboard/rooms/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add import
content = content.replace(
  "import { AddRoomModal } from \"@/components/hotel/AddRoomModal\";",
  "import { AddRoomModal } from \"@/components/hotel/AddRoomModal\";\nimport { EditFloorModal } from \"@/components/hotel/EditFloorModal\";"
);

// 2. Add state variables
content = content.replace(
  "const [isAddFloorOpen, setIsAddFloorOpen] = useState(false);",
  "const [isAddFloorOpen, setIsAddFloorOpen] = useState(false);\n  const [isEditFloorOpen, setIsEditFloorOpen] = useState(false);\n  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);"
);

// 3. Pass onEditFloor to FloorRow
const floorRowRegex = /<FloorRow\s+key=\{floor\.id\}\s+floor=\{filteredFloor\}\s+floorIndex=\{index\}\s+selectedRooms=\{\[\]\}\s+focusedRoomId=\{selectedRoom\?\.id\}\s+highlightedRoomId=\{null\}\s+onRoomClick=\{\(roomId:\s*string\)\s*=>\s*\{\s*const room\s*=\s*floor\.rooms\.find\(\(r:\s*any\)\s*=>\s*r\.id === roomId\);\s*if \(room\) setSelectedRoom\(room\);\s*\}\}\s*\/>/;

const floorRowReplacement = `<FloorRow
                  key={floor.id}
                  floor={filteredFloor}
                  floorIndex={index}
                  selectedRooms={[]}
                  focusedRoomId={selectedRoom?.id}
                  highlightedRoomId={null}
                  onRoomClick={(roomId: string) => {
                    const room = floor.rooms.find((r: any) => r.id === roomId);
                    if (room) setSelectedRoom(room);
                  }}
                  onEditFloor={(f: any) => {
                    setEditingFloor(f);
                    setIsEditFloorOpen(true);
                  }}
                />`;
content = content.replace(floorRowRegex, floorRowReplacement);

// 4. Render EditFloorModal
const returnEndRegex = /\{\/\* END MAIN CONTENT \*\/\}\s*<\/div>\s*\)\s*;\s*\}\s*$/;
const addRoomModalRegex = /(<AddRoomModal[\s\S]*?\/>\s*)(\n\s*\{\/\* END MAIN CONTENT)/;

const editFloorModalJSX = `
      {/* Edit Floor Modal */}
      <EditFloorModal
        isOpen={isEditFloorOpen}
        onClose={() => { setIsEditFloorOpen(false); setEditingFloor(null); }}
        floor={editingFloor}
        onSuccess={() => {
          fetch('/api/hotel/dashboard')
            .then(res => res.json())
            .then(d => setData(d));
        }}
      />
`;

content = content.replace(addRoomModalRegex, `$1${editFloorModalJSX}$2`);

fs.writeFileSync(path, content);
console.log('page.tsx updated successfully');
