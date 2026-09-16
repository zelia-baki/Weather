import { useState, useEffect, useCallback } from "react";
import { Loader2, RefreshCw, Layers } from "lucide-react";
import axiosInstance from "../../../axiosInstance";

export default function SoilCarbonPanel({ entityId, entityType = "farm" }) {
  const [soc, setSoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [socSeq, setSocSeq] = useState(null);
  const [socSeqLoading, setSocSeqLoading] = useState(true);
  const [socSeqError, setSocSeqError] = useState(null);

  const fetchSoc = useCallback(async () => {
    if (!entityId || entityType !== "farm") { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const { data } = await axiosInstance.get(`/api/sentinel/farm/${entityId}/soc`);
      setSoc(data.soc);
    } catch (e) {
      setError(e.response?.data?.error || "SOC data unavailable");
    } finally { setLoading(false); }
  }, [entityId, entityType]);

  // FAO GSOCseq SSM3 — statistique zonale sur tout le polygone (vs. /soc qui
  // n'interroge que le centroïde), plus le potentiel de séquestration.
  const fetchSocSeq = useCallback(async () => {
    if (!entityId || entityType !== "farm") { setSocSeqLoading(false); return; }
    setSocSeqLoading(true); setSocSeqError(null);
    try {
      const { data } = await axiosInstance.get(`/api/sentinel/farm/${entityId}/soc-seq`);
      setSocSeq(data);
    } catch (e) {
      setSocSeqError(e.response?.data?.error || "GSOCseq data unavailable");
    } finally { setSocSeqLoading(false); }
  }, [entityId, entityType]);

  useEffect(() => { fetchSoc(); fetchSocSeq(); }, [fetchSoc, fetchSocSeq]);

  if (entityType !== "farm") return null;

  const ocs = soc?.["ocs_0-30cm"];

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Layers size={16} className="text-amber-500" />
            Soil Organic Carbon (SoilGrids ISRIC)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Stock de carbone organique du sol, résolution 250m, indépendant du satellite.
          </p>
        </div>
        <button onClick={() => { fetchSoc(); fetchSocSeq(); }} disabled={loading || socSeqLoading}
          className="flex items-center gap-1.5 border border-slate-700 text-slate-400 hover:text-white
                     text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
          {(loading || socSeqLoading) ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div>
          {loading && <p className="text-slate-500 text-sm">Chargement…</p>}
          {error && <p className="text-orange-400 text-sm">{error}</p>}
          {soc && !error && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
                <p className="text-xs text-slate-500 uppercase">Stock (0-30cm)</p>
                <p className="text-2xl font-black text-amber-500">{ocs ?? "—"}</p>
                <p className="text-xs text-slate-600">t C/ha</p>
              </div>
              {["0-5cm", "5-15cm", "15-30cm"].map(d => (
                <div key={d} className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
                  <p className="text-xs text-slate-500 uppercase">{d}</p>
                  <p className="text-xl font-bold text-slate-300">{soc[`soc_${d}`] ?? "—"}</p>
                  <p className="text-xs text-slate-600">g/kg</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-5 border-t border-slate-800">
          <h4 className="text-sm font-bold text-white mb-1">
            Sequestration Potential (FAO GSOCseq — SSM3)
          </h4>
          <p className="text-xs text-slate-500 mb-3">
            Zonal average over the whole farm polygon (not just the centroid) · Sustainable Soil Management scenario, 0-30cm.
          </p>
          {socSeqLoading && <p className="text-slate-500 text-sm">Chargement…</p>}
          {socSeqError && <p className="text-orange-400 text-sm">{socSeqError}</p>}
          {socSeq && !socSeqError && (
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
                <p className="text-xs text-slate-500 uppercase">Final SOC stock</p>
                <p className="text-2xl font-black text-emerald-500">
                  {socSeq.final_soc_stock_t_ha ?? "—"}
                </p>
                <p className="text-xs text-slate-600">t C/ha (SSM3 projection)</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
                <p className="text-xs text-slate-500 uppercase">Sequestration rate</p>
                <p className="text-2xl font-black text-emerald-500">
                  {socSeq.relative_sequestration_rate_pct ?? "—"}
                </p>
                <p className="text-xs text-slate-600">% relative increase</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}