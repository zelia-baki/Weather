import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';
import AuctionAccessPanel from './AuctionAccessPanel';

// =============================================================================
//  src/components/Auction/AuctionPage.jsx — nouveau fichier
//
//  Route : /auction/:slug
//
//  Le compte à rebours se cale sur l'horloge du SERVEUR, pas sur celle du
//  navigateur. Une machine mal réglée afficherait sinon « clos » sur un lot
//  encore ouvert — ou l'inverse, ce qui est pire.
//
//  Rafraîchissement toutes les 5 s sur un endpoint léger. Un websocket
//  n'apporterait rien tant qu'une vente ne dépasse pas quelques dizaines de
//  participants simultanés.
// =============================================================================

const BG = '#f7f4ee';
const INK = '#14231a';
const GREEN = '#16803c';
const CLAY = '#a9784f';
const SAND = '#eee9de';
const BORDER = 'rgba(20,35,26,0.12)';

const mono = { fontFamily: "'JetBrains Mono', monospace" };
const sans = { fontFamily: "'Epilogue', sans-serif" };
const serif = { fontFamily: "'Cormorant Garamond', serif" };

const POLL_MS = 5000;

const fmt = (n, d = 2) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: 3 });

// ── Compte à rebours ─────────────────────────────────────────────────────────
const Countdown = ({ endsAt, offsetMs }) => {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (!endsAt) return null;
  const remaining = new Date(endsAt).getTime() - (Date.now() + offsetMs);
  if (remaining <= 0) return <span style={{ ...mono, fontSize: 12, color: 'rgba(20,35,26,0.4)' }}>Closed</span>;

  const s = Math.floor(remaining / 1000);
  const parts = [Math.floor(s / 86400), Math.floor((s % 86400) / 3600),
                 Math.floor((s % 3600) / 60), s % 60];
  const urgent = remaining < 5 * 60 * 1000;
  const text = parts[0] > 0
    ? `${parts[0]}d ${parts[1]}h`
    : `${String(parts[1]).padStart(2, '0')}:${String(parts[2]).padStart(2, '0')}:${String(parts[3]).padStart(2, '0')}`;

  return (
    <span style={{ ...mono, fontSize: 12.5, color: urgent ? '#c2410c' : 'rgba(20,35,26,0.55)',
      fontWeight: urgent ? 700 : 400 }}>
      {text}
    </span>
  );
};

// ── Cartouches de statistiques ───────────────────────────────────────────────
const StatCard = ({ value, label }) => (
  <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12,
    padding: '26px 20px', textAlign: 'center' }}>
    <div style={{ ...serif, fontSize: 34, color: INK, lineHeight: 1 }}>{value}</div>
    <div style={{ ...sans, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase',
      color: 'rgba(20,35,26,0.45)', marginTop: 10 }}>
      {label}
    </div>
  </div>
);

// ── Formulaire d'enchère ─────────────────────────────────────────────────────
const BidForm = ({ lot, mode, onDone, onCancel }) => {
  const [amount, setAmount] = useState(lot.next_min_bid);
  const [busy, setBusy] = useState(false);
  const isAuto = mode === 'auto';

  const submit = async () => {
    setBusy(true);
    try {
      const url = isAuto
        ? `/api/auction/lots/${lot.id}/autobid`
        : `/api/auction/lots/${lot.id}/bid`;
      const body = isAuto
        ? { max_amount_per_kg: Number(amount) }
        : { amount_per_kg: Number(amount) };
      const res = await axiosInstance.post(url, body);

      const leading = res.data?.is_leading;
      Swal.fire({
        icon: leading ? 'success' : 'info',
        title: leading ? 'You are the highest bidder' : 'Bid placed',
        text: leading
          ? undefined
          : 'A higher automatic bid is already in place on this lot.',
        timer: leading ? 1800 : undefined,
        showConfirmButton: !leading,
      });
      onDone(res.data.lot);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Bid rejected',
        text: err.response?.data?.msg || "Your bid could not be placed.",
      });
    } finally {
      setBusy(false);
    }
  };

  const total = Number(amount || 0) * lot.weight_kg;

  return (
    <div style={{ background: SAND, borderRadius: 12, padding: '20px 22px', marginTop: 12 }}>
      <div style={{ ...sans, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase',
        color: GREEN, marginBottom: 10 }}>
        {isAuto ? 'Automatic bidding' : 'Place a bid'}
      </div>

      <p style={{ ...sans, fontSize: 13, color: 'rgba(20,35,26,0.6)', marginBottom: 14 }}>
        {isAuto
          ? "Set the most you are willing to pay per kilo. We only commit the minimum needed to keep you in the lead."
          : `Minimum ${fmt(lot.next_min_bid)} ${lot.currency}/kg.`}
      </p>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="number" value={amount} step={lot.min_increment} min={lot.next_min_bid}
          onChange={e => setAmount(e.target.value)}
          aria-label={isAuto ? 'Maximum price per kilo' : 'Price per kilo'}
          style={{ ...mono, width: 130, padding: '11px 14px', borderRadius: 10,
            border: `1px solid ${BORDER}`, background: '#fff', color: INK, fontSize: 15 }}
        />
        <span style={{ ...sans, fontSize: 13, color: 'rgba(20,35,26,0.5)' }}>
          {lot.currency}/kg
        </span>
        <span style={{ ...mono, fontSize: 13, color: CLAY, marginLeft: 'auto' }}>
          = {fmt(total)} {lot.currency}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button onClick={submit} disabled={busy || Number(amount) < lot.next_min_bid}
          style={{ ...sans, flex: 1, padding: '12px', borderRadius: 100, border: 'none',
            background: busy ? 'rgba(22,128,60,0.5)' : GREEN, color: BG,
            fontWeight: 700, fontSize: 13.5, cursor: busy ? 'wait' : 'pointer' }}>
          {busy ? 'Sending…' : isAuto ? 'Set my maximum' : 'Place bid'}
        </button>
        <button onClick={onCancel}
          style={{ ...sans, padding: '12px 20px', borderRadius: 100,
            border: `1px solid ${BORDER}`, background: 'transparent',
            color: 'rgba(20,35,26,0.6)', fontSize: 13.5, cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  );
};

// ── Ligne de lot ─────────────────────────────────────────────────────────────
const LotRow = ({ lot, offsetMs, onUpdate, canBid }) => {
  const [mode, setMode] = useState(null);   // null | 'manual' | 'auto'
  // Un lot ouvert mais sur lequel on n'a pas le droit d'enchérir reste
  // consultable : le bouton est désactivé, pas masqué.
  const enabled = lot.is_open && canBid;
  const price = lot.current_price_per_kg ?? lot.starting_price_per_kg;

  return (
    <div style={{ padding: '18px 22px', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ display: 'grid', gap: 16, alignItems: 'center',
        gridTemplateColumns: 'minmax(180px, 2.2fr) repeat(4, minmax(80px, 1fr)) auto' }}>

        <div>
          <Link to={`/auction/lot/${lot.id}`}
            style={{ ...serif, fontSize: 19, color: INK, textDecoration: 'none' }}>
            {lot.lot_number}. {lot.name}
          </Link>
          <div style={{ ...sans, fontSize: 11, color: 'rgba(20,35,26,0.45)', marginTop: 3 }}>
            {[lot.origin_country, lot.process_method, lot.varietal].filter(Boolean).join(' · ')}
          </div>
        </div>

        <div style={{ ...mono, fontSize: 13, color: 'rgba(20,35,26,0.65)' }}>
          {fmt(lot.weight_kg, 2)} kg
        </div>

        <div style={{ ...mono, fontSize: 14, color: INK }}>
          {fmt(price)} <span style={{ fontSize: 11, color: 'rgba(20,35,26,0.45)' }}>/kg</span>
        </div>

        <div style={{ ...mono, fontSize: 13, color: lot.bid_count ? GREEN : 'rgba(20,35,26,0.35)' }}>
          {lot.bid_count} {lot.bid_count === 1 ? 'bid' : 'bids'}
        </div>

        <div>
          <div style={{ ...mono, fontSize: 14, color: CLAY }}>{fmt(lot.current_total)}</div>
          <Countdown endsAt={lot.ends_at} offsetMs={offsetMs} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setMode(mode === 'manual' ? null : 'manual')}
            disabled={!enabled}
            style={{ ...sans, fontSize: 12.5, fontWeight: 700, padding: '9px 18px',
              borderRadius: 100, border: 'none', color: enabled ? BG : 'rgba(20,35,26,0.35)',
              background: enabled ? GREEN : 'rgba(20,35,26,0.08)',
              cursor: enabled ? 'pointer' : 'not-allowed' }}>
            Bid
          </button>
          <button onClick={() => setMode(mode === 'auto' ? null : 'auto')}
            disabled={!enabled}
            style={{ ...sans, fontSize: 12.5, padding: '9px 16px', borderRadius: 100,
              border: `1px solid ${enabled ? BORDER : 'transparent'}`,
              background: 'transparent',
              color: enabled ? 'rgba(20,35,26,0.65)' : 'rgba(20,35,26,0.3)',
              cursor: enabled ? 'pointer' : 'not-allowed' }}>
            Auto
          </button>
        </div>
      </div>

      {mode && (
        <BidForm lot={lot} mode={mode}
          onDone={(updated) => { setMode(null); onUpdate(updated); }}
          onCancel={() => setMode(null)} />
      )}
    </div>
  );
};

// ── Page ─────────────────────────────────────────────────────────────────────
const AuctionPage = () => {
  const { slug } = useParams();
  const [auction, setAuction] = useState(null);
  const [lots, setLots] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registration, setRegistration] = useState(null);
  const offsetRef = useRef(0);   // horloge serveur − horloge navigateur

  const syncOffset = (serverTime) => {
    if (serverTime) offsetRef.current = new Date(serverTime + 'Z').getTime() - Date.now();
  };

  const refresh = useCallback(async (auctionId) => {
    try {
      const { data } = await axiosInstance.get(`/api/auction/auctions/${auctionId}/lots`);
      setLots(data.lots);
      setStats(data.stats);
      syncOffset(data.server_time);
    } catch {
      /* réseau instable : on garde l'affichage précédent, le prochain tour réessaiera */
    }
  }, []);

  useEffect(() => {
    let timer;
    axiosInstance.get(`/api/auction/auctions/${slug}`)
      .then(({ data }) => {
        setAuction(data);
        setLots(data.lots || []);
        setStats(data.stats);
        timer = setInterval(() => refresh(data.id), POLL_MS);

        // L'inscription n'existe que pour un utilisateur connecté ; un 401 ici
        // est normal et ne doit pas casser l'affichage de la vente.
        if (data.access_mode !== 'open') {
          axiosInstance.get(`/api/auction/auctions/${data.id}/registration`)
            .then(r => setRegistration(r.data.registration || null))
            .catch(() => setRegistration(null));
        }
      })
      .catch(() => setAuction(null))
      .finally(() => setLoading(false));
    return () => clearInterval(timer);
  }, [slug, refresh]);

  const applyLotUpdate = (updated) => {
    setLots(ls => ls.map(l => (l.id === updated.id ? { ...l, ...updated } : l)));
    // Une enchère consomme du plafond : on relit l'inscription pour que la
    // jauge reflète immédiatement l'exposition engagée.
    if (auction && auction.access_mode !== 'open') {
      axiosInstance.get(`/api/auction/auctions/${auction.id}/registration`)
        .then(r => setRegistration(r.data.registration || null))
        .catch(() => {});
    }
  };

  const canBid = auction
    ? (auction.access_mode === 'open' || Boolean(registration?.can_bid))
    : false;

  if (loading) return <div style={{ background: BG, minHeight: '100vh' }} aria-busy="true" />;

  if (!auction) {
    return (
      <div style={{ background: BG, minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ ...serif, fontSize: 24, color: INK }}>This auction is not open to the public.</p>
      </div>
    );
  }

  return (
    <div style={{ background: BG, minHeight: '100vh' }}>

      {/* ── Bandeau ──────────────────────────────────────────────────── */}
      <header style={{
        position: 'relative', padding: '96px 24px 80px', textAlign: 'center',
        background: auction.cover_image
          ? `linear-gradient(rgba(20,35,26,0.72), rgba(20,35,26,0.82)), url(${auction.cover_image}) center/cover`
          : INK,
      }}>
        <div style={{ ...sans, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
          color: 'rgba(247,244,238,0.6)', marginBottom: 18 }}>
          {auction.is_live ? 'Bidding is open' : auction.status === 'closed' ? 'Auction closed' : 'Coming soon'}
        </div>
        <h1 style={{ ...serif, fontSize: 'clamp(38px, 6vw, 64px)', color: '#f7f4ee',
          fontWeight: 500, lineHeight: 1.1, margin: 0 }}>
          {auction.name}
        </h1>
        {auction.subtitle && (
          <p style={{ ...sans, fontSize: 15, color: 'rgba(247,244,238,0.7)',
            maxWidth: 560, margin: '18px auto 0', lineHeight: 1.7 }}>
            {auction.subtitle}
          </p>
        )}
      </header>

      {/* ── Statistiques ─────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1160, margin: '-40px auto 0', padding: '0 24px',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
        <StatCard value={stats?.total_bids ?? 0} label="Bids placed" />
        <StatCard value={fmt(stats?.total_value)} label={`Total value (${auction.currency})`} />
        <StatCard value={fmt(stats?.weighted_average_per_kg)} label={`Weighted average (${auction.currency}/kg)`} />
        <StatCard value={fmt(stats?.highest_lot_price_per_kg)} label={`Highest lot (${auction.currency}/kg)`} />
      </div>

      {/* ── Accès : inscription et caution ───────────────────────────── */}
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px' }}>
        <AuctionAccessPanel auction={auction} registration={registration}
          onChange={setRegistration} />
      </div>

      {/* ── Lots ─────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1160, margin: '0 auto', padding: '56px 24px 96px' }}>
        <h2 style={{ ...serif, fontSize: 28, color: INK, fontWeight: 500,
          textAlign: 'center', marginBottom: 28 }}>
          The lots
        </h2>

        <div style={{ background: '#fff', border: `1px solid ${BORDER}`,
          borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ ...sans, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase',
            color: 'rgba(20,35,26,0.42)', padding: '16px 22px' }}>
            {lots.length} {lots.length === 1 ? 'lot' : 'lots'} · prices update live
          </div>

          {lots.length === 0 && (
            <div style={{ ...sans, padding: '40px 22px', textAlign: 'center',
              color: 'rgba(20,35,26,0.45)', borderTop: `1px solid ${BORDER}` }}>
              Lots for this auction will be published shortly.
            </div>
          )}

          {lots.map(lot => (
            <LotRow key={lot.id} lot={lot} offsetMs={offsetRef.current}
              onUpdate={applyLotUpdate} canBid={canBid} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default AuctionPage;