/**
 * FarmReport.jsx  —  v4 ReportLab
 * ─────────────────────────────────────────────────────────────────────────
 * Le PDF est entièrement généré côté backend (ReportLab).
 * Ce composant :
 *   1. Affiche le rapport EUDR à l'écran (EudrReportSection, inchangée)
 *   2. Sauvegarde les métriques en base via onReportCalculated
 *   3. Sur clic "Download" : GET /api/gfw/farm/<id>/eudr-pdf → blob → download
 *
 * Plus de div caché, plus de html2canvas, plus de Playwright pour ce rapport.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../axiosInstance.jsx';
import { useLocation, Link } from 'react-router-dom';
import Loading from '../main/Loading.jsx';
import EudrReportSection from '../Guest/components/EudrReportSection.jsx';

// ── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = () => (
  <svg style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }}
    fill="none" viewBox="0 0 24 24">
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <circle style={{ opacity: .25 }} cx="12" cy="12" r="10"
      stroke="currentColor" strokeWidth="4" />
    <path style={{ opacity: .75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

const Toast = ({ bg, children }) => (
  <div style={{
    position: 'fixed', top: 16, right: 16, zIndex: 9999,
    background: bg, color: '#fff', padding: '12px 20px',
    borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,.2)',
    display: 'flex', alignItems: 'center', gap: 10, fontSize: 14,
    fontFamily: 'system-ui, sans-serif',
  }}>
    {children}
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
const FarmReport = () => {
  const [farmInfo, setFarmInfo] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [reportReady, setReportReady] = useState(false);
  const [forestMapImage, setForestMapImage] = useState(null);

  const hasSaved = useRef(false);
  const location = useLocation();
  const farmId = location.state?.farmId || 'WAK0001';

  // ── Sauvegarde DB ─────────────────────────────────────────────────────────
  const saveReportToDatabase = useCallback(async (data) => {
    if (hasSaved.current) return;
    if (!farmInfo?.farm_id) { setSaveError('Farm ID is missing'); return; }
    hasSaved.current = true;
    setIsSaving(true);
    try {
      await axiosInstance.post('/api/farmreport/create', {
        farm_id: farmInfo.farm_id,
        project_area: `${data.areaInHectares?.toFixed(2) || 0} ha`,
        country_deforestation_risk_level: data.deforestationRiskLevel || 'STANDARD',
        radd_alert: `${data.raddAlertsArea?.toFixed(2) || 0} ha`,
        tree_cover_loss: `${data.treeCoverLossArea?.toFixed(2) || 0} ha`,
        forest_cover_2020: data.isJrcGlobalForestCover || 'No data',
        eudr_compliance_assessment: data.complianceStatus?.status || 'Assessment Pending',
        protected_area_status: JSON.stringify(data.protectedStatus || {}),
        tree_cover_drivers: data.tscDriverDriver?.mostCommonValue || 'Unknown',
        cover_extent_area: `${data.wriTropicalTreeCoverAvg?.toFixed(2) || 0}%`,
        cover_extent_summary: JSON.stringify(data.coverExtentDecileData || {}),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err) {
      hasSaved.current = false;
      setSaveError(err.response?.data?.msg || err.message || 'Failed to save');
      setTimeout(() => setSaveError(null), 8000);
    } finally {
      setIsSaving(false);
    }
  }, [farmInfo]);

  const handleReportCalculated = useCallback((data) => {
    setReportReady(true);
    saveReportToDatabase(data);
  }, [saveReportToDatabase]);

  // ── Fetch données écran ───────────────────────────────────────────────────
  useEffect(() => {
    const go = async () => {
      try {
        const res = await axiosInstance.get(`/api/gfw/farm/${farmId}/report`);
        if (res.data.error) setError(res.data.error);
        else { setFarmInfo(res.data.farm_info); setGeoData(res.data.report || {}); }
      } catch { setError('Failed to fetch farm report.'); }
      finally { setLoading(false); }
    };
    go();
  }, [farmId]);

  useEffect(() => {
    hasSaved.current = false;
    setReportReady(false);
  }, [farmId]);

  // ── Download PDF — appel direct au backend ReportLab ─────────────────────
  const handleDownload = async () => {
    // 1. Correction : Vérifier si farmInfo et farmInfo.farm_id existent
    if (!farmInfo || !farmInfo.farm_id) {
      console.error("Impossible de télécharger le PDF : farm_id manquant dans farmInfo");
      return;
    }

    const farm_id = farmInfo.farm_id; // On extrait proprement l'ID (ex: "B0001")

    try {
      setIsDownloading(true);

      const payload = {
        forest_map_image: forestMapImage // Votre state contenant le base64
      };

      // 2. Correction : Utilisation de farm_id au lieu de id
      const response = await axiosInstance.post(
        `/api/gfw/farm/${farm_id}/eudr-pdf`,
        payload,
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // 3. Correction ici aussi pour le nom du fichier
      link.setAttribute('download', `EUDR_Report_${farm_id}.pdf`);

      document.body.appendChild(link);
      link.click();

      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Erreur lors du téléchargement du PDF :", err);
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
        <Link to="/create-polygon"
          className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg">
          Create Polygon
        </Link>
      </div>
    );
  }
  if (error) return <p className="text-red-600 p-6">{error}</p>;

  const btnReady = !isDownloading;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {isSaving && <Toast bg="#2563eb"><Spinner /> Saving report…</Toast>}
      {saveSuccess && <Toast bg="#16a34a">✓ Report saved!</Toast>}
      {saveError && <Toast bg="#dc2626">✗ {saveError}</Toast>}

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 0 60px 0' }}>

        {/* Vue écran — EudrReportSection inchangée */}
        <EudrReportSection
          results={geoData}
          farmInfo={farmInfo}
          onReportCalculated={handleReportCalculated}
          onForestMapCaptured={setForestMapImage} // <-- AJOUTEZ CETTE LIGNE
        />

        {/* Bouton PDF — génération 100 % backend */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
          <button
            onClick={handleDownload}
            disabled={!btnReady}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '13px 32px', borderRadius: 10, border: 'none',
              background: isDownloading ? '#9ca3af' : '#16a34a',
              color: '#fff', fontWeight: 700, fontSize: 14,
              cursor: isDownloading ? 'not-allowed' : 'pointer',
              boxShadow: isDownloading ? 'none' : '0 4px 14px rgba(22,163,74,.4)',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {isDownloading
              ? <><Spinner /> Generating PDF…</>
              : `⬇ Download EUDR_Report_${farmId}.pdf`}
          </button>
        </div>
      </div>
    </>
  );
};

export default FarmReport;