import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';

// ── Tokens (identiques à ProductDetail / OurStory, thème clair) ───────────
const BG = '#f7f4ee';
const INK = '#14231a';
const GREEN = '#16803c';
const CLAY = '#a9784f';
const BORDER = 'rgba(20,35,26,0.12)';

const labelStyle = {
  fontFamily: "'Epilogue', sans-serif", fontSize: 11, letterSpacing: 1.5,
  color: 'rgba(20,35,26,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block',
};
const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 10, outline: 'none',
  border: `1px solid ${BORDER}`, fontFamily: "'Epilogue', sans-serif", fontSize: 14,
  color: INK, background: '#fff',
};

const CheckoutPage = () => {
  const { items, updateQuantity, removeItem, totalAmount, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ guest_name: '', email: '', phone_number: '', shipping_address: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const currency = items[0]?.currency || 'UGX';

  const validate = () => {
    const e = {};
    if (!form.guest_name.trim())      e.guest_name = 'Name is required';
    if (!form.phone_number.trim())    e.phone_number = 'Phone number is required';
    if (!form.shipping_address.trim()) e.shipping_address = 'Shipping address is required';
    return e;
  };

  const handleSubmit = async () => {
    if (items.length === 0) return;
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
        // On garde le panier jusqu'à confirmation du paiement (au cas où
        // l'utilisateur annule et revient) — il sera vidé sur la page succès.
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
        <p style={{ fontFamily: "'Epilogue', sans-serif", color: 'rgba(20,35,26,0.5)' }}>
          Your cart is empty.
        </p>
        <Link to="/shop" style={{
          fontFamily: "'Epilogue', sans-serif", fontSize: 13, color: GREEN, fontWeight: 700,
        }}>
          ← Back to shop
        </Link>
      </div>
    );
  }

  return (
    <div style={{ background: BG, minHeight: '100vh', padding: '48px 24px' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <Link to="/shop" style={{
          fontFamily: "'Epilogue', sans-serif", fontSize: 12, color: 'rgba(20,35,26,0.5)',
          textDecoration: 'none', marginBottom: 24, display: 'inline-block',
        }}>
          ← Continue shopping
        </Link>

        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: INK,
          fontWeight: 500, marginBottom: 32,
        }}>
          Checkout
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>

          {/* ── Récapitulatif panier ─────────────────────────────────── */}
          <div>
            <div style={{ ...labelStyle, marginBottom: 16, fontSize: 12 }}>Order summary</div>
            <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
              {items.map((item, i) => (
                <div key={item.product_id} style={{
                  display: 'flex', gap: 14, padding: '16px 18px',
                  borderTop: i === 0 ? 'none' : `1px solid ${BORDER}`,
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 8, background: '#eee9de',
                    flexShrink: 0, overflow: 'hidden', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {item.image
                      ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 10, color: 'rgba(20,35,26,0.3)' }}>No image</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Epilogue', sans-serif", fontSize: 14, color: INK, fontWeight: 600 }}>
                      {item.name}
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: 'rgba(20,35,26,0.55)', margin: '4px 0 8px' }}>
                      {item.price.toLocaleString()} {item.currency} / {item.unit}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${BORDER}`, borderRadius: 100 }}>
                        <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          style={{ padding: '4px 10px', background: 'none', border: 'none', cursor: 'pointer', color: INK }}>−</button>
                        <span style={{ fontFamily: "'Epilogue', sans-serif", fontSize: 12.5, padding: '0 8px', color: INK }}>
                          {item.quantity}
                        </span>
                        <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          style={{ padding: '4px 10px', background: 'none', border: 'none', cursor: 'pointer', color: INK }}>+</button>
                      </div>
                      <button onClick={() => removeItem(item.product_id)}
                        style={{
                          fontFamily: "'Epilogue', sans-serif", fontSize: 11.5, color: '#a03b2e',
                          background: 'none', border: 'none', cursor: 'pointer',
                        }}>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div style={{
                padding: '16px 18px', borderTop: `1px solid ${BORDER}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontFamily: "'Epilogue', sans-serif", fontSize: 13, color: 'rgba(20,35,26,0.6)' }}>
                  Total
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, color: INK }}>
                  {totalAmount.toLocaleString()} {currency}
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
                <input style={inputStyle} value={form.guest_name}
                  onChange={e => setForm({ ...form, guest_name: e.target.value })} placeholder="Jane Doe" />
                {errors.guest_name && <p style={{ color: '#a03b2e', fontSize: 12, marginTop: 4 }}>{errors.guest_name}</p>}
              </div>
              <div>
                <label style={labelStyle}>Phone number *</label>
                <input style={inputStyle} value={form.phone_number}
                  onChange={e => setForm({ ...form, phone_number: e.target.value })} placeholder="+256 7XX XXX XXX" />
                {errors.phone_number && <p style={{ color: '#a03b2e', fontSize: 12, marginTop: 4 }}>{errors.phone_number}</p>}
              </div>
              <div>
                <label style={labelStyle}>Email (optional)</label>
                <input style={inputStyle} type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@example.com" />
              </div>
              <div>
                <label style={labelStyle}>Shipping address *</label>
                <textarea rows={3} style={{ ...inputStyle, resize: 'none' }} value={form.shipping_address}
                  onChange={e => setForm({ ...form, shipping_address: e.target.value })}
                  placeholder="Street, city, district" />
                {errors.shipping_address && <p style={{ color: '#a03b2e', fontSize: 12, marginTop: 4 }}>{errors.shipping_address}</p>}
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  width: '100%', padding: '15px', borderRadius: 100, border: 'none',
                  background: submitting ? 'rgba(22,128,60,0.5)' : GREEN,
                  color: '#f7f4ee', fontFamily: "'Epilogue', sans-serif", fontWeight: 700,
                  fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer', marginTop: 8,
                }}
              >
                {submitting ? 'Redirecting to payment…' : `Pay ${totalAmount.toLocaleString()} ${currency}`}
              </button>
              <p style={{ fontFamily: "'Epilogue', sans-serif", fontSize: 11.5, color: 'rgba(20,35,26,0.4)', textAlign: 'center' }}>
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