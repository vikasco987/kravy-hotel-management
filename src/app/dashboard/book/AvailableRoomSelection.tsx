import React, { useState, useEffect } from 'react';
import { useBookingStore } from '@/lib/bookingContext';
import { BedDouble, Check, CalendarDays, Loader2, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AvailableRoomSelection({ onComplete, initialRooms = [] }: { onComplete: (roomIds: string[]) => void, initialRooms?: string[] }) {
    const { checkInDate, checkOutDate, roomPricing } = useBookingStore();
    const router = useRouter();
    const [availableRooms, setAvailableRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>(initialRooms.length > 0 ? initialRooms : Object.keys(roomPricing || {}));
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetch(`/api/hotel/rooms/available?checkIn=${checkInDate}&checkOut=${checkOutDate}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Filter down to only genuinely 'AVAILABLE' status rooms as requested
                    const strictlyAvailable = data.availableRooms.filter((r: any) => r.status === 'AVAILABLE');
                    setAvailableRooms(strictlyAvailable);
                } else {
                    setError(data.error || 'Failed to load available rooms');
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [checkInDate, checkOutDate]);

    const handleToggleRoom = (roomId: string) => {
        setSelectedRoomIds(prev =>
            prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
        );
    };

    const handleContinue = () => {
        if (selectedRoomIds.length > 0) {
            onComplete(selectedRoomIds);
        }
    };

    const filteredRooms = availableRooms.filter(r => 
        (r.roomNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (r.roomType?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group by floor
    const floors = Array.from(new Set(filteredRooms.map(r => r.floor?.name || 'Other')));

    return (
        <div className="flex-1 flex flex-col bg-[#f8fafc] overflow-hidden">
            {/* HEADER */}
            <div className="bg-white px-8 py-5 border-b border-gray-200 shrink-0 shadow-sm z-10">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-[22px] font-black text-[#0f172a] tracking-tight">Select Available Rooms</h2>
                        <div className="flex items-center gap-2">
                            <CalendarDays size={14} className="text-indigo-500" />
                            <span className="text-[13px] font-bold text-gray-500">
                                {new Date(checkInDate).toLocaleDateString()} to {new Date(checkOutDate).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md ml-2">
                                {Math.max(1, Math.round((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 3600 * 24)))} Night{Math.max(1, Math.round((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 3600 * 24))) > 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search room number, type or floor..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-[13px] w-80 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium bg-[#f8fafc] focus:bg-white transition-colors"
                            />
                        </div>
                        <button 
                            onClick={handleContinue}
                            disabled={selectedRoomIds.length === 0}
                            className={`px-5 py-2.5 rounded-lg text-[14px] font-bold shadow-sm flex items-center gap-2 transition-all ${selectedRoomIds.length > 0 ? 'bg-[#00a859] hover:bg-[#009650] text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                        >
                            Continue ({selectedRoomIds.length}) <span className="ml-1 text-lg leading-none">›</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-6xl mx-auto space-y-5">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20 text-indigo-600">
                            <Loader2 className="animate-spin mb-4" size={32} />
                            <p className="font-bold text-gray-600">Finding available rooms...</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 text-red-600 p-6 rounded-xl font-bold border border-red-100 flex items-center gap-3 shadow-sm">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">!</div>
                            {error}
                        </div>
                    )}

                    {!loading && !error && availableRooms.length === 0 && (
                        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BedDouble size={32} className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 mb-2">No Rooms Available</h3>
                            <p className="text-gray-500 font-medium">There are no available rooms for the selected dates.</p>
                            <button onClick={() => router.push('/dashboard')} className="mt-6 px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors">
                                Return to Dashboard
                            </button>
                        </div>
                    )}

                    {!loading && !error && floors.map(floorName => {
                        const roomsInFloor = filteredRooms.filter(r => (r.floor?.name || 'Other') === floorName);
                        if (roomsInFloor.length === 0) return null;

                        // Create abbreviation like "F1" from "Floor 01"
                        const floorAbbr = floorName.replace(/[^0-9]/g, '');
                        const shortFloor = floorAbbr ? `F${floorAbbr}` : 'FL';

                        return (
                            <div key={floorName} className="bg-white rounded-[20px] border border-gray-100 shadow-sm flex flex-col md:flex-row overflow-hidden">
                                {/* Left Side: Floor Info */}
                                <div className="p-6 flex items-center gap-5 md:w-[260px] shrink-0 border-b md:border-b-0 md:border-r border-gray-100">
                                    <div className="flex flex-col items-center justify-center w-[52px] h-[52px] bg-[#eff6ff] rounded-xl shrink-0">
                                        <span className="text-[#2563eb] font-black text-[18px] leading-tight">{shortFloor}</span>
                                        <span className="text-[8px] font-bold text-[#60a5fa] tracking-wider uppercase">Floor</span>
                                    </div>
                                    <div>
                                        <h3 className="text-[18px] font-black text-slate-800 tracking-tight">{floorName}</h3>
                                        <div className="text-[13px] font-medium text-gray-400 mt-0.5">
                                            {roomsInFloor.length} rooms <span className="mx-1">•</span> <span className="text-[#16a34a] font-bold">{roomsInFloor.length} available</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Right Side: Rooms List */}
                                <div className="p-6 flex-1 flex flex-wrap gap-4 items-center bg-white">
                                    {roomsInFloor.map(room => {
                                        const isSelected = selectedRoomIds.includes(room.id);
                                        const price = (room.roomType?.basePrice || 0) / 100;
                                        
                                        return (
                                            <div 
                                                key={room.id}
                                                onClick={() => handleToggleRoom(room.id)}
                                                className={`relative cursor-pointer rounded-xl p-3 w-[95px] h-[105px] transition-all duration-200 border flex flex-col items-center justify-center text-center group bg-white ${isSelected ? 'border-[#6366f1] shadow-sm' : 'border-[#f1f5f9] hover:border-[#cbd5e1] shadow-sm hover:shadow'}`}
                                            >
                                                {isSelected && (
                                                    <div className="absolute -top-1.5 -right-1.5 bg-[#6366f1] text-white w-5 h-5 rounded-full flex items-center justify-center shadow-sm z-10">
                                                        <Check size={12} strokeWidth={4} />
                                                    </div>
                                                )}
                                                <span className={`text-[17px] font-black mb-1 leading-none ${isSelected ? 'text-slate-800' : 'text-slate-700'}`}>
                                                    {room.roomNumber}
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 truncate w-full">
                                                    {room.roomType?.name || 'Standard'}
                                                </span>
                                                <span className={`text-[13px] font-black tracking-tight mb-2.5 ${isSelected ? 'text-[#16a34a]' : 'text-[#16a34a]'}`}>
                                                    ₹{price.toLocaleString('en-IN')}
                                                </span>
                                                {/* Small dot indicator at the bottom */}
                                                <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#6366f1]' : 'bg-[#8b5cf6]'}`}></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
