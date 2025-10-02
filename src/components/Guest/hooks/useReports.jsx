import { useState } from "react";
import axiosInstance from "../../../axiosInstance";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const useReports = ({ files, geojson, userInfo, setStep, reportRefs }) => {
  const [reports, setReports] = useState({ eudr: null, carbon: null });
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState({ eudr: false, carbon: false });

  const handleReportReady = async (featureName) => {
    const key = featureName === "reporteudrguest" ? "eudr" : "carbon";

    let file = files[key] || files.geojson;

    if (!file && geojson) {
      console.log("🔍 GeoJSON brut:", geojson);

      // Extraire directement la géométrie selon le type
      let geometry;
      if (geojson.type === "FeatureCollection") {
        geometry = geojson.features[0].geometry;
      } else if (geojson.type === "Feature") {
        geometry = geojson.geometry;  // <- Correction ici
      } else {
        geometry = geojson; // C'est déjà une géométrie
      }

      // Créer une structure GeoJSON complète et valide
      const validGeojson = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: geometry  // <- Pas de duplication
          }
        ]
      };

      console.log("✅ GeoJSON formaté:", JSON.stringify(validGeojson, null, 2));

      const geojsonBlob = new Blob(
        [JSON.stringify(validGeojson, null, 2)],
        { type: 'application/json' }
      );
      file = new File([geojsonBlob], 'drawn-polygon.geojson', {
        type: 'application/json'
      });
    }

    if (!file) {
      console.error("❌ Aucun fichier ou geojson disponible");
      return;
    }

    console.log("📦 Fichier à envoyer:", file.name, file.type);

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
      console.error("❌ Erreur lors de la génération du rapport :", err.response?.data || err);
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