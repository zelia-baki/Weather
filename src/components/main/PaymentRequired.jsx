import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SendPaymentModal } from "../Payment/SendPaymentModal";

export default function PaymentRequired() {
    const navigate = useNavigate();
    const location = useLocation();
    const [showModal, setShowModal] = useState(false);

    const featureName = location.state?.featureName || "unknown-feature";
    console.log('ato amin payementrequired',featureName);

    const handlePaymentSuccess = () => {
        // Redirige vers la page précédente ou une page spécifique
        navigate(location.state?.from || "/");
    };

    return (
        <div className="min-h-screen flex items-center justify-center flex-col text-center p-4">
            <h1 className="text-2xl font-semibold text-red-600 mb-4">Restricted access</h1>
            <p className="text-gray-700 mb-6">
                This feature requires payment to access.
            </p>
            <div className="space-x-4">
                <button
                    onClick={() => navigate(-1)}
                    className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                >
                    Back
                </button>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                >
                    Pay now
                </button>
            </div>

            {showModal && (
                <SendPaymentModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onSuccess={handlePaymentSuccess}
                    featureName={featureName}
                />

            )}
        </div>
    );
}
