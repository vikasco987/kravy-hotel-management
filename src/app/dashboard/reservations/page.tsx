"use client";

import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  CheckCircle2, 
  LogOut, 
  CalendarPlus, 
  CalendarCheck,
  Search,
  Calendar,
  ChevronDown,
  Plus,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { ReservationDetailsDrawer } from './ReservationDetailsDrawer';
import { useRef } from 'react';

interface Reservation {
  id: string;
  shortId: string;
  guestName: string;
  guestPhone: string;
  rooms: string[];
  firstActiveRoomId?: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guests: number;
  totalAmount: number;
  status: string;
  source: string;
  createdAt: string;
}

export default function ReservationsPage() {
  const [data, setData] = useState<{stats: any, reservations: Reservation[]} | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [checkInDateFilter, setCheckInDateFilter] = useState("");
  const [checkOutDateFilter, setCheckOutDateFilter] = useState("");
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);
  const [detailsReservationId, setDetailsReservationId] = useState<string | null>(null);
  const [deleteModalRes, setDeleteModalRes] = useState<Reservation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [paginationData, setPaginationData] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, checkInDateFilter, checkOutDateFilter]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '10',
      search: debouncedSearch,
      status: statusFilter,
      checkInDate: checkInDateFilter,
      checkOutDate: checkOutDateFilter
    });
    fetch(`/api/hotel/reservations?${params.toString()}`)
      .then(res => res.json())
      .then(d => {
        if (d.success) {
          setData({ stats: d.stats, reservations: d.reservations });
          if (d.pagination) setPaginationData(d.pagination);
        }
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, [page, debouncedSearch, statusFilter, checkInDateFilter, checkOutDateFilter]);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'CHECKED_IN':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Checked In</span>;
      case 'CHECKED_OUT':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Checked Out</span>;
      case 'CONFIRMED':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Confirmed</span>;
      case 'RESERVED':
          return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Reserved</span>;
        default:
          return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-700 border border-gray-100"><span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span> {status}</span>;
    }
  };

  const getRandomInitials = (name: string) => {
    if (!name) return 'GS';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = ['bg-blue-100 text-blue-700', 'bg-rose-100 text-rose-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-purple-100 text-purple-700'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) hash = (name || '').charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500 bg-[#F4F6F9]">Loading Reservations...</div>;

  const stats = data?.stats || { total: 0, checkedIn: 0, checkedOut: 0, upcomingCheckIns: 0, upcomingCheckOuts: 0 };
  const allReservations = data?.reservations || [];
  
  const reservations = allReservations;

  return (
    <div className="min-h-screen bg-[#F4F6F9] font-sans">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full space-y-6">
        
        {/* HERO HEADER */}
        <div className="relative w-full h-[180px] md:h-[220px] rounded-2xl overflow-hidden flex flex-col justify-center shadow-md">
           <img src="/images/reservations-banner.jpg" className="absolute inset-0 w-full h-full object-cover object-center" alt="Background" />
           <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent w-[90%] md:w-[70%]"></div>
           
           <div className="relative z-10 px-6 md:px-10 flex flex-col md:flex-row items-start md:items-center gap-5 mb-4">
             <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/80 backdrop-blur-md flex items-center justify-center text-indigo-600 shadow-sm border border-white/50">
               <CalendarDays size={32} strokeWidth={2.5} />
             </div>
             <div>
               <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Reservations</h1>
               <p className="text-gray-600 font-bold text-xs md:text-sm mt-1">Manage guest reservations and bookings</p>
             </div>
           </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 -mt-10 relative z-20 px-4">
           {/* Card 1 */}
           <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 flex items-center justify-between col-span-2 md:col-span-1 min-w-[220px]">
             <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Reservations</div>
                <div className="text-3xl font-black text-gray-900 mt-1">{stats.total}</div>
             </div>
             <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <CalendarDays size={20} />
             </div>
           </div>
           
           {/* Card 2 */}
           <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Checked In</div>
                  <div className="text-2xl font-black text-gray-900 leading-none mt-1">{stats.checkedIn}</div>
                </div>
             </div>
             <ChevronRight size={16} className="text-gray-300" />
           </div>

           {/* Card 3 */}
           <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <LogOut size={20} />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Checked Out</div>
                  <div className="text-2xl font-black text-gray-900 leading-none mt-1">{stats.checkedOut}</div>
                </div>
             </div>
             <ChevronRight size={16} className="text-gray-300" />
           </div>

           {/* Card 4 */}
           <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <CalendarPlus size={20} />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Upcoming Check-ins</div>
                  <div className="text-2xl font-black text-gray-900 leading-none mt-1">{stats.upcomingCheckIns}</div>
                </div>
             </div>
             <ChevronRight size={16} className="text-gray-300" />
           </div>

           {/* Card 5 */}
           <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <CalendarCheck size={20} />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Upcoming Check-outs</div>
                  <div className="text-2xl font-black text-gray-900 leading-none mt-1">{stats.upcomingCheckOuts}</div>
                </div>
             </div>
             <ChevronRight size={16} className="text-gray-300" />
           </div>
        </div>

        {/* TOOLBAR */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mt-8">
           <div className="flex-1 flex gap-4 w-full">
              <div className="relative flex-1 max-w-[400px]">
                 <Search size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                 <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by guest name, room, or reservation ID..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-gray-900" />
              </div>
              
              <div className="relative flex items-center bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-2 cursor-pointer hover:bg-gray-50">
                 <Calendar size={16} className="text-gray-400 mr-2" />
                 <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-gray-400 uppercase">Check-in</span>
                   <input type="date" value={checkInDateFilter} onChange={(e) => setCheckInDateFilter(e.target.value)} className="text-xs font-bold text-gray-700 outline-none bg-transparent" />
                 </div>
              </div>
              
              <div className="relative flex items-center bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-2 cursor-pointer hover:bg-gray-50">
                 <Calendar size={16} className="text-gray-400 mr-2" />
                 <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-gray-400 uppercase">Check-out</span>
                   <input type="date" value={checkOutDateFilter} onChange={(e) => setCheckOutDateFilter(e.target.value)} className="text-xs font-bold text-gray-700 outline-none bg-transparent" />
                 </div>
              </div>
              
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-3 min-w-[140px] cursor-pointer hover:bg-gray-50 outline-none text-xs font-bold text-gray-700 appearance-none">
                  <option value="All">All Status</option>
                  <option value="Today">Today's Check-ins</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CHECKED_IN">Checked In</option>
                  <option value="CHECKED_OUT">Checked Out</option>
                  <option value="CANCELLED">Cancelled</option>
              </select>
           </div>
           <div className="flex gap-2">
             <button onClick={() => router.push('/dashboard/reservations/calendar')} className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition whitespace-nowrap">
               <CalendarDays size={16} strokeWidth={2.5} /> Calendar
             </button>
             <button onClick={() => router.push('/dashboard/reservations/wizard')} className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md hover:bg-indigo-700 transition whitespace-nowrap">
               <Plus size={16} strokeWidth={3} /> New Reservation
             </button>
           </div>
        </div>

        {/* DATA TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="border-b border-gray-100">
                   <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">ID</th>
                   <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Guest</th>
                   <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Rooms</th>
                   <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Check-in</th>
                   <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Check-out</th>
                   <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Nights</th>
                   <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Guests</th>
                   <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Amount</th>
                   <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                   <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Created At</th>
                   <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {reservations.length === 0 ? (
                   <tr>
                     <td colSpan={11} className="px-6 py-12 text-center text-gray-400 font-medium">No reservations found.</td>
                   </tr>
                 ) : reservations.map((res) => (
                   <tr key={res.id} className="hover:bg-gray-50/50 transition-colors">
                     <td className="px-6 py-4">
                       <span className="text-xs font-bold text-gray-500">#RES-{res.shortId}</span>
                     </td>
                     <td className="px-6 py-4 flex items-center gap-3">
                       <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarColor(res.guestName)}`}>
                         {getRandomInitials(res.guestName)}
                       </div>
                       <div className="flex flex-col">
                         <span className="text-sm font-bold text-gray-900">{res.guestName}</span>
                         <span className="text-[11px] text-gray-500 font-medium">{res.guestPhone}</span>
                       </div>
                     </td>
                     <td className="px-6 py-4">
    <div className="flex flex-col">
      {res.rooms.length > 0 ? (
         <>
           <span className="text-sm font-bold text-gray-800">{res.rooms.length > 1 ? `${res.rooms[0].split('(')[0].trim()} +${res.rooms.length - 1}` : res.rooms[0].split('(')[0].trim()}</span>
           <span className="text-[11px] text-gray-500 font-medium">{res.rooms.length > 1 ? 'Multi-room' : `(${res.rooms[0].split('(')[1] || 'Standard)'}`}</span>
         </>
      ) : (
         <span className="text-sm font-bold text-gray-800">Unassigned</span>
      )}
    </div>
  </td>
                     <td className="px-6 py-4">
                       <div className="flex flex-col">
                         <span className="text-xs font-bold text-gray-800">{res.checkInDate ? dayjs(res.checkInDate).format('DD MMM YYYY') : '-'}</span>
                         <span className="text-[11px] text-gray-500 font-medium">{res.checkInDate ? dayjs(res.checkInDate).format('hh:mm A') : '-'}</span>
                       </div>
                     </td>
                     <td className="px-6 py-4">
                       <div className="flex flex-col">
                         <span className="text-xs font-bold text-gray-800">{res.checkOutDate ? dayjs(res.checkOutDate).format('DD MMM YYYY') : '-'}</span>
                         <span className="text-[11px] text-gray-500 font-medium">{res.checkOutDate ? dayjs(res.checkOutDate).format('hh:mm A') : '-'}</span>
                       </div>
                     </td>
                     <td className="px-6 py-4 text-sm font-bold text-gray-800">
                       {res.nights}
                     </td>
                     <td className="px-6 py-4 text-sm font-bold text-gray-800">
    {res.guests}
  </td>
  <td className="px-6 py-4 text-sm font-bold text-gray-800">
    ₹ {res.totalAmount ? (res.totalAmount/100).toLocaleString() : '0'}
  </td>
                     <td className="px-6 py-4">
                       {getStatusBadge(res.status)}
                     </td>
  <td className="px-6 py-4">
    <div className="flex flex-col">
      <span className="text-xs font-bold text-gray-800">{res.createdAt ? dayjs(res.createdAt).format('DD MMM YYYY') : '-'}</span>
      <span className="text-[10px] text-gray-500">{res.createdAt ? dayjs(res.createdAt).format('hh:mm A') : '-'}</span>
    </div>
  </td>
  <td className="px-6 py-4 text-center relative">
                       <button onClick={() => setActionMenuOpenId(actionMenuOpenId === res.id ? null : res.id)} className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
                         <MoreHorizontal size={16} />
                       </button>
                       {actionMenuOpenId === res.id && (
    <div className="absolute right-8 top-10 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden text-left">
      <button onClick={() => { setActionMenuOpenId(null); setDetailsReservationId(res.id); }} className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">View Details</button>
      {(res.status === "RESERVED" || res.status === "CONFIRMED") && (
         <>
           <button onClick={() => router.push(`/dashboard/reservations/wizard?editId=${res.id}`)} className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Edit Reservation</button>
           <button onClick={() => router.push(`/dashboard/book?resId=${res.id}`)} className="w-full text-left px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50">Check-in</button>
           <button className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Add Payment</button>
           <button className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Change Room</button>
           <button className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Add Extra Service</button>
           <button className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Cancel Reservation</button>
         </>
      )}
      {res.status === "CHECKED_IN" && (
         <>
           <button className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Add Payment</button>
           <button className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Add Extra Service</button>
           <button className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Change Room</button>
           <button onClick={() => {
             if (!res.firstActiveRoomId) {
               alert('No active room assigned for checkout.');
               return;
             }
             router.push(`/dashboard/checkout?roomId=${res.firstActiveRoomId}`);
           }} className="w-full text-left px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50">Check-out</button>
           <button className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Print Invoice</button>
         </>
      )}
      {res.status === "CHECKED_OUT" && (
         <>
           <button className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Print Invoice</button>
           <button className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Payment/History</button>
         </>
      )}
      {(res.status !== "CHECKED_IN" && res.status !== "CHECKED_OUT") && (
         <button onClick={() => setDeleteModalRes(res)} className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 border-t border-gray-100 mt-1">Delete Reservation</button>
      )}
    </div>
  )}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
           
           {/* PAGINATION FOOTER */}
           {reservations.length > 0 && (
             <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
               <span className="text-xs font-medium text-gray-500">
                 Showing {reservations.length} of {paginationData.total} reservations
               </span>
               {paginationData.totalPages > 1 && (
                 <div className="flex items-center gap-2">
                   <button 
                     onClick={() => setPage(p => Math.max(1, p - 1))}
                     disabled={page === 1}
                     className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed">
                     <ChevronLeft size={14} />
                   </button>
                   
                   {Array.from({ length: paginationData.totalPages }).map((_, i) => {
                     const p = i + 1;
                     if (p === 1 || p === paginationData.totalPages || (p >= page - 1 && p <= page + 1)) {
                       return (
                         <button 
                           key={p}
                           onClick={() => setPage(p)}
                           className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xs transition ${
                             page === p 
                               ? 'bg-indigo-600 text-white shadow-sm' 
                               : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                           }`}>
                           {p}
                         </button>
                       );
                     } else if (p === page - 2 || p === page + 2) {
                       return <span key={p} className="text-gray-400 text-xs">...</span>;
                     }
                     return null;
                   })}
                   
                   <button 
                     onClick={() => setPage(p => Math.min(paginationData.totalPages, p + 1))}
                     disabled={page === paginationData.totalPages}
                     className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed">
                     <ChevronRight size={14} />
                   </button>
                 </div>
               )}
             </div>
           )}
        </div>

      </div>      {deleteModalRes && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6">
              <h3 className="text-xl font-black text-gray-900 mb-2">Delete Reservation?</h3>
              <p className="text-sm font-medium text-gray-500 mb-6">
                Are you sure you want to delete reservation <strong>#RES-{deleteModalRes.shortId}</strong> for guest <strong>{deleteModalRes.guestName}</strong>? This action cannot be undone.
              </p>
              
              <div className="flex gap-3 justify-end">
                <button 
                  disabled={isDeleting}
                  onClick={() => setDeleteModalRes(null)} 
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button 
                  disabled={isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      const res = await fetch(`/api/hotel/reservations/${deleteModalRes.id}`, { method: 'DELETE' });
                      const json = await res.json();
                      if (res.ok) {
                        window.location.reload();
                      } else {
                        alert(json.error || 'Failed to delete');
                      }
                    } catch(err) {
                       console.error(err);
                       alert('Error deleting');
                    }
                    setIsDeleting(false);
                    setDeleteModalRes(null);
                  }} 
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {detailsReservationId && (
        <ReservationDetailsDrawer
          reservationId={detailsReservationId}
          onClose={() => setDetailsReservationId(null)}
        />
      )}

    </div>
  );
}
