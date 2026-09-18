import re

with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

# Locate dash-panel start and bottom-row end
start_marker = '{/* Room floor panel */}'
end_marker = '      {/* Add Floor Modal */}'

if start_marker in content and end_marker in content:
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker)
    
    # We will replace from start_idx to end_idx with our new UI block
    new_ui = """{/* Room floor panel */}
        <section className="w-full mb-8">
          <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_8px_35px_rgba(15,23,42,0.07)]">
            {/* HEADER */}
            <div className="border-b border-slate-100 px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-200">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-base font-bold text-slate-900 sm:text-lg">Room status</h2>
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">LIVE</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">Interactive floor view · {data.rooms.total} rooms</p>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex w-full gap-2 sm:w-auto">
                  {selectedRooms.length > 0 && (
                    <button type="button" onClick={() => window.location.href = `/dashboard/book?rooms=${selectedRooms.join(',')}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 sm:flex-none">
                      <Check className="h-3.5 w-3.5" /> Book selected ({selectedRooms.length})
                    </button>
                  )}
                  <button type="button" onClick={() => setIsAddRoomOpen(true)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 sm:flex-none">
                    <Plus className="h-3.5 w-3.5" /> Add room
                  </button>
                  <button type="button" onClick={() => setIsAddFloorOpen(true)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800 sm:flex-none">
                    <Plus className="h-3.5 w-3.5" /> Add floor
                  </button>
                </div>
              </div>
            </div>

            {/* MAIN ROOM AREA */}
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_220px]">
                {/* FLOOR MAP */}
                <div className="min-w-0">
                  {/* FLOOR SELECTOR */}
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Floors</span>
                    {data.floors.map((floor) => (
                      <button
                        key={floor.id}
                        type="button"
                        onClick={() => setSelectedFloor(floor.name)}
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                          selectedFloor === floor.name
                            ? "bg-slate-900 text-white shadow-md"
                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {floor.name}
                      </button>
                    ))}
                  </div>

                  {/* ROOM GRID */}
                  <div className="rounded-2xl bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 p-3 ring-1 ring-slate-100 sm:p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-700">{selectedFloor}</p>
                        <p className="text-[10px] text-slate-400">Tap a room to select/manage</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
                      {data.floors
                        .filter(f => f.name === selectedFloor)
                        .flatMap(f => f.rooms)
                        .filter(r => filter === 'ALL' || r.status === filter)
                        .map((room) => {
                          const config = STATUS[room.status] || STATUS.AVAILABLE;
                          const Icon = config.icon;
                          const selected = selectedRooms.includes(room.id);

                          return (
                            <button
                              key={room.id}
                              type="button"
                              onClick={() => handleToggleRoom(room.id)}
                              className={`group relative min-h-[92px] overflow-hidden rounded-2xl border ${config.border} ${config.bg} p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                                selected ? `ring-2 ${config.ring} shadow-md` : ""
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${config.strongBg} text-white shadow-sm`}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                <span className={`h-2 w-2 rounded-full ${config.dot}`} />
                              </div>
                              <div className="mt-3">
                                <p className="text-base font-extrabold text-slate-800">{room.number || (room as any).roomNumber}</p>
                                <p className={`mt-0.5 text-[10px] font-semibold ${config.text}`}>{config.label}</p>
                              </div>
                              {selected && (
                                <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm">
                                  <Check className="h-3 w-3 text-slate-700" />
                                </div>
                              )}
                            </button>
                          );
                      })}
                      
                      {data.floors.filter(f => f.name === selectedFloor).flatMap(f => f.rooms).filter(r => filter === 'ALL' || r.status === filter).length === 0 && (
                        <div className="col-span-full flex min-h-[130px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
                          <div className="text-center">
                            <BedDouble className="mx-auto h-7 w-7 text-slate-300" />
                            <p className="mt-2 text-xs font-semibold text-slate-500">No rooms found</p>
                            <p className="mt-0.5 text-[10px] text-slate-400">Try another status filter</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* FILTERS */}
                  <div className="mt-4 overflow-x-auto pb-1">
                    <div className="flex min-w-max gap-2">
                      <FilterButton active={filter === "ALL"} label="All" count={data.rooms.total} onClick={() => setFilter("ALL")} />
                      <FilterButton active={filter === "AVAILABLE"} label="Available" count={data.rooms.available || 0} dot="bg-emerald-500" onClick={() => setFilter("AVAILABLE")} />
                      <FilterButton active={filter === "OCCUPIED"} label="Occupied" count={data.rooms.occupied || 0} dot="bg-blue-500" onClick={() => setFilter("OCCUPIED")} />
                      <FilterButton active={filter === "DIRTY"} label="Dirty" count={data.rooms.dirty || 0} dot="bg-red-500" onClick={() => setFilter("DIRTY")} />
                      <FilterButton active={filter === "MAINTENANCE"} label="Maintenance" count={data.rooms.maintenance || 0} dot="bg-amber-500" onClick={() => setFilter("MAINTENANCE")} />
                      <FilterButton active={filter === "BLOCKED"} label="Blocked" count={data.rooms.blocked || 0} dot="bg-slate-500" onClick={() => setFilter("BLOCKED")} />
                    </div>
                  </div>
                </div>

                {/* OCCUPANCY PANEL */}
                <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4 text-white shadow-xl shadow-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold">Property occupancy</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">Live room utilization</p>
                    </div>
                    <Sparkles className="h-4 w-4 text-indigo-300" />
                  </div>

                  {/* DONUT */}
                  <div className="mt-5 flex justify-center">
                    <div
                      className="relative flex h-36 w-36 items-center justify-center rounded-full"
                      style={{ background: `conic-gradient(#34d399 ${data.occupancy}%, rgba(255,255,255,0.10) ${data.occupancy}% 100%)` }}
                    >
                      <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-slate-900">
                        <span className="text-3xl font-black">{data.occupancy}%</span>
                        <span className="mt-0.5 text-[9px] uppercase tracking-[0.15em] text-slate-400">occupied</span>
                      </div>
                    </div>
                  </div>

                  {/* STATS */}
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <Stat label="Available" value={data.rooms.available || 0} color="text-emerald-400" />
                    <Stat label="Occupied" value={data.rooms.occupied || 0} color="text-blue-400" />
                    <Stat label="Dirty" value={data.rooms.dirty || 0} color="text-red-400" />
                    <Stat label="Blocked" value={data.rooms.blocked || 0} color="text-slate-300" />
                  </div>
                </div>
              </div>
            </div>

            {/* QUICK ROOM ACTION & DEPARTING */}
            <div className="border-t border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/40 p-4 sm:p-5 lg:p-6">
              <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
                {/* LEFT: DEPARTING TODAY */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100">
                      <Clock3 className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Departing today</h3>
                      <p className="text-[10px] text-slate-400">{data.vacatingRooms.length} rooms checking out</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200/60 p-3 max-h-32 overflow-y-auto">
                    {data.vacatingRooms.length > 0 ? (
                      <div className="space-y-2">
                        {data.vacatingRooms.map(vr => (
                          <div key={vr.stayId} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <div><span className="font-bold text-slate-800">Room {vr.roomNumber}</span> <span className="text-slate-500">({vr.guestName})</span></div>
                            <div className="text-slate-600 font-medium">{vr.checkoutDate}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 py-4 text-slate-400 text-xs">
                        <Check className="h-4 w-4" /> No rooms departing today
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT: QUICK ACTIONS */}
                <div className="flex flex-col justify-end">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100">
                      <Wrench className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Quick room actions</h3>
                      <p className="text-[10px] text-slate-400">Update housekeeping status</p>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="relative min-w-[200px]">
                      <select
                        className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-10 text-xs font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                        value={quickStatusRoomId}
                        onChange={(event) => setQuickStatusRoomId(event.target.value)}
                      >
                        <option value="">Select room</option>
                        {data.floors.flatMap(f => f.rooms).map((room) => (
                          <option key={room.id} value={room.id}>
                            Room {room.number || (room as any).roomNumber} · {(STATUS[room.status] || STATUS.AVAILABLE).label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>

                    <button
                      type="button"
                      disabled={isStatusChanging}
                      onClick={async () => {
                         if(!quickStatusRoomId) return alert('Please select a room first');
                         setIsStatusChanging(true);
                         try {
                           const res = await fetch(`/api/hotel/rooms/${quickStatusRoomId}/status`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({status: 'CLEANING'}) });
                           if (!res.ok) throw new Error('Failed');
                           if ((window as any).refreshDashboard) (window as any).refreshDashboard();
                           setQuickStatusRoomId('');
                         } catch (e) {
                           alert('Failed to update status');
                         } finally {
                           setIsStatusChanging(false);
                         }
                      }}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-xs font-bold text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50"
                    >
                      <Sparkles className="h-4 w-4" /> Cleaning
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      type="button"
                      disabled={isStatusChanging}
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
                      className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" /> Set clean
                    </button>
                    <button
                      type="button"
                      disabled={isStatusChanging}
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
                      className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-50 px-4 text-xs font-bold text-red-600 ring-1 ring-red-100 transition hover:bg-red-100 active:scale-[0.98] disabled:opacity-50"
                    >
                      <CircleAlert className="h-4 w-4" /> Set dirty
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

"""
    
    final_content = content[:start_idx] + new_ui + content[end_idx:]
    with open('src/app/components/RoomDashboard.tsx', 'w') as f:
        f.write(final_content)
    print("UI Replacement successful.")
else:
    print("Markers not found.")
