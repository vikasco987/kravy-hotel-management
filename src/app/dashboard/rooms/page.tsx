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
  ClipboardList,
  Wrench
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { STATUS_COLORS, FilterBadge, FloorRow } from "@/components/hotel/RoomComponents";
import { GuestDetailsModal } from "@/components/hotel/GuestDetailsModal";
import { AddRoomModal } from "@/components/hotel/AddRoomModal";

interface Room {
  id: string;
  roomNumber: string;
  status: string;
  housekeepingStatus?: string;
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
  const [data, setData] = useState<{ floors: Floor[], rooms: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
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

  const handleStatusChange = async (roomId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/hotel/rooms/${roomId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');

      const refreshRes = await fetch('/api/hotel/dashboard');
      if (refreshRes.ok) {
        const newData = await refreshRes.json();
        setData(newData);
        if (selectedRoom?.id === roomId) {
          setSelectedRoom({ ...selectedRoom, status: newStatus });
        }
      }
    } catch (error) {
      console.error(error);
      alert('Failed to update room status');
    }
  };

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
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium text-gray-900"
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
          <div className="flex flex-col h-full bg-white w-full p-4 overflow-y-auto space-y-4 pb-20">
            
            {/* Header Card */}
            <div 
              className="relative rounded-3xl overflow-hidden shadow-sm"
              style={{
                backgroundImage: 'url("https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=600&auto=format&fit=crop")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                minHeight: '130px'
              }}
            >
              <div className="absolute inset-0 bg-black/40 bg-gradient-to-t from-black/80 to-transparent"></div>
              
              <button 
                onClick={() => setSelectedRoom(null)} 
                className="absolute top-3 right-3 p-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-all z-10"
              >
                <X size={16} />
              </button>

              <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-3">
                <div className="flex gap-3 items-center">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shrink-0">
                    <Hotel size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight drop-shadow-md">
                      Room {selectedRoom.roomNumber}
                    </h2>
                    <div className="mt-1">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm ${
                        selectedRoom.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' :
                        selectedRoom.status === 'OCCUPIED' ? 'bg-indigo-100 text-indigo-700' :
                        selectedRoom.status === 'DIRTY' ? 'bg-rose-100 text-rose-700' :
                        selectedRoom.status === 'MAINTENANCE' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          selectedRoom.status === 'AVAILABLE' ? 'bg-emerald-500' :
                          selectedRoom.status === 'OCCUPIED' ? 'bg-indigo-500' :
                          selectedRoom.status === 'DIRTY' ? 'bg-rose-500' :
                          selectedRoom.status === 'MAINTENANCE' ? 'bg-amber-500' :
                          'bg-slate-500'
                        }`}></span>
                        {selectedRoom.status.replace('_', ' ')}
                        {selectedRoom.status === 'OCCUPIED' && selectedRoom.housekeepingStatus === 'DIRTY' ? ' + DIRTY' : ''}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <div className="bg-white/20 backdrop-blur-md border border-white/10 px-2 py-1 rounded-lg text-[9px] font-bold text-white flex items-center gap-1 shadow-sm">
                    <Layers size={10} /> Floor 01
                  </div>
                  <div className="bg-white/20 backdrop-blur-md border border-white/10 px-2 py-1 rounded-lg text-[9px] font-bold text-white flex items-center gap-1 shadow-sm">
                    <UserCheck size={10} /> {selectedRoom.roomType}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Cards Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#f4f7fe] rounded-2xl p-3 flex flex-col items-start gap-1">
                <div className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center text-indigo-500 mb-1">
                  <Building2 size={12} />
                </div>
                <div className="text-[10px] font-bold text-slate-500">Room Type</div>
                <div className="text-xs font-black text-slate-900">{selectedRoom.roomType}</div>
              </div>
              <div className="bg-[#fff0f4] rounded-2xl p-3 flex flex-col items-start gap-1">
                <div className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center text-rose-500 mb-1 font-bold text-xs">
                  ₹
                </div>
                <div className="text-[10px] font-bold text-slate-500">Price</div>
                <div className="text-xs font-black text-slate-900 flex items-baseline gap-1">
                  ₹{selectedRoom.guestInfo?.roomRate ? selectedRoom.guestInfo.roomRate / 100 : selectedRoom.price / 100} 
                  <span className="text-[8px] text-slate-400 font-bold">/ night</span>
                </div>
              </div>
              <div className="bg-[#eaf9f2] rounded-2xl p-3 flex flex-col items-start gap-1">
                <div className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center text-emerald-500 mb-1">
                  <UserCheck size={12} />
                </div>
                <div className="text-[10px] font-bold text-slate-500">Capacity</div>
                <div className="text-xs font-black text-slate-900">2 guests</div>
              </div>
            </div>

            {/* Guest Information */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <UserCheck size={14} className="text-blue-600" />
                  <h3 className="text-[11px] font-black text-slate-900">Guest Information</h3>
                </div>
                <div className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${selectedRoom.guestInfo ? 'bg-indigo-500' : 'bg-slate-400'}`}></div>
                  {selectedRoom.guestInfo ? 'Occupied' : 'Unoccupied'}
                </div>
              </div>
              
              <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
                {selectedRoom.guestInfo ? (
                  <div 
                    className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setIsGuestModalOpen(true)}
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm border border-indigo-100">
                      {selectedRoom.guestInfo.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900">{selectedRoom.guestInfo.name}</div>
                      <div className="text-[11px] font-medium text-slate-500 mt-0.5">{selectedRoom.guestInfo.phone || 'No phone'}</div>
                      <div className="text-[9px] font-bold text-indigo-500 mt-1 uppercase tracking-widest">
                        ID: {selectedRoom.guestInfo.idProof ? selectedRoom.guestInfo.idProof.substring(selectedRoom.guestInfo.idProof.length - 6).toUpperCase() : 'UNKNOWN'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center border border-slate-100">
                      <UserCheck size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900">No guest</div>
                      <div className="text-[11px] font-medium text-slate-400 mt-0.5">Room is currently unoccupied</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Room Details Section */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <ClipboardList size={14} className="text-blue-600" />
                <h3 className="text-[11px] font-black text-slate-900">Room Details</h3>
              </div>
              
              <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] p-4">
                <div className="flex divide-x divide-slate-100">
                  <div className="flex-1 flex flex-col px-2">
                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 mb-1">
                      <Clock size={10} className="text-blue-500" /> Last Cleaned
                    </div>
                    <div className="text-[10px] font-black text-slate-900">Not recorded</div>
                  </div>
                  <div className="flex-1 flex flex-col px-2">
                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 mb-1">
                      <Layers size={10} className="text-indigo-500" /> Floor
                    </div>
                    <div className="text-[10px] font-black text-slate-900">Floor 01</div>
                  </div>
                  <div className="flex-1 flex flex-col px-2">
                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 mb-1">
                      <Sparkles size={10} className="text-emerald-500" /> Amenities
                    </div>
                    <div className="text-[10px] font-black text-slate-900">Not specified</div>
                  </div>
                  <div className="flex-1 flex flex-col px-2">
                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 mb-1">
                      <ClipboardList size={10} className="text-purple-500" /> Notes
                    </div>
                    <div className="text-[10px] font-black text-slate-900">—</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Room Actions */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Wrench size={14} className="text-blue-600" />
                <h3 className="text-[11px] font-black text-slate-900">Room Actions</h3>
              </div>
              
              {selectedRoom.status === 'OCCUPIED' ? (
                <div className="space-y-2">
                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl text-[10px] text-emerald-800 font-medium">
                    Manual availability change is locked while a guest is staying. Please use the check-out process.
                  </div>
                  <button
                    onClick={() => router.push(`/dashboard/checkout?roomId=${selectedRoom.id}`)}
                    className="w-full p-3.5 bg-emerald-50 text-emerald-600 rounded-[14px] text-[11px] font-bold hover:bg-emerald-100 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <LogOut size={14} /> Check-Out Guest
                    </div>
                    <span>&gt;</span>
                  </button>

                  {selectedRoom.housekeepingStatus === 'DIRTY' ? (
                    <button onClick={() => handleStatusChange(selectedRoom.id, 'AVAILABLE')} className="p-3.5 bg-[#eaf9f2] text-emerald-600 rounded-[14px] text-[11px] font-bold hover:bg-emerald-100 transition-all flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} /> Set Clean
                      </div>
                      <span className="text-[10px]">&gt;</span>
                    </button>
                  ) : (
                    <button onClick={() => handleStatusChange(selectedRoom.id, 'DIRTY')} className="p-3.5 bg-[#fff0f4] text-rose-600 rounded-[14px] text-[11px] font-bold hover:bg-rose-100 transition-all flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Layers size={14} /> Set Dirty
                      </div>
                      <span className="text-[10px]">&gt;</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => router.push(`/dashboard/book?rooms=${selectedRoom.id}`)} 
                    className="p-3.5 bg-[#eaf9f2] text-emerald-600 rounded-[14px] text-[11px] font-bold hover:bg-emerald-100 transition-all flex items-center justify-between w-full"
                  >
                    <div className="flex items-center gap-2">
                      <UserCheck size={14} /> Check-in Guest
                    </div>
                    <span className="text-[10px]">&gt;</span>
                  </button>
                  <button 
                    onClick={() => router.push(`/dashboard/book?rooms=${selectedRoom.id}`)} 
                    className="p-3.5 bg-[#f4f7fe] text-blue-600 rounded-[14px] text-[11px] font-bold hover:bg-blue-100 transition-all flex items-center justify-between w-full"
                  >
                    <div className="flex items-center gap-2">
                      <CalendarDays size={14} /> Book
                    </div>
                    <span className="text-[10px]">&gt;</span>
                  </button>
                  
                  {selectedRoom.housekeepingStatus === 'DIRTY' || selectedRoom.status === 'DIRTY' ? (
                    <button onClick={() => handleStatusChange(selectedRoom.id, 'AVAILABLE')} className="p-3.5 bg-[#eaf9f2] text-emerald-600 rounded-[14px] text-[11px] font-bold hover:bg-emerald-100 transition-all flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} /> Set Clean
                      </div>
                      <span className="text-[10px]">&gt;</span>
                    </button>
                  ) : (
                    <button onClick={() => handleStatusChange(selectedRoom.id, 'DIRTY')} className="p-3.5 bg-[#fff0f4] text-rose-600 rounded-[14px] text-[11px] font-bold hover:bg-rose-100 transition-all flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Layers size={14} /> Set Dirty
                      </div>
                      <span className="text-[10px]">&gt;</span>
                    </button>
                  )}
                  
                  {selectedRoom.status === 'BLOCKED' ? (
                    <button onClick={() => handleStatusChange(selectedRoom.id, 'AVAILABLE')} className="p-3.5 bg-[#eaf9f2] text-emerald-600 rounded-[14px] text-[11px] font-bold hover:bg-emerald-100 transition-all flex items-center justify-between w-full col-span-2">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} /> Unblock
                      </div>
                      <span className="text-[10px]">&gt;</span>
                    </button>
                  ) : selectedRoom.status === 'MAINTENANCE' ? (
                    <button onClick={() => handleStatusChange(selectedRoom.id, 'AVAILABLE')} className="p-3.5 bg-[#eaf9f2] text-emerald-600 rounded-[14px] text-[11px] font-bold hover:bg-emerald-100 transition-all flex items-center justify-between w-full col-span-2">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} /> Set Available
                      </div>
                      <span className="text-[10px]">&gt;</span>
                    </button>
                  ) : (
                    <>
                      <button onClick={() => handleStatusChange(selectedRoom.id, 'BLOCKED')} className="p-3.5 bg-[#f4f7fe] text-blue-600 rounded-[14px] text-[11px] font-bold hover:bg-blue-100 transition-all flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <MoreVertical size={14} /> Block Room
                        </div>
                        <span className="text-[10px]">&gt;</span>
                      </button>
                      <button onClick={() => handleStatusChange(selectedRoom.id, 'MAINTENANCE')} className="p-3.5 bg-[#fff7e6] text-amber-600 rounded-[14px] text-[11px] font-bold hover:bg-amber-100 transition-all flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Wrench size={14} /> Set Maintenance
                        </div>
                        <span className="text-[10px]">&gt;</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-blue-600" />
                  <h3 className="text-[11px] font-black text-slate-900">Recent Activity</h3>
                </div>
                <span className="text-[10px] font-bold text-blue-600 cursor-pointer hover:underline flex items-center gap-0.5">
                  View All <span className="text-[10px]">-&gt;</span>
                </span>
              </div>

              <div className="bg-white">
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[5px] before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100 pl-4 py-2">

                  <div className="relative flex items-start gap-3">
                    <div className="absolute -left-4 w-2 h-2 rounded-full bg-emerald-500 top-1.5"></div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-900">Room status changed to Available</div>
                      <div className="text-[9px] font-medium text-slate-400 mt-0.5">19 Sep 2026 • 08:42 AM</div>
                    </div>
                  </div>

                  <div className="relative flex items-start gap-3">
                    <div className="absolute -left-4 w-2 h-2 rounded-full bg-indigo-500 top-1.5"></div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-900">Room created</div>
                      <div className="text-[9px] font-medium text-slate-400 mt-0.5">10 Sep 2026 • 11:20 AM</div>
                    </div>
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

      {/* Add Room Modal */}
      <AddRoomModal
        isOpen={isAddRoomOpen}
        onClose={() => setIsAddRoomOpen(false)}
        floors={data?.floors || []}
        onSuccess={() => {
          fetch('/api/hotel/dashboard')
            .then(res => res.json())
            .then(newData => setData(newData));
        }}
      />

      {selectedRoom && (
        <GuestDetailsModal
          isOpen={isGuestModalOpen}
          onClose={() => setIsGuestModalOpen(false)}
          room={selectedRoom}
        />
      )}
    </div>
  );
}
