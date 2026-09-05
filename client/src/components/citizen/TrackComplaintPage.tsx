import React, { useState, useEffect } from "react";
import { api } from "../../api/client";
import { Complaint } from "../../types";
import { StatusBadge } from "../common/StatusBadge";
import { PriorityBadge } from "../common/PriorityBadge";
import { TimelineView } from "../common/TimelineView";
import { ComplaintLocationMap } from "../maps/ComplaintLocationMap";

interface Props {
  initialTrackingId?: string;
  onBack: () => void;
  onNewReport: () => void;
}

export const TrackComplaintPage: React.FC<Props> = ({
  initialTrackingId = "",
  onBack,
  onNewReport
}) => {
  const [searchInput, setSearchInput] = useState(initialTrackingId || "PC-2026-9812");
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (initialTrackingId) {
      handleTrack(initialTrackingId);
    } else {
      handleTrack("PC-2026-9812");
    }
  }, [initialTrackingId]);

  const handleTrack = async (trackId?: string) => {
    const idToSearch = trackId || searchInput;
    if (!idToSearch.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.trackComplaint(idToSearch.trim());
      setComplaint(res.complaint);
    } catch (err: any) {
      setComplaint(null);
      setError(
        err.response?.data?.error ||
          `No complaint found matching '${idToSearch}'. Please check your Tracking ID or registered phone number.`
      );
    } finally {
      setLoading(false);
    }
  };

  const getStepState = (stepIndex: number, currentStatus: string) => {
    const order = ["Reported", "Accepted", "In Progress", "Resolved"];
    const curIdx = order.indexOf(currentStatus);
    if (curIdx === -1) return "upcoming";
    if (curIdx > stepIndex) return "completed";
    if (curIdx === stepIndex) return "current";
    return "upcoming";
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Top Search Banner */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl card-elevation-1 border border-slate-100 space-y-4 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">
            <span className="material-symbols-outlined !text-sm">search</span>
            <span>Live Status Tracking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Track Rescue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Enter your Tracking ID to view real-time rescue progress.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTrack();
            }}
            className="flex flex-col sm:flex-row gap-2 pt-2"
          >
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 !text-xl">
                tag
              </span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter Tracking ID (e.g. PC-2026-9812)..."
                className="w-full pl-11 pr-4 py-3 text-sm font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-slate-50/50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-7 py-3 bg-[#f97316] hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined !text-base">manage_search</span>
                  <span>Track Report</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Tracking IDs */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-500">
            <span>Quick Samples:</span>
            {["PC-2026-9812", "PC-2026-9815", "PC-2026-9790", "PC-2026-9804"].map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setSearchInput(id);
                  handleTrack(id);
                }}
                className="font-mono text-orange-600 hover:text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 text-[11px] font-semibold hover:bg-orange-100 transition-colors"
              >
                #{id}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined !text-lg">error</span>
              <span>{error}</span>
            </div>
            <button
              onClick={onNewReport}
              className="text-xs font-bold text-orange-600 hover:underline shrink-0"
            >
              File New Report →
            </button>
          </div>
        )}

        {/* Complaint Detail Card */}
        {complaint && (
          <div className="space-y-6">
            {/* Top Status & Summary Header */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl card-elevation-1 border border-slate-100 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                      #{complaint.trackingId}
                    </span>
                    <StatusBadge status={complaint.status} size="md" />
                    <PriorityBadge priority={complaint.priority} size="md" />
                    {complaint.isEmergency && (
                      <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined !text-xs">emergency</span>
                        CRITICAL EMERGENCY
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
                    {complaint.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined !text-sm">schedule</span>
                    Reported on{" "}
                    {new Date(complaint.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => window.print()}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
                    title="Print / Save Report PDF"
                  >
                    <span className="material-symbols-outlined !text-base">print</span>
                    <span className="hidden sm:inline">Print Receipt</span>
                  </button>
                </div>
              </div>

              {/* Visual Stepper Bar */}
              <div className="py-2">
                <h3 className="text-xs font-bold text-slate-800 mb-4 uppercase tracking-wider">
                  Live Rescue Lifecycle
                </h3>
                <div className="grid grid-cols-4 gap-2 relative">
                  {[
                    { title: "Reported", desc: "Logged with GPS", icon: "flag" },
                    { title: "Accepted", desc: "NGO Assigned", icon: "verified" },
                    { title: "In Progress", desc: "Ambulance En Route", icon: "ambulance" },
                    { title: "Resolved", desc: "Treatment Complete", icon: "task_alt" }
                  ].map((step, idx) => {
                    const state = getStepState(idx, complaint.status);
                    return (
                      <div key={idx} className="text-center space-y-2 relative">
                        {/* Circle */}
                        <div
                          className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center transition-all ${
                            state === "completed"
                              ? "bg-[#006c49] text-white ring-4 ring-emerald-50"
                              : state === "current"
                              ? "bg-[#f97316] text-white ring-4 ring-orange-100 animate-pulse"
                              : "bg-slate-100 text-slate-400 border border-slate-200"
                          }`}
                        >
                          <span className="material-symbols-outlined !text-lg">
                            {step.icon}
                          </span>
                        </div>
                        <div>
                          <p
                            className={`text-xs font-bold ${
                              state === "current"
                                ? "text-orange-600"
                                : state === "completed"
                                ? "text-[#006c49]"
                                : "text-slate-400"
                            }`}
                          >
                            {step.title}
                          </p>
                          <p className="text-[10px] text-slate-400 hidden sm:block">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Grid 2 Columns: Details & Assigned Volunteer */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Complaint Details & Timeline */}
              <div className="md:col-span-7 space-y-6">
                {/* Incident Information */}
                <div className="bg-white p-6 rounded-3xl card-elevation-1 border border-slate-100 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-600 !text-lg">
                      description
                    </span>
                    Incident Description & Symptoms
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
                    {complaint.description}
                  </p>

                  {complaint.dogCondition && complaint.dogCondition.length > 0 && (
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                        Observed Symptoms:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {complaint.dogCondition.map((cond, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 bg-orange-50 text-orange-800 border border-orange-200 text-xs font-medium rounded-full"
                          >
                            {cond}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Location Info & Interactive Map */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <span className="text-slate-400 block text-[11px]">Exact Location</span>
                        <strong className="text-slate-800">{complaint.address}</strong>
                        {complaint.landmark && (
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            Landmark: {complaint.landmark}
                          </p>
                        )}
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <span className="text-slate-400 block text-[11px]">Area / City</span>
                        <strong className="text-slate-800">
                          {complaint.city} ({complaint.pincode})
                        </strong>
                        {complaint.location && (
                          <p className="text-emerald-700 font-mono text-[11px] mt-0.5">
                            GPS: {complaint.location.latitude.toFixed(4)},{" "}
                            {complaint.location.longitude.toFixed(4)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* FEATURE 4: Interactive Leaflet Map for Citizen */}
                    {complaint.location && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="font-bold text-slate-700 flex items-center gap-1">
                            <span className="material-symbols-outlined !text-base text-orange-600">
                              location_on
                            </span>
                            Incident GPS Sighting Map
                          </span>
                          <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                            Verified Coordinates
                          </span>
                        </div>
                        <ComplaintLocationMap
                          latitude={complaint.location.latitude}
                          longitude={complaint.location.longitude}
                          title={complaint.title}
                          address={complaint.address}
                          category={complaint.category}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Vertical Activity Timeline */}
                <div className="bg-white p-6 rounded-3xl card-elevation-1 border border-slate-100 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-600 !text-lg">
                      history
                    </span>
                    Activity & Audit Timeline
                  </h3>
                  <TimelineView events={complaint.timeline} />
                </div>
              </div>

              {/* Right Column: Assigned NGO, Volunteer, Photos */}
              <div className="md:col-span-5 space-y-6">
                {/* NGO & Volunteer Dispatch Card */}
                <div className="bg-white p-6 rounded-3xl card-elevation-1 border border-slate-100 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-700 !text-lg">
                      medical_services
                    </span>
                    Assigned Welfare Organization
                  </h3>

                  <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#006c49] text-white flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined">pets</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-emerald-950">
                          {complaint.ngoName || "Voice for Stray Animals (VSA)"}
                        </h4>
                        <p className="text-[11px] text-emerald-700">
                          Verified AWBI Rescue Partner
                        </p>
                      </div>
                    </div>

                    {complaint.volunteerName ? (
                      <div className="pt-3 border-t border-emerald-200/60 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                            Assigned Field Rescuer
                          </span>
                          <strong className="text-xs text-slate-900">
                            {complaint.volunteerName}
                          </strong>
                          <p className="text-[11px] text-slate-600 font-mono">
                            {complaint.volunteerPhone}
                          </p>
                        </div>
                        <a
                          href={`tel:${complaint.volunteerPhone}`}
                          className="px-3 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-emerald-800 transition-colors shadow-sm"
                        >
                          <span className="material-symbols-outlined !text-sm">call</span>
                          <span>Call</span>
                        </a>
                      </div>
                    ) : (
                      <div className="pt-2 text-xs text-emerald-800 flex items-center gap-1.5">
                        <span className="material-symbols-outlined !text-sm">schedule</span>
                        <span>Assigning nearby volunteer team...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Uploaded Photos Gallery */}
                <div className="bg-white p-6 rounded-3xl card-elevation-1 border border-slate-100 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-orange-600 !text-lg">
                        photo_camera
                      </span>
                      Photo Evidence ({complaint.images.length})
                    </span>
                    <span className="text-[11px] text-slate-400">Click to expand</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-2.5">
                    {complaint.images.map((img, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedPhoto(img)}
                        className="aspect-video rounded-2xl overflow-hidden border border-slate-200 cursor-pointer group relative shadow-sm"
                      >
                        <img
                          src={img}
                          alt="Dog observation"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <span className="material-symbols-outlined">zoom_in</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resolution Certificate (if resolved) */}
                {complaint.status === "Resolved" && (
                  <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-3xl space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <span className="material-symbols-outlined !text-2xl">verified</span>
                      <h4 className="font-bold text-sm">Rescue & Care Completed!</h4>
                    </div>
                    <p className="text-xs text-emerald-900 leading-relaxed">
                      {complaint.resolutionNotes ||
                        "The animal was safely rescued, treated by certified veterinarians, and documented."}
                    </p>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      Resolved on:{" "}
                      {complaint.resolvedAt
                        ? new Date(complaint.resolvedAt).toLocaleDateString()
                        : "Recently"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Photo Modal Zoom */}
        {selectedPhoto && (
          <div
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="relative max-w-3xl w-full">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute -top-10 right-0 text-white hover:text-slate-300 flex items-center gap-1 text-sm font-semibold"
              >
                <span className="material-symbols-outlined">close</span> Close
              </button>
              <img
                src={selectedPhoto}
                alt="Dog sighting enlarged"
                className="w-full rounded-2xl shadow-2xl object-contain max-h-[80vh]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
