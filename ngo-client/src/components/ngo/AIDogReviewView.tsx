import React, { useState, useEffect } from "react";
import { DogProfile } from "../../types";
import { api } from "../../api/client";

interface Props {
  onDogApproved?: (dog: DogProfile) => void;
  onSelectDog?: (dog: DogProfile) => void;
}

export const AIDogReviewView: React.FC<Props> = ({ onDogApproved, onSelectDog }) => {
  const [drafts, setDrafts] = useState<DogProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [editingDog, setEditingDog] = useState<DogProfile | null>(null);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editBreed, setEditBreed] = useState("");
  const [editColorPattern, setEditColorPattern] = useState("");
  const [editEstimatedAge, setEditEstimatedAge] = useState("");
  const [editGender, setEditGender] = useState<"Male" | "Female" | "Unknown">("Unknown");
  const [editCurrentArea, setEditCurrentArea] = useState("");
  const [editVaccinationStatus, setEditVaccinationStatus] = useState("Partially Vaccinated");
  const [editSterilizationStatus, setEditSterilizationStatus] = useState("Unsterilized");

  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const res = await api.getPendingDogReviews();
      setDrafts(res.drafts);
    } catch (err) {
      console.error("Failed to load AI drafts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const handleApprove = async (dog: DogProfile) => {
    setActionLoadingId(dog.id);
    try {
      const res = await api.reviewDogProfile(dog.id, { action: "approve" });
      setDrafts((prev) => prev.filter((d) => d.id !== dog.id));
      setToast({
        title: "✓ Profile Approved & Published!",
        message: `Dog #${dog.dogId} is now live on the National Community Dog Registry.`
      });
      setTimeout(() => setToast(null), 4000);
      if (onDogApproved) onDogApproved(res.dog);
    } catch (err) {
      console.error("Failed to approve dog profile:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (dog: DogProfile) => {
    if (!window.confirm(`Are you sure you want to reject and discard draft profile #${dog.dogId}?`)) {
      return;
    }
    setActionLoadingId(dog.id);
    try {
      await api.reviewDogProfile(dog.id, { action: "reject" });
      setDrafts((prev) => prev.filter((d) => d.id !== dog.id));
      setToast({
        title: "Draft Profile Discarded",
        message: `Dog #${dog.dogId} has been archived.`
      });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error("Failed to reject dog profile:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenEdit = (dog: DogProfile) => {
    setEditingDog(dog);
    setEditName(dog.name || "");
    setEditBreed(dog.breed || dog.aiMetadata?.breedPrediction?.breed || "Indian Pariah / Indie");
    setEditColorPattern(dog.colorPattern || dog.aiMetadata?.colorPrediction?.pattern || "Brown & White");
    setEditEstimatedAge(dog.estimatedAge || "2 Years");
    setEditGender(dog.gender || "Unknown");
    setEditCurrentArea(dog.currentArea || "");
    setEditVaccinationStatus(dog.vaccinationStatus || "Partially Vaccinated");
    setEditSterilizationStatus(dog.sterilizationStatus || "Unsterilized");
  };

  const handleSaveAndApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDog) return;

    setActionLoadingId(editingDog.id);
    try {
      const res = await api.reviewDogProfile(editingDog.id, {
        action: "edit",
        name: editName,
        breed: editBreed,
        colorPattern: editColorPattern,
        estimatedAge: editEstimatedAge,
        gender: editGender,
        currentArea: editCurrentArea,
        vaccinationStatus: editVaccinationStatus,
        sterilizationStatus: editSterilizationStatus
      });

      setDrafts((prev) => prev.filter((d) => d.id !== editingDog.id));
      setEditingDog(null);
      setToast({
        title: "✓ Profile Customized & Published!",
        message: `Dog #${editingDog.dogId} has been updated and published to the Community Registry.`
      });
      setTimeout(() => setToast(null), 4000);
      if (onDogApproved) onDogApproved(res.dog);
    } catch (err) {
      console.error("Failed to save and approve dog profile:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-900/90 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-500/30 backdrop-blur-md flex items-center gap-3 animate-slideIn">
          <span className="material-symbols-outlined text-emerald-400 !text-2xl">verified</span>
          <div>
            <h4 className="text-xs font-bold">{toast.title}</h4>
            <p className="text-[11px] text-emerald-200">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold border border-indigo-500/30">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span>AI Computer Vision & Feature Profiler</span>
            <span className="bg-indigo-400/20 text-indigo-200 px-2 py-0.2 rounded-full font-mono text-[10px]">
              YOLOv8 + OpenCV Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            AI Dog Profile Review & Approval
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
            When complaints are resolved, our AI pipeline detects breeds, coat patterns, and age groups to generate draft profiles. Review and approve profiles to publish them to the National Community Dog Registry.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            onClick={fetchDrafts}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-all flex items-center gap-1.5 backdrop-blur-sm"
          >
            <span className="material-symbols-outlined !text-base">refresh</span>
            <span>Refresh Queue</span>
          </button>
          <div className="px-4 py-2 bg-indigo-600/30 border border-indigo-400/30 rounded-xl text-xs font-extrabold text-indigo-300">
            {drafts.length} Drafts Awaiting Review
          </div>
        </div>

        {/* Watermark */}
        <span
          className="material-symbols-outlined absolute -right-6 -bottom-10 text-white/5 select-none pointer-events-none"
          style={{ fontSize: "220px" }}
        >
          smart_toy
        </span>
      </div>

      {/* Drafts List Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-semibold">Loading AI-Generated Dog Profiles...</p>
        </div>
      ) : drafts.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-3 card-elevation-1">
          <span className="material-symbols-outlined text-emerald-500 !text-5xl">task_alt</span>
          <h3 className="font-extrabold text-slate-900 text-base">All AI Drafts Reviewed!</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Great job! When field teams resolve new rescue complaints, our AI vision pipeline will automatically analyze the dog photos and queue new draft profiles here for verification.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {drafts.map((dog) => {
            const ai = dog.aiMetadata;
            const primaryImg = dog.images?.[0] || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600";
            const isProcessing = actionLoadingId === dog.id;

            return (
              <div
                key={dog.id}
                className="bg-white rounded-3xl card-elevation-1 border border-slate-100 overflow-hidden flex flex-col justify-between hover:shadow-xl transition-all"
              >
                <div>
                  {/* Top Bar: Dog ID & AI Confidence */}
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-xl">
                        #{dog.dogId}
                      </span>
                      <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                        ⏳ Pending NGO Review
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 bg-indigo-100 px-2.5 py-1 rounded-full">
                      <span className="material-symbols-outlined !text-sm text-indigo-600">psychology</span>
                      <span>{ai?.overallConfidence || 91}% AI Confidence</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex flex-col sm:flex-row gap-5">
                    {/* Dog Photo */}
                    <div className="w-full sm:w-44 aspect-square sm:aspect-auto sm:h-44 rounded-2xl overflow-hidden bg-slate-100 shrink-0 relative group">
                      <img
                        src={primaryImg}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                        Rescue Photo
                      </span>
                    </div>

                    {/* AI Predictions & Details */}
                    <div className="flex-1 min-w-0 space-y-2.5">
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Predicted Breed
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-sm font-extrabold text-slate-900 truncate">
                            🐕 {ai?.breedPrediction?.breed || dog.breed}
                          </strong>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                            {ai?.breedPrediction?.confidence || 92}% Match
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">Coat & Color</span>
                          <strong className="text-slate-800 text-xs truncate block">
                            🎨 {ai?.colorPrediction?.pattern || dog.colorPattern}
                          </strong>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">Age Group</span>
                          <strong className="text-slate-800 text-xs truncate block">
                            ⏳ {ai?.agePrediction?.ageGroup || dog.estimatedAge}
                          </strong>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
                        <div className="truncate">
                          📍 <strong>Location:</strong> {dog.currentArea} ({dog.city})
                        </div>
                        {ai?.matchedTrackingId && (
                          <div className="truncate text-slate-400">
                            📋 <strong>Complaint Reference:</strong> #{ai.matchedTrackingId}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleReject(dog)}
                    disabled={isProcessing}
                    className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                  >
                    Reject Profile
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(dog)}
                      disabled={isProcessing}
                      className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined !text-sm">edit</span>
                      <span>Edit Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApprove(dog)}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined !text-base">verified</span>
                      <span>{isProcessing ? "Publishing..." : "Approve & Publish"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit & Customize Modal */}
      {editingDog && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <form
            onSubmit={handleSaveAndApprove}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 animate-scaleUp max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600">edit_note</span>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Customize Profile #{editingDog.dogId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingDog(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Dog Name / Nickname</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Bruno / Sheru / Rocky"
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Breed Classification</label>
                  <input
                    type="text"
                    value={editBreed}
                    onChange={(e) => setEditBreed(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Coat & Color Pattern</label>
                  <input
                    type="text"
                    value={editColorPattern}
                    onChange={(e) => setEditColorPattern(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estimated Age</label>
                  <input
                    type="text"
                    value={editEstimatedAge}
                    onChange={(e) => setEditEstimatedAge(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gender</label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Territory / Area</label>
                <input
                  type="text"
                  value={editCurrentArea}
                  onChange={(e) => setEditCurrentArea(e.target.value)}
                  required
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vaccination Status</label>
                  <select
                    value={editVaccinationStatus}
                    onChange={(e) => setEditVaccinationStatus(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Fully Vaccinated">Fully Vaccinated</option>
                    <option value="Partially Vaccinated">Partially Vaccinated</option>
                    <option value="Not Vaccinated">Not Vaccinated</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sterilization Status</label>
                  <select
                    value={editSterilizationStatus}
                    onChange={(e) => setEditSterilizationStatus(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Sterilized (Ear Notched)">Sterilized (Ear Notched)</option>
                    <option value="Unsterilized">Unsterilized</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingDog(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoadingId === editingDog.id}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                {actionLoadingId === editingDog.id ? "Saving..." : "Save & Publish to Registry"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
