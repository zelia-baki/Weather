import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axiosInstance from '../../axiosInstance';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import {
  Package, Search, Loader2, AlertTriangle, ArrowUpDown, Gavel, Coffee,
  PackageX, Moon, X,
} from 'lucide-react';
import {
  C, SERIES, sans, mono, serif, card, sectionLabel, pageTitle, cardTitle,
  chartTooltip, legendBottom, ON_INK, SHADOW, PANEL_CSS,
} from './theme';

ChartJS.register(ArcElement, Tooltip, Legend);

// =============================================================================
//  src/components/Ecommerce/SoldProductsDashboard.jsx
//
//  Deux lectures du catalogue, côte à côte :
//
//   « Sold »       — ce qui part, combien, pour quel montant, ce qu'il reste.
//   « Never sold » — ce qui dort. C'est la moitié que les tableaux de bord
//                    oublient, alors que c'est là qu'est le stock immobilisé.
//
//  Le CA vient de quantity × unit_price GELÉ dans EcoOrderItem, jamais du prix
//  courant : un produit dont le prix a doublé depuis ne fait pas
//  rétroactivement doubler les ventes du mois dernier.
// =============================================================================

const isoDaysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

const PRESETS = [
  { id: '30',   label: '30 days',   days: 30 },
  { id: '90',   label: '90 days',   days: 90 },
  { id: '365',  label: '12 months', days: 365 },
  { id: '3650', label: 'All time',  days: 3650 },
];

const SORTS = [
  { id: 'revenue', label: 'Revenue',    get: p => p.revenue },
  { id: 'qty',     label: 'Quantity',   get: p => p.qty_sold },
  { id: 'orders',  label: 'Orders',     get: p => p.order_count },
  { id: 'stock',   label: 'Stock left', get: p => p.stock_qty },
  { id: 'recent',  label: 'Last sold',  get: p => (p.last_sold ? new Date(p.last_sold).getTime() : 0) },
];

const fmtNum = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
const fmtQty = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 3 });
const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: '2-digit' })
  : '—';

const Segmented = ({ options, value, onChange }) => (
  <div style={{ display: 'flex', gap: 2, background: C.paperAlt, borderRadius: 10, padding: 3 }}>
    {options.map(o => (
      <button key={o.id} onClick={() => onChange(o.id)} className="nk-btn"
        style={{
          ...sans, fontSize: 12.5, fontWeight: 600, padding: '6px 12px', borderRadius: 8,
          border: 'none', cursor: 'pointer',
          background: value === o.id ? C.card : 'transparent',
          color: value === o.id ? C.ink : C.muted,
          boxShadow: value === o.id ? SHADOW : 'none',
        }}>
        {o.label}
      </button>
    ))}
  </div>
);

const Panel = ({ title, aside, children, style, bodyStyle }) => (
  <div style={card({ overflow: 'hidden', ...style })}>
    {(title || aside) && (
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        gap: 12, padding: '18px 20px 0' }}>
        <h2 style={cardTitle}>{title}</h2>
        {aside && <span style={{ ...sans, fontSize: 11.5, color: C.faint }}>{aside}</span>}
      </div>
    )}
    <div style={{ padding: 20, ...bodyStyle }}>{children}</div>
  </div>
);

// La barre de proportion : lire « la moitié du meilleur » se fait d'un coup
// d'œil, là où deux montants demandent une comparaison mentale.
const ShareBar = ({ value, max, color }) => (
  <div style={{ height: 3, background: C.lineSoft, borderRadius: 999, overflow: 'hidden', marginTop: 8 }}>
    <div style={{ height: '100%', background: color,
      width: `${max > 0 ? Math.max((value / max) * 100, 2) : 0}%`, borderRadius: 999 }}/>
  </div>
);

// =============================================================================
const SoldProductsDashboard = () => {
  const [preset,   setPreset]   = useState('90');
  const [source,   setSource]   = useState('all');
  const [currency, setCurrency] = useState(null);
  const [sort,     setSort]     = useState('revenue');
  const [search,   setSearch]   = useState('');
  const [view,     setView]     = useState('sold');

  const [data,    setData]    = useState(null);
  const [dormant, setDormant] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const days = (PRESETS.find(p => p.id === preset) || PRESETS[1]).days;

  const fetchAll = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = {
        from: isoDaysAgo(days - 1),
        to: new Date().toISOString().slice(0, 10),
        source, limit: 200,
      };
      const [sold, never] = await Promise.all([
        axiosInstance.get('/api/ecommerce/stats/products-sold', { params }),
        axiosInstance.get('/api/ecommerce/stats/never-sold'),
      ]);
      setData(sold.data);
      setDormant(never.data ?? []);
    } catch (err) {
      setError(err.response?.data?.msg || 'The product data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [days, source]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const currencies = useMemo(
    () => [...new Set((data?.products ?? []).map(p => p.currency))], [data]);
  const activeCurrency = (currency && currencies.includes(currency)) ? currency : currencies[0];

  const rows = useMemo(() => {
    const sorter = SORTS.find(s => s.id === sort) || SORTS[0];
    return (data?.products ?? [])
      .filter(p => p.currency === activeCurrency)
      .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => sorter.get(b) - sorter.get(a));
  }, [data, activeCurrency, search, sort]);

  const totals = useMemo(() => rows.reduce((acc, p) => ({
    revenue: acc.revenue + p.revenue,
    qty: acc.qty + p.qty_sold,
    orders: acc.orders + p.order_count,
  }), { revenue: 0, qty: 0, orders: 0 }), [rows]);

  const maxRevenue = rows.length ? Math.max(...rows.map(p => p.revenue)) : 0;

  const categoryChart = useMemo(() => {
    const cats = (data?.categories ?? []).filter(c => c.currency === activeCurrency);
    if (!cats.length) return null;
    return {
      labels: cats.map(c => c.category),
      datasets: [{
        data: cats.map(c => c.revenue),
        backgroundColor: cats.map((_, i) => SERIES[i % SERIES.length]),
        borderColor: C.card, borderWidth: 2, hoverOffset: 6,
      }],
    };
  }, [data, activeCurrency]);

  const dormantValue = dormant.reduce((sum, p) => sum + (p.stock_value || 0), 0);
  const dormantUnits = dormant.reduce((sum, p) => sum + (p.stock_qty || 0), 0);

  if (loading && !data) {
    return (
      <div style={{ background: C.paper, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={24} className="animate-spin" style={{ color: C.accent }}/>
      </div>
    );
  }

  return (
    <div className="nk-panel" style={{ background: C.paper, minHeight: '100vh', padding: '28px 24px' }}>
      <style>{PANEL_CSS}</style>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* En-tête */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <span style={sectionLabel}>Catalogue</span>
            <h1 style={{ ...pageTitle, marginTop: 6 }}>Products sold</h1>
            <p style={{ ...sans, fontSize: 12.5, color: C.muted, marginTop: 6 }}>
              {rows.length} products · {fmtQty(totals.qty)} units ·{' '}
              <span style={mono}>{fmtNum(totals.revenue)} {activeCurrency}</span>
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <Segmented options={PRESETS} value={preset} onChange={setPreset}/>
            <select value={source} onChange={e => setSource(e.target.value)}
              style={{ ...sans, fontSize: 12.5, color: C.ink, cursor: 'pointer' }}>
              <option value="all">Shop and auctions</option>
              <option value="shop">Shop only</option>
              <option value="auction">Auctions only</option>
            </select>
          </div>
        </div>

        {currencies.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ ...sans, fontSize: 12, color: C.muted }}>Currency —</span>
            {currencies.map(c => (
              <button key={c} onClick={() => setCurrency(c)} className="nk-btn"
                style={{
                  ...mono, fontSize: 11.5, fontWeight: 700, padding: '4px 12px', borderRadius: 999,
                  cursor: 'pointer',
                  background: activeCurrency === c ? C.ink : C.card,
                  color: activeCurrency === c ? C.paper : C.inkSoft,
                  border: `1px solid ${activeCurrency === c ? C.ink : C.line}`,
                }}>
                {c}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div style={{ ...sans, background: C.brickSoft, border: `1px solid ${C.brick}33`,
            borderLeft: `3px solid ${C.brick}`, borderRadius: 10, padding: '13px 16px',
            fontSize: 13, color: C.brick, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={15}/> {error}
          </div>
        )}

        {/* Bascule des deux vues */}
        <div style={{ display: 'flex', gap: 3, background: C.paperAlt, borderRadius: 12, padding: 4, width: 'fit-content' }}>
          {[
            { id: 'sold',    label: 'Sold',       icon: <Coffee size={14}/>, count: rows.length },
            { id: 'dormant', label: 'Never sold', icon: <Moon size={14}/>,   count: dormant.length },
          ].map(t => {
            const active = view === t.id;
            return (
              <button key={t.id} onClick={() => setView(t.id)} className="nk-btn"
                style={{
                  ...sans, fontSize: 12.5, fontWeight: 600, padding: '8px 15px', borderRadius: 9,
                  border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: active ? C.ink : 'transparent',
                  color: active ? C.paper : C.muted,
                }}>
                {t.icon} {t.label}
                <span style={{
                  ...mono, fontSize: 10.5, padding: '1px 6px', borderRadius: 999,
                  background: active ? ON_INK : C.card,
                  color: active ? C.paper : C.inkSoft,
                  border: active ? 'none' : `1px solid ${C.line}`,
                }}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {view === 'sold' ? (
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', alignItems: 'start' }}>

            {/* Classement */}
            <div style={{ ...card({ overflow: 'hidden' }), gridColumn: 'span 1' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
                padding: 14, borderBottom: `1px solid ${C.line}` }}>
                <div style={{ position: 'relative', flex: '1 1 180px' }}>
                  <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: C.faint }}>
                    <Search size={14}/>
                  </span>
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Find a product…" style={{ width: '100%', paddingLeft: 33, paddingRight: 33 }}/>
                  {search && (
                    <button onClick={() => setSearch('')}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: C.faint, padding: 0 }}>
                      <X size={14}/>
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <ArrowUpDown size={14} style={{ color: C.faint }}/>
                  <select value={sort} onChange={e => setSort(e.target.value)} style={{ cursor: 'pointer' }}>
                    {SORTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              {rows.length === 0 ? (
                <div style={{ padding: '56px 24px', textAlign: 'center' }}>
                  <Package size={34} style={{ color: C.line, margin: '0 auto 12px' }}/>
                  <p style={{ ...serif, fontSize: 20, color: C.inkSoft }}>Nothing sold in this period</p>
                </div>
              ) : rows.map((p, i) => {
                const color = SERIES[i % SERIES.length];
                return (
                  <div key={`${p.product_id}-${p.currency}`} className="nk-row"
                    style={{ padding: '14px 18px', borderTop: i > 0 ? `1px solid ${C.lineSoft}` : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                      <div style={{ display: 'flex', gap: 12, minWidth: 0, flex: 1 }}>
                        <span style={{
                          ...mono, fontSize: 11, color: i < 3 ? C.card : C.muted,
                          background: i < 3 ? color : C.paperAlt,
                          width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 2,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {i + 1}
                        </span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ ...sans, fontSize: 13.5, fontWeight: 600, color: C.ink,
                            display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.name}
                            </span>
                            {p.from_auction && <Gavel size={12} style={{ color: C.amber, flexShrink: 0 }} title="Sold at auction"/>}
                            {!p.is_active && <span style={{ ...sans, fontSize: 11, color: C.faint, fontWeight: 400 }}>removed</span>}
                          </p>
                          <p style={{ ...sans, fontSize: 11.5, color: C.faint, marginTop: 4,
                            display: 'flex', flexWrap: 'wrap', gap: '2px 12px' }}>
                            {p.category && <span>{p.category}</span>}
                            <span>{p.order_count} orders</span>
                            <span>avg <span style={mono}>{fmtNum(p.avg_unit_price)}</span>/{p.unit}</span>
                            <span>last {fmtDate(p.last_sold)}</span>
                            <span style={{ color: p.stock_qty <= 0 ? C.brick : C.faint,
                              display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              {p.stock_qty <= 0 && <PackageX size={11}/>}
                              {p.stock_qty <= 0 ? 'out of stock' : `${fmtQty(p.stock_qty)} ${p.unit} left`}
                            </span>
                          </p>
                          <ShareBar value={p.revenue} max={maxRevenue} color={color}/>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ ...mono, fontSize: 13.5, color: C.ink }}>{fmtNum(p.revenue)}</p>
                        <p style={{ ...sans, fontSize: 11.5, color: C.faint, marginTop: 3 }}>
                          {fmtQty(p.qty_sold)} {p.unit}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Colonne latérale */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Panel title="Revenue by category">
                {categoryChart ? (
                  <div style={{ height: 250 }}>
                    <Doughnut data={categoryChart} options={{
                      responsive: true, maintainAspectRatio: false, cutout: '64%',
                      plugins: { legend: legendBottom, tooltip: chartTooltip },
                    }}/>
                  </div>
                ) : (
                  <p style={{ ...sans, fontSize: 13, color: C.faint, textAlign: 'center', padding: '36px 0' }}>
                    No category data yet.
                  </p>
                )}
              </Panel>

              <Panel title="Period totals">
                {[
                  ['Revenue', `${fmtNum(totals.revenue)} ${activeCurrency}`],
                  ['Units sold', fmtQty(totals.qty)],
                  ['Order lines', totals.orders],
                  ['Products sold', rows.length],
                ].map(([label, value], i) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'baseline', padding: '9px 0',
                    borderTop: i === 0 ? 'none' : `1px solid ${C.lineSoft}` }}>
                    <span style={{ ...sans, fontSize: 12.5, color: C.muted }}>{label}</span>
                    <span style={{ ...mono, fontSize: 13, color: C.ink }}>{value}</span>
                  </div>
                ))}
              </Panel>
            </div>
          </div>
        ) : (
          // ── Catalogue dormant ──────────────────────────────────────────────
          <div style={card({ overflow: 'hidden' })}>
            <div style={{ padding: '20px 20px 18px', borderBottom: `1px solid ${C.line}` }}>
              <h2 style={cardTitle}>Active products that have never sold</h2>
              <p style={{ ...sans, fontSize: 12, color: C.muted, marginTop: 6 }}>
                {dormant.length} products holding <span style={mono}>{fmtQty(dormantUnits)}</span> units.
                {dormantValue > 0 && (
                  <> Roughly <span style={mono}>{fmtNum(dormantValue)}</span> tied up at list price.</>
                )}
              </p>
            </div>

            {dormant.length === 0 ? (
              <div style={{ padding: '56px 24px', textAlign: 'center' }}>
                <Coffee size={34} style={{ color: C.moss, opacity: 0.35, margin: '0 auto 12px' }}/>
                <p style={{ ...serif, fontSize: 20, color: C.inkSoft }}>
                  Every active product has sold at least once
                </p>
              </div>
            ) : dormant.map((p, i) => (
              <div key={p.product_id} className="nk-row"
                style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                  gap: 16, padding: '14px 20px', borderTop: i > 0 ? `1px solid ${C.lineSoft}` : 'none' }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ ...sans, fontSize: 13.5, fontWeight: 600, color: C.ink,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </p>
                  <p style={{ ...sans, fontSize: 11.5, color: C.faint, marginTop: 4,
                    display: 'flex', flexWrap: 'wrap', gap: '2px 12px' }}>
                    {p.category && <span>{p.category}</span>}
                    <span>listed {fmtDate(p.created)}</span>
                    <span>{fmtQty(p.stock_qty)} {p.unit} in stock</span>
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ ...mono, fontSize: 13, color: C.inkSoft }}>
                    {fmtNum(p.price)}<span style={{ fontSize: 10.5, color: C.faint }}>/{p.unit}</span>
                  </p>
                  <p style={{ ...sans, fontSize: 11.5, color: C.muted, marginTop: 3 }}>
                    {fmtNum(p.stock_value)} on the shelf
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SoldProductsDashboard;