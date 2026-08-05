import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';
import VerifiedStamp from '../Shop/VerifiedStamp';
import { SpecStrip, TastingNotes, StoryBlocks, ProofPanel } from '../Shop/ProductStory';

// =============================================================================
//  src/components/Auction/LotDetail.jsx — nouveau fichier
//
//  Route : /auction/lot/:id
//
//  La page réutilise ProductStory telle quelle : le storytelling est écrit une
//  seule fois sur le produit et sert à la boutique comme aux enchères.
//
//  Ce qui est propre à cette page : le bloc d'enchère, le compte à rebours
//  calé sur l'horloge SERVEUR, et l'historique anonymisé.
// =============================================================================

const BG = '#f7f4ee';
const INK = '#14231a';
const GREEN = '#16803c';
const CLAY = '#a9784f';
const SAND = '#eee9de';
const RUST = '#c2410c';
const BORDER = 'rgba(20,35,26,0.12)';

const mono = { fontFamily: "'JetBrains Mono', monospace" };
const sans = { fontFamily: "'Epilogue', sans-serif" };
const serif = { fontFamily: "'Cormorant Garamond', serif" };

const POLL_MS = 5000;

const fmt = (n, d = 2) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: 3 });

const eyebrow = {
  ...sans, fontSize: 11, letterSpacing: 2, color: GREEN,
  textTransform: 'uppercase', marginBottom: 10,
};

// ── Compte à rebours ─────────────────────────────────────────────────────────
const Countdown = ({ endsAt, offsetMs }) => {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (!endsAt) return null;
  const remaining = new Date(endsAt).getTime() - (Date.now() + offsetMs);

  if (remaining <= 0) {
    return <span style={{ ...mono, fontSize: 15, color: 'rgba(20,35,26,0.45)' }}>Closed</span>;
  }

  const s = Math.floor(remaining / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const urgent = remaining < 5 * 60 * 1000;

  return (
    <span style={{ ...mono, fontSize: 15, color: urgent ? RUST : INK, fontWeight: urgent ? 700 : 400 }}>
      {d > 0
        ? `${d}d ${h}h ${m}m`
        : `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`}
    </span>
  );
};

// ── Bloc d'enchère ───────────────────────────────────────────────────────────
const BidPanel = ({ lot, myStatus, onPlaced }) => {
  const [mode, setMode] = useState('manual');   // 'manual' | 'auto'
  const [amount, setAmount] = useState(lot.next_min_bid);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setAmount(lot.next_min_bid); }, [lot.next_min_bid]);

  const isAuto = mode === 'auto';
  const leading = myStatus?.is_leading;
  const canBid = myStatus?.can_bid ?? false;
  const total = Number(amount || 0) * lot.weight_kg;

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

      Swal.fire({
        icon: res.data?.is_leading ? 'success' : 'info',
        title: res.data?.is_leading ? 'You are the highest bidder' : 'Bid placed',
        text: res.data?.is_leading
          ? (res.data?.extended ? 'Bidding was extended — someone can still respond.' : undefined)
          : 'A higher automatic bid is already in place on this lot.',
        timer: res.data?.is_leading && !res.data?.extended ? 1800 : undefined,
        showConfirmButton: !res.data?.is_leading || res.data?.extended,
      });
      onPlaced();
    } catch (err) {
      const status = err.response?.status;
      Swal.fire({
        icon: status === 402 || status === 403 ? 'warning' : 'error',
        title: status === 402 || status === 403 ? 'Bidding not available' : 'Bid rejected',
        text: err.response?.data?.msg || 'Your bid could not be placed.',
      });
    } finally {
      setBusy(false);
    }
  };

  if (!lot.is_open) {
    return (
      <div style={{ background: SAND, borderRadius: 12, padding: '22px 24px', marginTop: 24 }}>
        <p style={{ ...serif, fontSize: 20, color: INK, margin: 0 }}>
          {lot.status === 'sold' || lot.status === 'awaiting_payment'
            ? 'This lot has been awarded.'
            : lot.status === 'unsold'
              ? 'This lot did not meet its reserve.'
              : 'Bidding has closed on this lot.'}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: '#fff', border: `1px solid ${leading ? GREEN + '55' : BORDER}`,
      borderLeft: `3px solid ${leading ? GREEN : CLAY}`,
      borderRadius: 12, padding: '22px 24px', marginTop: 24,
    }}>
      {leading && (
        <div style={{ ...sans, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase',
          color: GREEN, fontWeight: 700, marginBottom: 12 }}>
          You are currently the highest bidder
        </div>
      )}

      {!canBid && (
        <p style={{ ...sans, fontSize: 13.5, lineHeight: 1.7,
          color: 'rgba(20,35,26,0.6)', marginTop: 0, marginBottom: 16 }}>
          You need to be registered for this auction before bidding.{' '}
          <Link to={`/auction/${lot.auction_slug || ''}`}
            style={{ color: GREEN, fontWeight: 700 }}>
            Go to the auction page →
          </Link>
        </p>
      )}

      {/* Deux gestes distincts, pas deux réglages du même. Une enchère engage
          un montant exact ; une automatique engage un plafond. */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['manual', 'Place a bid'], ['auto', 'Automatic bidding']].map(([id, label]) => (
          <button key={id} onClick={() => setMode(id)}
            style={{
              ...sans, flex: 1, padding: '9px 12px', borderRadius: 100, fontSize: 12.5,
              fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${mode === id ? GREEN : BORDER}`,
              background: mode === id ? 'rgba(22,128,60,0.08)' : 'transparent',
              color: mode === id ? GREEN : 'rgba(20,35,26,0.55)',
            }}>
            {label}
          </button>
        ))}
      </div>

      <p style={{ ...sans, fontSize: 13, lineHeight: 1.7,
        color: 'rgba(20,35,26,0.6)', marginTop: 0, marginBottom: 16 }}>
        {isAuto
          ? 'Set the most you are willing to pay per kilo. We only commit the minimum needed to keep you in the lead.'
          : `Minimum bid is ${fmt(lot.next_min_bid)} ${lot.currency}/kg.`}
      </p>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="number" value={amount} step={lot.min_increment} min={lot.next_min_bid}
          onChange={e => setAmount(e.target.value)}
          aria-label={isAuto ? 'Maximum price per kilo' : 'Price per kilo'}
          style={{ ...mono, width: 140, padding: '12px 14px', borderRadius: 10,
            border: `1px solid ${BORDER}`, background: '#fff', color: INK, fontSize: 16 }}/>
        <span style={{ ...sans, fontSize: 13, color: 'rgba(20,35,26,0.5)' }}>
          {lot.currency}/kg
        </span>
        <span style={{ ...mono, fontSize: 14, color: CLAY, marginLeft: 'auto' }}>
          = {fmt(total)} {lot.currency}
        </span>
      </div>

      <button onClick={submit}
        disabled={busy || !canBid || Number(amount) < lot.next_min_bid}
        style={{
          ...sans, width: '100%', marginTop: 16, padding: '14px', borderRadius: 100,
          border: 'none', fontWeight: 700, fontSize: 14,
          background: (busy || !canBid) ? 'rgba(20,35,26,0.12)' : GREEN,
          color: (busy || !canBid) ? 'rgba(20,35,26,0.4)' : BG,
          cursor: (busy || !canBid) ? 'not-allowed' : 'pointer',
        }}>
        {busy ? 'Sending…' : isAuto ? 'Set my maximum' : `Bid ${fmt(total)} ${lot.currency}`}
      </button>

      {myStatus?.autobid && (
        <p style={{ ...sans, fontSize: 12, color: 'rgba(20,35,26,0.5)', marginTop: 12, marginBottom: 0 }}>
          Your automatic maximum: {fmt(myStatus.autobid.max_amount_per_kg)} {lot.currency}/kg.
          It can only be raised.
        </p>
      )}

      {myStatus?.registration?.bid_limit != null && (
        <p style={{ ...sans, fontSize: 12, color: 'rgba(20,35,26,0.5)', marginTop: 8, marginBottom: 0 }}>
          {fmt(myStatus.registration.remaining_limit)} {lot.currency} left of your bidding limit.
        </p>
      )}
    </div>
  );
};

// ── Historique ───────────────────────────────────────────────────────────────
const BidHistory = ({ bids, currency }) => {
  if (!bids?.length) {
    return (
      <p style={{ ...sans, fontSize: 13.5, color: 'rgba(20,35,26,0.45)' }}>
        No bids yet. The first one sets the pace.
      </p>
    );
  }

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
      {bids.map((bid, i) => (
        <div key={bid.id} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 18px', borderTop: i === 0 ? 'none' : `1px solid ${BORDER}`,
          background: i === 0 ? 'rgba(22,128,60,0.04)' : 'transparent',
        }}>
          <div>
            {/* Le montant est public, l'identité ne l'est pas — c'est la règle
                dans une vente à l'aveugle, et le serveur l'applique déjà. */}
            <div style={{ ...sans, fontSize: 13, color: INK }}>{bid.bidder}</div>
            <div style={{ ...sans, fontSize: 11, color: 'rgba(20,35,26,0.4)', marginTop: 2 }}>
              {new Date(bid.date_created + 'Z').toLocaleString('en-US', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
              })}
              {bid.is_auto && ' · automatic'}
            </div>
          </div>
          <div style={{ ...mono, fontSize: 14, color: i === 0 ? GREEN : 'rgba(20,35,26,0.6)',
            fontWeight: i === 0 ? 700 : 400 }}>
            {fmt(bid.amount_per_kg)} {currency}/kg
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Page ─────────────────────────────────────────────────────────────────────
const LotDetail = () => {
  const { id } = useParams();
  const [lot, setLot] = useState(null);
  const [myStatus, setMyStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const offsetRef = useRef(0);

  const load = useCallback(async (withSpinner = false) => {
    if (withSpinner) setLoading(true);
    try {
      const { data } = await axiosInstance.get(`/api/auction/lots/${id}`);
      setLot(data);
      // Horloge serveur : un navigateur mal réglé afficherait sinon « closed »
      // sur un lot encore ouvert, ou l'inverse — ce qui est pire.
      if (data.server_time) {
        offsetRef.current = new Date(data.server_time + 'Z').getTime() - Date.now();
      }
    } catch {
      setLot(null);
    } finally {
      if (withSpinner) setLoading(false);
    }
  }, [id]);

  const loadMyStatus = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get(`/api/auction/lots/${id}/my-status`);
      setMyStatus(data);
    } catch {
      // 401 attendu si l'utilisateur n'est pas connecté : ce n'est pas une erreur.
      setMyStatus(null);
    }
  }, [id]);

  useEffect(() => {
    load(true);
    loadMyStatus();
    const t = setInterval(() => { load(); loadMyStatus(); }, POLL_MS);
    return () => clearInterval(t);
  }, [load, loadMyStatus]);

  const refresh = () => { load(); loadMyStatus(); };

  if (loading) return <div style={{ background: BG, minHeight: '100vh' }} aria-busy="true"/>;

  if (!lot) {
    return (
      <div style={{ background: BG, minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <p style={{ ...serif, fontSize: 24, color: INK }}>This lot no longer exists.</p>
        <Link to="/shop" style={{ ...sans, fontSize: 13, color: GREEN, fontWeight: 700 }}>
          Browse the shop →
        </Link>
      </div>
    );
  }

  const product = lot.product;
  const images = product?.images ?? [];
  const currentPrice = lot.current_price_per_kg ?? lot.starting_price_per_kg;

  return (
    <div style={{ background: BG, minHeight: '100vh', padding: '48px 24px 96px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>

        <Link to="/shop" style={{ ...sans, fontSize: 12, color: 'rgba(20,35,26,0.5)',
          textDecoration: 'none', marginBottom: 28, display: 'inline-block' }}>
          ← Back
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 56, alignItems: 'start' }}>

          {/* ── Galerie ─────────────────────────────────────────────── */}
          <div>
            <div style={{ aspectRatio: '1', background: SAND, borderRadius: 12,
              overflow: 'hidden', position: 'relative', display: 'flex',
              alignItems: 'center', justifyContent: 'center' }}>
              {images[activeImage] ? (
                <img src={images[activeImage]} alt={lot.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
              ) : (
                <span style={{ ...sans, color: 'rgba(20,35,26,0.3)' }}>No image</span>
              )}
              {product?.is_deforestation_free && (
                <div style={{ position: 'absolute', top: 16, right: 16 }}><VerifiedStamp/></div>
              )}
              <div style={{ position: 'absolute', top: 16, left: 16, ...sans, fontSize: 11,
                fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase',
                padding: '6px 13px', borderRadius: 100,
                background: 'rgba(20,35,26,0.82)', color: BG }}>
                Lot {lot.lot_number}
              </div>
            </div>

            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                {images.map((url, i) => (
                  <button key={url} onClick={() => setActiveImage(i)} aria-label={`Image ${i + 1}`}
                    style={{ width: 64, height: 64, borderRadius: 8, overflow: 'hidden', padding: 0,
                      cursor: 'pointer', background: SAND,
                      border: `2px solid ${i === activeImage ? GREEN : 'transparent'}` }}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Enchère ─────────────────────────────────────────────── */}
          <div>
            <div style={{ ...sans, fontSize: 12, letterSpacing: 2, color: CLAY,
              textTransform: 'uppercase', marginBottom: 12 }}>
              {[product?.origin_country, product?.process_method].filter(Boolean).join(' · ')}
            </div>

            <h1 style={{ ...serif, fontSize: 40, color: INK, fontWeight: 500, marginBottom: 20 }}>
              {lot.name}
            </h1>

            {/* Le prix courant et le temps restant côte à côte : ce sont les
                deux seules informations qui décident d'une enchère. */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1,
              background: BORDER, border: `1px solid ${BORDER}`,
              borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ background: '#fff', padding: '18px 20px' }}>
                <div style={{ ...sans, fontSize: 10.5, letterSpacing: 1.2, textTransform: 'uppercase',
                  color: 'rgba(20,35,26,0.42)', marginBottom: 8 }}>
                  {lot.bid_count > 0 ? 'Current bid' : 'Opening price'}
                </div>
                <div style={{ ...mono, fontSize: 22, color: INK }}>
                  {fmt(currentPrice)} <span style={{ fontSize: 12, color: 'rgba(20,35,26,0.45)' }}>{lot.currency}/kg</span>
                </div>
                <div style={{ ...mono, fontSize: 12, color: CLAY, marginTop: 5 }}>
                  {fmt(lot.current_total)} {lot.currency} total
                </div>
              </div>
              <div style={{ background: '#fff', padding: '18px 20px' }}>
                <div style={{ ...sans, fontSize: 10.5, letterSpacing: 1.2, textTransform: 'uppercase',
                  color: 'rgba(20,35,26,0.42)', marginBottom: 8 }}>
                  Time left
                </div>
                <Countdown endsAt={lot.ends_at} offsetMs={offsetRef.current}/>
                <div style={{ ...sans, fontSize: 12, color: 'rgba(20,35,26,0.45)', marginTop: 5 }}>
                  {lot.bid_count} {lot.bid_count === 1 ? 'bid' : 'bids'} · {fmt(lot.weight_kg)} kg
                </div>
              </div>
            </div>

            <BidPanel lot={lot} myStatus={myStatus} onPlaced={refresh}/>

            {product && (
              <>
                <SpecStrip product={product}/>
                <TastingNotes notes={product.tasting_notes}/>
                <ProofPanel traceability={product.traceability}/>
              </>
            )}
          </div>
        </div>

        {/* ── Historique ───────────────────────────────────────────── */}
        <section style={{ maxWidth: 720, margin: '56px auto 0' }}>
          <div style={eyebrow}>Bidding history</div>
          <BidHistory bids={lot.bids} currency={lot.currency}/>
        </section>

        {/* ── Récit ────────────────────────────────────────────────── */}
        {product && (
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <StoryBlocks product={product}/>
          </div>
        )}
      </div>
    </div>
  );
};

export default LotDetail;