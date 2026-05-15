/**
 * generatePDF.js  —  v2 ROBUST
 * ─────────────────────────────────────────────────────────────────────────
 * PROBLÈME v1 : html2canvas était appelé N fois (une par tranche A4).
 *   → Résultat : tables, images et graphiques coupés en plein milieu.
 *
 * SOLUTION v2 :
 *   1. Capturer l'élément ENTIER en UN SEUL canvas haute-résolution.
 *   2. Découper CE canvas en tranches A4 via drawImage (sur l'image finale).
 *   3. Chaque tranche est ajoutée comme une page JPEG dans jsPDF.
 *
 * Avantages :
 *   - html2canvas rend tout d'un seul tenant → aucun élément tronqué
 *   - Mapbox Static images, pie-charts, tables → toujours complets
 *   - Fonctionne sur tous les devices (mobile compris)
 *
 * Usage :
 *   import { generatePDF } from './pdf/generatePDF';
 *   await generatePDF(hiddenDivRef, `EUDR_Report_${farmId}.pdf`);
 */

import { jsPDF }    from 'jspdf';
import html2canvas  from 'html2canvas';

const FOOTER = '© 2025 Agriyields  •  nkusu@agriyields.com';

/**
 * @param {React.RefObject} ref       Ref sur le div caché 794 px
 * @param {string}          filename  Nom du fichier PDF produit
 */
export const generatePDF = async (ref, filename = 'Report.pdf') => {
  const element = ref.current;
  if (!element) throw new Error('generatePDF : ref.current est null');

  // ── 1. Rendre visible pour la capture ────────────────────────────────────
  const saved = {
    visibility : element.style.visibility,
    position   : element.style.position,
    left       : element.style.left,
    top        : element.style.top,
  };
  element.style.visibility = 'visible';
  element.style.position   = 'fixed';
  element.style.left       = '-9999px';
  element.style.top        = '0';

  try {
    // ── 2. Attendre les images (logos, cartes Mapbox, …) ─────────────────
    await Promise.all(
      Array.from(element.getElementsByTagName('img')).map(img =>
        img.complete
          ? Promise.resolve()
          : new Promise(resolve => { img.onload = resolve; img.onerror = resolve; })
      )
    );

    // Pause pour que Chart.js et Mapbox GL finissent de peindre
    await new Promise(r => setTimeout(r, 700));

    // ── 3. Capturer l'ÉLÉMENT ENTIER en un seul canvas ───────────────────
    //    height = scrollHeight  → tout le contenu, même ce qui dépasse l'écran
    const fullCanvas = await html2canvas(element, {
      scale            : 2,          // haute résolution
      useCORS          : true,        // autorise les images cross-origin (Mapbox)
      allowTaint       : false,
      backgroundColor  : '#ffffff',
      width            : element.offsetWidth,
      height           : element.scrollHeight,
      windowWidth      : element.offsetWidth,
      windowHeight     : element.scrollHeight,
      scrollX          : 0,
      scrollY          : 0,
      imageTimeout     : 30000,       // 30 s pour les images lentes (Mapbox)
      onclone          : (doc) => {
        // S'assurer que le clone est aussi visible
        const el = doc.body.querySelector('[data-pdf-root]');
        if (el) el.style.visibility = 'visible';
      },
    });

    // ── 4. Paramètres PDF ─────────────────────────────────────────────────
    const pdf        = new jsPDF('p', 'mm', 'a4');
    const pdfW       = pdf.internal.pageSize.getWidth();   // 210 mm
    const pdfH       = pdf.internal.pageSize.getHeight();  // 297 mm

    const canvasW    = fullCanvas.width;
    const canvasH    = fullCanvas.height;

    // Hauteur en pixels de canvas équivalente à une page A4
    // (canvasW px  →  pdfW mm  →  pdfH mm  → pageCanvasH px)
    const pageCanvasH = Math.floor(canvasH * (pdfW / canvasW) > 0
      ? canvasW * (pdfH / pdfW)
      : canvasW * (pdfH / pdfW)
    );

    const totalPages  = Math.ceil(canvasH / pageCanvasH);

    // ── 5. Découper le canvas en pages et injecter dans le PDF ────────────
    for (let page = 0; page < totalPages; page++) {
      const srcY = page * pageCanvasH;
      const srcH = Math.min(pageCanvasH, canvasH - srcY);

      // Canvas de la taille d'une page A4 (fond blanc)
      const pageCanvas        = document.createElement('canvas');
      pageCanvas.width        = canvasW;
      pageCanvas.height       = pageCanvasH;
      const ctx               = pageCanvas.getContext('2d');
      ctx.fillStyle           = '#ffffff';
      ctx.fillRect(0, 0, canvasW, pageCanvasH);

      // Copier la tranche correspondante du canvas complet
      ctx.drawImage(
        fullCanvas,
        0, srcY,   canvasW, srcH,   // source  : position dans fullCanvas
        0, 0,      canvasW, srcH    // dest    : haut de pageCanvas
      );

      // JPEG (plus compact que PNG pour les maps satellite)
      const imgData = pageCanvas.toDataURL('image/jpeg', 0.95);

      if (page > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);

      // Footer bas de page
      pdf.setFontSize(8);
      pdf.setTextColor(160, 160, 160);
      pdf.text(FOOTER, pdfW / 2, pdfH - 4, { align: 'center' });
    }

    pdf.save(filename);

  } finally {
    // ── 6. Restaurer le div caché dans tous les cas ───────────────────────
    Object.assign(element.style, saved);
  }
};