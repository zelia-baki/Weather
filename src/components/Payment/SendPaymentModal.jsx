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
  agent_id: passedAgent,
  onPaymentSuccess,
}) {
  const [txnId, setTxnId] = useState((passedAgent || "1234") + Date.now());
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [priceInfo, setPriceInfo] = useState(null);

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

    if (isOpen) fetchPrice();
  }, [isOpen, featureName]);

  const handlePayment = async (e) => {
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
      setResponse("Error : " + (err.response?.data?.error || err.message));
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
          onPaymentSuccess(); // e.g. reload a report
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

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          as={motion.div}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
        >
          <Dialog.Title className="text-xl font-bold mb-4">
            Payment for: <span className="text-green-600">{featureName}</span>
          </Dialog.Title>

          {priceInfo && (
            <div className="mb-4 text-gray-700">
              <p className="font-medium">Price: {priceInfo.price} UGX</p>
              {priceInfo.duration_days && (
                <p className="text-sm">Access duration: {priceInfo.duration_days} days</p>
              )}
            </div>
          )}

          <form onSubmit={handlePayment} className="space-y-4">
            {!passedPhone && (
              <input
                type="tel"
                placeholder="Your phone number"
                className="w-full p-2 border rounded"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                required
                disabled={loading || polling}
              />
            )}

            {effectivePhone && (
              <p className="text-sm text-gray-600">
                Sending payment with phone: +<strong>{effectivePhone}</strong>
              </p>
            )}

            <input
              type="text"
              placeholder="Transaction ID"
              className="w-full p-2 border rounded bg-gray-100 text-gray-600 cursor-not-allowed"
              value={txnId}
              readOnly
            />

            <button
              type="submit"
              className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
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
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
