import React from "react";

const StepUserInfo = ({ userInfo, setUserInfo, onSubmit, loading }) => {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white p-6 rounded-2xl shadow-md max-w-md mx-auto space-y-4"
    >
      <h2 className="text-xl font-bold text-gray-800 text-center">
        Enter Your Contact Information
      </h2>
      <p className="text-sm text-gray-500 text-center mb-4">
        Please provide your phone number (starting with 256) and email address.
      </p>

      {/* Phone field */}
      <div className="text-left">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <input
          type="text"
          value={userInfo.phone}
          onChange={(e) =>
            setUserInfo((prev) => ({ ...prev, phone: e.target.value }))
          }
          placeholder="e.g. 256XXXXXXXXX"
          className="block w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
          required
        />
      </div>

      {/* Email field */}
      <div className="text-left">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <input
          type="email"
          value={userInfo.email}
          onChange={(e) =>
            setUserInfo((prev) => ({ ...prev, email: e.target.value }))
          }
          placeholder="example@email.com"
          className="block w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
          required
        />
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2 px-4 rounded-lg text-white font-semibold ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {loading ? "Processing..." : "Continue to Payment"}
      </button>
    </form>
  );
};

export default StepUserInfo;
