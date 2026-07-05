import { useState, useEffect, useCallback } from "react";
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Loader2, RefreshCw, CloudRain } from "lucide-react";
import axiosInstance from "../../../axiosInstance";
import { META } from "../constants";

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Même approche que WBIIDashboard.jsx : appel direct Open-Meteo côté client,
// aucun backend nécessaire pour la pluie.
async function fetchMonthlyRainfall(lat, lon, dateFrom, dateTo) {
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${dateFrom}&end_date=${dateTo}&daily=precipitation_sum&timezone=auto`;
  const resp = await fetch(url);
  const data = await resp.json();
  if (!data?.daily?.time) return {};

  const byMonth = {};
  data.daily.time.forEach((date, i) => {
    const monthKey = date.substring(0, 7); // "YYYY-MM"
    const val = data.daily.precipitation_sum[i] || 0;
    byMonth[monthKey] = (byMonth[monthKey] || 0) + val;
  });
  return byMonth;
}

export default function SeasonalNdviRainfallPanel({ entityId, entityType = "farm" }) {
  const [months, setMonths] = useState(12);
  const [indexKey, setIndexKey] = useState("ndvi");
  const [chartRows, setChartRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (m) => {
    if (!entityId) return;
    setLoading(true);
    setError(null);
    try {
      const url = entityType === "forest"
        ? `/api/sentinel/forest/${entityId}/monthly-trend`
        : `/api/sentinel/farm/${entityId}/monthly-trend`;
      const { data } = await axiosInstance.get(url, { params: { months: m } });

      let rainByMonth = {};
      if (data.geolocation) {
        const [lat, lon] = data.geolocation.split(",").map(s => parseFloat(s.trim()));
        if (!isNaN(lat) && !isNaN(lon)) {
          rainByMonth = await fetchMonthlyRainfall(lat, lon, data.period.from, data.period.to);
        }
      }

      const rows = data.history.map(row => {
        const monthKey = row.date.substring(0, 7);
        const d = new Date(row.date);
        const entry = { monthKey, label: MONTH_LABELS[d.getUTCMonth()] };
        Object.keys(META).forEach(idx => { entry[idx] = row[idx]?.value ?? null; });
        entry.rainfall = rainByMonth[monthKey] != null
          ? Math.round(rainByMonth[monthKey] * 10) / 10
          : null;
        return entry;
      });

      setChartRows(rows);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Failed to load seasonal data");
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType]);

  useEffect(() => { load(months); }, [load, months]);

  const meta = META[indexKey];

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <CloudRain size={16} className="text-sky-400" />
            Seasonal {meta?.label || indexKey.toUpperCase()} vs Rainfall
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Monthly {meta?.label || indexKey.toUpperCase()} (Sentinel-2) overlaid with monthly rainfall (Open-Meteo).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={indexKey}
            onChange={e => setIndexKey(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 text-slate-200 text-xs px-2 py-1.5 focus:outline-none"
          >
            {Object.keys(META).map(idx => (
              <option key={idx} value={idx}>{META[idx].label}</option>
            ))}
          </select>
          <div className="flex rounded-lg border border-slate-700 overflow-hidden">
            {[6, 12, 24].map(m => (
              <button
                key={m}
                onClick={() => setMonths(m)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors
                  ${months === m ? "bg-emerald-700 text-white" : "bg-transparent text-slate-400 hover:text-white"}`}
              >
                {m}m
              </button>
            ))}
          </div>
          <button
            onClick={() => load(months)}
            disabled={loading}
            className="flex items-center gap-1.5 border border-slate-700 text-slate-400 hover:text-white
                       text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          </button>
        </div>
      </div>

      <div className="p-6">
        {loading && !chartRows && (
          <div className="h-96 flex items-center justify-center gap-2 text-slate-500 text-sm">
            <Loader2 size={16} className="animate-spin" /> Loading seasonal data…
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-orange-700/40 bg-orange-950/20 p-4">
            <p className="text-orange-400 text-sm">{error}</p>
          </div>
        )}
        {chartRows && !error && (
          <ResponsiveContainer width="100%" height={420}>
            <ComposedChart data={chartRows} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis
                yAxisId="left"
                domain={["dataMin - 0.05", "dataMax + 0.05"]}
                tick={{ fill: "#64748b", fontSize: 10 }}
                label={{ value: meta?.label || indexKey.toUpperCase(), angle: -90, position: "insideLeft", style: { fill: "#94a3b8", fontSize: 11 } }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "#64748b", fontSize: 10 }}
                label={{ value: "Rainfall (mm)", angle: 90, position: "insideRight", style: { fill: "#38bdf8", fontSize: 11 } }}
              />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
                labelStyle={{ color: "#94a3b8" }}
                formatter={(value, name) => {
                  if (value == null) return ["—", name];
                  if (name === "Rainfall (mm)") return [`${value} mm`, name];
                  return [value.toFixed(4), name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
              <Bar
                yAxisId="right"
                dataKey="rainfall"
                name="Rainfall (mm)"
                fill="#38bdf8"
                fillOpacity={0.55}
                radius={[6, 6, 0, 0]}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey={indexKey}
                name={meta?.label || indexKey.toUpperCase()}
                stroke={meta?.color || "#16a34a"}
                strokeWidth={3}
                dot={{ r: 4, fill: meta?.color || "#16a34a" }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}