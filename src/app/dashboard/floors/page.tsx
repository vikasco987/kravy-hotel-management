"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Building2,
  Plus,
  Search,
  MoreVertical,
  Layers,
  BedDouble,
  CheckCircle,
  Sparkles,
  Wrench,
  LockKeyhole,
  Edit2,
  Trash2,
  RefreshCw,
  Code,
  ArrowRight,
  DoorOpen
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { STATUS_COLORS } from "@/components/hotel/RoomComponents";
import { EditFloorModal } from "@/components/hotel/EditFloorModal";
import { AddRoomModal } from "@/components/hotel/AddRoomModal";
import { ApiJsonDebugger } from "@/components/ui/ApiJsonDebugger";

interface Room {
  id: string;
  roomNumber: string;
  status: string;
  housekeepingStatus?: string;
  roomType?: string;
  price?: number;
  guestInfo?: any;
}

interface Floor {
  id: string;
  floorNumber: number;
  name: string;
  rooms: Room[];
}

interface DashboardData {
  floors: Floor[];
  rooms: {
    total: number;
    available: number;
    occupied: number;
    dirty: number;
    maintenance: number;
    blocked: number;
  };
  isAdmin?: boolean;
}

export default function FloorsManagementPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddFloorOpen, setIsAddFloorOpen] = useState(false);
  const [newFloorName, setNewFloorName] = useState('');
  const [isSubmittingFloor, setIsSubmittingFloor] = useState(false);

  const [editingFloor, setEditingFloor] = useState<{ id: string; name: string } | null>(null);
  const [isEditFloorOpen, setIsEditFloorOpen] = useState(false);

  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [preselectedFloorId, setPreselectedFloorId] = useState<string | undefined>(undefined);

  const [floorToDelete, setFloorToDelete] = useState<Floor | null>(null);
  const [isDeletingFloor, setIsDeletingFloor] = useState(false);

  // Three-dot dropdown per floor
  const [openMenuFloorId, setOpenMenuFloorId] = useState<string | null>(null);

  // Debugger state
  const [apiRequests, setApiRequests] = useState<any[]>([]);
  const [isApiJsonOpen, setIsApiJsonOpen] = useState(false);

  const trackedFetch = useCallback(async (input: RequestInfo | URL, init?: RequestInit) => {
    const startTime = Date.now();
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method || 'GET';
    try {
      const response = await window.fetch(input, init);
      const cloned = response.clone();
      const status = response.status;
      const responseTimeMs = Date.now() - startTime;
      const text = await cloned.text();
      let d;
      try { d = JSON.parse(text); } catch { d = text; }

      setApiRequests(prev => [...prev, {
        url,
        method,
        status,
        responseTimeMs,
        timestamp: new Date().toISOString(),
        response: d
      }]);

      return response;
    } catch (e: any) {
      setApiRequests(prev => [...prev, {
        url,
        method,
        status: 'ERROR',
        responseTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        response: { error: String(e) }
      }]);
      throw e;
    }
  }, []);

  const fetchFloorsData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    setError(null);
    try {
      const res = await trackedFetch('/api/hotel/dashboard');
      if (!res.ok) {
        throw new Error(`Failed to fetch floors (HTTP ${res.status})`);
      }
      const fetchedData: DashboardData = await res.json();
      setData(fetchedData);
    } catch (err: any) {
      console.error('Error fetching floors data:', err);
      setError(err.message || 'Failed to load floors data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [trackedFetch]);

  useEffect(() => {
    fetchFloorsData();
  }, [fetchFloorsData]);

  // Close floor action menus on outside click
  useEffect(() => {
    const handleOutsideClick = () => setOpenMenuFloorId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Floor stats & metrics
  const floors = useMemo(() => data?.floors || [], [data]);

  const kpis = useMemo(() => {
    const totalFloors = floors.length;
    let totalRooms = 0;
    let availableRooms = 0;
    let emptyFloors = 0;

    floors.forEach(f => {
      const roomList = f.rooms || [];
      const count = roomList.length;
      totalRooms += count;
      if (count === 0) {
        emptyFloors++;
      } else {
        availableRooms += roomList.filter(r => r.status === 'AVAILABLE').length;
      }
    });

    return {
      totalFloors,
      totalRooms,
      availableRooms,
      emptyFloors
    };
  }, [floors]);

  // Filtered floors
  const filteredFloors = useMemo(() => {
    if (!searchQuery.trim()) return floors;
    const q = searchQuery.toLowerCase();
    return floors.filter(f =>
      (f.name || '').toLowerCase().includes(q) ||
      `floor ${f.floorNumber}`.toLowerCase().includes(q) ||
      (f.rooms || []).some(r => (r.roomNumber || '').toLowerCase().includes(q))
    );
  }, [floors, searchQuery]);

  // Handle Add Floor submission
  const handleAddFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFloorName.trim()) return;

    setIsSubmittingFloor(true);
    try {
      const res = await trackedFetch('/api/hotel/floors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFloorName.trim() })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Failed to create floor');
        return;
      }

      setNewFloorName('');
      setIsAddFloorOpen(false);
      await fetchFloorsData();
    } catch (err) {
      console.error('Error creating floor:', err);
      alert('Network error while creating floor');
    } finally {
      setIsSubmittingFloor(false);
    }
  };

  // Handle Delete Floor confirmation
  const handleDeleteFloor = async () => {
    if (!floorToDelete) return;

    if (floorToDelete.rooms && floorToDelete.rooms.length > 0) {
      alert("Cannot delete floor: There are rooms assigned to this floor. Please delete or move the rooms first.");
      setFloorToDelete(null);
      return;
    }

    setIsDeletingFloor(true);
    try {
      const res = await trackedFetch(`/api/hotel/floors/${floorToDelete.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Failed to delete floor');
        return;
      }

      setFloorToDelete(null);
      await fetchFloorsData();
    } catch (err) {
      console.error('Error deleting floor:', err);
      alert('Network error while deleting floor');
    } finally {
      setIsDeletingFloor(false);
    }
  };

  const handleOpenAddRoomForFloor = (floorId: string) => {
    setPreselectedFloorId(floorId);
    setIsAddRoomOpen(true);
  };

  const floorsForAddRoomModal = useMemo(() => {
    return floors.map(f => ({ id: f.id, name: f.name }));
  }, [floors]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-bold text-gray-500 bg-[#F4F6F9] gap-3">
        <RefreshCw size={28} className="animate-spin text-indigo-600" />
        <span className="text-sm font-semibold tracking-wide">Loading Floors & Capacity...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] font-sans pb-16">
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
              <span>Management</span>
              <span>&middot;</span>
              <span>Property Layout</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
              <Building2 className="text-indigo-600" size={28} />
              Floors & Capacity
            </h1>
            <p className="text-xs sm:text-sm font-medium text-gray-500 mt-1">
              Manage hotel levels, monitor room capacity, and assign room inventories.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsApiJsonOpen(true)}
              className="flex items-center gap-1.5 bg-slate-800 text-white hover:bg-slate-700 px-3.5 py-2.5 rounded-xl font-bold text-xs transition shadow-sm whitespace-nowrap"
            >
              <Code size={14} strokeWidth={2.5} />
              <span>API JSON</span>
            </button>

            <button
              onClick={() => router.push('/dashboard/rooms')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition whitespace-nowrap"
            >
              <DoorOpen size={14} />
              <span>Rooms View</span>
            </button>

            <button
              onClick={() => setIsAddFloorOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-md shadow-indigo-600/20 whitespace-nowrap"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Add Floor</span>
            </button>
          </div>
        </div>

        {/* ERROR BANNER */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between text-rose-700 text-xs font-semibold">
            <span>{error}</span>
            <button
              onClick={() => fetchFloorsData()}
              className="underline font-bold hover:text-rose-900 ml-4"
            >
              Try Again
            </button>
          </div>
        )}

        {/* TOP SUMMARY KPIS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 md:gap-4">
          <div className="bg-white border border-gray-200/90 rounded-2xl p-4.5 sm:p-5 shadow-sm flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
              <Layers size={22} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider truncate">Total Floors</div>
              <div className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">{kpis.totalFloors}</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200/90 rounded-2xl p-4.5 sm:p-5 shadow-sm flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <BedDouble size={22} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider truncate">Total Rooms</div>
              <div className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">{kpis.totalRooms}</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200/90 rounded-2xl p-4.5 sm:p-5 shadow-sm flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <CheckCircle size={22} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider truncate">Available Rooms</div>
              <div className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">{kpis.availableRooms}</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200/90 rounded-2xl p-4.5 sm:p-5 shadow-sm flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
              <Building2 size={22} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider truncate">Empty Floors</div>
              <div className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">{kpis.emptyFloors}</div>
            </div>
          </div>
        </div>

        {/* SEARCH AND CONTROLS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search floor name or room number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium text-gray-900"
            />
          </div>

          <div className="text-xs font-semibold text-gray-500 self-end sm:self-center">
            Showing <span className="font-bold text-gray-900">{filteredFloors.length}</span> of {floors.length} floors
          </div>
        </div>

        {/* FLOORS LIST */}
        <div className="space-y-4">
          {filteredFloors.map((floor, floorIndex) => {
            const roomList = floor.rooms || [];
            const roomCount = roomList.length;

            const counts = {
              available: roomList.filter(r => r.status === 'AVAILABLE').length,
              occupied: roomList.filter(r => r.status === 'OCCUPIED').length,
              dirty: roomList.filter(r => r.status === 'DIRTY').length,
              maintenance: roomList.filter(r => r.status === 'MAINTENANCE').length,
              blocked: roomList.filter(r => r.status === 'BLOCKED').length,
            };

            const sortedRooms = [...roomList].sort((a, b) => {
              const numA = String(a.roomNumber || '').trim();
              const numB = String(b.roomNumber || '').trim();
              return numA.localeCompare(numB, undefined, { numeric: true, sensitivity: 'base' });
            });

            const floorNum = floor.floorNumber || floorIndex + 1;
            const badgeText = `F${floorNum}`;
            const isMenuOpen = openMenuFloorId === floor.id;

            return (
              <div
                key={floor.id}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm transition hover:shadow-md"
              >
                {/* Floor Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3.5">
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-indigo-50/80 text-indigo-600 border border-indigo-100 shrink-0">
                      <span className="text-sm font-black leading-none">{badgeText}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400 mt-1">Floor</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-extrabold text-gray-900 tracking-tight">
                          {floor.name}
                        </h2>
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-gray-100 text-gray-600">
                          {roomCount} {roomCount === 1 ? 'room' : 'rooms'}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-gray-400 mt-0.5">
                        Floor Number: {floorNum}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Room Status Summary Chips */}
                  <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
                    {/* Status Breakdown Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {counts.available} Available
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        {counts.occupied} Occupied
                      </span>
                      {counts.dirty > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          {counts.dirty} Dirty
                        </span>
                      )}
                      {counts.maintenance > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          {counts.maintenance} Maint.
                        </span>
                      )}
                      {counts.blocked > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                          {counts.blocked} Blocked
                        </span>
                      )}
                    </div>

                    {/* Three-dot floor dropdown */}
                    <div className="relative shrink-0 ml-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuFloorId(isMenuOpen ? null : floor.id);
                        }}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-500 transition"
                        title="Floor actions"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {isMenuOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-9 w-44 bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden z-30 py-1"
                        >
                          <button
                            onClick={() => {
                              setOpenMenuFloorId(null);
                              setEditingFloor({ id: floor.id, name: floor.name });
                              setIsEditFloorOpen(true);
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                          >
                            <Edit2 size={13} />
                            <span>Edit Floor</span>
                          </button>

                          <button
                            onClick={() => {
                              setOpenMenuFloorId(null);
                              handleOpenAddRoomForFloor(floor.id);
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                          >
                            <Plus size={13} />
                            <span>Add Room</span>
                          </button>

                          <button
                            onClick={() => {
                              setOpenMenuFloorId(null);
                              router.push('/dashboard/rooms');
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                          >
                            <ArrowRight size={13} />
                            <span>View in Rooms</span>
                          </button>

                          <div className="border-t border-gray-100 my-1"></div>

                          <button
                            onClick={() => {
                              setOpenMenuFloorId(null);
                              if (roomCount > 0) {
                                alert("Cannot delete floor: There are active rooms assigned to this floor. Please remove or reassign the rooms first.");
                                return;
                              }
                              setFloorToDelete(floor);
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition flex items-center gap-2"
                          >
                            <Trash2 size={13} />
                            <span>Delete Floor</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rooms Container */}
                <div className="pt-4">
                  {roomCount === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-200 text-gray-500 flex items-center justify-center shrink-0">
                          <BedDouble size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-700">No rooms configured on {floor.name}</p>
                          <p className="text-[11px] text-gray-400">Add the first room or delete this empty level.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenAddRoomForFloor(floor.id)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition shrink-0"
                      >
                        <Plus size={13} strokeWidth={2.5} />
                        <span>Add Room to Floor</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3 items-center">
                      {sortedRooms.map(room => {
                        const config = STATUS_COLORS[room.status] || STATUS_COLORS.AVAILABLE;
                        const label = room.roomNumber || 'N/A';
                        return (
                          <div
                            key={room.id}
                            id={`room-${label}`}
                            onClick={() => router.push('/dashboard/rooms')}
                            title={`Room ${label} - ${config.label}\nClick to view in Rooms`}
                            className={`w-[78px] h-[52px] shrink-0 flex flex-col items-center justify-center rounded-[14px] cursor-pointer transition-all duration-200 border border-transparent hover:border-gray-200 hover:scale-[1.02] hover:-translate-y-0.5 shadow-xs ${config.bg} ${config.text}`}
                          >
                            <span className="font-extrabold text-[14px] tracking-tight leading-none">{label}</span>
                            <div className={`w-2 h-2 rounded-full mt-1.5 ${config.dot}`}></div>
                          </div>
                        );
                      })}

                      <button
                        onClick={() => handleOpenAddRoomForFloor(floor.id)}
                        title="Add another room to this floor"
                        className="w-[78px] h-[52px] shrink-0 rounded-[14px] border-2 border-dashed border-gray-200 text-gray-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/40 text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all"
                      >
                        <Plus size={16} strokeWidth={2.5} />
                        <span className="text-[10px] font-bold tracking-tight leading-none">Add Room</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* EMPTY SEARCH OR EMPTY STATE */}
          {filteredFloors.length === 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center text-center">
              <Building2 size={48} className="text-indigo-200 mb-4" />
              <h2 className="text-lg font-black text-gray-900 tracking-tight">
                {searchQuery ? 'No Matching Floors' : 'No Floors Configured'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1 mb-6 max-w-sm">
                {searchQuery
                  ? `No floors or rooms matched "${searchQuery}". Clear your search query to see all floors.`
                  : 'Get started by creating the first floor in your property.'}
              </p>
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition"
                >
                  Clear Search
                </button>
              ) : (
                <button
                  onClick={() => setIsAddFloorOpen(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:bg-indigo-700 transition"
                >
                  <Plus size={15} strokeWidth={2.5} />
                  <span>Create First Floor</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* FOOTER QUOTE */}
        <div className="text-center py-6 flex items-center justify-center gap-2 opacity-50">
          <span className="text-rose-400">♥</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            &ldquo;Great hospitality creates lasting memories.&rdquo;
          </span>
        </div>
      </div>

      {/* ADD FLOOR MODAL */}
      {isAddFloorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <form onSubmit={handleAddFloor} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Add New Floor</h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                  Step 1
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Floor Name
                  </label>
                  <input
                    type="text"
                    value={newFloorName}
                    onChange={(e) => setNewFloorName(e.target.value)}
                    placeholder="e.g. Ground Floor, 1st Floor, Executive Level"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                    autoFocus
                    disabled={isSubmittingFloor}
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Floor number will be assigned automatically based on property sequence.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setNewFloorName('');
                    setIsAddFloorOpen(false);
                  }}
                  disabled={isSubmittingFloor}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFloor || !newFloorName.trim()}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-sm disabled:opacity-50"
                >
                  {isSubmittingFloor ? 'Creating...' : 'Save Floor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT FLOOR MODAL (REUSED) */}
      <EditFloorModal
        isOpen={isEditFloorOpen}
        onClose={() => {
          setIsEditFloorOpen(false);
          setEditingFloor(null);
        }}
        floor={editingFloor}
        onSuccess={() => {
          fetchFloorsData();
        }}
      />

      {/* ADD ROOM MODAL (REUSED) */}
      <AddRoomModal
        isOpen={isAddRoomOpen}
        onClose={() => {
          setIsAddRoomOpen(false);
          setPreselectedFloorId(undefined);
        }}
        floors={floorsForAddRoomModal}
        initialData={preselectedFloorId ? { floorId: preselectedFloorId } : undefined}
        onSuccess={() => {
          fetchFloorsData();
        }}
      />

      {/* DELETE FLOOR CONFIRM MODAL */}
      {floorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">
              Delete Floor?
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 font-medium leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-900">{floorToDelete.name}</span>?
              This action cannot be undone. Only floors with 0 active rooms can be deleted.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFloorToDelete(null)}
                disabled={isDeletingFloor}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteFloor}
                disabled={isDeletingFloor}
                className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition shadow-sm disabled:opacity-50"
              >
                {isDeletingFloor ? 'Deleting...' : 'Delete Floor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API JSON DEBUGGER */}
      <ApiJsonDebugger
        apiRequests={apiRequests}
        isOpen={isApiJsonOpen}
        onClose={() => setIsApiJsonOpen(false)}
        onClear={() => setApiRequests([])}
      />
    </div>
  );
}
