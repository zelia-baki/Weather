import { useState } from "react";
import axiosInstance from "../../../axiosInstance";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const FEATURE_TO_KEY = {
  reporteudrguest: "eudr",
  reportcarbonguest: "carbon",
  reportndviguest: "sentinel",
};

// factorisé depuis le bloc existant
const normalizeGeojson = (geojson) => {
  let geometry;
  if (geojson.type === "FeatureCollection") {
    geometry = geojson.features[0].geometry;
  } else if (geojson.type === "Feature") {
    geometry = geojson.geometry;
  } else {
    geometry = geojson;
  }
  return {
    type: "FeatureCollection",
    features: [{ type: "Feature", properties: {}, geometry }],
  };
};

export const useReports = ({ files, geojson, userInfo, setStep, reportRefs }) => {
  const [reports, setReports] = useState({ eudr: null, carbon: null, sentinel: null });
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState({ eudr: false, carbon: false, sentinel: false });

  const handleReportReady = async (featureName) => {
    const key = FEATURE_TO_KEY[featureName];
    if (!key) { console.error("❌ Unknown featureName:", featureName); return; }

    // ── NDVI : appel JSON direct, pas de FormData ──────────────────────────
    if (featureName === "reportndviguest") {
      if (!geojson) { console.error("❌ Aucun polygone disponible"); return; }
      setLoading(true);
      await wait(2000);
      try {
        const res = await axiosInstance.post("/api/sentinel/guest/sat-index", {
          geojson: normalizeGeojson(geojson),
          phone: userInfo.phone,
        });
        setReports((prev) => ({ ...prev, sentinel: res.data }));
        setStep(5);
      } catch (err) {
        console.error("❌ Erreur NDVI guest:", err.response?.data || err);
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── EUDR / Carbon : flow existant inchangé ─────────────────────────────
    let file = files[key] || files.geojson;
    if (!file && geojson) {
      const geojsonBlob = new Blob([JSON.stringify(normalizeGeojson(geojson), null, 2)], { type: 'application/json' });
      file = new File([geojsonBlob], 'drawn-polygon.geojson', { type: 'application/json' });
    }
    if (!file) { console.error("❌ Aucun fichier ou geojson disponible"); return; }

    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    await wait(2000);
    try {
      const res = await axiosInstance.post(
        `/api/gfw/Geojson/${featureName === "reportcarbonguest" ? "CarbonReportFromFile" : "ReportFromFile"}`,
        formData,
        { headers: { "X-Guest-ID": localStorage.getItem("guest_id"), "X-Guest-Phone": userInfo.phone } },
      );
      setReports((prev) => ({ ...prev, [key]: res.data.report }));
      setStep(5);
    } catch (err) {
      console.error("❌ Erreur lors de la génération du rapport :", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  return { reports, loading, showPaymentModal, setShowPaymentModal, handleReportReady };
};