import React, { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { motion } from "framer-motion";
import axiosInstance from "../../axiosInstance";

export function SendDPOPaymentModal({
  isOpen,
  onClose,
  featureName,
  phone,
  email,
  onPaymentSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [priceInfo, setPriceInfo] = useState(null);
  const [currency, setCurrency] = useState("UGX");
  const [phoneInput, setPhoneInput] = useState(phone || "");
  const [emailInput, setEmailInput] = useState(email || "");

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
      setResponse("");
    }
  }, [isOpen, featureName]);

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse("");

    try {
      const res = await axiosInstance.post("/api/payments/dpo/initiate", {
        feature_name: featureName,
        phone_number: phoneInput,
        email: emailInput,
        currency: currency,
      });

      if (res.data.success) {
        // Rediriger vers la page de paiement DPO
        window.location.href = res.data.payment_url;
      } else {
        setResponse("Error: " + res.data.error);
        setLoading(false);
      }
    } catch (err) {
      setResponse("Error: " + (err.response?.data?.error || err.message));
      setLoading(false);
    }
  };

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
            <div className="flex items-center text-sm text-gray-700">
              <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Multiple currencies supported
            </div>
          </div>

          {priceInfo && (
            <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-gray-700">
                Feature: <span className="text-green-700">{featureName}</span>
              </p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {priceInfo.price} {currency}
              </p>
              {priceInfo.duration_days && (
                <p className="text-xs text-gray-600 mt-1">
                  Access duration: {priceInfo.duration_days} days
                </p>
              )}
            </div>
          )}

          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Phone Number *
              </label>
              <input
                type="tel"
                placeholder="+256XXXXXXXXX"
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Email (optional)
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
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
              Secure payment powered by DPO Pay (PCI DSS Level 1)
            </p>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}