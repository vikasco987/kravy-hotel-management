import re

with open('old_RoomDashboard.tsx.bak', 'r') as f:
    old_content = f.read()

# Extract Imports and Types
imports_end_idx = old_content.find("const AMENITIES_LIST = [")
imports_types = old_content[:imports_end_idx]

# Extract AMENITIES_LIST and STATUS (we might not need STATUS entirely, but let's keep AMENITIES_LIST)
amenities_match = re.search(r'(const AMENITIES_LIST = \[\s*.*?\s*\];)', old_content, re.DOTALL)
amenities = amenities_match.group(1) if amenities_match else "const AMENITIES_LIST = [];"

# We will write the new UI components and logic

new_components = """
// ----------------------------------------------------------------------
// NEW UI COMPONENTS
// ----------------------------------------------------------------------

const STATUS_COLORS: Record<string, { bg: string, text: string, border: string, dot: string, label: string }> = {
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
      <button onClick={onClick} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
        ALL <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/30' : 'bg-white'}`}>{count}</span>
      </button>
    );
  }
  const config = STATUS_COLORS[statusKey] || STATUS_COLORS.AVAILABLE;
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${isActive ? 'ring-2 ring-offset-1 ring-gray-300 opacity-100 shadow-sm' : 'opacity-80 hover:opacity-100'} ${config.bg} ${config.text} ${config.border}`}>
      <div className={`w-2 h-2 rounded-full ${config.dot}`}></div>
      {config.label} <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/60">{count}</span>
    </button>
  );
}

function FloorRow({ floor, selectedRooms, focusedRoomId, onRoomClick }: any) {
  const availableCount = floor.rooms.filter((r: any) => r.status === 'AVAILABLE').length;

  return (
    <div className="flex bg-white rounded-2xl border border-gray-100 p-2 items-center shadow-sm w-full mb-3">
      <div className="flex items-center w-[150px] shrink-0 border-r border-gray-100 mr-3 pr-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg mr-2 bg-gradient-to-br from-emerald-100 to-green-50 text-green-900 shadow-inner">
          {floor.name.replace('Floor ', '0').replace('Ground', '00')}
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-sm text-gray-800 tracking-tight">{floor.name}</span>
          <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full mt-0.5 w-fit border border-gray-100">{floor.rooms.length} rooms</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-x-auto gap-2 py-1 scrollbar-hide">
        {floor.rooms.map((room: any) => {
          const isSelectedForBooking = selectedRooms.includes(room.id);
          const isFocused = focusedRoomId === room.id;
          const config = STATUS_COLORS[room.status] || STATUS_COLORS.AVAILABLE;
          
          return (
            <div 
              key={room.id}
              onClick={() => onRoomClick(room.id)}
              className={`relative px-4 py-2 min-w-[70px] flex items-center justify-center gap-1.5 rounded-xl border cursor-pointer font-bold text-sm transition-all duration-200 ${config.bg} ${config.text} ${config.border} ${isFocused ? 'ring-2 ring-indigo-500 shadow-md scale-105 z-10' : 'hover:scale-[1.02] hover:-translate-y-0.5 shadow-sm'}`}
            >
              {isSelectedForBooking && (
                <div className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white rounded-full p-0.5 shadow-sm z-20">
                  <Check size={10} strokeWidth={4} />
                </div>
              )}
              <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></div>
              {room.number}
            </div>
          );
        })}
      </div>
      
      <div className="flex items-center gap-2 ml-3 pl-3 border-l border-gray-100 shrink-0">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold border border-emerald-100">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
           {availableCount} Available
        </div>
        <ChevronRight size={16} className="text-gray-400" />
      </div>
    </div>
  );
}

function QuickActionCard({ title, icon: Icon, onClick, colorTheme }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 p-3 rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md bg-white w-full text-left`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorTheme.bg} ${colorTheme.text}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1">
        <div className="text-xs font-extrabold text-gray-800">{title}</div>
      </div>
      <ChevronRight size={14} className="text-gray-300" />
    </button>
  );
}

// ----------------------------------------------------------------------
"""

# Extract RoomDashboard component body logic (state and effects)
body_start = old_content.find("export default function RoomDashboard() {")
return_start = old_content.find("if (!data) return", body_start)

dashboard_body = old_content[body_start:return_start]

# We will inject the new `focusedRoomId` state and `onRoomClick` handler.
state_injections = """
  const [focusedRoomId, setFocusedRoomId] = useState<string | null>(null);
  
  const handleRoomClick = (roomId: string) => {
    setFocusedRoomId(roomId);
  };

  const handleToggleRoomBooking = (roomId: string) => {
    setSelectedRooms(prev => 
      prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
    );
  };
"""

dashboard_body = dashboard_body.replace("const router = useRouter();", "const router = useRouter();\n" + state_injections)

# Generate the completely new return statement!
new_return = """
  // Derived Data
  const totalRooms = data ? Object.values(data.rooms).reduce((a: any, b: any) => (typeof b === 'number' && a !== 'total' ? a + b : a), 0) : 0;
  const focusedRoom = data ? data.floors.flatMap(f => f.rooms).find(r => r.id === focusedRoomId) : null;

  if (!data) return <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc] text-gray-500 font-bold">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans flex overflow-hidden">
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        
        {/* HEADER */}
        <div className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
               <Building2 size={20} />
             </div>
             <div>
               <h1 className="text-xl font-black text-gray-900 tracking-tight">Grand Plaza</h1>
               <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Hotel Management</div>
             </div>
           </div>
           
           <div className="flex items-center gap-6">
             <div className="text-sm font-bold text-gray-600 flex items-center gap-2">
               <Clock3 size={16} className="text-gray-400" />
               {new Date().toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
             </div>
             <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
               <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></div>
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
             </button>
             <div className="flex items-center gap-2 cursor-pointer border-l pl-6 border-gray-100">
               <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">AD</div>
               <span className="text-sm font-bold text-gray-700">Admin</span>
             </div>
           </div>
        </div>

        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Main Dashboard</h2>
            <p className="text-sm font-medium text-gray-500 mt-1">Everything you need, all in one place</p>
          </div>

          {/* QUICK ACTIONS GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-10">
             <QuickActionCard title="Guest Check-in" icon={Check} onClick={() => router.push('/dashboard/book')} colorTheme={{bg: 'bg-emerald-50', text: 'text-emerald-600'}} />
             <QuickActionCard title="Guest Check-out" icon={Check} onClick={() => {}} colorTheme={{bg: 'bg-indigo-50', text: 'text-indigo-600'}} />
             <QuickActionCard title="Reservations" icon={Clock3} onClick={() => {}} colorTheme={{bg: 'bg-purple-50', text: 'text-purple-600'}} />
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

          {/* LOWER SECTION: FLOORS (LEFT) AND WIDGETS (RIGHT) */}
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* LEFT: FLOORS */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-gray-400" />
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Floors & Rooms</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <FilterBadge statusKey="ALL" count={totalRooms} isActive={filter === 'ALL'} onClick={() => setFilter('ALL')} />
                  <FilterBadge statusKey="AVAILABLE" count={data.rooms.available||0} isActive={filter === 'AVAILABLE'} onClick={() => setFilter('AVAILABLE')} />
                  <FilterBadge statusKey="OCCUPIED" count={data.rooms.occupied||0} isActive={filter === 'OCCUPIED'} onClick={() => setFilter('OCCUPIED')} />
                  <FilterBadge statusKey="DIRTY" count={data.rooms.dirty||0} isActive={filter === 'DIRTY'} onClick={() => setFilter('DIRTY')} />
                  <FilterBadge statusKey="MAINTENANCE" count={data.rooms.maintenance||0} isActive={filter === 'MAINTENANCE'} onClick={() => setFilter('MAINTENANCE')} />
                  <FilterBadge statusKey="BLOCKED" count={data.rooms.blocked||0} isActive={filter === 'BLOCKED'} onClick={() => setFilter('BLOCKED')} />
                </div>
              </div>

              <div className="space-y-4">
                {data.floors.map((floor) => {
                  const visibleRooms = filter === 'ALL' ? floor.rooms : floor.rooms.filter((r: any) => r.status === filter);
                  if (visibleRooms.length === 0) return null;
                  return (
                    <div key={floor.id} className="flex items-center gap-3">
                      <div className="flex-1">
                        <FloorRow 
                          floor={{...floor, rooms: visibleRooms}} 
                          selectedRooms={selectedRooms} 
                          focusedRoomId={focusedRoomId}
                          onRoomClick={handleRoomClick} 
                        />
                      </div>
                      <button 
                        onClick={() => { setNewRoomFloorId(floor.id); setIsAddRoomOpen(true); }}
                        className="w-12 h-12 rounded-xl bg-white border border-gray-200 border-dashed flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors shrink-0 shadow-sm"
                        title="Add Room to Floor"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6">
                <button onClick={() => setIsAddFloorOpen(true)} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-50 shadow-sm">
                  <Plus size={16} /> Add Floor
                </button>
              </div>
            </div>

            {/* RIGHT: WIDGETS */}
            <div className="w-full lg:w-[320px] shrink-0 space-y-6">
              
              {/* Occupancy Widget */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                  <h3 className="text-sm font-black text-gray-800">Property Occupancy</h3>
                </div>
                
                <div className="flex items-center gap-6">
                  {/* Donut Chart Mock */}
                  <div className="relative w-24 h-24 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                      <path className="text-gray-100" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="text-indigo-500" strokeDasharray={`${data.occupancy}, 100`} strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-black text-gray-900 leading-none">{data.occupancy}%</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Occupied</span>
                    </div>
                  </div>
                  
                  {/* Legend */}
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <div className="flex items-center gap-1.5 text-gray-600"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>Available</div>
                      <span>{data.rooms.available || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold">
                      <div className="flex items-center gap-1.5 text-gray-600"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>Occupied</div>
                      <span>{data.rooms.occupied || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold">
                      <div className="flex items-center gap-1.5 text-gray-600"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>Dirty</div>
                      <span>{data.rooms.dirty || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick Stats Widget */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={16} className="text-amber-500" />
                  <h3 className="text-sm font-black text-gray-800">Quick Alerts</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 flex items-center justify-between cursor-pointer hover:bg-rose-100 transition-colors">
                     <div>
                       <div className="text-lg font-black text-rose-700">{data.rooms.dirty || 0}</div>
                       <div className="text-[10px] font-bold text-rose-600 uppercase">Dirty</div>
                     </div>
                     <ChevronRight size={14} className="text-rose-400" />
                  </div>
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-colors">
                     <div>
                       <div className="text-lg font-black text-amber-700">{data.rooms.maintenance || 0}</div>
                       <div className="text-[10px] font-bold text-amber-600 uppercase">Maintenance</div>
                     </div>
                     <ChevronRight size={14} className="text-amber-400" />
                  </div>
                </div>
              </div>
              
              {/* Today Widget */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-black text-gray-800 mb-4">Today</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><Check size={14} /></div>
                      <div>
                        <div className="text-xs font-extrabold text-gray-800">Check-ins</div>
                        <div className="text-[10px] font-bold text-gray-400">Pending arrivals</div>
                      </div>
                    </div>
                    <div className="text-base font-black text-gray-900">{data.pendingArrivals}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center"><Clock3 size={14} /></div>
                      <div>
                        <div className="text-xs font-extrabold text-gray-800">Check-outs</div>
                        <div className="text-[10px] font-bold text-gray-400">Pending departures</div>
                      </div>
                    </div>
                    <div className="text-base font-black text-gray-900">{data.pendingDepartures}</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
      
      {/* ROOM DETAIL DRAWER */}
      <div 
        className={`fixed top-0 right-0 w-[380px] h-screen bg-white shadow-2xl border-l border-gray-100 transform transition-transform duration-300 ease-out z-40 ${focusedRoomId ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {focusedRoom && (() => {
           const conf = STATUS_COLORS[focusedRoom.status] || STATUS_COLORS.AVAILABLE;
           const isSelectedForBooking = selectedRooms.includes(focusedRoom.id);
           return (
             <div className="flex flex-col h-full">
               <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                 <div>
                   <h2 className="text-2xl font-black text-gray-900 tracking-tight">Room {focusedRoom.number}</h2>
                   <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${conf.bg} ${conf.text} ${conf.border}`}>
                     <div className={`w-1.5 h-1.5 rounded-full ${conf.dot}`}></div>
                     {conf.label}
                   </div>
                 </div>
                 <button onClick={() => setFocusedRoomId(null)} className="p-2 bg-white border border-gray-200 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-50 transition-colors shadow-sm">
                   <X size={16} />
                 </button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 space-y-8">
                 
                 {/* Booking Selection Action */}
                 <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center justify-between">
                   <div>
                     <div className="text-sm font-bold text-indigo-900">Select for Bulk Booking</div>
                     <div className="text-xs font-medium text-indigo-600/80 mt-0.5">Add to current selection</div>
                   </div>
                   <button 
                     onClick={() => handleToggleRoomBooking(focusedRoom.id)}
                     className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors ${isSelectedForBooking ? 'bg-indigo-600' : 'bg-indigo-200'}`}
                   >
                     <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${isSelectedForBooking ? 'translate-x-4' : 'translate-x-0'}`}></div>
                   </button>
                 </div>
                 
                 {focusedRoom.guest && (
                   <div>
                     <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Current Guest</h4>
                     <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl bg-white shadow-sm">
                       <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold">{focusedRoom.guest[0]}</div>
                       <div>
                         <div className="text-sm font-bold text-gray-800">{focusedRoom.guest}</div>
                         <div className="text-xs font-medium text-gray-500">Check-out: Tomorrow 11:00 AM</div>
                       </div>
                     </div>
                     <div className="flex gap-2 mt-3">
                       <button className="flex-1 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50">Checkout</button>
                       <button className="flex-1 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50">Details</button>
                     </div>
                   </div>
                 )}
                 
                 <div>
                   <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Room Information</h4>
                   <div className="space-y-3">
                     <div className="flex justify-between text-sm">
                       <span className="font-medium text-gray-500">Type</span>
                       <span className="font-bold text-gray-800">{focusedRoom.type}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                       <span className="font-medium text-gray-500">Capacity</span>
                       <span className="font-bold text-gray-800">{focusedRoom.capacity} Guests</span>
                     </div>
                     <div className="flex justify-between text-sm">
                       <span className="font-medium text-gray-500">Price</span>
                       <span className="font-bold text-gray-800">₹{focusedRoom.price}/night</span>
                     </div>
                   </div>
                 </div>
                 
                 <div>
                   <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Housekeeping Actions</h4>
                   <div className="grid grid-cols-2 gap-2">
                     <button className="py-2.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg text-xs font-bold hover:bg-rose-100">Set Dirty</button>
                     <button className="py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-bold hover:bg-emerald-100">Set Clean</button>
                     <button className="py-2.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-xs font-bold hover:bg-amber-100 col-span-2">Send to Maintenance</button>
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

      {/* Floating Book Action (Visible when rooms are selected) */}
      {selectedRooms.length > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 z-20">
          <div className="text-sm font-bold">
            <span className="bg-indigo-500 text-white px-2 py-0.5 rounded-full text-xs mr-2">{selectedRooms.length}</span> 
            Rooms Selected
          </div>
          <div className="w-px h-4 bg-gray-700"></div>
          <button 
            onClick={() => router.push('/dashboard/book?rooms=' + selectedRooms.join(','))}
            className="text-sm font-black text-indigo-400 hover:text-indigo-300"
          >
            Proceed to Booking &rarr;
          </button>
        </div>
      )}
"""

# Now grab the modals from old content
modals_start = old_content.find("{/* Add Floor Modal */}")
modals_end = old_content.rfind("</>")
modals = old_content[modals_start:modals_end]

# Compose the final file
final_content = imports_types + amenities + "\n" + new_components + dashboard_body + new_return + "\n      " + modals + "\n    </div>\n  );\n}\n"

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(final_content)
