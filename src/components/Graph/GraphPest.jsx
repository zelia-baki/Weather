import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';

const DegreeDaysPage = () => {
  const [dailyTemperatures, setDailyTemperatures] = useState([]);
  const [dates, setDates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [totalGDD, setTotalGDD] = useState(0);

  const baseTemp = 10;
  const upperThreshold = 31;

  const insectThresholds = [
    { name: 'Fall Armyworm (Spodoptera frugiperda)', gddThreshold: 150, confirmed: false },
    { name: 'Corn Earworm (Helicoverpa zea)', gddThreshold: 220, confirmed: true },
    { name: 'Black Cutworm (Agrotis ipsilon)', gddThreshold: 300, confirmed: true },
    { name: 'Peach Twig Borer (Anarsia lineatella)', gddThreshold: 400, confirmed: true },
    // { name: 'Peach Twig Borer (Anarsia lineatella)', gddThreshold: 51, confirmed: true },

  ];

  const fetchWeatherData = async (lat, lon) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.daily?.temperature_2m_max && data.daily.temperature_2m_min && data.daily.time) {
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

  const calculateDegreeDays = () => {
    return dailyTemperatures.map((temp) => {
      const effectiveMin = temp.min < baseTemp ? baseTemp : temp.min;
      const effectiveMax = temp.max > upperThreshold ? upperThreshold : temp.max;
      const avgTemp = (effectiveMin + effectiveMax) / 2;
      const degreeDay = avgTemp - baseTemp;
      return degreeDay > 0 ? degreeDay : 0;
    });
  };

  useEffect(() => {
    if (dailyTemperatures.length > 0) {
      const gddValues = calculateDegreeDays();
      const total = gddValues.reduce((sum, value) => sum + value, 0);
      setTotalGDD(total);

      const newAlerts = insectThresholds
        .filter((insect) => total >= insect.gddThreshold)
        .map((insect) => `${insect.name} has reached the threshold of ${insect.gddThreshold} GDD.`);
      setAlerts(newAlerts);
    }
  }, [dailyTemperatures]);

  const gdd = calculateDegreeDays();

  const data = {
    labels: dates,
    datasets: [
      {
        label: 'Growing Degree Days (GDD)',
        data: gdd,
        backgroundColor: 'rgba(255, 179, 71, 0.5)', // Orange pastel
        borderColor: 'rgba(255, 179, 71, 1)', // Orange pastel plus intense
        borderWidth: 2,
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
    scales: {
      x: { ticks: { color: '#444' } },
      y: { ticks: { color: '#444' } },
    },
  };

  return (
    <div className="max-w-6xl mx-auto mt-10 px-4">
      {/* Main Title */}
      <h3 className="text-5xl font-bold text-teal-700 mb-10 animate-fade-in-up-zoom">
        Heating, Cooling, and Growing Degree Days
      </h3>

      {/* Sub text */}
      <p className="text-center text-gray-600 mb-8">
        Enter your farm location to monitor pest activity using weather-based tracking.
      </p>

      {/* Input Section */}
      <div className="bg-white border border-green-100 p-6 rounded-2xl shadow-lg mb-10">
        <h4 className="text-xl font-semibold mb-4 text-green-700">📍 Farm Location</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">Latitude</label>
            <input
              type="number"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="e.g., -1.9403"
              className="p-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">Longitude</label>
            <input
              type="number"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="e.g., 29.8739"
              className="p-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Pest Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white-50 border border-yellow-300 text-yellow-800 p-5 rounded-xl shadow mb-8">
          <h4 className="text-lg font-bold mb-3">🐛 Pest Alert(s)</h4>
          {insectThresholds.map((insect, index) => {
            if (totalGDD >= insect.gddThreshold) {
              return (
                <div
                key={index}
                className="flex items-center justify-between bg-white border-l-4 border-amber-400 rounded-xl px-5 py-4 mb-4 shadow-md transition hover:shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🐞</div>
                  <div>
                    <p className="text-base font-semibold text-gray-800">
                      {insect.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Threshold reached at <span className="font-medium text-amber-600">{insect.gddThreshold} GDD</span>
                    </p>
                  </div>
                </div>
              
                {/* {insect.confirmed && (
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full shadow-sm font-medium">
                    ✅ Scientifically Confirmed
                  </span>
                )} */}
              </div>
              
              );
            }
            return null;
          })}
        </div>
      )}

      {/* GDD Chart */}
      <div className="bg-white shadow-xl rounded-2xl p-6">
        <h4 className="text-lg font-semibold text-gray-700 mb-4">
          🌡️ Total GDD Accumulated: {totalGDD.toFixed(2)}
        </h4>
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
