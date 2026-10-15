"use client";

import React, { useEffect, useState } from "react";
import { ShieldAlert, LogOut, ArrowLeft, RefreshCw, KeyRound, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NoAccessPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(d => {
        if (!d.error) {
          setUser(d);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/auth/custom";
    } catch (e) {
      console.error(e);
      window.location.href = "/auth/custom";
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-8 shadow-sm text-center animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
          <ShieldAlert size={32} />
        </div>

        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          No Page Access Assigned
        </h1>

        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          {user?.name ? (
            <>
              Hello <strong className="text-slate-800">{user.name}</strong>, your account is active, but you have not been granted access to any dashboard pages yet.
            </>
          ) : (
            "Your staff account is active, but your administrator has not assigned any accessible pages to your profile yet."
          )}
        </p>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 my-6 text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <KeyRound size={14} className="text-indigo-600 shrink-0" />
            <span>Granular Permission Policy</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-normal">
            Kravy enforces a strict deny-by-default access control model. Please request your Hotel Manager or Administrator to assign page permissions in the Staff Management directory.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
          >
            <RefreshCw size={14} />
            <span>Check Again</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
