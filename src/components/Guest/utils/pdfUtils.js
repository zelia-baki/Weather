import html2pdf from 'html2pdf.js';


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
