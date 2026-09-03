import React, { useState } from "react";
import { DogProfile, User, NGO } from "../../types";
import { api } from "../../api/client";

interface Props {
  dogs: DogProfile[];
  user: User | null;
  ngo: NGO | null;
  onSelectDog: (dog: DogProfile) => void;
  onRefreshDogs: () => void;
}

export const NGODogRegistry: React.FC<Props> = ({
  dogs,
  ngo,
  onSelectDog,
  onRefreshDogs
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);

  // New Dog Form
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("Indian Pariah / Indie");
  const [gender, setGender] = useState<"Male" | "Female" | "Unknown">("Male");
  const [estimatedAge, setEstimatedAge] = useState("2 Years");
  const [colorPattern, setColorPattern] = useState("");
  const [currentArea, setCurrentArea] = useState("");
  const [city, setCity] = useState(ngo?.city || "Noida");
  const [pincode, setPincode] = useState("201301");
  const [vaccinationStatus, setVaccinationStatus] = useState("Fully Vaccinated");
  const [sterilizationStatus, setSterilizationStatus] = useState("Sterilized (Ear Notched)");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const filteredDogs = dogs.filter((d) => {
    if (cityFilter !== "All" && d.city !== cityFilter) return false;
    if (statusFilter === "Vaccinated" && d.vaccinationStatus !== "Fully Vaccinated") return false;
    if (statusFilter === "Sterilized" && !d.sterilizationStatus.includes("Ear Notched")) return false;
    if (statusFilter === "Due Soon" && d.vaccinationStatus !== "Due Soon") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.dogId.toLowerCase().includes(q) ||
        (d.name && d.name.toLowerCase().includes(q)) ||
        d.breed.toLowerCase().includes(q) ||
        d.currentArea.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray: File[] = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
      const newUrls = filesArray.map((f) => URL.createObjectURL(f));
      setPreviewUrls((prev) => [...prev, ...newUrls]);
    }
  };

  const handleCreateDog = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("breed", breed);
      formData.append("gender", gender);
      formData.append("estimatedAge", estimatedAge);
      formData.append("colorPattern", colorPattern);
      formData.append("currentArea", currentArea);
      formData.append("city", city);
      formData.append("pincode", pincode);
      formData.append("vaccinationStatus", vaccinationStatus);
      formData.append("sterilizationStatus", sterilizationStatus);
      formData.append("registeredByNgoName", ngo?.name || "PawConnect Partner");

      selectedFiles.forEach((file) => formData.append("images", file));

      if (selectedFiles.length === 0) {
        formData.append(
          "imageUrls",
          JSON.stringify([
            "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=80"
          ])
        );
      }

      await api.createDogProfile(formData);
      onRefreshDogs();
      setShowAddModal(false);
      setName("");
      setColorPattern("");
      setCurrentArea("");
      setSelectedFiles([]);
      setPreviewUrls([]);
    } catch (err) {
      console.error("Failed to create dog profile:", err);
    } finally {
      setCreating(false);
    }
  };

  const totalRegistered = dogs.length;
  const vaccinatedCount = dogs.filter((d) => d.vaccinationStatus === "Fully Vaccinated").length;
  const sterilizedCount = dogs.filter((d) => d.sterilizationStatus.includes("Ear Notched")).length;
  const dueVaccineCount = dogs.filter((d) => d.vaccinationStatus === "Due Soon").length;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#006c49] p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold border border-emerald-500/30">
            <span className="material-symbols-outlined !text-sm">pets</span>
            <span>National Centralized Dog Registry (Noida / Delhi-NCR)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Community Dog Identification & Medical Registry
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
            Track individual street dogs across your coverage territory with unique Dog UIDs, immunization records, ABC ear-notches, and AI visual match logs.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-2xl text-xs sm:text-sm shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2 z-10 shrink-0 hover:scale-105"
        >
          <span className="material-symbols-outlined !text-xl">add_circle</span>
          <span>Register New Dog</span>
        </button>

        <span
          className="material-symbols-outlined absolute -right-6 -bottom-10 text-white/5 select-none pointer-events-none"
          style={{ fontSize: "220px" }}
        >
          pets
        </span>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl card-elevation-1 border border-slate-100">
          <span className="text-xs font-semibold text-slate-500 block">Total Registered Dogs</span>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalRegistered}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Across assigned coverage zones</p>
        </div>

        <div className="bg-white p-5 rounded-2xl card-elevation-1 border border-slate-100">
          <span className="text-xs font-semibold text-emerald-700 block">💉 Immunized (ARV)</span>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {vaccinatedCount} ({totalRegistered > 0 ? Math.round((vaccinatedCount / totalRegistered) * 100) : 85}%)
          </div>
          <p className="text-[11px] text-emerald-600/80 mt-0.5">Anti-Rabies vaccinated</p>
        </div>

        <div className="bg-white p-5 rounded-2xl card-elevation-1 border border-slate-100">
          <span className="text-xs font-semibold text-purple-700 block">✂️ ABC Sterilized</span>
          <div className="text-2xl font-black text-purple-700 mt-2">
            {sterilizedCount} ({totalRegistered > 0 ? Math.round((sterilizedCount / totalRegistered) * 100) : 78}%)
          </div>
          <p className="text-[11px] text-purple-600/80 mt-0.5">Ear-notched community strays</p>
        </div>

        <div className="bg-white p-5 rounded-2xl card-elevation-1 border border-amber-100">
          <span className="text-xs font-semibold text-amber-800 block">⏳ Vaccine Booster Due</span>
          <div className="text-2xl font-black text-amber-700 mt-2">{dueVaccineCount}</div>
          <p className="text-[11px] text-amber-600 mt-0.5 font-medium">Due in next 30 days</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-6 rounded-3xl card-elevation-1 border border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 !text-xl">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Dog ID (DOG-0023), Name, Breed, or Territory..."
              className="w-full pl-11 pr-4 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 font-medium"
            >
              <option value="All">All Health Statuses</option>
              <option value="Vaccinated">Vaccinated Only</option>
              <option value="Sterilized">Sterilized (Ear Notched)</option>
              <option value="Due Soon">Booster Due Soon</option>
            </select>

            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 font-medium"
            >
              <option value="All">All Cities</option>
              <option value="Noida">Noida</option>
              <option value="Ghaziabad">Ghaziabad</option>
              <option value="New Delhi">New Delhi</option>
            </select>
          </div>
        </div>

        {/* Registry Table (Desktop: Table, Mobile: Cards) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="p-4">Dog ID & Photo</th>
                <th className="p-4">Name & Breed</th>
                <th className="p-4">Primary Territory</th>
                <th className="p-4">Vaccination</th>
                <th className="p-4">Sterilization</th>
                <th className="p-4">Last Sighting</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    No registered dogs match your filter.
                  </td>
                </tr>
              ) : (
                filteredDogs.map((dog) => (
                  <tr
                    key={dog.id}
                    onClick={() => onSelectDog(dog)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={dog.images?.[0] || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200"}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <span className="font-mono font-black text-slate-900 block">
                            #{dog.dogId}
                          </span>
                          <span className="text-[10px] text-slate-400">{dog.gender} • {dog.estimatedAge}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <strong className="text-slate-900 block">{dog.name || "Unnamed"}</strong>
                      <span className="text-[11px] text-slate-500">{dog.breed}</span>
                    </td>

                    <td className="p-4 max-w-[200px]">
                      <span className="truncate block font-medium text-slate-800">
                        {dog.currentArea}
                      </span>
                      <span className="text-[11px] text-slate-400">{dog.city} ({dog.pincode})</span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          dog.vaccinationStatus === "Fully Vaccinated"
                            ? "bg-emerald-100 text-emerald-800"
                            : dog.vaccinationStatus === "Due Soon"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {dog.vaccinationStatus}
                      </span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          dog.sterilizationStatus.includes("Ear Notched")
                            ? "bg-purple-100 text-purple-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {dog.sterilizationStatus.includes("Ear Notched") ? "✂️ Sterilized" : "Unsterilized"}
                      </span>
                    </td>

                    <td className="p-4 text-slate-500 font-mono text-[11px]">
                      {dog.lastSeenDate}
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDog(dog);
                        }}
                        className="px-3 py-1.5 bg-[#006c49] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Registry Cards (< 768px) */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredDogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No registered dogs match your filter.
            </div>
          ) : (
            filteredDogs.map((dog) => (
              <div
                key={dog.id}
                onClick={() => onSelectDog(dog)}
                className="p-4 space-y-3 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex gap-3">
                  <img
                    src={dog.images?.[0] || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200"}
                    alt=""
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono font-black text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        #{dog.dogId}
                      </span>
                      <span className="text-[10px] text-slate-500">{dog.gender} • {dog.estimatedAge}</span>
                    </div>
                    <div className="text-xs font-extrabold text-slate-900 mt-1 truncate">
                      {dog.name || "Unnamed Dog"}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {dog.breed} • 📍 {dog.currentArea}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {dog.vaccinationStatus === "Fully Vaccinated" && (
                      <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                        💉 Vaccinated
                      </span>
                    )}
                    {dog.sterilizationStatus.includes("Ear Notched") && (
                      <span className="text-[9px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">
                        ✂️ Ear Notched
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDog(dog);
                    }}
                    className="px-3 py-1.5 bg-[#006c49] text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    View Profile →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal: Register New Dog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateDog}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-4 animate-scaleUp max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                Register New Dog in National Registry
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dog Name / Tag</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sheru, Bruno"
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Breed</label>
                <input
                  type="text"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Age</label>
                <input
                  type="text"
                  value={estimatedAge}
                  onChange={(e) => setEstimatedAge(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Coat Color & Distinguishing Patterns *
                </label>
                <input
                  type="text"
                  required
                  value={colorPattern}
                  onChange={(e) => setColorPattern(e.target.value)}
                  placeholder="e.g. Golden Tan with White Chest Patch and Floppy Ears"
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Territory & Sighting Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={currentArea}
                  onChange={(e) => setCurrentArea(e.target.value)}
                  placeholder="e.g. Near Sector 94 Flyover, Noida Expressway"
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vaccination Status</label>
                <select
                  value={vaccinationStatus}
                  onChange={(e) => setVaccinationStatus(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50"
                >
                  <option value="Fully Vaccinated">Fully Vaccinated</option>
                  <option value="Partially Vaccinated">Partially Vaccinated</option>
                  <option value="Due Soon">Due for Booster</option>
                  <option value="Not Vaccinated">Not Vaccinated</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sterilization Status</label>
                <select
                  value={sterilizationStatus}
                  onChange={(e) => setSterilizationStatus(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50"
                >
                  <option value="Sterilized (Ear Notched)">Sterilized (Ear Notched)</option>
                  <option value="Unsterilized">Unsterilized</option>
                  <option value="Scheduled">Scheduled for ABC Drive</option>
                </select>
              </div>
            </div>

            {/* Photo Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Upload Dog Photo</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />
            </div>

            {previewUrls.length > 0 && (
              <div className="flex gap-2 pt-1">
                {previewUrls.map((url, idx) => (
                  <img key={idx} src={url} alt="" className="w-12 h-12 rounded-lg object-cover border" />
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
              >
                {creating ? "Registering Dog..." : "Register Dog Profile"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
