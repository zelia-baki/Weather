// ── PUBLIC RECEIPT VERIFICATION ───────────────────────────────────────────────
// Where the QR code on a warehouse receipt lands. No account, no token.
//
// ★ MODIFIÉ — deux niveaux :
//   · GRATUIT : authentique ou non, statut, marchandise, entrepôt.
//   · PAYANT  : grade, mesures, poids, déposant, fermes d'origine. Le paiement
//               (Mobile Money ou DPO) débloque CE reçu pour la durée configurée
//               dans l'écran Features (FeaturePrice 'receipt_verification').
//   La clé d'accès est gardée dans ce navigateur : revenir ne fait pas repayer.
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, ShieldAlert, Search, Loader2, Warehouse, Scale, Lock, Sprout } from 'lucide-react';
import PaymentModal from '../Payment/PaymentModal';
import { clearPaymentReturn } from '../../utils/paymentReturn';
import { BRAND } from '../../brand';

// Deliberately NOT axiosInstance: this page must work for someone who has never
// signed in, and the instance attaches a token and may redirect on 401.
const API = import.meta.env.VITE_API_BASE_URL || '';

const BG = '#f7f4ee';
const INK = '#14231a';
const GREEN = '#16803c';
const CLAY = '#a9784f';
const RUST = '#a03b2e';

const sans = { fontFamily: "'Epilogue', sans-serif" };
const serif = { fontFamily: "'Cormorant Garamond', serif" };
const mono = { fontFamily: "'JetBrains Mono', monospace" };

const fmt = (n) =>
  Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 3 });

const STATUS_META = {
  issued:             { label: 'Valid — goods held',      tone: 'ok' },
  pledged:            { label: 'Pledged as collateral',   tone: 'warn' },
  partially_released: { label: 'Partially released',      tone: 'warn' },
  released:           { label: 'Released — goods collected', tone: 'off' },
  sold:               { label: 'Sold',                    tone: 'off' },
  cancelled:          { label: 'Cancelled',               tone: 'bad' },
};

const TONES = {
  ok:   { bg: 'rgba(22,128,60,0.08)',  border: GREEN, color: GREEN },
  warn: { bg: 'rgba(169,120,79,0.1)',  border: CLAY,  color: CLAY },
  off:  { bg: 'rgba(20,35,26,0.06)',   border: 'rgba(20,35,26,0.25)', color: 'rgba(20,35,26,0.6)' },
  bad:  { bg: 'rgba(160,59,46,0.08)',  border: RUST,  color: RUST },
};

// ── Clé d'accès payée, par reçu, dans ce navigateur ──────────────────────────
const keyName = (serial) => `wrv_access_${serial}`;
const loadKey = (serial) => { try { return localStorage.getItem(keyName(serial)); } catch { return null; } };
const saveKey = (serial, key) => { try { localStorage.setItem(keyName(serial), key); } catch { /* indisponible */ } };
const dropKey = (serial) => { try { localStorage.removeItem(keyName(serial)); } catch { /* indisponible */ } };

const readPaidParam = () => {
  const params = new URLSearchParams(window.location.search);
  const paid = params.get('paid');
  if (paid || params.get('payment')) window.history.replaceState(null, '', window.location.pathname);
  return paid;
};

// ── Provider pour PaymentModal : paiement rattaché à CE reçu ─────────────────
const receiptVerificationProvider = (serial, onKey) => {
  const start = async (payment_method, { phone, email, currency }) => {
    const { data } = await axios.post(`${API}/api/receipts/verify/${encodeURIComponent(serial)}/pay`,
      { payment_method, phone_number: phone, email, currency });
    if (!data?.success) throw new Error(data?.error || 'Payment could not be started');
    onKey(data.access_key);
    return data;
  };
  return {
    mobileMoneyCurrencies: ['UGX'],
    async startMobileMoney(args) {
      const data = await start('mobile_money', args);
      return { ref: data.txn_id, message: data.msg };
    },
    async checkMobileMoney(txnId) {
      return (await axios.get(`${API}/api/payments/status/${encodeURIComponent(txnId)}`)).data?.status;
    },
    async startCard(args) {
      const data = await start('dpo', args);
      return { url: data.payment_url, ref: data.trans_token };
    },
    async checkCard(token) {
      return (await axios.get(`${API}/api/payments/dpo/verify/${encodeURIComponent(token)}`)).data?.status;
    },
  };
};

const Row = ({ label, value, strong }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20,
    padding: '11px 0', borderBottom: '1px solid rgba(20,35,26,0.08)' }}>
    <span style={{ ...sans, fontSize: 12, letterSpacing: 0.4, color: 'rgba(20,35,26,0.5)',
      textTransform: 'uppercase' }}>{label}</span>
    <span style={{ ...sans, fontSize: 14, color: INK, textAlign: 'right',
      fontWeight: strong ? 700 : 400 }}>{value ?? '—'}</span>
  </div>
);

const SectionTitle = ({ icon, children, first }) => (
  <h3 style={{ ...sans, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
    color: CLAY, fontWeight: 700, margin: first ? '0 0 6px' : '26px 0 6px',
    display: 'flex', alignItems: 'center', gap: 7 }}>
    {icon} {children}
  </h3>
);

const ReceiptVerify = () => {
  const { serial: serialParam } = useParams();
  const navigate = useNavigate();
  const [serial, setSerial] = useState(serialParam || '');
  const [state, setState] = useState({ status: serialParam ? 'loading' : 'idle', data: null, error: '' });
  const [detail, setDetail] = useState(null);
  const [detailState, setDetailState] = useState('idle'); // idle | loading | confirming | error
  const [detailError, setDetailError] = useState('');
  const [paying, setPaying] = useState(false);
  const [paidParam] = useState(readPaidParam);

  const current = (serialParam || '').trim().toUpperCase();

  const lookup = useCallback(async (value) => {
    const clean = (value || '').trim().toUpperCase();
    if (!clean) return;
    setState({ status: 'loading', data: null, error: '' });
    setDetail(null); setDetailState('idle'); setDetailError('');
    try {
      const { data } = await axios.get(`${API}/api/receipts/verify/${encodeURIComponent(clean)}`);
      setState({ status: 'found', data, error: '' });
    } catch (err) {
      setState({
        status: 'notfound', data: null,
        error: err.response?.data?.message || 'This receipt could not be verified.',
      });
    }
  }, []);

  // Détail payant. retries : utile juste après un paiement, le temps que le
  // statut passe à « success ».
  const loadDetail = useCallback(async (clean, key, retries = 0) => {
    if (!key) return;
    setDetailState(retries ? 'confirming' : 'loading');
    for (let i = 0; i <= retries; i += 1) {
      try {
        const { data } = await axios.get(
          `${API}/api/receipts/verify/${encodeURIComponent(clean)}/detail`, { params: { key } });
        setDetail(data); setDetailState('idle'); setDetailError('');
        return;
      } catch (err) {
        const code = err.response?.status;
        if (code === 402 && i < retries) { await new Promise(r => setTimeout(r, 4000)); continue; }
        if (code === 403 || code === 410) dropKey(clean);
        setDetailState(code === 402 && retries ? 'error' : 'idle');
        setDetailError(code === 410 ? 'Your access to this receipt has expired.'
          : code === 402 && retries ? 'The payment is not confirmed yet. Please try again in a moment.'
            : '');
        return;
      }
    }
  }, []);

  useEffect(() => {
    if (!current) return;
    lookup(current);
    if (paidParam) {
      // Retour de DPO : on confirme le paiement, puis on charge le détail.
      clearPaymentReturn();
      saveKey(current, paidParam);
      axios.get(`${API}/api/payments/dpo/verify/${encodeURIComponent(paidParam)}`).catch(() => {});
      loadDetail(current, paidParam, 20);
    } else {
      loadDetail(current, loadKey(current));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const provider = useMemo(
    () => receiptVerificationProvider(current, (key) => saveKey(current, key)),
    [current],
  );

  const submit = (e) => {
    e.preventDefault();
    const clean = serial.trim().toUpperCase();
    if (!clean) return;
    navigate(`/verify/${clean}`);      // keeps the address shareable
  };

  const data = state.data;
  const meta = data ? (STATUS_META[data.status] || { label: data.status, tone: 'off' }) : null;
  const tone = meta ? TONES[meta.tone] : null;
  const canBuy = data?.detail_prices && Object.keys(data.detail_prices).length > 0;
  const priceLabel = canBuy
    ? `${fmt(data.detail_prices[data.detail_currency] ?? Object.values(data.detail_prices)[0])} ${
        data.detail_prices[data.detail_currency] != null ? data.detail_currency : Object.keys(data.detail_prices)[0]}`
    : null;

  return (
    <div style={{ background: BG, minHeight: '100vh', padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ ...serif, fontSize: 28, color: INK, lineHeight: 1 }}>{BRAND.name}</div>
          <div style={{ ...sans, fontSize: 10, letterSpacing: 2.5, color: CLAY,
            textTransform: 'uppercase', marginTop: 2 }}>Receipt verification</div>
        </div>

        {/* Search */}
        <form onSubmit={submit} style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              color: 'rgba(20,35,26,0.35)' }}><Search size={16}/></span>
            <input value={serial} onChange={e => setSerial(e.target.value)}
              placeholder="Receipt number, e.g. WR-00001"
              style={{ ...mono, width: '100%', padding: '14px 16px 14px 42px', borderRadius: 12,
                border: '1px solid rgba(20,35,26,0.14)', fontSize: 15, color: INK,
                background: '#fff', outline: 'none', textTransform: 'uppercase' }}/>
          </div>
          <button type="submit" style={{ ...sans, padding: '14px 26px', borderRadius: 12,
            border: 'none', background: GREEN, color: BG, fontSize: 14, fontWeight: 700,
            cursor: 'pointer' }}>
            Verify
          </button>
        </form>

        {/* Loading */}
        {state.status === 'loading' && (
          <div style={{ textAlign: 'center', padding: '50px 0', color: 'rgba(20,35,26,0.5)' }}>
            <Loader2 size={22} className="animate-spin" style={{ margin: '0 auto' }}/>
            <p style={{ ...sans, fontSize: 14, marginTop: 12 }}>Checking the register…</p>
          </div>
        )}

        {/* Not found */}
        {state.status === 'notfound' && (
          <div style={{ background: '#fff', border: `1px solid ${RUST}44`, borderLeft: `4px solid ${RUST}`,
            borderRadius: 14, padding: '28px 30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <ShieldAlert size={22} style={{ color: RUST }}/>
              <h2 style={{ ...serif, fontSize: 24, color: INK, margin: 0 }}>Not verified</h2>
            </div>
            <p style={{ ...sans, fontSize: 14, lineHeight: 1.7, color: 'rgba(20,35,26,0.7)', margin: 0 }}>
              {state.error} Check the number printed on the document. If it is correct and this page
              still shows nothing, do not accept the receipt as proof of goods.
            </p>
          </div>
        )}

        {/* Found */}
        {state.status === 'found' && data && (
          <>
            <div style={{ background: tone.bg, border: `1px solid ${tone.border}55`,
              borderLeft: `4px solid ${tone.border}`, borderRadius: 14,
              padding: '22px 26px', marginBottom: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldCheck size={22} style={{ color: tone.color }}/>
                <div>
                  <h2 style={{ ...serif, fontSize: 24, color: INK, margin: 0, lineHeight: 1.2 }}>
                    {meta.label}
                  </h2>
                  <p style={{ ...mono, fontSize: 13, color: tone.color, marginTop: 2 }}>
                    {data.serial} · genuine receipt
                  </p>
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid rgba(20,35,26,0.1)',
              borderRadius: 14, padding: '26px 30px' }}>

              <SectionTitle first icon={<Warehouse size={13}/>}>Held at</SectionTitle>
              <Row label="Warehouse" value={data.warehouse} strong/>
              <Row label="Code" value={data.warehouse_code}/>
              <Row label="Country" value={data.country}/>

              <SectionTitle icon={<Scale size={13}/>}>Goods</SectionTitle>
              <Row label="Commodity" value={data.commodity} strong/>
              <Row label="Variety" value={data.variety}/>
              <Row label="Received on" value={data.received_at
                ? new Date(data.received_at).toLocaleDateString('en-GB') : null}/>

              {/* ── Détail payant ───────────────────────────────────────── */}
              {detail ? (
                <>
                  <Row label="Grade" value={detail.grade} strong/>
                  <Row label="Net weight" value={`${fmt(detail.net_weight_kg)} kg`}/>
                  <Row label="Still held" value={`${fmt(detail.remaining_weight_kg)} kg`} strong/>

                  <SectionTitle icon={<ShieldCheck size={13}/>}>Depositor</SectionTitle>
                  <Row label="Name" value={detail.depositor} strong/>
                  <Row label="Type" value={detail.depositor_type}/>

                  {detail.quality?.length > 0 && (
                    <>
                      <SectionTitle icon={<Scale size={13}/>}>Quality measured at reception</SectionTitle>
                      {detail.quality.map(q => (
                        <Row key={q.id} label={q.name} value={`${q.value}${q.unit ? ` ${q.unit}` : ''}`}/>
                      ))}
                    </>
                  )}

                  {detail.farms?.length > 0 && (
                    <>
                      <SectionTitle icon={<Sprout size={13}/>}>Farms of origin ({detail.farms.length})</SectionTitle>
                      {detail.farms.map((f, i) => (
                        <Row key={i} label={f.farm_id || f.farm_name || '—'}
                          value={`${f.farm_name && f.farm_id ? `${f.farm_name} · ` : ''}${fmt(f.weight_kg)} kg`}/>
                      ))}
                    </>
                  )}

                  {detail.access_expires_at && (
                    <p style={{ ...sans, fontSize: 12, color: 'rgba(20,35,26,0.45)', marginTop: 16 }}>
                      Full details unlocked on this browser until{' '}
                      {new Date(detail.access_expires_at).toLocaleDateString('en-GB')}.
                    </p>
                  )}
                </>
              ) : (
                <div style={{ marginTop: 26, padding: '20px 22px', borderRadius: 12,
                  background: 'rgba(169,120,79,0.07)', border: `1px dashed ${CLAY}88` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Lock size={15} style={{ color: CLAY }}/>
                    <span style={{ ...sans, fontSize: 14, fontWeight: 700, color: INK }}>Full details</span>
                  </div>
                  <p style={{ ...sans, fontSize: 13, lineHeight: 1.65, color: 'rgba(20,35,26,0.65)', margin: '0 0 14px' }}>
                    Grade, quality measurements, weight still held, depositor and farms of origin
                    (EUDR traceability).
                  </p>

                  {(detailState === 'loading' || detailState === 'confirming') ? (
                    <p style={{ ...sans, fontSize: 13, color: 'rgba(20,35,26,0.6)', margin: 0,
                      display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Loader2 size={14} className="animate-spin"/>
                      {detailState === 'confirming' ? 'Confirming your payment…' : 'Loading…'}
                    </p>
                  ) : canBuy ? (
                    <button type="button" onClick={() => setPaying(true)}
                      style={{ ...sans, padding: '12px 22px', borderRadius: 100, border: 'none',
                        background: GREEN, color: BG, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
                      Unlock full details · {priceLabel}
                    </button>
                  ) : (
                    <p style={{ ...sans, fontSize: 13, color: 'rgba(20,35,26,0.5)', margin: 0 }}>
                      Detailed verification is not available yet.
                    </p>
                  )}

                  {detailError && (
                    <p style={{ ...sans, fontSize: 12.5, color: RUST, margin: '10px 0 0' }}>{detailError}</p>
                  )}
                </div>
              )}
            </div>

            <p style={{ ...sans, fontSize: 12, lineHeight: 1.7, color: 'rgba(20,35,26,0.45)',
              marginTop: 20, textAlign: 'center' }}>
              This page reads the warehouse register directly. Prices and the depositor's account
              are never public.
            </p>
          </>
        )}

        {/* Idle */}
        {state.status === 'idle' && (
          <p style={{ ...sans, fontSize: 14, lineHeight: 1.7, color: 'rgba(20,35,26,0.5)',
            textAlign: 'center', marginTop: 30 }}>
            Enter the number printed on a warehouse receipt to check that it is genuine
            and that the goods are still held.
          </p>
        )}
      </div>

      {data && canBuy && (
        <PaymentModal
          isOpen={paying}
          onClose={() => setPaying(false)}
          title={`Receipt ${data.serial} · full details`}
          note={data.detail_duration_days ? `Access for ${data.detail_duration_days} days on this browser` : undefined}
          prices={data.detail_prices}
          defaultCurrency={data.detail_currency}
          returnPath={`/verify/${data.serial}`}
          provider={provider}
          showGooglePay={false}
          onSuccess={() => { setPaying(false); loadDetail(current, loadKey(current), 5); }}
        />
      )}
    </div>
  );
};

export default ReceiptVerify;