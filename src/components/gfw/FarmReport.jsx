/**
 * FarmReport.jsx  —  v4 ReportLab
 * ─────────────────────────────────────────────────────────────────────────
 * Le PDF est entièrement généré côté backend (ReportLab).
 * Ce composant :
 *   1. Affiche le rapport EUDR à l'écran (EudrReportSection, inchangée)
 *   2. Sauvegarde les métriques en base via onReportCalculated
 *   3. Affiche directement le PDF backend (POST /api/gfw/farm/<id>/eudr-pdf) dans
 *      un viewer — le rapport HTML reste rendu hors écran pour 1 et 2.
 *
 * Plus de div caché, plus de html2canvas, plus de Playwright pour ce rapport.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../axiosInstance.jsx';
import { Link } from 'react-router-dom';
import useReportEntityId from '../../hooks/useReportEntityId';
import Loading from '../main/Loading.jsx';
import EudrReportSection from '../Guest/components/EudrReportSection.jsx';
import BackendPdfPanel from './BackendPdfPanel.jsx';

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
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [reportReady, setReportReady] = useState(false);
  const [forestMapImage, setForestMapImage] = useState(null);

  const hasSaved = useRef(false);
  const farmId = useReportEntityId('farmId', 'WAK0001');

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

  // ── PDF backend affiché directement ───────────────────────────────────────
  // Le PDF (ReportLab) est généré dès que la heatmap StaticForestMap est
  // capturée — ou après 10 s sans capture (pas de points de couverture).
  const [mapReady, setMapReady] = useState(false);
  const handleForestMapCaptured = useCallback((img) => {
    setForestMapImage(img);
    setMapReady(true);
  }, []);
  useEffect(() => {
    if (!farmInfo) return;
    const t = setTimeout(() => setMapReady(true), 10000);
    return () => clearTimeout(t);
  }, [farmInfo]);

  const fetchPdf = () => axiosInstance.post(
    `/api/gfw/farm/${farmInfo.farm_id}/eudr-pdf`,
    { forest_map_image: forestMapImage },
    { responseType: 'blob' }
  );

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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {isSaving && <Toast bg="#2563eb"><Spinner /> Saving report…</Toast>}
      {saveSuccess && <Toast bg="#16a34a">✓ Report saved!</Toast>}
      {saveError && <Toast bg="#dc2626">✗ {saveError}</Toast>}

      {/* HTML report kept off-screen: it computes/saves the metrics and
          captures the tree-cover heatmap injected into the PDF */}
      <div aria-hidden style={{ position: 'fixed', top: 0, left: '-9999px', width: 800, overflow: 'hidden' }}>
        <EudrReportSection
          results={geoData}
          farmInfo={farmInfo}
          onReportCalculated={handleReportCalculated}
          onForestMapCaptured={handleForestMapCaptured}
        />
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 16px 60px' }}>
        <BackendPdfPanel
          ready={mapReady}
          fetchPdf={fetchPdf}
          storeKey={`eudr-farm-${farmId}`}
          filename={`EUDR_Report_${farmInfo?.farm_id || farmId}.pdf`}
          title="EUDR Compliance Report"
          accent="blue"
          waitingLabel="Generating your EUDR report…"
        />
      </div>
    </>
  );
};

export default FarmReport;