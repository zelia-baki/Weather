import axiosInstance from "../../../axiosInstance";

// PDF des reçus QR (un par lot 1..batch_number), commun aux pages Produce,
// Fertilizer, Conservation et Export. Lève une Error au message lisible : les
// pages se contentaient d'un console.error et le bouton ne faisait rien.
export async function downloadReceiptsPdf({ base, description, filename }) {
  const batchNumber = parseInt(base.batch_number, 10);
  if (isNaN(batchNumber) || batchNumber < 1) {
    throw new Error("Enter a valid batch number before downloading.");
  }
  const qrList = Array.from({ length: batchNumber }, (_, i) => ({ ...base, batch_number: (i + 1).toString() }));
  let res;
  try {
    res = await axiosInstance.post(
      "/api/qrcode/generate_pdf",
      { qr_data_list: qrList, description },
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
}
