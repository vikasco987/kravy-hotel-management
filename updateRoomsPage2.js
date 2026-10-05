const fs = require('fs');
const path = 'C:/studio/kravy-hotel-management/src/app/dashboard/rooms/page.tsx';
let content = fs.readFileSync(path, 'utf8');

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

content = content.replace('{selectedRoom && (\r\n        <GuestDetailsModal', editFloorModalJSX + '\n      {selectedRoom && (\r\n        <GuestDetailsModal');
content = content.replace('{selectedRoom && (\n        <GuestDetailsModal', editFloorModalJSX + '\n      {selectedRoom && (\n        <GuestDetailsModal');

fs.writeFileSync(path, content);
console.log('Added EditFloorModal successfully');
