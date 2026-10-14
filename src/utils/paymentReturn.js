// ─────────────────────────────────────────────────────────────────────────────
// Retour après paiement par carte (DPO) dans le MÊME onglet.
//
// Avant de partir chez DPO, la page mémorise où revenir. DPO renvoie sur
// /payment/success (ou /payment/cancelled) : ces pages lisent ce mémo et
// renvoient l'utilisateur à l'étape où il s'était arrêté, au lieu d'une page de
// confirmation qui l'obligeait à retrouver son onglet d'origine.
// ─────────────────────────────────────────────────────────────────────────────

const KEY = "payment_return";
const MAX_AGE_MS = 2 * 60 * 60 * 1000; // au-delà, le mémo est ignoré

export const rememberPaymentReturn = (ref, path) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ref, path, at: Date.now() }));
  } catch {
    // stockage indisponible : on retombe sur la page de confirmation classique
  }
};

export const peekPaymentReturn = () => {
  try {
    const memo = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!memo?.path || Date.now() - memo.at > MAX_AGE_MS) return null;
    return memo;
  } catch {
    return null;
  }
};

export const clearPaymentReturn = () => {
  try { localStorage.removeItem(KEY); } catch { /* stockage indisponible */ }
};
