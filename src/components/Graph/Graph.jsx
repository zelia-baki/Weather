import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';
import axios from 'axios';
import { FiInfo } from 'react-icons/fi'; // Importing an info icon

function Graph() {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [weatherData, setWeatherData] = useState([]);
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [province, setProvince] = useState('');

  const fetchWeatherData = async () => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,precipitation,et0_fao_evapotranspiration,shortwave_radiation,wind_speed_1000hPa&forecast_days=10`;
      const response = await axios.get(url);
      console.log(url);

      const hourlyData = response.data.hourly;
      const dailyData = Array.from({ length: 10 }).map((_, i) => ({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        temperature: hourlyData.temperature_2m.slice(i * 24, (i + 1) * 24).reduce((a, b) => a + b, 0) / 24,
        humidity: hourlyData.relative_humidity_2m.slice(i * 24, (i + 1) * 24).reduce((a, b) => a + b, 0) / 24,
        windSpeed: hourlyData.wind_speed_1000hPa.slice(i * 24, (i + 1) * 24).reduce((a, b) => a + b, 0) / 24,
        precipitation: hourlyData.precipitation.slice(i * 24, (i + 1) * 24).reduce((a, b) => a + b, 0),
      }));

      setWeatherData(dailyData);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  };

  const fetchLocationData = async () => {
    try {
      const mapboxToken = 'pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q'; // Replace with your Mapbox API key
      const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}`;
      const response = await axios.get(mapboxUrl);

      const features = response.data.features[0];
      if (features) {
        setCity(features.text); // General place name (e.g., city)
        setCountry(features.context.find((ctx) => ctx.id.includes('country')).text); // Country
        setProvince(features.context.find((ctx) => ctx.id.includes('region')).text); // Province/Region
      }
    } catch (error) {
      console.error('Error fetching location data:', error);
    }
  };

  const handleSearch = () => {
    fetchWeatherData();
    fetchLocationData(); // Fetch location data when searching

  };

  const weatherLabels = weatherData.map((item) => item.date.toLocaleDateString());
  const weatherTemperatures = weatherData.map((item) => item.temperature);
  const weatherHumidities = weatherData.map((item) => item.humidity);
  const weatherWindSpeeds = weatherData.map((item) => item.windSpeed);
  const weatherPrecipitations = weatherData.map((item) => item.precipitation);

  const chartData = {
    labels: weatherLabels,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: weatherTemperatures,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        tension: 0.4,
      },
      {
        label: 'Humidity (%)',
        data: weatherHumidities,
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 2,
        tension: 0.4,
      },
      {
        label: 'Wind Speed (km/h)',
        data: weatherWindSpeeds,
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        borderColor: 'rgba(255, 206, 86, 1)',
        borderWidth: 2,
        tension: 0.4,
      },
      {
        label: 'Precipitation (mm)',
        data: weatherPrecipitations,
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 2,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#333', font: { size: 14 } } },
      tooltip: {
        callbacks: { label: (tooltipItem) => `Value: ${tooltipItem.raw}` },
      },
    },
    scales: {
      x: { ticks: { color: '#333', font: { size: 12 } } },
      y: { ticks: { color: '#333', font: { size: 12 } } },
    },
  };

  return (
    <div className="bg-white-100 min-h-screen p-6">
      <div className="container mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-green-500">10-Day Weather Forecast</h2>
          <p className="text-sm text-gray-500 mb-2">
            Enter the latitude and longitude coordinates to view a 10-day forecast, including temperature, humidity, wind speed, and precipitation.
          </p>

          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="flex flex-col">
              <label className="text-gray-700 font-semibold mb-1">Latitude</label>
              <input
                type="text"
                placeholder="Enter Latitude"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="p-2 border rounded"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-gray-700 font-semibold mb-1">Longitude</label>
              <input
                type="text"
                placeholder="Enter Longitude"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="p-2 border rounded"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 self-center mt-4 md:mt-0"
            >
              Search
            </button>
          </div>
                {/* Display Location */}
                <div className="mb-6">
            <p className="font-semibold text-gray-700">Location: {city}, {province}, {country} </p>
          </div>

          {/* Styled explanatory box for axes */}
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg mb-6 flex items-start gap-2">
            <FiInfo className="text-blue-500 text-xl mt-1" />
            <p className="text-sm">
              <strong>Note:</strong> The horizontal axis (<span className="font-semibold">x-axis</span>) represents the date, while the vertical axis (<span className="font-semibold">y-axis</span>) shows the values for temperature, humidity, wind speed, and precipitation. This will help in analyzing weather trends over the 10-day period.
            </p>
          </div>

          {/* Display the chart */}
          <div className="mt-6">
            <Line data={chartData} options={options} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Graph;
