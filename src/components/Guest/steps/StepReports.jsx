import SentinelDashboard from "../../Sentinel/SentinelDashboard";
import PdfViewer from "../components/PdfViewer";
import { downloadPdfFile } from "../utils/pdfDownload";

const formatTime = (ts) => new Date(ts).toLocaleTimeString();

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
          <PdfReportBlock
            key={entry.id}
            entry={entry}
            filename={`Carbon_Report_${entry.id}.pdf`}
            label="🌳 Download the Carbon PDF"
            colorClass="bg-green-500 hover:bg-green-700"
            accent="emerald"
            viewerTitle="Carbon Emissions Report"
          />
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