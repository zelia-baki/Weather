import { useEffect, useRef } from "react";
import mapboxgl from "../config/chartSetup";

export default function MiniYearMap({ year, color, polygon, center, bounds, label }) {
  const containerRef = useRef();
  const mapRef = useRef();
  const fillLayerAdded = useRef(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !polygon || !center) return;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center,
      zoom: 14,
      interactive: false,
      attributionControl: false,
    });
    mapRef.current = map;

    map.on('load', () => {
      if (bounds) map.fitBounds(bounds, { padding: 24, duration: 0 });

      map.addSource(`poly-${year}`, { type: 'geojson', data: polygon });
      map.addLayer({
        id: `poly-fill-${year}`, type: 'fill', source: `poly-${year}`,
        paint: { 'fill-color': color, 'fill-opacity': 0.55 },
      });
      map.addLayer({
        id: `poly-line-${year}`, type: 'line', source: `poly-${year}`,
        paint: { 'line-color': '#ffffff', 'line-width': 1.5, 'line-opacity': 0.8 },
      });
      fillLayerAdded.current = true;
    });

    return () => { map.remove(); mapRef.current = null; };
  }, [polygon, center, bounds, year]); // eslint-disable-line

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !fillLayerAdded.current) return;
    if (map.getLayer(`poly-fill-${year}`)) {
      map.setPaintProperty(`poly-fill-${year}`, 'fill-color', color);
    }
  }, [color, year]);

  return (
    <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900">
      <div ref={containerRef} className="w-full h-32" />
      <div className="px-3 py-2 flex items-center justify-between bg-slate-900/90">
        <span className="text-xs font-bold text-slate-300">{year}</span>
        <span className="text-xs font-mono font-semibold" style={{ color }}>{label}</span>
      </div>
    </div>
  );
}