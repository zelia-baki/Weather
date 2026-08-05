import React, { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';

// =============================================================================
//  src/components/Auction/AuctionAccessPanel.jsx
//
//  La porte d'entrée d'une vente. Trois modes possibles :
//    'open'     — rien à faire, on enchérit directement
//    'deposit'  — caution remboursable à payer, qui débloque un plafond
//    'approval' — validation manuelle par l'équipe
//
//  Le panneau doit rendre le plafond LISIBLE en permanence. Un enchérisseur
//  qui découvre sa limite au moment où sa surenchère est refusée abandonne la
//  vente. Affiché en amont, le plafond devient une règle du jeu.
// =============================================================================

const INK = '#14231a';
const GREEN = '#16803c';
const CLAY = '#a9784f';
const SAND = '#eee9de';
const RUST = '#c2410c';
const BORDER = 'rgba(20,35,26,0.12)';

const mono = { fontFamily: "'JetBrains Mono', monospace" };
const sans = { fontFamily: "'Epilogue', sans-serif" };
const serif = { fontFamily: "'Cormorant Garamond', serif" };

const fmt = (n) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const inputStyle = {
  ...sans, width: '100%', padding: '11px 14px', borderRadius: 10,
  border: `1px solid ${BORDER}`, background: '#fff', color: INK,
  fontSize: 14, outline: 'none',
};

const labelStyle = {
  ...sans, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase',
  color: 'rgba(20,35,26,0.5)', marginBottom: 6, display: 'block',
};

const Shell = ({ tone = GREEN, children }) => (
  <div style={{
    background: '#fff', border: `1px solid ${tone}40`, borderLeft: `3px solid ${tone}`,
    borderRadius: 12, padding: '24px 26px', margin: '32px 0',
  }}>
    {children}
  </div>
);

const AuctionAccessPanel = ({ auction, registration, onChange }) => {
  const [form, setForm] = useState({
    company_name: '', contact_phone: '', contact_email: '', shipping_country: '',
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (registration) {
      setForm(f => ({ ...f, company_name: registration.company_name || '' }));
    }
  }, [registration]);

  if (auction.access_mode === 'open') return null;

  const submitRegistration = async () => {
    if (!form.company_name.trim() || !form.contact_phone.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing details',
        text: 'Company name and phone number are required to register.' });
      return;
    }
    setBusy(true);
    try {
      const { data } = await axiosInstance.post(
        `/api/auction/auctions/${auction.id}/register`, form);
      onChange(data.registration);
      if (data.next_step === 'bid') {
        Swal.fire({ icon: 'success', title: 'You can now bid', timer: 1800,
          showConfirmButton: false });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Registration failed',
        text: err.response?.data?.msg || 'Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  const payDeposit = async () => {
    setBusy(true);
    try {
      const { data } = await axiosInstance.post(
        `/api/auction/registrations/${registration.id}/pay-deposit`,
        { phone_number: form.contact_phone, email: form.contact_email });
      if (data.payment_url) window.location.href = data.payment_url;
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Payment could not start',
        text: err.response?.data?.msg || err.response?.data?.error || 'Please try again.' });
      setBusy(false);
    }
  };

  // ── Pas encore inscrit ─────────────────────────────────────────────────────
  if (!registration) {
    return (
      <Shell>
        <div style={{ ...sans, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
          color: GREEN, marginBottom: 8 }}>
          Registration required
        </div>
        <h3 style={{ ...serif, fontSize: 24, color: INK, fontWeight: 500, margin: '0 0 10px' }}>
          Register to bid in this auction
        </h3>
        <p style={{ ...sans, fontSize: 14, lineHeight: 1.7,
          color: 'rgba(20,35,26,0.65)', marginBottom: 20 }}>
          {auction.access_mode === 'deposit'
            ? `Bidding opens once we receive a refundable deposit of ${fmt(auction.deposit_amount)} ${auction.currency}. The deposit is returned in full after the auction unless you win a lot and fail to pay for it.`
            : 'Our team reviews each bidder before the auction. Tell us who you are and we will come back to you shortly.'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Company *</label>
            <input style={inputStyle} value={form.company_name}
              onChange={e => setForm({ ...form, company_name: e.target.value })}
              placeholder="Roastery, importer, cooperative" />
          </div>
          <div>
            <label style={labelStyle}>Phone *</label>
            <input style={inputStyle} value={form.contact_phone}
              onChange={e => setForm({ ...form, contact_phone: e.target.value })}
              placeholder="+256 7XX XXX XXX" />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} type="email" value={form.contact_email}
              onChange={e => setForm({ ...form, contact_email: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Shipping country</label>
            <input style={inputStyle} value={form.shipping_country}
              onChange={e => setForm({ ...form, shipping_country: e.target.value })} />
          </div>
        </div>

        <button onClick={submitRegistration} disabled={busy}
          style={{ ...sans, padding: '13px 28px', borderRadius: 100, border: 'none',
            background: busy ? 'rgba(22,128,60,0.5)' : GREEN, color: '#f7f4ee',
            fontWeight: 700, fontSize: 14, cursor: busy ? 'wait' : 'pointer' }}>
          {busy ? 'Sending…' : 'Register'}
        </button>
      </Shell>
    );
  }

  // ── Caution attendue ───────────────────────────────────────────────────────
  if (registration.status === 'deposit_pending') {
    const limit = (registration.deposit_amount || 0) * (auction.deposit_multiplier || 10);
    return (
      <Shell tone={CLAY}>
        <div style={{ ...sans, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
          color: CLAY, marginBottom: 8 }}>
          One step left
        </div>
        <h3 style={{ ...serif, fontSize: 24, color: INK, fontWeight: 500, margin: '0 0 10px' }}>
          Pay your deposit to unlock bidding
        </h3>
        <p style={{ ...sans, fontSize: 14, lineHeight: 1.7,
          color: 'rgba(20,35,26,0.65)', marginBottom: 18 }}>
          A deposit of{' '}
          <strong style={mono}>{fmt(registration.deposit_amount)} {registration.deposit_currency}</strong>{' '}
          opens a bidding limit of{' '}
          <strong style={mono}>{fmt(limit)} {registration.deposit_currency}</strong> across all lots.
          It is refunded in full after the auction, unless you win a lot and do not pay for it.
        </p>
        <button onClick={payDeposit} disabled={busy}
          style={{ ...sans, padding: '13px 28px', borderRadius: 100, border: 'none',
            background: busy ? 'rgba(169,120,79,0.5)' : CLAY, color: '#f7f4ee',
            fontWeight: 700, fontSize: 14, cursor: busy ? 'wait' : 'pointer' }}>
          {busy ? 'Redirecting…' : `Pay ${fmt(registration.deposit_amount)} ${registration.deposit_currency}`}
        </button>
      </Shell>
    );
  }

  // ── En attente de validation ───────────────────────────────────────────────
  if (registration.status === 'pending') {
    return (
      <Shell tone={CLAY}>
        <h3 style={{ ...serif, fontSize: 22, color: INK, fontWeight: 500, margin: '0 0 8px' }}>
          Your registration is under review
        </h3>
        <p style={{ ...sans, fontSize: 14, color: 'rgba(20,35,26,0.65)', margin: 0 }}>
          We will email you as soon as it is approved. Bidding stays closed until then.
        </p>
      </Shell>
    );
  }

  // ── Refusé ou en défaut ────────────────────────────────────────────────────
  if (registration.status === 'rejected' || registration.status === 'defaulted') {
    return (
      <Shell tone={RUST}>
        <h3 style={{ ...serif, fontSize: 22, color: INK, fontWeight: 500, margin: '0 0 8px' }}>
          {registration.status === 'rejected'
            ? 'Your registration was not approved'
            : 'Bidding is closed on your account'}
        </h3>
        <p style={{ ...sans, fontSize: 14, color: 'rgba(20,35,26,0.65)', margin: 0 }}>
          Contact us if you believe this is a mistake.
        </p>
      </Shell>
    );
  }

  // ── Approuvé : plafond visible en permanence ──────────────────────────────
  const remaining = registration.remaining_limit;
  const hasLimit = registration.bid_limit != null;
  const used = hasLimit && registration.bid_limit > 0
    ? Math.min(100, (registration.committed_exposure / registration.bid_limit) * 100)
    : 0;
  const tight = hasLimit && remaining <= registration.bid_limit * 0.15;

  return (
    <Shell>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ ...sans, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
            color: GREEN, marginBottom: 6 }}>
            Approved to bid
          </div>
          <div style={{ ...serif, fontSize: 20, color: INK }}>
            {registration.company_name || 'Your account'}
          </div>
        </div>

        {hasLimit && (
          <div style={{ textAlign: 'right', minWidth: 220 }}>
            <div style={{ ...mono, fontSize: 16, color: tight ? RUST : INK }}>
              {fmt(remaining)} {auction.currency}
            </div>
            <div style={{ ...sans, fontSize: 11, color: 'rgba(20,35,26,0.45)', marginBottom: 8 }}>
              left of {fmt(registration.bid_limit)} {auction.currency}
            </div>
            <div style={{ height: 4, borderRadius: 4, background: SAND, overflow: 'hidden' }}>
              <div style={{ width: `${used}%`, height: '100%',
                background: tight ? RUST : GREEN, transition: 'width 0.4s' }} />
            </div>
          </div>
        )}
      </div>

      {tight && (
        <p style={{ ...sans, fontSize: 13, color: RUST, marginTop: 16, marginBottom: 0 }}>
          You are close to your limit. Raise your deposit to bid on more lots.
        </p>
      )}
    </Shell>
  );
};

export default AuctionAccessPanel;