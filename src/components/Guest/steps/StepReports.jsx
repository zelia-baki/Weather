import { Trees, Wheat, Sprout } from "lucide-react";
import SentinelDashboard from "../../Sentinel/SentinelDashboard";
import PdfViewer from "../components/PdfViewer";
import { downloadPdfFile } from "../utils/pdfDownload";

const formatTime = (ts) => new Date(ts).toLocaleTimeString();

// ✅ NOUVEAU — complément au Carbon Report (voir useReports.jsx fetchCarbonExtra) :
// NDVI/AGB pour une forêt, SOC SoilGrids + culture prédite pour une ferme.
// S'affiche EN PLUS du PDF (chiffres GFW inchangés), jamais à sa place.
const CarbonExtraBlock = ({ extra }) => {
  if (!extra) return null;

  if (extra.property_type === "forest") {
    const b = extra.biomass || {};
    return (
      <div className="w-full max-w-xl mx-auto bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
        <p className="text-sm font-bold text-emerald-800 flex items-center gap-1.5">
          <Trees size={15} /> Forest biomass (satellite NDVI estimate)
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm text-emerald-900">
          <div>AGB: <strong>{((b.agb_kg || 0) / 1000).toFixed(2)} Mg</strong></div>
          <div>BGB: <strong>{((b.bgb_kg || 0) / 1000).toFixed(2)} Mg</strong></div>
          <div>Total carbon: <strong>{((b.total_carbon_kg || 0) / 1000).toFixed(2)} Mg C</strong></div>
          <div>CO2e: <strong>{((b.co2_sequestered_kg || 0) / 1000).toFixed(2)} Mg</strong></div>
        </div>
        <p className="text-xs text-emerald-700">
          NDVI {b.ndvi_used} ({b.ndvi_date}) · {extra.area_ha} ha · generic model, requires local calibration.
        </p>
      </div>
    );
  }

  // farm
  const soc = extra.soc;
  const crop = extra.crop_prediction;
  return (
    <div className="w-full max-w-xl mx-auto bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
      <p className="text-sm font-bold text-amber-800 flex items-center gap-1.5">
        <Wheat size={15} /> Soil organic carbon (SoilGrids ISRIC)
      </p>
      {soc ? (
        <div className="grid grid-cols-2 gap-2 text-sm text-amber-900">
          <div>Stock 0-30cm: <strong>{soc["ocs_0-30cm"]} t/ha</strong></div>
          <div>SOC 0-5cm: <strong>{soc["soc_0-5cm"]} g/kg</strong></div>
          <div>SOC 5-15cm: <strong>{soc["soc_5-15cm"]} g/kg</strong></div>
          <div>SOC 15-30cm: <strong>{soc["soc_15-30cm"]} g/kg</strong></div>
        </div>
      ) : (
        <p className="text-xs text-amber-700">Soil data unavailable for this location.</p>
      )}

      {crop?.predicted_crop && (
        <div className="pt-2 border-t border-amber-200">
          <p className="text-sm font-bold text-amber-800 flex items-center gap-1.5 mb-1">
            <Sprout size={15} /> Predicted crop
          </p>
          <p className="text-sm text-amber-900">
            <strong>{crop.predicted_crop}</strong> ({crop.confidence}% confidence)
          </p>
        </div>
      )}
    </div>
  );
};

const PdfReportBlock = ({ entry, filename, label, colorClass, accent, viewerTitle }) => (
  <div className="w-full">
    <p className="text-xs text-gray-400 text-center mb-1">
      Generated at {formatTime(entry.timestamp)}
    </p>
    {entry.pdfUrl ? (
      <>
        <PdfViewer url={entry.pdfUrl} filename={filename} title={viewerTitle} accent={accent} />
        <button
          onClick={() => downloadPdfFile(entry.pdfUrl, filename)}
          className={`${colorClass} text-white px-6 py-3 rounded-md mt-4 transition duration-300 w-full`}
        >
          {label}
        </button>
      </>
    ) : (
      <p className="text-center text-sm text-gray-400 py-6">⏳ Generating PDF…</p>
    )}
  </div>
);

const StepReports = ({ reports, geojson, phone, highlightReports = "" }) => {
  const eudrList = reports?.eudr || [];
  const carbonList = reports?.carbon || [];
  const sentinelList = reports?.sentinel || [];
  const hasAny = eudrList.length > 0 || carbonList.length > 0 || sentinelList.length > 0;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 text-center">
        Your Reports
      </h2>

      {!hasAny && (
        <p className="text-center text-sm text-gray-500">
          No report available yet. Reports stay available for 5 minutes after generation.
        </p>
      )}

      <div className={`flex flex-col items-center fade-in space-y-8 ${highlightReports}`}>
        {eudrList.map((entry) => (
          <PdfReportBlock
            key={entry.id}
            entry={entry}
            filename={`EUDR_Report_${entry.id}.pdf`}
            label="📄 Download the EUDR PDF"
            colorClass="bg-blue-500 hover:bg-blue-700"
            accent="blue"
            viewerTitle="EUDR Compliance Report"
          />
        ))}

        {carbonList.map((entry) => (
          <div className="w-full space-y-4" key={entry.id}>
            <PdfReportBlock
              entry={entry}
              filename={`Carbon_Report_${entry.id}.pdf`}
              label="🌳 Download the Carbon PDF"
              colorClass="bg-green-500 hover:bg-green-700"
              accent="emerald"
              viewerTitle="Carbon Emissions Report"
            />
            <CarbonExtraBlock extra={entry.extra} />
          </div>
        ))}

        {sentinelList.map((entry) => (
          <div className="w-full" key={entry.id}>
            <p className="text-xs text-gray-400 text-center mb-1">
              Generated at {formatTime(entry.timestamp)}
            </p>
            <SentinelDashboard
              entityType="farm"
              mode="guest"
              geojson={entry.geojson || geojson}
              phone={phone}
              initialData={entry.data}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepReports;