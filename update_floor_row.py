import re

with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

new_floor_row = """function FloorRow({ floor, handleToggleRoom, selectedRooms }: any) {
  return (
    <div className="flex gap-4 mb-6">
      <div className="w-10 shrink-0 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl">
        <span className="transform -rotate-90 text-[11px] font-black tracking-widest text-slate-500 whitespace-nowrap">
          {floor.name.toUpperCase()}
        </span>
      </div>
      <div className="flex-1 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
        {floor.rooms.map((room: any) => {
          const isSelected = selectedRooms.includes(room.id);
          const statusLower = room.status.toLowerCase();
          const statusColors: any = {
            available: 'bg-emerald-100 border-emerald-200 text-emerald-900',
            occupied: 'bg-blue-200 border-blue-300 text-blue-900',
            dirty: 'bg-red-200 border-red-300 text-red-900',
            maintenance: 'bg-orange-200 border-orange-300 text-orange-900',
            cleaning: 'bg-yellow-100 border-yellow-300 text-yellow-900'
          };
          const colorClass = statusColors[statusLower] || 'bg-slate-100 border-slate-200 text-slate-700';

          return (
            <div 
              key={room.id}
              onClick={() => handleToggleRoom(room.id)}
              className={`relative h-14 flex items-center justify-center rounded-lg border-2 cursor-pointer transition-all ${colorClass} ${
                isSelected ? 'border-slate-800 shadow-md transform scale-105' : 'hover:brightness-95'
              }`}
            >
              {isSelected && (
                <div className="absolute -top-1.5 -right-1.5 bg-slate-800 text-white rounded-full p-0.5 shadow-sm">
                  <Check size={12} strokeWidth={4} />
                </div>
              )}
              <div className="text-lg font-black">{room.number}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}"""

# Find where FloorRow is and replace it
# It starts at `function FloorRow({` and ends at the next `function ` or `export `
pattern = re.compile(r'function FloorRow\(\{.*?\}\s*(?:\n.*)*?\n\}\n', re.MULTILINE)
content = pattern.sub(new_floor_row + '\n', content, count=1)

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)
