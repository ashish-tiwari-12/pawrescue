import React from "react";
import { Complaint, Volunteer, AnalyticsSummary } from "../../types";
import { StatusBadge } from "../common/StatusBadge";
import { PriorityBadge } from "../common/PriorityBadge";

interface Props {
  analytics: AnalyticsSummary | null;
  complaints: Complaint[];
  volunteers: Volunteer[];
  onOpenComplaintModal: (complaint: Complaint) => void;
  onNavigateTab: (tab: "complaints" | "volunteers" | "analytics") => void;
}

export const NGOHome: React.FC<Props> = ({
  analytics,
  complaints,
  volunteers,
  onOpenComplaintModal,
  onNavigateTab
}) => {
  const pendingComplaints = complaints.filter(
    (c) => c.status === "Reported" || c.status === "Accepted"
  );
  const criticalCases = complaints.filter(
    (c) => c.priority === "Critical" && c.status !== "Resolved" && c.status !== "Closed"
  );
  const availableVolunteers = volunteers.filter((v) => v.availability === "Available");

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#006c49] p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>NGO Triage & Dispatch Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Voice for Stray Animals (VSA)
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
            Real-time ambulance dispatch, volunteer field coordination, and emergency rescue queue for Greater Mumbai.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10">
          <button
            onClick={() => onNavigateTab("complaints")}
            className="px-5 py-3 bg-[#006c49] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined !text-lg">list_alt</span>
            <span>View All Complaints ({complaints.length})</span>
          </button>
          <button
            onClick={() => onNavigateTab("volunteers")}
            className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2 backdrop-blur-sm"
          >
            <span className="material-symbols-outlined !text-lg">group</span>
            <span>Volunteers ({availableVolunteers.length} Ready)</span>
          </button>
        </div>

        {/* Decorative background watermark */}
        <span
          className="material-symbols-outlined absolute -right-6 -bottom-10 text-white/5 select-none pointer-events-none"
          style={{ fontSize: "220px" }}
        >
          medical_services
        </span>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl card-elevation-1 border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Cases</span>
            <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <span className="material-symbols-outlined !text-lg">folder</span>
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{complaints.length}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Lifetime reports logged</p>
        </div>

        <div className="bg-white p-5 rounded-2xl card-elevation-1 border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Pending Triage</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined !text-lg">pending_actions</span>
            </span>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-2">
            {analytics?.pendingCount ?? pendingComplaints.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Awaiting NGO action</p>
        </div>

        <div className="bg-white p-5 rounded-2xl card-elevation-1 border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-orange-700">In Progress</span>
            <span className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <span className="material-symbols-outlined !text-lg">ambulance</span>
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#f97316] mt-2">
            {complaints.filter((c) => c.status === "In Progress").length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Ambulances dispatched</p>
        </div>

        <div className="bg-white p-5 rounded-2xl card-elevation-1 border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Resolved</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined !text-lg">task_alt</span>
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#006c49] mt-2">
            {complaints.filter((c) => c.status === "Resolved").length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Rescued & Treated</p>
        </div>

        <div className="bg-white p-5 rounded-2xl card-elevation-1 border border-red-100 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-700">Critical Priority</span>
            <span className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center animate-pulse">
              <span className="material-symbols-outlined !text-lg">emergency</span>
            </span>
          </div>
          <div className="text-2xl font-extrabold text-red-600 mt-2">
            {criticalCases.length}
          </div>
          <p className="text-[11px] text-red-500 mt-0.5 font-medium">Urgent life threat</p>
        </div>
      </div>

      {/* 2-Column Grid: Urgent Triage Feed & Quick Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Urgent Triage Queue (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl card-elevation-1 border border-slate-100 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <h2 className="font-extrabold text-slate-900 text-base">
                Urgent Action Queue ({pendingComplaints.length + criticalCases.length})
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab("complaints")}
              className="text-xs font-bold text-[#006c49] hover:underline"
            >
              Open Full Manager →
            </button>
          </div>

          <div className="space-y-3.5">
            {[...criticalCases, ...pendingComplaints]
              .slice(0, 5)
              .map((comp) => (
                <div
                  key={comp.id}
                  onClick={() => onOpenComplaintModal(comp)}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50/20 transition-all cursor-pointer group shadow-sm flex items-start gap-4"
                >
                  {comp.images && comp.images.length > 0 && (
                    <img
                      src={comp.images[0]}
                      alt={comp.title}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition-transform"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                          #{comp.trackingId}
                        </span>
                        <StatusBadge status={comp.status} size="sm" />
                      </div>
                      <PriorityBadge priority={comp.priority} size="sm" />
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                      {comp.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      📍 {comp.address} ({comp.pincode})
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Reporter: {comp.citizenName}</span>
                      <span className="font-semibold text-orange-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Triage Case <span className="material-symbols-outlined !text-sm">arrow_forward</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Analytics Snapshot & Volunteer Readiness (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Resolution Metrics */}
          <div className="bg-white rounded-3xl card-elevation-1 border border-slate-100 p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006c49] !text-lg">trending_up</span>
              Resolution Performance
            </h3>

            <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-950 font-medium">Overall Resolution Rate</span>
                <strong className="text-emerald-800 text-sm font-extrabold">
                  {analytics?.resolutionRatePercent ?? 92}%
                </strong>
              </div>
              <div className="w-full bg-emerald-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all"
                  style={{ width: `${analytics?.resolutionRatePercent ?? 92}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200/60 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] block">Avg Response Time</span>
                  <strong className="text-slate-800">24 Mins</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Avg Treatment Time</span>
                  <strong className="text-slate-800">3.4 Hours</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Volunteer Readiness Widget */}
          <div className="bg-white rounded-3xl card-elevation-1 border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-600 !text-lg">badge</span>
                On-Duty Volunteer Squad
              </h3>
              <button
                onClick={() => onNavigateTab("volunteers")}
                className="text-xs font-semibold text-orange-600 hover:underline"
              >
                Manage ({volunteers.length})
              </button>
            </div>

            <div className="space-y-3">
              {volunteers.slice(0, 3).map((v) => (
                <div
                  key={v.id}
                  className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={v.avatarUrl || "https://api.dicebear.com/7.x/personas/svg?seed=Volunteer"}
                      alt={v.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{v.name}</h4>
                      <p className="text-[11px] text-slate-500 font-mono">{v.phone}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      v.availability === "Available"
                        ? "bg-emerald-100 text-emerald-800"
                        : v.availability === "On Mission"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {v.availability}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
