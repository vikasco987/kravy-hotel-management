import re

with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

# Replace the entire file with a cleanly structured version that fulfills ALL constraints.
# I will preserve imports, types, initial fetch logic, and add the search/filter logic.

import_end = content.find("const STATUS_COLORS")
imports_and_types = content[:import_end]

# Prepare the new UI components and logic
new_ui_components = """const STATUS_COLORS: Record<string, { bg: string, text: string, border: string, dot: string, label: string }> = {
  AVAILABLE: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'Available' },
  OCCUPIED: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200', dot: 'bg-indigo-500', label: 'Occupied' },
  DIRTY: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', dot: 'bg-rose-500', label: 'Dirty' },
  MAINTENANCE: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500', label: 'Maintenance' },
  BLOCKED: { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200', dot: 'bg-slate-500', label: 'Blocked' },
  RESERVED: { bg: 'bg-violet-50', text: 'text-violet-800', border: 'border-violet-200', dot: 'bg-violet-500', label: 'Reserved' },
  CLEANING: { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200', dot: 'bg-yellow-500', label: 'Cleaning' },
  INSPECTED: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200', dot: 'bg-teal-500', label: 'Inspected' },
};

function FilterBadge({ statusKey, count, isActive, onClick }: { statusKey: string, count: number, isActive: boolean, onClick: () => void }) {
  if (statusKey === 'ALL') {
    return (
      <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isActive ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
        ALL <span className={`px-1.5 py-0.5 rounded text-[10px] ${isActive ? 'bg-white/30' : 'bg-white'}`}>{count}</span>
      </button>
    );
  }
  const config = STATUS_COLORS[statusKey] || STATUS_COLORS.AVAILABLE;
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${isActive ? 'ring-2 ring-offset-1 ring-gray-300 opacity-100 shadow-sm' : 'opacity-80 hover:opacity-100'} ${config.bg} ${config.text} ${config.border}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></div>
      {config.label} <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/60">{count}</span>
    </button>
  );
}

function FloorRow({ floor, floorIndex, selectedRooms, focusedRoomId, highlightedRoomId, onRoomClick }: any) {
  const availableCount = floor.rooms.filter((r: any) => r.status === 'AVAILABLE').length;
  
  // Enforce unique F1, F2 logic using array index
  const floorNum = floorIndex + 1;
  const badgeText = `F${floorNum}`;
  const floorName = `Floor ${floorNum.toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col sm:flex-row bg-white rounded-xl border border-gray-100 p-2 items-center shadow-sm w-full mb-3 gap-2 sm:gap-4">
      <div className="flex items-center w-full sm:w-[160px] shrink-0 border-b sm:border-b-0 sm:border-r border-gray-100 pb-2 sm:pb-0 sm:pr-4">
        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 text-indigo-900 border border-indigo-100 mr-3 shrink-0">
          <span className="text-base font-black leading-none">{badgeText}</span>
          <span className="text-[8px] font-bold uppercase tracking-wider text-indigo-500 mt-1">Floor</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-extrabold text-sm text-gray-800 truncate" title={floor.name}>{floorName}</span>
          <span className="text-[10px] font-bold text-gray-400 mt-0.5">{floor.rooms.length} rooms &middot; {availableCount} free</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-x-auto gap-2 py-1 scrollbar-hide w-full">
        {floor.rooms.map((room: any) => {
          const isSelectedForBooking = selectedRooms.includes(room.id);
          const isFocused = focusedRoomId === room.id;
          const isHighlighted = highlightedRoomId === room.id;
          const config = STATUS_COLORS[room.status] || STATUS_COLORS.AVAILABLE;
          const roomLabel = room.roomNumber || room.number || 'N/A';
          
          return (
            <div 
              key={room.id}
              id={`room-${roomLabel}`}
              onClick={() => onRoomClick(room.id)}
              title={`Room ${roomLabel}\\n● ${config.label}\\nRoom Type: ${room.type || 'Standard'}`}
              className={`relative px-3 py-1.5 w-[65px] h-[52px] shrink-0 flex flex-col items-center justify-center rounded-xl border cursor-pointer transition-all duration-200 ${config.bg} ${config.text} ${config.border} ${isFocused ? 'ring-2 ring-indigo-500 shadow-md scale-105 z-10' : 'hover:scale-[1.05] hover:shadow-md hover:-translate-y-0.5 shadow-sm'} ${isHighlighted ? 'ring-4 ring-indigo-400 ring-opacity-50 animate-pulse' : ''}`}
            >
              {isSelectedForBooking && (
                <div className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white rounded-full p-1 shadow-sm z-20">
                  <Check size={10} strokeWidth={4} />
                </div>
              )}
              <span className="font-extrabold text-[15px] tracking-tight">{roomLabel}</span>
              <div className={`w-1.5 h-1.5 rounded-full mt-1 ${config.dot}`}></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuickActionCard({ title, icon: Icon, onClick, colorTheme }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 p-2.5 rounded-xl border border-gray-100 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md bg-white w-full text-left`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorTheme.bg} ${colorTheme.text}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-extrabold text-gray-800 truncate">{title}</div>
      </div>
      <ChevronRight size={14} className="text-gray-300 shrink-0" />
    </button>
  );
}
"""

# Extract body
body_start = content.find("export default function RoomDashboard() {")
return_start = content.find("if (!data) return", body_start)

dashboard_body = content[body_start:return_start]

# Ensure we have searchQuery state
if "const [searchQuery" not in dashboard_body:
    dashboard_body = dashboard_body.replace(
        "const [filter, setFilter] = useState(\"ALL\");",
        "const [filter, setFilter] = useState(\"ALL\");\n  const [searchQuery, setSearchQuery] = useState(\"\");\n  const [highlightedRoomId, setHighlightedRoomId] = useState<string | null>(null);"
    )

# Search handler
search_handler = """
  // Global search effect
  useEffect(() => {
    if (!searchQuery || !data) {
      setHighlightedRoomId(null);
      return;
    }
    const term = searchQuery.toLowerCase();
    
    // Find matching room
    let foundRoomId = null;
    let foundRoomNum = null;
    for (const floor of data.floors) {
      for (const r of floor.rooms) {
        const num = r.roomNumber || r.number || '';
        if (num.toLowerCase().includes(term) || (r.guest && r.guest.toLowerCase().includes(term))) {
           foundRoomId = r.id;
           foundRoomNum = num;
           break;
        }
      }
      if (foundRoomId) break;
    }
    
    if (foundRoomId && foundRoomNum) {
       setHighlightedRoomId(foundRoomId);
       const el = document.getElementById(`room-${foundRoomNum}`);
       if (el) {
         el.scrollIntoView({ behavior: 'smooth', block: 'center' });
       }
    } else {
       setHighlightedRoomId(null);
    }
  }, [searchQuery, data]);
"""

dashboard_body = dashboard_body + search_handler

# New UI rendering
new_return = """
  // Derived Data
  const totalRooms = data ? Object.values(data.rooms).reduce((a: any, b: any) => (typeof b === 'number' && a !== 'total' ? a + b : a), 0) : 0;
  const focusedRoom = data ? data.floors.flatMap(f => f.rooms).find(r => r.id === focusedRoomId) : null;

  if (!data) return <div className="min-h-screen flex items-center justify-center bg-[#F7F8FC] text-gray-500 font-bold">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-[#F7F8FC] font-sans flex overflow-hidden">
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        
        {/* UNIFIED COMPACT HEADER */}
        <div className="bg-white border-b border-gray-100 px-6 py-3 flex flex-wrap gap-4 justify-between items-center sticky top-0 z-20 shadow-sm">
           <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
               <Building2 size={20} />
             </div>
             <div>
               <h1 className="text-lg font-black text-gray-900 tracking-tight leading-tight">Grand Plaza</h1>
               <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Main Dashboard</div>
             </div>
           </div>
           
           <div className="flex-1 max-w-xl mx-4 hidden md:block">
             <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
               </div>
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all" 
                 placeholder="Search guests, rooms, reservations, staff..." 
               />
             </div>
           </div>
           
           <div className="flex items-center gap-4">
             <div className="text-xs font-bold text-gray-600 flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
               <Clock3 size={14} className="text-gray-400" />
               {new Date().toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' })}
             </div>
             <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 rounded-lg border border-gray-100">
               <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full ring-2 ring-white"></div>
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
             </button>
             <div className="flex items-center gap-2 cursor-pointer border-l pl-4 border-gray-100">
               <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">AD</div>
             </div>
           </div>
        </div>

        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">

          {/* QUICK ACTIONS GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
             <QuickActionCard title="Guest Check-in" icon={Check} onClick={() => router.push('/dashboard/book')} colorTheme={{bg: 'bg-emerald-50', text: 'text-emerald-600'}} />
             <QuickActionCard title="Guest Check-out" icon={Check} onClick={() => {}} colorTheme={{bg: 'bg-indigo-50', text: 'text-indigo-600'}} />
             <QuickActionCard title="Reservations" icon={Clock3} onClick={() => {}} colorTheme={{bg: 'bg-violet-50', text: 'text-violet-600'}} />
             <QuickActionCard title="Housekeeping" icon={Sparkles} onClick={() => {}} colorTheme={{bg: 'bg-amber-50', text: 'text-amber-600'}} />
             <QuickActionCard title="Restaurant" icon={Droplets} onClick={() => {}} colorTheme={{bg: 'bg-rose-50', text: 'text-rose-600'}} />
             <QuickActionCard title="WhatsApp" icon={Check} onClick={() => {}} colorTheme={{bg: 'bg-teal-50', text: 'text-teal-600'}} />
             <QuickActionCard title="Rooms" icon={BedDouble} onClick={() => {}} colorTheme={{bg: 'bg-blue-50', text: 'text-blue-600'}} />
             <QuickActionCard title="Staff" icon={Check} onClick={() => {}} colorTheme={{bg: 'bg-sky-50', text: 'text-sky-600'}} />
             <QuickActionCard title="Floors" icon={Building2} onClick={() => {}} colorTheme={{bg: 'bg-emerald-50', text: 'text-emerald-600'}} />
             <QuickActionCard title="Reports" icon={Check} onClick={() => {}} colorTheme={{bg: 'bg-amber-50', text: 'text-amber-600'}} />
             <QuickActionCard title="Settings" icon={Wrench} onClick={() => {}} colorTheme={{bg: 'bg-slate-100', text: 'text-slate-600'}} />
             <QuickActionCard title="Expenses & P&L" icon={Check} onClick={() => {}} colorTheme={{bg: 'bg-rose-50', text: 'text-rose-600'}} />
          </div>

          <div className="w-full h-px bg-gray-200 mb-8"></div>

          {/* LOWER SECTION: FLOORS (LEFT) AND WIDGETS (RIGHT) */}
          <div className="flex flex-col xl:flex-row gap-8">
            
            {/* LEFT: FLOORS */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-2 shrink-0">
                  <h2 className="text-base font-black text-gray-900 uppercase tracking-widest">Floors & Rooms</h2>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <FilterBadge statusKey="ALL" count={totalRooms} isActive={filter === 'ALL'} onClick={() => setFilter('ALL')} />
                  <FilterBadge statusKey="AVAILABLE" count={data.rooms.available||0} isActive={filter === 'AVAILABLE'} onClick={() => setFilter('AVAILABLE')} />
                  <FilterBadge statusKey="OCCUPIED" count={data.rooms.occupied||0} isActive={filter === 'OCCUPIED'} onClick={() => setFilter('OCCUPIED')} />
                  <FilterBadge statusKey="DIRTY" count={data.rooms.dirty||0} isActive={filter === 'DIRTY'} onClick={() => setFilter('DIRTY')} />
                  <FilterBadge statusKey="MAINTENANCE" count={data.rooms.maintenance||0} isActive={filter === 'MAINTENANCE'} onClick={() => setFilter('MAINTENANCE')} />
                  <FilterBadge statusKey="BLOCKED" count={data.rooms.blocked||0} isActive={filter === 'BLOCKED'} onClick={() => setFilter('BLOCKED')} />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => { setNewRoomFloorId(data.floors[0]?.id || ""); setIsAddRoomOpen(true); }} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg font-bold text-xs flex items-center gap-1.5 hover:bg-indigo-100 transition-colors">
                    <Plus size={14} /> Add Room
                  </button>
                  <button onClick={() => setIsAddFloorOpen(true)} className="px-3 py-1.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg font-bold text-xs flex items-center gap-1.5 hover:bg-gray-100 transition-colors">
                    <Plus size={14} /> Add Floor
                  </button>
                </div>
              </div>

              <div className="space-y-4 pb-10">
                {data.floors.map((floor, index) => {
                  const visibleRooms = filter === 'ALL' ? floor.rooms : floor.rooms.filter((r: any) => r.status === filter);
                  if (visibleRooms.length === 0) return null;
                  return (
                    <FloorRow 
                      key={floor.id}
                      floor={{...floor, rooms: visibleRooms}} 
                      floorIndex={index}
                      selectedRooms={selectedRooms} 
                      focusedRoomId={focusedRoomId}
                      highlightedRoomId={highlightedRoomId}
                      onRoomClick={handleRoomClick} 
                    />
                  );
                })}
              </div>
            </div>

            {/* RIGHT: WIDGETS */}
            <div className="w-full xl:w-[280px] shrink-0 space-y-6">
              
              {/* Occupancy Widget */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-5">Occupancy</h3>
                
                <div className="flex flex-col items-center gap-6">
                  <div className="relative w-28 h-28 cursor-pointer transition-transform hover:scale-105" title="Click to view all rooms" onClick={() => setFilter('ALL')}>
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                      <path className="text-gray-100" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="text-indigo-500" strokeDasharray={`${data.occupancy}, 100`} strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-gray-900 leading-none">{data.occupancy}%</span>
                    </div>
                  </div>
                  
                  <div className="w-full space-y-2 border-t border-gray-100 pt-4">
                    <button onClick={() => setFilter('AVAILABLE')} className="w-full flex justify-between items-center text-xs font-bold p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2 text-gray-600"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Available</div>
                      <span className="text-gray-900">{data.rooms.available || 0}</span>
                    </button>
                    <button onClick={() => setFilter('OCCUPIED')} className="w-full flex justify-between items-center text-xs font-bold p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2 text-gray-600"><div className="w-2 h-2 rounded-full bg-indigo-500"></div>Occupied</div>
                      <span className="text-gray-900">{data.rooms.occupied || 0}</span>
                    </button>
                    <button onClick={() => setFilter('DIRTY')} className="w-full flex justify-between items-center text-xs font-bold p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2 text-gray-600"><div className="w-2 h-2 rounded-full bg-rose-500"></div>Dirty</div>
                      <span className="text-gray-900">{data.rooms.dirty || 0}</span>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Quick Alerts Widget */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Quick Alerts</h3>
                <div className="space-y-3">
                  <button onClick={() => setFilter('DIRTY')} className="w-full bg-rose-50 p-3 rounded-xl border border-rose-100 flex items-center justify-between cursor-pointer hover:bg-rose-100 hover:shadow-sm transition-all group">
                     <div>
                       <div className="text-xs font-bold text-rose-600 uppercase mb-1">Dirty</div>
                       <div className="text-xl font-black text-rose-700 leading-none">{data.rooms.dirty || 0}</div>
                     </div>
                     <span className="text-[10px] font-bold text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">View <ChevronRight size={10} /></span>
                  </button>
                  <button onClick={() => setFilter('MAINTENANCE')} className="w-full bg-amber-50 p-3 rounded-xl border border-amber-100 flex items-center justify-between cursor-pointer hover:bg-amber-100 hover:shadow-sm transition-all group">
                     <div>
                       <div className="text-xs font-bold text-amber-600 uppercase mb-1">Maintenance</div>
                       <div className="text-xl font-black text-amber-700 leading-none">{data.rooms.maintenance || 0}</div>
                     </div>
                     <span className="text-[10px] font-bold text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">View <ChevronRight size={10} /></span>
                  </button>
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Check-ins</div>
                      <div className="text-lg font-black text-gray-800">{data.pendingArrivals || 0}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Departures</div>
                      <div className="text-lg font-black text-gray-800">{data.pendingDepartures || 0}</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
      
      {/* ROOM DETAIL DRAWER */}
      <div 
        className={`fixed top-0 right-0 w-[400px] h-screen bg-white shadow-2xl border-l border-gray-100 transform transition-transform duration-300 ease-out z-40 ${focusedRoomId ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {focusedRoom && (() => {
           const conf = STATUS_COLORS[focusedRoom.status] || STATUS_COLORS.AVAILABLE;
           const isSelectedForBooking = selectedRooms.includes(focusedRoom.id);
           return (
             <div className="flex flex-col h-full">
               <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                 <div>
                   <h2 className="text-2xl font-black text-gray-900 tracking-tight">Room {focusedRoom.roomNumber || focusedRoom.number || 'N/A'}</h2>
                   <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${conf.bg} ${conf.text} ${conf.border}`}>
                     <div className={`w-2 h-2 rounded-full ${conf.dot}`}></div>
                     {conf.label}
                   </div>
                 </div>
                 <button onClick={() => setFocusedRoomId(null)} className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-gray-800 hover:bg-gray-50 transition-colors shadow-sm">
                   <X size={18} />
                 </button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 space-y-8">
                 
                 {/* Booking Selection Action */}
                 <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center justify-between shadow-sm">
                   <div>
                     <div className="text-sm font-bold text-indigo-900">Select for Booking</div>
                     <div className="text-[11px] font-medium text-indigo-600/80 mt-1">Add to current bulk selection</div>
                   </div>
                   <button 
                     onClick={() => handleToggleRoomBooking(focusedRoom.id)}
                     className={`w-12 h-7 rounded-full flex items-center p-1 transition-colors ${isSelectedForBooking ? 'bg-indigo-600' : 'bg-indigo-200'}`}
                   >
                     <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${isSelectedForBooking ? 'translate-x-5' : 'translate-x-0'}`}></div>
                   </button>
                 </div>
                 
                 <div>
                   <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Guest</h4>
                   {focusedRoom.guest ? (
                     <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl bg-white shadow-sm">
                       <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">{focusedRoom.guest[0]}</div>
                       <div>
                         <div className="text-sm font-bold text-gray-800">{focusedRoom.guest}</div>
                       </div>
                     </div>
                   ) : (
                     <div className="text-sm font-bold text-gray-500 italic">No guest</div>
                   )}
                 </div>
                 
                 <div>
                   <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Room Information</h4>
                   <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                     <div className="flex justify-between items-center">
                       <span className="text-xs font-bold text-gray-500">Room Type</span>
                       <span className="text-sm font-bold text-gray-800">{focusedRoom.type || 'Standard'}</span>
                     </div>
                     <div className="w-full h-px bg-gray-200"></div>
                     <div className="flex justify-between items-center">
                       <span className="text-xs font-bold text-gray-500">Last Cleaned</span>
                       <span className="text-sm font-bold text-gray-800">10:42 AM</span>
                     </div>
                   </div>
                 </div>
                 
                 <div>
                   <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Actions</h4>
                   <div className="grid grid-cols-2 gap-3">
                     <button className="py-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-bold hover:bg-emerald-100 shadow-sm">Check-in</button>
                     <button className="py-3 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-xs font-bold hover:bg-rose-100 shadow-sm">Set Dirty</button>
                     <button className="py-3 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 shadow-sm col-span-2">Block Room</button>
                   </div>
                 </div>
               </div>
             </div>
           );
        })()}
      </div>
      
      {/* Drawer Overlay Backdrop */}
      {focusedRoomId && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 transition-opacity" 
          onClick={() => setFocusedRoomId(null)}
        ></div>
      )}

      {/* Floating Book Action */}
      {selectedRooms.length > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-2 rounded-full shadow-2xl flex items-center gap-2 z-50 transition-all">
          <div className="flex items-center gap-3 px-4">
            <span className="bg-indigo-500 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">{selectedRooms.length}</span> 
            <span className="text-sm font-bold">Rooms Selected</span>
          </div>
          <button 
            onClick={() => router.push('/dashboard/book?rooms=' + selectedRooms.join(','))}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black px-6 py-2.5 rounded-full transition-colors flex items-center gap-2"
          >
            Book Rooms <ChevronRight size={16} />
          </button>
        </div>
      )}
"""

# Now grab the modals from old content (Add Floor Modal ... Add Room Modal)
modals_start = content.find("{/* Add Floor Modal */}")
modals_end = content.rfind("</>")
modals = content[modals_start:modals_end]

final_content = imports_and_types + new_ui_components + dashboard_body + new_return + "\n      " + modals + "\n    </div>\n  );\n}\n"

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(final_content)
