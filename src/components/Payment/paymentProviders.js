import axiosInstance from "../../axiosInstance";

// =============================================================================
//  Providers pour <PaymentModal>. Un provider traduit les quatre gestes
//  génériques (lancer / vérifier, Mobile Money / carte) vers les endpoints
//  d'un produit. Pour un nouveau produit payant, on écrit un provider ici —
//  le modal, lui, ne change pas.
// =============================================================================

const statusOf = (res) => res.data?.status;

// ── Fonctionnalités / rapports payants (/api/payments) ──────────────────────
//   featureName : nom de la feature dans /api/feature/price/
//   agentId     : agent terrain à qui rattacher le paiement (comptabilité)
//   guest       : paiement invité → on purge un éventuel token résiduel,
//                 sinon le backend rattacherait le paiement au mauvais compte
export const featurePaymentProvider = ({ featureName, agentId, guest = false, mobileMoneyCurrencies }) => {
  const forgetSession = () => { if (guest) localStorage.removeItem("token"); };

  return {
    mobileMoneyCurrencies,

    async startMobileMoney({ phone }) {
      forgetSession();
      const txnId = `${agentId || "1234"}${Date.now()}`;
      const res = await axiosInstance.post("/api/payments/initiate", {
        phone_number: phone,
        feature_name: featureName,
        txn_id: txnId,
        agent_id: agentId || undefined,
      });
      return { ref: { txnId, phone }, message: res.data?.msg };
    },

    async checkMobileMoney({ txnId, phone }) {
      const status = String(statusOf(await axiosInstance.get(`/api/payments/status/${txnId}`)) || "").toLowerCase();
      if (!(status.includes("success") || status.includes("confirmed"))) return status;

      // Paiement confirmé : on s'assure que l'accès est bien ouvert.
      const access = await axiosInstance.get(`/api/payments/access/${featureName}`, {
        params: { phone_number: phone },
      });
      if (!access.data?.access) throw new Error("Payment confirmed, but access not activated yet.");
      return "paid";
    },

    async startCard({ phone, email, currency }) {
      forgetSession();
      const res = await axiosInstance.post("/api/payments/dpo/initiate", {
        feature_name: featureName,
        phone_number: phone,
        email,
        currency,
        agent_id: agentId || undefined,
      });
      if (!res.data?.success) throw new Error(res.data?.error || "Payment could not be started");
      return { url: res.data.payment_url, ref: res.data.trans_token };
    },

    async checkCard(transToken) {
      return statusOf(await axiosInstance.get(`/api/payments/dpo/verify/${transToken}`));
    },
  };
};

// ── Boutique (/api/ecommerce/checkout) ──────────────────────────────────────
//   order : { items, guest_name, email, shipping_address } — chaque tentative
//   de paiement crée une commande côté serveur, au prix recalculé par lui.
export const shopCheckoutProvider = (order) => {
  const initiate = async (payment_method, { phone, email }) => {
    const res = await axiosInstance.post("/api/ecommerce/checkout/initiate", {
      ...order,
      email: email || order.email,
      phone_number: phone,
      payment_method,
    });
    if (!res.data?.success) throw new Error(res.data?.error || "Payment could not be started");
    return res.data;
  };

  return {
    mobileMoneyCurrencies: ["UGX"],

    async startMobileMoney(args) {
      const data = await initiate("mobile_money", args);
      return { ref: data.txn_id, message: data.msg };
    },

    async checkMobileMoney(txnId) {
      return statusOf(await axiosInstance.get(`/api/ecommerce/checkout/mobile/status/${txnId}`));
    },

    async startCard(args) {
      const data = await initiate("dpo", args);
      return { url: data.payment_url, ref: data.trans_token };
    },

    async checkCard(transToken) {
      return statusOf(await axiosInstance.get(`/api/ecommerce/checkout/verify/${transToken}`));
    },
  };
};
