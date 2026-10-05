"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  User, Calendar, MapPin, CreditCard, Home, CheckCircle2, 
  ArrowLeft, ChevronRight, ArrowRight, Save, Plus, Trash2,
  Users, Banknote, ShieldCheck
} from 'lucide-react';
import dayjs from 'dayjs';

function ReservationWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('editId');
  const initialCheckIn = searchParams.get('checkIn');
  const initialCheckOut = searchParams.get('checkOut');
  const initialRoomId = searchParams.get('roomId');

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestAddress, setGuestAddress] = useState('');

  const [checkInDate, setCheckInDate] = useState(initialCheckIn || dayjs().format('YYYY-MM-DD'));
  const [checkOutDate, setCheckOutDate] = useState(initialCheckOut || dayjs().add(1, 'day').format('YYYY-MM-DD'));
  const [nights, setNights] = useState(1);

  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<any[]>(initialRoomId ? [{ id: initialRoomId, preSelected: true }] : []);
  
  const [advanceAmount, setAdvanceAmount] = useState('0');
  const [paymentMode, setPaymentMode] = useState('CASH');

  useEffect(() => {
    if (editId) {
      loadReservation(editId);
    }
  }, [editId]);

  const loadReservation = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/hotel/reservations/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const r = data.reservation;
      setGuestName(r.guestName || '');
      setGuestPhone(r.guestPhone || '');
      setGuestEmail(r.guestEmail || '');
      setGuestAddress(r.guest?.address || '');
      setCheckInDate(dayjs(r.checkInDate).format('YYYY-MM-DD'));
      setCheckOutDate(dayjs(r.checkOutDate).format('YYYY-MM-DD'));
      setNights(r.nights || 1);
      
      const mappedRooms = r.rooms.map((rm: any) => ({
         id: rm.roomId,
         roomNumber: data.roomDetails?.find((d:any) => d.id === rm.roomId)?.number || 'Unknown',
         roomType: data.roomDetails?.find((d:any) => d.id === rm.roomId)?.roomType || { name: 'Standard' },
         baseRate: rm.baseRate
      }));
      setSelectedRooms(mappedRooms);
      setAdvanceAmount((r.advanceAmount / 100).toString());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const d1 = dayjs(checkInDate);
    const d2 = dayjs(checkOutDate);
    const diff = d2.diff(d1, 'day');
    setNights(diff > 0 ? diff : 1);
  }, [checkInDate, checkOutDate]);

  const fetchAvailableRooms = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/hotel/rooms/available?checkIn=${checkInDate}T12:00:00Z&checkOut=${checkOutDate}T11:00:00Z${editId ? `&skipReservationId=${editId}` : ''}`);
      const data = await res.json();
      if (res.ok) {
        setAvailableRooms(data.availableRooms);
        // Hydrate initialRoomId if we just have a placeholder
        if (selectedRooms.length === 1 && selectedRooms[0].preSelected && selectedRooms[0].id === initialRoomId) {
           const fullRoom = data.availableRooms.find((r: any) => r.id === initialRoomId);
           if (fullRoom) {
              setSelectedRooms([fullRoom]);
           }
        }
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 2) {
      fetchAvailableRooms();
    }
    setStep(s => s + 1);
  };
  const prevStep = () => setStep(s => s - 1);

  const toggleRoom = (room: any) => {
    const isSelected = selectedRooms.some(r => r.id === room.id);
    if (isSelected) {
      setSelectedRooms(prev => prev.filter(r => r.id !== room.id));
    } else {
      setSelectedRooms(prev => [...prev, { ...room, baseRate: room.roomType?.basePrice || 250000 }]);
    }
  };

  const totalAmount = selectedRooms.reduce((acc, room) => acc + ((room.baseRate || 0) / 100) * nights, 0);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      
      const payload = {
        guestName, guestPhone, guestEmail, guestAddress,
        checkInDate: `${checkInDate}T12:00:00Z`,
        checkOutDate: `${checkOutDate}T11:00:00Z`,
        nights,
        rooms: selectedRooms.map(r => ({ roomId: r.id, baseRate: (r.baseRate || 0) / 100 })),
        totalAmount,
        advanceAmount: parseFloat(advanceAmount) || 0,
        paymentMode
      };

      const url = editId ? `/api/hotel/reservations/${editId}` : `/api/hotel/reservations`;
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push(`/dashboard/reservations/${data.reservation.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: 'Guest Details', icon: <User size={18} /> },
    { title: 'Stay Dates', icon: <Calendar size={18} /> },
    { title: 'Select Rooms', icon: <Home size={18} /> },
    { title: 'Payment & Save', icon: <CreditCard size={18} /> }
  ];

  return (
    <div className="min-h-screen bg-[#F4F6F9] pb-20">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 transition">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">{editId ? 'Edit Reservation' : 'New Reservation'}</h1>
              <p className="text-sm font-medium text-gray-500 mt-0.5">Step {step} of 4</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8">
        
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -z-10 rounded-full transform -translate-y-1/2"></div>
          <div className="absolute top-1/2 left-0 h-1 bg-indigo-600 -z-10 rounded-full transform -translate-y-1/2 transition-all duration-300" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
          
          {steps.map((s, idx) => {
            const isCompleted = step > idx + 1;
            const isCurrent = step === idx + 1;
            return (
              <div key={idx} className={`flex flex-col items-center gap-2 ${isCurrent || isCompleted ? 'opacity-100' : 'opacity-50'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isCompleted ? 'bg-indigo-600 border-indigo-600 text-white' : isCurrent ? 'bg-white border-indigo-600 text-indigo-600 shadow-md' : 'bg-white border-gray-300 text-gray-400'}`}>
                  {isCompleted ? <CheckCircle2 size={18} /> : s.icon}
                </div>
                <span className={`text-xs font-bold ${isCurrent ? 'text-indigo-700' : 'text-gray-500'}`}>{s.title}</span>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 mb-6 flex items-center gap-2 text-sm font-bold shadow-sm">
            <ShieldCheck size={18} /> {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          
          {/* STEP 1: GUEST */}
          {step === 1 && (
            <div className="p-8">
              <h2 className="text-xl font-black text-gray-900 mb-6">Lead Guest Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Full Name *</label>
                  <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)} className="w-full border-gray-300 text-gray-900 font-bold rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:font-medium placeholder:text-gray-400" placeholder="Enter guest name" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Phone Number *</label>
                  <input type="text" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} className="w-full border-gray-300 text-gray-900 font-bold rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:font-medium placeholder:text-gray-400" placeholder="Enter phone number" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Email Address</label>
                  <input type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} className="w-full border-gray-300 text-gray-900 font-bold rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:font-medium placeholder:text-gray-400" placeholder="Enter email (optional)" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">City / Address</label>
                  <input type="text" value={guestAddress} onChange={e => setGuestAddress(e.target.value)} className="w-full border-gray-300 text-gray-900 font-bold rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:font-medium placeholder:text-gray-400" placeholder="Enter address (optional)" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: STAY DATES */}
          {step === 2 && (
            <div className="p-8">
              <h2 className="text-xl font-black text-gray-900 mb-6">Stay Dates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Check-in Date *</label>
                  <input type="date" value={checkInDate} onChange={e => setCheckInDate(e.target.value)} className="w-full border-gray-300 text-gray-900 font-bold rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:font-medium placeholder:text-gray-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Check-out Date *</label>
                  <input type="date" value={checkOutDate} onChange={e => setCheckOutDate(e.target.value)} className="w-full border-gray-300 text-gray-900 font-bold rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:font-medium placeholder:text-gray-400" />
                </div>
              </div>
              <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm font-medium text-indigo-800">Total Duration:</span>
                <span className="text-lg font-black text-indigo-900">{nights} Night(s)</span>
              </div>
            </div>
          )}

          {/* STEP 3: ROOMS */}
          {step === 3 && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-gray-900">Select Rooms</h2>
                <div className="text-sm font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">{selectedRooms.length} selected</div>
              </div>
              
              {loading ? (
                <div className="py-12 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableRooms.length === 0 ? (
                    <div className="col-span-2 text-center py-8 text-gray-500">No rooms available for selected dates.</div>
                  ) : (
                    availableRooms.map((room) => {
                      const isSelected = selectedRooms.some(r => r.id === room.id);
                      return (
                        <div key={room.id} onClick={() => toggleRoom(room)} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-200 hover:border-indigo-300 bg-white'}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className={`text-lg font-black ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>{room.number || room.roomNumber || room.id.slice(-4)}</h3>
                              <p className="text-xs font-medium text-gray-500 mt-1">{room.roomType?.name || 'Standard'}</p>
                            </div>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 bg-transparent'}`}>
                              {isSelected && <CheckCircle2 size={14} />}
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-between text-sm font-bold">
                            <span className="text-gray-500">Base Rate</span>
                            <span className="text-gray-900">₹{((room.roomType?.basePrice || 250000)/100).toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: PAYMENT */}
          {step === 4 && (
            <div className="p-8">
              <h2 className="text-xl font-black text-gray-900 mb-6">Payment Summary</h2>
              
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 mb-6">
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Rooms ({selectedRooms.length})</span>
                    <span className="text-gray-900 font-bold">₹{selectedRooms.reduce((acc, r) => acc + (r.baseRate/100), 0).toLocaleString()} / night</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Nights</span>
                    <span className="text-gray-900 font-bold">{nights}</span>
                  </div>
                </div>
                
                <div className="h-px bg-gray-200 mb-6"></div>
                
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-gray-900">Total Expected Amount</span>
                  <span className="text-2xl font-black text-indigo-700">₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Advance Payment (₹)</label>
                  <input type="number" value={advanceAmount} onChange={e => setAdvanceAmount(e.target.value)} className="w-full border-gray-300 text-gray-900 font-bold rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:font-medium placeholder:text-gray-400" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Payment Mode</label>
                  <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="w-full border-gray-300 text-gray-900 font-bold rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:font-medium placeholder:text-gray-400">
                    <option value="CASH">Cash</option>
                    <option value="ONLINE">Online / UPI</option>
                    <option value="CARD">Credit Card</option>
                  </select>
                </div>
              </div>

            </div>
          )}

          {/* Footer Actions */}
          <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            {step > 1 ? (
              <button onClick={prevStep} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition shadow-sm flex items-center gap-2">
                <ArrowLeft size={16} /> Back
              </button>
            ) : <div></div>}
            
            {step < 4 ? (
              <button 
                onClick={nextStep} 
                disabled={step === 1 && (!guestName || !guestPhone) || (step === 3 && selectedRooms.length === 0)}
                className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                Next Step <ArrowRight size={16} />
              </button>
            ) : (
              <button 
                onClick={handleSave} 
                disabled={loading}
                className="px-6 py-2.5 bg-[#00875a] text-white text-sm font-bold rounded-xl hover:bg-[#007a51] transition shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={16} />} 
                {editId ? 'Update Reservation' : 'Confirm & Save Reservation'}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function ReservationWizard() {
  return (
    <Suspense fallback={<div>Loading Wizard...</div>}>
      <ReservationWizardContent />
    </Suspense>
  );
}
