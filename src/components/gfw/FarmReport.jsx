// FarmReport.jsx - Version améliorée avec sauvegarde automatique
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  
  const location = useLocation();
  const farmId = location.state?.farmId || "WAK0001";
  const reportRef = useRef();

  // ✅ Fonction de sauvegarde du rapport (identique à EudrReportSection)
  const saveReportToDatabase = async (reportData) => {
    console.log('🔍 saveReportToDatabase called from FarmReport');
    console.log('🔍 farmInfo:', farmInfo);
    console.log('🔍 farmInfo.farm_id:', farmInfo?.farm_id);
    
    if (!farmInfo?.farm_id) {
      console.error('❌ Farm ID is missing, cannot save report');
      setSaveError('Farm ID is missing');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      console.log('📊 Saving report to database...');
      console.log('📊 Report data received:', reportData);

      const payload = {
        farm_id: farmInfo.farm_id,
        project_area: `${reportData.areaInHectares?.toFixed(2) || 0} ha`,
        country_deforestation_risk_level: reportData.deforestationRiskLevel || 'STANDARD',
        radd_alert: `${reportData.raddAlertsArea?.toFixed(2) || 0} ha`,
        tree_cover_loss: `${reportData.treeCoverLossArea?.toFixed(2) || 0} ha`,
        forest_cover_2020: reportData.isJrcGlobalForestCover || 'No data',
        eudr_compliance_assessment: reportData.complianceStatus?.status || 'Assessment Pending',
        protected_area_status: JSON.stringify(reportData.protectedStatus || {}),
        tree_cover_drivers: reportData.tscDriverDriver?.mostCommonValue || 'Unknown',
        cover_extent_area: `${reportData.wriTropicalTreeCoverAvg?.toFixed(2) || 0}%`,
        cover_extent_summary: JSON.stringify(reportData.coverExtentDecileData || {})
      };

      console.log('📦 Payload prepared:', payload);
      console.log('🚀 Sending POST request to /api/farmreport/create');

      const response = await axiosInstance.post('/api/farmreport/create', payload);

      console.log('✅ Report saved successfully!');
      console.log('✅ Server response:', response.data);
      setSaveSuccess(true);
      
      // Cache la notification après 5 secondes
      setTimeout(() => setSaveSuccess(false), 5000);

    } catch (err) {
      console.error('❌ Error saving report:', err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error message:', err.message);
      
      const errorMsg = err.response?.data?.msg || err.message || 'Failed to save report';
      setSaveError(errorMsg);
      
      // Cache l'erreur après 8 secondes
      setTimeout(() => setSaveError(null), 8000);
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ Récupération des données du rapport
  useEffect(() => {
    const fetchFarmReport = async () => {
      console.log('Fetching farm report for farmId:', farmId);
      try {
        const response = await axiosInstance.get(`/api/gfw/farm/${farmId}/report`);
        if (response.data.error) {
          setError(response.data.error);
        } else {
          setFarmInfo(response.data.farm_info);
          setGeoData(response.data.report || {});
          console.log('✅ Farm info loaded:', response.data.farm_info);
          console.log('✅ Geo data loaded:', response.data.report);
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
      // Délai pour s'assurer que StaticForestMap a terminé le rendu
      await new Promise(resolve => setTimeout(resolve, 6000)); 
      await downloadPDF(reportRef);
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
          It seems that no polygon data is available for this farm. You can create a polygon by clicking the link below:
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
    <div className="flex flex-col items-center text-xl relative">
      {/* ✅ Notifications de sauvegarde */}
      {isSaving && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Saving report to database...
        </div>
      )}

      {saveSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
          </svg>
          Report saved successfully!
        </div>
      )}

      {saveError && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
          {saveError}
        </div>
      )}

      {/* ✅ Section du rapport avec callback pour sauvegarder */}
      <div ref={reportRef}>
        <EudrReportSection 
          results={geoData} 
          reportRef={reportRef} 
          farmInfo={farmInfo}
          onReportCalculated={saveReportToDatabase}
        />
      </div>

      {/* ✅ Bouton de téléchargement */}
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