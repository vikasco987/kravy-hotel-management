"use client";

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useProfileCache } from '@/hooks/useProfileCache';
import {
  Home,
  BedDouble,
  CalendarDays,
  User,
  Sparkles,
  UtensilsCrossed,
  MessageCircle,
  Users,
  Building2,
  BarChart3,
  Wallet,
  Settings,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  LogOut
} from 'lucide-react';

const MENU_ITEMS = [
  { name: 'Dashboard', icon: Home, href: '/dashboard' },
  { name: 'Rooms', icon: BedDouble, href: '/dashboard/rooms' },
  { name: 'Reservations', icon: CalendarDays, href: '/dashboard/reservations' },
  { name: 'Check-in / Check-out', icon: User, href: '/dashboard/checkin' },
  { name: 'Housekeeping', icon: Sparkles, href: '/dashboard/housekeeping' },
  { name: 'Restaurant', icon: UtensilsCrossed, href: '/dashboard/restaurant' },
  { name: 'WhatsApp', icon: MessageCircle, href: '/dashboard/whatsapp' },
  { name: 'Staff', icon: Users, href: '/dashboard/staff' },
  { name: 'Floors', icon: Building2, href: '/dashboard/floors' },
  { name: 'Reports', icon: BarChart3, href: '/dashboard/reports' },
  { name: 'Expenses & P&L', icon: Wallet, href: '/dashboard/expenses' },
  { name: 'Extra Services', icon: Sparkles, href: '/dashboard/services' },
  { name: 'Settings', icon: Settings, href: '/dashboard/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticPath, setOptimisticPath] = useState(pathname);
  const { profile } = useProfileCache();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setUser(data);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    // Keep optimistic path synchronized with actual pathname when route finishes changing
    const id = setTimeout(() => {
      setOptimisticPath(pathname);
    }, 0);
    return () => clearTimeout(id);
  }, [pathname]);

  const handleLogout = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/auth/login');
        router.refresh();
      } catch (err) {
        console.error("Logout failed", err);
      }
    }
  };

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

    // Check active based on the same logic used for rendering
    const isAlreadyActive = optimisticPath === href || (href !== '/dashboard' && optimisticPath.startsWith(href));

    if (isAlreadyActive) {
      e.preventDefault();
      return;
    }

    // Set optimistic path to update sidebar UI instantly.
    setOptimisticPath(href);
  };

  // Hide sidebar completely on specific pages like invoice print
  if (pathname.includes('/print/invoice') || pathname === '/dashboard/checkout' || pathname === '/dashboard/book' || pathname.startsWith('/auth')) {
    return null;
  }

  return (
    <aside className="w-[264px] bg-[#070814] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1d1238]/60 via-[#0a0a1a] to-[#04050d] text-slate-300 h-screen flex flex-col shrink-0 border-r border-[#1e1b38]/60 shadow-[8px_0_30px_-10px_rgba(0,0,0,0.8)] select-none">
      {/* Top Header: Logo, Kravy brand, and Collapse toggle icon */}
      <div className="h-[74px] flex items-center justify-between px-5 pt-2 shrink-0">
        <div className="flex items-center gap-3">
          {/* Logo Mark: Stylized vibrant neon purple-indigo K */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7928ca] via-[#6366f1] to-[#38bdf8] p-[1.5px] shadow-[0_0_18px_rgba(121,40,202,0.45)] shrink-0 flex items-center justify-center">
            <div className="w-full h-full bg-[#0c0d1c] rounded-[10px] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">
                <path
                  d="M5 4.5V19.5M5 12L15 4.5M9.5 12L16.5 19.5"
                  stroke="url(#kravy-gradient)"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <defs>
                  <linearGradient id="kravy-gradient" x1="5" y1="4.5" x2="16.5" y2="19.5" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#c084fc" />
                    <stop offset="0.5" stopColor="#818cf8" />
                    <stop offset="1" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-white text-lg font-black tracking-tight leading-tight">Kravy</span>
            <span className="text-[10px] font-medium text-slate-400 tracking-wide leading-none mt-0.5">Hotel Management</span>
          </div>
        </div>

        {/* Collapse toggle icon button */}
        <div className="w-8 h-8 rounded-lg bg-[#14152b]/80 border border-[#2b2552]/70 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer shadow-inner">
          <ChevronLeft size={16} strokeWidth={2.2} />
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-3.5 space-y-1.5 scrollbar-thin scrollbar-thumb-purple-950/40 scrollbar-track-transparent">
        {MENU_ITEMS.map((item) => {
          const isActive = optimisticPath === item.href || (item.href !== '/dashboard' && optimisticPath.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => handleNav(e, item.href)}
              prefetch={true}
              className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-[13px] font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-[#4f2bd1] via-[#5c37e6] to-[#7042f5] text-white shadow-[0_0_24px_rgba(99,48,230,0.6)] border border-[#9b6df7]/50'
                  : 'text-slate-300/90 hover:text-white hover:bg-[#15132c]/75 border border-transparent hover:border-[#2f275e]/40'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Icon box with rounded semi-transparent border matching reference */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  isActive
                    ? 'bg-white/20 text-white shadow-inner'
                    : 'bg-[#14142b]/90 text-slate-300 border border-[#25224a]/80 group-hover:border-purple-500/30 group-hover:text-white'
                }`}>
                  <item.icon size={16} strokeWidth={isActive ? 2.3 : 1.8} />
                </div>
                <span className="truncate tracking-tight">{item.name}</span>
              </div>

              {/* Right side: Loading indicator or Chevron */}
              <div className="flex items-center gap-2 shrink-0">
                {isPending && isActive ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ChevronRight
                    size={15}
                    strokeWidth={2.2}
                    className={`transition-transform duration-200 ${
                      isActive ? 'text-white/90' : 'text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5'
                    }`}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Area: Property Selector, Administrator Profile, Logout */}
      <div className="p-3.5 pt-1 space-y-2.5 shrink-0 border-t border-[#1a1738]/60 bg-[#060712]/70 backdrop-blur-md">
        {/* Highlighted Property Card */}
        <Link
          href="/dashboard/profile"
          className="group block rounded-2xl bg-gradient-to-b from-[#11132e] to-[#0c0d22] border border-[#292659] p-2.5 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(112,66,245,0.25)] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-[#3b366e] flex items-center justify-center shadow-md">
                {profile?.logoUrl ? (
                  <img src={profile.logoUrl} alt="Property" className="w-full h-full object-cover" />
                ) : (
                  <img
                    src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100&q=80"
                    alt="Grand Plaza"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-white text-xs font-extrabold tracking-tight truncate flex items-center gap-1.5">
                  <span>{profile?.businessName || "My Business"}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                  {profile?.tagLine || "Grand Plaza"}
                </div>
              </div>
            </div>
            <ChevronDown size={15} className="text-slate-400 group-hover:text-white transition shrink-0" />
          </div>
        </Link>

        {/* Administrator Profile Row */}
        <Link
          href="/dashboard/profile"
          className="group flex items-center justify-between p-2 rounded-xl hover:bg-[#15132c]/80 transition cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar with active online dot badge */}
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#5833e8] to-[#8651f8] text-white flex items-center justify-center font-black text-xs shadow-[0_0_12px_rgba(102,48,230,0.5)]">
                {user?.name ? user.name.substring(0, 2).toUpperCase() : "SA"}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#070814] shadow-[0_0_6px_#10b981]" />
            </div>
            <div className="min-w-0">
              <div className="text-white text-xs font-bold truncate">
                {user?.name || "System Administrator"}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                Full Access & Settings
              </div>
            </div>
          </div>
          <ChevronRight size={15} className="text-slate-500 group-hover:text-slate-300 transition shrink-0" />
        </Link>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          type="button"
          className="w-full py-2.5 px-4 rounded-2xl bg-[#170a14] hover:bg-[#250d1d] border border-[#4a1428] hover:border-rose-500/60 text-[#f43f5e] hover:text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-[0_0_16px_rgba(225,29,72,0.15)] group active:scale-[0.99]"
        >
          <LogOut size={15} className="text-[#f43f5e] group-hover:rotate-6 transition-transform" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
