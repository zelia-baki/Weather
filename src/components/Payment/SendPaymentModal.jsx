import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../axiosInstance";
import PaymentModal from "./PaymentModal";
import { featurePaymentProvider } from "./paymentProviders";

// Paiement d'une fonctionnalité / d'un rapport. Simple adaptateur : charge le
// prix de la feature puis délègue tout à <PaymentModal> (voir ce fichier pour
// l'utiliser ailleurs, ex. la boutique).
const FEATURE_TITLES = {
  reporteudrguest: "Farm (EUDR) Report",
  reportcarbonguest: "Carbon Report",
  reportndviguest: "Sentinel / Vegetation Report",
  eudrsubmission: "EUDR Submission",
};

export function SendPaymentModal({
  isOpen,
  onClose,
  featureName,
  phone: passedPhone,
  email: passedEmail,
  agent_id: passedAgent,
  onPaymentSuccess,
  onSuccess, // alias accepté (PaymentRequired l'utilisait déjà)
}) {
  const navigate = useNavigate();
  const [priceInfo, setPriceInfo] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    axiosInstance.get("/api/feature/price/")
      .then((res) => setPriceInfo(res.data.find((f) => f.feature_name === featureName) || { prices: {} }))
      .catch((err) => console.error("Failed to fetch price info:", err));
  }, [isOpen, featureName]);

  const provider = useMemo(() => featurePaymentProvider({
    featureName,
    agentId: passedAgent,
    guest: !!passedPhone,
    // Mobile Money prélève dans la devise par défaut de la feature.
    mobileMoneyCurrencies: priceInfo?.default_currency ? [priceInfo.default_currency] : undefined,
  }), [featureName, passedAgent, passedPhone, priceInfo]);

  const handleSuccess = ({ method, ref }) => {
    const done = onPaymentSuccess || onSuccess;
    if (done) return done();
    if (method === "card") window.location.href = `/payment/success?TransactionToken=${ref}`;
    else navigate(`/${featureName}`);
  };

  return (
    <PaymentModal
      isOpen={isOpen}
      onClose={onClose}
      title={FEATURE_TITLES[featureName] || featureName}
      prices={priceInfo ? priceInfo.prices || {} : null}
      defaultCurrency={priceInfo?.default_currency}
      note={priceInfo?.duration_days ? `Access for ${priceInfo.duration_days} days` : null}
      phone={passedPhone || ""}
      email={passedEmail || ""}
      lockPhone={!!passedPhone}
      provider={provider}
      onSuccess={handleSuccess}
    />
  );
}
