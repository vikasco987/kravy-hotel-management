"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  KeyRound,
  Eye,
  EyeOff,
  BedDouble,
  CalendarDays,
  Sparkles,
  Receipt,
  Crown,
  Users,
  CheckCircle2,
  Building2,
  Hotel,
  AlertCircle,
  Phone
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type AuthMode = "admin_login" | "staff_login" | "signup" | "verify" | "forgot" | "reset";

export default function CustomAuthPage() {
  const [mode, setMode] = useState<AuthMode>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("mode") === "admin") {
        return "admin_login";
      }
    }
    return "staff_login";
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const errorStr = urlParams.get("error");
      if (errorStr === "session_expired" || errorStr === "invalid_session") {
        const msg = "Your session has expired. Please sign in again to continue.";
        setErrorMessage(msg);
        toast.error(msg);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (errorStr) {
        setErrorMessage(errorStr);
        toast.error(errorStr);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Form States
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    newPassword: "",
    otp: "",
    identifier: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Clear previous error when user edits input
    if (errorMessage) {
      setErrorMessage(null);
    }

    // Phone Validation: Numbers only, max 10 digits
    if (name === "phone") {
      const cleaned = value.replace(/\D/g, "").slice(0, 10);
      setFormData({ ...formData, [name]: cleaned });
      return;
    }

    // OTP Validation: Numbers only, max 6 digits
    if (name === "otp") {
      const cleaned = value.replace(/\D/g, "").slice(0, 6);
      setFormData({ ...formData, [name]: cleaned });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  /**
   * Translates HTTP responses into secure, accurate, user-friendly messages.
   * Never leaks internal stack traces, DB queries, or credentials.
   */
  const resolveErrorMessage = (status: number, data: any): string => {
    if (status === 400) {
      return (typeof data?.error === "string" && data.error.trim())
        ? data.error
        : "Invalid request. Please check all required fields.";
    }
    if (status === 401) {
      return "Invalid email/phone or password. Please check your credentials and try again.";
    }
    if (status === 403) {
      return (typeof data?.error === "string" && data.error.trim())
        ? data.error
        : "Access denied. Your account is not authorized or has been deactivated.";
    }
    if (status === 500) {
      return "Something went wrong on the server. Please try again later.";
    }
    if (status === 502 || status === 503 || status === 504) {
      return "The server is temporarily unavailable. Please try again shortly.";
    }
    if (status >= 500) {
      return "The server is temporarily unavailable. Please try again shortly.";
    }
    return (typeof data?.error === "string" && data.error.trim())
      ? data.error
      : "Unable to complete request. Please verify details and try again.";
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submission while in progress
    if (loading) {
      return;
    }

    // Clear previous error on every new submit attempt
    setErrorMessage(null);
    setLoading(true);

    try {
      if (mode === "staff_login") {
        const identifier = (formData.identifier || formData.email || formData.phone).trim();
        if (!identifier || !formData.password) {
          const msg = "Please enter your email/phone and password.";
          setErrorMessage(msg);
          toast.error(msg);
          setLoading(false);
          return;
        }

        let res: Response;
        try {
          res = await fetch("/api/staff/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier, password: formData.password })
          });
        } catch {
          const networkErrorMsg = "The server is temporarily unavailable. Please try again shortly.";
          setErrorMessage(networkErrorMsg);
          toast.error(networkErrorMsg);
          setLoading(false);
          return;
        }

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          const errMsg = resolveErrorMessage(res.status, data);
          setErrorMessage(errMsg);
          toast.error(errMsg);
          setLoading(false);
          return;
        }

        toast.success(`Welcome back, ${data?.staff?.name || "Staff Member"}!`);
        setTimeout(() => {
          window.location.href = data?.redirectUrl || "/dashboard";
        }, 350);
      } else if (mode === "admin_login") {
        const identifier = (formData.identifier || formData.email || formData.phone).trim().toLowerCase();
        if (!identifier || !formData.password) {
          const msg = "Please enter your admin email/phone and password.";
          setErrorMessage(msg);
          toast.error(msg);
          setLoading(false);
          return;
        }

        let res: Response;
        try {
          res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier, password: formData.password })
          });
        } catch {
          const networkErrorMsg = "The server is temporarily unavailable. Please try again shortly.";
          setErrorMessage(networkErrorMsg);
          toast.error(networkErrorMsg);
          setLoading(false);
          return;
        }

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          if (data?.notVerified) {
            setMode("verify");
            setFormData(prev => ({ ...prev, email: data.email || prev.email }));
            const verificationMsg = data.error || "Account verification required.";
            setErrorMessage(verificationMsg);
            toast.info(verificationMsg);
            setLoading(false);
            return;
          }
          const errMsg = resolveErrorMessage(res.status, data);
          setErrorMessage(errMsg);
          toast.error(errMsg);
          setLoading(false);
          return;
        }

        toast.success("Signed in successfully as Administrator!");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 350);
      } else if (mode === "signup") {
        if (formData.phone.length !== 10) {
          const msg = "Please enter a valid 10-digit phone number.";
          setErrorMessage(msg);
          toast.error(msg);
          setLoading(false);
          return;
        }

        let res: Response;
        try {
          res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
          });
        } catch {
          const networkErrorMsg = "The server is temporarily unavailable. Please try again shortly.";
          setErrorMessage(networkErrorMsg);
          toast.error(networkErrorMsg);
          setLoading(false);
          return;
        }

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          if (data?.needsVerification) {
            setMode("verify");
            setFormData(prev => ({ ...prev, email: data.email || prev.email }));
            const verificationMsg = data.error || "Verification required";
            setErrorMessage(verificationMsg);
            toast.info(verificationMsg);
            setLoading(false);
            return;
          }
          const errMsg = resolveErrorMessage(res.status, data);
          setErrorMessage(errMsg);
          toast.error(errMsg);
          setLoading(false);
          return;
        }
        toast.success("OTP sent to your email!");
        setMode("verify");
      } else if (mode === "verify") {
        const cleanEmail = formData.email.trim().toLowerCase();
        let res: Response;
        try {
          res = await fetch("/api/auth/verify-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: cleanEmail, otp: formData.otp })
          });
        } catch {
          const networkErrorMsg = "The server is temporarily unavailable. Please try again shortly.";
          setErrorMessage(networkErrorMsg);
          toast.error(networkErrorMsg);
          setLoading(false);
          return;
        }

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const errMsg = resolveErrorMessage(res.status, data);
          setErrorMessage(errMsg);
          toast.error(errMsg);
          setLoading(false);
          return;
        }
        toast.success("Account verified! Please login.");
        setMode("admin_login");
      } else if (mode === "forgot") {
        let res: Response;
        try {
          res = await fetch("/api/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: formData.email })
          });
        } catch {
          const networkErrorMsg = "The server is temporarily unavailable. Please try again shortly.";
          setErrorMessage(networkErrorMsg);
          toast.error(networkErrorMsg);
          setLoading(false);
          return;
        }

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const errMsg = resolveErrorMessage(res.status, data);
          setErrorMessage(errMsg);
          toast.error(errMsg);
          setLoading(false);
          return;
        }
        toast.success("Reset OTP sent to your email!");
        setMode("reset");
      } else if (mode === "reset") {
        let res: Response;
        try {
          res = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: formData.email,
              otp: formData.otp,
              newPassword: formData.newPassword
            })
          });
        } catch {
          const networkErrorMsg = "The server is temporarily unavailable. Please try again shortly.";
          setErrorMessage(networkErrorMsg);
          toast.error(networkErrorMsg);
          setLoading(false);
          return;
        }

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const errMsg = resolveErrorMessage(res.status, data);
          setErrorMessage(errMsg);
          toast.error(errMsg);
          setLoading(false);
          return;
        }
        toast.success("Password reset successfully! Please sign in.");
        setMode("admin_login");
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      const fallbackMsg = "Something went wrong. Please try again.";
      setErrorMessage(fallbackMsg);
      toast.error(fallbackMsg);
    } finally {
      setLoading(false);
    }
  };

  const isStaffMode = mode === "staff_login";
  const isAdminMode = mode === "admin_login";
  const isSignInView = isStaffMode || isAdminMode;

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex font-sans text-slate-900 selection:bg-indigo-500/20">
      {/* ========================================================= */}
      {/* LEFT PROMOTIONAL PANEL (Branding, Hotel image, Feature Cards, Dashboard Mock) */}
      {/* ========================================================= */}
      <div className="hidden lg:flex lg:w-[54%] xl:w-[56%] relative flex-col justify-between p-10 xl:p-14 overflow-hidden bg-slate-950 text-white">
        {/* Background Image with Dark Vignette */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-hotel.jpg"
            alt="Luxury Hotel Room"
            className="w-full h-full object-cover object-center scale-105 filter brightness-[0.45] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-900/40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-transparent to-transparent" />
        </div>

        {/* Top: Hotel Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/95 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 border border-amber-400/40">
            <Hotel size={24} strokeWidth={2.4} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white">KRAVY</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400/90 block leading-tight">
              Hotel Management
            </span>
          </div>
        </div>

        {/* Center: Main Headline, Pitch & 4 Feature Cards */}
        <div className="relative z-10 my-auto py-6 max-w-xl">
          <span className="inline-block text-[11px] font-extrabold tracking-[0.2em] uppercase text-amber-400 mb-2.5">
            Smart Hotel Operations
          </span>
          <h1 className="text-4xl xl:text-[44px] font-black tracking-tight leading-[1.12] text-white">
            Manage your hotel <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400">
              smarter, everyday.
            </span>
          </h1>
          <p className="text-slate-300 text-sm xl:text-base mt-3 leading-relaxed font-normal max-w-lg">
            A complete hotel management platform to handle reservations, check-ins, housekeeping, billing and more — all in one place.
          </p>

          {/* 4 Feature Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-7">
            <div className="rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/10 p-3.5 flex flex-col justify-between hover:border-amber-400/40 transition">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2">
                <BedDouble size={16} />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Room Management</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block leading-tight">Live room status & inventory</span>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/10 p-3.5 flex flex-col justify-between hover:border-amber-400/40 transition">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                <CalendarDays size={16} />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Guest Reservations</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block leading-tight">Bookings & front-desk check-ins</span>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/10 p-3.5 flex flex-col justify-between hover:border-amber-400/40 transition">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-2">
                <Receipt size={16} />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Billing & Invoices</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block leading-tight">Fast, GST-compliant folios</span>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/10 p-3.5 flex flex-col justify-between hover:border-amber-400/40 transition">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2">
                <Sparkles size={16} />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Housekeeping</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block leading-tight">Cleaning tasks & inspections</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Genuine Application Dashboard Preview Card */}
        <div className="relative z-10 rounded-2xl bg-slate-900/90 backdrop-blur-lg border border-white/15 p-4 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-slate-300 ml-2">Kravy Hotel Operations Console</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active System
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-3">
            <div className="rounded-xl bg-white/5 p-2.5 border border-white/5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Available</span>
              <span className="text-base font-black text-emerald-400 block mt-0.5">Clean</span>
            </div>
            <div className="rounded-xl bg-white/5 p-2.5 border border-white/5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Occupied</span>
              <span className="text-base font-black text-blue-400 block mt-0.5">In House</span>
            </div>
            <div className="rounded-xl bg-white/5 p-2.5 border border-white/5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Dirty</span>
              <span className="text-base font-black text-rose-400 block mt-0.5">Queue</span>
            </div>
            <div className="rounded-xl bg-white/5 p-2.5 border border-white/5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Inspect</span>
              <span className="text-base font-black text-amber-400 block mt-0.5">Audit</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT SIGN-IN PANEL */}
      {/* ========================================================= */}
      <div className="w-full lg:w-[46%] xl:w-[44%] flex items-center justify-center p-6 sm:p-10 relative overflow-y-auto">
        <div className="w-full max-w-[430px] my-auto">
          {/* Top Logo for Mobile Screens */}
          <div className="flex lg:hidden items-center justify-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md">
              <Hotel size={22} strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <span className="text-lg font-black tracking-tight text-slate-900 block leading-tight">KRAVY</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block">Hotel Management</span>
            </div>
          </div>

          {/* Heading Icon & Welcome */}
          <div className="text-center mb-7">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
              {mode === "forgot" || mode === "reset" ? (
                <KeyRound size={26} />
              ) : isStaffMode ? (
                <Users size={26} className="text-indigo-600" />
              ) : (
                <Crown size={26} className="text-amber-600" />
              )}
            </div>

            <h2 className="text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight">
              {isSignInView ? "Welcome Back" :
               mode === "signup" ? "Create Admin Account" :
               mode === "verify" ? "Verify Email" :
               mode === "forgot" ? "Reset Password" : "New Password"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium">
              {isStaffMode ? "Sign in to your Kravy Hotel Management staff account." :
               isAdminMode ? "Sign in to your Kravy Hotel Management administrator account." :
               mode === "signup" ? "Register your hotel property management account." :
               mode === "forgot" ? "Enter your admin email to receive a recovery code." :
               mode === "reset" ? "Enter the verification code and your new password." :
               "Enter the 6-digit code sent to your email."}
            </p>
          </div>

          {/* Tab Selector: Admin Login vs Staff Login */}
          {isSignInView && (
            <div className="bg-slate-200/70 p-1 rounded-2xl flex items-center mb-6 border border-slate-300/50">
              <button
                type="button"
                onClick={() => {
                  setMode("admin_login");
                  setShowPassword(false);
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  isAdminMode
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Crown size={14} className={isAdminMode ? "text-amber-500" : "text-slate-400"} />
                <span>Admin Login</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("staff_login");
                  setShowPassword(false);
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  isStaffMode
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/25"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Users size={14} className={isStaffMode ? "text-white" : "text-slate-400"} />
                <span>Staff Login</span>
              </button>
            </div>
          )}

          {/* MAIN AUTH FORM */}
          <form onSubmit={handleAction} className="space-y-4">
            {/* Inline Error Banner */}
            {errorMessage && (
              <div
                role="alert"
                aria-live="assertive"
                className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5 shadow-xs transition-all animate-in fade-in slide-in-from-top-1 duration-200"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  {errorMessage}
                </div>
              </div>
            )}

            {/* Full Name (Sign Up only) */}
            {mode === "signup" && (
              <div className="relative group">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 block">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={17} />
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. Rahul Sharma"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition"
                  />
                </div>
              </div>
            )}

            {/* Email for Reset / Forgot / Sign Up */}
            {(mode === "signup" || mode === "forgot" || mode === "reset") && (
              <div className="relative group">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={17} />
                  <input
                    type="email"
                    name="email"
                    placeholder="name@hotel.com"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition"
                  />
                </div>
              </div>
            )}

            {/* 10-Digit Phone Number (Sign Up only) */}
            {mode === "signup" && (
              <div className="relative group">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 block">
                  10-Digit Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={17} />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="e.g. 9876543210"
                    maxLength={10}
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition"
                  />
                </div>
              </div>
            )}

            {/* Identifier (Email or Phone Number for Staff/Admin Login) */}
            {isSignInView && (
              <div className="relative group">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 block">
                  Email or Phone Number
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={17} />
                  <input
                    type="text"
                    name="identifier"
                    autoComplete="username"
                    placeholder={isStaffMode ? "Staff email or 10-digit phone" : "Admin email or phone"}
                    required
                    value={formData.identifier}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            {(isSignInView || mode === "signup") && (
              <div className="relative group">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={17} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-10 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Forgot Password Link - Only for Admin accounts where recovery flow exists */}
            {isAdminMode && (
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* Password Reset Input */}
            {mode === "reset" && (
              <div className="relative group">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 block">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={17} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="newPassword"
                    placeholder="Enter at least 6 characters"
                    required
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-10 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* OTP Verification Input */}
            {(mode === "verify" || mode === "reset") && (
              <div className="space-y-3 pt-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block text-center">
                  Enter 6-Digit OTP Code
                </label>
                <input
                  type="text"
                  name="otp"
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoFocus
                  value={formData.otp}
                  onChange={handleInputChange}
                  className="w-full bg-white border-2 border-indigo-200 focus:border-indigo-600 rounded-xl py-3.5 px-4 text-center text-2xl font-black tracking-[0.3em] text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition"
                />
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed ${
                isStaffMode
                  ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25"
              }`}
            >
              {loading ? (
                <RefreshCw className="animate-spin" size={18} />
              ) : (
                <>
                  <span>
                    {isStaffMode ? "Sign In as Staff" :
                     isAdminMode ? "Sign In as Admin" :
                     mode === "signup" ? "Create Account" :
                     mode === "forgot" ? "Send Recovery Code" :
                     mode === "reset" ? "Reset Password" : "Verify & Activate"}
                  </span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Secondary Option: Switch between Admin and Staff */}
            {isStaffMode && (
              <div className="pt-2 text-center">
                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400">
                    <span className="bg-[#F4F6FB] px-2">or</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMode("admin_login")}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Crown size={14} className="text-amber-500" />
                  <span>Login as Admin Instead</span>
                </button>
              </div>
            )}

            {isAdminMode && (
              <div className="pt-2 text-center">
                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400">
                    <span className="bg-[#F4F6FB] px-2">or</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMode("staff_login")}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Users size={14} className="text-indigo-600" />
                  <span>Login as Staff Member</span>
                </button>

                <p className="text-xs text-slate-500 mt-4">
                  New hotel property?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    Register Admin
                  </button>
                </p>
              </div>
            )}

            {/* Return from Forgot / Reset / Signup to Login */}
            {!isSignInView && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode("admin_login");
                    setShowPassword(false);
                  }}
                  className="text-xs text-slate-600 hover:text-slate-900 font-bold transition flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowRight size={14} className="rotate-180" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
