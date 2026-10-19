import axiosInstance from "../axiosInstance";

// =============================================================================
//  PDF conservés côté serveur (voir app/utils/stored_reports.py du backend).
//  Chaque PDF généré renvoie un en-tête X-Report-Token ; on le garde ici par
//  rapport (ex. "eudr-farm-WAK0001") pour ré-afficher le même PDF après un
//  rechargement, sans le régénérer. Durée alignée sur le backend (7 jours).
// =============================================================================

export const REPORT_TTL_DAYS = 7;
const TTL_MS = REPORT_TTL_DAYS * 24 * 60 * 60 * 1000;
const STORAGE_KEY = "stored_report_tokens";

const readAll = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
};

const writeAll = (all) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // localStorage plein/indisponible : le PDF sera simplement régénéré
  }
};

export const getReportToken = (key) => {
  const entry = readAll()[key];
  return entry && Date.now() - entry.savedAt < TTL_MS ? entry.token : null;
};

export const saveReportToken = (key, token) => {
  if (!key || !token) return;
  const now = Date.now();
  const all = Object.fromEntries(
    Object.entries(readAll()).filter(([, e]) => now - e.savedAt < TTL_MS)
  );
  all[key] = { token, savedAt: now };
  writeAll(all);
};

export const forgetReportToken = (key) => {
  const all = readAll();
  delete all[key];
  writeAll(all);
};

// Réponse axios (blob) du PDF conservé ; rejette si expiré (410), invalide (404)
// ou appartenant à un autre compte (403).
export const fetchStoredReport = (token) =>
  axiosInstance.get(`/api/gfw/stored-report/${token}`, { responseType: "blob" });
