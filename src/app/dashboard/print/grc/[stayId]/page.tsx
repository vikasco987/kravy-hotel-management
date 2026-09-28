import React from 'react';
import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';

const prisma = new PrismaClient();

export default async function GRCPrintPage({ params }: { params: { stayId: string } }) {
  const stay = await prisma.stay.findUnique({
    where: { id: params.stayId },
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

  return (
    <div className="bg-white text-black min-h-screen p-8 font-sans print:p-0">
      <div className="max-w-4xl mx-auto border border-gray-300 p-8 print:border-none print:p-4">
        
        {/* Print Button (Hidden in Print) */}
        <div className="mb-4 text-right print:hidden">
           <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded font-bold">
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
                    {guest.documents.length > 0 ? `${guest.documents[0].documentType} - ${guest.documents[0].documentNumber || 'Verified'}` : 'None'}
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
                       <td className="border border-gray-300 p-2">Extra Charges (Bed/Other)</td>
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
    </div>
  );
}
