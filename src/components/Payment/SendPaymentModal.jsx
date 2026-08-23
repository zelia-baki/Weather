import React, { useState, useEffect, useMemo } from "react";
import { Dialog } from "@headlessui/react";
import { motion } from "framer-motion";
import axiosInstance from "../../axiosInstance";
import { useNavigate } from "react-router-dom";

export function SendPaymentModal({
  isOpen,
  onClose,
  featureName,
  phone: passedPhone,
  email: passedEmail,
  agent_id: passedAgent,
  onPaymentSuccess,
}) {
  const [paymentMethod, setPaymentMethod] = useState(null);

  const [txnId, setTxnId] = useState((passedAgent || "1234") + Date.now());
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [priceInfo, setPriceInfo] = useState(null);

  const [currency, setCurrency] = useState("");
  const [emailInput, setEmailInput] = useState(passedEmail || "");

  const navigate = useNavigate();
  const effectivePhone = passedPhone || phoneInput;

  // Devises réellement configurées pour cette feature (jamais une liste
  // statique arbitraire — on ne propose que ce qui a un prix en base).
  const availableCurrencies = useMemo(() => {
    if (!priceInfo?.prices) return [];
    return Object.keys(priceInfo.prices);
  }, [priceInfo]);

  // Prix correspondant à la devise actuellement sélectionnée.
  // undefined si cette devise n'a pas de prix configuré pour cette feature.
  const currentAmount = priceInfo?.prices?.[currency];

  const CURRENCY_LABELS = {
    UGX: "🇺🇬 UGX - Ugandan Shilling",
    USD: "🇺🇸 USD - US Dollar",
    KES: "🇰🇪 KES - Kenyan Shilling",
    TZS: "🇹🇿 TZS - Tanzanian Shilling",
    ZAR: "🇿🇦 ZAR - South African Rand",
  };

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await axiosInstance.get("/api/feature/price/");
        const data = res.data.find((f) => f.feature_name === featureName);
        setPriceInfo(data || null);

        // Bascule automatiquement sur la devise par défaut de la feature
        // dès que les prix sont chargés — c'est la devise qui est "présente"
        // pour ce report, donc celle qu'on doit proposer en premier.
        if (data?.default_currency) {
          setCurrency(data.default_currency);
        }
      } catch (err) {
        console.error("Failed to fetch price info:", err);
      }
    };

    if (isOpen) {
      fetchPrice();
      setPaymentMethod(null);
      setResponse("");
    }
  }, [isOpen, featureName]);

  // Si l'utilisateur change la devise dans le select, le prix affiché et
  // envoyé au backend suit automatiquement — currentAmount est recalculé
  // à chaque render à partir de `currency`, donc rien d'autre à faire ici.
  const handleCurrencyChange = (e) => {
    setCurrency(e.target.value);
  };

  // ============ MOBILE MONEY LOGIC ============
  const handleMobileMoneyPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse("");

    if (passedPhone) {
      localStorage.removeItem("token");
    }

    try {
      const res = await axiosInstance.post("/api/payments/initiate", {
        phone_number: effectivePhone,
        feature_name: featureName,
        txn_id: txnId,
      });

      setResponse(res.data.msg || "Payment initiated. Please confirm on your phone.");
      setPolling(true);
      startPolling(txnId, effectivePhone);
    } catch (err) {
      setResponse("Error: " + (err.response?.data?.error || err.message));
      setLoading(false);
    }
  };

  const startPolling = (txnId, phone) => {
    let attempts = 0;
    const maxAttempts = 40;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await axiosInstance.get(`/api/payments/status/${txnId}`);
        const status = res.data.status?.toLowerCase();

        if (status.includes("success") || status.includes("confirmed")) {
          clearInterval(interval);
          checkAccess(phone);
        } else if (status.includes("failed") || status.includes("rejected")) {
          clearInterval(interval);
          setPolling(false);
          setResponse("Payment declined or failed.");
          setLoading(false);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setPolling(false);
          setResponse("No confirmation received. Please try again.");
          setLoading(false);
        }
      } catch (err) {
        clearInterval(interval);
        setPolling(false);
        setResponse("Error during verification: " + err.message);
        setLoading(false);
      }
    }, 3000);
  };

  const checkAccess = async (phone) => {
    try {
      const accessRes = await axiosInstance.get(`/api/payments/access/${featureName}`, {
        params: { phone_number: phone },
      });

      if (accessRes.data.access) {
        if (onPaymentSuccess) {
          onPaymentSuccess();
        } else {
          navigate(`/${featureName}`);
        }
      } else {
        setResponse("Payment confirmed, but access not activated.");
      }
    } catch (err) {
      setResponse("Error during access verification.");
    } finally {
      setLoading(false);
      setPolling(false);
    }
  };

  // ============ DPO PAY LOGIC ============
  const handleDPOPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse("");

    if (passedPhone) {
      localStorage.removeItem("token");
    }

    try {
      const res = await axiosInstance.post("/api/payments/dpo/initiate", {
        feature_name: featureName,
        phone_number: effectivePhone,
        email: emailInput,
        currency: currency,
      });

      if (res.data.success) {
        const dpoTab = window.open(res.data.payment_url, '_blank');

        if (!dpoTab) {
          setResponse("❌ Popup blocked! Please allow popups for this site and try again.");
          setLoading(false);
          return;
        }

        setPolling(true);
        startDPOPolling(res.data.trans_token, dpoTab);
      } else {
        setResponse("Error: " + res.data.error);
        setLoading(false);
      }
    } catch (err) {
      setResponse("Error: " + (err.response?.data?.error || err.message));
      setLoading(false);
    }
  };

  const startDPOPolling = (transToken) => {
    const startTime = Date.now();
    const MAX_DURATION = 5 * 60 * 60 * 1000; // 5 heures
    const INTERVAL = 8000; // minimum 8s (anti-429)

    setResponse("⏳ Waiting for payment confirmation...");

    const interval = setInterval(async () => {
      const elapsed = Date.now() - startTime;

      try {
        const res = await axiosInstance.get(`/api/payments/dpo/verify/${transToken}`);
        const status = res.data.status;

        if (status === "paid") {
          clearInterval(interval);
          setPolling(false);
          setLoading(false);

          if (onPaymentSuccess) {
            onPaymentSuccess();
          } else {
            window.location.href = `/payment/success?TransactionToken=${transToken}`;
          }
          return;
        }

        setResponse("⏳ Waiting for payment confirmation...");
      } catch (err) {
        console.warn("DPO polling error, retrying...");
      }

      if (elapsed >= MAX_DURATION) {
        clearInterval(interval);
        setPolling(false);
        setLoading(false);
        setResponse("⏳ Payment is still processing. You will be notified once confirmed.");
      }
    }, INTERVAL);
  };

  // ============ RENDER ============
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          as={motion.div}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* ÉTAPE 1: Choix de la méthode */}
          {!paymentMethod && (
            <>
              <Dialog.Title className="text-2xl font-bold mb-2 text-gray-800">
                Choose Payment Method
              </Dialog.Title>
              <p className="text-gray-600 mb-6">
                Select how you'd like to pay for <span className="font-semibold text-green-600">{featureName}</span>
              </p>

              {priceInfo && currentAmount != null && (
                <div className="mb-6 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-gray-700">Amount to pay:</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {currentAmount} {currency}
                  </p>
                  {priceInfo.duration_days && (
                    <p className="text-xs text-gray-600 mt-1">
                      Access duration: {priceInfo.duration_days} days
                    </p>
                  )}
                </div>
              )}

              {priceInfo && currentAmount == null && (
                <div className="mb-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    Pricing is not yet configured for this report. Please contact support.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => setPaymentMethod('mobile')}
                  className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 font-medium flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Pay with Mobile Money
                </button>

                <button
                  onClick={() => setPaymentMethod('dpo')}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Pay with Card / Mobile Money (DPO)
                </button>
              </div>
            </>
          )}

          {/* ÉTAPE 2: Formulaire Mobile Money (devise par défaut de la feature uniquement) */}
          {paymentMethod === 'mobile' && (
            <>
              <button
                onClick={() => setPaymentMethod(null)}
                className="mb-4 text-sm text-gray-600 hover:text-gray-800 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to payment methods
              </button>

              <Dialog.Title className="text-xl font-bold mb-4">
                Mobile Money Payment
              </Dialog.Title>

              {priceInfo?.default_currency && priceInfo.prices?.[priceInfo.default_currency] != null ? (
                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="font-medium text-gray-700">
                    Price: {priceInfo.prices[priceInfo.default_currency]} {priceInfo.default_currency}
                  </p>
                  {priceInfo.duration_days && (
                    <p className="text-sm text-gray-600">Access duration: {priceInfo.duration_days} days</p>
                  )}
                </div>
              ) : (
                <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    Pricing is not configured for this report yet.
                  </p>
                </div>
              )}

              <form onSubmit={handleMobileMoneyPayment} className="space-y-4">
                {!passedPhone && (
                  <input
                    type="tel"
                    placeholder="Your phone number (256XXXXXXXXX)"
                    className="w-full p-2.5 border rounded-lg"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    required
                    disabled={loading || polling}
                  />
                )}

                {effectivePhone && (
                  <p className="text-sm text-gray-600">
                    Phone: +<strong>{effectivePhone}</strong>
                  </p>
                )}

                <input
                  type="text"
                  placeholder="Transaction ID"
                  className="w-full p-2.5 border rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  value={txnId}
                  readOnly
                />

                <button
                  type="submit"
                  className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 font-medium disabled:bg-gray-400"
                  disabled={loading || polling}
                >
                  {loading ? "Sending..." : polling ? "Waiting for confirmation..." : "Send Payment"}
                </button>
              </form>

              {polling && (
                <div className="flex justify-center mt-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-500" />
                </div>
              )}

              {response && <p className="mt-4 text-sm text-gray-600">{response}</p>}
            </>
          )}

          {/* ÉTAPE 3: Formulaire DPO Pay (multi-devises) */}
          {paymentMethod === 'dpo' && (
            <>
              <button
                onClick={() => setPaymentMethod(null)}
                className="mb-4 text-sm text-gray-600 hover:text-gray-800 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to payment methods
              </button>

              <Dialog.Title className="text-xl font-bold mb-2">
                Pay with Card or Mobile Money
              </Dialog.Title>
              <p className="text-sm text-gray-600 mb-4">Secure payment via DPO Pay</p>

              <div className="mb-4 p-4 bg-blue-50 rounded-lg space-y-2">
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Credit/Debit Cards (Visa, Mastercard)
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Mobile Money (MTN, Airtel, Vodafone, Tigo)
                </div>
              </div>

              {currentAmount != null ? (
                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-2xl font-bold text-green-600">
                    {currentAmount} {currency}
                  </p>
                  {priceInfo?.duration_days && (
                    <p className="text-xs text-gray-600 mt-1">
                      Access duration: {priceInfo.duration_days} days
                    </p>
                  )}
                </div>
              ) : (
                <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    No price configured for this currency on this report.
                  </p>
                </div>
              )}

              <form onSubmit={handleDPOPayment} className="space-y-4">
                {!passedPhone && (
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      placeholder="+256XXXXXXXXX"
                      className="w-full p-2.5 border rounded-lg"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      required
                      disabled={loading || polling}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="w-full p-2.5 border rounded-lg"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    disabled={loading || polling}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Currency *
                  </label>
                  {/* Ne propose que les devises réellement configurées pour cette
                      feature — dès qu'on en choisit une, le prix affiché ci-dessus
                      et envoyé au backend bascule automatiquement dessus. */}
                  <select
                    className="w-full p-2.5 border rounded-lg"
                    value={currency}
                    onChange={handleCurrencyChange}
                    disabled={loading || polling || availableCurrencies.length === 0}
                  >
                    {availableCurrencies.length === 0 && (
                      <option value="">No currency available</option>
                    )}
                    {availableCurrencies.map((c) => (
                      <option key={c} value={c}>
                        {CURRENCY_LABELS[c] || c}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 flex items-center justify-center"
                  disabled={loading || polling || currentAmount == null}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Opening Payment Window...
                    </>
                  ) : polling ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Waiting for payment confirmation...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Proceed to Secure Payment
                    </>
                  )}
                </button>
              </form>

              {polling && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 flex-shrink-0 mt-0.5"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800 mb-1">
                        Payment in progress
                      </p>
                      <p className="text-xs text-blue-600">
                        • Complete your payment in the new tab<br />
                        • Don't close this page - we're waiting for confirmation<br />
                        • This can take up to 5 hours for some payment methods
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {response && !polling && (
                <div className={`mt-4 p-3 rounded-lg border ${response.includes('✅') ? 'bg-green-50 border-green-200' :
                  response.includes('⏳') ? 'bg-blue-50 border-blue-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                  <p className={`text-sm ${response.includes('✅') ? 'text-green-700' :
                    response.includes('⏳') ? 'text-blue-700' :
                      'text-red-700'
                    }`}>{response}</p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-500 text-center flex items-center justify-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Secure payment powered by DPO Pay
                </p>
              </div>
            </>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}