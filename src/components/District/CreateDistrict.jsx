import React, { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';
import {
  Map, Plus, Edit2, Trash2, X, Check, Loader2,
  AlertTriangle, Search, ChevronLeft, ChevronRight, Eye,
} from 'lucide-react';

const EMPTY_FORM = { name: '', region: '' };
const PER_PAGE   = 8;

const inputCls = (err) =>
  `w-full border rounded-xl px-3.5 py-2.5 text-sm transition-all outline-none
   bg-white text-gray-800 placeholder-gray-400
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

const CreateDistrict = () => {
  const [districts,   setDistricts]   = useState([]);
  const [formData,    setFormData]    = useState(EMPTY_FORM);
  const [formErrors,  setFormErrors]  = useState({});
  const [editingId,   setEditingId]   = useState(null);
  const [viewItem,    setViewItem]    = useState(null);
  const [drawerMode,  setDrawerMode]  = useState(null); // 'form' | 'view'
  const [submitting,  setSubmitting]  = useState(false);
  const [search,      setSearch]      = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [globalError, setGlobalError] = useState('');

  const fetchDistricts = useCallback(async () => {
    try {
      const r = await axiosInstance.get('/api/district/');
      setDistricts(r.data.districts ?? []);
    } catch { setGlobalError('Error fetching districts.'); }
  }, []);

  useEffect(() => { fetchDistricts(); }, [fetchDistricts]);

  const validate = () => {
    const e = {};
    if (!formData.name.trim())   e.name   = 'District name is required';
    if (!formData.region.trim()) e.region = 'Region is required';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    try {
      if (editingId) await axiosInstance.put(`/api/district/${editingId}/`, formData);
      else           await axiosInstance.post('/api/district/', formData);
      await fetchDistricts();
      closeDrawer();
      Swal.fire({ icon: 'success', title: editingId ? 'District updated!' : 'District created!',
        timer: 2000, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || err.message,
        customClass: { popup: 'rounded-2xl' } });
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id, name) => {
    const r = await Swal.fire({ title: `Delete "${name}"?`, text: 'Cannot be undone.',
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444',
      confirmButtonText: 'Delete', customClass: { popup: 'rounded-2xl' } });
    if (!r.isConfirmed) return;
    try {
      await axiosInstance.delete(`/api/district/${id}/`);
      setDistricts(d => d.filter(x => x.id !== id));
    } catch { setGlobalError('Error deleting district.'); }
  };

  const openCreate = () => { setFormData(EMPTY_FORM); setEditingId(null); setFormErrors({}); setDrawerMode('form'); };
  const openEdit   = (d) => { setFormData({ name: d.name ?? '', region: d.region ?? '' }); setEditingId(d.id); setFormErrors({}); setDrawerMode('form'); };
  const openView   = (d) => { setViewItem(d); setDrawerMode('view'); };
  const closeDrawer = () => { setDrawerMode(null); setFormData(EMPTY_FORM); setEditingId(null); setFormErrors({}); setViewItem(null); };

  // Filtered + paginated
  const filtered   = districts.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.region?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  const drawerOpen = drawerMode !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/20 p-4 sm:p-6 light-panel">

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Map size={22} className="text-teal-600"/> District Management
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {search ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${search}"`
                      : `${districts.length} district${districts.length !== 1 ? 's' : ''} registered`}
            </p>
          </div>
          <button onClick={openCreate}
            className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm px-4 py-2 rounded-xl font-medium shadow-sm transition-colors">
            <Plus size={15}/> New District
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Search size={16}/></span>
        <input type="text" placeholder="Search by name or region…"
          value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"/>
        {search && <button onClick={() => { setSearch(''); setCurrentPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={16}/></button>}
      </div>

      {globalError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
          <AlertTriangle size={15}/> {globalError}
          <button onClick={() => setGlobalError('')} className="ml-auto"><X size={15}/></button>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {paginated.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Map size={40} className="mx-auto mb-3 text-gray-300"/>
            <p className="text-gray-500 font-medium">No districts found</p>
            {!search && (
              <button onClick={openCreate}
                className="mt-4 inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm px-5 py-2 rounded-xl font-medium transition-colors">
                <Plus size={15}/> New District
              </button>
            )}
          </div>
        ) : paginated.map(d => (
          <div key={d.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-teal-200 transition-all p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm flex-shrink-0">
                  {d.name?.[0]?.toUpperCase() || 'D'}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{d.name}</h3>
                  <p className="text-xs text-gray-400">{d.region}</p>
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => openView(d)}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 transition-colors">
                  <Eye size={12}/> View
                </button>
                <button onClick={() => openEdit(d)}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200 transition-colors">
                  <Edit2 size={12}/> Edit
                </button>
                <button onClick={() => handleDelete(d.id, d.name)}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-red-50 text-red-700 hover:bg-red-100 border-red-200 transition-colors">
                  <Trash2 size={12}/> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronLeft size={16}/> Previous
          </button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setCurrentPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === p ? 'bg-teal-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed">
            Next <ChevronRight size={16}/>
          </button>
        </div>
      )}

      {/* Drawer backdrop */}
      {drawerOpen && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={closeDrawer}/>}

      {/* Form Drawer */}
      <div className={`fixed top-0 right-0 h-full z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out light-panel ${drawerMode === 'form' ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              {editingId ? <Edit2 size={18} className="text-yellow-500"/> : <Plus size={18} className="text-teal-600"/>}
              {editingId ? 'Edit District' : 'New District'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{editingId ? 'Update district details' : 'Register a new administrative district'}</p>
          </div>
          <button onClick={closeDrawer} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <Field label="District Name" required error={formErrors.name}>
            <input type="text" placeholder="e.g. Abim" value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputCls(formErrors.name)}/>
          </Field>
          <Field label="Region" required error={formErrors.region}>
            <input type="text" placeholder="e.g. Northern Uganda" value={formData.region}
              onChange={e => setFormData({ ...formData, region: e.target.value })} className={inputCls(formErrors.region)}/>
          </Field>
        </div>
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-white flex gap-3">
          <button type="button" onClick={closeDrawer}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2
              ${submitting ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 shadow-sm'}`}>
            {submitting ? <><Loader2 size={15} className="animate-spin"/> Saving…</> : <><Check size={15}/> {editingId ? 'Update' : 'Create'} District</>}
          </button>
        </div>
      </div>

      {/* View Drawer */}
      <div className={`fixed top-0 right-0 h-full z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${drawerMode === 'view' ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Eye size={18} className="text-blue-600"/> District Details
          </h2>
          <button onClick={closeDrawer} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"><X size={18}/></button>
        </div>
        {viewItem && (
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-2xl mx-auto mb-5">
              {viewItem.name?.[0]?.toUpperCase()}
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Name</p>
                <p className="text-gray-800 font-semibold">{viewItem.name}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Region</p>
                <p className="text-gray-800 font-semibold">{viewItem.region}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">ID</p>
                <p className="text-gray-500 font-mono text-sm">#{viewItem.id}</p>
              </div>
            </div>
            <button onClick={() => { closeDrawer(); openEdit(viewItem); }}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
              <Edit2 size={14}/> Edit this district
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateDistrict;