import React, { useState, useEffect } from "react";
import { api } from "../../api/client";
import { User, UserRole } from "../../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  initialRole?: UserRole;
  initialMode?: "login" | "signup";
}

type AuthMode = "login" | "signup" | "verify" | "forgot_email" | "forgot_reset";

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRole = "citizen",
  initialMode = "login"
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [role, setRole] = useState<UserRole>(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [ngoId, setNgoId] = useState("ngo-1");
  const [resendCooldown, setResendCooldown] = useState(false);

  // Reset modal state whenever modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setRole(initialRole);
      setError(null);
      setSuccessMsg(null);
      setOtp("");
      setPassword("");
      setNewPassword("");
    }
  }, [isOpen, initialMode, initialRole]);

  if (!isOpen) return null;

  const resetAndClose = () => {
    setError(null);
    setSuccessMsg(null);
    setOtp("");
    setPassword("");
    setNewPassword("");
    setMode("login");
    onClose();
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      onSuccess(res.user);
      resetAndClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Signup -> Trigger verification OTP email
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.register({
        name,
        email,
        phone,
        password,
        role,
        ngoId: role === "ngo_admin" ? ngoId : undefined
      });

      if (res.requiresVerification) {
        setSuccessMsg(`We've sent a 6-digit verification code to ${email}`);
        setMode("verify");
      } else {
        onSuccess(res.user);
        resetAndClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Verification -> Instantly closes modal and logs in
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.verifyEmail({ email, otp });
      onSuccess(res.user);
      resetAndClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  // Resend Verification Code
  const handleResendOtp = async () => {
    setError(null);
    setResendCooldown(true);
    try {
      const res = await api.resendVerification({ email });
      setSuccessMsg(res.message || "Fresh verification code sent to your email.");
      setTimeout(() => setResendCooldown(false), 30000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to resend code.");
      setResendCooldown(false);
    }
  };

  // Handle Forgot Password - Step 1: Send OTP
  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.forgotPassword({ email });
      setSuccessMsg(res.message);
      setMode("forgot_reset");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password - Step 2: Reset Password with OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.resetPassword({ email, otp, newPassword });
      setSuccessMsg(res.message);
      setTimeout(() => {
        setMode("login");
        setPassword("");
        setOtp("");
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to reset password. Check your OTP.");
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Demo Login
  const handleDemoLogin = async (demoRole: UserRole) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.demoLogin(demoRole);
      onSuccess(res.user);
      resetAndClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Demo login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={resetAndClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-scaleUp"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#006c49] p-6 text-white relative">
          <button
            onClick={resetAndClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined !text-lg">close</span>
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-orange-400 !text-2xl">pets</span>
            <span className="font-extrabold text-lg tracking-tight">PawConnect India</span>
          </div>
          <p className="text-slate-300 text-xs">
            {mode === "login"
              ? "Sign in to manage reports, ambulance triage, and alerts"
              : mode === "signup"
              ? "Create your account with email verification"
              : mode === "verify"
              ? "Verify your email address with 6-digit code"
              : mode === "forgot_email"
              ? "Reset your account password"
              : "Enter verification code and new password"}
          </p>
        </div>

        {/* Tab Switcher (Login vs Signup) */}
        {(mode === "login" || mode === "signup") && (
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => {
                setMode("login");
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-3 text-xs font-bold transition-all text-center ${
                mode === "login"
                  ? "text-orange-600 border-b-2 border-orange-500 bg-orange-50/20"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode("signup");
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-3 text-xs font-bold transition-all text-center ${
                mode === "signup"
                  ? "text-orange-600 border-b-2 border-orange-500 bg-orange-50/20"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        <div className="p-6 space-y-4">
          {/* Alerts */}
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-start gap-2 animate-fadeIn">
              <span className="material-symbols-outlined !text-base shrink-0 text-red-600">
                error
              </span>
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-start gap-2 animate-fadeIn">
              <span className="material-symbols-outlined !text-base shrink-0 text-emerald-600">
                check_circle
              </span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot_email");
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] text-orange-600 hover:underline font-semibold"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#f97316] hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign In to Account"}
              </button>
            </form>
          )}

          {/* 2. SIGNUP FORM */}
          {mode === "signup" && (
            <form onSubmit={handleSignup} className="space-y-3">
              {/* Role Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  I am registering as:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("citizen")}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      role === "citizen"
                        ? "bg-orange-50 border-orange-500 text-orange-700 shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    🐾 Citizen / Reporter
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("ngo_admin")}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      role === "ngo_admin"
                        ? "bg-emerald-50 border-emerald-600 text-emerald-800 shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    🏥 NGO Staff
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vikram Malhotra"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address (Verification OTP will be sent)
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vikram@gmail.com"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98200 XXXXX"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#006c49] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
              >
                {loading ? "Sending verification code..." : "Register & Verify Email →"}
              </button>
            </form>
          )}

          {/* 3. EMAIL VERIFICATION OTP FORM */}
          {mode === "verify" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined !text-2xl">mark_email_read</span>
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">Check Your Inbox</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  We've sent a 6-digit code to <strong className="text-slate-800">{email}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 text-center">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full py-2.5 text-center text-xl font-mono font-bold tracking-widest border-2 border-orange-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 bg-orange-50/20"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-2.5 bg-[#006c49] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Activate Account"}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-slate-500 hover:text-slate-800"
                >
                  ← Edit Email
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown}
                  className="text-orange-600 font-semibold hover:underline disabled:opacity-50"
                >
                  {resendCooldown ? "Resend in 30s" : "Resend Code"}
                </button>
              </div>
            </form>
          )}

          {/* 4. FORGOT PASSWORD - STEP 1: EMAIL */}
          {mode === "forgot_email" && (
            <form onSubmit={handleSendResetOtp} className="space-y-3.5">
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-slate-900">Forgot Password?</h3>
                <p className="text-xs text-slate-500">
                  Enter the email address registered with your account to receive a 6-digit reset code.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Account Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
              >
                {loading ? "Sending reset code..." : "Send 6-Digit Reset Code"}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* 5. FORGOT PASSWORD - STEP 2: RESET WITH OTP */}
          {mode === "forgot_reset" && (
            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-slate-900">Set New Password</h3>
                <p className="text-xs text-slate-500">
                  Enter the 6-digit code sent to <strong className="text-slate-700">{email}</strong> and your new password.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full py-2 text-center text-lg font-mono font-bold tracking-widest border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6 || newPassword.length < 6}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
              >
                {loading ? "Updating password..." : "Update Password & Log In"}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setMode("forgot_email")}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  ← Resend to different email
                </button>
              </div>
            </form>
          )}

          {/* 1-Click Demo Accounts (Only on Login screen) */}
          {mode === "login" && (
            <div className="pt-4 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
                1-Click Instant Demo Access
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin("citizen")}
                  disabled={loading}
                  className="p-2 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl text-[11px] font-bold text-orange-900 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>🐾 Demo Citizen</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin("ngo_admin")}
                  disabled={loading}
                  className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-[11px] font-bold text-emerald-900 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>🏥 Demo NGO Admin</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
