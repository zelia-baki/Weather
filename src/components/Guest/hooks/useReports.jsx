import { useState } from "react";
import axiosInstance from "../../../axiosInstance";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const useReports = ({ files, userInfo, setStep, reportRefs }) => {
  const [reports, setReports] = useState({ eudr: null, carbon: null });
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState({ eudr: false, carbon: false });

  const handleReportReady = async (featureName) => {
    const key = featureName === "reporteudrguest" ? "eudr" : "carbon";
    const file = files[key] || files.geojson;
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    await wait(2000);

    try {
      const res = await axiosInstance.post(
        `/api/gfw/Geojson/${featureName === "reportcarbonguest" ? "CarbonReportFromFile" : "ReportFromFile"}`,
        formData,
        {
          headers: {
            "X-Guest-ID": localStorage.getItem("guest_id"),
            "X-Guest-Phone": userInfo.phone,
          },
        }
      );

      const rdata = res.data.report;
      setReports((prev) => ({ ...prev, [key]: rdata }));
      setStep(5);
    } catch (err) {
      console.error("❌ Erreur lors de la génération du rapport :", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    reports,
    loading,
    showPaymentModal,
    setShowPaymentModal,
    handleReportReady,
  };
};
