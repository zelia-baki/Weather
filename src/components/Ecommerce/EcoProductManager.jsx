import React, { useEffect, useState, useCallback, useRef } from 'react';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';
import {
  Coffee, Tag, Plus, Edit2, Trash2, X, Check,
  Loader2, AlertTriangle, Search, Star, Leaf, BookOpen, Upload, Image as ImageIcon,
  PackageX, PackageMinus, History, ArrowUpCircle, ArrowDownCircle, RotateCcw,
  ClipboardList, Scale, MapPin, Gavel, ChevronUp, ChevronDown, Quote, Hash, Type,
} from 'lucide-react';
import OrderManager from './OrderManager.jsx';

// =============================================================================
//  src/components/Ecommerce/EcoProductManager.jsx — remplace ton fichier actuel
//
//  Ce qui change :
//    - Mode de vente ('unit' / 'weight' / 'lot') pilotant tout le formulaire
//    - Stock décimal (12,500 kg) au lieu d'un entier
//    - Rattachement à une parcelle → active le panneau de preuve côté boutique
//    - Fiche technique café (altitude, varietal, process, score, notes)
//    - Éditeur de story_blocks — le storytelling n'est plus un seul pavé
//    - Images : on enregistre la CLÉ de stockage, plus l'URL
// =============================================================================

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

const SectionTitle = ({ icon, children }) => (
  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
    {icon} {children}
  </p>
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

const DynamicListField = ({ label, values, onChange, placeholder, hint }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
    {hint && <p className="text-xs text-gray-400 -mt-1">{hint}</p>}
    {values.map((val, i) => (
      <div key={i} className="flex gap-2">
        <input type="text" placeholder={placeholder} value={val}
          onChange={e => { const next = [...values]; next[i] = e.target.value; onChange(next); }}
          className={inputCls(false)}/>
        <button type="button" onClick={() => onChange(values.filter((_, idx) => idx !== i))}
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

// ── Images ───────────────────────────────────────────────────────────────────
// Une image est maintenant { key, url } : la clé est ce qu'on enregistre,
// l'URL sert seulement à l'aperçu. C'est ce qui permettra de basculer sur S3
// sans réécrire une seule ligne de la base.
const ImageListField = ({ values, onChange }) => {
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
      next[i] = { key: res.data.key, url: res.data.url };
      onChange(next);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Upload failed',
        text: err.response?.data?.msg || err.message, customClass: { popup: 'rounded-2xl' } });
    } finally {
      setUploadingIndex(null);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Images</label>
      <p className="text-xs text-gray-400 -mt-1">First image is the one shown in listings.</p>
      {values.map((img, i) => (
        <div key={i} className="flex gap-2 items-center">
          <div className="w-10 h-10 rounded-lg border border-gray-200 flex-shrink-0 overflow-hidden bg-gray-50 flex items-center justify-center relative">
            {img?.url
              ? <img src={img.url} alt="" className="w-full h-full object-cover"
                     onError={e => { e.target.style.display = 'none'; }}/>
              : <ImageIcon size={14} className="text-gray-300"/>}
            {i === 0 && img?.url && (
              <span className="absolute bottom-0 inset-x-0 bg-emerald-600 text-white text-[8px] text-center font-bold">MAIN</span>
            )}
          </div>
          <input type="text" placeholder="Upload a file →, or paste an external URL"
            value={img?.url || ''}
            onChange={e => {
              const next = [...values];
              // Saisie manuelle = URL externe, sans clé de stockage.
              next[i] = { key: null, url: e.target.value };
              onChange(next);
            }}
            className={inputCls(false)}/>
          <input type="file" accept="image/png,image/jpeg,image/webp"
            ref={el => (fileInputRefs.current[i] = el)}
            onChange={e => handleFileSelect(i, e.target.files[0])} className="hidden"/>
          <button type="button" onClick={() => fileInputRefs.current[i]?.click()}
            disabled={uploadingIndex === i} title="Upload a file"
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 flex-shrink-0 transition-colors">
            {uploadingIndex === i ? <Loader2 size={14} className="animate-spin"/> : <Upload size={14}/>}
          </button>
          <button type="button" onClick={() => onChange(values.filter((_, idx) => idx !== i))}
            className="px-3 rounded-xl border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0">
            <X size={14}/>
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...values, { key: null, url: '' }])}
        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-1">
        <Plus size={13}/> Add image
      </button>
    </div>
  );
};

// ── Éditeur de storytelling ──────────────────────────────────────────────────
// Un pavé de texte ne raconte rien. Alterner voix, image et chiffre donne un
// rythme de lecture — c'est ce qui manquait à l'ancien champ origin_story seul.
const BLOCK_TYPES = [
  { id: 'text',  label: 'Paragraph', icon: <Type size={12}/> },
  { id: 'quote', label: 'Quote',     icon: <Quote size={12}/> },
  { id: 'image', label: 'Image',     icon: <ImageIcon size={12}/> },
  { id: 'stat',  label: 'Figure',    icon: <Hash size={12}/> },
];

const StoryBlocksField = ({ blocks, onChange }) => {
  const update = (i, patch) =>
    onChange(blocks.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2.5">
      {blocks.map((block, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-3 bg-gray-50/60">
          <div className="flex items-center gap-1.5 mb-2.5">
            <select value={block.type}
              onChange={e => update(i, { type: e.target.value })}
              className="text-xs font-semibold border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 outline-none">
              {BLOCK_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <span className="text-xs text-gray-400">#{i + 1}</span>
            <div className="ml-auto flex gap-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                className="p-1 rounded-lg text-gray-400 hover:bg-white disabled:opacity-30">
                <ChevronUp size={14}/>
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === blocks.length - 1}
                className="p-1 rounded-lg text-gray-400 hover:bg-white disabled:opacity-30">
                <ChevronDown size={14}/>
              </button>
              <button type="button" onClick={() => onChange(blocks.filter((_, idx) => idx !== i))}
                className="p-1 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500">
                <X size={14}/>
              </button>
            </div>
          </div>

          {block.type === 'text' && (
            <textarea rows={3} value={block.content || ''} placeholder="A paragraph of the story…"
              onChange={e => update(i, { content: e.target.value })} className={textareaCls(false)}/>
          )}

          {block.type === 'quote' && (
            <div className="space-y-2">
              <textarea rows={2} value={block.content || ''} placeholder="What the farmer actually said…"
                onChange={e => update(i, { content: e.target.value })} className={textareaCls(false)}/>
              <input type="text" value={block.author || ''} placeholder="Who said it — e.g. Grace N., Mount Elgon"
                onChange={e => update(i, { author: e.target.value })} className={inputCls(false)}/>
            </div>
          )}

          {block.type === 'image' && (
            <div className="space-y-2">
              <input type="text" value={block.content || ''} placeholder="Image URL"
                onChange={e => update(i, { content: e.target.value })} className={inputCls(false)}/>
              <input type="text" value={block.caption || ''} placeholder="Caption (optional)"
                onChange={e => update(i, { caption: e.target.value })} className={inputCls(false)}/>
            </div>
          )}

          {block.type === 'stat' && (
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={block.content || ''} placeholder="1,850 m"
                onChange={e => update(i, { content: e.target.value })} className={inputCls(false)}/>
              <input type="text" value={block.caption || ''} placeholder="altitude of the plot"
                onChange={e => update(i, { caption: e.target.value })} className={inputCls(false)}/>
            </div>
          )}
        </div>
      ))}

      <div className="flex flex-wrap gap-1.5">
        {BLOCK_TYPES.map(t => (
          <button key={t.id} type="button"
            onClick={() => onChange([...blocks, { type: t.id, content: '' }])}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 border border-emerald-200 hover:bg-emerald-50 rounded-lg px-2.5 py-1.5 flex items-center gap-1 transition-colors">
            <Plus size={11}/> {t.icon} {t.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Stock ────────────────────────────────────────────────────────────────────
// Le statut est calculé par le SERVEUR (stock_status) : une seule règle, pas
// deux implémentations qui divergent.
const stockStatusOf = (p) => p.stock_status || 'ok';

const fmtQty = (n) =>
  Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 3 });

const StockBadge = ({ product }) => {
  const status = stockStatusOf(product);
  if (status === 'out') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
      <PackageX size={11}/> Out of stock
    </span>
  );
  if (status === 'low') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
      <PackageMinus size={11}/> Low stock
    </span>
  );
  return null;
};

const SALE_MODE_LABELS = {
  unit:   { label: 'Per unit',   hint: 'Counted items — bags, packs.' },
  weight: { label: 'By weight',  hint: 'Bulk, with a minimum order and a step.' },
  lot:    { label: 'Whole lot',  hint: 'Indivisible — the buyer takes all of it.' },
};

const ModeBadge = ({ product }) => {
  const meta = SALE_MODE_LABELS[product.sale_mode] || SALE_MODE_LABELS.unit;
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
      {meta.label}
    </span>
  );
};

// ── Historique de stock ──────────────────────────────────────────────────────
const REASON_LABELS = {
  sale:              { label: 'Sale',              color: 'text-red-600',     icon: <ArrowDownCircle size={15}/> },
  initial:           { label: 'Initial stock',     color: 'text-blue-600',    icon: <ArrowUpCircle size={15}/> },
  manual_adjustment: { label: 'Manual adjustment', color: 'text-amber-600',   icon: <RotateCcw size={15}/> },
  restock:           { label: 'Restock',           color: 'text-emerald-600', icon: <ArrowUpCircle size={15}/> },
  damage:            { label: 'Damage / loss',     color: 'text-red-600',     icon: <ArrowDownCircle size={15}/> },
  return:            { label: 'Order return',      color: 'text-emerald-600', icon: <ArrowUpCircle size={15}/> },
  auction_sale:      { label: 'Auction sale',      color: 'text-red-600',     icon: <Gavel size={15}/> },
};

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const StockHistoryDrawer = ({ product, open, onClose }) => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !product) return;
    setLoading(true); setError('');
    axiosInstance.get(`/api/ecommerce/products/${product.id}/stock-movements`)
      .then(r => setMovements(r.data ?? []))
      .catch(() => setError('Failed to load stock history.'))
      .finally(() => setLoading(false));
  }, [open, product]);

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose}/>}
      <div className={`fixed top-0 right-0 h-full z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out light-panel ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <History size={18} className="text-gray-500"/> Stock History
            </h2>
            {product && (
              <p className="text-xs text-gray-400 mt-0.5">
                {product.name} · current: {fmtQty(product.stock_qty)} {product.unit}
              </p>
            )}
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"><X size={18}/></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && <div className="flex items-center justify-center py-12 text-gray-400"><Loader2 size={20} className="animate-spin"/></div>}
          {!loading && error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
              <AlertTriangle size={15}/> {error}
            </div>
          )}
          {!loading && !error && movements.length === 0 && (
            <div className="text-center py-12">
              <History size={32} className="mx-auto mb-2 text-gray-300"/>
              <p className="text-sm text-gray-400">No stock movements recorded yet.</p>
            </div>
          )}
          {!loading && !error && movements.map(m => {
            const meta = REASON_LABELS[m.reason] || { label: m.reason, color: 'text-gray-600', icon: <RotateCcw size={15}/> };
            const positive = m.quantity_change > 0;
            return (
              <div key={m.id} className="border border-gray-100 rounded-xl p-3.5 mb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className={meta.color}>{meta.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{meta.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(m.date_created)}</p>
                      {m.order_id && <p className="text-xs text-gray-400">Order #{m.order_id}</p>}
                      {m.note && <p className="text-xs text-gray-500 mt-1 italic">"{m.note}"</p>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${positive ? 'text-emerald-600' : 'text-red-600'}`}>
                      {positive ? '+' : ''}{fmtQty(m.quantity_change)}
                    </p>
                    <p className="text-xs text-gray-400">{fmtQty(m.stock_before)} → {fmtQty(m.stock_after)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

// ── FORMULAIRES VIDES ────────────────────────────────────────────────────────
const EMPTY_CATEGORY = { name: '', description: '' };

const EMPTY_PRODUCT = {
  name: '', description: '', category_id: '', price: '', compare_at_price: '',
  currency: 'USD', unit: 'kg',
  sale_mode: 'unit', stock_qty: '', min_order_qty: '1', order_step: '1',
  low_stock_threshold: '5',
  sku: '', origin_country: '', farm_id: '',
  is_deforestation_free: false, is_featured: false, is_active: true,
  is_auction_only: false,
  certification_labels: [], images: [],
  origin_story: '', story_blocks: [], farmer_name: '', harvest_year: '',
  altitude_m: '', varietal: '', process_method: '', cupping_score: '', tasting_notes: [],
  stock_note: '',
};

// =============================================================================
const EcoProductManager = () => {
  const [tab,            setTab]            = useState('products');
  const [categories,     setCategories]     = useState([]);
  const [products,       setProducts]       = useState([]);
  const [categoryForm,   setCategoryForm]   = useState(EMPTY_CATEGORY);
  const [productForm,    setProductForm]    = useState(EMPTY_PRODUCT);
  const [categoryErrors, setCategoryErrors] = useState({});
  const [productErrors,  setProductErrors]  = useState({});
  const [editCategoryId, setEditCategoryId] = useState(null);
  const [editProductId,  setEditProductId]  = useState(null);
  const [drawerType,     setDrawerType]     = useState(null);
  const [submitting,     setSubmitting]     = useState(false);
  const [search,         setSearch]         = useState('');
  const [globalError,    setGlobalError]    = useState('');
  const [stockFilter,    setStockFilter]    = useState('all');
  const [historyProduct, setHistoryProduct] = useState(null);

  const fetchCategories = useCallback(async () => {
    try { const r = await axiosInstance.get('/api/ecommerce/categories'); setCategories(r.data ?? []); }
    catch { setGlobalError('Error fetching categories.'); }
  }, []);

  const fetchProducts = useCallback(async () => {
    try { const r = await axiosInstance.get('/api/ecommerce/products/admin'); setProducts(r.data ?? []); }
    catch { setGlobalError('Error fetching products.'); }
  }, []);

  useEffect(() => { fetchCategories(); fetchProducts(); }, [fetchCategories, fetchProducts]);

  const lowStockCount   = products.filter(p => stockStatusOf(p) === 'low').length;
  const outOfStockCount = products.filter(p => stockStatusOf(p) === 'out').length;

  const isLot    = productForm.sale_mode === 'lot';
  const isWeight = productForm.sale_mode === 'weight';

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateCategory = () => {
    const e = {};
    if (!categoryForm.name.trim()) e.name = 'Category name is required';
    return e;
  };

  const validateProduct = () => {
    const e = {};
    if (!productForm.name.trim())  e.name        = 'Product name is required';
    if (!productForm.price)        e.price       = 'Price is required';
    if (!productForm.category_id)  e.category_id = 'Category is required';
    if (productForm.harvest_year && String(productForm.harvest_year).length !== 4)
      e.harvest_year = 'Enter a 4-digit year';
    if (isLot && !Number(productForm.stock_qty))
      e.stock_qty = 'A lot needs a weight above zero';
    if (isWeight) {
      if (Number(productForm.min_order_qty) <= 0) e.min_order_qty = 'Must be above zero';
      if (Number(productForm.order_step) <= 0)    e.order_step    = 'Must be above zero';
    }
    if (productForm.cupping_score &&
        (Number(productForm.cupping_score) < 0 || Number(productForm.cupping_score) > 100))
      e.cupping_score = 'Between 0 and 100';
    return e;
  };

  // ── Soumission ──────────────────────────────────────────────────────────────
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
        category_id: parseInt(productForm.category_id, 10),

        // Décimal, plus parseInt : c'est tout l'objet du refactoring.
        stock_qty: parseFloat(productForm.stock_qty || 0),
        // En mode 'lot', le serveur force min = pas = stock. On envoie quand
        // même des valeurs cohérentes pour ne pas dépendre de ce comportement.
        min_order_qty: isLot ? parseFloat(productForm.stock_qty || 0)
                             : parseFloat(productForm.min_order_qty || 1),
        order_step:    isLot ? parseFloat(productForm.stock_qty || 0)
                             : parseFloat(productForm.order_step || 1),
        low_stock_threshold: parseFloat(productForm.low_stock_threshold || 5),

        certification_labels: productForm.certification_labels.filter(Boolean),
        tasting_notes: productForm.tasting_notes.filter(Boolean),
        // On envoie { key, url } : le serveur retient la clé si elle existe.
        images: productForm.images.filter(img => img?.key || img?.url),
        story_blocks: productForm.story_blocks.filter(b => b.content?.trim()),

        harvest_year: productForm.harvest_year ? parseInt(productForm.harvest_year, 10) : null,
        altitude_m:   productForm.altitude_m ? parseInt(productForm.altitude_m, 10) : null,
        cupping_score: productForm.cupping_score ? parseFloat(productForm.cupping_score) : null,

        origin_story: productForm.origin_story?.trim() || null,
        farmer_name:  productForm.farmer_name?.trim() || null,
        farm_id:      productForm.farm_id?.trim() || null,
        varietal:     productForm.varietal?.trim() || null,
        process_method: productForm.process_method?.trim() || null,
        stock_note:   productForm.stock_note?.trim() || null,
      };

      if (editProductId) await axiosInstance.put(`/api/ecommerce/products/${editProductId}/edit`, payload);
      else               await axiosInstance.post('/api/ecommerce/products/create', payload);
      await fetchProducts();
      closeDrawer();
      Swal.fire({ icon: 'success', title: editProductId ? 'Product updated!' : 'Product created!',
        timer: 2000, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.msg || err.message,
        customClass: { popup: 'rounded-2xl' } });
    } finally { setSubmitting(false); }
  };

  // ── Suppression ─────────────────────────────────────────────────────────────
  const handleDeleteCategory = async (id, name) => {
    const r = await Swal.fire({ title: `Delete "${name}"?`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete',
      customClass: { popup: 'rounded-2xl' } });
    if (!r.isConfirmed) return;
    try { await axiosInstance.delete(`/api/ecommerce/categories/${id}/delete`); await fetchCategories(); }
    catch { setGlobalError('Error deleting category.'); }
  };

  // Suppression LOGIQUE côté serveur : le produit sort du catalogue mais reste
  // lisible dans les commandes passées. Le libellé le dit clairement.
  const handleDeleteProduct = async (id, name) => {
    const r = await Swal.fire({
      title: `Remove "${name}" from the catalogue?`, icon: 'warning',
      text: 'It stays visible in past orders and stock history.',
      showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Remove',
      customClass: { popup: 'rounded-2xl' } });
    if (!r.isConfirmed) return;
    try { await axiosInstance.delete(`/api/ecommerce/products/${id}/delete`); await fetchProducts(); }
    catch { setGlobalError('Error removing product.'); }
  };

  // ── Tiroirs ─────────────────────────────────────────────────────────────────
  const openCategoryDrawer = (category = null) => {
    setCategoryForm(category ? { name: category.name, description: category.description || '' } : EMPTY_CATEGORY);
    setEditCategoryId(category?.id ?? null);
    setCategoryErrors({});
    setDrawerType('category');
  };

  const openProductDrawer = (product = null) => {
    setProductForm(product ? {
      name: product.name, description: product.description || '',
      // category_id vient directement du serveur — plus de recherche par nom.
      category_id: product.category_id ?? '',
      price: product.price, compare_at_price: product.compare_at_price ?? '',
      currency: product.currency, unit: product.unit,
      sale_mode: product.sale_mode || 'unit',
      stock_qty: product.stock_qty ?? '',
      min_order_qty: product.min_order_qty ?? 1,
      order_step: product.order_step ?? 1,
      low_stock_threshold: product.low_stock_threshold ?? 5,
      sku: product.sku || '', origin_country: product.origin_country || '',
      farm_id: product.farm_id || '',
      is_deforestation_free: product.is_deforestation_free,
      is_featured: product.is_featured,
      is_active: product.is_active,
      is_auction_only: product.is_auction_only ?? false,
      certification_labels: product.certification_labels ?? [],
      // images_detail conserve les clés de stockage ; sans lui, une simple
      // édition ferait perdre la clé et retomberait sur des URLs figées.
      images: product.images_detail?.length
        ? product.images_detail
        : (product.images ?? []).map(url => ({ key: null, url })),
      origin_story: product.origin_story || '',
      story_blocks: product.story_blocks ?? [],
      farmer_name: product.farmer_name || '',
      harvest_year: product.harvest_year ?? '',
      altitude_m: product.altitude_m ?? '',
      varietal: product.varietal || '',
      process_method: product.process_method || '',
      cupping_score: product.cupping_score ?? '',
      tasting_notes: product.tasting_notes ?? [],
      stock_note: '',
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

  const stockRank = { out: 0, low: 1, ok: 2 };
  const filteredProducts = products
    .filter(p => p.name?.toLowerCase().includes(search.toLowerCase()))
    .filter(p => stockFilter === 'all' ? true : stockStatusOf(p) === stockFilter)
    .sort((a, b) => stockRank[stockStatusOf(a)] - stockRank[stockStatusOf(b)]);

  const lotTotal = isLot && productForm.price && productForm.stock_qty
    ? (parseFloat(productForm.price) * parseFloat(productForm.stock_qty))
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/20 p-4 sm:p-6 light-panel">

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Coffee size={22} className="text-emerald-600"/> Eco-Shop Manager
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-sm text-gray-400">{categories.length} categories · {products.length} products</p>
              {outOfStockCount > 0 && (
                <button onClick={() => { setTab('products'); setStockFilter('out'); }}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors">
                  <PackageX size={11}/> {outOfStockCount} out of stock
                </button>
              )}
              {lowStockCount > 0 && (
                <button onClick={() => { setTab('products'); setStockFilter('low'); }}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors">
                  <PackageMinus size={11}/> {lowStockCount} low stock
                </button>
              )}
            </div>
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
          { id: 'categories', label: 'Categories', icon: <Tag size={15}/>,           count: categories.length },
          { id: 'products',   label: 'Products',   icon: <Coffee size={15}/>,        count: products.length },
          { id: 'orders',     label: 'Orders',     icon: <ClipboardList size={15}/>, count: null },
        ].map(({ id, label, icon, count }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
            {icon} {label}
            {count !== null && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === id ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search + filters */}
      {tab !== 'orders' && (
        <>
          <div className="relative mb-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Search size={16}/></span>
            <input type="text" placeholder={`Search ${tab}…`} value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={16}/></button>}
          </div>

          {tab === 'products' && (
            <div className="flex gap-2 mb-5">
              {[{ id: 'all', label: 'All' }, { id: 'low', label: 'Low stock' }, { id: 'out', label: 'Out of stock' }].map(f => (
                <button key={f.id} onClick={() => setStockFilter(f.id)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                    stockFilter === f.id ? 'bg-gray-800 text-white border-gray-800'
                                         : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {globalError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
          <AlertTriangle size={15}/> {globalError}
          <button onClick={() => setGlobalError('')} className="ml-auto"><X size={15}/></button>
        </div>
      )}

      {/* Categories */}
      {tab === 'categories' && (
        <div className="space-y-3">
          {filteredCategories.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <Tag size={40} className="mx-auto mb-3 text-gray-300"/>
              <p className="text-gray-500 font-medium">No categories found</p>
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

      {/* Products */}
      {tab === 'products' && (
        <div className="space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <Coffee size={40} className="mx-auto mb-3 text-gray-300"/>
              <p className="text-gray-500 font-medium">No products found</p>
            </div>
          ) : filteredProducts.map(product => {
            const status = stockStatusOf(product);
            return (
              <div key={product.id}
                className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all p-4 sm:p-5 ${
                  status === 'out' ? 'border-red-200 hover:border-red-300'
                  : status === 'low' ? 'border-orange-200 hover:border-orange-300'
                  : 'border-gray-100 hover:border-emerald-200'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold flex-shrink-0 overflow-hidden">
                      {product.images?.[0]
                        ? <img src={product.images[0]} alt="" className="w-full h-full object-cover"/>
                        : (product.name?.[0]?.toUpperCase() || 'P')}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 flex items-center gap-2 flex-wrap">
                        {product.name}
                        {product.is_featured && <Star size={13} className="text-yellow-500 fill-yellow-500"/>}
                        {product.is_deforestation_free && <Leaf size={13} className="text-emerald-500"/>}
                        {(product.story_blocks?.length > 0 || product.origin_story) &&
                          <BookOpen size={13} className="text-blue-500" title="Has a story"/>}
                        {product.farm_id && <MapPin size={13} className="text-teal-600" title="Linked to a plot"/>}
                        {product.is_auction_only && <Gavel size={13} className="text-amber-600" title="Auction only"/>}
                        {!product.is_active && <span className="text-xs text-gray-400 font-normal">(inactive)</span>}
                        <ModeBadge product={product}/>
                        <StockBadge product={product}/>
                      </h3>
                      <div className="flex flex-wrap gap-3 mt-1">
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          {Number(product.price).toLocaleString('en-US')} {product.currency}/{product.unit}
                        </span>
                        {product.sale_mode === 'lot' && product.total_price != null && (
                          <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            Lot: {Number(product.total_price).toLocaleString('en-US')} {product.currency}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">{product.category}</span>
                        <span className={`text-xs font-medium ${
                          status === 'out' ? 'text-red-600' : status === 'low' ? 'text-orange-600' : 'text-gray-500'}`}>
                          Stock: {fmtQty(product.stock_qty)} {product.unit}
                        </span>
                        {product.varietal && <span className="text-xs text-gray-500">{product.varietal}</span>}
                        {product.farmer_name && <span className="text-xs text-gray-500">Farmer: {product.farmer_name}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setHistoryProduct(product)} title="Stock history"
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200 transition-colors">
                      <History size={12}/> History
                    </button>
                    <button onClick={() => openProductDrawer(product)}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200 transition-colors">
                      <Edit2 size={12}/> Edit
                    </button>
                    <button onClick={() => handleDeleteProduct(product.id, product.name)}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-red-50 text-red-700 hover:bg-red-100 border-red-200 transition-colors">
                      <Trash2 size={12}/> Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'orders' && <OrderManager />}

      {drawerOpen && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={closeDrawer}/>}

      {/* Category Drawer */}
      <div className={`fixed top-0 right-0 h-full z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out light-panel ${drawerType === 'category' ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            {editCategoryId ? <Edit2 size={18} className="text-yellow-500"/> : <Plus size={18} className="text-blue-600"/>}
            {editCategoryId ? 'Edit Category' : 'New Category'}
          </h2>
          <button onClick={closeDrawer} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"><X size={18}/></button>
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
      <div className={`fixed top-0 right-0 h-full z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out light-panel ${drawerType === 'product' ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            {editProductId ? <Edit2 size={18} className="text-yellow-500"/> : <Plus size={18} className="text-emerald-600"/>}
            {editProductId ? 'Edit Product' : 'New Product'}
          </h2>
          <button onClick={closeDrawer} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"><X size={18}/></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <Field label="Product Name" required error={productErrors.name}>
            <input type="text" placeholder="e.g. Nocturne I — DRD Washed" value={productForm.name}
              onChange={e => setProductForm({ ...productForm, name: e.target.value })} className={inputCls(productErrors.name)}/>
          </Field>
          <Field label="Description" hint="Short and factual — what it is. Shown in listings.">
            <textarea rows={2} placeholder="e.g. Washed arabica, 1,850 m, Mount Elgon" value={productForm.description}
              onChange={e => setProductForm({ ...productForm, description: e.target.value })} className={textareaCls(false)}/>
          </Field>
          <Field label="Category" required error={productErrors.category_id}>
            <select value={productForm.category_id}
              onChange={e => setProductForm({ ...productForm, category_id: e.target.value })}
              className={selectCls(productErrors.category_id)}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>

          {/* ── Mode de vente ─────────────────────────────────────────── */}
          <div className="pt-2 mt-1 border-t border-gray-100">
            <SectionTitle icon={<Scale size={13}/>}>How it is sold</SectionTitle>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {Object.entries(SALE_MODE_LABELS).map(([mode, meta]) => (
                <button key={mode} type="button"
                  onClick={() => setProductForm({
                    ...productForm,
                    sale_mode: mode,
                    unit: mode === 'unit' ? productForm.unit : 'kg',
                  })}
                  className={`px-2 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    productForm.sale_mode === mode
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'}`}>
                  {meta.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mb-3">
              {SALE_MODE_LABELS[productForm.sale_mode].hint}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Field label={`Price per ${productForm.unit || 'unit'}`} required error={productErrors.price}>
                <input type="number" step="0.01" min="0" placeholder="0.00" value={productForm.price}
                  onChange={e => setProductForm({ ...productForm, price: e.target.value })} className={inputCls(productErrors.price)}/>
              </Field>
              <Field label="Compare-at price">
                <input type="number" step="0.01" min="0" placeholder="Optional" value={productForm.compare_at_price}
                  onChange={e => setProductForm({ ...productForm, compare_at_price: e.target.value })} className={inputCls(false)}/>
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-3">
              <Field label="Currency">
                <select value={productForm.currency}
                  onChange={e => setProductForm({ ...productForm, currency: e.target.value })} className={selectCls(false)}>
                  <option value="USD">USD</option>
                  <option value="UGX">UGX</option>
                  <option value="KES">KES</option>
                </select>
              </Field>
              <Field label="Unit" hint={isLot || isWeight ? 'kg' : undefined}>
                <input type="text" placeholder="kg" value={productForm.unit} disabled={isLot || isWeight}
                  onChange={e => setProductForm({ ...productForm, unit: e.target.value })}
                  className={`${inputCls(false)} ${(isLot || isWeight) ? 'bg-gray-50 text-gray-400' : ''}`}/>
              </Field>
              <Field label={isLot ? 'Lot weight' : 'Stock'} required={isLot} error={productErrors.stock_qty}
                hint={isLot ? 'The whole lot' : undefined}>
                <input type="number" step="0.001" min="0" placeholder="0" value={productForm.stock_qty}
                  onChange={e => setProductForm({ ...productForm, stock_qty: e.target.value })}
                  className={inputCls(productErrors.stock_qty)}/>
              </Field>
            </div>

            {/* Le total du lot, calculé sous les yeux de l'admin : c'est le
                chiffre que verra l'acheteur, autant qu'il soit visible ici. */}
            {isLot && lotTotal != null && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Buyer pays</span>
                <span className="text-lg font-bold text-amber-900">
                  {lotTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} {productForm.currency}
                </span>
              </div>
            )}

            {isWeight && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Field label="Minimum order" error={productErrors.min_order_qty}
                  hint={`In ${productForm.unit || 'kg'}`}>
                  <input type="number" step="0.001" min="0" value={productForm.min_order_qty}
                    onChange={e => setProductForm({ ...productForm, min_order_qty: e.target.value })}
                    className={inputCls(productErrors.min_order_qty)}/>
                </Field>
                <Field label="Order step" error={productErrors.order_step}
                  hint="Buyers order in multiples of this.">
                  <input type="number" step="0.001" min="0" value={productForm.order_step}
                    onChange={e => setProductForm({ ...productForm, order_step: e.target.value })}
                    className={inputCls(productErrors.order_step)}/>
                </Field>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-3">
              <Field label="Low stock threshold" hint="Below this, an orange badge appears.">
                <input type="number" step="0.001" min="0" placeholder="5" value={productForm.low_stock_threshold}
                  onChange={e => setProductForm({ ...productForm, low_stock_threshold: e.target.value })} className={inputCls(false)}/>
              </Field>
              <Field label="Adjustment note" hint="Optional — logged if stock changes.">
                <input type="text" placeholder="e.g. Restocked" value={productForm.stock_note}
                  onChange={e => setProductForm({ ...productForm, stock_note: e.target.value })} className={inputCls(false)}/>
              </Field>
            </div>
          </div>

          {/* ── Traçabilité ────────────────────────────────────────────── */}
          <div className="pt-2 mt-1 border-t border-gray-100">
            <SectionTitle icon={<MapPin size={13}/>}>Traceability</SectionTitle>
            <div className="space-y-3">
              <Field label="Farm ID"
                hint="The farm_id of the plot this lot comes from. This is what unlocks the proof panel on the product page — the map, the 2020 canopy check, the EUDR status.">
                <input type="text" placeholder="e.g. UG-ELG-0042" value={productForm.farm_id}
                  onChange={e => setProductForm({ ...productForm, farm_id: e.target.value })} className={inputCls(false)}/>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Origin country">
                  <input type="text" placeholder="e.g. Uganda" value={productForm.origin_country}
                    onChange={e => setProductForm({ ...productForm, origin_country: e.target.value })} className={inputCls(false)}/>
                </Field>
                <Field label="SKU">
                  <input type="text" placeholder="Optional" value={productForm.sku}
                    onChange={e => setProductForm({ ...productForm, sku: e.target.value })} className={inputCls(false)}/>
                </Field>
              </div>
            </div>
          </div>

          {/* ── Fiche technique ────────────────────────────────────────── */}
          <div className="pt-2 mt-1 border-t border-gray-100">
            <SectionTitle icon={<Coffee size={13}/>}>Coffee specs</SectionTitle>
            <p className="text-xs text-gray-400 mb-3">
              A specialty buyer reads this before reading the story.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Altitude (m)">
                <input type="number" min="0" placeholder="1850" value={productForm.altitude_m}
                  onChange={e => setProductForm({ ...productForm, altitude_m: e.target.value })} className={inputCls(false)}/>
              </Field>
              <Field label="Varietal">
                <input type="text" placeholder="e.g. SL28, Trinitario" value={productForm.varietal}
                  onChange={e => setProductForm({ ...productForm, varietal: e.target.value })} className={inputCls(false)}/>
              </Field>
              <Field label="Process">
                <input type="text" placeholder="e.g. Washed, Natural" value={productForm.process_method}
                  onChange={e => setProductForm({ ...productForm, process_method: e.target.value })} className={inputCls(false)}/>
              </Field>
              <Field label="Cupping score" error={productErrors.cupping_score}>
                <input type="number" step="0.1" min="0" max="100" placeholder="86.5" value={productForm.cupping_score}
                  onChange={e => setProductForm({ ...productForm, cupping_score: e.target.value })}
                  className={inputCls(productErrors.cupping_score)}/>
              </Field>
            </div>
            <div className="mt-3">
              <DynamicListField label="Tasting notes" values={productForm.tasting_notes}
                onChange={next => setProductForm({ ...productForm, tasting_notes: next })}
                placeholder="e.g. blackcurrant" hint="One note per line."/>
            </div>
          </div>

          {/* ── Storytelling ───────────────────────────────────────────── */}
          <div className="pt-2 mt-1 border-t border-gray-100">
            <SectionTitle icon={<BookOpen size={13}/>}>Product story</SectionTitle>
            <p className="text-xs text-gray-400 mb-3">
              Alternate a paragraph, the farmer's own words, a photo, a figure.
              A single block of text does not tell a story.
            </p>
            <StoryBlocksField blocks={productForm.story_blocks}
              onChange={next => setProductForm({ ...productForm, story_blocks: next })}/>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <Field label="Farmer name" hint="Leave blank to stay anonymous.">
                <input type="text" placeholder="e.g. Grace N." value={productForm.farmer_name}
                  onChange={e => setProductForm({ ...productForm, farmer_name: e.target.value })} className={inputCls(false)}/>
              </Field>
              <Field label="Harvest year" error={productErrors.harvest_year}>
                <input type="number" placeholder="2026" value={productForm.harvest_year}
                  onChange={e => setProductForm({ ...productForm, harvest_year: e.target.value })}
                  className={inputCls(productErrors.harvest_year)}/>
              </Field>
            </div>

            {productForm.origin_story && (
              <div className="mt-3">
                <Field label="Legacy story text"
                  hint="Kept from the old format. It only shows if there is no story block above.">
                  <textarea rows={3} value={productForm.origin_story}
                    onChange={e => setProductForm({ ...productForm, origin_story: e.target.value })}
                    className={textareaCls(false)}/>
                </Field>
              </div>
            )}
          </div>

          {/* ── Images & labels ────────────────────────────────────────── */}
          <div className="pt-2 mt-1 border-t border-gray-100 space-y-4">
            <ImageListField values={productForm.images}
              onChange={next => setProductForm({ ...productForm, images: next })}/>
            <DynamicListField label="Certification labels" values={productForm.certification_labels}
              onChange={next => setProductForm({ ...productForm, certification_labels: next })}
              placeholder="e.g. EUDR-compliant"/>
          </div>

          {/* ── Visibilité ─────────────────────────────────────────────── */}
          <div className="flex flex-col gap-2.5 pt-3 border-t border-gray-100">
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
              Active
            </label>
            <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={productForm.is_auction_only}
                onChange={e => setProductForm({ ...productForm, is_auction_only: e.target.checked })}
                className="mt-0.5 rounded border-gray-300 text-amber-600 focus:ring-amber-400"/>
              <span>
                Auction only
                <span className="block text-xs text-gray-400">
                  Hidden from the shop grid. Set automatically when you add the product to an auction.
                </span>
              </span>
            </label>
          </div>
        </div>

        <DrawerFooter onCancel={closeDrawer} onSubmit={handleProductSubmit} submitting={submitting} editingId={editProductId} label="Product"/>
      </div>

      <StockHistoryDrawer product={historyProduct} open={historyProduct !== null}
        onClose={() => setHistoryProduct(null)}/>
    </div>
  );
};

export default EcoProductManager;