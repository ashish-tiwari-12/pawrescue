import React, { useState } from "react";
import { Volunteer } from "../../types";
import { api } from "../../api/client";

interface Props {
  volunteers: Volunteer[];
  onRefresh: () => void;
}

export const VolunteerManagement: React.FC<Props> = ({ volunteers, onRefresh }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [skills, setSkills] = useState("First Aid, Ambulance Driver");
  const [availability, setAvailability] = useState<"Available" | "On Mission" | "Off Duty">("Available");
  const [saving, setSaving] = useState(false);

  const handleAddVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createVolunteer({
        name,
        email,
        phone,
        skills: skills.split(",").map((s) => s.trim()),
        availability
      });
      setShowAddModal(false);
      setName("");
      setEmail("");
      setPhone("");
      onRefresh();
    } catch (err) {
      console.error("Add volunteer error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (vol: Volunteer) => {
    const nextStatus =
      vol.availability === "Available"
        ? "On Mission"
        : vol.availability === "On Mission"
        ? "Off Duty"
        : "Available";

    try {
      await api.updateVolunteer(vol.id, { availability: nextStatus });
      onRefresh();
    } catch (err) {
      console.error("Update volunteer status error:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl card-elevation-1 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-100/70 px-3 py-1 rounded-full">
            Field Force
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-2">
            Volunteer & Ambulance Roster
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage responders, assign emergency tasks, and monitor field readiness.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-3 bg-[#006c49] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined !text-lg">person_add</span>
          <span>Add New Volunteer</span>
        </button>
      </div>

      {/* Volunteers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {volunteers.map((vol) => (
          <div
            key={vol.id}
            className="bg-white p-6 rounded-3xl card-elevation-1 border border-slate-100 hover:border-emerald-200 transition-all space-y-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={vol.avatarUrl || "https://api.dicebear.com/7.x/personas/svg?seed=Rescuer"}
                  alt={vol.name}
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">{vol.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{vol.phone}</p>
                </div>
              </div>

              {/* Status Pill button to cycle */}
              <button
                onClick={() => handleToggleStatus(vol)}
                title="Click to cycle status"
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-transform active:scale-95 ${
                  vol.availability === "Available"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : vol.availability === "On Mission"
                    ? "bg-orange-50 text-orange-800 border-orange-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {vol.availability} ↻
              </button>
            </div>

            {/* Skills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {vol.skills.map((s, i) => (
                <span
                  key={i}
                  className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-md"
                >
                  {s}
                </span>
              ))}
            </div>

            {/* Workload Stats */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-slate-400 text-[10px] block">Active Assigned</span>
                <strong className="text-orange-600 text-sm font-extrabold">
                  {vol.assignedComplaintsCount || 0}
                </strong>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-slate-400 text-[10px] block">Rescues Completed</span>
                <strong className="text-emerald-700 text-sm font-extrabold">
                  {vol.completedRescuesCount || 0}
                </strong>
              </div>
            </div>

            {/* Call Action */}
            <a
              href={`tel:${vol.phone}`}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined !text-sm">call</span>
              <span>Call Volunteer</span>
            </a>
          </div>
        ))}
      </div>

      {/* Add Volunteer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-700 !text-2xl">
                  person_add
                </span>
                <h3 className="font-extrabold text-slate-900 text-base">Add New Volunteer</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddVolunteer} className="space-y-4">
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
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vikram@gmail.com"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
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
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="First Aid, Driver, Puppy Foster"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Status
                </label>
                <select
                  value={availability}
                  onChange={(e: any) => setAvailability(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                >
                  <option value="Available">Available</option>
                  <option value="On Mission">On Mission</option>
                  <option value="Off Duty">Off Duty</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#006c49] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Add Volunteer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
