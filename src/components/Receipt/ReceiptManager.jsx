// ── RECEIPT MANAGER ───────────────────────────────────────────────────────────
// Find a receipt, read it, release goods against it, cancel it, reprint it.
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';
import {
  FileText, Search, X, Loader2, AlertTriangle, Plus, Printer, PackageOpen,
  ChevronLeft, ChevronRight, ExternalLink, Ban,
} from 'lucide-react';
import { PrintableReceipt } from './ReceiptReception';

const fmt = (n, d = 0) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: 3 });

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB',
  { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const STATUS_STYLE = {
  issued:             'bg-emerald-50 text-emerald-700 border-emerald-200',
  pledged:            'bg-blue-50 text-blue-700 border-blue-200',
  partially_released: 'bg-amber-50 text-amber-700 border-amber-200',
  released:           'bg-gray-100 text-gray-500 border-gray-200',
  sold:               'bg-gray-100 text-gray-500 border-gray-200',
  cancelled:          'bg-red-50 text-red-600 border-red-200',
};

const STATUS_LABEL = {
  issued: 'Issued', pledged: 'Pledged', partially_released: 'Partly released',
  released: 'Released', sold: 'Sold', cancelled: 'Cancelled',
};

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'issued', label: 'Held' },
  { id: 'partially_released', label: 'Partly released' },
  { id: 'pledged', label: 'Pledged' },
  { id: 'released', label: 'Released' },
  { id: 'cancelled', label: 'Cancelled' },
];

const StatusPill = ({ status }) => (
  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[status] || STATUS_STYLE.released}`}>
    {STATUS_LABEL[status] || status}
  </span>
);

const ReceiptManager = () => {
  const [items,      setItems]      = useState([]);
  const [meta,       setMeta]       = useState({ total: 0, pages: 1 });
  const [page,       setPage]       = useState(1);
  const [status,     setStatus]     = useState('all');
  const [storeId,    setStoreId]    = useState('');
  const [search,     setSearch]     = useState('');
  const [query,      setQuery]      = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [detail,     setDetail]     = useState(null);     // full receipt, for printing
  const [busy,       setBusy]       = useState(false);

  useEffect(() => {
    axiosInstance.get('/api/store/', { params: { store_type: 'warehouse', per_page: 100 } })
      .then(r => setWarehouses(r.data.stores ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setQuery(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchReceipts = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await axiosInstance.get('/api/receipts/', {
        params: {
          page, per_page: 20,
          status: status === 'all' ? undefined : status,
          store_id: storeId || undefined,
          q: query || undefined,
        },
      });
      setItems(data.items ?? []);
      setMeta({ total: data.total ?? 0, pages: data.pages ?? 1 });
    } catch (err) {
      setError(err.response?.data?.message || 'Receipts could not be loaded.');
    } finally { setLoading(false); }
  }, [page, status, storeId, query]);

  useEffect(() => { fetchReceipts(); }, [fetchReceipts]);

  const openDetail = async (receipt) => {
    try {
      const { data } = await axiosInstance.get(`/api/receipts/${receipt.id}`);
      setDetail(data);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Could not open the receipt',
        text: err.response?.data?.message || err.message, customClass: { popup: 'rounded-2xl' } });
    }
  };

  const release = async (receipt) => {
    const { value, isConfirmed } = await Swal.fire({
      title: `Release goods from ${receipt.serial}?`,
      text: `${fmt(receipt.remaining_weight_kg)} kg are still held. Leave empty to release everything.`,
      input: 'number',
      inputPlaceholder: 'Weight in kg',
      showCancelButton: true,
      confirmButtonText: 'Release',
      confirmButtonColor: '#d97706',
      customClass: { popup: 'rounded-2xl' },
    });
    if (!isConfirmed) return;

    setBusy(true);
    try {
      const body = value ? { weight_kg: Number(value) } : {};
      const { data } = await axiosInstance.post(`/api/receipts/${receipt.id}/release`, body);
      await fetchReceipts();
      Swal.fire({ icon: 'success', title: data.message, timer: 2000,
        showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Not released',
        text: err.response?.data?.message || err.message, customClass: { popup: 'rounded-2xl' } });
    } finally { setBusy(false); }
  };

  const cancel = async (receipt) => {
    const { value, isConfirmed } = await Swal.fire({
      title: `Cancel ${receipt.serial}?`,
      text: 'The receipt stays on record, marked cancelled.',
      input: 'text',
      inputPlaceholder: 'Reason',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Cancel receipt',
      confirmButtonColor: '#ef4444',
      customClass: { popup: 'rounded-2xl' },
    });
    if (!isConfirmed) return;

    try {
      await axiosInstance.post(`/api/receipts/${receipt.id}/cancel`, { note: value || null });
      await fetchReceipts();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Not cancelled',
        text: err.response?.data?.message || err.message, customClass: { popup: 'rounded-2xl' } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50/20 p-4 sm:p-6 light-panel">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileText size={22} className="text-amber-600"/> Warehouse Receipts
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">{meta.total} receipt{meta.total !== 1 ? 's' : ''}</p>
          </div>
          <Link to="/receipts/new"
            className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm px-4 py-2 rounded-xl font-medium shadow-sm transition-colors">
            <Plus size={15}/> Receive a delivery
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-4 shadow-sm overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setStatus(t.id); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
              ${status === t.id ? 'bg-amber-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Search size={16}/></span>
          <input type="text" placeholder="Serial, depositor or reference…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"/>
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={16}/></button>}
        </div>
        <select value={storeId} onChange={e => { setStoreId(e.target.value); setPage(1); }}
          className="sm:w-60 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400">
          <option value="">All warehouses</option>
          {warehouses.map(w => <option key={w.id} value={w.id}>{w.code ? `${w.code} — ` : ''}{w.name}</option>)}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
          <AlertTriangle size={15}/> {error}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-amber-600"/></div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <FileText size={40} className="mx-auto mb-3 text-gray-300"/>
          <p className="text-gray-500 font-medium">No receipt matches these filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all p-4 sm:p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <span className="font-mono text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-2.5 py-2 flex-shrink-0">
                    {r.serial}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 flex-wrap">
                      {r.depositor_name}
                      <StatusPill status={r.status}/>
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {[r.commodity, r.variety, r.grade && `Grade ${r.grade}`].filter(Boolean).join(' · ')}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {r.warehouse_code ? `${r.warehouse_code} · ` : ''}{r.warehouse_name} · {fmtDate(r.received_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-5 flex-wrap">
                  <div className="text-right">
                    <p className="font-mono text-sm text-gray-800">{fmt(r.remaining_weight_kg)} kg</p>
                    <p className="text-xs text-gray-400">of {fmt(r.net_weight_kg)} kg</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => openDetail(r)}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200">
                      <Printer size={12}/> Open
                    </button>
                    <a href={`/verify/${r.serial}`} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                      <ExternalLink size={12}/> Verify
                    </a>
                    {['issued', 'partially_released'].includes(r.status) && (
                      <button onClick={() => release(r)} disabled={busy}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200">
                        <PackageOpen size={12}/> Release
                      </button>
                    )}
                    {['issued', 'partially_released'].includes(r.status) && (
                      <button onClick={() => cancel(r)}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-red-50 text-red-700 hover:bg-red-100 border-red-200">
                        <Ban size={12}/> Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.pages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-5">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 disabled:opacity-40">
            <ChevronLeft size={16}/>
          </button>
          <span className="text-sm text-gray-500">Page {page} of {meta.pages}</span>
          <button onClick={() => setPage(p => Math.min(meta.pages, p + 1))} disabled={page === meta.pages}
            className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 disabled:opacity-40">
            <ChevronRight size={16}/>
          </button>
        </div>
      )}

      {detail && <PrintableReceipt receipt={detail} onClose={() => setDetail(null)}/>}
    </div>
  );
};

export default ReceiptManager;