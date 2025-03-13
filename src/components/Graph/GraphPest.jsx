import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';

const DegreeDaysPage = () => {
  // States for storing weather data and parameters
  const [dailyTemperatures, setDailyTemperatures] = useState([]);
  const [dates, setDates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [baseTemp, setBaseTemp] = useState(10); // Base temperature (°C) – default 10°C (≈50°F)
  const [upperThreshold, setUpperThreshold] = useState(31); // Upper threshold (°C) – default 31°C (≈88°F)
  const [alerts, setAlerts] = useState([]);
  const [totalGDD, setTotalGDD] = useState(0);

  // Insect thresholds (adapt these values according to the species and regional context)
  const insectThresholds = [
    { name: 'Fall Armyworm', gddThreshold: 150 },
    { name: 'Desert Locust', gddThreshold: 200 },
    { name: 'Cotton Bollworm', gddThreshold: 300 },
  ];

  // Fetch weather data using the Open-Meteo API
  const fetchWeatherData = async (lat, lon) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (
        data.daily &&
        data.daily.temperature_2m_max &&
        data.daily.temperature_2m_min &&
        data.daily.time
      ) {
        // Build an array associating maximum and minimum temperatures
        const newDailyTemps = data.daily.temperature_2m_max.map((maxTemp, index) => ({
          max: maxTemp,
          min: data.daily.temperature_2m_min[index],
        }));
        setDates(data.daily.time);
        setDailyTemperatures(newDailyTemps);
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (latitude && longitude) {
      fetchWeatherData(latitude, longitude);
    }
  }, [latitude, longitude]);

  // Calculate Degree Days using the modified method:
  // - If the minimum temperature is below the base, use the base instead.
  // - If the maximum temperature exceeds the upper threshold, use the upper threshold.
  const calculateDegreeDays = () => {
    return dailyTemperatures.map((temp) => {
      const effectiveMin = temp.min < baseTemp ? baseTemp : temp.min;
      const effectiveMax = (upperThreshold && temp.max > upperThreshold) ? upperThreshold : temp.max;
      const avgTemp = (effectiveMin + effectiveMax) / 2;
      const degreeDay = avgTemp - baseTemp;
      return degreeDay > 0 ? degreeDay : 0;
    });
  };

  // Calculate total GDD and trigger alerts if thresholds are exceeded
  useEffect(() => {
    if (dailyTemperatures.length > 0) {
      const gddValues = calculateDegreeDays();
      const total = gddValues.reduce((sum, value) => sum + value, 0);
      setTotalGDD(total);
      
      const newAlerts = insectThresholds
        .filter(insect => total >= insect.gddThreshold)
        .map(insect => `${insect.name} has reached the threshold of ${insect.gddThreshold} GDD. Treat now!`);
      setAlerts(newAlerts);
    }
  }, [dailyTemperatures, baseTemp, upperThreshold]);

  const gdd = calculateDegreeDays();

  // Chart configuration
  const data = {
    labels: dates,
    datasets: [
      {
        label: 'Growing Degree Days (GDD)',
        data: gdd,
        backgroundColor: 'rgba(255, 179, 71, 0.5)',
        borderColor: 'rgba(255, 179, 71, 1)',
        borderWidth: 1,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
    scales: {
      x: { ticks: { color: '#333' } },
      y: { ticks: { color: '#333' } },
    },
  };

  return (
    <div className="max-w-6xl mx-auto mt-10 p-4">
      <h3 className="text-5xl font-bold text-teal-700 mb-8">Growing Degree Days (GDD)</h3>
      
      {/* Data Input Section */}
      <div className="bg-gray-100 p-6 rounded-lg shadow-md mb-8">
        <h4 className="text-xl font-semibold mb-4">Enter Your Coordinates and Parameters</h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col">
            <label className="mb-1 font-medium">Latitude</label>
            <input
              type="number"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="e.g., -1.9403"
              className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 font-medium">Longitude</label>
            <input
              type="number"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="e.g., 29.8739"
              className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 font-medium">Base Temperature (°C)</label>
            <input
              type="number"
              value={baseTemp}
              onChange={(e) => setBaseTemp(parseFloat(e.target.value))}
              placeholder="e.g., 10"
              className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 font-medium">Upper Threshold (°C)</label>
            <input
              type="number"
              value={upperThreshold}
              onChange={(e) => setUpperThreshold(parseFloat(e.target.value))}
              placeholder="e.g., 31"
              className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>
      
      {/* Insect Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-red-100 text-red-700 p-4 mb-8 rounded shadow-md">
          <h4 className="font-bold mb-2">Insect Alerts</h4>
          {alerts.map((alert, index) => (
            <p key={index}>{alert}</p>
          ))}
        </div>
      )}
      
      {/* Display Total GDD and Chart */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-700 mb-4">Total GDD: {totalGDD.toFixed(2)}</h4>
        {isLoading ? (
          <p className="text-gray-500">Loading data...</p>
        ) : (
          <Bar data={data} options={options} />
        )}
      </div>
    </div>
  );
};

export default DegreeDaysPage;
