import React from 'react';
import { X, User, Calendar, CreditCard, Clock, FileText } from 'lucide-react';
import dayjs from 'dayjs';

interface GuestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: any;
}

export function GuestDetailsModal({ isOpen, onClose, room }: GuestDetailsModalProps) {
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
        gender: 'Not provided'
     }];
  }

  const roomRate = guestInfo.roomRate ? guestInfo.roomRate / 100 : room.price / 100;
  const amountPaid = (guestInfo.amountPaid || 0) / 100;
  const totalAmount = (guestInfo.totalAmount || 0) / 100;
  const balance = (guestInfo.balance || 0) / 100;

  return (
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
               {allGuests.map((g, idx) => (
                 <div key={idx} className={`p-4 rounded-xl border ${g.isLead ? 'bg-indigo-50/50 border-indigo-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex justify-between items-start mb-2">
                       <div className={`text-sm font-bold ${g.isLead ? 'text-indigo-900' : 'text-gray-900'}`}>{g.name || 'Not provided'}</div>
                       {g.isLead && <div className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 uppercase tracking-wider">Lead Guest</div>}
                    </div>
                    <div className="space-y-1.5 mt-3">
                       <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Mobile:</span>
                          <span className="font-semibold text-gray-900">{g.phone || 'Not provided'}</span>
                       </div>
                       <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Age / Gender:</span>
                          <span className="font-semibold text-gray-900">{g.age || 'N/A'} / {g.gender || 'N/A'}</span>
                       </div>
                       <div className="flex justify-between text-xs">
                          <span className="text-gray-500">ID Status:</span>
                          <span className="font-semibold text-gray-900">
                             {g.idProof || g.idNumber || g.idUrl || (g.idDocuments && g.idDocuments.length > 0) ? 'Provided' : 'Not provided'}
                          </span>
                       </div>
                    </div>
                 </div>
               ))}
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
  );
}
