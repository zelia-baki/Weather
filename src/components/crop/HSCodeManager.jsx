import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';
import { FileText, Plus, Edit2, Trash2, X, Check, Loader2, AlertTriangle, Search, Link2 } from 'lucide-react';

const EMPTY = { code: '', description: '', eudr_commodity: '', is_ex_code: false };

const COMMODITIES = ['Cattle', 'Cocoa', 'Coffee', 'Oil palm', 'Rubber', 'Soya', 'Wood'];

const COMMODITY_COLORS = {
  'Cattle':   'bg-red-50 text-red-700 border-red-200',
  'Cocoa':    'bg-amber-50 text-amber-700 border-amber-200',
  'Coffee':   'bg-orange-50 text-orange-700 border-orange-200',
  'Oil palm': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Rubber':   'bg-slate-50 text-slate-700 border-slate-200',
  'Soya':     'bg-lime-50 text-lime-700 border-lime-200',
  'Wood':     'bg-teal-50 text-teal-700 border-teal-200',
};

const inputCls = (err) =>
  `w-full border rounded-xl px-3.5 py-2.5 text-sm transition-all outline-none
   bg-white text-gray-800 placeholder-gray-400
   focus:ring-2 focus:border-transparent
   ${err ? 'border-red-300 focus:ring-red-300' : 'border-gray-200 focus:ring-teal-400 hover:border-gray-300'}`;

const selectCls = (err) =>
  `w-full border rounded-xl px-3.5 py-2.5 text-sm transition-all outline-none
   bg-white text-gray-800
   focus:ring-2 focus:border-transparent
   ${err ? 'border-red-300 focus:ring-red-300' : 'border-gray-200 focus:ring-teal-400 hover:border-gray-300'}`;

const Field = ({ label, required, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
      {label}{required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={11}/>{error}</p>}
  </div>
);

const HSCodeManager = () => {
  const [hscodes,      setHscodes]      = useState([]);
  const [crops,        setCrops]        = useState([]);
  const [formData,     setFormData]     = useState(EMPTY);
  const [formErrors,   setFormErrors]   = useState({});
  const [editingId,    setEditingId]    = useState(null);
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [search,       setSearch]       = useState('');
  const [commodityFilter, setCommodityFilter] = useState('');
  const [globalError,  setGlobalError]  = useState('');
  const [linkTargetId, setLinkTargetId] = useState(null); // hscode id being linked to a crop

  const fetchHscodes = useCallback(async () => {
    try { const r = await axiosInstance.get('/api/hscode/'); setHscodes(r.data.hscodes ?? []); }
    catch { setGlobalError('Error fetching HS codes.'); }
  }, []);
  const fetchCrops = useCallback(async () => {
    try { const r = await axiosInstance.get('/api/crop/'); setCrops(r.data.crops ?? []); }
    catch {}
  }, []);

  useEffect(() => { fetchHscodes(); fetchCrops(); }, [fetchHscodes, fetchCrops]);

  const validate = () => {
    const e = {};
    if (!formData.code.trim())            e.code = 'HS code is required';
    if (!formData.description.trim())     e.description = 'Description is required';
    if (!formData.eudr_commodity)         e.eudr_commodity = 'EUDR commodity is required';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    try {
      if (editingId) await axiosInstance.put(`/api/hscode/${editingId}/edit`, formData);
      else           await axiosInstance.post('/api/hscode/create', formData);
      await fetchHscodes(); closeDrawer();
      Swal.fire({ icon: 'success', title: editingId ? 'HS code updated!' : 'HS code created!', timer: 2000, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || err.message, customClass: { popup: 'rounded-2xl' } });
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    const r = await Swal.fire({ title: 'Delete HS code?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete', customClass: { popup: 'rounded-2xl' } });
    if (!r.isConfirmed) return;
    try { await axiosInstance.delete(`/api/hscode/${id}/delete`); await fetchHscodes(); }
    catch { setGlobalError('Error deleting HS code.'); }
  };

  const handleLinkCrop = async (hscodeId, cropId) => {
    if (!cropId) return;
    try {
      await axiosInstance.post(`/api/hscode/${hscodeId}/link/${cropId}`);
      await fetchHscodes();
      setLinkTargetId(null);
    } catch { setGlobalError('Error linking crop.'); }
  };

  const handleUnlinkCrop = async (hscodeId, cropId) => {
    try {
      await axiosInstance.delete(`/api/hscode/${hscodeId}/unlink/${cropId}`);
      await fetchHscodes();
    } catch { setGlobalError('Error unlinking crop.'); }
  };

  const openCreate  = () => { setFormData(EMPTY); setEditingId(null); setFormErrors({}); setDrawerOpen(true); };
  const openEdit    = (h) => { setFormData({ code: h.code, description: h.description, eudr_commodity: h.eudr_commodity, is_ex_code: h.is_ex_code }); setEditingId(h.id); setFormErrors({}); setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); setFormData(EMPTY); setEditingId(null); setFormErrors({}); };

  const getCropName = (id) => crops.find(c => c.id === id)?.name || `#${id}`;

  const filtered = useMemo(() => hscodes.filter(h =>
    (!commodityFilter || h.eudr_commodity === commodityFilter) &&
    (h.code.toLowerCase().includes(search.toLowerCase()) || h.description.toLowerCase().includes(search.toLowerCase()))
  ), [hscodes, search, commodityFilter]);

  const commodityColor = (c) => COMMODITY_COLORS[c] || 'bg-gray-50 text-gray-700 border-gray-200';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/20 p-4 sm:p-6 light-panel">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FileText size={22} className="text-teal-600"/> HS Code Manager (EUDR)</h1>
            <p className="text-sm text-gray-400 mt-0.5">{hscodes.length} code{hscodes.length !== 1 ? 's' : ''} — Annexe I, Règlement (UE) 2023/1115</p>
          </div>
          <button onClick={openCreate} className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm px-4 py-2 rounded-xl font-medium shadow-sm transition-colors"><Plus size={15}/> New HS Code</button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Search size={16}/></span>
          <input type="text" placeholder="Search by code or description…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"/>
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={16}/></button>}
        </div>
        <select value={commodityFilter} onChange={e => setCommodityFilter(e.target.value)} className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400">
          <option value="">All commodities</option>
          {COMMODITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {globalError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2"><AlertTriangle size={15}/>{globalError}<button onClick={() => setGlobalError('')} className="ml-auto"><X size={15}/></button></div>}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <FileText size={40} className="mx-auto mb-3 text-gray-300"/>
            <p className="text-gray-500 font-medium">No HS codes found</p>
            {!search && !commodityFilter && <button onClick={openCreate} className="mt-4 inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm px-5 py-2 rounded-xl font-medium transition-colors"><Plus size={15}/> New HS Code</button>}
          </div>
        ) : filtered.map(h => (
          <div key={h.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-teal-200 transition-all p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs flex-shrink-0">
                  {h.is_ex_code ? 'ex' : <FileText size={16}/>}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">{h.code}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{h.description}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${commodityColor(h.eudr_commodity)}`}>{h.eudr_commodity}</span>
                    {h.crop_ids.map(cid => (
                      <span key={cid} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        {getCropName(cid)}
                        <button onClick={() => handleUnlinkCrop(h.id, cid)} className="text-gray-400 hover:text-red-500"><X size={10}/></button>
                      </span>
                    ))}
                    {linkTargetId === h.id ? (
                      <select autoFocus onChange={e => handleLinkCrop(h.id, e.target.value)} onBlur={() => setLinkTargetId(null)}
                        className="text-xs border border-gray-200 rounded-full px-2 py-0.5 bg-white">
                        <option value="">Link crop…</option>
                        {crops.filter(c => !h.crop_ids.includes(c.id)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    ) : (
                      <button onClick={() => setLinkTargetId(h.id)} className="text-xs text-teal-600 hover:text-teal-800 flex items-center gap-0.5"><Link2 size={11}/> Link crop</button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(h)} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200 transition-colors"><Edit2 size={12}/> Edit</button>
                <button onClick={() => handleDelete(h.id)} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-red-50 text-red-700 hover:bg-red-100 border-red-200 transition-colors"><Trash2 size={12}/> Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {drawerOpen && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={closeDrawer}/>}
      <div className={`fixed top-0 right-0 h-full z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out light-panel ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">{editingId ? <Edit2 size={18} className="text-yellow-500"/> : <Plus size={18} className="text-teal-600"/>}{editingId ? 'Edit HS Code' : 'New HS Code'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{editingId ? 'Update HS code details' : 'Add a new EUDR HS code entry'}</p>
          </div>
          <button onClick={closeDrawer} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <Field label="HS Code" required error={formErrors.code}>
            <input type="text" placeholder="e.g. 1801 or ex 4101" value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })} className={inputCls(formErrors.code)}/>
          </Field>
          <Field label="Description" required error={formErrors.description}>
            <input type="text" placeholder="e.g. Cocoa beans, whole or broken" value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })} className={inputCls(formErrors.description)}/>
          </Field>
          <Field label="EUDR Commodity" required error={formErrors.eudr_commodity}>
            <select value={formData.eudr_commodity} onChange={e => setFormData({ ...formData, eudr_commodity: e.target.value })} className={selectCls(formErrors.eudr_commodity)}>
              <option value="">Select commodity</option>
              {COMMODITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={formData.is_ex_code} onChange={e => setFormData({ ...formData, is_ex_code: e.target.checked })} className="rounded border-gray-300 text-teal-600 focus:ring-teal-400"/>
            "ex" code (partial coverage of the tariff heading)
          </label>
        </div>
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-white flex gap-3">
          <button type="button" onClick={closeDrawer} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 ${submitting ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 shadow-sm'}`}>
            {submitting ? <><Loader2 size={15} className="animate-spin"/> Saving…</> : <><Check size={15}/> {editingId ? 'Update' : 'Save'} HS Code</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HSCodeManager;
