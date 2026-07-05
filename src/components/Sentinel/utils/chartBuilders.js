import { META } from "../constants";

export function buildChartData(idx, history, forecast) {
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

export function buildRegressionChartData(reg, histYield1, histYield2) {
  if (!reg || !reg.ndvi_points?.length) return null;

  const xs = reg.ndvi_points;
  const ys = reg.yield_points;

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const regLine = [
    { x: minX, y: reg.slope * minX + reg.intercept },
    { x: maxX, y: reg.slope * maxX + reg.intercept },
  ];

  const datasets = [
    {
      label: 'Historical Yield',
      data: xs.map((x, i) => ({ x, y: ys[i] })),
      type: 'scatter',
      backgroundColor: '#eab308',
      borderColor: '#eab308',
      pointRadius: 5,
      pointHoverRadius: 7,
    },
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

  if (reg.predicted_yield != null) {
    const predX = xs[xs.length - 1];
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

export const REGRESSION_CHART_OPTIONS = {
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

export const CHART_OPTIONS = {
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