"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Plus, 
  RefreshCw,
  Info
} from 'lucide-react';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Room {
  id: string;
  roomNumber: string;
  roomType: string;
}

interface Block {
  reservationId: string;
  reservationNumber: number;
  guestName: string;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  status: string;
  totalAmount: number;
  advancePaid: number;
  guestsCount: number;
}

const STATUS_COLORS: Record<string, string> = {
  RESERVED: 'bg-amber-100 border-amber-300 text-amber-800',
  CONFIRMED: 'bg-blue-100 border-blue-300 text-blue-800',
  CHECKED_IN: 'bg-emerald-100 border-emerald-300 text-emerald-800',
  CHECKED_OUT: 'bg-gray-100 border-gray-300 text-gray-800',
  CANCELLED: 'bg-red-50 border-red-200 text-red-700 opacity-60',
  NO_SHOW: 'bg-orange-50 border-orange-200 text-orange-700 opacity-60',
};

const STATUS_COLORS_SOLID: Record<string, string> = {
  RESERVED: 'bg-amber-500',
  CONFIRMED: 'bg-blue-500',
  CHECKED_IN: 'bg-emerald-500',
  CHECKED_OUT: 'bg-gray-500',
  CANCELLED: 'bg-red-400',
  NO_SHOW: 'bg-orange-400',
};

export default function ReservationCalendarPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(dayjs().startOf('day'));
  const [viewMode, setViewMode] = useState<'WEEK' | 'MONTH' | 'DAY'>('WEEK');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roomFilter, setRoomFilter] = useState('All');

  // Computed Date Range based on view
  const { startDate, endDate, dateArray } = useMemo(() => {
    let start, end;
    if (viewMode === 'WEEK') {
      start = currentDate;
      end = currentDate.add(6, 'day');
    } else if (viewMode === 'MONTH') {
      start = currentDate.startOf('month');
      end = currentDate.endOf('month');
    } else {
      start = currentDate;
      end = currentDate;
    }

    const arr = [];
    let cur = start;
    while (cur.isBefore(end) || cur.isSame(end, 'day')) {
      arr.push(cur);
      cur = cur.add(1, 'day');
    }

    return { startDate: start, endDate: end, dateArray: arr };
  }, [currentDate, viewMode]);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hotel/reservations/calendar?startDate=${startDate.toISOString()}&endDate=${endDate.add(1, 'day').toISOString()}`);
      const data = await res.json();
      if (data.success) {
        setRooms(data.rooms || []);
        setBlocks(data.blocks || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [startDate.toISOString(), endDate.toISOString()]);

  const navigatePrev = () => {
    if (viewMode === 'WEEK') setCurrentDate(prev => prev.subtract(7, 'day'));
    else if (viewMode === 'MONTH') setCurrentDate(prev => prev.subtract(1, 'month').startOf('month'));
    else setCurrentDate(prev => prev.subtract(1, 'day'));
  };

  const navigateNext = () => {
    if (viewMode === 'WEEK') setCurrentDate(prev => prev.add(7, 'day'));
    else if (viewMode === 'MONTH') setCurrentDate(prev => prev.add(1, 'month').startOf('month'));
    else setCurrentDate(prev => prev.add(1, 'day'));
  };

  const goToToday = () => {
    setCurrentDate(dayjs().startOf('day'));
  };

  // Filter Data
  const filteredRooms = useMemo(() => {
    if (roomFilter === 'All') return rooms;
    return rooms.filter(r => r.id === roomFilter);
  }, [rooms, roomFilter]);

  const filteredBlocks = useMemo(() => {
    return blocks.filter(b => {
      const matchSearch = !searchQuery || b.guestName.toLowerCase().includes(searchQuery.toLowerCase()) || String(b.reservationNumber).includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'All' || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [blocks, searchQuery, statusFilter]);

  // Calculate block rendering styles
  const getBlockStyle = (block: Block, rowIdx: number) => {
    const checkIn = dayjs(block.checkInDate).startOf('day');
    const checkOut = dayjs(block.checkOutDate).startOf('day');
    
    // Find intersections with our visible grid
    let visibleStart = checkIn.isBefore(startDate) ? startDate : checkIn;
    let visibleEnd = checkOut.isAfter(endDate) ? endDate : checkOut;

    // If check out is exact same day as check in, span 1
    if (checkOut.isSame(checkIn, 'day')) {
      visibleEnd = checkOut.add(1, 'day'); // render as 1 block width
    } else {
       // Since checkout day doesn't consume the night, block ends at checkout date
    }

    const startIndex = visibleStart.diff(startDate, 'day');
    let span = visibleEnd.diff(visibleStart, 'day');
    if (span < 1) span = 1; // Minimum 1 col

    // Column widths could be fixed, say 120px
    const cellWidth = 120;
    
    return {
      left: `${startIndex * cellWidth}px`,
      width: `${span * cellWidth}px`,
      top: '4px',
      bottom: '4px',
    };
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] font-sans flex flex-col">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full flex-1 flex flex-col">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
               <CalendarDays size={24} />
             </div>
             <div>
               <h1 className="text-2xl font-black text-gray-900 tracking-tight">Reservation Calendar</h1>
               <p className="text-gray-500 font-medium text-xs mt-1">View room availability and reservations by date</p>
             </div>
           </div>
           
           <div className="flex items-center gap-3">
             <Link href="/dashboard/reservations" className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg font-bold text-sm shadow-sm transition">
               List View
             </Link>
             <button onClick={() => router.push('/dashboard/reservations/wizard')} className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-indigo-700 transition">
               <Plus size={16} strokeWidth={3} /> New Reservation
             </button>
           </div>
        </div>

        {/* CONTROLS BAR */}
        <div className="bg-white p-4 rounded-t-2xl border border-gray-200 border-b-0 flex flex-wrap gap-4 items-center justify-between shadow-sm z-10">
           <div className="flex items-center gap-2">
             <button onClick={navigatePrev} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"><ChevronLeft size={18}/></button>
             <button onClick={goToToday} className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 font-bold text-xs uppercase tracking-wider">Today</button>
             <button onClick={navigateNext} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"><ChevronRight size={18}/></button>
             <div className="ml-4 font-black text-gray-800 text-lg">
                {startDate.format('MMM D, YYYY')} {viewMode !== 'DAY' && `- ${endDate.format('MMM D, YYYY')}`}
             </div>
           </div>
           
           <div className="flex flex-wrap items-center gap-3">
             <div className="flex bg-gray-100 rounded-lg p-1">
               <button onClick={()=>setViewMode('DAY')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${viewMode==='DAY'?'bg-white text-gray-800 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>Day</button>
               <button onClick={()=>setViewMode('WEEK')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${viewMode==='WEEK'?'bg-white text-gray-800 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>Week</button>
               <button onClick={()=>setViewMode('MONTH')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${viewMode==='MONTH'?'bg-white text-gray-800 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>Month</button>
             </div>
             
             <div className="relative">
               <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
               <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} type="text" placeholder="Search..." className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-900 w-40 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
             </div>
             
             <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="border border-gray-200 rounded-lg text-xs font-bold text-gray-700 px-3 py-2 outline-none appearance-none bg-white min-w-[110px]">
                <option value="All">All Status</option>
                <option value="RESERVED">Reserved</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CHECKED_IN">Checked In</option>
                <option value="CHECKED_OUT">Checked Out</option>
             </select>
             
             <select value={roomFilter} onChange={e=>setRoomFilter(e.target.value)} className="border border-gray-200 rounded-lg text-xs font-bold text-gray-700 px-3 py-2 outline-none appearance-none bg-white max-w-[120px] truncate">
                <option value="All">All Rooms</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.roomNumber}</option>)}
             </select>
             
             <button onClick={fetchCalendarData} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"><RefreshCw size={16} className={loading ? "animate-spin" : ""}/></button>
           </div>
        </div>

        {/* CALENDAR GRID */}
        <div className="bg-white border border-gray-200 rounded-b-2xl shadow-sm flex-1 flex flex-col overflow-hidden relative">
           
           {/* Header Row */}
           <div className="flex border-b border-gray-200 bg-gray-50">
             <div className="w-[180px] shrink-0 border-r border-gray-200 p-4 flex items-center justify-center font-bold text-gray-500 text-xs tracking-wider uppercase">
               Rooms
             </div>
             <div className="flex-1 overflow-x-auto overflow-y-hidden hide-scrollbar flex" id="cal-header-scroll">
               {dateArray.map((d, i) => {
                 const isToday = d.isSame(dayjs(), 'day');
                 return (
                   <div key={i} className={`w-[120px] shrink-0 border-r border-gray-200 p-2 flex flex-col items-center justify-center ${isToday ? 'bg-indigo-50' : ''}`}>
                     <span className={`text-[10px] font-bold uppercase ${isToday ? 'text-indigo-600' : 'text-gray-400'}`}>{d.format('ddd')}</span>
                     <span className={`text-lg font-black ${isToday ? 'text-indigo-700' : 'text-gray-800'}`}>{d.format('DD')}</span>
                     <span className="text-[9px] font-bold text-gray-400">{d.format('MMM')}</span>
                   </div>
                 );
               })}
             </div>
           </div>

           {/* Body Rows */}
           <div className="flex-1 flex overflow-hidden relative" style={{ minHeight: '400px' }}>
              <div className="w-[180px] shrink-0 border-r border-gray-200 overflow-y-auto hide-scrollbar z-10 bg-white" id="cal-rooms-scroll" onScroll={(e) => {
                 const grid = document.getElementById('cal-grid-scroll');
                 if(grid) grid.scrollTop = (e.target as HTMLDivElement).scrollTop;
              }}>
                {filteredRooms.map((r) => (
                  <div key={r.id} onClick={() => {}} className="h-[70px] border-b border-gray-100 flex flex-col justify-center px-4 hover:bg-gray-50 cursor-pointer group">
                     <span className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">Room {r.roomNumber}</span>
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">{r.roomType}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex-1 overflow-auto relative" id="cal-grid-scroll" onScroll={(e) => {
                 const header = document.getElementById('cal-header-scroll');
                 const rooms = document.getElementById('cal-rooms-scroll');
                 if(header) header.scrollLeft = (e.target as HTMLDivElement).scrollLeft;
                 if(rooms) rooms.scrollTop = (e.target as HTMLDivElement).scrollTop;
              }}>
                 {/* Grid Lines Overlay */}
                 <div className="absolute top-0 bottom-0 left-0 flex pointer-events-none" style={{ minHeight: filteredRooms.length * 70 + 'px' }}>
                   {dateArray.map((_, i) => (
                      <div key={i} className="w-[120px] shrink-0 border-r border-gray-100 h-full"></div>
                   ))}
                 </div>

                 {filteredRooms.map((r, rowIdx) => {
                    const roomBlocks = filteredBlocks.filter(b => b.roomId === r.id);
                    return (
                      <div key={r.id} className="h-[70px] border-b border-gray-100 relative w-max" style={{ width: dateArray.length * 120 + 'px' }}>
                         {/* Empty slots for creation */}
                         {dateArray.map((d, i) => (
                            <div 
                              key={i} 
                              className="absolute h-full w-[120px] hover:bg-indigo-50/40 cursor-pointer transition-colors" 
                              style={{ left: i * 120 + 'px' }}
                              onClick={() => {
                                 const checkIn = d.format('YYYY-MM-DD');
                                 const checkOut = d.add(1, 'day').format('YYYY-MM-DD');
                                 router.push(`/dashboard/reservations/wizard?roomId=${r.id}&checkIn=${checkIn}&checkOut=${checkOut}`);
                              }}
                            />
                         ))}

                         {/* Blocks */}
                         {roomBlocks.map(block => {
                            // verify boundaries
                            const blockStart = dayjs(block.checkInDate).startOf('day');
                            const blockEnd = dayjs(block.checkOutDate).startOf('day');
                            
                            // If block is totally outside view, don't render (should be handled by useMemo filter, but double check)
                            if (blockEnd.isBefore(startDate) || blockStart.isAfter(endDate)) return null;
                            
                            const style = getBlockStyle(block, rowIdx);
                            const colorClass = STATUS_COLORS[block.status] || STATUS_COLORS.RESERVED;
                            
                            return (
                               <div 
                                 key={block.reservationId} 
                                 onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/reservations/${block.reservationId}`); }}
                                 className={`absolute rounded-lg border shadow-sm p-2 flex flex-col justify-center cursor-pointer hover:shadow-md transition-shadow group overflow-hidden z-20 ${colorClass}`}
                                 style={style}
                               >
                                  <div className="flex items-center justify-between gap-2">
                                     <span className="font-bold text-[11px] truncate">{block.guestName}</span>
                                     <span className="text-[9px] font-black opacity-70 shrink-0">#{block.reservationNumber}</span>
                                  </div>
                                  <div className="flex items-center justify-between mt-0.5">
                                     <span className="text-[10px] font-bold opacity-80">{block.status}</span>
                                     <span className="text-[10px] font-bold">₹{(block.totalAmount/100).toLocaleString('en-IN')}</span>
                                  </div>

                                  {/* Tooltip on hover */}
                                  <div className="hidden group-hover:flex absolute left-0 top-full mt-1 bg-gray-900 text-white p-3 rounded-lg shadow-xl flex-col gap-1 w-48 z-50 pointer-events-none">
                                     <div className="font-bold text-sm">{block.guestName}</div>
                                     <div className="text-xs text-gray-300 border-b border-gray-700 pb-1 mb-1">Room {r.roomNumber} &bull; {block.status}</div>
                                     <div className="text-xs"><span className="text-gray-400">In:</span> {dayjs(block.checkInDate).format('MMM D, YYYY')}</div>
                                     <div className="text-xs"><span className="text-gray-400">Out:</span> {dayjs(block.checkOutDate).format('MMM D, YYYY')}</div>
                                     <div className="text-xs mt-1"><span className="text-gray-400">Nights:</span> {block.nights} &bull; <span className="text-gray-400">Guests:</span> {block.guestsCount}</div>
                                     <div className="text-xs mt-1 font-bold text-green-400">Total: ₹{(block.totalAmount/100).toLocaleString('en-IN')}</div>
                                  </div>
                               </div>
                            );
                         })}
                      </div>
                    )
                 })}
                 
                 {filteredRooms.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-bold text-sm">
                       No rooms available to display.
                    </div>
                 )}
              </div>
           </div>
        </div>
        
        {/* LEGEND */}
        <div className="mt-4 flex flex-wrap items-center gap-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-xs font-bold text-gray-600">
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-500"></div> Reserved</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-500"></div> Confirmed</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-500"></div> Checked In</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-gray-500"></div> Checked Out</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-400"></div> Cancelled</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-orange-400"></div> No Show</span>
        </div>
      </div>
    </div>
  );
}
