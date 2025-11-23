// ForestReport.jsx - Version modernisée utilisant EudrReportSection
import React, { useRef, useState, useEffect } from "react";
import axiosInstance from '../../axiosInstance.jsx';
import { useLocation, Link } from "react-router-dom";
import Loading from '../main/Loading.jsx';
import EudrReportSection from "../Guest/components/EudrReportSection.jsx";
import { downloadPDF } from "../Guest/utils/pdfUtils.js";

const ForestReport = () => {
  const [forestInfo, setForestInfo] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const location = useLocation();
  const forestId = location.state?.forestId || 1;
  const reportRef = useRef();

  useEffect(() => {
    const fetchForestReport = async () => {
      console.log('🌲 Fetching forest report for forestId:', forestId);
      try {
        const response = await axiosInstance.get(`/api/gfw/forests/${forestId}/report`);
        
        if (response.data.error) {
          console.error('❌ Error in API response:', response.data.error);
          setError(response.data.error);
        } else {
          console.log('✅ API Response:', response.data);
          setForestInfo(response.data.forest_info);
          
          // ✅ L'API forests retourne un ARRAY dans response.data.report
          // Exemple: [
          //   { /* [0] RADD alerts */ },
          //   { /* [1] Tree cover loss */ },
          //   { /* [2] Tree cover extent */ },
          //   ...
          // ]
          const reportData = response.data.report || [];
          console.log('📊 Report Data (array format):', reportData);
          
          // ✅ EudrReportSection attend un OBJECT avec des clés nommées
          // On transforme donc l'array en object
          const transformedData = {
            "wur radd alerts": reportData[0] ? [reportData[0]] : [],
            "tree cover loss": reportData[1] ? [reportData[1]] : [],
            "wri tropical tree cover extent": reportData[2] ? [reportData[2]] : [],
            "tsc tree cover loss drivers": reportData[3] ? [reportData[3]] : [],
            "wri tropical tree cover": reportData[4] ? [reportData[4]] : [],
            "jrc global forest cover": reportData[5] ? [reportData[5]] : [],
            "landmark indigenous and community lands": reportData[6] ? [reportData[6]] : [],
            "soil carbon": reportData[7] ? [reportData[7]] : []
          };

          console.log('🔄 Transformed data (object format):', transformedData);
          setGeoData(transformedData);
        }
      } catch (err) {
        setError('Failed to fetch forest report.');
        console.error('❌ Error fetching forest report:', err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchForestReport();
  }, [forestId]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Délai pour s'assurer que StaticForestMap a terminé le rendu
      await new Promise(resolve => setTimeout(resolve, 6000)); 
      await downloadPDF(reportRef);
    } catch (err) {
      console.error("❌ PDF generation failed:", err);
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
      {/* ✅ Utilisation d'EudrReportSection avec le type "forest" */}
      <div ref={reportRef}>
        <EudrReportSection 
          results={geoData} 
          reportRef={reportRef} 
          farmInfo={forestInfo}
          reportType="forest"  // ✅ Type "forest" pour personnaliser l'en-tête
        />
      </div>

      {/* Bouton de téléchargement */}
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

export default ForestReport;