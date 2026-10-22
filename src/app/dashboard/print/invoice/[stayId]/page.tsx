'use client';

import React, { useState, useEffect, use, Suspense } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import {
  getLogoDimensions,
  getSignatureDimensions,
  normalizeLogoSize,
  normalizeLogoAlign,
  normalizeSignatureSize,
} from '@/lib/printBranding';

function InvoiceContent({ stayId }: { stayId: string }) {
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);

  const initialFormat = (searchParams.get('format')?.toUpperCase() as 'A4' | '80MM' | '58MM') || 'A4';
  const [format, setFormat] = useState<'A4' | '80MM' | '58MM'>(initialFormat);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reloadIndex, setReloadIndex] = useState<number>(0);

  useEffect(() => {
    let isCancelled = false;

    fetch(`/api/hotel/invoice-data/${stayId}?format=${format}`)
      .then(async res => {
        let json: any = null;
        try {
          json = await res.json();
        } catch (parseErr) {
          throw new Error('Received unexpected non-JSON response from server.');
        }

        if (isCancelled) return;

        if (!res.ok || !json?.success) {
          setErrorMessage(json?.error || 'Failed to load invoice data. You may lack permission to print invoices/receipts.');
        } else {
          setData(json.data);
          setErrorMessage(null);
        }
      })
      .catch(err => {
        if (isCancelled) return;
        console.error(err);
        setErrorMessage(err.message || 'Network error while loading invoice data.');
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [stayId, format, reloadIndex]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-sm shadow-md flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-base font-bold text-gray-900 mb-1">Loading Invoice Data...</h2>
          <p className="text-xs text-gray-500">Preparing invoice format: {format}</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !data) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white border border-rose-200 rounded-2xl p-8 max-w-md shadow-lg">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            ✕
          </div>
          <h2 className="text-lg font-black text-gray-900 mb-2">Unable to Load Invoice</h2>
          <p className="text-xs text-gray-600 mb-6">{errorMessage || 'Invoice data could not be found or loaded.'}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setReloadIndex(prev => prev + 1)}
              className="px-4 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition"
            >
              Retry
            </button>
            <button
              onClick={() => { if (window.history.length > 1 && document.referrer) { window.history.back(); } else { window.close(); } }}
              className="px-4 py-2.5 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition"
            >
              Close Window
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { stay, hotel, guest, leadStayRoom, invoice, businessProfile, aggregatedTax } = data;
  const stayRooms: any[] = stay?.stayRooms?.length ? stay.stayRooms : [leadStayRoom];
  const roomNumbersList = stayRooms.map((sr: any) => sr.room?.roomNumber).filter(Boolean).join(', ') || leadStayRoom.room.roomNumber;

  const displayTax = aggregatedTax || {
    grossAmount: leadStayRoom.grossAmount,
    discountAmount: leadStayRoom.discountAmount,
    extraChargesAmount: leadStayRoom.extraChargesAmount,
    taxableAmount: leadStayRoom.taxableAmount,
    cgstAmount: leadStayRoom.cgstAmount,
    sgstAmount: leadStayRoom.sgstAmount,
    taxAmount: leadStayRoom.taxAmount,
    finalAmount: leadStayRoom.finalAmount,
    taxRate: leadStayRoom.taxRate || 1200,
    taxMode: leadStayRoom.taxMode || 'INCLUSIVE'
  };

  const finalTotal = invoice?.totalAmount ?? displayTax.finalAmount;
  const paidTotal = invoice?.paidAmount ?? 0;
  const balanceTotal = invoice?.balanceAmount ?? (finalTotal - paidTotal);

  const expectedOut = new Date(leadStayRoom.checkInDate);
  expectedOut.setDate(expectedOut.getDate() + leadStayRoom.nights);
  const displayCheckOutDate = leadStayRoom.checkOutDate ? new Date(leadStayRoom.checkOutDate) : expectedOut;

  const handlePrint = () => {
    window.print();
  };

  const branding = {
    logoSize: normalizeLogoSize(businessProfile?.printBranding?.logoSize),
    logoAlign: normalizeLogoAlign(businessProfile?.printBranding?.logoAlign),
    signatureSize: normalizeSignatureSize(businessProfile?.printBranding?.signatureSize),
    signatureAlign: 'right' as const,
  };

  const logoUrl = businessProfile?.logoUrl;
  const signatureUrl = businessProfile?.signatureUrl;
  const logoDims = getLogoDimensions(branding.logoSize);
  const signatureDims = getSignatureDimensions(branding.signatureSize);

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

           {/* Top Full-Width Logo for Center Alignment */}
           {logoUrl && branding.logoAlign === 'center' && (
             <div className="w-full flex justify-center text-center mb-6">
               <img
                 src={logoUrl}
                 alt={businessProfile?.businessName || hotel.name}
                 className="object-contain"
                 style={{
                   maxHeight: logoDims.a4.maxHeight,
                   maxWidth: logoDims.a4.maxWidth,
                 }}
               />
             </div>
           )}

           <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
              <div className="flex-1 pr-6">
                 {/* Left or Right Logo within Hotel Info block */}
                 {logoUrl && branding.logoAlign !== 'center' && (
                   <div className={`mb-3 flex ${
                     branding.logoAlign === 'right' ? 'justify-end text-right' :
                     'justify-start text-left'
                   }`}>
                     <img
                       src={logoUrl}
                       alt={businessProfile?.businessName || hotel.name}
                       className="object-contain"
                       style={{
                         maxHeight: logoDims.a4.maxHeight,
                         maxWidth: logoDims.a4.maxWidth,
                       }}
                     />
                   </div>
                 )}
                 <h1 className="text-3xl font-black uppercase tracking-wider">
                    {businessProfile?.businessName || hotel.name}
                 </h1>
                 {businessProfile?.businessTagLine && (
                   <p className="text-xs italic text-gray-600 mt-0.5">{businessProfile.businessTagLine}</p>
                 )}
                 <p className="text-sm mt-1">{businessProfile?.businessAddress || hotel.address || 'Hotel Address'}</p>
                 <p className="text-sm">{[businessProfile?.district, businessProfile?.state, businessProfile?.pinCode].filter(Boolean).join(', ')}</p>
                 {(businessProfile?.contactPersonPhone || businessProfile?.businessEmail) && (
                    <p className="text-sm">Contact: {businessProfile?.contactPersonPhone} {businessProfile?.businessEmail}</p>
                 )}
                 <p className="text-sm font-bold mt-1">GSTIN: {businessProfile?.gstNumber || hotel.gstin || 'N/A'}</p>
              </div>
              <div className="text-right shrink-0">
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
                 <p className="text-sm">Room{stayRooms.length > 1 ? 's' : ''}: <span className="font-bold">{roomNumbersList}</span></p>
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
                  {stayRooms.map((sr: any, index: number) => {
                     const roomName = sr.room?.roomNumber || `Room ${index + 1}`;
                     const typeName = sr.room?.roomType?.name ? ` (${sr.room.roomType.name})` : '';
                     return (
                        <React.Fragment key={sr.id || index}>
                           <tr>
                              <td className="p-3 border border-gray-300 font-medium">Room {roomName}{typeName} — Rent</td>
                              <td className="p-3 border border-gray-300 text-center">{sr.nights}</td>
                              <td className="p-3 border border-gray-300 text-right">{(sr.grossAmount / 100).toFixed(2)}</td>
                           </tr>
                           {sr.discountAmount > 0 && (
                              <tr>
                                 <td className="p-3 border border-gray-300 text-green-700 pl-6">↳ Discount (Room {roomName})</td>
                                 <td className="p-3 border border-gray-300 text-center">-</td>
                                 <td className="p-3 border border-gray-300 text-right text-green-700">-{(sr.discountAmount / 100).toFixed(2)}</td>
                              </tr>
                           )}
                           {sr.extraChargesAmount > 0 && (
                              <tr>
                                 <td className="p-3 border border-gray-300 pl-6">↳ Extra Charges (Room {roomName})</td>
                                 <td className="p-3 border border-gray-300 text-center">1</td>
                                 <td className="p-3 border border-gray-300 text-right">{(sr.extraChargesAmount / 100).toFixed(2)}</td>
                              </tr>
                           )}
                        </React.Fragment>
                     );
                  })}
              </tbody>
           </table>

           <div className="flex justify-end mb-8">
              <div className="w-72 space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                     <span className="text-gray-600">Pricing Mode:</span>
                     <span className="font-bold text-xs uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 border">{displayTax.taxMode === "INCLUSIVE" ? "GST Inclusive" : "GST Exclusive"}</span>
                  </div>
                 <div className="flex justify-between">
                    <span className="text-gray-600">Taxable Amount:</span>
                    <span className="font-bold">{(displayTax.taxableAmount / 100).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-gray-600">CGST ({displayTax.taxRate/2/100}%):</span>
                    <span className="font-bold">{(displayTax.cgstAmount / 100).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-gray-600">SGST ({displayTax.taxRate/2/100}%):</span>
                    <span className="font-bold">{(displayTax.sgstAmount / 100).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between border-t-2 border-black pt-2 text-lg font-black mt-2">
                    <span>GRAND TOTAL:</span>
                    <span>₹{(finalTotal / 100).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-sm pt-1 text-emerald-700">
                    <span>Paid Amount:</span>
                    <span className="font-bold">₹{(paidTotal / 100).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-1">
                    <span>Balance Due:</span>
                    <span className={balanceTotal > 0 ? "text-rose-600 font-black" : "text-emerald-700 font-bold"}>
                       ₹{(Math.max(0, balanceTotal) / 100).toFixed(2)}
                    </span>
                 </div>
              </div>
           </div>

           {/* Signature Area */}
           {signatureUrl ? (
             <div className="mt-10 pt-4 flex justify-end text-right">
               <div className="text-center w-56">
                 <div className="flex justify-center items-end min-h-[40px]">
                   <img
                     src={signatureUrl}
                     alt="Manager Signature"
                     className="object-contain inline-block"
                     style={{
                       maxHeight: signatureDims.a4.maxHeight,
                       maxWidth: signatureDims.a4.maxWidth,
                     }}
                   />
                 </div>
                 <div className="border-t border-black pt-1.5 mt-1">
                   <p className="text-xs font-bold uppercase tracking-wider">Authorized Signatory</p>
                   <p className="text-[10px] text-gray-500 font-medium">{businessProfile?.businessName || hotel.name}</p>
                 </div>
               </div>
             </div>
           ) : (
             <div className="border-t border-gray-300 pt-8 mt-16 text-center text-xs text-gray-500">
                <p>Thank you for choosing {businessProfile?.businessName || hotel.name}! We hope you had a pleasant stay.</p>
                <p>This is a computer generated invoice and does not require a signature.</p>
             </div>
           )}
        </div>
      )}

      {/* -------------------- 80MM / 58MM THERMAL FORMAT -------------------- */}
      {(format === '80MM' || format === '58MM') && (
        <div className="bg-white p-4 shadow-xl font-mono text-sm leading-tight text-black print:shadow-none" style={{ width: format === '58MM' ? '58mm' : '80mm', minHeight: '100mm', margin: '0 auto' }}>

           <div className={`border-b border-dashed border-gray-400 pb-3 mb-3 ${
             branding.logoAlign === 'left' ? 'text-left' :
             branding.logoAlign === 'right' ? 'text-right' :
             'text-center'
           }`}>
              {logoUrl && (
                <div className={`mb-2 flex ${
                  branding.logoAlign === 'left' ? 'justify-start text-left' :
                  branding.logoAlign === 'right' ? 'justify-end text-right' :
                  'justify-center text-center'
                }`}>
                  <img
                    src={logoUrl}
                    alt={businessProfile?.businessName || hotel.name}
                    className="object-contain filter grayscale contrast-125"
                    style={{
                      maxHeight: format === '58MM' ? logoDims.thermal58mm.maxHeight : logoDims.thermal80mm.maxHeight,
                      maxWidth: format === '58MM' ? logoDims.thermal58mm.maxWidth : logoDims.thermal80mm.maxWidth,
                    }}
                  />
                </div>
              )}
              <h1 className="text-lg font-black uppercase">{businessProfile?.businessName || hotel.name}</h1>
              {businessProfile?.businessTagLine && (
                <p className="text-[9px] italic text-gray-700">{businessProfile.businessTagLine}</p>
              )}
              {businessProfile?.businessAddress && <p className="text-[10px] mt-0.5">{businessProfile.businessAddress}</p>}
              <p className="text-[10px] uppercase mt-1 font-bold">Tax Invoice</p>
              <p className="text-[10px]">Inv: {invoice?.invoiceNumber || 'DRAFT'}</p>
           </div>

           <div className="mb-3 text-[11px] border-b border-dashed border-gray-400 pb-3">
              <p>Guest: <span className="font-bold">{guest.name}</span></p>
              <p>Room{stayRooms.length > 1 ? 's' : ''}: <span className="font-bold">{roomNumbersList}</span></p>
              <p>Date: {new Date(leadStayRoom.checkInDate).toLocaleDateString()} to {displayCheckOutDate.toLocaleDateString()}</p>
           </div>

           <table className="w-full text-[11px] mb-3">
              <tbody>
                  {stayRooms.map((sr: any, index: number) => {
                     const rNum = sr.room?.roomNumber || `${index + 1}`;
                     return (
                        <React.Fragment key={sr.id || index}>
                           <tr>
                              <td>Room {rNum} x{sr.nights}</td>
                              <td className="text-right">{(sr.grossAmount / 100).toFixed(2)}</td>
                           </tr>
                           {sr.discountAmount > 0 && (
                              <tr>
                                 <td className="text-gray-600 pl-2">↳ Disc {rNum}</td>
                                 <td className="text-right text-gray-600">-{(sr.discountAmount / 100).toFixed(2)}</td>
                              </tr>
                           )}
                           {sr.extraChargesAmount > 0 && (
                              <tr>
                                 <td className="text-gray-600 pl-2">↳ Extra {rNum}</td>
                                 <td className="text-right">{(sr.extraChargesAmount / 100).toFixed(2)}</td>
                              </tr>
                           )}
                        </React.Fragment>
                     );
                  })}
              </tbody>
           </table>

           <div className="border-t border-dashed border-gray-400 pt-2 mb-3 text-[11px]">
              <div className="flex justify-between text-[10px] text-gray-600 mb-1">
                 <span>Mode</span>
                 <span className="uppercase font-bold">{displayTax.taxMode === "INCLUSIVE" ? "GST Incl." : "GST Excl."}</span>
              </div>
              <div className="flex justify-between">
                 <span>Taxable</span>
                 <span>{(displayTax.taxableAmount / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                 <span>CGST ({displayTax.taxRate/2/100}%)</span>
                 <span>{(displayTax.cgstAmount / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                 <span>SGST ({displayTax.taxRate/2/100}%)</span>
                 <span>{(displayTax.sgstAmount / 100).toFixed(2)}</span>
              </div>
           </div>

           <div className="border-t-2 border-black pt-2 mb-2 flex justify-between font-black text-sm">
              <span>TOTAL</span>
              <span>₹{(finalTotal / 100).toFixed(2)}</span>
           </div>

           <div className="border-t border-dashed border-gray-400 pt-1.5 mb-4 text-[11px] space-y-1">
              <div className="flex justify-between text-gray-700">
                 <span>Paid:</span>
                 <span className="font-bold">₹{(paidTotal / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                 <span>Balance:</span>
                 <span className={balanceTotal > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                    ₹{(Math.max(0, balanceTotal) / 100).toFixed(2)}
                 </span>
              </div>
           </div>

           {signatureUrl && (
             <div className="my-4 pt-2 border-t border-dotted border-gray-400 text-right">
               <div className="flex justify-end">
                 <img
                   src={signatureUrl}
                   alt="Signature"
                   className="object-contain filter grayscale contrast-125"
                   style={{
                     maxHeight: format === '58MM' ? signatureDims.thermal58mm.maxHeight : signatureDims.thermal80mm.maxHeight,
                     maxWidth: format === '58MM' ? signatureDims.thermal58mm.maxWidth : signatureDims.thermal80mm.maxWidth,
                   }}
                 />
               </div>
               <p className="text-[9px] uppercase font-bold mt-1">Authorized Signatory</p>
             </div>
           )}

           <div className="text-center text-[10px] mt-4 border-t border-dashed border-gray-400 pt-2">
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
