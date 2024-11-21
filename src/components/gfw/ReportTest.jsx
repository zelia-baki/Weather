import React, { useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const FullReport = () => {
  const reportRef = useRef();

  const generatePdf = async () => {
    const element = reportRef.current;
    const pdf = new jsPDF("p", "mm", "a4");
    const pages = element.querySelectorAll(".page");

    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i], { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      if (i < pages.length - 1) pdf.addPage();
    }

    pdf.save("EUDR_Report.pdf");
  };

  return (
    <div className="flex flex-col items-center">
      {/* Report Content */}
      <div ref={reportRef}>
        {/* Page 1 */}
        <div className="page bg-white p-6 shadow-md mb-4">
          <h1 className="text-3xl font-bold mb-6 text-center">EUDR Compliance Report</h1>
          <p>
            This report evaluates compliance with EU Regulation 2023/1115 on deforestation risks for the Bugunga project in Kalangala, Uganda.
          </p>
          <p className="mt-4">
            Regulation (EU) 2023/1115 governs the availability and export of commodities and products linked to deforestation and degradation. 
            The following analysis provides insights into compliance.
          </p>
        </div>

        {/* Page 2 */}
        <div className="page bg-white p-6 shadow-md mb-4">
          <h2 className="text-2xl font-bold mb-4">Dataset Summary</h2>
          <ul className="list-disc pl-6">
            <li><strong>GFW Negligible Risk Analysis:</strong> 1 = Non-Negligible risk, 2 = Negligible risk</li>
            <li><strong>Presence in Protected Areas:</strong> FALSE = No presence in Peru protected areas</li>
            <li><strong>Land Rights:</strong> FALSE = No presence of GFW Land rights layer</li>
            <li><strong>Tree Cover Extent Decile:</strong> Values range from 0-100 (binned in deciles)</li>
            <li><strong>Tree Cover Loss Drivers:</strong> 1 = Commodity-driven deforestation, 2 = Shifting agriculture</li>
          </ul>
        </div>

        {/* Page 3 */}
        <div className="page bg-white p-6 shadow-md mb-4">
          <h2 className="text-2xl font-bold mb-4">Tree Cover and Deforestation Risk</h2>
          <table className="table-auto w-full mt-4 border-collapse border border-gray-400">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-400 px-4 py-2">Metric</th>
                <th className="border border-gray-400 px-4 py-2">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-400 px-4 py-2">Tropical Tree Cover Percent</td>
                <td className="border border-gray-400 px-4 py-2">0-97%</td>
              </tr>
              <tr>
                <td className="border border-gray-400 px-4 py-2">Tree Cover Height (2020)</td>
                <td className="border border-gray-400 px-4 py-2">0 to 23 meters</td>
              </tr>
              <tr>
                <td className="border border-gray-400 px-4 py-2">Protected Areas</td>
                <td className="border border-gray-400 px-4 py-2">No protected areas identified</td>
              </tr>
              <tr>
                <td className="border border-gray-400 px-4 py-2">Landmark Indigenous and Community Lands</td>
                <td className="border border-gray-400 px-4 py-2">None</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Page 4 */}
        <div className="page bg-white p-6 shadow-md mb-4">
          <h2 className="text-2xl font-bold mb-4">Risk Assessment Breakdown</h2>
          <p>
            Analysis of deforestation drivers shows significant influences from urbanization and shifting agriculture.
          </p>
          <ul className="list-disc pl-6">
            <li>Urbanization: Identified as a key driver</li>
            <li>Shifting Agriculture: Major contributor to forest loss</li>
            <li>Commodity-driven deforestation: Moderate impact</li>
          </ul>
          <div className="bg-gray-200 w-full h-64 flex items-center justify-center mt-6">
            <p className="text-gray-500">Graph Placeholder</p>
          </div>
        </div>

        {/* Additional Pages */}
        {[...Array(7)].map((_, index) => (
          <div key={index} className="page bg-white p-6 shadow-md mb-4">
            <h2 className="text-2xl font-bold">Page {index + 5}</h2>
            <p className="mt-4">Content for page {index + 5}.</p>
            <div className="bg-gray-200 w-full h-64 flex items-center justify-center mt-6">
              <p className="text-gray-500">Figure Placeholder</p>
            </div>
          </div>
        ))}
      </div>

      {/* Generate PDF Button */}
      <button
        onClick={generatePdf}
        className="bg-blue-500 text-white px-6 py-2 rounded mt-4"
      >
        Download PDF Report
      </button>
    </div>
  );
};

export default FullReport;
