import React from "react";

const StepPayment = ({ selectedFeature, phone, setShowPaymentModal, loading }) => {
  const reportDetails = {
    reporteudrguest: {
      title: "Farm (EUDR) Report",
      description: "A compliance report for your farm according to EUDR requirements.",
      color: "blue",
    },
    reportcarbonguest: {
      title: "Carbon Report",
      description: "An analysis of your farm’s carbon footprint and environmental impact.",
      color: "green",
    },
  };

  const selected = reportDetails[selectedFeature];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md max-w-md mx-auto text-center space-y-4">
      <h2 className="text-xl font-bold text-gray-800">
        Unlock Your Report
      </h2>
      <p className="text-sm text-gray-500">
        You are about to purchase the <span className={`font-semibold text-${selected.color}-600`}>{selected.title}</span>.
      </p>
      <p className="text-gray-600 text-sm">{selected.description}</p>

      <button
        disabled={loading}
        onClick={() => {
          if (selectedFeature === "reporteudrguest") {
            setShowPaymentModal({ eudr: true, carbon: false });
          } else if (selectedFeature === "reportcarbonguest") {
            setShowPaymentModal({ carbon: true, eudr: false });
          }
        }}
        className={`w-full py-2 px-4 rounded-lg text-white font-semibold ${
          loading
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
  );
};

export default StepPayment;
