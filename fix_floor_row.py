with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

floor_row_def = """
function FloorRow({ floor, handleToggleRoom, selectedRooms }: any) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-3">{floor.name}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {floor.rooms.map((room: any) => {
          const isSelected = selectedRooms.includes(room.id);
          const statusLower = room.status.toLowerCase();
          const statusColors: any = {
            available: 'bg-emerald-50 border-emerald-200 text-emerald-700',
            occupied: 'bg-blue-50 border-blue-200 text-blue-700',
            dirty: 'bg-red-50 border-red-200 text-red-700',
            maintenance: 'bg-orange-50 border-orange-200 text-orange-700'
          };
          const colorClass = statusColors[statusLower] || 'bg-gray-50 border-gray-200 text-gray-700';

          return (
            <div 
              key={room.id}
              onClick={() => handleToggleRoom(room.id)}
              className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                isSelected ? 'border-gray-900 shadow-md transform scale-[1.02]' : `border-transparent hover:border-gray-300 ${colorClass}`
              }`}
            >
              {isSelected && (
                <div className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full p-1 shadow-sm">
                  <Check size={14} strokeWidth={3} />
                </div>
              )}
              <div className="text-sm font-bold opacity-70 mb-1 uppercase tracking-wider">{room.type}</div>
              <div className="text-2xl font-black mb-1">{room.number}</div>
              <div className="text-sm font-bold opacity-90">{room.status}</div>
              {room.guest && (
                <div className="text-xs font-semibold mt-2 pt-2 border-t border-black/10 truncate">
                  {room.guest}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RoomDashboard() {
"""

content = content.replace("export default function RoomDashboard() {", floor_row_def)

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)
