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
export const featurePaymentProvider = ({ featureName, agentId, guest = false }) => {
  const forgetSession = () => { if (guest) localStorage.removeItem("token"); };

  return {
    mobileMoneyCurrencies: ["UGX"],

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

// ── Abonnements (/api/subscriptions) ────────────────────────────────────────
//   Une livraison d'abonnement est une commande boutique normale : la
//   vérification passe par les mêmes routes que shopCheckoutProvider.
const subscriptionProvider = (initiate) => ({
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
});

const payDelivery = async (token, orderId, payment_method, { phone, email }) => {
  const res = await axiosInstance.post(
    `/api/subscriptions/manage/${token}/orders/${orderId}/pay`,
    { payment_method, phone_number: phone, email },
  );
  if (!res.data?.success) throw new Error(res.data?.error || "Payment could not be started");
  return res.data;
};

//   S'abonner + payer la 1re livraison.
//   subscription : { product_id, quantity_kg, frequency_weeks, guest_name,
//                    email, shipping_address }
//   createdRef   : useRef de la page. Après la 1re tentative, il contient
//                  { manage_token, order_id, manage_url } : un nouvel essai
//                  paie alors la MÊME commande au lieu de créer un 2e abonnement.
//   onCreated    : appelé une seule fois, quand l'abonnement est créé.
export const subscriptionCheckoutProvider = (subscription, createdRef, onCreated) =>
  subscriptionProvider(async (payment_method, { phone, email }) => {
    const created = createdRef?.current;
    if (created) return payDelivery(created.manage_token, created.order_id, payment_method, { phone, email });

    const remember = (data) => {
      if (data?.manage_token) {
        onCreated?.({ manage_token: data.manage_token, order_id: data.order_id, manage_url: data.manage_url });
      }
    };
    try {
      const res = await axiosInstance.post("/api/subscriptions/create", {
        ...subscription,
        email: email || subscription.email,
        phone_number: phone,
        payment_method,
      });
      remember(res.data);
      if (!res.data?.success) throw new Error(res.data?.error || "Payment could not be started");
      return res.data;
    } catch (err) {
      // Abonnement créé mais paiement refusé au démarrage : on garde le lien.
      remember(err?.response?.data);
      throw err;
    }
  });

//   Payer une livraison existante, depuis la page de l'abonnement.
export const subscriptionDeliveryProvider = (token, orderId) =>
  subscriptionProvider((payment_method, args) => payDelivery(token, orderId, payment_method, args));