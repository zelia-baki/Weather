import axiosInstance from "../../../axiosInstance";

// Plafond aussi appliqué par le backend (MAX_RECEIPTS) : un numéro de lot comme
// 2026 demandait 2026 reçus (~500 pages) et bloquait le serveur.
export const MAX_RECEIPTS = 100;

// PDF des reçus QR (un par lot 1..batch_number), commun aux pages Produce,
// Fertilizer, Conservation et Export. Lève une Error au message lisible.
// Chaque QR imprimé est un lien court vers /trace/<hash> (page publique avec
// toutes les données) : renvoie la liste de ces hash pour l'aperçu.
export async function downloadReceiptsPdf({ base, description, filename, qrType = "default" }) {
  const raw = String(base.batch_number ?? "").trim();
  const batchNumber = /^\d+$/.test(raw) ? parseInt(raw, 10) : NaN;
  if (isNaN(batchNumber) || batchNumber < 1) {
    throw new Error("Batch Number is the number of receipts to print: enter a whole number (1, 2, 3…).");
  }
  if (batchNumber > MAX_RECEIPTS) {
    throw new Error(`At most ${MAX_RECEIPTS} receipts per PDF (you asked for ${batchNumber}). Lower the Batch Number.`);
  }
  const qrList = Array.from({ length: batchNumber }, (_, i) => ({ ...base, batch_number: (i + 1).toString() }));
  let res;
  try {
    res = await axiosInstance.post(
      "/api/qrcode/generate_pdf",
      { qr_data_list: qrList, description, qr_type: qrType },
      { responseType: "blob" }
    );
  } catch (err) {
    // responseType blob : le JSON d'erreur du backend arrive sous forme de Blob
    let message = err.message;
    const data = err.response?.data;
    if (data instanceof Blob) {
      try { message = JSON.parse(await data.text()).error || message; } catch { /* pas du JSON */ }
    }
    throw new Error(`PDF generation failed: ${message}`);
  }
  const url  = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href  = url;
  link.setAttribute("download", filename(batchNumber));
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);

  const header = res.headers?.["x-trace-hashes"] || "";
  return header.split(",").filter(Boolean);
}

export const traceUrl = (hash) => `${window.location.origin}/trace/${hash}`;
