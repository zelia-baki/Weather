import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import axiosInstance from "../../axiosInstance";
import axios from "axios"; // Import pour la requête Mapbox
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const DegreeDaysLineChart = () => {
  const [dailyTemps, setDailyTemps] = useState([]);
  const [dates, setDates] = useState([]);
  const [hdd, setHdd] = useState([]);
  const [cdd, setCdd] = useState([]);
  const [gdd, setGdd] = useState([]);
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [cumulativeGDD, setCumulativeGDD] = useState([]);
  const [isPlantingFavorable, setIsPlantingFavorable] = useState(false);
  const [favorableDate, setFavorableDate] = useState("");
  const [crop, setCrop] = useState("");
  const [crops, setCrops] = useState([]);

  // États pour les fermes et la localisation
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [country, setCountry] = useState("");

  // Seuils de GDD pour chaque culture
  const cropThresholds = {
    corn: 100,
    wheat: 150,
    soybeans: 120,
    cocoa: 200,
    coffee_robusta: 180,
    coffee_arabica: 170,
    oil_palm: 250,
    soya_bean: 120,
    rubber: 300,
    hass_avocado: 220,
    snickerdoodle: 10,
    test: 50,
    liter: 1000,
  };

  // Récupération dynamique des cultures
  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const response = await axiosInstance.get("/api/crop/");
        setCrops(response.data.crops);
      } catch (err) {
        console.error("Error fetching crops:", err);
      }
    };
    fetchCrops();
  }, []);

  // Récupération dynamique des fermes
  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const { data } = await axiosInstance.get("/api/farm/all");
        setFarms(data.farms || []);
      } catch (error) {
        console.error("Error fetching farms:", error);
      }
    };
    fetchFarms();
  }, []);

  // Gestion de la sélection d'une ferme
  const handleFarmChange = async (e) => {
    const farmId = e.target.value;
    setSelectedFarmId(farmId);
    if (farmId) {
      try {
        const response = await axiosInstance.get(`/api/farm/${farmId}`);
        if (response.data.status === "success") {
          const geolocation = response.data.data.geolocation;
          if (geolocation && geolocation.includes(",")) {
            const [lon, lat] = geolocation.split(",");
            setLatitude(parseFloat(lat));
            setLongitude(parseFloat(lon));
          }
        }
      } catch (error) {
        console.error("Error fetching farm properties:", error);
      }
    }
  };

  // Récupération des données météo depuis l'API Open-Meteo
  const fetchWeatherData = async (lat, lon) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto&past_days=30`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.daily) {
        const { temperature_2m_max: maxTemps, temperature_2m_min: minTemps, time } = data.daily;
        setDates(time);

        const baseTempHDD_CDD = 18;
        const thresholdGDD = 10;

        const temps = maxTemps.map((max, i) => ({
          max,
          min: minTemps[i],
          avg: (max + minTemps[i]) / 2,
        }));

        setDailyTemps(temps);

        // Calcul des HDD, CDD et GDD
        const hddValues = temps.map((temp) =>
          Math.max(0, baseTempHDD_CDD - temp.avg)
        );
        const cddValues = temps.map((temp) =>
          Math.max(0, temp.avg - baseTempHDD_CDD)
        );
        const gddValues = temps.map((temp) =>
          Math.max(0, temp.avg - thresholdGDD)
        );

        setHdd(hddValues);
        setCdd(cddValues);
        setGdd(gddValues);

        // Calcul cumulatif des GDD
        const cumulativeGDDValues = gddValues.reduce((acc, curr) => {
          acc.push((acc.length > 0 ? acc[acc.length - 1] : 0) + curr);
          return acc;
        }, []);
        setCumulativeGDD(cumulativeGDDValues);

        // Vérification des conditions de plantation
        if (crop && cropThresholds[crop]) {
          const threshold = cropThresholds[crop];
          const favorableIndex = cumulativeGDDValues.findIndex(
            (value) => value >= threshold
          );
          if (favorableIndex !== -1) {
            setIsPlantingFavorable(true);
            setFavorableDate(time[favorableIndex]);
          } else {
            setIsPlantingFavorable(false);
            setFavorableDate("");
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des données météorologiques:", error);
    }
  };

  // Récupération des données de localisation via l'API Mapbox
  const fetchLocationData = async () => {
    try {
      const mapboxToken = 'pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q';
      const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}`;
      const response = await axios.get(mapboxUrl);
      
      const feature = response.data.features[0];
      if (feature) {
        setCity(feature.text || "");
        if (feature.context && feature.context.length > 0) {
          const countryCtx = feature.context.find((ctx) => ctx.id.includes("country"));
          const regionCtx = feature.context.find((ctx) => ctx.id.includes("region"));
          setCountry(countryCtx ? countryCtx.text : "");
          setProvince(regionCtx ? regionCtx.text : "");
        }
      }
    } catch (error) {
      console.error("Error fetching location data:", error);
    }
  };

  // Lancer le fetch des données météo et de localisation dès que latitude ou longitude change
  useEffect(() => {
    if (latitude && longitude) {
      fetchWeatherData(latitude, longitude);
      fetchLocationData();
    }
  }, [latitude, longitude]);

  // Mettre à jour les conditions de plantation lorsque la culture change
  useEffect(() => {
    if (crop && cumulativeGDD.length > 0) {
      const threshold = cropThresholds[crop];
      const favorableIndex = cumulativeGDD.findIndex((value) => value >= threshold);
      if (favorableIndex !== -1) {
        setIsPlantingFavorable(true);
        setFavorableDate(dates[favorableIndex]);
      } else {
        setIsPlantingFavorable(false);
        setFavorableDate("");
      }
    }
  }, [crop, cumulativeGDD, dates]);

  // Données pour le graphique
  const data = {
    labels: dates,
    datasets: [
      {
        label: "HDD (Heating Degree Days)",
        data: hdd,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: "CDD (Cooling Degree Days)",
        data: cdd,
        borderColor: "rgba(153, 102, 255, 1)",
        backgroundColor: "rgba(153, 102, 255, 0.2)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: "GDD (Growing Degree Days)",
        data: gdd,
        borderColor: "rgba(255, 159, 64, 1)",
        backgroundColor: "rgba(255, 159, 64, 0.2)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Options du graphique
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Dates",
        },
      },
      y: {
        title: {
          display: true,
          text: "Degree Days",
        },
      },
    },
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-2xl font-bold text-center mb-6">
        HDD, CDD, GDD over 30 Days
      </h1>
      <div className="mb-4 flex flex-wrap items-center">
        {/* Sélection de la ferme */}
        <select
          value={selectedFarmId}
          onChange={handleFarmChange}
          className="p-2 border rounded mr-2"
        >
          <option value="">Select a farm</option>
          {farms.map((farm) => (
            <option key={farm.id} value={farm.id}>
              {farm.name} - {farm.subcounty}
            </option>
          ))}
        </select>
        {/* Saisie manuelle des coordonnées (optionnel) */}
        <input
          type="number"
          placeholder="Latitude"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          className="p-2 border rounded mr-2"
        />
        <input
          type="number"
          placeholder="Longitude"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          className="p-2 border rounded"
        />
        {/* Sélection de la culture */}
        <select
          value={crop}
          onChange={(e) => setCrop(e.target.value)}
          className="p-2 border rounded ml-2"
        >
          <option value="">Select a crop</option>
          {crops.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-6">
        <p className="font-semibold text-gray-700">
          Location: {city}, {province}, {country}
        </p>
      </div>
      <Line data={data} options={options} />
      {crop && (
        <div className="mt-4 text-center">
          <p className="text-lg font-medium">
            Cumulative GDD: {cumulativeGDD[cumulativeGDD.length - 1] || 0}
          </p>
          {isPlantingFavorable ? (
            <p className="text-lg font-medium">
              Conditions are favorable for planting {crop} starting from{" "}
              <strong>{favorableDate}</strong>.
            </p>
          ) : (
            <p className="text-lg font-medium">
              Conditions are not yet favorable for planting {crop}.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DegreeDaysLineChart;
