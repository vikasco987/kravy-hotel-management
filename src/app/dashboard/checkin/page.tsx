"use client";

import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  Search,
  Calendar,
  ChevronDown,
  MoreVertical,
  ArrowUpRight,
  UserCheck,
  UserRound,
  LogOut,
  Settings,
  Hotel, ChevronRight, CheckCircle2, Plus
} from 'lucide-react';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

export default function CheckinCheckoutPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/hotel/checkin-data')
      .then(res => res.json())
      .then(d => {
        if (d.success) {
          setData(d);
        }
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

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

  const stats = data?.stats || { checkInsToday: 0, checkOutsToday: 0, inHouse: 0, totalBookings: 0 };
  const roomStats = data?.roomStats || { available: 0, occupied: 0, dirty: 0, maintenance: 0, blocked: 0 };
  const groups = data?.groups || { checkIns: [], inHouse: [], checkOuts: [] };
  const totalRooms = roomStats.available + roomStats.occupied + roomStats.dirty + roomStats.maintenance + roomStats.blocked;
  const occupancyRate = totalRooms > 0 ? Math.round((roomStats.occupied / totalRooms) * 100) : 0;

  const renderTableRow = (res: any, statusType: 'checkin' | 'inhouse' | 'checkout') => {
    let statusBadge;
    if (statusType === 'checkin') {
      statusBadge = <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-widest">Check-in</span>;
    } else if (statusType === 'inhouse') {
      statusBadge = <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-widest">In House</span>;
    } else {
      statusBadge = <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 uppercase tracking-widest">Check-out</span>;
    }

    return (
      <tr key={res.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100/50 last:border-0 group">
        <td className="px-5 py-4 w-[40px]">
          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
        </td>
        <td className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarColor(res.guestName)}`}>
              {getInitials(res.guestName)}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900 leading-tight">{res.guestName}</span>
              <span className="text-[10px] text-gray-500 font-medium">{res.guestPhone}</span>
              <span className="text-[10px] text-gray-400 mt-0.5">ID: {res.shortId}</span>
            </div>
          </div>
        </td>
        <td className="px-5 py-4">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-800 leading-tight">{res.rooms.length > 0 ? res.rooms[0].split('-')[0].trim() : 'Unassigned'}</span>
            <span className="text-[10px] text-gray-500 font-medium">{res.rooms.length > 0 ? res.rooms[0].split('-')[1].split('(')[0].trim() : 'Standard'}</span>
            <span className="text-[10px] text-gray-400 mt-0.5">₹{res.totalAmount ? (res.totalAmount/100).toLocaleString() : '0'} / total</span>
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
        <td className="px-5 py-4 text-center">
          {statusBadge}
        </td>
        <td className="px-5 py-4">
          <div className="flex items-center justify-end gap-2">
            <button className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 transition shadow-sm bg-white opacity-0 group-hover:opacity-100">
              View
            </button>
            <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer">
              <MoreVertical size={16} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] font-sans pb-12">
      {/* HEADER SECTION */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 sticky top-[72px] z-40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-[1600px] mx-auto w-full">
           
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
               <CalendarDays size={24} strokeWidth={2.5} />
             </div>
             <div>
               <h1 className="text-2xl font-black text-gray-900 tracking-tight">Check-in / Check-out</h1>
               <p className="text-gray-500 font-medium text-xs mt-1">Manage guest arrivals and departures</p>
             </div>
           </div>

           {/* TOP STATS */}
           <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              <div className="bg-white border border-gray-100 rounded-xl p-4 min-w-[160px] shadow-sm flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><UserCheck size={18} /></div>
                 <div>
                   <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between w-full">Today's Check-ins <ChevronRight size={10} className="text-gray-300 ml-2" /></div>
                   <div className="text-xl font-black text-gray-900">{stats.checkInsToday}</div>
                   <div className="text-[9px] font-bold text-emerald-500 mt-0.5 flex items-center gap-1"><ArrowUpRight size={10} /> 100% vs yesterday</div>
                 </div>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4 min-w-[160px] shadow-sm flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center"><LogOut size={18} /></div>
                 <div>
                   <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between w-full">Today's Check-outs <ChevronRight size={10} className="text-gray-300 ml-2" /></div>
                   <div className="text-xl font-black text-gray-900">{stats.checkOutsToday}</div>
                   <div className="text-[9px] font-bold text-emerald-500 mt-0.5 flex items-center gap-1"><ArrowUpRight size={10} /> 50% vs yesterday</div>
                 </div>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4 min-w-[160px] shadow-sm flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><UserRound size={18} /></div>
                 <div>
                   <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between w-full">In House Guests <ChevronRight size={10} className="text-gray-300 ml-2" /></div>
                   <div className="text-xl font-black text-gray-900">{stats.inHouse}</div>
                   <div className="text-[9px] font-bold text-emerald-500 mt-0.5 flex items-center gap-1"><ArrowUpRight size={10} /> 20% vs yesterday</div>
                 </div>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4 min-w-[160px] shadow-sm flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center"><CalendarDays size={18} /></div>
                 <div>
                   <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between w-full">Total Bookings <ChevronRight size={10} className="text-gray-300 ml-2" /></div>
                   <div className="text-xl font-black text-gray-900">{stats.totalBookings}</div>
                   <div className="text-[9px] font-bold text-emerald-500 mt-0.5 flex items-center gap-1"><ArrowUpRight size={10} /> 33% vs yesterday</div>
                 </div>
              </div>
           </div>

        </div>
      </div>

      <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full flex flex-col lg:flex-row gap-6">
        
        {/* LEFT COLUMN: MAIN LISTS */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          
          {/* FILTER BAR */}
          <div className="flex flex-col xl:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-2 overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 scrollbar-hide">
               <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full font-bold text-[11px] shadow-md shadow-indigo-500/20 whitespace-nowrap">
                  <CalendarDays size={14} /> All <span className="bg-indigo-500 px-1.5 py-0.5 rounded-md text-[9px]">{stats.totalBookings}</span>
               </button>
               <button className="flex items-center gap-2 bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-full font-bold text-[11px] transition whitespace-nowrap">
                  <CheckCircle2 size={14} /> Check-in <span className="bg-gray-100 px-1.5 py-0.5 rounded-md text-[9px]">{stats.checkInsToday}</span>
               </button>
               <button className="flex items-center gap-2 bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-full font-bold text-[11px] transition whitespace-nowrap">
                  <LogOut size={14} /> Check-out <span className="bg-gray-100 px-1.5 py-0.5 rounded-md text-[9px]">{stats.checkOutsToday}</span>
               </button>
               <button className="flex items-center gap-2 bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-full font-bold text-[11px] transition whitespace-nowrap">
                  <UserRound size={14} /> In House <span className="bg-gray-100 px-1.5 py-0.5 rounded-md text-[9px]">{stats.inHouse}</span>
               </button>
               <button className="flex items-center gap-2 bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-full font-bold text-[11px] transition whitespace-nowrap">
                  <CalendarDays size={14} /> Upcoming <span className="bg-gray-100 px-1.5 py-0.5 rounded-md text-[9px]">0</span>
               </button>
               <div className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-full font-bold text-[11px] transition whitespace-nowrap cursor-pointer ml-2">
                  <Calendar size={14} /> {dayjs().format('DD MMM YYYY')} <ChevronDown size={14} className="text-gray-400" />
               </div>
             </div>

             <div className="relative w-full xl:w-[350px]">
               <Search size={14} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
               <input type="text" placeholder="Search by guest name, room number, or reservation ID..." className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-[11px] font-medium" />
             </div>
          </div>

          {/* MAIN TABLE */}
          <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden pb-4">
            
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <th className="px-5 py-4 w-[40px]"><input type="checkbox" className="rounded border-gray-300" disabled /></th>
                  <th className="px-5 py-4">Guest</th>
                  <th className="px-5 py-4">Room</th>
                  <th className="px-5 py-4">Check-in</th>
                  <th className="px-5 py-4">Check-out</th>
                  <th className="px-5 py-4 text-center">Status</th>
                  <th className="px-5 py-4 text-right pr-12">Actions</th>
                </tr>
              </thead>
              <tbody>
                 {/* CHECK-INS GROUP */}
                 {groups.checkIns.length > 0 && (
                   <>
                   <tr className="bg-emerald-50/50">
                     <td colSpan={7} className="px-5 py-3 border-y border-emerald-100/50">
                       <div className="flex items-center gap-3">
                         <div className="w-6 h-6 rounded-md bg-white border border-emerald-200 flex items-center justify-center text-emerald-600"><UserCheck size={12} strokeWidth={3}/></div>
                         <h2 className="text-sm font-black text-emerald-800 tracking-tight">Check-ins ({groups.checkIns.length})</h2>
                         <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest ml-2">{groups.checkIns.length} guests</span>
                       </div>
                     </td>
                   </tr>
                   {groups.checkIns.map((res: any) => renderTableRow(res, 'checkin'))}
                   </>
                 )}

                 {/* IN HOUSE GROUP */}
                 {groups.inHouse.length > 0 && (
                   <>
                   <tr className="bg-blue-50/50">
                     <td colSpan={7} className="px-5 py-3 border-y border-blue-100/50 mt-4">
                       <div className="flex items-center gap-3">
                         <div className="w-6 h-6 rounded-md bg-white border border-blue-200 flex items-center justify-center text-blue-600"><Hotel size={12} strokeWidth={3}/></div>
                         <h2 className="text-sm font-black text-blue-800 tracking-tight">In House ({groups.inHouse.length})</h2>
                         <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest ml-2">{groups.inHouse.length} guests</span>
                       </div>
                     </td>
                   </tr>
                   {groups.inHouse.map((res: any) => renderTableRow(res, 'inhouse'))}
                   </>
                 )}

                 {/* CHECK-OUTS GROUP */}
                 {groups.checkOuts.length > 0 && (
                   <>
                   <tr className="bg-rose-50/50">
                     <td colSpan={7} className="px-5 py-3 border-y border-rose-100/50 mt-4">
                       <div className="flex items-center gap-3">
                         <div className="w-6 h-6 rounded-md bg-white border border-rose-200 flex items-center justify-center text-rose-600"><LogOut size={12} strokeWidth={3}/></div>
                         <h2 className="text-sm font-black text-rose-800 tracking-tight">Check-outs ({groups.checkOuts.length})</h2>
                         <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest ml-2">{groups.checkOuts.length} guests</span>
                       </div>
                     </td>
                   </tr>
                   {groups.checkOuts.map((res: any) => renderTableRow(res, 'checkout'))}
                   </>
                 )}

                 {groups.checkIns.length === 0 && groups.inHouse.length === 0 && groups.checkOuts.length === 0 && (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-500 font-bold">No data available for today.</td></tr>
                 )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6">
           
           {/* Today's Summary (Donut Chart) */}
           <div className="bg-white border border-gray-100 rounded-[20px] p-6 shadow-sm">
             <div className="flex items-center gap-2 mb-6">
               <CalendarDays size={16} className="text-indigo-600" />
               <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Today's Summary</h3>
             </div>
             
             <div className="flex items-center justify-between">
               {/* Circle Graph */}
               <div className="relative w-[110px] h-[110px]">
                 <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 drop-shadow-md">
                    <path className="text-gray-100" strokeWidth="8" stroke="currentColor" fill="none" d="M18 3 a 15 15 0 0 1 0 30 a 15 15 0 0 1 0 -30" />
                    <path className="text-indigo-500" strokeDasharray={`${occupancyRate}, 100`} strokeWidth="8" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 3 a 15 15 0 0 1 0 30 a 15 15 0 0 1 0 -30" />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-full m-2 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
                    <span className="text-xl font-black text-gray-900 leading-none">{occupancyRate}%</span>
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Occupancy</span>
                 </div>
               </div>

               {/* Legend */}
               <div className="space-y-2.5 flex-1 pl-6">
                 <div className="flex justify-between items-center text-[10px] font-bold text-gray-600">
                   <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Available</div>
                   <span className="text-gray-900">{roomStats.available}</span>
                 </div>
                 <div className="flex justify-between items-center text-[10px] font-bold text-gray-600">
                   <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500"></div>Occupied</div>
                   <span className="text-gray-900">{roomStats.occupied}</span>
                 </div>
                 <div className="flex justify-between items-center text-[10px] font-bold text-gray-600">
                   <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div>Dirty</div>
                   <span className="text-gray-900">{roomStats.dirty}</span>
                 </div>
                 <div className="flex justify-between items-center text-[10px] font-bold text-gray-600">
                   <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div>Maintenance</div>
                   <span className="text-gray-900">{roomStats.maintenance}</span>
                 </div>
                 <div className="flex justify-between items-center text-[10px] font-bold text-gray-600">
                   <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-500"></div>Blocked</div>
                   <span className="text-gray-900">{roomStats.blocked}</span>
                 </div>
               </div>
             </div>
           </div>

           {/* Quick Actions */}
           <div className="bg-white border border-gray-100 rounded-[20px] p-6 shadow-sm">
             <div className="flex items-center gap-2 mb-4">
               <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><Plus size={14} strokeWidth={3} /></div>
               <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Quick Actions</h3>
             </div>
             
             <div className="grid grid-cols-2 gap-3">
               <button onClick={() => router.push('/dashboard/book')} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 p-3 rounded-xl flex items-center justify-between transition group">
                 <div className="flex items-center gap-2"><UserCheck size={16} /> <span className="text-[10px] font-bold">Check-in</span></div>
                 <ArrowUpRight size={14} className="opacity-50 group-hover:opacity-100" />
               </button>
               <button className="bg-purple-50 text-purple-700 hover:bg-purple-100 p-3 rounded-xl flex items-center justify-between transition group">
                 <div className="flex items-center gap-2"><LogOut size={16} /> <span className="text-[10px] font-bold">Check-out</span></div>
                 <ArrowUpRight size={14} className="opacity-50 group-hover:opacity-100" />
               </button>
               <button className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 p-3 rounded-xl flex items-center justify-between transition group">
                 <div className="flex items-center gap-2"><CalendarDays size={16} /> <span className="text-[10px] font-bold">Reservations</span></div>
                 <ArrowUpRight size={14} className="opacity-50 group-hover:opacity-100" />
               </button>
               <button className="bg-blue-50 text-blue-700 hover:bg-blue-100 p-3 rounded-xl flex items-center justify-between transition group">
                 <div className="flex items-center gap-2"><Search size={16} /> <span className="text-[10px] font-bold">Guest Search</span></div>
                 <ArrowUpRight size={14} className="opacity-50 group-hover:opacity-100" />
               </button>
             </div>
           </div>

           {/* Recent Activity */}
           <div className="bg-white border border-gray-100 rounded-[20px] p-6 shadow-sm flex-1">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Recent Activity</h3>
               <span className="text-[10px] font-bold text-indigo-600 cursor-pointer hover:underline">View All</span>
             </div>
             
             <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[5px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent pl-4">
                
                <div className="relative flex items-start gap-4">
                  <div className="absolute -left-4 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm top-1"></div>
                  <div>
                    <div className="text-[11px] font-bold text-gray-900">Check-in completed</div>
                    <div className="text-[10px] font-medium text-gray-500 mt-0.5">Rahul Sharma - Room 454</div>
                  </div>
                  <div className="text-[9px] font-bold text-gray-400 ml-auto pt-0.5">2m ago</div>
                </div>

                <div className="relative flex items-start gap-4">
                  <div className="absolute -left-4 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm top-1"></div>
                  <div>
                    <div className="text-[11px] font-bold text-gray-900">Check-out completed</div>
                    <div className="text-[10px] font-medium text-gray-500 mt-0.5">Vikash Singh - Room 5555</div>
                  </div>
                  <div className="text-[9px] font-bold text-gray-400 ml-auto pt-0.5">28m ago</div>
                </div>

                <div className="relative flex items-start gap-4">
                  <div className="absolute -left-4 w-3 h-3 rounded-full bg-amber-500 border-2 border-white shadow-sm top-1"></div>
                  <div>
                    <div className="text-[11px] font-bold text-gray-900">Room status changed</div>
                    <div className="text-[10px] font-medium text-gray-500 mt-0.5">Room 654 - Occupied</div>
                  </div>
                  <div className="text-[9px] font-bold text-gray-400 ml-auto pt-0.5">1h ago</div>
                </div>

                <div className="relative flex items-start gap-4">
                  <div className="absolute -left-4 w-3 h-3 rounded-full bg-purple-500 border-2 border-white shadow-sm top-1"></div>
                  <div>
                    <div className="text-[11px] font-bold text-gray-900">New reservation</div>
                    <div className="text-[10px] font-medium text-gray-500 mt-0.5">Priya Singh - Room 555</div>
                  </div>
                  <div className="text-[9px] font-bold text-gray-400 ml-auto pt-0.5">2h ago</div>
                </div>

             </div>
           </div>
           
           {/* Ad Banner */}
           <div className="rounded-[20px] bg-gradient-to-br from-blue-900 to-indigo-900 p-6 relative overflow-hidden text-white shadow-md">
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600&q=80')] opacity-30 bg-cover bg-center mix-blend-overlay"></div>
             <div className="relative z-10">
               <h3 className="text-lg font-black leading-tight tracking-tight mb-1">Happy Guests<br/>Build Great Stays</h3>
               <div className="flex items-center gap-2 mt-6 opacity-70">
                 <span className="text-rose-400">♥</span>
                 <span className="text-[9px] font-bold uppercase tracking-widest">Grand Plaza Hotel & Resort</span>
               </div>
             </div>
           </div>

        </div>

      </div>
    </div>
  );
}
