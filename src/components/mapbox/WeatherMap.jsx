// MapboxExample.jsx
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
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

  // Kc value
  const Kc = 1.2;

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q';

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-79.4512, 43.6568],
      zoom: 8,
    });

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      placeholder: 'Search for places...',
    });

    mapRef.current.addControl(geocoder);

    geocoder.on('result', async (e) => {
      const { place_name, geometry } = e.result;
      setPlaceName(place_name);
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

      // Update state with fetched weather data
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

      // Calculate ETc
      const calculatedEtC = calculateETc(weatherData.et0_fao_evapotranspiration, Kc);
      setEtC(calculatedEtC);
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
    const calculateETc = (et0Value, kc) => {
      if (et0Value === null) return null; // Avoid calculation if ET0 is null
      return et0Value * kc; // Calculate ETc
    };

    // Add click event to show popup with coordinates and fetch weather data
    mapRef.current.on('click', async (event) => {
      const { lng, lat } = event.lngLat;

      // Perform reverse geocoding to get the place name
      const reverseGeocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`;
      const response = await fetch(reverseGeocodeUrl);

      const data = await response.json();
      console.log(data);
      const city = data.features[0]?.place_name || 'Unknown location';

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

      // Create a new popup and set its coordinates and content with weather info
      popupRef.current = new mapboxgl.Popup()
        .setLngLat([lng, lat])
        .setHTML(
          `<p>Coordinates:</p><p>Lng: ${lng.toFixed(4)}, Lat: ${lat.toFixed(4)}</p>
           <p>City: ${city}</p>
           <p>Temperature: ${weatherData.temperature !== null ? `${weatherData.temperature}°C` : 'N/A'}</p>
           <p>Humidity: ${weatherData.humidity !== null ? `${weatherData.humidity}%` : 'N/A'}</p>`
        )
        .addTo(mapRef.current);
    });

    return () => {
      mapRef.current.remove();
    };
  }, []);

  return (
    <div className="relative h-full">
      {notification && (
        <div
          className={`absolute top-20 right-2 z-10 px-4 py-2 rounded-md shadow-lg ${
            notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {notification.message}
        </div>
      )}
      <div className="relative h-[600px]">
        <div ref={mapContainerRef} className="absolute inset-0" />
      </div>
      
          {/* Conteneur pour les informations météorologiques */}
          <div className="absolute bottom-28 z-10 left-2  w-1/4 bg-white p-4 rounded-md shadow-lg">
        <h3 className="font-semibold text-lg">Weather Information</h3>
        <p>Current Temperature: {temperature !== null ? `${temperature}°C` : 'N/A'}</p>
        <p>Humidity: {humidity !== null ? `${humidity}%` : 'N/A'}</p>
        <p>Precipitation: {precipitation !== null ? `${precipitation}mm` : 'N/A'}</p>
        <p>ET₀: {et0 !== null ? `${et0} mm/day` : 'N/A'}</p>
        <p>ETc: {etC !== null ? `${etC} mm/day` : 'N/A'}</p>
        <p>Shortwave Radiation: {shortwaveRadiation !== null ? `${shortwaveRadiation} W/m²` : 'N/A'}</p>
        <p>Wind Speed (1000 hPa): {windSpeed1000hPa !== null ? `${windSpeed1000hPa} m/s` : 'N/A'}</p>
      </div>
      <br></br>
      {/* Afficher le graphique à barres */}
      <div className="">
        <DailyChart
          temperature={hourlyWeatherData.temperature}
          humidity={hourlyWeatherData.humidity}
          precipitation={hourlyWeatherData.precipitation}
        />
      </div>
    </div>

  );
  
  
};

export default MapboxExample;