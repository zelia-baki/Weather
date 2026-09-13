import { useState, useEffect } from "react";
import axiosInstance from "../../../axiosInstance";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const FEATURE_TO_KEY = {
  reporteudrguest: "eudr",
  reportcarbonguest: "carbon",
  reportndviguest: "sentinel",
};

const CACHE_KEY = "guest_reports_cache";
const TTL_MS = 5 * 60 * 1000; // ✅ 5 minutes

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

const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return String(hash);
};

const getSourceKey = (geojson, file) => {
  if (geojson) return hashString(JSON.stringify(normalizeGeojson(geojson)));
  if (file) return hashString(`${file.name}_${file.size}_${file.lastModified}`);
  return "unknown";
};

const emptyCache = () => ({ eudr: [], carbon: [], sentinel: [] });

// ✅ pdfUrl est un Object URL (blob) — invalide après reload, on ne le persiste jamais
const stripPdfUrl = (list) => (list || []).map(({ pdfUrl, ...rest }) => rest);

const loadCache = () => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return emptyCache();
    const parsed = JSON.parse(raw);
    const now = Date.now();
    const prune = (list) => (list || []).filter((r) => now - r.timestamp < TTL_MS);
    const cleaned = {
      eudr: prune(stripPdfUrl(parsed.eudr)),
      carbon: prune(stripPdfUrl(parsed.carbon)),
      sentinel: prune(parsed.sentinel),
    };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cleaned));
    return cleaned;
  } catch {
    return emptyCache();
  }
};

const saveCache = (cache) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      eudr: stripPdfUrl(cache.eudr),
      carbon: stripPdfUrl(cache.carbon),
      sentinel: cache.sentinel,
    }));
  } catch {
    // sessionStorage plein/indisponible : on ignore silencieusement
  }
};

export const useReports = ({ files, geojson, userInfo, setStep, propertyType }) => {
  const [reports, setReports] = useState(() => loadCache());
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState({ eudr: false, carbon: false, sentinel: false });

  // ✅ NOUVEAU : rapport EUDR JSON reçu, en attente de la capture heatmap
  // (voir <EudrHiddenCapture> à monter dans le composant parent) avant de
  // pouvoir appeler /guest/eudr-pdf.
  const [pendingEudrCapture, setPendingEudrCapture] = useState(null); // { sourceKey, geojson, data }

  useEffect(() => {
    const interval = setInterval(() => {
      setReports((prev) => {
        const now = Date.now();
        const prune = (list) => list.filter((r) => now - r.timestamp < TTL_MS);
        const cleaned = { eudr: prune(prev.eudr), carbon: prune(prev.carbon), sentinel: prune(prev.sentinel) };
        saveCache(cleaned);
        return cleaned;
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const upsertReport = (key, sourceKey, entryGeojson, data, pdfUrl = null) => {
    setReports((prev) => {
      const now = Date.now();
      const list = prev[key] || [];
      const existing = list.find((r) => r.sourceKey === sourceKey);
      if (existing?.pdfUrl && existing.pdfUrl !== pdfUrl) {
        URL.revokeObjectURL(existing.pdfUrl); // ✅ libère l'ancien blob avant remplacement
      }
      const withoutExisting = list.filter((r) => r.sourceKey !== sourceKey);
      const newEntry = {
        id: existing?.id || `${key}_${sourceKey}_${now}`,
        sourceKey,
        geojson: entryGeojson || null,
        data,
        pdfUrl,
        extra: existing?.extra ?? null, // ✅ préservé — voir setReportExtra()
        timestamp: now,
      };
      const updated = { ...prev, [key]: [...withoutExisting, newEntry] };
      saveCache(updated);
      return updated;
    });
  };

  // ✅ NOUVEAU : complément NDVI (forest) / SOC+crop (farm) au Carbon Report
  // guest — patch isolé de `extra` sans toucher data/pdfUrl (contrairement à
  // upsertReport, qui remplace tout l'entry).
  const setReportExtra = (key, sourceKey, extra) => {
    setReports((prev) => {
      const list = prev[key] || [];
      if (!list.some((r) => r.sourceKey === sourceKey)) return prev; // rapport pas encore créé
      const updated = {
        ...prev,
        [key]: list.map((r) => (r.sourceKey === sourceKey ? { ...r, extra } : r)),
      };
      saveCache(updated);
      return updated;
    });
  };

  // ✅ Appelé par <EudrHiddenCapture onCaptured={...}> une fois la heatmap
  // obtenue (ou après timeout, base64 = null).
  const generateEudrPdf = async (sourceKey, entryGeojson, data, forestMapBase64) => {
    try {
      const res = await axiosInstance.post(
        "/api/gfw/guest/eudr-pdf",
        {
          report: data, forest_map_image: forestMapBase64 || undefined,
          guest_id: localStorage.getItem("guest_id") || sourceKey,
          agent_id: userInfo.agent_id || undefined,
        },
        { responseType: "blob" }
      );
      // ✅ FIX (IDM) : on force le type MIME côté client, indépendamment
      // du Content-Type réseau renvoyé par le backend.
      const pdfBlob = new Blob([res.data], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      upsertReport("eudr", sourceKey, entryGeojson, data, pdfUrl);
    } catch (err) {
      console.error("❌ Erreur génération PDF EUDR :", err.response?.data || err);
      upsertReport("eudr", sourceKey, entryGeojson, data, null); // rapport visible sans PDF
    } finally {
      setPendingEudrCapture(null);
      setLoading(false);
      setStep(5);
    }
  };

  // ✅ NOUVEAU : complément au Carbon Report guest — NDVI/AGB (forest) ou
  // SOC SoilGrids + culture prédite (farm). N'affecte jamais le PDF principal
  // (chiffres GFW inchangés) : erreur ici -> extra reste null, silencieux.
  const fetchCarbonExtra = async (sourceKey, entryGeojson) => {
    if (!propertyType || !entryGeojson) return;
    try {
      const res = await axiosInstance.post("/api/sentinel/guest/carbon-extra", {
        geojson: normalizeGeojson(entryGeojson),
        phone: userInfo.phone,
        property_type: propertyType,
        agent_id: userInfo.agent_id || undefined,
      });
      setReportExtra("carbon", sourceKey, res.data);
    } catch (err) {
      console.error("❌ Erreur complément Carbon (NDVI/SOC) :", err.response?.data || err);
    }
  };

  const generateCarbonPdf = async (sourceKey, entryGeojson, data) => {
    try {
      const res = await axiosInstance.post(
        // ⚠ FIX : ceci pointait vers l'endpoint EUDR et référençait une
        // variable `forestMapBase64` inexistante ici (ReferenceError) — le
        // rapport Carbon guest ne générait donc jamais de vrai PDF, il
        // retombait systématiquement sur le catch ci-dessous.
        "/api/gfw/guest/carbon-pdf",
        {
          report: data,
          guest_id: localStorage.getItem("guest_id") || sourceKey,
          agent_id: userInfo.agent_id || undefined,
        },
        { responseType: "blob" }
      );
      // ✅ FIX (IDM) : on force le type MIME côté client, indépendamment
      // du Content-Type réseau renvoyé par le backend.
      const pdfBlob = new Blob([res.data], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      upsertReport("carbon", sourceKey, entryGeojson, data, pdfUrl);
    } catch (err) {
      console.error("❌ Erreur génération PDF Carbon :", err.response?.data || err);
      upsertReport("carbon", sourceKey, entryGeojson, data, null);
    } finally {
      setLoading(false);
      setStep(5);
    }
    fetchCarbonExtra(sourceKey, entryGeojson); // ✅ en parallèle, n'affecte pas le PDF/le step
  };

  const handleReportReady = async (featureName) => {
    const key = FEATURE_TO_KEY[featureName];
    if (!key) { console.error("❌ Unknown featureName:", featureName); return; }

    // ── NDVI : inchangé ──────────────────────────────────────────────────
    if (featureName === "reportndviguest") {
      if (!geojson) { console.error("❌ Aucun polygone disponible"); return; }
      setLoading(true);
      await wait(2000);
      try {
        const res = await axiosInstance.post("/api/sentinel/guest/sat-index", {
          geojson: normalizeGeojson(geojson),
          phone: userInfo.phone,
          // ✅ FIX : agent_id manquait sur ce rapport — il n'était envoyé que
          // pour EUDR/Carbon (generateEudrPdf/generateCarbonPdf ci-dessus),
          // ce qui excluait les rapports NDVI guest du suivi par agent.
          agent_id: userInfo.agent_id || undefined,
        });
        upsertReport(key, getSourceKey(geojson, null), geojson, res.data);
        setStep(5);
      } catch (err) {
        console.error("❌ Erreur NDVI guest:", err.response?.data || err);
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── EUDR / Carbon : calcul JSON, puis PDF backend ──────────────────────
    let file = files[key] || files.geojson;
    if (!file && geojson) {
      const geojsonBlob = new Blob([JSON.stringify(normalizeGeojson(geojson), null, 2)], { type: 'application/json' });
      file = new File([geojsonBlob], 'drawn-polygon.geojson', { type: 'application/json' });
    }
    if (!file) { console.error("❌ Aucun fichier ou geojson disponible"); return; }

    const sourceKey = getSourceKey(geojson, file);

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
      const data = res.data.report;

      if (featureName === "reporteudrguest") {
        // ⚠️ loading reste true, setStep(5) différé : voir generateEudrPdf,
        // déclenché par <EudrHiddenCapture> une fois la heatmap capturée.
        setPendingEudrCapture({ sourceKey, geojson, data });
      } else {
        await generateCarbonPdf(sourceKey, geojson, data);
      }
    } catch (err) {
      console.error("❌ Erreur lors de la génération du rapport :", err.response?.data || err);
      setLoading(false);
    }
  };

  return {
    reports, loading, showPaymentModal, setShowPaymentModal, handleReportReady,
    pendingEudrCapture, generateEudrPdf, // ✅ à brancher sur <EudrHiddenCapture> dans le parent
  };
};