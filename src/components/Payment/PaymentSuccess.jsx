import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../axiosInstance';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const transToken = searchParams.get('TransactionToken');

  const [status, setStatus] = useState('verifying'); // verifying | success | pending | error
  const [message, setMessage] = useState('');
  const [paymentInfo, setPaymentInfo] = useState(null);

  useEffect(() => {
    if (!transToken) {
      setStatus('error');
      setMessage('No transaction token provided');
      return;
    }

    verifyPayment();
  }, [transToken]);

  const verifyPayment = async () => {
    try {
      console.log('[PAYMENT SUCCESS] Verifying payment:', transToken);
      
      const res = await axiosInstance.get(`/api/payments/dpo/verify/${transToken}`);
      
      console.log('[PAYMENT SUCCESS] Verification response:', res.data);

      // HTTP 200 = Success
      if (res.status === 200 && res.data.status === 'paid') {
        setStatus('success');
        setMessage('Payment confirmed successfully!');
        
        // Fetch payment details if needed
        fetchPaymentDetails();
        
        // Optionally redirect after 3 seconds
        setTimeout(() => {
          navigate('/home');
        }, 3000);
      } 
      // HTTP 202 = Still pending
      else if (res.status === 202) {
        setStatus('pending');
        setMessage('Payment is being processed. Please wait...');
      }
    } catch (error) {
      console.error('[PAYMENT SUCCESS] Verification error:', error);
      
      // Si erreur réseau, considérer comme pending
      setStatus('pending');
      setMessage('Unable to verify payment status. Please check your account later.');
    }
  };

  const fetchPaymentDetails = async () => {
    try {
      const res = await axiosInstance.get('/api/payments/my-access');
      if (res.data && res.data.length > 0) {
        setPaymentInfo(res.data[res.data.length - 1]); // Latest payment
      }
    } catch (error) {
      console.error('[PAYMENT SUCCESS] Failed to fetch payment details:', error);
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
              <svg
                className="h-12 w-12 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Payment Successful!
            </h2>
            
            <p className="text-gray-600 mb-6">
              Your payment has been confirmed and your feature access has been activated.
            </p>

            {paymentInfo && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Feature:</span>
                  <span className="font-semibold text-gray-900">{paymentInfo.feature}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Amount:</span>
                  <span className="font-semibold text-gray-900">
                    {paymentInfo.amount} {paymentInfo.currency}
                  </span>
                </div>
                {paymentInfo.expires && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Expires:</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(paymentInfo.expires).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => navigate('/home')}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 font-medium transition-colors"
              >
                Go to Dashboard
              </button>
              
              <button
                onClick={() => navigate(-2)}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Continue Browsing
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-6">
              Transaction ID: {transToken}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 mb-6">
              <svg
                className="animate-spin h-12 w-12 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Payment Processing
            </h2>
            
            <p className="text-gray-600 mb-6">
              {message || 'Your payment is being verified. This may take a few moments...'}
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-left text-sm text-blue-800">
                  <p className="font-medium mb-1">What's happening?</p>
                  <ul className="space-y-1 text-blue-700">
                    <li>Your payment is being confirmed</li>
                    <li>This can take a few minutes</li>
                    <li>You'll receive an email confirmation</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={verifyPayment}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Check Status Again
              </button>
              
              <button
                onClick={() => navigate('/home')}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Go to Dashboard
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-6">
              Transaction ID: {transToken}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
              <svg
                className="h-12 w-12 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Verification Error
            </h2>
            
            <p className="text-gray-600 mb-6">
              {message || 'Unable to verify payment status'}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/home')}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                Go to Dashboard
              </button>
              
              <button
                onClick={() => navigate('/contactus')}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: verifying
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Verifying Payment...
          </h2>
          <p className="text-gray-600">Please wait</p>
        </div>
      </div>
    </div>
  );
}