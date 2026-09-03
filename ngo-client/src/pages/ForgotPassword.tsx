import React, { useState } from "react";
import { useNgoAuth } from "../context/NgoAuthContext";

interface ForgotPasswordProps {
  onNavigateLogin?: () => void;
  onSuccess?: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({
  onNavigateLogin,
  onSuccess
}) => {
  const { forgotPassword, resetPassword, isLoading } = useNgoAuth();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"request" | "reset">("request");

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your registered NGO email address.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await forgotPassword(email);
      setMessage(res.message || "A 6-digit password reset OTP has been dispatched to your email.");
      setStep("reset");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to dispatch reset OTP. Please check the email.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      setError("Please enter both the OTP and your new password.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await resetPassword({ email, otp, newPassword });
      setMessage("Password updated successfully! Redirecting...");
      setTimeout(() => {
        if (onSuccess) onSuccess();
        else if (onNavigateLogin) onNavigateLogin();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid or expired password reset OTP.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-500/20 mb-1">
            <span className="material-symbols-outlined !text-3xl">lock_reset</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Account Recovery
          </h1>
          <p className="text-xs text-slate-400">
            Reset password for verified NGO Triage Administrator
          </p>
        </div>

        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          {error && (
            <div className="p-3.5 bg-red-950/80 border border-red-800/80 rounded-2xl flex items-center gap-2 text-red-200 text-xs">
              <span className="material-symbols-outlined !text-lg text-red-400 shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="p-3.5 bg-emerald-950/80 border border-emerald-800/80 rounded-2xl flex items-center gap-2 text-emerald-200 text-xs">
              <span className="material-symbols-outlined !text-lg text-emerald-400 shrink-0">check_circle</span>
              <span>{message}</span>
            </div>
          )}

          {step === "request" ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Registered NGO Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3 !text-lg text-slate-500">
                    mail
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@shelter.org"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || isLoading}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                {submitting ? "Sending OTP..." : "Send Reset Code →"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center tracking-widest text-lg font-mono py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3 !text-lg text-slate-500">
                    lock
                  </span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                {submitting ? "Updating Password..." : "Set New Password & Sign In"}
              </button>
            </form>
          )}

          {onNavigateLogin && (
            <div className="text-center pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onNavigateLogin}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                ← Back to NGO Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
