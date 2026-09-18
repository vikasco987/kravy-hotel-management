import re

with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

# 1. Update lucide-react imports
imports_pattern = r'import \{[^}]+\} from "lucide-react";'
new_imports = """import {
  BedDouble,
  Building2,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  Droplets,
  Plus,
  Sparkles,
  Wrench,
  X,
  ChevronRight,
  DoorOpen,
} from "lucide-react";"""

content = re.sub(imports_pattern, new_imports, content)

# 2. Add statusLabels dictionary before export default
status_labels = """
const statusLabels: Record<string, string> = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  DIRTY: "Dirty",
  MAINTENANCE: "Maintenance",
  BLOCKED: "Blocked",
  CLEANING: "Cleaning",
  INSPECTED: "Inspected",
  RESERVED: "Reserved",
};
"""
# insert right before export default RoomDashboard
content = content.replace("export default function RoomDashboard() {", status_labels + "\nexport default function RoomDashboard() {")


# 3. Replace the return UI
start_marker = "  return (\n    <>\n      <div className=\"dash-page\">"
end_marker = "      {/* Add Floor Modal */}"

if start_marker in content and end_marker in content:
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker)
    
    new_ui = """  return (
    <>
    <main className="page">
      {/* HEADER */}
      <header className="topbar">
        <div className="title-area">
          <div className="title-icon">
            <Building2 size={25} />
          </div>
          <div>
            <div className="title-row">
              <h1>Room status</h1>
              <span className="live-badge">LIVE</span>
            </div>
            <p>Interactive floor view · {data.rooms.total} rooms</p>
          </div>
        </div>

        <div className="header-actions">
          <button className="secondary-button" onClick={() => setIsAddRoomOpen(true)}>
            <Plus size={17} /> Add room
          </button>
          <button className="primary-button" onClick={() => setIsAddFloorOpen(true)}>
            <Plus size={17} /> Add floor
          </button>
        </div>
      </header>

      {/* PAGE BODY */}
      <div className="page-body">
        {/* MAIN */}
        <section className="rooms-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">PROPERTY LAYOUT</span>
              <h2>Floors & Rooms</h2>
              <p>All floors and rooms are visible at once</p>
            </div>
            <div className="live-indicator">
              <span /> Live
            </div>
          </div>

          {/* FLOOR LIST */}
          <div className="floor-list">
            {data.floors.length === 0 ? (
               <div className="p-8 text-center text-slate-400">No floors added yet.</div>
            ) : (
               data.floors.map((floor) => (
                 <FloorRow key={floor.id} floor={floor} handleToggleRoom={handleToggleRoom} selectedRooms={selectedRooms} />
               ))
            )}
          </div>

          {/* LEGEND */}
          <div className="legend">
            <Legend status="available" label="Available" count={data.rooms.available || 0} />
            <Legend status="occupied" label="Occupied" count={data.rooms.occupied || 0} />
            <Legend status="dirty" label="Dirty" count={data.rooms.dirty || 0} />
            <Legend status="maintenance" label="Maintenance" count={data.rooms.maintenance || 0} />
            <Legend status="blocked" label="Blocked" count={data.rooms.blocked || 0} />
          </div>
        </section>

        {/* RIGHT PANEL */}
        <aside className="right-column">
          <div className="occupancy-card">
            <div className="occupancy-header">
              <div>
                <h3>Property occupancy</h3>
                <p>Live room utilization</p>
              </div>
              <Sparkles size={21} />
            </div>

            <div className="occupancy-circle">
              <div className="circle-inner" style={{background: `conic-gradient(#35d39c 0 ${data.occupancy}%, #2d394f ${data.occupancy}% 100%)`}}>
                <div className="circle-inner" style={{width: 158, height: 158}}>
                  <strong>{data.occupancy}%</strong>
                  <span>OCCUPIED</span>
                </div>
              </div>
            </div>

            <div className="occupancy-stats">
              <MiniStat label="Available" value={data.rooms.available || 0} className="available" />
              <MiniStat label="Occupied" value={data.rooms.occupied || 0} className="occupied" />
              <MiniStat label="Dirty" value={data.rooms.dirty || 0} className="dirty" />
              <MiniStat label="Blocked" value={data.rooms.blocked || 0} className="blocked" />
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="quick-actions">
            <div className="quick-title">
              <div className="quick-icon">
                <Wrench size={19} />
              </div>
              <div>
                <h3>Quick room actions</h3>
                <p>Update housekeeping status</p>
              </div>
            </div>

            <select
              className="room-action w-full mt-4 appearance-none outline-none font-bold"
              value={quickStatusRoomId}
              onChange={(e) => setQuickStatusRoomId(e.target.value)}
            >
              <option value="">Select room</option>
              {data.floors.flatMap(f => f.rooms).map((room) => (
                <option key={room.id} value={room.id}>
                  Room {room.number || (room as any).roomNumber} · {statusLabels[room.status]}
                </option>
              ))}
            </select>
            
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                disabled={isStatusChanging || !quickStatusRoomId}
                onClick={async () => {
                   if(!quickStatusRoomId) return alert('Please select a room first');
                   setIsStatusChanging(true);
                   try {
                     const res = await fetch(`/api/hotel/rooms/${quickStatusRoomId}/status`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({status: 'AVAILABLE'}) });
                     if (!res.ok) throw new Error('Failed');
                     if ((window as any).refreshDashboard) (window as any).refreshDashboard();
                     setQuickStatusRoomId('');
                   } catch (e) {
                     alert('Failed to update status');
                   } finally {
                     setIsStatusChanging(false);
                   }
                }}
                className="flex h-10 items-center justify-center rounded-xl bg-[#16be7c] text-xs font-bold text-white transition hover:bg-[#12ad72] disabled:opacity-50"
              >
                Set clean
              </button>
              <button
                type="button"
                disabled={isStatusChanging || !quickStatusRoomId}
                onClick={async () => {
                   if(!quickStatusRoomId) return alert('Please select a room first');
                   setIsStatusChanging(true);
                   try {
                     const res = await fetch(`/api/hotel/rooms/${quickStatusRoomId}/status`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({status: 'DIRTY'}) });
                     if (!res.ok) throw new Error('Failed');
                     if ((window as any).refreshDashboard) (window as any).refreshDashboard();
                     setQuickStatusRoomId('');
                   } catch (e) {
                     alert('Failed to update status');
                   } finally {
                     setIsStatusChanging(false);
                   }
                }}
                className="flex h-10 items-center justify-center rounded-xl bg-red-50 text-xs font-bold text-red-600 ring-1 ring-red-100 transition hover:bg-red-100 disabled:opacity-50"
              >
                Set dirty
              </button>
            </div>
            
            {/* DEPARTING TODAY */}
            <div className="mt-6 border-t border-slate-100 pt-4">
               <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-2">
                 <Clock3 size={14} className="text-orange-500" />
                 Departing Today ({data.vacatingRooms.length})
               </h4>
               <div className="space-y-2 max-h-40 overflow-y-auto">
                 {data.vacatingRooms.length === 0 ? (
                    <div className="text-[11px] text-slate-400 italic">No departures today</div>
                 ) : (
                    data.vacatingRooms.map(vr => (
                      <div key={vr.stayId} className="flex justify-between items-center text-[11px] bg-slate-50 p-2 rounded border border-slate-100">
                        <div><span className="font-bold text-slate-700">Room {vr.roomNumber}</span> <span className="text-slate-500">({vr.guestName})</span></div>
                        <div className="text-slate-500">{vr.checkoutDate}</div>
                      </div>
                    ))
                 )}
               </div>
            </div>

          </div>
        </aside>
      </div>
    </main>

"""
    content = content[:start_idx] + new_ui + content[end_idx:]

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)

