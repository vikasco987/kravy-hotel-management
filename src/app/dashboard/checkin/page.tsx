"use client";

import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, Search, Calendar, ChevronDown, MoreVertical, ArrowUpRight, 
  UserCheck, UserRound, LogOut, Hotel, ChevronRight, CheckCircle2, Plus, Code
} from 'lucide-react';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { ApiJsonDebugger } from '@/components/ui/ApiJsonDebugger';

export default function CheckinCheckoutPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);
  const [apiRequests, setApiRequests] = useState<any[]>([]);
  const [isApiJsonOpen, setIsApiJsonOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));

  useEffect(() => {
    setLoading(true);
    const abortController = new AbortController();
    const url = `/api/hotel/checkin-data?date=${selectedDate}`;
    const startTime = Date.now();

    fetch(url, { signal: abortController.signal })
      .then(async res => {
        const responseTimeMs = Date.now() - startTime;
        const status = res.status;
        const text = await res.text();
        let d;
        try {
          d = JSON.parse(text);
        } catch (e) {
          d = text;
        }

        setApiRequests(prev => [...prev, {
          url,
          method: 'GET',
          status,
          responseTimeMs,
          timestamp: new Date().toISOString(),
          response: d
        }]);

        if (typeof d === 'object' && d !== null && d.success) {
          setData(d);
          if (d.isAdmin !== undefined) setIsAdmin(d.isAdmin);
        }
        setLoading(false);
      })
      .catch(e => {
        if (e.name === 'AbortError') return;
        setApiRequests(prev => [...prev, {
          url,
          method: 'GET',
          status: 'ERROR',
          responseTimeMs: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          response: { error: String(e) }
        }]);
        console.error(e);
        setLoading(false);
      });

      return () => abortController.abort();
  }, [selectedDate]);

  const getAvatarColor = (name: string) => {
    const colors = ['bg-indigo-100 text-indigo-700', 'bg-rose-100 text-rose-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-purple-100 text-purple-700', 'bg-sky-100 text-sky-700'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) hash = (name || '').charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name: string) => {
    if (!name) return 'GS';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500 bg-[#F4F6F9]">Loading...</div>;

  const stats = data?.stats || { checkInsToday: 0, checkOutsToday: 0, inHouse: 0, upcoming: 0, totalBookings: 0 };
  const roomStats = data?.roomStats || { available: 0, occupied: 0, dirty: 0, maintenance: 0, blocked: 0 };
  const groups = data?.groups || { upcoming: [], checkIns: [], inHouse: [], checkOuts: [] };
  const totalRooms = roomStats.available + roomStats.occupied + roomStats.dirty + roomStats.maintenance + roomStats.blocked;
  const occupancyRate = totalRooms > 0 ? Math.round((roomStats.occupied / totalRooms) * 100) : 0;

  const filterFn = (res: any) => {
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.trim().toLowerCase();
      const matchName = res.guestName?.toLowerCase().includes(q);
      const matchPhone = res.guestPhone?.includes(q);
      const matchId = res.shortId?.toLowerCase().includes(q) || res.id?.toLowerCase().includes(q);
      const matchRoom = (res.roomDetails || []).some((r: any) => r.roomNumber && String(r.roomNumber).trim().toLowerCase() === q);
      if (!matchName && !matchPhone && !matchId && !matchRoom) return false;
    }
    return true;
  };

  const displayUpcoming = (activeTab === 'All' || activeTab === 'Upcoming') ? (groups.upcoming || []).filter(filterFn) : [];
  const displayCheckIns = (activeTab === 'All' || activeTab === 'Check-in') ? groups.checkIns.filter(filterFn) : [];
  const displayInHouse = (activeTab === 'All' || activeTab === 'In House') ? groups.inHouse.filter(filterFn) : [];
  const displayCheckOuts = (activeTab === 'All' || activeTab === 'Check-out') ? groups.checkOuts.filter(filterFn) : [];

  const renderTableRow = (res: any, statusType: 'upcoming' | 'checkin' | 'inhouse' | 'checkout') => {
    let statusBadge;
    let actionBtn;
    const firstRoom = res.roomDetails && res.roomDetails.length > 0 ? res.roomDetails[0] : null;
    const roomId = firstRoom ? firstRoom.id : null;

    if (statusType === 'upcoming') {
      statusBadge = <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">Upcoming</span>;
      actionBtn = <button onClick={() => router.push(`/dashboard/book?resId=${res.id}`)} className="px-3 py-1.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold hover:bg-indigo-100 transition shadow-sm opacity-0 group-hover:opacity-100">Check-in</button>;
    } else if (statusType === 'checkin') {
      statusBadge = <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">Checked In</span>;
      if (res.status === 'CHECKED_OUT') {
         actionBtn = <button onClick={() => router.push(`/dashboard/reservations/${res.id}`)} className="px-3 py-1.5 rounded bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm opacity-0 group-hover:opacity-100">View</button>;
      } else {
         actionBtn = <button onClick={() => router.push(roomId ? `/dashboard/checkout?roomId=${roomId}` : `/dashboard/checkout`)} className="px-3 py-1.5 rounded bg-rose-50 text-rose-700 border border-rose-100 text-xs font-bold hover:bg-rose-100 transition shadow-sm opacity-0 group-hover:opacity-100">Check-out</button>;
      }
    } else if (statusType === 'inhouse') {
      statusBadge = <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">In House</span>;
      actionBtn = <button onClick={() => router.push(roomId ? `/dashboard/checkout?roomId=${roomId}` : `/dashboard/checkout`)} className="px-3 py-1.5 rounded bg-rose-50 text-rose-700 border border-rose-100 text-xs font-bold hover:bg-rose-100 transition shadow-sm opacity-0 group-hover:opacity-100">Check-out</button>;
    } else {
      statusBadge = <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 uppercase tracking-wider">Check-out</span>;
      actionBtn = <button onClick={() => router.push(`/dashboard/reservations/${res.id}`)} className="px-3 py-1.5 rounded bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm opacity-0 group-hover:opacity-100">View</button>;
    }

    const roomName = firstRoom && firstRoom.name ? firstRoom.name.split('-')[0].trim() : (res.rooms.length > 0 ? res.rooms[0].split('-')[0].trim() : 'Unassigned');
    const roomType = firstRoom && firstRoom.name ? firstRoom.name.split('-')[1]?.trim() : (res.rooms.length > 0 ? res.rooms[0].split('-')[1]?.trim() : 'Standard');
    
    let roomStatusIndicator = null;
    if (firstRoom && firstRoom.status) {
      if (firstRoom.status === 'AVAILABLE') roomStatusIndicator = <span className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">● Clean</span>;
      else if (firstRoom.status === 'DIRTY') roomStatusIndicator = <span className="text-[10px] text-rose-600 font-bold mt-1 flex items-center gap-1">● Dirty</span>;
      else if (firstRoom.status === 'MAINTENANCE') roomStatusIndicator = <span className="text-[10px] text-amber-600 font-bold mt-1 flex items-center gap-1">● Maintenance</span>;
      else if (firstRoom.status === 'BLOCKED') roomStatusIndicator = <span className="text-[10px] text-slate-600 font-bold mt-1 flex items-center gap-1">● Blocked</span>;
      else if (firstRoom.status === 'OCCUPIED') roomStatusIndicator = <span className="text-[10px] text-indigo-600 font-bold mt-1 flex items-center gap-1">● Occupied</span>;
    }

    return (
      <tr key={res.id} className="hover:bg-slate-50 transition-colors border-b border-gray-100/50 last:border-0 group bg-white">
        <td className="px-5 py-4 w-[40px]">
          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
        </td>
        <td className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarColor(res.guestName)}`}>
              {getInitials(res.guestName)}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900 leading-tight">{res.guestName}</span>
              <span className="text-[11px] text-gray-500 font-medium">{res.guestPhone}</span>
              <span className="text-[10px] text-gray-400 mt-0.5">ID: {res.shortId}</span>
              {res.hasDocument ? (
                 res.isGuestVerified ? (
                   <span className="text-[10px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1"><CheckCircle2 size={10} /> Verified</span>
                 ) : (
                   <span className="text-[10px] text-amber-600 font-bold mt-0.5 flex items-center gap-1">⚠ ID Pending</span>
                 )
               ) : (
                 <span className="text-[10px] text-rose-500 font-bold mt-0.5 flex items-center gap-1">⚠ ID Missing</span>
               )}
            </div>
          </div>
        </td>
        <td className="px-5 py-4">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-800 leading-tight">{roomName}</span>
            <span className="text-[11px] text-gray-500 font-medium">{roomType}</span>
            {roomStatusIndicator}
          </div>
        </td>
        <td className="px-5 py-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-700">{res.checkInDate ? dayjs(res.checkInDate).format('DD MMM YYYY') : '-'}</span>
            <span className="text-[11px] text-gray-400 font-medium mt-0.5">{res.checkInDate ? dayjs(res.checkInDate).format('hh:mm A') : '-'}</span>
          </div>
        </td>
        <td className="px-5 py-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-700">{res.checkOutDate ? dayjs(res.checkOutDate).format('DD MMM YYYY') : '-'}</span>
            <span className="text-[11px] text-gray-400 font-medium mt-0.5">{res.checkOutDate ? dayjs(res.checkOutDate).format('hh:mm A') : '-'}</span>
          </div>
        </td>
        <td className="px-5 py-4">
           {statusBadge}
        </td>
        <td className="px-5 py-4">
           <div className="flex flex-col">
             <span className="text-xs font-bold text-gray-800">₹{res.totalAmount ? (res.totalAmount/100).toLocaleString() : '0'}</span>
             {res.balanceDue !== undefined && (
               res.balanceDue > 0 ? (
                 <span className="text-[10px] text-rose-600 font-bold mt-0.5 flex items-center gap-1">⚠ ₹{(res.balanceDue/100).toLocaleString()} Due</span>
               ) : (
                 <span className="text-[10px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1">✓ Paid</span>
               )
             )}
           </div>
        </td>
        <td className="px-5 py-4">
          <div className="flex items-center justify-end gap-2">
            {actionBtn}
            <button className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer">
              <MoreVertical size={16} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-12">
      {/* PAGE TITLE / HEADER */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 lg:px-8 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto w-full">
           <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
               <CalendarDays size={20} strokeWidth={2.5} />
             </div>
             <div>
               <h1 className="text-xl font-black text-slate-900 tracking-tight">Check-in / Check-out</h1>
               <p className="text-slate-500 font-medium text-xs mt-0.5">Manage guest arrivals and departures</p>
             </div>
           </div>
           
            <div className="flex items-center gap-4">
              <div className="relative flex items-center gap-2 bg-white text-slate-700 border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer shadow-sm overflow-hidden">
                <Calendar size={14} className="text-slate-500" /> {dayjs(selectedDate).format('DD MMM YYYY')} <ChevronDown size={14} className="text-gray-400 ml-1" />
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer" />
              </div>
              {isAdmin && (
                <button onClick={() => setIsApiJsonOpen(true)} className="bg-slate-800 text-white hover:bg-slate-700 px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-sm transition whitespace-nowrap">
                  <Code size={14} /> API JSON
                </button>
              )}
           </div>
        </div>
      </div>

      <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
        
        {/* KPI CARDS (Full Width Grid) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
           <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4 hover:border-indigo-200 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><UserCheck size={20} /></div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest truncate">Today's Check-ins</span>
                <div className="flex items-baseline gap-2 mt-1">
                   <span className="text-2xl font-black text-gray-900">{stats.checkInsToday}</span>
                </div>
              </div>
           </div>
           <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4 hover:border-indigo-200 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0"><LogOut size={20} /></div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest truncate">Today's Check-outs</span>
                <div className="flex items-baseline gap-2 mt-1">
                   <span className="text-2xl font-black text-gray-900">{stats.checkOutsToday}</span>
                </div>
              </div>
           </div>
           <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4 hover:border-indigo-200 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><UserRound size={20} /></div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest truncate">In House Guests</span>
                <div className="flex items-baseline gap-2 mt-1">
                   <span className="text-2xl font-black text-gray-900">{stats.inHouse}</span>
                </div>
              </div>
           </div>
           <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4 hover:border-indigo-200 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><CalendarDays size={20} /></div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest truncate">Total Bookings</span>
                <div className="flex items-baseline gap-2 mt-1">
                   <span className="text-2xl font-black text-gray-900">{stats.totalBookings}</span>
                </div>
              </div>
           </div>
        </div>

        {/* FILTER BAR & SEARCH ROW */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
           <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-hide">
             <button onClick={() => setActiveTab('All')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs shadow-sm whitespace-nowrap transition-colors ${activeTab === 'All' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                All <span className={activeTab === 'All' ? 'bg-indigo-500 text-white px-1.5 py-0.5 rounded text-[10px]' : 'bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px]'}>{stats.totalBookings}</span>
             </button>
             <button onClick={() => setActiveTab('Check-in')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-colors whitespace-nowrap ${activeTab === 'Check-in' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                Check-in <span className={activeTab === 'Check-in' ? 'bg-indigo-500 text-white px-1.5 py-0.5 rounded text-[10px]' : 'bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px]'}>{stats.checkInsToday}</span>
             </button>
             <button onClick={() => setActiveTab('Check-out')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-colors whitespace-nowrap ${activeTab === 'Check-out' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                Check-out <span className={activeTab === 'Check-out' ? 'bg-indigo-500 text-white px-1.5 py-0.5 rounded text-[10px]' : 'bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px]'}>{stats.checkOutsToday}</span>
             </button>
             <button onClick={() => setActiveTab('In House')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-colors whitespace-nowrap ${activeTab === 'In House' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                In House <span className={activeTab === 'In House' ? 'bg-indigo-500 text-white px-1.5 py-0.5 rounded text-[10px]' : 'bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px]'}>{stats.inHouse}</span>
             </button>
             <button onClick={() => setActiveTab('Upcoming')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-colors whitespace-nowrap ${activeTab === 'Upcoming' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                Upcoming <span className={activeTab === 'Upcoming' ? 'bg-indigo-500 text-white px-1.5 py-0.5 rounded text-[10px]' : 'bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px]'}>{stats.upcoming || 0}</span>
             </button>
           </div>

           <div className="relative w-full md:w-[320px]">
             <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
             <input 
               type="text" 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Search guests, rooms, ID..." 
               className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-slate-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-medium text-slate-900 placeholder:text-slate-400 transition" 
             />
           </div>
        </div>

        {/* MAIN CONTENT AREA: TWO COLUMNS */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
           
           {/* LEFT: GUEST TABLE */}
           <div className="flex-1 min-w-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse min-w-[800px]">
                 <thead>
                   <tr className="bg-slate-50 border-b border-gray-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                     <th className="px-5 py-4 w-[40px]"><input type="checkbox" className="rounded border-gray-300" disabled /></th>
                     <th className="px-5 py-4">Guest</th>
                     <th className="px-5 py-4">Room</th>
                     <th className="px-5 py-4">Check-in</th>
                     <th className="px-5 py-4">Check-out</th>
                     <th className="px-5 py-4">Status</th>
                     <th className="px-5 py-4">Payment</th>
                     <th className="px-5 py-4 text-right pr-12">Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                    {/* UPCOMING GROUP */}
                    {displayUpcoming.length > 0 && (
                      <>
                      <tr className="bg-slate-50/50">
                        <td colSpan={8} className="px-5 py-3 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center"><UserCheck size={14} strokeWidth={2.5}/></div>
                            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">Pending Arrivals</h2>
                            <span className="text-[10px] font-bold text-slate-400 ml-1">({displayUpcoming.length})</span>
                          </div>
                        </td>
                      </tr>
                      {displayUpcoming.map((res: any) => renderTableRow(res, 'upcoming'))}
                      </>
                    )}

                    {/* CHECK-INS GROUP */}
                    {displayCheckIns.length > 0 && (
                      <>
                      <tr className="bg-slate-50/50">
                        <td colSpan={8} className="px-5 py-3 border-y border-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center"><UserCheck size={14} strokeWidth={2.5}/></div>
                            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">Today's Check-ins</h2>
                            <span className="text-[10px] font-bold text-slate-400 ml-1">({displayCheckIns.length})</span>
                          </div>
                        </td>
                      </tr>
                      {displayCheckIns.map((res: any) => renderTableRow(res, 'checkin'))}
                      </>
                    )}

                    {/* IN HOUSE GROUP */}
                    {displayInHouse.length > 0 && (
                      <>
                      <tr className="bg-slate-50/50">
                        <td colSpan={8} className="px-5 py-3 border-y border-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center"><Hotel size={14} strokeWidth={2.5}/></div>
                            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">In House</h2>
                            <span className="text-[10px] font-bold text-slate-400 ml-1">({displayInHouse.length})</span>
                          </div>
                        </td>
                      </tr>
                      {displayInHouse.map((res: any) => renderTableRow(res, 'inhouse'))}
                      </>
                    )}

                    {/* CHECK-OUTS GROUP */}
                    {displayCheckOuts.length > 0 && (
                      <>
                      <tr className="bg-slate-50/50">
                        <td colSpan={8} className="px-5 py-3 border-y border-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-rose-100 text-rose-600 flex items-center justify-center"><LogOut size={14} strokeWidth={2.5}/></div>
                            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">Check-outs</h2>
                            <span className="text-[10px] font-bold text-slate-400 ml-1">({displayCheckOuts.length})</span>
                          </div>
                        </td>
                      </tr>
                      {displayCheckOuts.map((res: any) => renderTableRow(res, 'checkout'))}
                      </>
                    )}

                    {displayUpcoming.length === 0 && displayCheckIns.length === 0 && displayInHouse.length === 0 && displayCheckOuts.length === 0 && (
                       <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-400 font-bold text-sm">No guests found.</td></tr>
                    )}
                 </tbody>
               </table>
             </div>
           </div>

           {/* RIGHT: SIDEBAR */}
           <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6">
              
              {/* Room Occupancy */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-7 h-7 rounded bg-slate-100 text-slate-600 flex items-center justify-center"><Hotel size={16} /></div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Room Occupancy</h3>
                </div>
                
                <div className="flex items-center justify-between">
                  {/* Circle Graph */}
                  <div className="relative w-[100px] h-[100px]">
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                       <path className="text-slate-100" strokeWidth="6" stroke="currentColor" fill="none" d="M18 3 a 15 15 0 0 1 0 30 a 15 15 0 0 1 0 -30" />
                       <path className="text-indigo-500" strokeDasharray={`${occupancyRate}, 100`} strokeWidth="6" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 3 a 15 15 0 0 1 0 30 a 15 15 0 0 1 0 -30" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <span className="text-xl font-black text-slate-900 leading-none">{occupancyRate}%</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="space-y-2.5 flex-1 pl-6">
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <div className="flex items-center gap-2 text-slate-500"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Available</div>
                      <span className="text-slate-800">{roomStats.available}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <div className="flex items-center gap-2 text-slate-500"><div className="w-2 h-2 rounded-full bg-indigo-500"></div>Occupied</div>
                      <span className="text-slate-800">{roomStats.occupied}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <div className="flex items-center gap-2 text-slate-500"><div className="w-2 h-2 rounded-full bg-rose-400"></div>Dirty</div>
                      <span className="text-slate-800">{roomStats.dirty}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <div className="flex items-center gap-2 text-slate-500"><div className="w-2 h-2 rounded-full bg-amber-400"></div>Maintenance</div>
                      <span className="text-slate-800">{roomStats.maintenance}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <div className="flex items-center gap-2 text-slate-500"><div className="w-2 h-2 rounded-full bg-slate-400"></div>Blocked</div>
                      <span className="text-slate-800">{roomStats.blocked}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-7 h-7 rounded bg-slate-100 text-slate-600 flex items-center justify-center"><Plus size={16} /></div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Quick Actions</h3>
                </div>
                
                <div className="flex flex-col gap-3">
                  <button onClick={() => router.push('/dashboard/book')} className="bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-100 hover:border-indigo-100 p-3.5 rounded-lg flex items-center justify-between transition group">
                    <div className="flex items-center gap-3"><UserCheck size={18} className="text-indigo-500" /> <span className="text-xs font-bold">Check-in Guest</span></div>
                    <ArrowUpRight size={16} className="opacity-40 group-hover:opacity-100" />
                  </button>
                  <button onClick={() => router.push('/dashboard/checkout')} className="bg-slate-50 hover:bg-rose-50 hover:text-rose-700 text-slate-700 border border-slate-100 hover:border-rose-100 p-3.5 rounded-lg flex items-center justify-between transition group">
                    <div className="flex items-center gap-3"><LogOut size={18} className="text-rose-500" /> <span className="text-xs font-bold">Check-out Guest</span></div>
                    <ArrowUpRight size={16} className="opacity-40 group-hover:opacity-100" />
                  </button>
                  <button onClick={() => router.push('/dashboard/reservations')} className="bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-100 hover:border-blue-100 p-3.5 rounded-lg flex items-center justify-between transition group">
                    <div className="flex items-center gap-3"><CalendarDays size={18} className="text-blue-500" /> <span className="text-xs font-bold">Reservations</span></div>
                    <ArrowUpRight size={16} className="opacity-40 group-hover:opacity-100" />
                  </button>
                </div>
              </div>



           </div>
        </div>
      </div>

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
