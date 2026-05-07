import React, { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';
import { Sprout, Plus, Edit2, Trash2, X, Check, Loader2, AlertTriangle, Search } from 'lucide-react';

const EMPTY_FORM = { name: '', weight: '', category_id: '' };

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

const CropManager = () => {
  const [crops,       setCrops]       = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [formData,    setFormData]    = useState(EMPTY_FORM);
  const [formErrors,  setFormErrors]  = useState({});
  const [editingId,   setEditingId]   = useState(null);
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [search,      setSearch]      = useState('');
  const [globalError, setGlobalError] = useState('');

  const fetchCrops      = useCallback(async () => {
    try { const r = await axiosInstance.get('/api/crop/'); setCrops(r.data.crops ?? []); }
    catch { setGlobalError('Error fetching crops.'); }
  }, []);

  const fetchCategories = useCallback(async () => {
    try { const r = await axiosInstance.get('/api/producecategory/'); setCategories(r.data.categories ?? r.data ?? []); }
    catch { /* categories optional */ }
  }, []);

  useEffect(() => { fetchCrops(); fetchCategories(); }, [fetchCrops, fetchCategories]);

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name   = 'Crop name is required';
    if (!formData.weight)      e.weight = 'Weight is required';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    try {
      if (editingId) await axiosInstance.put(`/api/crop/${editingId}/edit`, formData);
      else           await axiosInstance.post('/api/crop/create', formData);
      await fetchCrops(); closeDrawer();
      Swal.fire({ icon: 'success', title: editingId ? 'Crop updated!' : 'Crop created!',
        timer: 2000, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || err.message, customClass: { popup: 'rounded-2xl' } });
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id, name) => {
    const r = await Swal.fire({ title: `Delete "${name}"?`, icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', confirmButtonText: 'Delete', customClass: { popup: 'rounded-2xl' } });
    if (!r.isConfirmed) return;
    try { await axiosInstance.delete(`/api/crop/${id}/delete`); await fetchCrops(); }
    catch { setGlobalError('Error deleting crop.'); }
  };

  const openCreate = () => { setFormData(EMPTY_FORM); setEditingId(null); setFormErrors({}); setDrawerOpen(true); };
  const openEdit   = (c) => { setFormData({ name: c.name, weight: c.weight, category_id: c.category_id ?? '' }); setEditingId(c.id); setFormErrors({}); setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); setFormData(EMPTY_FORM); setEditingId(null); setFormErrors({}); };

  const filtered = crops.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.category_id?.toString().includes(search)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/20 p-4 sm:p-6 light-panel">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Sprout size={22} className="text-emerald-600"/> Crop Manager
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">{crops.length} crop{crops.length !== 1 ? 's' : ''} registered</p>
          </div>
          <button onClick={openCreate}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-xl font-medium shadow-sm transition-colors">
            <Plus size={15}/> New Crop
          </button>
        </div>
      </div>

      <div className="relative mb-5">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Search size={16}/></span>
        <input type="text" placeholder="Search crops…" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={16}/></button>}
      </div>

      {globalError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
          <AlertTriangle size={15}/> {globalError}
          <button onClick={() => setGlobalError('')} className="ml-auto"><X size={15}/></button>
        </div>
      )}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Sprout size={40} className="mx-auto mb-3 text-gray-300"/>
            <p className="text-gray-500 font-medium">No crops found</p>
            {!search && <button onClick={openCreate} className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-5 py-2 rounded-xl font-medium transition-colors"><Plus size={15}/> New Crop</button>}
          </div>
        ) : filtered.map(crop => {
          const cat = categories.find(c => c.id === crop.category_id || c.id === parseInt(crop.category_id));
          return (
            <div key={crop.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all p-4 sm:p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">
                    {crop.name?.[0]?.toUpperCase() || 'C'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{crop.name}</h3>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">Weight: {crop.weight}</span>
                      {cat && <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">{cat.name}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(crop)} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200 transition-colors"><Edit2 size={12}/> Edit</button>
                  <button onClick={() => handleDelete(crop.id, crop.name)} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-red-50 text-red-700 hover:bg-red-100 border-red-200 transition-colors"><Trash2 size={12}/> Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {drawerOpen && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={closeDrawer}/>}
      <div className={`fixed top-0 right-0 h-full z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out light-panel ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              {editingId ? <Edit2 size={18} className="text-yellow-500"/> : <Plus size={18} className="text-emerald-600"/>}
              {editingId ? 'Edit Crop' : 'New Crop'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{editingId ? 'Update crop details' : 'Register a new crop'}</p>
          </div>
          <button onClick={closeDrawer} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <Field label="Crop Name" required error={formErrors.name}>
            <input type="text" placeholder="e.g. Cocoa" value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputCls(formErrors.name)}/>
          </Field>
          <Field label="Weight (kg)" required error={formErrors.weight}>
            <input type="number" step="0.01" placeholder="e.g. 50" value={formData.weight}
              onChange={e => setFormData({ ...formData, weight: e.target.value })} className={inputCls(formErrors.weight)}/>
          </Field>
          <Field label="Category">
            <select value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })} className={selectCls(false)}>
              <option value="">Select category (optional)</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-white flex gap-3">
          <button type="button" onClick={closeDrawer} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 ${submitting ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'}`}>
            {submitting ? <><Loader2 size={15} className="animate-spin"/> Saving…</> : <><Check size={15}/> {editingId ? 'Update' : 'Create'} Crop</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CropManager;