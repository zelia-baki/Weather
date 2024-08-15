import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://127.0.0.1:5000', // Remplacez par l'IP et le port de votre serveur
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;
