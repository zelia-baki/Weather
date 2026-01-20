import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../axiosInstance";
import EudrReportSection from "../Guest/components/EudrReportSection";
import CarbonReportSection from "../Guest/components/CarbonReportSection";
import { generatePdfBlob } from "../Guest/utils/pdfUtils";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [verifying, setVerifying] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [context, setContext] = useState(null);

  const reportRef = useRef();

  const transToken = searchParams.get("TransactionToken") || searchParams.get("trans_token");

  useEffect(() => {
    if (!transToken) {
      setError("Missing transaction token");
      setVerifying(false);
      return;
    }

    // Récupérer le contexte sauvegardé
    const savedContext = localStorage.getItem("dpo_payment_context");
    if (savedContext) {
      const parsedContext = JSON.parse(savedContext);
      setContext(parsedContext);
      console.log("📦 Context recovered:", parsedContext);
    } else {
      console.warn("⚠️ No payment context found in localStorage");
    }

    verifyPayment();
  }, [transToken]);

  const verifyPayment = async () => {
    try {
      console.log("🔍 Verifying payment with token:", transToken);
      
      const response = await axiosInstance.get(`/api/payments/dpo/verify/${transToken}`);
      
      console.log("✅ Verification response:", response.data);
      
      if (response.data.success && response.data.status === "verified") {
        setPaymentInfo(response.data);
        setVerifying(false);
        
        // Générer automatiquement le rapport
        await generateReport();
      } else {
        setError("Payment verification failed");
        setVerifying(false);
      }
    } catch (err) {
      console.error("❌ Payment verification error:", err);
      setError(err.response?.data?.error || "Verification failed");
      setVerifying(false);
    }
  };

  const generateReport = async () => {
    if (!context) {
      setError("No payment context found. Please try again.");
      return;
    }

    setGeneratingReport(true);
    console.log("📊 Generating report with context:", context);

    try {
      // Récupérer le GeoJSON
      const geojsonStr = context.geojson || localStorage.getItem("polygon_geojson");
      if (!geojsonStr) {
        throw new Error("No GeoJSON data found");
      }

      const geojson = JSON.parse(geojsonStr);
      console.log("🗺️ GeoJSON recovered:", geojson);

      // Créer le fichier GeoJSON
      let geometry;
      if (geojson.type === "FeatureCollection") {
        geometry = geojson.features[0].geometry;
      } else if (geojson.type === "Feature") {
        geometry = geojson.geometry;
      } else {
        geometry = geojson;
      }

      const validGeojson = {
        type: "FeatureCollection",
        features: [{
          type: "Feature",
          properties: {},
          geometry: geometry
        }]
      };

      const geojsonBlob = new Blob(
        [JSON.stringify(validGeojson, null, 2)],
        { type: 'application/json' }
      );
      
      const file = new File([geojsonBlob], 'payment-polygon.geojson', {
        type: 'application/json'
      });

      // Générer le rapport
      const formData = new FormData();
      formData.append("file", file);

      const endpoint = context.featureName === "reportcarbonguest" 
        ? "/api/gfw/Geojson/CarbonReportFromFile"
        : "/api/gfw/Geojson/ReportFromFile";

      console.log("📤 Calling report API:", endpoint);

      const res = await axiosInstance.post(endpoint, formData, {
        headers: {
          "X-Guest-Phone": context.phone,
        },
      });

      console.log("✅ Report generated:", res.data);
      setReport(res.data.report);
      
      // Nettoyer le contexte
      localStorage.removeItem("dpo_payment_context");
      
    } catch (err) {
      console.error("❌ Error generating report:", err);
      setError("Failed to generate report: " + (err.response?.data?.error || err.message));
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    
    try {
      const reportType = context.featureName === "reportcarbonguest" ? "carbon" : "eudr";
      const blob = await generatePdfBlob(reportRef, reportType);
      
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${reportType}_report.pdf`;
        link.click();
      }
    } catch (err) {
      console.error("Error downloading PDF:", err);
    }
  };

  // État: Vérification
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifying Payment...</h2>
          <p className="text-gray-600">Please wait while we confirm your transaction</p>
        </div>
      </div>
    );
  }

  // État: Génération du rapport
  if (generatingReport) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Generating Your Report...</h2>
          <p className="text-gray-600">This may take a few moments</p>
        </div>
      </div>
    );
  }

  // État: Erreur
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/EUDRSubmissionForGuest")}
              className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate("/home")}
              className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // État: Succès avec rapport
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header de succès */}
        <div className="bg-white p-8 rounded-2xl shadow-xl mb-6 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
          <p className="text-gray-600">Your transaction has been completed and your report is ready</p>

          {paymentInfo && (
            <div className="bg-gray-50 rounded-lg p-4 mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold text-gray-800">
                  {paymentInfo.amount} {paymentInfo.currency}
                </span>
              </div>
              {paymentInfo.company_ref && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Reference:</span>
                  <span className="font-mono text-xs text-gray-800">{paymentInfo.company_ref}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rapport */}
        {report && context && (
          <div className="bg-white p-6 rounded-2xl shadow-xl">
            {context.featureName === "reportcarbonguest" ? (
              <CarbonReportSection results={report} reportRef={reportRef} />
            ) : (
              <EudrReportSection results={report} reportRef={reportRef} />
            )}

            <div className="mt-6 space-y-3">
              <button
                onClick={handleDownloadPDF}
                className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF Report
              </button>
              
              <button
                onClick={() => navigate("/home")}
                className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}