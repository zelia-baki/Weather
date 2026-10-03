import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "/", // ⚡ passe par le proxy Vite
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Transport binaire anti-IDM/XDM ────────────────────────────────────────
// Les gestionnaires de téléchargement capturent toute réponse binaire (PDF…),
// même en XHR, et le front reçoit un fichier vide ("Échec de chargement du
// document PDF"). Pour chaque requête `responseType: "blob"`, on demande au
// backend de renvoyer le fichier en base64 dans du JSON (cf.
// register_binary_transport côté Flask), puis on reconstruit le Blob ici :
// les composants continuent de recevoir `res.data` comme un Blob, sans changement.
const BINARY_HEADER = "X-Binary-Transport";

const base64ToBlob = (b64, mimetype) => {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mimetype || "application/octet-stream" });
};

// Remet res.data sous forme de Blob (comme avec responseType "blob") :
// fichier décodé, ou JSON (erreur, message) re-sérialisé pour que le code
// existant qui fait `await res.data.text()` continue de fonctionner.
const restoreBlob = (response) => {
  if (!response?.config?.__binaryTransport) return response;
  const data = response.data;
  if (data && data.__binary__ === true && typeof data.data === "string") {
    response.data = base64ToBlob(data.data, data.mimetype);
    if (data.filename) response.filename = data.filename;
    response.headers = { ...response.headers, "content-type": data.mimetype };
  } else if (!(data instanceof Blob)) {
    const text = typeof data === "string" ? data : JSON.stringify(data ?? {});
    response.data = new Blob([text], { type: "application/json" });
  }
  return response;
};

axiosInstance.interceptors.request.use(
  (config) => {
    if (config.responseType === "blob") {
      config.responseType = "json";
      config.__binaryTransport = true;
      config.headers[BINARY_HEADER] = "base64";
    }
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Flask-JWT-Extended répond 401 (token expiré) ou 422 (token invalide, ex. signé par
// un autre serveur) avec {"msg": ...}. On ne réagit que si la requête portait un token,
// et jamais pour /api/login, pour ne pas déconnecter à tort ni casser les pages invités.
export const isTokenRejected = (error) => {
  const status = error?.response?.status;
  if (status !== 401 && status !== 422) return false;
  if ((error.config?.url || "").includes("/api/login")) return false;
  if (!error.config?.headers?.Authorization) return false;
  return typeof error.response?.data?.msg === "string";
};

let redirecting = false;

axiosInstance.interceptors.response.use(
  (response) => restoreBlob(response),
  (error) => {
    // isTokenRejected lit error.response.data.msg : on teste avant de
    // reconvertir le corps en Blob.
    const rejected = isTokenRejected(error);
    if (error?.response) restoreBlob(error.response);
    if (rejected) {
      localStorage.removeItem("token");
      if (!redirecting && window.location.pathname !== "/login") {
        redirecting = true;
        window.location.assign("/login?session=expired");
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
