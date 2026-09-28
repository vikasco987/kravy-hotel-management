import re

with open('src/app/auth/custom/page.tsx', 'r') as f:
    content = f.read()

new_return = """  return (
    <div className="min-h-screen bg-[#F8F6F1] flex font-sans selection:bg-[#0B6B57]/20 text-[#1C2421]">
      {/* Left Column: Image */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-[#0B6B57]">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B6B57]/90 via-[#0B6B57]/30 to-black/10 z-10" />
        <img 
          src="/login-bg.jpg" 
          alt="Luxury Hotel Lobby" 
          className="absolute inset-0 w-full h-full object-cover object-center scale-105 animate-[pulse_30s_ease-in-out_infinite_alternate]"
        />
        <div className="absolute bottom-16 left-16 right-16 z-20">
          <div className="mb-6">
            <h3 className="text-white font-black text-2xl tracking-tight">KRAVY</h3>
            <p className="text-[#C9A96E] text-xs font-bold tracking-[0.2em] uppercase mt-1">Hotel & Room Management</p>
          </div>
          <h2 className="text-5xl font-light text-white mb-4 leading-[1.1]">
            Manage Your Hotel.<br />
            <span className="font-bold">Elevate Every Stay.</span>
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-md font-light">
            Reservations, rooms, guests and operations — beautifully managed from one premium platform.
          </p>
          <div className="flex items-center gap-6 text-sm font-medium text-white/90">
            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#C9A96E]"></div>Reservations</div>
            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#C9A96E]"></div>Room Management</div>
            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#C9A96E]"></div>Guest Experience</div>
          </div>
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 relative">
        <div className="w-full max-w-[420px] bg-white border border-[#E7E2D8] rounded-[24px] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-[#EDF5F1] rounded-xl flex items-center justify-center mx-auto mb-5 border border-[#0B6B57]/10 text-[#0B6B57]">
              {mode === 'forgot' || mode === 'reset' ? <KeyRound size={24} /> : <ShieldCheck size={24} />}
            </div>
            <h1 className="text-2xl font-bold text-[#1C2421] tracking-tight">
              {mode === 'login' ? 'Welcome Back' : 
               mode === 'signup' ? 'Create Account' : 
               mode === 'verify' ? 'Verify Email' : 
               mode === 'forgot' ? 'Reset Password' : 'New Password'}
            </h1>
            <p className="text-[#6F8179] text-sm mt-2">
              {mode === 'login' ? 'Sign in to manage your property' : 
               mode === 'signup' ? 'Join the premium hotel PMS' : 
               mode === 'forgot' ? 'Enter your email to receive an OTP' :
               mode === 'reset' ? 'Enter OTP and your new password' :
               'Enter the 6-digit code sent to your email'}
            </p>
          </div>

          <form onSubmit={handleAction} className="space-y-4">
            {(mode === 'signup') && (
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6F8179] group-focus-within:text-[#0B6B57] transition-colors" size={18} />
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-[#E7E2D8] rounded-xl py-3.5 pl-11 pr-4 text-[#1C2421] placeholder:text-[#6F8179]/60 focus:outline-none focus:border-[#0B6B57] focus:ring-1 focus:ring-[#0B6B57] transition-all"
                />
              </div>
            )}

            {(mode === 'signup' || mode === 'forgot' || mode === 'reset') && (
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6F8179] group-focus-within:text-[#0B6B57] transition-colors" size={18} />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-[#E7E2D8] rounded-xl py-3.5 pl-11 pr-4 text-[#1C2421] placeholder:text-[#6F8179]/60 focus:outline-none focus:border-[#0B6B57] focus:ring-1 focus:ring-[#0B6B57] transition-all"
                />
              </div>
            )}

            {mode === 'signup' && (
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6F8179] group-focus-within:text-[#0B6B57] transition-colors" size={18} />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-[#E7E2D8] rounded-xl py-3.5 pl-11 pr-4 text-[#1C2421] placeholder:text-[#6F8179]/60 focus:outline-none focus:border-[#0B6B57] focus:ring-1 focus:ring-[#0B6B57] transition-all"
                />
              </div>
            )}

            {mode === 'login' && (
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6F8179] group-focus-within:text-[#0B6B57] transition-colors" size={18} />
                <input
                  type="text"
                  name="email"
                  placeholder="Email or Phone Number"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-[#E7E2D8] rounded-xl py-3.5 pl-11 pr-4 text-[#1C2421] placeholder:text-[#6F8179]/60 focus:outline-none focus:border-[#0B6B57] focus:ring-1 focus:ring-[#0B6B57] transition-all"
                />
              </div>
            )}

            {(mode === 'login' || mode === 'signup') && (
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6F8179] group-focus-within:text-[#0B6B57] transition-colors" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-[#E7E2D8] rounded-xl py-3.5 pl-11 pr-11 text-[#1C2421] placeholder:text-[#6F8179]/60 focus:outline-none focus:border-[#0B6B57] focus:ring-1 focus:ring-[#0B6B57] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6F8179] hover:text-[#0B6B57] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex justify-end pt-1">
                <button 
                  type="button" 
                  onClick={() => setMode('forgot')}
                  className="text-xs font-medium text-[#6F8179] hover:text-[#0B6B57] transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {mode === 'reset' && (
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6F8179] group-focus-within:text-[#0B6B57] transition-colors" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  placeholder="New Password"
                  required
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-[#E7E2D8] rounded-xl py-3.5 pl-11 pr-11 text-[#1C2421] placeholder:text-[#6F8179]/60 focus:outline-none focus:border-[#0B6B57] focus:ring-1 focus:ring-[#0B6B57] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6F8179] hover:text-[#0B6B57] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            )}

            {(mode === 'verify' || mode === 'reset') && (
              <div className="space-y-4">
                {mode === 'verify' && (
                  <div className="relative group">
                    <input
                      type="email"
                      name="email"
                      disabled
                      value={formData.email}
                      className="w-full bg-[#F8F6F1] border border-[#E7E2D8] rounded-xl py-3.5 px-4 text-[#6F8179] cursor-not-allowed text-sm focus:outline-none"
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
                    className="w-full bg-white border-2 border-[#0B6B57]/20 focus:border-[#0B6B57] rounded-xl py-4 px-4 text-center text-3xl font-bold tracking-[0.4em] text-[#1C2421] placeholder:text-[#E7E2D8] focus:outline-none focus:ring-4 focus:ring-[#0B6B57]/10 transition-all"
                  />
                </div>
                {mode === 'verify' && (
                  <div className="flex justify-center pt-2">
                    <button 
                      type="button" 
                      onClick={handleResendOTP}
                      disabled={loading}
                      className="text-xs font-medium text-[#6F8179] hover:text-[#0B6B57] transition-colors"
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
              className="w-full bg-[#0B6B57] hover:bg-[#095746] disabled:opacity-70 disabled:hover:bg-[#0B6B57] text-white font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm mt-6"
            >
              {loading ? <RefreshCw className="animate-spin" size={20} /> : (
                <>
                  {mode === 'login' ? 'Sign In' : 
                   mode === 'signup' ? 'Create Account' : 
                   mode === 'forgot' ? 'Send OTP' :
                   mode === 'reset' ? 'Reset Password' : 'Verify & Activate'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* Helper links */}
            <div className="mt-6 text-center text-sm">
              {mode === 'login' ? (
                <p className="text-[#6F8179]">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => setMode('signup')} className="text-[#C9A96E] font-medium hover:text-[#B6965E] transition-colors">Sign Up</button>
                </p>
              ) : mode === 'signup' ? (
                <p className="text-[#6F8179]">
                  Already have an account?{' '}
                  <button type="button" onClick={() => setMode('login')} className="text-[#0B6B57] font-medium hover:text-[#095746] transition-colors">Sign In</button>
                </p>
              ) : (
                <button type="button" onClick={() => { setMode('login'); setShowPassword(false); }} className="text-[#6F8179] hover:text-[#1C2421] text-xs mt-4 font-medium transition-colors flex items-center justify-center gap-1 mx-auto"><ArrowRight size={14} className="rotate-180" /> Back to Login</button>
              )}
            </div>
            
            {/* Support Info */}
            <div className="mt-8 pt-6 border-t border-[#E7E2D8] text-center">
              <p className="text-[#6F8179] text-xs font-medium mb-3">Need Help?</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="tel:+919403893991" className="flex items-center justify-center gap-1.5 text-[#1C2421] hover:text-[#0B6B57] transition-colors text-xs font-medium bg-[#F8F6F1] hover:bg-[#EDF5F1] py-2 px-4 rounded-lg border border-[#E7E2D8]">
                  <Phone size={14} className="text-[#0B6B57]" /> Call Support
                </a>
                <a href="https://wa.me/919403893991" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 text-[#1C2421] hover:text-[#0B6B57] transition-colors text-xs font-medium bg-[#F8F6F1] hover:bg-[#EDF5F1] py-2 px-4 rounded-lg border border-[#E7E2D8]">
                  <MessageSquare size={14} className="text-[#0B6B57]" /> WhatsApp
                </a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
"""

# Find `  return (` and replace everything till the end
match = re.search(r'  return \(\n    <div className="min-h-screen bg-\[#0a0a0a\]', content)
if match:
    start_idx = match.start()
    new_content = content[:start_idx] + new_return
    with open('src/app/auth/custom/page.tsx', 'w') as f:
        f.write(new_content)
    print("Success")
else:
    print("Pattern not found")

