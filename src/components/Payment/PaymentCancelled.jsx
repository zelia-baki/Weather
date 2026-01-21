import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function PaymentCancelled() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const transToken = searchParams.get('TransactionToken');

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-yellow-100 mb-6">
            <svg
              className="h-12 w-12 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Payment Not Completed
          </h2>
          
          <p className="text-gray-600 mb-6">
            You have cancelled the payment or closed the payment window.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">What does this mean?</p>
                <ul className="space-y-1 text-yellow-700">
                  <li>Your payment was not processed</li>
                  <li>No charges have been made</li>
                  <li>You can try again anytime</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate(-2)}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Try Again
            </button>
            
            <button
              onClick={() => navigate('/home')}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 font-medium transition-colors"
            >
              Go to Dashboard
            </button>
          </div>

          {transToken && (
            <p className="text-xs text-gray-500 mt-6">
              Transaction ID: {transToken}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}