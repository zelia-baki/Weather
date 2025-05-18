import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import { motion } from "framer-motion";
import axiosInstance from "../../axiosInstance"; // Vérifie le chemin !

export function CheckStatusModal({ isOpen, onClose }) {
  const [txnId, setTxnId] = useState("");
  const [response, setResponse] = useState("");

  const handleCheck = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.get(`/api/payments/status/${txnId}`);
      setResponse(res.data.status || "Unknown status");
    } catch (err) {
      setResponse("Error: " + (err.response?.data?.msg || err.message));
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl z-10"
        >
          <Dialog.Title className="text-lg font-bold mb-4">Check Payment Status</Dialog.Title>
          <form onSubmit={handleCheck} className="space-y-4">
            <input
              type="text"
              placeholder="Transaction ID"
              className="w-full p-2 border rounded"
              value={txnId}
              onChange={(e) => setTxnId(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full bg-purple-500 text-white py-2 rounded hover:bg-purple-600"
            >
              Check Status
            </button>
          </form>
          {response && <p className="mt-2 text-sm text-gray-600">{response}</p>}
        </motion.div>
      </div>
    </Dialog>
  );
}
