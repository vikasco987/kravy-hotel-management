'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, X, Check, Banknote, Smartphone, CreditCard, Printer, MessageCircle, 
  MapPin, Link2, Download, Settings, Trash2, Plus, BedDouble
} from 'lucide-react';
import dayjs from 'dayjs';

function CheckoutSuite() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);

  // Selections
  const [selectedStayRoomIds, setSelectedStayRoomIds] = useState<string[]>([]);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD' | 'MPAY'>('CASH');
  const [amountReceived, setAmountReceived] = useState<string>('');
  
  const [isSettling, setIsSettling] = useState(false);
  const [settledInvoice, setSettledInvoice] = useState<any>(null);

  useEffect(() => {
    if (!roomId) {
      setError('No room ID provided');
      setIsLoading(false);
      return;
    }

    const fetchContext = async () => {
      try {
        const res = await fetch(`/api/hotel/checkout?roomId=${roomId}`);
        const json = await res.json();
        if (res.ok) {
          setData(json);
          // By default, select all linked rooms
          setSelectedStayRoomIds(json.linkedRooms.map((r: any) => r.stayRoomId));
        } else {
          setError(json.error || 'Failed to load checkout data');
        }
      } catch (err) {
        setError('Network error loading checkout data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchContext();
  }, [roomId]);

  if (isLoading) return <div className="h-screen w-screen flex items-center justify-center bg-[#fdfaf5]"><div className="animate-spin text-teal-700">Loading Checkout Suite...</div></div>;
  if (error || !data) return <div className="p-8 text-center text-red-500 font-bold">{error}</div>;

  // --- Calculations based on selected rooms ---
  const selectedRooms = data.linkedRooms.filter((r: any) => selectedStayRoomIds.includes(r.stayRoomId));
  
  const roomTariffSubtotal = selectedRooms.reduce((sum: number, r: any) => sum + r.tariff, 0);
  const taxesSubtotal = selectedRooms.reduce((sum: number, r: any) => {
    // Basic mock tax calc if not pre-calculated
    return sum + (r.tariff * (r.taxRate / 10000)); // assuming taxRate is basis points
  }, 0);
  
  // For simplicity, all extra charges are included. In reality, they should be filtered by room.
  const extraServicesSubtotal = data.extraCharges.reduce((sum: number, c: any) => sum + c.total, 0);
  
  const currentRoomsSubtotal = roomTariffSubtotal + extraServicesSubtotal;
  const combinedGrandTotal = currentRoomsSubtotal + taxesSubtotal;
  
  // Advance Paid
  const advancePaid = data.advancePaid || 0;
  
  const remainingBalanceDue = Math.max(0, combinedGrandTotal - advancePaid);
  const changeToGuest = Math.max(0, (parseFloat(amountReceived) * 100 || 0) - remainingBalanceDue);

  const handleToggleRoom = (stayRoomId: string) => {
    setSelectedStayRoomIds(prev => 
      prev.includes(stayRoomId) 
        ? prev.filter(id => id !== stayRoomId)
        : [...prev, stayRoomId]
    );
  };

  const handleCheckOut = async () => {
    if (selectedStayRoomIds.length === 0) return alert('Select at least one room to checkout');
    
    const amt = parseFloat(amountReceived) * 100 || 0;
    if (amt < remainingBalanceDue) {
      return alert(`Insufficient payment. Need ₹${(remainingBalanceDue / 100).toFixed(2)}`);
    }

    setIsSettling(true);
    try {
      const res = await fetch('/api/hotel/checkout/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stayId: data.stayId,
          stayRoomIds: selectedStayRoomIds,
          payment: {
            mode: paymentMode,
            amountReceived: amt
          }
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to settle');

      setSettledInvoice(json);
      alert('Checkout completed successfully!');

    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSettling(false);
    }
  };

  // UI Formatters
  const formatMoney = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const now = dayjs();

  return (
    <div className="min-h-screen bg-[#f4ece1] p-4 flex justify-center overflow-x-hidden font-sans">
      <div className="w-full max-w-[1400px] bg-white rounded-xl shadow-2xl overflow-hidden border border-[#e5dfd3] flex flex-col h-[calc(100vh-2rem)]">
        
        {/* TOP BAR */}
        <div className="bg-teal-700 text-white px-4 py-3 flex items-center justify-between shrink-0">
           <div className="flex items-center gap-4">
              <h1 className="text-lg font-black tracking-wide flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                 Guest Check-out <span className="text-gray-300 font-normal text-sm">& Final Billing</span>
              </h1>
              <div className="relative">
                 <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                 <input type="text" className="bg-white rounded-md pl-8 pr-3 py-1.5 text-sm text-gray-900 w-64 outline-none" placeholder="Search Invoice / Guest..." />
              </div>
           </div>
           <div className="flex items-center gap-2">
              <button className="bg-[#00875a] hover:bg-[#006f4a] px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 shadow"><Search size={12}/> Search & Load</button>
              <button className="bg-[#00875a] hover:bg-[#006f4a] px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 shadow"><Download size={12}/> Get Data</button>
              <button className="bg-[#1b3a4b] hover:bg-[#122e3b] px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 shadow border border-blue-800"><Check size={12}/> Choose Occupied Room</button>
              <button className="bg-teal-600 hover:bg-teal-700 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 shadow"><Settings size={12}/> Column Settings</button>
              <button onClick={() => router.push('/dashboard')} className="bg-gray-600 hover:bg-gray-700 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 shadow"><X size={12}/> Close Window</button>
           </div>
        </div>

        {/* MAIN SPLIT */}
        <div className="flex flex-1 overflow-hidden">
           
           {/* LEFT COLUMN: Setup & Details */}
           <div className="flex-1 border-r border-gray-200 overflow-y-auto p-4 bg-[#fdfaf5] space-y-4">
              
              <div className="bg-white text-gray-800 px-0 py-2 flex justify-between items-center text-sm font-black mb-2">
                 <span className="flex items-center gap-2"><div className="bg-teal-700 text-white p-1 rounded-md"><BedDouble size={14} /></div> 1. Room Occupants & Extra Services Setup</span>
                 <button className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 text-[10px] font-bold px-3 py-1.5 rounded-md flex items-center gap-1 shadow-sm"><Link2 size={12} className="rotate-45"/> Choose Another Room</button>
              </div>

              {/* Group Map */}
              <div className="bg-white border-2 border-gray-100 rounded-xl p-4 shadow-sm relative">
                 <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                       <span className="bg-teal-700 text-white text-[10px] font-black px-2 py-1 rounded-sm flex items-center gap-1"><Link2 size={10}/> GROUP BOOKING NETWORK: MAP</span>
                       <span className="text-sm font-black text-gray-900 ml-2">Group ID: {data.groupId}</span>
                       <span className="text-xs text-gray-500">({data.linkedRooms.length} Group Rooms)</span>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => setSelectedStayRoomIds(data.linkedRooms.map((r:any) => r.stayRoomId))} className="bg-teal-700 hover:bg-teal-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-md flex items-center gap-1 shadow-sm"><Check size={12}/> Check-Out All Group Rooms</button>
                       <button onClick={() => setSelectedStayRoomIds([data.linkedRooms.find((r:any) => r.roomId === roomId)?.stayRoomId].filter(Boolean))} className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-[10px] font-bold px-3 py-1.5 rounded-md flex items-center gap-1 shadow-sm"><Settings size={12}/> Single Room Only</button>
                    </div>
                 </div>

                 <div>
                    <div className="text-xs font-bold text-gray-800 mb-3 flex items-center gap-1"><Link2 size={12} className="text-gray-400"/> Linked Rooms in this Group <span className="text-teal-600 font-medium text-[11px]">(Select rooms to check out):</span></div>
                    
                    <div className="flex flex-wrap gap-4 items-center">
                       {data.linkedRooms.map((r: any, idx: number) => {
                          const isSelected = selectedStayRoomIds.includes(r.stayRoomId);
                          
                          let badgeConfig = { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
                          if (r.status === 'OCCUPIED') badgeConfig = { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' };
                          if (r.status === 'CLEANING') badgeConfig = { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' };

                          return (
                             <React.Fragment key={r.stayRoomId}>
                               <div 
                                 onClick={() => handleToggleRoom(r.stayRoomId)}
                                 className={`flex items-center gap-3 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-teal-600 bg-teal-50/20 shadow-sm' : 'border-gray-200 bg-gray-50 opacity-60 hover:opacity-100'}`}
                               >
                                  <div className={`w-5 h-5 rounded flex items-center justify-center border ${isSelected ? 'bg-teal-600 border-teal-600 text-white' : 'bg-white border-gray-300 text-transparent'}`}>
                                     <Check size={14} strokeWidth={3} />
                                  </div>
                                  <div className="bg-teal-700 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                                     <BedDouble size={14}/> <span className="font-black text-[15px]">{r.roomNumber}</span>
                                  </div>
                                  <div className="flex flex-col pr-4 border-r border-gray-100">
                                     <div className="text-xs font-bold text-gray-800">{r.roomType} <span className="text-gray-400 font-normal">·</span> <span className="text-gray-700">{data.leadGuest?.name}</span></div>
                                     <div className="text-[10px] text-gray-500">Tariff: {formatMoney(r.tariff)}/night</div>
                                  </div>
                                  <div className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider border ${badgeConfig.bg} ${badgeConfig.text} ${badgeConfig.border}`}>
                                     {r.status}
                                  </div>
                               </div>
                               {idx < data.linkedRooms.length - 1 && (
                                  <div className="text-yellow-500 flex items-center gap-1">
                                     <Link2 size={16} />
                                  </div>
                               )}
                             </React.Fragment>
                          )
                       })}
                    </div>
                 </div>
                 <div className="mt-4 pt-4 border-t border-gray-100 text-[10px] text-gray-500 flex items-center gap-1.5 italic">
                    <div className="w-3.5 h-3.5 rounded-full border border-gray-400 flex items-center justify-center font-serif text-[8px] not-italic text-gray-400">i</div> 
                    Map Insight: Selecting multiple rooms will merge their balance into a single combined invoice.
                 </div>
              </div>

              {/* Lead Info */}
              <div className="flex items-stretch gap-4">
                 <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-4">
                       <div className="text-teal-700 flex items-center gap-2 border border-gray-200 px-3 py-2 rounded-lg bg-gray-50">
                          <BedDouble size={18}/> <span className="font-black text-lg text-gray-800">Room {data.linkedRooms[0]?.roomNumber}</span>
                       </div>
                       <div>
                          <div className="text-xs font-black text-gray-800">{data.linkedRooms[0]?.roomType} <span className="text-gray-400 font-normal">| {data.linkedRooms[0]?.floor || '1f'}</span></div>
                          <div className="text-xs text-gray-600 mt-0.5 flex items-center gap-3">
                             <span>Lead Guest: <span className="font-black text-gray-900">{data.leadGuest?.name}</span></span>
                             <span className="text-gray-600 flex items-center gap-1"><Smartphone size={12}/> +91 {data.leadGuest?.phone}</span>
                          </div>
                       </div>
                    </div>
                 </div>
                 <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex flex-col text-[11px] text-gray-500">
                       <span className="flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> Check-in</span>
                       <span className="font-bold text-gray-900 mt-0.5">{dayjs(data.linkedRooms[0]?.checkInDate).format('18-MMM-YYYY H:mm')}</span>
                    </div>
                    <div className="text-gray-300">➔</div>
                    <div className="flex flex-col text-[11px] text-gray-500">
                       <span className="flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> Actual Check-Out</span>
                       <span className="font-black text-gray-900 mt-0.5">{now.format('19-MMM-YYYY H:mm')}</span>
                    </div>
                    <div className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-100 flex items-center gap-1">
                       <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg> {data.linkedRooms[0]?.nights} Night (Group)
                    </div>
                 </div>
              </div>

              {/* ALL OCCUPANTS TABLE */}
              <div>
                 <h3 className="text-xs font-black text-gray-800 uppercase mb-2">All Occupants In Room(s):</h3>
                 <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-left text-[10px]">
                       <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase">
                          <tr>
                             <th className="px-3 py-2 font-bold w-8">#</th>
                             <th className="px-3 py-2 font-bold">Room</th>
                             <th className="px-3 py-2 font-bold">Guest Name</th>
                             <th className="px-3 py-2 font-bold">Mobile Number</th>
                             <th className="px-3 py-2 font-bold">Photo / ID Proof</th>
                             <th className="px-3 py-2 font-bold">Guest Type</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                          {data.linkedRooms.map((r: any, idx: number) => (
                             <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-3 py-2">{idx + 1}</td>
                                <td className="px-3 py-2 font-bold text-teal-700 flex items-center gap-1"><BedDouble size={10}/> {r.roomNumber}</td>
                                <td className="px-3 py-2 font-black text-gray-900">{data.leadGuest?.name}</td>
                                <td className="px-3 py-2 text-gray-600">{data.leadGuest?.phone}</td>
                                <td className="px-3 py-2 font-bold text-gray-700">📸 1 Photo</td>
                                <td className="px-3 py-2 font-bold text-teal-600">Guest 1 (Lead)</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>

              {/* EXTRA SERVICES TABLE */}
              <div>
                 <h3 className="text-xs font-black text-gray-800 uppercase mb-2">Extra Services & Charges:</h3>
                 <div className="flex gap-2 mb-2">
                    <button className="bg-white border border-gray-200 hover:bg-gray-50 text-[10px] font-bold px-3 py-1.5 rounded shadow-sm flex items-center gap-1">🍽 Food Service</button>
                    <button className="bg-white border border-gray-200 hover:bg-gray-50 text-[10px] font-bold px-3 py-1.5 rounded shadow-sm flex items-center gap-1">💧 Water / Drink</button>
                    <button className="bg-white border border-gray-200 hover:bg-gray-50 text-[10px] font-bold px-3 py-1.5 rounded shadow-sm flex items-center gap-1">🧺 Laundry / Dry Clean</button>
                    <button className="bg-white border border-gray-200 hover:bg-gray-50 text-[10px] font-bold px-3 py-1.5 rounded shadow-sm flex items-center gap-1">🧹 Extra Cleaning</button>
                    <button className="bg-teal-700 hover:bg-[#091a42] text-white text-[10px] font-bold px-3 py-1.5 rounded shadow-sm flex items-center gap-1 ml-auto"><Plus size={10}/> Add Custom Service / Charge</button>
                 </div>
                 <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-left text-[10px]">
                       <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase">
                          <tr>
                             <th className="px-3 py-2 font-bold">Service / Item Description</th>
                             <th className="px-3 py-2 font-bold">Category</th>
                             <th className="px-3 py-2 font-bold text-center">QTY</th>
                             <th className="px-3 py-2 font-bold text-right">Rate (₹)</th>
                             <th className="px-3 py-2 font-bold text-right">Total (₹)</th>
                             <th className="px-3 py-2 font-bold text-center w-12">Action</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                          {data.extraCharges.length === 0 && (
                            <tr><td colSpan={6} className="px-3 py-4 text-center text-gray-400 font-medium">No extra charges applied.</td></tr>
                          )}
                          {data.extraCharges.map((c: any) => (
                             <tr key={c.id} className="hover:bg-gray-50">
                                <td className="px-3 py-2 font-bold text-gray-800">[{c.type || 'Custom'}] {c.description}</td>
                                <td className="px-3 py-2 text-gray-600">Service</td>
                                <td className="px-3 py-2 text-center font-bold">{c.quantity}</td>
                                <td className="px-3 py-2 text-right">{formatMoney(c.amount)}</td>
                                <td className="px-3 py-2 text-right font-black text-gray-900">{formatMoney(c.total)}</td>
                                <td className="px-3 py-2 text-center">
                                   <button className="bg-red-50 text-red-500 hover:bg-red-100 p-1 rounded"><Trash2 size={10}/></button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>

           </div>

           {/* RIGHT COLUMN: Billing & Payment */}
           <div className="w-[380px] bg-white border-l border-gray-200 flex flex-col shrink-0">
              <div className="bg-teal-700 text-white px-3 py-2 flex justify-between items-center text-sm font-bold shadow-sm">
                 <span>2. Finalize Check-out & Payment</span>
              </div>

              <div className="p-5 overflow-y-auto flex-1 space-y-5">
                 
                 {/* Breakdown Box */}
                 <div className="border border-teal-100 bg-blue-50/20 rounded-lg p-4 shadow-sm">
                    <h3 className="text-xs font-black text-teal-700 mb-3">Room Tariff Breakdown</h3>
                    <div className="text-[10px] text-gray-600 mb-2">Total {selectedRooms.length} Rooms Combined (Group)</div>
                    
                    <div className="space-y-2 text-xs border-b border-gray-200 pb-3 mb-3">
                       <div className="flex justify-between font-medium">
                          <span className="text-gray-600">Room Tariff (Selected Rooms):</span>
                          <span className="font-bold text-gray-900">{formatMoney(roomTariffSubtotal)}</span>
                       </div>
                       <div className="flex justify-between font-medium">
                          <span className="text-gray-600">Extra Services (Food/Laundry):</span>
                          <span className="font-bold text-gray-900">{formatMoney(extraServicesSubtotal)}</span>
                       </div>
                       <div className="flex justify-between font-medium">
                          <span className="text-gray-600">Taxes (GST 12% Estimated):</span>
                          <span className="font-bold text-gray-900">{formatMoney(taxesSubtotal)}</span>
                       </div>
                       <div className="flex justify-between font-medium">
                          <span className="text-gray-600">Current Rooms Subtotal:</span>
                          <span className="font-bold text-gray-900">{formatMoney(currentRoomsSubtotal)}</span>
                       </div>
                    </div>

                    <div className="flex justify-between items-center mb-1">
                       <span className="text-sm font-black text-gray-900">Combined Grand Total Bill:</span>
                       <span className="text-lg font-black text-teal-700">{formatMoney(combinedGrandTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-green-700">
                       <span>Advance Paid (Reservation):</span>
                       <span>{formatMoney(advancePaid)}</span>
                    </div>
                 </div>

                 {/* Remaining Balance Due */}
                 <div className={`border-2 rounded-lg p-4 text-center ${remainingBalanceDue === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} shadow-sm`}>
                    <div className={`text-xs font-bold mb-1 ${remainingBalanceDue === 0 ? 'text-green-700' : 'text-red-700'}`}>Remaining Balance Due:</div>
                    <div className={`text-2xl font-black ${remainingBalanceDue === 0 ? 'text-green-600' : 'text-red-600'}`}>
                       {formatMoney(remainingBalanceDue)} {remainingBalanceDue === 0 && <span className="text-sm">(Fully Paid)</span>}
                    </div>
                 </div>

                 {!settledInvoice && remainingBalanceDue > 0 && (
                   <>
                     {/* Payment Mode */}
                     <div>
                        <h4 className="text-xs font-bold text-gray-800 mb-2">Payment Mode:</h4>
                        <div className="grid grid-cols-4 gap-2">
                           <button onClick={() => setPaymentMode('CASH')} className={`border rounded py-2 flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all ${paymentMode === 'CASH' ? 'bg-teal-700 text-white border-teal-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}><Banknote size={14}/> Cash</button>
                           <button onClick={() => setPaymentMode('UPI')} className={`border rounded py-2 flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all ${paymentMode === 'UPI' ? 'bg-teal-700 text-white border-teal-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}><Smartphone size={14}/> UPI</button>
                           <button onClick={() => setPaymentMode('CARD')} className={`border rounded py-2 flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all ${paymentMode === 'CARD' ? 'bg-teal-700 text-white border-teal-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}><CreditCard size={14}/> Card</button>
                           <button onClick={() => setPaymentMode('MPAY')} className={`border rounded py-2 flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all ${paymentMode === 'MPAY' ? 'bg-teal-700 text-white border-teal-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}><Smartphone size={14}/> M-Pay</button>
                        </div>
                     </div>

                     {/* Amount Received */}
                     <div className="space-y-3">
                        <div className="flex justify-between items-center bg-gray-50 border border-gray-200 rounded-lg p-1">
                           <label className="text-xs font-bold text-gray-700 pl-3">Amount Received (₹):</label>
                           <input 
                             type="number" 
                             value={amountReceived} 
                             onChange={(e) => setAmountReceived(e.target.value)}
                             className="w-32 bg-white border border-gray-300 rounded text-right px-2 py-1.5 font-bold text-sm outline-none focus:border-blue-500"
                           />
                        </div>
                        <div className="flex justify-between items-center px-1">
                           <span className="text-xs text-gray-500 font-medium">Change / Return to Guest:</span>
                           <span className="text-sm font-black text-gray-900">{formatMoney(changeToGuest)}</span>
                        </div>
                     </div>
                   </>
                 )}

                 {/* Action Buttons */}
                 <div className="space-y-2 pt-2">
                    {!settledInvoice ? (
                       <button onClick={handleCheckOut} disabled={isSettling} className="w-full bg-[#00875a] hover:bg-[#006f4a] text-white font-bold py-3 rounded-lg shadow flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50">
                          <Check size={18} /> {isSettling ? 'Processing...' : 'Complete Check-out & Settle Bill'}
                       </button>
                    ) : (
                       <div className="bg-green-50 text-green-800 text-sm font-bold p-3 rounded-lg text-center border border-green-200 mb-4">
                          Checkout Successful! Invoice: {settledInvoice.invoiceNumber}
                       </div>
                    )}
                    
                    <button disabled={!settledInvoice} onClick={() => window.open(`/dashboard/print/invoice/${data.stayId}?format=A4`, "_blank")} className="w-full bg-teal-700 hover:bg-[#091a42] text-white font-bold py-3 rounded-lg shadow flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50">
                       <Printer size={18} /> Print Final Tax Invoice
                    </button>
                    <button disabled={!settledInvoice} className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 rounded-lg shadow flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50">
                       <MessageCircle size={18} /> Send WhatsApp Invoice
                    </button>
                 </div>

              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-[#fdfaf5]"><div className="animate-spin text-teal-700">Loading...</div></div>}>
      <CheckoutSuite />
    </Suspense>
  );
}
