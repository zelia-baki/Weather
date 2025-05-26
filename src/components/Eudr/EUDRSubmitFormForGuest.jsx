import React, { useState } from 'react';
import axiosInstance from '../../axiosInstance';

const UploadCard = ({ title, onFileChange, onUpload, loading }) => (
  <div className="bg-white rounded-2xl shadow-md p-6">
    <h2 className="text-2xl font-bold mb-4">{title}</h2>
    <input
      type="file"
      accept=".geojson,application/geo+json"
      onChange={onFileChange}
      className="mb-4"
    />
    <button
      onClick={onUpload}
      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      disabled={loading}
    >
      {loading ? 'Loading...' : 'Send and analyze'}
    </button>
  </div>
);

const CarbonReportUploader = () => {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResults([]);
    setError('');
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a GeoJSON file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.post('/api/gfw/Geojson/ReportFromFile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResults(response.data.dataset_results);
    } catch (err) {
      setError(err.response?.data?.error || 'An error has occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Cartes côte à côte */}
      <div className="grid grid-cols-1 gap-6">
        <UploadCard
          title="Upload your geojson for your farm location details to find out your plot level deforestation risk and EUDR compliance "
          onFileChange={handleFileChange}
          onUpload={handleUpload}
          loading={loading}
        />
        <UploadCard
          title="Green house gas emissions are responsible for the erratic weather patterns we see today. Therefore its critical to track emissions and keep them within the United Nations Framework Convention on Climate Change(UNFCCC) thresholds of 2°C above pre-industrial levels. We can do this by tracking emissions starting at farm level. Upload your Geojson file for your farm details to find out if your plot of land is a net carbon sink."
          onFileChange={handleFileChange}
          onUpload={handleUpload}
          loading={loading}
        />
      </div>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      {results.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full bg-white border rounded">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2">Jeu de données</th>
                <th className="border px-4 py-2">Pixel</th>
                <th className="border px-4 py-2">Données</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{item.dataset}</td>
                  <td className="border px-4 py-2">{item.pixel}</td>
                  <td className="border px-4 py-2">
                    <pre className="whitespace-pre-wrap text-xs">
                      {JSON.stringify(item.data_fields, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CarbonReportUploader;
