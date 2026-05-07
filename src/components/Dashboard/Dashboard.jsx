/**
 * Dashboard.jsx — Admin Dashboard complet
 *
 * Métriques :
 *  - Résumé global (users, farms, forests, trees, acreage)
 *  - Farmers per account
 *  - Compliance EUDR per account
 *  - Farmers par pays + par région
 *  - Forêts par pays
 *  - GFW sessions / downloads
 *  - SMS statistics
 *  - Store summaries
 *  - Forest & tree statistics
 *
 * Export : CSV et PDF (généré côté backend)
 */

import React, { useEffect, useState, useCallback } from "react";
import axiosInstance from "../../axiosInstance";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  Tooltip, Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

// ─── Palette ──────────────────────────────────────────────────
const G = {
  dark:    "#0f2b12",
  main:    "#1a5e2a",
  mid:     "#2d8a45",
  light:   "#3aad5a",
  pale:    "#d0ead0",
  accent:  "#f0faf0",
  text:    "#1a2e1a",
  muted:   "#5a8a5a",
  danger:  "#c0392b",
  warn:    "#e67e22",
  info:    "#2980b9",
};

// ─── Composants UI locaux ─────────────────────────────────────

const Card = ({ title, children, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}>
    {title && (
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">
          {title}
        </h3>
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

const KpiCard = ({ label, value, sub, color = G.main }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">{label}</p>
    <p className="text-3xl font-bold" style={{ color }}>{value ?? "—"}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const StatBadge = ({ label, value, variant = "green" }) => {
  const colors = {
    green:  "bg-green-50 text-green-800 border-green-200",
    red:    "bg-red-50 text-red-700 border-red-200",
    blue:   "bg-blue-50 text-blue-700 border-blue-200",
    gray:   "bg-gray-50 text-gray-600 border-gray-200",
  };
  return (
    <div className={`rounded-lg border px-4 py-3 text-center ${colors[variant]}`}>
      <p className="text-xs uppercase tracking-wide opacity-70 mb-1">{label}</p>
      <p className="text-xl font-bold">{value ?? 0}</p>
    </div>
  );
};

const ProgressBar = ({ pct, color = G.main }) => (
  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
    <div
      className="h-1.5 rounded-full transition-all"
      style={{ width: `${Math.min(pct, 100)}%`, background: color }}
    />
  </div>
);

const Spinner = () => (
  <div className="flex items-center justify-center p-12">
    <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

// ─── Export helpers ───────────────────────────────────────────

const downloadBlob = (blob, filename) => {
  const url  = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href  = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [stats,        setStats]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [exporting,    setExporting]    = useState(null);  // 'csv' | 'pdf' | null
  const [activeTab,    setActiveTab]    = useState("overview");

  // ── Fetch ──────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [basicRes, adminRes] = await Promise.all([
        axiosInstance.get("/api/dashboard/entities/count"),
        axiosInstance.get("/api/dashboard/admin/full"),
      ]);
      setStats({ ...basicRes.data, ...adminRes.data });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ── Export CSV ─────────────────────────────────────────────
  const handleExportCsv = async () => {
    setExporting("csv");
    try {
      const res = await axiosInstance.get("/api/dashboard/admin/export/csv", {
        responseType: "blob",
      });
      downloadBlob(res.data, `admin_report_${Date.now()}.csv`);
    } catch {
      alert("CSV export failed.");
    } finally {
      setExporting(null);
    }
  };

  // ── Export PDF ─────────────────────────────────────────────
  const handleExportPdf = async () => {
    setExporting("pdf");
    try {
      const res = await axiosInstance.get("/api/dashboard/admin/export/pdf", {
        responseType: "blob",
      });
      downloadBlob(res.data, `admin_report_${Date.now()}.pdf`);
    } catch {
      alert("PDF export failed.");
    } finally {
      setExporting(null);
    }
  };

  // ── Render states ──────────────────────────────────────────
  if (loading) return <Spinner />;
  if (error)   return (
    <div className="p-8 text-center">
      <p className="text-red-500 mb-4">{error}</p>
      <button onClick={fetchStats}
        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">
        Retry
      </button>
    </div>
  );

  // ── Data shortcuts ─────────────────────────────────────────
  const entities      = stats.entities            || {};
  const usersByType   = stats.users_by_type        || {};
  const gfw           = stats.gfw_stats            || {};
  const sms           = stats.sms_stats            || {};
  const stores        = stats.store_summaries      || [];
  const farmersAcct   = stats.farmers_per_account  || [];
  const complianceAcct= stats.compliance_per_account || [];
  const countryData   = stats.farmers_per_country_region || { by_country: {}, by_region: {} };
  const forestsByCtry = stats.forests_per_country  || {};
  const forestTrees   = stats.forest_tree_stats    || [];
  const totalAcreage  = stats.total_acreage_ha     || 0;

  // ── Charts ─────────────────────────────────────────────────
  const userTypeChart = {
    labels:   Object.keys(usersByType),
    datasets: [{
      label: "Users",
      data:  Object.values(usersByType),
      backgroundColor: ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"],
      borderRadius: 6,
    }],
  };

  const countryChart = {
    labels:   Object.keys(countryData.by_region),
    datasets: [{
      data:            Object.values(countryData.by_region),
      backgroundColor: ["#22c55e","#16a34a","#15803d","#14532d","#052e16"],
    }],
  };

  const tabs = ["overview", "farmers", "compliance", "gfw & sms", "stores", "forests"];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── TOP BAR ────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800">Admin Dashboard</h1>
          <div className="flex gap-2">
            <button
              onClick={fetchStats}
              className="border border-gray-200 px-3 py-1.5 rounded-lg text-sm
                         hover:bg-gray-50 text-gray-600 transition-colors">
              ↻ Refresh
            </button>
            <button
              onClick={handleExportCsv}
              disabled={!!exporting}
              className="border border-green-200 bg-green-50 px-4 py-1.5 rounded-lg
                         text-sm text-green-700 hover:bg-green-100 transition-colors
                         disabled:opacity-50 font-medium">
              {exporting === "csv" ? "Exporting…" : "⬇ CSV"}
            </button>
            <button
              onClick={handleExportPdf}
              disabled={!!exporting}
              className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm
                         hover:bg-green-700 transition-colors disabled:opacity-50
                         font-medium shadow-sm">
              {exporting === "pdf" ? "Generating…" : "⬇ PDF Report"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6 flex gap-1 pb-0">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm capitalize border-b-2 transition-colors
                ${activeTab === tab
                  ? "border-green-600 text-green-700 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ══ TAB : OVERVIEW ══════════════════════════════════ */}
        {activeTab === "overview" && (
          <>
            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <KpiCard label="Total Users"    value={Object.values(usersByType).reduce((a, b) => a + b, 0)} />
              <KpiCard label="Total Farms"    value={entities.farms}    sub="registered" />
              <KpiCard label="Total Forests"  value={entities.forests}  sub="registered" />
              <KpiCard label="Total Trees"    value={entities.trees}    sub="registered" />
              <KpiCard label="Total Acreage"  value={`${totalAcreage} ha`} sub="GPS polygons + declared" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Users by Type">
                <div className="h-48">
                  <Bar data={userTypeChart}
                    options={{ responsive: true, maintainAspectRatio: false,
                               plugins: { legend: { display: false } } }} />
                </div>
              </Card>
              <Card title="Farms by Region">
                <div className="h-48">
                  <Doughnut data={countryChart}
                    options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBadge label="GFW Page Views"    value={gfw.total_page_views}    variant="green" />
              <StatBadge label="GFW Downloads"     value={gfw.total_pdf_downloads} variant="blue"  />
              <StatBadge label="SMS Sent"          value={sms.total_sent}          variant="blue"  />
              <StatBadge label="SMS Success Rate"  value={`${sms.success_rate_pct ?? 0}%`} variant="green" />
            </div>
          </>
        )}

        {/* ══ TAB : FARMERS ═══════════════════════════════════ */}
        {activeTab === "farmers" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Farmers by Country">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 text-xs uppercase">
                      <th className="pb-2">Country</th>
                      <th className="pb-2 text-right">Farms</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(countryData.by_country).map(([c, n]) => (
                      <tr key={c} className="border-t border-gray-50">
                        <td className="py-2 text-gray-700">{c}</td>
                        <td className="py-2 text-right font-semibold text-green-700">{n}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
              <Card title="Farmers by Region (District)">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 text-xs uppercase">
                      <th className="pb-2">Region</th>
                      <th className="pb-2 text-right">Farms</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(countryData.by_region).map(([r, n]) => (
                      <tr key={r} className="border-t border-gray-50">
                        <td className="py-2 text-gray-700">{r}</td>
                        <td className="py-2 text-right font-semibold text-green-700">{n}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>

            <Card title="Farmers per Account">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 text-xs uppercase border-b">
                      <th className="pb-3 pr-4">Account</th>
                      <th className="pb-3 pr-4">Type</th>
                      <th className="pb-3 pr-4 text-right">Farms</th>
                      <th className="pb-3 pr-4 text-right">Acreage (ha)</th>
                      <th className="pb-3 text-center">GPS Coverage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {farmersAcct.map(r => (
                      <tr key={r.user_id} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="py-3 pr-4">
                          <p className="font-medium text-gray-800">{r.company || r.username}</p>
                          <p className="text-xs text-gray-400">@{r.username}</p>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                            {r.user_type}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right font-bold text-gray-800">{r.farm_count}</td>
                        <td className="py-3 pr-4 text-right">
                          <span className="font-semibold text-green-700">{r.acreage_ha} ha</span>
                          {r.gps_farms > 0 && r.gps_farms < r.farm_count && (
                            <p className="text-xs text-gray-400">
                              {r.gps_farms} GPS · {r.farm_count - r.gps_farms} declared
                            </p>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          {r.farm_count === 0 ? (
                            <span className="text-gray-300 text-xs">—</span>
                          ) : r.gps_farms === r.farm_count ? (
                            <span className="inline-flex items-center gap-1 bg-green-100
                                             text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                              📍 100% GPS
                            </span>
                          ) : r.gps_farms === 0 ? (
                            <span className="inline-flex items-center gap-1 bg-gray-100
                                             text-gray-500 text-xs px-2 py-0.5 rounded-full">
                              ✏️ Declared
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-yellow-50
                                             text-yellow-700 text-xs px-2 py-0.5 rounded-full">
                              ⚡ {Math.round(r.gps_farms / r.farm_count * 100)}% GPS
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {/* ══ TAB : COMPLIANCE ════════════════════════════════ */}
        {activeTab === "compliance" && (
          <Card title="EUDR Compliance per Account">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs uppercase border-b">
                    <th className="pb-3 pr-4">Account</th>
                    <th className="pb-3 pr-4 text-right">Total</th>
                    <th className="pb-3 pr-4 text-right">Compliant</th>
                    <th className="pb-3 pr-4 text-right">Not Compliant</th>
                    <th className="pb-3">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {complianceAcct.map(r => (
                    <tr key={r.user_id} className="border-t border-gray-50 hover:bg-gray-50">
                      <td className="py-3 pr-4 font-medium text-gray-800">{r.username}</td>
                      <td className="py-3 pr-4 text-right text-gray-600">{r.total_farms}</td>
                      <td className="py-3 pr-4 text-right font-semibold text-green-600">{r.compliant}</td>
                      <td className="py-3 pr-4 text-right font-semibold text-red-500">{r.not_compliant}</td>
                      <td className="py-3 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-700 w-10">{r.rate_pct}%</span>
                          <ProgressBar pct={r.rate_pct} color={r.rate_pct >= 80 ? G.light : G.warn} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ══ TAB : GFW & SMS ═════════════════════════════════ */}
        {activeTab === "gfw & sms" && (
          <>
            <Card title="GFW Activity">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatBadge label="Total Page Views"     value={gfw.total_page_views}    variant="green" />
                <StatBadge label="Total PDF Downloads"  value={gfw.total_pdf_downloads} variant="blue"  />
                <StatBadge label="Certificates Issued"  value={gfw.total_certificates}  variant="green" />
                <StatBadge label="Sessions (All Time)"  value={gfw.total_sessions}      variant="green" />
                <StatBadge label="Views This Month"     value={gfw.monthly_page_views}  variant="blue"  />
                <StatBadge label="PDFs This Month"      value={gfw.monthly_pdf_downloads} variant="blue" />
              </div>
            </Card>
            <Card title="SMS Statistics">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatBadge label="Total Sent"      value={sms.total_sent}           variant="blue"  />
                <StatBadge label="Successful"      value={sms.successful}           variant="green" />
                <StatBadge label="Failed"          value={sms.failed}               variant="red"   />
                <StatBadge label="This Month"      value={sms.this_month}           variant="blue"  />
                <StatBadge label="Success Rate"    value={`${sms.success_rate_pct ?? 0}%`} variant="green" />
              </div>
            </Card>
          </>
        )}

        {/* ══ TAB : STORES ════════════════════════════════════ */}
        {activeTab === "stores" && (
          <Card title="Store Summaries">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs uppercase border-b">
                    <th className="pb-3 pr-4">Store</th>
                    <th className="pb-3 pr-4">Country</th>
                    <th className="pb-3 pr-4">Type</th>
                    <th className="pb-3 pr-4 text-right">Inventory</th>
                    <th className="pb-3 pr-4 text-right">Sales</th>
                    <th className="pb-3 pr-4 text-right">Revenue</th>
                    <th className="pb-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map(s => (
                    <tr key={s.id} className="border-t border-gray-50 hover:bg-gray-50">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.district}</p>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{s.country}</td>
                      <td className="py-3 pr-4">
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                          {s.store_type}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right text-gray-700">{s.inventory_count}</td>
                      <td className="py-3 pr-4 text-right text-gray-700">{s.sales_count}</td>
                      <td className="py-3 pr-4 text-right font-bold text-green-700">
                        {s.revenue.toLocaleString()}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                          ${s.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"}`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ══ TAB : FORESTS ═══════════════════════════════════ */}
        {activeTab === "forests" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Forests by Country">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 text-xs uppercase">
                      <th className="pb-2">Country</th>
                      <th className="pb-2 text-right">Forests</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(forestsByCtry).map(([c, n]) => (
                      <tr key={c} className="border-t border-gray-50">
                        <td className="py-2 text-gray-700">{c}</td>
                        <td className="py-2 text-right font-semibold text-green-700">{n}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
              <Card title="Summary">
                <div className="grid grid-cols-2 gap-3">
                  <StatBadge label="Total Forests" value={entities.forests} variant="green" />
                  <StatBadge label="Total Trees"   value={entities.trees}   variant="green" />
                </div>
              </Card>
            </div>

            <Card title="Forest & Tree Detail">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 text-xs uppercase border-b">
                      <th className="pb-3 pr-4">Forest</th>
                      <th className="pb-3 pr-4">Tree Type</th>
                      <th className="pb-3 pr-4">Country</th>
                      <th className="pb-3 pr-4 text-right">Trees</th>
                      <th className="pb-3 text-right">Area (ha)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forestTrees.map(r => (
                      <tr key={r.forest_id} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="py-3 pr-4 font-medium text-gray-800">{r.forest_name}</td>
                        <td className="py-3 pr-4 text-gray-600">{r.tree_type}</td>
                        <td className="py-3 pr-4 text-gray-600">{r.country || "—"}</td>
                        <td className="py-3 pr-4 text-right font-bold text-gray-800">{r.tree_count}</td>
                        <td className="py-3 text-right text-green-700 font-semibold">
                          {r.area_ha != null ? `${r.area_ha} ha` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

      </div>
    </div>
  );
}