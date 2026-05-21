import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import axiosInstance from "../../axiosInstance";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Filler, Tooltip, Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  Leaf, TrendingUp, Wheat, Droplets, Waves, Sun,
  Flame, Mountain, Satellite, RefreshCw, Zap,
  Download, Activity, BarChart2, DollarSign,
  AlertTriangle, Shield, Database, Loader2,
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Filler, Tooltip, Legend);

// ─────────────────────────────────────────────────────────────
// OUT-OF-BOUNDS ALERT
// Shown when Sentinel returns raw values outside [-1, 1].
// ─────────────────────────────────────────────────────────────
const OutOfBoundsAlert = ({ items }) => {
  const [open, setOpen] = useState(true);
  if (!items?.length || !open) return null;
  return (
    <div className="rounded-xl border border-orange-700/50 bg-orange-950/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertTriangle size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-orange-300 font-semibold text-sm">
              {items.length} out-of-bounds value{items.length > 1 ? 's' : ''} detected
            </p>
            <p className="text-orange-500 text-xs mt-0.5 mb-2">
              These raw Sentinel values exceeded [-1, 1] and were clamped to the valid physical range.
              Likely cause: cached data from before the clamp fix, or cloud-edge pixels.
            </p>
            <div className="flex flex-wrap gap-2">
              {items.map((it, i) => (
                <span key={i}
                  className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5
                             rounded-full bg-orange-900/40 border border-orange-700/50 text-orange-300">
                  <span className="font-bold uppercase text-orange-400">{it.index}</span>
                  <span className="text-orange-500">@{it.date}</span>
                  <span className="text-white font-bold">raw={it.raw}</span>
                  <span className="text-orange-500">→{it.clamped_to}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
        <button onClick={() => setOpen(false)}
          className="text-orange-600 hover:text-orange-400 text-xs flex-shrink-0">✕</button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// INDEX METADATA
// ─────────────────────────────────────────────────────────────
const META = {
  ndvi: { label: 'NDVI', full: 'Vegetation Health',        Icon: Leaf,       color: '#16a34a', fill: 'rgba(22,163,74,0.12)',   group: 'vegetation' },
  evi:  { label: 'EVI',  full: 'Enhanced Vegetation',      Icon: TrendingUp, color: '#0d9488', fill: 'rgba(13,148,136,0.12)',  group: 'vegetation' },
  savi: { label: 'SAVI', full: 'Soil Adjusted Vegetation', Icon: Wheat,      color: '#65a30d', fill: 'rgba(101,163,13,0.12)',  group: 'vegetation' },
  ndmi: { label: 'NDMI', full: 'Moisture Index',           Icon: Droplets,   color: '#0284c7', fill: 'rgba(2,132,199,0.12)',   group: 'water'      },
  ndwi: { label: 'NDWI', full: 'Water Body Index',         Icon: Waves,      color: '#0ea5e9', fill: 'rgba(14,165,233,0.12)',  group: 'water'      },
  nmdi: { label: 'NMDI', full: 'Drought Index',            Icon: Sun,        color: '#f97316', fill: 'rgba(249,115,22,0.12)',  group: 'drought'    },
  nbr:  { label: 'NBR',  full: 'Burn Ratio',               Icon: Flame,      color: '#ef4444', fill: 'rgba(239,68,68,0.12)',   group: 'fire'       },
  bsi:  { label: 'BSI',  full: 'Bare Soil Index',          Icon: Mountain,   color: '#92400e', fill: 'rgba(146,64,14,0.12)',   group: 'soil'       },
};

// ─────────────────────────────────────────────────────────────
// SPINNER (full page — only used for the initial load)
// ─────────────────────────────────────────────────────────────
const Spinner = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 gap-4">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 border-4 border-emerald-900 rounded-full" />
      <div className="absolute inset-0 border-4 border-t-emerald-400 rounded-full animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Satellite size={22} className="text-emerald-400" />
      </div>
    </div>
    <p className="text-emerald-400 text-sm font-mono tracking-widest animate-pulse">
      QUERYING SENTINEL-2...
    </p>
  </div>
);

// ─────────────────────────────────────────────────────────────
// TIER BADGE
// ─────────────────────────────────────────────────────────────
const TierBadge = ({ tier }) => {
  if (!tier) return null;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ background: tier.bg || tier.color + '22', color: tier.color }}>
      {tier.label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────
// INDEX CARD
// ─────────────────────────────────────────────────────────────
const IndexCard = ({ idx, data, active, onClick }) => {
  const meta     = META[idx];
  const { Icon } = meta;
  const history  = data?.history || [];
  const last     = history[history.length - 1];
  const val      = last?.[idx]?.value;
  const tier     = last?.[idx]?.tier;
  const rawVal   = last?.[idx]?.raw;
  const forecast = data?.forecast?.[idx]?.[0];

  return (
    <button onClick={onClick}
      className={`text-left rounded-2xl p-4 border transition-all duration-200 w-full
        ${active
          ? 'border-2 shadow-lg scale-[1.02]'
          : 'border border-slate-700 bg-slate-900 hover:border-slate-500'}`}
      style={active ? {
        borderColor: meta.color,
        background:  meta.color + '18',
        boxShadow:   `0 0 20px ${meta.color}30`,
      } : {}}>

      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={18} style={{ color: meta.color }} />
          <div>
            <p className="font-bold text-white text-sm">{meta.label}</p>
            <p className="text-xs text-slate-500 leading-tight">{meta.full}</p>
          </div>
        </div>
        {tier && <TierBadge tier={tier} />}
      </div>

      <div className="flex items-end justify-between mt-3">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Current</p>
          <p className="text-2xl font-black" style={{ color: meta.color }}>
            {val != null ? val.toFixed(4) : '—'}
          </p>
          {/* Show raw Sentinel value when it differs from the clamped value */}
          {rawVal != null && rawVal !== val && (
            <p className="text-xs text-orange-400 font-mono mt-0.5 flex items-center gap-1">
              <AlertTriangle size={10} />
              raw: {rawVal.toFixed(4)}
            </p>
          )}
        </div>
        {forecast && (
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Next Qtr</p>
            <p className="text-lg font-bold text-slate-300">{forecast.value.toFixed(4)}</p>
            <TierBadge tier={forecast.tier} />
          </div>
        )}
      </div>
    </button>
  );
};

// ─────────────────────────────────────────────────────────────
// CHART DATA BUILDER
// ─────────────────────────────────────────────────────────────
function buildChartData(idx, history, forecast) {
  const meta      = META[idx];
  const histDates = history.map(h => h.date.substring(0, 7));
  const pad       = histDates.length;
  return {
    labels: [...histDates, ...forecast.map(f => f.quarter)],
    datasets: [
      {
        label: 'FC High',
        data: [...Array(pad).fill(null), ...forecast.map(f => f.upper_80)],
        borderColor: 'transparent', backgroundColor: meta.color + '25',
        fill: '+1', pointRadius: 0, tension: 0.4,
      },
      {
        label: 'FC Low',
        data: [...Array(pad).fill(null), ...forecast.map(f => f.lower_80)],
        borderColor: 'transparent', backgroundColor: meta.color + '25',
        fill: false, pointRadius: 0, tension: 0.4,
      },
      {
        label: `${meta.label} Historical`,
        data: history.map(h => h[idx]?.value ?? null),
        borderColor: meta.color, backgroundColor: meta.fill,
        fill: true, tension: 0.4, borderWidth: 2.5,
        pointRadius: 3, pointBackgroundColor: meta.color,
      },
      {
        label: `${meta.label} Forecast`,
        data: [...Array(pad).fill(null), ...forecast.map(f => f.value)],
        borderColor: meta.color, borderDash: [6, 3],
        backgroundColor: 'transparent', tension: 0.4,
        borderWidth: 2, pointRadius: 5,
        pointBackgroundColor: '#0f172a',
        pointBorderColor: meta.color, pointBorderWidth: 2,
      },
    ],
  };
}

const CHART_OPTIONS = {
  responsive: true, maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1,
      titleColor: '#94a3b8', bodyColor: '#e2e8f0',
      callbacks: {
        label: ctx => {
          if (ctx.dataset.label?.includes('High') || ctx.dataset.label?.includes('Low')) return null;
          return ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(4) ?? 'N/A'}`;
        },
      },
    },
  },
  scales: {
    x: { ticks: { color: '#64748b', font: { size: 10 }, maxRotation: 45 }, grid: { color: '#1e293b' } },
    y: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: '#1e293b' } },
  },
};

// ─────────────────────────────────────────────────────────────
// LTV PANEL
// ─────────────────────────────────────────────────────────────
const LTVPanel = ({ ltv, onUpdate, ltvLoading }) => {
  const [loanAmount,  setLoanAmount]  = useState('');
  const [yieldPerHa,  setYieldPerHa]  = useState('1.5');
  const [pricePerTon, setPricePerTon] = useState('500');

  // Track whether this is the initial mount to avoid calling onUpdate on load.
  // Without this guard, the debounce effect fires on mount → triggers handleLTVUpdate
  // → which was causing the infinite remount loop.
  const isFirstRender = useRef(true);

  const buildParams = () => ({
    ...(loanAmount.trim() !== '' && { loan_amount: parseFloat(loanAmount) }),
    yield_t_per_ha: parseFloat(yieldPerHa)  || 1.5,
    price_per_t:    parseFloat(pricePerTon) || 500,
  });

  const handleApply = () => onUpdate(buildParams());

  // Auto-recalculate when yield or price change, but skip the initial render.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const t = setTimeout(handleApply, 600);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yieldPerHa, pricePerTon]);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6">
      <h3 className="font-bold text-white text-base mb-1 flex items-center gap-2">
        <DollarSign size={16} className="text-emerald-400" />
        Financial Analysis (LTV)
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Area &amp; crop value are computed automatically from GPS polygon points.
        The <span className="text-slate-300 font-semibold">LTV Ratio</span> requires a loan amount.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-3">
        {[
          { label: 'Yield (t/ha)',               val: yieldPerHa,   set: setYieldPerHa,  ph: '1.5'      },
          { label: 'Price (USD/t)',               val: pricePerTon,  set: setPricePerTon, ph: '500'      },
          { label: 'Loan Amount (USD) — optional', val: loanAmount,   set: setLoanAmount,  ph: 'e.g. 5000' },
        ].map(({ label, val, set, ph }) => (
          <div key={label}>
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <input
              value={val}
              onChange={e => set(e.target.value)}
              placeholder={ph}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2
                         text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleApply}
        disabled={ltvLoading}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50
                   text-white text-sm font-semibold py-2 rounded-lg transition-colors mb-4
                   flex items-center justify-center gap-2">
        {ltvLoading
          ? <><Loader2 size={14} className="animate-spin" /> Calculating...</>
          : 'Recalculate LTV'}
      </button>

      {ltv ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Area',                val: `${ltv.area_ha} ha`,                              color: '#e2e8f0'                                              },
            { label: 'Adjusted Yield',      val: `${ltv.adjusted_yield_t_ha} t/ha`,                color: '#e2e8f0'                                              },
            { label: 'Estimated Crop Value',val: `$${ltv.estimated_crop_value_usd?.toLocaleString()}`, color: '#34d399'                                          },
            { label: 'NDVI Factor',         val: ltv.ndvi_factor,                                  color: '#e2e8f0'                                              },
            { label: 'Insurance Premium',   val: `${ltv.insurance_premium_pct}%`,
              color: ltv.insurance_premium_pct > 6 ? '#f97316' : '#16a34a'                                                                                       },
            { label: 'LTV Ratio',
              val:   ltv.ltv_ratio_pct != null ? `${ltv.ltv_ratio_pct}%` : '— (loan required)',
              color: ltv.ltv_ratio_pct == null  ? '#4b5563'
                   : ltv.ltv_ratio_pct > 80     ? '#f97316' : '#16a34a',
              Icon:  ltv.ltv_ratio_pct > 80 ? AlertTriangle : (ltv.ltv_ratio_pct != null ? Shield : null),
            },
          ].map(({ label, val, color, Icon: BI }) => (
            <div key={label} className="bg-slate-800 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                {BI && <BI size={11} style={{ color }} />}
                <p className="text-xs text-slate-500">{label}</p>
              </div>
              <p className="font-bold text-base" style={{ color }}>{val}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-start gap-3 bg-yellow-950/30 border border-yellow-700/40
                        rounded-xl px-4 py-3">
          <AlertTriangle size={15} className="text-yellow-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-yellow-400 text-sm font-semibold">No GPS polygon points</p>
            <p className="text-yellow-600 text-xs mt-0.5">
              Add polygon points in the map editor to enable automatic area calculation and LTV analysis.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────
export default function SentinelDashboard({ entityType = 'farm' }) {
  const params   = useParams();
  const location = useLocation();

  const rawId    = params.farmId || params.forestId
                 || location.state?.farmId || location.state?.forestId || null;
  const entityId = (rawId && rawId !== 'undefined' && rawId !== 'null')
                 ? String(rawId).trim() : null;
  const type     = entityType || (params.forestId ? 'forest' : 'farm');

  useEffect(() => {
    console.log('[Sentinel] entityId:', entityId, 'type:', type);
  }, []);

  // Main data state
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);   // full-page spinner (initial load only)
  const [error,     setError]     = useState(null);
  const [active,    setActive]    = useState('ndvi');
  const [exporting, setExporting] = useState(false);

  // LTV has its own loading state so it never triggers the full-page spinner.
  // Using a ref for ltvParams avoids creating a new fetchData reference on every
  // LTV update, which was the root cause of the infinite re-render loop.
  const [ltvLoading, setLtvLoading] = useState(false);
  const ltvParamsRef = useRef({});

  // ── fetchData ───────────────────────────────────────────────
  // Does NOT depend on ltvParams (uses the ref instead), so its reference
  // is stable and the useEffect below fires only once on mount.
  const fetchData = useCallback(async (extraParams = {}) => {
    if (!entityId) { setError('No entity ID'); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const url  = type === 'forest'
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
  }, [entityId, type]); // stable — no ltvParams dependency

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── handleLTVUpdate ─────────────────────────────────────────
  // Uses its own ltvLoading state — never shows the full-page Spinner,
  // so LTVPanel stays mounted and the debounce loop is broken.
  const handleLTVUpdate = useCallback((p) => {
    ltvParamsRef.current = p;
    const url = type === 'forest'
      ? `/api/sentinel/forest/${entityId}/sat-index`
      : `/api/sentinel/farm/${entityId}/sat-index`;
    setLtvLoading(true);
    axiosInstance.get(url, { params: p })
      .then(r  => setData(r.data))
      .catch(e => setError(e.response?.data?.error || 'LTV calculation failed'))
      .finally(() => setLtvLoading(false));
  }, [entityId, type]);

  // ── PDF export ──────────────────────────────────────────────
  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const resp = await axiosInstance.get(
        `/api/sentinel/farm/${entityId}/sat-index/pdf`,
        { params: ltvParamsRef.current, responseType: 'blob' },
      );
      const link = document.createElement('a');
      link.href  = window.URL.createObjectURL(new Blob([resp.data]));
      link.setAttribute('download', `sat_index_${entityId}.pdf`);
      document.body.appendChild(link); link.click(); link.remove();
    } catch {
      alert('PDF export failed');
    } finally {
      setExporting(false);
    }
  };

  // ── Render guards ───────────────────────────────────────────
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

  // ── Data ────────────────────────────────────────────────────
  const history  = data.history  || [];
  const forecast = data.forecast || {};
  const groups   = [
    { title: 'Vegetation',      Icon: Leaf,     keys: ['ndvi', 'evi', 'savi'] },
    { title: 'Water & Drought', Icon: Droplets, keys: ['ndmi', 'ndwi', 'nmdi'] },
    { title: 'Fire & Soil',     Icon: Flame,    keys: ['nbr',  'bsi']          },
  ];

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── Sticky header ── */}
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

      {/* ── Page body ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Out-of-bounds alert — only visible when Sentinel returned values outside [-1,1] */}
        <OutOfBoundsAlert items={data.out_of_bounds} />

        {/* ── Index cards grouped by category ── */}
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

        {/* ── Active index chart ── */}
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

        {/* ── Forecast table ── */}
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
                    <th key={idx} className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <m.Icon size={11} style={{ color: m.color }} /> {m.label}
                      </div>
                    </th>
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

        {/* ── Historical data table ── */}
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
                    <th key={idx} className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <m.Icon size={10} style={{ color: m.color }} /> {m.label}
                      </div>
                    </th>
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
                              {/* Show raw value in orange if it was clamped */}
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

        {/* ── LTV panel (farm only) ── */}
        {type === 'farm' && (
          <LTVPanel
            ltv={data.ltv}
            onUpdate={handleLTVUpdate}
            ltvLoading={ltvLoading}
          />
        )}

        <p className="text-center text-xs text-slate-600 pb-4">
          Sentinel-2 L2A · Statistical API · Max cloud cover 30% · Quarterly aggregation ·
          Forecast: Prophet ML · 80% confidence interval
        </p>
      </div>
    </div>
  );
}