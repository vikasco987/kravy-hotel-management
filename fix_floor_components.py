import re

with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

new_components = """function FilterBadge({ label, count, color, dot, isActive, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ${
        isActive ? 'ring-2 ring-offset-2 ring-gray-200 opacity-100' : 'opacity-80 hover:opacity-100'
      } ${color}`}
    >
      {dot && <div className={`w-2 h-2 rounded-full ${dot}`}></div>}
      {label}
      <span className="ml-1 bg-white/50 px-2 py-0.5 rounded-full text-[11px] text-gray-700">{count}</span>
    </button>
  );
}

function FloorRow({ floor, handleToggleRoom, selectedRooms }: any) {
  const availableCount = floor.rooms.filter((r: any) => r.status === 'AVAILABLE').length;

  return (
    <div className="flex bg-white rounded-2xl border border-gray-100 p-3 items-center shadow-sm">
      <div className="flex items-center w-[160px] shrink-0 border-r border-gray-100 mr-4 pr-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl mr-3 bg-gradient-to-br from-emerald-100 to-green-50 text-green-900">
          {floor.name.replace('Floor ', '0').replace('Ground', '00')}
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-sm text-gray-800">{floor.name}</span>
          <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full mt-1 w-fit">{floor.rooms.length} rooms</span>
        </div>
      </div>

      <div className="flex-1 flex flex-wrap gap-3">
        {floor.rooms.map((room: any) => {
          const isSelected = selectedRooms.includes(room.id);
          const statusLower = room.status.toLowerCase();
          
          let colorClass = 'bg-gray-50 text-gray-700 border-gray-200';
          let dotColor = 'bg-gray-400';
          
          if (statusLower === 'available') {
            colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-300';
            dotColor = 'bg-emerald-500';
          } else if (statusLower === 'occupied') {
            colorClass = 'bg-blue-50 text-blue-800 border-transparent';
            dotColor = 'bg-blue-500';
          } else if (statusLower === 'dirty') {
            colorClass = 'bg-red-50 text-red-800 border-transparent';
            dotColor = 'bg-red-500';
          } else if (statusLower === 'maintenance') {
            colorClass = 'bg-orange-50 text-orange-800 border-transparent';
            dotColor = 'bg-orange-500';
          } else if (statusLower === 'blocked') {
            colorClass = 'bg-slate-100 text-slate-800 border-transparent';
            dotColor = 'bg-slate-500';
          } else if (statusLower === 'cleaning') {
             colorClass = 'bg-yellow-50 text-yellow-800 border-transparent';
             dotColor = 'bg-yellow-500';
          }

          return (
            <div 
              key={room.id}
              onClick={() => handleToggleRoom(room.id)}
              className={`relative px-4 py-2 flex items-center gap-2 rounded-xl border cursor-pointer font-bold text-sm transition-all ${colorClass} ${
                isSelected ? 'ring-2 ring-indigo-500 shadow-md scale-105 z-10' : 'hover:scale-[1.02]'
              }`}
            >
              {isSelected && (
                <div className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white rounded-full p-0.5 shadow-sm z-20">
                  <Check size={10} strokeWidth={4} />
                </div>
              )}
              <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></div>
              {room.number}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-100 shrink-0">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold border border-emerald-100">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
           {availableCount} Available
        </div>
        <ChevronRight size={18} className="text-gray-400" />
      </div>
    </div>
  );
}
"""

# Replace the existing FilterBadge and FloorRow.
pattern1 = re.compile(r'function FilterBadge\(\{.*?\}\s*(?:\n.*)*?\n\}\n', re.MULTILINE)
pattern2 = re.compile(r'function FloorRow\(\{.*?\}\s*(?:\n.*)*?\n\}\n', re.MULTILINE)

# Remove the old functions entirely
content = pattern1.sub('', content)
content = pattern2.sub('', content)

# Inject the new functions right before `export default function RoomDashboard()`
content = content.replace('export default function RoomDashboard() {', new_components + '\nexport default function RoomDashboard() {')

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)
