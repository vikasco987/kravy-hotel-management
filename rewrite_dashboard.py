with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

import re

# We will completely overwrite the return statement of RoomDashboard
new_return = """
  // Derived Data
  const totalRooms = data ? Object.values(data.rooms).reduce((a: any, b: any) => a + b, 0) : 0;
  
  if (!data) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-[#f3eee5] p-6 lg:p-10 font-sans pb-24">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
        <div>
          <h1 className="text-[22px] font-black text-gray-800 mb-1 tracking-tight">Room Status - Interactive Floor View</h1>
          <div className="text-sm font-medium text-gray-500">{totalRooms} rooms across your property</div>
        </div>
        <div className="flex flex-wrap gap-3">
          {selectedRooms.length > 0 && (
            <button 
              onClick={() => router.push('/dashboard/book')}
              className="px-5 py-2.5 bg-[#ea580c] text-white rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm hover:bg-[#c2410c] transition-colors"
            >
               Book Selected Rooms ({selectedRooms.length} Rooms)
            </button>
          )}
          <button onClick={() => setIsAddRoomOpen(true)} className="px-5 py-2.5 bg-[#064e3b] text-white rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm hover:opacity-90 transition-opacity">
            <Plus size={16} /> Add Room
          </button>
          <button onClick={() => setIsAddFloorOpen(true)} className="px-5 py-2.5 bg-[#1e3a8a] text-white rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm hover:opacity-90 transition-opacity">
            <Plus size={16} /> Add Floor
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* LEFT COMPONENT - FLOORS */}
        <div className="flex-1 space-y-6">
          {data.floors.map((floor) => (
            <FloorRow 
              key={floor.id} 
              floor={floor} 
              selectedRooms={selectedRooms} 
              handleToggleRoom={handleToggleRoom} 
            />
          ))}
        </div>

        {/* RIGHT COMPONENT - WIDGET */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-[#ebe4d8] p-8 rounded-2xl border border-[#dfd7c8] flex flex-col items-center shadow-sm sticky top-8">
            <div className="relative w-40 h-40 rounded-full border-[10px] border-white flex items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] mb-6 bg-white">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent border-l-transparent transform rotate-45"></div>
              <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-b-transparent border-r-transparent transform rotate-45 opacity-20"></div>
              <div className="text-center relative z-10">
                <div className="text-4xl font-black text-gray-800 leading-none mb-1">{totalRooms}</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-tight">Rooms<br/>Total</div>
              </div>
            </div>
            <div className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shadow-sm"></span>
              {data.occupancy}% Occupied
            </div>
          </div>
        </div>
      </div>

      {/* FILTER BAR AT BOTTOM */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#f3eee5]/95 backdrop-blur-md border-t border-[#e2d8c3] flex flex-wrap items-center gap-4 z-40 px-6 lg:px-10">
        <span className="font-bold text-sm text-gray-700">Filter:</span>
        <div className="flex flex-wrap gap-2">
          <FilterBadge label="All" count={totalRooms} color="bg-gray-900" isActive={filter === 'ALL'} onClick={() => setFilter('ALL')} />
          <FilterBadge label="Available" count={data.rooms.available||0} color="bg-[#064e3b]" isActive={filter === 'AVAILABLE'} onClick={() => setFilter('AVAILABLE')} />
          <FilterBadge label="Occupied" count={data.rooms.occupied||0} color="bg-[#1e3a8a]" isActive={filter === 'OCCUPIED'} onClick={() => setFilter('OCCUPIED')} />
          <FilterBadge label="Dirty" count={data.rooms.dirty||0} color="bg-[#991b1b]" isActive={filter === 'DIRTY'} onClick={() => setFilter('DIRTY')} />
          <FilterBadge label="Maintenance" count={data.rooms.maintenance||0} color="bg-[#ea580c]" isActive={filter === 'MAINTENANCE'} onClick={() => setFilter('MAINTENANCE')} />
          <FilterBadge label="Blocked" count={data.rooms.blocked||0} color="bg-[#334155]" isActive={filter === 'BLOCKED'} onClick={() => setFilter('BLOCKED')} />
        </div>
        <div className="ml-auto text-xs font-medium text-gray-500 flex items-center gap-1.5">
           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
           Click status to filter floor view
        </div>
      </div>

      {/* Add Floor Modal */}
"""

# Now write the missing components that go outside RoomDashboard
new_components = """
function FilterBadge({ label, count, color, isActive, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
        isActive ? 'ring-2 ring-offset-1 ring-gray-400' : 'hover:opacity-80'
      } ${color} text-white`}
    >
      <div className="w-1.5 h-1.5 bg-white/80 rounded-sm"></div>
      {label}
      <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{count}</span>
    </button>
  );
}

function FloorRow({ floor, handleToggleRoom, selectedRooms }: any) {
  return (
    <div className="flex gap-4 items-center">
      <div className="w-8 shrink-0 flex items-center justify-center">
        <span className="transform -rotate-90 text-[11px] font-black tracking-widest text-gray-500 whitespace-nowrap">
          {floor.name}
        </span>
      </div>
      <div className="flex-1 flex flex-wrap gap-2">
        {floor.rooms.map((room: any) => {
          const isSelected = selectedRooms.includes(room.id);
          const statusLower = room.status.toLowerCase();
          const statusColors: any = {
            available: 'bg-[#064e3b] text-white',
            occupied: 'bg-[#1e3a8a] text-white',
            dirty: 'bg-[#991b1b] text-white',
            maintenance: 'bg-[#ea580c] text-white',
            blocked: 'bg-[#334155] text-white',
            cleaning: 'bg-[#ca8a04] text-white'
          };
          const colorClass = statusColors[statusLower] || 'bg-gray-200 text-gray-700';

          return (
            <div 
              key={room.id}
              onClick={() => handleToggleRoom(room.id)}
              className={`relative w-12 h-10 flex items-center justify-center rounded-md cursor-pointer transition-all ${colorClass} ${
                isSelected ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-[#f3eee5] z-10' : 'hover:opacity-90'
              }`}
            >
              {isSelected && (
                <div className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white rounded p-0.5 shadow-sm z-20">
                  <Check size={10} strokeWidth={4} />
                </div>
              )}
              <div className="text-sm font-bold tracking-tight">{room.number}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RoomDashboard() {
"""

# Let's replace the whole `return (` inside `RoomDashboard` up to `{/* Add Floor Modal */}`
start_tag = '  if (!data) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;'
start_idx = content.find(start_tag)

end_pattern = re.compile(r'      \{\/\* Add Floor Modal \*\/\}')
end_match = end_pattern.search(content)

if start_idx != -1 and end_match:
    end_idx = end_match.start()
    
    # We also need to add FilterBadge and replace FloorRow. Let's just do it by replacing the export statement.
    # First we slice content to insert new_return
    modified_body = content[:start_idx] + new_return + content[end_idx:]
    
    # Then we replace FloorRow definition and add FilterBadge
    # We can just remove the old FloorRow and replace `export default function`
    
    # Find where old FloorRow starts and ends
    floor_row_pattern = re.compile(r'function FloorRow\(\{.*?\}\s*(?:\n.*)*?\n\}\n', re.MULTILINE)
    modified_body = floor_row_pattern.sub('', modified_body)
    
    # Also remove Legend and MiniStat as we don't need them
    legend_pattern = re.compile(r'function Legend\(\{.*?\}\s*(?:\n.*)*?\n\}\n', re.MULTILINE)
    modified_body = legend_pattern.sub('', modified_body)
    ministat_pattern = re.compile(r'function MiniStat\(\{.*?\}\s*(?:\n.*)*?\n\}\n', re.MULTILINE)
    modified_body = ministat_pattern.sub('', modified_body)
    
    modified_body = modified_body.replace('export default function RoomDashboard() {', new_components)
    
    with open('src/app/components/RoomDashboard.tsx', 'w') as f:
        f.write(modified_body)
    print("Successfully replaced JSX")
else:
    print(f"Error finding indices: start_idx={start_idx}, foundEnd={bool(end_match)}")
