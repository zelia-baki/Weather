
// ============================================
// src/components/Payment/PaymentCancelled.jsx
// ============================================
export function PaymentCancelled() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const transToken = searchParams.get("trans_token");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        {/* Cancel Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-4">
          <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Cancelled</h2>
        <p className="text-gray-600 mb-6">
          You've cancelled the payment process. No charges were made to your account.
        </p>

        {transToken && (
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="text-xs text-gray-500">Transaction: {transToken.substring(0, 20)}...</p>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            💡 You can try again anytime to access premium features
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate("/EUDRSubmissionForGuest")}
            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate("/home")}
            className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
}