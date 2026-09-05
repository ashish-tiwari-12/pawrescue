import React, { useState, useEffect } from "react";
import { ComplaintCategory, User } from "../../types";
import { api } from "../../api/client";
import { DogPhotoCaptureSection } from "../common/DogPhotoCaptureSection";
import { validateImageInBrowser } from "../../utils/animalImageValidator";

interface Props {
  user: User | null;
  onSuccess: (complaint: any) => void;
  onCancel: () => void;
  initialEmergency?: boolean;
}

// 4 Quick Primary Problem Cards
const QUICK_ISSUES: {
  category: ComplaintCategory;
  emoji: string;
  title: string;
  badge: string;
  isUrgent?: boolean;
}[] = [
  {
    category: "Emergency Rescue",
    emoji: "🚨",
    title: "Critical Accident / Severe Bleeding",
    badge: "Urgent Ambulance",
    isUrgent: true
  },
  {
    category: "Injured Dog",
    emoji: "🩹",
    title: "Injured / Limping / Bone Fracture",
    badge: "Medical Aid"
  },
  {
    category: "Abandoned Puppy",
    emoji: "🐶",
    title: "Motherless / Abandoned Puppies",
    badge: "Puppy Foster"
  },
  {
    category: "Sick Dog",
    emoji: "🩺",
    title: "Skin Disease / Severe Infection / Weak",
    badge: "Treatment"
  }
];

export const ReportIssuePage: React.FC<Props> = ({
  user,
  onSuccess,
  onCancel,
  initialEmergency = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ComplaintCategory>(
    initialEmergency ? "Emergency Rescue" : "Injured Dog"
  );
  const [isEmergency, setIsEmergency] = useState(initialEmergency);

  // Spot / Landmark & Location
  const [detectedArea, setDetectedArea] = useState("");
  const [spotAddress, setSpotAddress] = useState("");
  const [city, setCity] = useState("Mumbai");
  const [pincode, setPincode] = useState("400053");

  // Optional Extra Note
  const [extraDetails, setExtraDetails] = useState("");
  const [showExtraDetails, setShowExtraDetails] = useState(false);

  // Contact
  const [contactNumber, setContactNumber] = useState(user?.phone || "");
  const [citizenName, setCitizenName] = useState(user?.name || "");

  // GPS Coordinates
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Images state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fetch GPS on load
  useEffect(() => {
    handleFetchLocation();
  }, []);

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`
      );
      if (!response.ok) return;
      const data = await response.json();

      if (data && data.address) {
        const addr = data.address;
        const road = addr.road || addr.street || addr.pedestrian || "";
        const neighborhood = addr.neighbourhood || addr.suburb || addr.residential || "";
        const detectedCity = addr.city || addr.town || addr.municipality || addr.district || "Mumbai";
        const detectedPincode = addr.postcode || "400053";

        const areaName = [road, neighborhood].filter(Boolean).join(", ");
        setDetectedArea(areaName || data.display_name.split(",").slice(0, 2).join(","));
        setCity(detectedCity);
        setPincode(detectedPincode);
      }
    } catch (err) {
      console.warn("Reverse geocode warning:", err);
    }
  };

  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      setLatitude(19.1197);
      setLongitude(72.8468);
      setDetectedArea("Near Andheri West");
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lon);
        setGpsLoading(false);
        await reverseGeocode(lat, lon);
      },
      () => {
        setGpsLoading(false);
        setLatitude(19.1197);
        setLongitude(72.8468);
        setDetectedArea("Near Andheri West, Mumbai");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray: File[] = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);

      const newUrls = filesArray.map((file: File) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newUrls]);
    }
  };

  const resetForm = () => {
    // Revoke object URLs to avoid memory leaks
    previewUrls.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        // ignore
      }
    });
    setSelectedFiles([]);
    setPreviewUrls([]);
    setSpotAddress("");
    setExtraDetails("");
    setShowExtraDetails(false);
    setError(null);
    setSelectedCategory(initialEmergency ? "Emergency Rescue" : "Injured Dog");
    setIsEmergency(initialEmergency);
  };

  const handleRemoveImage = (index: number) => {
    const urlToRemove = previewUrls[index];
    if (urlToRemove) {
      try {
        URL.revokeObjectURL(urlToRemove);
      } catch (e) {
        // ignore
      }
    }
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fullLocation = spotAddress
      ? `${spotAddress}, ${detectedArea || "Local Area"}, ${city}`
      : `${detectedArea || "Local Area"}, ${city}`;

    if (!contactNumber) {
      setError("Please enter a valid phone number so rescue volunteers can reach you.");
      return;
    }

    setLoading(true);

    try {
      // Multi-image rule: Validate EACH image independently; allow submission if at least one valid animal exists
      if (selectedFiles.length > 0) {
        const results = await Promise.all(
          selectedFiles.map((file) => validateImageInBrowser(file))
        );
        const hasValidAnimal = results.some(
          (r) => r.validAnimal && r.animalDetected && r.confidence >= 0.40
        );
        if (!hasValidAnimal) {
          const firstError =
            results[0]?.error ||
            "Please upload a clear image of a Dog, Cat, or Cow. The uploaded image does not contain a supported animal.";
          setError(firstError);
          setLoading(false);
          return;
        }
      }

      const defaultDesc = `${selectedCategory} reported at ${fullLocation}. ${extraDetails}`.trim();

      const formData = new FormData();
      formData.append("category", selectedCategory);
      formData.append("description", defaultDesc);
      formData.append("address", fullLocation);
      formData.append("landmark", spotAddress);
      formData.append("city", city);
      formData.append("pincode", pincode);
      formData.append("contactNumber", contactNumber);
      formData.append("citizenName", citizenName || user?.name || "Concerned Citizen");
      formData.append("isEmergency", String(isEmergency || selectedCategory === "Emergency Rescue"));

      if (latitude && longitude) {
        formData.append("latitude", String(latitude));
        formData.append("longitude", String(longitude));
      }

      // Attach image files
      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });

      // Default sample image if none taken
      if (selectedFiles.length === 0) {
        formData.append(
          "imageUrls",
          JSON.stringify([
            "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=80"
          ])
        );
      }

      const res = await api.createComplaint(formData);
      
      // Vacate and clean all form state, images, and notes for subsequent issues
      resetForm();

      onSuccess(res.complaint);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to submit rescue report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] py-6 sm:py-10">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Quick Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-orange-100 text-orange-800 rounded-full text-[11px] font-bold">
            <span>⚡ Quick Rescue Alert</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Report a Dog
          </h1>
          <p className="text-xs text-slate-500">
            Share the location and details to alert nearby animal rescue NGOs.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-800 text-xs rounded-2xl border-2 border-red-200 flex items-start gap-2.5 animate-shake shadow-xs">
            <span className="material-symbols-outlined !text-xl text-red-600 shrink-0">error</span>
            <div className="space-y-0.5">
              <strong className="font-extrabold block text-red-900">Upload Validation Error</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* AI Animal Validation Status Badge */}
        <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200 rounded-2xl flex items-center justify-between gap-2 text-[11px] text-orange-950 font-semibold shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-orange-600 !text-base shrink-0">verified</span>
            <span className="truncate">
              AI Verification: Supports <strong>Dog</strong>, <strong>Cat</strong>, and <strong>Cow</strong> photos.
            </span>
          </div>
          <span className="shrink-0 text-[10px] uppercase font-mono px-2 py-0.5 bg-orange-200/70 text-orange-900 rounded-full font-bold">
            Active
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* STEP 1: What is the issue? (4 Big Cards) */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl card-elevation-1 border border-slate-100 space-y-3">
            <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[11px] flex items-center justify-center font-bold">
                1
              </span>
              Situation
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {QUICK_ISSUES.map((issue) => {
                const isSelected = selectedCategory === issue.category;
                return (
                  <div
                    key={issue.category}
                    onClick={() => {
                      setSelectedCategory(issue.category);
                      if (issue.isUrgent) setIsEmergency(true);
                    }}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-orange-500 bg-orange-50/50 shadow-sm"
                        : "border-slate-100 hover:border-slate-200 bg-slate-50/40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{issue.emoji}</span>
                      <div>
                        <h3 className="font-bold text-xs text-slate-900">{issue.title}</h3>
                        <span className="text-[10px] text-orange-700 font-semibold bg-orange-100/60 px-1.5 py-0.2 rounded">
                          {issue.badge}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? "border-orange-500 bg-orange-500 text-white" : "border-slate-300"
                      }`}
                    >
                      {isSelected && <span className="material-symbols-outlined !text-xs font-bold">check</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Where is the dog? */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl card-elevation-1 border border-slate-100 space-y-3.5">
            <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[11px] flex items-center justify-center font-bold">
                2
              </span>
              Location
            </label>

            {/* Auto-detected GPS banner */}
            <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-emerald-600 !text-xl shrink-0">
                  location_on
                </span>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                    Auto-Detected Area
                  </span>
                  <p className="text-xs font-extrabold text-slate-900 truncate">
                    {detectedArea || "Detecting your location..."} ({city} - {pincode})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFetchLocation}
                disabled={gpsLoading}
                className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 rounded-xl text-[11px] font-bold shrink-0 hover:bg-slate-50 transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <span className={`material-symbols-outlined !text-sm text-emerald-600 ${gpsLoading ? "animate-spin" : ""}`}>
                  {gpsLoading ? "sync" : "my_location"}
                </span>
                <span>{gpsLoading ? "..." : "Re-detect"}</span>
              </button>
            </div>

            {/* Spot Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Spot / Landmark *
              </label>
              <input
                type="text"
                required
                value={spotAddress}
                onChange={(e) => setSpotAddress(e.target.value)}
                placeholder="e.g. Near Metro Pillar #42, Outside Main Gate"
                className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-slate-50"
              />
            </div>
          </div>

          {/* STEP 3: Photo & Quick Contact */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl card-elevation-1 border border-slate-100 space-y-5">
            <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[11px] flex items-center justify-center font-bold">
                3
              </span>
              Photos & Contact
            </label>

            {/* Live Camera & Gallery Photo Section */}
            <DogPhotoCaptureSection
              selectedFiles={selectedFiles}
              previewUrls={previewUrls}
              onFilesChange={(files, urls) => {
                setSelectedFiles(files);
                setPreviewUrls(urls);
              }}
              onPhotoCapturedAutoGps={handleFetchLocation}
              locationCaptured={Boolean(latitude && longitude)}
              coordinatesText={latitude && longitude ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : undefined}
              maxFiles={5}
            />

            {/* Contact Phone Number */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Contact Phone *
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 !text-lg text-slate-400">
                  call
                </span>
                <input
                  type="tel"
                  required
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full h-11 pl-10 pr-3.5 text-xs border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-slate-50 font-semibold text-slate-900"
                />
              </div>
              <p className="text-[10px] text-slate-500">
                Used by rescuers to locate the animal.
              </p>
            </div>

            {/* Optional Extra Notes Toggle */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowExtraDetails(!showExtraDetails)}
                className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>{showExtraDetails ? "− Hide Details" : "+ Add Note (Optional)"}</span>
              </button>

              {showExtraDetails && (
                <div className="mt-2 space-y-2 animate-fadeIn">
                  <textarea
                    rows={2}
                    value={extraDetails}
                    onChange={(e) => setExtraDetails(e.target.value)}
                    placeholder="Describe the issue or animal details..."
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 bg-slate-50"
                  />
                  <input
                    type="text"
                    value={citizenName}
                    onChange={(e) => setCitizenName(e.target.value)}
                    placeholder="Your Name (Optional)"
                    className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-3.5 border border-slate-200 hover:bg-slate-100 rounded-2xl text-xs font-bold text-slate-600 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-gradient-to-r from-orange-600 to-[#f97316] hover:from-orange-700 hover:to-orange-600 text-white rounded-2xl text-xs sm:text-sm font-extrabold shadow-xl shadow-orange-500/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined !text-xl">emergency</span>
                  <span>Submit Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
