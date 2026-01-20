import React, { useState, useEffect } from "react";
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

  const [currency, setCurrency] = useState("UGX");
  const [emailInput, setEmailInput] = useState(passedEmail || "");

  const navigate = useNavigate();
  const effectivePhone = passedPhone || phoneInput;

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await axiosInstance.get("/api/feature/price/");
        const priceData = res.data.find((f) => f.feature_name === featureName);
        setPriceInfo(priceData);
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

  // ============ DPO PAY LOGIC (CORRIGÉ - SANS POLLING) ============
  const handleDPOPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse("");

    console.log("\n" + "=".repeat(60));
    console.log("FRONTEND: Initiating DPO Payment");
    console.log("=".repeat(60));

    try {
      const res = await axiosInstance.post("/api/payments/dpo/initiate", {
        feature_name: featureName,
        phone_number: effectivePhone,
        email: emailInput,
        currency: currency,
      });

      console.log("FRONTEND: Response received!");
      console.log("Response data:", res.data);

      if (res.data.success) {
        console.log("Opening DPO payment window...");

        // Ouvrir DPO dans la même fenêtre (redirection complète)
        // DPO redirigera automatiquement vers /payment/success après paiement
        window.location.href = res.data.payment_url;
        
        // Alternative: ouvrir dans un nouvel onglet (mais moins recommandé)
        // const dpoTab = window.open(res.data.payment_url, '_blank');
        // if (!dpoTab) {
        //   setResponse("Popup blocked! Please allow popups for this site and try again.");
        //   setLoading(false);
        // }
      } else {
        console.error("FRONTEND: Success = false");
        setResponse("Error: " + res.data.error);
        setLoading(false);
      }
    } catch (err) {
      console.error("FRONTEND: Exception caught!", err);
      setResponse("Error: " + (err.response?.data?.error || err.message));
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="relative p-6">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* ÉTAPE 1: Choix de la méthode de paiement */}
            {!paymentMethod && (
              <>
                <Dialog.Title className="text-2xl font-bold mb-2 text-gray-900">
                  Choose Payment Method
                </Dialog.Title>
                <p className="text-sm text-gray-600 mb-6">
                  Select how you would like to pay for <strong>{featureName}</strong>
                </p>

                {priceInfo && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Price</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {priceInfo.price} <span className="text-lg">UGX</span>
                        </p>
                      </div>
                      {priceInfo.duration_days && (
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Duration</p>
                          <p className="text-xl font-semibold text-gray-900">
                            {priceInfo.duration_days} days
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPaymentMethod('mobile_money')}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-200 text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Mobile Money</p>
                          <p className="text-sm text-gray-500">MTN, Airtel (Uganda only)</p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPaymentMethod('dpo')}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Card / Mobile Money</p>
                          <p className="text-sm text-gray-500">Visa, Mastercard, All Mobile Money</p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </motion.button>
                </div>
              </>
            )}

            {/* ÉTAPE 2: Formulaire Mobile Money */}
            {paymentMethod === 'mobile_money' && (
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
                  Mobile Money Payment
                </Dialog.Title>
                <p className="text-sm text-gray-600 mb-4">Enter your mobile money number</p>

                {priceInfo && (
                  <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-2xl font-bold text-green-600">
                      {priceInfo.price} UGX
                    </p>
                  </div>
                )}

                <form onSubmit={handleMobileMoneyPayment} className="space-y-4">
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
                      Transaction ID
                    </label>
                    <input
                      type="text"
                      className="w-full p-2.5 border rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      value={txnId}
                      readOnly
                    />
                  </div>

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

            {/* ÉTAPE 3: Formulaire DPO Pay */}
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

                {priceInfo && (
                  <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-2xl font-bold text-green-600">
                      {priceInfo.price} {currency}
                    </p>
                    {priceInfo.duration_days && (
                      <p className="text-xs text-gray-600 mt-1">
                        Access duration: {priceInfo.duration_days} days
                      </p>
                    )}
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
                        disabled={loading}
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
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Currency *
                    </label>
                    <select
                      className="w-full p-2.5 border rounded-lg"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      disabled={loading}
                    >
                      <option value="UGX">🇺🇬 UGX - Ugandan Shilling</option>
                      <option value="USD">🇺🇸 USD - US Dollar</option>
                      <option value="KES">🇰🇪 KES - Kenyan Shilling</option>
                      <option value="TZS">🇹🇿 TZS - Tanzanian Shilling</option>
                      <option value="ZAR">🇿🇦 ZAR - South African Rand</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 flex items-center justify-center"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Opening Payment Window...
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

                {response && (
                  <div className={`mt-4 p-3 rounded-lg border ${
                    response.includes('Error') ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                  }`}>
                    <p className={`text-sm ${
                      response.includes('Error') ? 'text-red-700' : 'text-blue-700'
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
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}