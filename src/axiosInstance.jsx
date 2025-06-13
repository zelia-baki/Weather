import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://127.0.0.1:5000', // Adresse de ton backend Flask
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur : ajoute le token JWT uniquement s'il existe
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Supprimer l'en-tête Authorization s'il n'y a pas de token
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
