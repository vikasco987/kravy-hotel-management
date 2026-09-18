"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock3, Building2, Sparkles, Plus, Wrench, CircleCheck, BedDouble, Droplets, X, ChevronRight } from "lucide-react";


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


const STATUS: Record<string, any> = {
  AVAILABLE: {
    label: "Available",
    shortLabel: "Available",
    icon: Check,
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    strongBg: "bg-emerald-500",
    ring: "ring-emerald-200",
  },
  OCCUPIED: {
    label: "Occupied",
    shortLabel: "Occupied",
    icon: BedDouble,
    dot: "bg-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    strongBg: "bg-blue-500",
    ring: "ring-blue-200",
  },
  DIRTY: {
    label: "Dirty",
    shortLabel: "Dirty",
    icon: Droplets,
    dot: "bg-red-500",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    strongBg: "bg-red-500",
    ring: "ring-red-200",
  },
  MAINTENANCE: {
    label: "Maintenance",
    shortLabel: "Maintenance",
    icon: Wrench,
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    strongBg: "bg-amber-500",
    ring: "ring-amber-200",
  },
  BLOCKED: {
    label: "Blocked",
    shortLabel: "Blocked",
    icon: X,
    dot: "bg-slate-500",
    bg: "bg-slate-100",
    border: "border-slate-200",
    text: "text-slate-700",
    strongBg: "bg-slate-500",
    ring: "ring-slate-200",
  },
  RESERVED: {
    label: "Reserved",
    shortLabel: "Rsrvd",
    icon: Clock3,
    dot: "bg-purple-500",
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
    strongBg: "bg-purple-500",
    ring: "ring-purple-200",
  },
  CLEANING: {
    label: "Cleaning",
    shortLabel: "Clean",
    icon: Sparkles,
    dot: "bg-yellow-500",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-700",
    strongBg: "bg-yellow-500",
    ring: "ring-yellow-200",
  },
  INSPECTED: {
    label: "Inspected",
    shortLabel: "Insp",
    icon: Check,
    dot: "bg-teal-500",
    bg: "bg-teal-50",
    border: "border-teal-200",
    text: "text-teal-700",
    strongBg: "bg-teal-500",
    ring: "ring-teal-200",
  }
};


const statusLabels: Record<string, string> = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  DIRTY: "Dirty",
  MAINTENANCE: "Maintenance",
  BLOCKED: "Blocked",
  CLEANING: "Cleaning",
  INSPECTED: "Inspected",
  RESERVED: "Reserved",
};



function FilterBadge({ label, count, color, dot, isActive, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ${
        isActive ? 'ring-2 ring-offset-2 ring-gray-200 opacity-100' : 'opacity-80 hover:opacity-100'
      } ${color}`}
    >
      {dot && <div className={`w-2 h-2 rounded-full ${dot}`}></div>}
      {label}
      <span className="ml-1 bg-white/50 px-2 py-0.5 rounded-full text-[11px] text-gray-700">{count}</span>
    </button>
  );
}

function FloorRow({ floor, handleToggleRoom, selectedRooms }: any) {
  const availableCount = floor.rooms.filter((r: any) => r.status === 'AVAILABLE').length;

  return (
    <div className="flex bg-white rounded-2xl border border-gray-100 p-3 items-center shadow-sm">
      <div className="flex items-center w-[160px] shrink-0 border-r border-gray-100 mr-4 pr-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl mr-3 bg-gradient-to-br from-emerald-100 to-green-50 text-green-900">
          {floor.name.replace('Floor ', '0').replace('Ground', '00')}
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-sm text-gray-800">{floor.name}</span>
          <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full mt-1 w-fit">{floor.rooms.length} rooms</span>
        </div>
      </div>

      <div className="flex-1 flex flex-wrap gap-3">
        {floor.rooms.map((room: any) => {
          const isSelected = selectedRooms.includes(room.id);
          const statusLower = room.status.toLowerCase();
          
          let colorClass = 'bg-gray-50 text-gray-700 border-gray-200';
          let dotColor = 'bg-gray-400';
          
          if (statusLower === 'available') {
            colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-300';
            dotColor = 'bg-emerald-500';
          } else if (statusLower === 'occupied') {
            colorClass = 'bg-blue-50 text-blue-800 border-transparent';
            dotColor = 'bg-blue-500';
          } else if (statusLower === 'dirty') {
            colorClass = 'bg-red-50 text-red-800 border-transparent';
            dotColor = 'bg-red-500';
          } else if (statusLower === 'maintenance') {
            colorClass = 'bg-orange-50 text-orange-800 border-transparent';
            dotColor = 'bg-orange-500';
          } else if (statusLower === 'blocked') {
            colorClass = 'bg-slate-100 text-slate-800 border-transparent';
            dotColor = 'bg-slate-500';
          } else if (statusLower === 'cleaning') {
             colorClass = 'bg-yellow-50 text-yellow-800 border-transparent';
             dotColor = 'bg-yellow-500';
          }

          return (
            <div 
              key={room.id}
              onClick={() => handleToggleRoom(room.id)}
              className={`relative px-6 py-2.5 min-w-[70px] flex items-center justify-center rounded-xl border cursor-pointer font-extrabold text-base transition-all ${colorClass} ${
                isSelected ? 'ring-2 ring-indigo-500 shadow-md scale-105 z-10' : 'hover:scale-[1.02]'
              }`}
            >
              {isSelected && (
                <div className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white rounded-full p-0.5 shadow-sm z-20">
                  <Check size={10} strokeWidth={4} />
                </div>
              )}
              {room.number}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-100 shrink-0">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold border border-emerald-100">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
           {availableCount} Available
        </div>
        <ChevronRight size={18} className="text-gray-400" />
      </div>
    </div>
  );
}

export default function RoomDashboard() {




  const [data, setData] = useState<DashboardData | null>(null);
  const [filter, setFilter] = useState("ALL");
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const router = useRouter();

  const [quickStatusRoomId, setQuickStatusRoomId] = useState<string>('');
  const [isStatusChanging, setIsStatusChanging] = useState(false);
  const [statusModalRoom, setStatusModalRoom] = useState<any | null>(null);


  const handleToggleRoom = (roomId: string) => {
    setSelectedRooms(prev => 
      prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
    );
  };


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


  // Derived Data
  const totalRooms = data ? Object.values(data.rooms).reduce((a: any, b: any) => a + b, 0) : 0;
  
  if (!data) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

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


      </div>
      <div className="bg-white p-6 mt-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-3 flex-wrap">
             <FilterBadge label="All" count={totalRooms} color="bg-indigo-500 text-white" isActive={filter === 'ALL'} onClick={() => setFilter('ALL')} />
             <FilterBadge label="Available" count={data.rooms.available||0} color="bg-emerald-50 text-emerald-800 border border-emerald-100" dot="bg-emerald-500" isActive={filter === 'AVAILABLE'} onClick={() => setFilter('AVAILABLE')} />
             <FilterBadge label="Occupied" count={data.rooms.occupied||0} color="bg-blue-50 text-blue-800 border border-blue-100" dot="bg-blue-500" isActive={filter === 'OCCUPIED'} onClick={() => setFilter('OCCUPIED')} />
             <FilterBadge label="Dirty" count={data.rooms.dirty||0} color="bg-red-50 text-red-800 border border-red-100" dot="bg-red-500" isActive={filter === 'DIRTY'} onClick={() => setFilter('DIRTY')} />
             <FilterBadge label="Maintenance" count={data.rooms.maintenance||0} color="bg-orange-50 text-orange-800 border border-orange-100" dot="bg-orange-500" isActive={filter === 'MAINTENANCE'} onClick={() => setFilter('MAINTENANCE')} />
             <FilterBadge label="Blocked" count={data.rooms.blocked||0} color="bg-gray-100 text-gray-800 border border-gray-200" dot="bg-gray-500" isActive={filter === 'BLOCKED'} onClick={() => setFilter('BLOCKED')} />
          </div>
          <div className="flex gap-3">
            {selectedRooms.length > 0 && (
              <button 
                onClick={() => router.push('/dashboard/book?rooms=' + selectedRooms.join(','))}
                className="px-5 py-2.5 bg-[#ea580c] text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm hover:bg-[#c2410c] transition-colors"
              >
                 Book Selected ({selectedRooms.length})
              </button>
            )}
            <button onClick={() => setIsAddRoomOpen(true)} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-50">
              <Plus size={16} /> Add Room
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {data.floors.map((floor) => {
            const visibleRooms = filter === 'ALL' ? floor.rooms : floor.rooms.filter((r: any) => r.status === filter);
            if (visibleRooms.length === 0) return null;
            return (
              <FloorRow 
                key={floor.id} 
                floor={{...floor, rooms: visibleRooms}} 
                selectedRooms={selectedRooms} 
                handleToggleRoom={handleToggleRoom} 
              />
            );
          })}
        </div>
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
    </>
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

