import React, { useState } from "react";
import { useNgoAuth } from "../context/NgoAuthContext";
import { SEEDED_DEMO_NGOS } from "../services/ngoAuthService";

interface LoginProps {
  onNavigateRegister?: () => void;
  onNavigateForgotPassword?: () => void;
  onSuccess?: () => void;
}

export const Login: React.FC<LoginProps> = ({
  onNavigateRegister,
  onNavigateForgotPassword,
  onSuccess
}) => {
  const { login, demoLogin, isLoading } = useNgoAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedDemoNgoId, setSelectedDemoNgoId] = useState<string>(SEEDED_DEMO_NGOS[0].id);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedNgoObj = SEEDED_DEMO_NGOS.find((n) => n.id === selectedDemoNgoId) || SEEDED_DEMO_NGOS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await login({ email, password });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        err.message ||
        "Authentication failed. Please check your credentials."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await demoLogin(selectedDemoNgoId);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || "Demo login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-500/20 mb-2">
            <span className="material-symbols-outlined !text-3xl">local_hospital</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            NGO Command HQ
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Official Triage & Dispatch Portal for Verified Animal Shelters
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 bg-red-950/80 border border-red-800/80 rounded-2xl flex items-center gap-2 text-red-200 text-xs">
              <span className="material-symbols-outlined !text-lg text-red-400 shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Official Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 !text-lg text-slate-500">
                  mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@shelter-ngo.org"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Password
                </label>
                {onNavigateForgotPassword && (
                  <button
                    type="button"
                    onClick={onNavigateForgotPassword}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 !text-lg text-slate-500">
                  lock
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined !text-base">login</span>
                  <span>Sign In to NGO Dispatch</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo NGO Selection Dropdown */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined !text-sm text-emerald-400">tune</span>
                <span>Demo NGO Testing Selector</span>
              </span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded-full font-bold">
                5 Shelters Available
              </span>
            </div>

            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 !text-lg text-emerald-400 pointer-events-none">
                domain
              </span>
              <select
                value={selectedDemoNgoId}
                onChange={(e) => setSelectedDemoNgoId(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-slate-950/90 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-emerald-500 appearance-none transition-colors cursor-pointer"
              >
                {SEEDED_DEMO_NGOS.map((ngo) => (
                  <option key={ngo.id} value={ngo.id} className="bg-slate-900 text-slate-100 py-1">
                    {ngo.name} • {ngo.city} ({ngo.coverageRadiusKm} KM Zone)
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-2.5 !text-base text-slate-500 pointer-events-none">
                expand_more
              </span>
            </div>

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={submitting}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600/20 to-teal-500/20 hover:from-emerald-600/30 hover:to-teal-500/30 text-emerald-300 border border-emerald-500/40 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm group"
            >
              <span className="material-symbols-outlined !text-base text-emerald-400 group-hover:scale-110 transition-transform">
                bolt
              </span>
              <span>
                1-Click Sign In as {selectedNgoObj?.name.split(" ")[0] || "Demo"} Admin
              </span>
            </button>
          </div>

          {/* Navigation to Register */}
          {onNavigateRegister && (
            <div className="text-center pt-2">
              <p className="text-xs text-slate-400">
                New animal welfare organization?{" "}
                <button
                  type="button"
                  onClick={onNavigateRegister}
                  className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
                >
                  Register Shelter Organization →
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
