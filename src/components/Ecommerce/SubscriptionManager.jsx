import React, { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import axiosInstance from '../../axiosInstance';

// =============================================================================
//  src/components/Ecommerce/SubscriptionManager.jsx — NOUVEAU (admin)
//  Route : /subscriptionmanager
//
//  Liste des abonnements de livraison, changement de statut, et le bouton de
//  secours « Generate due deliveries now » qui lance le cycle quotidien à la
//  main (utile si le planificateur ne tourne pas sur le serveur).
// =============================================================================

const TABS = ['all', 'pending', 'active', 'paused', 'cancelled'];

const STATUS_STYLE = {
  pending:   'bg-yellow-100 text-yellow-800',
  active:    'bg-green-100 text-green-800',
  paused:    'bg-slate-200 text-slate-700',
  cancelled: 'bg-red-100 text-red-700',
};

const fmt = (n, min = 0) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: min, maximumFractionDigits: 3 });
const everyLabel = (w) => (Number(w) === 1 ? 'Every week' : `Every ${w} weeks`);
const dateLabel = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB') : '—');

export default function SubscriptionManager() {
  const [tab, setTab] = useState('all');
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    axiosInstance.get('/api/subscriptions/admin', { params: { status: tab } })
      .then(res => setSubs(res.data))
      .catch(() => Swal.fire({ icon: 'error', title: 'Could not load subscriptions' }))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const runCycle = async () => {
    setRunning(true);
    try {
      const { data } = await axiosInstance.post('/api/subscriptions/admin/run-cycle');
      const s = data.stats || {};
      Swal.fire({
        icon: 'success', title: 'Daily cycle done',
        html: `Deliveries created: <b>${s.created ?? 0}</b><br/>
               Waiting for stock: <b>${s.waiting_stock ?? 0}</b><br/>
               Skipped (no stock): <b>${s.skipped ?? 0}</b><br/>
               Cancelled (unpaid): <b>${s.cancelled_unpaid ?? 0}</b>`,
      });
      load();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Cycle failed', text: err?.response?.data?.msg || 'Please try again.' });
    } finally {
      setRunning(false);
    }
  };

  const setStatus = async (sub, status) => {
    if (status === 'cancelled') {
      const ok = await Swal.fire({
        icon: 'warning', title: 'Cancel this subscription?', text: 'This cannot be undone.',
        showCancelButton: true, confirmButtonText: 'Cancel subscription', confirmButtonColor: '#b91c1c',
      });
      if (!ok.isConfirmed) return;
    }
    try {
      await axiosInstance.put(`/api/subscriptions/admin/${sub.id}/status`, { status });
      load();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Update failed', text: err?.response?.data?.msg || '' });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery subscriptions</h1>
          <p className="text-sm text-gray-500">
            Each delivery becomes a normal order in the Order manager once it is created.
          </p>
        </div>
        <button onClick={runCycle} disabled={running}
          className="px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-semibold">
          {running ? 'Running…' : 'Generate due deliveries now'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-sm capitalize border ${
              tab === t ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">#</th>
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-left px-4 py-3">Product</th>
              <th className="text-left px-4 py-3">Per delivery</th>
              <th className="text-left px-4 py-3">Frequency</th>
              <th className="text-left px-4 py-3">Next delivery</th>
              <th className="text-left px-4 py-3">Deliveries</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            )}
            {!loading && subs.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No subscription.</td></tr>
            )}
            {!loading && subs.map(s => {
              const paid = (s.orders || []).filter(o => ['paid', 'shipped', 'delivered'].includes(o.status)).length;
              return (
                <tr key={s.id} className="border-t border-gray-100 align-top">
                  <td className="px-4 py-3 text-gray-500">{s.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{s.customer_name || '—'}</div>
                    <div className="text-xs text-gray-500">{s.customer_phone}</div>
                    {s.customer_email && <div className="text-xs text-gray-500">{s.customer_email}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-900">{s.product_name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {fmt(s.quantity_kg)} kg
                    <div className="text-xs text-gray-500">≈ {fmt(s.estimated_total, 2)} {s.currency}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{everyLabel(s.frequency_weeks)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {s.status === 'active' ? dateLabel(s.next_delivery_date) : '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {paid} paid / {(s.orders || []).length}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLE[s.status] || ''}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                    {s.status === 'active' && (
                      <button onClick={() => setStatus(s, 'paused')} className="text-slate-600 hover:underline">Pause</button>
                    )}
                    {s.status === 'paused' && (
                      <button onClick={() => setStatus(s, 'active')} className="text-green-700 hover:underline">Resume</button>
                    )}
                    {s.status !== 'cancelled' && (
                      <button onClick={() => setStatus(s, 'cancelled')} className="text-red-600 hover:underline">Cancel</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}