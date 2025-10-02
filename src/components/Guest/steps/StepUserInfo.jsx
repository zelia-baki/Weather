import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

const StepUserInfo = ({ 
  userInfo, 
  setUserInfo, 
  onSubmit, 
  loading, 
  isValid = false, 
  highlightUserInfo = "" 
}) => {
  // ✅ Individual field validation
  const isPhoneValid = userInfo.phone && userInfo.phone.trim() !== '';
  const isEmailValid = userInfo.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInfo.email);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800 text-center">
        Enter Your Contact Information
      </h2>
      <p className="text-sm text-gray-500 text-center">
        Please provide your phone number (starting with 256) and email address.
      </p>

      {/* Form with highlight */}
      <form
        onSubmit={onSubmit}
        className={`bg-white p-6 rounded-2xl shadow-md max-w-md mx-auto space-y-4 ${highlightUserInfo}`}
      >
        {/* Agent ID - Optional */}
        <div className="text-left">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Agent ID <span className="text-gray-400 text-xs">(Optional)</span>
          </label>
          <input
            type="text"
            value={userInfo.agent_id}
            onChange={(e) =>
              setUserInfo((prev) => ({ ...prev, agent_id: e.target.value }))
            }
            placeholder="e.g. 123XXXXXXXXX"
            className="block w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Phone field - Required */}
        <div className="text-left">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
            <span>
              Phone Number <span className="text-red-500">*</span>
            </span>
            {userInfo.phone && (
              isPhoneValid ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )
            )}
          </label>
          <input
            type="text"
            value={userInfo.phone}
            onChange={(e) =>
              setUserInfo((prev) => ({ ...prev, phone: e.target.value }))
            }
            placeholder="e.g. 256XXXXXXXXX"
            className={`block w-full p-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
              !userInfo.phone
                ? 'border-gray-300 focus:ring-blue-500'
                : isPhoneValid
                ? 'border-green-300 focus:ring-green-500 bg-green-50/30'
                : 'border-red-300 focus:ring-red-500 bg-red-50/30'
            }`}
            required
          />
          {userInfo.phone && !isPhoneValid && (
            <p className="text-xs text-red-600 mt-1">Phone number is required</p>
          )}
        </div>

        {/* Email field - Required */}
        <div className="text-left">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
            <span>
              Email Address <span className="text-red-500">*</span>
            </span>
            {userInfo.email && (
              isEmailValid ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )
            )}
          </label>
          <input
            type="email"
            value={userInfo.email}
            onChange={(e) =>
              setUserInfo((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="example@email.com"
            className={`block w-full p-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
              !userInfo.email
                ? 'border-gray-300 focus:ring-blue-500'
                : isEmailValid
                ? 'border-green-300 focus:ring-green-500 bg-green-50/30'
                : 'border-red-300 focus:ring-red-500 bg-red-50/30'
            }`}
            required
          />
          {userInfo.email && !isEmailValid && (
            <p className="text-xs text-red-600 mt-1">Please enter a valid email address</p>
          )}
        </div>

        {/* Submit button with validation */}
        <button
          type="submit"
          disabled={loading || !isValid}
          className={`w-full py-2 px-4 rounded-lg text-white font-semibold transition-all ${
            loading || !isValid
              ? "bg-gray-400 cursor-not-allowed opacity-60"
              : "bg-green-600 hover:bg-green-700"
          }`}
          title={!isValid ? "Please fill in all required fields correctly" : ""}
        >
          {loading ? "Processing..." : "Continue to Payment →"}
        </button>
      </form>
    </div>
  );
};

export default StepUserInfo;