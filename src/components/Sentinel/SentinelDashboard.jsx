import React, { useEffect, useState, useCallback } from "react";
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
  AlertTriangle, Shield, Database,
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Filler, Tooltip, Legend);

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

const Spinner = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 gap-4">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 border-4 border-emerald-900 rounded-full"/>
      <div className="absolute inset-0 border-4 border-t-emerald-400 rounded-full animate-spin"/>
      <div className="absolute inset-0 flex items-center justify-center">
        <Satellite size={22} className="text-emerald-400" />
      </div>
    </div>
    <p className="text-emerald-400 text-sm font-mono tracking-widest animate-pulse">
      QUERYING SENTINEL-2...
    </p>
  </div>
);

const TierBadge = ({ tier }) => {
  if (!tier) return null;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ background: tier.bg || tier.color + '22', color: tier.color }}>
      {tier.label}
    </span>
  );
};

const IndexCard = ({ idx, data, active, onClick }) => {
  const meta = META[idx];
  const { Icon } = meta;
  const history  = data?.history || [];
  const last     = history[history.length - 1];
  const val      = last?.[idx]?.value;
  const tier     = last?.[idx]?.tier;
  const forecast = data?.forecast?.[idx]?.[0];

  return (
    <button onClick={onClick}
      className={`text-left rounded-2xl p-4 border transition-all duration-200 w-full
        ${active
          ? 'border-2 shadow-lg scale-[1.02]'
          : 'border border-slate-700 bg-slate-900 hover:border-slate-500'}`}
      style={active ? { borderColor: meta.color, background: meta.color + '18', boxShadow: `0 0 20px ${meta.color}30` } : {}}>
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

function buildChartData(idx, history, forecast) {
  const meta     = META[idx];
  const histDates = history.map(h => h.date.substring(0, 7));
  const pad       = histDates.length;
  return {
    labels: [...histDates, ...forecast.map(f => f.quarter)],
    datasets: [
      { label: 'FC High', data: [...Array(pad).fill(null), ...forecast.map(f => f.upper_80)],
        borderColor: 'transparent', backgroundColor: meta.color + '25', fill: '+1', pointRadius: 0, tension: 0.4 },
      { label: 'FC Low',  data: [...Array(pad).fill(null), ...forecast.map(f => f.lower_80)],
        borderColor: 'transparent', backgroundColor: meta.color + '25', fill: false, pointRadius: 0, tension: 0.4 },
      { label: `${meta.label} Historical`, data: history.map(h => h[idx]?.value ?? null),
        borderColor: meta.color, backgroundColor: meta.fill, fill: true, tension: 0.4,
        borderWidth: 2.5, pointRadius: 3, pointBackgroundColor: meta.color },
      { label: `${meta.label} Forecast`, data: [...Array(pad).fill(null), ...forecast.map(f => f.value)],
        borderColor: meta.color, borderDash: [6, 3], backgroundColor: 'transparent', tension: 0.4,
        borderWidth: 2, pointRadius: 5, pointBackgroundColor: '#0f172a',
        pointBorderColor: meta.color, pointBorderWidth: 2 },
    ]
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
      callbacks: { label: ctx => {
        if (ctx.dataset.label?.includes('High') || ctx.dataset.label?.includes('Low')) return null;
        return ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(4) ?? 'N/A'}`;
      }}
    }
  },
  scales: {
    x: { ticks: { color: '#64748b', font: { size: 10 }, maxRotation: 45 }, grid: { color: '#1e293b' } },
    y: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: '#1e293b' } },
  }
};

const LTVPanel = ({ ltv, onUpdate }) => {
  const [loanAmount,   setLoanAmount]  = useState('');
  const [yieldPerHa,  setYieldPerHa]  = useState('1.5');
  const [pricePerTon, setPricePerTon] = useState('500');

  const handleApply = () => onUpdate({
    loan_amount:    parseFloat(loanAmount) || undefined,
    yield_t_per_ha: parseFloat(yieldPerHa) || 1.5,
    price_per_t:    parseFloat(pricePerTon) || 500,
  });

  if (!ltv && ltv !== null) return null;

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6">
      <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
        <DollarSign size={16} className="text-emerald-400" />
        Financial Analysis (LTV)
      </h3>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Loan Amount (USD)', val: loanAmount,  set: setLoanAmount,  ph: 'e.g. 5000' },
          { label: 'Yield (t/ha)',      val: yieldPerHa,  set: setYieldPerHa,  ph: '1.5' },
          { label: 'Price (USD/t)',     val: pricePerTon, set: setPricePerTon, ph: '500' },
        ].map(({ label, val, set, ph }) => (
          <div key={label}>
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <input value={val} onChange={e => set(e.target.value)} placeholder={ph}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2
                         text-sm text-white focus:outline-none focus:border-emerald-500"/>
          </div>
        ))}
      </div>
      <button onClick={handleApply}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold
                   py-2 rounded-lg transition-colors mb-4">
        Calculate LTV
      </button>
      {ltv && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Area',              val: `${ltv.area_ha} ha` },
            { label: 'Adj. Yield',        val: `${ltv.adjusted_yield_t_ha} t/ha` },
            { label: 'Est. Crop Value',   val: `$${ltv.estimated_crop_value_usd?.toLocaleString()}` },
            { label: 'LTV Ratio',         val: ltv.ltv_ratio_pct ? `${ltv.ltv_ratio_pct}%` : 'N/A',
              highlight: ltv.ltv_ratio_pct > 80 ? '#f97316' : '#16a34a',
              BI: ltv.ltv_ratio_pct > 80 ? AlertTriangle : Shield },
            { label: 'Insurance Premium', val: `${ltv.insurance_premium_pct}%`,
              highlight: ltv.insurance_premium_pct > 6 ? '#f97316' : '#16a34a' },
            { label: 'NDVI Factor',       val: ltv.ndvi_factor },
          ].map(({ label, val, highlight, BI }) => (
            <div key={label} className="bg-slate-800 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                {BI && <BI size={11} style={{ color: highlight || '#e2e8f0' }} />}
                <p className="text-xs text-slate-500">{label}</p>
              </div>
              <p className="font-bold text-base" style={{ color: highlight || '#e2e8f0' }}>{val}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function SentinelDashboard({ entityType = 'farm' }) {
  const params   = useParams();
  const location = useLocation();
  const rawId    = params.farmId || params.forestId || location.state?.farmId || location.state?.forestId || null;
  const entityId = (rawId && rawId !== 'undefined' && rawId !== 'null') ? String(rawId).trim() : null;
  const type     = entityType || (params.forestId ? 'forest' : 'farm');

  React.useEffect(() => {
    console.log('[Sentinel] entityId:', entityId, 'params:', params);
  }, []);

  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [active,    setActive]    = useState('ndvi');
  const [exporting, setExporting] = useState(false);
  const [ltvParams, setLtvParams] = useState({});

  const fetchData = useCallback(async (extraParams = {}) => {
    if (!entityId) { setError('No entity ID'); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const url  = type === 'forest'
        ? `/api/sentinel/forest/${entityId}/sat-index`
        : `/api/sentinel/farm/${entityId}/sat-index`;
      const resp = await axiosInstance.get(url, { params: { ...ltvParams, ...extraParams } });
      setData(resp.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load satellite data');
    } finally { setLoading(false); }
  }, [entityId, type, ltvParams]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const resp = await axiosInstance.get(`/api/sentinel/farm/${entityId}/sat-index/pdf`,
        { params: ltvParams, responseType: 'blob' });
      const link = document.createElement('a');
      link.href  = window.URL.createObjectURL(new Blob([resp.data]));
      link.setAttribute('download', `sat_index_${entityId}.pdf`);
      document.body.appendChild(link); link.click(); link.remove();
    } catch { alert('PDF export failed'); }
    finally { setExporting(false); }
  };

  const handleLTVUpdate = (p) => { setLtvParams(p); fetchData(p); };

  if (loading) return <Spinner />;

  if (error || !data) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 p-8 max-w-sm text-center">
        <Satellite size={48} className="text-slate-700 mx-auto mb-4" />
        <h2 className="text-white font-bold text-lg mb-2">Satellite Data Unavailable</h2>
        <p className="text-slate-400 text-sm mb-4">{error || 'No data'}</p>
        <button onClick={() => fetchData()}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-full text-sm font-semibold transition-colors">
          Retry
        </button>
      </div>
    </div>
  );

  const history  = data.history  || [];
  const forecast = data.forecast || {};
  const groups   = [
    { title: 'Vegetation',      Icon: Leaf,     keys: ['ndvi','evi','savi'] },
    { title: 'Water & Drought', Icon: Droplets, keys: ['ndmi','ndwi','nmdi'] },
    { title: 'Fire & Soil',     Icon: Flame,    keys: ['nbr','bsi'] },
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
              <p className="text-xs text-slate-500">Sentinel-2 · {data.period?.from} → {data.period?.to}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {data?.from_cache && (
              <span className="flex items-center gap-1 text-xs text-slate-500 border border-slate-700 px-2 py-1 rounded-lg">
                <Database size={11} /> Cached
                {data.cache_stale && <span className="text-yellow-500 flex items-center gap-0.5 ml-1"><AlertTriangle size={10} /> stale</span>}
                {data.cache_updated_at && <span className="ml-1">· {data.cache_updated_at.substring(0,10)}</span>}
              </span>
            )}
            <button onClick={() => fetchData({ refresh: true })}
              className="flex items-center gap-1.5 border border-slate-600 text-slate-400 hover:text-white
                         text-sm px-3 py-1.5 rounded-lg transition-colors">
              <RefreshCw size={13} /> Fresh
            </button>
            <button onClick={() => fetchData()}
              className="flex items-center gap-1.5 border border-slate-700 text-slate-500 hover:text-slate-300
                         text-sm px-3 py-1.5 rounded-lg transition-colors">
              <Zap size={13} /> Cache
            </button>
            {type === 'farm' && (
              <button onClick={handleExportPdf} disabled={exporting}
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

        {groups.map(({ title, Icon: GIcon, keys }) => (
          <div key={title}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <GIcon size={12} /> {title}
            </p>
            <div className={`grid gap-3 ${keys.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {keys.map(idx => (
                <IndexCard key={idx} idx={idx} data={data} active={active === idx} onClick={() => setActive(idx)} />
              ))}
            </div>
          </div>
        ))}

        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
          <div className="mb-1">
            <h3 className="font-bold text-white flex items-center gap-2">
              {React.createElement(META[active].Icon, { size: 16, style: { color: META[active].color } })}
              {META[active].full}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              5-year history · dashed = 1-year ML forecast (Prophet) · shaded = 80% confidence
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
            <Line data={buildChartData(active, history, forecast[active] || [])} options={CHART_OPTIONS} />
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
                      if (!f) return <td key={idx} className="px-4 py-3 text-center text-slate-600">—</td>;
                      return (
                        <td key={idx} className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-bold" style={{ color: META[idx].color }}>{f.value.toFixed(4)}</span>
                            <TierBadge tier={f.tier} />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
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
                          {d?.value != null
                            ? <span className="font-semibold" style={{ color: d.tier?.color }}>{d.value.toFixed(4)}</span>
                            : <span className="text-slate-600">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {type === 'farm' && <LTVPanel ltv={data.ltv} onUpdate={handleLTVUpdate} />}

        <p className="text-center text-xs text-slate-600 pb-4">
          Sentinel-2 L2A · Statistical API · Max cloud cover 30% · Quarterly aggregation ·
          Forecast: Prophet ML · 80% confidence interval
        </p>
      </div>
    </div>
  );
}