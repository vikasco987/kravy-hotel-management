"use client";

import { usePathname } from 'next/navigation';
import TopSearchBar from "./TopSearchBar";
import { ChevronDown, Smartphone, LogOut } from 'lucide-react';
import Image from 'next/image';

export default function GlobalHeader({ today }: { today: string }) {
  const pathname = usePathname();
  
  if (pathname === '/dashboard/checkout' || pathname === '/dashboard/book' || pathname.includes('/dashboard/print/') || pathname.startsWith('/auth')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 flex h-[72px] items-center justify-between bg-white px-6 shrink-0 shadow-sm transition-all duration-300">
      {/* Logo Area */}
      <div className="flex items-center gap-3 w-[280px]">
        <div className="flex items-center justify-center w-10 h-10 overflow-hidden rounded-full border border-gray-200">
           {/* Placeholder for actual hotel image */}
           <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100&q=80" alt="Hotel" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col justify-center">
          <h2 className="text-[15px] font-extrabold tracking-tight text-gray-900 leading-tight">Grand Plaza</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            <p className="text-[11px] text-gray-500 font-medium">Hotel Management</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-[500px] px-4 hidden md:block">
        <TopSearchBar />
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center justify-end gap-5 flex-1">
        {/* Date Pill */}
        <div className="hidden xl:flex items-center gap-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm cursor-default">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          {today}
        </div>
        
        {/* User Profile */}
        <div className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition">
          <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-indigo-50">SA</div>
          <div className="hidden lg:flex flex-col justify-center">
            <span className="text-[13px] font-bold text-gray-900">System Administrator</span>
            <span className="text-[10px] text-gray-500 font-medium">Full Access & Settings</span>
          </div>
          <ChevronDown size={14} className="text-gray-400 ml-1" />
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button className="bg-white border border-gray-200 text-gray-700 text-xs font-bold px-3 py-2 rounded-full hover:bg-gray-50 transition-colors flex items-center gap-1.5">
            <Smartphone size={14} className="text-gray-500" />
            App
          </button>
          <button className="bg-rose-50 text-rose-600 text-xs font-bold px-3 py-2 rounded-full hover:bg-rose-100 transition-colors flex items-center gap-1.5">
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
