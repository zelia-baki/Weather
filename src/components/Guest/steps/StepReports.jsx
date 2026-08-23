import SentinelDashboard from "../../Sentinel/SentinelDashboard";

const formatTime = (ts) => new Date(ts).toLocaleTimeString();

const downloadPdf = (pdfUrl, filename) => {
  if (!pdfUrl) return;
  const link = document.createElement("a");
  link.href = pdfUrl;
  link.download = filename;
  link.click();
};

const PdfReportBlock = ({ entry, filename, label, colorClass }) => (
  <div className="w-full">
    <p className="text-xs text-gray-400 text-center mb-1">
      Generated at {formatTime(entry.timestamp)}
    </p>
    {entry.pdfUrl ? (
      <>
        <object
          data={entry.pdfUrl}
          type="application/pdf"
          className="w-full rounded-lg shadow-md border border-gray-200"
          style={{ height: "80vh" }}
        >
          <p className="text-center text-sm text-gray-500 py-6">
            Preview unavailable —{" "}
            <a href={entry.pdfUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
              open the PDF
            </a>
          </p>
        </object>
        <button
          onClick={() => downloadPdf(entry.pdfUrl, filename)}
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
          />
        ))}

        {carbonList.map((entry) => (
          <PdfReportBlock
            key={entry.id}
            entry={entry}
            filename={`Carbon_Report_${entry.id}.pdf`}
            label="🌳 Download the Carbon PDF"
            colorClass="bg-green-500 hover:bg-green-700"
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