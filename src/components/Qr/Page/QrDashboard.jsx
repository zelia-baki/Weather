import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  QrCode, Package, Layers, Users, Search, RefreshCw,
  ChevronDown, ChevronUp, Loader2, Inbox,
} from "lucide-react";
import axiosInstance from "../../../axiosInstance";

// Palette cohérente avec le reste de l'app (teal)
const TYPE_COLORS = ["#0d9488", "#14b8a6", "#2dd4bf", "#0891b2", "#7c3aed", "#f59e0b", "#ef4444"];

const StatCard = ({ icon: Icon, label, value, sub }) => (
  <div className="bg-white rounded-xl shadow-lg p-5 flex items-start gap-4">
    <div className="bg-teal-50 text-teal-600 rounded-lg p-3 shrink-0">
      <Icon size={22} />
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-bold text-gray-800 leading-tight">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const QrDashboard = () => {
  const [scope, setScope]           = useState("mine");   // 'mine' | 'all'
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Lookup d'un lot précis (description -> batches)
  const [lotQuery, setLotQuery]       = useState("");
  const [lotResults, setLotResults]   = useState(null);
  const [lotLoading, setLotLoading]   = useState(false);
  const [lotOpen, setLotOpen]         = useState(false);

  const fetchDashboard = useCallback(async (currentScope) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get("/api/qrcode/dashboard", {
        params: { scope: currentScope, limit: 50 },
      });
      setData(res.data);
      // Si le backend a rétrogradé le scope (utilisateur non admin), on resynchronise l'UI
      if (res.data.scope !== currentScope) setScope(res.data.scope);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les statistiques QR.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(scope);
  }, [scope, fetchDashboard]);

  const handleLotSearch = async (e) => {
    e.preventDefault();
    if (!lotQuery.trim()) return;
    setLotLoading(true);
    setLotOpen(true);
    try {
      const res = await axiosInstance.get("/api/qrcode/stats/by_description", {
        params: { description: lotQuery.trim(), scope },
      });
      setLotResults(res.data);
    } catch (err) {
      console.error(err);
      setLotResults([]);
    } finally {
      setLotLoading(false);
    }
  };

  const byTypeChartData = useMemo(() => {
    if (!data?.by_type) return [];
    return Object.entries(data.by_type).map(([type, count]) => ({ name: type, value: count }));
  }, [data]);

  const topLotsChartData = useMemo(() => {
    if (!data?.top_lots) return [];
    return data.top_lots.map((l) => ({
      name: l.description.length > 22 ? l.description.slice(0, 22) + "…" : l.description,
      full: l.description,
      count: l.count,
    }));
  }, [data]);

  const filteredRecent = useMemo(() => {
    if (!data?.recent) return [];
    return data.recent.filter((qr) => {
      const matchesSearch = !search ||
        (qr.description || "").toLowerCase().includes(search.toLowerCase()) ||
        (qr.hash || "").toLowerCase().includes(search.toLowerCase());
      const matchesType = !typeFilter || qr.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [data, search, typeFilter]);

  const availableTypes = useMemo(() => Object.keys(data?.by_type || {}), [data]);

  return (
    <div className="bg-gradient-to-br from-teal-50 via-white to-blue-50 min-h-screen py-8 light-panel">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-teal-700 flex items-center gap-3">
              <QrCode size={32} />
              QR Code Dashboard
            </h1>
            <p className="text-gray-500 mt-1">
              Suivi des codes QR générés (produce, conservation, export, fertilizer).
            </p>
          </div>

          <div className="flex items-center gap-3">
            {data?.is_admin && (
              <div className="bg-white rounded-lg shadow p-1 flex text-sm font-medium">
                <button
                  onClick={() => setScope("mine")}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    scope === "mine" ? "bg-teal-600 text-white" : "text-gray-500 hover:text-teal-700"
                  }`}
                >
                  Mes QR
                </button>
                <button
                  onClick={() => setScope("all")}
                  className={`px-4 py-2 rounded-md transition-colors flex items-center gap-1.5 ${
                    scope === "all" ? "bg-teal-600 text-white" : "text-gray-500 hover:text-teal-700"
                  }`}
                >
                  <Users size={14} /> Tous les utilisateurs
                </button>
              </div>
            )}
            <button
              onClick={() => fetchDashboard(scope)}
              disabled={loading}
              className="bg-white shadow rounded-lg p-2.5 text-teal-600 hover:bg-teal-50 disabled:opacity-50 transition-colors"
              title="Rafraîchir"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Loading / Error */}
        {loading && !data && (
          <div className="flex items-center justify-center py-24 text-teal-600">
            <Loader2 size={32} className="animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 mb-6">
            {error}
          </div>
        )}

        {data && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={QrCode}
                label="QR codes générés"
                value={data.total_count}
                sub={scope === "all" ? "Tous les utilisateurs" : "Vos QR uniquement"}
              />
              <StatCard
                icon={Layers}
                label="Lots distincts"
                value={data.distinct_lots}
                sub="Regroupés par description"
              />
              <StatCard
                icon={Package}
                label="Types de QR"
                value={availableTypes.length}
                sub={availableTypes.join(", ") || "—"}
              />
              <StatCard
                icon={Package}
                label="Type le plus utilisé"
                value={
                  byTypeChartData.length
                    ? byTypeChartData.reduce((a, b) => (b.value > a.value ? b : a)).name
                    : "—"
                }
                sub={
                  byTypeChartData.length
                    ? `${byTypeChartData.reduce((a, b) => (b.value > a.value ? b : a)).value} codes`
                    : ""
                }
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-teal-700 mb-4">Répartition par type</h3>
                {byTypeChartData.length === 0 ? (
                  <p className="text-gray-400 text-sm py-10 text-center">Aucune donnée pour le moment.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={byTypeChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {byTypeChartData.map((_, i) => (
                          <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-teal-700 mb-4">Top 10 des lots (par description)</h3>
                {topLotsChartData.length === 0 ? (
                  <p className="text-gray-400 text-sm py-10 text-center">Aucun lot pour le moment.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={topLotsChartData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v, n, p) => [v, p.payload.full]} />
                      <Bar dataKey="count" fill="#0d9488" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Lookup par lot */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <button
                onClick={() => setLotOpen((o) => !o)}
                className="w-full flex items-center justify-between text-left"
              >
                <h3 className="text-lg font-semibold text-teal-700">Rechercher un lot précis</h3>
                {lotOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
              </button>

              {lotOpen && (
                <div className="mt-4">
                  <form onSubmit={handleLotSearch} className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={lotQuery}
                      onChange={(e) => setLotQuery(e.target.value)}
                      placeholder="Description exacte du lot (ex: Digital receipt for produce transaction.)"
                      className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm
                                 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                    />
                    <button
                      type="submit"
                      className="bg-teal-600 text-white px-5 py-2.5 rounded-lg font-medium
                                 hover:bg-teal-700 transition-colors flex items-center gap-2"
                    >
                      <Search size={16} /> Chercher
                    </button>
                  </form>

                  {lotLoading && (
                    <div className="flex justify-center py-6 text-teal-600">
                      <Loader2 size={22} className="animate-spin" />
                    </div>
                  )}

                  {!lotLoading && lotResults && lotResults.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-6">
                      Aucun QR trouvé pour cette description.
                    </p>
                  )}

                  {!lotLoading && lotResults && lotResults.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-400 text-xs uppercase border-b">
                            <th className="pb-2">Batch #</th>
                            <th className="pb-2">Hash</th>
                            <th className="pb-2">Créé le</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lotResults.map((r) => (
                            <tr key={r.hash} className="border-t border-gray-50">
                              <td className="py-2 font-semibold text-teal-700">{r.batch_number ?? "—"}</td>
                              <td className="py-2 text-gray-500 font-mono text-xs">{r.hash}</td>
                              <td className="py-2 text-gray-600">
                                {new Date(r.created_at).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Table des QR récents */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="text-lg font-semibold text-teal-700">
                  QR récents {scope === "all" ? "(tous utilisateurs)" : ""}
                </h3>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Rechercher (lot, hash)…"
                      className="pl-9 pr-3 py-2 border-2 border-gray-200 rounded-lg text-sm
                                 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                    />
                  </div>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="border-2 border-gray-200 rounded-lg text-sm px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-teal-400"
                  >
                    <option value="">Tous les types</option>
                    {availableTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredRecent.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Inbox size={32} className="mb-2" />
                  <p className="text-sm">Aucun QR ne correspond à ces critères.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-400 text-xs uppercase border-b">
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Lot / Description</th>
                        <th className="pb-2">Batch #</th>
                        {scope === "all" && <th className="pb-2">Créé par</th>}
                        <th className="pb-2">Créé le</th>
                        <th className="pb-2">Hash</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecent.map((qr) => (
                        <tr key={qr.hash} className="border-t border-gray-50 hover:bg-teal-50/40">
                          <td className="py-2">
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                              {qr.type || "unknown"}
                            </span>
                          </td>
                          <td className="py-2 text-gray-700 max-w-xs truncate" title={qr.description}>
                            {qr.description || "—"}
                          </td>
                          <td className="py-2 font-semibold text-teal-700">{qr.batch_number ?? "—"}</td>
                          {scope === "all" && (
                            <td className="py-2 text-gray-600">{qr.created_by_username || `#${qr.created_by}`}</td>
                          )}
                          <td className="py-2 text-gray-600">{new Date(qr.created_at).toLocaleString()}</td>
                          <td className="py-2 text-gray-400 font-mono text-xs">{qr.hash.slice(0, 10)}…</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QrDashboard;