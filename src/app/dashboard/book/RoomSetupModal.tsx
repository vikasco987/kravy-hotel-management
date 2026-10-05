import React, { useState, useEffect } from 'react';
import { Settings, X, Plus, Image as ImageIcon, Camera, Trash2, BedDouble, Info, Loader2, Upload, IndianRupee, Tag, CalendarDays, ReceiptText, Lightbulb, Users, CheckCircle2, Percent, Receipt, ChevronDown, Utensils, Droplets, Sparkles, Shirt, Save } from 'lucide-react';
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
  extraChargesDetails?: Array<{
    id?: string;
    name: string;
    price: number;
    quantity: number;
    chargeMode: string;
    chargeType: string;
  }>;
  finalAmount: number;
  
  // Frontend preservation fields
  bedCharge?: number;
  bedMode?: 'FIXED' | 'DAILY';
  otherCharge?: number;
  otherMode?: 'FIXED' | 'DAILY';
}

export interface IDDocument {
  url: string;
  number?: string;
}

export interface GuestData {
  id: string;
  name: string;
  phone: string;
  age: string;
  gender: string;
  isLead: boolean;
  photoUrl?: string;
  idDocuments?: IDDocument[];
  // Legacy fields for backward compatibility during transition
  idUrl?: string;
  idNumber?: string;
  isVerified?: boolean;
  documentType?: string;
}


interface RoomSetupModalProps {
  roomNo: string;
  checkInDate: string;
  checkOutDate: string;
  initialData?: RoomPricingSnapshot;
  initialGuests?: GuestData[];
  defaultRent?: string;
  onClose: () => void;
  onSave?: (snapshot: RoomPricingSnapshot, guests: GuestData[]) => void;
  onCheckInDateChange?: (date: string) => void;
  onCheckOutDateChange?: (date: string) => void;
}

export default function RoomSetupModal({ roomNo, checkInDate, checkOutDate, initialData, initialGuests, defaultRent, onClose, onSave, onCheckInDateChange, onCheckOutDateChange }: RoomSetupModalProps) {
  const [rent, setRent] = useState(() => {
    if (initialData) {
      if (defaultRent && initialData.baseRate === 250000 && defaultRent !== "2500" && defaultRent !== "2500.00") {
        return defaultRent;
      }
      return (initialData.baseRate / 100).toString();
    }
    return defaultRent || "2500.00";
  });
  const [discount, setDiscount] = useState(initialData ? (initialData.discountType === 'FIXED' ? ((initialData.discountValue || 0) / 100).toString() : (initialData.discountValue || 0).toString()) : "0");
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

  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);

  const [selectedServices, setSelectedServices] = useState<Array<{ id: string, name: string, price: number, quantity: number }>>(() => {
    if (initialData?.extraChargesDetails) {
      return initialData.extraChargesDetails
        .filter(c => c.chargeType === 'EXTRA_SERVICE')
        .map(c => ({ id: c.id || '', name: c.name, price: c.price, quantity: c.quantity }));
    }
    return [];
  });
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  const [isCreateServiceOpen, setIsCreateServiceOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  
  // Create/Edit form state
  const [csName, setCsName] = useState('');
  const [csPrice, setCsPrice] = useState('');
  const [csDescription, setCsDescription] = useState('');
  const [csIsActive, setCsIsActive] = useState(true);
  const [isSavingService, setIsSavingService] = useState(false);
  const [csError, setCsError] = useState('');

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/hotel/services', { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data)) setAvailableServices(data.filter(s => s.isActive));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleCreateOrEditService = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingService(true);
    setCsError('');
    try {
      const payload = {
        name: csName,
        price: parseFloat(csPrice),
        description: csDescription,
        isActive: csIsActive
      };
      
      const url = editingServiceId ? `/api/hotel/services/${editingServiceId}` : '/api/hotel/services';
      const method = editingServiceId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        await fetchServices();
        setIsCreateServiceOpen(false);
        setEditingServiceId(null);
      } else {
        const errorData = await res.json().catch(() => null);
        console.error('Service save failed:', errorData);
        setCsError(errorData?.error || 'Failed to save service. Please try again.');
      }
    } catch (err: any) {
      console.error('Network or unexpected error:', err);
      setCsError(err.message || 'Network error occurred');
    } finally {
      setIsSavingService(false);
    }
  };

  const openCreateService = () => {
    setCsName('');
    setCsPrice('');
    setCsDescription('');
    setCsIsActive(true);
    setEditingServiceId(null);
    setCsError('');
    setIsCreateServiceOpen(true);
  };

  const openEditService = (service: any) => {
    setCsName(service.name);
    setCsPrice((service.price / 100).toString());
    setCsDescription(service.description || '');
    setCsIsActive(service.isActive);
    setEditingServiceId(service.id);
    setCsError('');
    setIsCreateServiceOpen(true);
  };

const handleMediaUpload = async (docs: any[]) => {
    if (!activeUpload) return;
    const { guestId, type } = activeUpload;
    
    setActiveUpload(null);
    
    if (type === 'id') setIsOcrProcessing(true);
    
    try {
      // For each doc, upload if there is a physical file
      let finalDocs: any[] = [];
      
      for (const doc of docs) {
          if (doc.isExisting) {
              finalDocs.push({ url: doc.dataUrl, number: doc.idNumber });
              continue;
          }
          
          let finalIdNumber = doc.idNumber;
          let finalUrl = doc.dataUrl;
          
          if (doc.file) {
              const formData = new FormData();
              formData.append('file', doc.file);
              formData.append('type', type);
              const res = await fetch('/api/hotel/upload', { method: 'POST', body: formData });
              const data = await res.json();
              if (data.fileReference) {
                 finalUrl = data.fileReference;
                 
                 // Run OCR if it's an ID and they didn't manually type a number
                 if (type === 'id' && !finalIdNumber) {
                     const ocrData = await extractIdDetails(doc.file);
                     finalIdNumber = ocrData.idNumber || "";
                 }
              }
          }
          
          finalDocs.push({ url: finalUrl, number: finalIdNumber });
      }
      
      if (type === 'id') {
         setGuests(prev => prev.map(g => {
            if (g.id === guestId) {
               // Update idDocuments array
               // Also set legacy idUrl/idNumber to the first one for backward compatibility
               return {
                  ...g,
                  idDocuments: finalDocs,
                  idUrl: finalDocs.length > 0 ? finalDocs[0].url : undefined,
                  idNumber: finalDocs.length > 0 ? finalDocs[0].number : undefined
               };
            }
            return g;
         }));
      } else {
         // It's a photo (only 1 usually)
         if (finalDocs.length > 0) {
            setGuests(prev => prev.map(g => g.id === guestId ? { ...g, photoUrl: finalDocs[0].url } : g));
         }
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      if (type === 'id') setIsOcrProcessing(false);
    }
  };


  const updateGuest = (id: string, field: string, value: any) => {
    setGuests(prev => {
       if (field === 'isLead' && value === true) {
          return prev.map(g => g.id === id ? { ...g, [field]: value } : { ...g, isLead: false });
       }
       return prev.map(g => g.id === id ? { ...g, [field]: value } : g);
    });
  };

  const handleGuestCountChange = (count: number) => {
    if (count < 1) count = 1;
    setGuests(prev => {
      const currentCount = prev.length;
      if (count > currentCount) {
        const newGuests = Array.from({ length: count - currentCount }).map((_, i) => ({
          id: 'g' + Date.now() + i, name: '', phone: '', age: '', gender: 'Male', isLead: false
        }));
        return [...prev, ...newGuests];
      } else if (count < currentCount) {
        return prev.slice(0, count);
      }
      return prev;
    });
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
            discountValue: discountType === 'percent' ? (parseFloat(discount) || 0) : Math.round((parseFloat(discount) || 0) * 100),
            taxMode,
            taxRate: taxRate * 100,
            extraCharges: [
              ...(parseFloat(bedCharge) > 0 ? [{ amount: Math.round((parseFloat(bedCharge) || 0) * 100), quantity: 1, chargeMode: bedMode }] : []),
              ...(parseFloat(otherCharge) > 0 ? [{ amount: Math.round((parseFloat(otherCharge) || 0) * 100), quantity: 1, chargeMode: otherMode }] : []),
              ...selectedServices.map(s => ({
                id: s.id,
                name: s.name,
                amount: s.price,
                quantity: s.quantity,
                chargeMode: 'FIXED',
                chargeType: 'EXTRA_SERVICE'
              }))
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
  }, [rent, discount, discountType, taxMode, taxRate, bedCharge, bedMode, otherCharge, otherMode, checkInDate, checkOutDate, selectedServices]);
  
  return (
    <div className="fixed inset-0 z-[100] bg-slate-100 text-slate-800 flex flex-col overflow-hidden">

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-40 h-[60px] bg-gradient-to-r from-[#12366b] via-[#16477e] to-[#0f315f] px-2 text-white shadow-lg">
        <div className="flex h-full items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500 shadow-lg">
              <BedDouble size={27} />
            </div>
            <div>
              <h1 className="text-[18px] font-bold leading-6">
                Room Allocation & Occupants Setup
              </h1>
              <p className="mt-1 text-[8px] text-blue-100">
                Set number of guests, add children, manage IDs & webcam photos, and extra charges
              </p>
            </div>
          </div>

        </div>
      </header>


      {/* ================= MAIN ================= */}
      <main className="p-3 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_400px]">

          {/* ================= LEFT CONTENT ================= */}
          <section className="min-w-0 space-y-3">

            {/* TOP BILLING CARDS */}
            <div className="rounded-xl bg-blue-50/40 p-3 border border-blue-100/50">
               <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-7">
                 <MiniCard icon={<BedDouble size={16} />} label="Room No." value={roomNo} readOnly />
                 <MiniCard icon={<IndianRupee size={16} />} label="Rent (₹)" value={rent} onChange={setRent} />
                 
                 <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
                    <div className="mb-1.5 flex items-center gap-1.5">
                       <span className="text-blue-600"><Percent size={16} /></span>
                       <span className="truncate text-[10px] font-bold text-slate-600">Discount</span>
                       <div className="ml-auto flex items-center gap-1 text-[9px] font-bold text-slate-500">
                          <label className="flex items-center gap-0.5 cursor-pointer"><input type="radio" checked={discountType === 'percent'} onChange={() => setDiscountType('percent')} className="w-2.5 h-2.5 accent-blue-600"/> %</label>
                          <label className="flex items-center gap-0.5 cursor-pointer"><input type="radio" checked={discountType === 'amount'} onChange={() => setDiscountType('amount')} className="w-2.5 h-2.5 accent-blue-600"/> ₹</label>
                       </div>
                    </div>
                    <input value={discount} onChange={e => setDiscount(e.target.value)} className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[11px] font-semibold outline-none" />
                 </div>

                 <MiniCard icon={<IndianRupee size={16} />} label="Final Rent (₹)" value={snapshot ? (snapshot.grossAmount/100).toFixed(2) : "0.00"} green readOnly />
                 
                 <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
                    <div className="mb-1.5 flex items-center gap-1.5">
                       <span className="text-blue-600"><Receipt size={16} /></span>
                       <span className="truncate text-[10px] font-bold text-slate-600">Tax Pricing Mode</span>
                    </div>
                    <div className="relative">
                       <select value={taxMode} onChange={e => setTaxMode(e.target.value as 'INCLUSIVE'|'EXCLUSIVE')} className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[11px] font-semibold outline-none appearance-none">
                          <option value="INCLUSIVE">12% GST - Inclusive</option>
                          <option value="EXCLUSIVE">12% GST - Exclusive</option>
                       </select>
                       <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                 </div>

                 <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
                    <div className="mb-1.5 flex items-center gap-1.5">
                       <span className="text-blue-600"><CalendarDays size={16} /></span>
                       <span className="truncate text-[10px] font-bold text-slate-600">Check-in Date</span>
                    </div>
                    <input 
                       type="date" 
                       value={checkInDate} 
                       onChange={e => onCheckInDateChange && onCheckInDateChange(e.target.value)} 
                       className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[11px] font-semibold outline-none focus:border-blue-500" 
                    />
                 </div>

                 <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
                    <div className="mb-1.5 flex items-center gap-1.5">
                       <span className="text-blue-600"><CalendarDays size={16} /></span>
                       <span className="truncate text-[10px] font-bold text-slate-600">Checkout Date</span>
                    </div>
                    <input 
                       type="date" 
                       value={checkOutDate} 
                       onChange={e => onCheckOutDateChange && onCheckOutDateChange(e.target.value)} 
                       className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[11px] font-semibold outline-none focus:border-blue-500" 
                    />
                 </div>
               </div>
            </div>

            {/* CHARGES */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 rounded-xl bg-violet-50/40 p-3 border border-violet-100/50">
              <ChargeCard title="Bed Charge (₹)" value={bedCharge} onChange={setBedCharge} mode={bedMode} onModeChange={setBedMode} icon={<BedDouble size={17} />} />
              <ChargeCard title="Other Charge (₹)" value={otherCharge} onChange={setOtherCharge} mode={otherMode} onModeChange={setOtherMode} icon={<Receipt size={17} />} />
            </div>


            {/* GUEST SECTION */}
            <div className="overflow-hidden rounded-xl border border-indigo-200/60 bg-indigo-50/20 shadow-sm">
              <div className="flex items-center justify-between bg-indigo-100/50 px-2 py-1.5 border-b border-indigo-100">
                <div className="flex items-center gap-3">
                  <Users size={19} className="text-indigo-600" />
                  <span className="text-[8px] font-bold text-indigo-900">
                    Number of Guests
                  </span>
                  <input
                    type="number"
                    value={guests.length}
                    readOnly
                    className="h-7 w-20 rounded-lg border border-indigo-200 bg-slate-100 px-2 text-center text-sm font-semibold outline-none cursor-not-allowed"
                  />
                </div>
                <button onClick={() => setEditingGuestId('new')} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-2 py-1 text-[8px] font-bold text-white shadow-sm hover:bg-indigo-700">
                  <Plus size={16} />
                  Add Guest
                </button>
              </div>

              <div className="overflow-x-auto p-2">
                <table className="w-full min-w-[850px] text-left">
                  <thead className="border-b bg-indigo-50/50 rounded-t-lg">
                    <tr className="text-[8px] font-bold uppercase tracking-wide text-indigo-700">
                      <th className="px-2 py-1.5 w-32">Role / Lead</th>
                      <th className="px-2 py-1.5">Guest Full Name *</th>
                      <th className="px-2 py-1.5">Mobile Number *</th>
                      <th className="px-2 py-1.5 w-20">Age</th>
                      <th className="px-2 py-1.5 w-24">Gender</th>
                      <th className="px-2 py-1.5 w-36">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                     {guests.map((g, idx) => (
                        <GuestRow 
                           key={g.id || `guest-${roomNo}-${idx}`} 
                           guest={g} 
                           index={idx}
                           updateGuest={updateGuest}
                           removeGuest={removeGuest}
                           guestsLength={guests.length}
                           onEditGuest={setEditingGuestId}
                           roomNo={roomNo}
                        />
                     ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* EXTRA SERVICES */}
            <div className="rounded-xl border border-rose-200/60 bg-rose-50/30 p-3 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={17} className="text-rose-500" />
                  <h3 className="text-[12px] font-bold text-rose-900">Extra Services</h3>
                </div>
                <button 
                  onClick={() => setIsServicesModalOpen(true)}
                  className="flex items-center gap-1 text-[10px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-100/50 px-2 py-1 rounded-md transition-colors"
                >
                  <Plus size={14} /> Add Service
                </button>
              </div>
              <div className="rounded-lg border border-rose-200 bg-white overflow-hidden shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                {selectedServices.length === 0 ? (
                  <div className="flex h-16 items-center justify-center text-[11px] text-rose-400 border border-dashed border-transparent">
                    No extra charges applied.
                  </div>
                ) : (
                  <div className="divide-y divide-rose-100">
                    {selectedServices.map(service => (
                      <div key={service.id} className="flex items-center justify-between p-3">
                        <div>
                           <div className="text-[13px] font-bold text-slate-800">{service.name}</div>
                           <div className="text-[11px] text-slate-500">₹{(service.price / 100).toFixed(2)} / service</div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200 p-1">
                              <button 
                                onClick={() => setSelectedServices(prev => prev.map(s => s.id === service.id ? { ...s, quantity: Math.max(1, s.quantity - 1) } : s))}
                                className="w-6 h-6 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">-</button>
                              <span className="text-[12px] font-bold w-4 text-center">{service.quantity}</span>
                              <button 
                                onClick={() => setSelectedServices(prev => prev.map(s => s.id === service.id ? { ...s, quantity: s.quantity + 1 } : s))}
                                className="w-6 h-6 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">+</button>
                           </div>
                           <div className="text-[13px] font-bold text-slate-800 w-20 text-right">
                              ₹{((service.price * service.quantity) / 100).toFixed(2)}
                           </div>
                           <button 
                             onClick={() => setSelectedServices(prev => prev.filter(s => s.id !== service.id))}
                             className="text-rose-400 hover:text-rose-600 transition-colors p-1"
                             title="Remove Service"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                      </div>
                    ))}
                    <div className="bg-rose-50/50 p-3 flex justify-between items-center border-t border-rose-200">
                       <span className="text-[12px] font-bold text-rose-800 uppercase tracking-wide">Extra Services Total:</span>
                       <span className="text-[15px] font-black text-rose-700">
                          ₹{(selectedServices.reduce((acc, s) => acc + (s.price * s.quantity), 0) / 100).toFixed(2)}
                       </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ================= RIGHT SIDEBAR ================= */}
          <aside className="space-y-3">
            {/* PRICE SUMMARY */}
            <div className="overflow-hidden rounded-2xl border border-emerald-200/60 bg-emerald-50/20 shadow-sm">
              <div className="border-l-4 border-emerald-500">
                <div className="flex items-center gap-2 bg-emerald-100/50 px-4 py-3">
                  <Receipt size={18} className="text-emerald-700" />
                  <h2 className="text-[14px] font-bold text-emerald-900">
                    Price Summary {isCalculating && <Loader2 size={14} className="animate-spin inline ml-2"/>}
                  </h2>
                </div>
                <div className="space-y-3 p-4 bg-white">
                  <PriceRow label="Room Rent" value={`₹${snapshot ? (snapshot.grossAmount/100).toFixed(2) : '0.00'}`} />
                  {snapshot && snapshot.discountAmount > 0 && (
                     <PriceRow label={`Discount (${snapshot.discountType === 'PERCENTAGE' ? snapshot.discountValue + '%' : 'Flat'})`} value={`-₹${(snapshot.discountAmount/100).toFixed(2)}`} green />
                  )}
                  {snapshot && snapshot.extraChargesAmount > 0 && (
                     <PriceRow label="Extra Charges" value={`₹${(snapshot.extraChargesAmount/100).toFixed(2)}`} />
                  )}
                  <div className="border-t border-slate-200 pt-3">
                    <PriceRow label="Taxable Amount" value={`₹${snapshot ? (snapshot.taxableAmount/100).toFixed(2) : '0.00'}`} bold />
                    <div className="mt-2 space-y-2">
                      <PriceRow label={`CGST (${taxRate/2}%)`} value={`₹${snapshot ? (snapshot.cgstAmount/100).toFixed(2) : '0.00'}`} muted />
                      <PriceRow label={`SGST (${taxRate/2}%)`} value={`₹${snapshot ? (snapshot.sgstAmount/100).toFixed(2) : '0.00'}`} muted />
                    </div>
                  </div>
                </div>
                {/* GRAND TOTAL */}
                <div className="flex items-center justify-between bg-emerald-100/50 px-4 py-4 border-t border-emerald-100">
                  <div>
                    <p className="text-[13px] font-bold text-emerald-900">GRAND TOTAL</p>
                    <p className="mt-1 text-[9px] uppercase text-emerald-700">
                      {taxMode === 'INCLUSIVE' ? 'Tax included in total' : 'Tax added to total'}
                    </p>
                  </div>
                  <p className="text-[21px] font-extrabold text-emerald-700">
                    ₹{snapshot ? (snapshot.finalAmount/100).toFixed(2) : '0.00'}
                  </p>
                </div>
              </div>
            </div>

            {/* QUICK TIPS */}
            <div className="rounded-xl border border-sky-200/60 bg-sky-50/40 p-4 shadow-sm">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                  <Lightbulb size={18} />
                </div>
                <div>
                  <h3 className="text-[12px] font-bold text-sky-900">Quick Tips</h3>
                  <p className="mt-1 text-[11px] leading-4 text-sky-700/80">
                    Use discount for special offers or loyalty benefits.
                  </p>
                </div>
              </div>
            </div>


          </aside>
        </div>
      </main>

      {/* ================= STICKY FOOTER ================= */}
      <footer className="sticky bottom-0 z-30 flex items-center justify-end gap-3 border-t border-slate-200 bg-white/95 px-2 py-3 shadow-[0_-4px_15px_rgba(0,0,0,0.06)] backdrop-blur">
        <button onClick={onClose} className="flex items-center gap-2 rounded-lg bg-slate-100 px-2 py-1.5 text-[8px] font-semibold text-slate-600 hover:bg-slate-200">
          <X size={15} />
          Cancel
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
           className="flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-1.5 text-[8px] font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 disabled:opacity-50"
        >
          <Save size={16} />
          Save & Update Room Details →
        </button>
      </footer>

      {activeUpload && (
        <MediaUploadModal
          title={activeUpload.type === 'id' ? "Upload ID Document" : "Guest Photo"}
          defaultMode={activeUpload.type === 'id' ? 'upload' : 'camera'}
          showIdNumberField={activeUpload.type === 'id'}
          allowMultiple={activeUpload.type === 'id'}
          initialDocuments={
             activeUpload.type === 'id' 
               ? (guests.find(g => g.id === activeUpload.guestId)?.idDocuments || []).map(d => ({ dataUrl: d.url, idNumber: d.number, isExisting: true }))
               : undefined
          }
          onCapture={handleMediaUpload}
          onCancel={() => setActiveUpload(null)}
        />
      )}

      {editingGuestId && (
        <GuestFormModal 
          initialData={editingGuestId === 'new' ? undefined : guests.find((g: any) => g.id === editingGuestId)}
          onClose={() => setEditingGuestId(null)}
          onSave={(updatedGuest) => {
             setGuests((prev: any[]) => {
                let newGuests = [...prev];
                if (updatedGuest.isLead) {
                   newGuests = newGuests.map(g => ({ ...g, isLead: false }));
                }
                const idx = newGuests.findIndex(g => g.id === updatedGuest.id);
                if (idx >= 0) {
                   newGuests[idx] = updatedGuest;
                } else {
                   newGuests.push(updatedGuest);
                }
                return newGuests;
             });
             setEditingGuestId(null);
          }}
        />
      )}
      
      {isServicesModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between bg-slate-50 px-4 py-3 border-b border-slate-100">
               <h3 className="text-[14px] font-bold text-slate-800">Select Extra Service</h3>
               <button onClick={() => setIsServicesModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-1 transition-colors">
                  <X size={16} />
               </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
               {availableServices.length === 0 ? (
                  <div className="text-center text-[13px] text-slate-500 py-10 px-4">
                     <Sparkles className="mx-auto mb-3 text-slate-300" size={32} />
                     <p className="font-semibold text-slate-700">No extra services available yet.</p>
                     <p className="mt-1 mb-5">Create your first service to add it to this check-in.</p>
                     <button 
                       onClick={openCreateService}
                       className="inline-flex items-center gap-2 bg-teal-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-teal-700 shadow-md transition-colors"
                     >
                       <Plus size={16} /> Create Service
                     </button>
                  </div>
               ) : (
                  <div className="space-y-2">
                     {availableServices.map((service: any) => {
                        const isSelected = selectedServices.some(s => s.id === service.id);
                        return (
                           <div key={service.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/30 transition-all group">
                              <div className="flex-1 cursor-pointer" onClick={() => {
                                 if (!isSelected) {
                                    setSelectedServices(prev => [...prev, { id: service.id, name: service.name, price: service.price, quantity: 1 }]);
                                    setIsServicesModalOpen(false);
                                 }
                              }}>
                                 <div className="flex items-center gap-2">
                                    <span className="text-[13px] font-bold text-slate-800 group-hover:text-teal-800">{service.name}</span>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); openEditService(service); }}
                                      className="text-blue-500 hover:text-blue-700 text-[10px] font-semibold bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded transition-colors"
                                    >
                                      Edit
                                    </button>
                                 </div>
                                 <div className="text-[11px] text-slate-500 font-medium">₹{(service.price / 100).toFixed(2)}</div>
                                 {service.description && (
                                    <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{service.description}</div>
                                 )}
                              </div>
                              <button 
                                disabled={isSelected}
                                onClick={() => {
                                   if (!isSelected) {
                                      setSelectedServices(prev => [...prev, { id: service.id, name: service.name, price: service.price, quantity: 1 }]);
                                      setIsServicesModalOpen(false);
                                   }
                                }}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ml-3 shrink-0 ${isSelected ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-teal-100 text-teal-700 hover:bg-teal-600 hover:text-white'}`}
                              >
                                 {isSelected ? 'Added' : 'Add'}
                              </button>
                           </div>
                        );
                     })}
                  </div>
               )}
            </div>
            {availableServices.length > 0 && (
               <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                  <button onClick={openCreateService} className="text-[12px] font-bold text-teal-600 hover:text-teal-800 flex items-center justify-center gap-1 w-full p-2 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors">
                     <Plus size={14} /> Create New Service
                  </button>
               </div>
            )}
          </div>
        </div>
      )}

      {isCreateServiceOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-[15px] font-bold text-slate-800">
                {editingServiceId ? 'Edit Service' : 'Create New Service'}
              </h2>
              <button onClick={() => setIsCreateServiceOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-1 transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrEditService} className="p-5 space-y-4">
              {csError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-semibold border border-red-100">
                  {csError}
                </div>
              )}
              
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Service Name *</label>
                <input 
                  required
                  value={csName}
                  onChange={e => setCsName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  placeholder="e.g. Breakfast, Laundry"
                />
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Price (₹) *</label>
                <input 
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={csPrice}
                  onChange={e => setCsPrice(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  placeholder="e.g. 300"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Description (Optional)</label>
                <textarea 
                  value={csDescription}
                  onChange={e => setCsDescription(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none resize-none h-20"
                  placeholder="Brief description about the service"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id="csIsActive"
                    checked={csIsActive}
                    onChange={e => setCsIsActive(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                  />
                  <label htmlFor="csIsActive" className="text-[12px] font-bold text-slate-700 cursor-pointer">
                    Service is Active
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsCreateServiceOpen(false)}
                  className="px-4 py-2 rounded-xl text-[12px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSavingService}
                  className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl text-[12px] font-bold shadow-md shadow-teal-600/20 disabled:opacity-50 transition-all"
                >
                  {isSavingService ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {editingServiceId ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

/* ================================================= */
/* COMPONENTS                                        */
/* ================================================= */

function MiniCard({ icon, label, value, green, suffix, readOnly, onChange }: any) {
  return (
    <div className={`rounded-xl border bg-white p-2.5 shadow-sm ${green ? "border-teal-300 bg-teal-50/40" : "border-slate-200"}`}>
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className={`${green ? "text-teal-600" : "text-blue-600"}`}>{icon}</span>
        <span className="truncate text-[8px] font-bold text-slate-600">{label}</span>
      </div>
      <div className="relative">
        <input
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          readOnly={readOnly}
          className={`h-9 w-full rounded-lg border px-2.5 text-[8px] font-semibold outline-none ${
              green ? "border-teal-300 bg-white text-teal-700" : "border-slate-200 bg-slate-50 text-slate-800"
          }`}
        />
        {suffix && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-500">{suffix}</span>
        )}
      </div>
    </div>
  );
}

function GuestFormModal({ onSave, onClose, initialData }: { onSave: (guest: any) => void, onClose: () => void, initialData?: any }) {
  const [name, setName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [age, setAge] = useState(initialData?.age || '');
  const [gender, setGender] = useState(initialData?.gender || 'Male');
  const [isLead, setIsLead] = useState(initialData?.isLead || false);
  const [activeUpload, setActiveUpload] = useState<'id' | 'photo' | null>(null);
  
  const [idUrls, setIdUrls] = useState<string[]>(initialData?.idUrls || (initialData?.idUrl ? [initialData.idUrl] : []));
  const [idNumber, setIdNumber] = useState<string>(initialData?.idNumber || '');
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialData?.photoUrl || null);

const handleMediaUpload = async (docs: any[]) => {
    if (activeUpload === 'id') {
      const urls = docs.map(d => d.dataUrl).filter(Boolean);
      setIdUrls(prev => [...prev, ...urls]);
      if (docs.length > 0 && docs[0].idNumber && !idNumber) setIdNumber(docs[0].idNumber);
    } else if (activeUpload === 'photo') {
      if (docs.length > 0) setPhotoUrl(docs[0].dataUrl);
    }
    setActiveUpload(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200 relative">
         <div className="flex items-center justify-between bg-indigo-600 px-5 py-4 text-white shrink-0">
            <h3 className="font-bold text-sm flex items-center gap-2"><Users size={18}/> {initialData ? 'Edit Guest' : 'Add New Guest'}</h3>
            <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-md transition-colors"><X size={18} /></button>
         </div>
         <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            <div>
               <label className="mb-1.5 block text-[11px] font-bold text-slate-600">Full Name *</label>
               <input value={name} onChange={e=>setName(e.target.value)} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Enter guest's full name" autoFocus />
            </div>
            <div>
               <label className="mb-1.5 block text-[11px] font-bold text-slate-600">Mobile Number *</label>
               <input value={phone} onChange={e=>setPhone(e.target.value)} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Enter mobile number" />
            </div>
            <div className="flex gap-4">
               <div className="flex-1">
                  <label className="mb-1.5 block text-[11px] font-bold text-slate-600">Age</label>
                  <input type="number" value={age} onChange={e=>setAge(e.target.value)} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Age" />
               </div>
               <div className="flex-1">
                  <label className="mb-1.5 block text-[11px] font-bold text-slate-600">Gender</label>
                  <select value={gender} onChange={e=>setGender(e.target.value)} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100">
                     <option>Male</option>
                     <option>Female</option>
                     <option>Other</option>
                  </select>
               </div>
            </div>
            <label className="mt-4 flex cursor-pointer items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3 transition-colors hover:bg-indigo-50">
               <input type="checkbox" checked={isLead} onChange={e=>setIsLead(e.target.checked)} className="h-4 w-4 accent-indigo-600" />
               <span className="text-[12px] font-bold text-indigo-900">Set as Lead Guest (Primary Contact)</span>
            </label>

            <div className="mt-4 border-t border-slate-200 pt-4">
               <h4 className="mb-3 text-[12px] font-bold text-slate-700">Verification & Documents</h4>
               
               <div className="mb-4">
                  <label className="mb-1.5 block text-[11px] font-bold text-slate-600">ID Number (Optional)</label>
                  <input value={idNumber} onChange={e=>setIdNumber(e.target.value)} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="e.g. Aadhar / PAN / Passport Number" />
               </div>

               <div className="flex gap-3 h-32 overflow-x-auto pb-2">
                  {idUrls.map((url, idx) => (
                      <div key={idx} className="relative h-full w-24 shrink-0 rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
                         <img src={url} alt={`ID ${idx}`} className="absolute inset-0 h-full w-full object-cover" />
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         <button onClick={() => setIdUrls(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:scale-110">
                            <Trash2 size={16} />
                         </button>
                      </div>
                  ))}
                  
                  <button onClick={() => setActiveUpload('id')} className="relative flex-1 min-w-[90px] max-w-[130px] flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors">
                     <Upload size={24} />
                     <span className="text-[11px] font-bold">{idUrls.length > 0 ? 'Add Another' : 'Upload ID'}</span>
                  </button>

                  <button onClick={() => setActiveUpload('photo')} className={`relative flex-1 min-w-[90px] max-w-[130px] flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors overflow-hidden ${photoUrl ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                     {photoUrl ? (
                        <>
                           <img src={photoUrl} alt="Photo" className="absolute inset-0 h-full w-full object-cover" />
                           <div className="absolute top-2 right-2 bg-white rounded-full p-0.5 shadow-md">
                              <CheckCircle2 size={18} className="text-blue-600" />
                           </div>
                           <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold text-center p-2 leading-tight">
                              Click to change
                           </div>
                        </>
                     ) : (
                        <>
                           <Camera size={24} />
                           <span className="text-[11px] font-bold">Take Photo</span>
                        </>
                     )}
                  </button>
               </div>
            </div>
         </div>
         <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 p-4 shrink-0">
            <button onClick={onClose} className="rounded-lg px-5 py-2.5 text-[12px] font-bold text-slate-600 hover:bg-slate-200">Cancel</button>
            <button 
               onClick={() => {
                  if(!name) return alert('Name is required');
                  onSave({ 
                     id: initialData?.id || ('g' + Date.now()), 
                     name, phone, age, gender, isLead, 
                     idUrls, idNumber, photoUrl,
                     isVerified: initialData?.isVerified || false,
                     documentType: initialData?.documentType || (idUrls.length > 0 ? "ID Document" : undefined)
                  });
               }} 
               className="rounded-lg bg-indigo-600 px-6 py-2.5 text-[12px] font-bold text-white shadow-md hover:bg-indigo-700"
            >
               {initialData ? 'Save Changes' : 'Save & Add Guest'}
            </button>
         </div>

         {activeUpload && (
            <div className="absolute inset-0 z-[110]">
               <MediaUploadModal
                  title={activeUpload === 'id' ? "Upload ID Document" : "Guest Photo"}
                  defaultMode={activeUpload === 'id' ? 'upload' : 'camera'}
                  showIdNumberField={activeUpload === 'id'}
                  allowMultiple={activeUpload === 'id'}
                  onCapture={handleMediaUpload}
                  onCancel={() => setActiveUpload(null)}
               />
            </div>
         )}
      </div>
    </div>
  )
}

function ChargeCard({ title, value, icon, onChange, mode, onModeChange }: any) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-blue-600">{icon}</span>
        <span className="text-[8px] font-bold text-slate-600">{title}</span>
      </div>
      <div className="flex items-center gap-4">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-36 rounded-lg border border-slate-200 bg-slate-50 px-2 text-[8px] font-semibold outline-none focus:border-blue-500"
        />
        <label className="flex items-center gap-1.5 text-[8px] text-slate-600 cursor-pointer">
          <input type="radio" checked={mode === 'FIXED'} onChange={() => onModeChange('FIXED')} name={title} className="accent-teal-600"/>
          Fixed
        </label>
        <label className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[8px] font-semibold cursor-pointer ${mode === 'DAILY' ? 'bg-teal-50 text-teal-700' : 'text-slate-600'}`}>
          <input type="radio" checked={mode === 'DAILY'} onChange={() => onModeChange('DAILY')} name={title} className="accent-teal-600"/>
          Daily Wise /Day
        </label>
      </div>
    </div>
  );
}

function GuestRow({ guest, index, updateGuest, removeGuest, guestsLength, onEditGuest, roomNo }: any) {
  const hasDocument = (guest.idUrls && guest.idUrls.length > 0) || guest.idUrl || guest.idNumber || (guest.idDocuments && guest.idDocuments.length > 0);
  return (
    <tr className="border-b last:border-0 hover:bg-slate-50 transition-colors">
      <td className="px-2 py-1.5">
        <div className="flex items-center gap-2">
          <input
            type="radio"
            name="lead"
            checked={guest.isLead}
            onChange={() => updateGuest(guest.id, 'isLead', true)}
            className="accent-teal-600"
          />
          <span className={`rounded-full px-2.5 py-1 text-[8px] font-bold ${guest.isLead ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-600"}`}>
            {guest.isLead ? `Guest ${index + 1} (Lead)` : `Guest ${index + 1}`}
          </span>
        </div>
      </td>
      <td className="px-2 py-1.5">
        <input
          value={guest.name || ''}
          onChange={(e) => updateGuest(guest.id, 'name', e.target.value)}
          placeholder="Full name"
          className="h-7 w-full rounded-lg border border-slate-200 px-2.5 text-[8px] font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          value={guest.phone || ''}
          onChange={(e) => updateGuest(guest.id, 'phone', e.target.value)}
          placeholder="Mobile number"
          className="h-7 w-full rounded-lg border border-slate-200 px-2.5 text-[8px] font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          type="number"
          value={guest.age || ''}
          onChange={(e) => updateGuest(guest.id, 'age', e.target.value)}
          placeholder="Age"
          className="h-7 w-14 rounded-lg border border-slate-200 px-2 text-center text-[8px] font-medium outline-none focus:border-blue-500"
        />
      </td>
      <td className="px-2 py-1.5">
        <select value={guest.gender || 'Male'} onChange={(e) => updateGuest(guest.id, 'gender', e.target.value)} className="h-7 w-full rounded-lg border border-slate-200 px-2 text-[8px] font-medium outline-none focus:border-blue-500 appearance-none">
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </td>
      <td className="px-2 py-1.5">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1.5">
            <button onClick={() => onEditGuest(guest.id)} className={`flex h-8 items-center gap-1 rounded-lg px-2.5 text-[8px] font-semibold transition-colors ${hasDocument ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {hasDocument ? <CheckCircle2 size={13}/> : <Upload size={13} />} ID
            </button>
            <button onClick={() => onEditGuest(guest.id)} className={`flex h-8 items-center gap-1 rounded-lg px-2.5 text-[8px] font-semibold transition-colors ${guest.photoUrl ? 'bg-blue-100 text-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
              {guest.photoUrl ? <CheckCircle2 size={13}/> : <Camera size={13} />} CAM
            </button>
            {guestsLength > 1 && (
               <button onClick={() => removeGuest(guest.id)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                  <Trash2 size={14} />
               </button>
            )}
          </div>
          {guest.idNumber && (
            <div className="text-[9px] font-bold text-slate-500 ml-1">
               ID: <span className="text-slate-700 uppercase">{guest.idNumber}</span>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

function ServiceButton({ icon, text, active }: any) {
  return (
    <button className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[8px] font-semibold transition ${active ? "border-teal-600 bg-teal-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
      {icon} {text}
    </button>
  );
}

function PriceRow({ label, value, green, bold, muted }: any) {
  return (
    <div className={`flex items-center justify-between ${bold ? "text-[8px] font-bold text-slate-800" : "text-[8px] font-medium"} ${green ? "text-emerald-600" : muted ? "text-slate-500" : "text-slate-600"}`}>
      <span>{label}</span>
      <span className={bold || green ? "font-bold" : "font-semibold"}>{value}</span>
    </div>
  );
}
