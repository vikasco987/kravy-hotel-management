import React, { useState } from 'react';
import { X, User, Calendar, CreditCard, Clock, FileText, Eye, Camera } from 'lucide-react';
import dayjs from 'dayjs';
import { GuestMediaPreviewModal, PreviewItem } from './GuestMediaPreviewModal';

interface GuestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: any;
}

export function GuestDetailsModal({ isOpen, onClose, room }: GuestDetailsModalProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  if (!isOpen || !room || !room.guestInfo) return null;
  
  const guestInfo = room.guestInfo;
  
  // Parse multiple guests if available
  let allGuests: any[] = [];
  if (guestInfo.guestsData) {
    try {
       // if it's already an object/array, use it, else parse
       allGuests = typeof guestInfo.guestsData === 'string' ? JSON.parse(guestInfo.guestsData) : guestInfo.guestsData;
       if (!Array.isArray(allGuests)) allGuests = [];
    } catch (e) {
       console.error("Failed to parse guestsData", e);
    }
  }
  
  // Fallback to lead guest if no array
  if (allGuests.length === 0) {
     allGuests = [{
        name: guestInfo.name,
        phone: guestInfo.phone,
        idProof: guestInfo.idProof,
        isLead: true,
        age: 'Not provided',
        gender: 'Not provided',
        photoUrl: guestInfo.guestPhotoUrl,
        documents: guestInfo.documents,
     }];
  } else {
     // Enrich lead guest from root guestInfo if fields are missing in snapshot
     allGuests = allGuests.map((g, idx) => {
       if (idx === 0 || g.isLead) {
         return {
           ...g,
           photoUrl: g.photoUrl || guestInfo.guestPhotoUrl || null,
           documents: g.documents || guestInfo.documents || [],
         };
       }
       return g;
     });
  }

  const handleOpenPreview = (items: PreviewItem[], startIdx = 0) => {
    if (items.length === 0) return;
    setPreviewItems(items);
    setPreviewIndex(startIdx);
    setPreviewOpen(true);
  };

  const getGuestPreviewItems = (g: any): PreviewItem[] => {
    const items: PreviewItem[] = [];

    // Guest Photo
    if (g.photoUrl) {
      items.push({
        url: g.photoUrl,
        title: `${g.name || 'Guest'} - Photo`,
        type: 'photo',
        subtitle: g.isLead ? 'Lead Guest Photo' : 'Guest Photo',
      });
    }

    // Documents from DB documents relation
    if (Array.isArray(g.documents) && g.documents.length > 0) {
      g.documents.forEach((doc: any, dIdx: number) => {
        if (doc.fileReference) {
          items.push({
            url: doc.fileReference,
            title: `${g.name || 'Guest'} - ID Document ${dIdx + 1}`,
            type: 'id',
            subtitle: doc.documentType || 'Identity Proof',
            documentNumber: doc.documentNumber,
            status: doc.verificationStatus,
          });
        }
      });
    }

    // Documents from snapshot idDocuments
    if (Array.isArray(g.idDocuments) && g.idDocuments.length > 0) {
      g.idDocuments.forEach((doc: any, dIdx: number) => {
        const docUrl = typeof doc === 'string' ? doc : doc.url;
        if (docUrl && !items.some(i => i.url === docUrl)) {
          items.push({
            url: docUrl,
            title: `${g.name || 'Guest'} - ID Document ${dIdx + 1}`,
            type: 'id',
            subtitle: 'Identity Proof',
            documentNumber: typeof doc === 'object' ? doc.number : null,
          });
        }
      });
    }

    // Documents from snapshot idUrls
    if (Array.isArray(g.idUrls) && g.idUrls.length > 0) {
      g.idUrls.forEach((url: string, uIdx: number) => {
        if (url && !items.some(i => i.url === url)) {
          items.push({
            url: url,
            title: `${g.name || 'Guest'} - ID Document ${uIdx + 1}`,
            type: 'id',
            subtitle: 'Identity Proof',
            documentNumber: g.idNumber || null,
          });
        }
      });
    }

    // Single idUrl
    if (g.idUrl && !items.some(i => i.url === g.idUrl)) {
      items.push({
        url: g.idUrl,
        title: `${g.name || 'Guest'} - ID Document`,
        type: 'id',
        subtitle: 'Identity Proof',
        documentNumber: g.idNumber || null,
      });
    }

    return items;
  };

  const roomRate = guestInfo.roomRate ? guestInfo.roomRate / 100 : room.price / 100;
  const amountPaid = (guestInfo.amountPaid || 0) / 100;
  const totalAmount = (guestInfo.totalAmount || 0) / 100;
  const balance = (guestInfo.balance || 0) / 100;

  return (
    <>
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl border border-gray-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Complete Stay Details</h2>
            <div className="text-xs text-gray-500 font-medium mt-0.5">Room {room.roomNumber || room.number || 'N/A'} • {allGuests.length} Guest(s)</div>
          </div>
          <button onClick={onClose} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8 flex-1">
          
          {/* Guests Section */}
          <section>
             <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <User size={14} /> Guest Information
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {allGuests.map((g, idx) => {
                 const previewList = getGuestPreviewItems(g);
                 const idDocs = previewList.filter(item => item.type === 'id');
                 const photoItem = previewList.find(item => item.type === 'photo');

                 return (
                 <div key={idx} className={`p-4 rounded-xl border flex flex-col justify-between ${g.isLead ? 'bg-indigo-50/50 border-indigo-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div>
                      <div className="flex items-start gap-3 mb-2.5">
                        {/* Guest Photo Avatar */}
                        {photoItem ? (
                          <div
                            onClick={() => handleOpenPreview(previewList, previewList.indexOf(photoItem))}
                            className="relative group cursor-pointer w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-indigo-200 shadow-sm"
                            title="Click to preview photo"
                          >
                            <img
                              src={photoItem.url}
                              alt={g.name || 'Guest Photo'}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <Eye size={14} className="text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${g.isLead ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-gray-200 text-gray-600 border-gray-300'}`}>
                            <User size={20} />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <div className={`text-sm font-bold truncate ${g.isLead ? 'text-indigo-900' : 'text-gray-900'}`}>{g.name || 'Not provided'}</div>
                            {g.isLead && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 uppercase tracking-wider shrink-0">Lead</span>}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{g.phone || 'No phone provided'}</p>
                        </div>
                      </div>

                      <div className="space-y-1.5 mt-3 pt-2.5 border-t border-gray-200/50">
                         <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Age / Gender:</span>
                            <span className="font-semibold text-gray-900">{g.age || 'N/A'} / {g.gender || 'N/A'}</span>
                         </div>
                         <div className="flex justify-between text-xs items-center">
                            <span className="text-gray-500">ID Status:</span>
                            <span className="font-semibold text-gray-900">
                               {idDocs.length > 0 || g.idProof || g.idNumber ? (
                                 <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                   Provided ({idDocs.length || 1})
                                 </span>
                               ) : (
                                 <span className="text-gray-400">Not provided</span>
                               )}
                            </span>
                         </div>
                      </div>
                    </div>

                    {/* Previews / Action buttons */}
                    <div className="mt-3.5 pt-2.5 border-t border-gray-200/50 flex flex-wrap gap-2">
                       {idDocs.length > 0 ? (
                         <button
                           type="button"
                           onClick={() => handleOpenPreview(previewList, previewList.findIndex(i => i.type === 'id'))}
                           className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
                         >
                           <FileText size={13} />
                           <span>Preview ID ({idDocs.length})</span>
                         </button>
                       ) : (
                         <span className="text-[11px] text-gray-400 italic">No ID uploaded</span>
                       )}

                       {photoItem && (
                         <button
                           type="button"
                           onClick={() => handleOpenPreview(previewList, previewList.indexOf(photoItem))}
                           className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition"
                         >
                           <Camera size={13} />
                           <span>Photo</span>
                         </button>
                       )}
                    </div>
                 </div>
               );})}
             </div>
          </section>

          {/* Stay Info */}
          <section>
             <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Calendar size={14} /> Stay Schedule
             </h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                   <div className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Clock size={12} /> Check-in Time</div>
                   <div className="text-sm font-bold text-gray-900">
                     {guestInfo.checkInDate ? dayjs(guestInfo.checkInDate).format('DD MMM YYYY, hh:mm A') : 'Not available'}
                   </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                   <div className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Clock size={12} /> Expected Check-out</div>
                   <div className="text-sm font-bold text-gray-900">
                     {guestInfo.expectedCheckOutDate ? dayjs(guestInfo.expectedCheckOutDate).format('DD MMM YYYY, hh:mm A') : 'Not available'}
                   </div>
                </div>
             </div>
          </section>

          {/* Financials */}
          <section>
             <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CreditCard size={14} /> Financial Summary
             </h3>
             <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="space-y-3">
                   <div className="flex justify-between text-sm">
                      <span className="text-gray-600 font-medium">Room Rate (Final Rent)</span>
                      <span className="font-bold text-gray-900">₹{roomRate}/night</span>
                   </div>
                   <div className="flex justify-between text-sm pt-3 border-t border-gray-100">
                      <span className="text-gray-600 font-medium">Grand Total</span>
                      <span className="font-bold text-gray-900">₹{totalAmount}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                      <span className="text-emerald-600 font-medium">Amount Paid</span>
                      <span className="font-bold text-emerald-600">₹{amountPaid}</span>
                   </div>
                   <div className="flex justify-between text-sm pt-3 border-t border-gray-100 bg-gray-50 -mx-5 px-5 pb-1">
                      <span className="text-gray-800 font-bold mt-2">Balance Due</span>
                      <span className={`font-black text-lg mt-1 ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                         ₹{balance}
                      </span>
                   </div>
                </div>
             </div>
          </section>

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
