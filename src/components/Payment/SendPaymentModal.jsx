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
  const [paymentSuccess, setPaymentSuccess] = useState(false);

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
      setPaymentSuccess(false);
      setLoading(false);
      setPolling(false);
    }
  }, [isOpen, featureName]);

  // ============ MOBILE MONEY LOGIC ============
  const handleMobileMoneyPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse("");
    setPaymentSuccess(false);

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
          setPaymentSuccess(true);
          setResponse("Payment successful!");
          setPolling(false);
          setLoading(false);
          
          // Appeler le callback si fourni
          if (onPaymentSuccess) {
            setTimeout(() => onPaymentSuccess(), 1500);
          }
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

  // ============ DPO PAY LOGIC (CORRIGÉ) ============
  const handleDPOPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse("");
    setPaymentSuccess(false);

    console.log("\n" + "=".repeat(60));
    console.log("🔵 FRONTEND: Initiating DPO Payment");
    console.log("=".repeat(60));

    try {
      const res = await axiosInstance.post("/api/payments/dpo/initiate", {
        feature_name: featureName,
        phone_number: effectivePhone,
        email: emailInput,
        currency: currency,
      });

      console.log("🟢 FRONTEND: Response received!");
      console.log("Response data:", res.data);

      if (res.data.success) {
        console.log("✅ Opening DPO in new tab and starting polling...");
        
        // Ouvrir DPO dans un nouvel onglet
        const dpoTab = window.open(res.data.payment_url, '_blank');
        
        if (!dpoTab) {
          setResponse("Popup blocked! Please allow popups for this site and try again.");
          setLoading(false);
          return;
        }

        setResponse("Payment window opened. Please complete your payment in the new tab.");
        
        // Démarrer le polling (max 5 heures)
        setPolling(true);
        startDPOPolling(res.data.trans_token);
      } else {
        console.error("❌ FRONTEND: Success = false");
        setResponse("Error: " + res.data.error);
        setLoading(false);
      }
    } catch (err) {
      console.error("❌ FRONTEND: Exception caught!", err);
      setResponse("Error: " + (err.response?.data?.error || err.message));
      setLoading(false);
    }
  };

  const startDPOPolling = (transToken) => {
    console.log("🔄 Starting DPO polling for token:", transToken);
    let attempts = 0;
    const maxAttempts = 6000; // 5 heures (6000 * 3s = 18000s = 5h)
    
    const interval = setInterval(async () => {
      attempts++;
      
      // Log toutes les 20 tentatives (chaque minute)
      if (attempts % 20 === 0) {
        console.log(`🔍 DPO Polling: ${attempts}/${maxAttempts} attempts (${Math.round(attempts/1200)}h elapsed)`);
      }
      
      try {
        const res = await axiosInstance.get(`/api/payments/dpo/verify/${transToken}`);
        const verification = res.data;

        if (verification.success && verification.status === "verified") {
          console.log("✅ DPO Payment verified!");
          clearInterval(interval);
          setPolling(false);
          setLoading(false);
          setPaymentSuccess(true);
          setResponse("Payment successful!");
          
          // Appeler le callback si fourni
          if (onPaymentSuccess) {
            setTimeout(() => onPaymentSuccess(verification), 1500);
          }
        } else if (verification.status === "failed") {
          console.log("❌ DPO Payment failed");
          clearInterval(interval);
          setPolling(false);
          setLoading(false);
          setResponse("Payment failed. Please try again.");
        } else if (attempts >= maxAttempts) {
          console.log("⏰ DPO Polling timeout (5 hours)");
          clearInterval(interval);
          setPolling(false);
          setLoading(false);
          setResponse("Payment verification timeout. Please contact support if you were charged.");
        }
        // Sinon, continuer le polling (statut "pending" ou autre)
      } catch (err) {
        console.error("Error during DPO verification:", err);
        
        // Ne pas arrêter le polling sur une erreur temporaire
        // Seulement arrêter après timeout
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setPolling(false);
          setLoading(false);
          setResponse("Payment verification failed. Please contact support.");
        }
      }
    }, 3000); // Vérifier toutes les 3 secondes
  };

  return (
    <Dialog open={isOpen} onClose={polling ? () => {} : onClose} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        
        <Dialog.Panel className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-auto">
          {/* Bouton fermer (désactivé pendant polling) */}
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 transition-colors ${
              polling ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600'
            }`}
            disabled={polling}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Message de succès */}
          {paymentSuccess && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center py-8"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
              <p className="text-gray-600">Your payment has been confirmed</p>
            </motion.div>
          )}

          {/* Interface normale */}
          {!paymentSuccess && (
            <>
              {/* ÉTAPE 1: Sélection de la méthode de paiement */}
              {!paymentMethod && (
                <>
                  <Dialog.Title className="text-2xl font-bold mb-2 text-gray-800">
                    Choose Payment Method
                  </Dialog.Title>
                  <p className="text-sm text-gray-600 mb-6">Select how you'd like to pay</p>

                  {priceInfo && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Amount to pay</p>
                          <p className="text-3xl font-bold text-green-600">
                            {priceInfo.price} {currency}
                          </p>
                        </div>
                        {priceInfo.duration_days && (
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Access duration</p>
                            <p className="text-lg font-semibold text-gray-700">{priceInfo.duration_days} days</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {/* Option Mobile Money */}
                    <button
                      onClick={() => setPaymentMethod('mobile_money')}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-200">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-800">Mobile Money</p>
                          <p className="text-xs text-gray-500">MTN, Airtel</p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Option DPO Pay */}
                    <button
                      onClick={() => setPaymentMethod('dpo')}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-800">Card or Mobile Money</p>
                          <p className="text-xs text-gray-500">Visa, Mastercard, MTN, Airtel, etc.</p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </>
              )}

              {/* ÉTAPE 2: Formulaire Mobile Money */}
              {paymentMethod === 'mobile_money' && (
                <>
                  <button
                    onClick={() => setPaymentMethod(null)}
                    className="mb-4 text-sm text-gray-600 hover:text-gray-800 flex items-center"
                    disabled={polling}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to payment methods
                  </button>

                  <Dialog.Title className="text-xl font-bold mb-2">
                    Mobile Money Payment
                  </Dialog.Title>
                  <p className="text-sm text-gray-600 mb-4">
                    You'll receive a prompt on your phone to confirm payment
                  </p>

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

                    <button
                      type="submit"
                      className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 font-medium disabled:bg-gray-400"
                      disabled={loading || polling}
                    >
                      {loading || polling ? "Waiting for confirmation..." : "Send Payment"}
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
                    disabled={polling}
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
                      <select
                        className="w-full p-2.5 border rounded-lg"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        disabled={loading || polling}
                      >
                        <option value="UGX">UGX - Ugandan Shilling</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="KES">KES - Kenyan Shilling</option>
                        <option value="TZS">TZS - Tanzanian Shilling</option>
                        <option value="ZAR">ZAR - South African Rand</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 flex items-center justify-center"
                      disabled={loading || polling}
                    >
                      {loading || polling ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Verifying payment...
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
                            • Complete your payment in the new tab<br/>
                            • Don't close this window - we're waiting for confirmation<br/>
                            • This can take up to 5 hours
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {response && !polling && (
                    <div className={`mt-4 p-3 rounded-lg border ${
                      response.includes('successful') ? 'bg-green-50 border-green-200 text-green-700' :
                      response.includes('opened') ? 'bg-blue-50 border-blue-200 text-blue-700' :
                      'bg-red-50 border-red-200 text-red-700'
                    }`}>
                      <p className="text-sm">{response}</p>
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
            </>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}