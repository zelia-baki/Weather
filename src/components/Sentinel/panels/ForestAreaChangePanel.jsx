import { useState, useEffect, useCallback } from "react";
import { Bar } from "react-chartjs-2";
import { Loader2, RefreshCw, Trees } from "lucide-react";
import axiosInstance from "../../../axiosInstance";

/**
 * ForestAreaChangePanel
 * ─────────────────────────────────────────────────────────────────────────
 * Surface boisée mois par mois (Sentinel-2, NDVI > seuil, nuages masqués)
 * et variation mensuelle, pour suivre dégradation et déforestation.
 *
 * Backend : GET /api/gfw/forest/<forest_id>/area-change?months=12
 */
const PERIODS = [12, 24, 60];

const fmt = (v, digits = 2, signed = false) =>
  v == null ? "—" : `${signed && v > 0 ? "+" : ""}${v.toFixed(digits)}`;

export default function ForestAreaChangePanel({ entityId }) {
  const [months, setMonths] = useState(12);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!entityId) return;
    setLoading(true); setError(null);
    try {
      const { data } = await axiosInstance.get(`/api/gfw/forest/${entityId}/area-change`, { params: { months } });
      setData(data);
    } catch (e) {
      setError(e.response?.data?.error || "Forest area data unavailable");
    } finally {
      setLoading(false);
    }
  }, [entityId, months]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const rows = data?.months || [];
  const usable = rows.filter((m) => m.forest_area_ha != null);
  const net = data?.net_change_ha;

  const chartData = {
    labels: usable.map((m) => m.month),
    datasets: [
      {
        type: "line",
        label: "Forest area (ha)",
        data: usable.map((m) => m.forest_area_ha),
        borderColor: "#10b981",
        backgroundColor: "#10b981",
        yAxisID: "area",
        tension: 0.25,
        pointRadius: 3,
      },
      {
        type: "bar",
        label: "Monthly change (ha)",
        data: usable.map((m) => m.change_ha ?? 0),
        backgroundColor: usable.map((m) => ((m.change_ha ?? 0) < 0 ? "rgba(239,68,68,0.6)" : "rgba(34,197,94,0.45)")),
        yAxisID: "change",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: { legend: { labels: { color: "#94a3b8", font: { size: 11 } } } },
    scales: {
      x: { ticks: { color: "#64748b", font: { size: 10 } }, grid: { color: "#1e293b" } },
      area: {
        position: "right",
        title: { display: true, text: "Forest area (ha)", color: "#64748b" },
        ticks: { color: "#64748b" }, grid: { display: false },
      },
      change: {
        position: "left",
        title: { display: true, text: "Change (ha)", color: "#64748b" },
        ticks: { color: "#64748b" }, grid: { color: "#1e293b" },
      },
    },
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Trees size={16} className="text-emerald-500" />
            Monthly Forest Area Change
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Degradation &amp; deforestation tracking · Sentinel-2, pixel counted as forest when NDVI &gt;{" "}
            {data?.ndvi_threshold ?? 0.3} · clouds masked
          </p>
        </div>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button key={p} onClick={() => setMonths(p)} disabled={loading}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                months === p
                  ? "bg-emerald-700 border-emerald-600 text-white"
                  : "border-slate-700 text-slate-400 hover:text-white"}`}>
              {p === 60 ? "5 yr" : `${p} mo`}
            </button>
          ))}
          <button onClick={fetchData} disabled={loading} aria-label="Refresh"
            className="flex items-center border border-slate-700 text-slate-400 hover:text-white
                       text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
            {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          </button>
        </div>
      </div>

      <div className="p-6">
        {loading && <p className="text-slate-500 text-sm">Loading Sentinel-2 months…</p>}
        {error && !loading && <p className="text-orange-400 text-sm">{error}</p>}

        {data && !error && !loading && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
                <p className="text-xs text-slate-500 uppercase">Forest area now</p>
                <p className="text-2xl font-black text-emerald-500">{fmt(data.current_forest_area_ha)}</p>
                <p className="text-xs text-slate-600">of {fmt(data.area_ha)} ha</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
                <p className="text-xs text-slate-500 uppercase">Net change</p>
                <p className={`text-xl font-bold ${net < 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {fmt(net, 2, true)} ha
                </p>
                <p className="text-xs text-slate-600">{fmt(data.net_change_pct, 2, true)} %</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
                <p className="text-xs text-slate-500 uppercase">Largest monthly loss</p>
                <p className="text-xl font-bold text-slate-200">{fmt(data.largest_monthly_loss_ha, 2, true)}</p>
                <p className="text-xs text-slate-600">ha</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
                <p className="text-xs text-slate-500 uppercase">Period</p>
                <p className="text-sm font-bold text-slate-200">{data.period_from} → {data.period_to}</p>
                <p className="text-xs text-slate-600">{rows.length - usable.length} cloudy month(s) skipped</p>
              </div>
            </div>

            <div className="h-64">
              <Bar data={chartData} options={chartOptions} />
            </div>
            <p className="text-xs text-slate-500 mt-3">
              A one-off drop can be seasonal (dry season leaf loss); a drop that persists over the
              following months indicates real canopy loss.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
