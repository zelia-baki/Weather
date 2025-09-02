// MapboxExample.jsx
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { FiMapPin } from 'react-icons/fi';
import axiosInstance from '../../axiosInstance.jsx';

import { WiDaySunny, WiHumidity, WiRain, WiWindy, WiCloud, WiSolarEclipse } from 'react-icons/wi';
import DailyChart from '../Graph/DailyGraph.jsx';

const MapboxExample = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);

  const [notification, setNotification] = useState(null);
  const [placeName, setPlaceName] = useState('');
  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [precipitation, setPrecipitation] = useState(null);
  const [et0, setEt0] = useState(null);
  const [etC, setEtC] = useState(null); // ETc in mm/day
  const [shortwaveRadiation, setShortwaveRadiation] = useState(null);
  const [windSpeed1000hPa, setWindSpeed1000hPa] = useState(null);
  const [hourlyWeatherData, setHourlyWeatherData] = useState({ temperature: [], humidity: [], precipitation: [] });
  const [cropsList, setCropsList] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState("");
  const [kcVal, setKcVal] = useState(null);
  const [error, setError] = useState("");
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  // New state: User-specified land surface area (in m²)
  const [landSurface, setLandSurface] = useState('');

  // Default Kc value if none is provided by the crop
  const defaultKc = 1.2;
  let calculatedEtC = 0;

  // Function to interpret precipitation
  const interpret_precipitation = (mm) => {
    if (mm < 1) {
      return "No rain expected; manual or irrigation watering may be necessary for your crops.";
    } else if (mm >= 1 && mm <= 2) {
      return "Light rain expected, providing minimal moisture, which might not meet crop needs.";
    } else if (mm >= 3 && mm <= 10) {
      return "Moderate rain expected, ideal for maintaining soil moisture and supporting crop growth.";
    } else if (mm >= 11 && mm <= 20) {
      return "Abundant rain expected, offering favorable conditions for crops sensitive to moisture.";
    } else if (mm >= 21 && mm <= 50) {
      return "Heavy rain expected, beneficial for crops, but monitor drainage to prevent waterlogging.";
    } else {
      return "Torrential rain expected, with a risk of flooding that may damage crops. Preventive measures are advised.";
    }
  };

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
            const [lat, lon] = geolocation.split(",");
            setLatitude(parseFloat(lat));
            setLongitude(parseFloat(lon));
          }
        }
      } catch (error) {
        console.error("Error fetching farm properties:", error);
      }
    }
  };

  
  const fetchCropsList = async () => {
    try {
      const response = await axiosInstance.get('/api/crop/');
      setCropsList(response.data.crops);
    } catch (error) {
      console.error("Error fetching crops list:", error);
    }
  };

  const fetchKc = async () => {
    try {
      const response = await axiosInstance.get(`/api/kc/getbycrop/${selectedCrop}`);
      console.log(response.data.kc_value[0].kc_value);
      setKcVal(response.data.kc_value[0].kc_value);
    } catch (error) {
      console.error('Error fetching kc value:', error);
    }
  };

  // Calculate ETc in mm/day using ET₀ and Kc of the selected crop
  const calculateETc = (et0Value, kc) => {
    if (et0Value === null) return null;
    return et0Value * kc;
  };

  useEffect(() => {
    if (selectedCrop) {
      fetchKc();
    }
    const currentKc = kcVal || defaultKc;
    if (kcVal && et0) {
      calculatedEtC = calculateETc(et0, kcVal);
      setEtC(calculatedEtC);
    }
  }, [selectedCrop, kcVal, et0]);

  useEffect(() => {
    fetchCropsList();
  }, []);

  const handleCropSelect = (e) => {
    console.log("Selected crop ID:", e.target.value);
    setSelectedCrop(e.target.value);
  };

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q';

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/satellite-v9",
      center: [-79.4512, 43.6568],
      zoom: 8,
    });

    const coordinatesGeocoder = (query) => {
      const matches = query.match(
        /^[ ]*(?:Lat: )?(-?\d+\.?\d*)[, ]+(?:Lng: )?(-?\d+\.?\d*)[ ]*$/i
      );
      if (!matches) {
        return null;
      }
      const coord1 = Number(matches[1]);
      const coord2 = Number(matches[2]);
      if (coord1 < -90 || coord1 > 90 || coord2 < -180 || coord2 > 180) {
        return null;
      }
      return [
        {
          center: [coord2, coord1],
          geometry: {
            type: 'Point',
            coordinates: [coord2, coord1],
          },
          place_name: `Lat: ${coord1}, Lng: ${coord2}`,
          place_type: ['coordinate'],
          properties: {},
          type: 'Feature',
        },
      ];
    };

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      placeholder: 'Search for places...',
      localGeocoder: coordinatesGeocoder,
    });

    mapRef.current.addControl(geocoder);

    geocoder.on('result', async (e) => {
      const { place_name, geometry } = e.result;
      setPlaceName(place_name);
      setNotification({
        type: 'success',
        message: `Location found: ${place_name}`,
      });

      mapRef.current.flyTo({ center: geometry.coordinates, zoom: 15 });
      const latitude = geometry.coordinates[1];
      const longitude = geometry.coordinates[0];
      const weatherData = await fetchWeatherData(latitude, longitude);
      setTemperature(weatherData.temperature);
      setHumidity(weatherData.humidity);
      setPrecipitation(weatherData.precipitation);
      setEt0(weatherData.et0_fao_evapotranspiration);
      setShortwaveRadiation(weatherData.shortwave_radiation);
      setWindSpeed1000hPa(weatherData.windSpeed1000hPa);
      setHourlyWeatherData({
        temperature: weatherData.temperatureHourly,
        humidity: weatherData.humidityHourly,
        precipitation: weatherData.precipitationHourly,
      });
      // ETc is calculated in the useEffect above
    });

    // Function to fetch weather data
    const fetchWeatherData = async (latitude, longitude) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,precipitation,et0_fao_evapotranspiration,shortwave_radiation,wind_speed_1000hPa`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        const currentHour = new Date().toISOString().slice(0, 13) + ':00';
        const temperatureIndex = data.hourly.time.indexOf(currentHour);
        const temperature = temperatureIndex !== -1 ? data.hourly.temperature_2m[temperatureIndex] : null;
        const humidity = temperatureIndex !== -1 ? data.hourly.relative_humidity_2m[temperatureIndex] : null;
        const precipitation = temperatureIndex !== -1 ? data.hourly.precipitation[temperatureIndex] : null;
        const et0_fao_evapotranspiration = temperatureIndex !== -1 ? data.hourly.et0_fao_evapotranspiration[temperatureIndex] : null;
        const shortwave_radiation = temperatureIndex !== -1 ? data.hourly.shortwave_radiation[temperatureIndex] : null;
        const windSpeed1000hPa = temperatureIndex !== -1 ? data.hourly.wind_speed_1000hPa[temperatureIndex] : null;

        const temperatureHourly = data.hourly.temperature_2m;
        const humidityHourly = data.hourly.relative_humidity_2m;
        const precipitationHourly = data.hourly.precipitation;

        return {
          temperature,
          humidity,
          precipitation,
          et0_fao_evapotranspiration,
          shortwave_radiation,
          windSpeed1000hPa,
          temperatureHourly,
          humidityHourly,
          precipitationHourly,
        };
      } catch (error) {
        console.error('Failed to fetch weather data:', error);
        return {
          temperature: null,
          humidity: null,
          precipitation: null,
          et0_fao_evapotranspiration: null,
          shortwave_radiation: null,
          windSpeed1000hPa: null,
          temperatureHourly: [],
          humidityHourly: [],
          precipitationHourly: [],
        };
      }
    };

    mapRef.current.on('click', async (event) => {
      const { lng, lat } = event.lngLat;
      try {
        const reverseGeocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`;
        const response = await fetch(reverseGeocodeUrl);
        const data = await response.json();

        const city = data.features[0]?.place_name || 'Unknown location';
        setPlaceName(city);

        const weatherData = await fetchWeatherData(lat, lng);
        setTemperature(weatherData.temperature);
        setHumidity(weatherData.humidity);
        setPrecipitation(weatherData.precipitation);
        setEt0(weatherData.et0_fao_evapotranspiration);
        setShortwaveRadiation(weatherData.shortwave_radiation);
        setWindSpeed1000hPa(weatherData.windSpeed1000hPa);

        if (popupRef.current) {
          popupRef.current.remove();
        }

        popupRef.current = new mapboxgl.Popup()
          .setLngLat([lng, lat])
          .setHTML(
            `<p><strong>Coordinates:</strong></p>
             <p>Lng: ${lng.toFixed(4)}, Lat: ${lat.toFixed(4)}</p>
             <p><strong>City:</strong> ${city}</p>
             <p><strong>Temperature:</strong> ${weatherData.temperature !== null ? `${weatherData.temperature}°C` : 'N/A'}</p>
             <p><strong>Humidity:</strong> ${weatherData.humidity !== null ? `${weatherData.humidity}%` : 'N/A'}</p>
             <p><strong>Precipitation:</strong> ${weatherData.precipitation !== null ? `${weatherData.precipitation} mm` : 'N/A'}</p>
             <p><strong>~</strong> ${weatherData.precipitation !== null ? `${interpret_precipitation(weatherData.precipitation)}` : 'N/A'}</p>
             <p><strong>Shortwave Radiation:</strong> ${weatherData.shortwave_radiation !== null ? `${weatherData.shortwave_radiation} W/m²` : 'N/A'}</p>
             <p><strong>Wind Speed (1000hPa):</strong> ${weatherData.windSpeed1000hPa !== null ? `${weatherData.windSpeed1000hPa} m/s` : 'N/A'}</p>`
          )
          .addTo(mapRef.current);
      } catch (error) {
        console.error('Error fetching data or creating popup:', error);
        setNotification({ type: 'error', message: 'Failed to fetch weather data.' });
      }
    });

    return () => {
      mapRef.current.remove();
    };
  }, []);

  return (
    <div className="relative h-full">
      {notification && (
        <div
          className={`absolute top-20 right-2 z-10 px-4 py-2 rounded-md shadow-lg ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
        >
          {notification.message}
        </div>
      )}
  <p className="text-xl text-gray-600 italic">Explore real-time weather data and forecasts for any location.</p>

      <div className="relative h-[600px]">
        <div ref={mapContainerRef} className="w-full h-full"></div>
      </div>

      <div className="flex flex-col md:flex-row md:space-x-4 mt-8">
        {/* Weather Info */}
        <div className="relative w-full md:w-1/3 bg-white p-6 rounded-lg shadow-lg transition-all hover:shadow-xl hover:bg-white-50">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
            <WiDaySunny className="mr-2 text-yellow-500" size={24} />
            Weather Information
          </h3>
          <div className="space-y-6 bg-white p-6 rounded-lg shadow-md">
            {/* Location */}
            <div className="flex items-center text-gray-700 space-x-2">
              <FiMapPin className="text-red-500" size={24} />
              <span className="font-semibold text-lg">Location:</span>
              <span className="text-gray-600">{placeName}</span>
            </div>

            {/* Weather Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center text-gray-700 space-x-2">
                <WiDaySunny className="text-orange-400" size={24} />
                <span className="font-semibold">Temperature:</span>
                <span>{temperature !== null ? `${temperature}°C` : 'N/A'}</span>
              </div>
              <div className="flex items-center text-gray-700 space-x-2">
                <WiHumidity className="text-blue-500" size={24} />
                <span className="font-semibold">Humidity:</span>
                <span>{humidity !== null ? `${humidity}%` : 'N/A'}</span>
              </div>
              <div className="flex items-center text-gray-700 space-x-2">
                <WiRain className="text-blue-500" size={24} />
                <span className="font-semibold">Precipitation:</span>
                <span>{precipitation !== null ? `${precipitation} mm` : 'N/A'}</span>
              </div>
              <div className="flex items-center text-gray-700 space-x-2">
                <WiCloud className="text-gray-500" size={24} />
                <span className="font-semibold">ET₀:</span>
                <span>{et0 !== null ? `${et0} mm/day` : 'N/A'}</span>
              </div>
              <div className="flex items-center text-gray-700 space-x-2">
                <WiSolarEclipse className="text-yellow-600" size={24} />
                <span className="font-semibold">Shortwave Radiation:</span>
                <span>{shortwaveRadiation !== null ? `${shortwaveRadiation} W/m²` : 'N/A'}</span>
              </div>
              <div className="flex items-center text-gray-700 space-x-2">
                <WiWindy className="text-green-500" size={24} />
                <span className="font-semibold">Wind Speed:</span>
                <span>{windSpeed1000hPa !== null ? `${windSpeed1000hPa} m/s` : 'N/A'}</span>
              </div>
            </div>

            {/* Crop Selector and ETc Calculation */}
            <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
              <p className="text-sm text-gray-600">
                Please select a crop and enter your land surface area to calculate ETc.
              </p>
              <select
                name="crop_id"
                onChange={handleCropSelect}
                required
                className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              >
                <option value="">Select a crop</option>
                {cropsList.map((crop) => (
                  <option key={crop.id} value={crop.id}>{crop.name}</option>
                ))}
              </select>
              <div>
                <label className="font-medium text-gray-700">Land Surface (sqm):</label>
                <input
                  type="number"
                  value={landSurface}
                  onChange={(e) => setLandSurface(e.target.value)}
                  className="w-full p-3 border rounded-lg shadow-sm mt-2 focus:outline-none focus:ring-2 focus:ring-green-300"
                  placeholder="Enter your land surface area in sqm"
                />
              </div>

              {selectedCrop && etC !== null && landSurface > 0 && (
                <div className="p-3 mt-4 bg-green-50 border-l-4 border-green-400 rounded-md">
                  <div className="flex items-center text-gray-700">
                    <WiCloud className="text-gray-500 mr-2" size={24} />
                    <span className="font-semibold">ETc (mm/day):</span>
                    <span className="ml-2">{etC} mm/day</span>
                  </div>
                  <div className="flex items-center text-gray-700 mt-2">
                    <WiCloud className="text-gray-500 mr-2" size={24} />
                    <span className="font-semibold">ETc (litres/day):</span>
                    <span className="ml-2">{etC * parseFloat(landSurface)} litres/day</span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Chart */}
        <div className="w-full md:w-2/3 bg-white p-4 rounded-md shadow-lg">
          <DailyChart
            temperature={hourlyWeatherData.temperature}
            humidity={hourlyWeatherData.humidity}
            precipitation={hourlyWeatherData.precipitation}
          />
        </div>
      </div>
    </div>
  );
};

export default MapboxExample;
