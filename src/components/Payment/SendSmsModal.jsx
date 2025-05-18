import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import { motion } from "framer-motion";
import axiosInstance from "../../axiosInstance"; // Assurez-vous que le chemin est correct

export function SendSmsModal({ isOpen, onClose }) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post("/api/notifications/sms", {
        phone_number: phone,
        message,
      });
      setResponse(res.data.msg || "Sent successfully");
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
          <Dialog.Title className="text-lg font-bold mb-4">Send SMS</Dialog.Title>
          <form onSubmit={handleSend} className="space-y-4">
            <input
              type="text"
              placeholder="Phone Number"
              className="w-full p-2 border rounded"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <textarea
              placeholder="Message"
              className="w-full p-2 border rounded"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Send SMS
            </button>
          </form>
          {response && <p className="mt-2 text-sm text-gray-600">{response}</p>}
        </motion.div>
      </div>
    </Dialog>
  );
}
