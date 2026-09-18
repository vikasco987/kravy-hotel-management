import React, { useState, useEffect } from 'react';
import { Settings, X, Plus, Image as ImageIcon, Camera, Trash2, BedDouble, Info, Loader2, Upload } from 'lucide-react';
import MediaUploadModal from '@/components/hotel/MediaUploadModal';
import { extractIdDetails } from '@/lib/ocrService';

export interface RoomPricingSnapshot {
  nights: number;
  baseRate: number;
  grossAmount: number;
  discountType: 'PERCENTAGE' | 'FIXED' | null;
  discountValue: number | null;
  discountAmount: number;
  taxMode: 'INCLUSIVE' | 'EXCLUSIVE';
  taxRate: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  taxAmount: number;
  extraChargesAmount: number;
  finalAmount: number;
  
  // Frontend preservation fields
  bedCharge?: number;
  bedMode?: 'FIXED' | 'DAILY';
  otherCharge?: number;
  otherMode?: 'FIXED' | 'DAILY';
}

export interface GuestData {
  id: string;
  name: string;
  phone: string;
  age: string;
  gender: string;
  isLead: boolean;
  photoUrl?: string;
  idUrl?: string;
  idNumber?: string;
}


interface RoomSetupModalProps {
  roomNo: string;
  checkInDate: string;
  checkOutDate: string;
  initialData?: RoomPricingSnapshot;
  initialGuests?: GuestData[];
  onClose: () => void;
  onSave?: (snapshot: RoomPricingSnapshot, guests: GuestData[]) => void;
}

export default function RoomSetupModal({ roomNo, checkInDate, checkOutDate, initialData, initialGuests, onClose, onSave }: RoomSetupModalProps) {
  const [rent, setRent] = useState(initialData ? (initialData.baseRate / 100).toString() : "2500.00");
  const [discount, setDiscount] = useState(initialData ? (initialData.discountValue || 0).toString() : "0");
  const [discountType, setDiscountType] = useState<"percent" | "amount">(initialData?.discountType === 'FIXED' ? 'amount' : 'percent');
  
  const [taxMode, setTaxMode] = useState<"INCLUSIVE" | "EXCLUSIVE">(initialData?.taxMode || "INCLUSIVE");
  const [taxRate, setTaxRate] = useState(initialData ? initialData.taxRate / 100 : 12);
  
  const [bedCharge, setBedCharge] = useState(initialData?.bedCharge ? (initialData.bedCharge / 100).toString() : "0");
  const [bedMode, setBedMode] = useState<"FIXED" | "DAILY">(initialData?.bedMode || "FIXED");
  
  const [otherCharge, setOtherCharge] = useState(initialData?.otherCharge ? (initialData.otherCharge / 100).toString() : "0");
  const [otherMode, setOtherMode] = useState<"FIXED" | "DAILY">(initialData?.otherMode || "FIXED");

  const [isCalculating, setIsCalculating] = useState(false);
  const [snapshot, setSnapshot] = useState<RoomPricingSnapshot | null>(null);
  const [calcError, setCalcError] = useState(false);

  const [guests, setGuests] = useState<GuestData[]>(initialGuests || [
    { id: 'g1', name: '', phone: '', age: '', gender: 'Male', isLead: true }
  ]);
  
  const [activeUpload, setActiveUpload] = useState<{ guestId: string, type: 'id' | 'photo' } | null>(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);

  const handleMediaUpload = async (file: File) => {
    if (!activeUpload) return;
    const { guestId, type } = activeUpload;
    
    setActiveUpload(null); // Close modal immediately to prevent double-clicks
    
    if (type === 'id') setIsOcrProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      const res = await fetch('/api/hotel/upload', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (data.fileReference) {
        if (type === 'id') {
          const ocrData = await extractIdDetails(file);
          alert("Please verify extracted details before saving!");
          
          setGuests(guests.map(g => {
            if (g.id === guestId) {
              return {
                ...g,
                idUrl: data.fileReference,
                idNumber: ocrData.idNumber || g.idNumber,
                name: ocrData.name || g.name
              };
            }
            return g;
          }));
        } else {
          setGuests(guests.map(g => g.id === guestId ? { ...g, photoUrl: data.fileReference } : g));
        }
      }
    } catch (e) {
      console.error("Upload error", e);
      alert(`Failed to upload ${type === 'id' ? 'ID document' : 'photo'}`);
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const addGuest = () => {
    setGuests([...guests, { id: 'g' + Date.now(), name: '', phone: '', age: '', gender: 'Male', isLead: false }]);
  };

  const removeGuest = (id: string) => {
    setGuests(guests.filter(g => g.id !== id));
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsCalculating(true);
      setCalcError(false);
      try {
        const res = await fetch('/api/hotel/pricing/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            checkInDate,
            checkOutDate,
            baseRate: Math.round((parseFloat(rent) || 0) * 100),
            discountType: discountType === 'percent' ? 'PERCENTAGE' : 'FIXED',
            discountValue: parseFloat(discount) || 0,
            taxMode,
            taxRate: taxRate * 100,
            extraCharges: [
              ...(parseFloat(bedCharge) > 0 ? [{ amount: Math.round((parseFloat(bedCharge) || 0) * 100), quantity: 1, chargeMode: bedMode }] : []),
              ...(parseFloat(otherCharge) > 0 ? [{ amount: Math.round((parseFloat(otherCharge) || 0) * 100), quantity: 1, chargeMode: otherMode }] : [])
            ]
          })
        });
        const data = await res.json();
        if (data.success) {
          setSnapshot(data.data);
        } else {
          setCalcError(true);
        }
      } catch (err) {
        console.error("Pricing error:", err);
        setCalcError(true);
      } finally {
        setIsCalculating(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [rent, discount, discountType, taxMode, taxRate, bedCharge, bedMode, otherCharge, otherMode, checkInDate, checkOutDate]);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-sans">
      <div className="bg-[#f8f9fa] rounded-lg shadow-xl w-full max-w-5xl flex flex-col overflow-hidden border border-gray-300">
        
        {/* Header */}
        <div className="bg-[#0e2a6d] text-white px-4 py-3 flex items-center justify-between shrink-0">
           <div className="flex items-center gap-3">
              <BedDouble size={24} />
              <div className="flex flex-col">
                <h2 className="text-lg font-bold leading-tight">Room Allocation & Occupants Setup - Room {roomNo}</h2>
                <span className="text-[10px] text-blue-200">Set number of guests, add children, manage IDs & webcam photos, and extra charges</span>
              </div>
           </div>
           <button className="bg-[#0070f3] text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 hover:bg-[#005bb5]">
              <Settings size={14} /> Column Settings
           </button>
        </div>

        {/* Form Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
           
           {/* Row 1 */}
           <div className="flex items-end gap-3">
              <div className="w-20 shrink-0">
                 <label className="block text-[10px] font-bold text-gray-700 mb-1">Room No.</label>
                 <input type="text" value={roomNo} readOnly className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-gray-100 font-bold text-gray-900 outline-none" />
              </div>
              <div className="w-24 shrink-0">
                 <label className="block text-[10px] font-bold text-gray-700 mb-1">Rent (₹)</label>
                 <input type="number" value={rent} onChange={e => setRent(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-bold text-gray-900 outline-none" />
              </div>
              
              <div className="w-48 shrink-0">
                 <div className="flex items-center gap-2 text-[10px] font-bold text-gray-700 mb-1">
                    <span>Discount</span>
                    <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={discountType === 'percent'} onChange={() => setDiscountType('percent')} /> %</label>
                    <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={discountType === 'amount'} onChange={() => setDiscountType('amount')} /> ₹</label>
                 </div>
                 <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-bold text-gray-900 outline-none" />
              </div>
              
              <div className="w-28 shrink-0">
                 <label className="block text-[10px] font-bold text-gray-700 mb-1">Final Rent (₹)</label>
                 <input type="text" value={rent} readOnly className="w-full border border-green-300 bg-green-50 text-green-800 rounded px-2 py-1.5 text-sm font-bold outline-none" />
              </div>
              
              <div className="w-40 shrink-0">
                 <label className="block text-[10px] font-bold text-gray-700 mb-1 flex items-center gap-1 text-blue-800"><Settings size={10}/> Tax Pricing Mode</label>
                 <select value={taxMode} onChange={e => setTaxMode(e.target.value as "INCLUSIVE" | "EXCLUSIVE")} className="w-full border border-gray-400 bg-gray-200 rounded px-2 py-1.5 text-xs font-bold outline-none text-gray-800">
                    <option value="INCLUSIVE">12% GST - Inclusive</option>
                    <option value="EXCLUSIVE">12% GST - Exclusive</option>
                 </select>
              </div>
              
              <div className="w-32 shrink-0">
                 <label className="block text-[10px] font-bold text-gray-700 mb-1">Check-in Date</label>
                 <input type="date" defaultValue="2026-09-10" className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs font-bold text-gray-900 outline-none" />
              </div>
              
              <div className="w-32 shrink-0">
                 <label className="block text-[10px] font-bold text-gray-700 mb-1">Checkout Date</label>
                 <input type="date" defaultValue="2026-09-11" className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs font-bold text-gray-900 outline-none" />
              </div>

              <div className="flex-1 bg-yellow-100 border border-yellow-300 rounded p-2 text-center h-[52px] flex flex-col justify-center">
                 <span className="text-[10px] font-bold text-yellow-900 block leading-tight">Room Calculated Total</span>
                 <span className="text-lg font-black text-[#0e2a6d] leading-none">
                   {isCalculating ? '...' : snapshot ? `₹${(snapshot.finalAmount / 100).toFixed(2)}` : 'Error'}
                 </span>
              </div>
           </div>

           {/* Row 2: Charges */}
           <div className="flex gap-4">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded p-3">
                 <div className="flex items-center gap-4">
                    <div className="w-32">
                       <label className="block text-[10px] font-bold text-gray-700 mb-1">Bed Charge (₹)</label>
                       <input type="number" value={bedCharge} onChange={e => setBedCharge(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-bold text-gray-900 outline-none" />
                    </div>
                    <div>
                       <span className="block text-[10px] font-bold text-gray-700 mb-1">Mode:</span>
                       <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1 text-[11px] font-bold text-gray-700 cursor-pointer">
                             <input type="radio" name="bedMode" checked={bedMode === 'FIXED'} onChange={() => setBedMode('FIXED')} /> Fixed
                          </label>
                          <label className="flex items-center gap-1 text-[11px] font-bold text-green-700 cursor-pointer">
                             <input type="radio" name="bedMode" checked={bedMode === 'DAILY'} onChange={() => setBedMode('DAILY')} /> <span className="bg-green-100 px-1 rounded">Daily Wise (/Day)</span>
                          </label>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex-1 bg-gray-50 border border-gray-200 rounded p-3">
                 <div className="flex items-center gap-4">
                    <div className="w-32">
                       <label className="block text-[10px] font-bold text-gray-700 mb-1">Other Charge (₹)</label>
                       <input type="number" value={otherCharge} onChange={e => setOtherCharge(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-bold text-gray-900 outline-none" />
                    </div>
                    <div>
                       <span className="block text-[10px] font-bold text-gray-700 mb-1">Mode:</span>
                       <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1 text-[11px] font-bold text-gray-700 cursor-pointer">
                             <input type="radio" name="otherMode" checked={otherMode === 'FIXED'} onChange={() => setOtherMode('FIXED')} /> Fixed
                          </label>
                          <label className="flex items-center gap-1 text-[11px] font-bold text-green-700 cursor-pointer">
                             <input type="radio" name="otherMode" checked={otherMode === 'DAILY'} onChange={() => setOtherMode('DAILY')} /> <span className="bg-green-100 px-1 rounded">Daily Wise (/Day)</span>
                          </label>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Row 3: Remarks */}
           <div>
              <label className="block text-[10px] font-bold text-gray-700 mb-1">Reason / Remark (e.g. Extra Bed, Rollaway, Early Check-in, Laundry)</label>
              <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 outline-none" />
           </div>

           {/* Row 4: Adult Count & Buttons */}
           <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-2">
              <div className="flex items-center gap-3 border border-gray-300 rounded-lg p-2 bg-white flex-1 mr-4 shadow-sm">
                 <span className="text-sm font-black text-[#0e2a6d] flex items-center gap-2 px-2"><Settings size={16}/> Number of Guests:</span>
                 <input type="number" value={guests.length} readOnly className="w-16 border border-gray-300 rounded px-2 py-1 text-center font-bold text-gray-900 outline-none bg-gray-100" />
                 {isOcrProcessing && <span className="text-xs text-blue-600 font-bold flex items-center gap-1 animate-pulse"><Loader2 size={12} className="animate-spin"/> Processing ID (OCR)...</span>}
              </div>
              <div className="flex gap-2">
                 <button onClick={addGuest} className="bg-[#0e2a6d] text-white px-4 py-2 rounded font-bold text-sm flex items-center gap-2 hover:bg-[#091a42] shadow-sm"><Plus size={16}/> Add Guest</button>
              </div>
           </div>

           {/* Table */}
           <div className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm mt-4">
              <table className="w-full text-left border-collapse">
                 <thead className="bg-[#f4f6f8] text-[10px] uppercase font-bold text-gray-500 border-b border-gray-200">
                    <tr>
                       <th className="px-4 py-3">Role / Lead</th>
                       <th className="px-4 py-3">Guest Full Name *</th>
                       <th className="px-4 py-3">Mobile Number *</th>
                       <th className="px-4 py-3 w-24">Age</th>
                       <th className="px-4 py-3">Gender</th>
                       <th className="px-4 py-3 text-center">Action (ID / Cam / Del)</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {guests.map((g, index) => (
                      <tr key={g.id}>
                         <td className="px-4 py-3">
                            <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                               <input type="radio" name="lead" checked={g.isLead} onChange={() => setGuests(guests.map(guest => ({ ...guest, isLead: guest.id === g.id })))} /> Guest {index + 1} {g.isLead && '(Lead)'}
                            </label>
                         </td>
                         <td className="px-4 py-3">
                            <input type="text" value={g.name} onChange={e => setGuests(guests.map(guest => guest.id === g.id ? { ...guest, name: e.target.value } : guest))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-blue-400" />
                         </td>
                         <td className="px-4 py-3 flex flex-col gap-1">
                            <input type="tel" placeholder="Mobile" value={g.phone} onChange={e => setGuests(guests.map(guest => guest.id === g.id ? { ...guest, phone: e.target.value } : guest))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-blue-400" />
                            {g.idNumber && <div className="text-[9px] text-green-700 font-bold bg-green-100 px-1 py-0.5 rounded inline-block">ID: {g.idNumber}</div>}
                         </td>
                         <td className="px-4 py-3">
                            <input type="number" value={g.age} onChange={e => setGuests(guests.map(guest => guest.id === g.id ? { ...guest, age: e.target.value } : guest))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-center text-gray-900 outline-none focus:border-blue-400" />
                         </td>
                         <td className="px-4 py-3">
                            <select value={g.gender} onChange={e => setGuests(guests.map(guest => guest.id === g.id ? { ...guest, gender: e.target.value } : guest))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-blue-400 bg-gray-50">
                               <option>Male</option>
                               <option>Female</option>
                               <option>Other</option>
                            </select>
                         </td>
                         <td className="px-4 py-3">
                            <div className="flex items-start justify-center gap-2">
                               <div className="flex flex-col items-center gap-1">
                                  <button onClick={() => setActiveUpload({ guestId: g.id, type: 'id' })} className={`${g.idUrl ? 'bg-blue-600' : 'bg-gray-400'} hover:bg-blue-700 text-white text-[10px] font-bold px-3 py-1.5 rounded shadow-sm flex items-center gap-1`}>
                                     <Upload size={12}/> ID {g.idUrl && '✓'}
                                  </button>
                                  {g.idUrl && <img src={g.idUrl} alt="ID Preview" className="h-8 w-12 object-cover rounded border border-gray-300 shadow-sm" />}
                               </div>
                               <div className="flex flex-col items-center gap-1">
                                  <button onClick={() => setActiveUpload({ guestId: g.id, type: 'photo' })} className={`${g.photoUrl ? 'bg-[#00875a]' : 'bg-gray-400'} hover:bg-[#006f4a] text-white text-[10px] font-bold px-3 py-1.5 rounded shadow-sm flex items-center gap-1`}>
                                     <Camera size={12}/> CAM {g.photoUrl && '✓'}
                                  </button>
                                  {g.photoUrl && <img src={g.photoUrl} alt="Photo Preview" className="h-8 w-8 object-cover rounded-full border border-gray-300 shadow-sm" />}
                               </div>
                               {guests.length > 1 && (
                                 <button onClick={() => removeGuest(g.id)} className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-3 py-1.5 rounded shadow-sm h-[26px]"><Trash2 size={12}/></button>
                               )}
                            </div>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>

           {/* Price Summary Card */}
           <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 mt-6 w-[400px] ml-auto mr-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#0e2a6d]"></div>
              <h3 className="text-xs font-black text-gray-500 mb-4 uppercase tracking-wider flex items-center justify-between">
                 <span>Price Summary</span>
                 {isCalculating ? <span className="text-blue-500 text-[10px] animate-pulse">Calculating...</span> : <Settings size={12} className="text-gray-400"/>}
              </h3>
              
              {calcError && !isCalculating ? (
                 <div className="text-red-500 text-sm py-4 text-center font-bold">Unable to calculate pricing. Please retry.</div>
              ) : (
                <div className="space-y-2.5 text-sm text-gray-700 opacity-100 transition-opacity duration-200" style={{ opacity: isCalculating ? 0.5 : 1 }}>
                   <div className="flex justify-between">
                      <span>Room Rent {snapshot && snapshot.nights > 1 ? `(${snapshot.nights} Nights)` : ''}</span>
                      <span className="font-medium">₹{snapshot ? (snapshot.grossAmount / 100).toFixed(2) : '0.00'}</span>
                   </div>
                   {snapshot && snapshot.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600 font-medium">
                         <span>Discount ({snapshot.discountType === 'PERCENTAGE' ? `${snapshot.discountValue}%` : `₹${snapshot.discountValue}`})</span>
                         <span>-₹{(snapshot.discountAmount / 100).toFixed(2)}</span>
                      </div>
                   )}
                   {snapshot && snapshot.extraChargesAmount > 0 && (
                      <div className="flex justify-between">
                         <span>Extra Charges</span>
                         <span className="font-medium">₹{(snapshot.extraChargesAmount / 100).toFixed(2)}</span>
                      </div>
                   )}
                   <div className="border-t border-gray-200 my-2 pt-2 flex justify-between font-bold text-gray-900">
                      <span>Taxable Amount</span>
                      <span>₹{snapshot ? (snapshot.taxableAmount / 100).toFixed(2) : '0.00'}</span>
                   </div>
                   <div className="flex justify-between text-xs text-gray-500">
                      <span>CGST ({taxRate/2}%)</span>
                      <span>₹{snapshot ? (snapshot.cgstAmount / 100).toFixed(2) : '0.00'}</span>
                   </div>
                   <div className="flex justify-between text-xs text-gray-500">
                      <span>SGST ({taxRate/2}%)</span>
                      <span>₹{snapshot ? (snapshot.sgstAmount / 100).toFixed(2) : '0.00'}</span>
                   </div>
                   <div className="border-t-2 border-gray-900 mt-4 pt-3 flex justify-between font-black text-[#0e2a6d] text-lg bg-yellow-50 -mx-5 -mb-5 px-5 pb-5">
                      <span className="mt-2">GRAND TOTAL</span>
                      <div className="flex flex-col items-end mt-2">
                         <span>₹{snapshot ? (snapshot.finalAmount / 100).toFixed(2) : '0.00'}</span>
                         {taxMode === 'INCLUSIVE' && (
                            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mt-1">(Tax Included in Total)</span>
                         )}
                         {taxMode === 'EXCLUSIVE' && (
                            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mt-1">(Tax Added to Total)</span>
                         )}
                      </div>
                   </div>
                </div>
              )}
           </div>

        </div>

        {/* Footer */}
        <div className="bg-[#f4f6f8] border-t border-gray-200 px-4 py-3 flex justify-end gap-3 shrink-0">
           <button onClick={onClose} className="bg-[#5a6b82] text-white px-6 py-2 rounded text-sm font-bold shadow-sm hover:bg-[#465466] flex items-center gap-2">
              <X size={16}/> Cancel
           </button>
           <button 
              disabled={isCalculating || calcError || !snapshot}
              onClick={() => {
                 if (onSave && snapshot) {
                    onSave({
                        ...snapshot,
                        bedCharge: Math.round((parseFloat(bedCharge) || 0) * 100),
                        bedMode,
                        otherCharge: Math.round((parseFloat(otherCharge) || 0) * 100),
                        otherMode
                    }, guests);
                 }
                 onClose();
              }}
              className="bg-[#00875a] text-white px-6 py-2 rounded text-sm font-bold shadow-sm hover:bg-[#006f4a] flex items-center gap-2 disabled:opacity-50"
           >
              <ImageIcon size={16} /> Save & Update Room Details
           </button>
        </div>

      </div>
      {activeUpload && (
        <MediaUploadModal
          title={activeUpload.type === 'id' ? "Upload ID Document" : "Guest Photo"}
          defaultMode={activeUpload.type === 'id' ? 'upload' : 'camera'}
          onCapture={handleMediaUpload}
          onCancel={() => setActiveUpload(null)}
        />
      )}
    </div>
  );
}
