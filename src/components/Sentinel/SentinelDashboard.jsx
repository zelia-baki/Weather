import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
import mapboxgl from "mapbox-gl";
import * as turf from "@turf/turf";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

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
  ndvi: { label: 'NDVI', full: 'Vegetation Health', Icon: Leaf, color: '#16a34a', fill: 'rgba(22,163,74,0.12)', group: 'vegetation' },
  evi: { label: 'EVI', full: 'Enhanced Vegetation', Icon: TrendingUp, color: '#0d9488', fill: 'rgba(13,148,136,0.12)', group: 'vegetation' },
  savi: { label: 'SAVI', full: 'Soil Adjusted Vegetation', Icon: Wheat, color: '#65a30d', fill: 'rgba(101,163,13,0.12)', group: 'vegetation' },
  ndmi: { label: 'NDMI', full: 'Moisture Index', Icon: Droplets, color: '#0284c7', fill: 'rgba(2,132,199,0.12)', group: 'water' },
  ndwi: { label: 'NDWI', full: 'Water Body Index', Icon: Waves, color: '#0ea5e9', fill: 'rgba(14,165,233,0.12)', group: 'water' },
  nmdi: { label: 'NMDI', full: 'Drought Index', Icon: Sun, color: '#f97316', fill: 'rgba(249,115,22,0.12)', group: 'drought' },
  nbr: { label: 'NBR', full: 'Burn Ratio', Icon: Flame, color: '#ef4444', fill: 'rgba(239,68,68,0.12)', group: 'fire' },
  bsi: { label: 'BSI', full: 'Bare Soil Index', Icon: Mountain, color: '#92400e', fill: 'rgba(146,64,14,0.12)', group: 'soil' },
};

// ─────────────────────────────────────────────────────────────
// SPINNER (full page — only used for the initial load)
// ─────────────────────────────────────────────────────────────
const Spinner = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 gap-4">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 border-4 border-t-emerald-900 rounded-full" />
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
  const meta = META[idx];
  const { Icon } = meta;
  const history = data?.history || [];
  const last = history[history.length - 1];
  const val = last?.[idx]?.value;
  const tier = last?.[idx]?.tier;
  const rawVal = last?.[idx]?.raw;
  const forecast = data?.forecast?.[idx]?.[0];

  return (
    <button onClick={onClick}
      className={`text-left rounded-2xl p-4 border transition-all duration-200 w-full
        ${active
          ? 'border-2 shadow-lg scale-[1.02]'
          : 'border border-slate-700 bg-slate-900 hover:border-slate-500'}`}
      style={active ? {
        borderColor: meta.color,
        background: meta.color + '18',
        boxShadow: `0 0 20px ${meta.color}30`,
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
// ── Year colours for the 5-annual-line overlay ───────────────────────────────
const YEAR_COLORS = [
  '#f59e0b', '#6366f1', '#10b981', '#f43f5e', '#38bdf8',
  '#a78bfa', '#fb923c', '#34d399', '#e879f9', '#fbbf24',
];

// buildAnnualSeries is handled inside YieldAnalysisPanel via useMemo (getYearQ helper)

function buildChartData(idx, history, forecast) {
  const meta = META[idx];
  const histDates = history.map(h => h.date.substring(0, 7));
  const pad = histDates.length;
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
        data: [...Array(pad).fill(null), ...forecast.map(f => f.forecast ?? f.value)],
        borderColor: meta.color, borderDash: [6, 3],
        backgroundColor: 'transparent', tension: 0.4,
        borderWidth: 2, pointRadius: 5,
        pointBackgroundColor: '#0f172a',
        pointBorderColor: meta.color, pointBorderWidth: 2,
      },
    ],
  };
}

// ── NDVI → Yield regression chart ─────────────────────────────────────────────
// reg = ltv.regression from backend
function buildRegressionChartData(reg, histYield1, histYield2) {
  if (!reg || !reg.ndvi_points?.length) return null;

  const xs = reg.ndvi_points;
  const ys = reg.yield_points;

  // Regression line: span from min to max NDVI
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const regLine = [
    { x: minX, y: reg.slope * minX + reg.intercept },
    { x: maxX, y: reg.slope * maxX + reg.intercept },
  ];

  const datasets = [
    // Historical NDVI/yield scatter (yellow)
    {
      label: 'Historical Yield',
      data: xs.map((x, i) => ({ x, y: ys[i] })),
      type: 'scatter',
      backgroundColor: '#eab308',
      borderColor: '#eab308',
      pointRadius: 5,
      pointHoverRadius: 7,
    },
    // Regression line
    {
      label: `Regression (R²=${reg.r2})`,
      data: regLine,
      type: 'line',
      borderColor: '#6366f1',
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderDash: [5, 3],
      pointRadius: 0,
      tension: 0,
    },
  ];

  // Analyst calibration points (HY1 / HY2) if present
  const anchorPoints = [];
  if (histYield1 != null) anchorPoints.push({ x: xs[Math.max(0, xs.length - 8)], y: histYield1, label: 'HY1' });
  if (histYield2 != null) anchorPoints.push({ x: xs[Math.max(0, xs.length - 4)], y: histYield2, label: 'HY2' });
  if (anchorPoints.length) {
    datasets.push({
      label: 'Analyst Calibration',
      data: anchorPoints.map(p => ({ x: p.x, y: p.y })),
      type: 'scatter',
      backgroundColor: '#f43f5e',
      borderColor: '#f43f5e',
      pointRadius: 8,
      pointStyle: 'triangle',
    });
  }

  // Predicted yield point
  if (reg.predicted_yield != null) {
    const predX = xs[xs.length - 1]; // most recent NDVI
    datasets.push({
      label: `Predicted: ${reg.predicted_yield} t/ha`,
      data: [{ x: predX, y: reg.predicted_yield }],
      type: 'scatter',
      backgroundColor: '#eab308',
      borderColor: '#fff',
      pointRadius: 9,
      pointStyle: 'star',
      borderWidth: 2,
    });
  }

  return { datasets };
}

const REGRESSION_CHART_OPTIONS = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true, position: 'top',
      labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 16, padding: 12 },
    },
    tooltip: {
      backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1,
      titleColor: '#94a3b8', bodyColor: '#e2e8f0',
      callbacks: {
        label: ctx => ` ${ctx.dataset.label}: (NDVI ${ctx.parsed.x?.toFixed(4)}, Yield ${ctx.parsed.y?.toFixed(3)} t/ha)`,
      },
    },
  },
  scales: {
    x: {
      type: 'linear',
      ticks: { color: '#64748b', font: { size: 10 } },
      grid: { color: '#1e293b' },
      title: { display: true, text: 'NDVI', color: '#64748b', font: { size: 12 } },
    },
    y: {
      ticks: { color: '#64748b', font: { size: 10 } },
      grid: { color: '#1e293b' },
      title: { display: true, text: 'Yield (t/ha)', color: '#eab308', font: { size: 12 } },
    },
  },
};

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
// FULLY DYNAMIC LTVPANEL COMPONENT (MULTI-INDEX)
// ─────────────────────────────────────────────────────────────
const LTVPanel = ({ ltv, onUpdate, ltvLoading, activeIndex = "ndvi" }) => {
  const [loan, setLoan] = useState(ltv?.loan_amount_usd || "");
  const [yieldH, setYieldH] = useState(ltv?.yield_t_per_ha || "1.5");
  const [price, setPrice] = useState(ltv?.price_per_t || "500");

  useEffect(() => {
    if (ltv) {
      if (ltv.loan_amount_usd != null) setLoan(ltv.loan_amount_usd);
      if (ltv.yield_t_per_ha != null) setYieldH(ltv.yield_t_per_ha);
      if (ltv.price_per_t != null) setPrice(ltv.price_per_t);
    }
  }, [ltv]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({
      loan_amount: loan ? parseFloat(loan) : null,
      yield_t_per_ha: yieldH ? parseFloat(yieldH) : 1.5,
      price_per_t: price ? parseFloat(price) : 500,
    });
  };

  // Dynamic extraction of index data calculated by sentinel_utils.py
  const currentIndexData = ltv?.indices?.[activeIndex];

  // Fallbacks if the index does not exist yet or if using global NDVI keys
  const factorValue = currentIndexData ? currentIndexData.factor : ltv?.ndvi_factor;
  const adjYield = currentIndexData ? currentIndexData.adjusted_yield_t_ha : ltv?.adjusted_yield_t_ha;
  const cropValue = currentIndexData ? currentIndexData.estimated_crop_value_usd : ltv?.estimated_crop_value_usd;
  const ltvRatio = currentIndexData ? currentIndexData.ltv_ratio_pct : ltv?.ltv_ratio_pct;
  const premium = currentIndexData ? currentIndexData.insurance_premium_pct : ltv?.insurance_premium_pct;
  const idxColor = currentIndexData ? currentIndexData.color : "#10b981";

  // Extraction of the farm area
  const areaHa = ltv?.area_ha;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-xl">
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-800 pb-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <DollarSign className="text-emerald-500" size={20} />
            Financial Analysis &amp; Agricultural Viability (LTV)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Calculations synchronized with the currently active index: <span className="font-bold uppercase" style={{ color: idxColor }}>{activeIndex}</span>
          </p>
        </div>

        {ltv?.composite && (
          <div className="rounded-lg bg-emerald-950/40 border border-emerald-500/30 p-2.5 px-4 text-right">
            <span className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase block">🧮 Global Composite Summary</span>
            <span className="text-sm font-bold text-emerald-200">
              LTV: {ltv.composite.ltv_ratio_pct}% <span className="text-slate-500 font-normal">|</span> Premium: {ltv.composite.insurance_premium_pct}%
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        {/* Base financial params */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Loan Amount (USD)</label>
            <input
              type="number" value={loan} onChange={(e) => setLoan(e.target.value)}
              placeholder="E.g., 5000"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Yield (t/ha)</label>
            <input
              type="number" step="0.1" value={yieldH} onChange={(e) => setYieldH(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Market Price ($/t)</label>
            <input
              type="number" value={price} onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <button
            type="submit" disabled={ltvLoading}
            className="flex h-9 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
          >
            {ltvLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Recalculate
          </button>
        </div>
      </form>

      {/* Grid passed to sm:grid-cols-6 to host the 6 metrics cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-6">
        <div className="rounded-xl border border-slate-900 bg-slate-900/50 p-4">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Farm Area
          </span>
          <p className="text-xl font-bold text-slate-200">
            {areaHa != null ? `${areaHa.toFixed(2)} ha` : "—"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-900 bg-slate-900/50 p-4">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Prod. Factor ({activeIndex.toUpperCase()})
          </span>
          <p className="text-xl font-bold text-slate-200">{factorValue?.toFixed(4) || "—"}</p>
        </div>

        <div className="rounded-xl border border-slate-900 bg-slate-900/50 p-4">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Adjusted Yield
          </span>
          <p className="text-xl font-bold text-emerald-400">{adjYield?.toFixed(2) || "—"} t/ha</p>
        </div>

        <div className="rounded-xl border border-slate-900 bg-slate-900/50 p-4">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Est. Crop Value
          </span>
          <p className="text-xl font-bold text-amber-500">${cropValue?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || "—"}</p>
        </div>

        <div className="rounded-xl border border-slate-900 bg-slate-900/50 p-4" style={{ borderColor: `${idxColor}33` }}>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Loan-to-Value Ratio
          </span>
          <p className="text-xl font-bold" style={{ color: idxColor }}>{ltvRatio != null ? `${ltvRatio}%` : "—"}</p>
        </div>

        <div className="rounded-xl border border-slate-900 bg-slate-900/50 p-4">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Insurance Premium
          </span>
          <p className="text-xl font-bold text-cyan-400">{premium?.toFixed(2) || "—"} %</p>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// VALUE → COLOR SCALE (red → yellow → green), per index group
// ─────────────────────────────────────────────────────────────
// Bounds are rough physical ranges per index family; tune if your
// backend tiers (data.tiers_meta) already define better thresholds.
const INDEX_RANGE = {
  ndvi: [-0.2, 0.9], evi: [-0.2, 0.8], savi: [-0.2, 0.8],
  ndmi: [-0.5, 0.6], ndwi: [-0.5, 0.5], nmdi: [0, 1.2],
  nbr: [-0.5, 0.8], bsi: [-0.5, 0.5],
};

function lerpColor(c1, c2, t) {
  const a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${[r, g, bl].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

function valueToColor(value, idx) {
  if (value == null || isNaN(value)) return '#475569'; // slate-600 fallback
  const [min, max] = INDEX_RANGE[idx] || [-1, 1];
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  if (t < 0.5) return lerpColor('#dc2626', '#eab308', t / 0.5);       // red -> yellow
  return lerpColor('#eab308', '#16a34a', (t - 0.5) / 0.5);            // yellow -> green
}

// ─────────────────────────────────────────────────────────────────────────────
// MINI YEAR MAP
// One small Mapbox instance showing the same farm boundary polygon, colored
// according to the active index's value for that year.
// ─────────────────────────────────────────────────────────────────────────────
const MiniYearMap = ({ year, color, polygon, center, bounds, label }) => {
  const containerRef = useRef();
  const mapRef = useRef();
  const fillLayerAdded = useRef(false);

  // Init map once
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

  // Re-color on index/value change without rebuilding the map
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
        <span className="text-xs font-mono font-semibold" style={{ color }}>
          {label}
        </span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// YEARLY POLYGON MAP GRID
// Same farm boundary, one mini-map per year, colored by the active index's
// annual average. Re-colors instantly when `activeIndex` changes.
// ─────────────────────────────────────────────────────────────────────────────
const YearlyPolygonMapGrid = ({ entityId, history, activeIndex }) => {
  const [polygon, setPolygon] = useState(null);
  const [center, setCenter] = useState(null);
  const [bounds, setBounds] = useState(null);
  const [pointsError, setPointsError] = useState(null);
  const [pointsLoading, setPointsLoading] = useState(true);

  // Fetch the farm boundary points once (same logic as MapView.jsx)
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

  // Annual average of the active index, per year
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
};

// ─────────────────────────────────────────────────────────────────────────────
// YIELD ANALYSIS & ML CALIBRATION PANEL  (standalone — full width)
// ─────────────────────────────────────────────────────────────────────────────
const YieldAnalysisPanel = ({ history, forecast, ltv, activeIndex, onCalibrate }) => {
  // Dynamic years from history + forecast (e.g. 2020→2026)
  const allYears = useMemo(() => {
    const set = new Set();
    // history: date = "2020-01-01"
    history.forEach(r => set.add(r.date.substring(0, 4)));
    // forecast: quarter = "2025-Q2"
    Object.values(forecast).forEach(arr =>
      arr.forEach(f => set.add(f.quarter.substring(0, 4)))
    );
    return [...set].sort();
  }, [history, forecast]);

  // Derive the 2 most-recent full years for HY label hints
  const recentYears = allYears.slice(-2); // [N-2, N-1] from end — actually last 2

  const [hy1, setHy1] = useState(ltv?.hist_yield_1 != null ? String(ltv.hist_yield_1) : "");
  const [hy2, setHy2] = useState(ltv?.hist_yield_2 != null ? String(ltv.hist_yield_2) : "");

  // Keep in sync if ltv prop updates
  useEffect(() => {
    if (ltv?.hist_yield_1 != null) setHy1(String(ltv.hist_yield_1));
    if (ltv?.hist_yield_2 != null) setHy2(String(ltv.hist_yield_2));
  }, [ltv]);

  // Build annual series dynamically from ALL years present in data
  const annualChartData = useMemo(() => {
    // history rows: date = "2020-01-01" (ISO, interval.from[:10])
    // forecast rows: quarter = "2025-Q2"
    // We need: year (string) + qIndex (0-3)

    const getYearQ = (dateStr) => {
      // ISO date "2020-01-01" → year="2020", qIndex=0
      const [y, m] = dateStr.split('-');
      return { year: y, qIndex: Math.floor((parseInt(m, 10) - 1) / 3) };
    };

    const getForecastYearQ = (quarterStr) => {
      // "2025-Q2" → year="2025", qIndex=1
      const [y, q] = quarterStr.split('-Q');
      return { year: y, qIndex: parseInt(q, 10) - 1 };
    };

    // Combine history + forecast
    const byYear = {};

    history.forEach(r => {
      const val = r[activeIndex]?.value ?? null;
      if (val === null) return;
      const { year, qIndex } = getYearQ(r.date);
      if (!byYear[year]) byYear[year] = [null, null, null, null];
      byYear[year][qIndex] = val;
    });

    // Add forecast quarters too (so 2025/2026 appear)
    const fcArr = forecast[activeIndex] || [];
    fcArr.forEach(f => {
      const val = f.value ?? f.forecast ?? null;
      if (val === null) return;
      const { year, qIndex } = getForecastYearQ(f.quarter);
      if (!byYear[year]) byYear[year] = [null, null, null, null];
      // Only fill if not already from history
      if (byYear[year][qIndex] === null) byYear[year][qIndex] = val;
    });

    const years = Object.keys(byYear).sort();

    return {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: years.map((year, i) => ({
        label: year,
        data: byYear[year],
        borderColor: YEAR_COLORS[i % YEAR_COLORS.length],
        backgroundColor: 'transparent',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: YEAR_COLORS[i % YEAR_COLORS.length],
        fill: false,
        spanGaps: true,
      })),
    };
  }, [history, forecast, activeIndex]);

  const annualOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { size: 11 },
          boxWidth: 16,
          padding: 12,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        titleColor: '#94a3b8',
        bodyColor: '#e2e8f0',
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(4) ?? 'N/A'}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748b', font: { size: 12 } },
        grid: { color: '#1e293b' },
      },
      y: {
        ticks: { color: '#64748b', font: { size: 11 } },
        grid: { color: '#1e293b' },
        title: {
          display: true,
          text: (META[activeIndex]?.label || activeIndex.toUpperCase()) + ' Value',
          color: META[activeIndex]?.color || '#10b981',
          font: { size: 12 },
        },
      },
    },
  }), [activeIndex]);

  // Regression chart data
  const { regChartData, reg } = useMemo(() => {
    // Pick regression for the currently active index (dynamic)
    const reg = ltv?.regression?.[activeIndex];
    if (!reg?.ndvi_points?.length) return { regChartData: null, reg: null };

    const xs = reg.ndvi_points;
    const ys = reg.yield_points;
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const slope = reg.slope;
    const intercept = reg.intercept;

    const datasets = [
      // Yellow scatter — historical NDVI vs model yield
      {
        label: `Historical ${activeIndex.toUpperCase()} → Est. Yield`,
        data: xs.map((x, i) => ({ x, y: ys[i] })),
        type: 'scatter',
        backgroundColor: '#eab308',
        borderColor: '#eab308',
        pointRadius: 6,
        pointHoverRadius: 8,
      },
      // Regression line
      {
        label: `Regression (R²=${reg.r2})`,
        data: [
          { x: minX, y: slope * minX + intercept },
          { x: maxX, y: slope * maxX + intercept },
        ],
        type: 'line',
        borderColor: '#6366f1',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [6, 3],
        pointRadius: 0,
        tension: 0,
      },
    ];

    // Analyst calibration anchors (red triangles)
    const anchors = [];
    const n = xs.length;
    if (hy1 !== "" && !isNaN(parseFloat(hy1))) {
      anchors.push({ x: xs[Math.max(0, n - 9)], y: parseFloat(hy1) });
    }
    if (hy2 !== "" && !isNaN(parseFloat(hy2))) {
      anchors.push({ x: xs[Math.max(0, n - 5)], y: parseFloat(hy2) });
    }
    if (anchors.length) {
      datasets.push({
        label: 'Analyst Calibration',
        data: anchors,
        type: 'scatter',
        backgroundColor: '#f43f5e',
        borderColor: '#f43f5e',
        pointRadius: 9,
        pointStyle: 'triangle',
        pointHoverRadius: 11,
      });
    }

    // Predicted yield star
    if (reg.predicted_yield != null) {
      const predX = xs[xs.length - 1];
      datasets.push({
        label: `Predicted: ${reg.predicted_yield} t/ha`,
        data: [{ x: predX, y: reg.predicted_yield }],
        type: 'scatter',
        backgroundColor: '#eab308',
        borderColor: '#ffffff',
        pointRadius: 10,
        pointStyle: 'star',
        borderWidth: 2,
        pointHoverRadius: 13,
      });
    }

    return { regChartData: { datasets }, reg };
  }, [ltv, hy1, hy2]);

  const regOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'nearest', intersect: true },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { size: 11 },
          boxWidth: 16,
          padding: 12,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        titleColor: '#94a3b8',
        bodyColor: '#e2e8f0',
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: NDVI ${ctx.parsed.x?.toFixed(4)}, Yield ${ctx.parsed.y?.toFixed(3)} t/ha`,
        },
      },
    },
    scales: {
      x: {
        type: 'linear',
        ticks: { color: '#64748b', font: { size: 11 } },
        grid: { color: '#1e293b' },
        title: { display: true, text: activeIndex.toUpperCase(), color: '#64748b', font: { size: 13, weight: 'bold' } },

      },
      y: {
        ticks: { color: '#64748b', font: { size: 11 } },
        grid: { color: '#1e293b' },
        title: { display: true, text: 'Yield (t/ha)', color: '#eab308', font: { size: 13, weight: 'bold' } },
      },
    },
  };

  const handleApply = () => {
    onCalibrate({
      hist_yield_1: hy1 !== "" && !isNaN(parseFloat(hy1)) ? parseFloat(hy1) : null,
      hist_yield_2: hy2 !== "" && !isNaN(parseFloat(hy2)) ? parseFloat(hy2) : null,
    });
  };

  const idxMeta = META[activeIndex] || {};
  const hy1Year = recentYears[recentYears.length - 2] || 'N-2';
  const hy2Year = recentYears[recentYears.length - 1] || 'N-1';

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-800 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <span className="text-emerald-400">🌾</span>
            Yield Analysis & ML Calibration
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Compare seasonal {idxMeta.label || activeIndex.toUpperCase()} patterns year over year,
            and calibrate a yield-prediction model with two real historical yields.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="w-3 h-3 rounded-full inline-block" style={{ background: idxMeta.color || '#10b981' }} />
          Active index: <span className="text-white font-semibold">{idxMeta.label || activeIndex.toUpperCase()}</span>
        </div>
      </div>

      <div className="p-6 space-y-8">

        {/* ── Chart 1 : Annual seasonal pattern ──────────────────────────────── */}
        <div>
          <div className="mb-3">
            <h4 className="font-semibold text-white text-sm flex items-center gap-2">
              <span style={{ color: idxMeta.color || '#10b981' }}>📈</span>
              {idxMeta.label || activeIndex.toUpperCase()} Seasonal Pattern — Year over Year
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Each line is one year (Q1 → Q4). Use this to spot anomalous seasons
              (e.g. a drop in a given quarter) before they affect yield.
            </p>
          </div>
          <div className="h-80">
            <Line data={annualChartData} options={annualOptions} />
          </div>
        </div>

        {/* ── Historical Yield inputs ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-yellow-500/25 bg-yellow-950/15 p-5">
            <label className="block text-xs font-bold text-yellow-400 uppercase tracking-wider mb-1">
              Historical Yield 1 (t/ha) — {hy1Year}
            </label>
            <input
              type="number"
              step="0.01"
              value={hy1}
              onChange={e => setHy1(e.target.value)}
              placeholder="E.g., 1.8"
              className="w-full rounded-lg border border-yellow-500/20 bg-yellow-950/20 px-3 py-2.5
                         text-sm text-yellow-100 placeholder-yellow-800/60
                         focus:border-yellow-400 focus:outline-none mt-1"
            />
            <p className="text-xs text-slate-500 mt-2">
              Real yield reported for year {hy1Year} — used to calibrate the model to local conditions.
            </p>
          </div>
          <div className="rounded-xl border border-yellow-500/25 bg-yellow-950/15 p-5">
            <label className="block text-xs font-bold text-yellow-400 uppercase tracking-wider mb-1">
              Historical Yield 2 (t/ha) — {hy2Year}
            </label>
            <input
              type="number"
              step="0.01"
              value={hy2}
              onChange={e => setHy2(e.target.value)}
              placeholder="E.g., 1.8"
              className="w-full rounded-lg border border-yellow-500/20 bg-yellow-950/20 px-3 py-2.5
                         text-sm text-yellow-100 placeholder-yellow-800/60
                         focus:border-yellow-400 focus:outline-none mt-1"
            />
            <p className="text-xs text-slate-500 mt-2">
              Real yield reported for year {hy2Year} — used to calibrate the model to local conditions.
            </p>
          </div>
        </div>

        {/* Apply calibration button */}
        {(hy1 !== "" || hy2 !== "") && (
          <div className="flex justify-end">
            <button
              onClick={handleApply}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black
                         font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              ⚡ Apply Calibration & Recalculate
            </button>
          </div>
        )}

        {/* ── Chart 2 : NDVI vs Yield regression ─────────────────────────────── */}
        {regChartData && reg && (
          <div>
            <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                  <span className="text-yellow-400">📊</span>
                  📊 {activeIndex.toUpperCase()} vs Yield — Regression Model
                  {reg.calibrated && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20
                                     text-yellow-400 border border-yellow-500/30 font-bold">
                      ⚡ Calibrated
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Green dots: estimated yield from each historical {activeIndex.toUpperCase()} reading using the LTV production factor.
                  Yellow stars: your manually entered historical yields (used to calibrate the regression).
                  Dashed line: calibrated regression. Pink triangle: predicted yield at the current {activeIndex.toUpperCase()}.
                </p>
              </div>
              {reg.predicted_yield != null && (
                <div className="rounded-xl bg-yellow-950/40 border border-yellow-500/30 px-5 py-3 text-center shrink-0">
                  <span className="text-[10px] text-yellow-400 font-bold tracking-widest uppercase block mb-0.5">
                    Predicted Yield
                  </span>
                  <span className="text-2xl font-black text-yellow-400">{reg.predicted_yield} t/ha</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">R² = {reg.r2}</span>
                </div>
              )}
            </div>
            <div className="h-80">
              <Line data={regChartData} options={regOptions} />
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
              <span>slope: <span className="text-slate-300 font-mono font-semibold">{reg.slope}</span></span>
              <span>intercept: <span className="text-slate-300 font-mono font-semibold">{reg.intercept}</span></span>
              <span>R²: <span className="text-slate-300 font-mono font-semibold">{reg.r2}</span></span>
              {reg.calibrated && (
                <span className="text-yellow-500 font-semibold">⚡ Anchored to analyst yield observations</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
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
  const [active, setActive] = useState('ndvi'); // serves as activeIndex
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
    // Build API params — only include hist_yield if analyst filled them in
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

        {/* ── LTV panel (farm only) ── */}
        {type === 'farm' && (
          <LTVPanel
            ltv={data.ltv}
            onUpdate={handleLTVUpdate}
            ltvLoading={ltvLoading}
            activeIndex={active}
          />
        )}

        {/* ── Yield Analysis & ML Calibration (farm only, full width) ── */}
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

        {/* ── Farm boundary colored by year (farm only) ── */}
        {type === 'farm' && (
          <YearlyPolygonMapGrid
            entityId={entityId}
            history={history}
            activeIndex={active}
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