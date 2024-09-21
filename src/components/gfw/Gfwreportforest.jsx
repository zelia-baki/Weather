import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosInstance';
import { useLocation, Link } from "react-router-dom";
import Loading from '../main/Loading.jsx';

const ForestReport = () => {
  const [forestInfo, setForestInfo] = useState(null);
  const [geoData, setGeoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const forestId = location.state?.forestId;

  useEffect(() => {
    const fetchForestReport = async () => {
      try {
        const response = await axiosInstance.get(`/api/gfw/forests/${forestId}/report`);
        if (response.data.error === "No points found for the specified owner") {
          setError('No polygon found. Please create a polygon for this forest.');
        } else {
          setForestInfo(response.data.forest_info);
          setGeoData(response.data.report || []);
        }
      } catch (error) {
        console.log(error);
        setError('Failed to fetch forest report please verify if you have create polygon for forest');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchForestReport();
  }, [forestId]);

  const generateMapboxUrl = (coordinates) => {
    const geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [coordinates]
          },
          properties: {}
        }
      ]
    };
    const encodedGeojson = encodeURIComponent(JSON.stringify(geojson));
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/geojson(${encodedGeojson})/auto/500x300?access_token=pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q`;
  };

  if (loading) {
    return (
      <div>
        <Loading />
      </div>
    );
  }

  if (error === 'No polygon found. Please create a polygon for this forest.') {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-red-600">{error}</h1>
        <p className="text-lg font-medium text-gray-700 mb-6">
          It seems that no polygon data is available for this forest. You can create a polygon by clicking the link below:
        </p>
        <Link
          to="/create-polygon"
          className="inline-block px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Create Polygon
        </Link>
      </div>
    );
  }

  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Forest Report</h1>
      {forestInfo && (
        <div className="bg-white p-6 shadow-md rounded-md mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">{forestInfo.name}</h2>
          <p className="text-lg font-medium text-gray-700 mb-2">Tree Type: {forestInfo.tree_type}</p>
          <p className="text-lg font-medium text-gray-700 mb-4">Date Created: {forestInfo.date_created}</p>
          <p className="text-lg font-medium text-gray-700 mb-4">Last Updated: {forestInfo.date_updated}</p>
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
          Download Full Forest Report
        </button>
      </div>
    </div>
  );
};

export default ForestReport;
