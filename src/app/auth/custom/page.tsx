"use client";

import React, { useState, useEffect } from 'react';
import { Mail, Phone, Lock, User, ArrowRight, ShieldCheck, RefreshCw, KeyRound, Eye, EyeOff, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function CustomAuthPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'verify' | 'forgot' | 'reset'>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const errorStr = urlParams.get("error");
      if (errorStr === "session_expired") {
        toast.error("Your session has expired. Please login again to continue.");
        // Clean URL without refreshing page
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (errorStr) {
        toast.error(errorStr);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    newPassword: '',
    otp: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // ✅ Phone Validation: Numbers only, max 10 digits
    if (name === 'phone') {
      const cleaned = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, [name]: cleaned });
      return;
    }

    // ✅ OTP Validation: Numbers only, max 6 digits
    if (name === 'otp') {
      const cleaned = value.replace(/\D/g, '').slice(0, 6);
      setFormData({ ...formData, [name]: cleaned });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (formData.phone.length !== 10) {
          toast.error("Please enter a valid 10-digit phone number.");
          setLoading(false);
          return;
        }
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        const responseText = await res.text();
        let data: any = {};
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error("RAW_RESPONSE_ERROR:", responseText);
          throw new Error(`Server Error (${res.status}): ${responseText.substring(0, 50)}...`);
        }

        if (!res.ok) {
          if (data.needsVerification) {
            setMode('verify');
            setFormData(prev => ({ ...prev, email: data.email || prev.email }));
            toast.info(data.error || "Verification required");
            return;
          }
          throw new Error(data.error || "Failed to register");
        }
        toast.success("OTP sent to your email!");
        setMode('verify');
      } 
      else if (mode === 'verify') {
        const cleanEmail = formData.email.trim().toLowerCase();
        console.log("[DEBUG_AUTH] Verifying OTP for:", cleanEmail, "OTP:", formData.otp);
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, otp: formData.otp })
        });
        const data = await res.json().catch(() => ({ error: "Invalid server response" }));
        console.log("[DEBUG_AUTH] Verification Response:", data);
        if (!res.ok) throw new Error(data.error || "Verification failed");
        toast.success("Account verified! Please login.");
        setMode('login');
      }
      else if (mode === 'login') {
        const identifier = (formData.email || formData.phone).trim().toLowerCase();
        console.log("[DEBUG_AUTH] Attempting Login with identifier:", identifier);
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password: formData.password })
        });
        const data = await res.json().catch(() => ({ error: "Invalid server response" }));
        console.log("[DEBUG_AUTH] Login Response:", data);
        if (!res.ok) {
          if (data.notVerified) {
            console.log("[DEBUG_AUTH] User not verified. Switching to verify mode with email:", data.email);
            setMode('verify');
            setFormData(prev => ({ ...prev, email: data.email || prev.email }));
            toast.info(data.error || "Not verified");
            return;
          }
          throw new Error(data.error || "Login failed");
        }
        toast.success("Logged in successfully!");
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      }
      else if (mode === 'forgot') {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email })
        });
        const data = await res.json().catch(() => ({ error: "Invalid server response" }));
        if (!res.ok) throw new Error(data.error || "Request failed");
        toast.success("Reset OTP sent to your email!");
        setMode('reset');
      }
      else if (mode === 'reset') {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: formData.email, 
            otp: formData.otp, 
            newPassword: formData.newPassword 
          })
        });
        const data = await res.json().catch(() => ({ error: "Invalid server response" }));
        if (!res.ok) throw new Error(data.error || "Reset failed");
        toast.success("Password reset successfully! Please login.");
        setMode('login');
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!formData.email) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Resend failed");
      toast.success("New OTP sent to your email!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 selection:bg-emerald-500/30">
      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            {mode === 'forgot' || mode === 'reset' ? <KeyRound className="text-blue-500" size={32} /> : <ShieldCheck className="text-emerald-500" size={32} />}
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            {mode === 'login' ? 'Welcome Back' : 
             mode === 'signup' ? 'Create Account' : 
             mode === 'verify' ? 'Verify Email' : 
             mode === 'forgot' ? 'Reset Password' : 'New Password'}
          </h1>
          <p className="text-white/50 text-sm mt-2">
            {mode === 'login' ? 'Login to manage your business' : 
             mode === 'signup' ? 'Join the next-gen POS system' : 
             mode === 'forgot' ? 'Enter your email to receive OTP' :
             mode === 'reset' ? 'Enter OTP and your new password' :
             'Enter the 6-digit code sent to your email'}
          </p>
        </div>

        <form onSubmit={handleAction} className="space-y-4">
          {(mode === 'signup') && (
            <div className="relative group animate-in slide-in-from-top-2">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all"
              />
            </div>
          )}

          {(mode === 'signup' || mode === 'forgot' || mode === 'reset') && (
            <div className="relative group animate-in slide-in-from-top-2">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all"
              />
            </div>
          )}

          {mode === 'signup' && (
            <div className="relative group animate-in slide-in-from-top-2">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                required
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all"
              />
            </div>
          )}

          {mode === 'login' && (
            <div className="relative group animate-in slide-in-from-top-2">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input
                type="text"
                name="email"
                placeholder="Email or Phone Number"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all"
              />
            </div>
          )}

          {(mode === 'login' || mode === 'signup') && (
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          )}

          {mode === 'login' && (
            <div className="flex justify-end px-1">
              <button 
                type="button" 
                onClick={() => setMode('forgot')}
                className="text-xs font-bold text-white/30 hover:text-emerald-500 transition-colors uppercase tracking-widest"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {mode === 'reset' && (
            <div className="relative group animate-in slide-in-from-bottom-2">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                name="newPassword"
                placeholder="New Password"
                required
                value={formData.newPassword}
                onChange={handleInputChange}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          )}

          {(mode === 'verify' || mode === 'reset') && (
            <div className="space-y-4 animate-in zoom-in-95">
              {mode === 'verify' && (
                <div className="relative group">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    disabled
                    value={formData.email}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-4 pr-4 text-white/40 focus:outline-none transition-all cursor-not-allowed text-sm"
                  />
                </div>
              )}
              <div className="relative group">
                <input
                  type="text"
                  name="otp"
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoFocus
                  value={formData.otp}
                  onChange={handleInputChange}
                  className={`w-full ${mode === 'reset' ? 'bg-blue-500/5 border-blue-500/20 text-blue-500' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500'} border-2 rounded-2xl py-5 px-4 text-center text-3xl font-black tracking-[0.5em] placeholder:text-white/5 focus:outline-none transition-all`}
                />
              </div>
              {mode === 'verify' && (
                <div className="flex justify-center">
                  <button 
                    type="button" 
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="text-[10px] font-black text-white/30 hover:text-emerald-500 transition-colors uppercase tracking-[0.2em]"
                  >
                    Didn't receive code? Resend
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${mode === 'forgot' || mode === 'reset' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'} disabled:opacity-50 text-[#0a0a0a] font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg`}
          >
            {loading ? <RefreshCw className="animate-spin" size={20} /> : (
              <>
                {mode === 'login' ? 'Login' : 
                 mode === 'signup' ? 'Create Account' : 
                 mode === 'forgot' ? 'Send OTP' :
                 mode === 'reset' ? 'Reset Password' : 'Verify & Activate'}
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {/* Helper links */}
          <div className="mt-8 text-center text-sm">
            {mode === 'login' ? (
              <p className="text-white/40 font-medium">
                Don't have an account?{' '}
                <button onClick={() => setMode('signup')} className="text-emerald-500 font-bold hover:underline ml-1">Sign Up</button>
              </p>
            ) : mode === 'signup' ? (
              <p className="text-white/40 font-medium">
                Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-emerald-500 font-bold hover:underline ml-1">Log In</button>
              </p>
            ) : (
              <button onClick={() => { setMode('login'); setShowPassword(false); }} className="text-white/20 text-xs mt-4 hover:text-white/40 transition-colors uppercase tracking-widest font-bold">Back to Login</button>
            )}
          </div>
          
          {/* Support Info */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-4">Need Help?</p>
            <div className="flex flex-col gap-3">
              <a href="tel:+919403893991" className="flex items-center justify-center gap-2 text-white/50 hover:text-emerald-500 transition-colors text-xs font-bold bg-white/5 py-2 rounded-xl border border-white/5">
                <Phone size={14} /> Call Support: +91 9403893991
              </a>
              <a href="https://wa.me/919289507882" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-white/50 hover:text-emerald-500 transition-colors text-xs font-bold bg-white/5 py-2 rounded-xl border border-white/5">
                <MessageSquare size={14} /> WhatsApp: +91 9289507882
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
