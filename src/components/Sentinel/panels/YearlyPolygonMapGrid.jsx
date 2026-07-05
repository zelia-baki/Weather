import { useState, useEffect, useMemo } from "react";
import { Loader2, Satellite } from "lucide-react";
import * as turf from "@turf/turf";
import axiosInstance from "../../../axiosInstance";
import mapboxgl from "../config/chartSetup";
import { META } from "../constants";
import { valueToColor } from "../utils/colorUtils";
import MiniYearMap from "./MiniYearMap";

export default function YearlyPolygonMapGrid({ entityId, history, activeIndex }) {
  const [polygon, setPolygon] = useState(null);
  const [center, setCenter] = useState(null);
  const [bounds, setBounds] = useState(null);
  const [pointsError, setPointsError] = useState(null);
  const [pointsLoading, setPointsLoading] = useState(true);

  useEffect(() => {
    if (!entityId) return;
    let cancelled = false;
    setPointsLoading(true);
    axiosInstance.get(`/api/points/getbyownerid/farmer/${entityId}`)
      .then(({ data }) => {
        if (cancelled) return;
        const points = data.points || [];
        if (points.length < 3) {
          setPointsError('Not enough boundary points to draw a polygon.');
          setPointsLoading(false);
          return;
        }
        const ring = points.map(p => [p.longitude, p.latitude]);
        const [fx, fy] = ring[0];
        const [lx, ly] = ring[ring.length - 1];
        if (fx !== lx || fy !== ly) ring.push([fx, fy]);

        const gj = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: {} };
        const centroid = turf.centroid(gj).geometry.coordinates;
        const b = ring.reduce(
          (acc, c) => acc.extend(c),
          new mapboxgl.LngLatBounds(ring[0], ring[0])
        );

        setPolygon(gj);
        setCenter(centroid);
        setBounds(b);
        setPointsLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setPointsError('Failed to load farm boundary.');
          setPointsLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [entityId]);

  const yearlyValues = useMemo(() => {
    const sums = {};
    history.forEach(row => {
      const val = row[activeIndex]?.value;
      if (val == null) return;
      const year = row.date.substring(0, 4);
      if (!sums[year]) sums[year] = { total: 0, count: 0 };
      sums[year].total += val;
      sums[year].count += 1;
    });
    return Object.entries(sums)
      .map(([year, { total, count }]) => ({ year, avg: total / count }))
      .sort((a, b) => a.year.localeCompare(b.year));
  }, [history, activeIndex]);

  const meta = META[activeIndex];

  if (pointsLoading) {
    return (
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex items-center gap-3">
        <Loader2 size={18} className="animate-spin text-emerald-400" />
        <p className="text-sm text-slate-400">Loading farm boundary…</p>
      </div>
    );
  }

  if (pointsError) {
    return (
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
        <p className="text-sm text-slate-500">{pointsError}</p>
      </div>
    );
  }

  if (!yearlyValues.length) return null;

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Satellite size={16} style={{ color: meta?.color }} />
            Farm Boundary — {meta?.label} by Year
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Same parcel boundary, colored by the {meta?.label} annual average. Click an index card above to switch.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="w-3 h-3 rounded-full" style={{ background: '#dc2626' }} /> low
          <span className="w-3 h-3 rounded-full" style={{ background: '#eab308' }} /> mid
          <span className="w-3 h-3 rounded-full" style={{ background: '#16a34a' }} /> high
        </div>
      </div>
      <div className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {yearlyValues.map(({ year, avg }) => (
          <MiniYearMap
            key={year}
            year={year}
            color={valueToColor(avg, activeIndex)}
            polygon={polygon}
            center={center}
            bounds={bounds}
            label={avg.toFixed(3)}
          />
        ))}
      </div>
    </div>
  );
}