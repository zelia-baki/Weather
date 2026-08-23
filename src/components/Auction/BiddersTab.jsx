import React, { useState } from 'react';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';
import {
  Users, ShieldCheck, ShieldAlert, Wallet, ChevronDown, ChevronUp,
  BadgeCheck, Building2, Globe, Phone, Mail, FileText, Loader2,
} from 'lucide-react';

// =============================================================================
//  src/components/Auction/BiddersTab.jsx — nouveau fichier
//
//  L'onglet Bidders de AuctionManager, sorti dans son propre composant : il
//  porte maintenant tout le profil légal, et le fichier principal devenait
//  illisible.
//
//  Ce qui compte visuellement : l'état de VÉRIFICATION avant tout le reste.
//  Un enchérisseur non vérifié qui mène 8 000 $ de lots, c'est le cas que tu
//  dois voir en premier en ouvrant cet écran.
// =============================================================================

const fmt = (n, d = 2) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: 2 });

const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

const STATUS_STYLES = {
  approved:        'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending:         'bg-blue-50 text-blue-700 border-blue-200',
  deposit_pending: 'bg-amber-50 text-amber-700 border-amber-200',
  rejected:        'bg-red-50 text-red-700 border-red-200',
  defaulted:       'bg-red-50 text-red-700 border-red-200',
};

const VERIF_STYLES = {
  verified:   { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Verified' },
  pending:    { cls: 'bg-amber-50 text-amber-700 border-amber-200',       label: 'Docs to review' },
  failed:     { cls: 'bg-red-50 text-red-700 border-red-200',             label: 'Check failed' },
  unverified: { cls: 'bg-gray-100 text-gray-500 border-gray-200',         label: 'Unverified' },
};

const Badge = ({ cls, children }) => (
  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
    {children}
  </span>
);

// Une ligne du dossier légal. Un champ vide se voit — c'est le but.
const Detail = ({ icon, label, value }) => (
  <div className="flex items-start gap-2.5">
    <span className="text-gray-300 mt-0.5 flex-shrink-0">{icon}</span>
    <div className="min-w-0">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`text-sm break-words ${value ? 'text-gray-800' : 'text-gray-300 italic'}`}>
        {value || 'not provided'}
      </p>
    </div>
  </div>
);

const BidderCard = ({ reg, currency, auctionClosed, onRefresh }) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const verif = VERIF_STYLES[reg.verification_status] || VERIF_STYLES.unverified;
  const completeness = reg.profile_completeness ?? 0;

  // Le cas à repérer d'un coup d'œil : un profil incomplet ou non vérifié qui
  // engage déjà de l'argent. C'est de là que viennent les défauts de paiement.
  const atRisk = reg.status === 'approved'
    && reg.verification_status !== 'verified'
    && (reg.committed_exposure || 0) > 0;

  const call = async (fn, successTitle) => {
    setBusy(true);
    try {
      await fn();
      await onRefresh();
      if (successTitle) {
        Swal.fire({ icon: 'success', title: successTitle, timer: 1600,
          showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Action failed',
        text: err.response?.data?.msg || err.message,
        customClass: { popup: 'rounded-2xl' } });
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    const r = await Swal.fire({
      title: `Verify ${reg.legal_name || reg.company_name}?`,
      html: `Registration number: <strong>${reg.registration_number || '—'}</strong><br/>
             Country: <strong>${reg.country_of_incorporation || '—'}</strong><br/><br/>
             <span style="font-size:13px;color:#666">
             Verification applies to the company, not just this auction.
             It carries over to future sales.</span>`,
      input: 'select',
      inputOptions: { verified: 'Verified — documents check out',
                      failed: 'Failed — details do not match',
                      pending: 'Pending — waiting on documents' },
      inputValue: 'verified',
      showCancelButton: true, confirmButtonColor: '#16803c',
      confirmButtonText: 'Save', customClass: { popup: 'rounded-2xl' },
    });
    if (!r.isConfirmed) return;
    await call(() => axiosInstance.post(
      `/api/auction/registrations/${reg.id}/verify`, { status: r.value }),
      `Profile marked as ${r.value}`);
  };

  const approve = async () => {
    const r = await Swal.fire({
      title: `Approve ${reg.company_name || reg.username}?`,
      input: 'number',
      inputLabel: `Bidding limit (${currency}) — leave blank for no limit`,
      inputValue: reg.bid_limit ?? '',
      html: reg.verification_status !== 'verified'
        ? '<span style="color:#c2410c;font-size:13px">This profile is not verified yet.</span>'
        : undefined,
      showCancelButton: true, confirmButtonColor: '#16803c',
      confirmButtonText: 'Approve', customClass: { popup: 'rounded-2xl' },
    });
    if (!r.isConfirmed) return;
    await call(() => axiosInstance.post(
      `/api/auction/registrations/${reg.id}/approve`,
      r.value ? { bid_limit: parseFloat(r.value) } : {}), 'Registration approved');
  };

  const reject = async () => {
    const r = await Swal.fire({
      title: 'Reject this registration?', input: 'text',
      inputPlaceholder: 'Reason (internal note)',
      showCancelButton: true, confirmButtonColor: '#ef4444',
      confirmButtonText: 'Reject', customClass: { popup: 'rounded-2xl' },
    });
    if (!r.isConfirmed) return;
    await call(() => axiosInstance.post(
      `/api/auction/registrations/${reg.id}/reject`, { note: r.value }), 'Registration rejected');
  };

  const refund = async () => {
    const r = await Swal.fire({
      title: 'Mark deposit as refunded?', icon: 'question',
      text: 'This records the decision and frees the bidding limit. The transfer itself is done outside the app.',
      showCancelButton: true, confirmButtonColor: '#16803c',
      confirmButtonText: 'Mark refunded', customClass: { popup: 'rounded-2xl' },
    });
    if (!r.isConfirmed) return;
    await call(() => axiosInstance.post(
      `/api/auction/registrations/${reg.id}/refund-deposit`), 'Deposit marked refunded');
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-sm transition-all ${
      atRisk ? 'border-amber-300' : 'border-gray-100'}`}>

      {/* ── En-tête ──────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 flex-wrap">
              {reg.company_name || reg.username || `User #${reg.user_id}`}
              <Badge cls={STATUS_STYLES[reg.status] || STATUS_STYLES.pending}>
                {reg.status.replace('_', ' ')}
              </Badge>
              <Badge cls={verif.cls}>{verif.label}</Badge>
              {reg.buyer_type_label && (
                <Badge cls="bg-amber-50 text-amber-700 border-amber-200">
                  {reg.buyer_type_label}
                </Badge>
              )}
              {reg.deposit_status === 'held' && (
                <Badge cls="bg-emerald-50 text-emerald-700 border-emerald-200">
                  Deposit held
                </Badge>
              )}
              {reg.deposit_status === 'forfeited' && (
                <Badge cls="bg-red-50 text-red-700 border-red-200">
                  Deposit forfeited
                </Badge>
              )}
            </h3>

            {reg.legal_name && reg.legal_name !== reg.company_name && (
              <p className="text-xs text-gray-500 mt-1">
                Legal entity: <span className="font-medium">{reg.legal_name}</span>
                {reg.registration_number && ` · ${reg.registration_number}`}
              </p>
            )}

            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
              {reg.contact_name && (
                <span>{reg.contact_name}{reg.contact_role && `, ${reg.contact_role}`}</span>
              )}
              {reg.country_of_incorporation && <span>{reg.country_of_incorporation}</span>}
              {reg.bid_limit != null && (
                <span className="font-semibold text-gray-700">
                  {fmt(reg.committed_exposure)} / {fmt(reg.bid_limit)} {currency} committed
                </span>
              )}
            </div>

            {/* Complétude du profil — l'admin trie par sérieux, pas par date */}
            <div className="flex items-center gap-2 mt-3 max-w-xs">
              <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${completeness}%`,
                    background: completeness >= 80 ? '#16803c'
                              : completeness >= 50 ? '#d97706' : '#dc2626' }}/>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {completeness}% complete
              </span>
            </div>
          </div>

          <button onClick={() => setOpen(o => !o)}
            className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200 transition-colors">
            {open ? <ChevronUp size={13}/> : <ChevronDown size={13}/>} Details
          </button>
        </div>

        {atRisk && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5">
            <p className="text-xs text-amber-900">
              This bidder is committing {fmt(reg.committed_exposure)} {currency} on an
              unverified profile. Check their documents before the auction closes.
            </p>
          </div>
        )}
      </div>

      {/* ── Dossier complet ──────────────────────────────────────── */}
      {open && (
        <div className="border-t border-gray-100 px-4 sm:px-5 py-5 bg-gray-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <Detail icon={<Building2 size={14}/>} label="Registered legal name"
              value={reg.legal_name}/>
            <Detail icon={<FileText size={14}/>} label="Registration number"
              value={reg.registration_number}/>
            <Detail icon={<FileText size={14}/>} label="Tax / VAT number"
              value={reg.tax_id}/>
            <Detail icon={<Globe size={14}/>} label="Country of incorporation"
              value={reg.country_of_incorporation}/>
            <Detail icon={<Building2 size={14}/>} label="Business address"
              value={reg.business_address}/>
            <Detail icon={<Globe size={14}/>} label="Website" value={reg.website}/>
            <Detail icon={<Users size={14}/>} label="Contact"
              value={reg.contact_name && `${reg.contact_name}${reg.contact_role ? `, ${reg.contact_role}` : ''}`}/>
            <Detail icon={<Phone size={14}/>} label="Phone" value={reg.contact_phone}/>
            <Detail icon={<Mail size={14}/>} label="Email" value={reg.contact_email}/>
            <Detail icon={<Globe size={14}/>} label="Shipping country"
              value={reg.shipping_country}/>
            <Detail icon={<FileText size={14}/>} label="Years in business"
              value={reg.years_in_business}/>
            <Detail icon={<FileText size={14}/>} label="Annual volume"
              value={reg.annual_volume_kg ? `${fmt(reg.annual_volume_kg)} kg` : null}/>
          </div>

          {reg.sourcing_notes && (
            <div className="mt-5 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-400 mb-1.5">What they look for</p>
              <p className="text-sm text-gray-700 italic">"{reg.sourcing_notes}"</p>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-gray-200 flex flex-wrap gap-x-8 gap-y-2 text-xs text-gray-400">
            <span>Registered {fmtDate(reg.date_created)}</span>
            {reg.deposit_paid_at && <span>Deposit paid {fmtDate(reg.deposit_paid_at)}</span>}
            {reg.verified_at && <span>Verified {fmtDate(reg.verified_at)}</span>}
            {reg.dpo_trans_ref && <span>DPO ref {reg.dpo_trans_ref}</span>}
          </div>

          {reg.admin_note && (
            <p className="mt-3 text-xs text-gray-500 italic">Note: {reg.admin_note}</p>
          )}

          {/* ── Actions ────────────────────────────────────────── */}
          <div className="mt-5 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
            <button onClick={verify} disabled={busy}
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 transition-colors">
              {busy ? <Loader2 size={12} className="animate-spin"/> : <BadgeCheck size={12}/>}
              Verify profile
            </button>

            {(reg.status === 'pending' || reg.status === 'approved') && (
              <button onClick={approve} disabled={busy}
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 transition-colors">
                <ShieldCheck size={12}/>
                {reg.status === 'pending' ? 'Approve' : 'Set bidding limit'}
              </button>
            )}

            {reg.status !== 'rejected' && reg.status !== 'defaulted' && (
              <button onClick={reject} disabled={busy}
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-red-50 text-red-700 hover:bg-red-100 border-red-200 transition-colors">
                <ShieldAlert size={12}/> Reject
              </button>
            )}

            {reg.deposit_status === 'held' && auctionClosed && (
              <button onClick={refund} disabled={busy}
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200 transition-colors">
                <Wallet size={12}/> Mark deposit refunded
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
const BiddersTab = ({ auction, onRefresh }) => {
  const [filter, setFilter] = useState('all');
  const regs = auction.registrations ?? [];

  const counts = {
    all: regs.length,
    pending: regs.filter(r => r.status === 'pending').length,
    unverified: regs.filter(r => r.verification_status !== 'verified').length,
    approved: regs.filter(r => r.status === 'approved').length,
  };

  const filtered = regs.filter(r => {
    if (filter === 'pending')    return r.status === 'pending';
    if (filter === 'unverified') return r.verification_status !== 'verified';
    if (filter === 'approved')   return r.status === 'approved';
    return true;
  });

  // À traiter d'abord : ce qui attend une décision, puis ce qui n'est pas
  // vérifié. Le tri par date d'inscription n'aide personne.
  const rank = (r) => {
    if (r.status === 'pending') return 0;
    if (r.verification_status !== 'verified' && (r.committed_exposure || 0) > 0) return 1;
    if (r.status === 'deposit_pending') return 2;
    if (r.verification_status !== 'verified') return 3;
    return 4;
  };
  const sorted = [...filtered].sort((a, b) => rank(a) - rank(b));

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'all',        label: 'All' },
          { id: 'pending',    label: 'Awaiting approval' },
          { id: 'unverified', label: 'Not verified' },
          { id: 'approved',   label: 'Approved' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              filter === f.id ? 'bg-gray-800 text-white border-gray-800'
                              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
            {f.label}
            <span className={`ml-1.5 ${filter === f.id ? 'text-gray-300' : 'text-gray-400'}`}>
              {counts[f.id]}
            </span>
          </button>
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <Users size={36} className="mx-auto mb-2 text-gray-300"/>
          <p className="text-sm text-gray-400">
            {filter === 'all' ? 'No registration yet.' : 'Nothing in this filter.'}
          </p>
        </div>
      )}

      {sorted.map(reg => (
        <BidderCard key={reg.id} reg={reg} currency={auction.currency}
          auctionClosed={auction.status === 'closed'} onRefresh={onRefresh}/>
      ))}
    </div>
  );
};

export default BiddersTab;