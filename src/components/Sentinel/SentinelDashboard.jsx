import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import axiosInstance from "../../axiosInstance";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Filler, Tooltip, Legend,
} from "chart.js";
import { Line, Scatter } from "react-chartjs-2";
import {
  Leaf, TrendingUp, Wheat, Droplets, Waves, Sun,
  Flame, Mountain, Satellite, RefreshCw, Zap,
  Download, Activity, BarChart2, DollarSign,
  AlertTriangle, Shield, Database, Loader2, Sprout,
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Filler, Tooltip, Legend);

// ─────────────────────────────────────────────────────────────
// YEAR-OVER-YEAR PALETTE (for the 5-year NDVI seasonal overlay)
// ─────────────────────────────────────────────────────────────
const YEAR_COLORS = {
  2020: '#64748b', // slate
  2021: '#ef4444', // red
  2022: '#f97316', // orange
  2023: '#0ea5e9', // sky
  2024: '#22c55e', // green
  2025: '#a855f7', // purple (in case partial year present)
};

// ─────────────────────────────────────────────────────────────
// SIMPLE LINEAR REGRESSION (least squares) with optional
// calibration points that are added with extra weight so the
// line is pulled toward locally-observed ground truth.
// ─────────────────────────────────────────────────────────────
function linearRegression(points) {
  // points: [{x, y, weight}]
  let sumW = 0, sumWX = 0, sumWY = 0, sumWXY = 0, sumWXX = 0;
  for (const p of points) {
    const w = p.weight ?? 1;
    sumW += w;
    sumWX += w * p.x;
    sumWY += w * p.y;
    sumWXY += w * p.x * p.y;
    sumWXX += w * p.x * p.x;
  }
  const denom = (sumW * sumWXX) - (sumWX * sumWX);
  if (Math.abs(denom) < 1e-9) {
    // fallback: flat line at mean y
    const meanY = sumW > 0 ? sumWY / sumW : 0;
    return { slope: 0, intercept: meanY };
  }
  const slope = ((sumW * sumWXY) - (sumWX * sumWY)) / denom;
  const intercept = (sumWY - slope * sumWX) / sumW;
  return { slope, intercept };
}

// ─────────────────────────────────────────────────────────────
// Build {year -> {Q1..Q4: ndviValue}} from history rows
// ─────────────────────────────────────────────────────────────
function buildYearlyNdvi(history) {
  const byYear = {};
  for (const row of history) {
    const d = row.date;
    if (!d) continue;
    const year = parseInt(d.substring(0, 4), 10);
    const month = parseInt(d.substring(5, 7), 10);
    const q = Math.ceil(month / 3);
    const val = row.ndvi?.value ?? row.ndvi ?? null;
    if (val == null) continue;
    if (!byYear[year]) byYear[year] = {};
    byYear[year][`Q${q}`] = val;
  }
  return byYear;
}

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
// CHART: NDVI seasonal pattern, one line per year (Q1-Q4)
// ─────────────────────────────────────────────────────────────
function buildYearlySeasonalChart(history) {
  const byYear = buildYearlyNdvi(history);
  const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  const datasets = years.map(year => ({
    label: String(year),
    data: quarters.map(q => byYear[year][q] ?? null),
    borderColor: YEAR_COLORS[year] || '#94a3b8',
    backgroundColor: 'transparent',
    borderWidth: 2.5,
    tension: 0.35,
    spanGaps: true,
    pointRadius: 3,
    pointBackgroundColor: YEAR_COLORS[year] || '#94a3b8',
  }));

  return { labels: quarters, datasets };
}

const SEASONAL_CHART_OPTIONS = {
  responsive: true, maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      display: true, position: 'top', align: 'end',
      labels: { color: '#94a3b8', boxWidth: 12, font: { size: 11 } },
    },
    tooltip: {
      backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1,
      titleColor: '#94a3b8', bodyColor: '#e2e8f0',
      callbacks: {
        label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(4) ?? 'N/A'}`,
      },
    },
  },
  scales: {
    x: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: '#1e293b' } },
    y: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: '#1e293b' }, min: 0, max: 1 },
  },
};

// ─────────────────────────────────────────────────────────────
// CHART: NDVI (X) vs Yield (Y) scatter + regression line
//
// Each historical NDVI point is converted to a "base yield"
// estimate using the LTV production-factor formula
// (factor scaled by yield_t_per_ha). The two manually entered
// historical yields (HY1/HY2) are treated as ground-truth
// calibration points — they get a much higher regression weight
// so the fitted line is pulled toward locally observed reality.
// ─────────────────────────────────────────────────────────────
function buildNdviYieldChart(history, yieldTPerHa, hy1, hy2, currentNdvi) {
  // NDVI -> base-factor approximation mirroring _compute_index_factor
  // for ndvi: optimal=0.70, range_lo=0, invert=false
  const ndviToFactor = (v) => {
    const raw = v / 0.70;
    return Math.max(0.30, Math.min(1.0, raw));
  };

  // Historical scatter points: x = NDVI, y = base estimated yield (t/ha)
  const histPoints = [];
  for (const row of history) {
    const val = row.ndvi?.value ?? row.ndvi ?? null;
    if (val == null) continue;
    const factor = ndviToFactor(val);
    histPoints.push({ x: val, y: +(yieldTPerHa * factor).toFixed(3) });
  }

  // Regression points start as the base estimates (weight 1)
  const regressionInputs = histPoints.map(p => ({ ...p, weight: 1 }));

  // Calibration points (HY1 / HY2) — yearly mean NDVI vs real yield,
  // weighted heavily so the line snaps toward ground truth.
  const byYear = buildYearlyNdvi(history);
  const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);
  const calibrationPoints = [];

  const meanNdviForYear = (year) => {
    const q = byYear[year];
    if (!q) return null;
    const vals = Object.values(q).filter(v => v != null);
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  // HY1 -> second-to-last year with data, HY2 -> last year with data
  const calibYears = years.slice(-2);
  const calibValues = [hy1, hy2];
  calibYears.forEach((year, i) => {
    const ndviMean = meanNdviForYear(year);
    const y = calibValues[i];
    if (ndviMean != null && y != null && !isNaN(y) && y > 0) {
      const pt = { x: +ndviMean.toFixed(4), y: parseFloat(y), weight: 25, year };
      calibrationPoints.push(pt);
      regressionInputs.push(pt);
    }
  });

  const { slope, intercept } = linearRegression(
    regressionInputs.length ? regressionInputs : [{ x: 0.5, y: yieldTPerHa, weight: 1 }]
  );

  // Regression line across NDVI range
  const xs = histPoints.map(p => p.x);
  const xMin = xs.length ? Math.min(...xs, ...calibrationPoints.map(p => p.x)) : 0;
  const xMax = xs.length ? Math.max(...xs, ...calibrationPoints.map(p => p.x)) : 1;
  const lo = Math.max(0, xMin - 0.05);
  const hi = Math.min(1, xMax + 0.05);
  const lineData = [
    { x: lo, y: Math.max(0, slope * lo + intercept) },
    { x: hi, y: Math.max(0, slope * hi + intercept) },
  ];

  // Prediction for the current NDVI value
  let prediction = null;
  if (currentNdvi != null) {
    prediction = Math.max(0, slope * currentNdvi + intercept);
  }

  const datasets = [
    {
      label: 'Historical NDVI → Est. Yield',
      data: histPoints,
      type: 'scatter',
      backgroundColor: 'rgba(34,197,94,0.55)',
      borderColor: '#22c55e',
      pointRadius: 4,
      showLine: false,
    },
    {
      label: 'Regression (calibrated)',
      data: lineData,
      type: 'line',
      borderColor: '#38bdf8',
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderDash: [4, 4],
      pointRadius: 0,
      tension: 0,
      fill: false,
    },
  ];

  if (calibrationPoints.length) {
    datasets.push({
      label: 'Historical Yield (analyst input)',
      data: calibrationPoints,
      type: 'scatter',
      backgroundColor: '#eab308',
      borderColor: '#fde047',
      pointRadius: 7,
      pointStyle: 'star',
      showLine: false,
    });
  }

  if (prediction != null && currentNdvi != null) {
    datasets.push({
      label: 'Predicted Yield (current NDVI)',
      data: [{ x: currentNdvi, y: prediction }],
      type: 'scatter',
      backgroundColor: '#f472b6',
      borderColor: '#fbcfe8',
      pointRadius: 8,
      pointStyle: 'triangle',
      showLine: false,
    });
  }

  return {
    chartData: { datasets },
    slope, intercept, prediction,
    calibrationPoints,
  };
}

const NDVI_YIELD_CHART_OPTIONS = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true, position: 'top', align: 'end',
      labels: { color: '#94a3b8', boxWidth: 10, font: { size: 10 } },
    },
    tooltip: {
      backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1,
      titleColor: '#94a3b8', bodyColor: '#e2e8f0',
      callbacks: {
        label: ctx => ` ${ctx.dataset.label}: NDVI ${ctx.parsed.x?.toFixed(3)} → ${ctx.parsed.y?.toFixed(2)} t/ha`,
      },
    },
  },
  scales: {
    x: {
      type: 'linear', min: 0, max: 1,
      title: { display: true, text: 'NDVI', color: '#64748b', font: { size: 11 } },
      ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: '#1e293b' },
    },
    y: {
      title: { display: true, text: 'Yield (t/ha)', color: '#64748b', font: { size: 11 } },
      ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: '#1e293b' },
      beginAtZero: true,
    },
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

      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Loan Amount (USD)</label>
          <input
            type="number"
            value={loan}
            onChange={(e) => setLoan(e.target.value)}
            placeholder="E.g., 5000"
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Yield (t/ha)</label>
          <input
            type="number"
            step="0.1"
            value={yieldH}
            onChange={(e) => setYieldH(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Market Price ($/t)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={ltvLoading}
          className="flex h-9 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
        >
          {ltvLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Recalculate
        </button>
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
// YIELD ANALYSIS PANEL
//   - 5-year seasonal NDVI overlay (one line per year, Q1-Q4)
//   - NDVI vs Yield scatter + calibrated linear regression
//   - 2 manual "Historical Yield" inputs (shown in yellow) used
//     as ground-truth calibration points for the regression
// ─────────────────────────────────────────────────────────────
const YieldAnalysisPanel = ({ history, ltv, currentNdvi }) => {
  const [hy1, setHy1] = useState("");
  const [hy2, setHy2] = useState("");

  const yieldTPerHa = ltv?.yield_t_per_ha ?? 1.5;

  const seasonalChart = buildYearlySeasonalChart(history);

  const hy1Num = hy1 === "" ? null : parseFloat(hy1);
  const hy2Num = hy2 === "" ? null : parseFloat(hy2);

  const { chartData, slope, intercept, prediction, calibrationPoints } =
    buildNdviYieldChart(history, yieldTPerHa, hy1Num, hy2Num, currentNdvi);

  const byYear = buildYearlyNdvi(history);
  const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);
  const calibYears = years.slice(-2);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-xl space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Sprout className="text-emerald-500" size={20} />
          Yield Analysis &amp; ML Calibration
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Compare seasonal NDVI patterns year over year, and calibrate a yield-prediction
          model with two real historical yields.
        </p>
      </div>

      {/* ── 5-year seasonal NDVI overlay ───────────────────────── */}
      <div>
        <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
          <Leaf size={14} className="text-emerald-400" />
          NDVI Seasonal Pattern — Year over Year
        </h4>
        <p className="text-xs text-slate-500 mb-3">
          Each line is one year (Q1 → Q4). Use this to spot anomalous seasons
          (e.g. a drop in a given quarter) before they affect yield.
        </p>
        <div className="h-64">
          <Line data={seasonalChart} options={SEASONAL_CHART_OPTIONS} />
        </div>
      </div>

      {/* ── Historical yield inputs ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[0, 1].map(i => {
          const val = i === 0 ? hy1 : hy2;
          const setVal = i === 0 ? setHy1 : setHy2;
          const year = calibYears[i];
          return (
            <div key={i} className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
              <label className="block text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-2">
                Historical Yield {i + 1} (t/ha){year ? ` — ${year}` : ''}
              </label>
              <input
                type="number"
                step="0.01"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                placeholder="E.g., 1.8"
                className="w-full rounded-lg border border-yellow-500/30 bg-slate-900 px-3 py-2 text-sm
                           text-yellow-300 font-bold focus:border-yellow-400 focus:outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Real yield reported for {year ? `year ${year}` : 'a recent year'} — used to
                calibrate the model to local conditions.
              </p>
            </div>
          );
        })}
      </div>

      {/* ── NDVI vs Yield scatter + regression ─────────────────── */}
      <div>
        <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
          <TrendingUp size={14} className="text-sky-400" />
          NDVI vs Yield — Regression Model
        </h4>
        <p className="text-xs text-slate-500 mb-3">
          Green dots: estimated yield from each historical NDVI reading using the LTV
          production factor. Yellow stars: your manually entered historical yields
          (used to calibrate the regression). Dashed line: calibrated regression.
          Pink triangle: predicted yield at the current NDVI.
        </p>
        <div className="h-72">
          <Scatter data={chartData} options={NDVI_YIELD_CHART_OPTIONS} />
        </div>
      </div>

      {/* ── Prediction summary ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-900 bg-slate-900/50 p-4">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Current NDVI
          </span>
          <p className="text-xl font-bold text-emerald-400">
            {currentNdvi != null ? currentNdvi.toFixed(4) : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-pink-500/30 bg-pink-500/5 p-4">
          <span className="text-[10px] text-pink-400 font-medium uppercase tracking-wider block mb-1">
            Predicted Yield
          </span>
          <p className="text-xl font-bold text-pink-300">
            {prediction != null ? `${prediction.toFixed(2)} t/ha` : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-900 bg-slate-900/50 p-4">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Regression
          </span>
          <p className="text-sm font-mono text-slate-300">
            y = {slope.toFixed(3)}·x + {intercept.toFixed(3)}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            {calibrationPoints.length
              ? `Calibrated with ${calibrationPoints.length} real yield point(s).`
              : 'Enter historical yields above to calibrate.'}
          </p>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN DASHBOARD
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
    ltvParamsRef.current = p;
    const url = type === 'forest'
      ? `/api/sentinel/forest/${entityId}/sat-index`
      : `/api/sentinel/farm/${entityId}/sat-index`;
    setLtvLoading(true);
    axiosInstance.get(url, { params: p })
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

        {/* ── Yield analysis (5-yr NDVI seasonal + regression) ── */}
        {type === 'farm' && (
          <YieldAnalysisPanel
            history={history}
            ltv={data.ltv}
            currentNdvi={history[history.length - 1]?.ndvi?.value ?? null}
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