import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosInstance';
import { useLocation } from "react-router-dom";  // Import useLocation to access the passed state


const ForestReport = ( ) => {
  const [forestName, setForestName] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation(); 
  const forestId = location.state?.forestId;


  useEffect(() => {
    const fetchForestReport = async () => {
      try {
        const response = await axiosInstance.get(`/api/gfw/forests/${forestId}/report`);
        setForestName(response.data.forest_name);
        setReport(response.data.report);
      } catch (error) {
        setError('Failed to fetch forest report');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchForestReport();
  }, [forestId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Forest Report</h1>
      {forestName && (
        <div className="bg-white p-6 shadow-md rounded-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">{forestName}</h2>
        </div>
      )}
      {report && (
        <div className="mt-6 bg-gray-100 p-6 shadow-md rounded-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Report Data:</h3>
          {/* Display report data */}
          <pre className="bg-gray-800 text-white p-4 rounded-md overflow-x-auto">
            {JSON.stringify(report, null, 2)}
          </pre>
        </div>
      )}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => window.print()} // Adjust this to download a PDF if needed
          className="inline-block px-6 py-3 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          Download Full Forest Report
        </button>
      </div>
    </div>
  );
};

export default ForestReport;
