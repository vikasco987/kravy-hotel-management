"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  { name: 'Settings', icon: Settings, href: '/dashboard/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  
  // Hide sidebar completely on specific pages like invoice print
  if (pathname.includes('/print/invoice') || pathname === '/dashboard/checkout' || pathname === '/dashboard/book') {
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
            // For this mockup, we only have /dashboard actually working, so we consider it active if we are there.
            // In a real app, we check if pathname starts with the item href.
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            
            return (
              <li key={item.name}>
                <Link 
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                      : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Profile Area */}
      <div className="p-4">
        {/* Property Box */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 mb-3 relative flex items-center gap-3">
          <button className="absolute top-2 right-2 text-slate-500 hover:text-slate-300">
             <X size={14} />
          </button>
          <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center shrink-0 border border-slate-600">
             <Building2 size={20} className="text-slate-300" />
          </div>
          <div>
            <div className="text-white text-sm font-bold">Grand Plaza</div>
            <div className="text-[10px] text-slate-400">Hotel & Room Management</div>
          </div>
        </div>
        
        {/* User Profile */}
        <div className="flex items-center justify-between cursor-pointer hover:bg-slate-800 p-2 rounded-xl transition">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              VK
            </div>
            <div>
              <div className="text-white text-sm font-bold">Vikas Kushwaha</div>
              <div className="text-xs text-slate-400">Admin</div>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-500" />
        </div>
      </div>
    </aside>
  );
}
