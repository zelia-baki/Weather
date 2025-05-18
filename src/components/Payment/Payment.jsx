import React, { useState } from "react";

export default function NkusuDashboard() {
  const [smsPhone, setSmsPhone] = useState("");
  const [smsMessage, setSmsMessage] = useState("");
  const [smsResponse, setSmsResponse] = useState("");

  const [payPhone, setPayPhone] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [txnId, setTxnId] = useState("");
  const [paymentResponse, setPaymentResponse] = useState("");

  const [checkTxnId, setCheckTxnId] = useState("");
  const [statusResponse, setStatusResponse] = useState("");

  const sendSms = async (e) => {
    e.preventDefault();
    const url = `https://188.166.125.28/nkusu-iot/api/nkusu-iot/sms?msg=${encodeURIComponent(
      smsMessage
    )}&msisdns=${smsPhone}`;
    try {
      const res = await fetch(url);
      setSmsResponse(`Statut: ${res.status}`);
    } catch (err) {
      setSmsResponse("Erreur: " + err.message);
    }
  };

  const sendPayment = async (e) => {
    e.preventDefault();
    const url = `https://188.166.125.28/nkusu-iot/api/nkusu-iot/payments?amount=${payAmount}&msisdn=${payPhone}&txnId=${txnId}`;
    try {
      const res = await fetch(url, { method: "POST" });
      const text = await res.text();
      setPaymentResponse(`Réponse: ${text}`);
    } catch (err) {
      setPaymentResponse("Erreur: " + err.message);
    }
  };

  const checkPaymentStatus = async (e) => {
    e.preventDefault();
    const url = `https://188.166.125.28/nkusu-iot/api/nkusu-iot/payments/${checkTxnId}`;
    try {
      const res = await fetch(url);
      const text = await res.text();
      setStatusResponse(`Statut: ${text}`);
    } catch (err) {
      setStatusResponse("Erreur: " + err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-10">
      <h1 className="text-2xl font-bold">Nkusu IOT - Transactions & SMS</h1>

      <form
        onSubmit={sendSms}
        className="bg-white shadow-md rounded-xl p-6 space-y-4"
      >
        <h2 className="text-xl font-semibold">Envoyer un SMS</h2>
        <input
          type="text"
          placeholder="Numéro (ex: 256783130358)"
          value={smsPhone}
          onChange={(e) => setSmsPhone(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Message"
          value={smsMessage}
          onChange={(e) => setSmsMessage(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Envoyer SMS
        </button>
        {smsResponse && <p className="text-sm text-gray-700">{smsResponse}</p>}
      </form>

      <form
        onSubmit={sendPayment}
        className="bg-white shadow-md rounded-xl p-6 space-y-4"
      >
        <h2 className="text-xl font-semibold">Envoyer un Paiement Mobile Money</h2>
        <input
          type="text"
          placeholder="Numéro (ex: 256772247408)"
          value={payPhone}
          onChange={(e) => setPayPhone(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="number"
          placeholder="Montant (ex: 5000)"
          value={payAmount}
          onChange={(e) => setPayAmount(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Transaction ID"
          value={txnId}
          onChange={(e) => setTxnId(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
        >
          Envoyer Paiement
        </button>
        {paymentResponse && <p className="text-sm text-gray-700">{paymentResponse}</p>}
      </form>

      <form
        onSubmit={checkPaymentStatus}
        className="bg-white shadow-md rounded-xl p-6 space-y-4"
      >
        <h2 className="text-xl font-semibold">Vérifier le statut du paiement</h2>
        <input
          type="text"
          placeholder="Transaction ID (ex: 123)"
          value={checkTxnId}
          onChange={(e) => setCheckTxnId(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-purple-500 text-white py-2 rounded hover:bg-purple-600"
        >
          Vérifier Statut
        </button>
        {statusResponse && <p className="text-sm text-gray-700">{statusResponse}</p>}
      </form>
    </div>
  );
}
