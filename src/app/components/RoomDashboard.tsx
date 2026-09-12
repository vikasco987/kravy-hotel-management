"use client";

import { useEffect, useState } from "react";

type RoomStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'DIRTY' | 'CLEANING' | 'INSPECTED' | 'MAINTENANCE' | 'BLOCKED';

interface Room {
  id: string;
  number: string;
  status: RoomStatus;
  type: string;
  guest?: string;
  capacity?: number;
  price?: number;
  staff?: string;
  amenities?: string[];
  notes?: string;
}

interface Floor {
  id: string;
  name: string;
  rooms: Room[];
}

interface VacatingRoom {
  roomNumber: string;
  guestName: string;
  checkoutDate: string;
  balance: number;
  stayId: string;
}

interface DashboardData {
  rooms: Record<string, number>;
  occupancy: number;
  checkIns: number;
  checkOuts: number;
  revenueToday: number;
  pendingArrivals: number;
  pendingDepartures: number;
  floors: Floor[];
  vacatingRooms: VacatingRoom[];
}

const AMENITIES_LIST = [
  "AC / Heater",
  "Wi-Fi",
  "TV",
  "Attached Bathroom / Geyser",
  "Balcony View"
];

export default function RoomDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  // Modal States
  const [isAddFloorOpen, setIsAddFloorOpen] = useState(false);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);

  // Form States - Floor
  const [newFloorName, setNewFloorName] = useState("");
  
  // Form States - Room
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newRoomFloorId, setNewRoomFloorId] = useState("");
  const [newRoomType, setNewRoomType] = useState("Standard");
  const [newRoomCapacity, setNewRoomCapacity] = useState(2);
  const [newRoomPrice, setNewRoomPrice] = useState(1500);
  const [newRoomStatus, setNewRoomStatus] = useState<RoomStatus>("AVAILABLE");
  const [newRoomStaff, setNewRoomStaff] = useState("");
  const [newRoomAmenities, setNewRoomAmenities] = useState<string[]>([]);
  const [newRoomNotes, setNewRoomNotes] = useState("");

  useEffect(() => {
    fetch('/api/hotel/dashboard')
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          console.error("Dashboard API Error:", text);
          throw new Error("API failed");
        }
        return res.json();
      })
      .then(fetchedData => {
        setData(fetchedData);
        if (fetchedData.floors && fetchedData.floors.length > 0) {
          setNewRoomFloorId(fetchedData.floors[0].id);
        }
      })
      .catch(err => {
        console.error("Failed to fetch dashboard:", err);
      });
  }, []);

  const handleAddFloor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !newFloorName.trim()) return;

    const newFloor: Floor = {
      id: `floor-${Date.now()}`,
      name: newFloorName,
      rooms: []
    };

    setData({
      ...data,
      floors: [...data.floors, newFloor]
    });
    
    setNewFloorName("");
    setIsAddFloorOpen(false);
    if (!newRoomFloorId) setNewRoomFloorId(newFloor.id);
  };

  const toggleAmenity = (amenity: string) => {
    setNewRoomAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !newRoomNumber.trim() || !newRoomFloorId) return;

    const newRoom: Room = {
      id: `room-${Date.now()}`,
      number: newRoomNumber,
      status: newRoomStatus,
      type: newRoomType,
      capacity: newRoomCapacity,
      price: newRoomPrice,
      staff: newRoomStaff,
      amenities: newRoomAmenities,
      notes: newRoomNotes
    };

    const updatedFloors = data.floors.map(floor => {
      if (floor.id === newRoomFloorId) {
        return { ...floor, rooms: [...floor.rooms, newRoom] };
      }
      return floor;
    });

    // Update counts based on status
    const statusKey = newRoomStatus.toLowerCase();
    
    setData({
      ...data,
      rooms: {
        ...data.rooms,
        total: data.rooms.total + 1,
        [statusKey]: (data.rooms[statusKey] || 0) + 1
      },
      floors: updatedFloors
    });

    // Reset form
    setNewRoomNumber("");
    setNewRoomType("Standard");
    setNewRoomCapacity(2);
    setNewRoomPrice(1500);
    setNewRoomStatus("AVAILABLE");
    setNewRoomStaff("");
    setNewRoomAmenities([]);
    setNewRoomNotes("");
    setIsAddRoomOpen(false);
  };

  if (!data) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="bg-[#fdfaf5] min-h-full pb-10">
      <div className="p-6 space-y-6">
        <h1 className="text-xl font-bold text-gray-900">Main Dashboard</h1>

        {/* Quick Links & Operational Overview */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
            <QuickLink title="Guest Check-in" icon="check" bgColor="bg-[#a8e6cf]" />
            <QuickLink title="Guest Check-Out" icon="out" bgColor="bg-[#a8dadc]" />
            <QuickLink title="Reservations" icon="calendar" bgColor="bg-[#bde0fe]" />
            <QuickLink title="Housekeeping" icon="broom" bgColor="bg-[#a2d2ff]" />
            <QuickLink title="Restaurant" icon="fork" bgColor="bg-[#ffcdb2]" />
            <QuickLink title="WhatsApp" icon="message" bgColor="bg-[#d4e09b]" />
            
            <QuickLink title="Rooms" icon="bed" bgColor="bg-[#e4c1f9]" />
            <QuickLink title="Staff" icon="users" badge="2 tasks" bgColor="bg-[#a0c4ff]" />
            <QuickLink title="Floors" icon="layers" bgColor="bg-[#9bf6ff]" />
            <QuickLink title="Reports" icon="chart" bgColor="bg-[#ffea00]/50" />
            <QuickLink title="Settings" icon="gear" bgColor="bg-[#ffb5a7]" />
            <QuickLink title="Expenses & P&L" icon="dollar" bgColor="bg-[#ff99c8]" />
          </div>

          <div className="w-full lg:w-80 bg-[#f4ece1] rounded-xl p-4 border border-[#e5dfd3] shrink-0">
             <h3 className="text-xs font-bold text-gray-900 mb-3">Operational Overview</h3>
             <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-[#e7efff] rounded-lg p-3">
                   <div className="text-[10px] text-gray-500 font-semibold mb-1">Occupancy</div>
                   <div className="text-xl font-bold text-gray-900">{data.occupancy}%</div>
                </div>
                <div className="bg-[#f0f0f0] rounded-lg p-3">
                   <div className="text-[10px] text-gray-500 font-semibold mb-1">Pending Check-Ins</div>
                   <div className="text-xl font-bold text-gray-900">{data.pendingArrivals}</div>
                </div>
                <div className="bg-[#f0f0f0] rounded-lg p-3">
                   <div className="text-[10px] text-gray-500 font-semibold mb-1">Pending Departures</div>
                   <div className="text-xl font-bold text-gray-900">{data.pendingDepartures}</div>
                </div>
                <div className="bg-[#d1f2eb] rounded-lg p-3">
                   <div className="text-[10px] text-gray-500 font-semibold mb-1">Revenue Today</div>
                   <div className="text-xl font-bold text-green-800">₹{data.revenueToday.toLocaleString()}</div>
                </div>
             </div>
          </div>
        </div>

        {/* Interactive Floor View */}
        <div className="bg-[#f4ece1] rounded-xl border border-[#e5dfd3] p-4 relative overflow-x-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Room Status - Interactive Floor View</h2>
              <p className="text-[10px] text-gray-500">{data.rooms.total} rooms across your property</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setIsAddRoomOpen(true)} className="bg-[#1b4332] text-white text-[10px] font-semibold px-3 py-1.5 rounded-md hover:bg-[#081c15]">+ Add Room</button>
              <button onClick={() => setIsAddFloorOpen(true)} className="bg-[#1b3a4b] text-white text-[10px] font-semibold px-3 py-1.5 rounded-md hover:bg-[#065a60]">+ Add Floor</button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-6">
              {data.floors.length === 0 ? (
                <div className="text-sm text-gray-500 py-4 italic">No floors added yet.</div>
              ) : (
                data.floors.map(floor => (
                  <div key={floor.id} className="flex gap-4">
                    <div className="w-6 rotate-180 shrink-0" style={{ writingMode: 'vertical-rl' }}>
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">{floor.name}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 flex-1 items-start content-start">
                      {floor.rooms.length === 0 ? (
                        <span className="text-[10px] text-gray-400 italic mt-2">No rooms added yet.</span>
                      ) : (
                        floor.rooms.map(room => (
                          <RoomBlock key={room.id} room={room} />
                        ))
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="md:w-64 md:border-l border-[#e5dfd3] md:pl-8 flex items-center justify-center shrink-0 py-4 md:py-0">
               <div className="w-32 h-32 rounded-full border-[8px] border-[#e9ecef] relative flex flex-col items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="50%" cy="50%" r="46%" fill="none" stroke="#1b4332" strokeWidth="8" strokeDasharray="200" strokeDashoffset={200 - (200 * data.occupancy) / 100} />
                  </svg>
                  <span className="text-2xl font-bold text-gray-900">{data.rooms.total}</span>
                  <span className="text-[10px] text-gray-500 font-semibold uppercase text-center leading-tight">Rooms<br/>Total</span>
               </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2 items-center text-[10px] font-bold">
            <span className="text-gray-600 mr-2">Filter:</span>
            <FilterBadge label="All" count={data.rooms.total} bgColor="bg-[#0b090a]" />
            <FilterBadge label="Available" count={data.rooms.available || 0} bgColor="bg-[#40916c]" />
            <FilterBadge label="Occupied" count={data.rooms.occupied || 0} bgColor="bg-[#4361ee]" />
            <FilterBadge label="Dirty" count={data.rooms.dirty || 0} bgColor="bg-[#e63946]" />
            <FilterBadge label="Maintenance" count={data.rooms.maintenance || 0} bgColor="bg-[#f4a261]" />
            <FilterBadge label="Blocked" count={data.rooms.blocked || 0} bgColor="bg-[#6c757d]" />
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col lg:flex-row gap-6">
           <div className="flex-1 bg-[#f4ece1] rounded-xl border border-[#e5dfd3] p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>
                 Going to Vacate Rooms
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {data.vacatingRooms.map(vr => (
                   <div key={vr.stayId} className="bg-[#e9e1d5] p-3 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="bg-[#dcd1c3] p-2 rounded-md">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>
                         </div>
                         <div>
                            <div className="text-sm font-bold text-gray-900">Room {vr.roomNumber}</div>
                            <div className="text-[10px] text-gray-500">Departing - {vr.guestName}</div>
                            <div className="text-[10px] text-gray-500">Checkout: {vr.checkoutDate}</div>
                         </div>
                      </div>
                   </div>
                 ))}
                 
                 <div className="bg-[#d1f2eb] p-3 rounded-lg flex items-center justify-between sm:col-span-2 md:col-span-1 lg:col-span-2 xl:col-span-1">
                    <div>
                      <div className="text-xs font-bold text-[#1b4332]">Departing</div>
                      <div className="text-xl font-bold text-[#1b4332]">{data.vacatingRooms.length}</div>
                      <div className="text-[9px] text-[#2d6a4f] mt-1 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        Rooms cleaning overdue
                      </div>
                    </div>
                    <div className="text-xl font-bold text-[#2d6a4f]/30">0%</div>
                 </div>
              </div>
           </div>

           <div className="w-full lg:w-[450px] bg-[#f4ece1] rounded-xl border border-[#e5dfd3] p-4 shrink-0">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Quick Room Status Changer & Actions</h3>
              <div className="space-y-3">
                 <div className="flex gap-2">
                    <select className="bg-white border border-gray-300 text-xs rounded-md px-3 py-2 outline-none w-32">
                       {data.floors.flatMap(f => f.rooms).map(r => (
                         <option key={r.id} value={r.id}>{r.number}</option>
                       ))}
                    </select>
                    <button className="flex-1 bg-[#4a5759] text-white text-xs font-semibold rounded-md py-2 flex items-center justify-center gap-2 hover:bg-[#343e40]">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6"/></svg>
                       Cleaning (Assign to staff)
                    </button>
                 </div>
                 <button className="w-full bg-[#1b4332] text-white text-xs font-semibold rounded-md py-2 flex items-center justify-center gap-2 hover:bg-[#122e23]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>
                    Set all Clean done, ready to assign
                 </button>
                 <button className="w-full bg-[#6c757d] text-white text-xs font-semibold rounded-md py-2 hover:bg-[#5a6268]">
                    Set all Dirty
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* Add Floor Modal */}
      {isAddFloorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
              <form onSubmit={handleAddFloor} className="p-6">
                 <h2 className="text-lg font-bold mb-4">Add New Floor</h2>
                 <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Floor Name</label>
                      <input 
                        type="text" 
                        value={newFloorName}
                        onChange={(e) => setNewFloorName(e.target.value)}
                        placeholder="e.g., 3rd Floor" 
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gray-300 outline-none"
                        required
                      />
                    </div>
                 </div>
                 <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsAddFloorOpen(false)} className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800">Save Floor</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Add Room Modal */}
      {isAddRoomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-100 shrink-0">
                <h2 className="text-lg font-bold">Add New Room</h2>
              </div>
              <form onSubmit={handleAddRoom} className="p-6 overflow-y-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Column 1 */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold border-b pb-1">Basic Details</h3>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Select Floor</label>
                        <select 
                          value={newRoomFloorId}
                          onChange={(e) => setNewRoomFloorId(e.target.value)}
                          className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gray-300 outline-none bg-white"
                          required
                        >
                          {data.floors.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Room Number</label>
                          <input 
                            type="text" 
                            value={newRoomNumber}
                            onChange={(e) => setNewRoomNumber(e.target.value)}
                            placeholder="e.g., 301" 
                            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gray-300 outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Room Type</label>
                          <select 
                            value={newRoomType}
                            onChange={(e) => setNewRoomType(e.target.value)}
                            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gray-300 outline-none bg-white"
                          >
                            <option>Standard</option>
                            <option>Deluxe</option>
                            <option>Suite</option>
                          </select>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold border-b pb-1 mt-6">Capacity & Pricing</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Capacity (Guests)</label>
                          <input 
                            type="number" 
                            min="1"
                            value={newRoomCapacity}
                            onChange={(e) => setNewRoomCapacity(parseInt(e.target.value) || 1)}
                            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gray-300 outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Base Price (₹/night)</label>
                          <input 
                            type="number" 
                            min="0"
                            value={newRoomPrice}
                            onChange={(e) => setNewRoomPrice(parseInt(e.target.value) || 0)}
                            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gray-300 outline-none"
                            required
                          />
                        </div>
                      </div>

                      <h3 className="text-sm font-bold border-b pb-1 mt-6">Status & Management</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Status</label>
                          <select 
                            value={newRoomStatus}
                            onChange={(e) => setNewRoomStatus(e.target.value as RoomStatus)}
                            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gray-300 outline-none bg-white"
                          >
                            <option value="AVAILABLE">Available</option>
                            <option value="OCCUPIED">Occupied</option>
                            <option value="DIRTY">Dirty</option>
                            <option value="MAINTENANCE">Maintenance</option>
                            <option value="BLOCKED">Blocked</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Cleaner</label>
                          <select 
                            value={newRoomStaff}
                            onChange={(e) => setNewRoomStaff(e.target.value)}
                            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gray-300 outline-none bg-white text-gray-500"
                          >
                            <option value="">Unassigned</option>
                            <option value="Ramesh">Ramesh (HK)</option>
                            <option value="Sita">Sita (HK)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Column 2 */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold border-b pb-1">Amenities & Features</h3>
                      <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        {AMENITIES_LIST.map(amenity => (
                          <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={newRoomAmenities.includes(amenity)}
                              onChange={() => toggleAmenity(amenity)}
                              className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                            />
                            <span className="text-sm text-gray-700">{amenity}</span>
                          </label>
                        ))}
                      </div>

                      <h3 className="text-sm font-bold border-b pb-1 mt-6">Additional Details</h3>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Description / Notes</label>
                        <textarea 
                          value={newRoomNotes}
                          onChange={(e) => setNewRoomNotes(e.target.value)}
                          placeholder="e.g., Corner room with a great view..." 
                          className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gray-300 outline-none min-h-[100px] resize-none"
                        />
                      </div>
                    </div>
                 </div>
                 
                 <div className="mt-8 pt-4 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
                    <button type="button" onClick={() => setIsAddRoomOpen(false)} className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800">Save Room</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

// Subcomponents
function QuickLink({ title, icon, bgColor, badge }: { title: string, icon: string, bgColor: string, badge?: string }) {
  return (
    <button className={`${bgColor} rounded-xl p-3 flex flex-col items-center justify-center gap-2 hover:opacity-90 transition-opacity relative h-20 shadow-sm border border-black/5`}>
       {badge && (
         <span className="absolute -top-2 -right-2 bg-[#ffb703] text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white">
           {badge}
         </span>
       )}
       <div className="w-5 h-5 bg-black/20 rounded-full flex items-center justify-center text-white text-xs">
          {title[0]}
       </div>
       <span className="text-[10px] font-bold text-gray-800 leading-tight text-center">{title}</span>
    </button>
  );
}

function RoomBlock({ room }: { room: Room }) {
  const getStatusColor = (status: RoomStatus) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-[#1b4332] text-white';
      case 'OCCUPIED': return 'bg-[#1b3a4b] text-white';
      case 'DIRTY': return 'bg-[#e63946] text-white';
      case 'MAINTENANCE': return 'bg-[#f4a261] text-white';
      case 'RESERVED': return 'bg-[#4361ee] text-white';
      case 'CLEANING': return 'bg-[#ffd166] text-black';
      case 'INSPECTED': return 'bg-[#06d6a0] text-black';
      case 'BLOCKED': return 'bg-[#6c757d] text-white';
      default: return 'bg-gray-200 text-black';
    }
  };

  return (
    <button className={`w-[42px] h-[32px] rounded flex items-center justify-center text-[11px] font-bold shadow-sm transition-transform hover:scale-105 ${getStatusColor(room.status)}`} title={room.notes ? `Notes: ${room.notes}` : ''}>
      {room.number}
    </button>
  );
}

function FilterBadge({ label, count, bgColor }: { label: string, count: number, bgColor: string }) {
  return (
    <button className={`flex items-center gap-1 ${bgColor} text-white px-2 py-1 rounded-md hover:opacity-80`}>
      <span className="text-[9px] opacity-90">{label}</span>
      <span className="bg-white/20 px-1 rounded-sm text-[10px]">{count}</span>
    </button>
  );
}
