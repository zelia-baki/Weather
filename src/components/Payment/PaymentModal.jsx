import React, { useEffect, useRef, useState } from "react";
import { Dialog } from "@headlessui/react";
import { motion } from "framer-motion";
import GooglePayButton from "./GooglePayButton";

// =============================================================================
//  PaymentModal — LE composant de paiement de toute l'application.
//
//  Il ne connaît ni les rapports, ni la boutique : tout ce qui est propre à
//  un produit passe par un « provider » (voir paymentProviders.js).
//
//    <PaymentModal
//      isOpen={open}
//      onClose={() => setOpen(false)}
//      title="Carbon Report"                 // ce que l'on achète
//      prices={{ UGX: 50000, USD: 14 }}      // montant par devise
//      defaultCurrency="UGX"
//      note="Access for 30 days"             // optionnel
//      phone="256772000000"                  // pré-rempli (optionnel)
//      lockPhone                             // ne pas laisser le modifier
//      provider={featurePaymentProvider({ featureName: "reportcarbonguest" })}
//      onSuccess={({ method, ref }) => …}
//    />
//
//  Un provider expose, pour chaque méthode qu'il supporte :
//    startMobileMoney({ phone, currency }) → { ref, message? }
//    checkMobileMoney(ref)                 → 'paid' | 'pending' | 'failed'
//    startCard({ phone, email, currency }) → { url, ref }
//    checkCard(ref)                        → 'paid' | 'pending' | 'failed'
//    mobileMoneyCurrencies                 → devises acceptées par Mobile Money
//  Une méthode dont les fonctions manquent n'est simplement pas proposée.
// =============================================================================

const MOBILE_POLL_MS = 3000;
const MOBILE_MAX_MS = 2 * 60 * 1000;      // l'invite USSD expire bien avant
const CARD_POLL_MS = 8000;                // minimum 8 s (anti-429 DPO)
const CARD_MAX_MS = 5 * 60 * 60 * 1000;   // certains moyens DPO sont lents

const CURRENCY_LABELS = {
  UGX: "🇺🇬 UGX - Ugandan Shilling",
  USD: "🇺🇸 USD - US Dollar",
  KES: "🇰🇪 KES - Kenyan Shilling",
  TZS: "🇹🇿 TZS - Tanzanian Shilling",
  ZAR: "🇿🇦 ZAR - South African Rand",
  GBP: "🇬🇧 GBP - British Pound",
  EUR: "🇪🇺 EUR - Euro",
};

const formatAmount = (amount, currency) =>
  `${Number(amount).toLocaleString("en-US", { maximumFractionDigits: 2 })} ${currency}`;

// Un statut renvoyé par le provider, quelle que soit sa forme.
const normalizeStatus = (s) => {
  const v = String(s || "").toLowerCase();
  if (v === "paid" || v.includes("success") || v.includes("confirmed")) return "paid";
  if (v.includes("fail") || v.includes("reject") || v.includes("declin")) return "failed";
  return "pending";
};

const errorText = (err) => err?.response?.data?.error || err?.message || "Something went wrong.";

// ── Icônes ───────────────────────────────────────────────────────────────────
const Icon = ({ d, className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);
const PHONE = "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z";
const CARD = "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z";
const WALLET = "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z";
const LOCK = "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z";
const BACK = "M15 19l-7-7 7-7";
const CHEVRON = "M9 5l7 7-7 7";
const CHECK = "M5 13l4 4L19 7";
const CROSS = "M6 18L18 6M6 6l12 12";

const Spinner = ({ className = "h-5 w-5" }) => (
  <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

// ── Petites briques ─────────────────────────────────────────────────────────
const Steps = ({ current }) => {
  const labels = ["Method", "Details", "Confirm"];
  return (
    <ol className="flex items-center gap-2 mb-5 text-xs">
      {labels.map((label, i) => {
        const state = i < current ? "done" : i === current ? "active" : "todo";
        return (
          <li key={label} className="flex items-center gap-2 flex-1">
            <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0 ${
              state === "done" ? "bg-green-600 text-white"
                : state === "active" ? "bg-gray-900 text-white"
                  : "bg-gray-200 text-gray-500"}`}>
              {state === "done" ? "✓" : i + 1}
            </span>
            <span className={state === "todo" ? "text-gray-400" : "text-gray-800 font-medium"}>{label}</span>
            {i < labels.length - 1 && <span className="flex-1 h-px bg-gray-200" />}
          </li>
        );
      })}
    </ol>
  );
};

const HowItWorks = ({ steps }) => (
  <ol className="mb-4 space-y-1.5 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
    {steps.map((s, i) => (
      <li key={i} className="flex gap-2">
        <span className="font-semibold text-gray-400">{i + 1}.</span>
        <span>{s}</span>
      </li>
    ))}
  </ol>
);

const Field = ({ label, hint, children }) => (
  <label className="block">
    <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
    {children}
    {hint && <span className="block text-xs text-gray-500 mt-1">{hint}</span>}
  </label>
);

const inputCls = "w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100";

const BackLink = ({ onClick }) => (
  <button type="button" onClick={onClick}
    className="mb-3 text-sm text-gray-500 hover:text-gray-800 flex items-center">
    <Icon d={BACK} className="w-4 h-4 mr-1" /> Choose another method
  </button>
);

// =============================================================================
const NO_PRICES = {};

export default function PaymentModal({
  isOpen,
  onClose,
  title,
  prices: priceMap,      // null/undefined = prix en cours de chargement
  defaultCurrency,
  note,
  phone: initialPhone = "",
  email: initialEmail = "",
  lockPhone = false,
  provider = {},
  onSuccess,
  showGooglePay = true,
}) {
  const prices = priceMap || NO_PRICES;
  // step : 'method' | 'details' | 'waiting' | 'success' | 'failed'
  const [step, setStep] = useState("method");
  const [method, setMethod] = useState(null);         // 'mobile' | 'card' | 'googlepay'
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail);
  const [currency, setCurrency] = useState(defaultCurrency || Object.keys(prices)[0] || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [cardUrl, setCardUrl] = useState(null);
  const timer = useRef(null);

  const currencies = Object.keys(prices);
  const mobileCurrencies = provider.mobileMoneyCurrencies || ["UGX"];
  // Mobile Money ne prélève que dans ses propres devises : on prend la devise
  // choisie si elle convient, sinon la première devise compatible tarifée.
  const mobileCurrency = mobileCurrencies.includes(currency)
    ? currency
    : mobileCurrencies.find((c) => prices[c] != null);

  const stopPolling = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  // Réinitialise à chaque ouverture ; coupe le polling à la fermeture.
  useEffect(() => {
    if (isOpen) {
      setStep("method"); setMethod(null); setMessage(""); setCardUrl(null); setBusy(false);
      setPhone(initialPhone); setEmail(initialEmail);
    }
    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (defaultCurrency) setCurrency(defaultCurrency);
    else if (!prices[currency] && currencies.length) setCurrency(currencies[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCurrency, currencies.join(",")]);

  useEffect(() => stopPolling, []);

  // ── Méthodes disponibles ────────────────────────────────────────────────
  const methods = [
    provider.startMobileMoney && {
      key: "mobile",
      icon: PHONE,
      title: "Mobile Money",
      text: "MTN or Airtel. A payment request pops up on your phone — just enter your PIN.",
      disabledReason: mobileCurrency == null
        ? `Only available for payments in ${mobileCurrencies.join(", ")}.`
        : null,
    },
    provider.startCard && {
      key: "card",
      icon: CARD,
      title: "Card or Mobile Money (DPO)",
      text: "Visa, Mastercard or mobile money on DPO's secure page, opened in a new tab.",
    },
    showGooglePay && {
      key: "googlepay",
      icon: WALLET,
      title: "Google Pay",
      text: "Test mode only — no real payment is taken yet.",
      badge: "Test",
    },
  ].filter(Boolean);

  const amountFor = (m) => (m === "mobile" ? prices[mobileCurrency] : prices[currency]);
  const currencyFor = (m) => (m === "mobile" ? mobileCurrency : currency);
  const shownAmount = method ? amountFor(method) : prices[currency];
  const shownCurrency = method ? currencyFor(method) : currency;

  // ── Polling commun aux deux passerelles ─────────────────────────────────
  const poll = (check, ref, every, maxMs, timeoutMessage) => {
    const started = Date.now();
    stopPolling();
    timer.current = setInterval(async () => {
      let status = "pending";
      try {
        status = normalizeStatus(await check(ref));
      } catch (err) {
        // Une erreur réseau ponctuelle n'est pas un échec de paiement.
        console.warn("[PaymentModal] status check failed, retrying", err);
      }

      if (status === "paid") {
        stopPolling();
        setStep("success");
        onSuccess?.({ method, ref });
      } else if (status === "failed") {
        stopPolling();
        setMessage("The payment was declined or cancelled. No money was taken.");
        setStep("failed");
      } else if (Date.now() - started >= maxMs) {
        stopPolling();
        setMessage(timeoutMessage);
        setStep("failed");
      }
    }, every);
  };

  const startMobile = async (e) => {
    e.preventDefault();
    setBusy(true); setMessage("");
    try {
      const { ref, message: msg } = await provider.startMobileMoney({ phone, email, currency: mobileCurrency });
      setMessage(msg || "");
      setStep("waiting");
      poll(provider.checkMobileMoney, ref, MOBILE_POLL_MS, MOBILE_MAX_MS,
        "We didn't receive a confirmation in time. If money was taken, contact support; otherwise try again.");
    } catch (err) {
      setMessage(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const startCard = async (e) => {
    e.preventDefault();
    setBusy(true); setMessage("");
    try {
      const { url, ref } = await provider.startCard({ phone, email, currency });
      setCardUrl(url);
      // Bloqué par le navigateur ? Pas grave : le lien reste affiché.
      window.open(url, "_blank");
      setStep("waiting");
      poll(provider.checkCard, ref, CARD_POLL_MS, CARD_MAX_MS,
        "Your payment is still being processed. You'll be notified once it is confirmed.");
    } catch (err) {
      setMessage(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const chooseMethod = (key) => { setMethod(key); setMessage(""); setStep("details"); };
  const backToMethods = () => { stopPolling(); setMethod(null); setMessage(""); setStep("method"); };

  // Pendant l'attente, un clic hors du modal ne doit pas tout annuler.
  const handleDialogClose = () => { if (step !== "waiting") onClose?.(); };

  const stepIndex = { method: 0, details: 1, waiting: 2, success: 3, failed: 2 }[step];
  const phoneValid = phone.replace(/\D/g, "").length >= 9;

  // ── Rendu ───────────────────────────────────────────────────────────────
  return (
    <Dialog open={isOpen} onClose={handleDialogClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <Dialog.Panel
          as={motion.div}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl w-full max-w-md shadow-xl relative overflow-hidden"
        >
          {/* En-tête : ce qu'on paie et combien, toujours visible */}
          <div className="bg-gray-900 text-white px-6 pt-5 pb-4">
            <button onClick={onClose} aria-label="Close"
              className="absolute top-4 right-4 text-white/60 hover:text-white">
              <Icon d={CROSS} />
            </button>
            <p className="text-[11px] uppercase tracking-widest text-white/50">You are paying for</p>
            <Dialog.Title className="text-lg font-semibold pr-8">{title}</Dialog.Title>
            {shownAmount != null ? (
              <p className="text-3xl font-bold mt-2">{formatAmount(shownAmount, shownCurrency)}</p>
            ) : (
              <p className="text-sm text-yellow-300 mt-2">
                {!priceMap ? "Loading price…" : currencies.length
                  ? "No price is configured for this currency."
                  : "Pricing is not configured yet. Please contact support."}
              </p>
            )}
            {note && <p className="text-xs text-white/60 mt-1">{note}</p>}
          </div>

          <div className="p-6">
            {step !== "success" && <Steps current={stepIndex} />}

            {/* ── 1. Choix de la méthode ──────────────────────────────── */}
            {step === "method" && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">How would you like to pay?</p>
                {methods.map((m) => {
                  const disabled = !!m.disabledReason;
                  return (
                    <button key={m.key} type="button" disabled={disabled}
                      onClick={() => chooseMethod(m.key)}
                      className={`w-full flex items-center gap-3 text-left p-4 rounded-xl border transition ${
                        disabled ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                          : "border-gray-200 hover:border-green-500 hover:bg-green-50"}`}>
                      <span className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
                        <Icon d={m.icon} className="w-5 h-5" />
                      </span>
                      <span className="flex-1">
                        <span className="flex items-center gap-2 font-semibold text-gray-900">
                          {m.title}
                          {m.badge && (
                            <span className="text-[10px] uppercase bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                              {m.badge}
                            </span>
                          )}
                        </span>
                        <span className="block text-xs text-gray-500 mt-0.5">{m.disabledReason || m.text}</span>
                      </span>
                      {!disabled && <Icon d={CHEVRON} className="w-4 h-4 text-gray-400" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── 2a. Mobile Money ────────────────────────────────────── */}
            {step === "details" && method === "mobile" && (
              <form onSubmit={startMobile} className="space-y-4">
                <BackLink onClick={backToMethods} />
                <HowItWorks steps={[
                  "Check the phone number below.",
                  "Tap “Send request” — a prompt appears on that phone.",
                  "Enter your Mobile Money PIN to approve. This page updates by itself.",
                ]} />
                <Field label="Mobile Money number" hint="Country code included, e.g. 256772123456">
                  <input type="tel" className={inputCls} value={phone} required
                    placeholder="256XXXXXXXXX" disabled={lockPhone || busy}
                    onChange={(e) => setPhone(e.target.value)} />
                </Field>
                {message && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{message}</p>}
                <button type="submit" disabled={busy || !phoneValid || amountFor("mobile") == null}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
                  {busy ? <><Spinner /> Sending request…</> : `Send request · ${formatAmount(amountFor("mobile") ?? 0, mobileCurrency)}`}
                </button>
              </form>
            )}

            {/* ── 2b. Carte / DPO ─────────────────────────────────────── */}
            {step === "details" && method === "card" && (
              <form onSubmit={startCard} className="space-y-4">
                <BackLink onClick={backToMethods} />
                <HowItWorks steps={[
                  "Tap “Continue to secure payment” — DPO opens in a new tab.",
                  "Pay with your card or mobile money there.",
                  "Come back to this tab: it confirms automatically.",
                ]} />
                {!lockPhone && (
                  <Field label="Phone number">
                    <input type="tel" className={inputCls} value={phone} required
                      placeholder="+256XXXXXXXXX" disabled={busy}
                      onChange={(e) => setPhone(e.target.value)} />
                  </Field>
                )}
                <Field label="Email (optional)" hint="For your payment receipt.">
                  <input type="email" className={inputCls} value={email} placeholder="you@email.com"
                    disabled={busy} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                {currencies.length > 1 && (
                  <Field label="Currency">
                    <select className={inputCls} value={currency} disabled={busy}
                      onChange={(e) => setCurrency(e.target.value)}>
                      {currencies.map((c) => <option key={c} value={c}>{CURRENCY_LABELS[c] || c}</option>)}
                    </select>
                  </Field>
                )}
                {message && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{message}</p>}
                <button type="submit" disabled={busy || prices[currency] == null || (!lockPhone && !phone)}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
                  {busy ? <><Spinner /> Opening payment page…</> : <><Icon d={LOCK} className="w-5 h-5" /> Continue to secure payment</>}
                </button>
                <p className="text-xs text-gray-400 text-center">Secure payment powered by DPO Pay</p>
              </form>
            )}

            {/* ── 2c. Google Pay (test) ───────────────────────────────── */}
            {step === "details" && method === "googlepay" && (
              <div className="space-y-4">
                <BackLink onClick={backToMethods} />
                <p className="text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  🧪 <strong>Test mode.</strong> Google Pay needs a merchant account and a payment
                  gateway before it can take real payments. This button uses Google&apos;s sandbox
                  and won&apos;t charge anyone.
                </p>
                <GooglePayButton
                  amount={prices[currency]}
                  currency={currency}
                  disabled={prices[currency] == null}
                  onTestToken={(paymentData) => {
                    console.log("[GooglePay TEST] paymentData", paymentData);
                    setMessage("🧪 Google Pay test token received — no real payment was processed.");
                  }}
                />
                {message && <p className="text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg p-2">{message}</p>}
              </div>
            )}

            {/* ── 3. Attente de confirmation ──────────────────────────── */}
            {step === "waiting" && (
              <div className="text-center space-y-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                  <Spinner className="h-7 w-7" />
                </div>
                {method === "mobile" ? (
                  <>
                    <p className="font-semibold text-gray-900">Check your phone</p>
                    <p className="text-sm text-gray-600">
                      We sent a payment request to <strong>{phone}</strong>.
                      Enter your Mobile Money PIN to approve it.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-gray-900">Complete the payment in the new tab</p>
                    <p className="text-sm text-gray-600">
                      Keep this page open — it updates as soon as DPO confirms the payment.
                      Some methods can take a while.
                    </p>
                    {cardUrl && (
                      <a href={cardUrl} target="_blank" rel="noreferrer"
                        className="inline-block text-sm text-blue-600 underline">
                        The page didn&apos;t open? Open the payment page
                      </a>
                    )}
                  </>
                )}
                {message && <p className="text-xs text-gray-500">{message}</p>}
                <button type="button" onClick={backToMethods}
                  className="text-sm text-gray-500 hover:text-gray-800 underline">
                  Cancel and choose another method
                </button>
              </div>
            )}

            {/* ── Résultats ───────────────────────────────────────────── */}
            {step === "success" && (
              <div className="text-center space-y-3 py-2">
                <div className="mx-auto w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <Icon d={CHECK} className="w-8 h-8" />
                </div>
                <p className="font-semibold text-gray-900 text-lg">Payment received</p>
                <p className="text-sm text-gray-600">Thank you! Your payment is confirmed.</p>
                <button type="button" onClick={onClose}
                  className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold">
                  Continue
                </button>
              </div>
            )}

            {step === "failed" && (
              <div className="text-center space-y-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                  <Icon d={CROSS} className="w-8 h-8" />
                </div>
                <p className="font-semibold text-gray-900">Payment not completed</p>
                <p className="text-sm text-gray-600">{message}</p>
                <button type="button" onClick={() => { setMessage(""); setStep("details"); }}
                  className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold">
                  Try again
                </button>
                <button type="button" onClick={backToMethods}
                  className="text-sm text-gray-500 hover:text-gray-800 underline">
                  Choose another method
                </button>
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
