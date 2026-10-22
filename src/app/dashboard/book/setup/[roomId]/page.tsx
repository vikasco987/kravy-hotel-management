'use client';

import React from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import RoomSetupModal from '../../RoomSetupModal';
import { useBookingStore } from '@/lib/bookingContext';

export default function SetupRoomPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const roomId = params.roomId as string;
  const basePriceParam = searchParams.get('basePrice');
  const roomNumberParam = searchParams.get('roomNumber');
  const defaultRent = basePriceParam ? (parseInt(basePriceParam) / 100).toString() : undefined;
  const taxRateParam = searchParams.get('taxRate');
  const taxModeParam = searchParams.get('taxMode') as 'INCLUSIVE' | 'EXCLUSIVE' | null;
  const taxEnabledParam = searchParams.get('taxEnabled');
  const initialTaxRate = taxRateParam ? parseInt(taxRateParam) : undefined;
  const initialTaxMode = taxModeParam || undefined;
  const taxEnabled = taxEnabledParam !== null ? taxEnabledParam !== 'false' : undefined;
  const displayRoomNo = roomNumberParam || roomId;

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
      roomNo={displayRoomNo}
      checkInDate={checkInDate}
      checkOutDate={checkOutDate}
      initialData={roomPricing[roomId]}
      initialGuests={roomGuests[roomId]}
      defaultRent={defaultRent}
      initialTaxRate={initialTaxRate}
      initialTaxMode={initialTaxMode}
      taxEnabled={taxEnabled}
      onClose={handleClose}
      onSave={handleSave}
      onCheckInDateChange={setCheckInDate}
      onCheckOutDateChange={setCheckOutDate}
    />
  );
}
