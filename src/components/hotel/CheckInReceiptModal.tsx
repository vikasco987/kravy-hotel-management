'use client';

import React, { useRef, useState, useEffect } from 'react';
import { X, Printer, FileText, Send, Share2 } from 'lucide-react';

interface ReceiptRoomData {
  roomNo: string;
  roomType: string;
  guestName: string; // Lead guest name
  guestPhoto?: string;
  guestMobile?: string;
  guestIdNumber?: string;
  totalGuests: number;
  totalKids: number;
  rent: number;
  discount: number;
  finalRent: number;
  extra: number;
  gst: number;
  netTotal: number;
  nights: number;
}

interface CheckInReceiptModalProps {
  onClose: () => void;
  bookingData: {
    receiptNumber: string;
    date: string;
    checkInDate: string;
    checkOutDate: string;
    rooms: ReceiptRoomData[];
    totalRoomRent: number;
    totalExtraCharges: number;
    totalGst: number;
    subtotal: number; // without advance
    grandTotal: number;
    amountPaid: number;
    balanceDue: number;
    paymentMode: string;
    status: string;
    hotelName?: string;
    hotelAddress?: string;
    hotelGstin?: string;
    hotelPhone?: string;
    hotelEmail?: string;
  };
}

export default function CheckInReceiptModal({ onClose, bookingData }: CheckInReceiptModalProps) {
  const [printMode, setPrintMode] = useState<'80mm' | '58mm' | 'A4' | null>(null);
  
  // Format currency
  const formatAmt = (amt: number) => amt.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });
  const d = bookingData;
  const leadGuest = d.rooms[0] || {} as ReceiptRoomData;

  const handlePrint = (mode: '80mm' | '58mm' | 'A4') => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
      setPrintMode(null);
    }, 300); // Give React time to render the style block
  };

  const getDynamicCss = () => {
    if (!printMode) return '';
    let pageSize = 'A4 portrait';
    let containerWidth = '100%';
    let isThermal = false;

    if (printMode === '80mm') {
      pageSize = '80mm auto';
      containerWidth = '74mm'; // Safe printable area
      isThermal = true;
    } else if (printMode === '58mm') {
      pageSize = '58mm auto';
      containerWidth = '48mm';
      isThermal = true;
    }

    return `
      @media print {
        @page { 
          margin: 0 !important; 
          size: ${pageSize} !important;
        }
        body { 
          margin: 0 !important; 
          padding: 0 !important; 
          background: white !important;
        }
        /* Hide everything by default during print */
        body > *:not(.receipt-print-wrapper) {
          display: none !important;
        }
        .receipt-print-wrapper {
          display: block !important;
          width: ${containerWidth} !important;
          margin: 0 auto !important;
          position: absolute;
          left: 0;
          top: 0;
          background: white !important;
        }
        .no-print {
          display: none !important;
        }
        ${isThermal ? `
          .thermal-safe {
             padding-bottom: 80px !important; /* Safety for cutter */
             font-size: 11px !important;
          }
          .thermal-table-compact th, .thermal-table-compact td {
             padding: 2px !important;
             font-size: 10px !important;
          }
          /* Hide photos and complex layouts on thermal */
          .thermal-hide { display: none !important; }
          .thermal-stack { flex-direction: column !important; align-items: flex-start !important; }
        ` : `
          .receipt-print-wrapper {
            padding: 15mm !important;
          }
        `}
      }
    `;
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm no-print">
      
      {/* Dynamic Print CSS Injection */}
      <style dangerouslySetInnerHTML={{ __html: getDynamicCss() }} />

      <div className="bg-gray-100 rounded-xl shadow-2xl overflow-hidden w-full max-w-5xl flex flex-col h-[90vh]">
        
        {/* Header - No Print */}
        <div className="bg-[#0e2a6d] text-white p-3 flex justify-between items-center shrink-0">
          <h3 className="font-bold flex items-center gap-2 text-sm">
            <FileText size={16} /> Guest Check-In Registration Card & Official Receipt
          </h3>
          <button onClick={onClose} className="text-gray-300 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Receipt Area */}
        <div className="flex-1 overflow-auto p-6 bg-gray-100 relative">
          
          {/* This wrapper becomes the print container */}
          <div className="receipt-print-wrapper bg-white shadow-md mx-auto max-w-4xl border border-gray-200 p-8 rounded-sm thermal-safe text-gray-900">
            
            {/* 1. Header Area */}
            <div className="flex justify-between items-start border-b border-gray-200 pb-4 mb-6 thermal-stack">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0e2a6d] rounded flex items-center justify-center text-white font-bold text-xl thermal-hide">
                  {d.hotelName?.[0] || 'G'}
                </div>
                <div>
                  <h1 className="text-2xl font-black text-[#0e2a6d] uppercase tracking-wide m-0">{d.hotelName || 'GRAND PLAZA'}</h1>
                  <p className="text-xs text-gray-600 mt-1 max-w-xs leading-tight">{d.hotelAddress || 'Keralala Main Road, Civil Lines, Near Railway Station'}</p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    GSTIN: {d.hotelGstin || '4567876543456'} | Phone: {d.hotelPhone || '8606093110'} | Email: {d.hotelEmail || 'info@raintechpos.com'}
                  </p>
                </div>
              </div>
              <div className="text-right border border-blue-200 bg-blue-50/50 rounded-lg p-3 mt-4 md:mt-0">
                <div className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-1">Official Receipt</div>
                <div className="text-lg font-black text-gray-900 leading-none">{d.receiptNumber}</div>
                <div className="text-[10px] text-gray-500 mt-2">{d.date}</div>
              </div>
            </div>

            {/* 2. Middle Box (Guest & Stay Dates) */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 border border-gray-200 rounded-xl p-4 bg-gray-50/50 thermal-stack thermal-hide">
              
              {/* Guest Profile Box */}
              <div className="flex-1 flex gap-4">
                <div className="w-20 h-24 bg-gray-200 rounded-md overflow-hidden shrink-0 border border-gray-300">
                  {leadGuest.guestPhoto ? (
                    <img src={leadGuest.guestPhoto} alt="Guest" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center p-2">No Photo</div>
                  )}
                </div>
                <div className="flex flex-col justify-center">
                  <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{leadGuest.guestName || 'GUEST NAME'}</h2>
                  <div className="text-xs text-gray-600 mt-2 space-y-1">
                    <div className="flex items-center gap-2"><span className="opacity-75">📞 Mobile:</span> {leadGuest.guestMobile || '---'}</div>
                    <div className="flex items-center gap-2"><span className="opacity-75">🪪 ID Proof:</span> {leadGuest.guestIdNumber ? `Verified (${leadGuest.guestIdNumber})` : 'Aadhaar Card (Verified)'}</div>
                    <div className="flex items-center gap-2 font-bold text-blue-800 mt-1">
                      👥 Total Guests: {d.rooms.reduce((acc, r) => acc + r.totalGuests, 0)} Adults, {d.rooms.reduce((acc, r) => acc + r.totalKids, 0)} Kid
                    </div>
                  </div>
                </div>
              </div>

              {/* Stay Dates Box */}
              <div className="w-full md:w-auto border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-6">
                <div className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1 mb-2 tracking-widest">
                  <FileText size={10} /> Stay Dates & Duration
                </div>
                <div className="space-y-1.5 text-xs">
                  {d.rooms.map((room, i) => (
                    <div key={i} className="flex items-center justify-between gap-4">
                      <span className="font-bold text-gray-900">Room {room.roomNo}:</span>
                      <span className="text-gray-600">{d.checkInDate} — {d.checkOutDate}</span>
                      <span className="bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded text-[10px]">{room.nights} Night{room.nights > 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Thermal Alternative for Guest Info (visible only on thermal) */}
            <div className="hidden print:block thermal-show mb-4 border-b border-black pb-2 text-sm">
              <div><b>Guest:</b> {leadGuest.guestName} ({leadGuest.guestMobile})</div>
              <div><b>Check-in:</b> {d.checkInDate} <b>Out:</b> {d.checkOutDate}</div>
            </div>

            {/* 3. Table Area */}
            <div className="mb-6">
              <h3 className="text-sm font-black text-[#0e2a6d] uppercase tracking-wide mb-2 thermal-hide">Room Allocation & Billing Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse thermal-table-compact">
                  <thead className="border-y border-gray-300 bg-gray-50 text-[9px] uppercase tracking-wider text-gray-600">
                    <tr>
                      <th className="py-2 px-2 font-bold">Room</th>
                      <th className="py-2 px-2 font-bold">Guest Name</th>
                      <th className="py-2 px-2 font-bold thermal-hide">Room Type</th>
                      <th className="py-2 px-2 font-bold text-right">Rent</th>
                      <th className="py-2 px-2 font-bold text-right">Discount</th>
                      <th className="py-2 px-2 font-bold text-right">Final Rent</th>
                      <th className="py-2 px-2 font-bold text-right thermal-hide">Room Total</th>
                      <th className="py-2 px-2 font-bold text-right">Extra</th>
                      <th className="py-2 px-2 font-bold text-right thermal-hide">GST Tax</th>
                      <th className="py-2 px-2 font-bold text-right text-gray-900">Net Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 border-b border-gray-300">
                    {d.rooms.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="py-2 px-2 font-bold text-[#0e2a6d]">{r.roomNo}</td>
                        <td className="py-2 px-2 font-bold text-gray-900 uppercase">{r.guestName}</td>
                        <td className="py-2 px-2 text-gray-500 thermal-hide">{r.roomType}</td>
                        <td className="py-2 px-2 text-right">{formatAmt(r.rent)}</td>
                        <td className="py-2 px-2 text-right text-yellow-600">{formatAmt(r.discount)}</td>
                        <td className="py-2 px-2 text-right font-bold text-green-700">{formatAmt(r.finalRent)}</td>
                        <td className="py-2 px-2 text-right thermal-hide">{formatAmt(r.finalRent * r.nights)}</td>
                        <td className="py-2 px-2 text-right text-orange-600">{formatAmt(r.extra)}</td>
                        <td className="py-2 px-2 text-right text-gray-500 thermal-hide">{formatAmt(r.gst)}</td>
                        <td className="py-2 px-2 text-right font-black text-[#0e2a6d] bg-blue-50/30">{formatAmt(r.netTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Footer Summary Box */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 thermal-stack">
              
              {/* Payment Info */}
              <div className="w-full md:w-auto text-xs space-y-1 border-t border-gray-200 pt-4 md:border-0 md:pt-0">
                <div><b>Payment Mode:</b> <span className="uppercase">{d.paymentMode}</span></div>
                <div><b>Status:</b> <span className={`font-bold uppercase ${d.status === 'CONFIRMED & ALLOCATED' ? 'text-[#00875a]' : 'text-orange-600'}`}>{d.status}</span></div>
              </div>

              {/* Totals */}
              <div className="w-full md:w-80 border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-sm thermal-stack">
                <div className="space-y-1.5 text-xs border-b border-gray-200 pb-3 mb-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Total Room Rent:</span>
                    <span>{formatAmt(d.totalRoomRent)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Extra Charges:</span>
                    <span>{formatAmt(d.totalExtraCharges)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>GST Tax (12%):</span>
                    <span>{formatAmt(d.totalGst)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[#0e2a6d]">
                    <span>Current Rooms Subtotal:</span>
                    <span>{formatAmt(d.subtotal)}</span>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between font-black text-gray-900 text-base">
                    <span>Grand Total:</span>
                    <span>{formatAmt(d.grandTotal)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[#00875a]">
                    <span>Amount Paid:</span>
                    <span>{formatAmt(d.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-red-600">
                    <span className="text-xs pt-1">Balance Due:</span>
                    <span className="text-base">{formatAmt(d.balanceDue)}</span>
                  </div>
                </div>
              </div>

            </div>
            
            {/* End of receipt wrapper */}
          </div>
        </div>

        {/* Footer Actions - No Print */}
        <div className="bg-white border-t border-gray-200 p-4 flex flex-wrap justify-end gap-3 shrink-0">
          <button onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2.5 rounded shadow-sm text-sm font-bold flex items-center gap-2">
            <X size={16} /> Close
          </button>
          <button className="bg-[#25D366] hover:bg-[#128C7E] text-white px-5 py-2.5 rounded shadow-sm text-sm font-bold flex items-center gap-2">
            <Share2 size={16} /> WhatsApp Welcome
          </button>
          <button onClick={() => handlePrint('80mm')} className="bg-[#00875a] hover:bg-[#006f4a] text-white px-5 py-2.5 rounded shadow-sm text-sm font-bold flex items-center gap-2">
            <Printer size={16} /> 80mm POS Thermal Print
          </button>
          <button onClick={() => handlePrint('A4')} className="bg-[#0e2a6d] hover:bg-[#091a42] text-white px-5 py-2.5 rounded shadow-sm text-sm font-bold flex items-center gap-2">
            <FileText size={16} /> Print A4 Invoice
          </button>
        </div>

      </div>
    </div>
  );
}
