// MapboxExample.jsx
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { FiMapPin } from 'react-icons/fi'; // Added map pin icon for location
import axiosInstance from '../../axiosInstance.jsx';


import { WiDaySunny, WiHumidity, WiRain, WiWindy, WiCloud, WiSolarEclipse } from 'react-icons/wi'; // Example icons
import DailyChart from '../Graph/DailyGraph.jsx';

const MapboxExample = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [notification, setNotification] = useState(null);
  const [placeName, setPlaceName] = useState('');
  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [precipitation, setPrecipitation] = useState(null);
  const [et0, setEt0] = useState(null);
  const [etC, setEtC] = useState(null); // State for ETc
  const [shortwaveRadiation, setShortwaveRadiation] = useState(null);
  const [windSpeed1000hPa, setWindSpeed1000hPa] = useState(null);
  const popupRef = useRef(null);
  const [hourlyWeatherData, setHourlyWeatherData] = useState({ temperature: [], humidity: [], precipitation: [] });
  const [cropsList, setCropsList] = useState([]); // Add state for crops list
  const [selectedCrop, setSelectedCrop] = useState("");
  const [kcVal, setKcVal] = useState(null);
  const [error, setError] = useState("");


  // Kc value
  const Kc = 1.2;
  // Function to interpret precipitation
  const interpret_precipitation = (mm) => {
    if (mm < 1) {
      return "No rain expected; manual or irrigation watering may be necessary for your crops.";
    } else if (1 <= mm && mm <= 2) {
      return "Light rain expected, providing minimal moisture, which might not meet crop needs.";
    } else if (3 <= mm && mm <= 10) {
      return "Moderate rain expected, ideal for maintaining soil moisture and supporting crop growth.";
    } else if (11 <= mm && mm <= 20) {
      return "Abundant rain expected, offering favorable conditions for crops sensitive to moisture.";
    } else if (21 <= mm && mm <= 50) {
      return "Heavy rain expected, beneficial for crops, but monitor drainage to prevent waterlogging.";
    } else {
      return "Torrential rain expected, with a risk of flooding that may damage crops. Preventive measures are advised.";
    }
  };

  const fetchCropsList = async () => {
    try {
      const response = await axiosInstance.get('/api/crop/');
      setCropsList(response.data.crops); // Set crops list
    } catch (error) {
      console.error("Error fetching crops list:", error);
    }
  };
  const fetchKc = async () => {
    try {
      const response = await axiosInstance.get(`/api/kc/getbycrop/${selectedCrop}`);
      console.log(response.data.kc_value[0].kc_value);
      setKcVal(response.data.kc_value[0].kc_value);
      console.log(kcVal);
    } catch (error) {
      console.error('Error fetching crops:', error);
    }
  };
  const calculateETc = (et0Value, kc) => {
    if (et0Value === null) return null; // Avoid calculation if ET0 is null
    return et0Value * kc; // Calculate ETc
  };
  useEffect(() => {
    if (selectedCrop) {
      fetchKc();
    }
    if (kcVal && et0) {
      calculateETc(et0, kcVal);
    }
  }, [selectedCrop, kcVal, et0]);
  
  
  useEffect(() => {
    fetchCropsList();
    console.log(cropsList);
  }, []);

  const handleCropSelect = (e) => {
    console.log("Selected crop ID:", e.target.value);
    setSelectedCrop(e.target.value);
    console.log(selectedCrop); // Assure-toi d’avoir un useState pour stocker l’ID
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
      // Recherche des coordonnées au format "12.34, 56.78" ou "Lat: 12.34, Lng: 56.78"
      const matches = query.match(
        /^[ ]*(?:Lat: )?(-?\d+\.?\d*)[, ]+(?:Lng: )?(-?\d+\.?\d*)[ ]*$/i
      );
      if (!matches) {
        return null;
      }

      const coord1 = Number(matches[1]);
      const coord2 = Number(matches[2]);

      if (
        coord1 < -90 || coord1 > 90 || // Vérifie que les coordonnées sont valides
        coord2 < -180 || coord2 > 180
      ) {
        return null;
      }

      // Retourne un tableau contenant une seule entité géographique
      return [
        {
          center: [coord2, coord1], // Format [longitude, latitude]
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
      localGeocoder: coordinatesGeocoder, // Ajoutez cette ligne pour inclure votre fonction coordinatesGeocoder

    });

    mapRef.current.addControl(geocoder);

    geocoder.on('result', async (e) => {
      const { place_name, geometry } = e.result;
      setPlaceName(place_name);
      console.log("Place Name:", place_name);
      console.log("Coordinates:", geometry.coordinates);
      setNotification({
        type: 'success',
        message: `Location found: ${place_name}`,
      });

      // Center the map on the selected location
      mapRef.current.flyTo({ center: geometry.coordinates, zoom: 15 });

      // Fetch weather data for the location
      const latitude = geometry.coordinates[1];
      const longitude = geometry.coordinates[0];
      const weatherData = await fetchWeatherData(latitude, longitude);
      console.log(weatherData);
      // Update state with fetched weather data
      setTemperature(weatherData.temperature);
      setHumidity(weatherData.humidity);
      setPrecipitation(weatherData.precipitation);
      setEt0(weatherData.et0_fao_evapotranspiration);
      console.log(et0);
      setShortwaveRadiation(weatherData.shortwave_radiation);
      setWindSpeed1000hPa(weatherData.windSpeed1000hPa);
      setHourlyWeatherData({
        temperature: weatherData.temperatureHourly,
        humidity: weatherData.humidityHourly,
        precipitation: weatherData.precipitationHourly,
      });

      // Calculate ETc
    });

    // Fetch weather data function
    const fetchWeatherData = async (latitude, longitude) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,precipitation,et0_fao_evapotranspiration,shortwave_radiation,wind_speed_1000hPa`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(data);
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
          shortwave_radiation: null,
          windSpeed1000hPa: null,
          temperatureHourly: [],
          humidityHourly: [],
          precipitationHourly: [],
        };
      }
    };

    // Function to calculate ETc
   


    // Add click event to show popup with coordinates and fetch weather data
    mapRef.current.on('click', async (event) => {
      const { lng, lat } = event.lngLat;

      try {
        // Reverse geocoding to get the place name
        const reverseGeocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`;
        const response = await fetch(reverseGeocodeUrl);
        const data = await response.json();

        const city = data.features[0]?.place_name || 'Unknown location';
        setPlaceName(city); // Update place name state

        // Fetch weather data for clicked coordinates
        const weatherData = await fetchWeatherData(lat, lng);

        setTemperature(weatherData.temperature);
        setHumidity(weatherData.humidity);
        setPrecipitation(weatherData.precipitation);
        setEt0(weatherData.et0_fao_evapotranspiration);
        setShortwaveRadiation(weatherData.shortwave_radiation);
        setWindSpeed1000hPa(weatherData.windSpeed1000hPa);

        // Calculate ETc
        const calculatedEtC = calculateETc(weatherData.et0_fao_evapotranspiration, Kc);
        setEtC(calculatedEtC);

        // If a popup already exists, remove it
        if (popupRef.current) {
          popupRef.current.remove();
        }

        // Create a new popup with weather data
        popupRef.current = new mapboxgl.Popup()
          .setLngLat([lng, lat])
          .setHTML(
            `<p><strong>Coordinates:</strong></p>
             <p>Lng: ${lng.toFixed(4)}, Lat: ${lat.toFixed(4)}</p>
             <p><strong>City:</strong> ${city}</p>
             <p><strong>Temperature:</strong> ${weatherData.temperature !== null ? `${weatherData.temperature}°C` : 'N/A'}</p>
             <p><strong>Humidity:</strong> ${weatherData.humidity !== null ? `${weatherData.humidity}%` : 'N/A'}</p>
             <p><strong>Precipitation:</strong> ${weatherData.precipitation !== null ? `${weatherData.precipitation} mm` : 'N/A'}</p>
             <p><strong>~</strong> ${weatherData.precipitation !== null ? `${interpret_precipitation(weatherData.precipitation)}` : 'N/A'}</p>             <p><strong>Shortwave Radiation:</strong> ${weatherData.shortwave_radiation !== null ? `${weatherData.shortwave_radiation} W/m²` : 'N/A'}</p>
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
          className={`absolute top-20 right-2 z-10 px-4 py-2 rounded-md shadow-lg ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
        >
          {notification.message}
        </div>
      )}
      <div className="relative h-[600px]">
        <div ref={mapContainerRef} className="w-full h-full"></div>
      </div>

      <div className="flex flex-col md:flex-row md:space-x-4 mt-8">
        {/* Weather Info */}


        <div className="relative w-full md:w-1/3 bg-white p-6 rounded-lg shadow-lg transition-all hover:shadow-xl hover:bg-gray-50">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
            <WiDaySunny className="mr-2 text-yellow-500" size={24} />
            Weather Information
          </h3>
          <div className="space-y-4">
            <div className="flex items-center text-gray-700 space-x-2">
              <FiMapPin className="text-red-500" size={20} />
              <span className="font-medium">Location:</span>
              <span className="text-gray-600">{placeName}</span>
            </div>

            <div className="flex items-center text-gray-700">
              <WiDaySunny className="mr-2 text-orange-400" size={20} />
              <span className="font-medium">Temperature:</span> {temperature !== null ? `${temperature}°C` : 'N/A'}
            </div>
            <div className="flex items-center text-gray-700">
              <WiHumidity className="mr-2 text-blue-500" size={20} />
              <span className="font-medium">Humidity:</span> {humidity !== null ? `${humidity}%` : 'N/A'}
            </div>
            <div className="flex items-center text-gray-700">
              <WiRain className="mr-2 text-blue-500" size={24} />
              <p>
                <span className="font-medium">Precipitation:</span> {precipitation !== null ? `${precipitation} mm` : 'N/A'}
                <br />
                {precipitation !== null && (
                  <span className="text-sm text-gray-600">
                    ~ {interpret_precipitation(precipitation)}
                  </span>
                )}
              </p>
            </div>


            <div className="flex items-center text-gray-700">
              <WiCloud className="mr-2 text-gray-500" size={20} />
              <span className="font-medium">ET₀:</span> {et0 !== null ? `${et0} mm/day` : 'N/A'}
            </div>
            <div className="flex items-center text-gray-700">
              <WiCloud className="mr-2 text-gray-500" size={20} />
              <span className="font-medium">ETc:</span> {etC !== null ? `${etC} mm/day` : 'N/A'}
              <select
            name="crop_id"
            onChange={handleCropSelect}
            required
            className="w-full p-2 border rounded-md shadow-sm"
          >
            <option value="">Select a Crop</option>
            {cropsList.map((crop) => (
              <option key={crop.id} value={crop.id}>{crop.name}</option>
            ))}
          </select>
            </div>
            <div className="flex items-center text-gray-700">
              <WiSolarEclipse className="mr-2 text-yellow-600" size={20} />
              <span className="font-medium">Shortwave Radiation:</span> {shortwaveRadiation !== null ? `${shortwaveRadiation} W/m²` : 'N/A'}
            </div>
            <div className="flex items-center text-gray-700">
              <WiWindy className="mr-2 text-green-500" size={20} />
              <span className="font-medium">Wind Speed (1000hPa):</span> {windSpeed1000hPa !== null ? `${windSpeed1000hPa} m/s` : 'N/A'}
            </div>
          </div>
        </div>




        {/* Graphique */}
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
