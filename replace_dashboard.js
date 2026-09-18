const fs = require('fs');

const path = './src/app/components/RoomDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const newJSX = `  if (!data) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

  return (
    <>
      <div className="dash-page">
        <div className="dash-page-head">
          <div>
            <h1>Main dashboard</h1>
            <div className="sub">Everything moving through Grand Plaza today</div>
          </div>
        </div>

        {/* KPI ribbon */}
        <div className="kpi-row">
          <div className="kpi accent">
            <div className="kpi-label">Occupancy</div>
            <div className="kpi-value">{data.occupancy}<small>%</small></div>
          </div>
          <div className="kpi" style={{background: 'var(--card-sky)', borderColor: 'transparent'}}>
            <div className="kpi-label">Pending check-ins</div>
            <div className="kpi-value">{data.pendingArrivals}</div>
          </div>
          <div className="kpi" style={{background: 'var(--card-coral)', borderColor: 'transparent'}}>
            <div className="kpi-label">Pending departures</div>
            <div className="kpi-value">{data.pendingDepartures}</div>
          </div>
          <div className="kpi" style={{background: 'var(--card-brass)', borderColor: 'transparent'}}>
            <div className="kpi-label">Revenue today</div>
            <div className="kpi-value">₹{data.revenueToday.toLocaleString()}</div>
          </div>
        </div>

        <div className="dash-grid-2">
          <div>
            <div className="section-label">Quick actions</div>
            <div className="actions">
              {/* Render actions... */}
              <div className="action-card" style={{background: 'var(--card-moss)'}} onClick={() => router.push('/dashboard/book')}>
                <div className="action-icon" style={{background: 'rgba(255,255,255,0.6)', color: 'var(--c-moss)'}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                </div>
                <div className="action-title">Guest check-in</div>
              </div>
              <div className="action-card" style={{background: 'var(--card-teal)'}}>
                <div className="action-icon" style={{background: 'rgba(255,255,255,0.6)', color: 'var(--c-teal)'}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                </div>
                <div className="action-title">Guest check-out</div>
              </div>
              <div className="action-card" style={{background: 'var(--card-sky)'}}>
                <div className="action-icon" style={{background: 'rgba(255,255,255,0.6)', color: 'var(--c-sky)'}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div className="action-title">Reservations</div>
              </div>
              <div className="action-card" style={{background: 'var(--card-indigo)'}}>
                <div className="action-icon" style={{background: 'rgba(255,255,255,0.6)', color: 'var(--c-indigo)'}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11l2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6"/></svg>
                </div>
                <div className="action-title">Housekeeping</div>
              </div>
              
              {/* Row 2 */}
              <div className="action-card" style={{background: 'var(--card-coral)'}}>
                <div className="action-icon" style={{background: 'rgba(255,255,255,0.6)', color: 'var(--c-coral)'}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h0a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>
                </div>
                <div className="action-title">Restaurant</div>
              </div>
              <div className="action-card" style={{background: 'var(--card-moss)'}}>
                <div className="action-icon" style={{background: 'rgba(255,255,255,0.6)', color: 'var(--c-moss)'}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                </div>
                <div className="action-title">WhatsApp</div>
              </div>
              <div className="action-card" style={{background: 'var(--card-plum)'}}>
                <div className="action-icon" style={{background: 'rgba(255,255,255,0.6)', color: 'var(--c-plum)'}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                </div>
                <div className="action-title">Rooms</div>
              </div>
              <div className="action-card" style={{background: 'var(--card-indigo)'}}>
                <div className="action-badge">2 tasks</div>
                <div className="action-icon" style={{background: 'rgba(255,255,255,0.6)', color: 'var(--c-indigo)'}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div className="action-title">Staff</div>
              </div>

              {/* Row 3 */}
              <div className="action-card" style={{background: 'var(--card-teal)'}}>
                <div className="action-icon" style={{background: 'rgba(255,255,255,0.6)', color: 'var(--c-teal)'}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3z"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
                </div>
                <div className="action-title">Floors</div>
              </div>
              <div className="action-card" style={{background: 'var(--card-brass)'}}>
                <div className="action-icon" style={{background: 'rgba(255,255,255,0.6)', color: 'var(--c-brass)'}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 16l4-6 3 3 5-8"/></svg>
                </div>
                <div className="action-title">Reports</div>
              </div>
              <div className="action-card" style={{background: 'var(--card-rose)'}}>
                <div className="action-icon" style={{background: 'rgba(255,255,255,0.6)', color: 'var(--c-rose)'}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                </div>
                <div className="action-title">Settings</div>
              </div>
              <div className="action-card" style={{background: 'var(--card-coral)'}}>
                <div className="action-icon" style={{background: 'rgba(255,255,255,0.6)', color: 'var(--c-coral)'}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <div className="action-title">Expenses & P&L</div>
              </div>
            </div>
          </div>

          <div className="overview">
            <h3>Operational overview</h3>
            <div className="overview-grid">
              <div className="overview-item"><div className="lbl">Occupancy</div><div className="val">{data.occupancy}%</div></div>
              <div className="overview-item"><div className="lbl">Check-ins</div><div className="val">{data.pendingArrivals}</div></div>
              <div className="overview-item"><div className="lbl">Departures</div><div className="val">{data.pendingDepartures}</div></div>
              <div className="overview-item gold"><div className="lbl">Revenue</div><div className="val">₹{data.revenueToday.toLocaleString()}</div></div>
            </div>
          </div>
        </div>

        {/* Room floor panel */}
        <div className="dash-panel">
          <div className="dash-panel-head">
            <div>
              <h2>Room status — interactive floor view</h2>
              <div className="sub">{data.rooms.total} rooms across your property</div>
            </div>
            <div className="dash-panel-actions">
              {selectedRooms.length > 0 && (
                <button 
                  className="dash-btn primary"
                  onClick={() => window.location.href = \`/dashboard/book?rooms=\${selectedRooms.join(',')}\`}
                >
                  Book selected (<span id="selCount">{selectedRooms.length}</span>)
                </button>
              )}
              <button className="dash-btn" onClick={() => setIsAddRoomOpen(true)}>+ Add room</button>
              <button className="dash-btn" onClick={() => setIsAddFloorOpen(true)}>+ Add floor</button>
            </div>
          </div>

          <div className="floor-view">
            <div className="floors">
              {data.floors.length === 0 ? (
                <div className="text-sm text-gray-500 py-4 italic">No floors added yet.</div>
              ) : (
                data.floors.map(floor => (
                  <div className="floor-row" key={floor.id}>
                    <div className="floor-tag">{floor.name.substring(0, 2).toUpperCase()}</div>
                    <div className="room-chips">
                      {floor.rooms.length === 0 ? (
                        <span className="text-[10px] text-gray-400 italic mt-2">No rooms added yet.</span>
                      ) : (
                        floor.rooms.map(room => (
                          <div 
                            key={room.id}
                            onClick={() => handleToggleRoom(room.id)}
                            className={\`room-chip \${room.status} \${selectedRooms.includes(room.id) ? 'selected' : ''}\`}
                            data-status={room.status.toLowerCase()}
                          >
                            {room.number || (room as any).roomNumber}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="donut-wrap">
              <div className="donut">
                <svg width="108" height="108" viewBox="0 0 108 108">
                  <circle cx="54" cy="54" r="44" fill="none" stroke="#E4DFD3" strokeWidth="12"/>
                  <circle cx="54" cy="54" r="44" fill="none" stroke="#3D7A5C" strokeWidth="12"
                    strokeDasharray="276.5" strokeDashoffset={276.5 - (276.5 * data.occupancy) / 100} strokeLinecap="round"/>
                </svg>
                <div className="donut-label">
                  <div className="num">{data.rooms.total}</div>
                  <div className="txt">ROOMS TOTAL</div>
                </div>
              </div>
            </div>
          </div>

          <div className="dash-legend" id="legend">
            <div className="legend-chip active" data-filter="all"><span className="legend-dot" style={{background: '#1B2A38'}}></span>All <span className="count">{data.rooms.total}</span></div>
            <div className="legend-chip" data-filter="available"><span className="legend-dot" style={{background: '#3D7A5C'}}></span>Available <span className="count">{data.rooms.available || 0}</span></div>
            <div className="legend-chip" data-filter="occupied"><span className="legend-dot" style={{background: '#2E5A88'}}></span>Occupied <span className="count">{data.rooms.occupied || 0}</span></div>
            <div className="legend-chip" data-filter="dirty"><span className="legend-dot" style={{background: '#B6503E'}}></span>Dirty <span className="count">{data.rooms.dirty || 0}</span></div>
            <div className="legend-chip" data-filter="maintenance"><span className="legend-dot" style={{background: '#B4802E'}}></span>Maintenance <span className="count">{data.rooms.maintenance || 0}</span></div>
            <div className="legend-chip" data-filter="blocked"><span className="legend-dot" style={{background: '#726A5E'}}></span>Blocked <span className="count">{data.rooms.blocked || 0}</span></div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="bottom-row">
          <div className="vacate-card">
            <div className="vacate-top">
              <div>
                <div className="vacate-label">Departing today</div>
                <div className="vacate-num">{data.vacatingRooms.length}</div>
              </div>
              <div className="vacate-pct">0%</div>
            </div>
            
            {data.vacatingRooms.length > 0 ? (
              <div className="mt-3 space-y-2">
                 {data.vacatingRooms.map(vr => (
                    <div key={vr.stayId} className="flex justify-between items-center text-xs bg-white/40 p-2 rounded-md border border-white/50">
                      <div><span className="font-bold text-gray-800">Room {vr.roomNumber}</span> <span className="text-gray-600">({vr.guestName})</span></div>
                      <div className="text-gray-600 font-medium">{vr.checkoutDate}</div>
                    </div>
                 ))}
              </div>
            ) : (
              <div className="vacate-note">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                No rooms cleaning overdue
              </div>
            )}
          </div>

          <div className="status-changer">
            <h3>Quick room status changer &amp; actions</h3>
            <div className="sc-row">
              <select 
                value={quickStatusRoomId}
                onChange={(e) => setQuickStatusRoomId(e.target.value)}
                className="sc-input"
              >
                 <option value="">Select Room</option>
                 {data.floors.flatMap(f => f.rooms).map(r => (
                   <option key={r.id} value={r.id}>{r.number || (r as any).roomNumber}</option>
                 ))}
              </select>
              <button 
                className="sc-btn clean"
                disabled={isStatusChanging}
                onClick={async () => {
                   if(!quickStatusRoomId) return alert('Please select a room first');
                   setIsStatusChanging(true);
                   try {
                     const res = await fetch(\`/api/hotel/rooms/\${quickStatusRoomId}/status\`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({status: 'CLEANING'}) });
                     if (!res.ok) throw new Error('Failed');
                     if ((window as any).refreshDashboard) (window as any).refreshDashboard();
                     setQuickStatusRoomId('');
                   } catch (e) {
                     alert('Failed to update status');
                   } finally {
                     setIsStatusChanging(false);
                   }
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
                Cleaning
              </button>
            </div>
            <button 
              className="sc-btn avail full"
              disabled={isStatusChanging}
              onClick={async () => {
                 if(!quickStatusRoomId) return alert('Please select a room first');
                 setIsStatusChanging(true);
                 try {
                   const res = await fetch(\`/api/hotel/rooms/\${quickStatusRoomId}/status\`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({status: 'AVAILABLE'}) });
                   if (!res.ok) throw new Error('Failed');
                   if ((window as any).refreshDashboard) (window as any).refreshDashboard();
                   setQuickStatusRoomId('');
                 } catch (e) {
                   alert('Failed to update status');
                 } finally {
                   setIsStatusChanging(false);
                 }
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              Set as available / clean
            </button>
            <button 
              className="sc-btn dirty full"
              disabled={isStatusChanging}
              onClick={async () => {
                 if(!quickStatusRoomId) return alert('Please select a room first');
                 setIsStatusChanging(true);
                 try {
                   const res = await fetch(\`/api/hotel/rooms/\${quickStatusRoomId}/status\`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({status: 'DIRTY'}) });
                   if (!res.ok) throw new Error('Failed');
                   if ((window as any).refreshDashboard) (window as any).refreshDashboard();
                   setQuickStatusRoomId('');
                 } catch (e) {
                   alert('Failed to update status');
                 } finally {
                   setIsStatusChanging(false);
                 }
              }}
            >
              Set as dirty
            </button>
          </div>
        </div>
      </div>
`;

// Extract before and after blocks
const startTag = '  if (!data) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;';
const startIdx = content.indexOf(startTag);

const endPattern = /      \{\/\* Add Floor Modal \*\/\}/;
const endMatch = content.match(endPattern);

if (startIdx !== -1 && endMatch) {
  const endIdx = endMatch.index;
  const newContent = content.substring(0, startIdx) + newJSX + '\n' + content.substring(endIdx);
  fs.writeFileSync(path, newContent);
  console.log('Successfully replaced JSX');
} else {
  console.log('Error finding indices', { startIdx, foundEnd: !!endMatch });
}
