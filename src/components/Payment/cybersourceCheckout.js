// =============================================================================
//  Cybersource Unified Checkout : affiche le formulaire carte dans la page et
//  renvoie un « transient token » (JWT, 15 min) que le backend utilise pour
//  débiter. Le numéro de carte reste chez Cybersource.
//
//  L'adresse de la bibliothèque et son empreinte d'intégrité viennent du
//  capture context lui-même (JWT signé par Cybersource, demandé par le backend).
// =============================================================================

const decodeCaptureContext = (jwt) => {
  const part = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const payload = JSON.parse(atob(part.padEnd(part.length + ((4 - (part.length % 4)) % 4), "=")));
  return payload?.ctx?.[0]?.data || {};
};

const loaded = {};

const loadLibrary = (src, integrity) => {
  if (!loaded[src]) {
    loaded[src] = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      if (integrity) script.integrity = integrity;
      script.crossOrigin = "anonymous";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        delete loaded[src];
        reject(new Error("The secure card form could not be loaded. Check your connection and try again."));
      };
      document.head.appendChild(script);
    });
  }
  return loaded[src];
};

/**
 * Affiche Unified Checkout dans les conteneurs donnés (sélecteurs CSS) et
 * résout avec le transient token une fois la carte saisie et validée.
 */
export async function showCybersourceCheckout(captureContext, { paymentSelection, paymentScreen }) {
  const { clientLibrary, clientLibraryIntegrity } = decodeCaptureContext(captureContext);
  if (!clientLibrary) throw new Error("Invalid card payment session. Please try again.");
  await loadLibrary(clientLibrary, clientLibraryIntegrity);
  if (typeof window.Accept !== "function") throw new Error("The secure card form did not start. Please try again.");

  const accept = await window.Accept(captureContext);
  const up = await accept.unifiedPayments(false); // false = intégré dans la page, pas de panneau latéral
  return up.show({ containers: { paymentSelection, paymentScreen } });
}

/** Message lisible pour une erreur Unified Checkout (AcceptError) ou réseau. */
export const cybersourceErrorText = (err) => {
  const reason = err?.reason || err?.details?.reason;
  if (reason === "CAPTURE_CONTEXT_EXPIRED") return "The payment session expired. Please start again.";
  if (reason === "SHOW_PAYMENT_TIMEOUT" || reason === "SHOW_TOKEN_TIMEOUT") return "The card form timed out. Please try again.";
  return err?.message || "The card payment could not be completed. Please try again.";
};
