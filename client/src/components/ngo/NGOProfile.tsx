import React, { useState } from "react";
import { User, NGO, Complaint, ServiceType } from "../../types";
import { api } from "../../api/client";

interface Props {
  user: User | null;
  ngo: NGO | null;
  complaints: Complaint[];
  onUpdateNGO: (updatedNgo: NGO) => void;
  onSelectComplaint?: (complaint: Complaint) => void;
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
    label: "Critical ICU & Severe Trauma",
    desc: "Life-threatening conditions, poison, deep wounds",
    icon: "crisis_alert"
  },
  {
    type: "ABC",
    label: "Animal Birth Control (ABC)",
    desc: "Sterilization & population control surgery",
    icon: "content_cut"
  },
  {
    type: "Vaccination",
    label: "Anti-Rabies (ARV) Drives",
    desc: "Canine immunization & 7-in-1 vaccination",
    icon: "vaccines"
  }
];

export const NGOProfile: React.FC<Props> = ({
  user,
  ngo,
  complaints,
  onUpdateNGO,
  onSelectComplaint
}) => {
  const [name, setName] = useState(ngo?.name || "Voice for Stray Animals (VSA)");
  const [phone, setPhone] = useState(ngo?.phone || "+91 98765 43210");
  const [email, setEmail] = useState(ngo?.email || "rescue@vsa-delhi.org");
  const [address, setAddress] = useState(ngo?.address || "Plot 42, Sector 94, Noida Expressway");
  const [city, setCity] = useState(ngo?.city || "Noida");
  const [radius, setRadius] = useState<number>(ngo?.coverageRadiusKm || 15);
  const [emergency24x7, setEmergency24x7] = useState<boolean>(ngo?.emergency24x7 ?? true);
  const [workingHours, setWorkingHours] = useState<string>(ngo?.workingHours || "24/7 Emergency Dispatch");
  const [selectedServices, setSelectedServices] = useState<ServiceType[]>(
    ngo?.servicesOffered || ["Rescue", "Medical", "Emergency", "ABC", "Vaccination"]
  );

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const ngoComplaints = complaints.filter(
    (c) => c.ngoId === ngo?.id || c.ngoName === ngo?.name
  );
  const activeCases = ngoComplaints.filter(
    (c) => c.status === "Reported" || c.status === "Accepted" || c.status === "In Progress"
  );
  const resolvedCases = ngoComplaints.filter((c) => c.status === "Resolved");

  const toggleService = (svc: ServiceType) => {
    if (selectedServices.includes(svc)) {
      if (selectedServices.length > 1) {
        setSelectedServices(selectedServices.filter((s) => s !== svc));
      }
    } else {
      setSelectedServices([...selectedServices, svc]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ngo?.id) return;
    setSaving(true);
    setSuccess(false);

    try {
      const res = await api.updateNGOSettings(ngo.id, {
        name,
        phone,
        email,
        address,
        coverageRadiusKm: radius,
        emergency24x7,
        workingHours,
        servicesOffered: selectedServices
      });
      onUpdateNGO(res.ngo);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) {
      console.error("Failed to update NGO profile:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top NGO Organization Identity Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#006c49] p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-emerald-500/30">
              🏥
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold">
                  ✓ AWBI Verified Partner
                </span>
                <span className="px-3 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs font-mono">
                  Reg: {ngo?.registrationNumber || "DL-AWBI-2018-9482"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {ngo?.name || "Voice for Stray Animals (VSA)"}
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm">
                Primary Shelter HQ: {ngo?.address || "Plot 42, Sector 94, Noida Expressway"} ({ngo?.city || "Noida"})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950/70 border border-slate-700/80 px-4 py-3 rounded-2xl text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Dispatch Radius</span>
              <strong className="text-lg font-black text-emerald-400">{radius} KM</strong>
            </div>
            <div className="bg-slate-950/70 border border-slate-700/80 px-4 py-3 rounded-2xl text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Readiness</span>
              <strong className="text-xs font-black text-orange-400">
                {emergency24x7 ? "24x7 Ambulance" : "Day Duty"}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Impact Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-slate-400 text-xs font-semibold">Total Rescues</span>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {(ngo?.totalRescued || 1240) + resolvedCases.length}
          </div>
          <span className="text-[11px] text-emerald-400 font-medium">✓ Street Lives Saved</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-slate-400 text-xs font-semibold">Active Dispatch Cases</span>
          <div className="text-2xl sm:text-3xl font-black text-orange-400">
            {activeCases.length}
          </div>
          <span className="text-[11px] text-slate-400">In triage / treatment</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-slate-400 text-xs font-semibold">Field Volunteers</span>
          <div className="text-2xl sm:text-3xl font-black text-blue-400">
            {ngo?.activeVolunteersCount || 14}
          </div>
          <span className="text-[11px] text-slate-400">On-duty responders</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-slate-400 text-xs font-semibold">Avg Resolution Time</span>
          <div className="text-2xl sm:text-3xl font-black text-purple-400">
            2.4 hrs
          </div>
          <span className="text-[11px] text-slate-400">Emergency response</span>
        </div>
      </div>

      {/* Main Profile Configuration Form Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col (8 cols): Organization Profile Editor */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white">Organization Profile & Contact</h2>
              <p className="text-xs text-slate-400">
                Update verified shelter credentials, public hotlines, and dispatch headquarters.
              </p>
            </div>
            {success && (
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-bold animate-fadeIn">
                ✓ Saved Successfully!
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Shelter / NGO Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Official Helpline / Ambulance</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Official Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Operating City / NCR Jurisdiction</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Headquarters Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Coverage Radius Selector */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">Operational Coverage Radius</label>
                <span className="text-xs font-mono text-emerald-400 font-bold">{radius} KM</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[5, 10, 20, 50].map((km) => (
                  <button
                    key={km}
                    type="button"
                    onClick={() => setRadius(km)}
                    className={`py-2.5 rounded-xl text-xs font-extrabold border transition-all ${
                      radius === km
                        ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {km} KM Zone
                  </button>
                ))}
              </div>
            </div>

            {/* Services Offered Selection */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-300">Supported Rescue & Clinical Services</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ALL_SERVICES.map((svc) => {
                  const isChecked = selectedServices.includes(svc.type);
                  return (
                    <div
                      key={svc.type}
                      onClick={() => toggleService(svc.type)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                        isChecked
                          ? "bg-emerald-950/40 border-emerald-600/80 text-white"
                          : "bg-slate-950 border-slate-800/80 text-slate-400 opacity-60"
                      }`}
                    >
                      <span className="material-symbols-outlined !text-lg text-emerald-400 shrink-0 mt-0.5">
                        {svc.icon}
                      </span>
                      <div>
                        <strong className="text-xs block font-bold">{svc.label}</strong>
                        <p className="text-[10px] text-slate-400">{svc.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 24x7 Ambulance Readiness Toggle */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5">
                <strong className="text-xs font-bold text-white block">24x7 Emergency Ambulance Readiness</strong>
                <p className="text-[11px] text-slate-400">
                  Allows automatic high-priority night dispatch assignments in your radius.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEmergency24x7(!emergency24x7)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  emergency24x7 ? "bg-emerald-500" : "bg-slate-800"
                }`}
              >
                <span
                  className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                    emergency24x7 ? "right-1" : "left-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 hover:scale-105 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined !text-base">save</span>
                    <span>Save NGO Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Col (4 cols): Accreditation, Admin Account & Live Queue */}
        <div className="lg:col-span-4 space-y-6">
          {/* Admin User Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
              Triage Officer In-Charge
            </span>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-lg">
                {user?.name?.[0] || "A"}
              </div>
              <div>
                <strong className="text-sm font-bold text-white block">{user?.name || "Shelter Admin"}</strong>
                <span className="text-[11px] text-slate-400 block">{user?.email || "admin@vsa.org"}</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800 mt-1 inline-block">
                  Role: NGO Administrator
                </span>
              </div>
            </div>
          </div>

          {/* Civic Certifications & Badges */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
              Civic Accreditations & Badges
            </span>
            <div className="space-y-2">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-3">
                <span className="text-xl">🏆</span>
                <div>
                  <strong className="text-xs font-bold text-white block">AWBI Certified Shelter</strong>
                  <span className="text-[10px] text-slate-400">Animal Welfare Board of India</span>
                </div>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-3">
                <span className="text-xl">🚑</span>
                <div>
                  <strong className="text-xs font-bold text-white block">Rapid Response Fleet</strong>
                  <span className="text-[10px] text-slate-400">GPS tracked ambulance unit</span>
                </div>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-3">
                <span className="text-xl">💉</span>
                <div>
                  <strong className="text-xs font-bold text-white block">Rabies Free Zone Partner</strong>
                  <span className="text-[10px] text-slate-400">Zero by 30 WHO Mission</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
