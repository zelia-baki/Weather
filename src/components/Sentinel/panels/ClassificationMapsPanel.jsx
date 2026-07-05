import { useState, useCallback, useEffect } from "react";
import { Satellite, RefreshCw, Loader2 } from "lucide-react";
import axiosInstance from "../../../axiosInstance";
import { CLASS_INDICES, CLASS_LABELS } from "../constants";

export default function ClassificationMapsPanel({ entityId }) {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  const fetchAll = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    const next = {};
    const nextErr = {};
    for (const idx of CLASS_INDICES) {
      try {
        const { data } = await axiosInstance.get(
          `/api/sentinel/farm/${entityId}/classification/${idx}`
        );
        next[idx] = data;
      } catch (e) {
        nextErr[idx] = e.response?.data?.error || 'Erreur de classification';
      }
    }
    setResults(next);
    setErrors(nextErr);
    setLoading(false);
  }, [entityId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Satellite size={16} className="text-emerald-400" />
            Plant Health Classification Maps
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Zone-based classification (NDVI · NDMI · NDRE) — red zones indicate newly
            planted areas or zones needing immediate attention.
          </p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-1.5 border border-slate-700 text-slate-400 hover:text-white
                     text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          Refresh
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CLASS_INDICES.map(idx => {
          const result = results[idx];
          const err = errors[idx];

          if (loading && !result) {
            return (
              <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950 p-6
                                         flex flex-col items-center justify-center gap-2 min-h-[260px]">
                <Loader2 size={20} className="animate-spin text-emerald-400" />
                <p className="text-xs text-slate-500">Loading {CLASS_LABELS[idx]}…</p>
              </div>
            );
          }

          if (err) {
            return (
              <div key={idx} className="rounded-xl border border-orange-700/40 bg-orange-950/20 p-4">
                <p className="text-orange-400 font-bold text-sm mb-1">{CLASS_LABELS[idx]}</p>
                <p className="text-orange-500 text-xs">{err}</p>
              </div>
            );
          }

          if (!result) return null;

          return (
            <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800">
                <p className="font-bold text-white text-sm">{CLASS_LABELS[idx]}</p>
                <p className="text-xs text-slate-500">
                  {result.period?.from} → {result.period?.to}
                </p>
              </div>

              <img
                src={`data:image/png;base64,${result.image_base64}`}
                alt={`Carte ${idx}`}
                className="w-full"
              />

              <div className="p-4">
                <div className="flex justify-between text-[10px] text-slate-500 font-semibold uppercase mb-2">
                  <span>Legend</span>
                  <span>Surface (km²)</span>
                </div>
                <div className="space-y-1.5">
                  {result.classes?.map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-sm inline-block border border-slate-700"
                          style={{ backgroundColor: c.color }}
                        />
                        <span className="text-slate-300">{c.label}</span>
                      </div>
                      <span className="text-slate-400 font-mono">{c.area_km2}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}