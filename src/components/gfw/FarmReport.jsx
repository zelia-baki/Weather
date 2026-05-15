/**
 * FarmReport.jsx  —  v4
 * PDF : downloadPDF() → Playwright backend (pdfUtils.js)
 * Nom du fichier : EUDR_Report_<farmId>.pdf
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../axiosInstance.jsx';
import { useLocation, Link } from 'react-router-dom';
import Loading from '../main/Loading.jsx';
import EudrReportSection from '../Guest/components/EudrReportSection.jsx';
import { downloadPDF } from '../Guest/utils/pdfUtils.js';

// ── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = () => (
  <svg
    style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }}
    fill="none" viewBox="0 0 24 24"
  >
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10"
      stroke="currentColor" strokeWidth="4" />
    <path style={{ opacity: 0.75 }} fill="currentColor"
      d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

// ── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ bg, children }) => (
  <div style={{
    position: 'fixed', top: 16, right: 16, zIndex: 9999,
    background: bg, color: '#fff',
    padding: '12px 20px', borderRadius: 10,
    boxShadow: '0 4px 16px rgba(0,0,0,.2)',
    display: 'flex', alignItems: 'center', gap: 10,
    fontFamily: 'system-ui, sans-serif', fontSize: 14,
  }}>
    {children}
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
const FarmReport = () => {
  const [farmInfo,      setFarmInfo]      = useState(null);
  const [geoData,       setGeoData]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving,      setIsSaving]      = useState(false);
  const [saveSuccess,   setSaveSuccess]   = useState(false);
  const [saveError,     setSaveError]     = useState(null);
  const [reportReady,   setReportReady]   = useState(false);

  const hasSaved  = useRef(false);
  const reportRef = useRef();
  const location  = useLocation();
  const farmId    = location.state?.farmId || 'WAK0001';

  // ── Sauvegarde DB ─────────────────────────────────────────────────────────
  const saveReportToDatabase = useCallback(async (data) => {
    if (hasSaved.current)     return;
    if (!farmInfo?.farm_id) { setSaveError('Farm ID is missing'); return; }

    hasSaved.current = true;
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      await axiosInstance.post('/api/farmreport/create', {
        farm_id:                          farmInfo.farm_id,
        project_area:                    `${data.areaInHectares?.toFixed(2)          || 0} ha`,
        country_deforestation_risk_level:  data.deforestationRiskLevel               || 'STANDARD',
        radd_alert:                      `${data.raddAlertsArea?.toFixed(2)           || 0} ha`,
        tree_cover_loss:                 `${data.treeCoverLossArea?.toFixed(2)        || 0} ha`,
        forest_cover_2020:                data.isJrcGlobalForestCover                || 'No data',
        eudr_compliance_assessment:       data.complianceStatus?.status              || 'Assessment Pending',
        protected_area_status:            JSON.stringify(data.protectedStatus        || {}),
        tree_cover_drivers:               data.tscDriverDriver?.mostCommonValue      || 'Unknown',
        cover_extent_area:               `${data.wriTropicalTreeCoverAvg?.toFixed(2) || 0}%`,
        cover_extent_summary:             JSON.stringify(data.coverExtentDecileData  || {}),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err) {
      hasSaved.current = false;
      setSaveError(err.response?.data?.msg || err.message || 'Failed to save report');
      setTimeout(() => setSaveError(null), 8000);
    } finally {
      setIsSaving(false);
    }
  }, [farmInfo]);

  const handleReportCalculated = useCallback((data) => {
    setReportReady(true);
    saveReportToDatabase(data);
  }, [saveReportToDatabase]);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const go = async () => {
      try {
        const res = await axiosInstance.get(`/api/gfw/farm/${farmId}/report`);
        if (res.data.error) setError(res.data.error);
        else {
          setFarmInfo(res.data.farm_info);
          setGeoData(res.data.report || {});
        }
      } catch {
        setError('Failed to fetch farm report.');
      } finally {
        setLoading(false);
      }
    };
    go();
  }, [farmId]);

  useEffect(() => {
    hasSaved.current = false;
    setReportReady(false);
  }, [farmId]);

  // ── Téléchargement PDF ────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!reportReady) {
      alert('The report is still computing. Please wait a few seconds then try again.');
      return;
    }
    setIsDownloading(true);
    try {
      await downloadPDF(reportRef, `EUDR_Report_${farmId}.pdf`);
    } catch (err) {
      console.error('PDF failed:', err);
      alert('PDF generation failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Guards ────────────────────────────────────────────────────────────────
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

  if (error) return <p className="text-red-600 p-6">{error}</p>;

  const btnReady = reportReady && !isDownloading;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Toasts ── */}
      {isSaving    && <Toast bg="#2563eb"><Spinner /> Saving report to database…</Toast>}
      {saveSuccess && <Toast bg="#16a34a">✓ Report saved successfully!</Toast>}
      {saveError   && <Toast bg="#dc2626">✗ {saveError}</Toast>}

      {/* ── Wrapper centré avec max-width identique au rapport ── */}
      <div style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: '0 0 60px 0',
      }}>

        {/* ═══ Rapport EUDR ═══ */}
        <div ref={reportRef}>
          <EudrReportSection
            results={geoData}
            reportRef={reportRef}
            farmInfo={farmInfo}
            onReportCalculated={handleReportCalculated}
          />
        </div>

        {/* ═══ Bouton PDF — collé sous le rapport, centré dans le même wrapper ═══ */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: 32,
        }}>
          <button
            onClick={handleDownload}
            disabled={!btnReady}
            style={{
              display    : 'flex',
              alignItems : 'center',
              gap        : 8,
              padding    : '13px 32px',
              borderRadius: 10,
              border     : 'none',
              background : btnReady ? '#16a34a' : '#9ca3af',
              color      : '#fff',
              fontWeight : 700,
              fontSize   : 14,
              cursor     : btnReady ? 'pointer' : 'not-allowed',
              boxShadow  : btnReady ? '0 4px 14px rgba(22,163,74,.4)' : 'none',
              transition : 'background .2s',
              fontFamily : 'system-ui, sans-serif',
            }}
          >
            {isDownloading
              ? <><Spinner /> Generating PDF…</>
              : !reportReady
              ? '⏳ Computing data…'
              : `⬇ Download EUDR_Report_${farmId}.pdf`}
          </button>
        </div>

      </div>
    </>
  );
};

export default FarmReport;