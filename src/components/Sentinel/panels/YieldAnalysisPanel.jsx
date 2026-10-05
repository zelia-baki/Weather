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

  // Graphique Saisonnier optimisé (focus sur l'année récente)
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
    const latestYear = years[years.length - 1];

    return {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: years.map((year, i) => {
        const isLatest = year === latestYear;
        return {
          label: year,
          data: byYear[year],
          borderColor: isLatest ? '#10b981' : (YEAR_COLORS[i % YEAR_COLORS.length] || '#475569'),
          backgroundColor: 'transparent',
          tension: 0.3,
          borderWidth: isLatest ? 3 : 1.5,
          pointRadius: isLatest ? 5 : 3,
          pointHoverRadius: 7,
          pointBackgroundColor: isLatest ? '#10b981' : '#475569',
          // Atténuer les années passées pour un look plus épuré
          hidden: !isLatest && years.length > 3 && i < years.length - 3, 
          spanGaps: true,
        };
      }),
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
        labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12, padding: 16, usePointStyle: true },
      },
      tooltip: {
        backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1,
        titleColor: '#94a3b8', bodyColor: '#e2e8f0', padding: 10,
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(4) ?? 'N/A'}`,
        },
      },
    },
    scales: {
      x: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: '#1e293b', borderDash: [4, 4] } },
      y: {
        ticks: { color: '#64748b', font: { size: 11 } },
        grid: { color: '#1e293b', borderDash: [4, 4] },
        title: {
          display: true,
          text: META[activeIndex]?.label || activeIndex.toUpperCase(),
          color: '#94a3b8',
          font: { size: 11, weight: '500' },
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
        label: 'Historique',
        data: xs.map((x, i) => ({ x, y: ys[i] })),
        type: 'scatter',
        backgroundColor: '#38bdf8',
        borderColor: '#38bdf8',
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: 'Régression',
        data: [
          { x: minX, y: slope * minX + intercept },
          { x: maxX, y: slope * maxX + intercept },
        ],
        type: 'line',
        borderColor: '#818cf8',
        borderWidth: 2,
        borderDash: [4, 4],
        pointRadius: 0,
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
        label: 'Calibration Analyste',
        data: anchors,
        type: 'scatter',
        backgroundColor: '#f43f5e',
        pointRadius: 7,
        pointStyle: 'triangle',
      });
    }

    if (reg.predicted_yield != null) {
      const predX = xs[xs.length - 1];
      datasets.push({
        label: 'Prédiction',
        data: [{ x: predX, y: reg.predicted_yield }],
        type: 'scatter',
        backgroundColor: '#eab308',
        borderColor: '#ffffff',
        pointRadius: 9,
        pointStyle: 'star',
        borderWidth: 1.5,
      });
    }

    return { regChartData: { datasets }, reg };
  }, [ltv, hy1, hy2, activeIndex]);

  const regOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'nearest', intersect: true },
    plugins: {
      legend: { display: false }, // Géré en custom en haut si besoin
      tooltip: {
        backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1,
        titleColor: '#94a3b8', bodyColor: '#e2e8f0', padding: 10,
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: NDVI ${ctx.parsed.x?.toFixed(3)}, Rendement ${ctx.parsed.y?.toFixed(2)} t/ha`,
        },
      },
    },
    scales: {
      x: {
        type: 'linear',
        ticks: { color: '#64748b', font: { size: 11 } },
        grid: { color: '#1e293b', borderDash: [4, 4] },
        title: { display: true, text: activeIndex.toUpperCase(), color: '#64748b', font: { size: 12 } },
      },
      y: {
        ticks: { color: '#64748b', font: { size: 11 } },
        grid: { color: '#1e293b', borderDash: [4, 4] },
        title: { display: true, text: 'Rendement (t/ha)', color: '#64748b', font: { size: 12 } },
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
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* En-tête */}
      <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-semibold text-white text-base flex items-center gap-2">
            <span>🌾</span> Analyse de Rendement & Calibration ML
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Comparaison saisonnière et modélisation prédictive basée sur l'indice <span className="text-white font-medium">{idxMeta.label || activeIndex.toUpperCase()}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: idxMeta.color || '#10b981' }} />
          <span className="text-slate-300">Index actif :</span> <span className="text-white font-semibold">{idxMeta.label || activeIndex.toUpperCase()}</span>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Graphique 1 : Saisonnier */}
        <div>
          <div className="mb-4">
            <h4 className="font-medium text-slate-200 text-sm">Évolution Saisonnier (Trimestrielle)</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualisez les ruptures de tendance par rapport aux années précédentes.
            </p>
          </div>
          <div className="h-72 bg-slate-950/30 p-4 rounded-xl border border-slate-800/60">
            <Line data={annualChartData} options={annualOptions} />
          </div>
        </div>

        {/* Inputs de Calibration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Rendement Historique ({hy1Year})
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={hy1}
                onChange={e => setHy1(e.target.value)}
                placeholder="Ex: 1.8"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2
                           text-sm text-white placeholder-slate-600
                           focus:border-emerald-500 focus:outline-none transition-colors"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-500">t/ha</span>
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Rendement Historique ({hy2Year})
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={hy2}
                onChange={e => setHy2(e.target.value)}
                placeholder="Ex: 1.8"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2
                           text-sm text-white placeholder-slate-600
                           focus:border-emerald-500 focus:outline-none transition-colors"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-500">t/ha</span>
            </div>
          </div>
        </div>

        {(hy1 !== "" || hy2 !== "") && (
          <div className="flex justify-end">
            <button
              onClick={handleApply}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white
                         font-medium text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-900/20"
            >
              ⚡ Appliquer la calibration & recalculer
            </button>
          </div>
        )}

        {/* Graphique 2 : Régression */}
        {regChartData && reg && (
          <div className="border-t border-slate-800 pt-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-slate-200 text-sm">Modèle de Régression & Prédiction</h4>
                  {reg.calibrated && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      Calibré
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Corrélation entre l'indice et les rendements réels observés.
                </p>
              </div>

              {reg.predicted_yield != null && (
                <div className="rounded-xl bg-slate-950/60 border border-emerald-500/30 px-4 py-2.5 text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Rendement Prédit</span>
                  <span className="text-xl font-bold text-emerald-400">{reg.predicted_yield} <span className="text-xs font-normal">t/ha</span></span>
                </div>
              )}
            </div>

            <div className="h-72 bg-slate-950/30 p-4 rounded-xl border border-slate-800/60">
              <Line data={regChartData} options={regOptions} />
            </div>

            {/* Légende personnalisée épurée & métriques */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-400"></span> Historique</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-400"></span> Régression</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Analyste</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Prédiction</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px] text-slate-300">
                <span>R² = {reg.r2}</span>
                <span>Pente = {reg.slope}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}