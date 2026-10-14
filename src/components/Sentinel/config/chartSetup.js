import mapboxgl from "mapbox-gl";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Filler, Tooltip, Legend, LineController, BarController,
} from "chart.js";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// Contrôleurs explicites : les graphiques mixtes (barres + ligne) en ont besoin.
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Filler, Tooltip, Legend, LineController, BarController);

export default mapboxgl;