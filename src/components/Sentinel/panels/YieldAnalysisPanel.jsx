import { useState, useEffect, useMemo } from "react";
import { Line } from "react-chartjs-2";
import { META, YEAR_COLORS } from "../constants";

export default function YieldAnalysisPanel({ history, forecast, ltv, activeIndex, onCalibrate }) {
  const allYears = useMemo(() => {
    const set = new Set();
    history.forEach(r => set.add(r.date.substring(0, 4)));
    Object.values(forecast).forEach(arr =>
      arr.forEach(f => set.add(f.quarter.substring(0, 4)))
    );
    return [...set].sort();
  }, [history, forecast]);

  const currentYear = new Date().getFullYear();

  const historicalYears = useMemo(() => {
    const set = new Set();
    history.forEach(r => {
      const y = r.date.substring(0, 4);
      if (parseInt(y, 10) < currentYear) set.add(y);
    });
    return [...set].sort();
  }, [history, currentYear]);

  const recentYears = historicalYears.slice(-2);

  const [hy1, setHy1] = useState(ltv?.hist_yield_1 != null ? String(ltv.hist_yield_1) : "");
  const [hy2, setHy2] = useState(ltv?.hist_yield_2 != null ? String(ltv.hist_yield_2) : "");

  useEffect(() => {
    if (ltv?.hist_yield_1 != null) setHy1(String(ltv.hist_yield_1));
    if (ltv?.hist_yield_2 != null) setHy2(String(ltv.hist_yield_2));
  }, [ltv]);

  const annualChartData = useMemo(() => {
    const getYearQ = (dateStr) => {
      const [y, m] = dateStr.split('-');
      return { year: y, qIndex: Math.floor((parseInt(m, 10) - 1) / 3) };
    };

    const getForecastYearQ = (quarterStr) => {
      const [y, q] = quarterStr.split('-Q');
      return { year: y, qIndex: parseInt(q, 10) - 1 };
    };

    const byYear = {};

    history.forEach(r => {
      const val = r[activeIndex]?.value ?? null;
      if (val === null) return;
      const { year, qIndex } = getYearQ(r.date);
      if (!byYear[year]) byYear[year] = [null, null, null, null];
      byYear[year][qIndex] = val;
    });

    const fcArr = forecast[activeIndex] || [];
    fcArr.forEach(f => {
      const val = f.value ?? f.forecast ?? null;
      if (val === null) return;
      const { year, qIndex } = getForecastYearQ(f.quarter);
      if (!byYear[year]) byYear[year] = [null, null, null, null];
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
        labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 16, padding: 12, usePointStyle: true },
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
      x: { ticks: { color: '#64748b', font: { size: 12 } }, grid: { color: '#1e293b' } },
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

  const { regChartData, reg } = useMemo(() => {
    const reg = ltv?.regression?.[activeIndex];
    if (!reg?.ndvi_points?.length) return { regChartData: null, reg: null };

    const xs = reg.ndvi_points;
    const ys = reg.yield_points;
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const slope = reg.slope;
    const intercept = reg.intercept;

    const datasets = [
      {
        label: `Historical ${activeIndex.toUpperCase()} → Est. Yield`,
        data: xs.map((x, i) => ({ x, y: ys[i] })),
        type: 'scatter',
        backgroundColor: '#eab308',
        borderColor: '#eab308',
        pointRadius: 6,
        pointHoverRadius: 8,
      },
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
  }, [ltv, hy1, hy2, activeIndex]);

  const regOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'nearest', intersect: true },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 16, padding: 12, usePointStyle: true },
      },
      tooltip: {
        backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1,
        titleColor: '#94a3b8', bodyColor: '#e2e8f0',
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
}