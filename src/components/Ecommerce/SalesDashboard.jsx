import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axiosInstance from '../../axiosInstance';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Filler, Title, Tooltip, Legend,
} from 'chart.js';
import {
  TrendingUp, TrendingDown, Loader2, AlertTriangle, ShoppingBag, Truck,
  Wallet, Package, RefreshCw,
} from 'lucide-react';
import {
  C, SERIES, alpha, sans, mono, serif, card, sectionLabel, pageTitle, cardTitle,
  bigNumber, statusMeta, chartAxes, chartTooltip, legendBottom, chartFont,
  SHADOW, PANEL_CSS,
} from './theme';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Filler, Title, Tooltip, Legend,
);

// =============================================================================
//  src/components/Ecommerce/SalesDashboard.jsx
//
//  Deux décisions structurent l'écran :
//
//  1. LE SÉLECTEUR DE DEVISE. Une commande USD et une commande UGX ne
//     s'additionnent pas. Plutôt qu'un total faux ou une conversion à un taux
//     inventé, on affiche une devise à la fois. Le sélecteur n'apparaît que
//     s'il y a réellement plusieurs devises.
//
//  2. LES GRANDS CHIFFRES EN CORMORANT GARAMOND, la devise en monospace à
//     côté. C'est là que passe l'élégance de l'écran ; tout le reste est tenu
//     discret pour que ces chiffres portent seuls.
// =============================================================================

const isoDaysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

const PRESETS = [
  { id: '7',   label: '7 days',    days: 7,   granularity: 'day' },
  { id: '30',  label: '30 days',   days: 30,  granularity: 'day' },
  { id: '90',  label: '90 days',   days: 90,  granularity: 'week' },
  { id: '365', label: '12 months', days: 365, granularity: 'month' },
];

const fmtNum = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
const fmtQty = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

// ── Contrôles ────────────────────────────────────────────────────────────────
const Segmented = ({ options, value, onChange }) => (
  <div style={{ display: 'flex', gap: 2, background: C.paperAlt, borderRadius: 10, padding: 3 }}>
    {options.map(o => (
      <button key={o.id} onClick={() => onChange(o.id)} className="nk-btn"
        style={{
          ...sans, fontSize: 12.5, fontWeight: 600, padding: '6px 12px',
          borderRadius: 8, border: 'none', cursor: 'pointer',
          background: value === o.id ? C.card : 'transparent',
          color: value === o.id ? C.ink : C.muted,
          boxShadow: value === o.id ? SHADOW : 'none',
        }}>
        {o.label}
      </button>
    ))}
  </div>
);

// ── Carte de chiffre clé ─────────────────────────────────────────────────────
// Le filet coloré à gauche encode la nature de la mesure : vert pour l'argent,
// sarcelle pour le volume de commandes, bronze pour les quantités. Il porte de
// l'information, il ne décore pas.
const StatCard = ({ icon, label, value, unit, sub, change, accent = C.accent }) => (
  <div style={card({ padding: '18px 20px', borderLeft: `3px solid ${accent}`, borderRadius: '4px 14px 14px 4px' })}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <span style={{ ...sectionLabel, color: C.muted, letterSpacing: 1.2 }}>{label}</span>
      <span style={{ color: accent, opacity: 0.75, display: 'flex' }}>{icon}</span>
    </div>

    <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
      <span style={bigNumber}>{value}</span>
      {unit && <span style={{ ...mono, fontSize: 12, color: C.amber, letterSpacing: 0.3 }}>{unit}</span>}
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
      {change !== null && change !== undefined && (
        <span style={{
          ...sans, fontSize: 11.5, fontWeight: 700, display: 'inline-flex',
          alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 999,
          color: change >= 0 ? C.moss : C.brick,
          background: change >= 0 ? C.mossSoft : C.brickSoft,
        }}>
          {change >= 0 ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
          {Math.abs(change)}%
        </span>
      )}
      {sub && <span style={{ ...sans, fontSize: 11.5, color: C.faint }}>{sub}</span>}
    </div>
  </div>
);

const Panel = ({ title, aside, children, style }) => (
  <div style={card({ padding: 20, ...style })}>
    {(title || aside) && (
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <h2 style={cardTitle}>{title}</h2>
        {aside && <span style={{ ...sans, fontSize: 11.5, color: C.faint }}>{aside}</span>}
      </div>
    )}
    {children}
  </div>
);

// =============================================================================
const SalesDashboard = () => {
  const [preset,   setPreset]   = useState('30');
  const [source,   setSource]   = useState('all');
  const [currency, setCurrency] = useState(null);

  const [summary,   setSummary]   = useState(null);
  const [series,    setSeries]    = useState(null);
  const [sold,      setSold]      = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  const activePreset = PRESETS.find(p => p.id === preset) || PRESETS[1];

  const params = useMemo(() => ({
    from: isoDaysAgo(activePreset.days - 1),
    to: new Date().toISOString().slice(0, 10),
    source,
  }), [activePreset.days, source]);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [s, t, p, c] = await Promise.all([
        axiosInstance.get('/api/ecommerce/stats/summary', { params }),
        axiosInstance.get('/api/ecommerce/stats/timeseries', {
          params: { ...params, granularity: activePreset.granularity } }),
        axiosInstance.get('/api/ecommerce/stats/products-sold', { params: { ...params, limit: 8 } }),
        axiosInstance.get('/api/ecommerce/stats/top-customers', { params }),
      ]);
      setSummary(s.data); setSeries(t.data); setSold(p.data); setCustomers(c.data ?? []);
    } catch (err) {
      setError(err.response?.data?.msg || 'The sales data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [params, activePreset.granularity]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // La devise par défaut est la plus lourde : le backend renvoie by_currency
  // déjà trié par chiffre d'affaires décroissant.
  const currencies = summary?.by_currency?.map(c => c.currency) ?? [];
  const activeCurrency = (currency && currencies.includes(currency)) ? currency : currencies[0];
  const stats = summary?.by_currency?.find(c => c.currency === activeCurrency);

  const lineData = useMemo(() => {
    if (!series || !activeCurrency) return null;
    const s = series.series.find(x => x.currency === activeCurrency);
    if (!s) return null;
    return {
      labels: series.labels,
      datasets: [{
        label: 'Revenue',
        data: s.revenue,
        borderColor: C.accent,
        // Dégradé construit à la volée : il faut l'aire du graphique, qui
        // n'existe pas au premier rendu — d'où la fonction et le garde-fou.
        backgroundColor: (ctx) => {
          const { ctx: g, chartArea } = ctx.chart;
          if (!chartArea) return alpha(C.accent, 0.08);
          const grad = g.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          grad.addColorStop(0, alpha(C.accent, 0.16));
          grad.addColorStop(1, alpha(C.accent, 0.005));
          return grad;
        },
        borderWidth: 2,
        pointRadius: series.labels.length > 45 ? 0 : 2.5,
        pointBackgroundColor: C.card,
        pointBorderColor: C.accent,
        pointBorderWidth: 1.5,
        pointHoverRadius: 5,
        tension: 0.35,
        fill: true,
      }],
    };
  }, [series, activeCurrency]);

  const ordersData = useMemo(() => {
    if (!series || !activeCurrency) return null;
    const s = series.series.find(x => x.currency === activeCurrency);
    if (!s) return null;
    return {
      labels: series.labels,
      datasets: [{
        label: 'Orders', data: s.orders,
        backgroundColor: C.teal, hoverBackgroundColor: C.ink,
        borderRadius: 3, maxBarThickness: 22,
      }],
    };
  }, [series, activeCurrency]);

  const statusData = useMemo(() => {
    if (!summary?.by_status?.length) return null;
    return {
      labels: summary.by_status.map(s => statusMeta(s.status).label),
      datasets: [{
        data: summary.by_status.map(s => s.count),
        backgroundColor: summary.by_status.map(s => statusMeta(s.status).fg),
        borderColor: C.card, borderWidth: 2, hoverOffset: 6,
      }],
    };
  }, [summary]);

  const topProducts = useMemo(
    () => (sold?.products ?? []).filter(p => p.currency === activeCurrency).slice(0, 8),
    [sold, activeCurrency],
  );

  const topProductsData = useMemo(() => {
    if (!topProducts.length) return null;
    return {
      labels: topProducts.map(p => p.name.length > 26 ? `${p.name.slice(0, 24)}…` : p.name),
      datasets: [{
        label: 'Revenue',
        data: topProducts.map(p => p.revenue),
        backgroundColor: topProducts.map((_, i) => SERIES[i % SERIES.length]),
        borderRadius: 3,
      }],
    };
  }, [topProducts]);

  const baseOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { ...chartTooltip, mode: 'index', intersect: false } },
    scales: chartAxes(),
  };

  const activeCustomers = customers.filter(c => c.currency === activeCurrency);

  if (loading && !summary) {
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
            <span style={sectionLabel}>Nkusu shop</span>
            <h1 style={{ ...pageTitle, marginTop: 6 }}>Sales</h1>
            <p style={{ ...sans, fontSize: 12.5, color: C.muted, marginTop: 6 }}>
              {summary?.range && `${summary.range.from} → ${summary.range.to}`}
              {summary?.payment_rate != null && ` · ${summary.payment_rate}% of carts were paid`}
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
            <button onClick={fetchAll} title="Refresh" className="nk-btn"
              style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10,
                       padding: 9, cursor: 'pointer', color: C.muted, display: 'flex' }}>
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''}/>
            </button>
          </div>
        </div>

        {/* Devises */}
        {currencies.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ ...sans, fontSize: 12, color: C.muted }}>
              Several currencies here. Totals are never mixed —
            </span>
            {currencies.map(c => (
              <button key={c} onClick={() => setCurrency(c)} className="nk-btn"
                style={{
                  ...mono, fontSize: 11.5, fontWeight: 700, padding: '4px 12px',
                  borderRadius: 999, cursor: 'pointer',
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

        {/* File d'attente */}
        {summary?.action_required && (summary.action_required.to_ship > 0 || summary.action_required.unpaid > 0) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {summary.action_required.to_ship > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.accentSoft,
                border: `1px solid ${C.accent}25`, borderRadius: 10, padding: '10px 16px' }}>
                <Truck size={15} style={{ color: C.accent }}/>
                <span style={{ ...sans, fontSize: 13, color: C.ink }}>
                  <strong style={mono}>{summary.action_required.to_ship}</strong> paid orders are waiting to be shipped
                </span>
              </div>
            )}
            {summary.action_required.unpaid > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.stoneSoft,
                border: `1px solid ${C.line}`, borderRadius: 10, padding: '10px 16px' }}>
                <Wallet size={15} style={{ color: C.stone }}/>
                <span style={{ ...sans, fontSize: 13, color: C.inkSoft }}>
                  <strong style={mono}>{summary.action_required.unpaid}</strong> carts never completed payment
                </span>
              </div>
            )}
          </div>
        )}

        {!stats ? (
          <div style={card({ padding: '72px 24px', textAlign: 'center' })}>
            <ShoppingBag size={36} style={{ color: C.line, margin: '0 auto 14px' }}/>
            <p style={{ ...serif, fontSize: 24, color: C.inkSoft }}>No paid orders in this period</p>
            <p style={{ ...sans, fontSize: 13, color: C.faint, marginTop: 6 }}>
              Try a longer range, or look at the carts that never completed payment.
            </p>
          </div>
        ) : (
          <>
            {/* Chiffres clés */}
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
              <StatCard icon={<Wallet size={16}/>} accent={C.moss} label="Revenue"
                value={fmtNum(stats.revenue)} unit={stats.currency}
                change={stats.revenue_change_pct}
                sub={`from ${fmtNum(stats.previous_revenue)} before`}/>
              <StatCard icon={<ShoppingBag size={16}/>} accent={C.accent} label="Paid orders"
                value={fmtNum(stats.orders)} change={stats.orders_change_pct}
                sub={`${summary.total_orders} carts created`}/>
              <StatCard icon={<TrendingUp size={16}/>} accent={C.wine} label="Average order"
                value={fmtNum(stats.average_order_value)} unit={stats.currency}/>
              <StatCard icon={<Package size={16}/>} accent={C.amber} label="Units sold"
                value={fmtQty(stats.units_sold)}
                sub={`${stats.distinct_products} different products`}/>
            </div>

            {/* Courbe */}
            <Panel title="Revenue over time" aside={`${activeCurrency} · per ${series?.granularity}`}>
              <div style={{ height: 280 }}>
                {lineData && <Line data={lineData} options={baseOptions}/>}
              </div>
            </Panel>

            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
              <Panel title="Orders">
                <div style={{ height: 230 }}>
                  {ordersData && <Bar data={ordersData} options={baseOptions}/>}
                </div>
              </Panel>

              <Panel title="Where carts end up">
                <div style={{ height: 230 }}>
                  {statusData && (
                    <Doughnut data={statusData} options={{
                      responsive: true, maintainAspectRatio: false, cutout: '66%',
                      plugins: { legend: legendBottom, tooltip: chartTooltip },
                    }}/>
                  )}
                </div>
              </Panel>
            </div>

            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
              <Panel title="Best sellers" aside={`by revenue in ${activeCurrency}`}>
                <div style={{ height: Math.max(220, topProducts.length * 34) }}>
                  {topProductsData && (
                    <Bar data={topProductsData} options={{
                      ...baseOptions, indexAxis: 'y',
                      scales: chartAxes({
                        x: { grid: { color: C.lineSoft }, ticks: { maxTicksLimit: 6 } },
                        y: { grid: { display: false }, ticks: { font: chartFont, color: C.inkSoft } },
                      }),
                    }}/>
                  )}
                </div>
              </Panel>

              <Panel title="Who is buying"
                aside={activeCustomers.length ? `top ${Math.min(activeCustomers.length, 7)}` : null}>
                {activeCustomers.length === 0 ? (
                  <p style={{ ...sans, fontSize: 13, color: C.faint, textAlign: 'center', padding: '40px 0' }}>
                    No named customers in this period yet.
                  </p>
                ) : (
                  <div>
                    {activeCustomers.slice(0, 7).map((c, i) => (
                      <div key={c.identity} className="nk-row"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          gap: 12, padding: '11px 4px',
                          borderTop: i === 0 ? 'none' : `1px solid ${C.lineSoft}` }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ ...sans, fontSize: 13.5, fontWeight: 600, color: C.ink,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.name || c.identity}
                          </p>
                          <p style={{ ...sans, fontSize: 11.5, color: C.faint, marginTop: 2 }}>
                            {c.orders} orders · last{' '}
                            {new Date(c.last_order).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                          </p>
                        </div>
                        <span style={{ ...mono, fontSize: 13, color: C.ink, whiteSpace: 'nowrap' }}>
                          {fmtNum(c.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SalesDashboard;