import React, { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';
import {
  ClipboardList, Search, X, Loader2, AlertTriangle, Package, Truck,
  CheckCircle2, XCircle, RotateCcw, Clock, CreditCard, Download,
  ChevronLeft, ChevronRight, Gavel, MapPin, Phone, Mail, User as UserIcon,
} from 'lucide-react';
import {
  C, sans, mono, serif, card, sectionLabel, statusMeta,
  OVERLAY, ON_INK, SHADOW_LIFT, PANEL_CSS,
} from './theme';

// =============================================================================
//  src/components/Ecommerce/OrderManager.jsx
//
//  Monté dans l'onglet « Orders » d'EcoProductManager, et utilisable seul.
//
//  Dépend du backend patché :
//    - GET /api/ecommerce/orders/admin renvoie { items, total, pages, … }
//    - GET /api/ecommerce/orders/admin/counts
//    - le serveur publie les transitions autorisées ; le front n'affiche que
//      les boutons correspondants, il ne devine rien.
// =============================================================================

const STATUS_ICONS = {
  pending:        <Clock size={11}/>,
  payment_failed: <XCircle size={11}/>,
  paid:           <CreditCard size={11}/>,
  shipped:        <Truck size={11}/>,
  delivered:      <CheckCircle2 size={11}/>,
  cancelled:      <XCircle size={11}/>,
  refunded:       <RotateCcw size={11}/>,
};

// Onglets ordonnés par urgence pour l'admin, pas par ordre du cycle de vie :
// « à expédier » est ce qu'on vient regarder chaque matin.
const TABS = [
  { id: 'all',       label: 'All' },
  { id: 'paid',      label: 'To ship' },
  { id: 'shipped',   label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'pending',   label: 'Unpaid' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'refunded',  label: 'Refunded' },
];

const ACTIONS = {
  shipped:   { label: 'Mark as shipped',   bg: C.teal,   icon: <Truck size={13}/> },
  delivered: { label: 'Mark as delivered', bg: C.accent, icon: <CheckCircle2 size={13}/> },
  cancelled: { label: 'Cancel order',      bg: C.stone,     icon: <XCircle size={13}/> },
  refunded:  { label: 'Mark as refunded',  bg: C.amber,  icon: <RotateCcw size={13}/> },
};

const fmtMoney = (n, currency) =>
  `${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || ''}`.trim();

const fmtQty = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 3 });

const fmtDate = (iso, withTime = true) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    day: '2-digit', month: 'short', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
};

const StatusPill = ({ status }) => {
  const m = statusMeta(status);
  return (
    <span style={{
      ...sans, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center',
      gap: 4, padding: '3px 9px', borderRadius: 999,
      color: m.fg, background: m.bg, border: `1px solid ${m.bd}`,
    }}>
      {STATUS_ICONS[status]} {m.label}
    </span>
  );
};

const swalTheme = {
  customClass: { popup: 'rounded-2xl' },
  confirmButtonColor: C.accent,
  cancelButtonColor: C.stone,
};

// ── Tiroir de détail ─────────────────────────────────────────────────────────
const OrderDrawer = ({ order, transitions, open, onClose, onChanged }) => {
  const [busy, setBusy] = useState(false);
  if (!order) return null;

  const allowed = transitions[order.status] || [];
  const isAuction = order.items?.some(i => i.auction_lot_id);

  const changeStatus = async (next) => {
    const meta = ACTIONS[next];
    const undoesStock = next === 'cancelled' || next === 'refunded';

    const result = await Swal.fire({
      ...swalTheme,
      title: `${meta.label}?`,
      text: undoesStock
        ? 'If this order was already paid, its stock goes back to the catalogue.'
        : `Order #${order.id} moves to "${statusMeta(next).label}".`,
      icon: undoesStock ? 'warning' : 'question',
      input: undoesStock ? 'text' : undefined,
      inputPlaceholder: undoesStock ? 'Reason (optional, kept in stock history)' : undefined,
      showCancelButton: true,
      confirmButtonText: meta.label,
      confirmButtonColor: meta.bg,
    });
    if (!result.isConfirmed) return;

    setBusy(true);
    try {
      const { data } = await axiosInstance.put(
        `/api/ecommerce/orders/${order.id}/status`,
        { status: next, note: result.value || null },
      );
      onChanged(data.order);
      Swal.fire({ ...swalTheme, icon: 'success', title: data.msg, timer: 1800, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ ...swalTheme, icon: 'error', title: 'The order could not be updated',
        text: err.response?.data?.msg || err.message });
    } finally {
      setBusy(false);
    }
  };

  const Row = ({ icon, children }) => (
    <p style={{ ...sans, fontSize: 13, color: C.inkSoft, display: 'flex', alignItems: 'flex-start', gap: 9 }}>
      <span style={{ color: C.faint, marginTop: 2, flexShrink: 0 }}>{icon}</span>
      <span>{children}</span>
    </p>
  );

  return (
    <>
      {open && (
        <div onClick={onClose} style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: OVERLAY, backdropFilter: 'blur(2px)',
        }}/>
      )}
      <div className="nk-panel" style={{
        position: 'fixed', top: 0, right: 0, height: '100%', zIndex: 50,
        width: '100%', maxWidth: 480, background: C.card,
        boxShadow: SHADOW_LIFT,
        display: 'flex', flexDirection: 'column',
        transition: 'transform .3s cubic-bezier(.4,0,.2,1)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
      }}>
        <style>{PANEL_CSS}</style>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '22px 24px', borderBottom: `1px solid ${C.line}`, flexShrink: 0 }}>
          <div>
            <span style={sectionLabel}>Order</span>
            <h2 style={{ ...serif, fontSize: 28, fontWeight: 500, color: C.ink, marginTop: 2,
              display: 'flex', alignItems: 'center', gap: 8 }}>
              #{order.id}
              {isAuction && <Gavel size={16} style={{ color: C.amber }} title="Contains an auction lot"/>}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 9 }}>
              <StatusPill status={order.status}/>
              <span style={{ ...sans, fontSize: 11.5, color: C.faint }}>{fmtDate(order.date_created)}</span>
            </div>
          </div>
          <button onClick={onClose} className="nk-btn"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.faint, padding: 6 }}>
            <X size={18}/>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          <div>
            <p style={{ ...sectionLabel, marginBottom: 11 }}>Customer</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <Row icon={<UserIcon size={13}/>}>
                {order.customer_name || 'No name given'}
                {order.user_id && <span style={{ color: C.faint }}> · account #{order.user_id}</span>}
              </Row>
              {order.customer_email && (
                <Row icon={<Mail size={13}/>}>
                  <a href={`mailto:${order.customer_email}`} style={{ color: C.accent, textDecoration: 'none' }}>
                    {order.customer_email}
                  </a>
                </Row>
              )}
              {order.guest_phone && (
                <Row icon={<Phone size={13}/>}>
                  <a href={`tel:${order.guest_phone}`} style={{ color: C.accent, textDecoration: 'none' }}>
                    {order.guest_phone}
                  </a>
                </Row>
              )}
              {order.shipping_address && (
                <Row icon={<MapPin size={13}/>}>
                  <span style={{ whiteSpace: 'pre-line' }}>{order.shipping_address}</span>
                </Row>
              )}
            </div>
          </div>

          <div>
            <p style={{ ...sectionLabel, marginBottom: 11 }}>Items · {order.items?.length || 0}</p>
            <div style={{ border: `1px solid ${C.line}`, borderRadius: 12, overflow: 'hidden' }}>
              {order.items?.map((item, i) => (
                <div key={item.id} style={{ display: 'flex', gap: 12, padding: 14,
                  borderTop: i > 0 ? `1px solid ${C.lineSoft}` : 'none' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: C.paperAlt,
                    flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.product_image
                      ? <img src={item.product_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                      : <Package size={15} style={{ color: C.faint }}/>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ ...sans, fontSize: 13.5, fontWeight: 600, color: C.ink,
                      display: 'flex', alignItems: 'center', gap: 6 }}>
                      {item.product_name}
                      {item.auction_lot_id && <Gavel size={12} style={{ color: C.amber }}/>}
                    </p>
                    <p style={{ ...mono, fontSize: 11.5, color: C.muted, marginTop: 3 }}>
                      {fmtQty(item.quantity)} {item.unit} × {fmtMoney(item.unit_price, order.currency)}
                    </p>
                  </div>
                  <p style={{ ...mono, fontSize: 13, color: C.ink, whiteSpace: 'nowrap' }}>
                    {fmtMoney(item.line_total)}
                  </p>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                padding: '14px 16px', borderTop: `1px solid ${C.line}`, background: C.paperAlt }}>
                <span style={{ ...sans, fontSize: 12.5, color: C.inkSoft }}>Total</span>
                <span style={{ ...serif, fontSize: 24, fontWeight: 600, color: C.ink }}>
                  {Number(order.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  <span style={{ ...mono, fontSize: 11, color: C.amber, marginLeft: 6 }}>{order.currency}</span>
                </span>
              </div>
            </div>
          </div>

          <div>
            <p style={{ ...sectionLabel, marginBottom: 11 }}>Payment</p>
            {[
              ['Method', (order.payment_method || '—').toUpperCase()],
              ['Reference', order.dpo_trans_ref || '—'],
              ['Last update', fmtDate(order.date_updated)],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between',
                padding: '6px 0', ...sans, fontSize: 12.5 }}>
                <span style={{ color: C.muted }}>{k}</span>
                <span style={{ ...mono, fontSize: 11.5, color: C.ink }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions : seulement celles que le serveur autorise pour ce statut */}
        <div style={{ flexShrink: 0, padding: '16px 24px', borderTop: `1px solid ${C.line}`, background: C.card }}>
          {allowed.length === 0 ? (
            <p style={{ ...sans, fontSize: 12, color: C.faint, textAlign: 'center', padding: '6px 0' }}>
              This order has reached a final state.
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {allowed.map(next => {
                const meta = ACTIONS[next];
                if (!meta) return null;
                return (
                  <button key={next} onClick={() => changeStatus(next)} disabled={busy} className="nk-btn"
                    style={{
                      ...sans, flex: '1 1 150px', padding: '11px 14px', borderRadius: 10, border: 'none',
                      background: meta.bg, color: '#fff', fontSize: 13, fontWeight: 600,
                      cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.55 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    }}>
                    {busy ? <Loader2 size={14} className="animate-spin"/> : meta.icon}
                    {meta.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// =============================================================================
const OrderManager = () => {
  const [orders,      setOrders]      = useState([]);
  const [counts,      setCounts]      = useState({});
  const [transitions, setTransitions] = useState({});
  const [revenue,     setRevenue]     = useState([]);
  const [total,       setTotal]       = useState(0);
  const [pages,       setPages]       = useState(1);
  const [page,        setPage]        = useState(1);
  const [status,      setStatus]      = useState('all');
  const [source,      setSource]      = useState('all');
  const [search,      setSearch]      = useState('');
  const [query,       setQuery]       = useState('');
  const [dates,       setDates]       = useState({ from: '', to: '' });
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [selected,    setSelected]    = useState(null);

  // Recherche déclenchée 400 ms après la dernière frappe : sans ça, taper
  // « marie » lance cinq requêtes dont quatre arrivent trop tard.
  useEffect(() => {
    const t = setTimeout(() => { setQuery(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchOrders = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await axiosInstance.get('/api/ecommerce/orders/admin', {
        params: {
          page, per_page: 20, status, source,
          q: query || undefined,
          from: dates.from || undefined,
          to: dates.to || undefined,
        },
      });
      setOrders(data.items ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
      setTransitions(data.transitions ?? {});
      setRevenue(data.selection_revenue ?? []);
    } catch (err) {
      setError(err.response?.data?.msg || 'Orders could not be loaded. Check that you are signed in as an admin.');
    } finally {
      setLoading(false);
    }
  }, [page, status, source, query, dates.from, dates.to]);

  const fetchCounts = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get('/api/ecommerce/orders/admin/counts');
      setCounts(data ?? {});
    } catch { /* les pastilles sont un confort, pas une dépendance */ }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  // Après un changement de statut, on remplace la ligne en place : recharger
  // toute la liste ferait perdre à l'admin sa position de lecture.
  const handleChanged = (updated) => {
    setOrders(list => list.map(o => (o.id === updated.id ? updated : o)));
    setSelected(updated);
    fetchCounts();
  };

  const exportCsv = () => {
    const params = new URLSearchParams({
      ...(dates.from ? { from: dates.from } : {}),
      ...(dates.to ? { to: dates.to } : {}),
      ...(status !== 'all' ? { status } : {}),
      ...(source !== 'all' ? { source } : {}),
    });
    // Via axios pour porter le jeton JWT : une balise <a> nue partirait sans
    // en-tête d'authentification et recevrait un 401.
    axiosInstance.get(`/api/ecommerce/stats/export/orders.csv?${params}`, { responseType: 'blob' })
      .then(res => {
        const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `nkusu-orders-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => Swal.fire({ ...swalTheme, icon: 'error', title: 'Export failed',
        text: 'The file could not be generated.' }));
  };

  const resetFilters = () => {
    setStatus('all'); setSource('all'); setSearch(''); setDates({ from: '', to: '' }); setPage(1);
  };

  const hasFilters = status !== 'all' || source !== 'all' || search || dates.from || dates.to;

  return (
    <div className="nk-panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <style>{PANEL_CSS}</style>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 3, overflowX: 'auto', background: C.paperAlt,
        borderRadius: 12, padding: 4 }}>
        {TABS.map(t => {
          const active = status === t.id;
          return (
            <button key={t.id} onClick={() => { setStatus(t.id); setPage(1); }} className="nk-btn"
              style={{
                ...sans, fontSize: 12.5, fontWeight: 600, padding: '7px 13px', borderRadius: 8,
                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: active ? C.ink : 'transparent',
                color: active ? C.paper : C.muted,
              }}>
              {t.label}
              {counts[t.id] > 0 && (
                <span style={{
                  ...mono, fontSize: 10.5, padding: '1px 6px', borderRadius: 999,
                  background: active ? ON_INK : C.card,
                  color: active ? C.paper : C.inkSoft,
                  border: active ? 'none' : `1px solid ${C.line}`,
                }}>
                  {counts[t.id]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filtres */}
      <div style={{ ...card({ padding: 12 }), display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 230px' }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: C.faint }}>
            <Search size={14}/>
          </span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Name, email, phone, order number, DPO reference…"
            style={{ width: '100%', paddingLeft: 33, paddingRight: 33 }}/>
          {search && (
            <button onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: C.faint, padding: 0 }}>
              <X size={14}/>
            </button>
          )}
        </div>

        <input type="date" value={dates.from}
          onChange={e => { setDates({ ...dates, from: e.target.value }); setPage(1); }}/>
        <span style={{ ...sans, fontSize: 12, color: C.faint }}>to</span>
        <input type="date" value={dates.to}
          onChange={e => { setDates({ ...dates, to: e.target.value }); setPage(1); }}/>

        <select value={source} onChange={e => { setSource(e.target.value); setPage(1); }}
          style={{ cursor: 'pointer' }}>
          <option value="all">Shop and auctions</option>
          <option value="shop">Shop only</option>
          <option value="auction">Auctions only</option>
        </select>

        {hasFilters && (
          <button onClick={resetFilters} className="nk-btn"
            style={{ ...sans, fontSize: 12.5, padding: '9px 13px', borderRadius: 10,
              border: `1px solid ${C.line}`, background: C.card, color: C.muted, cursor: 'pointer' }}>
            Clear
          </button>
        )}

        <button onClick={exportCsv} className="nk-btn"
          style={{ ...sans, fontSize: 12.5, fontWeight: 600, padding: '9px 14px', borderRadius: 10,
            border: 'none', background: C.ink, color: C.paper, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <Download size={14}/> Export CSV
        </button>
      </div>

      {/* Total encaissé sur la sélection */}
      {revenue.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 14,
          background: C.mossSoft, border: `1px solid ${C.moss}2E`, borderRadius: 12, padding: '11px 18px' }}>
          <span style={{ ...sectionLabel, color: C.moss }}>Paid in this selection</span>
          {revenue.map(r => (
            <span key={r.currency} style={{ ...serif, fontSize: 20, fontWeight: 600, color: C.ink }}>
              {Number(r.amount).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              <span style={{ ...mono, fontSize: 11, color: C.muted, marginLeft: 5 }}>{r.currency}</span>
            </span>
          ))}
          <span style={{ ...sans, fontSize: 11.5, color: C.muted, marginLeft: 'auto' }}>
            {total} orders match
          </span>
        </div>
      )}

      {error && (
        <div style={{ ...sans, background: C.brickSoft, border: `1px solid ${C.brick}33`,
          borderLeft: `3px solid ${C.brick}`, borderRadius: 10, padding: '13px 16px',
          fontSize: 13, color: C.brick, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={15}/> {error}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
          <Loader2 size={22} className="animate-spin" style={{ color: C.accent }}/>
        </div>
      ) : orders.length === 0 ? (
        <div style={card({ padding: '64px 24px', textAlign: 'center' })}>
          <ClipboardList size={36} style={{ color: C.line, margin: '0 auto 14px' }}/>
          <p style={{ ...serif, fontSize: 21, color: C.inkSoft }}>No orders match these filters</p>
          {hasFilters && (
            <button onClick={resetFilters}
              style={{ ...sans, fontSize: 13, fontWeight: 600, color: C.accent, background: 'none',
                border: 'none', cursor: 'pointer', marginTop: 10 }}>
              Clear the filters
            </button>
          )}
        </div>
      ) : (
        <div style={card({ overflow: 'hidden' })}>
          {orders.map((order, i) => {
            const isAuction = order.items?.some(it => it.auction_lot_id);
            return (
              <button key={order.id} onClick={() => setSelected(order)} className="nk-row"
                style={{
                  width: '100%', textAlign: 'left', background: 'none', cursor: 'pointer',
                  border: 'none', borderTop: i > 0 ? `1px solid ${C.lineSoft}` : 'none',
                  padding: '15px 18px', display: 'flex', alignItems: 'flex-start',
                  justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
                }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13, minWidth: 0 }}>
                  <span style={{
                    ...mono, fontSize: 11, color: C.amber, background: C.amberSoft,
                    borderRadius: 8, padding: '7px 9px', flexShrink: 0, letterSpacing: 0.2,
                  }}>
                    {String(order.id).padStart(3, '0')}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ ...sans, fontSize: 14, fontWeight: 600, color: C.ink,
                      display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                      {order.customer_name || 'Guest'}
                      {isAuction && <Gavel size={12} style={{ color: C.amber }} title="Auction lot"/>}
                      <StatusPill status={order.status}/>
                    </p>
                    <p style={{ ...sans, fontSize: 11.5, color: C.faint, marginTop: 4 }}>
                      {fmtDate(order.date_created, false)} · {order.items?.length || 0} items ·{' '}
                      {fmtQty(order.item_count)} units
                      {order.customer_email && ` · ${order.customer_email}`}
                    </p>
                  </div>
                </div>
                <span style={{ ...mono, fontSize: 14, color: C.ink, whiteSpace: 'nowrap' }}>
                  {fmtMoney(order.total_amount, order.currency)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, paddingTop: 4 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="nk-btn"
            style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 9, padding: 8,
              color: C.muted, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.35 : 1 }}>
            <ChevronLeft size={16}/>
          </button>
          <span style={{ ...sans, fontSize: 12.5, color: C.muted }}>
            Page <span style={mono}>{page}</span> of <span style={mono}>{pages}</span>
          </span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="nk-btn"
            style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 9, padding: 8,
              color: C.muted, cursor: page === pages ? 'not-allowed' : 'pointer', opacity: page === pages ? 0.35 : 1 }}>
            <ChevronRight size={16}/>
          </button>
        </div>
      )}

      <OrderDrawer order={selected} transitions={transitions} open={selected !== null}
        onClose={() => setSelected(null)} onChanged={handleChanged}/>
    </div>
  );
};

export default OrderManager;