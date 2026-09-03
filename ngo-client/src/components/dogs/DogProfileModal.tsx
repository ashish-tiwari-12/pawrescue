import React, { useState } from "react";
import { DogProfile, User } from "../../types";
import { api } from "../../api/client";

interface Props {
  dog: DogProfile | null;
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedDog: DogProfile) => void;
}

export const DogProfileModal: React.FC<Props> = ({
  dog,
  user,
  isOpen,
  onClose,
  onUpdated
}) => {
  if (!isOpen || !dog) return null;

  const [activeTab, setActiveTab] = useState<"overview" | "medical" | "vaccination" | "rescue">("overview");
  const [selectedImage, setSelectedImage] = useState<string>(dog.images?.[0] || "");
  
  // Medical Form Modal state
  const [showMedForm, setShowMedForm] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [medications, setMedications] = useState("");
  const [treatments, setTreatments] = useState("");
  const [attendingVet, setAttendingVet] = useState(user?.name || "Dr. Staff Surgeon");
  const [vetNotes, setVetNotes] = useState("");
  const [recoveryStatus, setRecoveryStatus] = useState("Recovering");
  const [medSubmitting, setMedSubmitting] = useState(false);

  // Vaccination Form Modal state
  const [showVacForm, setShowVacForm] = useState(false);
  const [vaccineType, setVaccineType] = useState<string>("Anti-Rabies (ARV)");
  const [administeredBy, setAdministeredBy] = useState(user?.name || "Noida Animal Shelter");
  const [vacSubmitting, setVacSubmitting] = useState(false);

  const isNGO = user?.role === "ngo_admin" || user?.role === "volunteer";

  const handleAddMedical = async (e: React.FormEvent) => {
    e.preventDefault();
    setMedSubmitting(true);
    try {
      const res = await api.addMedicalRecord(dog.id, {
        diagnosis,
        medications: medications.split(",").map((m) => m.trim()).filter(Boolean),
        treatments: treatments.split(",").map((t) => t.trim()).filter(Boolean),
        attendingVet,
        vetNotes,
        recoveryStatus
      });
      onUpdated(res.dog);
      setShowMedForm(false);
      setDiagnosis("");
      setMedications("");
      setTreatments("");
    } catch (err) {
      console.error("Failed to add medical record:", err);
    } finally {
      setMedSubmitting(false);
    }
  };

  const handleAddVaccination = async (e: React.FormEvent) => {
    e.preventDefault();
    setVacSubmitting(true);
    try {
      const res = await api.recordVaccination(dog.id, {
        vaccineType,
        administeredBy
      });
      onUpdated(res.dog);
      setShowVacForm(false);
    } catch (err) {
      console.error("Failed to record vaccination:", err);
    } finally {
      setVacSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-100 animate-scaleUp flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-[#006c49] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-extrabold text-xl shadow-lg">
              🐾
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-black text-xs bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                  #{dog.dogId}
                </span>
                <span className="text-xs font-bold bg-white/10 text-slate-200 px-2 py-0.5 rounded-full">
                  {dog.gender} • {dog.estimatedAge}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white mt-1">
                {dog.name || `Community Dog (${dog.dogId})`}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content Tabs Header */}
        <div className="flex border-b border-slate-100 bg-slate-50 px-6 shrink-0 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3.5 px-4 border-b-2 transition-all whitespace-nowrap ${
              activeTab === "overview"
                ? "border-orange-500 text-orange-600 font-extrabold bg-white"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            📋 Profile & Area
          </button>
          <button
            onClick={() => setActiveTab("vaccination")}
            className={`py-3.5 px-4 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "vaccination"
                ? "border-emerald-600 text-emerald-700 font-extrabold bg-white"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>💉 Vaccinations</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
              {dog.vaccinations?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("medical")}
            className={`py-3.5 px-4 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "medical"
                ? "border-blue-600 text-blue-700 font-extrabold bg-white"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>🩺 Medical History</span>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full">
              {dog.medicalHistory?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("rescue")}
            className={`py-3.5 px-4 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "rescue"
                ? "border-amber-600 text-amber-700 font-extrabold bg-white"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>🚨 Rescue Reports</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full">
              {dog.rescueHistory?.length || 0}
            </span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Photo Gallery */}
              <div className="md:col-span-5 space-y-3">
                <div className="aspect-square rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-slate-100">
                  <img
                    src={selectedImage || dog.images?.[0]}
                    alt={dog.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {dog.images && dog.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {dog.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(img)}
                        className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                          selectedImage === img ? "border-orange-500 scale-105" : "border-slate-200 opacity-70"
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Dog Details */}
              <div className="md:col-span-7 space-y-4">
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1 ${
                      dog.vaccinationStatus === "Fully Vaccinated"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}
                  >
                    <span className="material-symbols-outlined !text-sm">vaccines</span>
                    <span>{dog.vaccinationStatus}</span>
                  </span>

                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1 ${
                      dog.sterilizationStatus.includes("Ear Notched")
                        ? "bg-purple-100 text-purple-800 border border-purple-200"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    <span className="material-symbols-outlined !text-sm">content_cut</span>
                    <span>{dog.sterilizationStatus}</span>
                  </span>

                  <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-orange-100 text-orange-800 border border-orange-200 flex items-center gap-1">
                    <span className="material-symbols-outlined !text-sm">volunteer_activism</span>
                    <span>{dog.adoptionStatus}</span>
                  </span>
                </div>

                {/* Key Attributes */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Breed</span>
                    <strong className="text-slate-800">{dog.breed}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Gender & Age</span>
                    <strong className="text-slate-800">{dog.gender} • {dog.estimatedAge}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Coat & Color Pattern</span>
                    <strong className="text-slate-800">{dog.colorPattern}</strong>
                  </div>
                </div>

                {/* Location & Last Seen Card */}
                <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-emerald-800 flex items-center gap-1">
                      <span className="material-symbols-outlined !text-sm">location_on</span>
                      Primary Territory & Sighting Area
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      Last Seen: {dog.lastSeenDate}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    {dog.currentArea} ({dog.city} - {dog.pincode})
                  </h4>
                  <p className="text-[11px] text-emerald-900">
                    Cared for by <strong>{dog.caretakersCount || 1} local community caretakers</strong>. Registered by {dog.registeredByNgoName || "Verified Partner"}.
                  </p>
                </div>

                {/* Sterilization Card */}
                {dog.sterilization && (
                  <div className="p-3.5 bg-purple-50/60 border border-purple-200/70 rounded-2xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-purple-950">
                        ✂️ Animal Birth Control (ABC) Record
                      </span>
                      <span className="text-[10px] font-mono text-purple-800">
                        {dog.sterilization.surgeryDate}
                      </span>
                    </div>
                    <p className="text-[11px] text-purple-900">
                      Ear Notch: <strong>{dog.sterilization.earNotchSide}</strong> • Surgeon: {dog.sterilization.veterinarySurgeon} ({dog.sterilization.operatingNgo})
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Vaccination Schedule */}
          {activeTab === "vaccination" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900">
                  Anti-Rabies & Routine Immunization History
                </h3>
                {isNGO && (
                  <button
                    onClick={() => setShowVacForm(true)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                  >
                    <span className="material-symbols-outlined !text-sm">add</span>
                    <span>Record Vaccination</span>
                  </button>
                )}
              </div>

              {dog.vaccinations && dog.vaccinations.length > 0 ? (
                <div className="space-y-2.5">
                  {dog.vaccinations.map((vac) => (
                    <div
                      key={vac.id}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                          <span className="material-symbols-outlined">vaccines</span>
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-900">{vac.vaccineType}</h4>
                          <p className="text-[11px] text-slate-500">
                            Administered by: <strong>{vac.administeredBy}</strong> ({vac.administeredDate})
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Next Due</span>
                        <span className="text-xs font-mono font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {vac.nextDueDate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs">
                  No vaccination records logged yet for this community dog.
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Medical History */}
          {activeTab === "medical" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900">
                  Clinical Diagnoses & Treatment History
                </h3>
                {isNGO && (
                  <button
                    onClick={() => setShowMedForm(true)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                  >
                    <span className="material-symbols-outlined !text-sm">add</span>
                    <span>Add Clinical Record</span>
                  </button>
                )}
              </div>

              {dog.medicalHistory && dog.medicalHistory.length > 0 ? (
                <div className="space-y-3">
                  {dog.medicalHistory.map((med) => (
                    <div
                      key={med.id}
                      className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                          {med.diagnosis}
                        </span>
                        <span className="text-[10px] text-slate-400">{med.treatmentDate}</span>
                      </div>

                      {med.treatments && med.treatments.length > 0 && (
                        <div className="text-xs text-slate-700">
                          <strong className="text-[11px] text-slate-500 block">Procedures & Dressings:</strong>
                          <span>{med.treatments.join(", ")}</span>
                        </div>
                      )}

                      {med.medications && med.medications.length > 0 && (
                        <div className="text-xs text-slate-700">
                          <strong className="text-[11px] text-slate-500 block">Prescribed Medications:</strong>
                          <span className="font-mono text-emerald-800">{med.medications.join(", ")}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Attending Vet: <strong>{med.attendingVet}</strong></span>
                        <span className="font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.2 rounded">
                          {med.recoveryStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs">
                  No previous illness or clinical operations recorded.
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Rescue Reports */}
          {activeTab === "rescue" && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900">
                Linked Citizen Rescue Reports
              </h3>

              {dog.rescueHistory && dog.rescueHistory.length > 0 ? (
                <div className="space-y-2.5">
                  {dog.rescueHistory.map((r, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                            #{r.trackingId}
                          </span>
                          <span className="font-bold text-xs text-slate-900">{r.category}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{r.description}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">{r.date}</span>
                        <span className="text-[11px] font-bold text-emerald-700">{r.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs">
                  No past emergency distress incidents logged for this dog.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-mono">
            National Registry UID: {dog.dogId}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Close Profile
          </button>
        </div>

        {/* Sub-Modal: Add Medical Record */}
        {showMedForm && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 flex items-center justify-center p-4">
            <form
              onSubmit={handleAddMedical}
              className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-scaleUp"
            >
              <h3 className="font-extrabold text-sm text-slate-900">
                Log Medical Diagnosis & Treatment
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Diagnosis / Injury *
                </label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Fractured Left Hind Leg / Demodectic Mange"
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Medications (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={medications}
                    onChange={(e) => setMedications(e.target.value)}
                    placeholder="Meloxicam, Amoxicillin"
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Attending Vet *
                  </label>
                  <input
                    type="text"
                    required
                    value={attendingVet}
                    onChange={(e) => setAttendingVet(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vet Clinical Notes
                </label>
                <textarea
                  rows={2}
                  value={vetNotes}
                  onChange={(e) => setVetNotes(e.target.value)}
                  placeholder="Cast applied, dressing change scheduled in 4 days..."
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMedForm(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={medSubmitting}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {medSubmitting ? "Saving..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sub-Modal: Record Vaccination */}
        {showVacForm && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 flex items-center justify-center p-4">
            <form
              onSubmit={handleAddVaccination}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp"
            >
              <h3 className="font-extrabold text-sm text-slate-900">
                Record Dog Vaccination
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vaccine Type *
                </label>
                <select
                  value={vaccineType}
                  onChange={(e) => setVaccineType(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl"
                >
                  <option value="Anti-Rabies (ARV)">Anti-Rabies (ARV)</option>
                  <option value="7-in-1 (DHPPIL)">7-in-1 (DHPPIL)</option>
                  <option value="Corona">Corona</option>
                  <option value="Booster Dose">Booster Dose</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Administered By / Drive *
                </label>
                <input
                  type="text"
                  required
                  value={administeredBy}
                  onChange={(e) => setAdministeredBy(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVacForm(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={vacSubmitting}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {vacSubmitting ? "Recording..." : "Record Vaccination"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
