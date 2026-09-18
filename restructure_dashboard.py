import re

with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

# I need to completely replace the returned UI of `RoomDashboard` and its subcomponents.
# First, let's find where the `return (` of RoomDashboard starts.

start_marker = "  return (\n    <>\n      <div className=\"dash-page\">"
if start_marker not in content:
    print("Could not find start marker.")
    exit(1)

start_idx = content.find(start_marker)
# Find the end of RoomDashboard return (where the modals start)
end_marker = "      {/* Add Floor Modal */}"
if end_marker not in content:
    print("Could not find end marker.")
    exit(1)

end_idx = content.find(end_marker)

# Find the end of the file to replace subcomponents too
subcomponents_start = content.find("/* =========================")
if subcomponents_start != -1:
    end_of_file = len(content)
else:
    end_of_file = end_idx

new_ui = """  return (
    <>
      <div className="dash-page">
        <div className="dash-page-content">
          <div className="dash-grid-2">
            <div>
              <div className="section-label">Quick actions</div>
              <div className="actions">
                <div className="action-card" style={{background: 'var(--card-moss)'}} onClick={() => router.push('/dashboard/book')}>
                  <div className="action-icon-wrap">
                    <div className="action-icon" style={{color: 'var(--c-moss)'}}>
                      <Building2 size={24} />
                    </div>
                  </div>
                  <div>
                    <div className="action-title">Guest check-in</div>
                  </div>
                </div>
                <div className="action-card" style={{background: 'var(--card-teal)'}}>
                  <div className="action-icon-wrap">
                    <div className="action-icon" style={{color: 'var(--c-teal)'}}>
                      <Clock3 size={24} />
                    </div>
                  </div>
                  <div>
                    <div className="action-title">Guest check-out</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="compact-dashboard">
            <div className="main-area">
              <div className="dash-header-compact">
                <div className="filters-row">
                  <div className="filter-pill active">ALL {data.rooms.total}</div>
                  <div className="filter-pill"><span className="filter-dot bg-available"></span> {data.rooms.available || 0}</div>
                  <div className="filter-pill"><span className="filter-dot bg-occupied"></span> {data.rooms.occupied || 0}</div>
                  <div className="filter-pill"><span className="filter-dot bg-dirty"></span> {data.rooms.dirty || 0}</div>
                  <div className="filter-pill"><span className="filter-dot bg-maintenance"></span> {data.rooms.maintenance || 0}</div>
                  <div className="filter-pill"><span className="filter-dot bg-blocked"></span> {data.rooms.blocked || 0}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setIsAddRoomOpen(true)} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800"><Plus size={14}/> Room</button>
                  <button onClick={() => setIsAddFloorOpen(true)} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800"><Plus size={14}/> Floor</button>
                </div>
              </div>

              <div className="floors-container">
                {data.floors.map((floor) => (
                  <FloorRow 
                    key={floor.id} 
                    floor={floor} 
                    focusedRoomId={focusedRoomId} 
                    setFocusedRoomId={setFocusedRoomId}
                    focusedFloorId={focusedFloorId}
                    setFocusedFloorId={setFocusedFloorId}
                  />
                ))}
              </div>
            </div>

            <aside className="right-area">
              <div className="widget">
                <div className="widget-title">Occupancy</div>
                <div className="occ-stat">
                  <div className="occ-percent">{data.occupancy}%</div>
                  <div className="text-xs text-slate-400">Occupied</div>
                </div>
                <div className="mini-stats-grid">
                  <div className="stat-item"><span className="filter-dot bg-available"></span> {data.rooms.available || 0}</div>
                  <div className="stat-item"><span className="filter-dot bg-occupied"></span> {data.rooms.occupied || 0}</div>
                  <div className="stat-item"><span className="filter-dot bg-dirty"></span> {data.rooms.dirty || 0}</div>
                  <div className="stat-item"><span className="filter-dot bg-blocked"></span> {data.rooms.blocked || 0}</div>
                </div>
              </div>

              <div className="widget">
                <div className="widget-title">Quick</div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-bold text-slate-600 bg-slate-50 p-2 rounded-lg">
                    <span>🧹 {data.rooms.dirty || 0} Dirty</span>
                    <span className="text-indigo-500 cursor-pointer">Assign</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-600 bg-slate-50 p-2 rounded-lg">
                    <span>🔧 {data.rooms.maintenance || 0} Maintenance</span>
                    <span className="text-indigo-500 cursor-pointer">View</span>
                  </div>
                </div>
              </div>
            </aside>
            
            {focusedRoomId && (
              <RoomDetailDrawer 
                roomId={focusedRoomId} 
                onClose={() => setFocusedRoomId(null)} 
                floors={data.floors}
              />
            )}
            
          </div>
        </div>
      </div>

"""

subcomponents = """
/* =========================
   COMPONENTS
========================= */

function FloorRow({ floor, focusedRoomId, setFocusedRoomId, focusedFloorId, setFocusedFloorId }: any) {
  const isDimmed = focusedFloorId && focusedFloorId !== floor.id;
  
  return (
    <div className={`floor-row ${isDimmed ? 'dimmed' : ''}`}>
      <div className="floor-label-box" onClick={() => setFocusedFloorId(isDimmed ? null : floor.id)}>
        {String(floor.name).substring(0, 2).toUpperCase()}
      </div>
      <div className="floor-rooms">
        {floor.rooms.map((room: any) => (
          <RoomTile 
            key={room.id} 
            room={room} 
            isSelected={focusedRoomId === room.id} 
            onClick={() => setFocusedRoomId(room.id)}
          />
        ))}
      </div>
    </div>
  );
}

function RoomTile({ room, isSelected, onClick }: any) {
  const statusLower = room.status.toLowerCase();
  return (
    <div 
      className={`room-tile bg-${statusLower} ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      {room.number || room.roomNumber}
    </div>
  );
}

function RoomDetailDrawer({ roomId, onClose, floors }: any) {
  let room = null;
  let floorName = '';
  for (const f of floors) {
    const r = f.rooms.find((rm: any) => rm.id === roomId);
    if (r) { room = r; floorName = f.name; break; }
  }
  
  if (!room) return null;
  const statusLower = room.status.toLowerCase();
  
  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/hotel/rooms/${room.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed');
      if ((window as any).refreshDashboard) (window as any).refreshDashboard();
      onClose();
    } catch (e) {
      alert('Failed to update status');
    }
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="room-drawer open">
        <div className="drawer-header">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Room {room.number || room.roomNumber}</h2>
            <div className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-${statusLower}`}>
              {statusLabels[room.status] || room.status}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition"><X size={20}/></button>
        </div>
        <div className="drawer-body">
          <div className="text-sm font-bold text-slate-600 mb-6">{room.type || "Deluxe Room"} · {floorName}</div>
          
          {room.status === 'OCCUPIED' && (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6">
              <div className="text-xs text-slate-400 font-bold uppercase mb-1">Guest</div>
              <div className="text-base font-bold text-slate-700">{room.guest || 'Rahul Sharma'}</div>
              <div className="text-xs text-slate-500 mt-2">Check-out: 11:00 AM</div>
            </div>
          )}
          
          <div className="space-y-2">
             {(room.status === 'AVAILABLE' || room.status === 'CLEANING') && (
               <button className="action-btn primary" onClick={() => window.location.href='/dashboard/book'}>Check-in</button>
             )}
             {room.status === 'OCCUPIED' && (
               <>
                 <button className="action-btn primary">Checkout</button>
                 <button className="action-btn secondary">View Guest</button>
               </>
             )}
             
             <div className="my-4 pt-4 border-t border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-wider">Housekeeping</div>
                {room.status !== 'AVAILABLE' && room.status !== 'OCCUPIED' && (
                  <button className="action-btn secondary" onClick={() => handleStatusUpdate('AVAILABLE')}>Set Clean</button>
                )}
                {room.status !== 'DIRTY' && (
                  <button className="action-btn secondary text-red-600" onClick={() => handleStatusUpdate('DIRTY')}>Set Dirty</button>
                )}
                {room.status !== 'MAINTENANCE' && (
                  <button className="action-btn secondary text-orange-600" onClick={() => handleStatusUpdate('MAINTENANCE')}>Maintenance</button>
                )}
             </div>
          </div>
        </div>
      </div>
    </>
  );
}
"""

content = content[:start_idx] + new_ui + "      {/* Add Floor Modal */}\n" + content[end_idx:subcomponents_start if subcomponents_start != -1 else end_of_file] + subcomponents

# Make sure state variables are present
if "const [focusedRoomId, setFocusedRoomId]" not in content:
    content = content.replace("const [quickStatusRoomId, setQuickStatusRoomId] = useState<string>('');", "const [quickStatusRoomId, setQuickStatusRoomId] = useState<string>('');\n  const [focusedRoomId, setFocusedRoomId] = useState<string | null>(null);\n  const [focusedFloorId, setFocusedFloorId] = useState<string | null>(null);")

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)
print("Dashboard restructured")
