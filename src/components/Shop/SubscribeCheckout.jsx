import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../axiosInstance';
import PaymentModal from '../Payment/PaymentModal';
import { subscriptionCheckoutProvider } from '../Payment/paymentProviders';
import { clearPaymentReturn } from '../../utils/paymentReturn';

// =============================================================================
//  src/components/Shop/SubscribeCheckout.jsx — NOUVEAU
//  Route : /shop/subscribe/:id?qty=<kg>&weeks=<1|2|3>
//
//  Formulaire de livraison + paiement de la 1re livraison. Même logique que
//  CheckoutPage : la carte (DPO) s'ouvre dans cet onglet puis revient ici
//  (?paid=<token> ou ?payment=cancelled). Quantité, fréquence, formulaire et
//  abonnement déjà créé survivent à l'aller-retour (sessionStorage).
// =============================================================================

const BG = '#f7f4ee';
const INK = '#14231a';
const GREEN = '#16803c';
const SAND = '#eee9de';
const RUST = '#a03b2e';
const BORDER = 'rgba(20,35,26,0.12)';

const mono = { fontFamily: "'JetBrains Mono', monospace" };
const sans = { fontFamily: "'Epilogue', sans-serif" };
const serif = { fontFamily: "'Cormorant Garamond', serif" };

const RESUME_POLL_MS = 4000;
const RESUME_MAX_MS = 3 * 60 * 1000;
const EMPTY_FORM = { guest_name: '', email: '', phone_number: '', shipping_address: '' };

const fmt = (n, min = 0) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: min, maximumFractionDigits: 3 });
const everyLabel = (w) => (Number(w) === 1 ? 'every week' : `every ${w} weeks`);

const labelStyle = {
  ...sans, fontSize: 11, letterSpacing: 1.5, color: 'rgba(20,35,26,0.5)',
  textTransform: 'uppercase', marginBottom: 6, display: 'block',
};
const inputStyle = {
  ...sans, width: '100%', padding: '12px 14px', borderRadius: 10, outline: 'none',
  border: `1px solid ${BORDER}`, fontSize: 14, color: INK, background: '#fff',
};

const readReturn = () => {
  const params = new URLSearchParams(window.location.search);
  const paid = params.get('paid');
  const cancelled = params.get('payment') === 'cancelled';
  if (paid || cancelled) window.history.replaceState(null, '', window.location.pathname);
  return paid ? { token: paid } : cancelled ? { cancelled: true } : null;
};

const loadSaved = (key) => {
  try { return JSON.parse(sessionStorage.getItem(key) || '{}'); } catch { return {}; }
};

const Row = ({ label, children }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '10px 0',
    borderTop: `1px solid ${BORDER}` }}>
    <span style={{ ...sans, fontSize: 13, color: 'rgba(20,35,26,0.55)' }}>{label}</span>
    <span style={{ ...mono, fontSize: 13.5, color: INK, textAlign: 'right' }}>{children}</span>
  </div>
);

export default function SubscribeCheckout() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const storeKey = `sub_checkout_${id}`;
  const [saved] = useState(() => loadSaved(storeKey));

  const [qty] = useState(() => Number(searchParams.get('qty')) || saved.qty || null);
  const [weeks] = useState(() => Number(searchParams.get('weeks')) || saved.weeks || 2);
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, ...(saved.form || {}) }));
  const createdRef = useRef(saved.created || null);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);
  const [doneUrl, setDoneUrl] = useState(null);
  const [paymentReturn] = useState(readReturn);
  const [resumeStatus, setResumeStatus] = useState(
    paymentReturn?.token ? 'confirming' : paymentReturn?.cancelled ? 'cancelled' : null);

  const persist = (extra = {}) => {
    try {
      sessionStorage.setItem(storeKey, JSON.stringify({
        qty, weeks, form, created: createdRef.current, ...extra,
      }));
    } catch { /* stockage indisponible */ }
  };

  useEffect(() => { persist(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [form]);

  useEffect(() => {
    axiosInstance.get(`/api/ecommerce/products/${id}`)
      .then(res => setProduct(res.data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const finish = () => {
    clearPaymentReturn();
    setDoneUrl(createdRef.current?.manage_url
      || (createdRef.current?.manage_token && `/shop/subscription/${createdRef.current.manage_token}`)
      || null);
    try { sessionStorage.removeItem(storeKey); } catch { /* stockage indisponible */ }
    setResumeStatus(null);
    setDone(true);
  };

  // Retour de DPO : on confirme le paiement de la 1re livraison.
  useEffect(() => {
    if (!paymentReturn?.token) return;
    let stopped = false;
    const started = Date.now();
    const check = async () => {
      if (stopped) return;
      let data = null;
      try {
        data = (await axiosInstance.get(`/api/ecommerce/checkout/verify/${paymentReturn.token}`)).data;
      } catch (err) {
        console.warn('[Subscribe] payment check failed, retrying', err);
      }
      if (stopped) return;
      if (data?.status === 'paid') finish();
      else if (data?.status === 'failed') { clearPaymentReturn(); setResumeStatus('failed'); }
      else if (Date.now() - started > RESUME_MAX_MS) setResumeStatus('timeout');
      else setTimeout(check, RESUME_POLL_MS);
    };
    check();
    return () => { stopped = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const provider = useMemo(() => subscriptionCheckoutProvider(
    {
      product_id: Number(id),
      quantity_kg: qty,
      frequency_weeks: weeks,
      guest_name: form.guest_name,
      email: form.email,
      shipping_address: form.shipping_address,
    },
    createdRef,
    (created) => { createdRef.current = created; persist({ created }); },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [id, qty, weeks, form]);

  const validate = () => {
    const e = {};
    if (!form.guest_name.trim())       e.guest_name = 'Name is required';
    if (!form.phone_number.trim())     e.phone_number = 'Phone number is required';
    if (!form.shipping_address.trim()) e.shipping_address = 'Shipping address is required';
    return e;
  };

  const handleSubmit = () => {
    const errs = validate();
    setErrors(errs);
    if (!Object.keys(errs).length) setPaying(true);
  };

  // ── États particuliers ─────────────────────────────────────────────────
  const centered = { background: BG, minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24, textAlign: 'center' };

  if (done) {
    const internal = doneUrl && doneUrl.includes('/shop/subscription/')
      ? doneUrl.slice(doneUrl.indexOf('/shop/subscription/')) : null;
    return (
      <div style={centered}>
        <h1 style={{ ...serif, fontSize: 36, color: INK, fontWeight: 500, margin: 0 }}>
          Your subscription is active
        </h1>
        <p style={{ ...sans, color: 'rgba(20,35,26,0.6)', maxWidth: 440, lineHeight: 1.6 }}>
          Your first delivery is paid. Before each next delivery, you will receive an SMS
          on <strong>{form.phone_number}</strong> with a link to pay it.
        </p>
        {internal && (
          <Link to={internal} style={{ ...sans, fontSize: 14, color: GREEN, fontWeight: 700 }}>
            Manage my subscription →
          </Link>
        )}
        <Link to="/shop" style={{ ...sans, fontSize: 13, color: 'rgba(20,35,26,0.5)' }}>
          ← Back to shop
        </Link>
      </div>
    );
  }

  if (resumeStatus === 'confirming') {
    return (
      <div style={centered}>
        <h1 style={{ ...serif, fontSize: 30, color: INK, fontWeight: 500, margin: 0 }}>
          Confirming your payment…
        </h1>
        <p style={{ ...sans, color: 'rgba(20,35,26,0.6)', maxWidth: 420, lineHeight: 1.6 }}>
          DPO is confirming your payment. This page updates by itself, please keep it open.
        </p>
      </div>
    );
  }

  if (loading) return <div style={{ background: BG, minHeight: '100vh' }} aria-busy="true" />;

  if (!product || !qty) {
    return (
      <div style={centered}>
        <p style={{ ...sans, color: 'rgba(20,35,26,0.5)' }}>This subscription link is not valid anymore.</p>
        <Link to="/shop" style={{ ...sans, fontSize: 13, color: GREEN, fontWeight: 700 }}>← Back to shop</Link>
      </div>
    );
  }

  const deliveryTotal = qty * product.price;

  return (
    <div style={{ background: BG, minHeight: '100vh', padding: '48px 24px' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>

        <Link to={`/shop/${product.id}`} style={{ ...sans, fontSize: 12, color: 'rgba(20,35,26,0.5)',
          textDecoration: 'none', marginBottom: 24, display: 'inline-block' }}>
          ← Back to product
        </Link>

        <h1 style={{ ...serif, fontSize: 36, color: INK, fontWeight: 500, marginBottom: 32 }}>
          Your delivery subscription
        </h1>

        {resumeStatus && (
          <div style={{ ...sans, fontSize: 13, lineHeight: 1.5, padding: '12px 16px', borderRadius: 10, marginBottom: 24,
            background: resumeStatus === 'cancelled' ? '#fdf6e3' : '#fdecea',
            border: `1px solid ${resumeStatus === 'cancelled' ? '#e9d8a6' : '#f5c2c0'}`, color: INK }}>
            {resumeStatus === 'cancelled' && 'Payment cancelled: nothing was charged. You can try again.'}
            {resumeStatus === 'failed' && 'The payment was declined or cancelled. No money was taken. You can try again.'}
            {resumeStatus === 'timeout' && 'DPO has not confirmed your payment yet. If you were charged, we will contact you; otherwise you can try again.'}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 48, alignItems: 'start' }}>

          {/* ── Récapitulatif ─────────────────────────────────────────── */}
          <div>
            <div style={{ ...labelStyle, marginBottom: 16, fontSize: 12 }}>Subscription summary</div>
            <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: '18px 20px' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
                <div style={{ width: 56, height: 56, borderRadius: 8, background: SAND, overflow: 'hidden', flexShrink: 0 }}>
                  {product.images?.[0] && (
                    <img src={product.images[0]} alt={product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
                <div style={{ ...sans, fontSize: 15, color: INK, fontWeight: 600 }}>{product.name}</div>
              </div>

              <Row label="Quantity per delivery">{fmt(qty)} kg</Row>
              <Row label="Frequency">{everyLabel(weeks)}</Row>
              <Row label="Price">{fmt(product.price, 2)} {product.currency} / kg</Row>
              <Row label="Each delivery">{fmt(deliveryTotal, 2)} {product.currency}</Row>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
                <span style={{ ...sans, fontSize: 13, color: 'rgba(20,35,26,0.6)' }}>To pay today</span>
                <span style={{ ...mono, fontSize: 20, color: INK }}>{fmt(deliveryTotal, 2)} {product.currency}</span>
              </div>
            </div>

            <p style={{ ...sans, fontSize: 12.5, color: 'rgba(20,35,26,0.55)', lineHeight: 1.6, marginTop: 14 }}>
              Today you pay the first delivery. Before each next delivery, you receive an SMS
              with a link to pay it at the current price. Pause or cancel anytime from that link.
            </p>
          </div>

          {/* ── Formulaire ────────────────────────────────────────────── */}
          <div>
            <div style={{ ...labelStyle, marginBottom: 16, fontSize: 12 }}>Delivery details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Full name *</label>
                <input style={inputStyle} value={form.guest_name} placeholder="Jane Doe"
                  onChange={e => setForm({ ...form, guest_name: e.target.value })} />
                {errors.guest_name && <p style={{ ...sans, color: RUST, fontSize: 12, marginTop: 4 }}>{errors.guest_name}</p>}
              </div>

              <div>
                <label style={labelStyle}>Phone number * (for delivery SMS)</label>
                <input style={inputStyle} value={form.phone_number} placeholder="+256 7XX XXX XXX"
                  onChange={e => setForm({ ...form, phone_number: e.target.value })} />
                {errors.phone_number && <p style={{ ...sans, color: RUST, fontSize: 12, marginTop: 4 }}>{errors.phone_number}</p>}
              </div>

              <div>
                <label style={labelStyle}>Email (optional)</label>
                <input style={inputStyle} type="email" value={form.email} placeholder="jane@example.com"
                  onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>

              <div>
                <label style={labelStyle}>Shipping address *</label>
                <textarea rows={3} style={{ ...inputStyle, resize: 'none' }} value={form.shipping_address}
                  placeholder="Street, city, district"
                  onChange={e => setForm({ ...form, shipping_address: e.target.value })} />
                {errors.shipping_address && <p style={{ ...sans, color: RUST, fontSize: 12, marginTop: 4 }}>{errors.shipping_address}</p>}
              </div>

              <button onClick={handleSubmit}
                style={{ ...sans, width: '100%', padding: '15px', borderRadius: 100, border: 'none',
                  background: GREEN, color: BG, fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 8 }}>
                Subscribe and pay first delivery · {fmt(deliveryTotal, 2)} {product.currency}
              </button>
            </div>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={paying}
        onClose={() => setPaying(false)}
        title={`Subscription · ${fmt(qty)} kg ${product.name}, ${everyLabel(weeks)}`}
        note="First delivery"
        prices={{ [product.currency]: deliveryTotal }}
        defaultCurrency={product.currency}
        returnPath={`/shop/subscribe/${id}`}
        phone={form.phone_number}
        email={form.email}
        provider={provider}
        onSuccess={finish}
      />
    </div>
  );
}