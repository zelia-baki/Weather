import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';

// =============================================================================
//  src/components/Shop/CheckoutPage.jsx — remplace ton fichier actuel
//
//  Trois corrections :
//
//  1. Les boutons + / − avancent d'un PAS (increment/decrement du panier),
//     plus d'une unité. Sur un vrac à pas de 5 kg, « +1 » produisait une
//     quantité que le serveur refusait.
//
//  2. Un lot est figé : ni + ni −, seulement « Remove ».
//
//  3. Le panier multi-devises est bloqué ICI, avant l'appel au serveur.
//     L'acheteur ne remplit plus tout le formulaire pour apprendre à la fin
//     que sa commande est impossible.
// =============================================================================

const BG = '#f7f4ee';
const INK = '#14231a';
const GREEN = '#16803c';
const CLAY = '#a9784f';
const SAND = '#eee9de';
const RUST = '#a03b2e';
const BORDER = 'rgba(20,35,26,0.12)';

const mono = { fontFamily: "'JetBrains Mono', monospace" };
const sans = { fontFamily: "'Epilogue', sans-serif" };
const serif = { fontFamily: "'Cormorant Garamond', serif" };

const fmt = (n, min = 0) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: min, maximumFractionDigits: 3 });

const labelStyle = {
  ...sans, fontSize: 11, letterSpacing: 1.5, color: 'rgba(20,35,26,0.5)',
  textTransform: 'uppercase', marginBottom: 6, display: 'block',
};

const inputStyle = {
  ...sans, width: '100%', padding: '12px 14px', borderRadius: 10, outline: 'none',
  border: `1px solid ${BORDER}`, fontSize: 14, color: INK, background: '#fff',
};

const stepBtn = (enabled) => ({
  ...sans, padding: '4px 11px', background: 'none', border: 'none', fontSize: 15,
  color: enabled ? INK : 'rgba(20,35,26,0.25)',
  cursor: enabled ? 'pointer' : 'not-allowed',
});

// ── Une ligne de panier ──────────────────────────────────────────────────────
const CartLine = ({ item, first }) => {
  const { increment, decrement, removeItem, canIncrease, canDecrease } = useCart();
  const isLot = item.sale_mode === 'lot';
  const lineTotal = item.price * item.quantity;

  return (
    <div style={{ display: 'flex', gap: 14, padding: '16px 18px',
      borderTop: first ? 'none' : `1px solid ${BORDER}` }}>

      <div style={{ width: 56, height: 56, borderRadius: 8, background: SAND,
        flexShrink: 0, overflow: 'hidden', display: 'flex',
        alignItems: 'center', justifyContent: 'center' }}>
        {item.image
          ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          : <span style={{ ...sans, fontSize: 10, color: 'rgba(20,35,26,0.3)' }}>No image</span>}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ ...sans, fontSize: 14, color: INK, fontWeight: 600 }}>
          {item.name}
        </div>

        <div style={{ ...mono, fontSize: 12.5, color: 'rgba(20,35,26,0.55)', margin: '4px 0 8px' }}>
          {fmt(item.price, 2)} {item.currency} / {item.unit}
        </div>

        {isLot ? (
          // Un lot ne se fractionne pas : on affiche ce qu'il est, pas un
          // sélecteur qui laisserait croire qu'on peut en prendre la moitié.
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ ...sans, fontSize: 11, fontWeight: 700, letterSpacing: 1,
              textTransform: 'uppercase', padding: '4px 11px', borderRadius: 100,
              background: 'rgba(169,120,79,0.14)', color: CLAY }}>
              Whole lot · {fmt(item.quantity)} {item.unit}
            </span>
            <button onClick={() => removeItem(item.product_id)}
              style={{ ...sans, fontSize: 11.5, color: RUST, background: 'none',
                border: 'none', cursor: 'pointer' }}>
              Remove
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center',
              border: `1px solid ${BORDER}`, borderRadius: 100 }}>
              <button onClick={() => decrement(item.product_id)}
                disabled={!canDecrease(item)} aria-label="Decrease quantity"
                style={stepBtn(canDecrease(item))}>
                −
              </button>
              <span style={{ ...mono, fontSize: 12.5, padding: '0 10px', color: INK }}>
                {fmt(item.quantity)} {item.unit}
              </span>
              <button onClick={() => increment(item.product_id)}
                disabled={!canIncrease(item)} aria-label="Increase quantity"
                style={stepBtn(canIncrease(item))}>
                +
              </button>
            </div>
            <button onClick={() => removeItem(item.product_id)}
              style={{ ...sans, fontSize: 11.5, color: RUST, background: 'none',
                border: 'none', cursor: 'pointer' }}>
              Remove
            </button>
          </div>
        )}

        {item.order_step > 1 && !isLot && (
          <p style={{ ...sans, fontSize: 11, color: 'rgba(20,35,26,0.4)', marginTop: 6 }}>
            Sold in steps of {fmt(item.order_step)} {item.unit}.
          </p>
        )}
      </div>

      <div style={{ ...mono, fontSize: 13.5, color: INK, whiteSpace: 'nowrap' }}>
        {fmt(lineTotal, 2)}
      </div>
    </div>
  );
};

// ── Page ─────────────────────────────────────────────────────────────────────
const CheckoutPage = () => {
  const { items, totalAmount, currency, currencies, hasMixedCurrency } = useCart();
  const [form, setForm] = useState({ guest_name: '', email: '', phone_number: '', shipping_address: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.guest_name.trim())       e.guest_name = 'Name is required';
    if (!form.phone_number.trim())     e.phone_number = 'Phone number is required';
    if (!form.shipping_address.trim()) e.shipping_address = 'Shipping address is required';
    return e;
  };

  const handleSubmit = async () => {
    if (items.length === 0 || hasMixedCurrency) return;

    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const payload = {
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        phone_number: form.phone_number,
        email: form.email,
        guest_name: form.guest_name,
        shipping_address: form.shipping_address,
      };
      const res = await axiosInstance.post('/api/ecommerce/checkout/initiate', payload);

      if (res.data?.success && res.data?.payment_url) {
        // Le panier reste intact jusqu'à confirmation du paiement : si
        // l'acheteur annule chez DPO et revient, il retrouve sa commande.
        // C'est la page de succès qui le vide.
        window.location.href = res.data.payment_url;
      } else {
        throw new Error(res.data?.error || 'Payment could not be started');
      }
    } catch (err) {
      Swal.fire({
        icon: 'error', title: 'Checkout failed',
        text: err.response?.data?.error || err.message,
        customClass: { popup: 'rounded-2xl' },
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div style={{ background: BG, minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ ...sans, color: 'rgba(20,35,26,0.5)' }}>Your cart is empty.</p>
        <Link to="/shop" style={{ ...sans, fontSize: 13, color: GREEN, fontWeight: 700 }}>
          ← Back to shop
        </Link>
      </div>
    );
  }

  const canPay = !submitting && !hasMixedCurrency;

  return (
    <div style={{ background: BG, minHeight: '100vh', padding: '48px 24px' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>

        <Link to="/shop" style={{ ...sans, fontSize: 12, color: 'rgba(20,35,26,0.5)',
          textDecoration: 'none', marginBottom: 24, display: 'inline-block' }}>
          ← Continue shopping
        </Link>

        <h1 style={{ ...serif, fontSize: 36, color: INK, fontWeight: 500, marginBottom: 32 }}>
          Checkout
        </h1>

        {/* Le blocage arrive AVANT le formulaire, pas après l'avoir rempli. */}
        {hasMixedCurrency && (
          <div style={{ background: 'rgba(160,59,46,0.06)', border: `1px solid ${RUST}44`,
            borderLeft: `3px solid ${RUST}`, borderRadius: 12, padding: '18px 22px', marginBottom: 28 }}>
            <div style={{ ...sans, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase',
              color: RUST, marginBottom: 6 }}>
              One currency per order
            </div>
            <p style={{ ...sans, fontSize: 14, color: 'rgba(20,35,26,0.7)', margin: 0, lineHeight: 1.6 }}>
              Your cart mixes {currencies.join(' and ')}. Remove the lots of one
              currency and place a separate order for them.
            </p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 48, alignItems: 'start' }}>

          {/* ── Récapitulatif ─────────────────────────────────────────── */}
          <div>
            <div style={{ ...labelStyle, marginBottom: 16, fontSize: 12 }}>Order summary</div>
            <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
              {items.map((item, i) => (
                <CartLine key={item.product_id} item={item} first={i === 0} />
              ))}

              <div style={{ padding: '16px 18px', borderTop: `1px solid ${BORDER}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ ...sans, fontSize: 13, color: 'rgba(20,35,26,0.6)' }}>Total</span>
                <span style={{ ...mono, fontSize: 20, color: INK }}>
                  {fmt(totalAmount, 2)} {currency}
                </span>
              </div>
            </div>
          </div>

          {/* ── Formulaire ────────────────────────────────────────────── */}
          <div>
            <div style={{ ...labelStyle, marginBottom: 16, fontSize: 12 }}>Delivery details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div>
                <label style={labelStyle}>Full name *</label>
                <input style={inputStyle} value={form.guest_name} placeholder="Jane Doe"
                  onChange={e => setForm({ ...form, guest_name: e.target.value })}/>
                {errors.guest_name && <p style={{ ...sans, color: RUST, fontSize: 12, marginTop: 4 }}>{errors.guest_name}</p>}
              </div>

              <div>
                <label style={labelStyle}>Phone number *</label>
                <input style={inputStyle} value={form.phone_number} placeholder="+256 7XX XXX XXX"
                  onChange={e => setForm({ ...form, phone_number: e.target.value })}/>
                {errors.phone_number && <p style={{ ...sans, color: RUST, fontSize: 12, marginTop: 4 }}>{errors.phone_number}</p>}
              </div>

              <div>
                <label style={labelStyle}>Email (optional)</label>
                <input style={inputStyle} type="email" value={form.email} placeholder="jane@example.com"
                  onChange={e => setForm({ ...form, email: e.target.value })}/>
              </div>

              <div>
                <label style={labelStyle}>Shipping address *</label>
                <textarea rows={3} style={{ ...inputStyle, resize: 'none' }} value={form.shipping_address}
                  placeholder="Street, city, district"
                  onChange={e => setForm({ ...form, shipping_address: e.target.value })}/>
                {errors.shipping_address && <p style={{ ...sans, color: RUST, fontSize: 12, marginTop: 4 }}>{errors.shipping_address}</p>}
              </div>

              <button onClick={handleSubmit} disabled={!canPay}
                style={{
                  ...sans, width: '100%', padding: '15px', borderRadius: 100, border: 'none',
                  background: canPay ? GREEN : 'rgba(20,35,26,0.12)',
                  color: canPay ? BG : 'rgba(20,35,26,0.4)',
                  fontWeight: 700, fontSize: 14,
                  cursor: canPay ? 'pointer' : 'not-allowed', marginTop: 8,
                }}>
                {submitting
                  ? 'Redirecting to payment…'
                  : hasMixedCurrency
                    ? 'One currency per order'
                    : `Pay ${fmt(totalAmount, 2)} ${currency}`}
              </button>

              <p style={{ ...sans, fontSize: 11.5, color: 'rgba(20,35,26,0.4)', textAlign: 'center' }}>
                Secure payment via DPO. You'll be redirected to complete the transaction.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;