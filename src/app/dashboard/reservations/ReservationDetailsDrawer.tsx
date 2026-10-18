"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Calendar, User, Phone, MapPin,
  CreditCard, Receipt, Building, CheckCircle2,
  Clock, AlertCircle, Home, Mail, FileText, ChevronRight, ChevronDown, Printer, Edit2, Info, Eye, Camera
} from 'lucide-react';
import dayjs from 'dayjs';
import { GuestMediaPreviewModal, PreviewItem } from '@/components/hotel/GuestMediaPreviewModal';

function getStatusBadge(status: string) {
  switch (status) {
    case 'CHECKED_IN': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100"><CheckCircle2 size={12} /> Checked In</span>;
    case 'CHECKED_OUT': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-100"><CheckCircle2 size={12} /> Checked Out</span>;
    case 'RESERVED': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-100"><Clock size={12} /> Reserved</span>;
    case 'CONFIRMED': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100"><CheckCircle2 size={12} /> Confirmed</span>;
    case 'CANCELLED': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-500 border border-gray-200"><AlertCircle size={12} /> Cancelled</span>;
    default: return <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-200">{status}</span>;
  }
}

export function ReservationDetailsDrawer({ reservationId, onClose }: { reservationId: string, onClose: () => void }) {
  const router = useRouter();
  const id = reservationId;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'INFO' | 'GUEST' | 'BILLING'>('INFO');
  const [receiptMenuOpen, setReceiptMenuOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  const openPreview = (items: PreviewItem[], startIdx = 0) => {
    if (items.length === 0) return;
    setPreviewItems(items);
    setPreviewIndex(startIdx);
    setPreviewOpen(true);
  };

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
    <>
      <div className="fixed inset-0 bg-black/30 z-[100] backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="fixed top-0 right-0 h-full w-[650px] max-w-full bg-[#F4F6F9] z-[101] shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-in-out border-l border-gray-200">
        <div className="min-h-screen bg-[#F4F6F9] p-8 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      </div>
    </>
  );
}

  if (error || !data?.reservation) {
    return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[100] backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="fixed top-0 right-0 h-full w-[650px] max-w-full bg-[#F4F6F9] z-[101] shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-in-out border-l border-gray-200">
        <div className="min-h-screen bg-[#F4F6F9] p-8 flex flex-col items-center justify-center">
          <AlertCircle size={48} className="text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Reservation</h2>
          <p className="text-gray-500 mb-6">{error || 'Reservation not found'}</p>
          <button onClick={onClose} className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition">
            Go Back
          </button>
        </div>
      </div>
    </>
    );
  }

  const { reservation, roomDetails } = data;
  const stay = reservation.stay;

  // Computations
  const isCheckedIn = reservation.status === 'CHECKED_IN';
  const isCheckedOut = reservation.status === 'CHECKED_OUT';
  const totalPaid = stay?.payments?.reduce((acc: number, p: any) => acc + p.amount, 0) || reservation.advanceAmount || 0;

  const activeRooms = stay?.stayRooms?.length ? stay.stayRooms : (reservation.rooms || []);

  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalTax = 0;
  let totalRoomGross = 0;

  activeRooms.forEach((r: any) => {
    const rate = r.appliedRate || r.baseRate || 0;
    const n = Math.max(1, r.nights || (r.checkInDate && r.checkOutDate ? dayjs(r.checkOutDate).diff(dayjs(r.checkInDate), 'day') : 1));
    const gross = r.grossAmount || (rate * n);

    totalRoomGross += gross;
    totalTaxable += (r.taxableAmount || 0);
    totalCgst += (r.cgstAmount || 0);
    totalSgst += (r.sgstAmount || 0);
    totalTax += (r.taxAmount || 0);
  });

  const extraServicesTotal = stay?.roomCharges?.reduce((acc: number, c: any) => acc + (c.amount * (c.quantity || 1)), 0) || 0;
  const extraServicesTax = stay?.roomCharges?.reduce((acc: number, c: any) => acc + (c.taxAmount || 0), 0) || 0;

  totalTax += extraServicesTax;

  const taxAmount = stay?.invoice?.taxAmount || totalTax || 0;
  const taxableAmount = stay?.invoice?.taxableAmount || totalTaxable || 0;
  const cgstAmount = stay?.invoice?.cgstAmount || totalCgst || 0;
  const sgstAmount = stay?.invoice?.sgstAmount || totalSgst || 0;
  const taxMode = activeRooms[0]?.taxMode || '';
  const taxRate = activeRooms[0]?.taxRate || 0;

  const roomChargesSubtotal = stay?.invoice?.subtotal
      ? Math.max(0, stay.invoice.subtotal - extraServicesTotal)
      : totalRoomGross;

  const totalAmount = stay?.invoice?.totalAmount || (roomChargesSubtotal + extraServicesTotal + taxAmount);
  const balance = totalAmount - totalPaid;

  const firstRoom = reservation.rooms?.[0];
  const expectedCheckIn = firstRoom?.checkInDate ? dayjs(firstRoom.checkInDate) : null;
  let expectedCheckOut = firstRoom?.checkOutDate ? dayjs(firstRoom.checkOutDate) : null;
  let nights: number | string = firstRoom ? Math.max(1, dayjs(firstRoom.checkOutDate).diff(dayjs(firstRoom.checkInDate), 'day')) : '-';

  let isOverdue = false;
  if (firstRoom) {
     const today = dayjs().startOf('day');
     const exp = dayjs(firstRoom.checkOutDate).startOf('day');

     if (isCheckedOut) {
         const firstStayRoom = stay?.stayRooms?.find((sr: any) => sr.roomId === firstRoom.roomId) || stay?.stayRooms?.[0];
         if (firstStayRoom && firstStayRoom.checkOutDate) {
             expectedCheckOut = dayjs(firstStayRoom.checkOutDate);
             nights = Math.max(1, expectedCheckOut.startOf('day').diff(dayjs(firstRoom.checkInDate).startOf('day'), 'day'));
         }
     } else if (isCheckedIn && today.isAfter(exp)) {
         isOverdue = true;
         expectedCheckOut = today;
         nights = Math.max(1, today.diff(dayjs(firstRoom.checkInDate).startOf('day'), 'day'));
     }
  }

  const guestName = reservation.guest?.name || 'Walk-in Guest';
  const guestInitial = guestName.charAt(0).toUpperCase();

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[100] backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="fixed top-0 right-0 h-full w-[650px] max-w-full bg-[#F4F6F9] z-[101] shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-in-out border-l border-gray-200">
        <div className="min-h-screen pb-20 bg-white">

          {/* Header */}
          <div className="bg-white border-b border-gray-100 sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <button onClick={onClose} className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
                  <ArrowLeft size={18} />
                </button>
                <h1 className="text-[19px] font-black text-gray-900 tracking-tight">RES-{reservation.reservationNumber || reservation.shortId}</h1>
                {getStatusBadge(reservation.status)}
              </div>
              <p className="text-[11px] font-medium text-gray-500 ml-8">
                Created on {dayjs(reservation.createdAt).format('DD MMM YYYY, hh:mm A')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isCheckedIn && (
                <button onClick={() => {
                  const checkoutRoomId = stay?.stayRooms?.find((sr: any) => !sr.checkOutDate)?.roomId || firstRoom?.roomId;
                  if (!checkoutRoomId) {
                    alert('No active room assigned for checkout.');
                    return;
                  }
                  router.push(`/dashboard/checkout?roomId=${checkoutRoomId}`);
                }} className="px-4 py-2 bg-[#4338ca] text-white text-xs font-bold rounded-lg hover:bg-[#3730a3] transition shadow-sm flex items-center gap-2">
                  <Receipt size={14} /> Proceed to Check-out
                </button>
              )}
              {isCheckedOut && (
                <div className="flex items-center gap-2 relative">
                  {(data?.canPrintInvoice ?? true) && (
                    <button
                      onClick={() => {
                        if (!stay?.id) return alert('Stay ID not found for this reservation.');
                        window.open(`/dashboard/print/invoice/${stay.id}?format=A4`, "_blank");
                      }}
                      className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 transition shadow-sm flex items-center gap-2"
                    >
                      <Printer size={14} /> Print Invoice
                    </button>
                  )}
                  {((data?.canPrint80mm ?? data?.canPrintReceipt ?? true) || (data?.canPrint58mm ?? data?.canPrintReceipt ?? true)) && (
                    <div className="relative">
                      <button
                        onClick={() => setReceiptMenuOpen(!receiptMenuOpen)}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 transition shadow-sm flex items-center gap-2"
                      >
                        Receipt <ChevronDown size={14} />
                      </button>
                      {receiptMenuOpen && (
                        <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden text-left">
                          {(data?.canPrint80mm ?? data?.canPrintReceipt ?? true) && (
                            <button
                              onClick={() => {
                                setReceiptMenuOpen(false);
                                if (!stay?.id) return alert('Stay ID not found for this reservation.');
                                window.open(`/dashboard/print/invoice/${stay.id}?format=80mm`, "_blank");
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                            >
                              3 Inch (80mm)
                            </button>
                          )}
                          {(data?.canPrint58mm ?? data?.canPrintReceipt ?? true) && (
                            <button
                              onClick={() => {
                                setReceiptMenuOpen(false);
                                if (!stay?.id) return alert('Stay ID not found for this reservation.');
                                window.open(`/dashboard/print/invoice/${stay.id}?format=58mm`, "_blank");
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                            >
                              2 Inch (58mm)
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg ml-1">
                <AlertCircle size={20} className="rotate-45" /> {/* Using AlertCircle rotated as an X, or just use normal X */}
              </button>
            </div>
          </div>

          <div className="p-6 pb-0">
            {/* Guest Summary Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-black">
                    {guestInitial}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{guestName}</h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Mob: {reservation.guest?.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Reservation Type</p>
                  <p className="text-sm font-bold text-gray-900">{firstRoom?.roomType?.name || 'Standard'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Source</p>
                  <p className="text-sm font-bold text-gray-900">{reservation.source || 'Direct'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Room(s)</p>
                  <p className="text-sm font-bold text-gray-900">{reservation.rooms?.length || 1} Room(s)</p>
                </div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex items-center border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab('INFO')}
                className={`flex-1 pb-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'INFO' ? 'border-[#4338ca] text-[#4338ca]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <Calendar size={16} /> Reservation Info
              </button>
              <button
                onClick={() => setActiveTab('GUEST')}
                className={`flex-1 pb-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'GUEST' ? 'border-[#4338ca] text-[#4338ca]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <User size={16} /> Guest Details
              </button>
              <button
                onClick={() => setActiveTab('BILLING')}
                className={`flex-1 pb-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'BILLING' ? 'border-[#4338ca] text-[#4338ca]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <Receipt size={16} /> Billing & Payments
              </button>
            </div>
          </div>

          <div className="px-6">
            {/* TAB CONTENT: RESERVATION INFO */}
            {activeTab === 'INFO' && (
              <div className="space-y-6">

                {/* Stay Overview */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                    <Calendar size={16} className="text-[#4338ca]" />
                    <h3 className="text-[13px] font-bold text-gray-900">Stay Summary</h3>
                  </div>
                  <div className="p-5 grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Check-in</p>
                      <p className="text-xs font-bold text-gray-900">{expectedCheckIn ? expectedCheckIn.format('DD MMM YYYY') : '-'}</p>
                      <p className="text-[10px] text-gray-500 font-medium">{expectedCheckIn ? expectedCheckIn.format('hh:mm A') : '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Check-out</p>
                      {isOverdue ? (
                         <>
                           <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-xs font-bold text-orange-600">{expectedCheckOut ? expectedCheckOut.format('DD MMM YYYY') : '-'}</span>
                              <span className="px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700 text-[9px] font-black uppercase tracking-wider">Extended</span>
                           </div>
                           <p className="text-[10px] text-gray-500 font-medium line-through decoration-gray-400">Exp: {firstRoom?.checkOutDate ? dayjs(firstRoom.checkOutDate).format('DD MMM YYYY') : '-'}</p>
                         </>
                      ) : (
                         <>
                           <p className="text-xs font-bold text-gray-900">{expectedCheckOut ? expectedCheckOut.format('DD MMM YYYY') : '-'}</p>
                           <p className="text-[10px] text-gray-500 font-medium">{expectedCheckOut ? expectedCheckOut.format('hh:mm A') : '-'}</p>
                         </>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Nights</p>
                      <p className="text-xs font-bold text-gray-900">{nights}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Rooms</p>
                      <p className="text-xs font-bold text-gray-900">{reservation.rooms.length}</p>
                    </div>
                  </div>
                </div>

                {/* Reserved Rooms */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                    <Home size={16} className="text-emerald-600" />
                    <h3 className="text-[13px] font-bold text-gray-900">Reserved Rooms</h3>
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100 bg-white">
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Room No.</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Room Type</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Guests</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rate (Per Night)</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nights</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {reservation.rooms.map((roomInfo: any, idx: number) => {
                        const roomRecord = roomDetails?.find((r: any) => r.id === roomInfo.roomId);
                        const roomNameStr = roomRecord ? roomRecord.roomNumber : (roomInfo.roomName || 'Unassigned');
                        const roomTypeStr = roomRecord?.roomType?.name || 'Standard';

                        let rNts = Math.max(1, dayjs(roomInfo.checkOutDate).diff(dayjs(roomInfo.checkInDate), 'day'));
                        let rCheckOut = dayjs(roomInfo.checkOutDate);
                        let rOverdue = false;

                        const sr = stay?.stayRooms?.find((s: any) => s.roomId === roomInfo.roomId);
                        if (isCheckedOut && sr?.checkOutDate) {
                            rCheckOut = dayjs(sr.checkOutDate);
                            rNts = Math.max(1, rCheckOut.startOf('day').diff(dayjs(roomInfo.checkInDate).startOf('day'), 'day'));
                        } else if (isCheckedIn) {
                            const today = dayjs().startOf('day');
                            const expected = dayjs(roomInfo.checkOutDate).startOf('day');
                            if (today.isAfter(expected)) {
                               rOverdue = true;
                               rCheckOut = today;
                               rNts = Math.max(1, today.diff(dayjs(roomInfo.checkInDate).startOf('day'), 'day'));
                            }
                        }

                        const rate = roomInfo.appliedRate || roomInfo.baseRate;
                        const total = rate * rNts;

                        return (
                          <tr key={idx} className="bg-white">
                            <td className="px-5 py-3 text-xs font-bold text-gray-900">{roomNameStr}</td>
                            <td className="px-5 py-3 text-xs font-medium text-gray-600">{roomTypeStr}</td>
                            <td className="px-5 py-3 text-xs font-medium text-gray-600">{roomInfo.guestsData?.length || 1}</td>
                            <td className="px-5 py-3 text-xs font-medium text-gray-900">₹{(rate/100).toLocaleString()}</td>
                            <td className="px-5 py-3 text-xs font-medium text-gray-600">{rNts} {rOverdue && <span className="text-orange-600 font-bold text-[9px] uppercase ml-1">Ext</span>}</td>
                            <td className="px-5 py-3 text-xs font-bold text-gray-900 text-right">₹{(total/100).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Extra Services & Charges */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                    <Receipt size={16} className="text-rose-600" />
                    <h3 className="text-[13px] font-bold text-gray-900">Extra Services & Charges</h3>
                  </div>
                  {(!stay?.roomCharges || stay.roomCharges.length === 0) ? (
                    <div className="p-5 text-center text-xs font-medium text-gray-500">
                      No extra services requested.
                    </div>
                  ) : (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-100 bg-white">
                          <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Service Name</th>
                          <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category</th>
                          <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Qty</th>
                          <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rate</th>
                          <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {stay.roomCharges.map((charge: any, idx: number) => (
                          <tr key={idx} className="bg-white">
                            <td className="px-5 py-3 text-xs font-bold text-gray-900">{charge.description}</td>
                            <td className="px-5 py-3 text-xs font-medium text-gray-600">Service</td>
                            <td className="px-5 py-3 text-xs font-medium text-gray-600">1</td>
                            <td className="px-5 py-3 text-xs font-medium text-gray-900">₹{(charge.amount/100).toLocaleString()}</td>
                            <td className="px-5 py-3 text-xs font-bold text-gray-900 text-right">₹{(charge.amount/100).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Additional Information */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6">
                  <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                    <Info size={16} className="text-[#4338ca]" />
                    <h3 className="text-[13px] font-bold text-gray-900">Additional Information</h3>
                  </div>
                  <div className="p-5 grid grid-cols-2 gap-y-4">
                    <div className="flex items-center gap-4">
                      <span className="text-[11px] font-bold text-gray-400 w-32">Booking Date</span>
                      <span className="text-xs font-medium text-gray-900">{dayjs(reservation.createdAt).format('DD Oct YYYY, hh:mm A')}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[11px] font-bold text-gray-400 w-32">Reservation Source</span>
                      <span className="text-xs font-medium text-gray-900">{reservation.source || 'Direct'}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[11px] font-bold text-gray-400 w-32">Number of Guests</span>
                      <span className="text-xs font-medium text-gray-900">{reservation.guests || 1}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[11px] font-bold text-gray-400 w-32">Special Requests</span>
                      <span className="text-xs font-medium text-gray-900">-</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT: GUEST DETAILS */}
            {activeTab === 'GUEST' && (
              <div className="space-y-6">

                {/* Lead Guest */}
                {/* Lead Guest */}
                {(() => {
                  const leadDocs: PreviewItem[] = [];
                  const guest = reservation.guest;
                  if (guest?.guestPhotoUrl) {
                    leadDocs.push({
                      url: guest.guestPhotoUrl,
                      title: `${guestName} - Photo`,
                      type: 'photo',
                      subtitle: 'Lead Guest Photo',
                    });
                  }
                  if (Array.isArray(guest?.documents) && guest.documents.length > 0) {
                    guest.documents.forEach((d: any, dIdx: number) => {
                      if (d.fileReference) {
                        leadDocs.push({
                          url: d.fileReference,
                          title: `${guestName} - ID Document ${dIdx + 1}`,
                          type: 'id',
                          subtitle: d.documentType || 'Identity Proof',
                          documentNumber: d.documentNumber,
                          status: d.verificationStatus,
                        });
                      }
                    });
                  }
                  const leadIdFiles = leadDocs.filter(i => i.type === 'id');
                  const leadPhoto = leadDocs.find(i => i.type === 'photo');

                  return (
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-[#4338ca]" />
                          <h3 className="text-[13px] font-bold text-gray-900">Lead Guest Information</h3>
                        </div>
                        {leadIdFiles.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Verified ID
                          </span>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="flex items-start gap-4 mb-4">
                          {leadPhoto ? (
                            <div
                              onClick={() => openPreview(leadDocs, leadDocs.indexOf(leadPhoto))}
                              className="relative group cursor-pointer w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-indigo-200 shadow-sm"
                              title="Click to preview photo"
                            >
                              <img
                                src={leadPhoto.url}
                                alt={guestName}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                <Eye size={16} className="text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                              <User size={24} />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <h4 className="text-base font-bold text-gray-900 truncate">{guestName}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">{guest?.phone || 'Not provided'}</p>
                            {guest?.email && <p className="text-xs text-gray-500">{guest.email}</p>}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-4 pt-3 border-t border-gray-100">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">ID Status</p>
                            <p className="text-xs font-bold text-gray-900">
                              {leadIdFiles.length > 0 || guest?.idProof ? 'ID Submitted' : 'Not provided'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Address</p>
                            <p className="text-xs font-medium text-gray-900 truncate">
                              {guest?.address || guest?.city || 'Not provided'}
                            </p>
                          </div>
                        </div>

                        {/* Preview buttons */}
                        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
                          {leadIdFiles.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => openPreview(leadDocs, leadDocs.findIndex(i => i.type === 'id'))}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
                            >
                              <FileText size={13} />
                              <span>Preview ID Proof ({leadIdFiles.length})</span>
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No ID document uploaded</span>
                          )}

                          {leadPhoto && (
                            <button
                              type="button"
                              onClick={() => openPreview(leadDocs, leadDocs.indexOf(leadPhoto))}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition"
                            >
                              <Camera size={13} />
                              <span>View Photo</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Additional Guests (Gathered from rooms) */}
                {reservation.rooms.some((r: any) => r.guestsData && r.guestsData.length > 0) && (
                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-emerald-600" />
                        <h3 className="text-[13px] font-bold text-gray-900">Additional Guests</h3>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {reservation.rooms.map((roomInfo: any) => (
                        roomInfo.guestsData?.map((g: any, gIdx: number) => {
                          const guestPreviews: PreviewItem[] = [];
                          if (g.photoUrl) {
                            guestPreviews.push({
                              url: g.photoUrl,
                              title: `${g.name || 'Additional Guest'} - Photo`,
                              type: 'photo',
                              subtitle: 'Guest Photo',
                            });
                          }
                          if (Array.isArray(g.idDocuments) && g.idDocuments.length > 0) {
                            g.idDocuments.forEach((doc: any, dIdx: number) => {
                              const dUrl = typeof doc === 'string' ? doc : doc.url;
                              if (dUrl && !guestPreviews.some(p => p.url === dUrl)) {
                                guestPreviews.push({
                                  url: dUrl,
                                  title: `${g.name || 'Guest'} - ID Document ${dIdx + 1}`,
                                  type: 'id',
                                  subtitle: 'Identity Proof',
                                  documentNumber: typeof doc === 'object' ? doc.number : null,
                                });
                              }
                            });
                          }
                          if (Array.isArray(g.idUrls) && g.idUrls.length > 0) {
                            g.idUrls.forEach((url: string, uIdx: number) => {
                              if (url && !guestPreviews.some(p => p.url === url)) {
                                guestPreviews.push({
                                  url: url,
                                  title: `${g.name || 'Guest'} - ID Document ${uIdx + 1}`,
                                  type: 'id',
                                  subtitle: 'Identity Proof',
                                  documentNumber: g.idNumber || null,
                                });
                              }
                            });
                          }
                          if (g.idUrl && !guestPreviews.some(p => p.url === g.idUrl)) {
                            guestPreviews.push({
                              url: g.idUrl,
                              title: `${g.name || 'Guest'} - ID Document`,
                              type: 'id',
                              subtitle: 'Identity Proof',
                              documentNumber: g.idNumber || null,
                            });
                          }

                          const addIdDocs = guestPreviews.filter(p => p.type === 'id');
                          const addPhoto = guestPreviews.find(p => p.type === 'photo');

                          return (
                          <div key={gIdx} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                              {addPhoto ? (
                                <div
                                  onClick={() => openPreview(guestPreviews, guestPreviews.indexOf(addPhoto))}
                                  className="relative group cursor-pointer w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-emerald-200 shadow-xs"
                                  title="Click to preview photo"
                                >
                                  <img
                                    src={addPhoto.url}
                                    alt={g.name || 'Guest'}
                                    className="w-full h-full object-cover group-hover:scale-105 transition"
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                    <Eye size={12} className="text-white" />
                                  </div>
                                </div>
                              ) : (
                                <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                                  <User size={18} />
                                </div>
                              )}

                              <div>
                                <p className="text-sm font-bold text-gray-900">{g.name || 'Unknown'}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {g.gender ? g.gender.charAt(0).toUpperCase() + g.gender.slice(1) : '-'}
                                  {g.age ? `, ${g.age} yrs` : ''}
                                  {g.phone ? ` • ${g.phone}` : ''}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {addIdDocs.length > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => openPreview(guestPreviews, guestPreviews.findIndex(p => p.type === 'id'))}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                                >
                                  <FileText size={13} />
                                  <span>Preview ID ({addIdDocs.length})</span>
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400 italic">No ID uploaded</span>
                              )}

                              {addPhoto && (
                                <button
                                  type="button"
                                  onClick={() => openPreview(guestPreviews, guestPreviews.indexOf(addPhoto))}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition"
                                >
                                  <Camera size={13} />
                                  <span>Photo</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );})
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB CONTENT: BILLING & PAYMENTS */}
            {activeTab === 'BILLING' && (
              <div className="space-y-6">

                {/* Items Summary (Room Charges) */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                    <Building size={16} className="text-[#4338ca]" />
                    <h3 className="text-[13px] font-bold text-gray-900">Items Summary (Room Charges)</h3>
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100 bg-white">
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Room No.</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Room Type</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Base Rate</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nights</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {activeRooms.map((roomInfo: any, idx: number) => {
                        const roomRecord = roomDetails?.find((r: any) => r.id === roomInfo.roomId);
                        const roomNameStr = roomRecord ? roomRecord.roomNumber : (roomInfo.roomName || 'Unassigned');
                        const roomTypeStr = roomRecord?.roomType?.name || 'Standard';
                        const nts = Math.max(1, roomInfo.nights || (roomInfo.checkInDate && roomInfo.checkOutDate ? dayjs(roomInfo.checkOutDate).diff(dayjs(roomInfo.checkInDate), 'day') : 1));
                        const rate = roomInfo.appliedRate || roomInfo.baseRate;
                        const total = roomInfo.grossAmount || (rate * nts);

                        return (
                          <tr key={idx} className="bg-white">
                            <td className="px-5 py-3 text-xs font-bold text-gray-900">{roomNameStr}</td>
                            <td className="px-5 py-3 text-xs font-medium text-gray-600">{roomTypeStr}</td>
                            <td className="px-5 py-3 text-xs font-medium text-gray-900">₹{(rate/100).toLocaleString()}</td>
                            <td className="px-5 py-3 text-xs font-medium text-gray-600">{nts}</td>
                            <td className="px-5 py-3 text-xs font-bold text-gray-900 text-right">₹{(total/100).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Extra Services & Charges */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                    <Receipt size={16} className="text-rose-600" />
                    <h3 className="text-[13px] font-bold text-gray-900">Extra Services & Charges</h3>
                  </div>
                  {(!stay?.roomCharges || stay.roomCharges.length === 0) ? (
                    <div className="p-5 text-center text-xs font-medium text-gray-500">
                      No extra charges.
                    </div>
                  ) : (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-100 bg-white">
                          <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Service Name</th>
                          <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category</th>
                          <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Qty</th>
                          <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rate</th>
                          <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {stay.roomCharges.map((charge: any, idx: number) => (
                          <tr key={idx} className="bg-white">
                            <td className="px-5 py-3 text-xs font-bold text-gray-900">{charge.description}</td>
                            <td className="px-5 py-3 text-xs font-medium text-gray-600">Service</td>
                            <td className="px-5 py-3 text-xs font-medium text-gray-600">1</td>
                            <td className="px-5 py-3 text-xs font-medium text-gray-900">₹{(charge.amount/100).toLocaleString()}</td>
                            <td className="px-5 py-3 text-xs font-bold text-gray-900 text-right">₹{(charge.amount/100).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Tax / GST Details */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                    <span className="w-4 h-4 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-[10px]">%</span>
                    <h3 className="text-[13px] font-bold text-gray-900">Tax / GST Details</h3>
                  </div>
                  {taxAmount > 0 ? (
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <CheckCircle2 size={12} /> GST Applicable
                        </div>
                        {taxRate > 0 && <span className="text-xs font-bold text-gray-600 border border-gray-200 px-2 py-0.5 rounded">Rate: {taxRate / 100}%</span>}
                        {taxMode && <span className="text-[10px] font-bold text-gray-500 border border-gray-200 bg-gray-50 px-2 py-0.5 rounded uppercase">{taxMode}</span>}
                      </div>
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-gray-100 bg-white">
                            <th className="pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</th>
                            <th className="pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {taxableAmount > 0 && (
                            <tr className="bg-white">
                              <td className="py-2 text-xs font-medium text-gray-600">Taxable Amount</td>
                              <td className="py-2 text-xs font-bold text-gray-900 text-right">₹{(taxableAmount/100).toLocaleString()}</td>
                            </tr>
                          )}
                          {cgstAmount > 0 && (
                            <tr className="bg-white">
                              <td className="py-2 text-xs font-medium text-gray-600">CGST</td>
                              <td className="py-2 text-xs font-bold text-gray-900 text-right">₹{(cgstAmount/100).toLocaleString()}</td>
                            </tr>
                          )}
                          {sgstAmount > 0 && (
                            <tr className="bg-white">
                              <td className="py-2 text-xs font-medium text-gray-600">SGST</td>
                              <td className="py-2 text-xs font-bold text-gray-900 text-right">₹{(sgstAmount/100).toLocaleString()}</td>
                            </tr>
                          )}
                          <tr className="bg-white">
                            <td className="py-2 text-xs font-bold text-gray-900">Total GST</td>
                            <td className="py-2 text-xs font-black text-gray-900 text-right">₹{(taxAmount/100).toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                        GST Not Applied
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Summary */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6">
                  <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                    <Receipt size={16} className="text-[#4338ca]" />
                    <h3 className="text-[13px] font-bold text-gray-900">Payment Summary</h3>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-gray-500">Room Charges (Total)</span>
                      <span className="font-bold text-gray-900">₹{(roomChargesSubtotal/100).toLocaleString()}</span>
                    </div>
                    {extraServicesTotal > 0 && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-gray-500">Extra Services</span>
                        <span className="font-bold text-gray-900">₹{(extraServicesTotal/100).toLocaleString()}</span>
                      </div>
                    )}
                    {taxAmount > 0 && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-gray-500">GST</span>
                        <span className="font-bold text-gray-900">₹{(taxAmount/100).toLocaleString()}</span>
                      </div>
                    )}

                    <div className="h-px bg-gray-100 my-2"></div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-900">Total Amount</span>
                      <span className="text-base font-black text-[#4338ca]">₹{(totalAmount/100).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="font-medium text-gray-500">Total Paid (Advance)</span>
                      <span className="font-bold text-emerald-600">₹{(totalPaid/100).toLocaleString()}</span>
                    </div>

                    <div className="h-px bg-gray-100 my-2"></div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-900">Balance Due</span>
                      <span className={`text-base font-black ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ₹{(Math.max(0, balance)/100).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>
      </div>

      {/* Lightbox Preview Modal */}
      <GuestMediaPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        items={previewItems}
        initialIndex={previewIndex}
      />
    </>
  );
}
