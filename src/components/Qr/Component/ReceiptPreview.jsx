import React from "react";

/**
 * ReceiptPreview — version originale conservée intégralement.
 * Ajout optionnel : tableau dynamique des fermes si formData + farmBlocks fournis.
 */
const ReceiptPreview = ({
  qrData,
  onDownloadPDF,
  isDownloading,
  // Props optionnelles pour le tableau dynamique
  formData   = null,
  farmBlocks = null,
  formType   = null,
}) => {

  // ── Tableau dynamique des fermes ──────────────────────────
  const farmsTable = React.useMemo(() => {
    if (!formData || !farmBlocks) return [];
    return farmBlocks
      .map((_, i) => ({
        index:    i + 1,
        id:       formData[`farm_${i}_id`]      || "",
        phone:    formData[`farm_${i}_phone`]   || "",
        district: formData[`farm_${i}_district`]|| "",
        qty:      parseFloat(formData[`farm_${i}_qty`]) || 0,
      }))
      .filter((f) => f.id);
  }, [formData, farmBlocks]);

  const totalQty = farmsTable.reduce((s, f) => s + f.qty, 0);

  // ── Empty state (original) ────────────────────────────────
  if (!qrData && farmsTable.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-lg text-center">
        <div className="w-32 h-32 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded animate-pulse"></div>
        </div>
        <h3 className="text-lg font-medium text-gray-600 mb-2">
          Receipt Preview
        </h3>
        <p className="text-gray-400">
          Complete the form to generate your QR code and digital receipt
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ── Tableau dynamique fermes (nouveau, affiché dès qu'une ferme est saisie) ── */}
      {farmsTable.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-lg border mb-4">
          <h3 className="text-base font-semibold text-teal-700 mb-3">
            Farms Contribution ({farmsTable.length})
            {totalQty > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                — Total: <strong className="text-teal-700">{totalQty.toFixed(2)} kg</strong>
              </span>
            )}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs uppercase border-b">
                  <th className="pb-2">#</th>
                  <th className="pb-2">Farm ID</th>
                  <th className="pb-2">Phone</th>
                  <th className="pb-2">District</th>
                  {totalQty > 0 && <th className="pb-2 text-right">Qty (kg)</th>}
                </tr>
              </thead>
              <tbody>
                {farmsTable.map((f) => (
                  <tr key={f.index} className="border-t border-gray-50">
                    <td className="py-1.5 text-gray-400 text-xs">{f.index}</td>
                    <td className="py-1.5 font-semibold text-teal-700">{f.id}</td>
                    <td className="py-1.5 text-gray-600">{f.phone || "—"}</td>
                    <td className="py-1.5 text-gray-600">{f.district || "—"}</td>
                    {totalQty > 0 && (
                      <td className="py-1.5 text-right font-semibold">
                        {f.qty > 0 ? `${f.qty.toFixed(2)} kg` : "—"}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              {farmsTable.length > 1 && totalQty > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-teal-200 bg-teal-50">
                    <td colSpan={4} className="py-1.5 text-xs font-bold text-teal-700">Total</td>
                    <td className="py-1.5 text-right text-xs font-bold text-teal-700">
                      {totalQty.toFixed(2)} kg
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Résumé prix si disponible */}
          {formData && (
            <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-sm">
              {formType === "produce" && (
                <>
                  <div className="text-gray-500">Total Weight</div>
                  <div className="text-right font-semibold text-teal-700">{formData.produce_weight || "—"} kg</div>
                  <div className="text-gray-500">Price / kg</div>
                  <div className="text-right font-semibold">{formData.price_per_kg || "—"} UGX</div>
                  <div className="text-gray-500 font-semibold">Total Value</div>
                  <div className="text-right font-bold text-teal-700">{formData.total_value || "—"} UGX</div>
                </>
              )}
              {formType === "fertilizer" && (
                <>
                  <div className="text-gray-500">Total Weight</div>
                  <div className="text-right font-semibold text-teal-700">{formData.agroinput_weight || "—"} kg</div>
                  <div className="text-gray-500">Price / kg</div>
                  <div className="text-right font-semibold">{formData.price_per_kg || "—"} UGX</div>
                  <div className="text-gray-500 font-semibold">Total Price</div>
                  <div className="text-right font-bold text-teal-700">{formData.total_price || "—"} UGX</div>
                </>
              )}
              {formType === "export" && (
                <>
                  <div className="text-gray-500">Total Weight</div>
                  <div className="text-right font-semibold text-teal-700">{formData.produce_weight || "—"} kg</div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── REÇU ORIGINAL (inchangé) ─────────────────────────── */}
      {qrData && (
        <>
          <div id="receipt" className="bg-white p-6 rounded-lg shadow-lg border">
            <div className="text-center mb-4">
              <img
                src="https://www.nkusu.com/parrotlogo.png"
                alt="Logo"
                className="w-16 h-16 mx-auto mb-2"
              />
              <h2 className="text-xl font-bold text-teal-700">NKUSU DIGITAL STAMPS</h2>
              <p className="text-gray-600">Digital receipt for produce transaction</p>
            </div>
            <div className="text-center mb-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`}
                alt="QR Code"
                className="mx-auto border rounded"
              />
            </div>
            <pre className="text-xs bg-gray-50 p-3 rounded border overflow-auto max-h-40">
              {qrData}
            </pre>
          </div>

          <button
            onClick={onDownloadPDF}
            className={`w-full mt-4 text-white px-6 py-3 rounded-lg shadow transition-colors ${
              isDownloading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : (
              "Download PDF"
            )}
          </button>
        </>
      )}
    </>
  );
};

export default ReceiptPreview;