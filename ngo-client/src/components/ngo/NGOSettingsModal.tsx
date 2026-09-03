import React, { useState } from "react";
import { NGO, ServiceType } from "../../types";
import { api } from "../../api/client";

interface Props {
  ngo: NGO | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedNgo: NGO) => void;
}

const ALL_SERVICES: { type: ServiceType; label: string; desc: string; icon: string }[] = [
  {
    type: "Rescue",
    label: "Accident & Trauma Rescue",
    desc: "Trapped, injured, fracture, physical distress",
    icon: "healing"
  },
  {
    type: "Medical",
    label: "General OPD & Disease Treatment",
    desc: "Skin mange, infections, viral, malnutrition",
    icon: "medical_services"
  },
  {
    type: "Emergency",
    label: "Critical SOS & Dog Bite Response",
    desc: "Active arterial bleeding, dog bites, emergency surgery",
    icon: "emergency"
  },
  {
    type: "ABC",
    label: "Animal Birth Control (Spay / Neuter)",
    desc: "Sterilization drives and post-op care",
    icon: "content_cut"
  },
  {
    type: "Vaccination",
    label: "Anti-Rabies & 7-in-1 Vaccination",
    desc: "Community vaccination drives",
    icon: "vaccines"
  },
  {
    type: "Tracking",
    label: "Lost & Abandoned Dog Tracking",
    desc: "Community search, microchip scanning, foster matching",
    icon: "radar"
  }
];

export const NGOSettingsModal: React.FC<Props> = ({ ngo, isOpen, onClose, onUpdated }) => {
  if (!isOpen || !ngo) return null;

  const [coverageRadiusKm, setCoverageRadiusKm] = useState<number>(ngo.coverageRadiusKm || 15);
  const [servicesOffered, setServicesOffered] = useState<ServiceType[]>(
    ngo.servicesOffered || ["Rescue", "Medical", "Emergency", "ABC", "Vaccination"]
  );
  const [workingHours, setWorkingHours] = useState(ngo.workingHours || "24/7");
  const [emergency24x7, setEmergency24x7] = useState(ngo.emergency24x7 ?? true);
  const [address, setAddress] = useState(ngo.address || "");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleToggleService = (service: ServiceType) => {
    if (servicesOffered.includes(service)) {
      setServicesOffered(servicesOffered.filter((s) => s !== service));
    } else {
      setServicesOffered([...servicesOffered, service]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);

    try {
      const res = await api.updateNGOSettings(ngo.id, {
        coverageRadiusKm,
        servicesOffered,
        workingHours,
        emergency24x7,
        address
      });

      onUpdated(res.ngo);
      setSuccessMsg("Coverage zones and services updated successfully!");
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Failed to update settings:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 animate-scaleUp">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <span className="material-symbols-outlined !text-xl">settings</span>
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                NGO Shelter Settings & Coverage Zones
              </h3>
              <p className="text-xs text-slate-300">
                Configure your dispatch radius, working hours, and specialized rescue services.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
              <span className="material-symbols-outlined !text-base text-emerald-600">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* FEATURE 3: Coverage Radius Zones */}
          <div className="space-y-3">
            <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block">
              📍 Operational Coverage Radius
            </label>
            <p className="text-xs text-slate-500">
              Complaints within this radius will be automatically routed and assigned to your triage desk.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[5, 10, 20, 50].map((radius) => {
                const isSelected = coverageRadiusKm === radius;
                return (
                  <button
                    key={radius}
                    type="button"
                    onClick={() => setCoverageRadiusKm(radius)}
                    className={`p-3.5 rounded-2xl border-2 text-center transition-all ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-extrabold shadow-sm"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 bg-slate-50/50"
                    }`}
                  >
                    <span className="text-lg font-extrabold block">{radius} KM</span>
                    <span className="text-[10px] text-slate-500 block">
                      {radius === 5 ? "Local Sector" : radius === 10 ? "City Zone" : radius === 20 ? "District" : "Statewide"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FEATURE 5 & 7: Services Offered */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block">
              🏥 Supported Veterinary & Rescue Services
            </label>
            <p className="text-xs text-slate-500">
              Only issue types matching your selected services will be routed to your shelter.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ALL_SERVICES.map((srv) => {
                const isChecked = servicesOffered.includes(srv.type);
                return (
                  <div
                    key={srv.type}
                    onClick={() => handleToggleService(srv.type)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      isChecked
                        ? "border-emerald-500 bg-emerald-50/40"
                        : "border-slate-200 bg-slate-50/30 opacity-70"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <div>
                      <strong className="text-xs text-slate-900 block">{srv.label}</strong>
                      <span className="text-[10px] text-slate-500 block">{srv.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Working Hours & 24x7 Ambulance Switch */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operating Hours
                </label>
                <input
                  type="text"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  placeholder="e.g. 24/7 or 08:00 AM - 09:00 PM"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shelter HQ Street Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Sector 94, Noida Expressway"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-emerald-600 !text-xl">
                  emergency
                </span>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">
                    24x7 Emergency Ambulance Readiness
                  </h4>
                  <p className="text-[10px] text-emerald-800">
                    Prioritizes your ambulance squad for night-time and critical SOS emergencies.
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={emergency24x7}
                onChange={(e) => setEmergency24x7(e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#006c49] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
            >
              {saving ? "Saving Changes..." : "Save Coverage & Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
