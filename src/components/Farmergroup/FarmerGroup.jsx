import React, { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';
import {
  Users, Plus, Edit2, Trash2, Search, X, AlertTriangle,
  Loader2, Check, ChevronLeft, ChevronRight, Lightbulb,
} from 'lucide-react';

const EMPTY_FORM = { name: '', description: '' };
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

const FarmerGroupManager = () => {
  const [groups,      setGroups]      = useState([]);
  const [formData,    setFormData]    = useState(EMPTY_FORM);
  const [formErrors,  setFormErrors]  = useState({});
  const [editingId,   setEditingId]   = useState(null);
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [search,      setSearch]      = useState('');
  const [globalError, setGlobalError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchGroups = useCallback(async () => {
    try {
      const r = await axiosInstance.get('/api/farmergroup/');
      setGroups(r.data ?? []);
    } catch { setGlobalError('Error fetching farmer groups.'); }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const validate = () => {
    const e = {};
    if (!formData.name.trim())        e.name        = 'Group name is required';
    if (!formData.description.trim()) e.description = 'Description is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    try {
      if (editingId) await axiosInstance.put(`/api/farmergroup/${editingId}`, formData);
      else           await axiosInstance.post('/api/farmergroup/create', formData);
      await fetchGroups();
      closeDrawer();
      Swal.fire({ icon: 'success', title: editingId ? 'Group updated!' : 'Group created!',
        text: `"${formData.name}" saved.`, timer: 2000, showConfirmButton: false,
        customClass: { popup: 'rounded-2xl' } });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || err.message || 'Could not save.',
        customClass: { popup: 'rounded-2xl' } });
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id, name) => {
    const r = await Swal.fire({ title: `Delete "${name}"?`,
      text: 'Farms linked to this group will lose their group assignment.',
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444',
      confirmButtonText: 'Delete', customClass: { popup: 'rounded-2xl' } });
    if (!r.isConfirmed) return;
    try {
      await axiosInstance.delete(`/api/farmergroup/${id}`);
      setGroups(g => g.filter(x => x.id !== id));
    } catch { setGlobalError('Error deleting group.'); }
  };

  const openCreate  = () => { setFormData(EMPTY_FORM); setEditingId(null); setFormErrors({}); setDrawerOpen(true); };
  const openEdit    = (fg) => { setFormData({ name: fg.name ?? '', description: fg.description ?? '' }); setEditingId(fg.id); setFormErrors({}); setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); setFormData(EMPTY_FORM); setEditingId(null); setFormErrors({}); };

  // Filtered + paginated (client-side — groups are few)
  const filtered   = groups.filter(fg =>
    fg.name?.toLowerCase().includes(search.toLowerCase()) ||
    fg.description?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const handleSearchChange = (e) => { setSearch(e.target.value); setCurrentPage(1); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/20 p-4 sm:p-6 light-panel">

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Users size={22} className="text-emerald-600"/> Cooperatives
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {search
                ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${search}"`
                : `${groups.length} group${groups.length !== 1 ? 's' : ''} registered`}
            </p>
          </div>
          <button onClick={openCreate}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-xl font-medium shadow-sm transition-colors">
            <Plus size={15}/> New Cooperative
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Search size={16}/></span>
        <input type="text" placeholder="Search cooperatives…"
          value={search} onChange={handleSearchChange}
          className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm
                     bg-white text-gray-800 placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
        {search && (
          <button onClick={() => { setSearch(''); setCurrentPage(1); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={16}/>
          </button>
        )}
      </div>

      {globalError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
          <AlertTriangle size={15}/> {globalError}
          <button onClick={() => setGlobalError('')} className="ml-auto text-red-400 hover:text-red-600"><X size={15}/></button>
        </div>
      )}

      {/* Group list */}
      <div className="space-y-3">
        {paginated.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <Users size={40} className="mx-auto mb-3 text-gray-300"/>
            <p className="text-gray-500 font-medium">No cooperatives found</p>
            <p className="text-gray-400 text-sm mt-1">
              {search ? 'Try a different search term' : 'Create your first cooperative to get started'}
            </p>
            {!search && (
              <button onClick={openCreate}
                className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-5 py-2 rounded-xl font-medium transition-colors">
                <Plus size={15}/> New Cooperative
              </button>
            )}
          </div>
        ) : paginated.map((fg) => (
          <div key={fg.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-base flex-shrink-0">
                  {fg.name?.[0]?.toUpperCase() || 'G'}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-800 leading-tight truncate">{fg.name}</h3>
                  {fg.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{fg.description}</p>}
                  <span className="text-xs text-gray-400 font-mono mt-1 inline-block">#{fg.id}</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(fg)}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200 transition-colors">
                  <Edit2 size={12}/> Edit
                </button>
                <button onClick={() => handleDelete(fg.id, fg.name)}
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
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                {page}
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

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full z-50 w-full max-w-md bg-white shadow-2xl
                       flex flex-col transition-transform duration-300 ease-out light-panel
                       ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              {editingId ? <Edit2 size={18} className="text-yellow-500"/> : <Plus size={18} className="text-emerald-600"/>}
              {editingId ? 'Edit Cooperative' : 'New Cooperative'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {editingId ? 'Update the cooperative details' : 'Fill in the details to create a new cooperative'}
            </p>
          </div>
          <button onClick={closeDrawer} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <Field label="Group Name" required error={formErrors.name}>
            <input type="text" placeholder="e.g. Abim North Cocoa Cooperative"
              value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
              className={inputCls(formErrors.name)}/>
          </Field>
          <Field label="Description" required error={formErrors.description}>
            <textarea placeholder="Brief description of this cooperative group…"
              value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={4} className={inputCls(formErrors.description) + ' resize-none'}/>
          </Field>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="font-semibold text-emerald-700 text-sm flex items-center gap-2 mb-1">
              <Lightbulb size={15}/> About Cooperatives
            </p>
            <p className="text-xs text-emerald-600 leading-relaxed">
              Cooperatives group farmers together for collective management. Once created, assign farms to this group from the Farm Manager.
            </p>
          </div>
          <div className="h-4"/>
        </form>

        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-white flex gap-3">
          <button type="button" onClick={closeDrawer}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2
              ${submitting ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'}`}>
            {submitting
              ? <><Loader2 size={15} className="animate-spin"/> Saving…</>
              : <><Check size={15}/> {editingId ? 'Update Group' : 'Create Group'}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FarmerGroupManager;