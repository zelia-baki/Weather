import html2pdf from 'html2pdf.js';
import axiosInstance from '../../../axiosInstance';

export const waitForElementReady = (ref, maxAttempts = 60, delay = 500) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const check = () => {
      if (ref?.current) {
        resolve(ref.current); // 👈 une seule fois .current ici
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
    const element = await waitForElementReady(ref); // 👈 ref simple ici

    const pdfBlob = await html2pdf()
      .set({
        margin: 0,
        filename: `${inputName}_report.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(element) // 👈 ici `element` est un vrai DOM node
      .outputPdf('blob');

    console.log(`✅ PDF généré pour ${inputName}`);
    return pdfBlob;
  } catch (error) {
    console.error(`❌ Erreur lors de la génération du PDF pour ${inputName}:`, error.message);
    alert(error.message);
    return null;
  }
};


export const downloadPDF = async (ref) => {
  const element = ref?.current;

  if (!element) {
    alert('❌ Élément HTML introuvable');
    return;
  }

  const htmlContent = element.outerHTML;

  // Injecter le HTML dans une page complète avec styles
const htmlWithStyles = `
  <html>
    <head>
      <meta charset="utf-8" />
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      <style>
        @page {
          margin: 15mm; /* 🔧 diminue ici (par défaut WeasyPrint met 20mm) */
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
      { html: htmlWithStyles },
      { responseType: 'blob' }
    );


    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'eudr_report.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();

    console.log('✅ PDF téléchargé avec succès');
  } catch (error) {
    console.error('❌ Erreur lors du téléchargement du PDF :', error);
    alert('Une erreur est survenue lors de la génération du PDF.');
  }
};