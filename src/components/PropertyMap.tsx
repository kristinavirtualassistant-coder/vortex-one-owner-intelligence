import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface PropertyMapProps {
  latitude: number | null;
  longitude: number | null;
  formattedAddress: string;
  apn: string;
}

export const PropertyMap: React.FC<PropertyMapProps> = ({
  latitude,
  longitude,
  formattedAddress,
  apn,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const defaultLat = latitude || 33.6846;
  const defaultLng = longitude || -117.8265;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean existing map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize Leaflet Map
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([defaultLat, defaultLng], 16);

    mapInstanceRef.current = map;

    // Add Dark-themed OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Custom Marker Icon
    const customIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="
          width: 22px;
          height: 22px;
          background: #10b981;
          border: 3px solid #042f2e;
          border-radius: 50%;
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
        </div>
      `,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    const marker = L.marker([defaultLat, defaultLng], { icon: customIcon }).addTo(map);

    // Simulated Parcel Boundary Box Overlay
    const deltaLat = 0.0008;
    const deltaLng = 0.0012;
    const parcelPolygon = [
      [defaultLat + deltaLat, defaultLng - deltaLng],
      [defaultLat + deltaLat * 0.9, defaultLng + deltaLng * 1.1],
      [defaultLat - deltaLat, defaultLng + deltaLng],
      [defaultLat - deltaLat * 0.9, defaultLng - deltaLng * 0.9],
    ];

    L.polygon(parcelPolygon as L.LatLngExpression[], {
      color: '#10b981',
      weight: 2,
      fillColor: '#10b981',
      fillOpacity: 0.15,
      dashArray: '4, 4',
    }).addTo(map);

    marker.bindPopup(`
      <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; padding: 2px;">
        <strong style="color: #059669;">APN: ${apn}</strong><br/>
        <span>${formattedAddress}</span>
      </div>
    `);

    // Invalidate size on container resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [defaultLat, defaultLng, formattedAddress, apn]);

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-xs group">
      <div ref={mapContainerRef} className="w-full h-full min-h-[300px] z-10" />

      {/* Map Header Overlay Badge */}
      <div className="absolute top-3 left-3 z-20 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200 text-[11px] font-mono text-slate-700 flex items-center gap-2 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        <span className="text-indigo-600 font-bold">GIS Parcel GIS Boundary</span>
        <span className="text-slate-300">|</span>
        <span>{defaultLat.toFixed(4)}, {defaultLng.toFixed(4)}</span>
      </div>

      <div className="absolute bottom-3 right-3 z-20 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm border border-slate-200 text-[10px] text-slate-500 font-mono shadow-xs">
        OpenStreetMap • Orange County GIS
      </div>
    </div>
  );
};
