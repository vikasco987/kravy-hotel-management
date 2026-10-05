import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthContext } from '@/lib/authContext';
import { PricingService } from '@/lib/pricing/PricingService';

const prisma = new PrismaClient();

function calculateNights(checkInStr: string, checkOutStr: string): number {
  const checkInParts = checkInStr.split('T')[0].split('-');
  const checkOutParts = checkOutStr.split('T')[0].split('-');
  
  if (checkInParts.length === 3 && checkOutParts.length === 3) {
    const ci = new Date(Date.UTC(Number(checkInParts[0]), Number(checkInParts[1]) - 1, Number(checkInParts[2])));
    const co = new Date(Date.UTC(Number(checkOutParts[0]), Number(checkOutParts[1]) - 1, Number(checkOutParts[2])));
    const diff = Math.round((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }
  return 1;
}

export async function POST(request: Request) {
  console.log("=== API: Check-in Requested ===");
  try {
    const authContext = await getAuthContext();
    if (!authContext || !authContext.hotel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hotelId = authContext.hotel.id;


    const payload = await request.json();
    console.log("Check-in Payload:", JSON.stringify(payload, null, 2));
    const { reservationId, roomIds, roomPricing, roomGuests, totalAmount, advancePaid, paymentMode, checkInDate, checkOutDate } = payload;

    if (!roomIds || !Array.isArray(roomIds) || roomIds.length === 0) {
      console.log("Error: No rooms selected");
      return NextResponse.json({ error: 'No rooms selected' }, { status: 400 });
    }

    // 4. Create StayRooms and update Room status
    const nights = calculateNights(checkInDate, checkOutDate);
    const checkInParsed = new Date(checkInDate);
    const checkOutParsed = new Date(checkOutDate);

    // Fetch rooms to get fallback basePrice if needed
    const dbRooms = await prisma.room.findMany({
      where: { id: { in: roomIds } },
      include: { roomType: true }
    });
    
    // We will use a database transaction to ensure overlap protection
    console.log("Starting check-in transaction for rooms:", roomIds);
    const stay = await prisma.$transaction(async (tx) => {
      // Extract first lead guest
      let leadGuestData = null;
      let allGuests: any[] = [];
      if (roomGuests && Object.keys(roomGuests).length > 0) {
        for (const roomId of Object.keys(roomGuests)) {
           const guestsList = roomGuests[roomId];
           allGuests = [...allGuests, ...guestsList];
           const lead = guestsList.find((g: any) => g.isLead);
           if (lead && !leadGuestData) leadGuestData = lead;
        }
      }

      if (!leadGuestData && allGuests.length > 0) leadGuestData = allGuests[0];

      console.log("Creating Lead Guest record:", leadGuestData?.name || 'Walk-in Guest');
      // 1. Create Guest Records
      const guest = await tx.guest.create({
        data: {
          businessId: authContext.business.id,
          name: leadGuestData?.name || 'Walk-in Guest',
          phone: leadGuestData?.phone || '9999999999',
          guestPhotoUrl: leadGuestData?.photoUrl || null,
        }
      });
      
      // Save documents for the lead guest if any
      if (leadGuestData?.idUrls && leadGuestData.idUrls.length > 0) {
         for (const url of leadGuestData.idUrls) {
            await tx.guestDocument.create({
               data: {
                  guestId: guest.id,
                  documentType: 'ID',
                  documentNumber: leadGuestData.idNumber || null,
                  fileReference: url,
                  verificationStatus: 'VERIFIED'
               }
            });
         }
      } else if (leadGuestData?.idDocuments && leadGuestData.idDocuments.length > 0) {
         for (const doc of leadGuestData.idDocuments) {
            await tx.guestDocument.create({
               data: {
                  guestId: guest.id,
                  documentType: 'ID',
                  documentNumber: doc.number || null,
                  fileReference: doc.url,
                  verificationStatus: 'VERIFIED'
               }
            });
         }
      } else if (leadGuestData?.idUrl) {
         // Fallback for legacy data
         await tx.guestDocument.create({
            data: {
               guestId: guest.id,
               documentType: 'ID',
               documentNumber: leadGuestData.idNumber || null,
               fileReference: leadGuestData.idUrl,
               verificationStatus: 'VERIFIED'
            }
         });
      }
      
      // Create records for all other guests (we could link them to the StayRoom if schema allowed it, for now just create the Guest profile)
      for (const g of allGuests) {
         if (g.id !== leadGuestData?.id && g.name) {
            const secondaryGuest = await tx.guest.create({
               data: {
                 businessId: authContext.business.id,
                 name: g.name,
                 phone: g.phone || '',
                 guestPhotoUrl: g.photoUrl || null,
               }
            });
             if (g.idUrls && g.idUrls.length > 0) {
                 for (const url of g.idUrls) {
                    await tx.guestDocument.create({
                       data: { guestId: secondaryGuest.id, documentType: 'ID', documentNumber: g.idNumber || null, fileReference: url, verificationStatus: 'VERIFIED' }
                    });
                 }
             } else if (g.idUrl) {
                await tx.guestDocument.create({
                   data: { guestId: secondaryGuest.id, documentType: 'ID', documentNumber: g.idNumber || null, fileReference: g.idUrl, verificationStatus: 'VERIFIED' }
                });
             }
         }
      }

      console.log("Handling Reservation record");
      let reservationIdToUse = reservationId;
      if (reservationId) {
         await tx.reservation.update({
           where: { id: reservationId },
           data: {
             guestId: guest.id,
             status: 'CHECKED_IN',
             totalAmount: Math.round(totalAmount * 100),
             advancePaid: Math.round(advancePaid * 100)
           }
         });
         await tx.reservationRoom.deleteMany({ where: { reservationId: reservationId } });
      } else {
         const newRes = await tx.reservation.create({
           data: {
             hotelId: hotelId,
             guestId: guest.id,
             status: 'CHECKED_IN',
             totalAmount: Math.round(totalAmount * 100),
             advancePaid: Math.round(advancePaid * 100),
           }
         });
         reservationIdToUse = newRes.id;
      }

      console.log("Creating ReservationRoom records to persist check-in/out dates");
      const nights = calculateNights(checkInDate, checkOutDate);
      for (const roomId of roomIds) {
          if (roomId.length === 24) {
             const room = dbRooms.find(r => r.id === roomId);
             await tx.reservationRoom.create({
                data: {
                   reservationId: reservationIdToUse,
                   roomId: roomId,
                   checkInDate: new Date(checkInDate),
                   checkOutDate: new Date(checkOutDate),
                   baseRate: room?.roomType?.basePrice || 250000,
                   appliedRate: roomPricing?.[roomId]?.baseRate || room?.roomType?.basePrice || 250000,
                   guestsData: roomGuests?.[roomId] ? roomGuests[roomId] : null
                }
             });
          }
      }

      console.log("Creating Stay record");
      // 3. Create Stay
      const stayRecord = await tx.stay.create({
        data: {
          reservationId: reservationIdToUse
        }
      });

      for (const roomId of roomIds) {
        const pricing = roomPricing?.[roomId];
        const room = dbRooms.find(r => r.id === roomId);
        
        // OVERLAP PROTECTION: Check if room is already occupied or booked in this date range
        if (roomId.length === 24) {
           console.log("OVERLAP CHECK START:");
           console.log("Room:", room?.roomNumber, "ID:", roomId);
           console.log("checkInParsed:", checkInParsed);
           console.log("checkOutParsed:", checkOutParsed);
           
           const existing = await tx.reservationRoom.findFirst({
              where: {
                 roomId: roomId,
                 reservationId: {
                    not: reservationIdToUse
                 },
                 reservation: {
                    status: {
                       in: ['RESERVED', 'CONFIRMED', 'CHECKED_IN']
                    }
                 },
                 checkInDate: {
                    lt: checkOutParsed
                 },
                 checkOutDate: {
                    gt: checkInParsed
                 }
              }
           });
           
           if (existing) {
               console.log("Overlap check failed for room:", roomId, "Conflict with reservation:", existing.reservationId);
               console.log("Existing checkIn:", existing.checkInDate, "Existing checkOut:", existing.checkOutDate);
               throw new Error(`Room ${room?.roomNumber || roomId} is already occupied or booked for these dates.`);
            }
         }
         
         let stayRoomData: any = {
             stayId: stayRecord.id,
             roomId: room ? room.id : undefined, 
             checkInDate: checkInParsed,
             checkOutDate: null, // Must be null because guest is currently staying
             nights: nights,
         };
        
        // Authoritative Server Calculation
        const baseRate = room?.roomType?.basePrice || 250000;
        
        const calcResult = PricingService.calculateRoomPricing({
           baseRate: pricing?.baseRate || baseRate, // Allow manual base rate override for now
           nights: nights,
           discountType: pricing?.discountType || null,
           discountValue: pricing?.discountValue || 0,
           taxMode: pricing?.taxMode || 'INCLUSIVE',
           taxRate: pricing?.taxRate || 1200,
           extraCharges: pricing ? [
             ...(pricing.bedCharge > 0 ? [{ amount: pricing.bedCharge, quantity: 1, chargeMode: pricing.bedMode }] : []),
             ...(pricing.otherCharge > 0 ? [{ amount: pricing.otherCharge, quantity: 1, chargeMode: pricing.otherMode }] : []),
             ...(pricing.extraChargesDetails ? pricing.extraChargesDetails.filter((c: any) => c.chargeType === 'EXTRA_SERVICE').map((c: any) => ({
                 amount: c.price, quantity: c.quantity, chargeMode: c.chargeMode || 'FIXED'
             })) : [])
           ] : []
        });

        stayRoomData = {
           ...stayRoomData,
           baseRate: calcResult.baseRate,
           appliedRate: calcResult.baseRate,
           discountType: calcResult.discountType,
           discountValue: calcResult.discountValue,
           discountAmount: calcResult.discountAmount,
           taxMode: calcResult.taxMode,
           taxRate: calcResult.taxRate,
           taxableAmount: calcResult.taxableAmount,
           cgstAmount: calcResult.cgstAmount,
           sgstAmount: calcResult.sgstAmount,
           taxAmount: calcResult.taxAmount,
           extraChargesAmount: calcResult.extraChargesAmount,
           grossAmount: calcResult.grossAmount,
           finalAmount: calcResult.finalAmount,
           guestsData: roomGuests?.[roomId] ? roomGuests[roomId] : null
        };

        // Only attempt to write to DB if it's a real Room ObjectId (length 24)
        if (roomId.length === 24) {
           console.log(`Creating StayRoom for room ${roomId}`);
           await tx.stayRoom.create({ data: stayRoomData });

           if (pricing && pricing.bedCharge > 0) {
              await tx.roomCharge.create({
                 data: {
                    stayId: stayRecord.id,
                    description: "Extra Bed",
                    chargeType: "EXTRA_BED",
                    amount: pricing.bedCharge,
                    chargeMode: pricing.bedMode,
                    quantity: 1,
                    nights: pricing.bedMode === 'DAILY' ? nights : 1,
                    totalAmount: pricing.bedCharge * (pricing.bedMode === 'DAILY' ? nights : 1)
                 }
              });
           }
           
           if (pricing && pricing.otherCharge > 0) {
              await tx.roomCharge.create({
                 data: {
                    stayId: stayRecord.id,
                    description: "Other Charges",
                    chargeType: "OTHER",
                    amount: pricing.otherCharge,
                    chargeMode: pricing.otherMode,
                    quantity: 1,
                    nights: pricing.otherMode === 'DAILY' ? nights : 1,
                    totalAmount: pricing.otherCharge * (pricing.otherMode === 'DAILY' ? nights : 1)
                 }
              });
           }

           if (pricing && pricing.extraChargesDetails) {
              for (const service of pricing.extraChargesDetails.filter((c: any) => c.chargeType === 'EXTRA_SERVICE')) {
                 await tx.roomCharge.create({
                    data: {
                       stayId: stayRecord.id,
                       description: service.name,
                       chargeType: "EXTRA_SERVICE",
                       amount: service.price,
                       chargeMode: service.chargeMode || 'FIXED',
                       quantity: service.quantity,
                       nights: service.chargeMode === 'DAILY' ? nights : 1,
                       totalAmount: service.price * service.quantity * (service.chargeMode === 'DAILY' ? nights : 1)
                    }
                 });
              }
           }

           try {
              console.log(`Updating room ${roomId} status to OCCUPIED`);
              await tx.room.update({
                where: { id: roomId, status: 'AVAILABLE' }, // Atomically ensure room is AVAILABLE
                data: { status: 'OCCUPIED' }
              });
           } catch (error: any) {
              console.log(`Failed to update room ${roomId} to OCCUPIED`);
              // If record to update not found, it means status was not AVAILABLE
              throw new Error(`Room ${room?.roomNumber || roomId} is not available for booking.`);
           }
        }
      }

      // 5. Create Payment record if advance paid
      if (advancePaid > 0) {
        await tx.payment.create({
          data: {
            stayId: stayRecord.id,
            amount: Math.round(advancePaid * 100),
            method: paymentMode || 'CASH'
          }
        });
      }
      
      return stayRecord;
    }, {
      maxWait: 5000, // 5 seconds max wait to acquire transaction lock
      timeout: 20000 // 20 seconds for the transaction to complete
    });
    console.log("=== Check-in Success ===", stay.id);
    return NextResponse.json({ success: true, stayId: stay.id });
  } catch (error: any) {
    console.error("Check-in Error:", error);
    let errorMessage = 'An unexpected error occurred during check-in. Please try again.';
    
    if (error?.message) {
      if (error.message.includes('Transaction already closed') || error.message.includes('expired transaction')) {
        errorMessage = 'The check-in process took too long and timed out. Please try again.';
      } else if (error.message.includes('already occupied') || error.message.includes('not available')) {
        errorMessage = error.message; // Keep our custom validation errors
      }
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
