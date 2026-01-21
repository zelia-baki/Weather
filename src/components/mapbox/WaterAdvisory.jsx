// WaterAdvisory.jsx - FINAL VERSION WITH 24H AVERAGES
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { FiMapPin } from 'react-icons/fi';
import axiosInstance from '../../axiosInstance.jsx';
import * as turf from '@turf/turf';

import { WiDaySunny, WiHumidity, WiRain, WiWindy, WiCloud, WiSolarEclipse } from 'react-icons/wi';

const WaterAdvisory = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);

  const [notification, setNotification] = useState(null);
  const [placeName, setPlaceName] = useState('');
  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [precipitation, setPrecipitation] = useState(null);
  const [et0, setEt0] = useState(null);
  const [etC, setEtC] = useState(null);
  const [shortwaveRadiation, setShortwaveRadiation] = useState(null);
  const [windSpeed1000hPa, setWindSpeed1000hPa] = useState(null);
  
  // Daily values for SMS
  const [dailyEt0, setDailyEt0] = useState(null);
  const [dailyEtC, setDailyEtC] = useState(null);
  const [dailyPrecipitation, setDailyPrecipitation] = useState(null);
  
  const [cropsList, setCropsList] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState("");
  const [kcVal, setKcVal] = useState(null);
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [landSurface, setLandSurface] = useState(1800);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sendingStatus, setSendingStatus] = useState({});

  const defaultKc = 0.95;

  // Fetch weather data with AVERAGES over 24 hours
  const fetchWeatherData = async (latitude, longitude) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,precipitation,et0_fao_evapotranspiration,shortwave_radiation,wind_speed_1000hPa`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      const currentHour = new Date().toISOString().slice(0, 13) + ':00';
      const temperatureIndex = data.hourly.time.indexOf(currentHour);

      console.log('Current Hour:', currentHour);
      console.log('Temperature Index:', temperatureIndex);

      // Calculate averages and totals over next 24 hours
      const next24Hours = data.hourly.time
        .map((time, index) => ({ time, index }))
        .filter(item => item.index >= temperatureIndex && item.index < temperatureIndex + 24);

      console.log('Next 24 hours count:', next24Hours.length);

      // Calculate averages
      const avgTemperature = next24Hours.reduce((sum, item) => 
        sum + (data.hourly.temperature_2m[item.index] || 0), 0) / next24Hours.length;
      
      const avgHumidity = next24Hours.reduce((sum, item) => 
        sum + (data.hourly.relative_humidity_2m[item.index] || 0), 0) / next24Hours.length;
      
      const avgShortwaveRadiation = next24Hours.reduce((sum, item) => 
        sum + (data.hourly.shortwave_radiation[item.index] || 0), 0) / next24Hours.length;
      
      const avgWindSpeed = next24Hours.reduce((sum, item) => 
        sum + (data.hourly.wind_speed_1000hPa[item.index] || 0), 0) / next24Hours.length;

      // Total precipitation and ET0 over 24h
      const totalPrecipitation = next24Hours.reduce((sum, item) => 
        sum + (data.hourly.precipitation[item.index] || 0), 0);
      
      const totalEt0 = next24Hours.reduce((sum, item) => 
        sum + (data.hourly.et0_fao_evapotranspiration[item.index] || 0), 0);

      // Average ET0 per hour
      const avgEt0 = totalEt0 / next24Hours.length;

      console.log('Average Temperature:', avgTemperature);
      console.log('Average ET0 per hour:', avgEt0);
      console.log('Total ET0 (24h):', totalEt0);

      return {
        // Average values over 24h
        temperature: avgTemperature,
        humidity: avgHumidity,
        precipitation: totalPrecipitation, // Total precipitation
        et0_fao_evapotranspiration: avgEt0, // Average ET0 per hour
        shortwave_radiation: avgShortwaveRadiation,
        windSpeed1000hPa: avgWindSpeed,
        
        // Daily totals for SMS
        daily_total_precipitation: totalPrecipitation,
        daily_total_et0: totalEt0,
      };
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      return {
        temperature: null, humidity: null, precipitation: null,
        et0_fao_evapotranspiration: null, shortwave_radiation: null,
        windSpeed1000hPa: null,
        daily_total_precipitation: null, daily_total_et0: null,
      };
    }
  };

  // Interpret precipitation
  const interpret_precipitation = (mm) => {
    if (mm < 1) return "No rain expected; manual or irrigation watering may be necessary.";
    if (mm <= 2) return "Light rain expected, minimal moisture.";
    if (mm <= 10) return "Moderate rain expected, ideal for soil moisture.";
    if (mm <= 20) return "Abundant rain expected, favorable for crops.";
    if (mm <= 50) return "Heavy rain expected, monitor drainage.";
    return "Torrential rain expected, risk of flooding.";
  };

  // Fetch farms
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

  // Send SMS
  const sendSMS = async (phone, message) => {
    try {
      const response = await axiosInstance.post('/api/notifications/sms', {
        phone: phone,
        message: message.substring(0, 160)
      });
      return response.status === 200;
    } catch (error) {
      console.error('Error sending SMS:', error);
      return false;
    }
  };

  // Generate water advisory message with DAILY values
  const generateWaterAdvisoryMessage = () => {
    const farmName = farms.find(f => f.id === parseInt(selectedFarmId))?.name || "Farm";
    const cropName = cropsList.find(c => c.id === parseInt(selectedCrop))?.name || "Crop";
    
    // Use DAILY values
    const etcLitres = (dailyEtC * parseFloat(landSurface)).toFixed(0);
    const etcMm = dailyEtC.toFixed(2);
    
    // Net water need = Total ETc - Total Rain (over 24h)
    const rainContribution = dailyPrecipitation * parseFloat(landSurface);
    const netWaterNeed = Math.max(0, parseFloat(etcLitres) - rainContribution);
    
    let action = "";
    if (dailyPrecipitation >= dailyEtC) {
      action = "No irrigation needed";
    } else if (dailyPrecipitation > dailyEtC * 0.5) {
      action = `Light irrigation: ${netWaterNeed.toFixed(0)}L`;
    } else {
      action = `Irrigation: ${netWaterNeed.toFixed(0)}L`;
    }
    
    return `${farmName} - ${cropName}\n24h Water: ${etcLitres}L (${etcMm}mm)\nRain: ${dailyPrecipitation.toFixed(1)}mm\n${action}`;
  };

  // Send water advisory
  const sendWaterAdvisory = async () => {
    if (!phoneNumber || !selectedCrop || !selectedFarmId) {
      setNotification({ type: 'error', message: 'Please fill all fields (farm, crop, phone)' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    if (!/^256\d{9}$/.test(cleanPhone)) {
      setNotification({ type: 'error', message: 'Phone must be format: 256XXXXXXXXX' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setSendingStatus({ sending: true });

    try {
      const message = generateWaterAdvisoryMessage();
      const success = await sendSMS(cleanPhone, message);
      
      if (success) {
        setSendingStatus({ sending: false, completed: true, success: 1, total: 1 });
        setNotification({ type: 'success', message: 'Water advisory sent successfully!' });
        setPhoneNumber('');
      } else {
        setSendingStatus({ sending: false, completed: true, success: 0, total: 1 });
        setNotification({ type: 'error', message: 'Failed to send SMS' });
      }
    } catch (error) {
      setSendingStatus({ sending: false });
      setNotification({ type: 'error', message: 'Error: ' + error.message });
    }

    setTimeout(() => setSendingStatus({}), 5000);
    setTimeout(() => setNotification(null), 5000);
  };

  // Handle farm selection with automatic surface calculation
  const handleFarmChange = async (e) => {
    const farmId = e.target.value;
    setSelectedFarmId(farmId);
    
    if (!farmId || farmId === "") {
      setLandSurface(1800);
      return;
    }
    
    try {
      const response = await axiosInstance.get(`/api/farm/${farmId}`);
      
      if (response.data.status === "success") {
        const farmData = response.data.data;
        
        // Search for polygon in possible fields
        const possibleFields = ['polygon', 'geojson', 'boundary', 'coordinates', 'shape', 'geometry'];
        const polygonField = possibleFields.find(field => 
          farmData[field] !== undefined && farmData[field] !== null && farmData[field] !== ""
        );
        
        if (polygonField) {
          const polygonData = farmData[polygonField];
          
          try {
            const parsedPolygon = typeof polygonData === 'string' ? JSON.parse(polygonData) : polygonData;
            let turfPolygon;
            
            if (parsedPolygon.type === 'Feature' && parsedPolygon.geometry) {
              turfPolygon = turf.polygon(parsedPolygon.geometry.coordinates);
            }
            else if (parsedPolygon.type === 'Polygon' && parsedPolygon.coordinates) {
              turfPolygon = turf.polygon(parsedPolygon.coordinates);
            }
            else if (Array.isArray(parsedPolygon) && parsedPolygon.length > 0) {
              const firstPoint = parsedPolygon[0];
              
              if (Array.isArray(firstPoint)) {
                const isLatLon = Math.abs(firstPoint[0]) <= 90;
                let coords = isLatLon ? parsedPolygon.map(point => [point[1], point[0]]) : parsedPolygon;
                
                const first = coords[0];
                const last = coords[coords.length - 1];
                if (first[0] !== last[0] || first[1] !== last[1]) {
                  coords.push([...first]);
                }
                
                turfPolygon = turf.polygon([coords]);
              }
            }
            
            if (turfPolygon) {
              const areaInSquareMeters = turf.area(turfPolygon);
              setLandSurface(Math.round(areaInSquareMeters));
              
              setNotification({
                type: 'success',
                message: `Surface calculated: ${Math.round(areaInSquareMeters)} m²`
              });
              setTimeout(() => setNotification(null), 3000);
              
              // Display polygon on map
              if (mapRef.current) {
                if (mapRef.current.getLayer('farm-polygon')) {
                  mapRef.current.removeLayer('farm-polygon');
                  mapRef.current.removeLayer('farm-polygon-outline');
                  mapRef.current.removeSource('farm-polygon');
                }
                
                mapRef.current.addSource('farm-polygon', {
                  type: 'geojson',
                  data: turfPolygon
                });
                
                mapRef.current.addLayer({
                  id: 'farm-polygon',
                  type: 'fill',
                  source: 'farm-polygon',
                  paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.3 }
                });
                
                mapRef.current.addLayer({
                  id: 'farm-polygon-outline',
                  type: 'line',
                  source: 'farm-polygon',
                  paint: { 'line-color': '#2563eb', 'line-width': 2 }
                });
                
                const bbox = turf.bbox(turfPolygon);
                mapRef.current.fitBounds(bbox, { padding: 50 });
              }
            } else {
              setLandSurface(1800);
            }
            
          } catch (polygonError) {
            console.error("Error processing polygon:", polygonError);
            setLandSurface(1800);
          }
        } else {
          setLandSurface(1800);
        }
        
        // Geolocation & Weather
        const geolocation = farmData.geolocation;
        if (geolocation && geolocation.includes(",")) {
          const [lat, lon] = geolocation.split(",");
          const latNum = parseFloat(lat);
          const lonNum = parseFloat(lon);

          setLatitude(latNum);
          setLongitude(lonNum);

          if (mapRef.current) {
            mapRef.current.flyTo({ center: [lonNum, latNum], zoom: 15 });
            
            if (!polygonField) {
              new mapboxgl.Marker({ color: "red" })
                .setLngLat([lonNum, latNum])
                .setPopup(new mapboxgl.Popup().setHTML(`<strong>${farmData.name}</strong>`))
                .addTo(mapRef.current);
            }
          }

          const weatherData = await fetchWeatherData(latNum, lonNum);
          
          // Set average values
          setTemperature(weatherData.temperature);
          setHumidity(weatherData.humidity);
          setPrecipitation(weatherData.precipitation);
          setEt0(weatherData.et0_fao_evapotranspiration);
          setShortwaveRadiation(weatherData.shortwave_radiation);
          setWindSpeed1000hPa(weatherData.windSpeed1000hPa);
          
          // Daily values
          setDailyEt0(weatherData.daily_total_et0);
          setDailyPrecipitation(weatherData.daily_total_precipitation);
        }
      }
    } catch (error) {
      console.error("Error fetching farm:", error);
      setLandSurface(1800);
    }
  };

  // Fetch crops list
  const fetchCropsList = async () => {
    try {
      const response = await axiosInstance.get('/api/crop/');
      setCropsList(response.data.crops);
    } catch (error) {
      console.error("Error fetching crops list:", error);
    }
  };

  // Fetch Kc value
  const fetchKc = async (cropId) => {
    if (!cropId) return;
    
    try {
      const response = await axiosInstance.get(`/api/kc/getbycrop/${cropId}`);
      setKcVal(response.data.kc_value[0].kc_value);
    } catch (error) {
      console.error('Error fetching kc value:', error);
    }
  };

  // Calculate average ETc (for display)
  const calculateETc = (et0Value, kc) => {
    if (et0Value === null) return null;
    return et0Value * kc;
  };

  // Update average ETc
  useEffect(() => {
    if (et0 !== null) {
      const currentKc = kcVal || defaultKc;
      const value = calculateETc(et0, currentKc);
      setEtC(value);
    }
  }, [et0, kcVal]);

  // Update DAILY ETc
  useEffect(() => {
    if (dailyEt0 !== null) {
      const currentKc = kcVal || defaultKc;
      const dailyEtcValue = dailyEt0 * currentKc;
      setDailyEtC(dailyEtcValue);
    }
  }, [dailyEt0, kcVal]);

  useEffect(() => {
    fetchCropsList();
  }, []);

  const handleCropSelect = (e) => {
    const cropId = e.target.value;
    setSelectedCrop(cropId);
    if (cropId) fetchKc(cropId);
  };

  // Initialize map
  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q';

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/satellite-v9",
      center: [-79.4512, 43.6568],
      zoom: 8,
    });

    const coordinatesGeocoder = (query) => {
      const matches = query.match(/^[ ]*(?:Lat: )?(-?\d+\.?\d*)[, ]+(?:Lng: )?(-?\d+\.?\d*)[ ]*$/i);
      if (!matches) return null;
      const coord1 = Number(matches[1]);
      const coord2 = Number(matches[2]);
      if (coord1 < -90 || coord1 > 90 || coord2 < -180 || coord2 > 180) return null;
      return [{ center: [coord2, coord1], geometry: { type: 'Point', coordinates: [coord2, coord1] }, place_name: `Lat: ${coord1}, Lng: ${coord2}`, place_type: ['coordinate'], properties: {}, type: 'Feature' }];
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
      setNotification({ type: 'success', message: `Location found: ${place_name}` });
      setTimeout(() => setNotification(null), 3000);

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
      
      setDailyEt0(weatherData.daily_total_et0);
      setDailyPrecipitation(weatherData.daily_total_precipitation);
    });

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
        
        setDailyEt0(weatherData.daily_total_et0);
        setDailyPrecipitation(weatherData.daily_total_precipitation);

        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new mapboxgl.Popup()
          .setLngLat([lng, lat])
          .setHTML(
            `<p><strong>Coordinates:</strong> Lng: ${lng.toFixed(4)}, Lat: ${lat.toFixed(4)}</p>
             <p><strong>City:</strong> ${city}</p>
             <p><strong>Avg Temperature (24h):</strong> ${weatherData.temperature?.toFixed(1) ?? 'N/A'}°C</p>
             <p><strong>Avg Humidity (24h):</strong> ${weatherData.humidity?.toFixed(1) ?? 'N/A'}%</p>
             <p><strong>Total Precipitation (24h):</strong> ${weatherData.precipitation?.toFixed(1) ?? 'N/A'} mm</p>
             <p><strong>~</strong> ${weatherData.precipitation !== null ? interpret_precipitation(weatherData.precipitation) : 'N/A'}</p>
             <p><strong>Avg Radiation (24h):</strong> ${weatherData.shortwave_radiation?.toFixed(0) ?? 'N/A'} W/m²</p>
             <p><strong>Avg Wind Speed (24h):</strong> ${weatherData.windSpeed1000hPa?.toFixed(1) ?? 'N/A'} m/s</p>`
          )
          .addTo(mapRef.current);
      } catch (error) {
        console.error('Error fetching data or creating popup:', error);
        setNotification({ type: 'error', message: 'Failed to fetch weather data.' });
        setTimeout(() => setNotification(null), 3000);
      }
    });

    return () => mapRef.current.remove();
  }, []);

  return (
    <div className="relative h-full">
      {notification && (
        <div className={`absolute top-20 right-2 z-10 px-4 py-2 rounded-md shadow-lg ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {notification.message}
        </div>
      )}

      <p className="text-xl text-gray-600 italic mb-4">Water Advisory System - Calculate irrigation needs and send SMS alerts</p>

      <div className="relative h-[600px] mb-8">
        <div ref={mapContainerRef} className="w-full h-full"></div>
      </div>

      {/* Two column layout - Weather left, Forms right */}
      <div className="grid grid-cols-2 gap-6 max-w-6xl mx-auto">
        {/* LEFT COLUMN - Weather Information */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
            <WiDaySunny className="mr-2 text-yellow-500" size={24} />
            Weather Forecast (24h Average)
          </h3>

          <div className="space-y-4">
            {/* Location */}
            <div className="flex items-center text-gray-700 space-x-2 pb-4 border-b">
              <FiMapPin className="text-red-500" size={24} />
              <span className="font-semibold text-lg">Location:</span>
              <span className="text-gray-600">{placeName}</span>
            </div>

            {/* Weather data cards */}
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                <WiDaySunny className="text-orange-400 mr-3" size={36} />
                <div className="flex-1">
                  <p className="text-xs text-gray-600">Avg Temperature (24h)</p>
                  <p className="font-bold text-lg text-gray-800">{temperature !== null ? `${temperature.toFixed(1)}°C` : 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                <WiHumidity className="text-blue-500 mr-3" size={36} />
                <div className="flex-1">
                  <p className="text-xs text-gray-600">Avg Humidity (24h)</p>
                  <p className="font-bold text-lg text-gray-800">{humidity !== null ? `${humidity.toFixed(1)}%` : 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <WiRain className="text-blue-500 mr-3" size={36} />
                <div className="flex-1">
                  <p className="text-xs text-gray-600">Total Precipitation (24h)</p>
                  <p className="font-bold text-lg text-gray-800">{precipitation !== null ? `${precipitation.toFixed(1)} mm` : 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
                <WiCloud className="text-gray-500 mr-3" size={36} />
                <div className="flex-1">
                  <p className="text-xs text-gray-600">Avg ET₀ (24h)</p>
                  <p className="font-bold text-lg text-gray-800">{et0 !== null ? `${et0.toFixed(3)} mm/h` : 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
                <WiSolarEclipse className="text-yellow-600 mr-3" size={36} />
                <div className="flex-1">
                  <p className="text-xs text-gray-600">Avg Radiation (24h)</p>
                  <p className="font-bold text-lg text-gray-800">{shortwaveRadiation !== null ? `${shortwaveRadiation.toFixed(0)} W/m²` : 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <WiWindy className="text-green-500 mr-3" size={36} />
                <div className="flex-1">
                  <p className="text-xs text-gray-600">Avg Wind Speed (24h)</p>
                  <p className="font-bold text-lg text-gray-800">{windSpeed1000hPa !== null ? `${windSpeed1000hPa.toFixed(1)} m/s` : 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Farm & Crop Selection */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6">Farm & Crop Selection</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Select Farm:</label>
              <select value={selectedFarmId} onChange={handleFarmChange} className="w-full p-3 border rounded-lg">
                <option value="">Select a farm</option>
                {farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>{farm.name} - {farm.subcounty}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2">Select Crop:</label>
              <select name="crop_id" onChange={handleCropSelect} className="w-full p-3 border rounded-lg">
                <option value="">Select a crop</option>
                {cropsList.map((crop) => (
                  <option key={crop.id} value={crop.id}>{crop.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Land Surface (m²):</span>
                {selectedFarmId && landSurface !== 1800 && (
                  <span className="text-xs text-green-600">✓ Auto-calculated (editable)</span>
                )}
              </label>
              <input 
                type="number" 
                value={landSurface} 
                onChange={(e) => setLandSurface(e.target.value)} 
                className="w-full p-3 border rounded-lg"
                placeholder="Enter land surface in m²"
              />
              <p className="text-xs text-gray-500 mt-1">
                {selectedFarmId && landSurface !== 1800 
                  ? 'Calculated from polygon, but you can edit it manually' 
                  : 'Enter farm surface area'}
              </p>
            </div>

            {selectedCrop && dailyEtC !== null && landSurface > 0 && (
              <div className="space-y-3 mt-4">
                {/* Average Hourly Values */}
                <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 border-l-4 border-gray-400 rounded-lg">
                  <div className="flex items-center mb-2">
                    <WiCloud className="text-gray-500 mr-2" size={20} />
                    <span className="font-semibold text-gray-700 text-sm">Average per Hour (24h)</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg ETc:</span>
                      <span className="font-semibold text-gray-900">{etC?.toFixed(3)} mm/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Precipitation:</span>
                      <span className="font-semibold text-gray-900">{precipitation?.toFixed(1) || 0} mm</span>
                    </div>
                  </div>
                </div>

                {/* Daily Values for SMS */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-400 rounded-lg">
                  <div className="flex items-center mb-2">
                    <WiCloud className="text-blue-500 mr-2" size={24} />
                    <span className="font-semibold text-gray-800">24-Hour Total</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total ETc:</span>
                      <span className="font-semibold text-gray-900">{dailyEtC.toFixed(2)} mm/day</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total water need:</span>
                      <span className="font-semibold text-gray-900">{(dailyEtC * parseFloat(landSurface)).toFixed(0)} L</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expected rain (24h):</span>
                      <span className="font-semibold text-gray-900">{dailyPrecipitation.toFixed(1)} mm</span>
                    </div>
                    <div className="flex justify-between border-t border-blue-200 pt-2 mt-2">
                      <span className="text-gray-600">Net irrigation:</span>
                      <span className="font-bold text-blue-600">
                        {Math.max(0, (dailyEtC * parseFloat(landSurface)) - (dailyPrecipitation * parseFloat(landSurface))).toFixed(0)} L
                      </span>
                    </div>
                  </div>
                </div>

                {/* SMS Advisory Section */}
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    📱 Send Water Advisory SMS
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Phone Number</label>
                      <input 
                        type="tel" 
                        placeholder="256XXXXXXXXX"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Format: 256783130358</p>
                    </div>

                    <button 
                      onClick={sendWaterAdvisory}
                      disabled={sendingStatus.sending || !phoneNumber || !selectedCrop}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white py-2.5 rounded-lg font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      {sendingStatus.sending ? (
                        <>
                          <WiCloud className="animate-spin" size={20} />
                          Sending SMS...
                        </>
                      ) : (
                        <>
                          📤 Send Water Advisory
                        </>
                      )}
                    </button>

                    {sendingStatus.completed && (
                      <div className={`p-3 rounded-lg text-sm ${
                        sendingStatus.success === sendingStatus.total 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {sendingStatus.success === sendingStatus.total 
                          ? '✅ SMS sent successfully!' 
                          : '❌ Failed to send SMS'}
                      </div>
                    )}

                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Message Preview (24h forecast):</p>
                      <div className="font-mono text-xs text-gray-700 whitespace-pre-line">
                        {selectedCrop && selectedFarmId && dailyEtC !== null ? 
                          generateWaterAdvisoryMessage() : 
                          'Select farm and crop to preview message...'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaterAdvisory;