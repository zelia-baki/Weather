/**
 * CarbonReport.jsx  (FARM)
 * ─────────────────────────────────────────────────────────────────────────
 * Affiche directement le PDF généré par le backend
 * (GET /api/gfw/farm/<id>/carbon-pdf, ReportLab) — ce que l'utilisateur voit
 * est exactement ce qu'il télécharge.
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import axiosInstance from '../../axiosInstance';
import BackendPdfPanel from './BackendPdfPanel.jsx';

const CarbonReport = () => {
  const location = useLocation();
  const farmId   = location.state?.farmId || 'WAK0001';

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 16px 60px' }}>
      <BackendPdfPanel
        fetchPdf={() => axiosInstance.get(`/api/gfw/farm/${farmId}/carbon-pdf`, { responseType: 'blob' })}
        filename={`Carbon_Farm_Report_${farmId}.pdf`}
        title="Farmland Carbon Report"
        waitingLabel="Generating your carbon report…"
      />
    </div>
  );
};

export default CarbonReport;
