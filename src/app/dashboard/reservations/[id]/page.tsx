"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar, User, Phone, MapPin, 
  CreditCard, Receipt, Building, CheckCircle2,
  Clock, AlertCircle, Home, Mail, FileText, ChevronRight, Eye, Camera
} from 'lucide-react';
import dayjs from 'dayjs';
import { GuestMediaPreviewModal, PreviewItem } from '@/components/hotel/GuestMediaPreviewModal';

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

export default function ReservationDetails({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
  
  // Computations
  const isCheckedIn = reservation.status === 'CHECKED_IN' || reservation.status === 'CHECKED_OUT';
  const totalPaid = stay?.payments?.reduce((acc: number, p: any) => acc + p.amount, 0) || reservation.advanceAmount || 0;
  const balance = (stay?.invoice?.totalAmount || reservation.totalAmount) - totalPaid;
  const totalAmount = stay?.invoice?.totalAmount || reservation.totalAmount || 0;
  const firstRoom = reservation.rooms?.[0];
  const expectedCheckIn = firstRoom?.checkInDate ? dayjs(firstRoom.checkInDate) : null;
  const expectedCheckOut = firstRoom?.checkOutDate ? dayjs(firstRoom.checkOutDate) : null;
  const nights = firstRoom ? Math.max(1, dayjs(firstRoom.checkOutDate).diff(dayjs(firstRoom.checkInDate), 'day')) : '-';

  return (
    <div className="min-h-screen bg-[#F4F6F9] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 transition">
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">RES-{reservation.reservationNumber}</h1>
                {getStatusBadge(reservation.status)}
              </div>
              <p className="text-sm font-medium text-gray-500 mt-0.5">
                Created on {dayjs(reservation.createdAt).format('DD MMM YYYY, hh:mm A')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {reservation.rooms?.length > 1 && (
               <button onClick={() => router.push(`/dashboard/reservations/${reservation.id}/group`)} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition shadow-sm flex items-center gap-2">
                 <Building size={16} /> View Group Reservation
               </button>
            )}
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

      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* OVERVIEW */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Calendar size={16} />
                </div>
                <h2 className="text-base font-bold text-gray-900">Stay Overview</h2>
              </div>
              <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Check-in</p>
                  <p className="text-sm font-bold text-gray-900">{expectedCheckIn ? expectedCheckIn.format('DD MMM YYYY') : '-'}</p>
                  <p className="text-xs text-gray-500 font-medium">{expectedCheckIn ? expectedCheckIn.format('hh:mm A') : '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Check-out</p>
                  <p className="text-sm font-bold text-gray-900">{expectedCheckOut ? expectedCheckOut.format('DD MMM YYYY') : '-'}</p>
                  <p className="text-xs text-gray-500 font-medium">{expectedCheckOut ? expectedCheckOut.format('hh:mm A') : '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Nights</p>
                  <p className="text-sm font-bold text-gray-900">{nights}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Rooms</p>
                  <p className="text-sm font-bold text-gray-900">{reservation.rooms.length}</p>
                </div>
              </div>
            </div>

            {/* GUEST INFO */}
            {(() => {
              const leadDocs: PreviewItem[] = [];
              const guest = reservation.guest;
              const gName = guest?.name || 'Walk-in Guest';

              if (guest?.guestPhotoUrl) {
                leadDocs.push({
                  url: guest.guestPhotoUrl,
                  title: `${gName} - Photo`,
                  type: 'photo',
                  subtitle: 'Lead Guest Photo',
                });
              }

              if (Array.isArray(guest?.documents) && guest.documents.length > 0) {
                guest.documents.forEach((d: any, dIdx: number) => {
                  if (d.fileReference) {
                    leadDocs.push({
                      url: d.fileReference,
                      title: `${gName} - ID Document ${dIdx + 1}`,
                      type: 'id',
                      subtitle: d.documentType || 'Identity Proof',
                      documentNumber: d.documentNumber,
                      status: d.verificationStatus,
                    });
                  }
                });
              }

              const idDocs = leadDocs.filter(i => i.type === 'id');
              const photoItem = leadDocs.find(i => i.type === 'photo');

              return (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        <User size={16} />
                      </div>
                      <h2 className="text-base font-bold text-gray-900">Lead Guest Information</h2>
                    </div>
                    {idDocs.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Verified Document ({idDocs.length})
                      </span>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-6">
                      {photoItem ? (
                        <div
                          onClick={() => openPreview(leadDocs, leadDocs.indexOf(photoItem))}
                          className="relative group cursor-pointer w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-blue-200 shadow-sm"
                          title="Click to view photo"
                        >
                          <img
                            src={photoItem.url}
                            alt={gName}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                          />
                          <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                            <Eye size={18} className="text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                          <User size={28} />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-gray-900 truncate">{gName}</h3>
                        <p className="text-sm font-medium text-gray-500 mt-0.5">{guest?.phone || 'No phone provided'}</p>
                        {guest?.email && <p className="text-xs text-gray-400 mt-0.5">{guest.email}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 pt-4 border-t border-gray-100">
                      <div className="flex items-start gap-3">
                        <Phone size={16} className="text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Phone Number</p>
                          <p className="text-sm font-bold text-gray-900">{guest?.phone || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <FileText size={16} className="text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">ID Proof Status</p>
                          <p className="text-sm font-bold text-gray-900">
                            {idDocs.length > 0 || guest?.idProof ? 'ID Document on File' : 'Not provided'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Mail size={16} className="text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Email</p>
                          <p className="text-sm font-medium text-gray-900">{guest?.email || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Address</p>
                          <p className="text-sm font-medium text-gray-900">{guest?.address || guest?.city || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Previews Action Toolbar */}
                    <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-3">
                      {idDocs.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => openPreview(leadDocs, leadDocs.findIndex(i => i.type === 'id'))}
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
                        >
                          <FileText size={14} />
                          <span>Preview ID Document ({idDocs.length})</span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No ID document uploaded</span>
                      )}

                      {photoItem && (
                        <button
                          type="button"
                          onClick={() => openPreview(leadDocs, leadDocs.indexOf(photoItem))}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition"
                        >
                          <Camera size={14} />
                          <span>View Guest Photo</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ROOMS */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Home size={16} />
                </div>
                <h2 className="text-base font-bold text-gray-900">Reserved Rooms</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {reservation.rooms.map((roomInfo: any, idx: number) => {
                  const roomRecord = roomDetails?.find((r: any) => r.id === roomInfo.roomId);
                  const roomNameStr = roomRecord ? `${roomRecord.roomNumber} (${roomRecord.roomType?.name || 'Standard'})` : roomInfo.roomName || 'Unassigned';
                  
                  const hasGuests = Array.isArray(roomInfo.guestsData) && roomInfo.guestsData.length > 0;

                  return (
                    <div key={idx} className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <p className="text-base font-black text-gray-900">{roomNameStr}</p>
                          <p className="text-xs font-medium text-gray-500 mt-1">
                            {roomInfo.guestsData?.length || 1} Guest(s) • Base Rate: ₹{(roomInfo.baseRate/100).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">₹{(((roomInfo.appliedRate || roomInfo.baseRate) * (dayjs(roomInfo.checkOutDate).diff(dayjs(roomInfo.checkInDate), 'day') || 1)) / 100).toLocaleString()}</p>
                          <p className="text-xs font-medium text-gray-500 mt-1">For {dayjs(roomInfo.checkOutDate).diff(dayjs(roomInfo.checkInDate), 'day') || 1} night(s)</p>
                        </div>
                      </div>

                      {hasGuests && (
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Room Guests</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {roomInfo.guestsData.map((g: any, gIdx: number) => {
                              const gPreviews: PreviewItem[] = [];
                              if (g.photoUrl) {
                                gPreviews.push({
                                  url: g.photoUrl,
                                  title: `${g.name || 'Guest'} - Photo`,
                                  type: 'photo',
                                  subtitle: 'Guest Photo',
                                });
                              }
                              if (Array.isArray(g.idDocuments) && g.idDocuments.length > 0) {
                                g.idDocuments.forEach((doc: any, dIdx: number) => {
                                  const dUrl = typeof doc === 'string' ? doc : doc.url;
                                  if (dUrl && !gPreviews.some(p => p.url === dUrl)) {
                                    gPreviews.push({
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
                                  if (url && !gPreviews.some(p => p.url === url)) {
                                    gPreviews.push({
                                      url: url,
                                      title: `${g.name || 'Guest'} - ID Document ${uIdx + 1}`,
                                      type: 'id',
                                      subtitle: 'Identity Proof',
                                      documentNumber: g.idNumber || null,
                                    });
                                  }
                                });
                              }
                              if (g.idUrl && !gPreviews.some(p => p.url === g.idUrl)) {
                                gPreviews.push({
                                  url: g.idUrl,
                                  title: `${g.name || 'Guest'} - ID Document`,
                                  type: 'id',
                                  subtitle: 'Identity Proof',
                                  documentNumber: g.idNumber || null,
                                });
                              }

                              const gIdDocs = gPreviews.filter(p => p.type === 'id');
                              const gPhoto = gPreviews.find(p => p.type === 'photo');

                              return (
                                <div key={gIdx} className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    {gPhoto ? (
                                      <div
                                        onClick={() => openPreview(gPreviews, gPreviews.indexOf(gPhoto))}
                                        className="relative group cursor-pointer w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-gray-200"
                                        title="Click to view photo"
                                      >
                                        <img src={gPhoto.url} alt={g.name || 'Guest'} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                          <Eye size={12} className="text-white" />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                                        <User size={16} />
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-gray-900 truncate">{g.name || 'Guest'}</p>
                                      <p className="text-[11px] text-gray-500 truncate">
                                        {g.phone || 'No phone'} {g.gender ? `• ${g.gender}` : ''}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {gIdDocs.length > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => openPreview(gPreviews, gPreviews.findIndex(p => p.type === 'id'))}
                                        className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition flex items-center gap-1"
                                      >
                                        <FileText size={11} /> ID
                                      </button>
                                    )}
                                    {gPhoto && (
                                      <button
                                        type="button"
                                        onClick={() => openPreview(gPreviews, gPreviews.indexOf(gPhoto))}
                                        className="px-2 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 text-[11px] font-semibold transition flex items-center gap-1"
                                      >
                                        <Camera size={11} /> Photo
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STAY EXTRAS (If Checked In) */}
            {stay && stay.roomCharges?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                    <FileText size={16} />
                  </div>
                  <h2 className="text-base font-bold text-gray-900">Extra Services & Charges</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {stay.roomCharges.map((charge: any, idx: number) => (
                    <div key={idx} className="p-5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{charge.description}</p>
                        <p className="text-xs font-medium text-gray-500 mt-0.5">{dayjs(charge.createdAt).format('DD MMM, hh:mm A')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">₹{(charge.amount/100).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-8">
            
            {/* FINANCIAL SUMMARY */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center">
                  <Receipt size={16} />
                </div>
                <h2 className="text-base font-bold text-gray-900">Financial Summary</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-500">Room Rent (Total)</span>
                    <span className="font-bold text-gray-900">₹{((stay?.invoice?.subtotal || reservation.totalAmount)/100).toLocaleString()}</span>
                  </div>
                  {stay?.invoice?.taxAmount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-500">
                        {stay?.invoice?.totalAmount === stay?.invoice?.subtotal ? 'GST (Included in Rent)' : 'Taxes (GST)'}
                      </span>
                      <span className="font-bold text-gray-900">
                        {stay?.invoice?.totalAmount === stay?.invoice?.subtotal
                          ? `₹${(stay.invoice.taxAmount/100).toLocaleString()}`
                          : `+₹${(stay.invoice.taxAmount/100).toLocaleString()}`}
                      </span>
                    </div>
                  )}
                  {stay?.roomCharges?.length > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-500">Extra Services</span>
                      <span className="font-bold text-gray-900">₹{(stay.roomCharges.reduce((acc: number, c: any) => acc + c.amount, 0)/100).toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="h-px bg-gray-100 my-4"></div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-900">Total Amount</span>
                    <span className="text-lg font-black text-indigo-700">₹{(totalAmount/100).toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm pt-2">
                    <span className="font-medium text-gray-500">Total Paid (Advance)</span>
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
            </div>

            {/* QUICK ACTIONS */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-base font-bold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-2 flex flex-col gap-1">
                {(reservation.status === 'RESERVED' || reservation.status === 'CONFIRMED') && (
                  <>
                    <button className="w-full px-4 py-3 flex items-center justify-between text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-xl transition">
                      <div className="flex items-center gap-3">
                        <CreditCard size={18} className="text-gray-400" /> Add Advance Payment
                      </div>
                      <ChevronRight size={16} className="text-gray-400" />
                    </button>
                    <button className="w-full px-4 py-3 flex items-center justify-between text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-xl transition">
                      <div className="flex items-center gap-3">
                        <Building size={18} className="text-gray-400" /> Assign / Change Room
                      </div>
                      <ChevronRight size={16} className="text-gray-400" />
                    </button>
                  </>
                )}
                {isCheckedIn && (
                   <>
                    <button className="w-full px-4 py-3 flex items-center justify-between text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-xl transition">
                      <div className="flex items-center gap-3">
                        <CreditCard size={18} className="text-gray-400" /> Add Payment
                      </div>
                      <ChevronRight size={16} className="text-gray-400" />
                    </button>
                    <button className="w-full px-4 py-3 flex items-center justify-between text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-xl transition">
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-gray-400" /> Print Invoice
                      </div>
                      <ChevronRight size={16} className="text-gray-400" />
                    </button>
                   </>
                )}
              </div>
            </div>

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
    </div>
  );
}
