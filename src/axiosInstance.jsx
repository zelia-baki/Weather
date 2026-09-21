import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "/", // ⚡ passe par le proxy Vite
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
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
  (response) => response,
  (error) => {
    if (isTokenRejected(error)) {
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
