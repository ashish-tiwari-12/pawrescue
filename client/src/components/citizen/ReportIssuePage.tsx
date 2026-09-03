import React, { useState, useEffect } from "react";
import { ComplaintCategory, User } from "../../types";
import { api } from "../../api/client";

interface Props {
  user: User | null;
  onSuccess: (complaint: any) => void;
  onCancel: () => void;
  initialEmergency?: boolean;
}

const CATEGORIES: {
  category: ComplaintCategory;
  icon: string;
  title: string;
  desc: string;
  isUrgent?: boolean;
}[] = [
  {
    category: "Emergency Rescue",
    icon: "emergency",
    title: "Emergency Rescue",
    desc: "Hit & run, deep bleeding, trapped, unconscious dog",
    isUrgent: true
  },
  {
    category: "Injured Dog",
    icon: "healing",
    title: "Injured Stray Dog",
    desc: "Fracture, limping, bite wounds, physical trauma"
  },
  {
    category: "Sick Dog",
    icon: "medical_services",
    title: "Sick / Infected Dog",
    desc: "Severe mange, high fever, vomiting, viral symptoms"
  },
  {
    category: "Abandoned Puppy",
    icon: "pets",
    title: "Abandoned Puppies",
    desc: "Litter found without mother, vulnerable puppies"
  },
  {
    category: "Aggressive Dog",
    icon: "warning",
    title: "Aggressive / Biting Dog",
    desc: "Rabies suspicion, aggressive behavior, territorial"
  },
  {
    category: "Sterilization Request",
    icon: "content_cut",
    title: "Animal Birth Control (ABC)",
    desc: "Request sterilization & spaying for community dogs"
  },
  {
    category: "Vaccination Request",
    icon: "vaccines",
    title: "Anti-Rabies Vaccination",
    desc: "Request vaccination drive for local strays"
  }
];

const DOG_CONDITION_TAGS = [
  "Bleeding / Open Wound",
  "Limping / Cannot Walk",
  "Severe Skin Mange (Hair loss)",
  "Shivering / Hypothermic",
  "Newborn Puppies (No Mother)",
  "Aggressive / Snarls",
  "Maggot Infestation",
  "Dehydrated / Starving",
  "Trapped in Drain / Gate"
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
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  
  // Location & Address States
  const [detectedArea, setDetectedArea] = useState("");
  const [spotDetails, setSpotDetails] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("Mumbai");
  const [pincode, setPincode] = useState("400053");
  const [showManualLocation, setShowManualLocation] = useState(false);

  const [contactNumber, setContactNumber] = useState(user?.phone || "");
  const [citizenName, setCitizenName] = useState(user?.name || "");
  const [isEmergency, setIsEmergency] = useState(initialEmergency);

  // GPS coordinates
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);

  // Images state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([
    "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=80"
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fetch GPS on load
  useEffect(() => {
    handleFetchLocation();
  }, []);

  // Reverse Geocoding with OpenStreetMap Nominatim
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

        const areaName = [road, neighborhood, detectedCity].filter(Boolean).join(", ");
        setDetectedArea(areaName || data.display_name.split(",").slice(0, 3).join(","));
        setCity(detectedCity);
        setPincode(detectedPincode);
        if (!address) {
          setAddress(areaName);
        }
      }
    } catch (err) {
      console.warn("Reverse geocode lookup warning:", err);
    }
  };

  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      // Fallback coordinates
      setLatitude(19.1197);
      setLongitude(72.8468);
      setDetectedArea("Near SV Road, Andheri West, Mumbai");
      setAddress("Near SV Road, Andheri West");
      setGpsSuccess(true);
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
        setGpsSuccess(true);

        // Fetch exact neighborhood & street name
        await reverseGeocode(lat, lon);
      },
      (err) => {
        console.warn("GPS lookup error:", err);
        setGpsLoading(false);
        // Fallback default coordinates (Mumbai)
        setLatitude(19.1197);
        setLongitude(72.8468);
        setDetectedArea("SV Road, Andheri West, Mumbai");
        setAddress("Near SV Road, Andheri West");
        setGpsSuccess(true);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleToggleCondition = (tag: string) => {
    if (selectedConditions.includes(tag)) {
      setSelectedConditions(selectedConditions.filter((c) => c !== tag));
    } else {
      setSelectedConditions([...selectedConditions, tag]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray: File[] = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);

      const newUrls = filesArray.map((file: File) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newUrls]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Combine spot details with detected area for full rescue address
    const fullAddress = spotDetails
      ? `${spotDetails}, ${detectedArea || address}`
      : (detectedArea || address);

    if (!description || !fullAddress || !contactNumber) {
      setError("Please provide a description, location/address, and your contact phone number.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("category", selectedCategory);
      formData.append("description", description);
      formData.append("address", fullAddress);
      formData.append("landmark", landmark);
      formData.append("city", city);
      formData.append("pincode", pincode);
      formData.append("contactNumber", contactNumber);
      formData.append("citizenName", citizenName || "Concerned Citizen");
      formData.append("isEmergency", String(isEmergency));
      formData.append("dogCondition", JSON.stringify(selectedConditions));

      if (latitude && longitude) {
        formData.append("latitude", String(latitude));
        formData.append("longitude", String(longitude));
      }

      // Attach image files
      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });

      // Pass existing image URLs if no file was uploaded
      if (selectedFiles.length === 0 && previewUrls.length > 0) {
        formData.append("imageUrls", JSON.stringify(previewUrls));
      }

      const res = await api.createComplaint(formData);
      onSuccess(res.complaint);
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to submit complaint. Please check your internet connection."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined !text-sm">health_and_safety</span>
            <span>Citizen Stray Animal Rescue Form</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Report a Stray Dog in Distress
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Your sighting report will be instantly dispatched to verified local NGOs and nearby ambulance volunteers.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-200 flex items-start gap-2 shadow-sm animate-shake">
            <span className="material-symbols-outlined !text-base shrink-0 text-red-600">
              error
            </span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Category Selection */}
          <div className="bg-white p-6 rounded-3xl card-elevation-1 border border-slate-100 space-y-4">
            <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs flex items-center justify-center font-bold">
                1
              </span>
              Select Complaint Category
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.category;
                return (
                  <div
                    key={cat.category}
                    onClick={() => {
                      setSelectedCategory(cat.category);
                      if (cat.isUrgent) setIsEmergency(true);
                    }}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-orange-500 bg-orange-50/40 shadow-sm"
                        : "border-slate-100 hover:border-slate-200 bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isSelected
                            ? "bg-orange-500 text-white"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        <span className="material-symbols-outlined !text-xl">{cat.icon}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-xs text-slate-900">{cat.title}</h3>
                        <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                          {cat.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Dog Condition Symptom Tags */}
          <div className="bg-white p-6 rounded-3xl card-elevation-1 border border-slate-100 space-y-4">
            <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs flex items-center justify-center font-bold">
                2
              </span>
              Observed Symptoms & Condition (Tap to select)
            </h2>

            <div className="flex flex-wrap gap-2">
              {DOG_CONDITION_TAGS.map((tag) => {
                const isSelected = selectedConditions.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleCondition(tag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Incident Description *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened, dog's color/breed, current posture, danger level..."
                className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Section 3: Photo Upload */}
          <div className="bg-white p-6 rounded-3xl card-elevation-1 border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs flex items-center justify-center font-bold">
                  3
                </span>
                Photo Evidence
              </h2>
              <span className="text-xs text-slate-400">Up to 5 images</span>
            </div>

            {/* Drag and Drop Zone */}
            <div className="border-2 border-dashed border-slate-200 hover:border-orange-400 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="photo-upload-input"
              />
              <label
                htmlFor="photo-upload-input"
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <span className="material-symbols-outlined !text-2xl">add_photo_alternate</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Click to upload photos or drag & drop
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Clear photos help veterinary triage teams dispatch the right medicines
                  </p>
                </div>
              </label>
            </div>

            {/* Photo Previews */}
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {previewUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 group shadow-sm"
                  >
                    <img src={url} alt="Dog preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity"
                    >
                      <span className="material-symbols-outlined !text-sm">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Blinkit-Style Auto Location & Spot Address */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl card-elevation-1 border border-slate-100 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs flex items-center justify-center font-bold">
                  4
                </span>
                Incident Location & Spot Details
              </h2>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>GPS Auto-Locator Active</span>
              </span>
            </div>

            {/* Blinkit-Style Auto Detected Location Card */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-50/80 via-emerald-50/40 to-slate-50 border-2 border-emerald-200/90 rounded-2xl space-y-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                    <span className="material-symbols-outlined !text-2xl">location_on</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                      📍 Auto-Detected Area
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">
                      {detectedArea || address || "Detecting your current location..."}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {city} ({pincode}) {latitude && longitude ? `• GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : ""}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleFetchLocation}
                  disabled={gpsLoading}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1 shrink-0"
                >
                  <span className={`material-symbols-outlined !text-base text-emerald-600 ${gpsLoading ? "animate-spin" : ""}`}>
                    {gpsLoading ? "sync" : "my_location"}
                  </span>
                  <span>{gpsLoading ? "Locating..." : "Re-detect GPS"}</span>
                </button>
              </div>
            </div>

            {/* Spot & Landmark Inputs (Just like Blinkit asks for Flat / Shop / Landmark) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Exact Spot / Shop / Building / Street Details *
                </label>
                <input
                  type="text"
                  required
                  value={spotDetails}
                  onChange={(e) => setSpotDetails(e.target.value)}
                  placeholder="e.g. Near Metro Pillar #48, Behind Chai Tapri, Outside Gate 2"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Helps ambulance drivers locate the injured dog quickly upon arrival.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prominent Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Opposite HDFC Bank ATM / D-Mart"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    City & Pincode
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowManualLocation(!showManualLocation)}
                    className="text-[11px] text-orange-600 font-semibold hover:underline"
                  >
                    {showManualLocation ? "Hide Manual Edit" : "Edit Manually"}
                  </button>
                </div>
                <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium">
                  {city} - {pincode}
                </div>
              </div>
            </div>

            {/* Manual Location Override (if needed) */}
            {showManualLocation && (
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-fadeIn">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Citizen Contact Info & Emergency Switch */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl card-elevation-1 border border-slate-100 space-y-4">
            <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs flex items-center justify-center font-bold">
                5
              </span>
              Reporter Contact & Priority
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  placeholder="e.g. Aarav Mehta"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Phone Number (For Rescue Team Call) *
                </label>
                <input
                  type="tel"
                  required
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="+91 98200 XXXXX"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Emergency Priority Toggle */}
            <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                  <span className="material-symbols-outlined">emergency</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-orange-950">
                    Mark as Immediate Life-Threatening Emergency
                  </h4>
                  <p className="text-[11px] text-orange-800/80">
                    Triggers high-priority siren notifications to ambulance drivers.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isEmergency}
                onChange={(e) => setIsEmergency(e.target.checked)}
                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Form Submit Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-6 py-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#f97316] hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined !text-lg">send</span>
                  <span>Submit Complaint & Alert NGOs</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
