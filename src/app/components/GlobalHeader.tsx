"use client";

import { Suspense, useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import TopSearchBar from "./TopSearchBar";
import { ChevronDown, LogOut, Building, User, ShieldCheck } from 'lucide-react';
import { useProfileCache } from '@/hooks/useProfileCache';

function getInitials(name?: string | null): string {
  if (!name) return "H";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function GlobalHeader({ today }: { today: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useProfileCache();
  const [imgError, setImgError] = useState(false);
  const [currentDate, setCurrentDate] = useState(today);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Format date in client's local browser timezone
    try {
      const now = new Date();
      const formatted = now.toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      if (formatted) {
        setCurrentDate(formatted);
      }
    } catch {
      // Keep today prop fallback
    }
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setUser(data);
        }
      })
      .catch((err) => console.error("Failed to fetch user in GlobalHeader:", err));
  }, []);

  useEffect(() => {
    setImgError(false);
  }, [profile?.logoUrl]);

  // Handle outside click and Escape key to close menu
  useEffect(() => {
    if (!menuOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/auth/custom';
      } catch (err) {
        console.error("Logout failed", err);
        window.location.href = '/auth/custom';
      }
    }
  };

  if (pathname === '/dashboard/checkout' || pathname === '/dashboard/book' || pathname.includes('/dashboard/print/') || pathname.startsWith('/auth')) {
    return null;
  }

  const businessName = profile?.businessName || "My Hotel";
  const logoUrl = profile?.logoUrl;
  const initials = getInitials(businessName);
  const isStaff = !!user?.isStaff;
  const userInitials = user?.name ? getInitials(user.name) : "SA";
  const userName = user?.name || (isStaff ? "Staff Member" : "System Administrator");
  const userSubtitle = isStaff ? (user?.role || "Staff Member") : "Full Access & Settings";

  return (
    <header className="sticky top-0 z-50 flex h-[72px] items-center justify-between bg-white px-6 shrink-0 shadow-sm transition-all duration-300">
      {/* Logo Area */}
      <div className="flex items-center gap-3 w-[280px]">
        <div className="flex items-center justify-center w-10 h-10 overflow-hidden rounded-full border border-gray-200 bg-indigo-50 text-indigo-700 font-black text-sm shrink-0">
          {logoUrl && !imgError ? (
            <img
              src={logoUrl}
              alt={businessName}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="flex flex-col justify-center min-w-0">
          <h2 className="text-[15px] font-extrabold tracking-tight text-gray-900 leading-tight truncate">
            {businessName}
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
            <p className="text-[11px] text-gray-500 font-medium truncate">
              {profile?.businessTagLine || profile?.tagLine || profile?.businessType || "Hotel Management"}
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-[500px] px-4 hidden md:block">
        <Suspense fallback={<div className="h-10 w-full bg-gray-100/70 rounded-full animate-pulse" />}>
          <TopSearchBar />
        </Suspense>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center justify-end gap-5 flex-1">
        {/* Date Pill */}
        <div className="hidden xl:flex items-center gap-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm cursor-default">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          {currentDate}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-100/80 p-1.5 rounded-xl transition text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-indigo-50 shrink-0">
              {userInitials}
            </div>
            <div className="hidden lg:flex flex-col justify-center">
              <span className="text-[13px] font-bold text-gray-900 leading-tight truncate max-w-[150px]">
                {userName}
              </span>
              <span className="text-[10px] text-gray-500 font-medium leading-tight truncate max-w-[150px]">
                {userSubtitle}
              </span>
            </div>
            <ChevronDown
              size={14}
              className={`text-gray-400 ml-1 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Accessible Dropdown Card */}
          {menuOpen && (
            <div
              role="menu"
              aria-orientation="vertical"
              className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-gray-100 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-black/5"
            >
              {/* Account Header */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60 rounded-t-xl mb-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</p>
                <p className="text-sm font-bold text-gray-900 truncate mt-0.5">{userName}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || (isStaff ? "Staff Account" : "Owner / Administrator")}</p>
              </div>

              {/* Navigation Options */}
              <div className="px-1.5 space-y-0.5">
                <Link
                  href="/dashboard/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:text-indigo-600 hover:bg-indigo-50/70 rounded-xl transition-colors"
                  role="menuitem"
                >
                  <Building size={15} className="text-gray-400 group-hover:text-indigo-600" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-gray-800">Business Profile</span>
                    <span className="text-[10px] text-gray-400 font-medium truncate">{businessName} details & logo</span>
                  </div>
                </Link>

                {!isStaff && (
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:text-indigo-600 hover:bg-indigo-50/70 rounded-xl transition-colors"
                    role="menuitem"
                  >
                    <ShieldCheck size={15} className="text-gray-400" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-gray-800">Administrator Access</span>
                      <span className="text-[10px] text-gray-400 font-medium">Hotel configuration & settings</span>
                    </div>
                  </Link>
                )}
              </div>

              {/* Divider & Sign Out */}
              <div className="my-1.5 border-t border-gray-100 pt-1 px-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left cursor-pointer"
                  role="menuitem"
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            type="button"
            className="bg-rose-50 text-rose-600 text-xs font-bold px-3 py-2 rounded-full hover:bg-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
