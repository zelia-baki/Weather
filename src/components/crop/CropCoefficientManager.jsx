import React, { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';
import { Leaf, Plus, Edit2, Trash2, X, Check, Loader2, AlertTriangle, Search } from 'lucide-react';

const EMPTY = { crop_id: '', stage: '', kc_value: '' };

const inputCls = (err) =>
  `w-full border rounded-xl px-3.5 py-2.5 text-sm transition-all outline-none
   bg-white text-gray-800 placeholder-gray-400
   focus:ring-2 focus:border-transparent
   ${err ? 'border-red-300 focus:ring-red-300' : 'border-gray-200 focus:ring-green-400 hover:border-gray-300'}`;

const selectCls = (err) =>
  `w-full border rounded-xl px-3.5 py-2.5 text-sm transition-all outline-none
   bg-white text-gray-800
   focus:ring-2 focus:border-transparent
   ${err ? 'border-red-300 focus:ring-red-300' : 'border-gray-200 focus:ring-green-400 hover:border-gray-300'}`;

const Field = ({ label, required, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
      {label}{required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={11}/>{error}</p>}
  </div>
);

const CropCoefficientManager = () => {
  const [coefficients, setCoefficients] = useState([]);
  const [crops,        setCrops]        = useState([]);
  const [formData,     setFormData]     = useState(EMPTY);
  const [formErrors,   setFormErrors]   = useState({});
  const [editingId,    setEditingId]    = useState(null);
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [search,       setSearch]       = useState('');
  const [globalError,  setGlobalError]  = useState('');

  const fetchCoefficients = useCallback(async () => {
    try { const r = await axiosInstance.get('/api/kc/'); setCoefficients(r.data.coefficients ?? []); }
    catch { setGlobalError('Error fetching crop coefficients.'); }
  }, []);
  const fetchCrops = useCallback(async () => {
    try { const r = await axiosInstance.get('/api/crop/'); setCrops(r.data.crops ?? []); }
    catch {}
  }, []);

  useEffect(() => { fetchCoefficients(); fetchCrops(); }, [fetchCoefficients, fetchCrops]);

  const validate = () => {
    const e = {};
    if (!formData.crop_id)         e.crop_id  = 'Crop is required';
    if (!formData.stage.trim())    e.stage    = 'Growth stage is required';
    if (!formData.kc_value)        e.kc_value = 'Kc value is required';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    try {
      if (editingId) await axiosInstance.put(`/api/kc/${editingId}/edit`, formData);
      else           await axiosInstance.post('/api/kc/create', formData);
      await fetchCoefficients(); closeDrawer();
      Swal.fire({ icon: 'success', title: editingId ? 'Coefficient updated!' : 'Coefficient created!', timer: 2000, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || err.message, customClass: { popup: 'rounded-2xl' } });
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    const r = await Swal.fire({ title: 'Delete coefficient?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete', customClass: { popup: 'rounded-2xl' } });
    if (!r.isConfirmed) return;
    try { await axiosInstance.delete(`/api/kc/${id}/delete`); await fetchCoefficients(); }
    catch { setGlobalError('Error deleting coefficient.'); }
  };

  const openCreate  = () => { setFormData(EMPTY); setEditingId(null); setFormErrors({}); setDrawerOpen(true); };
  const openEdit    = (c) => { setFormData({ crop_id: c.crop_id, stage: c.stage, kc_value: c.kc_value }); setEditingId(c.id); setFormErrors({}); setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); setFormData(EMPTY); setEditingId(null); setFormErrors({}); };

  const getCropName = (id) => crops.find(c => c.id === id || c.id === parseInt(id))?.name || `#${id}`;

  const STAGE_COLORS = {
    'initial':   'bg-yellow-50 text-yellow-700 border-yellow-200',
    'mid':       'bg-green-50 text-green-700 border-green-200',
    'late':      'bg-orange-50 text-orange-700 border-orange-200',
    'end':       'bg-red-50 text-red-700 border-red-200',
  };
  const stageColor = (stage) => STAGE_COLORS[stage?.toLowerCase()] || 'bg-gray-50 text-gray-700 border-gray-200';

  const filtered = coefficients.filter(c =>
    getCropName(c.crop_id).toLowerCase().includes(search.toLowerCase()) ||
    c.stage?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/20 p-4 sm:p-6 light-panel">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Leaf size={22} className="text-green-600"/> Crop Coefficient Manager</h1>
            <p className="text-sm text-gray-400 mt-0.5">{coefficients.length} coefficient{coefficients.length !== 1 ? 's' : ''} (Kc values)</p>
          </div>
          <button onClick={openCreate} className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-xl font-medium shadow-sm transition-colors"><Plus size={15}/> New Coefficient</button>
        </div>
      </div>

      <div className="relative mb-5">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Search size={16}/></span>
        <input type="text" placeholder="Search by crop or growth stage…" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"/>
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={16}/></button>}
      </div>

      {globalError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2"><AlertTriangle size={15}/>{globalError}<button onClick={() => setGlobalError('')} className="ml-auto"><X size={15}/></button></div>}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Leaf size={40} className="mx-auto mb-3 text-gray-300"/>
            <p className="text-gray-500 font-medium">No coefficients found</p>
            {!search && <button onClick={openCreate} className="mt-4 inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm px-5 py-2 rounded-xl font-medium transition-colors"><Plus size={15}/> New Coefficient</button>}
          </div>
        ) : filtered.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 flex-shrink-0">
                  <Leaf size={16}/>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{getCropName(c.crop_id)}</h3>
                  <div className="flex gap-2 mt-0.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${stageColor(c.stage)}`}>{c.stage}</span>
                    <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">Kc = {c.kc_value}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(c)} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200 transition-colors"><Edit2 size={12}/> Edit</button>
                <button onClick={() => handleDelete(c.id)} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-red-50 text-red-700 hover:bg-red-100 border-red-200 transition-colors"><Trash2 size={12}/> Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {drawerOpen && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={closeDrawer}/>}
      <div className={`fixed top-0 right-0 h-full z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out light-panel ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">{editingId ? <Edit2 size={18} className="text-yellow-500"/> : <Plus size={18} className="text-green-600"/>}{editingId ? 'Edit Coefficient' : 'New Kc Value'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{editingId ? 'Update Kc value details' : 'Set crop coefficient for a growth stage'}</p>
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
          <Field label="Growth Stage" required error={formErrors.stage}>
            <select value={formData.stage} onChange={e => setFormData({ ...formData, stage: e.target.value })} className={selectCls(formErrors.stage)}>
              <option value="">Select stage</option>
              <option value="Initial">Initial</option>
              <option value="Mid">Mid-season</option>
              <option value="Late">Late-season</option>
              <option value="End">End</option>
              <option value="Custom">Custom…</option>
            </select>
          </Field>
          {formData.stage === 'Custom' && (
            <Field label="Custom Stage Name" required error={formErrors.stage}>
              <input type="text" placeholder="Enter stage name" value={formData.stage === 'Custom' ? '' : formData.stage}
                onChange={e => setFormData({ ...formData, stage: e.target.value })} className={inputCls(false)}/>
            </Field>
          )}
          <Field label="Kc Value" required error={formErrors.kc_value}>
            <input type="number" step="0.01" min="0" max="2" placeholder="e.g. 0.85" value={formData.kc_value}
              onChange={e => setFormData({ ...formData, kc_value: e.target.value })} className={inputCls(formErrors.kc_value)}/>
            <p className="text-xs text-gray-400">Typical values range from 0.3 (bare soil) to 1.2 (full cover)</p>
          </Field>
        </div>
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-white flex gap-3">
          <button type="button" onClick={closeDrawer} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 ${submitting ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-sm'}`}>
            {submitting ? <><Loader2 size={15} className="animate-spin"/> Saving…</> : <><Check size={15}/> {editingId ? 'Update' : 'Save'} Coefficient</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CropCoefficientManager;