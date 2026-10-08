// ── PUBLIC RECEIPT VERIFICATION ───────────────────────────────────────────────
// Where the QR code on a warehouse receipt lands. No account, no token: a buyer
// or a bank officer scans the paper and sees whether the goods are really held.
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, ShieldAlert, Search, Loader2, Warehouse, Scale } from 'lucide-react';

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

const Row = ({ label, value, strong }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20,
    padding: '11px 0', borderBottom: '1px solid rgba(20,35,26,0.08)' }}>
    <span style={{ ...sans, fontSize: 12, letterSpacing: 0.4, color: 'rgba(20,35,26,0.5)',
      textTransform: 'uppercase' }}>{label}</span>
    <span style={{ ...sans, fontSize: 14, color: INK, textAlign: 'right',
      fontWeight: strong ? 700 : 400 }}>{value ?? '—'}</span>
  </div>
);

const ReceiptVerify = () => {
  const { serial: serialParam } = useParams();
  const navigate = useNavigate();
  const [serial, setSerial] = useState(serialParam || '');
  const [state, setState] = useState({ status: serialParam ? 'loading' : 'idle', data: null, error: '' });

  const lookup = useCallback(async (value) => {
    const clean = (value || '').trim().toUpperCase();
    if (!clean) return;
    setState({ status: 'loading', data: null, error: '' });
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

  useEffect(() => { if (serialParam) lookup(serialParam); }, [serialParam, lookup]);

  const submit = (e) => {
    e.preventDefault();
    const clean = serial.trim().toUpperCase();
    if (!clean) return;
    navigate(`/verify/${clean}`);      // keeps the address shareable
    lookup(clean);
  };

  const data = state.data;
  const meta = data ? (STATUS_META[data.status] || { label: data.status, tone: 'off' }) : null;
  const tone = meta ? TONES[meta.tone] : null;

  return (
    <div style={{ background: BG, minHeight: '100vh', padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ ...serif, fontSize: 28, color: INK, lineHeight: 1 }}>Nkusu</div>
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
                  <p style={{ ...mono, fontSize: 13, color: tone.color, marginTop: 2 }}>{data.serial}</p>
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid rgba(20,35,26,0.1)',
              borderRadius: 14, padding: '26px 30px' }}>

              <h3 style={{ ...sans, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
                color: CLAY, fontWeight: 700, marginBottom: 6,
                display: 'flex', alignItems: 'center', gap: 7 }}>
                <Warehouse size={13}/> Held at
              </h3>
              <Row label="Warehouse" value={data.warehouse} strong/>
              <Row label="Code" value={data.warehouse_code}/>
              <Row label="Country" value={data.country}/>
              <Row label="Depositor" value={data.depositor}/>

              <h3 style={{ ...sans, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
                color: CLAY, fontWeight: 700, margin: '26px 0 6px',
                display: 'flex', alignItems: 'center', gap: 7 }}>
                <Scale size={13}/> Goods
              </h3>
              <Row label="Commodity" value={data.commodity} strong/>
              <Row label="Variety" value={data.variety}/>
              <Row label="Grade" value={data.grade} strong/>
              <Row label="Net weight" value={`${fmt(data.net_weight_kg)} kg`}/>
              <Row label="Still held" value={`${fmt(data.remaining_weight_kg)} kg`} strong/>
              <Row label="Received on" value={data.received_at
                ? new Date(data.received_at).toLocaleString('en-GB') : null}/>

              {data.quality?.length > 0 && (
                <>
                  <h3 style={{ ...sans, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
                    color: CLAY, fontWeight: 700, margin: '26px 0 6px' }}>
                    Quality measured at reception
                  </h3>
                  {data.quality.map(q => (
                    <Row key={q.id} label={q.name} value={`${q.value}${q.unit ? ` ${q.unit}` : ''}`}/>
                  ))}
                </>
              )}
            </div>

            <p style={{ ...sans, fontSize: 12, lineHeight: 1.7, color: 'rgba(20,35,26,0.45)',
              marginTop: 20, textAlign: 'center' }}>
              This page reads the warehouse register directly. Prices, the depositor's account and the
              list of contributing farms are not public.
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
    </div>
  );
};

export default ReceiptVerify;