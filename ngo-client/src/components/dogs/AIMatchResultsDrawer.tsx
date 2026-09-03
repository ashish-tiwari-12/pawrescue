import React from "react";
import { AIMatchCandidate, DogProfile } from "../../types";

interface Props {
  queryImage: string;
  matches: AIMatchCandidate[];
  isOpen: boolean;
  onClose: () => void;
  onSelectExistingDog: (dog: DogProfile) => void;
  onCreateNewDog: () => void;
}

export const AIMatchResultsDrawer: React.FC<Props> = ({
  queryImage,
  matches,
  isOpen,
  onClose,
  onSelectExistingDog,
  onCreateNewDog
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-100 animate-scaleUp flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-md shadow-orange-500/30">
              <span className="material-symbols-outlined !text-xl">psychology</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-orange-400/20 text-orange-300 px-2 py-0.5 rounded uppercase">
                  AI Visual Dog Matcher
                </span>
                <span className="text-[10px] text-slate-400">FAISS 512-Dim Embeddings</span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white mt-0.5">
                Potential Existing Dog Matches Found
              </h2>
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
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Query Photo & AI Directive Banner */}
          <div className="p-4 bg-orange-50/70 border border-orange-200/80 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-orange-300 shrink-0 bg-slate-100 shadow-sm">
              <img src={queryImage} alt="Uploaded Sighting" className="w-full h-full object-cover" />
            </div>
            <div className="space-y-1 text-xs text-slate-700">
              <span className="text-[10px] uppercase font-extrabold text-orange-800 block">
                📷 Newly Uploaded Rescue Sighting Photo
              </span>
              <p className="font-semibold text-slate-900">
                Our AI model analyzed coat patterns, facial markings, and ear posture.
              </p>
              <p className="text-[11px] text-slate-500">
                Human verification required: Check below candidates to decide whether this dog is already registered in the National Registry.
              </p>
            </div>
          </div>

          {/* Matches List */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Top Registry Match Candidates ({matches.length})
            </h3>

            {matches.map((candidate, idx) => {
              const { dog, similarityScore, confidence, matchingFeatures } = candidate;
              const isTop = idx === 0 && similarityScore >= 85;

              return (
                <div
                  key={dog.id}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isTop
                      ? "border-emerald-500 bg-emerald-50/40 shadow-sm"
                      : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                      <img
                        src={dog.images?.[0] || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400"}
                        alt={dog.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          #{dog.dogId}
                        </span>
                        <strong className="text-xs text-slate-800">{dog.name || "Community Dog"}</strong>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            confidence === "High"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {similarityScore}% Match
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        📍 {dog.currentArea} ({dog.city}) • {dog.breed}
                      </p>

                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {matchingFeatures.map((f, i) => (
                          <span
                            key={i}
                            className="text-[9px] font-semibold bg-white border border-slate-200 text-slate-600 px-1.5 py-0.2 rounded"
                          >
                            ✓ {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectExistingDog(dog)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-[#006c49] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all shrink-0 flex items-center justify-center gap-1"
                  >
                    <span>Link to #{dog.dogId}</span>
                    <span className="material-symbols-outlined !text-sm">check</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-slate-500 text-center sm:text-left">
            Not among the matches above? Create a fresh unique registry record for this dog.
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-100"
            >
              Dismiss
            </button>
            <button
              onClick={onCreateNewDog}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-[#f97316] hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined !text-base">add_circle</span>
              <span>Register as New Dog</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
