import React, { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';
import {
  Users, Search, X, Loader2, AlertTriangle, Download, Package,
  ChevronLeft, ChevronRight, Phone, Mail, MapPin, Repeat, Truck, Star,
} from 'lucide-react';
import {
  C, sans, mono, serif, card, sectionLabel, statusMeta,
  OVERLAY, ON_INK, SHADOW_LIFT, PANEL_CSS,
} from './theme';

// =============================================================================
//  src/components/Ecommerce/CustomerManager.jsx
//
//  Buyers list: who ordered, how often, how much, what is still to ship.
//  Click a buyer to see every order they placed.
//
//  Backend: /api/ecommerce/customers, /customers/detail, /customers/export.csv
// =============================================================================

const fmtMoney = (n, currency) =>
  `${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || ''}`.trim();

const fmtDate = (iso, withTime = false) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    day: '2-digit', month: 'short', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
};

const daysSince = (iso) => {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
};

const swalTheme = {
  customClass: { popup: 'rounded-2xl' },
  confirmButtonColor: C.accent,
  cancelButtonColor: C.stone,
};

const StatusPill = ({ status }) => {
  const m = statusMeta(status);
  return (
    <span style={{
      ...sans, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999,
      color: m.fg, background: m.bg, border: `1px solid ${m.bd}`,
    }}>
      {m.label}
    </span>
  );
};

const Tag = ({ icon, children, bg, fg, bd }) => (
  <span style={{
    ...sans, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center',
    gap: 4, padding: '3px 9px', borderRadius: 999,
    color: fg, background: bg, border: `1px solid ${bd}`,
  }}>
    {icon} {children}
  </span>
);

// ── Buyer drawer ─────────────────────────────────────────────────────────────
const CustomerDrawer = ({ customerKey, open, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customerKey) { setData(null); return; }
    setLoading(true);
    axiosInstance.get('/api/ecommerce/customers/detail', { params: { key: customerKey } })
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [customerKey]);

  const c = data?.customer;

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
          position: 'fixed', inset: 0, zIndex: 40, background: OVERLAY, backdropFilter: 'blur(2px)',
        }}/>
      )}
      <div className="nk-panel" style={{
        position: 'fixed', top: 0, right: 0, height: '100%', zIndex: 50,
        width: '100%', maxWidth: 480, background: C.card, boxShadow: SHADOW_LIFT,
        display: 'flex', flexDirection: 'column',
        transition: 'transform .3s cubic-bezier(.4,0,.2,1)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
      }}>
        <style>{PANEL_CSS}</style>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '22px 24px', borderBottom: `1px solid ${C.line}`, flexShrink: 0 }}>
          <div>
            <span style={sectionLabel}>Buyer</span>
            <h2 style={{ ...serif, fontSize: 26, fontWeight: 500, color: C.ink, marginTop: 2 }}>
              {c?.name || 'Guest'}
            </h2>
            {c && (
              <div style={{ display: 'flex', gap: 7, marginTop: 9, flexWrap: 'wrap' }}>
                {c.kind === 'account'
                  ? <Tag bg={C.mossSoft} fg={C.moss} bd={`${C.moss}33`}>Account #{c.user_id}</Tag>
                  : <Tag bg={C.paperAlt} fg={C.muted} bd={C.line}>Guest</Tag>}
                {c.orders_count > 1 && (
                  <Tag icon={<Repeat size={11}/>} bg={C.amberSoft} fg={C.amber} bd={`${C.amber}33`}>
                    {c.orders_count} orders
                  </Tag>
                )}
                {c.to_ship > 0 && (
                  <Tag icon={<Truck size={11}/>} bg={C.brickSoft} fg={C.brick} bd={`${C.brick}33`}>
                    {c.to_ship} to ship
                  </Tag>
                )}
              </div>
            )}
          </div>
          <button onClick={onClose} className="nk-btn"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.faint, padding: 6 }}>
            <X size={18}/>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px',
          display: 'flex', flexDirection: 'column', gap: 24 }}>

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <Loader2 size={20} className="animate-spin" style={{ color: C.accent }}/>
            </div>
          )}

          {c && !loading && (
            <>
              <div>
                <p style={{ ...sectionLabel, marginBottom: 11 }}>Contact</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {c.email && (
                    <Row icon={<Mail size={13}/>}>
                      <a href={`mailto:${c.email}`} style={{ color: C.accent, textDecoration: 'none' }}>{c.email}</a>
                    </Row>
                  )}
                  {c.phone && (
                    <Row icon={<Phone size={13}/>}>
                      <a href={`tel:${c.phone}`} style={{ color: C.accent, textDecoration: 'none' }}>{c.phone}</a>
                    </Row>
                  )}
                  {c.shipping_address && (
                    <Row icon={<MapPin size={13}/>}>
                      <span style={{ whiteSpace: 'pre-line' }}>{c.shipping_address}</span>
                    </Row>
                  )}
                  {!c.email && !c.phone && (
                    <p style={{ ...sans, fontSize: 12.5, color: C.faint }}>No contact details recorded.</p>
                  )}
                </div>
              </div>

              <div>
                <p style={{ ...sectionLabel, marginBottom: 11 }}>Summary</p>
                {[
                  ['Total spent', c.spent.length
                    ? c.spent.map(s => fmtMoney(s.amount, s.currency)).join(' · ')
                    : '—'],
                  ['Orders', `${c.orders_count}${c.unpaid ? ` (${c.unpaid} unpaid)` : ''}`],
                  ['First order', fmtDate(c.first_order_at)],
                  ['Last order', `${fmtDate(c.last_order_at)}${
                    daysSince(c.last_order_at) != null ? ` · ${daysSince(c.last_order_at)} days ago` : ''}`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between',
                    gap: 16, padding: '6px 0', ...sans, fontSize: 12.5 }}>
                    <span style={{ color: C.muted }}>{k}</span>
                    <span style={{ color: C.ink, textAlign: 'right' }}>{v}</span>
                  </div>
                ))}
              </div>

              {data.favourites?.length > 0 && (
                <div>
                  <p style={{ ...sectionLabel, marginBottom: 11 }}>Buys most often</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {data.favourites.map(f => (
                      <div key={f.product_id} style={{ display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', gap: 12, ...sans, fontSize: 13, color: C.inkSoft }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <Star size={12} style={{ color: C.amber, flexShrink: 0 }}/> {f.name}
                        </span>
                        <span style={{ ...mono, fontSize: 11.5, color: C.muted, whiteSpace: 'nowrap' }}>
                          {f.quantity.toLocaleString('en-US', { maximumFractionDigits: 3 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p style={{ ...sectionLabel, marginBottom: 11 }}>Orders · {data.orders.length}</p>
                <div style={{ border: `1px solid ${C.line}`, borderRadius: 12, overflow: 'hidden' }}>
                  {data.orders.map((o, i) => (
                    <div key={o.id} style={{ padding: '13px 15px',
                      borderTop: i > 0 ? `1px solid ${C.lineSoft}` : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <span style={{ ...mono, fontSize: 11, color: C.amber, background: C.amberSoft,
                            borderRadius: 7, padding: '4px 7px' }}>
                            {String(o.id).padStart(3, '0')}
                          </span>
                          <StatusPill status={o.status}/>
                        </span>
                        <span style={{ ...mono, fontSize: 13, color: C.ink }}>
                          {fmtMoney(o.total_amount, o.currency)}
                        </span>
                      </div>
                      <p style={{ ...sans, fontSize: 11.5, color: C.faint, marginTop: 5,
                        display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Package size={11}/> {o.items?.length || 0} items · {fmtDate(o.date_created)}
                      </p>
                    </div>
                  ))}
                </div>
                <p style={{ ...sans, fontSize: 11.5, color: C.faint, marginTop: 8 }}>
                  Change an order status from the Orders page.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

// =============================================================================
const CustomerManager = () => {
  const [items,    setItems]    = useState([]);
  const [meta,     setMeta]     = useState({ total: 0, pages: 1, repeat_buyers: 0, to_ship_buyers: 0, selection_spent: [] });
  const [page,     setPage]     = useState(1);
  const [sort,     setSort]     = useState('recent');
  const [toShip,   setToShip]   = useState(false);
  const [search,   setSearch]   = useState('');
  const [query,    setQuery]    = useState('');
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setQuery(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await axiosInstance.get('/api/ecommerce/customers', {
        params: { page, per_page: 20, sort, q: query || undefined, to_ship: toShip ? 1 : undefined },
      });
      setItems(data.items ?? []);
      setMeta({
        total: data.total ?? 0,
        pages: data.pages ?? 1,
        repeat_buyers: data.repeat_buyers ?? 0,
        to_ship_buyers: data.to_ship_buyers ?? 0,
        selection_spent: data.selection_spent ?? [],
      });
    } catch (err) {
      setError(err.response?.data?.msg || 'Buyers could not be loaded. Check that you are signed in as an admin.');
    } finally {
      setLoading(false);
    }
  }, [page, sort, query, toShip]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const exportCsv = () => {
    axiosInstance.get('/api/ecommerce/customers/export.csv', { responseType: 'blob' })
      .then(res => {
        const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `nkusu-buyers-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => Swal.fire({ ...swalTheme, icon: 'error', title: 'Export failed',
        text: 'The file could not be generated.' }));
  };

  return (
    <div className="nk-panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <style>{PANEL_CSS}</style>

      {/* Filters */}
      <div style={{ ...card({ padding: 12 }), display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 230px' }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: C.faint }}>
            <Search size={14}/>
          </span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Name, email or phone…"
            style={{ width: '100%', paddingLeft: 33, paddingRight: 33 }}/>
          {search && (
            <button onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: C.faint, padding: 0 }}>
              <X size={14}/>
            </button>
          )}
        </div>

        <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }} style={{ cursor: 'pointer' }}>
          <option value="recent">Most recent order</option>
          <option value="orders">Most orders</option>
          <option value="spent">Highest spend</option>
        </select>

        <button onClick={() => { setToShip(v => !v); setPage(1); }} className="nk-btn"
          style={{ ...sans, fontSize: 12.5, fontWeight: 600, padding: '9px 13px', borderRadius: 10,
            border: toShip ? 'none' : `1px solid ${C.line}`,
            background: toShip ? C.ink : C.card, color: toShip ? C.paper : C.muted,
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <Truck size={14}/> With orders to ship
        </button>

        <button onClick={exportCsv} className="nk-btn"
          style={{ ...sans, fontSize: 12.5, fontWeight: 600, padding: '9px 14px', borderRadius: 10,
            border: 'none', background: C.ink, color: C.paper, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <Download size={14}/> Export CSV
        </button>
      </div>

      {/* Selection summary */}
      {meta.total > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 16,
          background: C.mossSoft, border: `1px solid ${C.moss}2E`, borderRadius: 12, padding: '11px 18px' }}>
          <span style={{ ...sectionLabel, color: C.moss }}>{meta.total} buyers</span>
          {meta.selection_spent.map(s => (
            <span key={s.currency} style={{ ...serif, fontSize: 20, fontWeight: 600, color: C.ink }}>
              {Number(s.amount).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              <span style={{ ...mono, fontSize: 11, color: C.muted, marginLeft: 5 }}>{s.currency}</span>
            </span>
          ))}
          <span style={{ ...sans, fontSize: 11.5, color: C.muted, marginLeft: 'auto' }}>
            {meta.repeat_buyers} came back · {meta.to_ship_buyers} waiting for a delivery
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

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
          <Loader2 size={22} className="animate-spin" style={{ color: C.accent }}/>
        </div>
      ) : items.length === 0 ? (
        <div style={card({ padding: '64px 24px', textAlign: 'center' })}>
          <Users size={36} style={{ color: C.line, margin: '0 auto 14px' }}/>
          <p style={{ ...serif, fontSize: 21, color: C.inkSoft }}>No buyer matches this search</p>
        </div>
      ) : (
        <div style={card({ overflow: 'hidden' })}>
          {items.map((c, i) => (
            <button key={c.key} onClick={() => setSelected(c.key)} className="nk-row"
              style={{
                width: '100%', textAlign: 'left', background: 'none', cursor: 'pointer',
                border: 'none', borderTop: i > 0 ? `1px solid ${C.lineSoft}` : 'none',
                padding: '15px 18px', display: 'flex', alignItems: 'flex-start',
                justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
              }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13, minWidth: 0 }}>
                <span style={{
                  ...serif, fontSize: 16, fontWeight: 600, color: C.moss, background: C.mossSoft,
                  borderRadius: 999, width: 38, height: 38, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {(c.name || 'G')[0].toUpperCase()}
                </span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ ...sans, fontSize: 14, fontWeight: 600, color: C.ink,
                    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {c.name || 'Guest'}
                    {c.orders_count > 1 && (
                      <Tag icon={<Repeat size={11}/>} bg={C.amberSoft} fg={C.amber} bd={`${C.amber}33`}>
                        {c.orders_count}
                      </Tag>
                    )}
                    {c.to_ship > 0 && (
                      <Tag icon={<Truck size={11}/>} bg={C.brickSoft} fg={C.brick} bd={`${C.brick}33`}>
                        {c.to_ship} to ship
                      </Tag>
                    )}
                  </p>
                  <p style={{ ...sans, fontSize: 11.5, color: C.faint, marginTop: 4 }}>
                    {[c.phone, c.email].filter(Boolean).join(' · ') || 'No contact details'}
                  </p>
                  <p style={{ ...sans, fontSize: 11.5, color: C.faint, marginTop: 2 }}>
                    Last order {fmtDate(c.last_order_at)}
                    {daysSince(c.last_order_at) != null && ` · ${daysSince(c.last_order_at)} days ago`}
                  </p>
                </div>
              </div>
              <span style={{ ...mono, fontSize: 14, color: C.ink, whiteSpace: 'nowrap', textAlign: 'right' }}>
                {c.spent.length
                  ? c.spent.map(s => fmtMoney(s.amount, s.currency)).join(' · ')
                  : <span style={{ color: C.faint }}>nothing paid yet</span>}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, paddingTop: 4 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="nk-btn"
            style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 9, padding: 8,
              color: C.muted, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.35 : 1 }}>
            <ChevronLeft size={16}/>
          </button>
          <span style={{ ...sans, fontSize: 12.5, color: C.muted }}>
            Page <span style={mono}>{page}</span> of <span style={mono}>{meta.pages}</span>
          </span>
          <button onClick={() => setPage(p => Math.min(meta.pages, p + 1))} disabled={page === meta.pages} className="nk-btn"
            style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 9, padding: 8,
              color: C.muted, cursor: page === meta.pages ? 'not-allowed' : 'pointer', opacity: page === meta.pages ? 0.35 : 1 }}>
            <ChevronRight size={16}/>
          </button>
        </div>
      )}

      <CustomerDrawer customerKey={selected} open={selected !== null} onClose={() => setSelected(null)}/>
    </div>
  );
};

export default CustomerManager;