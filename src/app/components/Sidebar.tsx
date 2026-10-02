"use client";

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useProfileCache } from '@/hooks/useProfileCache';
import { 
  LayoutDashboard, 
  BedDouble, 
  CalendarDays, 
  UserCheck, 
  Sparkles, 
  UtensilsCrossed, 
  MessageCircle, 
  Users, 
  Building2, 
  BarChart3, 
  Wallet, 
  Settings,
  X,
  ChevronRight
} from 'lucide-react';

const MENU_ITEMS = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Rooms', icon: BedDouble, href: '/dashboard/rooms' },
  { name: 'Reservations', icon: CalendarDays, href: '/dashboard/reservations' },
  { name: 'Check-in / Check-out', icon: UserCheck, href: '/dashboard/checkin' },
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
    setOptimisticPath(pathname);
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
    // Do NOT call e.preventDefault() so Next.js native <Link> navigation continues,
    // which instantly triggers the loading.tsx fallback instead of blocking.
    setOptimisticPath(href);
  };
  
  // Hide sidebar completely on specific pages like invoice print
  if (pathname.includes('/print/invoice') || pathname === '/dashboard/checkout' || pathname === '/dashboard/book' || pathname.startsWith('/auth')) {
    return null;
  }

  return (
    <aside className="w-[260px] bg-[#0f172a] text-slate-300 h-screen flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-20 flex items-center px-6">
        <h1 className="text-white text-2xl font-black italic tracking-tight">Kravy</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        <ul className="space-y-1 px-3">
          {MENU_ITEMS.map((item) => {
            const isActive = optimisticPath === item.href || (item.href !== '/dashboard' && optimisticPath.startsWith(item.href));
            
            return (
              <li key={item.name}>
                <Link 
                  href={item.href}
                  onClick={(e) => handleNav(e, item.href)}
                  prefetch={true}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                      : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  {item.name}
                  {isPending && isActive && (
                    <div className="ml-auto w-3 h-3 border-2 border-indigo-200 border-t-white rounded-full animate-spin" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Profile Area */}
      <div className="p-4">
        {/* Property Box */}
        <Link href="/dashboard/profile" className="block cursor-pointer">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 mb-3 relative flex items-center gap-3 hover:bg-slate-800 transition">
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); /* optionally close sidebar */ }}
              className="absolute top-2 right-2 text-slate-500 hover:text-slate-300"
            >
               <X size={14} />
            </button>
            <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center shrink-0 border border-slate-600 overflow-hidden">
               {profile?.logoUrl ? (
                 <img src={profile.logoUrl} alt="Logo" className="w-full h-full object-cover" />
               ) : (
                 <Building2 size={20} className="text-slate-300" />
               )}
            </div>
            <div>
              <div className="text-white text-sm font-bold truncate max-w-[140px]">
                {profile?.businessName || "My Hotel"}
              </div>
              <div className="text-[10px] text-slate-400">Hotel & Room Management</div>
            </div>
          </div>
        </Link>
        
        {/* User Profile & Sign Out */}
        <div 
          onClick={handleLogout}
          className="flex items-center justify-between cursor-pointer hover:bg-slate-800 p-2 rounded-xl transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase">
              {user?.name?.substring(0, 2) || "AD"}
            </div>
            <div>
              <div className="text-white text-sm font-bold">{user?.name || "Admin"}</div>
              <div className="text-xs text-slate-400 group-hover:text-red-400 transition">Sign Out</div>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-500 group-hover:text-red-400" />
        </div>
      </div>
    </aside>
  );
}
