import React, { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';

// =============================================================================
//  src/components/Auction/AuctionAccessPanel.jsx — remplace ton fichier actuel
//
//  Le formulaire passe de 4 champs à un vrai profil acheteur, en DEUX étapes.
//
//  Pourquoi deux étapes : douze champs d'un coup font fuir. En les coupant en
//  « qui vous êtes » puis « ce que vous achetez », chaque écran reste court et
//  l'acheteur voit qu'il avance.
//
//  Ce qui est exigé — raison sociale, immatriculation, pays, contact nommé —
//  n'est pas de la bureaucratie : c'est ce qui permet de poursuivre quelqu'un
//  qui ne paie pas. « Coffee Co » ne se poursuit pas.
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

const BUYER_TYPES = [
  { id: 'roaster',     label: 'Roaster',     hint: 'You roast and sell your own coffee' },
  { id: 'importer',    label: 'Importer',    hint: 'You import green coffee at volume' },
  { id: 'trader',      label: 'Trader',      hint: 'You buy and resell to other businesses' },
  { id: 'retailer',    label: 'Retailer',    hint: 'You sell to end customers' },
  { id: 'cooperative', label: 'Cooperative', hint: 'You buy on behalf of members' },
  { id: 'other',       label: 'Other',       hint: '' },
];

const inputStyle = (err) => ({
  ...sans, width: '100%', padding: '11px 14px', borderRadius: 10,
  border: `1px solid ${err ? RUST : BORDER}`, background: '#fff',
  color: INK, fontSize: 14, outline: 'none',
});

const labelStyle = {
  ...sans, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase',
  color: 'rgba(20,35,26,0.5)', marginBottom: 6, display: 'block',
};

const Field = ({ label, required, error, hint, children }) => (
  <div>
    <label style={labelStyle}>
      {label}{required && <span style={{ color: RUST }}> *</span>}
    </label>
    {children}
    {hint && !error && (
      <p style={{ ...sans, fontSize: 11.5, color: 'rgba(20,35,26,0.4)', marginTop: 5 }}>
        {hint}
      </p>
    )}
    {error && (
      <p style={{ ...sans, fontSize: 11.5, color: RUST, marginTop: 5 }}>{error}</p>
    )}
  </div>
);

const Shell = ({ tone = GREEN, children }) => (
  <div style={{
    background: '#fff', border: `1px solid ${tone}40`, borderLeft: `3px solid ${tone}`,
    borderRadius: 12, padding: '26px 28px', margin: '32px 0',
  }}>
    {children}
  </div>
);

const EMPTY = {
  company_name: '', legal_name: '', registration_number: '', tax_id: '',
  country_of_incorporation: '', business_address: '', website: '',
  buyer_type: '', years_in_business: '', annual_volume_kg: '', sourcing_notes: '',
  contact_name: '', contact_role: '', contact_phone: '', contact_email: '',
  shipping_country: '',
};

// ── Barre d'étapes ───────────────────────────────────────────────────────────
const Steps = ({ step }) => (
  <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
    {['Your company', 'Your business'].map((label, i) => (
      <div key={label} style={{ flex: 1 }}>
        <div style={{ height: 3, borderRadius: 3, marginBottom: 8,
          background: i <= step ? GREEN : SAND, transition: 'background 0.3s' }}/>
        <span style={{ ...sans, fontSize: 11, letterSpacing: 0.5,
          color: i <= step ? GREEN : 'rgba(20,35,26,0.35)',
          fontWeight: i === step ? 700 : 400 }}>
          {i + 1}. {label}
        </span>
      </div>
    ))}
  </div>
);

const AuctionAccessPanel = ({ auction, registration, onChange }) => {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Un profil déjà commencé se recharge : on ne redemande jamais deux fois
    // à quelqu'un ce qu'il a déjà saisi.
    if (registration) setForm(f => ({ ...f, ...registration }));
  }, [registration]);

  if (auction.access_mode === 'open') return null;

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  // ── Validation, par étape ──────────────────────────────────────────────────
  const validateStep = (s) => {
    const e = {};
    if (s === 0) {
      if (!form.company_name?.trim())             e.company_name = 'Required';
      if (!form.legal_name?.trim())               e.legal_name = 'Required';
      if (!form.registration_number?.trim())      e.registration_number = 'Required';
      if (!form.country_of_incorporation?.trim()) e.country_of_incorporation = 'Required';
    } else {
      if (!form.buyer_type)              e.buyer_type = 'Pick one';
      if (!form.contact_name?.trim())    e.contact_name = 'Required';
      if (!form.contact_phone?.trim())   e.contact_phone = 'Required';
      if (!form.contact_email?.trim())   e.contact_email = 'Required';
      else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.contact_email))
        e.contact_email = 'Not a valid email';
    }
    return e;
  };

  const next = () => {
    const e = validateStep(0);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep(1);
  };

  const submit = async () => {
    const e = validateStep(1);
    if (Object.keys(e).length) { setErrors(e); return; }

    setBusy(true);
    try {
      const { data } = await axiosInstance.post(
        `/api/auction/auctions/${auction.id}/register`, form);
      onChange(data.registration);
      if (data.next_step === 'bid') {
        Swal.fire({ icon: 'success', title: 'You can now bid',
          timer: 1800, showConfirmButton: false });
      }
    } catch (err) {
      // Le serveur revalide tout : s'il renvoie une liste de champs manquants,
      // on l'affiche telle quelle plutôt qu'un message générique.
      const missing = err.response?.data?.missing_fields;
      Swal.fire({
        icon: 'error', title: 'Registration failed',
        html: missing?.length
          ? `Still missing:<br/><strong>${missing.join('<br/>')}</strong>`
          : (err.response?.data?.msg || 'Please try again.'),
      });
    } finally {
      setBusy(false);
    }
  };

  const payDeposit = async () => {
    setBusy(true);
    try {
      const { data } = await axiosInstance.post(
        `/api/auction/registrations/${registration.id}/pay-deposit`,
        { phone_number: registration.contact_phone, email: registration.contact_email });
      if (data.payment_url) window.location.href = data.payment_url;
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Payment could not start',
        text: err.response?.data?.msg || err.response?.data?.error || 'Please try again.' });
      setBusy(false);
    }
  };

  const btn = (primary) => ({
    ...sans, padding: '13px 28px', borderRadius: 100,
    border: primary ? 'none' : `1px solid ${BORDER}`,
    background: primary ? (busy ? 'rgba(22,128,60,0.5)' : GREEN) : 'transparent',
    color: primary ? '#f7f4ee' : 'rgba(20,35,26,0.6)',
    fontWeight: primary ? 700 : 400, fontSize: 14,
    cursor: busy ? 'wait' : 'pointer',
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  FORMULAIRE — pas encore inscrit
  // ══════════════════════════════════════════════════════════════════════════
  if (!registration || registration.status === 'rejected') {
    return (
      <Shell>
        <div style={{ ...sans, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
          color: GREEN, marginBottom: 8 }}>
          Buyer registration
        </div>
        <h3 style={{ ...serif, fontSize: 26, color: INK, fontWeight: 500, margin: '0 0 10px' }}>
          Register to bid in this auction
        </h3>
        <p style={{ ...sans, fontSize: 14, lineHeight: 1.7,
          color: 'rgba(20,35,26,0.65)', marginBottom: 24 }}>
          {auction.access_mode === 'deposit'
            ? `Bidding opens once your company details are on file and we receive a refundable deposit of ${fmt(auction.deposit_amount)} ${auction.currency}.`
            : 'Our team reviews each bidder before the auction. Tell us who you are and we will come back to you shortly.'}
        </p>

        <Steps step={step}/>

        {step === 0 ? (
          <div style={{ display: 'grid', gap: 18 }}>
            <div style={{ display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
              <Field label="Trading name" required error={errors.company_name}
                hint="How you are known commercially">
                <input style={inputStyle(errors.company_name)} value={form.company_name || ''}
                  onChange={set('company_name')} placeholder="Kampala Roastery"/>
              </Field>
              <Field label="Registered legal name" required error={errors.legal_name}
                hint="Exactly as it appears on your registration">
                <input style={inputStyle(errors.legal_name)} value={form.legal_name || ''}
                  onChange={set('legal_name')} placeholder="Kampala Roastery Ltd"/>
              </Field>
              <Field label="Registration number" required error={errors.registration_number}>
                <input style={inputStyle(errors.registration_number)}
                  value={form.registration_number || ''} onChange={set('registration_number')}/>
              </Field>
              <Field label="Tax / VAT number">
                <input style={inputStyle(false)} value={form.tax_id || ''}
                  onChange={set('tax_id')}/>
              </Field>
              <Field label="Country of incorporation" required
                error={errors.country_of_incorporation}>
                <input style={inputStyle(errors.country_of_incorporation)}
                  value={form.country_of_incorporation || ''}
                  onChange={set('country_of_incorporation')}/>
              </Field>
              <Field label="Website">
                <input style={inputStyle(false)} value={form.website || ''}
                  onChange={set('website')} placeholder="https://"/>
              </Field>
            </div>

            <Field label="Business address">
              <input style={inputStyle(false)} value={form.business_address || ''}
                onChange={set('business_address')}/>
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={next} style={btn(true)}>Continue →</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 18 }}>
            <Field label="What kind of buyer are you" required error={errors.buyer_type}>
              <div style={{ display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
                {BUYER_TYPES.map(t => (
                  <button key={t.id} type="button"
                    onClick={() => setForm({ ...form, buyer_type: t.id })}
                    title={t.hint}
                    style={{
                      ...sans, padding: '11px 12px', borderRadius: 10, fontSize: 13,
                      cursor: 'pointer', textAlign: 'left',
                      border: `1px solid ${form.buyer_type === t.id ? GREEN : BORDER}`,
                      background: form.buyer_type === t.id ? 'rgba(22,128,60,0.08)' : '#fff',
                      color: form.buyer_type === t.id ? GREEN : 'rgba(20,35,26,0.65)',
                      fontWeight: form.buyer_type === t.id ? 700 : 400,
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </Field>

            <div style={{ display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
              <Field label="Contact name" required error={errors.contact_name}
                hint="Who commits the company">
                <input style={inputStyle(errors.contact_name)} value={form.contact_name || ''}
                  onChange={set('contact_name')}/>
              </Field>
              <Field label="Role">
                <input style={inputStyle(false)} value={form.contact_role || ''}
                  onChange={set('contact_role')} placeholder="Head of sourcing"/>
              </Field>
              <Field label="Phone" required error={errors.contact_phone}>
                <input style={inputStyle(errors.contact_phone)} value={form.contact_phone || ''}
                  onChange={set('contact_phone')} placeholder="+256 7XX XXX XXX"/>
              </Field>
              <Field label="Email" required error={errors.contact_email}>
                <input type="email" style={inputStyle(errors.contact_email)}
                  value={form.contact_email || ''} onChange={set('contact_email')}/>
              </Field>
              <Field label="Shipping country"
                hint="Leave blank to use your country of incorporation">
                <input style={inputStyle(false)} value={form.shipping_country || ''}
                  onChange={set('shipping_country')}/>
              </Field>
              <Field label="Years in business">
                <input type="number" min="0" style={inputStyle(false)}
                  value={form.years_in_business || ''} onChange={set('years_in_business')}/>
              </Field>
            </div>

            <Field label="Annual green coffee volume (kg)"
              hint="Helps us set your bidding limit — an estimate is fine">
              <input type="number" min="0" step="0.01" style={inputStyle(false)}
                value={form.annual_volume_kg || ''} onChange={set('annual_volume_kg')}/>
            </Field>

            <Field label="What you look for"
              hint="Cup profiles, certifications, processing methods">
              <textarea rows={3} style={{ ...inputStyle(false), resize: 'none' }}
                value={form.sourcing_notes || ''} onChange={set('sourcing_notes')}/>
            </Field>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <button onClick={() => setStep(0)} style={btn(false)}>← Back</button>
              <button onClick={submit} disabled={busy} style={btn(true)}>
                {busy ? 'Sending…' : 'Submit registration'}
              </button>
            </div>
          </div>
        )}
      </Shell>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  CAUTION ATTENDUE
  // ══════════════════════════════════════════════════════════════════════════
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
          <strong style={mono}>{fmt(limit)} {registration.deposit_currency}</strong> across all
          lots. It is refunded in full after the auction, unless you win a lot and do not pay
          for it.
        </p>
        <button onClick={payDeposit} disabled={busy}
          style={{ ...btn(true), background: busy ? 'rgba(169,120,79,0.5)' : CLAY }}>
          {busy ? 'Redirecting…' : `Pay ${fmt(registration.deposit_amount)} ${registration.deposit_currency}`}
        </button>
      </Shell>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  EN ATTENTE DE VALIDATION
  // ══════════════════════════════════════════════════════════════════════════
  if (registration.status === 'pending') {
    return (
      <Shell tone={CLAY}>
        <h3 style={{ ...serif, fontSize: 22, color: INK, fontWeight: 500, margin: '0 0 8px' }}>
          Your registration is under review
        </h3>
        <p style={{ ...sans, fontSize: 14, color: 'rgba(20,35,26,0.65)', margin: 0 }}>
          We check company details before opening bidding. You will hear from us shortly.
        </p>
      </Shell>
    );
  }

  if (registration.status === 'defaulted') {
    return (
      <Shell tone={RUST}>
        <h3 style={{ ...serif, fontSize: 22, color: INK, fontWeight: 500, margin: '0 0 8px' }}>
          Bidding is closed on your account
        </h3>
        <p style={{ ...sans, fontSize: 14, color: 'rgba(20,35,26,0.65)', margin: 0 }}>
          Contact us if you believe this is a mistake.
        </p>
      </Shell>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  APPROUVÉ
  // ══════════════════════════════════════════════════════════════════════════
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
          <div style={{ ...serif, fontSize: 20, color: INK,
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {registration.company_name || 'Your account'}
            {registration.buyer_type_label && (
              <span style={{ ...sans, fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
                padding: '4px 11px', borderRadius: 100, background: SAND, color: CLAY }}>
                {registration.buyer_type_label}
              </span>
            )}
            {registration.is_verified && (
              <span style={{ ...sans, fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
                padding: '4px 11px', borderRadius: 100,
                background: 'rgba(22,128,60,0.1)', color: GREEN }}>
                Verified
              </span>
            )}
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
                background: tight ? RUST : GREEN, transition: 'width 0.4s' }}/>
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