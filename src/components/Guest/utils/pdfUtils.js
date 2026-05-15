import html2pdf from 'html2pdf.js';
import axiosInstance from '../../../axiosInstance';

// ── Exports originaux — INCHANGÉS ────────────────────────────────────────────

export const waitForElementReady = (ref, maxAttempts = 60, delay = 500) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      if (ref?.current) {
        resolve(ref.current);
      } else {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(check, delay);
        } else {
          reject(new Error("⏳ L'élément HTML du rapport n'est toujours pas prêt après 30 secondes."));
        }
      }
    };
    check();
  });
};

export const generatePdfBlob = async (ref, inputName) => {
  console.log("📐 Élément DOM utilisé pour PDF :", ref.current);
  try {
    const element = await waitForElementReady(ref);
    const pdfBlob = await html2pdf()
      .set({
        margin: 0,
        filename: `${inputName}_report.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(element)
      .outputPdf('blob');
    console.log(`✅ PDF généré pour ${inputName}`);
    return pdfBlob;
  } catch (error) {
    console.error(`❌ Erreur lors de la génération du PDF pour ${inputName}:`, error.message);
    alert(error.message);
    return null;
  }
};

export const downloadPDF = async (ref, filename = 'report.pdf') => {
  const element = ref?.current;
  if (!element) {
    alert('❌ Élément HTML introuvable');
    return;
  }

  const htmlContent = element.outerHTML;

  const htmlWithStyles = `
  <html>
    <head>
      <meta charset="utf-8" />
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      <style>
        @page {
          margin: 15mm;
        }
        body {
          font-family: Arial, sans-serif;
        }
        .html2pdf__page-break {
          page-break-after: always;
        }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
  </html>
`;

  try {
    const response = await axiosInstance.post(
      '/api/gfw/generate-pdf',
      { html: htmlWithStyles, filename },
      { responseType: 'blob' }
    );
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || 'eudr_report.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    console.log('✅ PDF téléchargé avec succès');
  } catch (error) {
    console.error('❌ Erreur lors du téléchargement du PDF :', error);
    alert('Une erreur est survenue lors de la génération du PDF.');
  }
};

// ── generatePDF — NOUVEAU ─────────────────────────────────────────────────────
// Utilisé par CarbonReport.jsx et CarbonReportForest.jsx pour capturer
// le div caché 794px et l'envoyer à Playwright backend.
// Les images sont converties en base64 avant envoi → rendu parfait.

const FRONTEND_BASE_URL = window.location.origin;

async function imageToBase64(url) {
  if (!url || url.startsWith('data:')) return url;
  try {
    const absUrl   = url.startsWith('http') ? url : `${FRONTEND_BASE_URL}${url}`;
    const response = await fetch(absUrl, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob        = await response.blob();
    const mimeType    = blob.type || 'image/png';
    const arrayBuffer = await blob.arrayBuffer();
    const bytes       = new Uint8Array(arrayBuffer);
    let binary        = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return `data:${mimeType};base64,${btoa(binary)}`;
  } catch (e) {
    console.warn(`⚠️ Image non convertie (${url}): ${e.message}`);
    return url;
  }
}

async function inlineAllImages(html) {
  const parser = new DOMParser();
  const doc    = parser.parseFromString(html, 'text/html');
  const images = Array.from(doc.querySelectorAll('img[src]'));
  await Promise.all(
    images.map(async (img) => {
      const b64 = await imageToBase64(img.getAttribute('src'));
      if (b64) img.setAttribute('src', b64);
    })
  );
  return doc.documentElement.outerHTML;
}

export const generatePDF = async (ref, filename = 'Report.pdf') => {
  const element = ref?.current;
  if (!element) throw new Error('generatePDF : ref.current est null');

  // Rendre visible le div caché le temps de lire son HTML
  const prev = {
    visibility: element.style.visibility,
    position:   element.style.position,
    left:       element.style.left,
  };
  element.style.visibility = 'visible';
  element.style.position   = 'fixed';
  element.style.left       = '-9999px';

  try {
    // Attendre les images dans le DOM
    await Promise.all(
      Array.from(element.getElementsByTagName('img')).map(img =>
        img.complete
          ? Promise.resolve()
          : new Promise(r => { img.onload = r; img.onerror = r; })
      )
    );
    await new Promise(r => setTimeout(r, 400));

    // Convertir les images en base64
    const rawHtml        = element.outerHTML;
    const htmlWithBase64 = await inlineAllImages(rawHtml);

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0;
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @media print {
      body { background: white; }
    }
  </style>
</head>
<body>${htmlWithBase64}</body>
</html>`;

    const response = await axiosInstance.post(
      '/api/gfw/generate-pdf',
      { html: fullHtml, filename },
      { responseType: 'blob' }
    );

    const url  = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href  = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

  } finally {
    Object.assign(element.style, prev);
  }
};