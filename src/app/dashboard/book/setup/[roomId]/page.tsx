'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import RoomSetupModal from '../../RoomSetupModal';
import { useBookingStore } from '@/lib/bookingContext';

export default function SetupRoomPage() {
  const router = useRouter();
  const params = useParams();
  
  const roomId = params.roomId as string;
  const { roomPricing, roomGuests, checkInDate, checkOutDate, setRoomPricing, setRoomGuests, setCheckInDate, setCheckOutDate } = useBookingStore();

  const handleSave = (snapshot: any, guests: any) => {
    setRoomPricing(prev => ({ ...prev, [roomId]: snapshot }));
    setRoomGuests(prev => ({ ...prev, [roomId]: guests }));
  };

  const handleClose = () => {
    router.back();
  };

  if (!roomId) return null;

  return (
    <RoomSetupModal
      roomNo={roomId}
      checkInDate={checkInDate}
      checkOutDate={checkOutDate}
      initialData={roomPricing[roomId]}
      initialGuests={roomGuests[roomId]}
      onClose={handleClose}
      onSave={handleSave}
      onCheckInDateChange={setCheckInDate}
      onCheckOutDateChange={setCheckOutDate}
    />
  );
}
