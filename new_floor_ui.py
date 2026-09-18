import re

with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

# We need to find the start of the beige section
start_str = '<div className="bg-[#f3eee5] p-6 lg:p-10 font-sans pb-24 border-t-2 border-[#e2d8c3] mt-8">'
end_str = '{/* Add Floor Modal */}'

start_idx = content.find(start_str)
end_idx = content.find(end_str)

new_ui = """<div className="bg-white p-6 mt-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-3 flex-wrap">
             <FilterBadge label="All" count={totalRooms} color="bg-indigo-500 text-white" isActive={filter === 'ALL'} onClick={() => setFilter('ALL')} />
             <FilterBadge label="Available" count={data.rooms.available||0} color="bg-emerald-50 text-emerald-800 border border-emerald-100" dot="bg-emerald-500" isActive={filter === 'AVAILABLE'} onClick={() => setFilter('AVAILABLE')} />
             <FilterBadge label="Occupied" count={data.rooms.occupied||0} color="bg-blue-50 text-blue-800 border border-blue-100" dot="bg-blue-500" isActive={filter === 'OCCUPIED'} onClick={() => setFilter('OCCUPIED')} />
             <FilterBadge label="Dirty" count={data.rooms.dirty||0} color="bg-red-50 text-red-800 border border-red-100" dot="bg-red-500" isActive={filter === 'DIRTY'} onClick={() => setFilter('DIRTY')} />
             <FilterBadge label="Maintenance" count={data.rooms.maintenance||0} color="bg-orange-50 text-orange-800 border border-orange-100" dot="bg-orange-500" isActive={filter === 'MAINTENANCE'} onClick={() => setFilter('MAINTENANCE')} />
             <FilterBadge label="Blocked" count={data.rooms.blocked||0} color="bg-gray-100 text-gray-800 border border-gray-200" dot="bg-gray-500" isActive={filter === 'BLOCKED'} onClick={() => setFilter('BLOCKED')} />
          </div>
          <div className="flex gap-3">
            {selectedRooms.length > 0 && (
              <button 
                onClick={() => router.push('/dashboard/book?rooms=' + selectedRooms.join(','))}
                className="px-5 py-2.5 bg-[#ea580c] text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm hover:bg-[#c2410c] transition-colors"
              >
                 Book Selected ({selectedRooms.length})
              </button>
            )}
            <button onClick={() => setIsAddRoomOpen(true)} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-50">
              <Plus size={16} /> Add Room
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {data.floors.map((floor) => {
            const visibleRooms = filter === 'ALL' ? floor.rooms : floor.rooms.filter((r: any) => r.status === filter);
            if (visibleRooms.length === 0) return null;
            return (
              <FloorRow 
                key={floor.id} 
                floor={{...floor, rooms: visibleRooms}} 
                selectedRooms={selectedRooms} 
                handleToggleRoom={handleToggleRoom} 
              />
            );
          })}
        </div>
      </div>
      """

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + new_ui + content[end_idx:]
    with open('src/app/components/RoomDashboard.tsx', 'w') as f:
        f.write(content)
else:
    print("Could not find boundaries")
