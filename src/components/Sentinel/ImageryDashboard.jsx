import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  Satellite, RefreshCw, Zap, Database, AlertTriangle,
} from "lucide-react";
import axiosInstance from "../../axiosInstance";

import "./config/chartSetup"; // side effects: mapboxgl.accessToken + ChartJS.register

import Spinner from "./panels/Spinner";
import OutOfBoundsAlert from "./panels/OutOfBoundsAlert";
import IndexGaugePanel from "./panels/IndexGaugePanel";
import ClassificationMapsPanel from "./panels/ClassificationMapsPanel";
import SeasonalNdviRainfallPanel from "./panels/SeasonalNdviRainfallPanel";
import LTVPanel from "./panels/LTVPanel";
import YieldAnalysisPanel from "./panels/YieldAnalysisPanel";
import WeeklyTrendPanel from "./panels/WeeklyTrendPanel";

/**
 * ImageryDashboard
 * Lightweight version of SentinelDashboard: satellite imagery only.
 * Panels shown:
 *  - Index Gauges — Latest Reading
 *  - Plant Health Classification Maps
 *  - Seasonal NDVI vs Rainfall
 *  - LTV (farm only)
 *  - Yield Analysis / regression (farm only)
 *  - Weekly Trend (~5-day Sentinel-2 revisit)
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
  const [active, setActive] = useState("ndvi");
  const [ltvLoading, setLtvLoading] = useState(false);
  const ltvParamsRef = useRef({});

  const fetchData = useCallback(async (extraParams = {}) => {
    if (!entityId) { setError("No entity ID"); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const url = type === "forest"
        ? `/api/sentinel/forest/${entityId}/sat-index`
        : `/api/sentinel/farm/${entityId}/sat-index`;
      const resp = await axiosInstance.get(url, { params: { ...ltvParamsRef.current, ...extraParams } });
      setData(resp.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load satellite data");
    } finally {
      setLoading(false);
    }
  }, [entityId, type]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLTVUpdate = useCallback((p) => {
    const apiParams = {
      loan_amount: p.loan_amount ?? undefined,
      yield_t_per_ha: p.yield_t_per_ha ?? 1.5,
      price_per_t: p.price_per_t ?? 500,
      ...(p.hist_yield_1 != null ? { hist_yield_1: p.hist_yield_1 } : {}),
      ...(p.hist_yield_2 != null ? { hist_yield_2: p.hist_yield_2 } : {}),
    };
    ltvParamsRef.current = apiParams;
    setLtvLoading(true);
    const url = type === "forest"
      ? `/api/sentinel/forest/${entityId}/sat-index`
      : `/api/sentinel/farm/${entityId}/sat-index`;
    axiosInstance.get(url, { params: apiParams })
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.error || "LTV calculation failed"))
      .finally(() => setLtvLoading(false));
  }, [entityId, type]);

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
  const forecast = data.forecast || {};

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

        {/* Seasonal NDVI vs Rainfall */}
        {type === "farm" && (
          <SeasonalNdviRainfallPanel entityId={entityId} entityType={type} />
        )}

        {/* LTV */}
        {type === "farm" && (
          <LTVPanel
            ltv={data.ltv}
            onUpdate={handleLTVUpdate}
            ltvLoading={ltvLoading}
            activeIndex={active}
          />
        )}

        {/* Yield Analysis — regression */}
        {type === "farm" && (
          <YieldAnalysisPanel
            history={history}
            forecast={forecast}
            ltv={data.ltv}
            activeIndex={active}
            onCalibrate={(calibParams) => handleLTVUpdate({
              loan_amount: data.ltv?.loan_amount_usd ?? null,
              yield_t_per_ha: data.ltv?.yield_t_per_ha ?? 1.5,
              price_per_t: data.ltv?.price_per_t ?? 500,
              ...calibParams,
            })}
          />
        )}

        {/* Weekly Trend — ~5-day Sentinel-2 revisit */}
        {(type === "farm" || type === "forest") && (
          <WeeklyTrendPanel entityId={entityId} entityType={type} />
        )}

        {/* Plant Health Classification Maps */}
        {(type === "farm" || type === "forest") && (
          <ClassificationMapsPanel entityId={entityId} entityType={type} />
        )}

        <p className="text-center text-xs text-slate-600 pb-4">
          Sentinel-2 L2A · Statistical API · Max cloud cover 30% · Quarterly aggregation
        </p>
      </div>
    </div>
  );
}