import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, MapPin, ZoomIn, ZoomOut, Maximize2, ExternalLink, Copy, Check } from 'lucide-react';

interface PropertyMapProps {
  latitude: number | null;
  longitude: number | null;
  formattedAddress: string;
  apn: string;
  variant?: 'full' | 'mini' | 'compact';
  height?: string;
  onExpand?: () => void;
}

export const PropertyMap: React.FC<PropertyMapProps> = ({
  latitude,
  longitude,
  formattedAddress,
  apn,
  variant = 'full',
  height,
  onExpand,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');
  const [copiedCoords, setCopiedCoords] = useState(false);

  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number' && !isNaN(latitude) && !isNaN(longitude);
  // Default coordinates (Orange County Irvine Center) if unverified
  const centerLat = hasCoords ? latitude : 33.6846;
  const centerLng = hasCoords ? longitude : -117.8265;

  const tileUrls = {
    streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean existing map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const zoomLevel = variant === 'mini' ? 16 : 17;

    // Initialize Leaflet Map
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: variant !== 'mini',
      dragging: variant !== 'mini' || window.innerWidth > 768,
    }).setView([centerLat, centerLng], zoomLevel);

    mapInstanceRef.current = map;

    // Add selected Tile Layer
    const tileLayer = L.tileLayer(tileUrls[mapType], {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap &copy; Esri',
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Custom Marker Icon with Pulse
    const customIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="
          position: relative;
          width: ${variant === 'mini' ? '20px' : '26px'};
          height: ${variant === 'mini' ? '20px' : '26px'};
          background: #0284c7;
          border: 2.5px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 12px rgba(2, 132, 199, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 6px; height: 6px; background: #ffffff; border-radius: 50%;"></div>
        </div>
      `,
      iconSize: variant === 'mini' ? [20, 20] : [26, 26],
      iconAnchor: variant === 'mini' ? [10, 10] : [13, 13],
    });

    const marker = L.marker([centerLat, centerLng], { icon: customIcon }).addTo(map);

    // Approximate GIS Parcel Boundary Box Overlay
    const deltaLat = variant === 'mini' ? 0.0006 : 0.0008;
    const deltaLng = variant === 'mini' ? 0.0009 : 0.0012;
    const parcelPolygon = [
      [centerLat + deltaLat, centerLng - deltaLng],
      [centerLat + deltaLat * 0.95, centerLng + deltaLng * 1.05],
      [centerLat - deltaLat, centerLng + deltaLng],
      [centerLat - deltaLat * 0.95, centerLng - deltaLng * 0.95],
    ];

    L.polygon(parcelPolygon as L.LatLngExpression[], {
      color: '#0284c7',
      weight: 2,
      fillColor: '#0284c7',
      fillOpacity: mapType === 'satellite' ? 0.25 : 0.15,
      dashArray: '3, 4',
    }).addTo(map);

    marker.bindPopup(`
      <div style="font-family: ui-sans-serif, system-ui, sans-serif; font-size: 11px; color: #0f172a; line-height: 1.4; padding: 2px;">
        <strong style="color: #0284c7; font-family: monospace;">APN: ${apn}</strong><br/>
        <span style="font-weight: 500;">${formattedAddress}</span><br/>
        <span style="font-size: 10px; color: #64748b;">${centerLat.toFixed(5)}, ${centerLng.toFixed(5)}</span>
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
  }, [centerLat, centerLng, formattedAddress, apn, mapType, variant]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleRecenter = () => {
    mapInstanceRef.current?.setView([centerLat, centerLng], variant === 'mini' ? 16 : 17);
  };

  const handleCopyCoords = () => {
    const coordString = `${centerLat.toFixed(6)}, ${centerLng.toFixed(6)}`;
    navigator.clipboard?.writeText(coordString);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    hasCoords ? `${centerLat},${centerLng}` : formattedAddress
  )}`;

  // Mini-map specific compact rendering
  if (variant === 'mini') {
    return (
      <div className="relative w-full h-full min-h-[160px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs group flex flex-col justify-between">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

        {/* Top Badges */}
        <div className="relative z-10 p-2.5 flex items-center justify-between pointer-events-none">
          <div className="px-2 py-1 rounded-lg bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-2xs flex items-center gap-1.5 text-[10px] font-medium text-slate-700 pointer-events-auto">
            <span className={`w-2 h-2 rounded-full ${hasCoords ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="font-mono font-bold text-slate-800">
              {hasCoords ? `${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}` : 'Approx. Coordinates'}
            </span>
          </div>

          <div className="flex items-center gap-1 pointer-events-auto">
            <button
              type="button"
              onClick={() => setMapType(mapType === 'streets' ? 'satellite' : 'streets')}
              className="p-1 rounded-lg bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-2xs text-slate-700 hover:text-blue-600 hover:bg-slate-50 text-[10px] font-semibold transition-colors"
              title={`Switch to ${mapType === 'streets' ? 'Satellite' : 'Streets'} view`}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
            {onExpand && (
              <button
                type="button"
                onClick={onExpand}
                className="p-1 rounded-lg bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-2xs text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors"
                title="Expand Spatial View"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Actions & Links */}
        <div className="relative z-10 p-2.5 flex items-center justify-between pointer-events-none mt-auto">
          <button
            type="button"
            onClick={handleCopyCoords}
            className="px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xs text-[10px] font-mono text-slate-600 hover:text-slate-900 pointer-events-auto flex items-center gap-1 transition-colors"
            title="Copy Latitude, Longitude"
          >
            {copiedCoords ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5 text-slate-400" />}
            <span>{copiedCoords ? 'Copied' : 'Copy GPS'}</span>
          </button>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xs text-[10px] font-medium text-blue-600 hover:text-blue-800 pointer-events-auto flex items-center gap-1 transition-colors"
          >
            <span>Google Maps</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    );
  }

  // Full interactive variant
  return (
    <div
      style={{ height: height || '320px' }}
      className="relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs group"
    >
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Left Overlay Badge */}
      <div className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-xs font-mono text-slate-700 flex items-center gap-2.5 shadow-sm">
        <span className={`w-2.5 h-2.5 rounded-full ${hasCoords ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
        <div className="flex items-center gap-1.5 font-sans">
          <span className="text-blue-700 font-bold">GIS Parcel Boundary</span>
          <span className="text-slate-300">|</span>
          <span className="font-mono text-slate-700">{centerLat.toFixed(5)}, {centerLng.toFixed(5)}</span>
        </div>
        <button
          type="button"
          onClick={handleCopyCoords}
          className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
          title="Copy Coordinates"
        >
          {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Top Right Map Layer & Zoom Controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 items-end">
        {/* Layer Selector */}
        <div className="flex items-center p-0.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-xs">
          <button
            type="button"
            onClick={() => setMapType('streets')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              mapType === 'streets'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Streets
          </button>
          <button
            type="button"
            onClick={() => setMapType('satellite')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              mapType === 'satellite'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Satellite
          </button>
        </div>

        {/* Zoom & Recenter Controls */}
        <div className="flex flex-col rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-b border-slate-100 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-b border-slate-100 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRecenter}
            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors"
            title="Re-center on Parcel"
          >
            <MapPin className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm border border-slate-200 text-[10px] text-slate-600 font-mono shadow-2xs pointer-events-auto">
          FIPS: 06059 · Spatial CRS: EPSG:4326
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm border border-slate-200 text-[10px] font-semibold text-blue-600 hover:text-blue-800 shadow-2xs flex items-center gap-1 transition-colors"
          >
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
