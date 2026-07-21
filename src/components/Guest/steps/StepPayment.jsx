import React from "react";

const StepPayment = ({ selectedFeature, phone, setShowPaymentModal, loading, highlightPayment = "" }) => {
  const reportDetails = {
    reporteudrguest: {
      title: "Farm (EUDR) Report",
      description: "A compliance report for your farm according to EUDR requirements.",
      color: "blue",
    },
    reportcarbonguest: {
      title: "Carbon Report",
      description: "An analysis of your farm's carbon footprint and environmental impact.",
      color: "green",
    },
    reportndviguest: {
      title: "sentinel / Vegetation Report",
      description: "Satellite-based vegetation health analysis (NDVI, NDMI, EVI...) for your plot.",
      color: "emerald",
    },
  };

  const selected = reportDetails[selectedFeature];
  const FEATURE_TO_MODAL_KEY = {
    reporteudrguest: "eudr",
    reportcarbonguest: "carbon",
    reportndviguest: "sentinel",
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800 text-center">
        Unlock Your Report
      </h2>

      {/* ✅ Appliquer le highlight uniquement sur la card de paiement */}
      <div className={`bg-white p-6 rounded-2xl shadow-md max-w-md mx-auto text-center space-y-4 ${highlightPayment}`}>
        <p className="text-sm text-gray-500">
          You are about to purchase the <span className={`font-semibold text-${selected.color}-600`}>{selected.title}</span>.
        </p>
        <p className="text-gray-600 text-sm">{selected.description}</p>

        <button
          disabled={loading}
          onClick={() => {
            const key = FEATURE_TO_MODAL_KEY[selectedFeature];
            if (!key) return;
            setShowPaymentModal({ eudr: false, carbon: false, sentinel: false, [key]: true });
          }}
          className={`w-full py-2 px-4 rounded-lg text-white font-semibold ${loading
            ? "bg-gray-400 cursor-not-allowed"
            : `bg-${selected.color}-600 hover:bg-${selected.color}-700`
            }`}
        >
          {loading ? "Processing..." : "Pay Now"}
        </button>

        <p className="text-xs text-gray-400">
          Linked to phone number: <span className="font-medium">{phone}</span>
        </p>
      </div>
    </div>
  );
};

export default StepPayment;