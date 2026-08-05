import React, { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';
import {
  Gavel, Plus, X, Check, Loader2, AlertTriangle, ArrowLeft, Play, Lock,
  Users, Package, ShieldCheck, ShieldAlert, Clock, TrendingUp, Coffee,
  RefreshCw, Ban, Wallet,
} from 'lucide-react';

// =============================================================================
//  src/components/Auction/AuctionManager.jsx — nouveau fichier
//
//  Route : /auctionmanager (adminOnly)
//
//  Le cycle de vie d'une vente, dans l'ordre :
//    draft → on ajoute des lots → open → les enchères courent → close
//    → les gagnants paient → les défaillants sont déclarés
//
//  L'écran suit exactement cet ordre : ce qu'on peut faire à un instant donné
//  dépend du statut, et le reste est masqué plutôt que grisé.
// =============================================================================

const inputCls = (err) =>
  `w-full border rounded-xl px-3.5 py-2.5 text-sm transition-all outline-none
   bg-white text-gray-800 placeholder-gray-400 focus:ring-2 focus:border-transparent
   ${err ? 'border-red-300 focus:ring-red-300' : 'border-gray-200 focus:ring-amber-400 hover:border-gray-300'}`;

const selectCls = inputCls;

const Field = ({ label, required, error, hint, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
      {label}{required && <span className="text-red-400"> *</span>}
    </label>
    {children}
    {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={11}/>{error}</p>}
  </div>
);

const fmt = (n, d = 2) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: 3 });

const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  : '—';

const STATUS_STYLES = {
  draft:    'bg-gray-100 text-gray-600 border-gray-200',
  live:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  closed:   'bg-gray-800 text-white border-gray-800',
  scheduled:'bg-blue-50 text-blue-700 border-blue-200',
  sold:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  unsold:   'bg-gray-100 text-gray-500 border-gray-200',
  awaiting_payment: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending:  'bg-blue-50 text-blue-700 border-blue-200',
  deposit_pending: 'bg-amber-50 text-amber-700 border-amber-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  defaulted:'bg-red-50 text-red-700 border-red-200',
};

const Badge = ({ status, children }) => (
  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}>
    {children || status?.replace('_', ' ')}
  </span>
);

const StatCard = ({ label, value, tone = 'text-gray-800' }) => (
  <div className="bg-white border border-gray-100 rounded-xl px-4 py-3">
    <p className={`text-xl font-bold ${tone}`}>{value}</p>
    <p className="text-xs text-gray-400 mt-0.5">{label}</p>
  </div>
);

const EMPTY_AUCTION = {
  name: '', subtitle: '', description: '', cover_image: '',
  starts_at: '', ends_at: '', currency: 'USD',
  anti_snipe_minutes: 3,
  access_mode: 'deposit', deposit_amount: '', deposit_multiplier: 10,
  payment_deadline_hours: 72,
};

const EMPTY_LOT = {
  product_id: '', weight_kg: '', starting_price_per_kg: '',
  min_increment: '0.50', reserve_price_per_kg: '',
};

// =============================================================================
const AuctionManager = () => {
  const [auctions, setAuctions]   = useState([]);
  const [selected, setSelected]   = useState(null);   // vente ouverte en détail
  const [lotProducts, setProducts] = useState([]);    // produits en mode 'lot'
  const [tab, setTab]             = useState('lots'); // lots | bidders | payments
  const [drawer, setDrawer]       = useState(null);   // 'auction' | 'lot'
  const [auctionForm, setAuctionForm] = useState(EMPTY_AUCTION);
  const [lotForm, setLotForm]     = useState(EMPTY_LOT);
  const [errors, setErrors]       = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [overdue, setOverdue]     = useState([]);

  const fail = (err, title = 'Error') =>
    Swal.fire({ icon: 'error', title,
      text: err.response?.data?.msg || err.response?.data?.error || err.message,
      customClass: { popup: 'rounded-2xl' } });

  const ok = (title) =>
    Swal.fire({ icon: 'success', title, timer: 1800, showConfirmButton: false,
      customClass: { popup: 'rounded-2xl' } });

  // ── Chargement ──────────────────────────────────────────────────────────────
  const fetchAuctions = useCallback(async () => {
    try {
      const r = await axiosInstance.get('/api/auction/auctions/admin');
      setAuctions(r.data ?? []);
    } catch { /* affiché par la vue vide */ }
    finally { setLoading(false); }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const r = await axiosInstance.get('/api/ecommerce/products/admin');
      // Seuls les produits en mode 'lot' peuvent être mis aux enchères :
      // c'est le serveur qui l'impose, autant ne pas proposer le reste.
      setProducts((r.data ?? []).filter(p => p.sale_mode === 'lot'));
    } catch { /* silencieux */ }
  }, []);

  const fetchOverdue = useCallback(async () => {
    try {
      const r = await axiosInstance.get('/api/auction/lots/overdue');
      setOverdue(r.data ?? []);
    } catch { setOverdue([]); }
  }, []);

  const openAuction = useCallback(async (id) => {
    try {
      const r = await axiosInstance.get(`/api/auction/auctions/${id}/admin`);
      setSelected(r.data);
    } catch (e) { fail(e, 'Could not load auction'); }
  }, []);

  useEffect(() => { fetchAuctions(); fetchProducts(); fetchOverdue(); },
    [fetchAuctions, fetchProducts, fetchOverdue]);

  // Une vente en cours bouge toute seule : on rafraîchit le détail
  // périodiquement plutôt que de laisser l'admin devant des chiffres figés.
  useEffect(() => {
    if (!selected || selected.status !== 'live') return;
    const t = setInterval(() => openAuction(selected.id), 10000);
    return () => clearInterval(t);
  }, [selected, openAuction]);

  // ── Créer une vente ─────────────────────────────────────────────────────────
  const submitAuction = async () => {
    const e = {};
    if (!auctionForm.name.trim()) e.name = 'Required';
    if (!auctionForm.starts_at)   e.starts_at = 'Required';
    if (!auctionForm.ends_at)     e.ends_at = 'Required';
    if (auctionForm.starts_at && auctionForm.ends_at &&
        auctionForm.ends_at <= auctionForm.starts_at) e.ends_at = 'Must be after the start';
    if (auctionForm.access_mode === 'deposit' && !Number(auctionForm.deposit_amount))
      e.deposit_amount = 'A deposit auction needs an amount';
    if (Object.keys(e).length) { setErrors(e); return; }

    setSubmitting(true);
    try {
      await axiosInstance.post('/api/auction/auctions/create', {
        ...auctionForm,
        deposit_amount: auctionForm.access_mode === 'deposit'
          ? parseFloat(auctionForm.deposit_amount) : null,
        deposit_multiplier: parseInt(auctionForm.deposit_multiplier, 10),
        anti_snipe_minutes: parseInt(auctionForm.anti_snipe_minutes, 10),
        payment_deadline_hours: parseInt(auctionForm.payment_deadline_hours, 10),
      });
      await fetchAuctions();
      setDrawer(null); setAuctionForm(EMPTY_AUCTION); setErrors({});
      ok('Auction created');
    } catch (err) { fail(err); }
    finally { setSubmitting(false); }
  };

  // ── Ajouter un lot ──────────────────────────────────────────────────────────
  const submitLot = async () => {
    const e = {};
    if (!lotForm.product_id) e.product_id = 'Pick a product';
    if (!Number(lotForm.starting_price_per_kg)) e.starting_price_per_kg = 'Required';
    if (Object.keys(e).length) { setErrors(e); return; }

    setSubmitting(true);
    try {
      await axiosInstance.post(`/api/auction/auctions/${selected.id}/lots`, {
        product_id: parseInt(lotForm.product_id, 10),
        weight_kg: lotForm.weight_kg ? parseFloat(lotForm.weight_kg) : null,
        starting_price_per_kg: parseFloat(lotForm.starting_price_per_kg),
        min_increment: parseFloat(lotForm.min_increment || 0.5),
        reserve_price_per_kg: lotForm.reserve_price_per_kg
          ? parseFloat(lotForm.reserve_price_per_kg) : null,
      });
      await openAuction(selected.id);
      await fetchProducts();
      setDrawer(null); setLotForm(EMPTY_LOT); setErrors({});
      ok('Lot added');
    } catch (err) { fail(err); }
    finally { setSubmitting(false); }
  };

  // ── Actions sur la vente ────────────────────────────────────────────────────
  const doOpen = async () => {
    const r = await Swal.fire({
      title: 'Open this auction?', icon: 'question',
      text: 'Lots become visible and bidding starts. You cannot un-publish afterwards.',
      showCancelButton: true, confirmButtonColor: '#16803c', confirmButtonText: 'Open',
      customClass: { popup: 'rounded-2xl' } });
    if (!r.isConfirmed) return;
    try {
      await axiosInstance.post(`/api/auction/auctions/${selected.id}/open`);
      await openAuction(selected.id); await fetchAuctions();
      ok('Auction is live');
    } catch (err) { fail(err); }
  };

  const doClose = async () => {
    const r = await Swal.fire({
      title: 'Close this auction?', icon: 'warning',
      text: 'Winning lots become orders with a payment deadline. This is final.',
      showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Close',
      customClass: { popup: 'rounded-2xl' } });
    if (!r.isConfirmed) return;
    try {
      const res = await axiosInstance.post(`/api/auction/auctions/${selected.id}/close`);
      await openAuction(selected.id); await fetchAuctions(); await fetchOverdue();
      Swal.fire({
        icon: 'success', title: 'Auction closed',
        html: `<p>${res.data.awarded.length} lot(s) awarded · ${res.data.unsold.length} unsold</p>`,
        customClass: { popup: 'rounded-2xl' },
      });
    } catch (err) { fail(err, 'Could not close') ; }
  };

  const doDefault = async (lot) => {
    const r = await Swal.fire({
      title: `Declare default on lot #${lot.lot_number}?`, icon: 'warning',
      html: 'The deposit is forfeited, the account is blocked on future auctions, '
          + 'and the lot goes to the underbidder.',
      input: 'text', inputPlaceholder: 'Note (optional)',
      showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Declare default',
      customClass: { popup: 'rounded-2xl' } });
    if (!r.isConfirmed) return;
    try {
      const res = await axiosInstance.post(`/api/auction/lots/${lot.id}/default`, { note: r.value });
      await fetchOverdue();
      if (selected) await openAuction(selected.id);
      const out = res.data.outcome;
      Swal.fire({
        icon: 'info', title: 'Default recorded',
        html: out.reassigned_to_user_id
          ? `Deposit forfeited: ${fmt(res.data.deposit_forfeited)}.<br/>Lot reassigned at ${fmt(out.new_price_per_kg)}/kg.`
          : `Deposit forfeited: ${fmt(res.data.deposit_forfeited)}.<br/>No eligible underbidder — lot marked unsold.`,
        customClass: { popup: 'rounded-2xl' },
      });
    } catch (err) { fail(err); }
  };

  // ── Inscriptions ────────────────────────────────────────────────────────────
  const approveReg = async (reg) => {
    const r = await Swal.fire({
      title: `Approve ${reg.company_name || reg.username}?`,
      input: 'number', inputLabel: `Bidding limit (${selected.currency}) — leave blank for no limit`,
      inputValue: reg.bid_limit ?? '',
      showCancelButton: true, confirmButtonColor: '#16803c', confirmButtonText: 'Approve',
      customClass: { popup: 'rounded-2xl' } });
    if (!r.isConfirmed) return;
    try {
      await axiosInstance.post(`/api/auction/registrations/${reg.id}/approve`,
        r.value ? { bid_limit: parseFloat(r.value) } : {});
      await openAuction(selected.id);
      ok('Registration approved');
    } catch (err) { fail(err); }
  };

  const rejectReg = async (reg) => {
    const r = await Swal.fire({
      title: 'Reject this registration?', input: 'text', inputPlaceholder: 'Reason (internal)',
      showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Reject',
      customClass: { popup: 'rounded-2xl' } });
    if (!r.isConfirmed) return;
    try {
      await axiosInstance.post(`/api/auction/registrations/${reg.id}/reject`, { note: r.value });
      await openAuction(selected.id);
      ok('Registration rejected');
    } catch (err) { fail(err); }
  };

  const refundReg = async (reg) => {
    const r = await Swal.fire({
      title: 'Mark deposit as refunded?', icon: 'question',
      text: 'This records the decision and frees the bidding limit. The transfer itself is done outside the app.',
      showCancelButton: true, confirmButtonColor: '#16803c', confirmButtonText: 'Mark refunded',
      customClass: { popup: 'rounded-2xl' } });
    if (!r.isConfirmed) return;
    try {
      await axiosInstance.post(`/api/auction/registrations/${reg.id}/refund-deposit`);
      await openAuction(selected.id);
      ok('Deposit marked refunded');
    } catch (err) { fail(err); }
  };

  // ══════════════════════════════════════════════════════════════════════════
  //  VUE LISTE
  // ══════════════════════════════════════════════════════════════════════════
  if (!selected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50/20 p-4 sm:p-6 light-panel">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Gavel size={22} className="text-amber-600"/> Auctions
              </h1>
              <p className="text-sm text-gray-400 mt-1">{auctions.length} auction(s)</p>
            </div>
            <button onClick={() => { setAuctionForm(EMPTY_AUCTION); setErrors({}); setDrawer('auction'); }}
              className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm px-4 py-2 rounded-xl font-medium shadow-sm transition-colors">
              <Plus size={15}/> New Auction
            </button>
          </div>
        </div>

        {/* Les paiements en retard passent avant tout le reste : c'est de
            l'argent qui n'est pas rentré. */}
        {overdue.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-red-800 flex items-center gap-2 mb-3">
              <Clock size={16}/> {overdue.length} lot(s) past their payment deadline
            </p>
            <div className="space-y-2">
              {overdue.map(lot => (
                <div key={lot.id} className="flex items-center justify-between gap-3 bg-white rounded-xl px-4 py-2.5 border border-red-100">
                  <span className="text-sm text-gray-700">
                    Lot #{lot.lot_number} · {fmt(lot.current_total)} {lot.currency} ·
                    due {fmtDate(lot.payment_due_at)}
                  </span>
                  <button onClick={() => doDefault(lot)}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">
                    <Ban size={12}/> Declare default
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && <div className="flex justify-center py-16 text-gray-400"><Loader2 size={22} className="animate-spin"/></div>}

        {!loading && auctions.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Gavel size={40} className="mx-auto mb-3 text-gray-300"/>
            <p className="text-gray-500 font-medium">No auction yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Create products in <span className="font-semibold">Whole lot</span> mode first,
              then build an auction around them.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {auctions.map(a => (
            <button key={a.id} onClick={() => { setTab('lots'); openAuction(a.id); }}
              className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-gray-800 flex items-center gap-2 flex-wrap">
                    {a.name}
                    <Badge status={a.status}/>
                    {a.access_mode === 'deposit' && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        Deposit {fmt(a.deposit_amount)} {a.currency}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {fmtDate(a.starts_at)} → {fmtDate(a.ends_at)} · {a.stats?.lot_count ?? 0} lot(s)
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-gray-800">{fmt(a.stats?.total_value)}</p>
                  <p className="text-xs text-gray-400">{a.stats?.total_bids ?? 0} bids</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Drawer — nouvelle vente */}
        {drawer === 'auction' && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setDrawer(null)}/>}
        <div className={`fixed top-0 right-0 h-full z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 light-panel ${drawer === 'auction' ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Gavel size={18} className="text-amber-600"/> New Auction
            </h2>
            <button onClick={() => setDrawer(null)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"><X size={18}/></button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <Field label="Name" required error={errors.name}>
              <input className={inputCls(errors.name)} placeholder="Aurum Series 2026"
                value={auctionForm.name} onChange={e => setAuctionForm({ ...auctionForm, name: e.target.value })}/>
            </Field>
            <Field label="Subtitle">
              <input className={inputCls(false)} placeholder="One line under the title"
                value={auctionForm.subtitle} onChange={e => setAuctionForm({ ...auctionForm, subtitle: e.target.value })}/>
            </Field>
            <Field label="Cover image URL">
              <input className={inputCls(false)} placeholder="https://…"
                value={auctionForm.cover_image} onChange={e => setAuctionForm({ ...auctionForm, cover_image: e.target.value })}/>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Starts" required error={errors.starts_at}>
                <input type="datetime-local" className={inputCls(errors.starts_at)}
                  value={auctionForm.starts_at} onChange={e => setAuctionForm({ ...auctionForm, starts_at: e.target.value })}/>
              </Field>
              <Field label="Ends" required error={errors.ends_at}>
                <input type="datetime-local" className={inputCls(errors.ends_at)}
                  value={auctionForm.ends_at} onChange={e => setAuctionForm({ ...auctionForm, ends_at: e.target.value })}/>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Currency">
                <select className={selectCls(false)} value={auctionForm.currency}
                  onChange={e => setAuctionForm({ ...auctionForm, currency: e.target.value })}>
                  <option value="USD">USD</option><option value="UGX">UGX</option><option value="KES">KES</option>
                </select>
              </Field>
              <Field label="Anti-snipe (min)" hint="A bid inside this window pushes the end back.">
                <input type="number" min="0" className={inputCls(false)} value={auctionForm.anti_snipe_minutes}
                  onChange={e => setAuctionForm({ ...auctionForm, anti_snipe_minutes: e.target.value })}/>
              </Field>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <ShieldCheck size={13}/> Who can bid
              </p>
              <Field label="Access mode"
                hint="Deposit is the usual choice: it is what makes a winning bid an actual commitment.">
                <select className={selectCls(false)} value={auctionForm.access_mode}
                  onChange={e => setAuctionForm({ ...auctionForm, access_mode: e.target.value })}>
                  <option value="deposit">Refundable deposit</option>
                  <option value="approval">Manual approval</option>
                  <option value="open">Open to any account</option>
                </select>
              </Field>

              {auctionForm.access_mode === 'deposit' && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <Field label="Deposit" required error={errors.deposit_amount}>
                    <input type="number" step="0.01" min="0" className={inputCls(errors.deposit_amount)}
                      value={auctionForm.deposit_amount}
                      onChange={e => setAuctionForm({ ...auctionForm, deposit_amount: e.target.value })}/>
                  </Field>
                  <Field label="Limit multiplier" hint="Limit = deposit × this.">
                    <input type="number" min="1" className={inputCls(false)} value={auctionForm.deposit_multiplier}
                      onChange={e => setAuctionForm({ ...auctionForm, deposit_multiplier: e.target.value })}/>
                  </Field>
                </div>
              )}

              {auctionForm.access_mode === 'deposit' && auctionForm.deposit_amount && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-900">
                  A deposit of <strong>{fmt(auctionForm.deposit_amount)} {auctionForm.currency}</strong> opens a
                  bidding limit of{' '}
                  <strong>{fmt(auctionForm.deposit_amount * auctionForm.deposit_multiplier)} {auctionForm.currency}</strong>.
                </div>
              )}

              <div className="mt-3">
                <Field label="Payment deadline (hours)"
                  hint="After this, you can forfeit the deposit and reassign the lot.">
                  <input type="number" min="1" className={inputCls(false)} value={auctionForm.payment_deadline_hours}
                    onChange={e => setAuctionForm({ ...auctionForm, payment_deadline_hours: e.target.value })}/>
                </Field>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
            <button onClick={() => setDrawer(null)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium">
              Cancel
            </button>
            <button onClick={submitAuction} disabled={submitting}
              className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2
                ${submitting ? 'bg-amber-400' : 'bg-amber-600 hover:bg-amber-700'}`}>
              {submitting ? <><Loader2 size={15} className="animate-spin"/> Saving…</> : <><Check size={15}/> Create</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  VUE DÉTAIL
  // ══════════════════════════════════════════════════════════════════════════
  const regs = selected.registrations ?? [];
  const pendingRegs = regs.filter(r => r.status === 'pending').length;
  const awaiting = (selected.lots ?? []).filter(l => l.status === 'awaiting_payment');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50/20 p-4 sm:p-6 light-panel">

      <button onClick={() => { setSelected(null); fetchAuctions(); }}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={15}/> All auctions
      </button>

      {/* En-tête */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 flex-wrap">
              {selected.name} <Badge status={selected.status}/>
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {fmtDate(selected.starts_at)} → {fmtDate(selected.ends_at)} ·
              anti-snipe {selected.anti_snipe_minutes} min ·
              payment due {selected.payment_deadline_hours} h after close
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => openAuction(selected.id)}
              className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm px-3 py-2 rounded-xl">
              <RefreshCw size={14}/>
            </button>
            {selected.status === 'draft' && (
              <button onClick={doOpen}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-xl font-medium">
                <Play size={15}/> Open bidding
              </button>
            )}
            {selected.status === 'live' && (
              <button onClick={doClose}
                className="inline-flex items-center gap-1.5 bg-gray-800 hover:bg-black text-white text-sm px-4 py-2 rounded-xl font-medium">
                <Lock size={15}/> Close auction
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <StatCard label="Bids placed" value={selected.stats?.total_bids ?? 0}/>
          <StatCard label={`Total value (${selected.currency})`} value={fmt(selected.stats?.total_value)}/>
          <StatCard label={`Weighted avg /kg`} value={fmt(selected.stats?.weighted_average_per_kg)}/>
          <StatCard label={`Highest lot /kg`} value={fmt(selected.stats?.highest_lot_price_per_kg)} tone="text-amber-700"/>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-5 shadow-sm w-fit">
        {[
          { id: 'lots',     label: 'Lots',    icon: <Package size={15}/>, count: selected.lots?.length ?? 0 },
          { id: 'bidders',  label: 'Bidders', icon: <Users size={15}/>,   count: regs.length, alert: pendingRegs },
          { id: 'payments', label: 'Payments',icon: <Wallet size={15}/>,  count: awaiting.length },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-amber-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
            {t.icon} {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {t.count}
            </span>
            {t.alert > 0 && tab !== t.id && (
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"/>
            )}
          </button>
        ))}
      </div>

      {/* ── LOTS ─────────────────────────────────────────────────────── */}
      {tab === 'lots' && (
        <div className="space-y-3">
          {selected.status === 'draft' && (
            <button onClick={() => { setLotForm(EMPTY_LOT); setErrors({}); setDrawer('lot'); }}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-white border-2 border-dashed border-amber-200 hover:border-amber-400 text-amber-700 text-sm px-4 py-4 rounded-2xl font-medium transition-colors">
              <Plus size={15}/> Add a lot
            </button>
          )}

          {(selected.lots ?? []).length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <Package size={36} className="mx-auto mb-2 text-gray-300"/>
              <p className="text-sm text-gray-400">
                No lot yet. Only products in <strong>Whole lot</strong> mode can be auctioned.
              </p>
            </div>
          )}

          {(selected.lots ?? []).map(lot => (
            <div key={lot.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 font-bold flex-shrink-0 overflow-hidden">
                    {lot.image ? <img src={lot.image} alt="" className="w-full h-full object-cover"/> : lot.lot_number}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 flex-wrap">
                      #{lot.lot_number} {lot.name} <Badge status={lot.status}/>
                    </h3>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                      <span>{fmt(lot.weight_kg)} kg</span>
                      <span>start {fmt(lot.starting_price_per_kg)}/kg</span>
                      <span>+{fmt(lot.min_increment)} increment</span>
                      {lot.reserve_price_per_kg != null && (
                        <span className="text-amber-700 font-semibold">
                          reserve {fmt(lot.reserve_price_per_kg)}/kg
                        </span>
                      )}
                      <span>ends {fmtDate(lot.ends_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-gray-800">
                    {lot.current_price_per_kg != null ? `${fmt(lot.current_price_per_kg)}/kg` : '—'}
                  </p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                    <TrendingUp size={11}/> {lot.bid_count} bid(s) · {fmt(lot.current_total)} total
                  </p>
                  {lot.status === 'awaiting_payment' && (
                    <p className="text-xs text-amber-700 mt-1">due {fmtDate(lot.payment_due_at)}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── BIDDERS ──────────────────────────────────────────────────── */}
      {tab === 'bidders' && (
        <div className="space-y-3">
          {regs.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <Users size={36} className="mx-auto mb-2 text-gray-300"/>
              <p className="text-sm text-gray-400">No registration yet.</p>
            </div>
          )}
          {regs.map(reg => (
            <div key={reg.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-gray-800 flex items-center gap-2 flex-wrap">
                    {reg.company_name || reg.username || `User #${reg.user_id}`}
                    <Badge status={reg.status}/>
                    {reg.deposit_status === 'held' && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Deposit held
                      </span>
                    )}
                    {reg.deposit_status === 'forfeited' && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                        Deposit forfeited
                      </span>
                    )}
                  </h3>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                    {reg.contact_phone && <span>{reg.contact_phone}</span>}
                    {reg.contact_email && <span>{reg.contact_email}</span>}
                    {reg.shipping_country && <span>{reg.shipping_country}</span>}
                    {reg.bid_limit != null && (
                      <span className="font-semibold text-gray-700">
                        {fmt(reg.committed_exposure)} / {fmt(reg.bid_limit)} committed
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  {(reg.status === 'pending' || reg.status === 'approved') && (
                    <button onClick={() => approveReg(reg)}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                      <ShieldCheck size={12}/> {reg.status === 'pending' ? 'Approve' : 'Set limit'}
                    </button>
                  )}
                  {reg.status !== 'rejected' && reg.status !== 'defaulted' && (
                    <button onClick={() => rejectReg(reg)}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-red-50 text-red-700 hover:bg-red-100 border-red-200">
                      <ShieldAlert size={12}/> Reject
                    </button>
                  )}
                  {reg.deposit_status === 'held' && selected.status === 'closed' && (
                    <button onClick={() => refundReg(reg)}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200">
                      <Wallet size={12}/> Refund
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PAYMENTS ─────────────────────────────────────────────────── */}
      {tab === 'payments' && (
        <div className="space-y-3">
          {awaiting.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <Wallet size={36} className="mx-auto mb-2 text-gray-300"/>
              <p className="text-sm text-gray-400">
                Nothing awaiting payment. Lots appear here once the auction is closed.
              </p>
            </div>
          )}
          {awaiting.map(lot => {
            const late = lot.payment_due_at && new Date(lot.payment_due_at) < new Date();
            return (
              <div key={lot.id} className={`bg-white rounded-2xl border shadow-sm p-4 sm:p-5 ${late ? 'border-red-200' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-gray-800">#{lot.lot_number} {lot.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Winner: user #{lot.winner_user_id} · order #{lot.order_id} ·
                      {fmt(lot.current_total)} {selected.currency}
                    </p>
                    <p className={`text-xs mt-0.5 ${late ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                      {late ? 'Overdue since ' : 'Due '}{fmtDate(lot.payment_due_at)}
                    </p>
                  </div>
                  {late && (
                    <button onClick={() => doDefault(lot)}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 flex-shrink-0">
                      <Ban size={12}/> Declare default
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer — ajouter un lot */}
      {drawer === 'lot' && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setDrawer(null)}/>}
      <div className={`fixed top-0 right-0 h-full z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 light-panel ${drawer === 'lot' ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Package size={18} className="text-amber-600"/> Add a lot
          </h2>
          <button onClick={() => setDrawer(null)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"><X size={18}/></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {lotProducts.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
              <Coffee size={16} className="mb-2"/>
              No product is set to <strong>Whole lot</strong> mode. Create one in the
              Eco-Shop Manager first — the lot carries its name, images, story and
              traceability.
            </div>
          ) : (
            <>
              <Field label="Product" required error={errors.product_id}
                hint="Adding it here hides it from the shop grid until the auction ends.">
                <select className={selectCls(errors.product_id)} value={lotForm.product_id}
                  onChange={e => {
                    const p = lotProducts.find(x => String(x.id) === e.target.value);
                    setLotForm({
                      ...lotForm, product_id: e.target.value,
                      weight_kg: p?.stock_qty ?? '',
                      starting_price_per_kg: lotForm.starting_price_per_kg || p?.price || '',
                    });
                  }}>
                  <option value="">Select a lot product</option>
                  {lotProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {fmt(p.stock_qty)} kg
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Weight (kg)" hint="Defaults to the product's lot weight.">
                  <input type="number" step="0.001" min="0" className={inputCls(false)}
                    value={lotForm.weight_kg}
                    onChange={e => setLotForm({ ...lotForm, weight_kg: e.target.value })}/>
                </Field>
                <Field label="Starting price /kg" required error={errors.starting_price_per_kg}>
                  <input type="number" step="0.01" min="0" className={inputCls(errors.starting_price_per_kg)}
                    value={lotForm.starting_price_per_kg}
                    onChange={e => setLotForm({ ...lotForm, starting_price_per_kg: e.target.value })}/>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Bid increment" hint="Smallest raise between bids.">
                  <input type="number" step="0.01" min="0.01" className={inputCls(false)}
                    value={lotForm.min_increment}
                    onChange={e => setLotForm({ ...lotForm, min_increment: e.target.value })}/>
                </Field>
                <Field label="Reserve /kg" hint="Never shown publicly. Below it, the lot is not sold.">
                  <input type="number" step="0.01" min="0" className={inputCls(false)}
                    placeholder="Optional" value={lotForm.reserve_price_per_kg}
                    onChange={e => setLotForm({ ...lotForm, reserve_price_per_kg: e.target.value })}/>
                </Field>
              </div>

              {lotForm.weight_kg && lotForm.starting_price_per_kg && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700">
                  Bidding opens at{' '}
                  <strong>{fmt(lotForm.weight_kg * lotForm.starting_price_per_kg)} {selected.currency}</strong>{' '}
                  for the whole lot.
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={() => setDrawer(null)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium">
            Cancel
          </button>
          <button onClick={submitLot} disabled={submitting || lotProducts.length === 0}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2
              ${submitting || lotProducts.length === 0 ? 'bg-amber-400' : 'bg-amber-600 hover:bg-amber-700'}`}>
            {submitting ? <><Loader2 size={15} className="animate-spin"/> Saving…</> : <><Check size={15}/> Add lot</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuctionManager;