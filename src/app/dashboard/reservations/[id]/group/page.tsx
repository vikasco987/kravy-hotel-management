"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar, User, Phone, MapPin, 
  CreditCard, Receipt, Building, CheckCircle2,
  Clock, AlertCircle, Home, Mail, FileText, ChevronRight,
  Users, UserCheck
} from 'lucide-react';
import dayjs from 'dayjs';

function getStatusBadge(status: string) {
  switch (status) {
    case 'CHECKED_IN': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100"><CheckCircle2 size={12} /> Checked In</span>;
    case 'CHECKED_OUT': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100"><CheckCircle2 size={12} /> Checked Out</span>;
    case 'RESERVED': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-100"><Clock size={12} /> Reserved</span>;
    case 'CONFIRMED': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100"><CheckCircle2 size={12} /> Confirmed</span>;
    case 'CANCELLED': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-100"><AlertCircle size={12} /> Cancelled</span>;
    default: return <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-200">{status}</span>;
  }
}

export default function GroupReservationView({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReservation();
  }, [id]);

  const fetchReservation = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/hotel/reservations/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch reservation');
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] p-8 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data?.reservation) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] p-8 flex flex-col items-center justify-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Reservation</h2>
        <p className="text-gray-500 mb-6">{error || 'Reservation not found'}</p>
        <button onClick={() => router.back()} className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition">
          Go Back
        </button>
      </div>
    );
  }

  const { reservation, roomDetails } = data;
  const stay = reservation.stay;
  
  // Computations for overall financial summary
  const totalPaid = stay?.payments?.reduce((acc: number, p: any) => acc + p.amount, 0) || reservation.advanceAmount || 0;
  const balance = (stay?.invoice?.totalAmount || reservation.totalAmount) - totalPaid;
  const totalAmount = stay?.invoice?.totalAmount || reservation.totalAmount || 0;
  const roomRentTotal = stay?.invoice?.subtotal || reservation.totalAmount;
  const taxTotal = stay?.invoice?.taxAmount || 0;
  const extrasTotal = stay?.roomCharges?.length > 0 ? stay.roomCharges.reduce((acc: number, c: any) => acc + c.amount, 0) : 0;
  
  // Group summary details
  const firstRoom = reservation.rooms?.[0];
  const minCheckIn = reservation.rooms.reduce((min: any, r: any) => !min || dayjs(r.checkInDate).isBefore(min) ? dayjs(r.checkInDate) : min, null);
  const maxCheckOut = reservation.rooms.reduce((max: any, r: any) => !max || dayjs(r.checkOutDate).isAfter(max) ? dayjs(r.checkOutDate) : max, null);
  const nights = minCheckIn && maxCheckOut ? Math.max(1, maxCheckOut.diff(minCheckIn, 'day')) : '-';
  const totalGuests = reservation.rooms.reduce((acc: number, r: any) => acc + (r.guestsData?.length || 1), 0);

  // Derive Room Status
  const getRoomStatus = (roomId: string) => {
     if (reservation.status === 'CANCELLED' || reservation.status === 'NO_SHOW') return reservation.status;
     if (reservation.status === 'CHECKED_OUT') return 'CHECKED_OUT';
     if (reservation.status === 'RESERVED' || reservation.status === 'CONFIRMED') return reservation.status;
     
     // If overall is CHECKED_IN, we need to inspect stayRoom
     if (stay && stay.stayRooms) {
        const sr = stay.stayRooms.find((s: any) => s.roomId === roomId);
        if (sr) {
           if (sr.checkOutDate) return 'CHECKED_OUT';
           return 'CHECKED_IN';
        }
     }
     
     return 'RESERVED'; // Fallback if no stayRoom is found but it was booked
  };
  
  const isCheckedIn = reservation.status === 'CHECKED_IN' || reservation.status === 'CHECKED_OUT';

  return (
    <div className="min-h-screen bg-[#F4F6F9] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push(`/dashboard/reservations/${reservation.id}`)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 transition">
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">RES-{reservation.reservationNumber}</h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-purple-100 text-purple-700 uppercase tracking-widest"><Users size={12}/> Group</span>
                {getStatusBadge(reservation.status)}
              </div>
              <p className="text-sm font-medium text-gray-500 mt-0.5">
                Created on {dayjs(reservation.createdAt).format('DD MMM YYYY, hh:mm A')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {(reservation.status === 'RESERVED' || reservation.status === 'CONFIRMED') && (
              <button onClick={() => router.push(`/dashboard/book?resId=${reservation.id}`)} className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm flex items-center gap-2">
                <CheckCircle2 size={16} /> Proceed to Check-in
              </button>
            )}
            {reservation.status === 'CHECKED_IN' && (
              <button onClick={() => {
                const checkoutRoomId = stay?.stayRooms?.find((sr: any) => !sr.checkOutDate)?.roomId || firstRoom?.roomId;
                if (!checkoutRoomId) {
                  alert('No active room assigned for checkout.');
                  return;
                }
                router.push(`/dashboard/checkout?roomId=${checkoutRoomId}`);
              }} className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm flex items-center gap-2">
                <ArrowLeft size={16} className="rotate-180" /> Proceed to Check-out
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 mt-8">
        
        {/* GROUP SUMMARY */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm mb-8">
           <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
             <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
               <Building size={16} />
             </div>
             <h2 className="text-base font-bold text-gray-900">Group Summary</h2>
           </div>
           <div className="p-6 grid grid-cols-2 md:grid-cols-5 gap-6">
             <div className="col-span-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Lead Guest</p>
                <p className="text-sm font-bold text-gray-900">{reservation.guest?.name || 'Walk-in Guest'}</p>
                <p className="text-xs text-gray-500 font-medium">{reservation.guest?.phone || 'No phone'}</p>
             </div>
             <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Check-in</p>
                <p className="text-sm font-bold text-gray-900">{minCheckIn ? minCheckIn.format('DD MMM YYYY') : '-'}</p>
             </div>
             <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Check-out</p>
                <p className="text-sm font-bold text-gray-900">{maxCheckOut ? maxCheckOut.format('DD MMM YYYY') : '-'}</p>
             </div>
             <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Group Size</p>
                <p className="text-sm font-bold text-gray-900">{reservation.rooms.length} Rooms &bull; {totalGuests} Guests</p>
             </div>
           </div>
           
           <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs font-bold text-gray-500 mb-1">Total Amount</p>
                <p className="text-lg font-black text-gray-900">₹{(totalAmount/100).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 mb-1">Total Paid</p>
                <p className="text-lg font-black text-emerald-600">₹{(totalPaid/100).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 mb-1">Balance</p>
                <p className={`text-lg font-black ${balance > 0 ? 'text-rose-600' : 'text-gray-900'}`}>₹{(Math.max(0, balance)/100).toLocaleString()}</p>
              </div>
              <div className="flex items-center justify-end">
                {isCheckedIn && (
                    <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 flex items-center gap-2">
                      <CreditCard size={14}/> Add Payment
                    </button>
                )}
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ROOMS LIST (LEFT 2 COLS) */}
          <div className="lg:col-span-2 space-y-6">
             <h3 className="text-lg font-black text-gray-900 flex items-center gap-2"><Home size={20}/> Room Details & Guests</h3>
             
             {reservation.rooms.map((roomInfo: any, idx: number) => {
               const roomRecord = roomDetails?.find((r: any) => r.id === roomInfo.roomId);
               const roomNameStr = roomRecord ? `${roomRecord.roomNumber} (${roomRecord.roomType?.name || 'Standard'})` : roomInfo.roomName || 'Unassigned';
               const rStatus = getRoomStatus(roomInfo.roomId);
               
               // Calculate room total based on applied rate
               const roomNights = dayjs(roomInfo.checkOutDate).diff(dayjs(roomInfo.checkInDate), 'day') || 1;
               const roomRateTotal = (roomInfo.appliedRate || roomInfo.baseRate) * roomNights;
               
               // Sum specific room extras if Stay exists
               let roomExtras = 0;
               if (stay && stay.roomCharges) {
                  // Link room charge by matching stayRoomId
                  const sr = stay.stayRooms?.find((s: any) => s.roomId === roomInfo.roomId);
                  if (sr) {
                     roomExtras = stay.roomCharges
                        .filter((c: any) => c.stayRoomId === sr.id)
                        .reduce((acc: number, c: any) => acc + c.amount, 0);
                  }
               }
               
               const roomGrandTotal = roomRateTotal + roomExtras;
               
               const guestsList = roomInfo.guestsData && Array.isArray(roomInfo.guestsData) && roomInfo.guestsData.length > 0 
                                  ? roomInfo.guestsData 
                                  : [{ name: reservation.guest?.name || 'Lead Guest', phone: reservation.guest?.phone }];

               return (
                 <div key={idx} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                       <div className="flex items-center gap-3">
                         <h4 className="text-base font-black text-gray-900">{roomNameStr}</h4>
                         {getStatusBadge(rStatus)}
                       </div>
                       <div className="text-right">
                         <span className="text-sm font-black text-indigo-700">₹{(roomGrandTotal/100).toLocaleString()}</span>
                       </div>
                    </div>
                    
                    {/* Room Stats */}
                    <div className="px-6 py-4 border-b border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white">
                       <div>
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Dates</p>
                         <p className="text-xs font-bold text-gray-900">{dayjs(roomInfo.checkInDate).format('DD MMM')} - {dayjs(roomInfo.checkOutDate).format('DD MMM')}</p>
                       </div>
                       <div>
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Rate</p>
                         <p className="text-xs font-bold text-gray-900">₹{((roomInfo.appliedRate || roomInfo.baseRate)/100).toLocaleString()} / nt</p>
                       </div>
                       <div>
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Extras</p>
                         <p className="text-xs font-bold text-gray-900">{roomExtras > 0 ? `₹${(roomExtras/100).toLocaleString()}` : '-'}</p>
                       </div>
                       <div>
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Guests</p>
                         <p className="text-xs font-bold text-gray-900">{guestsList.length}</p>
                       </div>
                    </div>

                    {/* Guests List */}
                    <div className="px-6 py-4 bg-white">
                       <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Assigned Guests</h5>
                       <div className="space-y-3">
                          {guestsList.map((g: any, gIdx: number) => (
                             <div key={gIdx} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                      <User size={14}/>
                                   </div>
                                   <div>
                                      <p className="text-sm font-bold text-gray-900">{g.name || 'Unnamed'}</p>
                                      <p className="text-xs font-medium text-gray-500">
                                         {g.phone || 'No phone'}
                                         {g.age && ` • ${g.age} yrs`}
                                         {g.gender && ` • ${g.gender}`}
                                      </p>
                                   </div>
                                </div>
                                <div>
                                   {g.idProofNumber ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                         <UserCheck size={12}/> ID Verified
                                      </span>
                                   ) : (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                         <AlertCircle size={12}/> Pending ID
                                      </span>
                                   )}
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
               );
             })}
          </div>

          {/* RIGHT COLUMN (FINANCIAL) */}
          <div className="space-y-6">
             <h3 className="text-lg font-black text-gray-900 flex items-center gap-2"><Receipt size={20}/> Group Financials</h3>
             
             <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-500">Total Room Rent</span>
                      <span className="font-bold text-gray-900">₹{(roomRentTotal/100).toLocaleString()}</span>
                    </div>
                    {taxTotal > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-500">Total Taxes (GST)</span>
                        <span className="font-bold text-gray-900">₹{(taxTotal/100).toLocaleString()}</span>
                      </div>
                    )}
                    {extrasTotal > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-500">Total Extra Services</span>
                        <span className="font-bold text-gray-900">₹{(extrasTotal/100).toLocaleString()}</span>
                      </div>
                    )}
                    
                    <div className="h-px bg-gray-100 my-4"></div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-900">Total Amount</span>
                      <span className="text-lg font-black text-indigo-700">₹{(totalAmount/100).toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm pt-2">
                      <span className="font-medium text-gray-500">Total Paid</span>
                      <span className="font-bold text-emerald-600">₹{(totalPaid/100).toLocaleString()}</span>
                    </div>
                    
                    <div className="h-px bg-gray-100 my-4"></div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-900">Balance Due</span>
                      <span className={`text-lg font-black ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ₹{(Math.max(0, balance)/100).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Print Invoice Button if stay exists */}
                {stay && (
                   <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
                     <button className="w-full px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition flex items-center justify-center gap-2">
                        <FileText size={16}/> Print Group Invoice
                     </button>
                   </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
