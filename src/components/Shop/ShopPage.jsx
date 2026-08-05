import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../axiosInstance';
import VerifiedStamp from './VerifiedStamp';

// =============================================================================
//  src/components/Shop/ShopPage.jsx — remplace ton fichier actuel
//
//  Deux changements de fond :
//
//  1. Le statut de stock vient du SERVEUR (`product.stock_status`). Il n'est
//     plus recalculé ici. Une seule règle, pas deux implémentations qui
//     finissent par diverger.
//
//  2. Un lot n'affiche pas le même prix qu'un produit à l'unité. « 12 kg ·
//     600 USD » est parlant ; « 50 USD/kg » seul laisse l'acheteur faire la
//     multiplication de tête.
// =============================================================================

const BG = '#f7f4ee';
const INK = '#14231a';
const GREEN = '#16803c';
const CLAY = '#a9784f';
const SAND = '#eee9de';
const RUST = '#c2410c';

const mono = { fontFamily: "'JetBrains Mono', monospace" };
const sans = { fontFamily: "'Epilogue', sans-serif" };
const serif = { fontFamily: "'Cormorant Garamond', serif" };

const fmt = (n, min = 0) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: min, maximumFractionDigits: 3 });

// ── Badges ───────────────────────────────────────────────────────────────────

const StockBadge = ({ product }) => {
  if (product.stock_status === 'out') {
    return (
      <span style={{ ...sans, fontSize: 11, fontWeight: 700, padding: '5px 12px',
        borderRadius: 100, background: 'rgba(20,35,26,0.75)', color: BG }}>
        {product.sale_mode === 'lot' ? 'Sold' : 'Out of stock'}
      </span>
    );
  }
  if (product.stock_status === 'low') {
    return (
      <span style={{ ...sans, fontSize: 11, fontWeight: 700, padding: '5px 12px',
        borderRadius: 100, background: RUST, color: '#fff' }}>
        Only {fmt(product.stock_qty)} {product.unit} left
      </span>
    );
  }
  return null;
};

const LotBadge = () => (
  <span style={{ ...sans, fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
    textTransform: 'uppercase', padding: '5px 11px', borderRadius: 100,
    background: 'rgba(169,120,79,0.92)', color: BG }}>
    Single lot
  </span>
);

// ── Prix d'une carte, selon le mode de vente ─────────────────────────────────
const CardPrice = ({ product }) => {
  const perUnit = (
    <>
      {fmt(product.price, 2)} {product.currency}
      <span style={{ color: 'rgba(20,35,26,0.45)', fontSize: 12 }}> / {product.unit}</span>
    </>
  );

  if (product.sale_mode !== 'lot') {
    return <div style={{ ...mono, fontSize: 15, color: INK }}>{perUnit}</div>;
  }

  // Mode lot : le total d'abord, c'est le chiffre qui engage l'acheteur.
  return (
    <div>
      <div style={{ ...mono, fontSize: 17, color: CLAY }}>
        {fmt(product.total_price, 2)} {product.currency}
      </div>
      <div style={{ ...mono, fontSize: 11.5, color: 'rgba(20,35,26,0.45)', marginTop: 3 }}>
        {fmt(product.stock_qty)} {product.unit} × {fmt(product.price, 2)}
      </div>
    </div>
  );
};

// ── Page ─────────────────────────────────────────────────────────────────────

const ShopPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);   // id, pas nom
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/api/ecommerce/products'),
      axiosInstance.get('/api/ecommerce/categories'),
    ])
      .then(([prodRes, catRes]) => {
        setProducts(prodRes.data ?? []);
        setCategories(catRes.data ?? []);
      })
      .catch(() => setError('The catalogue could not be loaded. Please try again shortly.'))
      .finally(() => setLoading(false));
  }, []);

  // Filtrage par identifiant et non par nom : deux catégories homonymes ne
  // se mélangent plus, et un renommage ne casse rien.
  const filtered = activeCategory
    ? products.filter(p => p.category_id === activeCategory)
    : products;

  const filterBtn = (active) => ({
    ...sans, fontSize: 13, padding: '8px 18px', borderRadius: 100, cursor: 'pointer',
    border: `1px solid ${active ? GREEN : 'rgba(20,35,26,0.15)'}`,
    background: active ? 'rgba(22,128,60,0.08)' : 'transparent',
    color: active ? GREEN : 'rgba(20,35,26,0.55)',
    transition: 'all 0.2s',
  });

  return (
    <div style={{ background: BG, minHeight: '100vh' }}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 24px 72px',
        borderBottom: '1px solid rgba(20,35,26,0.08)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ ...sans, fontSize: 12, letterSpacing: 3, color: GREEN,
            textTransform: 'uppercase', marginBottom: 20 }}>
            Origin-verified · EUDR compliant
          </div>
          <h1 style={{ ...serif, fontSize: 'clamp(40px, 6vw, 68px)', color: INK,
            lineHeight: 1.08, fontWeight: 500, marginBottom: 24 }}>
            Every bag carries<br />the record of its forest.
          </h1>
          <p style={{ ...sans, fontSize: 16, lineHeight: 1.7,
            color: 'rgba(20,35,26,0.65)', maxWidth: 520, marginBottom: 40 }}>
            Coffee and cocoa sourced from farms verified against deforestation risk.
            Each lot is traceable to its origin — the premium reflects what it took
            to prove that.
          </p>
          <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
            {[['100%', 'lots verified'], ['EUDR', 'compliance checked'], ['0', 'hectares lost']]
              .map(([value, label]) => (
                <div key={label}>
                  <div style={{ ...serif, fontSize: 32, color: CLAY }}>{value}</div>
                  <div style={{ ...sans, fontSize: 12, color: 'rgba(20,35,26,0.45)', letterSpacing: 1 }}>
                    {label}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* ── Filtres ──────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '32px 24px 0',
        display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={() => setActiveCategory(null)} style={filterBtn(!activeCategory)}>
          All
        </button>
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            style={filterBtn(activeCategory === cat.id)}>
            {cat.name}
          </button>
        ))}
      </div>

      {/* ── Grille ───────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '32px 24px 96px',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>

        {loading && (
          <p style={{ ...sans, color: 'rgba(20,35,26,0.45)' }} aria-busy="true">
            Loading lots…
          </p>
        )}

        {!loading && error && (
          <p style={{ ...sans, color: RUST }}>{error}</p>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p style={{ ...sans, color: 'rgba(20,35,26,0.45)' }}>
            No lots available in this category yet. New ones arrive with every harvest.
          </p>
        )}

        {filtered.map(product => {
          const isOut = product.stock_status === 'out';
          const isLot = product.sale_mode === 'lot';

          return (
            <Link key={product.id} to={`/shop/${product.id}`}
              style={{ display: 'block', textDecoration: 'none',
                cursor: isOut ? 'default' : 'pointer' }}>
              <div style={{
                background: '#fff', border: '1px solid rgba(20,35,26,0.08)',
                borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s',
                boxShadow: '0 1px 3px rgba(20,35,26,0.05)', opacity: isOut ? 0.6 : 1,
              }}>
                <div style={{ height: 200, background: SAND, position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover',
                        filter: isOut ? 'grayscale(0.6)' : 'none' }}/>
                  ) : (
                    <span style={{ ...sans, color: 'rgba(20,35,26,0.3)', fontSize: 12 }}>
                      No image
                    </span>
                  )}

                  {product.is_deforestation_free && (
                    <div style={{ position: 'absolute', top: 12, right: 12 }}>
                      <VerifiedStamp />
                    </div>
                  )}

                  {isLot && !isOut && (
                    <div style={{ position: 'absolute', top: 12, left: 12 }}>
                      <LotBadge />
                    </div>
                  )}

                  {product.stock_status !== 'ok' && (
                    <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
                      <StockBadge product={product} />
                    </div>
                  )}
                </div>

                <div style={{ padding: 20 }}>
                  <div style={{ ...sans, fontSize: 11, letterSpacing: 1.5, color: CLAY,
                    textTransform: 'uppercase', marginBottom: 6 }}>
                    {product.origin_country || product.category}
                  </div>

                  <h3 style={{ ...serif, fontSize: 22, color: INK,
                    marginBottom: 10, fontWeight: 500 }}>
                    {product.name}
                  </h3>

                  {/* Les specs avant le prix : c'est ce qu'un acheteur de
                      spécialité lit en premier sur une grille. */}
                  {(product.process_method || product.varietal) && (
                    <div style={{ ...sans, fontSize: 11.5, color: 'rgba(20,35,26,0.5)',
                      marginBottom: 10 }}>
                      {[product.process_method, product.varietal].filter(Boolean).join(' · ')}
                    </div>
                  )}

                  <CardPrice product={product} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ShopPage;