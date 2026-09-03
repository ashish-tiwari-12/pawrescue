import React, { useEffect, useRef } from "react";
import L from "leaflet";

interface Props {
  latitude: number;
  longitude: number;
  title?: string;
  address?: string;
  category?: string;
}

export const ComplaintLocationMap: React.FC<Props> = ({
  latitude,
  longitude,
  title = "Incident Sighting",
  address = "",
  category = "Injured Dog"
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom: 15,
        zoomControl: true
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      // Custom pulsing dog pin icon
      const dogIcon = L.divIcon({
        className: "custom-leaflet-dog-pin",
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
            <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(249, 115, 22, 0.3); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 28px; height: 28px; border-radius: 50%; background: #f97316; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">
              🐾
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker([latitude, longitude], { icon: dogIcon }).addTo(map);
      marker
        .bindPopup(
          `
          <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; padding: 2px;">
            <strong style="color: #9d4300; font-size: 13px; display: block; margin-bottom: 2px;">📍 ${category}</strong>
            <span style="color: #334155; font-weight: 600;">${title}</span>
            ${address ? `<p style="margin: 4px 0 0 0; color: #64748b; font-size: 11px;">${address}</p>` : ""}
          </div>
        `
        )
        .openPopup();

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([latitude, longitude], 15);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, title, address, category]);

  return (
    <div className="w-full h-64 sm:h-72 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
