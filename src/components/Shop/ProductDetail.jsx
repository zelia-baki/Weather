import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../../axiosInstance';
import { useCart } from '../../context/CartContext';
import VerifiedStamp from './VerifiedStamp';
import { SpecStrip, TastingNotes, StoryBlocks, ProofPanel } from './ProductStory';
import Swal from 'sweetalert2';

// =============================================================================
//  src/components/Shop/ProductDetail.jsx — remplace ton fichier actuel
//
//  Le bloc d'achat change complètement de forme selon le mode de vente :
//    'unit'   → sélecteur d'exemplaires        (« 3 sachets »)
//    'weight' → saisie en kg, minimum et pas   (« 12,5 kg à 50 $/kg »)
//    'lot'    → un seul bouton, tout ou rien   (« Acquérir ce lot · 12 kg »)
//
//  C'est la même donnée produit dans les trois cas — seule la configuration
//  min/pas/stock diffère. Pas de branche cachée dans la logique de panier.
// =============================================================================

const BG = '#f7f4ee';
const INK = '#14231a';
const GREEN = '#16803c';
const CLAY = '#a9784f';
const SAND = '#eee9de';
const RUST = '#c2410c';
const BORDER = 'rgba(20,35,26,0.15)';

const mono = { fontFamily: "'JetBrains Mono', monospace" };
const sans = { fontFamily: "'Epilogue', sans-serif" };
const serif = { fontFamily: "'Cormorant Garamond', serif" };

const fmt = (n, digits = 0) =>
  Number(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: 3 });

// ── Bloc d'achat ─────────────────────────────────────────────────────────────

const QuantityPicker = ({ product, quantity, setQuantity }) => {
  const { min_order_qty: min, order_step: step, stock_qty: stock, unit } = product;
  const isWeight = product.sale_mode === 'weight';

  const clamp = (v) => {
    if (Number.isNaN(v)) return min;
    const steps = Math.round((v - min) / step);
    const snapped = min + steps * step;
    return Math.min(stock, Math.max(min, Number(snapped.toFixed(3))));
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center',
          border: `1px solid ${BORDER}`, borderRadius: 100, overflow: 'hidden' }}>
          <button onClick={() => setQuantity(clamp(quantity - step))}
            aria-label="Decrease quantity"
            style={{ padding: '10px 16px', background: 'none', border: 'none',
              color: INK, cursor: 'pointer', fontSize: 16 }}>
            −
          </button>
          <input
            type="number" value={quantity} min={min} max={stock} step={step}
            onChange={e => setQuantity(Number(e.target.value))}
            onBlur={e => setQuantity(clamp(Number(e.target.value)))}
            aria-label={`Quantity in ${unit}`}
            style={{ ...mono, width: 72, textAlign: 'center', fontSize: 14,
              border: 'none', outline: 'none', background: 'transparent', color: INK }}
          />
          <span style={{ ...sans, fontSize: 13, color: 'rgba(20,35,26,0.5)', paddingRight: 14 }}>
            {unit}
          </span>
          <button onClick={() => setQuantity(clamp(quantity + step))}
            aria-label="Increase quantity"
            style={{ padding: '10px 16px', background: 'none', border: 'none',
              color: INK, cursor: 'pointer', fontSize: 16 }}>
            +
          </button>
        </div>
        <span style={{ ...sans, fontSize: 12.5, color: 'rgba(20,35,26,0.45)' }}>
          {fmt(stock)} {unit} available
        </span>
      </div>
      {isWeight && (min > 1 || step > 1) && (
        <p style={{ ...sans, fontSize: 12, color: 'rgba(20,35,26,0.45)', marginTop: 8 }}>
          Orders from {fmt(min)} {unit}, in steps of {fmt(step)} {unit}.
        </p>
      )}
    </div>
  );
};

const LotSummary = ({ product }) => (
  <div style={{
    background: SAND, borderRadius: 12, padding: '20px 22px', marginBottom: 20,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20,
  }}>
    <div>
      <div style={{ ...sans, fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase',
        color: 'rgba(20,35,26,0.45)', marginBottom: 6 }}>
        Sold as one lot
      </div>
      <div style={{ ...mono, fontSize: 15, color: INK }}>
        {fmt(product.stock_qty)} {product.unit} × {fmt(product.price, 2)} {product.currency}
      </div>
    </div>
    <div style={{ ...serif, fontSize: 30, color: CLAY, whiteSpace: 'nowrap' }}>
      {fmt(product.total_price, 2)} {product.currency}
    </div>
  </div>
);

// ── Page ─────────────────────────────────────────────────────────────────────

const ProductDetail = () => {
  const { id } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    axiosInstance.get(`/api/ecommerce/products/${id}`)
      .then(res => {
        if (cancelled) return;
        setProduct(res.data);
        setQuantity(res.data.min_order_qty || 1);
        setActiveImage(0);
      })
      .catch(() => !cancelled && setProduct(null))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id]);

  const handleAddToCart = () => {
    const qty = product.sale_mode === 'lot' ? product.stock_qty : quantity;
    addItem(product, qty);
    Swal.fire({
      icon: 'success',
      title: product.sale_mode === 'lot' ? 'Lot added to cart' : 'Added to cart',
      timer: 1500, showConfirmButton: false,
    });
  };

  if (loading) {
    return <div style={{ background: BG, minHeight: '100vh' }} aria-busy="true" />;
  }

  if (!product) {
    return (
      <div style={{ background: BG, minHeight: '100vh', display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <p style={{ ...serif, fontSize: 24, color: INK }}>This product is no longer listed.</p>
        <Link to="/shop" style={{ ...sans, fontSize: 13, color: GREEN, fontWeight: 700 }}>
          Browse available lots →
        </Link>
      </div>
    );
  }

  const isOut = product.stock_status === 'out';
  const isLow = product.stock_status === 'low';
  const isLot = product.sale_mode === 'lot';
  const lineTotal = isLot ? product.total_price : quantity * product.price;

  return (
    <div style={{ background: BG, minHeight: '100vh', padding: '48px 24px 96px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>

        <Link to="/shop" style={{ ...sans, fontSize: 12, color: 'rgba(20,35,26,0.5)',
          textDecoration: 'none', marginBottom: 28, display: 'inline-block' }}>
          ← All lots
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 56, alignItems: 'start' }}>

          {/* ── Galerie ─────────────────────────────────────────────── */}
          <div>
            <div style={{ aspectRatio: '1', background: SAND, borderRadius: 12,
              overflow: 'hidden', position: 'relative', display: 'flex',
              alignItems: 'center', justifyContent: 'center' }}>
              {product.images?.[activeImage] ? (
                <img src={product.images[activeImage]} alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover',
                    filter: isOut ? 'grayscale(0.6)' : 'none' }} />
              ) : (
                <span style={{ ...sans, color: 'rgba(20,35,26,0.3)' }}>No image</span>
              )}
              {product.is_deforestation_free && (
                <div style={{ position: 'absolute', top: 16, right: 16 }}>
                  <VerifiedStamp />
                </div>
              )}
            </div>

            {/* Miniatures — l'ancienne page n'affichait que la première image */}
            {product.images?.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                {product.images.map((url, i) => (
                  <button key={url} onClick={() => setActiveImage(i)}
                    aria-label={`Image ${i + 1}`}
                    style={{
                      width: 64, height: 64, borderRadius: 8, overflow: 'hidden', padding: 0,
                      cursor: 'pointer', background: SAND,
                      border: `2px solid ${i === activeImage ? GREEN : 'transparent'}`,
                    }}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Achat ───────────────────────────────────────────────── */}
          <div>
            <div style={{ ...sans, fontSize: 12, letterSpacing: 2, color: CLAY,
              textTransform: 'uppercase', marginBottom: 12 }}>
              {product.origin_country || product.category}
            </div>

            <h1 style={{ ...serif, fontSize: 42, color: INK, fontWeight: 500, marginBottom: 16 }}>
              {product.name}
            </h1>

            <p style={{ ...sans, fontSize: 15, lineHeight: 1.7,
              color: 'rgba(20,35,26,0.65)', marginBottom: 4 }}>
              {product.description}
            </p>

            <SpecStrip product={product} />
            <TastingNotes notes={product.tasting_notes} />

            {product.certification_labels?.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '20px 0' }}>
                {product.certification_labels.map(label => (
                  <span key={label} style={{ ...sans, fontSize: 11, padding: '5px 12px',
                    borderRadius: 100, border: '1px solid rgba(22,128,60,0.3)', color: GREEN }}>
                    {label}
                  </span>
                ))}
              </div>
            )}

            <div style={{ ...mono, fontSize: 26, color: INK, margin: '28px 0 20px' }}>
              {fmt(product.price, 2)} {product.currency}
              <span style={{ fontSize: 14, color: 'rgba(20,35,26,0.45)' }}> / {product.unit}</span>
            </div>

            {!isOut && isLot && <LotSummary product={product} />}
            {!isOut && !isLot && (
              <QuantityPicker product={product} quantity={quantity} setQuantity={setQuantity} />
            )}

            {isLow && !isLot && (
              <p style={{ ...sans, fontSize: 13, color: RUST, marginBottom: 16 }}>
                Only {fmt(product.stock_qty)} {product.unit} left.
              </p>
            )}
            {isOut && (
              <p style={{ ...sans, fontSize: 13, color: 'rgba(20,35,26,0.55)', marginBottom: 16 }}>
                {isLot ? 'This lot has been sold.' : 'This product is sold out.'} More lots from the
                same origin arrive with every harvest.
              </p>
            )}

            <button
              onClick={handleAddToCart}
              disabled={isOut}
              style={{
                width: '100%', padding: '16px', borderRadius: 100, border: 'none',
                background: isOut ? 'rgba(20,35,26,0.08)' : GREEN,
                color: isOut ? 'rgba(20,35,26,0.35)' : BG,
                ...sans, fontWeight: 700, fontSize: 15,
                cursor: isOut ? 'not-allowed' : 'pointer', marginBottom: 14,
              }}
            >
              {isOut
                ? 'Sold out'
                : isLot
                  ? `Take this lot · ${fmt(product.total_price, 2)} ${product.currency}`
                  : `Add to cart · ${fmt(lineTotal, 2)} ${product.currency}`}
            </button>

            <Link to="/shop/checkout" style={{ ...sans, display: 'block', textAlign: 'center',
              textDecoration: 'none', fontSize: 13, color: 'rgba(20,35,26,0.5)' }}>
              View cart →
            </Link>

            <ProofPanel traceability={product.traceability} />
          </div>
        </div>

        {/* ── Récit, pleine largeur sous les deux colonnes ──────────── */}
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <StoryBlocks product={product} />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;