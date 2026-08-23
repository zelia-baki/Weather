import React from "react";

const COLOR_CLASSES = {
  blue:    { text: "text-blue-600",    button: "bg-blue-600 hover:bg-blue-700" },
  green:   { text: "text-green-600",   button: "bg-green-600 hover:bg-green-700" },
  emerald: { text: "text-emerald-600", button: "bg-emerald-600 hover:bg-emerald-700" },
};

const StepPayment = ({
  selectedFeature,
  phone,
  setShowPaymentModal,
  loading,
  highlightPayment = "",
  canGenerateReport = true, // ✅ vérification passée par le parent
}) => {
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

  // ✅ Garde-fou si selectedFeature a été perdu (ex: refresh corrompu)
  if (!selected) {
    return (
      <div className="max-w-md mx-auto p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 text-center">
        ⚠️ No report type selected. Please go back and choose a report type.
      </div>
    );
  }

  const colors = COLOR_CLASSES[selected.color];
  const FEATURE_TO_MODAL_KEY = {
    reporteudrguest: "eudr",
    reportcarbonguest: "carbon",
    reportndviguest: "sentinel",
  };

  const handlePayClick = () => {
    // ✅ Vérification finale avant d'ouvrir le modal de paiement
    if (!canGenerateReport) return;

    const key = FEATURE_TO_MODAL_KEY[selectedFeature];
    if (!key) return;
    setShowPaymentModal({ eudr: false, carbon: false, sentinel: false, [key]: true });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800 text-center">
        Unlock Your Report
      </h2>

      <div className={`bg-white p-6 rounded-2xl shadow-md max-w-md mx-auto text-center space-y-4 ${highlightPayment}`}>
        <p className="text-sm text-gray-500">
          You are about to purchase the <span className={`font-semibold ${colors.text}`}>{selected.title}</span>.
        </p>
        <p className="text-gray-600 text-sm">{selected.description}</p>

        {!canGenerateReport && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg p-2">
            ⚠️ Some required data (location or contact info) is missing. Please go back and check the previous steps before paying.
          </p>
        )}

        <button
          disabled={loading || !canGenerateReport}
          onClick={handlePayClick}
          className={`w-full py-2 px-4 rounded-lg text-white font-semibold ${
            loading || !canGenerateReport ? "bg-gray-400 cursor-not-allowed" : colors.button
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