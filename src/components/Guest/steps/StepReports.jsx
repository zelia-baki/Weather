import CarbonReportSection from "../components/CarbonReportSection";
import EudrReportSection from "../components/EudrReportSection";
import { generatePdfBlob } from "../utils/pdfUtils";

const StepReports = ({ reports, reportRefs }) => {
  return (
    <div className="flex flex-col items-center fade-in">
      {reports.eudr && (
        <>
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
            className="bg-blue-500 text-white px-6 py-3 rounded-md mt-6 hover:bg-blue-700 transition duration-300"
          >
            Download the EUDR PDF
          </button>
        </>
      )}

      {reports.carbon && (
        <>
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
            className="bg-blue-500 text-white px-6 py-3 rounded-md mt-6 hover:bg-blue-700 transition duration-300"
          >
            Download the Carbon PDF
          </button>
        </>
      )}
    </div>
  );
};

export default StepReports;
