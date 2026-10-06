"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense, useRef } from "react";
import { Search, Settings, X, Trash2, Camera, User, Download, FileText, CheckCircle, Smartphone, Printer, Settings2, ShieldCheck, Banknote, BedDouble, UserRound, CalendarDays, BadgeCheck, TriangleAlert, ArrowLeftRight, Plus, CheckCircle2 } from "lucide-react";
import { useBookingStore } from '@/lib/bookingContext';
import RoomSetupModal, { RoomPricingSnapshot, GuestData } from "./RoomSetupModal";
import CheckInReceiptModal from "@/components/hotel/CheckInReceiptModal";
import ChangeRoomModal from "@/components/hotel/ChangeRoomModal";
import ColumnSettingsModal from "./ColumnSettingsModal";
import AvailableRoomSelection from "./AvailableRoomSelection";

function GuestCheckInSuite() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomsParam = searchParams.get("rooms");
  const [rooms, setRooms] = useState<string[]>([]);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [columnSettings, setColumnSettings] = useState({
    discount: true,
    gst: true,
    adults: true,
    checkInOut: true,
    idProof: true,
    extraCharges: true
  });
  const [changeRoomId, setChangeRoomId] = useState<string | null>(null);
  const [fetchedRooms, setFetchedRooms] = useState<any[]>([]);

  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [advancePaid, setAdvancePaid] = useState("0");
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  
  const { roomPricing, roomGuests, setRoomPricing, setRoomGuests, checkInDate, checkOutDate } = useBookingStore();
  const roomPricingRef = useRef(roomPricing);
  useEffect(() => { roomPricingRef.current = roomPricing; }, [roomPricing]);

  const resIdParam = searchParams.get("resId");

  useEffect(() => {
    if (resIdParam) {
      setIsFetching(true);
      setFetchError(null);
      fetch(`/api/hotel/reservations/${resIdParam}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.reservation) {
             const resRecord = data.reservation;
             const roomRecords = data.roomDetails || [];
             setRooms(roomRecords.map((r: any) => r.id));
             setFetchedRooms(roomRecords);
             
             const pricing: any = {};
             const guestsInfo: any = {};
             
             resRecord.rooms.forEach((rr: any) => {
                const discount = rr.baseRate - (rr.appliedRate || rr.baseRate);
                pricing[rr.roomId] = {
                     baseRate: rr.baseRate,
                     discountAmount: discount > 0 ? discount : 0,
                     extraChargesAmount: 0,
                     cgstAmount: 0,
                     sgstAmount: 0,
                     taxAmount: 0,
                     taxableAmount: (rr.appliedRate || rr.baseRate),
                     taxMode: 'INCLUSIVE',
                     taxRate: 1200,
                     finalAmount: (rr.appliedRate || rr.baseRate),
                     nights: rr.nights || Math.max(1, (new Date(rr.checkOutDate).getTime() - new Date(rr.checkInDate).getTime()) / (1000 * 3600 * 24))
                  };
                
                if (rr.guestsData && Array.isArray(rr.guestsData) && rr.guestsData.length > 0) {
                   guestsInfo[rr.roomId] = rr.guestsData;
                } else {
                   guestsInfo[rr.roomId] = [{
                      name: resRecord.guest?.name || "",
                      phone: resRecord.guest?.phone || "",
                      documentType: "",
                      documentNumber: "",
                      documentUrl: null,
                      isLead: true
                   }];
                }
             });
             if (Object.keys(roomPricing).length === 0) {
               setRoomPricing(pricing);
               setRoomGuests(guestsInfo);
               setAdvancePaid((resRecord.advancePaid / 100).toString());
             }
          } else {
             setFetchError("Reservation not found");
          }
        })
        .catch(err => setFetchError(err.message))
        .finally(() => setIsFetching(false));
    } else if (roomsParam) {
      const roomIds = roomsParam.split(",");
      setRooms(roomIds);
      
      setIsFetching(true);
      setFetchError(null);
      
      fetch(`/api/hotel/rooms/bulk?ids=${roomsParam}`)
        .then(res => res.json())
        .then(data => {
          if (data.rooms && data.rooms.length > 0) {
            setFetchedRooms(data.rooms);
          } else {
            const fallbackRooms = roomIds.map(id => ({
              id: id,
              roomNumber: id.startsWith('room-') ? id.replace('room-', '') : id,
              roomType: { basePrice: 300000 }
            }));
            setFetchedRooms(fallbackRooms);
            if (data.error) setFetchError(data.error);
          }
        })
        .catch(err => {
            const fallbackRooms = roomIds.map(id => ({
              id: id,
              roomNumber: id.startsWith('room-') ? id.replace('room-', '') : id,
              roomType: { basePrice: 250000 }
            }));
            setFetchedRooms(fallbackRooms);
            setFetchError(err.message);
        })
        .finally(() => setIsFetching(false));
    }
  }, [roomsParam, resIdParam]);

  // Calculations for mock UI using fetched data
  let totalRoomCharge = 0;
  let totalExtraCharges = 0;
  let totalGst = 0;
  let totalAmount = 0;

  fetchedRooms.forEach(room => {
     const pricing = roomPricing[room.id];
     if (pricing) {
        totalRoomCharge += pricing.baseRate / 100 - pricing.discountAmount / 100; // Net rent
        totalExtraCharges += (pricing.extraChargesAmount || 0) / 100;
        totalGst += (pricing.cgstAmount + pricing.sgstAmount) / 100;
        totalAmount += pricing.finalAmount / 100;
     } else {
        const base = (room.roomType?.basePrice || 0) / 100;
        totalRoomCharge += base;
        totalGst += base * 0.12;
        totalAmount += base * 1.12;
     }
  });

  const readyRoomsCount = fetchedRooms.filter(room => {
    const guests = roomGuests[room.id] || [];
    return guests.length > 0;
  }).length;

  const handleRemoveRoom = (roomIdToRemove: string) => {
     setRooms(prev => prev.filter(id => id !== roomIdToRemove));
     setFetchedRooms(prev => prev.filter(room => room.id !== roomIdToRemove));
     setRoomPricing(prev => {
        const next = { ...prev };
        delete next[roomIdToRemove];
        return next;
     });
     setRoomGuests(prev => {
        const next = { ...prev };
        delete next[roomIdToRemove];
        return next;
     });
  };

  const handleChangeRoomSelect = (oldRoomId: string, newRoomId: string) => {
     setRooms(prev => prev.map(id => (id === oldRoomId ? newRoomId : id)));
     // Transfer setup data to new room id
     setRoomPricing(prev => {
        const next = { ...prev };
        if (next[oldRoomId]) {
           next[newRoomId] = next[oldRoomId];
           delete next[oldRoomId];
        }
        return next;
     });
     setRoomGuests(prev => {
        const next = { ...prev };
        if (next[oldRoomId]) {
           next[newRoomId] = next[oldRoomId];
           delete next[oldRoomId];
        }
        return next;
     });
     setChangeRoomId(null);
  };

  const handleCompleteCheckIn = async () => {
    if (rooms.length === 0) return;

    // Strict validation
    const incompleteRooms = fetchedRooms.filter(room => {
      const guests = roomGuests[room.id] || [];
      return guests.length === 0;
    });

    if (incompleteRooms.length > 0) {
      alert(`Please complete guest setup for rooms: ${incompleteRooms.map(r => r.roomNumber || r.id.slice(-4)).join(', ')}`);
      return;
    }

    const formattedTotal = totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 });
    if (!window.confirm(`Complete check-in for ${rooms.length} ${rooms.length > 1 ? 'rooms' : 'room'}?\nTotal amount: ₹${formattedTotal}`)) {
      return;
    }

    setIsCheckingIn(true);
    try {
      const res = await fetch("/api/hotel/bookings/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: resIdParam || undefined,
          roomIds: rooms,
          roomPricing: roomPricing,
          roomGuests: roomGuests,
          totalAmount: totalAmount,
          advancePaid: parseFloat(advancePaid) || 0,
          paymentMode: paymentMode,
          checkInDate: checkInDate,
          checkOutDate: checkOutDate
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Check-in successful!");
        
        // Prepare Receipt Data
        const receiptRooms = fetchedRooms.map(room => {
          const pricing = roomPricing[room.id];
          const guests = roomGuests[room.id] || [];
          const leadGuest = guests.find(g => g.isLead) || guests[0] || {};
          
          let rentVal = (room.roomType?.basePrice || 0) / 100;
          let discountVal = 0;
          let gstVal = rentVal * 0.12;
          let extraVal = 0;
          let finalRent = rentVal;
          let netTotal = rentVal + gstVal;
          
          if (pricing) {
             rentVal = pricing.baseRate / 100;
             discountVal = pricing.discountAmount / 100;
             gstVal = (pricing.cgstAmount + pricing.sgstAmount) / 100;
             extraVal = (pricing.extraChargesAmount || 0) / 100;
             finalRent = rentVal - discountVal;
             netTotal = pricing.finalAmount / 100;
          }

          const nights = pricing?.nights || 1;

          return {
            roomNo: room.roomNumber || room.id.slice(-4),
            roomType: room.roomType?.name || 'Standard Room',
            guestName: leadGuest.name || 'GUEST NAME',
            guestPhoto: leadGuest.photoUrl,
            guestMobile: leadGuest.phone,
            guestIdNumber: leadGuest.idNumber || leadGuest.idUrl || (leadGuest.idDocuments && leadGuest.idDocuments.length > 0 ? 'Provided' : null),
            idDocumentType: leadGuest.documentType || 'Aadhaar Card',
            isVerified: leadGuest.isVerified === true,
            totalGuests: guests.length,
            totalKids: 0,
            rent: rentVal,
            discount: discountVal,
            finalRent: finalRent,
            extra: extraVal,
            gst: gstVal,
            netTotal: netTotal,
            nights: nights
          };
        });

        const amtPaid = parseFloat(advancePaid) || 0;
        const balDue = totalAmount - amtPaid;

        setReceiptData({
          stayId: data.stayId,
          receiptNumber: `BK-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 900000) + 100000)}`,
          date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          checkInDate: checkInDate.split('T')[0],
          checkOutDate: checkOutDate.split('T')[0],
          rooms: receiptRooms,
          totalRoomRent: totalRoomCharge,
          totalExtraCharges: totalExtraCharges,
          totalGst: totalGst,
          subtotal: totalRoomCharge + totalExtraCharges,
          grandTotal: totalAmount,
          amountPaid: amtPaid,
          balanceDue: balDue > 0 ? balDue : 0,
          paymentMode: paymentMode,
          status: 'CONFIRMED & ALLOCATED',
          hotelName: 'GRAND PLAZA',
          hotelAddress: 'Keralala Main Road, Civil Lines, Near Railway Station',
          hotelGstin: '4567876543456',
          hotelPhone: '8606093110',
          hotelEmail: 'info@raintechpos.com'
        });
        
        setShowReceipt(true);
        // Invalidate router cache so dashboard fetches new status
        router.refresh();
      } else {
        alert("Error: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Failed to complete check-in.");
    } finally {
      setIsCheckingIn(false);
    }
  };

  const showSelection = !resIdParam && !roomsParam && !isFetching;

  if (showSelection) {
     return <AvailableRoomSelection initialRooms={rooms} onComplete={(ids) => { setRooms(ids); router.push('/dashboard/book?rooms=' + ids.join(',')); }} />;
  }

  return (
    <div className="bg-[#f0f4f8] min-h-screen flex flex-col font-sans overflow-hidden h-screen">
      
      {/* 1. TOP NAVBAR */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-6">
           <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Guest Check-in & Multi-Room Booking Suite</span>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Guest Check-in</h1>
           </div>
           
           <div className="flex items-center gap-2 ml-4">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                 <input 
                   type="text" 
                   placeholder="Search Mobile No. / Guest Name..." 
                   className="pl-9 pr-4 py-1.5 border border-gray-300 rounded-md text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                 />
              </div>
              <button className="bg-[#00875a] text-white px-4 py-1.5 rounded-md text-sm font-bold shadow-sm hover:bg-[#006f4a] flex items-center gap-2">
                 <Search size={14} /> Get Data
              </button>
           </div>
        </div>

        <div className="flex items-center gap-2">
           <button 
             onClick={() => router.push('/dashboard/book')}
             className="bg-[#0e2a6d] text-white px-4 py-1.5 rounded-md text-sm font-bold shadow-sm flex items-center gap-2 hover:bg-[#091a42]"
           >
              <CheckCircle size={14} /> Choose / Add Rooms
           </button>
           <button 
             onClick={() => setShowColumnSettings(true)}
             className="bg-[#0070f3] text-white px-4 py-1.5 rounded-md text-sm font-bold shadow-sm flex items-center gap-2 hover:bg-[#005bb5]"
           >
              <Settings2 size={14} /> Column Settings
           </button>
           <button 
             onClick={() => router.push('/dashboard')}
             className="bg-gray-600 text-white px-4 py-1.5 rounded-md text-sm font-bold shadow-sm flex items-center gap-2 hover:bg-gray-700"
           >
              <X size={14} /> Close Window
           </button>
        </div>
      </div>

      {/* MAIN CONTENT SPLIT */}
      <div className="flex flex-1 overflow-hidden p-3 gap-3">
         
         {/* LEFT PANEL: TABLE */}
         <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            
            {/* Table Header Area */}
            <div className="bg-[#0e2a6d] text-white px-4 py-2 flex items-center justify-between shrink-0">
               <div className="flex flex-col">
                 <div className="flex items-center gap-2">
                    <FileText size={16} />
                    <span className="font-bold text-sm tracking-wide">Allocated Rooms & Guest Setup Table</span>
                 </div>
                 <span className="text-[10px] text-blue-200">Click any room row or 'Configure' button to add guests, children, webcam photos, and extra charges</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="text-xs font-bold text-blue-100 bg-white/10 px-3 py-1 rounded-full">
                    {rooms.length} Rooms Allocated
                 </div>
                 <div className={`text-xs font-bold px-3 py-1 rounded-full ${readyRoomsCount === rooms.length ? 'bg-green-500/20 text-green-100' : 'bg-orange-500/20 text-orange-100'}`}>
                    {readyRoomsCount} / {rooms.length} Rooms Ready
                 </div>
               </div>
            </div>

            {/* Table */}
            <div className="overflow-auto flex-1">
               <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-white text-[10px] uppercase font-bold text-gray-500 border-b border-gray-200 sticky top-0 z-10">
                     <tr>
                        <th className="px-3 py-3 text-center">Room No.</th>
                        <th className="px-3 py-3 text-right">Room Rent</th>
                        {columnSettings.discount && <th className="px-3 py-3 text-right">Discount</th>}
                        <th className="px-3 py-3 text-right">Final Rent</th>
                        {columnSettings.gst && <th className="px-3 py-3 text-right">GST (T)</th>}
                        <th className="px-3 py-3 text-center">All Occupants / Guest No.</th>
                        {columnSettings.adults && <th className="px-3 py-3 text-center">No. Of Adults</th>}
                        {columnSettings.checkInOut && (
                          <>
                            <th className="px-3 py-3 text-center">Check-in</th>
                            <th className="px-3 py-3 text-center">Checkout</th>
                          </>
                        )}
                        <th className="px-3 py-3 text-center">Days/Nights</th>
                        {columnSettings.idProof && <th className="px-3 py-3 text-center">ID Proof</th>}
                        {columnSettings.extraCharges && <th className="px-3 py-3 text-right">Extra Charges</th>}
                        <th className="px-3 py-3 text-center">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {isFetching && (
                        <tr>
                           <td colSpan={13} className="text-center py-12 text-gray-500">
                             Loading room details...
                           </td>
                        </tr>
                     )}
                     
                     {/* We now fallback to dummy rooms so the table is never completely empty if they selected mock rooms */}
                     {fetchError && (
                        <tr>
                           <td colSpan={13} className="text-center py-4 bg-orange-50 text-orange-600 text-xs">
                             Notice: Showing mock room data (Rooms not found in database).
                           </td>
                        </tr>
                     )}

                     {!isFetching && fetchedRooms.map((roomData, idx) => {
                        const roomId = roomData.id;
                        
                        const pricing = roomPricing[roomId];
                        let rentVal = (roomData.roomType?.basePrice || 0) / 100;
                        let discountVal = 0;
                        let gstVal = rentVal * 0.12;
                        let extraVal = 0;
                        let finalRent = rentVal;
                        
                        if (pricing) {
                           rentVal = pricing.baseRate / 100;
                           discountVal = pricing.discountAmount / 100;
                           gstVal = (pricing.cgstAmount + pricing.sgstAmount) / 100;
                           extraVal = (pricing.extraChargesAmount || 0) / 100;
                           finalRent = rentVal - discountVal;
                        }

                        const rentStr = rentVal.toLocaleString('en-IN', { minimumFractionDigits: 2 });
                        const gstStr = gstVal.toLocaleString('en-IN', { minimumFractionDigits: 2 });
                        const finalRentStr = finalRent.toLocaleString('en-IN', { minimumFractionDigits: 2 });
                        const extraStr = extraVal.toLocaleString('en-IN', { minimumFractionDigits: 2 });
                        
                        const discountDisplay = pricing 
                          ? `${pricing.discountType === 'PERCENTAGE' ? pricing.discountValue + '%' : '₹' + pricing.discountValue} (₹${discountVal})` 
                          : `0% (₹0)`;
                        
                        const guests = roomGuests[roomId] || [];
                        const leadGuest = guests.find(g => g.isLead) || guests[0];
                        const actualAdults = guests.length > 0 ? guests.filter(g => !g.age || Number(g.age) >= 18).length : 1;
                        const actualChildren = guests.length > 0 ? guests.filter(g => g.age && Number(g.age) < 18).length : 0;
                        const hasDocument = leadGuest && (leadGuest.idUrl || leadGuest.idNumber || (leadGuest.idDocuments && leadGuest.idDocuments.length > 0));
                        const isVerified = leadGuest && leadGuest.isVerified === true;
                        const documentType = leadGuest?.documentType || "Aadhaar Card";
                        
                        return (
                           <tr key={roomId} className="hover:bg-gray-50 transition-colors">
                              <td className="px-3 py-4 text-center">
                                 <span className="text-sm font-black text-[#0e2a6d]">{roomData.roomNumber || roomId.slice(-4)}</span>
                              </td>
                              <td className="px-3 py-4 text-right text-xs font-medium text-gray-500">₹{rentStr}</td>
                              {columnSettings.discount && (
                                <td className="px-3 py-4 text-right text-xs font-bold text-orange-500">
                                  {pricing && pricing.discountAmount > 0 
                                    ? `${pricing.discountType === 'PERCENTAGE' ? pricing.discountValue + '%' : 'Flat'} (₹${discountDisplay})` 
                                    : `0% (₹0)`}
                                </td>
                              )}
                              <td className="px-3 py-4 text-right text-xs font-black text-green-700">₹{finalRentStr}</td>
                              {columnSettings.gst && (
                                <td className="px-3 py-4 text-right text-xs text-gray-500">₹{gstStr}</td>
                              )}
                              
                              <td className="px-3 py-4 text-center">
                                 {guests.length > 0 ? (
                                   <div className="flex flex-col items-center gap-1">
                                      <span className="text-xs font-bold text-gray-900 uppercase">{leadGuest?.name}</span>
                                      {guests.length > 1 && <span className="text-[10px] text-gray-500">+{guests.length - 1} more</span>}
                                   </div>
                                 ) : (
                                   <span 
                                     onClick={() => router.push(`/dashboard/book/setup/${roomId}?checkIn=${checkInDate}&checkOut=${checkOutDate}&basePrice=${roomData.roomType?.basePrice ?? 250000}&roomNumber=${encodeURIComponent(roomData.roomNumber || roomId.slice(-4))}`)}
                                     className="text-[10px] font-bold text-orange-600 cursor-pointer hover:bg-orange-100 flex items-center justify-center gap-1 bg-orange-50 px-2 py-1 rounded-full border border-orange-200 transition-colors"
                                   >
                                     <TriangleAlert size={10} /> Setup Missing
                                   </span>
                                 )}
                              </td>
                              
                              {columnSettings.adults && (
                                <td className="px-3 py-4 text-center">
                                   <div className="flex flex-col items-center border border-gray-200 rounded-md bg-white shadow-sm overflow-hidden w-24">
                                      <div className="bg-blue-50 text-blue-700 text-[10px] font-bold py-1 w-full text-center flex flex-col items-center justify-center">
                                         <div className="flex items-center gap-1">
                                            <UserRound size={10} /> {actualAdults} Adult
                                         </div>
                                         {actualChildren > 0 && (
                                            <div className="text-[9px] text-blue-500 opacity-90 -mt-0.5">
                                               {actualChildren} Child
                                            </div>
                                         )}
                                      </div>
                                      <div className={`px-2 py-1 rounded-b-md flex items-center justify-center gap-1 border-t w-full text-[10px] font-bold ${isVerified ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                         {isVerified ? <><BadgeCheck size={10} /> Verified</> : <><div className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-0.5"></div> Not Verified</>}
                                      </div>
                                   </div>
                                </td>
                              )}
                              
                              {columnSettings.checkInOut && (
                                <>
                                  <td className="px-3 py-4 text-center text-xs font-medium text-gray-700">{checkInDate}</td>
                                  <td className="px-3 py-4 text-center text-xs font-medium text-gray-700">{checkOutDate}</td>
                                </>
                              )}
                              <td className="px-3 py-4 text-center">
                                 <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">{pricing ? pricing.nights : 1} {pricing && pricing.nights > 1 ? 'Days' : 'Day'}</span>
                              </td>
                              {columnSettings.idProof && (
                                <td className="px-3 py-4 text-center">
                                   {!hasDocument ? (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200">
                                        ● No ID
                                      </span>
                                   ) : isVerified ? (
                                      <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex flex-col items-center gap-0.5 w-max mx-auto">
                                        <span className="flex items-center gap-1"><BadgeCheck size={10}/> {documentType}</span>
                                        <span className="text-[9px]">(Verified)</span>
                                      </span>
                                   ) : (
                                      <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex flex-col items-center gap-0.5 w-max mx-auto">
                                        <span className="flex items-center gap-1">{documentType}</span>
                                        <span className="text-[9px]">Not Verified</span>
                                      </span>
                                   )}
                                </td>
                              )}
                              {columnSettings.extraCharges && (
                                <td className="px-3 py-4 text-right font-medium text-orange-400">₹{extraStr}</td>
                              )}
                              
                              <td className="px-3 py-4">
                                 <div className="flex items-center justify-center gap-1">
                                    <button 
                                      onClick={() => router.push(`/dashboard/book/setup/${roomId}?checkIn=${checkInDate}&checkOut=${checkOutDate}&basePrice=${roomData.roomType?.basePrice ?? 250000}&roomNumber=${encodeURIComponent(roomData.roomNumber || roomId.slice(-4))}`)}
                                      className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[10px] font-bold px-2 py-1.5 rounded-md flex items-center gap-1 shadow-sm transition-colors"
                                    >
                                       <Settings2 size={12} className="text-[#0070f3]" /> Setup
                                    </button>
                                    <button 
                                      onClick={() => setChangeRoomId(roomId)}
                                      className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[10px] font-bold px-2 py-1.5 rounded-md flex items-center gap-1 shadow-sm transition-colors"
                                    >
                                       <ArrowLeftRight size={12} className="text-orange-500" /> Change Room
                                    </button>
                                    <button 
                                      onClick={() => handleRemoveRoom(roomId)}
                                      className="bg-white border border-red-200 hover:bg-red-50 text-red-600 px-2 py-1.5 rounded-md flex items-center gap-1 shadow-sm transition-colors"
                                    >
                                       <X size={12} />
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        );
                     })}
                     
                     {/* Empty State filler if no rooms */}
                     {rooms.length === 0 && (
                        <tr>
                           <td colSpan={13} className="text-center py-12 text-gray-500">
                             No rooms selected. Please go back and select rooms to check-in.
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>

         {/* RIGHT PANEL: PAYMENT SUMMARY */}
         <div className="w-80 flex flex-col gap-3 shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
               
               <div className="bg-[#0e2a6d] text-white px-4 py-2 shrink-0">
                  <span className="font-bold text-sm tracking-wide">3. Finalize Check-in & Payment</span>
               </div>
               
               <div className="p-4 flex flex-col space-y-4 text-sm flex-1 overflow-y-auto">
                  
                  {/* Duration Block */}
                  <div className="bg-blue-50/50 border border-blue-100 rounded-md p-3 flex justify-between items-center">
                     <div>
                        <div className="text-xs text-gray-500 font-semibold flex items-center gap-1"><FileText size={12}/> Stay Duration:</div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-1"><Banknote size={10}/> Daily Rate:</div>
                     </div>
                     <div className="text-right">
                        <div className="text-xs font-black text-gray-800">{rooms.length} Rooms <span className="font-medium text-gray-500">(Calculated Nights)</span></div>
                     </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="space-y-2 border-b border-gray-100 pb-3">
                     <div className="flex justify-between items-center text-xs text-gray-600 font-medium">
                        <span>Total Room Charge</span>
                        <span className="font-bold text-gray-900">₹{totalRoomCharge.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                     </div>
                     <div className="flex justify-between items-center text-xs text-gray-600 font-medium">
                        <span>Extra Charges</span>
                        <span className="font-bold text-orange-500">₹{totalExtraCharges.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                     </div>
                     <div className="flex justify-between items-center text-xs text-gray-600 font-medium">
                        <span className="flex items-center gap-1">Tax (GST) <span className="bg-blue-100 text-blue-700 text-[8px] font-bold px-1 rounded">Avg</span></span>
                        <span className="font-bold text-gray-900">₹{totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                     </div>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center py-2 border-t border-gray-200 mt-2">
                     <span className="text-sm font-black text-gray-900">TOTAL</span>
                     <span className="text-xl font-black text-[#0e2a6d]">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>

                  {/* Advance Payment */}
                  <div className="flex items-center justify-between gap-2 pt-2">
                     <span className="text-xs font-bold text-green-700 w-24">Advance / Paid:</span>
                     <div className="flex flex-1 gap-1">
                        <select className="border border-gray-300 rounded text-[10px] font-bold text-gray-700 px-1 py-1.5 w-16 outline-none">
                           <option>₹ Full</option>
                           <option>Partial</option>
                        </select>
                        <input 
                           type="number" 
                           value={advancePaid}
                           onChange={(e) => setAdvancePaid(e.target.value)}
                           className="border border-gray-300 rounded text-gray-900 text-right text-xs font-bold px-2 py-1.5 flex-1 outline-none focus:ring-1 focus:ring-blue-500" 
                        />
                     </div>
                  </div>

                  {/* Payment Modes */}
                  <div className="pt-2">
                     <span className="text-xs font-bold text-gray-700 block mb-1">Payment Mode:</span>
                     <div className="grid grid-cols-3 gap-1">
                        <button onClick={() => setPaymentMode('CASH')} className={`${paymentMode === 'CASH' ? 'bg-[#0e2a6d] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} border border-gray-200 text-[10px] font-bold py-2 rounded flex items-center justify-center gap-1`}><Banknote size={12}/> Cash</button>
                        <button onClick={() => setPaymentMode('ONLINE')} className={`${paymentMode === 'ONLINE' ? 'bg-[#0e2a6d] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} border border-gray-200 text-[10px] font-bold py-2 rounded flex items-center justify-center gap-1`}><Smartphone size={12}/> Online/UPI</button>
                        <button onClick={() => setPaymentMode('MPAY')} className={`${paymentMode === 'MPAY' ? 'bg-[#0e2a6d] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} border border-gray-200 text-[10px] font-bold py-2 rounded flex items-center justify-center gap-1`}><Smartphone size={12}/> M-Pay</button>
                     </div>
                  </div>

                  {/* Balance Due */}
                  <div className="bg-red-50 border border-red-100 rounded p-2 flex justify-between items-center mt-2">
                     <span className="text-xs font-bold text-red-700">Balance Due:</span>
                     <span className="text-sm font-black text-red-600">₹{Math.max(0, totalAmount - (parseFloat(advancePaid) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>

                  {/* Main Action Button */}
                  <button onClick={handleCompleteCheckIn} disabled={isCheckingIn} className="w-full bg-[#00875a] hover:bg-[#006f4a] text-white font-bold py-3 rounded-md shadow flex items-center justify-center gap-2 mt-2 transition-transform active:scale-95 disabled:opacity-50">
                     <CheckCircle size={18} /> {isCheckingIn ? 'Processing...' : 'Complete Check-in & Bill'}
                  </button>

                  {/* Secondary Action Grid */}
                  <div className="grid grid-cols-3 gap-2 mt-2">
                     <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 text-[10px] font-bold py-1.5 rounded flex items-center justify-center gap-1"><Download size={10}/> Get Data</button>
                     <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 text-[10px] font-bold py-1.5 rounded flex items-center justify-center gap-1"><Smartphone size={10}/> M-Pay</button>
                     <button onClick={() => window.print()} className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 text-[10px] font-bold py-1.5 rounded flex items-center justify-center gap-1"><Printer size={10}/> Print</button>
                  </div>
                  <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-50 text-xs font-bold text-gray-700 w-full justify-center">
                     <Printer size={12} /> Print Registration Card (GRC)
                  </button>
                  
                  <div className="grid grid-cols-2 gap-2 mt-1">
                     <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 text-[10px] font-bold py-1.5 rounded flex items-center justify-center gap-1"><Download size={10}/> Download Folio</button>
                     <button className="bg-[#0e2a6d] hover:bg-[#091a42] text-white text-[10px] font-bold py-1.5 rounded flex items-center justify-center gap-1"><CheckCircle size={10}/> Quick Check-in</button>
                  </div>

               </div>
            </div>

            {/* Webcam / Receptionist View Placeholder */}
            <div className="bg-black rounded-lg overflow-hidden h-32 shrink-0 border-2 border-gray-800 relative shadow-md">
               {/* Mock image representing the webcam feed */}
               <img 
                 src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80" 
                 alt="Webcam View" 
                 className="w-full h-full object-cover opacity-80"
               />
               <div className="absolute top-2 left-2 bg-red-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow flex items-center gap-1 animate-pulse">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div> REC
               </div>
               <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                 <span className="text-white text-[8px] font-black drop-shadow-md">Reception Cam 01</span>
                 <button className="bg-white/20 hover:bg-white/40 text-white p-1 rounded backdrop-blur-sm transition-colors">
                    <Camera size={12} />
                 </button>
               </div>
            </div>
         </div>
      </div>

      {/* Render Column Settings Modal */}
      {showColumnSettings && (
        <ColumnSettingsModal 
          settings={columnSettings}
          onChange={(key) => setColumnSettings(prev => ({ ...prev, [key]: !(prev as any)[key] }))}
          onClose={() => setShowColumnSettings(false)}
        />
      )}

      {/* Render Setup Modal */}


      {changeRoomId && (
        <ChangeRoomModal
          currentRoomId={changeRoomId}
          onClose={() => setChangeRoomId(null)}
          onSelect={(newRoomId) => handleChangeRoomSelect(changeRoomId, newRoomId)}
        />
      )}

      {showReceipt && receiptData && (
        <CheckInReceiptModal
          bookingData={receiptData}
          onClose={() => {
            setShowReceipt(false);
            router.push("/dashboard");
          }}
        />
      )}
    </div>
  );
}

export default function BookRoomsPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-slate-50"><div className="animate-spin text-[#0e2a6d]">Loading Suite...</div></div>}>
      <GuestCheckInSuite />
    </Suspense>
  );
}
