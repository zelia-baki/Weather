// components/UploadCard.jsx
import React from 'react';

const UploadCard = ({ title, onFileChange, onUpload, loading, inputName }) => (
  <div className="bg-white rounded-2xl shadow-md p-6">
    <h2 className="text-2xl font-bold mb-4">{title}</h2>
    <input
      type="file"
      accept=".geojson,application/geo+json"
      name={inputName}
      onChange={(e) => onFileChange(inputName, e)}
      className="mb-4"
    />
    <button
      onClick={() => onUpload(inputName)}
      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      disabled={loading}
    >
      {loading ? 'Loading...' : 'Send and analyze'}
    </button>
  </div>
);

export default UploadCard;
