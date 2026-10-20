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
  ChevronRight,
  Code,
  Copy,
  Check,
  X,
  Printer
} from 'lucide-react';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { ReservationDetailsDrawer } from './ReservationDetailsDrawer';
import { useRef } from 'react';
import { ApiJsonDebugger } from '@/components/ui/ApiJsonDebugger';

interface Reservation {
  id: string;
  stayId?: string;
  reservationNumber: number;
  guestName: string;
  guestPhone: string;
  rooms: string[];
  firstActiveRoomId?: string;
  checkInDate: string;
  checkOutDate: string;
  actualCheckOutDate?: string;
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

  const [canPrintInvoice, setCanPrintInvoice] = useState(true);
  const [canPrintReceipt, setCanPrintReceipt] = useState(true);
  const [canPrint80mm, setCanPrint80mm] = useState(true);
  const [canPrint58mm, setCanPrint58mm] = useState(true);
  const [printSubmenuOpenId, setPrintSubmenuOpenId] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [apiRequests, setApiRequests] = useState<any[]>([]);
  const [isApiJsonOpen, setIsApiJsonOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = searchQuery.trim();
      const newSearch = trimmed.length >= 2 ? searchQuery : "";
      setDebouncedSearch(newSearch);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    setLoading(true);
    const abortController = new AbortController();

    const params = new URLSearchParams({
      page: page.toString(),
      limit: '10',
      search: debouncedSearch,
      status: statusFilter,
      checkInDate: checkInDateFilter,
      checkOutDate: checkOutDateFilter
    });
    const url = `/api/hotel/reservations?${params.toString()}`;
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
          setData({ stats: d.stats, reservations: d.reservations });
          if (d.pagination) setPaginationData(d.pagination);
          if (d.isAdmin !== undefined) setIsAdmin(d.isAdmin);
          if (d.canPrintInvoice !== undefined) setCanPrintInvoice(d.canPrintInvoice);
          if (d.canPrintReceipt !== undefined) setCanPrintReceipt(d.canPrintReceipt);
          if (d.canPrint80mm !== undefined) setCanPrint80mm(d.canPrint80mm);
          if (d.canPrint58mm !== undefined) setCanPrint58mm(d.canPrint58mm);
        }
        setLoading(false);
      })
      .catch(e => {
        if (e.name === 'AbortError') {
           return; // Ignore aborted requests
        }

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

  if (loading && !data) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500 bg-[#F4F6F9]">Loading Reservations...</div>;

  const stats = data?.stats || { total: 0, checkedIn: 0, checkedOut: 0, upcomingCheckIns: 0, upcomingCheckOuts: 0 };
  const allReservations = data?.reservations || [];

  const reservations = allReservations;

  return (
    <div className="min-h-screen bg-[#F4F6F9] font-sans">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full space-y-6">

        {/* HERO HEADER */}
        <div className="relative w-full h-[180px] md:h-[220px] rounded-3xl overflow-hidden flex flex-col justify-center shadow-[0_12px_36px_-6px_rgba(30,41,59,0.12)] border border-white/60">
           {/* Background Image with warm saturation and brightness */}
           <img
             src="/images/reservations-banner.jpg"
             className="absolute inset-0 w-full h-full object-cover object-[center_35%] scale-[1.02] filter brightness-[1.04] contrast-[1.05] saturate-[1.12]"
             alt="Background"
           />

           {/* Cinematic Golden-Hour Sunbeam & Warm Light Overlays */}
           <div className="absolute inset-0 bg-gradient-to-r from-amber-500/15 via-orange-400/10 to-yellow-200/20 mix-blend-color-dodge pointer-events-none"></div>
           <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-amber-200/15 pointer-events-none"></div>

           {/* Soft Left Frosted Glow for Text Contrast matching reference */}
           <div className="absolute inset-y-0 left-0 w-full md:w-[58%] bg-gradient-to-r from-white/95 via-white/80 to-transparent backdrop-blur-[2px]"></div>

           {/* Content Box */}
           <div className="relative z-10 px-6 md:px-10 flex items-center gap-5">
             <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/90 backdrop-blur-md flex items-center justify-center text-indigo-600 shadow-[0_8px_20px_rgba(79,70,229,0.12)] border border-white/80 shrink-0">
               <CalendarDays size={32} strokeWidth={2.2} />
             </div>
             <div>
               <h1 className="text-2xl md:text-[28px] font-black text-gray-900 tracking-tight leading-tight drop-shadow-xs">Reservations</h1>
               <p className="text-gray-600 font-semibold text-xs md:text-sm mt-1">Manage guest reservations and bookings</p>
             </div>
           </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 -mt-10 relative z-20 px-2 md:px-4">
           {/* Card 1: Total Reservations */}
           <div className="group relative bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-[0_10px_25px_-5px_rgba(59,130,246,0.1),0_4px_12px_rgba(0,0,0,0.04)] border border-white hover:border-blue-200 transition-all duration-300 hover:shadow-[0_14px_30px_-5px_rgba(59,130,246,0.16)] flex flex-col justify-between overflow-hidden col-span-2 md:col-span-1 min-h-[105px]">
             <div className="flex items-center gap-3.5 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs border border-blue-100/60 shrink-0">
                   <CalendarDays size={20} strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                   <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">TOTAL RESERVATIONS</div>
                   <div className="text-2xl md:text-3xl font-black text-gray-900 mt-1 leading-none tracking-tight">{stats.total}</div>
                </div>
             </div>
             {/* Decorative Sparkline Wave Graphic */}
             <div className="absolute right-0 bottom-0 w-[55%] h-12 pointer-events-none opacity-85 group-hover:opacity-100 transition-opacity">
                <svg viewBox="0 0 120 40" fill="none" preserveAspectRatio="none" className="w-full h-full">
                  <defs>
                    <linearGradient id="blueWave" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.1" />
                      <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.75" />
                    </linearGradient>
                    <linearGradient id="blueFill" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#eff6ff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 32 Q 30 18, 55 26 T 100 12 T 120 16 L 120 40 L 0 40 Z" fill="url(#blueFill)" />
                  <path d="M0 32 Q 30 18, 55 26 T 100 12 T 120 16" stroke="url(#blueWave)" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
             </div>
           </div>

           {/* Card 2: Checked In */}
           <div className="group relative bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-[0_10px_25px_-5px_rgba(16,185,129,0.1),0_4px_12px_rgba(0,0,0,0.04)] border border-white hover:border-emerald-200 transition-all duration-300 hover:shadow-[0_14px_30px_-5px_rgba(16,185,129,0.16)] flex flex-col justify-between overflow-hidden min-h-[105px]">
             <div className="flex items-center gap-3.5 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs border border-emerald-100/60 shrink-0">
                   <CheckCircle2 size={20} strokeWidth={2.4} />
                </div>
                <div className="min-w-0">
                   <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">CHECKED IN</div>
                   <div className="text-2xl md:text-3xl font-black text-gray-900 mt-1 leading-none tracking-tight">{stats.checkedIn}</div>
                </div>
             </div>
             {/* Decorative Sparkline Wave Graphic */}
             <div className="absolute right-0 bottom-0 w-[55%] h-12 pointer-events-none opacity-85 group-hover:opacity-100 transition-opacity">
                <svg viewBox="0 0 120 40" fill="none" preserveAspectRatio="none" className="w-full h-full">
                  <defs>
                    <linearGradient id="emeraldWave" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.1" />
                      <stop offset="50%" stopColor="#34d399" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.75" />
                    </linearGradient>
                    <linearGradient id="emeraldFill" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#bbf7d0" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#f0fdf4" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 34 Q 30 24, 60 22 T 95 10 T 120 18 L 120 40 L 0 40 Z" fill="url(#emeraldFill)" />
                  <path d="M0 34 Q 30 24, 60 22 T 95 10 T 120 18" stroke="url(#emeraldWave)" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
             </div>
           </div>

           {/* Card 3: Checked Out */}
           <div className="group relative bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-[0_10px_25px_-5px_rgba(168,85,247,0.1),0_4px_12px_rgba(0,0,0,0.04)] border border-white hover:border-purple-200 transition-all duration-300 hover:shadow-[0_14px_30px_-5px_rgba(168,85,247,0.16)] flex flex-col justify-between overflow-hidden min-h-[105px]">
             <div className="flex items-center gap-3.5 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-xs border border-purple-100/60 shrink-0">
                   <LogOut size={20} strokeWidth={2.3} />
                </div>
                <div className="min-w-0">
                   <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">CHECKED OUT</div>
                   <div className="text-2xl md:text-3xl font-black text-gray-900 mt-1 leading-none tracking-tight">{stats.checkedOut}</div>
                </div>
             </div>
             {/* Decorative Sparkline Wave Graphic */}
             <div className="absolute right-0 bottom-0 w-[55%] h-12 pointer-events-none opacity-85 group-hover:opacity-100 transition-opacity">
                <svg viewBox="0 0 120 40" fill="none" preserveAspectRatio="none" className="w-full h-full">
                  <defs>
                    <linearGradient id="purpleWave" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#e9d5ff" stopOpacity="0.1" />
                      <stop offset="50%" stopColor="#c084fc" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity="0.75" />
                    </linearGradient>
                    <linearGradient id="purpleFill" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#e9d5ff" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#faf5ff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 36 Q 35 28, 65 24 T 100 14 T 120 20 L 120 40 L 0 40 Z" fill="url(#purpleFill)" />
                  <path d="M0 36 Q 35 28, 65 24 T 100 14 T 120 20" stroke="url(#purpleWave)" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
             </div>
           </div>

           {/* Card 4: Upcoming Check-ins */}
           <div className="group relative bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-[0_10px_25px_-5px_rgba(245,158,11,0.1),0_4px_12px_rgba(0,0,0,0.04)] border border-white hover:border-amber-200 transition-all duration-300 hover:shadow-[0_14px_30px_-5px_rgba(245,158,11,0.16)] flex flex-col justify-between overflow-hidden min-h-[105px]">
             <div className="flex items-center gap-3.5 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs border border-amber-100/60 shrink-0">
                   <CalendarPlus size={20} strokeWidth={2.3} />
                </div>
                <div className="min-w-0">
                   <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">UPCOMING CHECK-INS</div>
                   <div className="text-2xl md:text-3xl font-black text-gray-900 mt-1 leading-none tracking-tight">{stats.upcomingCheckIns}</div>
                </div>
             </div>
             {/* Decorative Sparkline Wave Graphic */}
             <div className="absolute right-0 bottom-0 w-[55%] h-12 pointer-events-none opacity-85 group-hover:opacity-100 transition-opacity">
                <svg viewBox="0 0 120 40" fill="none" preserveAspectRatio="none" className="w-full h-full">
                  <defs>
                    <linearGradient id="amberWave" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#fde68a" stopOpacity="0.1" />
                      <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.75" />
                    </linearGradient>
                    <linearGradient id="amberFill" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#fffbeb" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 35 Q 35 25, 65 24 T 100 12 T 120 18 L 120 40 L 0 40 Z" fill="url(#amberFill)" />
                  <path d="M0 35 Q 35 25, 65 24 T 100 12 T 120 18" stroke="url(#amberWave)" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
             </div>
           </div>

           {/* Card 5: Upcoming Check-outs */}
           <div className="group relative bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-[0_10px_25px_-5px_rgba(244,63,94,0.1),0_4px_12px_rgba(0,0,0,0.04)] border border-white hover:border-rose-200 transition-all duration-300 hover:shadow-[0_14px_30px_-5px_rgba(244,63,94,0.16)] flex flex-col justify-between overflow-hidden min-h-[105px]">
             <div className="flex items-center gap-3.5 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-xs border border-rose-100/60 shrink-0">
                   <CalendarCheck size={20} strokeWidth={2.3} />
                </div>
                <div className="min-w-0">
                   <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">UPCOMING CHECK-OUTS</div>
                   <div className="text-2xl md:text-3xl font-black text-gray-900 mt-1 leading-none tracking-tight">{stats.upcomingCheckOuts}</div>
                </div>
             </div>
             {/* Decorative Sparkline Wave Graphic */}
             <div className="absolute right-0 bottom-0 w-[55%] h-12 pointer-events-none opacity-85 group-hover:opacity-100 transition-opacity">
                <svg viewBox="0 0 120 40" fill="none" preserveAspectRatio="none" className="w-full h-full">
                  <defs>
                    <linearGradient id="roseWave" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#fecdd3" stopOpacity="0.1" />
                      <stop offset="50%" stopColor="#fb7185" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.75" />
                    </linearGradient>
                    <linearGradient id="roseFill" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ffe4e6" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#fff1f2" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 36 Q 30 26, 60 22 T 95 10 T 120 16 L 120 40 L 0 40 Z" fill="url(#roseFill)" />
                  <path d="M0 36 Q 30 26, 60 22 T 95 10 T 120 16" stroke="url(#roseWave)" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
             </div>
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
                   <input type="date" value={checkInDateFilter} onChange={(e) => { setCheckInDateFilter(e.target.value); setPage(1); }} className="text-xs font-bold text-gray-700 outline-none bg-transparent" />
                 </div>
              </div>

              <div className="relative flex items-center bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-2 cursor-pointer hover:bg-gray-50">
                 <Calendar size={16} className="text-gray-400 mr-2" />
                 <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-gray-400 uppercase">Check-out</span>
                   <input type="date" value={checkOutDateFilter} onChange={(e) => { setCheckOutDateFilter(e.target.value); setPage(1); }} className="text-xs font-bold text-gray-700 outline-none bg-transparent" />
                 </div>
              </div>

              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-3 min-w-[140px] cursor-pointer hover:bg-gray-50 outline-none text-xs font-bold text-gray-700 appearance-none">
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
             {isAdmin && (
               <button onClick={() => setIsApiJsonOpen(true)} className="bg-slate-800 text-white hover:bg-slate-700 px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition whitespace-nowrap">
                 <Code size={16} strokeWidth={2.5} /> API JSON
               </button>
             )}
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
               <tbody className={`divide-y divide-gray-50 ${loading ? 'opacity-50 pointer-events-none transition-opacity duration-200' : 'transition-opacity duration-200'}`}>
                 {reservations.length === 0 ? (
                   <tr>
                     <td colSpan={11} className="px-6 py-12 text-center text-gray-400 font-medium">No reservations found.</td>
                   </tr>
                 ) : reservations.map((res) => (
                   <tr key={res.id} className="hover:bg-gray-50/50 transition-colors">
                     <td className="px-6 py-4">
                       <span className="text-xs font-bold text-gray-500">#RES-{res.reservationNumber}</span>
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
                       {(() => {
                          const today = dayjs().startOf('day');
                          const expected = dayjs(res.checkOutDate).startOf('day');
                          const isOverdue = res.status === 'CHECKED_IN' && today.isAfter(expected);

                          if (res.status === 'CHECKED_OUT') {
                             return (
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-gray-800">{res.actualCheckOutDate ? dayjs(res.actualCheckOutDate).format('DD MMM YYYY') : '-'}</span>
                                  <span className="text-[11px] text-gray-500 font-medium">{res.actualCheckOutDate ? dayjs(res.actualCheckOutDate).format('hh:mm A') : '-'}</span>
                                </div>
                             );
                          }
                          if (isOverdue) {
                             return (
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                     <span className="text-xs font-bold text-orange-600">{today.format('DD MMM YYYY')}</span>
                                     <span className="px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700 text-[9px] font-black uppercase tracking-wider">Extended</span>
                                  </div>
                                  <span className="text-[10px] text-gray-500 font-medium line-through decoration-gray-400">Exp: {res.checkOutDate ? dayjs(res.checkOutDate).format('DD MMM YYYY') : '-'}</span>
                                </div>
                             );
                          }
                          return (
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-800">{res.checkOutDate ? dayjs(res.checkOutDate).format('DD MMM YYYY') : '-'}</span>
                                <span className="text-[11px] text-gray-500 font-medium">{res.checkOutDate ? dayjs(res.checkOutDate).format('hh:mm A') : '-'}</span>
                              </div>
                          );
                       })()}
                     </td>
                     <td className="px-6 py-4 text-sm font-bold text-gray-800">
                       {(() => {
                          if (res.status === 'CHECKED_IN' && res.checkOutDate && dayjs().startOf('day').isAfter(dayjs(res.checkOutDate).startOf('day'))) {
                             return Math.max(1, dayjs().startOf('day').diff(dayjs(res.checkInDate).startOf('day'), 'day'));
                          }
                          return res.nights;
                       })()}
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
    <div className="absolute right-8 top-10 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 text-left">
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
         <button onClick={() => {
           setActionMenuOpenId(null);
           setPrintSubmenuOpenId(null);
           if (!res.firstActiveRoomId) {
             alert('No active room assigned for checkout.');
             return;
           }
           router.push(`/dashboard/checkout?roomId=${res.firstActiveRoomId}`);
         }} className="w-full text-left px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50">Check-out</button>
      )}
      {res.status === "CHECKED_OUT" && (
         <div
           className="relative group"
           onMouseEnter={() => setPrintSubmenuOpenId(res.id)}
           onMouseLeave={() => setPrintSubmenuOpenId(null)}
         >
           <button
             type="button"
             onClick={(e) => {
               e.stopPropagation();
               setPrintSubmenuOpenId(prev => (prev === res.id ? null : res.id));
             }}
             className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-between"
           >
             <span className="flex items-center gap-1.5">
               <Printer size={13} className="text-gray-500" />
               Print Invoice
             </span>
             <ChevronRight size={13} className="text-gray-400 group-hover:text-gray-600" />
           </button>
           {printSubmenuOpenId === res.id && (
             <div
               onClick={(e) => e.stopPropagation()}
               className="absolute right-full top-0 pr-1.5 -mr-1.5 z-[60]"
             >
               <div className="w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-1 overflow-hidden text-left">
               {(canPrintInvoice ?? true) && (
                 <button
                   type="button"
                   onClick={() => {
                     setActionMenuOpenId(null);
                     setPrintSubmenuOpenId(null);
                     const targetStayId = res.stayId || res.id;
                     window.open(`/dashboard/print/invoice/${targetStayId}?format=A4`, "_blank");
                   }}
                   className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                 >
                   <span>A4 Invoice</span>
                 </button>
               )}
               {(canPrint80mm ?? canPrintReceipt ?? true) && (
                 <button
                   type="button"
                   onClick={() => {
                     setActionMenuOpenId(null);
                     setPrintSubmenuOpenId(null);
                     const targetStayId = res.stayId || res.id;
                     window.open(`/dashboard/print/invoice/${targetStayId}?format=80mm`, "_blank");
                   }}
                   className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                 >
                   <span>3-inch Thermal Receipt (80mm)</span>
                 </button>
               )}
               {(canPrint58mm ?? canPrintReceipt ?? true) && (
                 <button
                   type="button"
                   onClick={() => {
                     setActionMenuOpenId(null);
                     setPrintSubmenuOpenId(null);
                     const targetStayId = res.stayId || res.id;
                     window.open(`/dashboard/print/invoice/${targetStayId}?format=58mm`, "_blank");
                   }}
                   className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                 >
                   <span>2-inch Thermal Receipt (58mm)</span>
                 </button>
               )}
               </div>
             </div>
           )}
         </div>
      )}
      {(res.status !== "CHECKED_IN" && res.status !== "CHECKED_OUT") && (
         <button onClick={() => { setActionMenuOpenId(null); setPrintSubmenuOpenId(null); setDeleteModalRes(res); }} className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 border-t border-gray-100 mt-1">Delete Reservation</button>
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
                Are you sure you want to delete reservation <strong>#RES-{deleteModalRes.reservationNumber}</strong> for guest <strong>{deleteModalRes.guestName}</strong>? This action cannot be undone.
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

      <ApiJsonDebugger
        apiRequests={apiRequests}
        isOpen={isApiJsonOpen}
        onClose={() => setIsApiJsonOpen(false)}
        onClear={() => setApiRequests([])}
      />

    </div>
  );
}
