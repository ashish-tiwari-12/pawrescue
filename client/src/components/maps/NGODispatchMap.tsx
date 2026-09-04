import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Complaint, NGO } from "../../types";

interface Props {
  ngo: NGO | null;
  complaints: Complaint[];
  selectedComplaint: Complaint | null;
  onSelectComplaint: (complaint: Complaint) => void;
  onOpenComplaintModal: (complaint: Complaint) => void;
}

export const NGODispatchMap: React.FC<Props> = ({
  ngo,
  complaints,
  selectedComplaint,
  onSelectComplaint,
  onOpenComplaintModal
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const [activeRouteDistance, setActiveRouteDistance] = useState<number | null>(null);

  // NGO Shelter coordinates (default to Noida Sector 94 if none set)
  const ngoLat = ngo?.latitude || (ngo?.location?.coordinates ? ngo.location.coordinates[1] : 28.5482);
  const ngoLng = ngo?.longitude || (ngo?.location?.coordinates ? ngo.location.coordinates[0] : 77.3426);
  const coverageRadiusKm = ngo?.coverageRadiusKm || 15;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [ngoLat, ngoLng],
        zoom: 12,
        zoomControl: true
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // 1. Clear previous markers & overlays
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (circleRef.current) {
      circleRef.current.remove();
    }
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    // 2. Add NGO Shelter Marker (🏥)
    const ngoIcon = L.divIcon({
      className: "custom-leaflet-ngo-marker",
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
          <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(0, 108, 73, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 34px; height: 34px; border-radius: 12px; background: #006c49; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 16px;">
            🏥
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    const ngoMarker = L.marker([ngoLat, ngoLng], { icon: ngoIcon, zIndexOffset: 1000 }).addTo(map);
    ngoMarker.bindPopup(`
      <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
        <span style="font-size: 10px; font-weight: bold; color: #006c49; text-transform: uppercase;">HQ Shelter Station</span>
        <h4 style="margin: 2px 0; font-weight: 800; color: #0f172a; font-size: 13px;">${ngo?.name || "Voice for Stray Animals"}</h4>
        <p style="margin: 0; color: #64748b; font-size: 11px;">Coverage: <strong>${coverageRadiusKm} KM Zone</strong></p>
      </div>
    `);
    markersRef.current.push(ngoMarker);

    // 3. Draw Coverage Radius Circle (5km, 10km, 20km, 50km)
    const coverageCircle = L.circle([ngoLat, ngoLng], {
      radius: coverageRadiusKm * 1000,
      color: "#006c49",
      weight: 2,
      dashArray: "6, 8",
      fillColor: "#10b981",
      fillOpacity: 0.08
    }).addTo(map);

    circleRef.current = coverageCircle;

    // 4. Add Complaint Markers
    complaints.forEach((comp) => {
      const lat = comp.location?.latitude || (comp.geoPoint?.coordinates ? comp.geoPoint.coordinates[1] : null);
      const lng = comp.location?.longitude || (comp.geoPoint?.coordinates ? comp.geoPoint.coordinates[0] : null);

      if (!lat || !lng) return;

      const isSelected = selectedComplaint?.id === comp.id;
      const isCritical = comp.priority === "Critical" || comp.category === "Emergency Rescue";
      const isResolved = comp.status === "Resolved" || comp.status === "Closed";

      // AUTOMATIC MAP CLEANUP: If an issue is resolved, automatically remove its green tick mark after 24 hours
      if (isResolved) {
        const resolvedTimeStr =
          comp.resolvedAt ||
          comp.timeline?.find((t) => t.status === "Resolved")?.timestamp ||
          comp.updatedAt;

        if (resolvedTimeStr) {
          const resolvedTimeMs = new Date(resolvedTimeStr).getTime();
          const nowMs = Date.now();
          const hoursSinceResolved = (nowMs - resolvedTimeMs) / (1000 * 60 * 60);

          // If resolved more than 24 hours ago, remove mark from map
          if (hoursSinceResolved > 24) {
            return;
          }
        }
      }

      const markerColor = isResolved
        ? "#006c49"
        : isCritical
        ? "#ef4444"
        : comp.priority === "High"
        ? "#f97316"
        : "#eab308";

      const compIcon = L.divIcon({
        className: "custom-leaflet-comp-marker",
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;">
            ${
              isCritical
                ? `<div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(239, 68, 68, 0.4); animation: ping 1.2s infinite;"></div>`
                : ""
            }
            <div style="position: relative; width: 28px; height: 28px; border-radius: 50%; background: ${markerColor}; border: ${
          isSelected ? "3px solid #1e1b4b" : "2px solid white"
        }; box-shadow: 0 4px 6px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; color: white; font-size: 13px; font-weight: bold; transform: ${
          isSelected ? "scale(1.2)" : "scale(1)"
        }; transition: transform 0.2s;">
              ${isCritical ? "🚨" : isResolved ? "✓" : "🐾"}
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const marker = L.marker([lat, lng], { icon: compIcon }).addTo(map);

      marker.on("click", () => {
        onSelectComplaint(comp);
      });

      markersRef.current.push(marker);
    });

    // 5. Draw Dynamic Route Line if a complaint is selected
    if (selectedComplaint) {
      const cLat =
        selectedComplaint.location?.latitude ||
        (selectedComplaint.geoPoint?.coordinates ? selectedComplaint.geoPoint.coordinates[1] : null);
      const cLng =
        selectedComplaint.location?.longitude ||
        (selectedComplaint.geoPoint?.coordinates ? selectedComplaint.geoPoint.coordinates[0] : null);

      if (cLat && cLng) {
        const polyline = L.polyline(
          [
            [ngoLat, ngoLng],
            [cLat, cLng]
          ],
          {
            color: selectedComplaint.priority === "Critical" ? "#ef4444" : "#f97316",
            weight: 4,
            opacity: 0.85,
            dashArray: "8, 12",
            lineCap: "round"
          }
        ).addTo(map);

        routeLineRef.current = polyline;

        // Calculate distance
        const distance = (map.distance([ngoLat, ngoLng], [cLat, cLng]) / 1000).toFixed(1);
        setActiveRouteDistance(parseFloat(distance));

        // Fit map bounds to show both HQ and target dog
        map.fitBounds(
          [
            [ngoLat, ngoLng],
            [cLat, cLng]
          ],
          { padding: [60, 60] }
        );
      }
    } else {
      setActiveRouteDistance(null);
    }
  }, [ngo, complaints, selectedComplaint]);

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([ngoLat, ngoLng], 12);
    }
  };

  return (
    <div className="bg-white rounded-3xl card-elevation-1 border border-slate-100 overflow-hidden shadow-sm flex flex-col h-[650px] relative">
      {/* Map Control Header Bar */}
      <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
            <span className="material-symbols-outlined !text-lg">map</span>
          </div>
          <div>
            <h3 className="font-extrabold text-xs sm:text-sm text-white">
              Live Ambulance Dispatch & Coverage Map
            </h3>
            <p className="text-[11px] text-slate-300">
              {ngo?.name || "Voice for Stray Animals"} • {coverageRadiusKm} KM Coverage Zone
            </p>
          </div>
        </div>

        {/* Legend Pills */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" /> Critical / SOS
          </span>
          <span className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> In Progress
          </span>
          <span className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Resolved (Last 24h)
          </span>
          <button
            onClick={handleResetView}
            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs transition-colors ml-2"
          >
            Center HQ
          </button>
        </div>
      </div>

      {/* Main Leaflet Map Canvas */}
      <div className="flex-1 relative z-0">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Selected Complaint Floating Card Overlay */}
        {selectedComplaint && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-200 z-20 animate-slideUp">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-mono font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                    #{selectedComplaint.trackingId}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      selectedComplaint.priority === "Critical"
                        ? "bg-red-100 text-red-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {selectedComplaint.priority}
                  </span>
                </div>
                <h4 className="font-extrabold text-xs text-slate-900 truncate">
                  {selectedComplaint.title}
                </h4>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  📍 {selectedComplaint.address}
                </p>
              </div>

              <button
                onClick={() => onOpenComplaintModal(selectedComplaint)}
                className="px-3 py-2 bg-[#006c49] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all shrink-0 flex items-center gap-1"
              >
                <span>Inspect</span>
                <span className="material-symbols-outlined !text-sm">arrow_forward</span>
              </button>
            </div>

            {/* Distance & Route ETA Badge */}
            <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-orange-600 font-extrabold">
                <span className="material-symbols-outlined !text-base">distance</span>
                <span>Distance: {activeRouteDistance ?? selectedComplaint.distanceKm ?? 4.2} KM away</span>
              </div>
              <span className="text-slate-500 font-semibold text-[11px]">
                Ambulance ETA: ~{Math.ceil((activeRouteDistance ?? 4) * 3)} mins
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
