import React, { useState } from "react";
import { User, Complaint } from "../../types";
import { StatusBadge } from "../common/StatusBadge";
import { PriorityBadge } from "../common/PriorityBadge";

interface Props {
  user: User;
  complaints: Complaint[];
  onNewReport: () => void;
  onSelectComplaint: (trackingId: string) => void;
}

export const CitizenDashboard: React.FC<Props> = ({
  user,
  complaints,
  onNewReport,
  onSelectComplaint
}) => {
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "resolved">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const userComplaints = complaints
    .filter(
      (c) => c.userId === user.id || c.contactNumber === user.phone || c.citizenPhone === user.phone
    )
    .filter(
      (comp, index, self) =>
        index === self.findIndex((c) => c.id === comp.id || c.trackingId === comp.trackingId)
    );

  const totalReports = userComplaints.length;
  const activeCount = userComplaints.filter(
    (c) => c.status === "Reported" || c.status === "Accepted" || c.status === "In Progress"
  ).length;
  const resolvedCount = userComplaints.filter((c) => c.status === "Resolved").length;
  const emergencyCount = userComplaints.filter((c) => c.isEmergency).length;

  const filteredComplaints = userComplaints.filter((c) => {
    if (filterStatus === "active") {
      if (c.status === "Resolved" || c.status === "Closed") return false;
    } else if (filterStatus === "resolved") {
      if (c.status !== "Resolved" && c.status !== "Closed") return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.trackingId.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#faf8ff] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        {/* Welcome Section Banner */}
        <div className="bg-gradient-to-r from-orange-600 to-[#f97316] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-orange-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-sm">
              <span>👤 Verified Citizen Reporter</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user.name}!
            </h1>
            <p className="text-white/90 text-xs sm:text-sm max-w-xl">
              Thank you for being the guardian of stray animals. Track all your submitted rescue complaints and status progress here.
            </p>
          </div>

          <button
            onClick={onNewReport}
            className="px-6 py-3.5 bg-white text-orange-600 hover:bg-orange-50 rounded-2xl text-xs font-bold shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shrink-0 z-10"
          >
            <span className="material-symbols-outlined !text-lg">add_circle</span>
            <span>Report New Stray Dog</span>
          </button>

          {/* Background illustration icon */}
          <span
            className="material-symbols-outlined absolute -right-6 -bottom-8 text-white/10 select-none pointer-events-none"
            style={{ fontSize: "200px" }}
          >
            pets
          </span>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl card-elevation-1 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Reports</span>
              <span className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <span className="material-symbols-outlined !text-lg">description</span>
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">{totalReports}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Submitted by you</p>
          </div>

          <div className="bg-white p-5 rounded-2xl card-elevation-1 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">In Progress</span>
              <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <span className="material-symbols-outlined !text-lg">ambulance</span>
              </span>
            </div>
            <div className="text-2xl font-extrabold text-blue-600 mt-2">{activeCount}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Ambulances assigned</p>
          </div>

          <div className="bg-white p-5 rounded-2xl card-elevation-1 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Resolved</span>
              <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined !text-lg">task_alt</span>
              </span>
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-2">{resolvedCount}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Successful treatments</p>
          </div>

          <div className="bg-white p-5 rounded-2xl card-elevation-1 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Critical Rescues</span>
              <span className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <span className="material-symbols-outlined !text-lg">emergency</span>
              </span>
            </div>
            <div className="text-2xl font-extrabold text-red-600 mt-2">{emergencyCount}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">High priority cases</p>
          </div>
        </div>

        {/* Complaints List Container */}
        <div className="bg-white rounded-3xl card-elevation-1 border border-slate-100 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Your Reported Complaints ({filteredComplaints.length})
              </h2>
              <p className="text-xs text-slate-500">
                Real-time feed of all incidents logged from your account.
              </p>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 !text-base">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search complaints..."
                  className="pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-slate-50"
                />
              </div>

              {/* Status Filter Pill */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterStatus === "all"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  All ({userComplaints.length})
                </button>
                <button
                  onClick={() => setFilterStatus("active")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterStatus === "active"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Active ({activeCount})
                </button>
                <button
                  onClick={() => setFilterStatus("resolved")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterStatus === "resolved"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Resolved ({resolvedCount})
                </button>
              </div>
            </div>
          </div>

          {/* Complaints Feed */}
          {filteredComplaints.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <span className="material-symbols-outlined !text-5xl text-slate-300">
                content_paste_off
              </span>
              <p className="text-sm font-semibold text-slate-700">No complaints found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You haven't reported any stray dog issues under this filter. If you see a distressed dog, submit a quick report.
              </p>
              <button
                onClick={onNewReport}
                className="mt-2 px-5 py-2.5 bg-[#f97316] text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-colors shadow-sm"
              >
                Report an Issue Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredComplaints.map((comp) => (
                <div
                  key={comp.id}
                  onClick={() => onSelectComplaint(comp.trackingId)}
                  className="bg-white hover:bg-orange-50/20 p-5 rounded-2xl border border-slate-200 hover:border-orange-300 transition-all cursor-pointer group shadow-sm hover:shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                          #{comp.trackingId}
                        </span>
                        <StatusBadge status={comp.status} size="sm" />
                      </div>
                      <PriorityBadge priority={comp.priority} size="sm" />
                    </div>

                    <div className="flex gap-4">
                      {comp.images && comp.images.length > 0 && (
                        <img
                          src={comp.images[0]}
                          alt={comp.title}
                          className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition-transform"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                          {comp.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                          {comp.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined !text-[13px]">location_on</span>
                      {comp.city} ({comp.pincode})
                    </span>
                    <span className="font-semibold text-orange-600 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                      Track Case →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
