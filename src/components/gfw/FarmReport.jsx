import React, { useRef, useState, useEffect } from "react";
import axiosInstance from '../../axiosInstance.jsx';
import { useLocation, Link } from "react-router-dom";
import Loading from '../main/Loading.jsx';
import EudrReportSection from "../Guest/components/EudrReportSection.jsx";
import { downloadPDF } from "../Guest/utils/pdfUtils.js";

const FullReport = () => {
  const [farmInfo, setFarmInfo] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const location = useLocation();
  const farmId = location.state?.farmId || "WAK0001"; // fallback
  const reportRef = useRef();

  useEffect(() => {
    const fetchFarmReport = async () => {
      console.log('Fetching farm report for farmId:', farmId);
      try {
        const response = await axiosInstance.get(`/api/gfw/farm/${farmId}/report`);
        if (response.data.error) {
          setError(response.data.error);
        } else {
          setFarmInfo(response.data.farm_info);
          setGeoData(response.data.report || []);
        }
      } catch (err) {
        setError('Failed to fetch farm report.');
        console.error('Error fetching farm report:', err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFarmReport();
  }, [farmId]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadPDF(reportRef); // ta fonction utilitaire
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) return <Loading />;

  if (error === 'No polygon found. Please create a polygon for this forest.') {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-red-600">{error}</h1>
        <p className="text-lg text-gray-700 mb-6">
          It seems that no polygon data is available for this forest. You can create a polygon by clicking the link below:
        </p>
        <Link
          to="/create-polygon"
          className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600"
        >
          Create Polygon
        </Link>
      </div>
    );
  }

  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="flex flex-col items-center text-xl">
      <div ref={reportRef}>
        <EudrReportSection results={geoData} reportRef={reportRef} farmInfo={farmInfo} />
      </div>

      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className={`mt-6 flex items-center gap-2 px-6 py-3 rounded-lg shadow-md text-white font-semibold transition 
          ${isDownloading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
      >
        {isDownloading && (
          <svg
            className="animate-spin h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
        )}
        {isDownloading ? "Generating PDF..." : "Download PDF"}
      </button>
    </div>
  );
};

export default FullReport;
