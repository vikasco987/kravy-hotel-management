import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kravy Hotel Management",
  description: "Manage your hotel rooms and bookings efficiently with Kravy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // A helper for static date in UI (for mockup purposes)
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#f4f1eb] text-gray-900 font-sans">
        <div className="flex h-screen overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Topbar */}
            <header className="flex h-16 items-center justify-between border-b border-[#e5dfd3] bg-[#fdfaf5] px-6 shrink-0">
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-900 rounded-md flex items-center justify-center text-white font-bold">K</div>
                    <div>
                      <h2 className="text-sm font-bold leading-tight">Grand Plaza</h2>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide">Vaikom Kottayam</p>
                    </div>
                 </div>
              </div>

              <div className="flex-1 max-w-xl px-8">
                 <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    <input type="text" placeholder="Search guests, rooms, reservations, staff..." className="w-full bg-[#f4f1eb] border-none rounded-md pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-gray-300 outline-none" />
                 </div>
              </div>

              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 text-sm text-gray-600 bg-[#f4f1eb] px-3 py-1.5 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                    {today}
                 </div>
                 
                 <div className="flex items-center gap-3">
                   <div className="h-9 w-9 rounded-full bg-gray-800 text-white flex items-center justify-center font-semibold text-sm">S</div>
                   <div className="flex flex-col">
                     <span className="text-sm font-semibold leading-tight">System Administrator</span>
                     <span className="text-[10px] text-gray-500">Full Ownership & Settings</span>
                   </div>
                 </div>
                 
                 <button className="bg-blue-600 text-white text-xs font-medium px-4 py-2 rounded-md hover:bg-blue-700 ml-2">Mobile App</button>
                 <button className="bg-red-600 text-white text-xs font-medium px-4 py-2 rounded-md hover:bg-red-700">Logout</button>
              </div>
            </header>
            
            {/* Main content */}
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
