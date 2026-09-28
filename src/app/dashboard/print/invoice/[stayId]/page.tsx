'use client';

import React, { useState, useEffect, use, Suspense } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function InvoiceContent({ stayId }: { stayId: string }) {
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  
  const initialFormat = (searchParams.get('format')?.toUpperCase() as 'A4' | '80MM' | '58MM') || 'A4';
  const [format, setFormat] = useState<'A4' | '80MM' | '58MM'>(initialFormat);

  useEffect(() => {
    fetch(`/api/hotel/invoice-data/${stayId}`)
      .then(res => res.json())
      .then(d => {
        if (d.success) setData(d.data);
      })
      .catch(console.error);
  }, [stayId]);

  if (!data) return <div className="p-8">Loading Invoice Data...</div>;

  const { stay, hotel, guest, leadStayRoom, invoice, businessProfile } = data;

  const expectedOut = new Date(leadStayRoom.checkInDate);
  expectedOut.setDate(expectedOut.getDate() + leadStayRoom.nights);
  const displayCheckOutDate = leadStayRoom.checkOutDate ? new Date(leadStayRoom.checkOutDate) : expectedOut;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-gray-100 min-h-screen p-8 print:p-0 print:bg-white flex flex-col items-center">
      
      {/* Controls (Hidden in Print) */}
      <div className="mb-6 flex gap-4 print:hidden bg-white p-4 rounded-lg shadow w-full max-w-4xl justify-between items-center">
         <div className="flex items-center gap-4">
            <button onClick={() => { if (window.history.length > 1 && document.referrer) { window.history.back(); } else { window.close(); } }} className="text-gray-500 hover:text-black hover:bg-gray-100 p-2 rounded-full transition">
               <ArrowLeft size={20} />
            </button>
            <div>
               <h2 className="font-bold">Invoice Print Settings</h2>
            <p className="text-xs text-gray-500">Select format before printing</p>
         </div>
         </div>
         <div className="flex gap-2 items-center">
            <select value={format} onChange={e => setFormat(e.target.value as any)} className="border p-2 rounded text-sm font-bold">
               <option value="A4">A4 / Letter</option>
               <option value="80MM">3 Inch (80mm) Thermal Receipt</option>
               <option value="58MM">2 Inch (58mm) Thermal Receipt</option>
            </select>
            <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-blue-700">
               <Printer size={16}/> Print Invoice
            </button>
         </div>
      </div>

      {/* -------------------- A4 FORMAT -------------------- */}
      {format === 'A4' && (
        <div className="bg-white text-black w-full max-w-4xl p-12 shadow-xl print:shadow-none print:w-full print:max-w-none print:p-8">
           
           <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
              <div>
                 <h1 className="text-3xl font-black uppercase tracking-wider">
                    {businessProfile?.businessName || hotel.name}
                 </h1>
                 <p className="text-sm mt-1">{businessProfile?.businessAddress || hotel.address || 'Hotel Address'}</p>
                 <p className="text-sm">{[businessProfile?.district, businessProfile?.state, businessProfile?.pinCode].filter(Boolean).join(', ')}</p>
                 {(businessProfile?.contactPersonPhone || businessProfile?.businessEmail) && (
                    <p className="text-sm">Contact: {businessProfile?.contactPersonPhone} {businessProfile?.businessEmail}</p>
                 )}
                 <p className="text-sm font-bold mt-1">GSTIN: {businessProfile?.gstNumber || hotel.gstin || 'N/A'}</p>
              </div>
              <div className="text-right">
                 <h2 className="text-4xl font-black text-gray-300 uppercase tracking-widest">INVOICE</h2>
                 <p className="text-sm font-bold mt-2">Invoice No: {invoice?.invoiceNumber || 'DRAFT'}</p>
                 <p className="text-sm">Date: {new Date().toLocaleDateString()}</p>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-12 mb-8 border-b pb-8">
              <div>
                 <h3 className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-widest">Billed To:</h3>
                 <p className="font-bold text-lg">{guest.name}</p>
                 <p className="text-sm">Phone: {guest.phone}</p>
                 <p className="text-sm">Room No: {leadStayRoom.room.roomNumber}</p>
              </div>
              <div>
                 <h3 className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-widest">Stay Info:</h3>
                 <div className="grid grid-cols-2 gap-y-1 text-sm">
                    <span className="text-gray-600">Check-In:</span>
                    <span className="font-bold text-right">{new Date(leadStayRoom.checkInDate).toLocaleDateString()}</span>
                    <span className="text-gray-600">Check-Out:</span>
                    <span className="font-bold text-right">{displayCheckOutDate.toLocaleDateString()}</span>
                    <span className="text-gray-600">Nights:</span>
                    <span className="font-bold text-right">{leadStayRoom.nights}</span>
                 </div>
              </div>
           </div>

           <table className="w-full text-left border-collapse mb-8">
              <thead className="bg-gray-100 text-xs uppercase font-bold text-gray-600">
                 <tr>
                    <th className="p-3 border border-gray-300">Description</th>
                    <th className="p-3 border border-gray-300 text-center">Qty / Nights</th>
                    <th className="p-3 border border-gray-300 text-right">Amount (₹)</th>
                 </tr>
              </thead>
              <tbody>
                 <tr>
                    <td className="p-3 border border-gray-300">Room Rent (Base)</td>
                    <td className="p-3 border border-gray-300 text-center">{leadStayRoom.nights}</td>
                    <td className="p-3 border border-gray-300 text-right">{(leadStayRoom.grossAmount / 100).toFixed(2)}</td>
                 </tr>
                 {leadStayRoom.discountAmount > 0 && (
                 <tr>
                    <td className="p-3 border border-gray-300 text-green-700">Discount</td>
                    <td className="p-3 border border-gray-300 text-center">-</td>
                    <td className="p-3 border border-gray-300 text-right text-green-700">-{(leadStayRoom.discountAmount / 100).toFixed(2)}</td>
                 </tr>
                 )}
                 {leadStayRoom.extraChargesAmount > 0 && (
                 <tr>
                    <td className="p-3 border border-gray-300">Extra Charges</td>
                    <td className="p-3 border border-gray-300 text-center">1</td>
                    <td className="p-3 border border-gray-300 text-right">{(leadStayRoom.extraChargesAmount / 100).toFixed(2)}</td>
                 </tr>
                 )}
              </tbody>
           </table>

           <div className="flex justify-end mb-8">
              <div className="w-64 space-y-2 text-sm">
                 <div className="flex justify-between">
                    <span className="text-gray-600">Taxable Amount:</span>
                    <span className="font-bold">{(leadStayRoom.taxableAmount / 100).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-gray-600">CGST ({leadStayRoom.taxRate/2/100}%):</span>
                    <span className="font-bold">{(leadStayRoom.cgstAmount / 100).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-gray-600">SGST ({leadStayRoom.taxRate/2/100}%):</span>
                    <span className="font-bold">{(leadStayRoom.sgstAmount / 100).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between border-t-2 border-black pt-2 text-lg font-black mt-2">
                    <span>GRAND TOTAL:</span>
                    <span>₹{(leadStayRoom.finalAmount / 100).toFixed(2)}</span>
                 </div>
              </div>
           </div>

           <div className="border-t border-gray-300 pt-8 mt-16 text-center text-xs text-gray-500">
              <p>Thank you for choosing {businessProfile?.businessName || hotel.name}! We hope you had a pleasant stay.</p>
              <p>This is a computer generated invoice and does not require a signature.</p>
           </div>
        </div>
      )}

      {/* -------------------- 80MM / 58MM THERMAL FORMAT -------------------- */}
      {(format === '80MM' || format === '58MM') && (
        <div className="bg-white p-4 shadow-xl font-mono text-sm leading-tight text-black print:shadow-none" style={{ width: format === '58MM' ? '58mm' : '80mm', minHeight: '100mm', margin: '0 auto' }}>
           
           <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
              <h1 className="text-lg font-black uppercase">{businessProfile?.businessName || hotel.name}</h1>
              {businessProfile?.businessAddress && <p className="text-[10px]">{businessProfile.businessAddress}</p>}
              <p className="text-[10px] uppercase mt-1">Tax Invoice</p>
              <p className="text-[10px]">Inv: {invoice?.invoiceNumber || 'DRAFT'}</p>
           </div>

           <div className="mb-3 text-[11px] border-b border-dashed border-gray-400 pb-3">
              <p>Guest: <span className="font-bold">{guest.name}</span></p>
              <p>Room: <span className="font-bold">{leadStayRoom.room.roomNumber}</span></p>
              <p>Date: {new Date(leadStayRoom.checkInDate).toLocaleDateString()} to {displayCheckOutDate.toLocaleDateString()}</p>
           </div>

           <table className="w-full text-[11px] mb-3">
              <tbody>
                 <tr>
                    <td>Room x{leadStayRoom.nights}</td>
                    <td className="text-right">{(leadStayRoom.grossAmount / 100).toFixed(2)}</td>
                 </tr>
                 {leadStayRoom.discountAmount > 0 && (
                 <tr>
                    <td>Discount</td>
                    <td className="text-right">-{(leadStayRoom.discountAmount / 100).toFixed(2)}</td>
                 </tr>
                 )}
                 {leadStayRoom.extraChargesAmount > 0 && (
                 <tr>
                    <td>Extra</td>
                    <td className="text-right">{(leadStayRoom.extraChargesAmount / 100).toFixed(2)}</td>
                 </tr>
                 )}
              </tbody>
           </table>

           <div className="border-t border-dashed border-gray-400 pt-2 mb-3 text-[11px]">
              <div className="flex justify-between">
                 <span>Taxable</span>
                 <span>{(leadStayRoom.taxableAmount / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                 <span>CGST</span>
                 <span>{(leadStayRoom.cgstAmount / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                 <span>SGST</span>
                 <span>{(leadStayRoom.sgstAmount / 100).toFixed(2)}</span>
              </div>
           </div>

           <div className="border-t-2 border-black pt-2 mb-6 flex justify-between font-black text-sm">
              <span>TOTAL</span>
              <span>₹{(leadStayRoom.finalAmount / 100).toFixed(2)}</span>
           </div>

           <div className="text-center text-[10px] mt-6">
              <p>Thank You</p>
              <p>Visit Again</p>
           </div>
        </div>
      )}

    </div>
  );
}

export default function InvoicePrintPage({ params }: { params: Promise<{ stayId: string }> }) {
  const { stayId } = use(params);
  
  return (
    <Suspense fallback={<div className="p-8">Loading Print Setup...</div>}>
      <InvoiceContent stayId={stayId} />
    </Suspense>
  );
}
