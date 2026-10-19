// src/components/gfw/Reportgen2Forest.jsx

import React, { useRef, useState, useEffect } from "react";
import axiosInstance from '../../axiosInstance.jsx';
import { Link } from "react-router-dom";
import useReportEntityId from "../../hooks/useReportEntityId";
import Loading from '../main/Loading.jsx';
import EudrReportSection from "../Guest/components/EudrReportSection.jsx";
import { requestPdfFromRef } from "../Guest/utils/pdfUtils.js";
import BackendPdfPanel from "./BackendPdfPanel.jsx";

const ForestReport = () => {
  const [forestInfo, setForestInfo] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const forestId = useReportEntityId('forestId', 1);
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
          console.log('📊 Report Data (object format):', response.data.report);
          setGeoData(response.data.report);
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

  // ✅ Fonction pour sauvegarder le rapport en base de données
  const saveReportToDatabase = async (reportData) => {
    if (!forestInfo?.farm_id) {
      console.warn('⚠️ No forest ID available, skipping database save');
      return;
    }

    try {
      console.log('💾 Saving forest report to database...', reportData);

      const payload = {
        forest_id: forestInfo.farm_id,
        project_area: `${reportData.areaInSquareMeters?.toFixed(2) || 0} m² / ${reportData.areaInHectares?.toFixed(2) || 0} ha`,
        country_deforestation_risk_level: `STANDARD, Percentage: ${reportData.treeCoverLossPercentage?.toFixed(2) || 0}%`,
        radd_alert: `${reportData.raddAlertsArea?.toFixed(2) || 0} ha`,
        tree_cover_loss: `${reportData.treeCoverLossArea?.toFixed(2) || 0} ha`,
        forest_cover_2020: reportData.isJrcGlobalForestCover || 'No data',
        eudr_compliance_assessment: reportData.complianceStatus?.status || 'Assessment Pending',
        protected_area_status: JSON.stringify(reportData.protectedStatus?.percentages || {}),
        cover_extent_summary: JSON.stringify({
          nonZeroCount: reportData.coverExtentDecileData?.nonZeroCount || 0,
          percentageCoverExtent: reportData.coverExtentDecileData?.percentageCoverExtent || 0,
          valueCountArray: reportData.coverExtentDecileData?.valueCountArray || []
        }),
        tree_cover_drivers: reportData.tscDriverDriver?.mostCommonValue || 'Unknown',
        cover_extent_area: `${reportData.wriTropicalTreeCoverAvg || 0}% / ${reportData.wriTropicalTreeCoverArea || 0} ha`
      };

      const response = await axiosInstance.post('/api/forestreport/create', payload);
      console.log('✅ Forest report saved successfully:', response.data);
    } catch (err) {
      console.error('❌ Error saving forest report to database:', err.response?.data || err.message);
    }
  };

  // Le PDF affiché est celui du backend (/api/gfw/generate-pdf, à partir du
  // HTML rendu hors écran) — le même que celui téléchargé. On laisse 6 s au
  // rendu des cartes avant de l'envoyer, comme l'ancien bouton Download.
  const [htmlReady, setHtmlReady] = useState(false);
  useEffect(() => {
    if (!geoData) return;
    const t = setTimeout(() => setHtmlReady(true), 6000);
    return () => clearTimeout(t);
  }, [geoData]);

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
    <>
      {/* HTML report kept off-screen: source of the backend PDF + DB save */}
      <div aria-hidden style={{ position: 'fixed', top: 0, left: '-9999px', width: 800, overflow: 'hidden' }}>
        <div ref={reportRef}>
          <EudrReportSection
            results={geoData}
            reportRef={reportRef}
            farmInfo={forestInfo}
            reportType="forest"
            onReportCalculated={saveReportToDatabase}
          />
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 16px 60px' }}>
        <BackendPdfPanel
          ready={htmlReady}
          fetchPdf={() => requestPdfFromRef(reportRef, `EUDR_Report_Forest_${forestId}.pdf`)}
          storeKey={`eudr-forest-${forestId}`}
          filename={`EUDR_Report_Forest_${forestId}.pdf`}
          title="EUDR Compliance Report — Forest"
          accent="blue"
          waitingLabel="Generating your EUDR report…"
        />
      </div>
    </>
  );
};

export default ForestReport;