import React from "react";
import { NGO, Complaint } from "../../types";
import { GeospatialIntelligenceMap } from "../maps/GeospatialIntelligenceMap";

interface Props {
  ngos?: NGO[];
  recentComplaints?: Complaint[];
  onStartReport: (isEmergency?: boolean) => void;
  onTrackClick: () => void;
  onViewAllReports?: () => void;
}

export const LandingPage: React.FC<Props> = ({
  ngos = [],
  recentComplaints = [],
  onStartReport,
  onTrackClick,
  onViewAllReports = () => {}
}) => {
  return (
    <div className="min-h-screen bg-[#faf8ff]">
      {/* Hero Section */}
      <section className="relative overflow-hidden hero-pattern pt-12 pb-20 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Col: Hero Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100/80 border border-orange-200 text-orange-900 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-orange-600 animate-ping" />
                <span>India's Dedicated Stray Animal Rescue Hotline & NGO Grid</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.15]">
                Save A Stray Life. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9d4300] via-[#f97316] to-[#006c49]">
                  Report In 30 Seconds.
                </span>
              </h1>

              <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Witnessed an injured, sick, or distressed stray dog? Log GPS location and photos instantly. Our network of verified animal welfare NGOs and ambulance dispatchers will respond immediately.
              </p>

              {/* Action CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={() => onStartReport(true)}
                  className="w-full sm:w-auto px-8 py-4 bg-[#f97316] hover:bg-orange-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2.5 transition-all hover:scale-105 active:scale-95 group animate-urgent-pulse"
                >
                  <span className="material-symbols-outlined !text-xl group-hover:animate-bounce">
                    emergency
                  </span>
                  <span>Report Emergency Dog</span>
                </button>

                <button
                  onClick={onTrackClick}
                  className="w-full sm:w-auto px-7 py-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-all hover:border-slate-300"
                >
                  <span className="material-symbols-outlined !text-xl text-orange-600">
                    manage_search
                  </span>
                  <span>Track Existing Report</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined !text-base text-emerald-600">
                    verified_user
                  </span>
                  <span>100% Free Civic Service</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined !text-base text-orange-600">
                    ambulance
                  </span>
                  <span>Avg Response: 24 mins</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined !text-base text-blue-600">
                    location_on
                  </span>
                  <span>Live GPS Tracking</span>
                </div>
              </div>
            </div>

            {/* Right Col: Hero Interactive Card */}
            <div className="lg:col-span-5">
              <div className="relative">
                {/* Decorative glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-emerald-400 rounded-3xl blur-xl opacity-20" />

                <div className="relative card-elevation-hero rounded-3xl p-6 border border-orange-100/60 overflow-hidden">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-slate-800">Live Rescue Stream</span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      Active
                    </span>
                  </div>

                  {/* Sample Live Rescue Card */}
                  <div className="space-y-4">
                    <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 shadow-md">
                      <img
                        src="https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&auto=format&fit=crop&q=80"
                        alt="Injured stray dog being treated"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-1 rounded-md bg-orange-600/90 text-white text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-xs">
                          Emergency SOS
                        </span>
                      </div>
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-white text-xs">
                        <p className="font-bold">Indie Dog with fractured leg rescued</p>
                        <p className="text-[11px] text-slate-200">SV Road, Andheri West (Mumbai)</p>
                      </div>
                    </div>

                    {/* Progress Step Bar */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                        <span>Rescue Progress</span>
                        <span className="text-orange-600 font-bold">Step 3 of 4: Treatment</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-orange-500 to-emerald-500 h-full w-3/4 rounded-full" />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Reported</span>
                        <span>Accepted</span>
                        <span className="text-orange-600 font-bold">In Treatment</span>
                        <span>Resolved</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onStartReport(false)}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <span>Report a New Dog in Your Area</span>
                      <span className="material-symbols-outlined !text-base">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FULL-WIDTH GEOSPATIAL INTELLIGENCE MAP */}
      <GeospatialIntelligenceMap
        onStartReport={() => onStartReport(false)}
        recentComplaints={recentComplaints}
      />

      {/* Live Statistics Counter */}
      <section className="py-12 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-orange-50/50 border border-orange-100 text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-orange-600">6,240+</div>
              <p className="text-xs font-semibold text-slate-700 mt-1">Stray Dogs Rescued</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Across 12 metro cities</p>
            </div>
            <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-700">92%</div>
              <p className="text-xs font-semibold text-slate-700 mt-1">Resolution Rate</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Within 48 hours</p>
            </div>
            <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600">48+</div>
              <p className="text-xs font-semibold text-slate-700 mt-1">Verified Partner NGOs</p>
              <p className="text-[11px] text-slate-500 mt-0.5">AWBI registered</p>
            </div>
            <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-100 text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-purple-600">18,500+</div>
              <p className="text-xs font-semibold text-slate-700 mt-1">Citizens Connected</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Active daily reporters</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section (Stitch Design) */}
      <section className="py-20 bg-[#faf8ff] border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-widest bg-orange-100/60 px-3 py-1 rounded-full">
              Seamless Rescue Flow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              How PawConnect India Works
            </h2>
            <p className="text-slate-600 text-sm">
              Connecting citizen eyes with trained rescue ambulances and certified vets in four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="card-elevation-1 rounded-2xl p-6 relative hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">add_a_photo</span>
              </div>
              <span className="text-xs font-bold text-orange-600">STEP 01</span>
              <h3 className="font-bold text-slate-900 text-base mt-1 mb-2">
                Snap & Spot Location
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Take a quick photo of the stray dog. Your browser automatically fetches the exact GPS coordinates and nearby landmark.
              </p>
            </div>

            {/* Step 2 */}
            <div className="card-elevation-1 rounded-2xl p-6 relative hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">hub</span>
              </div>
              <span className="text-xs font-bold text-purple-600">STEP 02</span>
              <h3 className="font-bold text-slate-900 text-base mt-1 mb-2">
                Instant NGO Triage
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Our smart routing system alerts verified NGOs operating within that specific pincode and severity level.
              </p>
            </div>

            {/* Step 3 */}
            <div className="card-elevation-1 rounded-2xl p-6 relative hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">ambulance</span>
              </div>
              <span className="text-xs font-bold text-orange-600">STEP 03</span>
              <h3 className="font-bold text-slate-900 text-base mt-1 mb-2">
                Volunteer Dispatch
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Trained animal handlers and ambulance drivers are assigned with on-field live status updates sent directly to you.
              </p>
            </div>

            {/* Step 4 */}
            <div className="card-elevation-1 rounded-2xl p-6 relative hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">task_alt</span>
              </div>
              <span className="text-xs font-bold text-emerald-700">STEP 04</span>
              <h3 className="font-bold text-slate-900 text-base mt-1 mb-2">
                Treatment & Recovery
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Veterinary treatment or surgery is documented with photographic proof and recovery reports logged on your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Verified NGO Partners Carousel / Grid */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-100/60 px-3 py-1 rounded-full">
                Partner Network
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-2">
                Active Animal Welfare NGOs
              </h2>
              <p className="text-slate-600 text-xs mt-1">
                Verified rescue shelters ready to respond in your neighborhood.
              </p>
            </div>
            <button
              onClick={onViewAllReports}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 self-start md:self-auto"
            >
              <span>View All Reports ({recentComplaints.length})</span>
              <span className="material-symbols-outlined !text-base">chevron_right</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ngos.map((ngo) => (
              <div
                key={ngo.id}
                className="card-elevation-1 rounded-2xl p-6 border border-slate-100 hover:border-orange-200 transition-all group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={ngo.avatarUrl || "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=150"}
                    alt={ngo.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-100 group-hover:scale-105 transition-transform"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">
                        {ngo.name}
                      </h3>
                      {ngo.verified && (
                        <span
                          className="material-symbols-outlined !text-base text-emerald-600"
                          title="Verified NGO"
                        >
                          verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined !text-[13px]">location_on</span>
                      {ngo.city}, {ngo.state}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 my-3 text-center">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-xs text-slate-500">Rescues</span>
                    <p className="font-bold text-slate-900 text-sm">{ngo.totalRescued}+</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-xs text-slate-500">Volunteers</span>
                    <p className="font-bold text-slate-900 text-sm">{ngo.activeVolunteersCount}</p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1">
                  <p>
                    <strong>Pincodes:</strong> {ngo.pincodesCovered.join(", ")}
                  </p>
                  <p>
                    <strong>Helpline:</strong> {ngo.phone}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency CTA Banner */}
      <section className="py-16 bg-gradient-to-r from-[#9d4300] via-[#f97316] to-[#006c49] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 text-center space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-sm">
            <span className="material-symbols-outlined !text-sm">support_agent</span>
            24x7 India Community Helpline
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Every Minute Matters For An Injured Animal.
          </h2>
          <p className="text-white/90 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Do not walk away. Take a 10-second photo and submit a report. We immediately alert nearby volunteers and ambulances.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onStartReport(true)}
              className="px-8 py-3.5 bg-white text-orange-600 hover:bg-orange-50 rounded-xl text-sm font-bold shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <span className="material-symbols-outlined !text-lg">emergency</span>
              <span>Report Stray Animal Now</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
