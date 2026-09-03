import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { api } from "../../api/client";
import { Complaint } from "../../types";

export type LayerKey =
  | "dog_density"
  | "aggressive_risk"
  | "bite_hotspots"
  | "vaccination_coverage"
  | "sterilization_coverage"
  | "ngo_coverage"
  | "rescue_activity";

interface Props {
  onStartReport?: () => void;
  recentComplaints?: Complaint[];
}

export const GeospatialIntelligenceMap: React.FC<Props> = ({
  onStartReport,
  recentComplaints = []
}) => {
  const [activeLayer, setActiveLayer] = useState<LayerKey>("dog_density");
  const [layerData, setLayerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showTelemetryModal, setShowTelemetryModal] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const LAYER_CONFIGS = [
    {
      id: "dog_density" as LayerKey,
      icon: "pets",
      title: "Dog Density",
      subtitle: "710-District Census & Live Sighting Heatmap",
      badgeColor: "bg-blue-100 text-blue-800"
    },
    {
      id: "aggressive_risk" as LayerKey,
      icon: "warning",
      title: "Aggressive Dog Risk",
      subtitle: "Formula: Aggressive×5 + Bite×10 + Rabies×20",
      badgeColor: "bg-red-100 text-red-800"
    },
    {
      id: "bite_hotspots" as LayerKey,
      icon: "crisis_alert",
      title: "Dog Bite Hotspots & PMC Surveillance",
      subtitle: "State-wise 2.76M Annual Burden & Medical Stock",
      badgeColor: "bg-amber-100 text-amber-800"
    },
    {
      id: "vaccination_coverage" as LayerKey,
      icon: "vaccines",
      title: "Vaccination Coverage",
      subtitle: "Anti-Rabies Herd Immunity Rates",
      badgeColor: "bg-emerald-100 text-emerald-800"
    },
    {
      id: "sterilization_coverage" as LayerKey,
      icon: "content_cut",
      title: "Sterilization Coverage",
      subtitle: "Animal Birth Control (ABC) Zones",
      badgeColor: "bg-purple-100 text-purple-800"
    },
    {
      id: "ngo_coverage" as LayerKey,
      icon: "health_and_safety",
      title: "NGO Coverage",
      subtitle: "Shelter HQs & 5-50 KM Radius Grid",
      badgeColor: "bg-teal-100 text-teal-800"
    },
    {
      id: "rescue_activity" as LayerKey,
      icon: "ambulance",
      title: "Rescue Activity",
      subtitle: "Live Real-Time Socket.IO Missions",
      badgeColor: "bg-orange-100 text-orange-800"
    }
  ];

  // 1. Fetch layer data when activeLayer changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api
      .getGeospatialLayerData(activeLayer)
      .then((data) => {
        if (isMounted) {
          setLayerData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load geospatial layer:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeLayer]);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [28.58, 77.34], // Delhi-NCR Center
        zoom: 11,
        zoomControl: true,
        scrollWheelZoom: true
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }
  }, []);

  // 3. Render Active Layer Elements
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current || !layerData) return;

    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    switch (activeLayer) {
      case "dog_density": {
        const points = layerData.points || [];
        points.forEach((p: any) => {
          const isLocal = p.type === "registered_dog";
          const radius = isLocal ? 800 : Math.min(6000, Math.max(1200, (p.strayDogsCensus || 5000) / 10));
          const color = isLocal ? "#006c49" : "#3b82f6";

          const circle = L.circle([p.latitude, p.longitude], {
            radius,
            color,
            fillColor: color,
            fillOpacity: isLocal ? 0.45 : 0.25,
            weight: isLocal ? 2 : 1
          }).addTo(layerGroup);

          const popupContent = isLocal
            ? `
              <div style="font-family: sans-serif; font-size: 12px; min-width: 170px;">
                <strong style="color: #0f172a; font-size: 13px; display: block;">🐕 ${p.name}</strong>
                <span style="color: #64748b; font-size: 11px;">Area: <strong>${p.currentArea}</strong></span><br/>
                <span style="color: #006c49; font-weight: bold; font-size: 11px;">✓ ${p.vaccinationStatus}</span>
              </div>
            `
            : `
              <div style="font-family: sans-serif; font-size: 12px; min-width: 170px;">
                <span style="background: #dbeafe; color: #1e40af; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">Gov Livestock Census</span>
                <strong style="color: #0f172a; font-size: 13px; display: block; margin-top: 4px;">📍 ${p.name}</strong>
                <span style="color: #475569; font-size: 11px;">Stray Dogs Census: <strong>${p.strayDogsCensus.toLocaleString()}</strong></span><br/>
                <span style="color: #64748b; font-size: 10px;">Stray Cattle: ${p.strayCattleCensus.toLocaleString()}</span>
              </div>
            `;

          circle.bindPopup(popupContent);
        });
        break;
      }

      case "aggressive_risk": {
        const zones = layerData.zones || [];
        zones.forEach((z: any) => {
          const circle = L.circle([z.latitude, z.longitude], {
            radius: z.radiusMeters,
            color: z.color,
            fillColor: z.color,
            fillOpacity: z.riskLevel === "Critical" ? 0.35 : 0.22,
            weight: z.riskLevel === "Critical" ? 3 : 2
          }).addTo(layerGroup);

          const badgeBg =
            z.riskLevel === "Critical"
              ? "#fee2e2; color: #991b1b"
              : z.riskLevel === "High"
              ? "#ffedd5; color: #9a3412"
              : z.riskLevel === "Medium"
              ? "#fef9c3; color: #854d0e"
              : "#dcfce7; color: #166534";

          circle.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; min-width: 220px; line-height: 1.4;">
              <span style="background: ${badgeBg}; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 6px; text-transform: uppercase;">
                ${z.riskLevel} Risk Zone (Score: ${z.riskScore})
              </span>
              <strong style="color: #0f172a; font-size: 14px; display: block; margin-top: 6px;">📍 ${z.areaName} (${z.city})</strong>
              <p style="margin: 6px 0; font-size: 11px; color: #475569; font-family: monospace; background: #f8fafc; padding: 4px; border-radius: 4px;">
                ${z.formula}
              </p>
              <div style="font-size: 11px; color: #64748b;">
                • Aggressive Reports: <strong>${z.aggressiveReports}</strong><br/>
                • Bite Incidents: <strong>${z.biteReports}</strong><br/>
                • Rabies Suspected: <strong>${z.rabiesSuspected}</strong>
              </div>
            </div>
          `);
        });
        break;
      }

      case "bite_hotspots": {
        // 1. National State-Level Surveillance Markers (PMC12533994 Data)
        const stateHotspots = layerData.stateHotspots || [];
        stateHotspots.forEach((st: any) => {
          const radius = Math.min(18000, Math.max(5000, st.annualBites / 25));
          const circle = L.circle([st.lat, st.lng], {
            radius,
            color: st.riskColor,
            fillColor: st.riskColor,
            fillOpacity: 0.28,
            weight: 2
          }).addTo(layerGroup);

          circle.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; min-width: 210px;">
              <span style="background: #fee2e2; color: #991b1b; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
                🏛️ State HMIS Surveillance
              </span>
              <strong style="color: #0f172a; font-size: 13px; display: block; margin-top: 4px;">📍 ${st.state}</strong>
              <p style="color: ${st.riskColor}; font-weight: 800; font-size: 13px; margin: 4px 0;">
                ${st.annualBites.toLocaleString()} Annual Dog Bites
              </p>
              <span style="font-size: 11px; color: #64748b;">Burden Tier: <strong>${st.tier}</strong> (${st.tierRange})</span>
            </div>
          `);
        });

        // 2. Micro-Level City Hotspots
        const localHotspots = layerData.localHotspots || [];
        localHotspots.forEach((h: any) => {
          const marker = L.circleMarker([h.latitude, h.longitude], {
            radius: 12 + Math.min(10, h.incidentCount),
            color: "#dc2626",
            fillColor: "#ef4444",
            fillOpacity: 0.75,
            weight: 3
          }).addTo(layerGroup);

          marker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; min-width: 210px;">
              <span style="background: #fee2e2; color: #991b1b; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
                🚨 ${h.severity} Local Bite Hotspot
              </span>
              <strong style="color: #0f172a; font-size: 13px; display: block; margin-top: 4px;">📍 ${h.area} (${h.city})</strong>
              <p style="color: #dc2626; font-weight: bold; font-size: 12px; margin: 4px 0;">Total Incidents: ${h.incidentCount}</p>
              <p style="color: #475569; font-size: 11px; margin-top: 4px; background: #f1f5f9; padding: 4px 6px; border-radius: 6px;">
                💊 <strong>Advisory:</strong> ${h.medicalAdvisory}
              </p>
            </div>
          `);
        });
        break;
      }

      case "vaccination_coverage": {
        const regions = layerData.regions || [];
        regions.forEach((r: any) => {
          const circle = L.circle([r.latitude, r.longitude], {
            radius: r.radiusMeters,
            color: r.color,
            fillColor: r.color,
            fillOpacity: 0.22,
            weight: 2
          }).addTo(layerGroup);

          circle.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; min-width: 200px;">
              <strong style="color: #0f172a; font-size: 13px; display: block;">📍 ${r.regionName} (${r.city})</strong>
              <div style="margin: 6px 0;">
                <span style="color: ${r.color}; font-size: 18px; font-weight: 900;">${r.coveragePercent}%</span>
                <span style="color: #64748b; font-size: 11px; margin-left: 4px;">Immunization Rate</span>
              </div>
              <p style="font-size: 11px; color: #334155; font-weight: 600;">${r.status}</p>
              <span style="font-size: 10px; color: #64748b;">Vaccinated: ${r.vaccinatedDogs} / ${r.totalDogs} Street Dogs</span>
            </div>
          `);
        });
        break;
      }

      case "sterilization_coverage": {
        const regions = layerData.regions || [];
        regions.forEach((r: any) => {
          const circle = L.circle([r.latitude, r.longitude], {
            radius: r.radiusMeters,
            color: r.color,
            fillColor: r.color,
            fillOpacity: 0.22,
            weight: 2
          }).addTo(layerGroup);

          circle.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; min-width: 200px;">
              <strong style="color: #0f172a; font-size: 13px; display: block;">📍 ${r.regionName} (${r.city})</strong>
              <div style="margin: 6px 0;">
                <span style="color: ${r.color}; font-size: 18px; font-weight: 900;">${r.coveragePercent}%</span>
                <span style="color: #64748b; font-size: 11px; margin-left: 4px;">ABC Sterilization Rate</span>
              </div>
              <p style="font-size: 11px; color: #334155; font-weight: 600;">${r.status}</p>
              <span style="font-size: 10px; color: #64748b;">Ear-Notched: ${r.sterilizedDogs} / ${r.totalDogs} Dogs</span>
            </div>
          `);
        });
        break;
      }

      case "ngo_coverage": {
        const stations = layerData.stations || [];
        stations.forEach((s: any) => {
          L.circle([s.latitude, s.longitude], {
            radius: (s.coverageRadiusKm || 15) * 1000,
            color: "#006c49",
            fillColor: "#10b981",
            fillOpacity: 0.12,
            weight: 1.5,
            dashArray: "4, 6"
          }).addTo(layerGroup);

          const customIcon = L.divIcon({
            className: "ngo-marker-icon",
            html: `
              <div style="background: #006c49; color: white; width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2px solid white;">
                🏥
              </div>
            `,
            iconSize: [34, 34],
            iconAnchor: [17, 17]
          });

          const marker = L.marker([s.latitude, s.longitude], { icon: customIcon }).addTo(layerGroup);

          marker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; min-width: 210px;">
              <span style="background: #d1fae5; color: #065f46; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">VERIFIED SHELTER HQ</span>
              <strong style="color: #0f172a; font-size: 13px; display: block; margin-top: 4px;">🏥 ${s.name}</strong>
              <p style="color: #64748b; font-size: 11px; margin: 2px 0;">📞 ${s.phone} • ${s.city}</p>
              <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #334155;">
                • Operational Radius: <strong>${s.coverageRadiusKm} KM</strong><br/>
                • Active Cases: <strong style="color: #ea580c;">${s.activeCasesCount}</strong><br/>
                • 24x7 Ambulance: <strong>${s.emergency24x7 ? "Ready (ON DUTY)" : "Standard"}</strong>
              </div>
            </div>
          `);
        });
        break;
      }

      case "rescue_activity": {
        const rescues = layerData.rescues || [];
        rescues.forEach((r: any) => {
          const isSOS = r.priority === "Critical";
          const iconEmoji = r.statusType === "Active" ? "🚑" : r.statusType === "Completed" ? "✅" : "🚨";

          const customIcon = L.divIcon({
            className: "rescue-marker-icon",
            html: `
              <div style="background: ${r.markerColor}; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid white; ${isSOS ? "animation: pulse 1.5s infinite;" : ""}">
                ${iconEmoji}
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          const marker = L.marker([r.latitude, r.longitude], { icon: customIcon }).addTo(layerGroup);

          marker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; min-width: 200px;">
              <span style="background: ${r.markerColor}; color: white; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
                ${r.statusType} Mission
              </span>
              <strong style="color: #0f172a; font-size: 13px; display: block; margin-top: 4px;">#${r.trackingId} — ${r.category}</strong>
              <p style="color: #64748b; font-size: 11px; margin: 2px 0;">📍 ${r.address} (${r.city})</p>
              <div style="margin-top: 4px; font-size: 10px; color: #475569;">
                Assigned: <strong>${r.ngoName}</strong>
              </div>
            </div>
          `);
        });
        break;
      }
    }
  }, [activeLayer, layerData]);

  return (
    <section className="relative w-full bg-slate-950 text-white py-12 border-t border-b border-slate-800 overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-semibold border border-orange-500/30">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
              <span>National & NCR Geospatial Intelligence Grid</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Interactive Stray Animal Geospatial Intelligence
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl">
              Integrating official 710-district government livestock census data and 2018–2023 NCBI/PMC national dog bite epidemiology with live citizen reports.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => setShowTelemetryModal(true)}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined !text-lg text-amber-400">monitoring</span>
              <span>National Dog Bite Report (PMC)</span>
            </button>

            {onStartReport && (
              <button
                onClick={onStartReport}
                className="px-5 py-3 bg-[#f97316] hover:bg-orange-600 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-orange-500/30 transition-all flex items-center gap-2 hover:scale-105"
              >
                <span className="material-symbols-outlined !text-lg">emergency</span>
                <span>Report Sighting Here</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Map + Layer Filter Sidebar Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-md">
          {/* Layer Filter Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Select Intelligence Layer
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded">
                  1 Active at a Time
                </span>
              </div>

              {/* 7 Layer Buttons */}
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {LAYER_CONFIGS.map((layer) => {
                  const isActive = activeLayer === layer.id;
                  return (
                    <button
                      key={layer.id}
                      onClick={() => setActiveLayer(layer.id)}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                        isActive
                          ? "bg-slate-800 border-orange-500 shadow-lg shadow-orange-500/10 scale-[1.02]"
                          : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700 text-slate-400"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        <span className="material-symbols-outlined !text-lg">{layer.icon}</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <strong
                            className={`text-xs font-bold block truncate ${
                              isActive ? "text-white" : "text-slate-300"
                            }`}
                          >
                            {layer.title}
                          </strong>
                          {isActive && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {layer.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Layer Info Card */}
            {layerData && (
              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs space-y-1">
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block">
                  Active Layer Overview
                </span>
                <h4 className="font-extrabold text-white text-xs">{layerData.title}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {layerData.description}
                </p>
              </div>
            )}
          </div>

          {/* Map Viewport (8 cols) */}
          <div className="lg:col-span-8 relative rounded-2xl overflow-hidden border border-slate-800 shadow-inner min-h-[300px] md:min-h-[520px] h-[300px] md:h-auto">
            {loading && (
              <div className="absolute inset-0 z-30 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center">
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center space-y-2 shadow-xl">
                  <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <span className="text-xs text-slate-300 font-semibold block">
                    Rendering Geospatial Intelligence...
                  </span>
                </div>
              </div>
            )}

            <div ref={mapContainerRef} className="w-full h-full min-h-[300px] md:min-h-[520px]" />
          </div>
        </div>
      </div>

      {/* PMC12533994 Dog Bite Telemetry Modal */}
      {showTelemetryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 text-white animate-scaleUp max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <h3 className="font-extrabold text-base text-white">
                  National Dog Bite Burden (2018–2023) — PMC Study
                </h3>
              </div>
              <button
                onClick={() => setShowTelemetryModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Time-Series Case Evolution */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Annual Reported Dog Bite Cases (India Total)
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { year: "2018", cases: "7.57M", badge: "Peak Year" },
                  { year: "2019", cases: "7.27M", badge: "High" },
                  { year: "2020", cases: "4.76M", badge: "COVID Drop" },
                  { year: "2021", cases: "3.24M", badge: "Post-Pandemic" },
                  { year: "2022", cases: "2.18M", badge: "Lowest" },
                  { year: "2023", cases: "2.76M", badge: "Rebound (+26%)" }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-mono">{item.year}</span>
                    <strong className="text-xs font-black text-orange-400 block mt-0.5">{item.cases}</strong>
                    <span className="text-[9px] text-slate-500 block mt-0.5">{item.badge}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* High-Risk State Rankings */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Top State Burden Tiers (2023 Official HMIS Records)
              </span>
              <div className="space-y-2 text-xs">
                {[
                  { state: "Uttar Pradesh", count: "435,136 cases/yr", tier: "Critical High (Rank #1)", color: "text-red-400" },
                  { state: "Madhya Pradesh", count: "390,878 cases/yr", tier: "Critical High (Rank #2)", color: "text-red-400" },
                  { state: "Bihar", count: "138,597 cases/yr", tier: "Critical High (Rank #3)", color: "text-red-400" },
                  { state: "Maharashtra", count: "105,420 cases/yr", tier: "Medium-High (Rank #4)", color: "text-orange-400" },
                  { state: "Delhi (NCR)", count: "13,200 cases/yr", tier: "Low-Moderate Urban", color: "text-emerald-400" }
                ].map((row, idx) => (
                  <div key={idx} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <strong className="text-white font-bold">{row.state}</strong>
                      <span className="text-[11px] text-slate-400 block">{row.tier}</span>
                    </div>
                    <span className={`font-mono font-bold ${row.color}`}>{row.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Zero by 30 Goal Banner */}
            <div className="p-4 bg-emerald-950/60 border border-emerald-800/80 rounded-2xl text-xs space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-emerald-400 block">
                🎯 WHO & FAO "Zero by 30" Strategic Plan
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Aiming for <strong>Zero human rabies deaths by 2030</strong> through mass canine anti-rabies vaccination (ARV) and Animal Birth Control (ABC) sterilization campaigns.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowTelemetryModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
