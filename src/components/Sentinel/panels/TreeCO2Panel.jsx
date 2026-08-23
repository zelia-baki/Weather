import { useState, useEffect, useCallback } from "react";
import { Loader2, RefreshCw, TreePine, Download } from "lucide-react";
import axiosInstance from "../../../axiosInstance";

/**
 * TreeCO2Panel
 * ─────────────────────────────────────────────────────────────────────────
 * Affiche le rapport de séquestration CO2 par arbre (AGB + courbe sigmoid)
 * pour une forêt. À placer dans src/components/Sentinel/panels/TreeCO2Panel.jsx
 *
 * Backend :
 *   GET /api/tree-co2/forest/<forest_id>/report   → JSON (totaux + détail)
 *   GET /api/tree-co2/forest/<forest_id>/co2-pdf  → PDF téléchargeable
 */
export default function TreeCO2Panel({ entityId, entityType = "forest" }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  const fetchReport = useCallback(async () => {
    if (!entityId || entityType !== "forest") { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const { data } = await axiosInstance.get(`/api/tree-co2/forest/${entityId}/report`);
      setReport(data);
    } catch (e) {
      setError(e.response?.data?.error || "CO2 data unavailable");
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  if (entityType !== "forest") return null;

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const resp = await axiosInstance.get(
        `/api/tree-co2/forest/${entityId}/co2-pdf`,
        { responseType: "blob" },
      );
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(new Blob([resp.data]));
      link.setAttribute("download", `Tree_CO2_Report_${entityId}.pdf`);
      document.body.appendChild(link); link.click(); link.remove();
    } catch {
      alert("PDF export failed");
    } finally {
      setExporting(false);
    }
  };

  const totals = report?.totals || {};
  const trees = report?.trees || [];

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <TreePine size={16} className="text-emerald-500" />
            Tree CO2 Sequestration
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            AGB formula (diameter + height) · sigmoid growth curve per species.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchReport} disabled={loading}
            className="flex items-center gap-1.5 border border-slate-700 text-slate-400 hover:text-white
                       text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
            {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          </button>
          <button
            onClick={handleExportPdf}
            disabled={exporting || !report}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50
                       text-white text-sm px-4 py-1.5 rounded-lg transition-colors font-medium">
            <Download size={13} />
            {exporting ? "Generating…" : "PDF"}
          </button>
        </div>
      </div>

      <div className="p-6">
        {loading && <p className="text-slate-500 text-sm">Chargement…</p>}
        {error && <p className="text-orange-400 text-sm">{error}</p>}

        {report && !error && (
          <>
            {/* ── Totaux ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
                <p className="text-xs text-slate-500 uppercase">Trees</p>
                <p className="text-2xl font-black text-emerald-500">{totals.tree_count ?? "—"}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
                <p className="text-xs text-slate-500 uppercase">CO2 Total (lifetime)</p>
                <p className="text-xl font-bold text-slate-200">
                  {totals.total_co2_sequestered_kg?.toFixed(1) ?? "—"}
                </p>
                <p className="text-xs text-slate-600">kg</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
                <p className="text-xs text-slate-500 uppercase">CO2 / yr (avg)</p>
                <p className="text-xl font-bold text-slate-200">
                  {totals.total_co2_annual_avg_kg?.toFixed(1) ?? "—"}
                </p>
                <p className="text-xs text-slate-600">kg/yr</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
                <p className="text-xs text-slate-500 uppercase">CO2 / yr (sigmoid)</p>
                <p className="text-xl font-bold text-slate-200">
                  {totals.total_co2_annual_sigmoid_kg?.toFixed(1) ?? "—"}
                </p>
                <p className="text-xs text-slate-600">kg/yr</p>
              </div>
            </div>

            {/* ── Détail par arbre ───────────────────────────────────── */}
            {trees.length > 0 ? (
              <div className="overflow-x-auto max-h-72 overflow-y-auto rounded-xl border border-slate-800">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-900">
                    <tr className="text-left uppercase tracking-wide text-slate-500 border-b border-slate-800">
                      <th className="px-4 py-2">Tree</th>
                      <th className="px-4 py-2">Species</th>
                      <th className="px-4 py-2 text-center">Age (yr)</th>
                      <th className="px-4 py-2 text-center">CO2 Total (kg)</th>
                      <th className="px-4 py-2 text-center">CO2/yr avg</th>
                      <th className="px-4 py-2 text-center">CO2/yr sigmoid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trees.map((t) => (
                      <tr key={t.tree_id} className="border-t border-slate-800 hover:bg-slate-800/30">
                        <td className="px-4 py-2 text-slate-300">{t.name || `#${t.tree_id}`}</td>
                        <td className="px-4 py-2 text-slate-400">{t.species || "—"}</td>
                        <td className="px-4 py-2 text-center text-slate-400">{t.age_years?.toFixed(1)}</td>
                        <td className="px-4 py-2 text-center font-semibold text-emerald-400">
                          {t.co2_sequestered_kg?.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-center text-slate-300">
                          {t.co2_annual_avg_kg?.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-center text-slate-300">
                          {t.co2_annual_rate_sigmoid_kg?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-600 text-sm text-center py-4">No trees found for this forest.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}