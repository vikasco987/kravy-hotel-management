import re

with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

# 1. Fix FilterBadge sizing and text (remove dots from filter bar, just colors)
new_filter_badge = """function FilterBadge({ statusKey, count, isActive, onClick }: { statusKey: string, count: number, isActive: boolean, onClick: () => void }) {
  if (statusKey === 'ALL') {
    return (
      <button onClick={onClick} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${isActive ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
        ALL <span className={`px-1 py-0.5 rounded text-[9px] ${isActive ? 'bg-white/30' : 'bg-white'}`}>{count}</span>
      </button>
    );
  }
  const config = STATUS_COLORS[statusKey] || STATUS_COLORS.AVAILABLE;
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all border ${isActive ? 'ring-1 ring-offset-1 ring-gray-300 opacity-100 shadow-sm' : 'opacity-80 hover:opacity-100'} ${config.bg} ${config.text} ${config.border}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></div>
      {config.label} <span className="px-1 py-0.5 rounded text-[9px] bg-white/60">{count}</span>
    </button>
  );
}"""

content = re.sub(r'function FilterBadge\(.*?\).*?return.*?;\n\}', new_filter_badge, content, flags=re.DOTALL)

# 2. Fix FloorRow - compact, room number visible, remove inline Add Room button
new_floor_row = """function FloorRow({ floor, selectedRooms, focusedRoomId, onRoomClick }: any) {
  // Extract floor numeric part if possible, otherwise use first 2 chars
  const shortName = floor.name.replace(/[^0-9]/g, '').padStart(2, '0');
  const badgeText = shortName === '00' ? floor.name.substring(0, 2).toUpperCase() : shortName;

  return (
    <div className="flex bg-white rounded-xl border border-gray-100 p-1.5 items-center shadow-sm w-full mb-2">
      <div className="flex items-center w-[120px] shrink-0 border-r border-gray-100 mr-2 pr-2">
        <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-100 mr-2">
          <span className="text-sm font-black leading-none">{badgeText || 'FL'}</span>
          <span className="text-[7px] font-bold uppercase tracking-wider text-indigo-500 mt-0.5">Floor</span>
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-xs text-gray-800 truncate w-14" title={floor.name}>{floor.name}</span>
          <span className="text-[9px] font-bold text-gray-400">{floor.rooms.length} rooms</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-x-auto gap-1.5 py-1 scrollbar-hide">
        {floor.rooms.map((room: any) => {
          const isSelectedForBooking = selectedRooms.includes(room.id);
          const isFocused = focusedRoomId === room.id;
          const config = STATUS_COLORS[room.status] || STATUS_COLORS.AVAILABLE;
          
          return (
            <div 
              key={room.id}
              onClick={() => onRoomClick(room.id)}
              className={`relative px-3 py-1.5 w-[60px] h-[48px] flex flex-col items-center justify-center rounded-lg border cursor-pointer transition-all duration-200 ${config.bg} ${config.text} ${config.border} ${isFocused ? 'ring-2 ring-indigo-500 shadow-md scale-105 z-10' : 'hover:scale-[1.03] shadow-sm'}`}
            >
              {isSelectedForBooking && (
                <div className="absolute -top-1 -right-1 bg-indigo-600 text-white rounded-full p-0.5 shadow-sm z-20">
                  <Check size={8} strokeWidth={4} />
                </div>
              )}
              <span className="font-extrabold text-sm tracking-tight">{room.number || 'N/A'}</span>
              <div className={`w-1.5 h-1.5 rounded-full mt-1 ${config.dot}`}></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}"""

content = re.sub(r'function FloorRow\(.*?\).*?return.*?;\n\}', new_floor_row, content, flags=re.DOTALL)

# 3. Compact Quick Actions
new_quick_action = """function QuickActionCard({ title, icon: Icon, onClick, colorTheme }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 p-2 rounded-xl border border-gray-100 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md bg-white w-full text-left`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorTheme.bg} ${colorTheme.text}`}>
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-extrabold text-gray-800 truncate">{title}</div>
      </div>
      <ChevronRight size={12} className="text-gray-300 shrink-0" />
    </button>
  );
}"""

content = re.sub(r'function QuickActionCard\(.*?\).*?return.*?;\n\}', new_quick_action, content, flags=re.DOTALL)


# 4. Remove duplicate header, inline buttons, compact widgets
# Let's replace the whole body from `return (` to the end of the Dashboard content (before Drawer).
body_pattern = re.compile(r'return \(\s*<div className="min-h-screen.*?{/\* ROOM DETAIL DRAWER \*/}', re.DOTALL)

new_body = """return (
    <div className="min-h-screen bg-[#F7F8FC] font-sans flex overflow-hidden">
      
      <div className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        
        {/* COMPACT HEADER */}
        <div className="bg-white border-b border-gray-100 px-6 py-2.5 flex justify-between items-center sticky top-0 z-20 shadow-sm">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
               <Building2 size={16} />
             </div>
             <div>
               <h1 className="text-base font-black text-gray-900 tracking-tight">Main Dashboard</h1>
               <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Grand Plaza Control Center</div>
             </div>
           </div>
           
           <div className="flex items-center gap-4">
             <div className="text-xs font-bold text-gray-600 flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
               <Clock3 size={12} className="text-gray-400" />
               {new Date().toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' })}
             </div>
             <button className="relative p-1.5 text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 rounded-full border border-gray-100">
               <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full ring-2 ring-white"></div>
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
             </button>
             <div className="flex items-center gap-2 cursor-pointer border-l pl-4 border-gray-100">
               <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">AD</div>
             </div>
           </div>
        </div>

        <div className="p-4 md:p-6 lg:p-8">

          {/* QUICK ACTIONS GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5 mb-6">
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

          {/* LOWER SECTION: FLOORS (LEFT) AND WIDGETS (RIGHT) */}
          <div className="flex flex-col xl:flex-row gap-6">
            
            {/* LEFT: FLOORS */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-indigo-500" />
                  <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">Floors & Rooms</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <FilterBadge statusKey="ALL" count={totalRooms} isActive={filter === 'ALL'} onClick={() => setFilter('ALL')} />
                  <FilterBadge statusKey="AVAILABLE" count={data.rooms.available||0} isActive={filter === 'AVAILABLE'} onClick={() => setFilter('AVAILABLE')} />
                  <FilterBadge statusKey="OCCUPIED" count={data.rooms.occupied||0} isActive={filter === 'OCCUPIED'} onClick={() => setFilter('OCCUPIED')} />
                  <FilterBadge statusKey="DIRTY" count={data.rooms.dirty||0} isActive={filter === 'DIRTY'} onClick={() => setFilter('DIRTY')} />
                  <FilterBadge statusKey="MAINTENANCE" count={data.rooms.maintenance||0} isActive={filter === 'MAINTENANCE'} onClick={() => setFilter('MAINTENANCE')} />
                  <FilterBadge statusKey="BLOCKED" count={data.rooms.blocked||0} isActive={filter === 'BLOCKED'} onClick={() => setFilter('BLOCKED')} />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setNewRoomFloorId(data.floors[0]?.id || ""); setIsAddRoomOpen(true); }} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md font-bold text-[10px] flex items-center gap-1 hover:bg-indigo-100 transition-colors uppercase tracking-wider">
                    <Plus size={12} /> Add Room
                  </button>
                  <button onClick={() => setIsAddFloorOpen(true)} className="px-3 py-1.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-md font-bold text-[10px] flex items-center gap-1 hover:bg-gray-100 transition-colors uppercase tracking-wider">
                    <Plus size={12} /> Add Floor
                  </button>
                </div>
              </div>

              <div className="space-y-0 pb-10">
                {data.floors.map((floor) => {
                  const visibleRooms = filter === 'ALL' ? floor.rooms : floor.rooms.filter((r: any) => r.status === filter);
                  if (visibleRooms.length === 0) return null;
                  return (
                    <FloorRow 
                      key={floor.id}
                      floor={{...floor, rooms: visibleRooms}} 
                      selectedRooms={selectedRooms} 
                      focusedRoomId={focusedRoomId}
                      onRoomClick={handleRoomClick} 
                    />
                  );
                })}
              </div>
            </div>

            {/* RIGHT: WIDGETS */}
            <div className="w-full xl:w-[260px] shrink-0 space-y-4">
              
              {/* Occupancy Widget */}
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-4">Occupancy</h3>
                
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-20 h-20">
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                      <path className="text-gray-100" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="text-indigo-500" strokeDasharray={`${data.occupancy}, 100`} strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-black text-gray-900 leading-none">{data.occupancy}%</span>
                    </div>
                  </div>
                  
                  <div className="w-full space-y-1.5 border-t border-gray-100 pt-3">
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <div className="flex items-center gap-1.5 text-gray-600"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>Available</div>
                      <span className="text-gray-900">{data.rooms.available || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <div className="flex items-center gap-1.5 text-gray-600"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>Occupied</div>
                      <span className="text-gray-900">{data.rooms.occupied || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <div className="flex items-center gap-1.5 text-gray-600"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>Dirty</div>
                      <span className="text-gray-900">{data.rooms.dirty || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick Stats Widget */}
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-3">Quick Alerts</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-rose-50 p-2 rounded-lg border border-rose-100 flex items-center justify-between cursor-pointer hover:bg-rose-100 transition-colors">
                     <div>
                       <div className="text-base font-black text-rose-700 leading-none mb-0.5">{data.rooms.dirty || 0}</div>
                       <div className="text-[9px] font-bold text-rose-600 uppercase">Dirty</div>
                     </div>
                  </div>
                  <div className="bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-colors">
                     <div>
                       <div className="text-base font-black text-amber-700 leading-none mb-0.5">{data.rooms.maintenance || 0}</div>
                       <div className="text-[9px] font-bold text-amber-600 uppercase">Maint.</div>
                     </div>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100 flex items-center justify-between cursor-pointer hover:bg-emerald-100 transition-colors">
                     <div>
                       <div className="text-base font-black text-emerald-700 leading-none mb-0.5">{data.pendingArrivals || 0}</div>
                       <div className="text-[9px] font-bold text-emerald-600 uppercase">Check-ins</div>
                     </div>
                  </div>
                  <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100 flex items-center justify-between cursor-pointer hover:bg-indigo-100 transition-colors">
                     <div>
                       <div className="text-base font-black text-indigo-700 leading-none mb-0.5">{data.pendingDepartures || 0}</div>
                       <div className="text-[9px] font-bold text-indigo-600 uppercase">Check-outs</div>
                     </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
      
      {/* ROOM DETAIL DRAWER */}\n"""

content = body_pattern.sub(new_body, content)

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)
