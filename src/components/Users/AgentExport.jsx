import React, { useState, useEffect, useCallback } from "react";
import { Download, RefreshCw, Loader2, Users, FileText } from "lucide-react";
import axiosInstance from "../../axiosInstance";

const AgentExport = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportingRevenue, setExportingRevenue] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const { data } = await axiosInstance.get("/api/gfw/admin/agents/summary", { params });
      setAgents(data.agents || []);
    } catch (err) {
      setError(err.response?.data?.error || "Impossible de charger les statistiques agents.");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const downloadCsv = async (endpoint, filename) => {
    const params = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    const res = await axiosInstance.get(endpoint, { params, responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadCsv("/api/gfw/admin/agents/export", "agent_submissions.csv");
    } catch {
      alert("Export CSV échoué.");
    } finally {
      setExporting(false);
    }
  };

  // ✅ NOUVEAU : export séparé des paiements réussis par agent (montant figé
  // au moment du paiement) — le nombre de rapports seul ne suffit pas pour
  // la comptabilité puisque le prix des features peut varier dans le temps.
  const handleExportRevenue = async () => {
    setExportingRevenue(true);
    try {
      await downloadCsv("/api/gfw/admin/agents/export-revenue", "agent_revenue.csv");
    } catch {
      alert("Export CSV échoué.");
    } finally {
      setExportingRevenue(false);
    }
  };

  const totalSubmissions = agents.reduce((sum, a) => sum + a.total, 0);

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Users size={28} className="text-teal-600" />
              Agent Submissions
            </h1>
            <p className="text-gray-500 mt-1">
              Soumissions guest (EUDR / Carbon / NDVI) et montants facturés, regroupés par agent_id, pour suivi terrain et commissions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchSummary}
              disabled={loading}
              className="bg-white shadow rounded-lg p-2.5 text-teal-600 hover:bg-teal-50 disabled:opacity-50 transition-colors"
              title="Rafraîchir"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={handleExport}
              disabled={exporting || agents.length === 0}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50
                         text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
            >
              <Download size={16} />
              {exporting ? "Export en cours…" : "Export CSV"}
            </button>
            <button
              onClick={handleExportRevenue}
              disabled={exportingRevenue || agents.length === 0}
              title="Paiements réussis par agent, montant figé au moment du paiement"
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50
                         text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
            >
              <Download size={16} />
              {exportingRevenue ? "Export en cours…" : "Export Revenue CSV"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Du</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Au</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
          <div className="ml-auto text-sm text-gray-500">
            <span className="font-semibold text-gray-800">{agents.length}</span> agents ·{" "}
            <span className="font-semibold text-gray-800">{totalSubmissions}</span> soumissions
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-teal-600">
            <Loader2 size={32} className="animate-spin" />
          </div>
        ) : agents.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center text-gray-400">
            <FileText size={32} className="mx-auto mb-2" />
            Aucune soumission avec agent_id sur cette période.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs uppercase text-gray-500">
                  <th className="px-5 py-3">Agent ID</th>
                  <th className="px-5 py-3 text-center">EUDR</th>
                  <th className="px-5 py-3 text-center">Carbon</th>
                  <th className="px-5 py-3 text-center">NDVI</th>
                  <th className="px-5 py-3 text-center">Total</th>
                  <th className="px-5 py-3 text-right">Montant facturé</th>
                  <th className="px-5 py-3">Dernière soumission</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.agent_id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">{a.agent_id}</td>
                    <td className="px-5 py-3 text-center text-gray-600">{a.by_action?.guest_eudr_pdf || 0}</td>
                    <td className="px-5 py-3 text-center text-gray-600">{a.by_action?.guest_carbon_pdf || 0}</td>
                    <td className="px-5 py-3 text-center text-gray-600">{a.by_action?.guest_sentinel_report || 0}</td>
                    <td className="px-5 py-3 text-center font-semibold text-teal-700">{a.total}</td>
                    <td className="px-5 py-3 text-right font-semibold text-amber-700">
                      {a.amount_by_currency && Object.keys(a.amount_by_currency).length > 0
                        ? Object.entries(a.amount_by_currency)
                            .map(([cur, amt]) => `${amt.toLocaleString()} ${cur}`)
                            .join(" · ")
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {a.last_submission ? new Date(a.last_submission).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentExport;
