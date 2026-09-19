import { BookingProvider } from '@/lib/bookingContext';
import React from 'react';

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return <BookingProvider>{children}</BookingProvider>;
}
