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
  const forestId = location.state?.forestId || 1;


  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Change this to the number of items per page you want

  useEffect(() => {
    const fetchForestReport = async () => {
      try {
        const response = await axiosInstance.get(`/api/gfw/forests/${forestId}/report`);
        if (response.data.error === "No points found for the specified owner") {
          setError('No polygon found. Please create a polygon for this forest.');
        } else {
          setForestInfo(response.data.forest_info);
          setGeoData(response.data.report || []);
          console.log("Forest Info:", response.data.forest_info);
          console.log("GeoData:", response.data.report);
        }
      } catch (error) {
        console.error('Error fetching forest report:', error);
        setError('Failed to fetch forest report. Please verify if a polygon exists for this forest.');
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

  // Pagination handlers
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentGeoData = geoData.slice(indexOfFirstItem, indexOfLastItem);

  const handleNextPage = () => {
    if (currentPage < Math.ceil(geoData.length / itemsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
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
    <div className="container mx-auto p-6 h-screen">
      <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">
        {/* Colonne 1, Ligne 1 - Carte pour les propriétaires */}
        {forestInfo && (
          <div className="bg-white shadow-md rounded-lg p-4 flex flex-col">
            <h2>Forest Information</h2>
            <p><strong>Name:</strong> {forestInfo.name}</p>
            <p><strong>Tree Type:</strong> {forestInfo.tree_type}</p>
          </div>
        )}

        {/* Colonne 2, Ligne 1 - Tableau with pagination */}
        <div className="bg-green-200 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Report Data</h2>
          <table className="min-w-full bg-white rounded-lg shadow-md">
            <thead>
              <tr className="bg-green-600 text-white">
                <th className="py-2 px-4 text-left">Datasets</th>
                <th className="py-2 px-4 text-left">Value </th>
              </tr>
            </thead>
            <tbody>
              {currentGeoData.length > 0 ? (
                currentGeoData.map((dataset, index) => (
                  <tr key={index} className="border-b hover:bg-gray-200">
                    <td className="py-2 px-4">{dataset.dataset}</td>
                    <td className="py-2 px-4">
                      {dataset.data_fields ? JSON.stringify(dataset.data_fields) : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-2 px-4" colSpan="2">
                    No Geo Data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination controls */}
          <div className="flex justify-between mt-4">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded ${currentPage === 1 ? 'bg-gray-300' : 'bg-green-600 text-white hover:bg-green-700'}`}
            >
              Previous
            </button>
            <span>Page {currentPage} of {Math.ceil(geoData.length / itemsPerPage)}</span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === Math.ceil(geoData.length / itemsPerPage)}
              className={`px-4 py-2 rounded ${currentPage === Math.ceil(geoData.length / itemsPerPage) ? 'bg-gray-300' : 'bg-green-600 text-white hover:bg-green-700'}`}
            >
              Next
            </button>
          </div>
        </div>

        {/* Column 1, Row 2 - General Information */}
        <div className="bg-yellow-200 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">General Information</h2>
          <p>
            Forests play a crucial role in biodiversity and climate regulation. They provide habitats for numerous species and contribute to air quality. Sustainable forest management is essential for preserving this vital ecosystem.
          </p>
          <p>
            In addition to their ecological importance, forests offer numerous benefits to human communities. They serve as sources of timber, fuel, and non-timber forest products, supporting local economies. Moreover, forests are vital for recreational activities, such as hiking and birdwatching, which enhance well-being and promote environmental awareness.
          </p>
          <p>
            Protecting forests from deforestation and degradation is critical to combating climate change, as they act as carbon sinks, absorbing CO2 from the atmosphere. By conserving our forests, we not only safeguard biodiversity but also ensure a healthier planet for future generations.
          </p>
        </div>

        {/* Colonne 2, Ligne 2 - Image */}
        <div className="rounded-lg overflow-hidden">
          <img
            src={generateMapboxUrl(geoData[0].coordinates[0])}
            alt="Map for the forest"
            className="w-full h-auto mt-4"
          />
        </div>
      </div>
    </div>
  );
};

export default ForestReport;
