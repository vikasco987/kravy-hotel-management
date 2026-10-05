const fs = require('fs');
const path = 'C:/studio/kravy-hotel-management/src/app/components/RoomDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Insert import
content = content.replace(
  "import { AddRoomModal } from '@/components/hotel/AddRoomModal';",
  "import { AddRoomModal } from '@/components/hotel/AddRoomModal';\nimport { EditFloorModal } from '@/components/hotel/EditFloorModal';"
);

// Delete handleEditFloor
content = content.replace(/const handleEditFloor = async \(e: React\.FormEvent\) => \{[\s\S]*?^\s*\};\n/m, '');

// Find where isEditFloorOpen is rendered and replace it
const oldModalRegex = /\{\/\* Edit Floor Modal \*\/\}\s*\{isEditFloorOpen && \([\s\S]*?^\s*\)\}\n/m;

const newModal = `      {/* Edit Floor Modal */}
      <EditFloorModal
        isOpen={isEditFloorOpen}
        onClose={() => { setIsEditFloorOpen(false); setEditingFloor(null); }}
        floor={editingFloor}
        onSuccess={() => {
          fetch('/api/hotel/dashboard?t=' + Date.now(), { cache: 'no-store' })
            .then(res => res.json())
            .then(newData => setData(newData));
        }}
      />
`;

content = content.replace(oldModalRegex, newModal);

fs.writeFileSync(path, content);
console.log('RoomDashboard updated successfully');
