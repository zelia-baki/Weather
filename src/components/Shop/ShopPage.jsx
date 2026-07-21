import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../axiosInstance';
import VerifiedStamp from './VerifiedStamp';

const ShopPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/api/ecommerce/products'),
      axiosInstance.get('/api/ecommerce/categories'),
    ])
      .then(([prodRes, catRes]) => {
        setProducts(prodRes.data);
        setCategories(catRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeCategory
    ? products.filter(p => p.category === activeCategory)
    : products;

  return (
    <div style={{ background: '#f7f4ee', minHeight: '100vh' }}>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{
        padding: '96px 24px 72px',
        borderBottom: '1px solid rgba(20,35,26,0.08)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ maxWidth: 780, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            fontFamily: "'Epilogue', sans-serif", fontSize: 12, letterSpacing: 3,
            color: '#16803c', textTransform: 'uppercase', marginBottom: 20,
          }}>
            Origin-verified · EUDR compliant
          </div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(40px, 6vw, 68px)',
            color: '#14231a', lineHeight: 1.08, fontWeight: 500, marginBottom: 24,
          }}>
            Every bag carries<br />the record of its forest.
          </h1>
          <p style={{
            fontFamily: "'Epilogue', sans-serif", fontSize: 16, lineHeight: 1.7,
            color: 'rgba(20,35,26,0.65)', maxWidth: 520, marginBottom: 40,
          }}>
            Coffee and cocoa sourced from farms verified against deforestation risk.
            Each lot is traceable to its origin — the premium reflects what it took
            to prove that.
          </p>
          <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
            {[
              ['100%', 'lots verified'],
              ['EUDR', 'compliance checked'],
              ['0', 'hectares lost'],
            ].map(([value, label]) => (
              <div key={label}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: '#a9784f' }}>
                  {value}
                </div>
                <div style={{ fontFamily: "'Epilogue', sans-serif", fontSize: 12, color: 'rgba(20,35,26,0.45)', letterSpacing: 1 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Filtres catégories ───────────────────────────────────────────── */}
      <div style={{
        maxWidth: 1160, margin: '0 auto', padding: '32px 24px 0',
        display: 'flex', gap: 10, flexWrap: 'wrap',
      }}>
        <button
          onClick={() => setActiveCategory(null)}
          style={{
            padding: '8px 18px', borderRadius: 100, fontFamily: "'Epilogue', sans-serif", fontSize: 13,
            border: `1px solid ${!activeCategory ? '#16803c' : 'rgba(20,35,26,0.15)'}`,
            background: !activeCategory ? 'rgba(22,128,60,0.08)' : 'transparent',
            color: !activeCategory ? '#16803c' : 'rgba(20,35,26,0.55)',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.name)}
            style={{
              padding: '8px 18px', borderRadius: 100, fontFamily: "'Epilogue', sans-serif", fontSize: 13,
              border: `1px solid ${activeCategory === cat.name ? '#16803c' : 'rgba(20,35,26,0.15)'}`,
              background: activeCategory === cat.name ? 'rgba(22,128,60,0.08)' : 'transparent',
              color: activeCategory === cat.name ? '#16803c' : 'rgba(20,35,26,0.55)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* ── Grille produits ──────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 1160, margin: '0 auto', padding: '32px 24px 96px',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24,
      }}>
        {loading && (
          <p style={{ color: 'rgba(20,35,26,0.45)', fontFamily: "'Epilogue', sans-serif" }}>
            Loading lots…
          </p>
        )}
        {!loading && filtered.length === 0 && (
          <p style={{ color: 'rgba(20,35,26,0.45)', fontFamily: "'Epilogue', sans-serif" }}>
            No products available in this category yet.
          </p>
        )}
        {filtered.map(product => (
          <Link
            key={product.id}
            to={`/shop/${product.id}`}
            style={{
              display: 'block', textDecoration: 'none',
              background: '#ffffff', border: '1px solid rgba(20,35,26,0.08)',
              borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s',
              boxShadow: '0 1px 3px rgba(20,35,26,0.05)',
            }}
          >
            <div style={{
              height: 200, background: '#eee9de', position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {product.images?.[0] ? (
                <img src={product.images[0]} alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: 'rgba(20,35,26,0.3)', fontFamily: "'Epilogue', sans-serif", fontSize: 12 }}>
                  No image
                </span>
              )}
              {product.is_deforestation_free && (
                <div style={{ position: 'absolute', top: 12, right: 12 }}>
                  <VerifiedStamp />
                </div>
              )}
            </div>
            <div style={{ padding: 20 }}>
              <div style={{
                fontFamily: "'Epilogue', sans-serif", fontSize: 11, letterSpacing: 1.5,
                color: '#a9784f', textTransform: 'uppercase', marginBottom: 6,
              }}>
                {product.origin_country || product.category}
              </div>
              <h3 style={{
                fontFamily: "'Cormorant Garamond', serif", fontSize: 22,
                color: '#14231a', marginBottom: 10, fontWeight: 500,
              }}>
                {product.name}
              </h3>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 15,
                color: '#14231a',
              }}>
                {product.price.toLocaleString()} {product.currency}
                <span style={{ color: 'rgba(20,35,26,0.45)', fontSize: 12 }}> / {product.unit}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ShopPage;