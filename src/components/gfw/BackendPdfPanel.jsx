/**
 * BackendPdfPanel — shows the real backend-generated PDF (ReportLab) in the
 * page instead of an HTML rendition of the report, so what the user sees is
 * exactly what they download.
 *
 * `fetchPdf` must resolve to the axios response of a `responseType: 'blob'`
 * request. It is called once `ready` becomes true (e.g. after the EUDR
 * heatmap capture), and again on "Retry".
 */
import React, { useEffect, useRef, useState } from 'react';
import PdfViewer from '../Guest/components/PdfViewer.jsx';
import { downloadPdfFile } from '../Guest/utils/pdfDownload';
import { getReportToken, saveReportToken, forgetReportToken, fetchStoredReport } from '../../utils/storedReports';

// Backend errors on a blob request arrive as a JSON Blob — read the message out of it
const readBlobError = async (err) => {
  const data = err?.response?.data;
  if (data instanceof Blob) {
    try {
      const json = JSON.parse(await data.text());
      return json.error || json.msg || JSON.stringify(json);
    } catch { /* not JSON */ }
  }
  return err?.message || 'PDF generation failed.';
};

// `storeKey` (optionnel, ex. "eudr-farm-WAK0001") : le PDF généré est conservé
// côté serveur et ré-affiché tel quel après un rechargement, sans attendre
// `ready` ni le régénérer. "Regenerate" force un nouveau PDF.
const BackendPdfPanel = ({ fetchPdf, ready = true, storeKey = null, filename, title, accent = 'emerald', waitingLabel = 'Generating PDF…' }) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [fromStore, setFromStore] = useState(false);
  // Lu une seule fois au montage : le jeton sauvé après une génération ne doit
  // pas relancer un second chargement (depuis le stockage) du même PDF.
  const [storedToken, setStoredToken] = useState(() => (storeKey ? getReportToken(storeKey) : null));
  const fetchRef = useRef(fetchPdf);
  fetchRef.current = fetchPdf;

  useEffect(() => {
    if (!ready && !storedToken) return;
    let cancelled = false;
    let url = null;
    setError(null);
    setPdfUrl(null);

    const generate = () => fetchRef.current().then((res) => {
      saveReportToken(storeKey, res.headers?.['x-report-token']);
      if (!cancelled) setFromStore(false);
      return res;
    });
    const load = storedToken
      ? fetchStoredReport(storedToken)
          .then((res) => { if (!cancelled) setFromStore(true); return res; })
          .catch((err) => {
            // expiré / autre compte : on oublie le jeton et on régénère
            console.warn('Stored PDF unavailable, regenerating:', err.response?.status || err);
            forgetReportToken(storeKey);
            if (!ready) { if (!cancelled) setStoredToken(null); return null; } // attend `ready`
            return generate();
          })
      : generate();

    load
      .then((res) => {
        if (cancelled || !res) return;
        url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        setPdfUrl(url);
      })
      .catch(async (err) => {
        console.error('❌ PDF generation failed:', err);
        const msg = await readBlobError(err);
        if (!cancelled) setError(msg);
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, attempt, storedToken]);

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 32 }}>
        <p style={{ color: '#dc2626', fontSize: 14, marginBottom: 12 }}>{error}</p>
        <button onClick={() => setAttempt((a) => a + 1)}
          style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div style={{ textAlign: 'center', padding: 48, color: '#6b7280', fontSize: 14 }}>
        <div style={{ width: 28, height: 28, margin: '0 auto 12px', border: '3px solid #d1fae5', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'bpp-spin 1s linear infinite' }} />
        <style>{'@keyframes bpp-spin{to{transform:rotate(360deg)}}'}</style>
        {waitingLabel}
      </div>
    );
  }

  return (
    <div>
      <PdfViewer url={pdfUrl} filename={filename} title={title} accent={accent} />
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
        <button onClick={() => downloadPdfFile(pdfUrl, filename)}
          style={{ padding: '12px 32px', borderRadius: 10, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          ⬇ Download PDF
        </button>
        {fromStore && (
          <button onClick={() => { forgetReportToken(storeKey); setStoredToken(null); setAttempt((a) => a + 1); }}
            disabled={!ready}
            style={{ padding: '12px 24px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14, cursor: ready ? 'pointer' : 'not-allowed' }}>
            ↻ Regenerate
          </button>
        )}
      </div>
    </div>
  );
};

export default BackendPdfPanel;
