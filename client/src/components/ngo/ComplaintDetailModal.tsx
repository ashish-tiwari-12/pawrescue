import React, { useState } from "react";
import { Complaint, Volunteer, ComplaintStatus } from "../../types";
import { StatusBadge } from "../common/StatusBadge";
import { PriorityBadge } from "../common/PriorityBadge";
import { TimelineView } from "../common/TimelineView";
import { api } from "../../api/client";

interface Props {
  complaint: Complaint | null;
  volunteers: Volunteer[];
  onClose: () => void;
  onUpdated: (updatedComplaint: Complaint) => void;
}

export const ComplaintDetailModal: React.FC<Props> = ({
  complaint,
  volunteers,
  onClose,
  onUpdated
}) => {
  if (!complaint) return null;

  const [currentComplaint, setCurrentComplaint] = useState<Complaint>(complaint);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState(
    complaint.volunteerId || (volunteers[0]?.id ?? "")
  );
  const [noteMessage, setNoteMessage] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [statusNote, setStatusNote] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: ComplaintStatus) => {
    setLoadingAction(true);
    try {
      const res = await api.updateComplaintStatus(
        currentComplaint.id,
        newStatus,
        statusNote || `Status progressed to ${newStatus} by NGO dispatch staff.`
      );
      setCurrentComplaint(res.complaint);
      onUpdated(res.complaint);
      setStatusNote("");
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAssignVolunteer = async () => {
    if (!selectedVolunteerId) return;
    setLoadingAction(true);
    try {
      const res = await api.assignVolunteer(currentComplaint.id, selectedVolunteerId);
      setCurrentComplaint(res.complaint);
      onUpdated(res.complaint);
    } catch (err) {
      console.error("Volunteer assign error:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteMessage.trim()) return;

    setLoadingAction(true);
    try {
      const res = await api.addComplaintNote(currentComplaint.id, noteMessage, isInternalNote);
      setCurrentComplaint(res.complaint);
      onUpdated(res.complaint);
      setNoteMessage("");
    } catch (err) {
      console.error("Add note error:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 animate-scaleUp">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold">
              <span className="material-symbols-outlined">pets</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold bg-slate-800 px-2 py-0.5 rounded text-orange-400">
                  #{currentComplaint.trackingId}
                </span>
                <StatusBadge status={currentComplaint.status} size="sm" />
                <PriorityBadge priority={currentComplaint.priority} size="sm" />
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-white mt-1 truncate max-w-lg">
                {currentComplaint.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Row: Sequential Status Workflow Actions Bar */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <span className="material-symbols-outlined text-orange-600 !text-base">
                published_with_changes
              </span>
              <span>Workflow Action:</span>
              {currentComplaint.status === "Reported" && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  🟡 Pending Triage
                </span>
              )}
              {currentComplaint.status === "Accepted" && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  🟢 Accepted
                </span>
              )}
              {currentComplaint.status === "In Progress" && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full">
                  🔵 Rescue Team Dispatched
                </span>
              )}
              {(currentComplaint.status === "Resolved" || currentComplaint.status === "Closed") && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  ✅ Resolved
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* STEP 1: IF status == "Reported" / "Pending" -> Show ONLY Accept */}
              {currentComplaint.status === "Reported" && (
                <button
                  type="button"
                  onClick={() => handleStatusChange("Accepted")}
                  disabled={loadingAction}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined !text-base">thumb_up</span>
                  <span>{loadingAction ? "Accepting..." : "Accept"}</span>
                </button>
              )}

              {/* STEP 2: IF status == "Accepted" -> Show ONLY Dispatch Rescue Team */}
              {currentComplaint.status === "Accepted" && (
                <button
                  type="button"
                  onClick={() => handleStatusChange("In Progress")}
                  disabled={loadingAction}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined !text-base">ambulance</span>
                  <span>{loadingAction ? "Dispatching..." : "Dispatch Rescue Team"}</span>
                </button>
              )}

              {/* STEP 3: IF status == "In Progress" -> Show ONLY Mark Resolved */}
              {currentComplaint.status === "In Progress" && (
                <button
                  type="button"
                  onClick={() => handleStatusChange("Resolved")}
                  disabled={loadingAction}
                  className="px-4 py-2 bg-[#006c49] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined !text-base">task_alt</span>
                  <span>{loadingAction ? "Resolving..." : "Mark Resolved"}</span>
                </button>
              )}

              {/* STEP 4: IF status == "Resolved" or "Closed" -> Hide action buttons & Show Completed Badge */}
              {(currentComplaint.status === "Resolved" || currentComplaint.status === "Closed") && (
                <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-extrabold shadow-xs">
                  <span className="material-symbols-outlined !text-base text-emerald-700">verified</span>
                  <span>✓ Rescue Completed</span>
                </div>
              )}
            </div>
          </div>

          {/* 2-Column Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Citizen & Incident Details */}
            <div className="space-y-4">
              {/* Reporter Box */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Citizen Reporter
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">
                      {currentComplaint.citizenName}
                    </h4>
                    <p className="text-xs text-slate-600 font-mono">
                      {currentComplaint.contactNumber}
                    </p>
                  </div>
                  <a
                    href={`tel:${currentComplaint.contactNumber}`}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                  >
                    <span className="material-symbols-outlined !text-sm">call</span>
                    <span>Call Reporter</span>
                  </a>
                </div>
              </div>

              {/* Location Box */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Location & Area
                </span>
                <p className="text-xs font-semibold text-slate-900">
                  {currentComplaint.address}
                </p>
                {currentComplaint.landmark && (
                  <p className="text-xs text-slate-500">
                    <strong>Landmark:</strong> {currentComplaint.landmark}
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  {currentComplaint.city} - {currentComplaint.pincode}
                </p>
                {currentComplaint.location && (
                  <div className="pt-1 flex items-center gap-2 text-[11px] text-emerald-800 font-mono">
                    <span className="material-symbols-outlined !text-sm text-emerald-600">
                      my_location
                    </span>
                    <span>
                      GPS: {currentComplaint.location.latitude.toFixed(4)},{" "}
                      {currentComplaint.location.longitude.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Description & Symptoms
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {currentComplaint.description}
                </p>
                {currentComplaint.dogCondition && currentComplaint.dogCondition.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {currentComplaint.dogCondition.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-orange-100 text-orange-900 text-[10px] font-semibold rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Volunteer Assignment & Photos */}
            <div className="space-y-4">
              {/* Volunteer Assignment Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Assign Field Volunteer / Ambulance
                </span>

                <div className="flex gap-2">
                  <select
                    value={selectedVolunteerId}
                    onChange={(e) => setSelectedVolunteerId(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  >
                    {volunteers.map((vol) => (
                      <option key={vol.id} value={vol.id}>
                        {vol.name} ({vol.availability} - {vol.skills.slice(0, 2).join(", ")})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleAssignVolunteer}
                    disabled={loadingAction}
                    className="px-4 py-2 bg-[#006c49] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                  >
                    Assign
                  </button>
                </div>

                {currentComplaint.volunteerName && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                    <div>
                      <strong className="block">{currentComplaint.volunteerName}</strong>
                      <span className="text-[11px] font-mono text-emerald-700">
                        {currentComplaint.volunteerPhone}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                      Assigned
                    </span>
                  </div>
                )}
              </div>

              {/* Photos Gallery */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Photo Evidence ({currentComplaint.images.length})
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {currentComplaint.images.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedPhoto(img)}
                      className="aspect-video rounded-xl overflow-hidden border border-slate-200 cursor-pointer relative group"
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                        Click to Expand
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline & Notes Tabs */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Timeline */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Lifecycle Timeline Logs
              </h3>
              <TimelineView events={currentComplaint.timeline} />
            </div>

            {/* Notes Stream & Composer */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Internal Case Notes & Comments
              </h3>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {currentComplaint.notes && currentComplaint.notes.length > 0 ? (
                  currentComplaint.notes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-3 rounded-xl border text-xs ${
                        note.isInternal
                          ? "bg-amber-50/70 border-amber-200 text-amber-950"
                          : "bg-white border-slate-200 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <strong className="text-slate-700">{note.authorName} ({note.authorRole})</strong>
                        <span>{new Date(note.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p>{note.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No notes added yet.</p>
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-2 pt-2 border-t border-slate-100">
                <textarea
                  rows={2}
                  value={noteMessage}
                  onChange={(e) => setNoteMessage(e.target.value)}
                  placeholder="Type an internal update, clinic medicine name, or volunteer instruction..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Internal note (staff only)</span>
                  </label>
                  <button
                    type="submit"
                    disabled={loadingAction || !noteMessage.trim()}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    Post Note
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-sm"
          >
            Close Details
          </button>
        </div>
      </div>

      {/* Modal Zoom */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        >
          <img
            src={selectedPhoto}
            alt=""
            className="max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl object-contain"
          />
        </div>
      )}
    </div>
  );
};
