"use client";

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search,
  Plus,
  MoreVertical,
  ArrowLeft,
  X,
  UserCheck,
  LogOut,
  CalendarDays,
  Hotel,
  Clock,
  Layers,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { STATUS_COLORS, FilterBadge, FloorRow } from "@/components/hotel/RoomComponents";

interface Room {
  id: string;
  roomNumber: string;
  status: string;
  roomType: string;
  price: number;
  guestInfo?: any;
}

interface Floor {
  id: string;
  floorNumber: number;
  name: string;
  rooms: Room[];
}

export default function RoomsManagementPage() {
  const [data, setData] = useState<{floors: Floor[], rooms: any} | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isAddFloorOpen, setIsAddFloorOpen] = useState(false);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [newFloorNumber, setNewFloorNumber] = useState("");
  const [newFloorName, setNewFloorName] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch('/api/hotel/dashboard')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500 bg-[#F4F6F9]">Loading...</div>;

  const floors = data?.floors || [];
  const roomStats = data?.rooms || { total: 0, available: 0, occupied: 0, dirty: 0, maintenance: 0, blocked: 0 };



  const getFloorStats = (rooms: Room[]) => {
    let stats = { available: 0, occupied: 0, dirty: 0, maintenance: 0, blocked: 0 };
    rooms.forEach(r => {
      if (r.status === 'AVAILABLE') stats.available++;
      if (r.status === 'OCCUPIED') stats.occupied++;
      if (r.status === 'DIRTY') stats.dirty++;
      if (r.status === 'MAINTENANCE') stats.maintenance++;
      if (r.status === 'BLOCKED') stats.blocked++;
    });
    return stats;
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] font-sans flex">
      
      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 transition-all duration-300 ${selectedRoom ? 'pr-[380px]' : ''}`}>
        


        <div className="p-8 max-w-[1400px] mx-auto space-y-6">
           
           {/* TOP STATS */}
           <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
             <div className="bg-white border border-gray-100 rounded-2xl p-5 min-w-[150px] shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Building2 size={20} /></div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Rooms</div>
                  <div className="text-xl font-black text-gray-900">{roomStats.total}</div>
                </div>
             </div>
             <div className="bg-white border border-gray-100 rounded-2xl p-5 min-w-[150px] shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center text-xl font-black">9</div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available</div>
                  <div className="text-xl font-black text-gray-900">{roomStats.available}</div>
                </div>
             </div>
             <div className="bg-white border border-gray-100 rounded-2xl p-5 min-w-[150px] shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center text-xl font-black">8</div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Occupied</div>
                  <div className="text-xl font-black text-gray-900">{roomStats.occupied}</div>
                </div>
             </div>
             <div className="bg-white border border-gray-100 rounded-2xl p-5 min-w-[150px] shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center"><span className="text-xl font-black">0</span></div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dirty</div>
                  <div className="text-xl font-black text-gray-900">{roomStats.dirty}</div>
                </div>
             </div>
             <div className="bg-white border border-gray-100 rounded-2xl p-5 min-w-[150px] shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center"><span className="text-xl font-black">0</span></div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Maintenance</div>
                  <div className="text-xl font-black text-gray-900">{roomStats.maintenance}</div>
                </div>
             </div>
             <div className="bg-white border border-gray-100 rounded-2xl p-5 min-w-[150px] shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center"><span className="text-xl font-black">0</span></div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Blocked</div>
                  <div className="text-xl font-black text-gray-900">{roomStats.blocked}</div>
                </div>
             </div>
           </div>

           {/* FILTER BAR */}
           <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-[300px]">
                <Search size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search rooms..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium" 
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                {['ALL', 'AVAILABLE', 'OCCUPIED', 'DIRTY', 'MAINTENANCE', 'BLOCKED'].map(statusKey => (
                  <FilterBadge 
                    key={statusKey} 
                    statusKey={statusKey} 
                    count={statusKey === 'ALL' ? roomStats.total : roomStats[statusKey.toLowerCase()] || 0} 
                    isActive={activeFilter === statusKey} 
                    onClick={() => setActiveFilter(statusKey)} 
                  />
                ))}

                <button onClick={() => setIsAddRoomOpen(true)} className="ml-auto flex items-center gap-1.5 text-indigo-600 font-bold text-xs hover:bg-indigo-50 px-4 py-2 rounded-full transition whitespace-nowrap">
                   <Plus size={14} strokeWidth={3} /> Add Room
                </button>
              </div>
           </div>

           {/* FLOORS & ROOMS LIST */}
           <div className="space-y-6">
             {floors.map((floor: any, index: number) => {
               const filteredRooms = floor.rooms.filter((r: any) => {
                 if (activeFilter !== 'ALL' && r.status !== activeFilter) return false;
                 if (searchQuery && !(r.roomNumber || r.number || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
                 return true;
               });

               if (filteredRooms.length === 0 && (activeFilter !== 'ALL' || searchQuery)) return null;

               const filteredFloor = {
                 ...floor,
                 rooms: filteredRooms
               };

               return (
                 <FloorRow 
                   key={floor.id} 
                   floor={filteredFloor} 
                   floorIndex={index} 
                   selectedRooms={[]} 
                   focusedRoomId={selectedRoom?.id}
                   highlightedRoomId={null}
                   onRoomClick={(roomId: string) => {
                     const room = floor.rooms.find((r: any) => r.id === roomId);
                     if (room) setSelectedRoom(room);
                   }}
                 />
               );
             })}

             {floors.length === 0 && (
               <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center text-center">
                 <Building2 size={48} className="text-indigo-200 mb-4" />
                 <h2 className="text-lg font-black text-gray-900 tracking-tight">No Floors Found</h2>
                 <p className="text-sm text-gray-500 font-medium mt-1 mb-6">Start by adding your first floor to the property.</p>
                 <button onClick={() => setIsAddFloorOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition">
                   <Plus size={16} strokeWidth={3} /> Add Floor
                 </button>
               </div>
             )}

           </div>
           
           <div className="text-center py-6 flex items-center justify-center gap-2 opacity-50">
             <span className="text-rose-400">♥</span>
             <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">"Great hospitality creates lasting memories."</span>
           </div>
        </div>
      </div>

      {/* RIGHT SIDE PANEL (Room Details) */}
      <div 
        className={`fixed top-[72px] right-0 bottom-0 w-[380px] bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.05)] border-l border-gray-200 transform transition-transform duration-300 z-40 overflow-y-auto ${selectedRoom ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {selectedRoom && (
          <div className="p-6">
            
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Room {selectedRoom.roomNumber}</h2>
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${(STATUS_COLORS[selectedRoom.status] || STATUS_COLORS.AVAILABLE).bg} ${(STATUS_COLORS[selectedRoom.status] || STATUS_COLORS.AVAILABLE).text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${(STATUS_COLORS[selectedRoom.status] || STATUS_COLORS.AVAILABLE).dot}`}></span> 
                    {selectedRoom.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedRoom(null)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition">
                <X size={20} />
              </button>
            </div>

            {/* Room Info Cards */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col items-center text-center">
                <Hotel size={16} className="text-indigo-500 mb-2" />
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Type</span>
                <span className="text-xs font-black text-gray-900 mt-0.5">{selectedRoom.roomType}</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col items-center text-center">
                <div className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-[8px] mb-2">₹</div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Price</span>
                <span className="text-xs font-black text-gray-900 mt-0.5">₹ {selectedRoom.price} <span className="font-medium text-[9px] text-gray-500">/ night</span></span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col items-center text-center">
                <UserCheck size={16} className="text-indigo-500 mb-2" />
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Capacity</span>
                <span className="text-xs font-black text-gray-900 mt-0.5">2 guests</span>
              </div>
            </div>

            {/* Guest Info Section */}
            <div className="mb-8">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4">Guest Information</h3>
              
              {selectedRoom.guestInfo ? (
                <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
                    {selectedRoom.guestInfo.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-black text-indigo-900">{selectedRoom.guestInfo.name}</div>
                    <div className="text-[11px] font-medium text-indigo-600 mt-0.5">{selectedRoom.guestInfo.phone || 'No phone'}</div>
                    <div className="text-[10px] font-bold text-indigo-400 mt-1 uppercase tracking-widest">ID: {selectedRoom.guestInfo.id ? selectedRoom.guestInfo.id.substring(selectedRoom.guestInfo.id.length - 6).toUpperCase() : 'UNKNOWN'}</div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center">
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-black text-gray-600">No guest</div>
                    <div className="text-[11px] font-medium text-gray-400 mt-0.5">Room is currently unoccupied</div>
                  </div>
                </div>
              )}
            </div>

            {/* Room Details Section */}
            <div className="mb-8">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4">Room Details</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Cleaned</div>
                    <div className="text-xs font-medium text-gray-700 mt-0.5">Not recorded</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Layers size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Floor</div>
                    <div className="text-xs font-black text-gray-900 mt-0.5">Floor 01</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amenities</div>
                    <div className="text-xs font-medium text-gray-700 mt-0.5">Not specified</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ClipboardList size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Notes</div>
                    <div className="text-xs font-medium text-gray-700 mt-0.5">—</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Section */}
            <div className="mb-8">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4">Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => router.push('/dashboard/book')} className="bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 p-3 rounded-xl flex items-center gap-2 transition font-bold text-xs justify-center">
                  <UserCheck size={16} /> Check-in
                </button>
                <button className="bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 p-3 rounded-xl flex items-center gap-2 transition font-bold text-xs justify-center">
                  <LogOut size={16} /> Check-out
                </button>
                <button className="bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100 p-3 rounded-xl flex items-center gap-2 transition font-bold text-xs justify-center">
                  <Sparkles size={16} /> Set Clean
                </button>
                <button className="bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100 p-3 rounded-xl flex items-center gap-2 transition font-bold text-xs justify-center">
                  <Layers size={16} /> Set Dirty
                </button>
                <button className="bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 p-3 rounded-xl flex items-center gap-2 transition font-bold text-xs justify-center">
                  <MoreVertical size={16} /> Block
                </button>
                <button onClick={() => router.push('/dashboard/book')} className="bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 p-3 rounded-xl flex items-center gap-2 transition font-bold text-xs justify-center">
                  <CalendarDays size={16} /> Book
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Recent Activity</h3>
                <span className="text-[10px] font-bold text-indigo-600 cursor-pointer hover:underline">View All</span>
              </div>
              
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[5px] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent pl-4">
                 
                 <div className="relative flex items-start gap-4">
                   <div className="absolute -left-4 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm top-1"></div>
                   <div>
                     <div className="text-[11px] font-bold text-gray-900">Room status changed to Available</div>
                     <div className="text-[9px] font-medium text-gray-500 mt-0.5">19 Sep 2026 • 08:42 AM</div>
                   </div>
                 </div>

                 <div className="relative flex items-start gap-4">
                   <div className="absolute -left-4 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white shadow-sm top-1"></div>
                   <div>
                     <div className="text-[11px] font-bold text-gray-900">Room created</div>
                     <div className="text-[9px] font-medium text-gray-500 mt-0.5">10 Sep 2026 • 11:20 AM</div>
                   </div>
                 </div>

              </div>
            </div>

          </div>
        )}
      </div>



      {/* Add Floor Modal */}
      {isAddFloorOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
           <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-black text-slate-900 tracking-tight">Add New Floor</h2>
                 <button onClick={() => setIsAddFloorOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"><X size={20} /></button>
              </div>
              <form className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Floor Number</label>
                  <input type="number" value={newFloorNumber} onChange={e => setNewFloorNumber(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium text-slate-900" placeholder="e.g., 1" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Floor Name / Description</label>
                  <input type="text" value={newFloorName} onChange={e => setNewFloorName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium text-slate-900" placeholder="e.g., Ground Floor" />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsAddFloorOpen(false)} className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                  <button type="button" className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20">Save Floor</button>
                </div>
              </form>
           </div>
        </div>
      )}

      {/* Add Room Modal (Simplified placeholder for demo) */}
      {isAddRoomOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
           <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-black text-slate-900 tracking-tight">Add New Room</h2>
                 <button onClick={() => setIsAddRoomOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"><X size={20} /></button>
              </div>
              <div className="text-center py-8">
                 <p className="text-gray-500 font-medium text-sm">Room creation form will be integrated here.</p>
              </div>
              <div className="pt-4 flex gap-3">
                 <button type="button" onClick={() => setIsAddRoomOpen(false)} className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors">Close</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
