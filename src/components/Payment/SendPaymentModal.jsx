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

  // ============ DPO PAY LOGIC ============
  const handleDPOPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse("");

    console.log("\n" + "=".repeat(60));
    console.log("🔵 FRONTEND: Initiating DPO Payment");
    console.log("=".repeat(60));
    console.log("Feature:", featureName);
    console.log("Phone:", effectivePhone);
    console.log("Email:", emailInput);
    console.log("Currency:", currency);

    // 💾 SAUVEGARDER LE CONTEXTE AVANT REDIRECTION DPO
    const paymentContext = {
      featureName: featureName,
      phone: effectivePhone,
      email: emailInput || passedEmail,
      agent_id: passedAgent,
      geojson: localStorage.getItem("polygon_geojson"), // GeoJSON déjà sauvegardé
      timestamp: Date.now()
    };
    
    localStorage.setItem("dpo_payment_context", JSON.stringify(paymentContext));
    console.log("💾 Context saved to localStorage:", paymentContext);

    try {
      console.log("🔵 FRONTEND: Sending POST to /api/payments/dpo/initiate...");
      
      const res = await axiosInstance.post("/api/payments/dpo/initiate", {
        feature_name: featureName,
        phone_number: effectivePhone,
        email: emailInput,
        currency: currency,
      });

      console.log("🟢 FRONTEND: Response received!");
      console.log("Response data:", res.data);
      console.log("Success?", res.data.success);
      console.log("Payment URL?", res.data.payment_url);
      console.log("Error?", res.data.error);

      if (res.data.success) {
        console.log("✅ FRONTEND: Success = true, redirecting to:", res.data.payment_url);
        console.log("=".repeat(60) + "\n");
        
        // Redirection vers DPO
        window.location.href = res.data.payment_url;
      } else {
        console.error("❌ FRONTEND: Success = false");
        console.error("Error message:", res.data.error);
        console.log("=".repeat(60) + "\n");
        
        setResponse("Error: " + res.data.error);
        setLoading(false);
      }
    } catch (err) {
      console.error("❌ FRONTEND: Exception caught!");
      console.error("Error:", err);
      console.error("Response data:", err.response?.data);
      console.log("=".repeat(60) + "\n");
      
      setResponse("Error: " + (err.response?.data?.error || err.message));
      setLoading(false);
    }
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

              {priceInfo && (
                <div className="mb-6 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-gray-700">
                    Amount to pay:
                  </p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {priceInfo.price} UGX
                  </p>
                  {priceInfo.duration_days && (
                    <p className="text-xs text-gray-600 mt-1">
                      Access duration: {priceInfo.duration_days} days
                    </p>
                  )}
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

          {/* ÉTAPE 2: Formulaire Mobile Money */}
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

              {priceInfo && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="font-medium text-gray-700">Price: {priceInfo.price} UGX</p>
                  {priceInfo.duration_days && (
                    <p className="text-sm text-gray-600">Access duration: {priceInfo.duration_days} days</p>
                  )}
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
                      Processing...
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
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{response}</p>
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