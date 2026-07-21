import { useState, useEffect, useCallback } from "react";
import { Line } from "react-chartjs-2";
import { Loader2, RefreshCw, CalendarClock } from "lucide-react";
import axiosInstance from "../../../axiosInstance";
import { META } from "../constants";

const WINDOW_OPTIONS = [
  { label: "3 mois", weeks: 13 },
  { label: "6 mois", weeks: 26 },
  { label: "12 mois", weeks: 52 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Plugin Chart.js : dessine une bande grisée derrière chaque semaine où
// aucune image Sentinel-2 exploitable n'était disponible (trop nuageux).
// Rend visible, sans ambiguïté, la différence entre "valeur basse" et
// "absence de donnée" — les deux ne doivent jamais se confondre visuellement.
// ─────────────────────────────────────────────────────────────────────────────
const noDataBandsPlugin = {
  id: "noDataBands",
  beforeDraw(chart, _args, opts) {
    const { hasData } = opts || {};
    if (!hasData?.length) return;
    const { ctx, chartArea, scales } = chart;
    if (!chartArea) return;
    const xScale = scales.x;
    const n = hasData.length;

    ctx.save();
    hasData.forEach((has, i) => {
      if (has) return;
      const center = xScale.getPixelForValue(i);
      const prevCenter = i > 0 ? xScale.getPixelForValue(i - 1) : center;
      const nextCenter = i < n - 1 ? xScale.getPixelForValue(i + 1) : center;
      const left = i === 0 ? chartArea.left : (prevCenter + center) / 2;
      const right = i === n - 1 ? chartArea.right : (center + nextCenter) / 2;

      ctx.fillStyle = "rgba(100, 116, 139, 0.10)"; // slate-500 @ 10%
      ctx.fillRect(left, chartArea.top, right - left, chartArea.bottom - chartArea.top);

      // Petit hachurage diagonal léger pour renforcer la lisibilité en print/PDF
      ctx.strokeStyle = "rgba(100, 116, 139, 0.18)";
      ctx.lineWidth = 1;
      const step = 8;
      for (let x = left - (chartArea.bottom - chartArea.top); x < right; x += step) {
        ctx.beginPath();
        ctx.moveTo(Math.max(x, left), chartArea.bottom);
        ctx.lineTo(Math.min(x + (chartArea.bottom - chartArea.top), right), chartArea.top);
        ctx.stroke();
      }
    });
    ctx.restore();
  },
};

export default function WeeklyTrendPanel({ entityId, entityType = "farm" }) {
  const [weeks, setWeeks] = useState(13);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (w) => {
    if (!entityId) return;
    setLoading(true);
    setError(null);
    try {
      const url = entityType === "forest"
        ? `/api/sentinel/forest/${entityId}/weekly-trend`
        : `/api/sentinel/farm/${entityId}/weekly-trend`;
      const { data } = await axiosInstance.get(url, { params: { weeks: w } });
      setData(data);
    } catch (e) {
      setError(e.response?.data?.error || "Failed to load weekly trend");
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType]);

  useEffect(() => { fetchData(weeks); }, [fetchData, weeks]);

  const hasData = data?.history.map(h => h.ndvi?.value != null) || [];

  const chartData = data && {
    labels: data.history.map(h => h.date),
    datasets: Object.keys(META).map(idx => ({
      label: META[idx].label,
      data: data.history.map(h => h[idx]?.value ?? null),
      borderColor: META[idx].color,
      backgroundColor: "transparent",
      borderWidth: 2,
      tension: 0.35,
      pointRadius: 3,
      pointBackgroundColor: META[idx].color,
      spanGaps: true,
    })),
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        display: true, position: "top",
        labels: { color: "#94a3b8", font: { size: 10 }, boxWidth: 12, padding: 10, usePointStyle: true },
      },
      tooltip: {
        backgroundColor: "#0f172a", borderColor: "#334155", borderWidth: 1,
        titleColor: "#94a3b8", bodyColor: "#e2e8f0",
        callbacks: {
          label: ctx => {
            const has = hasData[ctx.dataIndex];
            if (!has) return null; // évite d'afficher "null" dans le tooltip
            return ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(4) ?? "N/A"}`;
          },
        },
      },
      noDataBands: { hasData },
    },
    scales: {
      x: { ticks: { color: "#64748b", font: { size: 9 }, maxRotation: 45 }, grid: { color: "#1e293b" } },
      y: { ticks: { color: "#64748b", font: { size: 10 } }, grid: { color: "#1e293b" } },
    },
  };

  const missingCount = hasData.filter(h => !h).length;

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <CalendarClock size={16} className="text-emerald-400" />
            Weekly Trend — All Indices
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Weekly aggregation (~5-day Sentinel-2 revisit), for spotting recent
            stress before it shows up in the quarterly forecast.
            {data?.period && (
              <span className="ml-1 text-slate-600">
                · {data.period.from} → {data.period.to}
              </span>
            )}
            {data?.weeks_with_data != null && (
              <span className="ml-1 text-yellow-500">
                · {data.weeks_with_data}/{data.weeks} weeks with usable imagery
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-700 overflow-hidden">
            {WINDOW_OPTIONS.map(opt => (
              <button
                key={opt.weeks}
                onClick={() => setWeeks(opt.weeks)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors
                  ${weeks === opt.weeks
                    ? "bg-emerald-700 text-white"
                    : "bg-transparent text-slate-400 hover:text-white"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchData(weeks)}
            disabled={loading}
            className="flex items-center gap-1.5 border border-slate-700 text-slate-400 hover:text-white
                       text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          </button>
        </div>
      </div>

      <div className="p-6">
        {loading && !data && (
          <div className="h-72 flex items-center justify-center gap-2 text-slate-500 text-sm">
            <Loader2 size={16} className="animate-spin" /> Loading weekly data…
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-orange-700/40 bg-orange-950/20 p-4">
            <p className="text-orange-400 text-sm">{error}</p>
          </div>
        )}
        {chartData && !error && (
          <>
            <div className="h-72">
              <Line data={chartData} options={chartOptions} plugins={[noDataBandsPlugin]} />
            </div>
            {missingCount > 0 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <span
                  className="inline-block w-4 h-3 rounded-sm"
                  style={{
                    background: "repeating-linear-gradient(135deg, rgba(100,116,139,0.25) 0 3px, transparent 3px 6px)",
                    border: "1px solid rgba(100,116,139,0.3)",
                  }}
                />
                No usable Sentinel-2 imagery that week (cloud cover &gt; 30%) —
                {" "}{missingCount} of {weeks} weeks affected
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}