import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../axiosInstance';

// =============================================================================
//  src/components/Auction/AuctionsIndex.jsx — nouveau fichier
//
//  Route : /auctions  (au pluriel, pour ne pas heurter /auction/:slug)
//
//  C'est le point d'entrée du module. Sans lui, une vente n'est accessible
//  qu'en connaissant son slug — donc par personne.
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

const fmt = (n, d = 2) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: 3 });

const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
  : '';

const STATE = {
  live:   { label: 'Bidding open', bg: 'rgba(22,128,60,0.1)',  color: GREEN },
  draft:  { label: 'Coming soon',  bg: 'rgba(169,120,79,0.12)', color: CLAY },
  closed: { label: 'Closed',       bg: 'rgba(20,35,26,0.08)',  color: 'rgba(20,35,26,0.5)' },
};

const AuctionsIndex = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get('/api/auction/auctions')
      .then(r => setAuctions(r.data ?? []))
      .catch(() => setAuctions([]))
      .finally(() => setLoading(false));
  }, []);

  // Les ventes en cours d'abord : c'est là que quelque chose se joue.
  const sorted = [...auctions].sort((a, b) => {
    const rank = s => (s === 'live' ? 0 : s === 'draft' ? 1 : 2);
    return rank(a.status) - rank(b.status);
  });

  return (
    <div style={{ background: BG, minHeight: '100vh' }}>

      <section style={{ padding: '96px 24px 64px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ ...sans, fontSize: 12, letterSpacing: 3, color: GREEN,
            textTransform: 'uppercase', marginBottom: 20 }}>
            Lot auctions
          </div>
          <h1 style={{ ...serif, fontSize: 'clamp(38px, 5.5vw, 62px)', color: INK,
            lineHeight: 1.1, fontWeight: 500, marginBottom: 22 }}>
            The lots that earn<br />their own price.
          </h1>
          <p style={{ ...sans, fontSize: 16, lineHeight: 1.7,
            color: 'rgba(20,35,26,0.65)', maxWidth: 540 }}>
            A handful of lots each season are set apart and put to auction. What a
            buyer pays for them goes back to the farm that proved its forest is
            still standing.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 96px' }}>

        {loading && (
          <p style={{ ...sans, color: 'rgba(20,35,26,0.45)' }} aria-busy="true">
            Loading auctions…
          </p>
        )}

        {!loading && sorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ ...serif, fontSize: 24, color: INK, marginBottom: 12 }}>
              No auction is open right now.
            </p>
            <p style={{ ...sans, fontSize: 14, color: 'rgba(20,35,26,0.5)', marginBottom: 24 }}>
              The next sale follows the harvest.
            </p>
            <Link to="/shop" style={{ ...sans, fontSize: 13, color: GREEN, fontWeight: 700 }}>
              Browse lots at fixed price →
            </Link>
          </div>
        )}

        <div style={{ display: 'grid', gap: 20 }}>
          {sorted.map(a => {
            const state = STATE[a.status] || STATE.draft;
            return (
              <Link key={a.id} to={`/auction/${a.slug}`}
                style={{ display: 'block', textDecoration: 'none' }}>
                <div style={{
                  background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12,
                  overflow: 'hidden', boxShadow: '0 1px 3px rgba(20,35,26,0.05)',
                }}>
                  {a.cover_image && (
                    <div style={{ height: 180, background: `
                      linear-gradient(rgba(20,35,26,0.45), rgba(20,35,26,0.65)),
                      url(${a.cover_image}) center/cover` }}/>
                  )}

                  <div style={{ padding: '26px 28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center',
                      gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                      <span style={{ ...sans, fontSize: 11, fontWeight: 700, letterSpacing: 1.2,
                        textTransform: 'uppercase', padding: '5px 13px', borderRadius: 100,
                        background: state.bg, color: state.color }}>
                        {state.label}
                      </span>
                      <span style={{ ...sans, fontSize: 12, color: 'rgba(20,35,26,0.45)' }}>
                        {fmtDate(a.starts_at)} — {fmtDate(a.ends_at)}
                      </span>
                    </div>

                    <h2 style={{ ...serif, fontSize: 30, color: INK,
                      fontWeight: 500, marginBottom: 8 }}>
                      {a.name}
                    </h2>

                    {a.subtitle && (
                      <p style={{ ...sans, fontSize: 14.5, lineHeight: 1.7,
                        color: 'rgba(20,35,26,0.6)', marginBottom: 20 }}>
                        {a.subtitle}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap',
                      paddingTop: 18, borderTop: `1px solid ${BORDER}` }}>
                      <div>
                        <div style={{ ...mono, fontSize: 17, color: INK }}>
                          {a.stats?.lot_count ?? 0}
                        </div>
                        <div style={{ ...sans, fontSize: 11, color: 'rgba(20,35,26,0.42)' }}>
                          lots
                        </div>
                      </div>
                      <div>
                        <div style={{ ...mono, fontSize: 17, color: INK }}>
                          {a.stats?.total_bids ?? 0}
                        </div>
                        <div style={{ ...sans, fontSize: 11, color: 'rgba(20,35,26,0.42)' }}>
                          bids placed
                        </div>
                      </div>
                      {a.stats?.highest_lot_price_per_kg > 0 && (
                        <div>
                          <div style={{ ...mono, fontSize: 17, color: CLAY }}>
                            {fmt(a.stats.highest_lot_price_per_kg)}
                          </div>
                          <div style={{ ...sans, fontSize: 11, color: 'rgba(20,35,26,0.42)' }}>
                            highest {a.currency}/kg
                          </div>
                        </div>
                      )}
                      {a.access_mode === 'deposit' && (
                        <div style={{ marginLeft: 'auto', alignSelf: 'center' }}>
                          <span style={{ ...sans, fontSize: 11.5, color: CLAY,
                            padding: '6px 14px', borderRadius: 100, background: SAND }}>
                            Deposit required to bid
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AuctionsIndex;