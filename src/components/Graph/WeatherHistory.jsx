import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import axiosInstance from "../../axiosInstance";
import axios from "axios";

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

const WeatherHistory = () => {
  const [dailyTemps, setDailyTemps] = useState([]);
  const [dates, setDates] = useState([]);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [country, setCountry] = useState("");

  // 🔹 Fetch farms from DB
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

  // 🔹 When selecting a farm
  const handleFarmChange = async (e) => {
    const farmId = e.target.value;
    setSelectedFarmId(farmId);
    if (farmId) {
      try {
        const response = await axiosInstance.get(`/api/farm/${farmId}`);
        if (response.data.status === "success") {
          const geolocation = response.data.data.geolocation;
          if (geolocation && geolocation.includes(",")) {
            const [lat, lon] = geolocation.split(",");
            setLatitude(parseFloat(lat));
            setLongitude(parseFloat(lon));
          }
        }
      } catch (error) {
        console.error("Error fetching farm details:", error);
      }
    }
  };

  // 🔹 Fetch weather data (75 past + 15 forecast)
  const fetchWeatherData = async (lat, lon) => {
    try {
      // Past 75 days
      const pastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto&past_days=75`;
      const pastResponse = await fetch(pastUrl);
      const pastData = await pastResponse.json();

      // Next 15 days forecast
      const futureUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=15`;
      const futureResponse = await fetch(futureUrl);
      const futureData = await futureResponse.json();

      if (pastData.daily && futureData.daily) {
        const time = [...pastData.daily.time, ...futureData.daily.time];
        const maxTemps = [
          ...pastData.daily.temperature_2m_max,
          ...futureData.daily.temperature_2m_max,
        ];
        const minTemps = [
          ...pastData.daily.temperature_2m_min,
          ...futureData.daily.temperature_2m_min,
        ];

        setDates(time);
        setDailyTemps(
          maxTemps.map((max, i) => ({
            date: time[i],
            min: minTemps[i],
            max,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching weather data:", error);
    }
  };

  // 🔹 Fetch location name (reverse geocoding with Mapbox)
  const fetchLocationData = async () => {
    try {
      const mapboxToken =
        "pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q";
      const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}`;
      const response = await axios.get(mapboxUrl);

      const feature = response.data.features[0];
      if (feature) {
        setCity(feature.text || "");
        if (feature.context && feature.context.length > 0) {
          const countryCtx = feature.context.find((ctx) =>
            ctx.id.includes("country")
          );
          const regionCtx = feature.context.find((ctx) =>
            ctx.id.includes("region")
          );
          setCountry(countryCtx ? countryCtx.text : "");
          setProvince(regionCtx ? regionCtx.text : "");
        }
      }
    } catch (error) {
      console.error("Error fetching location data:", error);
    }
  };

  // 🔹 Trigger weather + location fetch
  useEffect(() => {
    if (latitude && longitude) {
      fetchWeatherData(latitude, longitude);
      fetchLocationData();
    }
  }, [latitude, longitude]);

  // 🔹 Chart data
  const data = {
    labels: dates,
    datasets: [
      {
        label: "Max Temperature (°C)",
        data: dailyTemps.map((d) => d.max),
        borderColor: "rgba(153, 102, 255, 1)",
        backgroundColor: "rgba(153, 102, 255, 0.2)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: "Min Temperature (°C)",
        data: dailyTemps.map((d) => d.min),
        borderColor: "rgba(255, 159, 64, 1)",
        backgroundColor: "rgba(255, 159, 64, 0.2)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // 🔹 Chart options with forecast zone highlight
  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: {
        title: { display: true, text: "Dates" },
        ticks: { maxRotation: 90, minRotation: 45 },
      },
      y: {
        title: { display: true, text: "Temperature (°C)" },
      },
    },
  };

  return (
    <div className="max-w-5xl mx-auto mt-8">
      <h1 className="text-2xl font-bold text-center mb-6">
        Weather History & Forecast (90 days)
      </h1>

      {/* Farm selection or manual coords */}
      <div className="mb-4 flex flex-wrap items-center">
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
      </div>

      {/* Location info */}
      <div className="mb-6">
        <p className="font-semibold text-gray-700">
          Location: {city}, {province}, {country}
        </p>
      </div>

      {/* Chart */}
      <Line data={data} options={options} />
    </div>
  );
};

export default WeatherHistory;
