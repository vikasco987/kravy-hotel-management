'use client';

import React, { useState, useEffect } from 'react';

type RoomStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'DIRTY' | 'CLEANING' | 'MAINTENANCE' | 'BLOCKED';

interface Room {
  id: string;
  roomNumber: string;
  status: RoomStatus;
  roomType: string;
  price: number;
}

interface Floor {
  id: string;
  name: string;
  floorNumber: number;
  rooms: Room[];
}

interface RoomType {
  id: string;
  name: string;
  basePrice: number;
}

interface DashboardSummary {
  totalRooms: number;
  available: number;
  reserved: number;
  occupied: number;
  dirty: number;
  cleaning: number;
  maintenance: number;
  blocked: number;
  occupancyPercent: number;
}

interface DashboardData {
  summary: DashboardSummary;
  floors: Floor[];
}

const statusColors: Record<RoomStatus, string> = {
  AVAILABLE: 'bg-[#2A7E55] text-white',
  RESERVED: 'bg-yellow-500 text-white',
  OCCUPIED: 'bg-[#4B6EFF] text-white',
  DIRTY: 'bg-[#F04444] text-white',
  CLEANING: 'bg-teal-500 text-white',
  MAINTENANCE: 'bg-[#F39C48] text-white',
  BLOCKED: 'bg-[#6C757D] text-white',
};

const validStatuses: RoomStatus[] = ['AVAILABLE', 'RESERVED', 'OCCUPIED', 'DIRTY', 'CLEANING', 'MAINTENANCE', 'BLOCKED'];

export default function HotelDashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<RoomStatus | 'ALL'>('ALL');

  // Modals state
  const [showAddFloor, setShowAddFloor] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAddRoomType, setShowAddRoomType] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Status update state
  const [updatingRoomId, setUpdatingRoomId] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, rtRes] = await Promise.all([
        fetch('/api/hotel/dashboard'),
        fetch('/api/hotel/room-types')
      ]);
      if (!dashRes.ok) throw new Error('Failed to fetch dashboard data');
      const dashData = await dashRes.json();
      setData(dashData);

      if (rtRes.ok) {
        setRoomTypes(await rtRes.json());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboardQuietly = async () => {
    try {
      const res = await fetch('/api/hotel/dashboard');
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error('Quiet refresh failed', e);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboard();
  }, []);

  const handleAddFloor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const floorNumber = formData.get('floorNumber') as string;

    try {
      const res = await fetch('/api/hotel/floors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, floorNumber })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add floor');
      }
      await refreshDashboardQuietly();
      setShowAddFloor(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    
    try {
      const res = await fetch('/api/hotel/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomNumber: formData.get('roomNumber'),
          floorId: formData.get('floorId'),
          roomTypeId: formData.get('roomTypeId'),
          status: formData.get('status')
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add room');
      }
      await refreshDashboardQuietly();
      setShowAddRoom(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddRoomType = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    
    try {
      const res = await fetch('/api/hotel/room-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          basePrice: Math.round(Number(formData.get('basePrice')) * 100)
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add room type');
      }
      await fetchDashboard();
      setShowAddRoomType(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (roomId: string, newStatus: string) => {
    setUpdatingRoomId(roomId);
    try {
      const res = await fetch(`/api/hotel/rooms/${roomId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Status update failed');
      await refreshDashboardQuietly();
    } catch (err) {
      console.error(err);
      alert('Failed to update room status.');
    } finally {
      setUpdatingRoomId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Loading Kravy Hotel Dashboard...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        <p className="mb-4">Error: {error}</p>
        <button onClick={fetchDashboard} className="px-4 py-2 bg-black text-white rounded">Retry</button>
      </div>
    );
  }

  if (!data) return null;

  const { summary, floors } = data;

  const filters = [
    { label: 'ALL', value: 'ALL', count: summary.totalRooms },
    { label: 'AVAILABLE', value: 'AVAILABLE', count: summary.available },
    { label: 'RESERVED', value: 'RESERVED', count: summary.reserved },
    { label: 'OCCUPIED', value: 'OCCUPIED', count: summary.occupied },
    { label: 'DIRTY', value: 'DIRTY', count: summary.dirty },
    { label: 'CLEANING', value: 'CLEANING', count: summary.cleaning },
    { label: 'MAINTENANCE', value: 'MAINTENANCE', count: summary.maintenance },
    { label: 'BLOCKED', value: 'BLOCKED', count: summary.blocked },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Kravy Hotel Operations</h1>
          <div className="flex gap-3">
            <button onClick={() => setShowAddRoomType(true)} className="px-4 py-2 bg-white border shadow-sm rounded-lg hover:bg-gray-50 font-medium">+ Add Category</button>
            <button onClick={() => setShowAddFloor(true)} className="px-4 py-2 bg-white border shadow-sm rounded-lg hover:bg-gray-50 font-medium">+ Add Floor</button>
            <button onClick={() => setShowAddRoom(true)} className="px-4 py-2 bg-blue-600 text-white shadow-sm rounded-lg hover:bg-blue-700 font-medium">+ Add Room</button>
          </div>
        </header>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
          {['Check-in', 'Check-out', 'Reservations', 'Housekeeping', 'Restaurant', 'Reports'].map((action) => (
            <div key={action} className="bg-white p-3 rounded-xl shadow-sm border text-center cursor-not-allowed opacity-60">
              <span className="text-sm font-medium text-gray-700">{action}</span>
            </div>
          ))}
        </div>

        {/* Dashboard Summary & Donut Chart Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="col-span-1 bg-white p-6 rounded-2xl shadow-sm border flex flex-col items-center justify-center min-h-[220px]">
            <div className="w-32 h-32 rounded-full border-8 border-gray-100 flex items-center justify-center relative mb-4">
               {/* Simplified visual representation for the donut */}
               <div 
                 className="absolute w-full h-full rounded-full border-8 border-blue-600" 
                 style={{ clipPath: `polygon(50% 50%, 50% 0, ${summary.occupancyPercent > 50 ? '100% 0, 100% 100%, 0 100%, 0 0' : '100% 0, 100% 100%'})` }}
               ></div>
               <div className="text-center z-10 bg-white w-24 h-24 rounded-full flex flex-col items-center justify-center">
                 <div className="text-2xl font-bold">{summary.occupancyPercent}%</div>
                 <div className="text-xs text-gray-500">Occupancy</div>
               </div>
            </div>
            <div className="text-center font-medium text-gray-800">Total Rooms: {summary.totalRooms}</div>
          </div>
          
          <div className="col-span-1 lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border grid grid-cols-2 sm:grid-cols-4 gap-4">
             {filters.slice(1).map(f => (
               <div key={f.value} className="flex flex-col">
                 <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{f.label}</span>
                 <span className="text-2xl font-semibold text-gray-900">{f.count}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {filters.map(filter => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value as RoomStatus | 'ALL')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeFilter === filter.value 
                  ? 'bg-gray-900 text-white shadow-md' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border'
              }`}
            >
              {filter.label} <span className="opacity-70 ml-1">({filter.count})</span>
            </button>
          ))}
        </div>

        {/* Floors and Rooms */}
        {floors.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border">
            <h2 className="text-xl font-bold mb-2">No Hotel Data Found</h2>
            <p className="text-gray-500 mb-4">Please add a floor and rooms to get started.</p>
            <button onClick={() => setShowAddFloor(true)} className="px-4 py-2 bg-blue-600 text-white rounded">Add Floor</button>
          </div>
        ) : (
          <div className="space-y-8">
            {floors.map(floor => {
              const visibleRooms = activeFilter === 'ALL' 
                ? floor.rooms 
                : floor.rooms.filter(r => r.status === activeFilter);
              
              if (visibleRooms.length === 0) return null;

              return (
                <div key={floor.id} className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 tracking-tight border-b pb-2">{floor.name}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {visibleRooms.map(room => (
                      <div 
                        key={room.id} 
                        className={`group relative border rounded-xl overflow-hidden hover:shadow-md transition-all ${updatingRoomId === room.id ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <div className={`h-2 w-full ${statusColors[room.status].split(' ')[0]}`}></div>
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xl font-bold text-gray-900">{room.roomNumber}</span>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider ${statusColors[room.status]}`}>
                              {room.status}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 font-medium">{room.roomType}</div>
                          <div className="text-sm font-semibold text-gray-900 mt-1">₹{(room.price / 100).toFixed(2)}</div>
                          
                          {/* Status Update Dropdown Trigger */}
                          <div className="mt-3 pt-3 border-t">
                            <select 
                              className="text-xs bg-gray-50 border rounded w-full p-1"
                              value={room.status}
                              onChange={(e) => handleStatusUpdate(room.id, e.target.value)}
                            >
                              {validStatuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {floors.every(f => f.rooms.filter(r => activeFilter === 'ALL' || r.status === activeFilter).length === 0) && (
              <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border">
                No rooms match the selected filter.
              </div>
            )}
          </div>
        )}

        {/* Add Floor Modal */}
        {showAddFloor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-lg font-bold">Add Floor</h2>
              </div>
              <form onSubmit={handleAddFloor} className="p-4">
                {formError && <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded border border-red-100">{formError}</div>}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Floor Name (e.g. 1st Floor)</label>
                    <input name="name" required className="w-full border rounded-lg p-2" placeholder="3rd Floor" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Floor Number</label>
                    <input name="floorNumber" type="number" required className="w-full border rounded-lg p-2" placeholder="3" />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAddFloor(false)} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {submitting ? 'Saving...' : 'Add Floor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Room Type Modal */}
        {showAddRoomType && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-lg font-bold">Add Room Category</h2>
              </div>
              <form onSubmit={handleAddRoomType} className="p-4">
                {formError && <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded border border-red-100">{formError}</div>}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category Name (e.g. Deluxe, Suite)</label>
                    <input name="name" required className="w-full border rounded-lg p-2" placeholder="Super Deluxe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (₹ per night)</label>
                    <input name="basePrice" type="number" step="0.01" min="0" required className="w-full border rounded-lg p-2" placeholder="2500" />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAddRoomType(false)} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {submitting ? 'Saving...' : 'Add Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Room Modal */}
        {showAddRoom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-lg font-bold">Add Room</h2>
              </div>
              <form onSubmit={handleAddRoom} className="p-4">
                {formError && <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded border border-red-100">{formError}</div>}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                    <input name="roomNumber" required className="w-full border rounded-lg p-2" placeholder="301" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                    <select name="floorId" required className="w-full border rounded-lg p-2">
                      <option value="">Select Floor</option>
                      {floors.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                    <select name="roomTypeId" required className="w-full border rounded-lg p-2">
                      <option value="">Select Type</option>
                      {roomTypes.map(rt => (
                        <option key={rt.id} value={rt.id}>{rt.name} (₹{(rt.basePrice / 100).toFixed(2)})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Initial Status</label>
                    <select name="status" required className="w-full border rounded-lg p-2">
                      {validStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAddRoom(false)} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {submitting ? 'Saving...' : 'Add Room'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
