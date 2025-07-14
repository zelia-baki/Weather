import React, { useRef, useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import axiosInstance from '../../axiosInstance.jsx';
import { useLocation, Link } from "react-router-dom";
import html2canvas from "html2canvas";
import Loading from '../main/Loading.jsx';
import EudrReportSection from "../Guest/components/EudrReportSection.jsx";
import { downloadPDF } from "../Guest/utils/pdfUtils.js";

const FullReport = () => {
  const [farmInfo, setFarmInfo] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const farmId = location.state?.farmId || "WAK0001"; // fallback
  const reportRef = useRef();

  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const fetchFarmReport = async () => {
      console.log('Fetching farm report for farmId:', farmId);
      try {
        const response = await axiosInstance.get(`/api/gfw/farm/${farmId}/report`);
        if (response.data.error) {
          setError(response.data.error);
        } else {
          setFarmInfo(response.data.farm_info);
          setGeoData(response.data.report || []);
        }
      } catch (err) {
        setError('Failed to fetch farm report.');
        console.error('Error fetching farm report:', err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFarmReport();
  }, [farmId]);

  // const generatePdf = async () => {
  //   const element = reportRef.current;
  //   const pdf = new jsPDF("p", "mm", "a4");
  //   const pages = element.querySelectorAll(".page");
  //   const email = "nkusu@agriyields.com";

  //   for (let i = 0; i < pages.length; i++) {
  //     await new Promise((resolve) => {
  //       const images = pages[i].getElementsByTagName("img");
  //       let loadedCount = 0;

  //       if (images.length === 0) {
  //         resolve();
  //       } else {
  //         Array.from(images).forEach((img) => {
  //           img.onload = () => {
  //             loadedCount++;
  //             if (loadedCount === images.length) {
  //               resolve();
  //             }
  //           };
  //           img.src = img.src;
  //         });
  //       }
  //     });

  //     const canvas = await html2canvas(pages[i], {
  //       scale: 2,
  //       useCORS: true,
  //     });

  //     const imgData = canvas.toDataURL("image/png");
  //     const pdfWidth = pdf.internal.pageSize.getWidth();
  //     const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  //     pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

  //     const margin = 10;
  //     const emailX = pdfWidth - pdf.getTextWidth(email) - margin;
  //     const emailY = pdf.internal.pageSize.getHeight() - margin;
  //     pdf.setFontSize(10);
  //     pdf.text(email, emailX, emailY);

  //     if (i < pages.length - 1) pdf.addPage();
  //   }

  //   pdf.save("EUDR_Report.pdf");
  // };

  if (loading) return <Loading />;
  if (error === 'No polygon found. Please create a polygon for this forest.') {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-red-600">{error}</h1>
        <p className="text-lg text-gray-700 mb-6">
          It seems that no polygon data is available for this forest. You can create a polygon by clicking the link below:
        </p>
        <Link
          to="/create-polygon"
          className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600"
        >
          Create Polygon
        </Link>
      </div>
    );
  }

  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="flex justify-center flex-col items-center text-xl">
      <div ref={reportRef}>
        <EudrReportSection results={geoData} reportRef={reportRef} farmInfo={farmInfo} />
      </div>

      <button onClick={() => downloadPDF(reportRef)} className="btn btn-primary">
        Télécharger le PDF
      </button>


    </div>
  );
};

export default FullReport;
