import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { GovernmentAnalytics } from "../../types";
import { api } from "../../api/client";

export const GovernmentAnalyticsView: React.FC = () => {
  const [data, setData] = useState<GovernmentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.getGovernmentAnalytics();
        setData(res);
      } catch (err) {
        console.error("Failed to load government analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (!data || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [28.58, 77.30], // Delhi-NCR Center
        zoom: 11,
        zoomControl: true
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Render density circles for community dogs & hotspot areas
    data.densityHeatmapPoints.forEach((point) => {
      const radius = 1200 * (point.intensity || 0.5);
      const color = point.intensity > 0.6 ? "#ef4444" : point.intensity > 0.3 ? "#f97316" : "#10b981";

      L.circle([point.latitude, point.longitude], {
        radius,
        color,
        fillColor: color,
        fillOpacity: 0.25,
        weight: 2
      })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; padding: 2px;">
            <strong style="color: #0f172a; font-size: 13px; display: block;">📍 ${point.area}</strong>
            <span style="color: #64748b; font-size: 11px;">Stray Intensity Score: <strong>${Math.round(point.intensity * 100)}%</strong></span>
          </div>
        `);
    });
  }, [data]);

  if (loading || !data) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-semibold">Loading Municipal ARV/ABC Analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold border border-indigo-500/30">
            <span className="material-symbols-outlined !text-sm">account_balance</span>
            <span>Government & Municipal Corporation Portal (AWBI / MCD / NOIDA)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Animal Birth Control (ABC) & Rabies Eradication Dashboard
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
            Real-time executive oversight on stray dog density, anti-rabies vaccination coverage rates, and municipal sterilization drives across Delhi-NCR.
          </p>
        </div>

        <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-center z-10 shrink-0">
          <span className="text-[10px] uppercase font-bold text-indigo-300 block">AWBI Status</span>
          <strong className="text-sm font-extrabold text-emerald-400">99.4% Compliant</strong>
        </div>

        <span
          className="material-symbols-outlined absolute -right-6 -bottom-10 text-white/5 select-none pointer-events-none"
          style={{ fontSize: "220px" }}
        >
          account_balance
        </span>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl card-elevation-1 border border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Total Census Registered</span>
            <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <span className="material-symbols-outlined !text-lg">pets</span>
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900">{data.totalRegisteredDogs}</div>
          <p className="text-[11px] text-slate-400">Microchipped & Geo-tagged strays</p>
        </div>

        <div className="bg-white p-6 rounded-3xl card-elevation-1 border border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
            <span>ARV Vaccination Rate</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <span className="material-symbols-outlined !text-lg">vaccines</span>
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-700">{data.vaccinationCoveragePercent}%</div>
          <div className="w-full bg-emerald-100 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${data.vaccinationCoveragePercent}%` }} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl card-elevation-1 border border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs text-purple-700 font-semibold">
            <span>ABC Sterilization Rate</span>
            <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
              <span className="material-symbols-outlined !text-lg">content_cut</span>
            </span>
          </div>
          <div className="text-3xl font-black text-purple-700">{data.sterilizationCoveragePercent}%</div>
          <div className="w-full bg-purple-100 h-2 rounded-full overflow-hidden">
            <div className="bg-purple-600 h-full rounded-full" style={{ width: `${data.sterilizationCoveragePercent}%` }} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl card-elevation-1 border border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs text-orange-700 font-semibold">
            <span>Active Stray Incidents</span>
            <span className="w-8 h-8 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center">
              <span className="material-symbols-outlined !text-lg">ambulance</span>
            </span>
          </div>
          <div className="text-3xl font-black text-orange-600">{data.activeStrayCases}</div>
          <p className="text-[11px] text-slate-400">Currently undergoing triage/rescue</p>
        </div>
      </div>

      {/* Grid: Heatmap + District Breakdown Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Heatmap (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl card-elevation-1 border border-slate-100 p-6 space-y-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-600 !text-lg">local_fire_department</span>
                Dog Density & Rescue Hotspots Map
              </h3>
              <p className="text-xs text-slate-500">
                Visualizing high-population and unsterilized stray density clusters.
              </p>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className="flex items-center gap-1 bg-red-100 text-red-800 px-2 py-0.5 rounded">High Density</span>
              <span className="flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Vaccinated Zone</span>
            </div>
          </div>

          <div className="h-[420px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
            <div ref={mapContainerRef} className="w-full h-full" />
          </div>
        </div>

        {/* District Breakdown Table (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl card-elevation-1 border border-slate-100 p-6 space-y-4 shadow-sm">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-700 !text-lg">apartment</span>
            District-Wise Coverage Table
          </h3>

          <div className="space-y-3">
            {data.districtStats.map((dist, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs text-slate-900">{dist.district}</h4>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      dist.hotspotLevel === "High"
                        ? "bg-red-100 text-red-700"
                        : dist.hotspotLevel === "Moderate"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {dist.hotspotLevel} Priority
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Dogs Logged</span>
                    <strong className="text-slate-800 font-bold">{dist.dogCount}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Vaccinated</span>
                    <strong className="text-emerald-700 font-bold">{dist.vaccinatedPercent}%</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Sterilized</span>
                    <strong className="text-purple-700 font-bold">{dist.sterilizedPercent}%</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
