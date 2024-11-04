import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';

import 'mapbox-gl/dist/mapbox-gl.css';
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

const MapboxExample = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [notification, setNotification] = useState(null);
  const [placeName, setPlaceName] = useState('');
  const popupRef = useRef(null);

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q';

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-79.4512, 43.6568],
      zoom: 8,
    });

    const coordinatesGeocoder = (query) => {
      const matches = query.match(/^[ ]*(?:Lat: )?(-?\d+\.?\d*)[, ]+(?:Lng: )?(-?\d+\.?\d*)[ ]*$/i);
      if (!matches) return null;

      const coord1 = Number(matches[1]);
      const coord2 = Number(matches[2]);

      const coordinateFeature = (lng, lat) => ({
        center: [lng, lat],
        geometry: { type: 'Point', coordinates: [lng, lat] },
        place_name: `Lat: ${lat}, Lng: ${lng}`,
        place_type: ['coordinate'],
        properties: {},
        type: 'Feature',
      });

      const geocodes = [];
      if (coord1 < -90 || coord1 > 90) geocodes.push(coordinateFeature(coord1, coord2));
      if (coord2 < -90 || coord2 > 90) geocodes.push(coordinateFeature(coord2, coord1));
      if (geocodes.length === 0) geocodes.push(coordinateFeature(coord1, coord2), coordinateFeature(coord2, coord1));

      return geocodes;
    };

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      localGeocoder: coordinatesGeocoder,
      zoom: 4,
      placeholder: 'Enter coordinates, e.g., -40, 170',
      mapboxgl: mapboxgl,
      reverseGeocode: true,
    });

    mapRef.current.addControl(geocoder);

    geocoder.on('result', (e) => {
      const { place_name, geometry } = e.result;
      setPlaceName(place_name);
      setNotification({
        type: 'success',
        message: `Location found: ${place_name}`,
      });

      mapRef.current.flyTo({ center: geometry.coordinates, zoom: 15 });
    });

    // Fetch weather data function
    const fetchWeatherData = async (latitude, longitude) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m`;
      try {
        const response = await fetch(url);
        const data = await response.json();

        // Assume we want the first available temperature
        return data.hourly.temperature_2m[0];
      } catch (error) {
        console.error('Failed to fetch weather data:', error);
        return null;
      }
    };

    // Add click event to show popup with coordinates and fetch weather data
    mapRef.current.on('click', async (event) => {
      const { lng, lat } = event.lngLat;

      // Fetch weather data based on the clicked location
      const temperature = await fetchWeatherData(lat, lng);

      // If a popup already exists, remove it
      if (popupRef.current) {
        popupRef.current.remove();
      }

      // Create a new popup and set its coordinates and content with weather info
      popupRef.current = new mapboxgl.Popup()
        .setLngLat([lng, lat])
        .setHTML(
          `<p>Coordinates:</p><p>Lng: ${lng.toFixed(4)}, Lat: ${lat.toFixed(4)}</p>
           <p>Temperature: ${temperature !== null ? `${temperature}°C` : 'N/A'}</p>`
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
    </div>
  );
};

export default MapboxExample;
