import React, { useEffect, useState, useCallback, useRef } from 'react';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';
import {
  Tag, Plus, Edit2, Trash2, X, Check,
  Loader2, AlertTriangle, Search, Calendar,
} from 'lucide-react';

// ─── Shared style helpers ───────────────────────────────────────────────────
const inputCls = (err) =>
  `w-full border rounded-xl px-3.5 py-2.5 text-sm transition-all outline-none
   bg-white text-gray-800 placeholder-gray-400
   focus:ring-2 focus:border-transparent
   ${err
     ? 'border-red-300 focus:ring-red-300'
     : 'border-gray-200 focus:ring-violet-400 hover:border-gray-300'}`;

const Field = ({ label, required, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
      {label}
      {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-xs text-red-500 flex items-center gap-1">
        <AlertTriangle size={11} />{error}
      </p>
    )}
  </div>
);

// ─── Avatar initials ────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-indigo-100 text-indigo-700',
];

const avatarColor = (name = '') => {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx] ?? AVATAR_COLORS[0];
};

// ─── Format date ────────────────────────────────────────────────────────────
const fmtDate = (raw) => {
  if (!raw) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      .format(new Date(raw));
  } catch { return raw; }
};

// =============================================================================
// COMPONENT
// =============================================================================
const CategoryManager = () => {
  const [categories,  setCategories]  = useState([]);
  const [formName,    setFormName]    = useState('');
  const [formError,   setFormError]   = useState('');
  const [editingId,   setEditingId]   = useState(null);
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [search,      setSearch]      = useState('');
  const [globalError, setGlobalError] = useState('');
  const [loading,     setLoading]     = useState(true);
  const inputRef = useRef(null);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get('/api/producecategory/');
      setCategories(data.categories ?? data ?? []);
    } catch {
      setGlobalError('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // Focus input when drawer opens
  useEffect(() => {
    if (drawerOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [drawerOpen]);

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (ev) => {
    ev?.preventDefault();
    if (!formName.trim()) { setFormError('Name is required'); return; }
    setSubmitting(true);
    try {
      if (editingId) {
        await axiosInstance.put(`/api/producecategory/${editingId}/edit`, {
          name: formName.trim(),
          modified_by: 'admin',
        });
      } else {
        await axiosInstance.post('/api/producecategory/create', {
          name: formName.trim(),
          created_by: 'admin',
        });
      }
      await fetchCategories();
      closeDrawer();
      Swal.fire({
        icon: 'success',
        title: editingId ? 'Category updated!' : 'Category created!',
        timer: 1800,
        showConfirmButton: false,
        customClass: { popup: 'rounded-2xl' },
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.msg || err.message,
        customClass: { popup: 'rounded-2xl' },
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: `Supprimer "${name}" ?`,
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonText: 'Cancel',
      confirmButtonText: 'Delete',
      customClass: { popup: 'rounded-2xl' },
    });
    if (!result.isConfirmed) return;
    try {
      await axiosInstance.delete(`/api/producecategory/${id}/delete`);
      await fetchCategories();
    } catch {
      setGlobalError('Error lors de la suppression.');
    }
  };

  // ── Drawer helpers ─────────────────────────────────────────────────────────
  const openCreate = () => {
    setFormName(''); setFormError(''); setEditingId(null); setDrawerOpen(true);
  };
  const openEdit = (cat) => {
    setFormName(cat.name); setFormError(''); setEditingId(cat.id); setDrawerOpen(true);
  };
  const closeDrawer = () => {
    setDrawerOpen(false); setFormName(''); setFormError(''); setEditingId(null);
  };

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = categories.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-violet-50/20 p-4 sm:p-6 light-panel">

      {/* ── Header card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Tag size={22} className="text-violet-600" />
              Category Manager
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'} registered
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700
                       text-white text-sm px-4 py-2 rounded-xl font-medium shadow-sm transition-colors"
          >
            <Plus size={15} /> New Category
          </button>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="relative mb-5">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Search size={16} />
        </span>
        <input
          type="text"
          placeholder="Search categories…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm
                     bg-white text-gray-800 placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Global error ── */}
      {globalError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3
                        rounded-xl mb-4 flex items-center gap-2">
          <AlertTriangle size={15} />
          {globalError}
          <button onClick={() => setGlobalError('')} className="ml-auto">
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── Category list ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 size={32} className="animate-spin mb-3" />
          <p className="text-sm">Loading…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Tag size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">No categories found</p>
          {!search && (
            <button
              onClick={openCreate}
              className="mt-4 inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700
                         text-white text-sm px-5 py-2 rounded-xl font-medium transition-colors"
            >
              <Plus size={15} /> New Category
            </button>
          )}
        </div>
      ) : (
        /* Responsive grid: 1 col mobile, 2 cols md+, 3 cols xl+ */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((cat) => {
            const color = avatarColor(cat.name);
            return (
              <div
                key={cat.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm
                           hover:shadow-md hover:border-violet-200 transition-all p-4 sm:p-5
                           flex items-center justify-between gap-4"
              >
                {/* Left: avatar + info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center
                                   font-bold text-sm flex-shrink-0 ${color}`}>
                    {cat.name?.[0]?.toUpperCase() || 'C'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-800 truncate">{cat.name}</h3>
                    {cat.date_created && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Calendar size={11} />
                        {fmtDate(cat.date_created)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => openEdit(cat)}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5
                               rounded-lg border bg-yellow-50 text-yellow-700
                               hover:bg-yellow-100 border-yellow-200 transition-colors"
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5
                               rounded-lg border bg-red-50 text-red-700
                               hover:bg-red-100 border-red-200 transition-colors"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Drawer backdrop ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={closeDrawer}
        />
      )}

      {/* ── Side drawer ── */}
      <div
        className={`fixed top-0 right-0 h-full z-50 w-full max-w-md bg-white shadow-2xl
                    flex flex-col transition-transform duration-300 ease-out light-panel
                    ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              {editingId
                ? <Edit2 size={18} className="text-yellow-500" />
                : <Plus size={18} className="text-violet-600" />}
              {editingId ? 'Edit Category' : 'New Category'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {editingId ? 'Update category name' : 'Register a new category'}
            </p>
          </div>
          <button
            onClick={closeDrawer}
            className="w-9 h-9 flex items-center justify-center rounded-full
                       hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <Field label="Category Name" required error={formError}>
            <input
              ref={inputRef}
              type="text"
              placeholder="e.g. Cocoa, Vanilla, Coffee…"
              value={formName}
              onChange={(e) => { setFormName(e.target.value); setFormError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className={inputCls(formError)}
            />
          </Field>
          <p className="text-xs text-gray-400 mt-2">
            Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-500 text-xs">Enter</kbd> to confirm quickly.
          </p>
        </div>

        {/* Drawer footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-white flex gap-3">
          <button
            type="button"
            onClick={closeDrawer}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200
                       text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold
                        transition-all flex items-center justify-center gap-2
                        ${submitting
                          ? 'bg-violet-400 cursor-not-allowed'
                          : 'bg-violet-600 hover:bg-violet-700 shadow-sm'}`}
          >
            {submitting
              ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
              : <><Check size={15} /> {editingId ? 'Update' : 'Create'}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;