'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { RoomPricingSnapshot } from '@/app/dashboard/book/RoomSetupModal';

export interface GuestData {
  id: string;
  name: string;
  phone: string;
  age: string;
  gender: string;
  isLead: boolean;
  idUrl?: string;
  idNumber?: string;
  photoUrl?: string;
  idDocuments?: { url: string; number?: string }[];
  isVerified?: boolean;
  documentType?: string;
}

interface BookingContextType {
  roomPricing: Record<string, RoomPricingSnapshot>;
  roomGuests: Record<string, GuestData[]>;
  checkInDate: string;
  checkOutDate: string;
  setRoomPricing: React.Dispatch<React.SetStateAction<Record<string, RoomPricingSnapshot>>>;
  setRoomGuests: React.Dispatch<React.SetStateAction<Record<string, GuestData[]>>>;
  setCheckInDate: React.Dispatch<React.SetStateAction<string>>;
  setCheckOutDate: React.Dispatch<React.SetStateAction<string>>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [roomPricing, setRoomPricing] = useState<Record<string, RoomPricingSnapshot>>({});
  const [roomGuests, setRoomGuests] = useState<Record<string, GuestData[]>>({});
  
  const [checkInDate, setCheckInDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  const [checkOutDate, setCheckOutDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  return (
    <BookingContext.Provider value={{ roomPricing, roomGuests, checkInDate, checkOutDate, setRoomPricing, setRoomGuests, setCheckInDate, setCheckOutDate }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBookingStore() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBookingStore must be used within a BookingProvider');
  }
  return context;
}
