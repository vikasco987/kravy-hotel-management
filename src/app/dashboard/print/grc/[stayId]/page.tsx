import React from 'react';
import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import { getAuthContext } from '@/lib/authContext';
import { isAdminOrOwner, hasPermission } from '@/lib/permissions';

const prisma = new PrismaClient();

export default async function GRCPrintPage({ params, searchParams }: { params: Promise<{ stayId: string }>, searchParams?: Promise<{ format?: string }> }) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const authContext = await getAuthContext();
  if (!authContext || !authContext.user || !authContext.hotel) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white border border-rose-200 rounded-2xl p-8 max-w-md shadow-lg">
          <h2 className="text-lg font-black text-gray-900 mb-2">Unauthorized</h2>
          <p className="text-xs text-gray-600">Please sign in to access receipt printing.</p>
        </div>
      </div>
    );
  }

  if (authContext.user.isStaff && authContext.user.status !== 'active') {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white border border-rose-200 rounded-2xl p-8 max-w-md shadow-lg">
          <h2 className="text-lg font-black text-gray-900 mb-2">Access Denied</h2>
          <p className="text-xs text-gray-600">Your staff account is currently inactive.</p>
        </div>
      </div>
    );
  }

  const initialFormat = (resolvedSearchParams.format?.toUpperCase() as 'A4' | '80MM' | '58MM') || 'A4';

  // Permission check: Admin/Owner bypasses; Staff must have format-specific centralized printing permissions
  if (!isAdminOrOwner(authContext.user)) {
    let canPrint = false;
    let requiredKey = 'action:printing:guest_registration_card';

    if (initialFormat === 'A4') {
      // A4 format is Guest Registration Card (GRC)
      requiredKey = 'action:printing:guest_registration_card';
      canPrint = hasPermission(authContext.user, 'action:printing:guest_registration_card');
    } else {
      // 80mm or 58mm thermal check-in receipt / registration slip:
      // Accepts format-specific thermal permission OR payment receipt OR guest registration card
      requiredKey = initialFormat === '58MM' ? 'action:printing:invoice_58mm' : 'action:printing:invoice_80mm';
      canPrint =
        hasPermission(authContext.user, 'action:printing:payment_receipt') ||
        hasPermission(authContext.user, 'action:printing:guest_registration_card') ||
        (initialFormat === '80MM' && hasPermission(authContext.user, 'action:printing:invoice_80mm')) ||
        (initialFormat === '58MM' && hasPermission(authContext.user, 'action:printing:invoice_58mm'));
    }

    if (!canPrint) {
      return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white border border-rose-200 rounded-2xl p-8 max-w-md shadow-lg">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
              ✕
            </div>
            <h2 className="text-lg font-black text-gray-900 mb-2">Access Denied</h2>
            <p className="text-xs text-gray-600 mb-6">
              You lack required printing permission ({requiredKey}) to access this print document.
            </p>
          </div>
        </div>
      );
    }
  }

  const stay = await prisma.stay.findUnique({
    where: { id: resolvedParams.stayId },
    include: {
      reservation: {
        include: {
          hotel: true,
          guest: {
             include: { documents: true }
          }
        }
      },
      stayRooms: {
        include: { room: { include: { roomType: true, floor: true } } }
      },
      roomCharges: true,
      payments: true
    }
  });

  if (!stay) return notFound();

  // Hotel ownership boundary
  if (stay.reservation.hotelId !== authContext.hotel.id) {
    return notFound();
  }

  const hotel = stay.reservation.hotel;
  const guest = stay.reservation.guest;
  const leadStayRoom = stay.stayRooms[0];
  if (!leadStayRoom) return notFound();

  // Resolve businessProfile: for staff users, query using hotel's owner/creator ID
  const businessOwnerId = hotel.createdBy || authContext.business?.createdBy || authContext.user.id;
  const businessProfile = await prisma.businessProfile.findFirst({
    where: { userId: businessOwnerId }
  });

  const {
    parsePrintBranding,
    getLogoDimensions,
    getSignatureDimensions,
    normalizeLogoSize,
    normalizeLogoAlign,
    normalizeSignatureSize,
  } = await import('@/lib/printBranding');

  const rawBranding = parsePrintBranding(businessProfile?.servedStatusLabel);
  const branding = {
    logoSize: normalizeLogoSize(rawBranding.logoSize),
    logoAlign: normalizeLogoAlign(rawBranding.logoAlign),
    signatureSize: normalizeSignatureSize(rawBranding.signatureSize),
    signatureAlign: 'right' as const,
  };

  const logoDims = getLogoDimensions(branding.logoSize);
  const signatureDims = getSignatureDimensions(branding.signatureSize);
  const logoUrl = businessProfile?.logoUrl;
  const signatureUrl = businessProfile?.signatureUrl;

  const expectedOut = new Date(leadStayRoom.checkInDate);
  expectedOut.setDate(expectedOut.getDate() + leadStayRoom.nights);
  const displayCheckOutDate = leadStayRoom.checkOutDate ? new Date(leadStayRoom.checkOutDate) : expectedOut;

  const totalPaid = stay.payments.reduce((sum, p) => sum + p.amount, 0);

  const stayRooms = stay.stayRooms.length > 0 ? stay.stayRooms : [leadStayRoom];
  const roomNumbersList = stayRooms
    .map((sr) => sr.room?.roomNumber)
    .filter(Boolean)
    .join(', ') || leadStayRoom.room.roomNumber;

  // Aggregate financial snapshot across all rooms in the stay
  let aggGross = 0;
  let aggDiscount = 0;
  let aggExtra = 0;
  let aggTaxable = 0;
  let aggCgst = 0;
  let aggSgst = 0;
  let aggTax = 0;
  let aggFinal = 0;

  for (const sr of stayRooms) {
    aggGross += (sr.grossAmount || 0);
    aggDiscount += (sr.discountAmount || 0);
    aggExtra += (sr.extraChargesAmount || 0);
    aggTaxable += (sr.taxableAmount || 0);
    aggCgst += (sr.cgstAmount || 0);
    aggSgst += (sr.sgstAmount || 0);
    aggTax += (sr.taxAmount || 0);
    aggFinal += (sr.finalAmount || 0);
  }

  // Also include any roomCharges attached directly to the stay if not already in stayRooms extraCharges
  const directRoomChargesTotal = stay.roomCharges.reduce(
    (acc, c) => acc + (c.amount * (c.quantity || 1)),
    0
  );
  const totalExtraAmount = Math.max(aggExtra, directRoomChargesTotal);

  const displayTax = {
    grossAmount: aggGross,
    discountAmount: aggDiscount,
    extraChargesAmount: totalExtraAmount,
    taxableAmount: aggTaxable,
    cgstAmount: aggCgst,
    sgstAmount: aggSgst,
    taxAmount: aggTax,
    finalAmount: aggFinal,
    taxMode: leadStayRoom.taxMode || 'INCLUSIVE',
    taxRate: leadStayRoom.taxRate || 0,
  };

  const balanceDue = Math.max(0, displayTax.finalAmount - totalPaid);

  return (
    <div className="bg-gray-100 min-h-screen p-8 print:p-0 print:bg-white flex flex-col items-center">

      {/* -------------------- A4 FORMAT -------------------- */}
      {initialFormat === 'A4' && (
      <div className="bg-white text-black max-w-4xl w-full mx-auto border border-gray-300 p-8 shadow-xl print:shadow-none print:w-full print:max-w-none print:border-none print:p-4">

        {/* Print Button (Hidden in Print) */}
        <div className="mb-4 text-right print:hidden">
           <button onClick={() => { window.print(); }} className="bg-blue-600 text-white px-4 py-2 rounded font-bold">
              Print GRC
           </button>
        </div>

        {/* Header */}
        <div className={`border-b-2 border-black pb-6 mb-6 ${
          branding.logoAlign === 'left' ? 'text-left' :
          branding.logoAlign === 'right' ? 'text-right' :
          'text-center'
        }`}>
           {logoUrl && (
             <div className={`mb-3 flex ${
               branding.logoAlign === 'left' ? 'justify-start text-left' :
               branding.logoAlign === 'right' ? 'justify-end text-right' :
               'justify-center text-center'
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
           <h1 className="text-3xl font-black uppercase tracking-wider">{businessProfile?.businessName || hotel.name}</h1>
           {businessProfile?.businessTagLine && (
             <p className="text-xs italic text-gray-600 mt-0.5">{businessProfile.businessTagLine}</p>
           )}
           <p className="text-sm font-medium mt-1">GUEST REGISTRATION CARD (GRC)</p>
        </div>

        {/* Guest & Stay Details Grid */}
        <div className="grid grid-cols-2 gap-8 mb-8 border-b pb-6">
           {/* Left Col */}
           <div>
              <h3 className="font-bold text-sm text-gray-500 uppercase mb-2">Guest Details</h3>
              <div className="grid grid-cols-3 gap-2 text-sm mb-1">
                 <span className="font-semibold text-gray-600 col-span-1">Name:</span>
                 <span className="col-span-2 font-bold">{guest.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm mb-1">
                 <span className="font-semibold text-gray-600 col-span-1">Mobile:</span>
                 <span className="col-span-2 font-bold">{guest.phone}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm mb-1">
                 <span className="font-semibold text-gray-600 col-span-1">ID Provided:</span>
                 <span className="col-span-2 font-bold">
                    {guest.documents.length > 0 ? (
                       guest.documents[0].verificationStatus === 'VERIFIED' ? `${guest.documents[0].documentType} (Verified)` : `${guest.documents[0].documentType} (Not Verified)`
                    ) : 'None'}
                 </span>
              </div>
           </div>

           {/* Right Col */}
           <div>
              <h3 className="font-bold text-sm text-gray-500 uppercase mb-2">Stay Details</h3>
              <div className="grid grid-cols-3 gap-2 text-sm mb-1">
                 <span className="font-semibold text-gray-600 col-span-1">Room{stayRooms.length > 1 ? 's' : ''}:</span>
                 <span className="col-span-2 font-bold">{roomNumbersList}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm mb-1">
                 <span className="font-semibold text-gray-600 col-span-1">Check-in:</span>
                 <span className="col-span-2 font-bold">{new Date(leadStayRoom.checkInDate).toLocaleDateString()}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm mb-1">
                 <span className="font-semibold text-gray-600 col-span-1">Expected Out:</span>
                 <span className="col-span-2 font-bold">{displayCheckOutDate.toLocaleDateString()}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm mb-1">
                 <span className="font-semibold text-gray-600 col-span-1">Nights:</span>
                 <span className="col-span-2 font-bold">{leadStayRoom.nights}</span>
              </div>
           </div>
        </div>

        {/* Pricing Snapshot */}
        <div className="mb-8 border-b pb-6">
           <h3 className="font-bold text-sm text-gray-500 uppercase mb-4">Confirmed Tariff & Pricing</h3>
           <table className="w-full text-sm text-left border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                 <tr>
                    <th className="border border-gray-300 p-2">Description</th>
                    <th className="border border-gray-300 p-2 text-center">Nights</th>
                    <th className="border border-gray-300 p-2 text-right">Amount (₹)</th>
                 </tr>
              </thead>
              <tbody>
                 {stayRooms.map((sr, index) => {
                    const rNum = sr.room?.roomNumber || `Room ${index + 1}`;
                    const typeName = sr.room?.roomType?.name ? ` (${sr.room.roomType.name})` : '';
                    return (
                       <React.Fragment key={sr.id || index}>
                          <tr>
                             <td className="border border-gray-300 p-2">Room {rNum}{typeName} — Rent</td>
                             <td className="border border-gray-300 p-2 text-center">{sr.nights}</td>
                             <td className="border border-gray-300 p-2 text-right">{(sr.grossAmount / 100).toFixed(2)}</td>
                          </tr>
                          {sr.discountAmount > 0 && (
                             <tr>
                                <td className="border border-gray-300 p-2 text-green-700 pl-6">↳ Discount (Room {rNum})</td>
                                <td className="border border-gray-300 p-2 text-center">-</td>
                                <td className="border border-gray-300 p-2 text-right text-green-700">-{(sr.discountAmount / 100).toFixed(2)}</td>
                             </tr>
                          )}
                          {sr.extraChargesAmount > 0 && (
                             <tr>
                                <td className="border border-gray-300 p-2 pl-6">↳ Extra Charges (Room {rNum})</td>
                                <td className="border border-gray-300 p-2 text-center">1</td>
                                <td className="border border-gray-300 p-2 text-right">{(sr.extraChargesAmount / 100).toFixed(2)}</td>
                             </tr>
                          )}
                       </React.Fragment>
                    );
                 })}
              </tbody>
           </table>

           {/* Aggregated Totals Breakdown */}
           <div className="flex justify-end mt-4">
              <div className="w-72 space-y-1.5 text-sm">
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600">Pricing Mode:</span>
                    <span className="font-bold uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 border">
                       {displayTax.taxMode === 'INCLUSIVE' ? 'GST Inclusive' : 'GST Exclusive'}
                    </span>
                 </div>
                 <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Taxable Amount:</span>
                    <span className="font-bold">₹{(displayTax.taxableAmount / 100).toFixed(2)}</span>
                 </div>
                 {displayTax.taxAmount > 0 ? (
                    <>
                       <div className="flex justify-between text-xs">
                          <span className="text-gray-600">CGST ({displayTax.taxRate / 2 / 100}%):</span>
                          <span className="font-bold">₹{(displayTax.cgstAmount / 100).toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between text-xs">
                          <span className="text-gray-600">SGST ({displayTax.taxRate / 2 / 100}%):</span>
                          <span className="font-bold">₹{(displayTax.sgstAmount / 100).toFixed(2)}</span>
                       </div>
                    </>
                 ) : (
                    <div className="flex justify-between text-xs text-gray-500">
                       <span>GST (0% / Exempt):</span>
                       <span>₹0.00</span>
                    </div>
                 )}
                 <div className="flex justify-between border-t-2 border-black pt-2 font-black text-base">
                    <span>TOTAL:</span>
                    <span>₹{(displayTax.finalAmount / 100).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-xs font-bold text-emerald-700">
                    <span>Advance Paid:</span>
                    <span>₹{(totalPaid / 100).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-xs font-bold border-t border-gray-200 pt-1">
                    <span>Balance Due:</span>
                    <span className={balanceDue > 0 ? 'text-rose-600 font-black' : 'text-emerald-700'}>
                       ₹{(balanceDue / 100).toFixed(2)}
                    </span>
                 </div>
              </div>
           </div>
           <p className="text-xs text-gray-500 mt-3">* Pricing above is based on the agreed snapshot at check-in.</p>
        </div>

        {/* Declarations & Signatures */}
        <div className="mt-12">
           <p className="text-xs text-gray-600 text-justify mb-8">
             I agree to the hotel rules and regulations. I confirm that my luggage does not contain any illicit or hazardous items.
             I agree to be held personally liable for the payment of the above charges.
           </p>

           <div className="flex justify-between items-end mt-16 pt-8">
              <div className="text-center w-52 border-t border-black pt-2">
                 <span className="text-xs font-bold uppercase block">Guest Signature</span>
                 <span className="text-[10px] text-gray-500 font-medium">I agree to hotel policies</span>
              </div>
              <div className="text-center w-52 border-t border-black pt-2">
                 {signatureUrl && (
                   <div className="flex justify-center items-end min-h-[35px] mb-1">
                     <img
                       src={signatureUrl}
                       alt="Manager / Receptionist Signature"
                       className="object-contain inline-block"
                       style={{
                         maxHeight: signatureDims.a4.maxHeight,
                         maxWidth: signatureDims.a4.maxWidth,
                       }}
                     />
                   </div>
                 )}
                 <span className="text-xs font-bold uppercase block">Authorized / Receptionist</span>
                 <span className="text-[10px] text-gray-500 font-medium">{businessProfile?.businessName || hotel.name}</span>
              </div>
           </div>
        </div>

      </div>
      )}

      {/* -------------------- 80MM / 58MM THERMAL FORMAT -------------------- */}
      {(initialFormat === '80MM' || initialFormat === '58MM') && (
        <>
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { size: ${initialFormat === '58MM' ? '58mm auto' : '80mm auto'}; margin: 0; }
            body { padding: 0; margin: 0; }
          }
        `}} />
        <div className="bg-white p-4 shadow-xl font-mono text-sm leading-tight text-black print:shadow-none" style={{ width: initialFormat === '58MM' ? '58mm' : '80mm', minHeight: '100mm', margin: '0 auto' }}>

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
                      maxHeight: initialFormat === '58MM' ? logoDims.thermal58mm.maxHeight : logoDims.thermal80mm.maxHeight,
                      maxWidth: initialFormat === '58MM' ? logoDims.thermal58mm.maxWidth : logoDims.thermal80mm.maxWidth,
                    }}
                  />
                </div>
              )}
              <h1 className="text-lg font-black uppercase">{businessProfile?.businessName || hotel.name}</h1>
              {businessProfile?.businessTagLine && (
                <p className="text-[9px] italic text-gray-700">{businessProfile.businessTagLine}</p>
              )}
              <p className="text-[10px] uppercase mt-1 font-bold">GUEST REGISTRATION (GRC)</p>
              <p className="text-[10px]">#BK-{stay.reservationId.slice(-6).toUpperCase()}</p>
           </div>

           <div className="mb-3 text-[11px] border-b border-dashed border-gray-400 pb-3">
              <p>Guest: <span className="font-bold">{guest.name}</span></p>
              <p>Mobile: <span className="font-bold">{guest.phone}</span></p>
              <p>Room{stayRooms.length > 1 ? 's' : ''}: <span className="font-bold">{roomNumbersList}</span></p>
              <p>Date: {new Date(leadStayRoom.checkInDate).toLocaleDateString()} to {displayCheckOutDate.toLocaleDateString()}</p>
              <p>ID: {guest.documents.length > 0 ? guest.documents[0].documentType : 'None'}</p>
           </div>

           <table className="w-full text-[11px] mb-3">
              <tbody>
                 {stayRooms.map((sr, index) => {
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
                 <span className="uppercase font-bold">{displayTax.taxMode === 'INCLUSIVE' ? 'GST Incl.' : 'GST Excl.'}</span>
              </div>
              <div className="flex justify-between">
                 <span>Taxable</span>
                 <span>{(displayTax.taxableAmount / 100).toFixed(2)}</span>
              </div>
              {displayTax.taxAmount > 0 ? (
                 <>
                    <div className="flex justify-between">
                       <span>CGST ({displayTax.taxRate / 2 / 100}%)</span>
                       <span>{(displayTax.cgstAmount / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                       <span>SGST ({displayTax.taxRate / 2 / 100}%)</span>
                       <span>{(displayTax.sgstAmount / 100).toFixed(2)}</span>
                    </div>
                 </>
              ) : (
                 <div className="flex justify-between text-gray-500">
                    <span>GST (0% / Exempt)</span>
                    <span>0.00</span>
                 </div>
              )}
           </div>

           <div className="border-t-2 border-black pt-2 mb-2 flex justify-between font-black text-sm">
              <span>TOTAL</span>
              <span>₹{(displayTax.finalAmount / 100).toFixed(2)}</span>
           </div>

           <div className="flex justify-between text-[11px] font-bold">
              <span>Advance Paid</span>
              <span>₹{(totalPaid / 100).toFixed(2)}</span>
           </div>
           <div className="flex justify-between text-[11px] font-bold mb-4">
              <span>Balance Due</span>
              <span>₹{(balanceDue / 100).toFixed(2)}</span>
           </div>

           {signatureUrl && (
             <div className="my-4 pt-2 border-t border-dotted border-gray-400 text-right">
               <div className="flex justify-end">
                 <img
                   src={signatureUrl}
                   alt="Signature"
                   className="object-contain filter grayscale contrast-125"
                   style={{
                     maxHeight: initialFormat === '58MM' ? signatureDims.thermal58mm.maxHeight : signatureDims.thermal80mm.maxHeight,
                     maxWidth: initialFormat === '58MM' ? signatureDims.thermal58mm.maxWidth : signatureDims.thermal80mm.maxWidth,
                   }}
                 />
               </div>
               <p className="text-[9px] uppercase font-bold mt-1">Authorized / Receptionist</p>
             </div>
           )}

           <div className="text-center text-[10px] mt-4 border-t border-dashed border-gray-400 pt-3">
              <p>I agree to hotel rules.</p>
              <p className="mt-5 border-t border-black inline-block px-4">Guest Signature</p>
           </div>
        </div>
        </>
      )}

    </div>
  );
}
