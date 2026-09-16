import React, { useEffect, useRef, useState } from "react";

// ⚠ TEST MODE ONLY — voir note dans SendPaymentModal.jsx.
// Google Pay exige un compte marchand (Google Pay Business Console) et une
// passerelle de paiement supportée pour déchiffrer le jeton en production ;
// aucun des deux n'est encore configuré. En attendant, ce composant tourne
// avec `environment: 'TEST'` + la passerelle de test officielle Google
// ('example'), qui renvoie un jeton factice — jamais un vrai paiement.
const SDK_URL = "https://pay.google.com/gp/p/js/pay.js";
const TEST_MERCHANT_ID = "12345678901234567890"; // placeholder Google (mode TEST uniquement)

let sdkLoadPromise = null;
const loadGooglePaySdk = () => {
  if (window.google?.payments?.api) return Promise.resolve();
  if (!sdkLoadPromise) {
    sdkLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SDK_URL;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }
  return sdkLoadPromise;
};

const buildPaymentDataRequest = (amount, currency) => ({
  apiVersion: 2,
  apiVersionMinor: 0,
  allowedPaymentMethods: [{
    type: "CARD",
    parameters: {
      allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
      allowedCardNetworks: ["MASTERCARD", "VISA"],
    },
    tokenizationSpecification: {
      type: "PAYMENT_GATEWAY",
      // 'example' = passerelle de test Google, ne traite aucun vrai paiement.
      // À remplacer par la vraie passerelle (ex: 'dpo') une fois confirmée.
      parameters: { gateway: "example", gatewayMerchantId: "exampleGatewayMerchantId" },
    },
  }],
  merchantInfo: { merchantId: TEST_MERCHANT_ID, merchantName: "Nkusu (TEST)" },
  transactionInfo: {
    totalPriceStatus: "FINAL",
    totalPrice: Number(amount || 0).toFixed(2),
    currencyCode: currency || "USD",
  },
});

const GooglePayButton = ({ amount, currency, onTestToken, disabled }) => {
  const containerRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | unavailable

  useEffect(() => {
    let cancelled = false;

    loadGooglePaySdk()
      .then(() => {
        if (cancelled) return;
        const paymentsClient = new window.google.payments.api.PaymentsClient({ environment: "TEST" });

        paymentsClient
          .isReadyToPay({
            apiVersion: 2,
            apiVersionMinor: 0,
            allowedPaymentMethods: [buildPaymentDataRequest(amount, currency).allowedPaymentMethods[0]],
          })
          .then((res) => {
            if (cancelled || !res.result) { setStatus("unavailable"); return; }

            const button = paymentsClient.createButton({
              buttonType: "pay",
              buttonSizeMode: "fill",
              onClick: () => {
                paymentsClient
                  .loadPaymentData(buildPaymentDataRequest(amount, currency))
                  .then((paymentData) => onTestToken?.(paymentData))
                  .catch((err) => {
                    if (err.statusCode !== "CANCELED") console.error("Google Pay error", err);
                  });
              },
            });
            containerRef.current?.replaceChildren(button);
            setStatus("ready");
          })
          .catch(() => setStatus("unavailable"));
      })
      .catch(() => setStatus("unavailable"));

    return () => { cancelled = true; };
  }, [amount, currency, onTestToken]);

  if (status === "unavailable") {
    return (
      <p className="text-sm text-gray-500 text-center py-3">
        Google Pay is not available in this browser/environment.
      </p>
    );
  }

  return (
    <div>
      <div ref={containerRef} className={disabled ? "opacity-50 pointer-events-none" : ""} style={{ minHeight: 40 }} />
      {status === "loading" && <p className="text-xs text-gray-400 text-center mt-2">Loading Google Pay…</p>}
    </div>
  );
};

export default GooglePayButton;
