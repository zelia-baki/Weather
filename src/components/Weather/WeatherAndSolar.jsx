import React, { useState } from 'react';
import axiosInstance from '../../axiosInstance'; // Ensure this points to your axios instance file

const WeatherAndSolar = () => {
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [solarData, setSolarData] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingSolar, setLoadingSolar] = useState(false);

  const handleWeatherSubmit = async (e) => {
    e.preventDefault();
    setLoadingWeather(true);
    try {
      const response = await axiosInstance.get('/getWeather', {
        params: {
          lat: lat || '0.358261',  // Default lat if empty
          lon: lon || '32.654738',  // Default lon if empty
          start,
          end
        }
      });
      setWeatherData(response.data.response);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    } finally {
      setLoadingWeather(false);
    }
  };

  const handleSolarSubmit = async (e) => {
    e.preventDefault();
    setLoadingSolar(true);
    try {
      const response = await axiosInstance.get('/getSolar', {
        params: {
          lat: lat || '0.358261',
          lon: lon || '32.654738',
          start,
          end
        }
      });
      setSolarData(response.data.response);
    } catch (error) {
      console.error('Error fetching solar data:', error);
    } finally {
      setLoadingSolar(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Weather and Solar Data</h1>

      <form className="mb-6 space-y-4">
        <div>
          <label className="block font-semibold">Latitude</label>
          <input
            type="text"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="Enter latitude"
            className="border px-4 py-2 rounded w-full"
          />
        </div>
        <div>
          <label className="block font-semibold">Longitude</label>
          <input
            type="text"
            value={lon}
            onChange={(e) => setLon(e.target.value)}
            placeholder="Enter longitude"
            className="border px-4 py-2 rounded w-full"
          />
        </div>
        <div>
          <label className="block font-semibold">Start Date</label>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="border px-4 py-2 rounded w-full"
          />
        </div>
        <div>
          <label className="block font-semibold">End Date</label>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="border px-4 py-2 rounded w-full"
          />
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleWeatherSubmit}
            className="bg-blue-500 text-white px-4 py-2 rounded"
            disabled={loadingWeather}
          >
            {loadingWeather ? 'Loading Weather...' : 'Get Weather Data'}
          </button>

          <button
            onClick={handleSolarSubmit}
            className="bg-yellow-500 text-white px-4 py-2 rounded"
            disabled={loadingSolar}
          >
            {loadingSolar ? 'Loading Solar...' : 'Get Solar Data'}
          </button>
        </div>
      </form>

      {weatherData && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Weather Data:</h2>
          <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(weatherData, null, 2)}</pre>
        </div>
      )}

      {solarData && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Solar Data:</h2>
          <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(solarData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default WeatherAndSolar;
