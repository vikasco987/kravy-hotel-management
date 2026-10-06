const fs = require('fs');
const content = fs.readFileSync('C:/studio/kravy-hotel-management/src/app/dashboard/reservations/[id]/page.tsx', 'utf8');

let newContent = content.replace(
  'export default function ReservationDetails({ params }: { params: Promise<{ id: string }> }) {',
  'export function ReservationDetailsDrawer({ reservationId, onClose }: { reservationId: string, onClose: () => void }) {'
);
newContent = newContent.replace(
  'const { id } = React.use(params);',
  'const id = reservationId;'
);

newContent = newContent.replace(
  'return (',
  'return (\n    <>\n      <div className="fixed inset-0 bg-black/30 z-[100] backdrop-blur-sm transition-opacity" onClick={onClose}></div>\n      <div className="fixed top-0 right-0 h-full w-[650px] max-w-full bg-[#F4F6F9] z-[101] shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-in-out border-l border-gray-200">'
);

newContent = newContent.replace(
  'className="min-h-screen bg-[#F4F6F9] pb-20"',
  'className="min-h-screen pb-20"'
);

newContent = newContent.replace(
  '<button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 transition">',
  '<button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 transition">'
);

// Close the tags properly at the end
newContent = newContent.replace(
  /    <\/div>\s*?\n\s*?\);\s*?\n\s*?\}/,
  '    </div>\n      </div>\n    </>\n  );\n}'
);

fs.writeFileSync('C:/studio/kravy-hotel-management/src/app/dashboard/reservations/ReservationDetailsDrawer.tsx', newContent);
console.log('Created ReservationDetailsDrawer.tsx');
