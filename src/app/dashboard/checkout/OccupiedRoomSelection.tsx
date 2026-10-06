import React, { useState, useEffect } from 'react';
import { Check, Loader2, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OccupiedRoomSelection({ onComplete }: { onComplete: (roomIds: string[]) => void }) {
    const router = useRouter();
    const [occupiedRooms, setOccupiedRooms] = useState<any[]>([]);
    const [floors, setFloors] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetch(`/api/hotel/dashboard`)
            .then(res => res.json())
            .then(data => {
                if (data && data.floors) {
                    let occupied: any[] = [];
                    let floorNames: Set<string> = new Set();
                    
                    data.floors.forEach((floor: any) => {
                        const roomsInFloor = floor.rooms.filter((r: any) => r.status === 'OCCUPIED');
                        if (roomsInFloor.length > 0) {
                            floorNames.add(floor.name);
                            roomsInFloor.forEach((r: any) => {
                                occupied.push({
                                    ...r,
                                    floorName: floor.name
                                });
                            });
                        }
                    });
                    
                    setOccupiedRooms(occupied);
                    setFloors(Array.from(floorNames));
                } else {
                    setError('Failed to load dashboard data');
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

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

    const filteredRooms = occupiedRooms.filter(r => 
        (r.roomNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (r.roomType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.floorName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredFloors = Array.from(new Set(filteredRooms.map(r => r.floorName)));

    return (
        <div className="flex-1 flex flex-col bg-[#f8fafc] overflow-hidden min-h-screen">
            {/* HEADER */}
            <div className="bg-white px-8 py-5 border-b border-gray-200 shrink-0 shadow-sm z-10">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-[22px] font-black text-[#0f172a] tracking-tight">Select Occupied Rooms</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-[13px] font-bold text-gray-500">
                                Choose rooms ready for checkout
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
                            <p className="font-bold text-gray-600">Finding occupied rooms...</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 text-red-600 p-6 rounded-xl font-bold border border-red-100 flex items-center gap-3 shadow-sm">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">!</div>
                            {error}
                        </div>
                    )}

                    {!loading && !error && occupiedRooms.length === 0 && (
                        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
                            <h3 className="text-lg font-black text-gray-900 mb-2">No Occupied Rooms</h3>
                            <p className="text-gray-500 font-medium">There are currently no active stays or occupied rooms.</p>
                            <button onClick={() => router.push('/dashboard')} className="mt-6 px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors">
                                Return to Dashboard
                            </button>
                        </div>
                    )}

                    {!loading && !error && filteredFloors.map(floorName => {
                        const roomsInFloor = filteredRooms.filter(r => r.floorName === floorName);
                        if (roomsInFloor.length === 0) return null;

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
                                            {roomsInFloor.length} rooms <span className="mx-1">•</span> <span className="text-[#eab308] font-bold">{roomsInFloor.length} occupied</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Right Side: Rooms List */}
                                <div className="p-6 flex-1 flex flex-wrap gap-4 items-center bg-white">
                                    {roomsInFloor.map(room => {
                                        const isSelected = selectedRoomIds.includes(room.id);
                                        const actualPrice = room.guestInfo?.roomRate || room.price || 0;
                                        const priceInRupees = actualPrice / 100;
                                        
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
                                                    {room.roomType || 'Standard'}
                                                </span>
                                                <span className={`text-[13px] font-black tracking-tight mb-2.5 ${isSelected ? 'text-[#eab308]' : 'text-gray-500'}`}>
                                                    ₹{priceInRupees.toLocaleString('en-IN')}
                                                </span>
                                                <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#6366f1]' : 'bg-gray-300'}`}></div>
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
