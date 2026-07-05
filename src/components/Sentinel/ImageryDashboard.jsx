import React, { useEffect, useState, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  Satellite, RefreshCw, Zap, Database, AlertTriangle, Leaf,
} from "lucide-react";
import axiosInstance from "../../axiosInstance";

import "./config/chartSetup"; // effets de bord : mapboxgl.accessToken + ChartJS.register
import { META } from "./constants";

import Spinner from "./panels/Spinner";
import OutOfBoundsAlert from "./panels/OutOfBoundsAlert";
import IndexGaugePanel from "./panels/IndexGaugePanel";
import YearlyPolygonMapGrid from "./panels/YearlyPolygonMapGrid";
import ClassificationMapsPanel from "./panels/ClassificationMapsPanel";
import SeasonalNdviRainfallPanel from "./panels/SeasonalNdviRainfallPanel";

/**
 * ImageryDashboard
 * Version allégée de SentinelDashboard : uniquement l'imagerie satellite.
 * Panels affichés :
 *  - Index Gauges — Latest Reading
 *  - Plant Health Classification Maps
 *  - Farm Boundary — NDVI by Year
 *  - Seasonal NDVI vs Rainfall
 */
export default function ImageryDashboard({ entityType = "farm" }) {
  const params = useParams();
  const location = useLocation();

  const rawId = params.farmId || params.forestId
    || location.state?.farmId || location.state?.forestId || null;
  const entityId = (rawId && rawId !== "undefined" && rawId !== "null")
    ? String(rawId).trim() : null;
  const type = entityType || (params.forestId ? "forest" : "farm");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [active, setActive] = useState("ndvi"); // index utilisé pour la carte annuelle NDVI

  const fetchData = useCallback(async (extraParams = {}) => {
    if (!entityId) { setError("No entity ID"); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const url = type === "forest"
        ? `/api/sentinel/forest/${entityId}/sat-index`
        : `/api/sentinel/farm/${entityId}/sat-index`;
      const resp = await axiosInstance.get(url, { params: extraParams });
      setData(resp.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load satellite data");
    } finally {
      setLoading(false);
    }
  }, [entityId, type]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <Spinner />;

  if (error || !data) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 p-8 max-w-sm text-center">
        <Satellite size={48} className="text-slate-700 mx-auto mb-4" />
        <h2 className="text-white font-bold text-lg mb-2">Satellite Data Unavailable</h2>
        <p className="text-slate-400 text-sm mb-4">{error || "No data returned"}</p>
        <button onClick={() => fetchData()}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-full text-sm font-semibold transition-colors">
          Retry
        </button>
      </div>
    </div>
  );

  const history = data.history || [];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-900 flex items-center justify-center">
              <Satellite size={16} className="text-emerald-400" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">{data.name}</p>
              <p className="text-xs text-slate-500">
                Sentinel-2 · {data.period?.from} → {data.period?.to}
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {data?.from_cache && (
              <span className="flex items-center gap-1 text-xs text-slate-500 border border-slate-700 px-2 py-1 rounded-lg">
                <Database size={11} /> Cached
                {data.cache_stale && (
                  <span className="text-yellow-500 flex items-center gap-0.5 ml-1">
                    <AlertTriangle size={10} /> stale
                  </span>
                )}
                {data.cache_updated_at && (
                  <span className="ml-1">· {data.cache_updated_at.substring(0, 10)}</span>
                )}
              </span>
            )}
            <button
              onClick={() => fetchData({ refresh: true })}
              className="flex items-center gap-1.5 border border-slate-600 text-slate-400 hover:text-white
                         text-sm px-3 py-1.5 rounded-lg transition-colors">
              <RefreshCw size={13} /> Fresh
            </button>
            <button
              onClick={() => fetchData()}
              className="flex items-center gap-1.5 border border-slate-700 text-slate-500 hover:text-slate-300
                         text-sm px-3 py-1.5 rounded-lg transition-colors">
              <Zap size={13} /> Cache
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <OutOfBoundsAlert items={data.out_of_bounds} />

        {/* Index Gauges — Latest Reading */}
        <IndexGaugePanel data={data} />

        {/* Sélecteur d'indice pour la carte annuelle NDVI (par défaut NDVI) */}
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Leaf size={12} /> Indice affiché sur la carte annuelle
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {Object.entries(META).map(([idx, m]) => (
              <button
                key={idx}
                onClick={() => setActive(idx)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${
                  active === idx
                    ? "text-white"
                    : "text-slate-400 border-slate-700 hover:text-slate-200"
                }`}
                style={active === idx
                  ? { background: m.color + "33", borderColor: m.color, color: m.color }
                  : {}}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Farm Boundary — NDVI by Year */}
        {type === "farm" && (
          <YearlyPolygonMapGrid
            entityId={entityId}
            history={history}
            activeIndex={active}
          />
        )}

        {/* Seasonal NDVI vs Rainfall */}
        {type === "farm" && (
          <SeasonalNdviRainfallPanel entityId={entityId} entityType={type} />
        )}

        {/* Plant Health Classification Maps */}
        {type === "farm" && (
          <ClassificationMapsPanel entityId={entityId} />
        )}

        <p className="text-center text-xs text-slate-600 pb-4">
          Sentinel-2 L2A · Statistical API · Max cloud cover 30% · Quarterly aggregation
        </p>
      </div>
    </div>
  );
}