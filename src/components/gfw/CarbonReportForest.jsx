/**
 * CarbonReportForest.jsx  (FOREST)
 * ─────────────────────────────────────────────────────────────────────────
 * Affiche directement le PDF généré par le backend
 * (GET /api/tree-co2/forest/<id>/biomass-index-pdf, ReportLab) — ce que
 * l'utilisateur voit est exactement ce qu'il télécharge.
 */
import React from 'react';
import useReportEntityId from '../../hooks/useReportEntityId';
import axiosInstance from '../../axiosInstance';
import BackendPdfPanel from './BackendPdfPanel.jsx';

const CarbonReportForest = () => {
  const forestId = useReportEntityId('forestId', 1);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 16px 60px' }}>
      <BackendPdfPanel
        fetchPdf={() => axiosInstance.get(`/api/tree-co2/forest/${forestId}/biomass-index-pdf`, { responseType: 'blob' })}
        storeKey={`carbon-forest-${forestId}`}
        filename={`Carbon_Forest_Report_${forestId}.pdf`}
        title="Forest Carbon Report"
        waitingLabel="Generating your forest carbon report…"
      />
    </div>
  );
};

export default CarbonReportForest;
