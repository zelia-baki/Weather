import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosInstance';
import { useLocation } from "react-router-dom";
import Loading from '../main/Loading.jsx';

const FarmReport = () => {
  const [farmInfo, setFarmInfo] = useState(null);
  const [geoData, setGeoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const farmId = location.state?.farmId;

  useEffect(() => {
    const fetchFarmReport = async () => {
      try {
        const response = await axiosInstance.get(`/api/gfw/farm/${farmId}/report`);
        setFarmInfo(response.data.farm_info);
        setGeoData(response.data.report || []);
      } catch (error) {
        setError('Failed to fetch farm report');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFarmReport();
  }, [farmId]);

  const generateMapboxUrl = (coordinates) => {
    console.log('Generating Mapbox URL with coordinates:', coordinates);
  
    const geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [coordinates] // Ensure coordinates are nested properly
          },
          properties: {
          }
        }
      ]
    };
    
    console.log('Generated GeoJSON:', geojson);
    
    // Encode the GeoJSON object to use in the URL
    const encodedGeojson = encodeURIComponent(JSON.stringify(geojson));
    
    // Construct the Mapbox URL
    const mapboxUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/geojson(${encodedGeojson})/auto/500x300?access_token=pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q`;
  
    console.log('Generated Mapbox URL:', mapboxUrl);
    return mapboxUrl;
  };
  
  

  if (loading) {
    return (
      <div >
        <Loading></Loading>
      </div>
    );
  }

  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Farm Report</h1>
      {farmInfo && (
        <div className="bg-white p-6 shadow-md rounded-md mb-6">
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
        </div>
      )}
      {geoData.length > 0 && (
        <div className="mb-6">
          {geoData.map((dataset, idx) => (
            <div key={idx} className="bg-white p-4 shadow-lg rounded-lg border border-gray-200 mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Dataset: {dataset.dataset}</h4>
              <p className="text-gray-700 mb-2">Value: {dataset.data_fields.area__ha.toFixed(5)}</p>
              {dataset.coordinates && dataset.coordinates.length > 0 && (
                <img
                  src={generateMapboxUrl(dataset.coordinates[0])}
                  alt={`Map for ${dataset.dataset}`}
                />
              )}
            </div>
          ))}
        </div>
      )}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => window.print()}
          className="inline-block px-6 py-3 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          Download Full Farm Report
        </button>
      </div>
    </div>
  );
};

export default FarmReport;
