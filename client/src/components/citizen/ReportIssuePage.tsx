import React, { useState, useEffect } from "react";
import { api } from "../../api/client";
import { User, ComplaintCategory, Complaint } from "../../types";

interface Props {
  user: User | null;
  initialEmergency?: boolean;
  onSuccess: (complaint: Complaint) => void;
  onCancel: () => void;
}

const CATEGORIES: {
  category: ComplaintCategory;
  icon: string;
  desc: string;
  color: string;
  isEmergency?: boolean;
}[] = [
  {
    category: "Emergency Rescue",
    icon: "emergency",
    desc: "Critical accident, hit-and-run, trapped, or unconscious",
    color: "border-red-400 bg-red-50/50 text-red-700",
    isEmergency: true
  },
  {
    category: "Injured Dog",
    icon: "healing",
    desc: "Visible fractures, deep wounds, bleeding, or limping",
    color: "border-orange-400 bg-orange-50/50 text-orange-700"
  },
  {
    category: "Sick Dog",
    icon: "sick",
    desc: "Severe mange, high fever, vomiting, or maggot wounds",
    color: "border-amber-400 bg-amber-50/50 text-amber-700"
  },
  {
    category: "Abandoned Puppy",
    icon: "pets",
    desc: "Motherless litter, newborn pups needing shelter & feeding",
    color: "border-purple-400 bg-purple-50/50 text-purple-700"
  },
  {
    category: "Aggressive Dog",
    icon: "warning",
    desc: "Biting tendency, rabies symptoms, or public threat",
    color: "border-yellow-400 bg-yellow-50/50 text-yellow-800"
  },
  {
    category: "Sterilization Request",
    icon: "medical_services",
    desc: "Animal Birth Control (ABC) drive for community dogs",
    color: "border-blue-400 bg-blue-50/50 text-blue-700"
  },
  {
    category: "Vaccination Request",
    icon: "vaccines",
    desc: "Anti-rabies and 9-in-1 community vaccination",
    color: "border-emerald-400 bg-emerald-50/50 text-emerald-700"
  }
];

const CONDITION_TAGS = [
  "Bleeding / Open Wound",
  "Limping / Broken Bone",
  "Severe Skin Mange",
  "Maggots Infestation",
  "Hypothermic / Shivering",
  "Newborn Puppies",
  "Aggressive / Snapping",
  "Unconscious / Lethargic",
  "Eye Injury",
  "Friendly / Docile"
];

export const ReportIssuePage: React.FC<Props> = ({
  user,
  initialEmergency = false,
  onSuccess,
  onCancel
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ComplaintCategory>(
    initialEmergency ? "Emergency Rescue" : "Injured Dog"
  );
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("Mumbai");
  const [pincode, setPincode] = useState("400053");
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

  // Auto-fetch GPS on load if emergency
  useEffect(() => {
    handleFetchLocation();
  }, []);

  const handleFetchLocation = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setGpsLoading(false);
        setGpsSuccess(true);
        if (!address) {
          setAddress("Near Current Location, Four Bungalows, Andheri West");
          setLandmark("Near Metro Station Gate 2");
        }
      },
      (err) => {
        console.warn("GPS error:", err);
        setGpsLoading(false);
        // Fallback default coordinates (Mumbai)
        setLatitude(19.1197);
        setLongitude(72.8468);
      }
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

    if (!description || !address || !contactNumber) {
      setError("Please provide a description, address, and contact phone number.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("category", selectedCategory);
      formData.append("description", description);
      formData.append("address", address);
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
      setError(err.response?.data?.error || "Failed to submit complaint. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-bold text-orange-600 uppercase tracking-widest bg-orange-100/70 px-3 py-1 rounded-full">
              Citizen Reporting Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Report Stray Dog Issue
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Provide incident details, photos, and location. Nearby rescue ambulances will be dispatched.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined !text-lg">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Complaint Type Selection */}
          <div className="bg-white p-6 rounded-2xl card-elevation-1 border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs flex items-center justify-center font-bold">
                  1
                </span>
                Select Issue Category
              </h2>
              <span className="text-xs text-orange-600 font-semibold">Required</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.category;
                return (
                  <button
                    key={cat.category}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.category);
                      if (cat.isEmergency) setIsEmergency(true);
                    }}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-[#f97316] ring-2 ring-orange-500/20 bg-orange-50/60 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${cat.color}`}
                      >
                        <span className="material-symbols-outlined !text-xl">
                          {cat.icon}
                        </span>
                      </div>
                      {cat.isEmergency && (
                        <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded uppercase">
                          CRITICAL
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-xs text-slate-800">{cat.category}</h3>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      {cat.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Dog Condition & Observations */}
          <div className="bg-white p-6 rounded-2xl card-elevation-1 border border-slate-100 space-y-4">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs flex items-center justify-center font-bold">
                2
              </span>
              Visible Dog Symptoms / Condition
            </h2>

            <div className="flex flex-wrap gap-2">
              {CONDITION_TAGS.map((tag) => {
                const active = selectedConditions.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleCondition(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                      active
                        ? "bg-[#f97316] text-white border-[#f97316] shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Detailed Description & Situation Notes *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the dog's appearance (color, collar, indie/breed), exact behavior, and severity of injuries..."
                className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Section 3: Photo Evidence Upload */}
          <div className="bg-white p-6 rounded-2xl card-elevation-1 border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs flex items-center justify-center font-bold">
                  3
                </span>
                Upload Dog Photos (Up to 5)
              </h2>
              <span className="text-xs text-slate-400">JPG, PNG (Max 10MB)</span>
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
                    Clear photos of the injury help veterinary triage teams prepare medicines
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

          {/* Section 4: Location & GPS Pin */}
          <div className="bg-white p-6 rounded-2xl card-elevation-1 border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs flex items-center justify-center font-bold">
                  4
                </span>
                Incident Location & GPS Pin
              </h2>
              <button
                type="button"
                onClick={handleFetchLocation}
                disabled={gpsLoading}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined !text-base">
                  {gpsLoading ? "sync" : "my_location"}
                </span>
                <span>{gpsLoading ? "Detecting GPS..." : "Auto-Detect GPS"}</span>
              </button>
            </div>

            {latitude && longitude && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined !text-base text-emerald-600">
                    check_circle
                  </span>
                  <span>
                    GPS Pin: <strong>{latitude.toFixed(4)}, {longitude.toFixed(4)}</strong>
                  </span>
                </div>
                <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                  Active Coordinates
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Street Address / Spot Sighting *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Near Shoppers Stop Bus Stop, SV Road"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prominent Landmark
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Opposite Gate 2, beside Chai Stall"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Area Pincode *
                </label>
                <input
                  type="text"
                  required
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 400053"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Citizen Contact Info & Emergency Switch */}
          <div className="bg-white p-6 rounded-2xl card-elevation-1 border border-slate-100 space-y-4">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
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
            <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center">
                  <span className="material-symbols-outlined">emergency</span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-orange-950">
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
