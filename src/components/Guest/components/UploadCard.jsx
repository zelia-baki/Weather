// components/UploadCard.jsx
import React from 'react';

const UploadCard = ({ title, onFileChange, onUpload, loading, inputName }) => (
  <div className="bg-white rounded-2xl shadow-md p-6 transition-transform duration-300 transform hover:scale-[1.01]">
    <h2 className="text-2xl font-bold mb-4">{title}</h2>
    <input
      type="file"
      accept=".geojson,application/geo+json"
      name={inputName}
      onChange={(e) => onFileChange(inputName, e)}
      className="mb-4 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
    />
    <button
      onClick={() => onUpload(inputName)}
      className={`w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition duration-300 flex items-center justify-center gap-2 ${
        loading ? 'opacity-70 cursor-not-allowed' : ''
      }`}
      disabled={loading}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        'Send and analyze'
      )}
    </button>
  </div>
);

export default UploadCard;
