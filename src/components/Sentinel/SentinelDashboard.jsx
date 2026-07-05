import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Line } from "react-chartjs-2";
import {
  Leaf, Droplets, Flame, Satellite, RefreshCw, Zap,
  Download, Activity, BarChart2, AlertTriangle, Database, Loader2,
} from "lucide-react";
import axiosInstance from "../../axiosInstance";

import "./config/chartSetup"; // effets de bord : mapboxgl.accessToken + ChartJS.register
import { META } from "./constants";
import { buildChartData, CHART_OPTIONS } from "./utils/chartBuilders";

import Spinner from "./panels/Spinner";
import TierBadge from "./panels/TierBadge";
import OutOfBoundsAlert from "./panels/OutOfBoundsAlert";
import IndexCard from "./panels/IndexCard";
import LTVPanel from "./panels/LTVPanel";
import YearlyPolygonMapGrid from "./panels/YearlyPolygonMapGrid";
import ClassificationMapsPanel from "./panels/ClassificationMapsPanel";
import YieldAnalysisPanel from "./panels/YieldAnalysisPanel";
import WeeklyTrendPanel from "./panels/WeeklyTrendPanel";
import IndexGaugePanel from "./panels/IndexGaugePanel";
import SeasonalNdviRainfallPanel from "./panels/SeasonalNdviRainfallPanel";

export default function SentinelDashboard({ entityType = 'farm' }) {
  const params = useParams();
  const location = useLocation();

  const rawId = params.farmId || params.forestId
    || location.state?.farmId || location.state?.forestId || null;
  const entityId = (rawId && rawId !== 'undefined' && rawId !== 'null')
    ? String(rawId).trim() : null;
  const type = entityType || (params.forestId ? 'forest' : 'farm');

  useEffect(() => {
    console.log('[Sentinel] entityId:', entityId, 'type:', type);
  }, []);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [active, setActive] = useState('ndvi');
  const [exporting, setExporting] = useState(false);

  const [ltvLoading, setLtvLoading] = useState(false);
  const ltvParamsRef = useRef({});

  const fetchData = useCallback(async (extraParams = {}) => {
    if (!entityId) { setError('No entity ID'); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const url = type === 'forest'
        ? `/api/sentinel/forest/${entityId}/sat-index`
        : `/api/sentinel/farm/${entityId}/sat-index`;
      const resp = await axiosInstance.get(url, {
        params: { ...ltvParamsRef.current, ...extraParams },
      });
      setData(resp.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load satellite data');
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
    const url = type === 'forest'
      ? `/api/sentinel/forest/${entityId}/sat-index`
      : `/api/sentinel/farm/${entityId}/sat-index`;
    setLtvLoading(true);
    axiosInstance.get(url, { params: apiParams })
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.error || 'LTV calculation failed'))
      .finally(() => setLtvLoading(false));
  }, [entityId, type]);

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const resp = await axiosInstance.get(
        `/api/sentinel/farm/${entityId}/sat-index/pdf`,
        { params: ltvParamsRef.current, responseType: 'blob' },
      );
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(new Blob([resp.data]));
      link.setAttribute('download', `sat_index_${entityId}.pdf`);
      document.body.appendChild(link); link.click(); link.remove();
    } catch {
      alert('PDF export failed');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <Spinner />;

  if (error || !data) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 p-8 max-w-sm text-center">
        <Satellite size={48} className="text-slate-700 mx-auto mb-4" />
        <h2 className="text-white font-bold text-lg mb-2">Satellite Data Unavailable</h2>
        <p className="text-slate-400 text-sm mb-4">{error || 'No data returned'}</p>
        <button onClick={() => fetchData()}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-full text-sm font-semibold transition-colors">
          Retry
        </button>
      </div>
    </div>
  );

  const history = data.history || [];
  const forecast = data.forecast || {};
  const groups = [
    { title: 'Vegetation', Icon: Leaf, keys: ['ndvi', 'evi', 'savi'] },
    { title: 'Water & Drought', Icon: Droplets, keys: ['ndmi', 'ndwi', 'nmdi'] },
    { title: 'Fire & Soil', Icon: Flame, keys: ['nbr', 'bsi'] },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
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
            {type === 'farm' && (
              <button
                onClick={handleExportPdf}
                disabled={exporting}
                className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50
                           text-white text-sm px-4 py-1.5 rounded-lg transition-colors font-medium">
                <Download size={13} />
                {exporting ? 'Generating…' : 'PDF'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <OutOfBoundsAlert items={data.out_of_bounds} />

        {groups.map(({ title, Icon: GIcon, keys }) => (
          <div key={title}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <GIcon size={12} /> {title}
            </p>
            <div className={`grid gap-3 ${keys.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {keys.map(idx => (
                <IndexCard
                  key={idx} idx={idx} data={data}
                  active={active === idx}
                  onClick={() => setActive(idx)}
                />
              ))}
            </div>
          </div>
        ))}
        <IndexGaugePanel data={data} />
        {type === 'farm' && (
          <WeeklyTrendPanel entityId={entityId} entityType={type} />
        )}
        {type === 'farm' && (
          <SeasonalNdviRainfallPanel entityId={entityId} entityType={type} />
        )}

        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
          <div className="mb-1">
            <h3 className="font-bold text-white flex items-center gap-2">
              {React.createElement(META[active].Icon, { size: 16, style: { color: META[active].color } })}
              {META[active].full}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              5-year history · dashed = 1-year ML forecast (Prophet) · shaded = 80% confidence interval
            </p>
          </div>
          <div className="flex flex-wrap gap-2 mb-4 mt-2">
            {(data.tiers_meta?.[active] || []).map(t => (
              <span key={t.label} className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: t.color + '22', color: t.color, border: `1px solid ${t.color}44` }}>
                {t.label}
              </span>
            ))}
          </div>
          <div className="h-72">
            <Line
              data={buildChartData(active, history, forecast[active] || [])}
              options={CHART_OPTIONS}
            />
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Activity size={14} className="text-emerald-400" /> 1-Year Forecast — All Indices
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-800">
                  <th className="px-5 py-3">Quarter</th>
                  {Object.entries(META).map(([idx, m]) => (
                    <td key={idx} className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <m.Icon size={11} style={{ color: m.color }} /> {m.label}
                      </div>
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(forecast.ndvi || []).map((fc, i) => (
                  <tr key={i} className="border-t border-slate-800 hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-3 font-mono text-slate-300">{fc.quarter}</td>
                    {Object.keys(META).map(idx => {
                      const f = forecast[idx]?.[i];
                      if (!f) return (
                        <td key={idx} className="px-4 py-3 text-center text-slate-600">—</td>
                      );
                      return (
                        <td key={idx} className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-bold" style={{ color: META[idx].color }}>
                              {f.value.toFixed(4)}
                            </span>
                            <TierBadge tier={f.tier} />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {!(forecast.ndvi?.length) && (
                  <tr>
                    <td colSpan={9} className="px-5 py-6 text-center text-slate-600 text-sm">
                      No forecast data — install Prophet: <code className="text-slate-400">pip install prophet</code>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <BarChart2 size={14} className="text-emerald-400" /> Historical Data — 5 Years
            </h3>
          </div>
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-900">
                <tr className="text-left uppercase tracking-wide text-slate-500 border-b border-slate-800">
                  <th className="px-5 py-2">Date</th>
                  {Object.entries(META).map(([idx, m]) => (
                    <td key={idx} className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <m.Icon size={10} style={{ color: m.color }} /> {m.label}
                      </div>
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((row, i) => (
                  <tr key={i} className="border-t border-slate-800 hover:bg-slate-800/30">
                    <td className="px-5 py-2 font-mono text-slate-400">{row.date}</td>
                    {Object.keys(META).map(idx => {
                      const d = row[idx];
                      return (
                        <td key={idx} className="px-4 py-2 text-center">
                          {d?.value != null ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="font-semibold" style={{ color: d.tier?.color }}>
                                {d.value.toFixed(4)}
                              </span>
                              {d.raw != null && d.raw !== d.value && (
                                <span className="text-orange-500 font-mono" style={{ fontSize: '9px' }}>
                                  raw {d.raw.toFixed(4)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {type === 'farm' && (
          <LTVPanel
            ltv={data.ltv}
            onUpdate={handleLTVUpdate}
            ltvLoading={ltvLoading}
            activeIndex={active}
          />
        )}

        {type === 'farm' && (
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

        {type === 'farm' && (
          <YearlyPolygonMapGrid
            entityId={entityId}
            history={history}
            activeIndex={active}
          />
        )}

        {type === 'farm' && (
          <ClassificationMapsPanel entityId={entityId} />
        )}

        <p className="text-center text-xs text-slate-600 pb-4">
          Sentinel-2 L2A · Statistical API · Max cloud cover 30% · Quarterly aggregation ·
          Forecast: Prophet ML · 80% confidence interval
        </p>
      </div>
    </div>
  );
}