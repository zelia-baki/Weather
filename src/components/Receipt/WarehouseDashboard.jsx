// ── WAREHOUSE DASHBOARD ───────────────────────────────────────────────────────
// Daily inputs and outputs, what is held right now, and how full the store is.
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../axiosInstance';
import { Bar } from 'react-chartjs-2';
import {
  Warehouse, ArrowDownToLine, ArrowUpFromLine, Scale, Loader2, AlertTriangle,
  FileText, Users, Package,
} from 'lucide-react';

const fmt = (n, d = 0) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: 1 });

const tonnes = (kg) => `${fmt((kg || 0) / 1000, 1)} t`;

const Card = ({ icon, label, value, sub, tone = 'gray' }) => {
  const tones = {
    gray:    'bg-white border-gray-100',
    green:   'bg-emerald-50 border-emerald-200',
    amber:   'bg-amber-50 border-amber-200',
    blue:    'bg-blue-50 border-blue-200',
  };
  return (
    <div className={`rounded-2xl border shadow-sm p-5 ${tones[tone]}`}>
      <div className="flex items-center gap-2 text-gray-400 mb-2">{icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
};

const WarehouseDashboard = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [storeId,    setStoreId]    = useState('');
  const [days,       setDays]       = useState(30);
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  useEffect(() => {
    axiosInstance.get('/api/store/', { params: { store_type: 'warehouse', per_page: 100 } })
      .then(r => setWarehouses(r.data.stores ?? [])).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await axiosInstance.get('/api/warehouse/dashboard', {
        params: { store_id: storeId || undefined, days },
      });
      setData(data);
    } catch (err) {
      setError(err.response?.data?.message || 'The dashboard could not be loaded.');
    } finally { setLoading(false); }
  }, [storeId, days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Chart ───────────────────────────────────────────────────────────────────
  const chart = useMemo(() => {
    if (!data?.flows) return null;
    const labels = data.flows.map(f =>
      new Date(f.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }));
    return {
      data: {
        labels,
        datasets: [
          {
            label: 'Received',
            data: data.flows.map(f => f.in),
            backgroundColor: 'rgba(16,185,129,0.75)',
            borderRadius: 4,
            barPercentage: 0.9,
          },
          {
            // Shown below the axis: in and out never get confused at a glance.
            label: 'Released',
            data: data.flows.map(f => -f.out),
            backgroundColor: 'rgba(217,119,6,0.75)',
            borderRadius: 4,
            barPercentage: 0.9,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 8 } },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8, padding: 16,
              color: '#6b7280', font: { size: 12 } },
          },
          tooltip: {
            backgroundColor: 'rgba(255,255,255,0.97)',
            titleColor: '#111827', bodyColor: '#374151',
            borderColor: '#e5e7eb', borderWidth: 1,
            padding: 12, cornerRadius: 10, usePointStyle: true,
            callbacks: {
              label: ctx => `  ${ctx.dataset.label}: ${fmt(Math.abs(ctx.parsed.y))} kg`,
            },
          },
        },
        scales: {
          x: { stacked: true, grid: { display: false }, border: { display: false },
               ticks: { color: '#9ca3af', font: { size: 11 }, maxRotation: 0, autoSkipPadding: 18 } },
          y: { stacked: true, grid: { color: 'rgba(156,163,175,0.15)' }, border: { display: false },
               ticks: { color: '#9ca3af', font: { size: 11 },
                 callback: v => `${fmt(Math.abs(v))}` } },
        },
      },
    };
  }, [data]);

  const capacity = data?.capacity;
  const today = data?.today;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50/20 p-4 sm:p-6 light-panel">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Warehouse size={22} className="text-amber-600"/> Warehouse Dashboard
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {data?.warehouse
                ? `${data.warehouse.code ? `${data.warehouse.code} · ` : ''}${data.warehouse.name} — ${data.warehouse.district}, ${data.warehouse.country}`
                : 'Every warehouse combined'}
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <select value={storeId} onChange={e => setStoreId(e.target.value)}
              className="sm:w-56 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400">
              <option value="">All warehouses</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.code ? `${w.code} — ` : ''}{w.name}</option>
              ))}
            </select>
            <select value={days} onChange={e => setDays(Number(e.target.value))}
              className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400">
              {[7, 30, 90, 180].map(d => <option key={d} value={d}>Last {d} days</option>)}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
          <AlertTriangle size={15}/> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-amber-600"/></div>
      ) : data && (
        <>
          {/* Today */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <Card tone="green" icon={<ArrowDownToLine size={14}/>} label="Received today"
              value={`${fmt(today.received_kg)} kg`} sub={tonnes(today.received_kg)}/>
            <Card tone="amber" icon={<ArrowUpFromLine size={14}/>} label="Released today"
              value={`${fmt(today.released_kg)} kg`} sub={tonnes(today.released_kg)}/>
            <Card tone="blue" icon={<Scale size={14}/>} label="Currently held"
              value={`${fmt(capacity.held_kg)} kg`} sub={tonnes(capacity.held_kg)}/>
            <Card icon={<Package size={14}/>} label="Capacity used"
              value={capacity.usage_percent != null ? `${capacity.usage_percent} %` : '—'}
              sub={capacity.capacity_kg
                ? `${fmt(capacity.free_kg)} kg free of ${tonnes(capacity.capacity_kg)}`
                : 'No capacity recorded'}/>
          </div>

          {/* Capacity bar */}
          {capacity.capacity_kg && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Storage used</span>
                <span className="font-semibold text-gray-800">
                  {fmt(capacity.held_kg)} / {fmt(capacity.capacity_kg)} kg
                </span>
              </div>
              <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${
                  capacity.usage_percent > 90 ? 'bg-red-500'
                    : capacity.usage_percent > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, capacity.usage_percent || 0)}%` }}/>
              </div>
              {capacity.usage_percent > 90 && (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1.5">
                  <AlertTriangle size={12}/> Nearly full — new deliveries may be refused.
                </p>
              )}
            </div>
          )}

          {/* Flows */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
            <h2 className="font-semibold text-gray-800 text-sm">Daily movement</h2>
            <p className="text-xs text-gray-400 mt-0.5 mb-4">
              Bars above the line are deliveries received, bars below are goods released.
            </p>
            <div className="h-72">
              {chart && <Bar data={chart.data} options={chart.options}/>}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            {/* Stock */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-800 text-sm mb-1">What is held right now</h2>
              <p className="text-xs text-gray-400 mb-4">By commodity, variety and grade.</p>

              {data.stock.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">Nothing in store.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                        <th className="pb-2 font-semibold">Commodity</th>
                        <th className="pb-2 font-semibold">Variety</th>
                        <th className="pb-2 font-semibold">Grade</th>
                        <th className="pb-2 font-semibold text-right">Receipts</th>
                        <th className="pb-2 font-semibold text-right">Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.stock.map((line, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-2.5 font-medium text-gray-800">{line.commodity}</td>
                          <td className="py-2.5 text-gray-500">{line.variety || '—'}</td>
                          <td className="py-2.5 text-gray-500">{line.grade || '—'}</td>
                          <td className="py-2.5 text-right text-gray-500">{line.receipts}</td>
                          <td className="py-2.5 text-right font-mono text-gray-800">{fmt(line.weight_kg)} kg</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Depositors */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-fit">
              <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2 mb-1">
                <Users size={15} className="text-amber-600"/> Main depositors
              </h2>
              <p className="text-xs text-gray-400 mb-4">Last 90 days, by weight delivered.</p>

              {data.top_depositors.length === 0 ? (
                <p className="text-sm text-gray-400">No delivery yet.</p>
              ) : (
                <div className="space-y-3">
                  {data.top_depositors.map((d, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{d.name}</p>
                        <p className="text-xs text-gray-400">{d.receipts} receipt{d.receipts !== 1 ? 's' : ''}</p>
                      </div>
                      <span className="font-mono text-sm text-gray-700 whitespace-nowrap">{fmt(d.weight_kg)} kg</span>
                    </div>
                  ))}
                </div>
              )}

              <Link to="/receipts"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:underline">
                <FileText size={14}/> Open the receipts
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WarehouseDashboard;