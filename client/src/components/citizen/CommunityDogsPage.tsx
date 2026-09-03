import React, { useState, useEffect } from "react";
import { DogProfile, User } from "../../types";
import { api } from "../../api/client";

interface Props {
  user: User | null;
  onSelectDog: (dog: DogProfile) => void;
  onStartReport: () => void;
}

export const CommunityDogsPage: React.FC<Props> = ({
  onSelectDog,
  onStartReport
}) => {
  const [dogs, setDogs] = useState<DogProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("All");
  const [vaccineFilter, setVaccineFilter] = useState("All");
  const [sterilizedFilter, setSterilizedFilter] = useState("All");
  const [adoptionFilter, setAdoptionFilter] = useState("All");
  const [sightingSuccessId, setSightingSuccessId] = useState<string | null>(null);

  const fetchDogs = async () => {
    setLoading(true);
    try {
      const res = await api.getDogs({
        search: searchQuery || undefined,
        city: cityFilter !== "All" ? cityFilter : undefined,
        vaccinationStatus: vaccineFilter !== "All" ? vaccineFilter : undefined,
        sterilizationStatus: sterilizedFilter !== "All" ? sterilizedFilter : undefined,
        adoptionStatus: adoptionFilter !== "All" ? adoptionFilter : undefined,
        limit: 50
      });
      setDogs(res.dogs);
    } catch (err) {
      console.error("Failed to load community dogs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDogs();
  }, [cityFilter, vaccineFilter, sterilizedFilter, adoptionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDogs();
  };

  const handleSighting = async (e: React.MouseEvent, dog: DogProfile) => {
    e.stopPropagation();
    try {
      const res = await api.recordDogSighting(dog.id, {
        currentArea: dog.currentArea
      });
      setDogs((prev) => prev.map((d) => (d.id === dog.id ? res.dog : d)));
      setSightingSuccessId(dog.id);
      setTimeout(() => setSightingSuccessId(null), 3000);
    } catch (err) {
      console.error("Failed to record sighting:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        {/* Header Hero */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#9d4300] p-6 sm:p-10 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-xs font-semibold border border-orange-500/30">
              <span className="material-symbols-outlined !text-sm">pets</span>
              <span>National Stray & Community Dog Directory</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Community Dogs in Your Neighborhood
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
              Meet the community dogs of your area. Check immunization & ABC sterilization records, record daily sightings, or sponsor adoption.
            </p>
          </div>

          <button
            onClick={onStartReport}
            className="px-6 py-3.5 bg-[#f97316] hover:bg-orange-600 text-white rounded-2xl text-xs sm:text-sm font-extrabold shadow-lg shadow-orange-500/30 transition-all flex items-center gap-2 z-10 shrink-0 hover:scale-105"
          >
            <span className="material-symbols-outlined !text-lg">emergency</span>
            <span>Report Stray in Distress</span>
          </button>

          <span
            className="material-symbols-outlined absolute -right-6 -bottom-10 text-white/5 select-none pointer-events-none"
            style={{ fontSize: "220px" }}
          >
            pets
          </span>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white p-6 rounded-3xl card-elevation-1 border border-slate-100 space-y-4 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 !text-xl">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Dog ID (e.g. DOG-0023), Breed, Area (e.g. Sector 94), or Color..."
                className="w-full pl-11 pr-4 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#006c49] hover:bg-emerald-800 text-white rounded-2xl text-xs font-bold shadow-md transition-all shrink-0"
            >
              Search Registry
            </button>
          </form>

          {/* Filter Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">City / Region</label>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-medium"
              >
                <option value="All">All Cities (NCR & Pan-India)</option>
                <option value="Noida">Noida</option>
                <option value="Ghaziabad">Ghaziabad</option>
                <option value="New Delhi">New Delhi</option>
                <option value="Mumbai">Mumbai</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Vaccination</label>
              <select
                value={vaccineFilter}
                onChange={(e) => setVaccineFilter(e.target.value)}
                className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-medium"
              >
                <option value="All">All Statuses</option>
                <option value="Fully Vaccinated">Fully Vaccinated</option>
                <option value="Due Soon">Due for Booster</option>
                <option value="Not Vaccinated">Not Vaccinated</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Sterilization (ABC)</label>
              <select
                value={sterilizedFilter}
                onChange={(e) => setSterilizedFilter(e.target.value)}
                className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-medium"
              >
                <option value="All">All</option>
                <option value="Sterilized (Ear Notched)">Sterilized (Ear Notched)</option>
                <option value="Unsterilized">Unsterilized</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Adoption</label>
              <select
                value={adoptionFilter}
                onChange={(e) => setAdoptionFilter(e.target.value)}
                className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-medium"
              >
                <option value="All">All</option>
                <option value="Available for Adoption">Available for Adoption</option>
                <option value="In Foster Care">In Foster Care</option>
                <option value="Community Dog (Free Roaming)">Free Roaming Community Dog</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dog Cards Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-semibold">Loading National Dog Registry...</p>
          </div>
        ) : dogs.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-3">
            <span className="material-symbols-outlined text-slate-300 !text-5xl">pets</span>
            <h3 className="font-extrabold text-slate-900 text-base">No dogs match your search criteria</h3>
            <p className="text-xs text-slate-500">Try adjusting your area or vaccination filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {dogs.map((dog) => (
              <div
                key={dog.id}
                onClick={() => onSelectDog(dog)}
                className="bg-white rounded-3xl card-elevation-1 border border-slate-100 overflow-hidden hover:shadow-xl transition-all cursor-pointer group flex flex-col"
              >
                {/* Photo Header */}
                <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                  <img
                    src={dog.images?.[0] || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600"}
                    alt={dog.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="font-mono font-black text-[11px] bg-slate-900/80 text-white backdrop-blur-md px-2.5 py-1 rounded-xl shadow-sm">
                      #{dog.dogId}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                    {dog.vaccinationStatus === "Fully Vaccinated" && (
                      <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-0.5">
                        💉 Vaccinated
                      </span>
                    )}
                    {dog.sterilizationStatus.includes("Ear Notched") && (
                      <span className="text-[10px] font-extrabold bg-purple-600 text-white px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-0.5">
                        ✂️ Ear Notched
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                        {dog.name || `Community Dog #${dog.dogId}`}
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400 shrink-0">
                        {dog.gender} • {dog.estimatedAge}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                      {dog.breed}
                    </p>

                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">
                      {dog.colorPattern}
                    </p>

                    {/* Area & Last Seen */}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="truncate">📍 {dog.currentArea}</span>
                      <span className="font-semibold text-slate-700 shrink-0">Seen: {dog.lastSeenDate}</span>
                    </div>
                  </div>

                  {/* Citizen "I Saw This Dog" Button */}
                  <div className="pt-2">
                    <button
                      onClick={(e) => handleSighting(e, dog)}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm ${
                        sightingSuccessId === dog.id
                          ? "bg-emerald-600 text-white"
                          : "bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200"
                      }`}
                    >
                      <span className="material-symbols-outlined !text-sm">
                        {sightingSuccessId === dog.id ? "check_circle" : "visibility"}
                      </span>
                      <span>
                        {sightingSuccessId === dog.id ? "Sighting Recorded!" : "I Saw This Dog Today"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
