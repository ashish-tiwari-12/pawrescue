import React, { useState } from "react";
import { useNgoAuth } from "../context/NgoAuthContext";

interface RegisterProps {
  onNavigateLogin?: () => void;
  onSuccess?: () => void;
}

export const Register: React.FC<RegisterProps> = ({
  onNavigateLogin,
  onSuccess
}) => {
  const { register, verifyEmail, isLoading } = useNgoAuth();

  // Step 1: Registration Form
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [ngoName, setNgoName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [city, setCity] = useState("Delhi NCR");
  const [state, setState] = useState("Delhi");
  const [coverageRadiusKm, setCoverageRadiusKm] = useState(15);
  const [servicesOffered, setServicesOffered] = useState<string[]>([
    "Rescue",
    "Medical",
    "Emergency",
    "ABC",
    "Vaccination"
  ]);

  // Step 2: Verification Step
  const [step, setStep] = useState<"form" | "verify">("form");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleServiceToggle = (service: string) => {
    setServicesOffered((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName || !email || !phone || !password || !ngoName) {
      setError("Please fill in all required organization and admin fields.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await register({
        name: adminName,
        email,
        phone,
        password,
        ngoName,
        registrationNumber: registrationNumber || `DL-AWBI-${Date.now().toString().slice(-4)}`,
        city,
        state,
        coverageRadiusKm,
        servicesOffered
      });

      if (res.requiresVerification) {
        setStep("verify");
        setSuccessMsg(res.message || "A 6-digit verification code has been sent to your email.");
      } else {
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        err.message ||
        "Registration failed. Please verify your details."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await verifyEmail(email, otp);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid verification code.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl relative z-10 space-y-6 my-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-500/20 mb-1">
            <span className="material-symbols-outlined !text-3xl">domain_add</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Register NGO Organization
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Join the National Stray Animal Welfare & Emergency Dispatch Grid
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

          {successMsg && (
            <div className="p-3.5 bg-emerald-950/80 border border-emerald-800/80 rounded-2xl flex items-center gap-2 text-emerald-200 text-xs">
              <span className="material-symbols-outlined !text-lg text-emerald-400 shrink-0">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          {step === "form" ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              {/* Organization Info */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined !text-base">apartment</span>
                  <span>1. Organization Details</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Shelter / NGO Name *
                    </label>
                    <input
                      type="text"
                      value={ngoName}
                      onChange={(e) => setNgoName(e.target.value)}
                      placeholder="e.g. Paws Hope Shelter Foundation"
                      className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      AWBI / Society Reg No.
                    </label>
                    <input
                      type="text"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      placeholder="e.g. DL-AWBI-2022-8419"
                      className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Operating City *
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Delhi, Noida, Mumbai"
                      className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Coverage & Services */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h3 className="text-xs font-black uppercase text-teal-400 tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined !text-base">radar</span>
                  <span>2. Operational Radius & Capabilities</span>
                </h3>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-300">
                      Ambulance Coverage Radius
                    </label>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {coverageRadiusKm} KM Zone
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 20, 50].map((radius) => (
                      <button
                        key={radius}
                        type="button"
                        onClick={() => setCoverageRadiusKm(radius)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          coverageRadiusKm === radius
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                            : "bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        {radius} KM
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Offered Rescue Services
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["Rescue", "Medical", "Emergency", "ABC", "Vaccination"].map((srv) => (
                      <button
                        key={srv}
                        type="button"
                        onClick={() => handleServiceToggle(srv)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                          servicesOffered.includes(srv)
                            ? "bg-teal-500/20 border-teal-500 text-teal-300"
                            : "bg-slate-950/70 border-slate-800 text-slate-500 hover:border-slate-700"
                        }`}
                      >
                        <span className="material-symbols-outlined !text-sm">
                          {servicesOffered.includes(srv) ? "check_circle" : "add_circle"}
                        </span>
                        <span>{srv}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Triage Officer Account */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined !text-base">badge</span>
                  <span>3. Primary Triage Officer Account</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Officer / Admin Name *
                    </label>
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="e.g. Dr. Rajesh Verma"
                      className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Helpline / Phone *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Official Email *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="triage@pawshope.org"
                      className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Master Password *
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
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
                    <span>Registering Organization...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined !text-base">how_to_reg</span>
                    <span>Complete NGO Registration</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Step 2: Email Verification */
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div className="text-center space-y-2">
                <span className="material-symbols-outlined !text-4xl text-emerald-400">
                  mark_email_read
                </span>
                <h3 className="text-sm font-bold text-white">Enter Email Verification Code</h3>
                <p className="text-xs text-slate-400">
                  Please enter the 6-digit verification OTP sent to <strong className="text-slate-200">{email}</strong>
                </p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center tracking-widest text-lg font-mono py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                {submitting ? "Verifying..." : "Verify & Launch Dispatch HQ →"}
              </button>
            </form>
          )}

          {/* Navigation to Login */}
          {onNavigateLogin && (
            <div className="text-center pt-2 border-t border-slate-800">
              <p className="text-xs text-slate-400">
                Already registered with PawConnect?{" "}
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
                >
                  Sign In to NGO Account →
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
