import React, { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';
import {
  Store, Package, Plus, Edit2, Trash2, X, Check,
  Loader2, AlertTriangle, MapPin, Globe, Building2,
  ChevronLeft, ChevronRight, Search,
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

const Field = ({ label, required, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
      {label}{required && <span className="text-red-400">*</span>}
    </label>
    {children}
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

// ── EMPTY FORMS ───────────────────────────────────────────────────────────────
const EMPTY_STORE   = { name: '', location: '', country: '', district: '' };
const EMPTY_PRODUCT = { name: '', price: '', store_id: '' };

// =============================================================================
const StoreProductManager = () => {
  const [tab,           setTab]           = useState('stores'); // 'stores' | 'products'
  const [stores,        setStores]        = useState([]);
  const [products,      setProducts]      = useState([]);
  const [storeForm,     setStoreForm]     = useState(EMPTY_STORE);
  const [productForm,   setProductForm]   = useState(EMPTY_PRODUCT);
  const [storeErrors,   setStoreErrors]   = useState({});
  const [productErrors, setProductErrors] = useState({});
  const [editStoreId,   setEditStoreId]   = useState(null);
  const [editProductId, setEditProductId] = useState(null);
  const [drawerType,    setDrawerType]    = useState(null); // 'store' | 'product'
  const [submitting,    setSubmitting]    = useState(false);
  const [search,        setSearch]        = useState('');
  const [globalError,   setGlobalError]   = useState('');

  const fetchStores   = useCallback(async () => {
    try { const r = await axiosInstance.get('/api/store/');   setStores(r.data.stores   ?? []); }
    catch { setGlobalError('Error fetching stores.'); }
  }, []);

  const fetchProducts = useCallback(async () => {
    try { const r = await axiosInstance.get('/api/product/'); setProducts(r.data.products ?? []); }
    catch { setGlobalError('Error fetching products.'); }
  }, []);

  useEffect(() => { fetchStores(); fetchProducts(); }, [fetchStores, fetchProducts]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateStore = () => {
    const e = {};
    if (!storeForm.name.trim())     e.name     = 'Store name is required';
    if (!storeForm.location.trim()) e.location = 'Location is required';
    if (!storeForm.country.trim())  e.country  = 'Country is required';
    if (!storeForm.district.trim()) e.district = 'District is required';
    return e;
  };
  const validateProduct = () => {
    const e = {};
    if (!productForm.name.trim()) e.name     = 'Product name is required';
    if (!productForm.price)       e.price    = 'Price is required';
    if (!productForm.store_id)    e.store_id = 'Store is required';
    return e;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleStoreSubmit = async (e) => {
    e.preventDefault();
    const errs = validateStore();
    if (Object.keys(errs).length) { setStoreErrors(errs); return; }
    setSubmitting(true);
    try {
      if (editStoreId) await axiosInstance.put(`/api/store/${editStoreId}/edit`, storeForm);
      else             await axiosInstance.post('/api/store/create', storeForm);
      await fetchStores();
      closeDrawer();
      Swal.fire({ icon: 'success', title: editStoreId ? 'Store updated!' : 'Store created!',
        timer: 2000, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || err.message,
        customClass: { popup: 'rounded-2xl' } });
    } finally { setSubmitting(false); }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const errs = validateProduct();
    if (Object.keys(errs).length) { setProductErrors(errs); return; }
    setSubmitting(true);
    try {
      if (editProductId) await axiosInstance.put(`/api/product/${editProductId}/edit`, productForm);
      else               await axiosInstance.post('/api/product/create', productForm);
      await fetchProducts();
      closeDrawer();
      Swal.fire({ icon: 'success', title: editProductId ? 'Product updated!' : 'Product created!',
        timer: 2000, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || err.message,
        customClass: { popup: 'rounded-2xl' } });
    } finally { setSubmitting(false); }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDeleteStore = async (id, name) => {
    const r = await Swal.fire({ title: `Delete "${name}"?`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete',
      customClass: { popup: 'rounded-2xl' } });
    if (!r.isConfirmed) return;
    try { await axiosInstance.delete(`/api/store/${id}/delete`); await fetchStores(); }
    catch { setGlobalError('Error deleting store.'); }
  };

  const handleDeleteProduct = async (id, name) => {
    const r = await Swal.fire({ title: `Delete "${name}"?`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete',
      customClass: { popup: 'rounded-2xl' } });
    if (!r.isConfirmed) return;
    try { await axiosInstance.delete(`/api/product/${id}/delete`); await fetchProducts(); }
    catch { setGlobalError('Error deleting product.'); }
  };

  // ── Drawer ──────────────────────────────────────────────────────────────────
  const openStoreDrawer = (store = null) => {
    setStoreForm(store ? { name: store.name, location: store.location, country: store.country, district: store.district } : EMPTY_STORE);
    setEditStoreId(store?.id ?? null);
    setStoreErrors({});
    setDrawerType('store');
  };
  const openProductDrawer = (product = null) => {
    setProductForm(product ? { name: product.name, price: product.price, store_id: product.store_id } : EMPTY_PRODUCT);
    setEditProductId(product?.id ?? null);
    setProductErrors({});
    setDrawerType('product');
  };
  const closeDrawer = () => {
    setDrawerType(null);
    setStoreForm(EMPTY_STORE); setProductForm(EMPTY_PRODUCT);
    setEditStoreId(null); setEditProductId(null);
    setStoreErrors({}); setProductErrors({});
  };

  const drawerOpen = drawerType !== null;
  const filteredStores   = stores.filter(s =>   s.name?.toLowerCase().includes(search.toLowerCase()) || s.location?.toLowerCase().includes(search.toLowerCase()));
  const filteredProducts = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 p-4 sm:p-6 light-panel">

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Store size={22} className="text-blue-600"/> Store & Product Manager
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">{stores.length} stores · {products.length} products</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setTab('stores');   openStoreDrawer(); }}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-xl font-medium shadow-sm transition-colors">
              <Plus size={15}/> New Store
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
          { id: 'stores',   label: 'Stores',   icon: <Store size={15}/>,   count: stores.length },
          { id: 'products', label: 'Products', icon: <Package size={15}/>, count: products.length },
        ].map(({ id, label, icon, count }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
            {icon} {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Search size={16}/></span>
        <input type="text" placeholder={`Search ${tab}…`} value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"/>
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={16}/></button>}
      </div>

      {globalError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
          <AlertTriangle size={15}/> {globalError}
          <button onClick={() => setGlobalError('')} className="ml-auto"><X size={15}/></button>
        </div>
      )}

      {/* Content */}
      {tab === 'stores' && (
        <div className="space-y-3">
          {filteredStores.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <Store size={40} className="mx-auto mb-3 text-gray-300"/>
              <p className="text-gray-500 font-medium">No stores found</p>
              <button onClick={() => openStoreDrawer()}
                className="mt-4 inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2 rounded-xl font-medium transition-colors">
                <Plus size={15}/> New Store
              </button>
            </div>
          ) : filteredStores.map(store => (
            <div key={store.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold flex-shrink-0">
                    {store.name?.[0]?.toUpperCase() || 'S'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{store.name}</h3>
                    <div className="flex flex-wrap gap-3 mt-1">
                      {store.location && <span className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={11}/>{store.location}</span>}
                      {store.country  && <span className="text-xs text-gray-500 flex items-center gap-1"><Globe size={11}/>{store.country}</span>}
                      {store.district && <span className="text-xs text-gray-500 flex items-center gap-1"><Building2 size={11}/>{store.district}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => openStoreDrawer(store)}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200 transition-colors">
                    <Edit2 size={12}/> Edit
                  </button>
                  <button onClick={() => handleDeleteStore(store.id, store.name)}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-red-50 text-red-700 hover:bg-red-100 border-red-200 transition-colors">
                    <Trash2 size={12}/> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'products' && (
        <div className="space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <Package size={40} className="mx-auto mb-3 text-gray-300"/>
              <p className="text-gray-500 font-medium">No products found</p>
              <button onClick={() => openProductDrawer()}
                className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-5 py-2 rounded-xl font-medium transition-colors">
                <Plus size={15}/> New Product
              </button>
            </div>
          ) : filteredProducts.map(product => {
            const storeName = stores.find(s => s.id === product.store_id)?.name || `Store #${product.store_id}`;
            return (
              <div key={product.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold flex-shrink-0">
                      {product.name?.[0]?.toUpperCase() || 'P'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{product.name}</h3>
                      <div className="flex flex-wrap gap-3 mt-1">
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          ${product.price}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1"><Store size={11}/>{storeName}</span>
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
            );
          })}
        </div>
      )}

      {/* Drawer backdrop */}
      {drawerOpen && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={closeDrawer}/>}

      {/* Store Drawer */}
      <div className={`fixed top-0 right-0 h-full z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out light-panel ${drawerType === 'store' ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              {editStoreId ? <Edit2 size={18} className="text-yellow-500"/> : <Plus size={18} className="text-blue-600"/>}
              {editStoreId ? 'Edit Store' : 'New Store'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{editStoreId ? 'Update store details' : 'Register a new store location'}</p>
          </div>
          <button onClick={closeDrawer} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <Field label="Store Name" required error={storeErrors.name}>
            <input type="text" placeholder="e.g. Kampala Central Store" value={storeForm.name}
              onChange={e => setStoreForm({ ...storeForm, name: e.target.value })} className={inputCls(storeErrors.name)}/>
          </Field>
          <Field label="Location" required error={storeErrors.location}>
            <input type="text" placeholder="e.g. Nakasero Market" value={storeForm.location}
              onChange={e => setStoreForm({ ...storeForm, location: e.target.value })} className={inputCls(storeErrors.location)}/>
          </Field>
          <Field label="Country" required error={storeErrors.country}>
            <input type="text" placeholder="e.g. Uganda" value={storeForm.country}
              onChange={e => setStoreForm({ ...storeForm, country: e.target.value })} className={inputCls(storeErrors.country)}/>
          </Field>
          <Field label="District" required error={storeErrors.district}>
            <input type="text" placeholder="e.g. Kampala" value={storeForm.district}
              onChange={e => setStoreForm({ ...storeForm, district: e.target.value })} className={inputCls(storeErrors.district)}/>
          </Field>
        </div>
        <DrawerFooter onCancel={closeDrawer} onSubmit={handleStoreSubmit} submitting={submitting} editingId={editStoreId} label="Store"/>
      </div>

      {/* Product Drawer */}
      <div className={`fixed top-0 right-0 h-full z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out light-panel ${drawerType === 'product' ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              {editProductId ? <Edit2 size={18} className="text-yellow-500"/> : <Plus size={18} className="text-emerald-600"/>}
              {editProductId ? 'Edit Product' : 'New Product'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{editProductId ? 'Update product details' : 'Add a new product to a store'}</p>
          </div>
          <button onClick={closeDrawer} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <Field label="Product Name" required error={productErrors.name}>
            <input type="text" placeholder="e.g. Cocoa Beans 50kg" value={productForm.name}
              onChange={e => setProductForm({ ...productForm, name: e.target.value })} className={inputCls(productErrors.name)}/>
          </Field>
          <Field label="Price (USD)" required error={productErrors.price}>
            <input type="number" step="0.01" min="0" placeholder="0.00" value={productForm.price}
              onChange={e => setProductForm({ ...productForm, price: e.target.value })} className={inputCls(productErrors.price)}/>
          </Field>
          <Field label="Store" required error={productErrors.store_id}>
            <select value={productForm.store_id} onChange={e => setProductForm({ ...productForm, store_id: e.target.value })} className={selectCls(productErrors.store_id)}>
              <option value="">Select store</option>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
        </div>
        <DrawerFooter onCancel={closeDrawer} onSubmit={handleProductSubmit} submitting={submitting} editingId={editProductId} label="Product"/>
      </div>
    </div>
  );
};

export default StoreProductManager;