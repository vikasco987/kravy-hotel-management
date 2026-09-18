import re

with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

# Add useSearchParams to imports
content = content.replace(
    'import { useState, useEffect } from "react";',
    'import { useState, useEffect, Suspense } from "react";\nimport { useSearchParams } from "next/navigation";'
)

# Move the entire RoomDashboard body into a wrapper so we can use useSearchParams (needs Suspense boundary)
content = content.replace('export default function RoomDashboard() {', 'function DashboardContent() {')
content = content.replace('const [searchQuery, setSearchQuery] = useState("");', 'const searchParams = useSearchParams();\n  const searchQuery = searchParams.get("search") || "";')

# Modify the drawer logic to separate Selection and Focus
drawer_selection_old = """                 {/* Booking Selection Action */}
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
                 </div>"""

drawer_selection_new = """                 {/* Booking Selection Action */}
                 <div className={`border p-4 rounded-xl flex items-center justify-between shadow-sm transition-colors ${isSelectedForBooking ? 'bg-indigo-600 border-indigo-700' : 'bg-indigo-50 border-indigo-100'}`}>
                   <div>
                     <div className={`text-sm font-bold ${isSelectedForBooking ? 'text-white' : 'text-indigo-900'}`}>Select for Booking</div>
                     <div className={`text-[11px] font-medium mt-1 ${isSelectedForBooking ? 'text-indigo-100' : 'text-indigo-600/80'}`}>{isSelectedForBooking ? 'Room added to selection' : 'Add to current bulk selection'}</div>
                   </div>
                   <button 
                     onClick={() => handleToggleRoomBooking(focusedRoom.id)}
                     className={`w-12 h-7 rounded-full flex items-center p-1 transition-colors ${isSelectedForBooking ? 'bg-indigo-800' : 'bg-indigo-200'}`}
                   >
                     <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${isSelectedForBooking ? 'translate-x-5' : 'translate-x-0'}`}></div>
                   </button>
                 </div>"""

content = content.replace(drawer_selection_old, drawer_selection_new)

# Improve Room Tile rendering for focus vs selection
tile_old = "className={`relative px-3 py-1.5 w-[65px] h-[52px] shrink-0 flex flex-col items-center justify-center rounded-xl border cursor-pointer transition-all duration-200 ${config.bg} ${config.text} ${config.border} ${isFocused ? 'ring-2 ring-indigo-500 shadow-md scale-105 z-10' : 'hover:scale-[1.05] hover:shadow-md hover:-translate-y-0.5 shadow-sm'} ${isHighlighted ? 'ring-4 ring-indigo-400 ring-opacity-50 animate-pulse' : ''}`}"
tile_new = "className={`relative px-3 py-1.5 w-[65px] h-[52px] shrink-0 flex flex-col items-center justify-center rounded-xl border cursor-pointer transition-all duration-200 ${config.bg} ${config.text} ${isSelectedForBooking ? 'border-2 border-indigo-600 shadow-md scale-[1.02]' : config.border} ${isFocused ? 'ring-2 ring-offset-2 ring-indigo-400 shadow-lg scale-105 z-10' : 'hover:scale-[1.03] hover:shadow-md hover:-translate-y-0.5 shadow-sm'} ${isHighlighted ? 'ring-4 ring-indigo-400 ring-opacity-50 animate-pulse' : ''}`}"
content = content.replace(tile_old, tile_new)

# Fix header removal (remove UNIFIED COMPACT HEADER entirely and add a small title)
header_start = content.find("{/* UNIFIED COMPACT HEADER */}")
header_end = content.find('<div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">')
compact_header = """{/* SMALL SUBHEADER */}
        <div className="bg-white/50 backdrop-blur-md border-b border-gray-100 px-8 py-2 flex items-center gap-3 sticky top-0 z-20">
          <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
            <Building2 size={14} />
          </div>
          <div>
            <h1 className="text-sm font-black text-gray-900 leading-none">Main Dashboard</h1>
            <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Grand Plaza Control Center</div>
          </div>
        </div>
        """
content = content[:header_start] + compact_header + content[header_end:]

# Update Floating Booking Action Bar
floating_old = """      {/* Floating Book Action */}
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
      )}"""

floating_new = """      {/* Floating Book Action */}
      <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-2 rounded-full shadow-2xl flex items-center gap-2 z-50 transition-all duration-300 ease-out ${selectedRooms.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        <div className="flex items-center gap-3 px-4">
          <span className="bg-indigo-500 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">{selectedRooms.length}</span> 
          <span className="text-sm font-bold">{selectedRooms.length === 1 ? 'Room Selected' : 'Rooms Selected'}</span>
        </div>
        <button onClick={() => setSelectedRooms([])} className="text-xs font-bold text-gray-400 hover:text-white px-3 transition-colors">Clear</button>
        <button 
          onClick={() => router.push('/dashboard/book?rooms=' + selectedRooms.join(','))}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black px-6 py-2.5 rounded-full transition-colors flex items-center gap-2 ml-1"
        >
          Book Rooms <ChevronRight size={16} />
        </button>
      </div>"""

content = content.replace(floating_old, floating_new)

# Update Quick Alerts logic
alerts_old = """              {/* Quick Alerts Widget */}
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
              </div>"""

alerts_new = """              {/* Quick Alerts Widget */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Quick Alerts</h3>
                <div className="space-y-3">
                  {(!data.rooms.dirty && !data.rooms.maintenance) ? (
                    <div className="w-full bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><Check size={16} strokeWidth={3} /></div>
                      <div>
                        <div className="text-xs font-black text-emerald-800 uppercase">All clear</div>
                        <div className="text-[10px] font-bold text-emerald-600 mt-0.5">No dirty or maintenance rooms</div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {data.rooms.dirty > 0 && (
                        <button onClick={() => setFilter('DIRTY')} className="w-full bg-rose-50 p-3 rounded-xl border border-rose-100 flex items-center justify-between cursor-pointer hover:bg-rose-100 hover:shadow-sm transition-all group">
                           <div>
                             <div className="text-xs font-bold text-rose-600 uppercase mb-1 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div>Dirty</div>
                             <div className="text-xl font-black text-rose-700 leading-none">{data.rooms.dirty}</div>
                           </div>
                           <span className="text-[10px] font-bold text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">View rooms <ChevronRight size={10} /></span>
                        </button>
                      )}
                      {data.rooms.maintenance > 0 && (
                        <button onClick={() => setFilter('MAINTENANCE')} className="w-full bg-amber-50 p-3 rounded-xl border border-amber-100 flex items-center justify-between cursor-pointer hover:bg-amber-100 hover:shadow-sm transition-all group">
                           <div>
                             <div className="text-xs font-bold text-amber-600 uppercase mb-1 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div>Maintenance</div>
                             <div className="text-xl font-black text-amber-700 leading-none">{data.rooms.maintenance}</div>
                           </div>
                           <span className="text-[10px] font-bold text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">View rooms <ChevronRight size={10} /></span>
                        </button>
                      )}
                    </>
                  )}
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
              </div>"""

content = content.replace(alerts_old, alerts_new)

# Add suspense boundary wrapper at the end
content += """
export default function RoomDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F7F8FC] text-gray-500 font-bold">Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
"""

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)
