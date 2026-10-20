import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import axiosInstance from '../../axiosInstance';
import PaymentModal from '../Payment/PaymentModal';
import { subscriptionDeliveryProvider } from '../Payment/paymentProviders';
import { clearPaymentReturn } from '../../utils/paymentReturn';

// =============================================================================
//  src/components/Shop/MySubscription.jsx — NOUVEAU
//  Route : /shop/subscription/:token   (le lien envoyé par SMS)
//
//  Le client y voit son abonnement, paie une livraison en attente, met en
//  pause, reprend ou annule. Pas besoin de compte : le token fait office de clé.
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
const UNPAID = ['pending', 'payment_failed'];

const fmt = (n, min = 0) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: min, maximumFractionDigits: 3 });
const everyLabel = (w) => (Number(w) === 1 ? 'every week' : `every ${w} weeks`);
const dateLabel = (iso) => (iso
  ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  : '—');

const SUB_STATUS = {
  pending:   { label: 'Waiting for first payment', color: '#a16207', bg: '#fef9c3' },
  active:    { label: 'Active',    color: GREEN,     bg: 'rgba(22,128,60,0.1)' },
  paused:    { label: 'Paused',    color: '#475569', bg: '#e2e8f0' },
  cancelled: { label: 'Cancelled', color: RUST,      bg: 'rgba(160,59,46,0.1)' },
};
const ORDER_STATUS = {
  pending: 'To pay', payment_failed: 'Payment failed', paid: 'Paid',
  shipped: 'On the way', delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded',
};

const readReturn = () => {
  const params = new URLSearchParams(window.location.search);
  const paid = params.get('paid');
  const cancelled = params.get('payment') === 'cancelled';
  if (paid || cancelled) window.history.replaceState(null, '', window.location.pathname);
  return paid ? { token: paid } : cancelled ? { cancelled: true } : null;
};

const Badge = ({ status }) => {
  const s = SUB_STATUS[status] || { label: status, color: INK, bg: SAND };
  return (
    <span style={{ ...sans, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
      padding: '5px 12px', borderRadius: 100, color: s.color, background: s.bg }}>
      {s.label}
    </span>
  );
};

const Row = ({ label, children }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '10px 0',
    borderTop: `1px solid ${BORDER}` }}>
    <span style={{ ...sans, fontSize: 13, color: 'rgba(20,35,26,0.55)' }}>{label}</span>
    <span style={{ ...mono, fontSize: 13.5, color: INK, textAlign: 'right' }}>{children}</span>
  </div>
);

const actionBtn = (primary) => ({
  ...sans, padding: '11px 20px', borderRadius: 100, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  border: primary ? 'none' : `1px solid ${BORDER}`,
  background: primary ? GREEN : 'transparent', color: primary ? BG : INK,
});

export default function MySubscription() {
  const { token } = useParams();
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [payOrder, setPayOrder] = useState(null);
  const [paymentReturn] = useState(readReturn);
  const [resumeStatus, setResumeStatus] = useState(
    paymentReturn?.token ? 'confirming' : paymentReturn?.cancelled ? 'cancelled' : null);

  const load = useCallback(() => (
    axiosInstance.get(`/api/subscriptions/manage/${token}`)
      .then(res => { setSub(res.data); setNotFound(false); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  ), [token]);

  useEffect(() => { load(); }, [load]);

  // Retour de DPO après le paiement d'une livraison.
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
        console.warn('[MySubscription] payment check failed, retrying', err);
      }
      if (stopped) return;
      if (data?.status === 'paid') {
        clearPaymentReturn();
        setResumeStatus('paid');
        load();
      } else if (data?.status === 'failed') {
        clearPaymentReturn();
        setResumeStatus('failed');
      } else if (Date.now() - started > RESUME_MAX_MS) {
        setResumeStatus('timeout');
      } else {
        setTimeout(check, RESUME_POLL_MS);
      }
    };
    check();
    return () => { stopped = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const provider = useMemo(
    () => (payOrder ? subscriptionDeliveryProvider(token, payOrder.order_id) : {}),
    [token, payOrder],
  );

  const runAction = async (action) => {
    const texts = {
      pause:  ['Pause your subscription?', 'No new delivery will be prepared until you resume.', 'Pause'],
      resume: ['Resume your subscription?', 'Your next delivery will be prepared again.', 'Resume'],
      cancel: ['Cancel your subscription?', 'Deliveries not yet paid will be cancelled. This cannot be undone.', 'Cancel subscription'],
    }[action];
    const ok = await Swal.fire({
      title: texts[0], text: texts[1], icon: action === 'cancel' ? 'warning' : 'question',
      showCancelButton: true, confirmButtonText: texts[2], cancelButtonText: 'Back',
      confirmButtonColor: action === 'cancel' ? RUST : GREEN,
    });
    if (!ok.isConfirmed) return;

    setBusy(true);
    try {
      const res = await axiosInstance.post(`/api/subscriptions/manage/${token}/${action}`);
      setSub(res.data.subscription);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Something went wrong',
        text: err?.response?.data?.error || 'Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  const centered = { background: BG, minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24, textAlign: 'center' };

  if (loading) return <div style={{ background: BG, minHeight: '100vh' }} aria-busy="true" />;

  if (notFound || !sub) {
    return (
      <div style={centered}>
        <p style={{ ...serif, fontSize: 24, color: INK }}>This subscription link is not valid.</p>
        <Link to="/shop" style={{ ...sans, fontSize: 13, color: GREEN, fontWeight: 700 }}>← Back to shop</Link>
      </div>
    );
  }

  const unpaid = (sub.orders || []).filter(o => UNPAID.includes(o.status));
  const canPay = sub.status !== 'cancelled';

  return (
    <div style={{ background: BG, minHeight: '100vh', padding: '48px 24px 96px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        <Link to="/shop" style={{ ...sans, fontSize: 12, color: 'rgba(20,35,26,0.5)',
          textDecoration: 'none', marginBottom: 24, display: 'inline-block' }}>
          ← Shop
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
          <h1 style={{ ...serif, fontSize: 36, color: INK, fontWeight: 500, margin: 0 }}>
            My subscription
          </h1>
          <Badge status={sub.status} />
        </div>

        {resumeStatus && resumeStatus !== 'confirming' && (
          <div style={{ ...sans, fontSize: 13, lineHeight: 1.5, padding: '12px 16px', borderRadius: 10, marginBottom: 24,
            background: resumeStatus === 'paid' ? 'rgba(22,128,60,0.08)' : resumeStatus === 'cancelled' ? '#fdf6e3' : '#fdecea',
            border: `1px solid ${resumeStatus === 'paid' ? 'rgba(22,128,60,0.3)' : resumeStatus === 'cancelled' ? '#e9d8a6' : '#f5c2c0'}`,
            color: INK }}>
            {resumeStatus === 'paid' && 'Payment confirmed, thank you! Your delivery is being prepared.'}
            {resumeStatus === 'cancelled' && 'Payment cancelled: nothing was charged. You can try again.'}
            {resumeStatus === 'failed' && 'The payment was declined or cancelled. No money was taken. You can try again.'}
            {resumeStatus === 'timeout' && 'DPO has not confirmed your payment yet. If you were charged, we will contact you.'}
          </div>
        )}
        {resumeStatus === 'confirming' && (
          <p style={{ ...sans, fontSize: 13, color: 'rgba(20,35,26,0.6)', marginBottom: 24 }}>
            Confirming your payment… this page updates by itself.
          </p>
        )}

        {/* ── Livraisons à payer ─────────────────────────────────────── */}
        {canPay && unpaid.map(o => (
          <div key={o.order_id} style={{ background: '#fff', border: `1px solid ${GREEN}55`,
            borderLeft: `3px solid ${GREEN}`, borderRadius: 12, padding: '16px 20px', marginBottom: 16,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ ...sans, fontSize: 14, color: INK, fontWeight: 600 }}>
                Delivery of {dateLabel(o.delivery_date)} is ready
              </div>
              <div style={{ ...mono, fontSize: 13, color: 'rgba(20,35,26,0.6)', marginTop: 4 }}>
                {fmt(o.total_amount, 2)} {sub.currency}
                {o.status === 'payment_failed' && ' · last payment failed'}
              </div>
            </div>
            <button style={actionBtn(true)} onClick={() => setPayOrder(o)}>Pay now</button>
          </div>
        ))}

        {/* ── Détails ────────────────────────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: '18px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 8, background: SAND, overflow: 'hidden', flexShrink: 0 }}>
              {sub.product_image && (
                <img src={sub.product_image} alt={sub.product_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>
            <div style={{ ...sans, fontSize: 15, color: INK, fontWeight: 600 }}>{sub.product_name}</div>
          </div>
          <Row label="Quantity per delivery">{fmt(sub.quantity_kg)} kg</Row>
          <Row label="Frequency">{everyLabel(sub.frequency_weeks)}</Row>
          <Row label="Current price">{fmt(sub.unit_price, 2)} {sub.currency} / kg</Row>
          <Row label="Next delivery">
            {sub.status === 'active' ? dateLabel(sub.next_delivery_date) : '—'}
          </Row>
          <Row label="Shipping address">{sub.shipping_address}</Row>
        </div>

        {/* ── Actions ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 36 }}>
          {sub.status === 'active' && (
            <button style={actionBtn(false)} disabled={busy} onClick={() => runAction('pause')}>Pause</button>
          )}
          {sub.status === 'paused' && (
            <button style={actionBtn(true)} disabled={busy} onClick={() => runAction('resume')}>Resume</button>
          )}
          {sub.status !== 'cancelled' && (
            <button style={{ ...actionBtn(false), color: RUST }} disabled={busy}
              onClick={() => runAction('cancel')}>
              Cancel subscription
            </button>
          )}
        </div>

        {/* ── Historique ─────────────────────────────────────────────── */}
        <div style={{ ...sans, fontSize: 11, letterSpacing: 1.5, color: 'rgba(20,35,26,0.5)',
          textTransform: 'uppercase', marginBottom: 12 }}>
          Deliveries
        </div>
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
          {(sub.orders || []).length === 0 && (
            <p style={{ ...sans, fontSize: 13, color: 'rgba(20,35,26,0.5)', padding: '16px 20px', margin: 0 }}>
              No delivery yet.
            </p>
          )}
          {(sub.orders || []).map((o, i) => (
            <div key={o.order_id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12,
              padding: '14px 20px', borderTop: i === 0 ? 'none' : `1px solid ${BORDER}` }}>
              <span style={{ ...sans, fontSize: 13.5, color: INK }}>{dateLabel(o.delivery_date)}</span>
              <span style={{ ...sans, fontSize: 12.5, color: 'rgba(20,35,26,0.6)' }}>
                {ORDER_STATUS[o.status] || o.status}
              </span>
              <span style={{ ...mono, fontSize: 13, color: INK }}>{fmt(o.total_amount, 2)} {sub.currency}</span>
            </div>
          ))}
        </div>
      </div>

      <PaymentModal
        isOpen={!!payOrder}
        onClose={() => setPayOrder(null)}
        title={`Delivery of ${payOrder ? dateLabel(payOrder.delivery_date) : ''} · ${fmt(sub.quantity_kg)} kg ${sub.product_name}`}
        prices={payOrder ? { [sub.currency]: payOrder.total_amount } : null}
        defaultCurrency={sub.currency}
        returnPath={`/shop/subscription/${token}`}
        provider={provider}
        onSuccess={() => { setResumeStatus('paid'); load(); }}
      />
    </div>
  );
}