import React from 'react';
import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';

const prisma = new PrismaClient();

export default async function GRCPrintPage({ params, searchParams }: { params: Promise<{ stayId: string }>, searchParams?: Promise<{ format?: string }> }) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
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

   const hotel = stay.reservation.hotel;
  const guest = stay.reservation.guest;
  const leadStayRoom = stay.stayRooms[0];
  if (!leadStayRoom) return notFound();

  const expectedOut = new Date(leadStayRoom.checkInDate);
  expectedOut.setDate(expectedOut.getDate() + leadStayRoom.nights);
  const displayCheckOutDate = leadStayRoom.checkOutDate ? new Date(leadStayRoom.checkOutDate) : expectedOut;

  const initialFormat = (resolvedSearchParams.format?.toUpperCase() as 'A4' | '80MM' | '58MM') || 'A4';
  
  const totalPaid = stay.payments.reduce((sum, p) => sum + p.amount, 0);

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
        <div className="text-center border-b-2 border-black pb-6 mb-6">
           <h1 className="text-3xl font-black uppercase tracking-wider">{hotel.name}</h1>
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
                 <span className="font-semibold text-gray-600 col-span-1">Room No:</span>
                 <span className="col-span-2 font-bold">{leadStayRoom.room.roomNumber} ({leadStayRoom.room.roomType.name})</span>
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
                    <th className="border border-gray-300 p-2 text-right">Amount (₹)</th>
                 </tr>
              </thead>
              <tbody>
                 <tr>
                    <td className="border border-gray-300 p-2">Room Rent (Base) x {leadStayRoom.nights}</td>
                    <td className="border border-gray-300 p-2 text-right">{(leadStayRoom.grossAmount / 100).toFixed(2)}</td>
                 </tr>
                 {leadStayRoom.discountAmount > 0 && (
                    <tr>
                       <td className="border border-gray-300 p-2">Discount</td>
                       <td className="border border-gray-300 p-2 text-right text-green-700">-{(leadStayRoom.discountAmount / 100).toFixed(2)}</td>
                    </tr>
                 )}
                 {leadStayRoom.extraChargesAmount > 0 && (
                    <tr>
                       <td className="border border-gray-300 p-2">Extra Charges</td>
                       <td className="border border-gray-300 p-2 text-right">{(leadStayRoom.extraChargesAmount / 100).toFixed(2)}</td>
                    </tr>
                 )}
                 <tr>
                    <td className="border border-gray-300 p-2">Tax ({leadStayRoom.taxMode})</td>
                    <td className="border border-gray-300 p-2 text-right">{(leadStayRoom.taxAmount / 100).toFixed(2)}</td>
                 </tr>
                 <tr className="font-bold bg-gray-50">
                    <td className="border border-gray-300 p-2 text-right">Total Stay Amount</td>
                    <td className="border border-gray-300 p-2 text-right">{(leadStayRoom.finalAmount / 100).toFixed(2)}</td>
                 </tr>
              </tbody>
           </table>
           <p className="text-xs text-gray-500 mt-2">* Pricing above is based on the agreed snapshot at check-in.</p>
        </div>

        {/* Declarations & Signatures */}
        <div className="mt-12">
           <p className="text-xs text-gray-600 text-justify mb-8">
             I agree to the hotel rules and regulations. I confirm that my luggage does not contain any illicit or hazardous items. 
             I agree to be held personally liable for the payment of the above charges.
           </p>

           <div className="flex justify-between items-end mt-16 pt-8">
              <div className="text-center w-48 border-t border-black pt-2">
                 <span className="text-xs font-bold uppercase block">Guest Signature</span>
              </div>
              <div className="text-center w-48 border-t border-black pt-2">
                 <span className="text-xs font-bold uppercase block">Receptionist Signature</span>
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
           
           <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
              <h1 className="text-lg font-black uppercase">{hotel.name}</h1>
              <p className="text-[10px] uppercase mt-1">GUEST REGISTRATION (GRC)</p>
              <p className="text-[10px]">#BK-{stay.reservationId.slice(-6).toUpperCase()}</p>
           </div>

           <div className="mb-3 text-[11px] border-b border-dashed border-gray-400 pb-3">
              <p>Guest: <span className="font-bold">{guest.name}</span></p>
              <p>Mobile: <span className="font-bold">{guest.phone}</span></p>
              <p>Room: <span className="font-bold">{leadStayRoom.room.roomNumber}</span></p>
              <p>Date: {new Date(leadStayRoom.checkInDate).toLocaleDateString()} to {displayCheckOutDate.toLocaleDateString()}</p>
              <p>ID: {guest.documents.length > 0 ? guest.documents[0].documentType : 'None'}</p>
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
                 <span>Tax ({leadStayRoom.taxMode})</span>
                 <span>{(leadStayRoom.taxAmount / 100).toFixed(2)}</span>
              </div>
           </div>

           <div className="border-t-2 border-black pt-2 mb-2 flex justify-between font-black text-sm">
              <span>TOTAL</span>
              <span>₹{(leadStayRoom.finalAmount / 100).toFixed(2)}</span>
           </div>
           
           <div className="flex justify-between text-[11px] font-bold">
              <span>Advance Paid</span>
              <span>₹{(totalPaid / 100).toFixed(2)}</span>
           </div>
           <div className="flex justify-between text-[11px] font-bold mb-6">
              <span>Balance Due</span>
              <span>₹{Math.max(0, (leadStayRoom.finalAmount - totalPaid) / 100).toFixed(2)}</span>
           </div>

           <div className="text-center text-[10px] mt-6 border-t border-dashed border-gray-400 pt-3">
              <p>I agree to hotel rules.</p>
              <p className="mt-6 border-t border-black inline-block px-4">Guest Signature</p>
           </div>
        </div>
        </>
      )}

    </div>
  );
}
