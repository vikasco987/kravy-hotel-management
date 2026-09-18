import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TopSearchBar from "./components/TopSearchBar";


const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

import { Fraunces } from "next/font/google";
const fraunces = Fraunces({
  variable: "--font-fraunces",
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
    <html lang="en" className={`${inter.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#f4f1eb] text-gray-900 font-sans">
        <div className="flex h-screen overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Topbar */}
            <header className="sticky top-0 z-50 flex h-20 items-center justify-between border-b border-gray-200/60 bg-white/80 px-8 shrink-0 backdrop-blur-xl shadow-sm transition-all duration-300">
              {/* Logo Area */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 group cursor-pointer">
                  <div className="w-11 h-11 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-gray-900/20 group-hover:scale-105 transition-transform duration-300 ring-2 ring-white">K</div>
                  <div className="flex flex-col">
                    <h2 className="text-base font-extrabold tracking-tight text-gray-900 group-hover:text-blue-600 transition-colors duration-300">Grand Plaza</h2>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Vaikom Kottayam</p>
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex-1 max-w-2xl px-8 hidden md:block">
                <TopSearchBar />
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center gap-6">
                {/* Date Pill */}
                <div className="hidden xl:flex items-center gap-2 text-xs font-bold text-gray-600 bg-white border border-gray-100 px-4 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all duration-300 cursor-default ring-1 ring-gray-900/5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                  {today}
                </div>
                
                <div className="flex items-center gap-4 border-l border-gray-200 pl-6">
                  {/* User Profile */}
                  <div className="flex items-center gap-3 cursor-pointer group">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-white group-hover:scale-105 transition-transform duration-300">SA</div>
                    <div className="hidden lg:flex flex-col justify-center">
                      <span className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">System Administrator</span>
                      <span className="text-[10px] text-gray-500 font-semibold tracking-wide">Full Ownership & Settings</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 ml-2">
                    <button className="bg-white border border-gray-200 text-gray-700 text-xs font-bold px-4 py-2 rounded-full hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 shadow-sm transition-all duration-300 flex items-center gap-2 active:scale-95">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
                      App
                    </button>
                    <button className="bg-red-50 text-red-600 text-xs font-bold px-4 py-2 rounded-full hover:bg-red-600 hover:text-white shadow-sm transition-all duration-300 flex items-center gap-1.5 active:scale-95">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                      Logout
                    </button>
                  </div>
                </div>
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
