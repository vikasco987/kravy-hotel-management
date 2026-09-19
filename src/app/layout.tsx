import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import GlobalHeader from "./components/GlobalHeader";
import Sidebar from "./components/Sidebar";


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
        <div className="flex h-screen overflow-hidden bg-[#F4F6F9]">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden relative">
            {/* Topbar */}
            <GlobalHeader today={today} />
            
            {/* Main content */}
            <main className="flex-1 overflow-y-auto w-full">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
