

// ============================================
// src/components/Payment/PaymentError.jsx
// ============================================
export function PaymentError() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const errorMsg = searchParams.get("error") || "An unexpected error occurred";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
          <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-red-600 mb-2">Payment Error</h2>
        <p className="text-gray-600 mb-6">{errorMsg}</p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800">
            ⚠️ If the problem persists, please contact support
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
          <button
            onClick={() => navigate("/contactus")}
            className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}