import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";
import axios from "axios";
import axiosInstance from "../../axiosInstance"; // 🔹 Assure-toi que ce chemin est correct
import { FiInfo } from "react-icons/fi";
import {
  WiThermometer,
  WiThermometerExterior,
  WiHumidity,
  WiStrongWind,
  WiRain,
} from "react-icons/wi";

function Graph() {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [weatherData, setWeatherData] = useState([]);
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [province, setProvince] = useState("");
  const [forecastPeriod, setForecastPeriod] = useState("10"); // 🔹 default 10 days

  // 🔹 Charger la liste des fermes
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

  // 🔹 Quand on sélectionne une ferme
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

  // 🔹 Récupération météo
  const fetchWeatherData = async () => {
    try {
      let url = "";

      if (forecastPeriod === "10") {
        // 10 jours → hourly data regroupée en jours
        url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_1000hPa&forecast_days=10&timezone=auto`;
        const response = await axios.get(url);
        const hourly = response.data.hourly;

        const dailyData = Array.from({ length: 10 }).map((_, i) => {
          const start = i * 24;
          const end = (i + 1) * 24;
          return {
            date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
            temperature:
              hourly.temperature_2m.slice(start, end).reduce((a, b) => a + b, 0) /
              24,
            humidity:
              hourly.relative_humidity_2m
                .slice(start, end)
                .reduce((a, b) => a + b, 0) / 24,
            windSpeed:
              hourly.wind_speed_1000hPa
                .slice(start, end)
                .reduce((a, b) => a + b, 0) / 24,
            precipitation: hourly.precipitation
              .slice(start, end)
              .reduce((a, b) => a + b, 0),
          };
        });

        setWeatherData(dailyData);
      } else {
        // 90 jours (75 passés + 15 prévus)
        url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_mean,relative_humidity_2m_mean,windspeed_10m_max,precipitation_sum&timezone=auto&past_days=75&forecast_days=15`;
        const response = await axios.get(url);
        const daily = response.data.daily;

        const dailyData = daily.time.map((date, i) => ({
          date: new Date(date),
          temperature: daily.temperature_2m_mean[i],
          humidity: daily.relative_humidity_2m_mean[i],
          windSpeed: daily.windspeed_10m_max[i],
          precipitation: daily.precipitation_sum[i],
        }));

        setWeatherData(dailyData);
      }

      console.log("Fetched:", url);
    } catch (error) {
      console.error("Error fetching weather data:", error);
    }
  };

  // 🔹 Localisation Mapbox
  const fetchLocationData = async () => {
    try {
      const mapboxToken =
        "pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q";
      const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}`;
      const response = await axios.get(mapboxUrl);

      const features = response.data.features[0];
      if (features) {
        setCity(features.text);
        setCountry(
          features.context.find((ctx) => ctx.id.includes("country"))?.text || ""
        );
        setProvince(
          features.context.find((ctx) => ctx.id.includes("region"))?.text || ""
        );
      }
    } catch (error) {
      console.error("Error fetching location data:", error);
    }
  };

  const handleSearch = () => {
    fetchWeatherData();
    fetchLocationData();
  };

  // 🔹 Préparer données pour affichage
  const weatherLabels = weatherData.map((item) =>
    item.date.toLocaleDateString("en-US")
  );
  const chartData = {
    labels: weatherLabels,
    datasets: [
      {
        label: "Temperature (°C)",
        data: weatherData.map((i) => i.temperature),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.4,
      },
      {
        label: "Humidity (%)",
        data: weatherData.map((i) => i.humidity),
        borderColor: "rgba(153, 102, 255, 1)",
        backgroundColor: "rgba(153, 102, 255, 0.2)",
        tension: 0.4,
      },
      {
        label: "Wind Speed (km/h)",
        data: weatherData.map((i) => i.windSpeed),
        borderColor: "rgba(255, 206, 86, 1)",
        backgroundColor: "rgba(255, 206, 86, 0.2)",
        tension: 0.4,
      },
      {
        label: "Precipitation (mm)",
        data: weatherData.map((i) => i.precipitation),
        borderColor: "rgba(255, 159, 64, 1)",
        backgroundColor: "rgba(255, 159, 64, 0.2)",
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
    },
  };

  return (
    <div className="bg-white-100 min-h-screen p-6">
      <div className="container mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-green-500">
            Weather History for 90 Days
          </h2>
          <p className="text-sm text-gray-500 mb-2">
            Enter latitude & longitude or select a farm, then choose forecast
            period.
          </p>

          {/* 🔹 Inputs */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
                 {/* 🔹 Farm selection */}
            <div className="flex flex-col">
              <label className="text-gray-700 font-semibold mb-1">
                Select a Farm
              </label>
              <select
                value={selectedFarmId}
                onChange={handleFarmChange}
                className="p-2 border rounded"
              >
                <option value="">-- Choose Farm --</option>
                {farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>
                    {farm.name} - {farm.subcounty}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-gray-700 font-semibold mb-1">Latitude</label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="p-2 border rounded"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-gray-700 font-semibold mb-1">Longitude</label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="p-2 border rounded"
              />
            </div>

       

            {/* 🔹 Forecast period */}
            <div className="flex flex-col">
              <label className="text-gray-700 font-semibold mb-1">
                Forecast Period
              </label>
              <select
                value={forecastPeriod}
                onChange={(e) => setForecastPeriod(e.target.value)}
                className="p-2 border rounded"
              >
                <option value="10">10 Days</option>
                <option value="90">90 Days</option>
              </select>
            </div>

            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 self-center mt-4 md:mt-0"
            >
              Search
            </button>
          </div>

          {/* 🔹 Location info */}
          <div className="mb-6">
            <p className="font-semibold text-gray-700">
              Location: {city}, {province}, {country}
            </p>
          </div>

          {/* 🔹 Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <Line data={chartData} options={options} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Graph;
