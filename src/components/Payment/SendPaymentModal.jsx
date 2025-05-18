import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import { motion } from "framer-motion";
import axiosInstance from "../../axiosInstance";

export function SendPaymentModal({ isOpen, onClose, onSuccess, featureName }) {
  const [phone, setPhone] = useState("");
  const [txnId, setTxnId] = useState("123" + Date.now());
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse("");
    try {
      const res = await axiosInstance.post("/api/payments/initiate", {
        phone_number: phone,
        feature_name: featureName,
        txn_id: txnId,
      });

      setResponse(res.data.msg || "Payment initiated. Please confirm on your phone.");
      setPolling(true);
      startPolling(txnId, phone);
    } catch (err) {
      setResponse("Erreur : " + (err.response?.data?.error || err.message));
      setLoading(false);
    }
  };

  const startPolling = (txnId, phone) => {
    let attempts = 0;
    const maxAttempts = 40; // ≈ 2 minutes
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
        if (onSuccess) onSuccess();
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
          <Dialog.Title className="text-lg font-bold mb-4">
            Payment for : {featureName}
          </Dialog.Title>
          <form onSubmit={handlePayment} className="space-y-4">
            <input
              type="tel"
              placeholder="Numéro de téléphone"
              className="w-full p-2 border rounded"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              disabled={loading || polling}
            />
            <input
              type="text"
              placeholder="Transaction ID"
              className="w-full p-2 border rounded"
              value={txnId}
              onChange={(e) => setTxnId(e.target.value)}
              required
              disabled={loading || polling}
            />
            <button
              type="submit"
              className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
              disabled={loading || polling}
            >
              {loading ? "Envoi en cours..." : polling ? "Waiting for validation..." : "Send payment"}
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
