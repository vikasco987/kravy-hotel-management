const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/book/page.tsx', 'utf8');

const oldUseEffect = `  useEffect(() => {
    if (roomsParam) {
      const roomIds = roomsParam.split(",");
      setRooms(roomIds);
      
      setIsFetching(true);
      setFetchError(null);
      
      // Fetch actual room data
      fetch(\`/api/hotel/rooms/bulk?ids=\${roomsParam}\`)
        .then(res => res.json())
        .then(data => {
          if (data.rooms && data.rooms.length > 0) {
            setFetchedRooms(data.rooms);
          } else {
            // Fallback to dummy data for mock rooms from dashboard
            const fallbackRooms = roomIds.map(id => ({
              id: id,
              roomNumber: id.startsWith('room-') ? id.replace('room-', '') : id,
              roomType: { basePrice: 300000 } // 3000.00 in paise
            }));
            setFetchedRooms(fallbackRooms);
            if (data.error) setFetchError(data.error);
          }
        })
        .catch(err => {
            // Fallback on fetch error
            const fallbackRooms = roomIds.map(id => ({
              id: id,
              roomNumber: id.startsWith('room-') ? id.replace('room-', '') : id,
              roomType: { basePrice: 250000 } // 2500.00 in paise
            }));
            setFetchedRooms(fallbackRooms);
            setFetchError(err.message);
        })
        .finally(() => setIsFetching(false));
    }
  }, [roomsParam]);`;

const newUseEffect = `  const resIdParam = searchParams.get("resId");

  useEffect(() => {
    if (resIdParam) {
      setIsFetching(true);
      setFetchError(null);
      fetch(\`/api/hotel/reservations/\${resIdParam}\`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.reservation) {
             const resRecord = data.reservation;
             const roomRecords = data.roomDetails || [];
             setRooms(roomRecords.map((r: any) => r.id));
             setFetchedRooms(roomRecords);
             
             const pricing: any = {};
             const guestsInfo: any = {};
             
             resRecord.rooms.forEach((rr: any) => {
                const discount = rr.baseRate - (rr.appliedRate || rr.baseRate);
                pricing[rr.roomId] = {
                   baseRate: rr.baseRate,
                   discountAmount: discount > 0 ? discount : 0,
                   extraChargesAmount: 0,
                   cgstAmount: 0,
                   sgstAmount: 0,
                   finalAmount: (rr.appliedRate || rr.baseRate),
                   nights: rr.nights || 1
                };
                
                if (rr.guestsData && Array.isArray(rr.guestsData) && rr.guestsData.length > 0) {
                   guestsInfo[rr.roomId] = rr.guestsData;
                } else {
                   guestsInfo[rr.roomId] = [{
                      name: resRecord.guest?.name || "",
                      phone: resRecord.guest?.phone || "",
                      documentType: "",
                      documentNumber: "",
                      documentUrl: null,
                      isLead: true
                   }];
                }
             });
             setRoomPricing(pricing);
             setRoomGuests(guestsInfo);
             setAdvancePaid((resRecord.advancePaid / 100).toString());
          } else {
             setFetchError("Reservation not found");
          }
        })
        .catch(err => setFetchError(err.message))
        .finally(() => setIsFetching(false));
    } else if (roomsParam) {
      const roomIds = roomsParam.split(",");
      setRooms(roomIds);
      
      setIsFetching(true);
      setFetchError(null);
      
      fetch(\`/api/hotel/rooms/bulk?ids=\${roomsParam}\`)
        .then(res => res.json())
        .then(data => {
          if (data.rooms && data.rooms.length > 0) {
            setFetchedRooms(data.rooms);
          } else {
            const fallbackRooms = roomIds.map(id => ({
              id: id,
              roomNumber: id.startsWith('room-') ? id.replace('room-', '') : id,
              roomType: { basePrice: 300000 }
            }));
            setFetchedRooms(fallbackRooms);
            if (data.error) setFetchError(data.error);
          }
        })
        .catch(err => {
            const fallbackRooms = roomIds.map(id => ({
              id: id,
              roomNumber: id.startsWith('room-') ? id.replace('room-', '') : id,
              roomType: { basePrice: 250000 }
            }));
            setFetchedRooms(fallbackRooms);
            setFetchError(err.message);
        })
        .finally(() => setIsFetching(false));
    }
  }, [roomsParam, resIdParam]);`;

c = c.replace(oldUseEffect, newUseEffect);

// And append reservationId to the handleCheckIn payload!
const oldPayload = `        body: JSON.stringify({
          roomIds: rooms,
          roomPricing: roomPricing,
          roomGuests: roomGuests,
          totalAmount: totalAmount,
          advancePaid: parseFloat(advancePaid) || 0,
          paymentMode: paymentMode,
          checkInDate: checkInDate,
          checkOutDate: checkOutDate
        })`;

const newPayload = `        body: JSON.stringify({
          reservationId: searchParams.get("resId"),
          roomIds: rooms,
          roomPricing: roomPricing,
          roomGuests: roomGuests,
          totalAmount: totalAmount,
          advancePaid: parseFloat(advancePaid) || 0,
          paymentMode: paymentMode,
          checkInDate: checkInDate,
          checkOutDate: checkOutDate
        })`;

c = c.replace(oldPayload, newPayload);

fs.writeFileSync('src/app/dashboard/book/page.tsx', c);
