// FarmReport.jsx
import React, { useRef, useState, useEffect, useCallback } from "react";
import axiosInstance from '../../axiosInstance.jsx';
import { useLocation, Link } from "react-router-dom";
import Loading from '../main/Loading.jsx';
import EudrReportSection from "../Guest/components/EudrReportSection.jsx";
import { downloadPDF } from "../Guest/utils/pdfUtils.js";

const FullReport = () => {
  const [farmInfo,     setFarmInfo]     = useState(null);
  const [geoData,      setGeoData]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [isDownloading,setIsDownloading]= useState(false);
  const [isSaving,     setIsSaving]     = useState(false);
  const [saveSuccess,  setSaveSuccess]  = useState(false);
  const [saveError,    setSaveError]    = useState(null);

  // ── GUARD : empêche toute sauvegarde multiple ────────────────────────────
  const hasSaved = useRef(false);

  const location = useLocation();
  const farmId   = location.state?.farmId || "WAK0001";
  const reportRef = useRef();

  // ── Sauvegarde (une seule fois par chargement de page) ───────────────────
  const saveReportToDatabase = useCallback(async (reportData) => {
    // 🛑 Sortie immédiate si déjà sauvegardé ou si farmInfo manquant
    if (hasSaved.current) return;
    if (!farmInfo?.farm_id) {
      setSaveError('Farm ID is missing');
      return;
    }

    hasSaved.current = true; // ← verrou posé AVANT l'appel async
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const payload = {
        farm_id:                      farmInfo.farm_id,
        project_area:                 `${reportData.areaInHectares?.toFixed(2)          || 0} ha`,
        country_deforestation_risk_level: reportData.deforestationRiskLevel             || 'STANDARD',
        radd_alert:                   `${reportData.raddAlertsArea?.toFixed(2)           || 0} ha`,
        tree_cover_loss:              `${reportData.treeCoverLossArea?.toFixed(2)        || 0} ha`,
        forest_cover_2020:             reportData.isJrcGlobalForestCover                || 'No data',
        eudr_compliance_assessment:    reportData.complianceStatus?.status               || 'Assessment Pending',
        protected_area_status:         JSON.stringify(reportData.protectedStatus         || {}),
        tree_cover_drivers:            reportData.tscDriverDriver?.mostCommonValue       || 'Unknown',
        cover_extent_area:            `${reportData.wriTropicalTreeCoverAvg?.toFixed(2) || 0}%`,
        cover_extent_summary:          JSON.stringify(reportData.coverExtentDecileData   || {}),
      };

      await axiosInstance.post('/api/farmreport/create', payload);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);

    } catch (err) {
      // En cas d'erreur, on libère le verrou pour permettre une nouvelle tentative
      hasSaved.current = false;

      const errorMsg = err.response?.data?.msg || err.message || 'Failed to save report';
      setSaveError(errorMsg);
      setTimeout(() => setSaveError(null), 8000);
    } finally {
      setIsSaving(false);
    }
  }, [farmInfo]); // farmInfo comme seule dépendance

  // ── Fetch données farm ───────────────────────────────────────────────────
  useEffect(() => {
    const fetchFarmReport = async () => {
      try {
        const response = await axiosInstance.get(`/api/gfw/farm/${farmId}/report`);
        if (response.data.error) {
          setError(response.data.error);
        } else {
          setFarmInfo(response.data.farm_info);
          setGeoData(response.data.report || {});
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

  // ── Reset du verrou si on change de farm ────────────────────────────────
  useEffect(() => {
    hasSaved.current = false;
  }, [farmId]);

  // ── Download PDF ─────────────────────────────────────────────────────────
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 6000));
      await downloadPDF(reportRef);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  // ── États de chargement / erreur ─────────────────────────────────────────
  if (loading) return <Loading />;

  if (error === 'No polygon found. Please create a polygon for this forest.') {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-red-600">{error}</h1>
        <p className="text-lg text-gray-700 mb-6">
          No polygon data is available for this farm. Create one below:
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center text-xl relative">

      {/* Saving… */}
      {isSaving && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path  className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Saving report to database...
        </div>
      )}

      {/* Success */}
      {saveSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
          </svg>
          Report saved successfully!
        </div>
      )}

      {/* Error */}
      {saveError && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
          {saveError}
        </div>
      )}

      {/* Rapport */}
      <div ref={reportRef}>
        <EudrReportSection
          results={geoData}
          reportRef={reportRef}
          farmInfo={farmInfo}
          onReportCalculated={saveReportToDatabase}
        />
      </div>

      {/* Bouton PDF */}
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className={`mt-6 flex items-center gap-2 px-6 py-3 rounded-lg shadow-md text-white font-semibold transition
          ${isDownloading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
      >
        {isDownloading && (
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path  className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        )}
        {isDownloading ? "Generating PDF..." : "Download PDF"}
      </button>
    </div>
  );
};

export default FullReport;