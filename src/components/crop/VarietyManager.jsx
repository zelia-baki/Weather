// ── VARIETY MANAGER ───────────────────────────────────────────────────────────
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';
import { jwtDecode } from 'jwt-decode';
import { Sprout, Plus, Edit2, Trash2, X, Check, Loader2, AlertTriangle, Search } from 'lucide-react';

const inputCls = (err) =>
  `w-full border rounded-xl px-3.5 py-2.5 text-sm transition-all outline-none
   bg-white text-gray-800 placeholder-gray-400
   focus:ring-2 focus:border-transparent
   ${err ? 'border-red-300 focus:ring-red-300' : 'border-gray-200 focus:ring-emerald-400 hover:border-gray-300'}`;

const selectCls = (err) =>
  `w-full border rounded-xl px-3.5 py-2.5 text-sm transition-all outline-none
   bg-white text-gray-800
   focus:ring-2 focus:border-transparent
   ${err ? 'border-red-300 focus:ring-red-300' : 'border-gray-200 focus:ring-emerald-400 hover:border-gray-300'}`;

const Field = ({ label, required, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
      {label}{required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={11}/>{error}</p>}
  </div>
);

const EMPTY_VARIETY = { crop_id: '', name: '', description: '', is_active: true };

// Admin rights are enforced by the API; this only hides buttons non-admins cannot use.
const getIsAdmin = () => {
  try {
    const token = localStorage.getItem('token');
    return token ? Boolean(jwtDecode(token)?.sub?.is_admin) : false;
  } catch { return false; }
};

const VarietyManager = () => {
  const [varieties,   setVarieties]   = useState([]);
  const [crops,       setCrops]       = useState([]);
  const [formData,    setFormData]    = useState(EMPTY_VARIETY);
  const [formErrors,  setFormErrors]  = useState({});
  const [editingId,   setEditingId]   = useState(null);
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [search,      setSearch]      = useState('');
  const [cropFilter,  setCropFilter]  = useState('');
  const [globalError, setGlobalError] = useState('');
  const isAdmin = useMemo(getIsAdmin, []);

  const fetchVarieties = useCallback(async () => {
    try { const r = await axiosInstance.get('/api/crop-variety/'); setVarieties(r.data.varieties ?? []); }
    catch { setGlobalError('Could not load varieties. Refresh the page to try again.'); }
  }, []);
  const fetchCrops = useCallback(async () => {
    try { const r = await axiosInstance.get('/api/crop/'); setCrops(r.data.crops ?? []); }
    catch {}
  }, []);

  useEffect(() => { fetchVarieties(); fetchCrops(); }, [fetchVarieties, fetchCrops]);

  const validate = () => {
    const e = {};
    if (!formData.crop_id)     e.crop_id = 'Select the crop this variety belongs to';
    if (!formData.name.trim()) e.name    = 'Variety name is required';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    try {
      if (editingId) await axiosInstance.put(`/api/crop-variety/${editingId}/edit`, formData);
      else           await axiosInstance.post('/api/crop-variety/create', formData);
      await fetchVarieties(); closeDrawer();
      Swal.fire({ icon: 'success', title: editingId ? 'Variety updated' : 'Variety created', timer: 2000, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Could not save', text: err.response?.data?.message || err.message, customClass: { popup: 'rounded-2xl' } });
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (v) => {
    const r = await Swal.fire({ title: `Delete ${v.name}?`, text: 'This cannot be undone.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete', customClass: { popup: 'rounded-2xl' } });
    if (!r.isConfirmed) return;
    try { await axiosInstance.delete(`/api/crop-variety/${v.id}/delete`); await fetchVarieties(); }
    catch (err) {
      Swal.fire({ icon: 'error', title: 'Could not delete', text: err.response?.data?.message || err.message, customClass: { popup: 'rounded-2xl' } });
    }
  };

  const openCreate  = () => { setFormData({ ...EMPTY_VARIETY, crop_id: cropFilter }); setEditingId(null); setFormErrors({}); setDrawerOpen(true); };
  const openEdit    = (v) => { setFormData({ crop_id: v.crop_id, name: v.name, description: v.description ?? '', is_active: v.is_active }); setEditingId(v.id); setFormErrors({}); setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); setFormData(EMPTY_VARIETY); setEditingId(null); setFormErrors({}); };

  const getCropName = (id) => crops.find(c => c.id === id || c.id === parseInt(id))?.name || `#${id}`;

  const filtered = varieties.filter(v => {
    if (cropFilter && String(v.crop_id) !== String(cropFilter)) return false;
    const s = search.toLowerCase();
    return v.name?.toLowerCase().includes(s) || getCropName(v.crop_id).toLowerCase().includes(s);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/20 p-4 sm:p-6 light-panel">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Sprout size={22} className="text-emerald-600"/> Variety Manager</h1>
            <p className="text-sm text-gray-400 mt-0.5">{varieties.length} variet{varieties.length !== 1 ? 'ies' : 'y'} across {new Set(varieties.map(v => v.crop_id)).size} crop{new Set(varieties.map(v => v.crop_id)).size !== 1 ? 's' : ''}</p>
          </div>
          {isAdmin && <button onClick={openCreate} className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-xl font-medium shadow-sm transition-colors"><Plus size={15}/> New Variety</button>}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Search size={16}/></span>
          <input type="text" placeholder="Search by variety or crop…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={16}/></button>}
        </div>
        <select value={cropFilter} onChange={e => setCropFilter(e.target.value)}
          className="sm:w-56 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400">
          <option value="">All crops</option>
          {crops.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {globalError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2"><AlertTriangle size={15}/>{globalError}<button onClick={() => setGlobalError('')} className="ml-auto"><X size={15}/></button></div>}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Sprout size={40} className="mx-auto mb-3 text-gray-300"/>
            <p className="text-gray-500 font-medium">No varieties found</p>
            <p className="text-sm text-gray-400 mt-1">Add varieties such as Arabica and Robusta for coffee, or Red and White for sorghum.</p>
            {isAdmin && !search && <button onClick={openCreate} className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-5 py-2 rounded-xl font-medium transition-colors"><Plus size={15}/> New Variety</button>}
          </div>
        ) : filtered.map(v => (
          <div key={v.id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all p-4 sm:p-5 ${v.is_active ? '' : 'opacity-60'}`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">{v.name?.[0]?.toUpperCase() || 'V'}</div>
                <div>
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    {v.name}
                    {!v.is_active && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactive</span>}
                  </h3>
                  <div className="flex gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">Crop: {v.crop_name || getCropName(v.crop_id)}</span>
                    {v.description && <span className="text-xs text-gray-400">— {v.description}</span>}
                  </div>
                </div>
              </div>
              {isAdmin && (
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(v)} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200 transition-colors"><Edit2 size={12}/> Edit</button>
                  <button onClick={() => handleDelete(v)} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-red-50 text-red-700 hover:bg-red-100 border-red-200 transition-colors"><Trash2 size={12}/> Delete</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {drawerOpen && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={closeDrawer}/>}
      <div className={`fixed top-0 right-0 h-full z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out light-panel ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">{editingId ? <Edit2 size={18} className="text-yellow-500"/> : <Plus size={18} className="text-emerald-600"/>}{editingId ? 'Edit Variety' : 'New Variety'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{editingId ? 'Update variety details' : 'Add a variety to a crop'}</p>
          </div>
          <button onClick={closeDrawer} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <Field label="Crop" required error={formErrors.crop_id}>
            <select value={formData.crop_id} onChange={e => setFormData({ ...formData, crop_id: e.target.value })} className={selectCls(formErrors.crop_id)}>
              <option value="">Select crop</option>
              {crops.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Variety Name" required error={formErrors.name}>
            <input type="text" placeholder="e.g. Arabica, Robusta, Red, White" value={formData.name} maxLength={100}
              onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputCls(formErrors.name)}/>
          </Field>
          <Field label="Description">
            <input type="text" placeholder="Optional description" value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })} className={inputCls(false)}/>
          </Field>
          <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer select-none">
            <input type="checkbox" checked={formData.is_active}
              onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-400"/>
            Active (available when receiving commodities)
          </label>
        </div>
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-white flex gap-3">
          <button type="button" onClick={closeDrawer} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 ${submitting ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'}`}>
            {submitting ? <><Loader2 size={15} className="animate-spin"/> Saving…</> : <><Check size={15}/> {editingId ? 'Update' : 'Create'} Variety</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VarietyManager;