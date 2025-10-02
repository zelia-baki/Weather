import CarbonReportSection from "../components/CarbonReportSection";
import EudrReportSection from "../components/EudrReportSection";
import { generatePdfBlob } from "../utils/pdfUtils";

const StepReports = ({ reports, reportRefs, highlightReports = "" }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 text-center">
        Your Reports
      </h2>

      {/* ✅ Appliquer le highlight uniquement sur la section des rapports */}
      <div className={`flex flex-col items-center fade-in space-y-8 ${highlightReports}`}>
        {reports.eudr && (
          <div className="w-full">
            <EudrReportSection results={reports.eudr} reportRef={reportRefs.eudr} />
            <button
              onClick={async () => {
                const blob = await generatePdfBlob(reportRefs.eudr, "eudr");
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = "EUDR_Report.pdf";
                  link.click();
                }
              }}
              className="bg-blue-500 text-white px-6 py-3 rounded-md mt-6 hover:bg-blue-700 transition duration-300 w-full"
            >
              📄 Download the EUDR PDF
            </button>
          </div>
        )}

        {reports.carbon && (
          <div className="w-full">
            <CarbonReportSection results={reports.carbon} reportRef={reportRefs.carbon} />
            <button
              onClick={async () => {
                const blob = await generatePdfBlob(reportRefs.carbon, "carbon");
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = "Carbon_Report.pdf";
                  link.click();
                }
              }}
              className="bg-green-500 text-white px-6 py-3 rounded-md mt-6 hover:bg-green-700 transition duration-300 w-full"
            >
              🌳 Download the Carbon PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StepReports;