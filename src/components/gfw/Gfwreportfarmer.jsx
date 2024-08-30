import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosInstance';
import { useLocation } from "react-router-dom";  // Import useLocation to access the passed state


const FarmReport = () => {
  const [farmInfo, setFarmInfo] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const farmId = location.state?.farmId;


  useEffect(() => {
    const fetchFarmReport = async () => {
      try {
        const response = await axiosInstance.get(`/api/gfw/farm/${farmId}/report`);
        setFarmInfo(response.data.farm_info);
        setReport(response.data.report);
      } catch (error) {
        setError('Failed to fetch farm report');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFarmReport();
  }, [farmId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Farm Report</h1>
      {farmInfo && (
        <div className="bg-white p-6 shadow-md rounded-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">{farmInfo.name}</h2>
          <p className="text-lg font-medium text-gray-700 mb-2">Farm ID: {farmInfo.farm_id}</p>
          <p className="text-lg font-medium text-gray-700 mb-2">Location: {farmInfo.subcounty}, {farmInfo.district_name} ({farmInfo.district_region})</p>
          <p className="text-lg font-medium text-gray-700 mb-2">Geolocation: {farmInfo.geolocation}</p>
          <p className="text-lg font-medium text-gray-700 mb-2">Phone: {farmInfo.phonenumber}</p>
          {farmInfo.phonenumber2 && (
            <p className="text-lg font-medium text-gray-700 mb-2">Alternate Phone: {farmInfo.phonenumber2}</p>
          )}
          <p className="text-lg font-medium text-gray-700 mb-4">Date Created: {farmInfo.date_created}</p>
          <p className="text-lg font-medium text-gray-700 mb-4">Last Updated: {farmInfo.date_updated}</p>

          <h3 className="text-xl font-semibold text-gray-800 mb-4">Crops:</h3>
          <ul className="list-disc pl-5">
            {farmInfo.crops.length > 0 ? (
              farmInfo.crops.map((crop, idx) => (
                <li key={idx} className="mb-2 text-gray-700">
                  <strong>{crop.crop}</strong> - {crop.tilled_land_size} acres, Season: {crop.season}, Quality: {crop.quality}
                  <br />
                  Planting Date: {crop.planting_date} | Harvest Date: {crop.harvest_date}
                  <br />
                  Expected Yield: {crop.expected_yield} | Actual Yield: {crop.actual_yield}
                  <br />
                  Destination: {crop.destination_country || 'N/A'} | Customer: {crop.customer_name || 'N/A'}
                </li>
              ))
            ) : (
              <p className="text-gray-700">No crops data available.</p>
            )}
          </ul>
        </div>
      )}
      {report && (
        <div className="mt-6 bg-gray-100 p-6 shadow-md rounded-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Report Data:</h3>
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
          Download Full Farm Report
        </button>
      </div>
    </div>
  );
};

export default FarmReport;
