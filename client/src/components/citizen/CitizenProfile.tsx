import React, { useState } from "react";
import { User, Complaint } from "../../types";
import { api } from "../../api/client";

interface Props {
  user: User;
  complaints: Complaint[];
  onUpdateUser: (user: User) => void;
  onSelectComplaint: (trackingId: string) => void;
}

export const CitizenProfile: React.FC<Props> = ({
  user,
  complaints,
  onUpdateUser,
  onSelectComplaint
}) => {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const userComplaints = complaints.filter(
    (c) => c.userId === user.id || c.contactNumber === user.phone
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      const res = await api.updateProfile({ name, phone });
      onUpdateUser(res.user);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Profile update error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest bg-orange-100/70 px-3 py-1 rounded-full">
            Account & Impact
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Citizen Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your reporter credentials and view your cumulative rescue impact.
          </p>
        </div>

        {/* Profile Card & Impact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Col 1: Identity & Edit Form */}
          <div className="md:col-span-2 bg-white p-6 sm:p-8 rounded-3xl card-elevation-1 border border-slate-100 space-y-6">
            <div className="flex items-center gap-4">
              <img
                src={user.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg?seed=Aarav"}
                alt={user.name}
                className="w-16 h-16 rounded-2xl border-2 border-orange-200 bg-orange-50"
              />
              <div>
                <h2 className="font-extrabold text-slate-900 text-lg">{user.name}</h2>
                <p className="text-xs text-slate-500">{user.email}</p>
                <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                  {user.role} Account
                </span>
              </div>
            </div>

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined !text-base">check_circle</span>
                <span>Profile details saved successfully!</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number (For Volunteer Coordination)
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-[#f97316] hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {saving ? "Saving Changes..." : "Update Profile"}
              </button>
            </form>
          </div>

          {/* Col 2: Impact Badge */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#9d4300] to-[#f97316] text-white p-6 rounded-3xl shadow-xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined !text-2xl">military_tech</span>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-orange-200 font-bold">
                  Community Badge
                </span>
                <h3 className="text-xl font-extrabold mt-0.5">Stray Guardian Level 2</h3>
              </div>
              <p className="text-xs text-white/90 leading-relaxed">
                You have reported {userComplaints.length} stray animal incidents, helping save lives in your neighborhood.
              </p>

              <div className="pt-2 border-t border-white/20 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-black/10 p-2 rounded-xl">
                  <span className="text-orange-200 text-[10px]">Total Reports</span>
                  <p className="font-bold text-sm">{userComplaints.length}</p>
                </div>
                <div className="bg-black/10 p-2 rounded-xl">
                  <span className="text-orange-200 text-[10px]">Resolved</span>
                  <p className="font-bold text-sm">
                    {userComplaints.filter((c) => c.status === "Resolved").length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
