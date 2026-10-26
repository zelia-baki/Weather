// ── WAREHOUSE MANAGER ─────────────────────────────────────────────────────────
// src/components/Receipt/WarehouseManager.jsx — NOUVEAU
// Route : /2tume/warehouses
//
// Créer et modifier les entrepôts de la bourse : code, capacité, marchandises
// acceptées, et la CERTIFICATION (admin uniquement) — sans elle, un entrepôt
// ne peut pas émettre de reçus.
import React, { useCallback, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import Swal from 'sweetalert2';
import axiosInstance from '../../axiosInstance';
import {
  Warehouse, Plus, Pencil, ShieldCheck, ShieldOff, Loader2, X, AlertTriangle,
} from 'lucide-react';

const EMPTY = {
  name: '', code: '', location: '', district: '', country: 'Uganda',
  phone_number: '', email: '', capacity_tonnes: '', accepted_crop_ids: [],
  status: true, is_certified: false,
};

const inputCls = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white text-gray-800 outline-none focus:ring-2 focus:ring-amber-400';

const Field = ({ label, required, hint, children }) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
      {label}{required && <span className="text-red-400"> *</span>}
    </span>
    {children}
    {hint && <span className="text-xs text-gray-400">{hint}</span>}
  </label>
);

const isAdminUser = () => {
  try { return !!jwtDecode(localStorage.getItem('token') || '').sub?.is_admin; }
  catch { return false; }
};

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 1 });

export default function WarehouseManager() {
  const [warehouses, setWarehouses] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);     // null | 'new' | store object
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isAdmin = isAdminUser();

  const load = useCallback(() => {
    setLoading(true);
    axiosInstance.get('/api/store/', { params: { store_type: 'warehouse', per_page: 100 } })
      .then(r => setWarehouses(r.data.stores ?? []))
      .catch(() => setWarehouses([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    axiosInstance.get('/api/crop/').then(r => setCrops(r.data.crops ?? [])).catch(() => {});
  }, [load]);

  const openNew = () => { setForm(EMPTY); setError(''); setEditing('new'); };
  const openEdit = (w) => {
    setForm({
      ...EMPTY, ...w,
      code: w.code || '', phone_number: w.phone_number || '', email: w.email || '',
      capacity_tonnes: w.capacity_tonnes ?? '', accepted_crop_ids: w.accepted_crop_ids || [],
    });
    setError(''); setEditing(w);
  };

  const toggleCrop = (id) => setForm(f => ({
    ...f,
    accepted_crop_ids: f.accepted_crop_ids.includes(id)
      ? f.accepted_crop_ids.filter(c => c !== id)
      : [...f.accepted_crop_ids, id],
  }));

  const save = async () => {
    if (!form.name.trim() || !form.location.trim() || !form.district.trim() || !form.country.trim()) {
      setError('Name, location, district and country are required.');
      return;
    }
    setSaving(true); setError('');
    const payload = { ...form, store_type: 'warehouse' };
    if (!isAdmin) delete payload.is_certified;
    try {
      if (editing === 'new') await axiosInstance.post('/api/store/create', payload);
      else await axiosInstance.put(`/api/store/${editing.id}/edit`, payload);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.response?.data?.msg || 'The warehouse could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const toggleCertified = async (w) => {
    const certify = !w.is_certified;
    const ok = await Swal.fire({
      icon: certify ? 'question' : 'warning',
      title: certify ? `Certify ${w.name}?` : `Remove certification from ${w.name}?`,
      text: certify
        ? 'A certified warehouse can issue warehouse receipts.'
        : 'It will no longer be able to issue new receipts. Existing receipts stay valid.',
      showCancelButton: true,
      confirmButtonText: certify ? 'Certify' : 'Remove certification',
      confirmButtonColor: certify ? '#d97706' : '#b91c1c',
    });
    if (!ok.isConfirmed) return;
    try {
      await axiosInstance.put(`/api/store/${w.id}/edit`, { is_certified: certify });
      load();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Update failed', text: err.response?.data?.msg || '' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50/20 p-4 sm:p-6 light-panel">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Warehouse size={22} className="text-amber-600"/> Warehouses
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Only a certified, active warehouse can issue receipts.
          </p>
        </div>
        <button onClick={openNew}
          className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm px-4 py-2.5 rounded-xl font-semibold">
          <Plus size={15}/> New warehouse
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Code</th>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Location</th>
              <th className="text-left px-4 py-3">Capacity</th>
              <th className="text-left px-4 py-3">Commodities</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                <Loader2 size={18} className="animate-spin inline"/>
              </td></tr>
            )}
            {!loading && warehouses.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                No warehouse yet. Create the first one.
              </td></tr>
            )}
            {!loading && warehouses.map(w => (
              <tr key={w.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-mono text-gray-800">{w.code || '—'}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{w.name}</td>
                <td className="px-4 py-3 text-gray-600">{w.district}, {w.country}</td>
                <td className="px-4 py-3 text-gray-600">
                  {w.capacity_tonnes != null ? `${fmt(w.capacity_tonnes)} t` : '—'}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {w.accepted_crops?.length ? w.accepted_crops.join(', ') : 'All'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      w.is_certified ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500'}`}>
                      {w.is_certified ? 'Certified' : 'Not certified'}
                    </span>
                    {w.status === false && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Inactive</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap space-x-3">
                  <button onClick={() => openEdit(w)} className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1">
                    <Pencil size={13}/> Edit
                  </button>
                  {isAdmin && (
                    <button onClick={() => toggleCertified(w)}
                      className={`inline-flex items-center gap-1 ${w.is_certified ? 'text-red-600' : 'text-amber-700'}`}>
                      {w.is_certified ? <><ShieldOff size={13}/> Uncertify</> : <><ShieldCheck size={13}/> Certify</>}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Formulaire ─────────────────────────────────────────────────── */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 my-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                {editing === 'new' ? 'New warehouse' : `Edit ${editing.name}`}
              </h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-700"><X size={20}/></button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Name" required>
                <input className={inputCls} value={form.name} placeholder="Kampala Central Warehouse"
                  onChange={e => setForm({ ...form, name: e.target.value })}/>
              </Field>
              <Field label="Code" hint="Printed on every receipt, e.g. WH-KLA-01">
                <input className={`${inputCls} font-mono uppercase`} value={form.code} placeholder="WH-KLA-01"
                  onChange={e => setForm({ ...form, code: e.target.value })}/>
              </Field>
              <Field label="Location" required>
                <input className={inputCls} value={form.location} placeholder="Plot 12, Industrial Area"
                  onChange={e => setForm({ ...form, location: e.target.value })}/>
              </Field>
              <Field label="District" required>
                <input className={inputCls} value={form.district} placeholder="Kampala"
                  onChange={e => setForm({ ...form, district: e.target.value })}/>
              </Field>
              <Field label="Country" required>
                <input className={inputCls} value={form.country}
                  onChange={e => setForm({ ...form, country: e.target.value })}/>
              </Field>
              <Field label="Capacity (tonnes)" hint="Receipts are refused beyond this capacity">
                <input type="number" min="0" step="0.1" className={inputCls} value={form.capacity_tonnes}
                  onChange={e => setForm({ ...form, capacity_tonnes: e.target.value })}/>
              </Field>
              <Field label="Phone">
                <input className={inputCls} value={form.phone_number}
                  onChange={e => setForm({ ...form, phone_number: e.target.value })}/>
              </Field>
              <Field label="Email">
                <input type="email" className={inputCls} value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}/>
              </Field>
            </div>

            <div className="mt-5">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Accepted commodities
              </span>
              <p className="text-xs text-gray-400 mb-2">None selected = every commodity is accepted.</p>
              <div className="flex flex-wrap gap-2">
                {crops.map(c => {
                  const on = form.accepted_crop_ids.includes(c.id);
                  return (
                    <button key={c.id} type="button" onClick={() => toggleCrop(c.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                        on ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.status !== false}
                  onChange={e => setForm({ ...form, status: e.target.checked })}/>
                Active
              </label>
              {isAdmin && (
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={!!form.is_certified}
                    onChange={e => setForm({ ...form, is_certified: e.target.checked })}/>
                  Certified (can issue receipts)
                </label>
              )}
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-center gap-2">
                <AlertTriangle size={14}/> {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setEditing(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white text-sm font-semibold">
                {saving && <Loader2 size={15} className="animate-spin"/>} Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}