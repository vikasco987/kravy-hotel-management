"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dayjs from 'dayjs';
import { Check, Sun, ArrowUp, ArrowDown, Clock3, Building2, Sparkles, Plus, Wrench, CircleCheck, BedDouble, Droplets, X, ChevronRight, Hotel, Users, IndianRupee, Snowflake, Wifi, Tv, Bath, Mountain, UserRound, ChevronDown, UserCheck, CalendarDays, UtensilsCrossed, MessageCircle, BarChart3, Wallet, Settings, MoreVertical } from "lucide-react";
import { GuestDetailsModal } from "@/components/hotel/GuestDetailsModal";



type RoomStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'DIRTY' | 'CLEANING' | 'INSPECTED' | 'MAINTENANCE' | 'BLOCKED';

interface GuestInfo {
  name: string;
  phone: string;
  idProof: string;
  checkInDate: string;
  expectedCheckOutDate?: string;
  amountPaid: number;
  totalAmount: number;
  balance: number;
  roomRate?: number;
  guestsData?: any;
}

interface Room {
  id: string;
  roomNumber: string;
  number?: string; // fallback
  status: RoomStatus;
  roomType: string;
  type?: string; // fallback
  price?: number;
  lastCleaned?: string | null;
  guestInfo?: GuestInfo;
  
  // Keep these as optional fallbacks for the new room form state
  guest?: string;
  capacity?: number;
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

// ----------------------------------------------------------------------
// NEW UI COMPONENTS
// ----------------------------------------------------------------------

const STATUS_COLORS: Record<string, { bg: string, text: string, border: string, dot: string, label: string }> = {
  AVAILABLE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-500', label: 'Available' },
  OCCUPIED: { bg: 'bg-indigo-50/70', text: 'text-indigo-700', border: 'border-indigo-100/50', dot: 'bg-indigo-500', label: 'Occupied' },
  DIRTY: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', dot: 'bg-rose-500', label: 'Dirty' },
  MAINTENANCE: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-500', label: 'Maintenance' },
  BLOCKED: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-500', label: 'Blocked' },
  RESERVED: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-100', dot: 'bg-violet-500', label: 'Reserved' },
  CLEANING: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-100', dot: 'bg-yellow-500', label: 'Cleaning' },
  INSPECTED: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-100', dot: 'bg-teal-500', label: 'Inspected' },
};

function FilterBadge({ statusKey, count, isActive, onClick }: { statusKey: string, count: number, isActive: boolean, onClick: () => void }) {
  if (statusKey === 'ALL') {
    return (
      <button onClick={onClick} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${isActive ? 'bg-indigo-500 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-gray-400'}`}></div>
        ALL <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${isActive ? 'bg-white/20' : 'bg-gray-100'}`}>{count}</span>
      </button>
    );
  }
  const config = STATUS_COLORS[statusKey] || STATUS_COLORS.AVAILABLE;
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${isActive ? `ring-2 ring-offset-1 ring-${config.dot.split('-')[1]}-300 shadow-sm` : 'border border-transparent hover:border-gray-200'} ${config.bg} ${config.text}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></div>
      {config.label} <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-white/60">{count}</span>
    </button>
  );
}

function FloorRow({ floor, floorIndex, selectedRooms, focusedRoomId, highlightedRoomId, onRoomClick, onEditFloor, onDeleteFloor }: any) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const availableCount = floor.rooms.filter((r: any) => r.status === 'AVAILABLE').length;
  
  const floorNum = floorIndex + 1;
  const badgeText = `F${floorNum}`;
  const floorName = `Floor ${floorNum.toString().padStart(2, '0')}`;

  const handleDeleteClick = () => {
    if (floor.rooms.length > 0) {
      alert("Cannot delete floor: There are rooms assigned to this floor. Please delete or move the rooms first.");
      return;
    }
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (onDeleteFloor) {
      await onDeleteFloor(floor.id);
    } else {
      alert("Delete functionality not provided");
    }
    setShowDeleteConfirm(false);
  };

  return (
    <div className="flex flex-col sm:flex-row bg-white rounded-[20px] p-4 items-center shadow-sm border border-gray-100 w-full mb-4 gap-4 sm:gap-6 relative">
      <div className="flex items-center w-full sm:w-[220px] shrink-0 border-b sm:border-b-0 sm:border-r border-gray-100 pb-4 sm:pb-0 sm:pr-6">
        <div className="flex flex-col items-center justify-center w-[52px] h-[52px] rounded-[14px] bg-blue-50/80 text-blue-600 border border-blue-100 mr-4 shrink-0">
          <span className="text-[15px] font-black leading-none">{badgeText}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-blue-400 mt-1">Floor</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-extrabold text-[15px] text-gray-900 truncate" title={floor.name}>{floorName}</span>
          <span className="text-[11px] font-medium text-gray-400 mt-1">{floor.rooms.length} rooms &middot; {availableCount} free</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-x-auto gap-3 py-1 scrollbar-hide w-full items-center">
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
              title={`Room ${roomLabel}\nStatus: ${config.label}`}
              className={`relative px-4 w-[76px] h-[48px] shrink-0 flex flex-col items-center justify-center rounded-[14px] cursor-pointer transition-all duration-200 ${config.bg} ${config.text} ${isSelectedForBooking ? 'ring-2 ring-indigo-500 shadow-md scale-[1.02]' : 'border border-transparent hover:border-gray-200'} ${isFocused ? 'ring-2 ring-indigo-400 shadow-lg scale-105 z-10' : 'hover:scale-[1.02] hover:-translate-y-0.5'} ${isHighlighted ? 'ring-4 ring-indigo-400 ring-opacity-50 animate-pulse' : ''}`}
            >
              {isSelectedForBooking && (
                <div className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white rounded-full p-1 shadow-sm z-20">
                  <Check size={10} strokeWidth={4} />
                </div>
              )}
              <span className="font-extrabold text-[14px] tracking-tight">{roomLabel}</span>
              <div className={`w-1.5 h-1.5 rounded-full mt-1 ${config.dot}`}></div>
            </div>
          );
        })}
      </div>
      <div className="relative shrink-0 flex items-center justify-center">
        <div 
          onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-50 cursor-pointer transition-colors text-gray-400"
        >
           <MoreVertical size={18} />
        </div>
        {isMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }}></div>
            <div className="absolute right-0 top-10 w-36 bg-white border border-gray-100 shadow-lg rounded-xl overflow-hidden z-50 py-1">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); if (onEditFloor) onEditFloor(floor); else alert("Edit not implemented"); }}
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Edit Floor
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); handleDeleteClick(); }}
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                Delete Floor
              </button>
            </div>
          </>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">Delete Floor?</h2>
            <p className="text-sm text-slate-500 mb-6 font-medium">Are you sure you want to delete {floorName}? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors shadow-sm shadow-rose-500/20">Delete Floor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickActionCard({ title, subtitle, icon: Icon, onClick, colorTheme }: any) {
  return (
    <button onClick={onClick} className="flex items-center justify-between p-3.5 rounded-[18px] border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 bg-white w-full text-left group">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${colorTheme.bg} ${colorTheme.text}`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-extrabold text-gray-900 truncate mb-0.5">{title}</div>
          <div className="text-[10px] font-semibold text-gray-400 truncate">{subtitle}</div>
        </div>
      </div>
      <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-400 shrink-0" />
    </button>
  );
}
function DashboardContent() {




  const [data, setData] = useState<DashboardData | null>(null);
  const [filter, setFilter] = useState("ALL");
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const [highlightedRoomId, setHighlightedRoomId] = useState<string | null>(null);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const router = useRouter();

  const [focusedRoomId, setFocusedRoomId] = useState<string | null>(null);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  
  const handleRoomClick = (roomId: string) => {
    setFocusedRoomId(roomId);
  };

  const handleToggleRoomBooking = (roomId: string) => {
    setSelectedRooms(prev => 
      prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
    );
  };


  const [quickStatusRoomId, setQuickStatusRoomId] = useState<string>('');
  const [isStatusChanging, setIsStatusChanging] = useState(false);
  const [statusModalRoom, setStatusModalRoom] = useState<any | null>(null);


  const handleToggleRoom = (roomId: string) => {
    setSelectedRooms(prev => 
      prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
    );
  };

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
      }
    } catch (error) {
      console.error(error);
      alert('Failed to update room status');
    }
  };


  // Modal States
  const [isAddFloorOpen, setIsAddFloorOpen] = useState(false);
  const [isEditFloorOpen, setIsEditFloorOpen] = useState(false);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingRoomHasGuest, setEditingRoomHasGuest] = useState(false);

  // Form States - Floor
  const [newFloorName, setNewFloorName] = useState("");
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  
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
  // Custom room types state
  const [roomTypes, setRoomTypes] = useState<Array<{id: string, name: string}>>([]);
  const [isAddRoomTypeOpen, setIsAddRoomTypeOpen] = useState(false);
  const [newRoomTypeName, setNewRoomTypeName] = useState("");

  const resetRoomForm = () => {
    setNewRoomNumber("");
    setNewRoomFloorId(data?.floors?.[0]?.id || "");
    setNewRoomType("Standard");
    setNewRoomCapacity(2);
    setNewRoomPrice(1500);
    setNewRoomStatus("AVAILABLE");
    setNewRoomStaff("");
    setNewRoomAmenities([]);
    setNewRoomNotes("");
    setEditingRoomId(null);
    setEditingRoomHasGuest(false);
  };

  const openEditRoom = (room: any, floorId: string) => {
    setEditingRoomId(room.id);
    setEditingRoomHasGuest(!!room.guestInfo);
    setNewRoomNumber(room.roomNumber || room.number || "");
    setNewRoomFloorId(floorId);
    setNewRoomType(room.roomType || room.type || "Standard");
    setNewRoomCapacity(room.capacity || 2);
    setNewRoomPrice((room.price || 150000) / 100);
    setNewRoomStatus(room.status as RoomStatus);
    setNewRoomStaff(room.staff || "");
    setNewRoomAmenities(room.amenities || []);
    setNewRoomNotes(room.notes || "");
    setIsAddRoomOpen(true);
    setFocusedRoomId(null);
  };

  useEffect(() => {    fetch(`/api/hotel/dashboard?t=${Date.now()}`, { cache: 'no-store' })
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

  // Fetch custom room types on mount
  useEffect(() => {
    fetch('/api/hotel/room-types')
      .then(async res => {
        if (!res.ok) throw new Error('Failed to fetch room types');
        return res.json();
      })
      .then((types: any[]) => {
        setRoomTypes(types);
      })
      .catch(err => console.error(err));
  }, []);

  const handleAddFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !newFloorName.trim()) return;

    try {
      const res = await fetch('/api/hotel/floors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFloorName })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Failed to create floor');
        return;
      }
      
      const createdFloor = await res.json();
      const newFloor: Floor = {
        id: createdFloor.id,
        name: createdFloor.name,
        rooms: []
      };

      setData({
        ...data,
        floors: [...data.floors, newFloor]
      });
      
      setNewFloorName("");
      setIsAddFloorOpen(false);
      if (!newRoomFloorId) setNewRoomFloorId(newFloor.id);
    } catch (error) {
      console.error(error);
      alert('Network error while creating floor');
    }
  };

  const handleEditFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !editingFloor || !newFloorName.trim()) return;

    try {
      const res = await fetch(`/api/hotel/floors/${editingFloor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFloorName })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Failed to update floor');
        return;
      }
      
      const updatedFloor = await res.json();
      
      setData({
        ...data,
        floors: data.floors.map(f => f.id === updatedFloor.id ? { ...f, name: updatedFloor.name } : f)
      });
      
      setNewFloorName("");
      setEditingFloor(null);
      setIsEditFloorOpen(false);
    } catch (error) {
      console.error(error);
      alert('Network error while updating floor');
    }
  };

  const handleDeleteFloor = async (floorId: string) => {
    if (!data) return;
    try {
      const res = await fetch(`/api/hotel/floors/${floorId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Failed to delete floor');
        return;
      }
      
      setData({
        ...data,
        floors: data.floors.filter(f => f.id !== floorId)
      });
    } catch (error) {
      console.error(error);
      alert('Network error while deleting floor');
    }
  };

  const handleDeleteRoom = async (roomId: string, status: string, hasGuest: boolean) => {
    if (status === 'OCCUPIED' && hasGuest) {
      alert("This room cannot be deleted while it has an active stay.");
      return;
    }
    if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/hotel/rooms/${roomId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Failed to delete room');
        return;
      }
      
      setData((prev: any) => {        if (!prev) return prev;
        
        const newFloors = prev.floors.map((f: any) => ({
          ...f,
          rooms: f.rooms.filter((r: any) => r.id !== roomId)
        }));

        const newRooms: Record<string, number> = {
          total: 0,
          available: 0,
          reserved: 0,
          occupied: 0,
          dirty: 0,
          cleaning: 0,
          maintenance: 0,
          blocked: 0
        };

        let newTotal = 0;
        newFloors.forEach((f: any) => {
          f.rooms.forEach((r: any) => {
            newTotal++;
            if (r.status) {
              const statusKey = r.status.toLowerCase();
              newRooms[statusKey] = (newRooms[statusKey] || 0) + 1;
            }
          });
        });
        newRooms.total = newTotal;
        const occ = newTotal > 0 ? Math.round(((newRooms.occupied + newRooms.reserved) / newTotal) * 100) : 0;

        return {
          ...prev,
          floors: newFloors,
          rooms: newRooms,
          occupancy: occ
        };
      });
      setFocusedRoomId(null);
      
      const refreshRes = await fetch('/api/hotel/dashboard?t=' + Date.now(), { cache: 'no-store' });
      if (refreshRes.ok) {
        const newData = await refreshRes.json();
        setData(newData);
      }
    } catch (error) {
      console.error(error);
      alert('Network error while deleting room');
    }
  };

  const openEditFloor = (floor: Floor) => {
    setEditingFloor(floor);
    setNewFloorName(floor.name);
    setIsEditFloorOpen(true);
  };

  const toggleAmenity = (amenity: string) => {
    setNewRoomAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !newRoomNumber.trim() || !newRoomFloorId) return;

    try {
      const method = editingRoomId ? 'PATCH' : 'POST';
      const url = editingRoomId ? `/api/hotel/rooms/${editingRoomId}` : '/api/hotel/rooms';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          floorId: newRoomFloorId,
          roomTypeName: newRoomType,
          roomNumber: newRoomNumber,
          status: newRoomStatus,
          basePrice: newRoomPrice
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || `Failed to ${editingRoomId ? 'update' : 'create'} room`);
        return;
      }
      
      const refreshRes = await fetch('/api/hotel/dashboard?t=' + Date.now(), { cache: 'no-store' });
      if (refreshRes.ok) {
        const newData = await refreshRes.json();
        setData(newData);
      }

      setIsAddRoomOpen(false);
      resetRoomForm();
    } catch (error) {
      console.error(error);
      alert(`Network error while ${editingRoomId ? 'updating' : 'creating'} room`);
    }
  };


  // Derived Data
  
  // Derived Data


  
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

  // Derived Data
  const totalRooms = data?.rooms?.total || 0;
  const focusedRoom = data ? data.floors.flatMap(f => f.rooms).find(r => r.id === focusedRoomId) : null;

  if (!data) return <div className="min-h-screen flex items-center justify-center bg-[#F7F8FC] text-gray-500 font-bold">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-[#F7F8FC] font-sans flex overflow-hidden">
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto relative bg-[#F4F6F9]">
        
        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full space-y-8">

          {/* HERO BANNER */}
          <div className="relative w-full h-[140px] rounded-2xl overflow-hidden flex items-center shadow-sm">
            <img src="/images/hero-hotel.jpg" className="absolute inset-0 w-full h-full object-cover object-center brightness-[0.85]" alt="Hotel Banner" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-900/60 to-transparent"></div>
            
            <div className="relative z-10 flex w-full items-center justify-between px-8">
              <div className="flex items-center gap-4">
                <Sun size={48} className="text-yellow-400 fill-yellow-400" />
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">Good Afternoon, System Administrator</h1>
                  <p className="text-blue-100 text-sm mt-1">Here's what's happening at Grand Plaza today.</p>
                </div>
              </div>

              {/* Banner Widget */}
              <div className="bg-white rounded-xl p-4 shadow-lg w-[260px] flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                    <BedDouble size={24} />
                 </div>
                 <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Occupancy</div>
                    <div className="text-3xl font-black text-gray-900 leading-none mt-1">{data.occupancy}%</div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 mt-1">
                      <ArrowUp size={12} strokeWidth={3} /> +5% vs. yesterday
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* QUICK ACTIONS GRID */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
             <QuickActionCard title="Guest Check-in" subtitle="New arrivals" icon={UserRound} onClick={() => router.push('/dashboard/book')} colorTheme={{bg: 'bg-blue-50', text: 'text-blue-600'}} />
             <QuickActionCard title="Guest Check-out" subtitle="Departures today" icon={UserCheck} onClick={() => {}} colorTheme={{bg: 'bg-purple-50', text: 'text-purple-600'}} />
             <QuickActionCard title="Reservations" subtitle="Manage bookings" icon={CalendarDays} onClick={() => {}} colorTheme={{bg: 'bg-indigo-50', text: 'text-indigo-600'}} />
             <QuickActionCard title="Housekeeping" subtitle="Room cleaning" icon={Sparkles} onClick={() => {}} colorTheme={{bg: 'bg-amber-50', text: 'text-amber-600'}} />
             <QuickActionCard title="Restaurant" subtitle="View orders" icon={UtensilsCrossed} onClick={() => {}} colorTheme={{bg: 'bg-rose-50', text: 'text-rose-600'}} />
             <QuickActionCard title="WhatsApp" subtitle="Guest messaging" icon={MessageCircle} onClick={() => {}} colorTheme={{bg: 'bg-emerald-50', text: 'text-emerald-600'}} />
             
             <QuickActionCard title="Rooms" subtitle="Room inventory" icon={BedDouble} onClick={() => {}} colorTheme={{bg: 'bg-sky-50', text: 'text-sky-600'}} />
             <QuickActionCard title="Staff" subtitle="Manage staff" icon={Users} onClick={() => {}} colorTheme={{bg: 'bg-cyan-50', text: 'text-cyan-600'}} />
             <QuickActionCard title="Floors" subtitle="Floor overview" icon={Building2} onClick={() => {}} colorTheme={{bg: 'bg-emerald-50', text: 'text-emerald-600'}} />
             <QuickActionCard title="Reports" subtitle="Analytics & reports" icon={BarChart3} onClick={() => {}} colorTheme={{bg: 'bg-amber-50', text: 'text-amber-600'}} />
             <QuickActionCard title="Settings" subtitle="System settings" icon={Settings} onClick={() => {}} colorTheme={{bg: 'bg-indigo-50', text: 'text-indigo-600'}} />
             <QuickActionCard title="Expenses & P&L" subtitle="Financial reports" icon={Wallet} onClick={() => {}} colorTheme={{bg: 'bg-rose-50', text: 'text-rose-600'}} />
          </div>

          {/* LOWER SECTION: FLOORS (LEFT) AND WIDGETS (RIGHT) */}
          <div className="flex flex-col xl:flex-row gap-8">
            
            {/* LEFT: FLOORS */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-6 flex-wrap">
                  <h2 className="text-[14px] font-black text-gray-900 uppercase tracking-widest">Floors & Rooms</h2>
                  <div className="flex flex-wrap gap-2">
                    <FilterBadge statusKey="ALL" count={totalRooms} isActive={filter === 'ALL'} onClick={() => setFilter('ALL')} />
                    <FilterBadge statusKey="AVAILABLE" count={data.rooms.available||0} isActive={filter === 'AVAILABLE'} onClick={() => setFilter('AVAILABLE')} />
                    <FilterBadge statusKey="OCCUPIED" count={data.rooms.occupied||0} isActive={filter === 'OCCUPIED'} onClick={() => setFilter('OCCUPIED')} />
                    <FilterBadge statusKey="DIRTY" count={data.rooms.dirty||0} isActive={filter === 'DIRTY'} onClick={() => setFilter('DIRTY')} />
                    <FilterBadge statusKey="MAINTENANCE" count={data.rooms.maintenance||0} isActive={filter === 'MAINTENANCE'} onClick={() => setFilter('MAINTENANCE')} />
                    <FilterBadge statusKey="BLOCKED" count={data.rooms.blocked||0} isActive={filter === 'BLOCKED'} onClick={() => setFilter('BLOCKED')} />
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => { resetRoomForm(); setIsAddRoomOpen(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-[11px] flex items-center gap-1.5 hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20">
                    <Plus size={14} strokeWidth={3} /> Add Room
                  </button>
                  <button onClick={() => setIsAddFloorOpen(true)} className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold text-[11px] flex items-center gap-1.5 hover:bg-gray-50 transition-colors shadow-sm">
                    <Plus size={14} strokeWidth={3} /> Add Floor
                  </button>
                </div>
              </div>

              <div className="space-y-4 pb-10">
                {data.floors.map((floor, index) => {
                  const visibleRooms = filter === 'ALL' ? floor.rooms : floor.rooms.filter((r: any) => r.status === filter);
                  if (visibleRooms.length === 0 && filter !== 'ALL') return null;
                  return (
                    <FloorRow 
                      key={floor.id}
                      floor={{...floor, rooms: visibleRooms}} 
                      floorIndex={index}
                      selectedRooms={selectedRooms} 
                      focusedRoomId={focusedRoomId}
                      highlightedRoomId={highlightedRoomId}
                      onRoomClick={handleRoomClick} 
                      onEditFloor={openEditFloor}
                      onDeleteFloor={handleDeleteFloor}
                    />
                  );
                })}
              </div>
            </div>

            {/* RIGHT: WIDGETS */}
            <div className="w-full xl:w-[280px] shrink-0 space-y-6">
              
              {/* Occupancy Widget */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 text-indigo-500 bg-indigo-50 p-2 rounded-lg"><BedDouble size={16} /></div>
                  <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-widest flex-1 ml-3">Room Occupancy</h3>
                </div>
                
                <div className="flex flex-col items-center gap-8">
                  <div className="relative w-36 h-36 cursor-pointer transition-transform hover:scale-105" title="Click to view all rooms" onClick={() => setFilter('ALL')}>
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                      <path className="text-gray-100" strokeWidth="6" stroke="currentColor" fill="none" d="M18 3 a 15 15 0 0 1 0 30 a 15 15 0 0 1 0 -30" />
                      <path className="text-blue-600" strokeDasharray={`${data.occupancy}, 100`} strokeWidth="6" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 3 a 15 15 0 0 1 0 30 a 15 15 0 0 1 0 -30" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-gray-900 leading-none">{data.occupancy}%</span>
                      <span className="text-[10px] font-bold text-gray-400 mt-1">{data.rooms.occupied || 0} / {totalRooms} Rooms</span>
                    </div>
                  </div>
                  
                  <div className="w-full space-y-3">
                    <button onClick={() => setFilter('AVAILABLE')} className="w-full flex justify-between items-center text-[13px] font-bold p-1 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 text-gray-600"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>Available</div>
                      <span className="text-gray-900">{data.rooms.available || 0}</span>
                    </button>
                    <button onClick={() => setFilter('OCCUPIED')} className="w-full flex justify-between items-center text-[13px] font-bold p-1 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 text-gray-600"><div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>Occupied</div>
                      <span className="text-gray-900">{data.rooms.occupied || 0}</span>
                    </button>
                    <button onClick={() => setFilter('DIRTY')} className="w-full flex justify-between items-center text-[13px] font-bold p-1 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 text-gray-600"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>Dirty</div>
                      <span className="text-gray-900">{data.rooms.dirty || 0}</span>
                    </button>
                    <button onClick={() => setFilter('MAINTENANCE')} className="w-full flex justify-between items-center text-[13px] font-bold p-1 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 text-gray-600"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>Maintenance</div>
                      <span className="text-gray-900">{data.rooms.maintenance || 0}</span>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Quick Alerts Widget */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                    <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-widest">Quick Alerts</h3>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer">View all</span>
                </div>
                
                <div className="space-y-4">
                  {(!data.rooms.dirty && !data.rooms.maintenance) ? (
                    <>
                    <div className="w-full bg-emerald-50/70 p-4 rounded-xl border border-emerald-100/50 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5"><Check size={14} strokeWidth={3} /></div>
                      <div>
                        <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1">All clear</div>
                        <div className="text-[11px] font-medium text-emerald-600">No dirty or maintenance rooms</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 pl-2">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
                       <div>
                         <div className="text-[11px] font-bold text-gray-800">Everything looks good!</div>
                         <div className="text-[10px] text-gray-500 font-medium">Keep up the great work!</div>
                       </div>
                    </div>
                    </>
                  ) : (
                    <>
                      {data.rooms.dirty > 0 && (
                        <button onClick={() => setFilter('DIRTY')} className="w-full bg-rose-50/70 p-4 rounded-xl border border-rose-100 flex items-center justify-between cursor-pointer hover:bg-rose-50 transition-all group">
                           <div>
                             <div className="text-[11px] font-bold text-rose-600 uppercase mb-1 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div>Dirty</div>
                             <div className="text-[11px] font-medium text-rose-700/80 leading-none">{data.rooms.dirty} rooms need cleaning</div>
                           </div>
                           <ChevronRight size={16} className="text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                      {data.rooms.maintenance > 0 && (
                        <button onClick={() => setFilter('MAINTENANCE')} className="w-full bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-all group">
                           <div>
                             <div className="text-[11px] font-bold text-amber-600 uppercase mb-1 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div>Maintenance</div>
                             <div className="text-[11px] font-medium text-amber-700/80 leading-none">{data.rooms.maintenance} rooms under repair</div>
                           </div>
                           <ChevronRight size={16} className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                    </>
                  )}
                  
                  {/* Subtle footer */}
                  <div className="pt-6 text-[10px] text-gray-400 font-medium text-center italic flex items-center justify-center gap-1">
                     <span className="text-amber-500">♥</span> "Great hospitality creates lasting memories."
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
      
      {/* ROOM DETAIL DRAWER */}
      <div 
        className={`fixed top-0 right-0 w-[400px] h-screen bg-white shadow-2xl border-l border-gray-100 transform transition-transform duration-300 ease-out z-[60] ${focusedRoomId ? 'translate-x-0' : 'translate-x-full'}`}
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
                 {!['OCCUPIED', 'MAINTENANCE', 'BLOCKED'].includes(focusedRoom.status) && (
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
                   </div>
                 )}
                 
                 <div>
                  {/* Guest & Stay Details */}
                  {focusedRoom.guestInfo ? (
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Guest Details</h4>
                      <div 
                        className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-3 cursor-pointer hover:bg-indigo-100/50 transition-colors group"
                        onClick={() => setIsGuestModalOpen(true)}
                        title="Click to view complete guest and stay details"
                      >
                        <div className="flex justify-between items-start border-b border-indigo-200/50 pb-3">
                          <div>
                            <div className="text-indigo-900 font-bold group-hover:text-indigo-700 transition-colors">{focusedRoom.guestInfo.name}</div>
                            <div className="text-xs text-indigo-700/70 font-medium">{focusedRoom.guestInfo.phone}</div>
                          </div>
                          <div className="bg-white px-2 py-1 rounded text-[10px] font-bold text-indigo-700 border border-indigo-100">
                            ID: {focusedRoom.guestInfo.idProof}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-indigo-400">Check-in</div>
                            <div className="text-xs font-semibold text-indigo-900">
                              {dayjs(focusedRoom.guestInfo.checkInDate).format('DD MMM, hh:mm A')}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-indigo-400">Expected Check-out</div>
                            <div className="text-xs font-semibold text-indigo-900">
                              {focusedRoom.guestInfo.expectedCheckOutDate 
                                ? dayjs(focusedRoom.guestInfo.expectedCheckOutDate).format('DD MMM, hh:mm A')
                                : 'Not Set'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white/60 p-3 rounded-lg border border-indigo-100/50 mt-2 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-indigo-400">Room Rate</span>
                            <span className="text-xs font-bold text-indigo-900">₹{(focusedRoom.guestInfo.roomRate || focusedRoom.price || 0) / 100}/night</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-emerald-500">Amount Paid</span>
                            <span className="text-xs font-bold text-emerald-600">₹{focusedRoom.guestInfo.amountPaid / 100}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-indigo-100/50">
                            <span className="text-xs font-bold text-indigo-400">Balance</span>
                            <span className={`text-xs font-bold ${focusedRoom.guestInfo.balance > 0 ? 'text-rose-600' : 'text-indigo-900'}`}>
                              ₹{focusedRoom.guestInfo.balance / 100}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Guest</h4>
                      <div className="text-sm font-bold text-gray-500 italic">No guest</div>
                    </div>
                  )}

                  {/* Room Information */}
                  <div>
                    <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Room Information</h4>
                    <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                        <span className="text-xs font-bold text-gray-500">Room Type</span>
                        <span className="text-sm font-bold text-gray-800">{focusedRoom.roomType || focusedRoom.type || 'Standard'}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                        <span className="text-xs font-bold text-gray-500">Price</span>
                        <span className="text-sm font-bold text-gray-800">₹{(focusedRoom.price || 0) / 100} <span className="text-[10px] font-medium text-gray-400 uppercase">/ night</span></span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                        <span className="text-xs font-bold text-gray-500">Capacity</span>
                        <span className="text-sm font-bold text-gray-800">{focusedRoom.capacity || 2} <span className="text-[10px] font-medium text-gray-400 uppercase">Guests</span></span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500">Last Cleaned</span>
                        <span className="text-sm font-bold text-gray-800">
                          {focusedRoom.lastCleaned ? dayjs(focusedRoom.lastCleaned).format('DD MMM, hh:mm A') : 'Not recorded'}
                        </span>
                      </div>
                    </div>
                  </div></div>
                 
                 <div>
                   <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Actions</h4>
                   {focusedRoom.status === 'OCCUPIED' && focusedRoom.guestInfo ? (
                     <div className="space-y-3">
                       <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-[10px] text-emerald-800 font-medium">
                         Manual status change is locked while a guest is staying. Please use the check-out process.
                       </div>
                       <button 
                         onClick={() => router.push(`/dashboard/checkout?roomId=${focusedRoom.id}`)}
                         className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-black hover:bg-emerald-700 shadow-md transition-colors"
                       >
                         Check-Out Guest & Settle Bill
                       </button>
                     </div>
                   ) : (
                     <div className="grid grid-cols-2 gap-3">
                       <button onClick={() => router.push(`/dashboard/book?rooms=${focusedRoom.id}`)} className="py-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-bold hover:bg-emerald-100 shadow-sm">Check-in</button>
                       {focusedRoom.status === 'DIRTY' ? (
                         <button onClick={() => handleStatusChange(focusedRoom.id, 'AVAILABLE')} className="py-3 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl text-xs font-bold hover:bg-blue-100 shadow-sm">Set Clean</button>
                       ) : focusedRoom.status === 'OCCUPIED' ? (
                         <button onClick={() => handleStatusChange(focusedRoom.id, 'AVAILABLE')} className="py-3 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl text-xs font-bold hover:bg-blue-100 shadow-sm">Set Available</button>
                       ) : (
                         <button onClick={() => handleStatusChange(focusedRoom.id, 'DIRTY')} className="py-3 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-xs font-bold hover:bg-rose-100 shadow-sm">Set Dirty</button>
                       )}
                       {focusedRoom.status === 'BLOCKED' ? (
                         <button onClick={() => handleStatusChange(focusedRoom.id, 'AVAILABLE')} className="py-3 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 shadow-sm col-span-2">Unblock Room</button>
                       ) : focusedRoom.status === 'MAINTENANCE' ? (
                         <button onClick={() => handleStatusChange(focusedRoom.id, 'AVAILABLE')} className="py-3 bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold hover:bg-amber-200 shadow-sm col-span-2">Set Available</button>
                       ) : (
                         <>
                           <button onClick={() => handleStatusChange(focusedRoom.id, 'BLOCKED')} className="py-3 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 shadow-sm">Block Room</button>
                           <button onClick={() => handleStatusChange(focusedRoom.id, 'MAINTENANCE')} className="py-3 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl text-xs font-bold hover:bg-amber-100 shadow-sm">Set Maintenance</button>
                         </>
                       )}
                       <button 
                         onClick={() => {
                           const floor = data.floors.find(f => f.rooms.some(r => r.id === focusedRoom.id));
                           if (floor) {
                             openEditRoom(focusedRoom, floor.id);
                           }
                         }} 
                         className="py-3 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-xs font-bold hover:bg-indigo-100 shadow-sm"
                       >
                         Edit Room
                       </button>
                       <button 
                         onClick={() => handleDeleteRoom(focusedRoom.id, focusedRoom.status, !!focusedRoom.guestInfo)} 
                         className="py-3 bg-rose-600 text-white border border-rose-700 rounded-xl text-xs font-bold hover:bg-rose-700 shadow-sm"
                       >
                         Delete Room
                       </button>
                     </div>
                   )}
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
      </div>

      {/* Add Floor Modal */}
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

       {/* Edit Floor Modal */}
       {isEditFloorOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
               <form onSubmit={handleEditFloor} className="p-6">
                  <h2 className="text-lg font-bold mb-4">Edit Floor</h2>
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
                     <button type="button" onClick={() => { setIsEditFloorOpen(false); setEditingFloor(null); setNewFloorName(""); }} className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50">Cancel</button>
                     <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800">Save Changes</button>
                  </div>
               </form>
            </div>
         </div>
       )}

      {/* Add Room Modal */}
      {isAddRoomOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 px-7 py-5 shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Hotel size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">{editingRoomId ? 'Edit Room' : 'Add New Room'}</h2>
                  <p className="mt-0.5 text-sm text-slate-500">{editingRoomId ? 'Update room details and configuration' : 'Create a room and configure its details'}</p>
                </div>
              </div>
              <button
                onClick={() => { setIsAddRoomOpen(false); resetRoomForm(); }}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={21} />
              </button>
            </div>

            {/* BODY */}
            <div className="overflow-y-auto p-7">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                
                {/* LEFT */}
                <div className="space-y-6">
                  
                  {/* ROOM DETAILS */}
                  <section className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <Hotel size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Room Details</h3>
                        <p className="mt-0.5 text-xs text-slate-500">Basic information about the room</p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-5">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Select Floor <span className="ml-1 text-red-500">*</span></label>
                        <div className="relative">
                          <select 
                            value={newRoomFloorId}
                            onChange={(e) => setNewRoomFloorId(e.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 pr-10 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 appearance-none"
                            required
                          >
                            <option value="" disabled>Choose a floor</option>
                            {data.floors.map(f => (
                              <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                          </select>
                          <ChevronDown size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-slate-700">Room Number <span className="ml-1 text-red-500">*</span></label>
                          <input 
                            type="text" 
                            value={newRoomNumber}
                            onChange={(e) => setNewRoomNumber(e.target.value)}
                            placeholder="e.g. 301" 
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                            required
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-slate-700">Room Type <span className="ml-1 text-red-500">*</span></label>
                          <div className="relative">
                            <select
                              value={newRoomType}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "__add") {
                                  setIsAddRoomTypeOpen(true);
                                } else {
                                  setNewRoomType(val);
                                }
                              }}
                              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 pr-10 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 appearance-none"
                            >
                              <option>Standard</option>
                              <option>Deluxe</option>
                              <option>Suite</option>
                              {roomTypes.filter(rt => !['Standard','Deluxe','Suite'].includes(rt.name)).map(rt => (
                                <option key={rt.id} value={rt.name}>{rt.name}</option>
                              ))}
                              <option value="__add">+ Add Room Type</option>
                            </select>
                            <ChevronDown size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                {/* Add Room Type Modal */}
                {isAddRoomTypeOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setIsAddRoomTypeOpen(false)}>
                    <div className="bg-white rounded-xl p-6 w-80 shadow-lg" onClick={e => e.stopPropagation()}>
                      <h2 className="text-lg font-bold mb-4">Add Room Type</h2>
                      <input
                        type="text"
                        value={newRoomTypeName}
                        onChange={e => setNewRoomTypeName(e.target.value)}
                        placeholder="Enter room type name"
                        className="w-full border border-gray-300 rounded p-2 mb-4"
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          className="px-3 py-1 bg-gray-200 rounded"
                          onClick={() => {
                            setIsAddRoomTypeOpen(false);
                            setNewRoomTypeName('');
                          }}
                        >Cancel</button>
                        <button
                          className="px-3 py-1 bg-blue-600 text-white rounded"
                          onClick={async () => {
                            const name = newRoomTypeName.trim();
                            if (!name) { alert('Name is required'); return; }
                            // Duplicate check (case‑insensitive)
                            if (roomTypes.some(rt => rt.name.toLowerCase() === name.toLowerCase())) {
                              alert('Room type already exists');
                              return;
                            }
                            try {
                              const res = await fetch('/api/hotel/room-types', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ name, basePrice: 1500 }) // default price
                              });
                              if (!res.ok) {
                                const err = await res.json();
                                alert(err.error || 'Failed to add room type');
                                return;
                              }
                              const created = await res.json();
                              setRoomTypes(prev => [...prev, created]);
                              setNewRoomType(name);
                              setIsAddRoomTypeOpen(false);
                              setNewRoomTypeName('');
                            } catch (e) {
                              console.error(e);
                              alert('Network error');
                            }
                          }}
                        >Save</button>
                      </div>
                    </div>
                  </div>
                )}

                  {/* CAPACITY + PRICE */}
                  <section className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <Users size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Capacity & Pricing</h3>
                        <p className="mt-0.5 text-xs text-slate-500">Set occupancy and room rate</p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Capacity</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            min="1"
                            value={newRoomCapacity}
                            onChange={(e) => setNewRoomCapacity(parseInt(e.target.value) || 1)}
                            placeholder="2" 
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-3.5 pr-16 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                            required
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">Guests</span>
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Base Price</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">₹</span>
                          <input 
                            type="number" 
                            min="0"
                            value={newRoomPrice}
                            onChange={(e) => setNewRoomPrice(parseInt(e.target.value) || 0)}
                            placeholder="1500" 
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-16 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                            required
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">/ night</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* STATUS */}
                  <section className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <UserRound size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Status & Management</h3>
                        <p className="mt-0.5 text-xs text-slate-500">Room availability and assignment</p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Initial Status</label>
                        <div className="relative">
                          <select 
                            value={newRoomStatus}
                            onChange={(e) => setNewRoomStatus(e.target.value as RoomStatus)}
                            disabled={editingRoomId !== null && editingRoomHasGuest}
                            className={`h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 pr-10 text-sm text-slate-900 outline-none transition appearance-none ${editingRoomId && editingRoomHasGuest ? 'opacity-60 cursor-not-allowed' : 'hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10'}`}
                          >
                            <option value="AVAILABLE">Available</option>

                            <option value="OCCUPIED">Occupied</option>
                            <option value="DIRTY">Dirty</option>
                            <option value="MAINTENANCE">Maintenance</option>
                            <option value="BLOCKED">Blocked</option>
                          </select>
                          <ChevronDown size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Assigned Cleaner</label>
                        <div className="relative">
                          <select 
                            value={newRoomStaff}
                            onChange={(e) => setNewRoomStaff(e.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 pr-10 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 appearance-none text-slate-500"
                          >
                            <option value="">Unassigned</option>
                            <option value="Ramesh">Ramesh (HK)</option>
                            <option value="Sita">Sita (HK)</option>
                          </select>
                          <ChevronDown size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* RIGHT */}
                <div className="space-y-6">
                  
                  {/* AMENITIES */}
                  <section className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <Snowflake size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Amenities & Features</h3>
                        <p className="mt-0.5 text-xs text-slate-500">Select everything included</p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-2">
                      {[
                        { id: 'AC / Heater', icon: <Snowflake size={18} /> },
                        { id: 'Wi-Fi', icon: <Wifi size={18} /> },
                        { id: 'TV', icon: <Tv size={18} /> },
                        { id: 'Attached Bathroom / Geyser', icon: <Bath size={18} /> },
                        { id: 'Balcony View', icon: <Mountain size={18} /> },
                      ].map((amenity) => {
                        const selected = newRoomAmenities.includes(amenity.id);
                        return (
                          <button
                            type="button"
                            key={amenity.id}
                            onClick={() => toggleAmenity(amenity.id)}
                            className={`group flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                              selected
                                ? "border-indigo-200 bg-indigo-50"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                                  selected ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {amenity.icon}
                              </div>
                              <span className={`text-sm font-medium ${selected ? "text-indigo-900" : "text-slate-700"}`}>
                                {amenity.id}
                              </span>
                            </div>
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                                selected ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white"
                              }`}
                            >
                              {selected && <Check size={13} strokeWidth={3} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  {/* DESCRIPTION */}
                  <section className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <Hotel size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Additional Details</h3>
                        <p className="mt-0.5 text-xs text-slate-500">Optional notes about this room</p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Description / Notes</label>
                      <textarea
                        rows={6}
                        value={newRoomNotes}
                        onChange={(e) => setNewRoomNotes(e.target.value)}
                        placeholder="e.g. Corner room with a great view..."
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                      />
                    </div>
                  </section>

                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-7 py-4 shrink-0">
              <p className="hidden text-xs text-slate-400 sm:block">
                Fields marked with <span className="text-red-500">*</span> are required
              </p>
              <div className="ml-auto flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { setIsAddRoomOpen(false); resetRoomForm(); }}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRoom}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-[0.98]"
                >
                  <Check size={17} />
                  {editingRoomId ? 'Update Room' : 'Save Room'}
                </button>
              </div>
            </div>
            
          </div>
        </div>
      )}
      
      {focusedRoom && (
        <GuestDetailsModal 
          isOpen={isGuestModalOpen} 
          onClose={() => setIsGuestModalOpen(false)} 
          room={focusedRoom} 
        />
      )}
</div>
  );
}

export default function RoomDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F7F8FC] text-gray-500 font-bold">Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
