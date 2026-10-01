"use client";

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';

export default function TopSearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get('search') || '');

  const searchString = searchParams.toString();

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchString);
      if (value) {
        params.set('search', value);
      } else {
        params.delete('search');
      }

      const newQueryString = params.toString();

      if (searchString !== newQueryString) {
        router.replace(`${pathname}?${newQueryString}`, { scroll: false });
      }
    }, 150);

    return () => clearTimeout(timeout);
  }, [value, pathname, router, searchString]);

  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      </div>
      <input 
        type="text" 
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search guests, rooms, reservations, staff..." 
        className="w-full bg-gray-100/70 border border-transparent rounded-full pl-11 pr-4 py-2.5 text-sm font-medium text-gray-700 placeholder-gray-400 focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-300 shadow-inner" 
      />
    </div>
  );
}
