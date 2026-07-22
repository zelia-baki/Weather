import React, { useEffect, useState, useCallback, useRef } from 'react';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';
import {
  Coffee, Tag, Plus, Edit2, Trash2, X, Check,
  Loader2, AlertTriangle, Search, Star, Leaf, BookOpen, Upload, Image as ImageIcon,
} from 'lucide-react';

// ── Shared helpers ────────────────────────────────────────────────────────────
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

const textareaCls = (err) =>
  `w-full border rounded-xl px-3.5 py-2.5 text-sm transition-all outline-none resize-none
   bg-white text-gray-800 placeholder-gray-400
   focus:ring-2 focus:border-transparent
   ${err ? 'border-red-300 focus:ring-red-300' : 'border-gray-200 focus:ring-emerald-400 hover:border-gray-300'}`;

const Field = ({ label, required, error, hint, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
      {label}{required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={11}/>{error}</p>}
  </div>
);

const DrawerFooter = ({ onCancel, onSubmit, submitting, editingId, label }) => (
  <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-white flex gap-3">
    <button type="button" onClick={onCancel}
      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors">
      Cancel
    </button>
    <button onClick={onSubmit} disabled={submitting}
      className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2
        ${submitting ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'}`}>
      {submitting
        ? <><Loader2 size={15} className="animate-spin"/> Saving…</>
        : <><Check size={15}/> {editingId ? `Update ${label}` : `Create ${label}`}</>}
    </button>
  </div>
);

// Liste dynamique (images, certifications) — ajoute/retire des lignes de texte
const DynamicListField = ({ label, values, onChange, placeholder }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
    {values.map((val, i) => (
      <div key={i} className="flex gap-2">
        <input
          type="text"
          placeholder={placeholder}
          value={val}
          onChange={e => {
            const next = [...values];
            next[i] = e.target.value;
            onChange(next);
          }}
          className={inputCls(false)}
        />
        <button type="button"
          onClick={() => onChange(values.filter((_, idx) => idx !== i))}
          className="px-3 rounded-xl border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
          <X size={14}/>
        </button>
      </div>
    ))}
    <button type="button" onClick={() => onChange([...values, ''])}
      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-1">
      <Plus size={13}/> Add
    </button>
  </div>
);

// Champ image : URL collée OU fichier uploadé, au choix, pour chaque ligne
const ImageListField = ({ label, values, onChange }) => {
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const fileInputRefs = useRef({});

  const handleFileSelect = async (i, file) => {
    if (!file) return;
    setUploadingIndex(i);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axiosInstance.post('/api/ecommerce/products/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const next = [...values];
      next[i] = res.data.url;
      onChange(next);
    } catch (err) {
      Swal.fire({
        icon: 'error', title: 'Upload failed',
        text: err.response?.data?.msg || err.message,
        customClass: { popup: 'rounded-2xl' },
      });
    } finally {
      setUploadingIndex(null);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
      {values.map((val, i) => (
        <div key={i} className="flex gap-2 items-center">
          <div className="w-10 h-10 rounded-lg border border-gray-200 flex-shrink-0 overflow-hidden bg-gray-50 flex items-center justify-center">
            {val
              ? <img src={val} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
              : <ImageIcon size={14} className="text-gray-300" />}
          </div>
          <input
            type="text"
            placeholder="Paste a URL, or upload a file →"
            value={val}
            onChange={e => {
              const next = [...values];
              next[i] = e.target.value;
              onChange(next);
            }}
            className={inputCls(false)}
          />
          <input
            type="file" accept="image/png,image/jpeg,image/webp"
            ref={el => (fileInputRefs.current[i] = el)}
            onChange={e => handleFileSelect(i, e.target.files[0])}
            className="hidden"
          />
          <button type="button"
            onClick={() => fileInputRefs.current[i]?.click()}
            disabled={uploadingIndex === i}
            title="Upload a file instead of a URL"
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 flex-shrink-0 transition-colors">
            {uploadingIndex === i ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          </button>
          <button type="button"
            onClick={() => onChange(values.filter((_, idx) => idx !== i))}
            className="px-3 rounded-xl border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0">
            <X size={14} />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...values, ''])}
        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-1">
        <Plus size={13} /> Add image
      </button>
    </div>
  );
};

// ── EMPTY FORMS ───────────────────────────────────────────────────────────────
const EMPTY_CATEGORY = { name: '', description: '' };
const EMPTY_PRODUCT = {
  name: '', description: '', category_id: '', price: '', compare_at_price: '',
  currency: 'UGX', unit: 'kg', stock: '', sku: '', origin_country: '',
  is_deforestation_free: false, is_featured: false, is_active: true,
  certification_labels: [], images: [],
  // ── Storytelling ──
  origin_story: '', farmer_name: '', harvest_year: '',
};

// =============================================================================
const EcoProductManager = () => {
  const [tab,             setTab]             = useState('products'); // 'categories' | 'products'
  const [categories,      setCategories]      = useState([]);
  const [products,        setProducts]        = useState([]);
  const [categoryForm,    setCategoryForm]    = useState(EMPTY_CATEGORY);
  const [productForm,     setProductForm]     = useState(EMPTY_PRODUCT);
  const [categoryErrors,  setCategoryErrors]  = useState({});
  const [productErrors,   setProductErrors]   = useState({});
  const [editCategoryId,  setEditCategoryId]  = useState(null);
  const [editProductId,   setEditProductId]   = useState(null);
  const [drawerType,      setDrawerType]      = useState(null); // 'category' | 'product'
  const [submitting,      setSubmitting]      = useState(false);
  const [search,          setSearch]          = useState('');
  const [globalError,     setGlobalError]     = useState('');

  const fetchCategories = useCallback(async () => {
    try { const r = await axiosInstance.get('/api/ecommerce/categories'); setCategories(r.data ?? []); }
    catch { setGlobalError('Error fetching categories.'); }
  }, []);

  const fetchProducts = useCallback(async () => {
    try { const r = await axiosInstance.get('/api/ecommerce/products/admin'); setProducts(r.data ?? []); }
    catch { setGlobalError('Error fetching products.'); }
  }, []);

  useEffect(() => { fetchCategories(); fetchProducts(); }, [fetchCategories, fetchProducts]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateCategory = () => {
    const e = {};
    if (!categoryForm.name.trim()) e.name = 'Category name is required';
    return e;
  };
  const validateProduct = () => {
    const e = {};
    if (!productForm.name.trim())        e.name        = 'Product name is required';
    if (!productForm.price)              e.price       = 'Price is required';
    if (!productForm.category_id)        e.category_id = 'Category is required';
    if (productForm.harvest_year && String(productForm.harvest_year).length !== 4)
      e.harvest_year = 'Enter a 4-digit year';
    return e;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    const errs = validateCategory();
    if (Object.keys(errs).length) { setCategoryErrors(errs); return; }
    setSubmitting(true);
    try {
      if (editCategoryId) await axiosInstance.put(`/api/ecommerce/categories/${editCategoryId}/edit`, categoryForm);
      else                await axiosInstance.post('/api/ecommerce/categories/create', categoryForm);
      await fetchCategories();
      closeDrawer();
      Swal.fire({ icon: 'success', title: editCategoryId ? 'Category updated!' : 'Category created!',
        timer: 2000, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.msg || err.message,
        customClass: { popup: 'rounded-2xl' } });
    } finally { setSubmitting(false); }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const errs = validateProduct();
    if (Object.keys(errs).length) { setProductErrors(errs); return; }
    setSubmitting(true);
    try {
      const payload = {
        ...productForm,
        price: parseFloat(productForm.price),
        compare_at_price: productForm.compare_at_price ? parseFloat(productForm.compare_at_price) : null,
        stock: parseInt(productForm.stock || 0, 10),
        category_id: parseInt(productForm.category_id, 10),
        certification_labels: productForm.certification_labels.filter(Boolean),
        images: productForm.images.filter(Boolean),
        harvest_year: productForm.harvest_year ? parseInt(productForm.harvest_year, 10) : null,
        origin_story: productForm.origin_story?.trim() || null,
        farmer_name: productForm.farmer_name?.trim() || null,
      };
      if (editProductId) await axiosInstance.put(`/api/ecommerce/products/${editProductId}/edit`, payload);
      else                await axiosInstance.post('/api/ecommerce/products/create', payload);
      await fetchProducts();
      closeDrawer();
      Swal.fire({ icon: 'success', title: editProductId ? 'Product updated!' : 'Product created!',
        timer: 2000, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.msg || err.message,
        customClass: { popup: 'rounded-2xl' } });
    } finally { setSubmitting(false); }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDeleteCategory = async (id, name) => {
    const r = await Swal.fire({ title: `Delete "${name}"?`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete',
      customClass: { popup: 'rounded-2xl' } });
    if (!r.isConfirmed) return;
    try { await axiosInstance.delete(`/api/ecommerce/categories/${id}/delete`); await fetchCategories(); }
    catch { setGlobalError('Error deleting category.'); }
  };

  const handleDeleteProduct = async (id, name) => {
    const r = await Swal.fire({ title: `Delete "${name}"?`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete',
      customClass: { popup: 'rounded-2xl' } });
    if (!r.isConfirmed) return;
    try { await axiosInstance.delete(`/api/ecommerce/products/${id}/delete`); await fetchProducts(); }
    catch { setGlobalError('Error deleting product.'); }
  };

  // ── Drawer ──────────────────────────────────────────────────────────────────
  const openCategoryDrawer = (category = null) => {
    setCategoryForm(category ? { name: category.name, description: category.description || '' } : EMPTY_CATEGORY);
    setEditCategoryId(category?.id ?? null);
    setCategoryErrors({});
    setDrawerType('category');
  };

  const openProductDrawer = (product = null) => {
    setProductForm(product ? {
      name: product.name, description: product.description || '',
      category_id: categories.find(c => c.name === product.category)?.id ?? '',
      price: product.price, compare_at_price: product.compare_at_price ?? '',
      currency: product.currency, unit: product.unit, stock: product.stock,
      sku: product.sku || '', origin_country: product.origin_country || '',
      is_deforestation_free: product.is_deforestation_free, is_featured: product.is_featured,
      is_active: product.is_active,
      certification_labels: product.certification_labels?.length ? product.certification_labels : [],
      images: product.images?.length ? product.images : [],
      origin_story: product.origin_story || '',
      farmer_name: product.farmer_name || '',
      harvest_year: product.harvest_year ?? '',
    } : EMPTY_PRODUCT);
    setEditProductId(product?.id ?? null);
    setProductErrors({});
    setDrawerType('product');
  };

  const closeDrawer = () => {
    setDrawerType(null);
    setCategoryForm(EMPTY_CATEGORY); setProductForm(EMPTY_PRODUCT);
    setEditCategoryId(null); setEditProductId(null);
    setCategoryErrors({}); setProductErrors({});
  };

  const drawerOpen = drawerType !== null;
  const filteredCategories = categories.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));
  const filteredProducts   = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/20 p-4 sm:p-6 light-panel">

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Coffee size={22} className="text-emerald-600"/> Eco-Shop Manager
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">{categories.length} categories · {products.length} products</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setTab('categories'); openCategoryDrawer(); }}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-xl font-medium shadow-sm transition-colors">
              <Plus size={15}/> New Category
            </button>
            <button onClick={() => { setTab('products'); openProductDrawer(); }}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-xl font-medium shadow-sm transition-colors">
              <Plus size={15}/> New Product
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-5 shadow-sm w-fit">
        {[
          { id: 'categories', label: 'Categories', icon: <Tag size={15}/>,    count: categories.length },
          { id: 'products',   label: 'Products',   icon: <Coffee size={15}/>, count: products.length },
        ].map(({ id, label, icon, count }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
            {icon} {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === id ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Search size={16}/></span>
        <input type="text" placeholder={`Search ${tab}…`} value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={16}/></button>}
      </div>

      {globalError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
          <AlertTriangle size={15}/> {globalError}
          <button onClick={() => setGlobalError('')} className="ml-auto"><X size={15}/></button>
        </div>
      )}

      {/* Content — Categories */}
      {tab === 'categories' && (
        <div className="space-y-3">
          {filteredCategories.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <Tag size={40} className="mx-auto mb-3 text-gray-300"/>
              <p className="text-gray-500 font-medium">No categories found</p>
              <button onClick={() => openCategoryDrawer()}
                className="mt-4 inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2 rounded-xl font-medium transition-colors">
                <Plus size={15}/> New Category
              </button>
            </div>
          ) : filteredCategories.map(cat => (
            <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold flex-shrink-0">
                    {cat.name?.[0]?.toUpperCase() || 'C'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{cat.name}</h3>
                    {cat.description && <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => openCategoryDrawer(cat)}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200 transition-colors">
                    <Edit2 size={12}/> Edit
                  </button>
                  <button onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-red-50 text-red-700 hover:bg-red-100 border-red-200 transition-colors">
                    <Trash2 size={12}/> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content — Products */}
      {tab === 'products' && (
        <div className="space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <Coffee size={40} className="mx-auto mb-3 text-gray-300"/>
              <p className="text-gray-500 font-medium">No products found</p>
              <button onClick={() => openProductDrawer()}
                className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-5 py-2 rounded-xl font-medium transition-colors">
                <Plus size={15}/> New Product
              </button>
            </div>
          ) : filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold flex-shrink-0">
                    {product.name?.[0]?.toUpperCase() || 'P'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      {product.name}
                      {product.is_featured && <Star size={13} className="text-yellow-500 fill-yellow-500"/>}
                      {product.is_deforestation_free && <Leaf size={13} className="text-emerald-500"/>}
                      {product.origin_story && <BookOpen size={13} className="text-blue-500" title="Has a story"/>}
                      {!product.is_active && <span className="text-xs text-gray-400 font-normal">(inactive)</span>}
                    </h3>
                    <div className="flex flex-wrap gap-3 mt-1">
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        {product.price?.toLocaleString()} {product.currency}
                      </span>
                      <span className="text-xs text-gray-500">{product.category}</span>
                      <span className="text-xs text-gray-500">Stock: {product.stock}</span>
                      {product.farmer_name && <span className="text-xs text-gray-500">Farmer: {product.farmer_name}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => openProductDrawer(product)}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200 transition-colors">
                    <Edit2 size={12}/> Edit
                  </button>
                  <button onClick={() => handleDeleteProduct(product.id, product.name)}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-red-50 text-red-700 hover:bg-red-100 border-red-200 transition-colors">
                    <Trash2 size={12}/> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawer backdrop */}
      {drawerOpen && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={closeDrawer}/>}

      {/* Category Drawer */}
      <div className={`fixed top-0 right-0 h-full z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out light-panel ${drawerType === 'category' ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              {editCategoryId ? <Edit2 size={18} className="text-yellow-500"/> : <Plus size={18} className="text-blue-600"/>}
              {editCategoryId ? 'Edit Category' : 'New Category'}
            </h2>
          </div>
          <button onClick={closeDrawer} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <Field label="Category Name" required error={categoryErrors.name}>
            <input type="text" placeholder="e.g. Coffee" value={categoryForm.name}
              onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} className={inputCls(categoryErrors.name)}/>
          </Field>
          <Field label="Description">
            <textarea rows={3} placeholder="Optional description" value={categoryForm.description}
              onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} className={textareaCls(false)}/>
          </Field>
        </div>
        <DrawerFooter onCancel={closeDrawer} onSubmit={handleCategorySubmit} submitting={submitting} editingId={editCategoryId} label="Category"/>
      </div>

      {/* Product Drawer */}
      <div className={`fixed top-0 right-0 h-full z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out light-panel ${drawerType === 'product' ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              {editProductId ? <Edit2 size={18} className="text-yellow-500"/> : <Plus size={18} className="text-emerald-600"/>}
              {editProductId ? 'Edit Product' : 'New Product'}
            </h2>
          </div>
          <button onClick={closeDrawer} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <Field label="Product Name" required error={productErrors.name}>
            <input type="text" placeholder="e.g. Arabica Premium 1kg" value={productForm.name}
              onChange={e => setProductForm({ ...productForm, name: e.target.value })} className={inputCls(productErrors.name)}/>
          </Field>
          <Field label="Description" hint="Short, factual — what it is (used in listings).">
            <textarea rows={2} placeholder="e.g. Washed arabica, medium roast, 1kg bag" value={productForm.description}
              onChange={e => setProductForm({ ...productForm, description: e.target.value })} className={textareaCls(false)}/>
          </Field>
          <Field label="Category" required error={productErrors.category_id}>
            <select value={productForm.category_id} onChange={e => setProductForm({ ...productForm, category_id: e.target.value })} className={selectCls(productErrors.category_id)}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price" required error={productErrors.price}>
              <input type="number" step="0.01" min="0" placeholder="0.00" value={productForm.price}
                onChange={e => setProductForm({ ...productForm, price: e.target.value })} className={inputCls(productErrors.price)}/>
            </Field>
            <Field label="Compare-at price">
              <input type="number" step="0.01" min="0" placeholder="Optional" value={productForm.compare_at_price}
                onChange={e => setProductForm({ ...productForm, compare_at_price: e.target.value })} className={inputCls(false)}/>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Currency">
              <select value={productForm.currency} onChange={e => setProductForm({ ...productForm, currency: e.target.value })} className={selectCls(false)}>
                <option value="UGX">UGX</option>
                <option value="USD">USD</option>
                <option value="KES">KES</option>
              </select>
            </Field>
            <Field label="Unit">
              <input type="text" placeholder="kg" value={productForm.unit}
                onChange={e => setProductForm({ ...productForm, unit: e.target.value })} className={inputCls(false)}/>
            </Field>
            <Field label="Stock">
              <input type="number" min="0" placeholder="0" value={productForm.stock}
                onChange={e => setProductForm({ ...productForm, stock: e.target.value })} className={inputCls(false)}/>
            </Field>
          </div>
          <Field label="SKU">
            <input type="text" placeholder="Optional stock keeping unit" value={productForm.sku}
              onChange={e => setProductForm({ ...productForm, sku: e.target.value })} className={inputCls(false)}/>
          </Field>
          <Field label="Origin Country">
            <input type="text" placeholder="e.g. Uganda" value={productForm.origin_country}
              onChange={e => setProductForm({ ...productForm, origin_country: e.target.value })} className={inputCls(false)}/>
          </Field>

          {/* ── Storytelling ─────────────────────────────────────────── */}
          <div className="pt-2 mt-1 border-t border-gray-100">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <BookOpen size={13}/> Product Story
            </p>
            <div className="space-y-4">
              <Field label="Origin story" hint="The narrative shown on the product page — who grew it, what makes this lot worth telling about.">
                <textarea rows={4} placeholder="e.g. Grown on a 2-hectare plot in the hills above..." value={productForm.origin_story}
                  onChange={e => setProductForm({ ...productForm, origin_story: e.target.value })} className={textareaCls(false)}/>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Farmer name" hint="Optional — leave blank to stay anonymous.">
                  <input type="text" placeholder="e.g. Grace N." value={productForm.farmer_name}
                    onChange={e => setProductForm({ ...productForm, farmer_name: e.target.value })} className={inputCls(false)}/>
                </Field>
                <Field label="Harvest year" error={productErrors.harvest_year}>
                  <input type="number" placeholder="2025" value={productForm.harvest_year}
                    onChange={e => setProductForm({ ...productForm, harvest_year: e.target.value })} className={inputCls(productErrors.harvest_year)}/>
                </Field>
              </div>
            </div>
          </div>

          <ImageListField label="Images" values={productForm.images}
            onChange={(next) => setProductForm({ ...productForm, images: next })} />

          <DynamicListField label="Certification labels" values={productForm.certification_labels}
            onChange={(next) => setProductForm({ ...productForm, certification_labels: next })}
            placeholder="e.g. EUDR-compliant" />

          <div className="flex flex-col gap-2.5 pt-1">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={productForm.is_deforestation_free}
                onChange={e => setProductForm({ ...productForm, is_deforestation_free: e.target.checked })}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-400"/>
              Deforestation-free
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={productForm.is_featured}
                onChange={e => setProductForm({ ...productForm, is_featured: e.target.checked })}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-400"/>
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={productForm.is_active}
                onChange={e => setProductForm({ ...productForm, is_active: e.target.checked })}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-400"/>
              Active (visible in shop)
            </label>
          </div>
        </div>
        <DrawerFooter onCancel={closeDrawer} onSubmit={handleProductSubmit} submitting={submitting} editingId={editProductId} label="Product"/>
      </div>
    </div>
  );
};

export default EcoProductManager;