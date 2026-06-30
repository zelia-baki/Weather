import React, { useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { Line } from 'react-chartjs-2';
import axiosInstance from '../../axiosInstance.jsx';
import { WiThermometer, WiThermometerExterior, WiHumidity, WiStrongWind, WiRain } from "react-icons/wi";
import emailjs from 'emailjs-com';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const WeatherDashboard = () => {
    const [location, setLocation] = useState({ lat: 0, lon: 0 });
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [locationName, setLocationName] = useState(''); // ✅ AJOUT
    const [weatherData, setWeatherData] = useState(null);
    const [map, setMap] = useState(null);
    const [anomalyAlert, setAnomalyAlert] = useState(null);
    const [farms, setFarms] = useState([]);
    const [selectedFarmId, setSelectedFarmId] = useState('');
    const [forecastDays, setForecastDays] = useState([]);
    const [query, setQuery] = useState('');
    const [forecastRange, setForecastRange] = useState(3);

    // ✅ AJOUT : Onglets ("single" = vue ferme unique actuelle, "all" = dashboard multi-fermes)
    const [activeTab, setActiveTab] = useState('single');
    const [allFarmsAlerts, setAllFarmsAlerts] = useState([]);
    const [allFarmsLoading, setAllFarmsLoading] = useState(false);
    const [allFarmsLastChecked, setAllFarmsLastChecked] = useState(null);

    // ✅ AJOUT : Ferme actuellement sélectionnée + numéro de téléphone associé
    const selectedFarm = farms.find((farm) => String(farm.id) === String(selectedFarmId));
    const selectedFarmPhone = selectedFarm?.phonenumber1 || selectedFarm?.phonenumber || null;

    // Récupération de la liste des fermes
    useEffect(() => {
        const fetchFarms = async () => {
            try {
                const { data } = await axiosInstance.get('/api/farm/all');
                setFarms(data.farms || []);
            } catch (error) {
                console.error('Error fetching farms:', error);
            }
        };

        fetchFarms();
    }, []);

    // 🌍 NOUVELLE FONCTION : Reverse Geocoding pour obtenir le nom du lieu
    const fetchLocationName = async (lat, lon) => {
        try {
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q`
            );
            const data = await response.json();
            
            if (data.features && data.features.length > 0) {
                const place = data.features[0];
                setLocationName(place.place_name);
            }
        } catch (error) {
            console.error('Error fetching location name:', error);
            setLocationName('Unknown location');
        }
    };

    // Sélection d'une ferme
    const handleFarmIdChange = async (e) => {
        const farm_id = e.target.value;
        setSelectedFarmId(farm_id);
        if (farm_id) {
            try {
                const response = await axiosInstance.get(`/api/farm/${farm_id}`);
                if (response.data.status === 'success') {
                    const geolocation = response.data.data.geolocation;
                    if (geolocation && geolocation.includes(',')) {
                        const [lat, lon] = geolocation.split(',');
                        const parsedLat = parseFloat(lat);
                        const parsedLon = parseFloat(lon);
                        setLatitude(parsedLat);
                        setLongitude(parsedLon);
                        setLocation({ lat: parsedLat, lon: parsedLon });
                        fetchLocationName(parsedLat, parsedLon); // ✅ AJOUT
                    }
                }
            } catch (error) {
                console.error('Error fetching farm properties:', error);
            }
        }
    };

    // 🔹 Bouton pour appliquer les coordonnées manuelles
    const handleApplyCoordinates = () => {
        if (latitude && longitude) {
            const parsedLat = parseFloat(latitude);
            const parsedLon = parseFloat(longitude);
            setLocation({ lat: parsedLat, lon: parsedLon });
            fetchLocationName(parsedLat, parsedLon); // ✅ AJOUT
        }
    };

    // Mise à jour de la map et récupération des données lorsque la localisation ou la plage de prévision change
    useEffect(() => {
        if (location.lat && location.lon) {
            fetchWeatherData(location.lat, location.lon);
            fetchForecastData(location.lat, location.lon);

            if (map) {
                map.flyTo({
                    center: [location.lon, location.lat],
                    zoom: 10,
                    essential: true,
                });
                
                // ✅ AMÉLIORATION : Supprime les anciens markers
                const markers = document.getElementsByClassName('mapboxgl-marker');
                while(markers[0]) {
                    markers[0].parentNode.removeChild(markers[0]);
                }
                
                new mapboxgl.Marker().setLngLat([location.lon, location.lat]).addTo(map);
            }
        }
    }, [location, map, forecastRange]);

    // Récupération des données météo actuelles
    const fetchWeatherData = (lat, lon) => {
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,precipitation,shortwave_radiation,wind_speed_1000hPa&forecast_days=${forecastRange}`)
            .then(response => response.json())
            .then(data => {
                setWeatherData(data);
            });
    };

    // Récupération des données de prévision et génération du tableau des jours
    const fetchForecastData = (lat, lon) => {
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,precipitation,shortwave_radiation,wind_speed_1000hPa&forecast_days=${forecastRange}`)
            .then(response => response.json())
            .then(data => {
                generateForecastDays(data);
                detectAnomalies(data);
            });
    };

    // Génération du tableau des jours de prévision
    const generateForecastDays = (data) => {
        if (!data || !data.hourly || !data.hourly.time) {
            setForecastDays([]);
            return;
        }

        const daysArray = [];
        for (let day = 0; day < forecastRange; day++) {
            const currentDate = new Date();
            currentDate.setDate(currentDate.getDate() + day);
            const dayString = currentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            });
            let temps = [], humidities = [], precipitations = [], winds = [];
            data.hourly.time.forEach((time, index) => {
                const forecastDate = new Date(time);
                if (forecastDate.getDate() === currentDate.getDate()) {
                    temps.push(data.hourly.temperature_2m[index]);
                    humidities.push(data.hourly.relative_humidity_2m[index]);
                    precipitations.push(data.hourly.precipitation[index]);
                    winds.push(data.hourly.wind_speed_1000hPa[index]);
                }
            });
            if (temps.length === 0) continue;
            const avgTemp = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
            const minTemp = Math.min(...temps).toFixed(1);
            const maxTemp = Math.max(...temps).toFixed(1);
            const avgHumidity = (humidities.reduce((a, b) => a + b, 0) / humidities.length).toFixed(1);
            const totalPrecipitation = precipitations.reduce((a, b) => a + b, 0).toFixed(1);
            const avgWind = (winds.reduce((a, b) => a + b, 0) / winds.length).toFixed(1);
            
            let forecastComment = generateWeatherInterpretation(
                parseFloat(avgTemp),
                parseFloat(minTemp),
                parseFloat(maxTemp),
                parseFloat(totalPrecipitation),
                parseFloat(avgHumidity),
                parseFloat(avgWind)
            );
            
            daysArray.push({
                day: dayString,
                avgTemp,
                minTemp,
                maxTemp,
                avgHumidity,
                totalPrecipitation,
                avgWind,
                forecastComment
            });
        }
        setForecastDays(daysArray);
    };

    // Génération d'interprétation naturelle
    const generateWeatherInterpretation = (avgTemp, minTemp, maxTemp, precipitation, humidity, wind) => {
        let conditions = [];
        let recommendations = [];
        
        // Analyse de la température
        if (avgTemp < 10) {
            conditions.push("cold weather");
            recommendations.push("dress warmly");
        } else if (avgTemp >= 10 && avgTemp < 20) {
            conditions.push("cool weather");
            recommendations.push("light jacket recommended");
        } else if (avgTemp >= 20 && avgTemp < 28) {
            conditions.push("pleasant weather");
        } else if (avgTemp >= 28 && avgTemp < 35) {
            conditions.push("hot weather");
            recommendations.push("stay hydrated");
        } else {
            conditions.push("very hot weather");
            recommendations.push("avoid sun exposure, drink plenty of water");
        }
        
        // Analyse des précipitations
        if (precipitation === 0) {
            conditions.push("no rain");
        } else if (precipitation > 0 && precipitation <= 2) {
            conditions.push("light drizzle");
            recommendations.push("light rain gear advised");
        } else if (precipitation > 2 && precipitation <= 10) {
            conditions.push("moderate rain");
            recommendations.push("bring umbrella");
        } else {
            conditions.push("heavy rain");
            recommendations.push("stay indoors if possible");
        }
        
        // Analyse de l'humidité
        if (humidity < 30) {
            conditions.push("very dry air");
            if (!recommendations.includes("stay hydrated")) {
                recommendations.push("moisturize skin");
            }
        } else if (humidity > 80 && avgTemp > 25) {
            conditions.push("humid conditions");
            recommendations.push("expect discomfort");
        }
        
        // Analyse du vent
        if (wind > 30) {
            conditions.push("strong winds");
            recommendations.push("secure loose objects");
        } else if (wind > 20) {
            conditions.push("windy");
        }
        
        // Construction du message final
        let message = conditions.join(", ");
        message = message.charAt(0).toUpperCase() + message.slice(1) + ".";
        
        if (recommendations.length > 0) {
            message += " " + recommendations.join(", ").charAt(0).toUpperCase() + recommendations.join(", ").slice(1) + ".";
        }
        
        return message;
    };

    // 🔁 AJOUT : Logique pure de détection (réutilisable pour le dashboard multi-fermes)
    // Retourne un tableau de chaînes décrivant les anomalies trouvées (vide si aucune)
    const computeAnomalies = (data) => {
        const tempThresholdLow = 10;
        const tempThresholdHigh = 30;
        const drynessHumidityThreshold = 30;
        const heavyRainThreshold = 5;
        const strongWindThreshold = 20;

        if (!data || !data.hourly || !data.hourly.time) return [];

        let anomalies = [];
        data.hourly.time.forEach((time, index) => {
            const forecastDate = new Date(time);
            const temperature = data.hourly.temperature_2m[index];
            const humidity = data.hourly.relative_humidity_2m[index];
            const precipitation = data.hourly.precipitation[index];
            const windSpeed = data.hourly.wind_speed_1000hPa ? data.hourly.wind_speed_1000hPa[index] : 0;

            let hourAnomalies = [];
            if (temperature < tempThresholdLow) {
                hourAnomalies.push(`low temperature (${temperature.toFixed(1)}°C)`);
            } else if (temperature > tempThresholdHigh) {
                hourAnomalies.push(`high temperature (${temperature.toFixed(1)}°C)`);
            }
            if (humidity < drynessHumidityThreshold) {
                hourAnomalies.push(`dry conditions (humidity ${humidity.toFixed(1)}%)`);
            }
            if (precipitation > heavyRainThreshold) {
                hourAnomalies.push(`heavy rain (${precipitation.toFixed(1)} mm)`);
            }
            if (windSpeed > strongWindThreshold) {
                hourAnomalies.push(`strong wind (${windSpeed.toFixed(1)} km/h)`);
            }
            if (hourAnomalies.length > 0) {
                const timeStr = forecastDate.toLocaleString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
                anomalies.push(`At ${timeStr} on ${forecastDate.toLocaleDateString('en-US')}: ${hourAnomalies.join(', ')}`);
            }
        });
        return anomalies;
    };

    // Détection des anomalies (ferme unique) et envoi d'une alerte par EmailJS
    const detectAnomalies = (data) => {
        const anomalies = computeAnomalies(data);
        if (anomalies.length > 0) {
            const alertMessage = `⚠️ Alert: Anomalies detected:\n${anomalies.join('\n')}`;
            setAnomalyAlert(alertMessage);
            sendEmailAlert(alertMessage);
        } else {
            setAnomalyAlert(null);
        }
    };

    // Envoi de l'alerte par EmailJS
    const sendEmailAlert = (message) => {
        const selectedFarm = farms.find((farm) => farm.id === selectedFarmId);
        const recipientEmail = selectedFarm && selectedFarm.email ? selectedFarm.email : 'default@example.com';

        const templateParams = {
            to_name: selectedFarm ? selectedFarm.name : 'Farmer',
            farmer_email: recipientEmail,
            message: message,
        };

        emailjs
            .send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams, 'YOUR_USER_ID')
            .then((response) => {
                console.log('Email sent successfully!', response.status, response.text);
            })
            .catch((error) => {
                console.error('Failed to send email:', error);
            });
    };

    // 🆕 AJOUT : Dashboard multi-fermes — vérifie toutes les fermes et liste celles en alerte
    const fetchAllFarmsAlerts = async () => {
        if (!farms.length) return;
        setAllFarmsLoading(true);
        try {
            const results = [];

            for (const farm of farms) {
                if (!farm.geolocation || !farm.geolocation.includes(',')) continue;
                const [latStr, lonStr] = farm.geolocation.split(',');
                const lat = parseFloat(latStr);
                const lon = parseFloat(lonStr);
                if (isNaN(lat) || isNaN(lon)) continue;

                try {
                    const response = await fetch(
                        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,precipitation,shortwave_radiation,wind_speed_1000hPa&forecast_days=3`
                    );
                    const data = await response.json();
                    const anomalies = computeAnomalies(data);

                    if (anomalies.length > 0) {
                        results.push({
                            farm,
                            phone: farm.phonenumber1 || farm.phonenumber || null,
                            lat,
                            lon,
                            anomalies,
                        });
                    }
                } catch (err) {
                    console.error(`Error checking farm ${farm.name}:`, err);
                }
            }

            setAllFarmsAlerts(results);
            setAllFarmsLastChecked(new Date());
        } finally {
            setAllFarmsLoading(false);
        }
    };

    // Lance la vérification multi-fermes dès qu'on ouvre l'onglet "All Farms" (et que les fermes sont chargées)
    useEffect(() => {
        if (activeTab === 'all' && farms.length > 0 && allFarmsAlerts.length === 0 && !allFarmsLastChecked) {
            fetchAllFarmsAlerts();
        }
    }, [activeTab, farms]);

    // Initialisation de la map Mapbox
    useEffect(() => {
        mapboxgl.accessToken = 'pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q';
        const newMap = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [0, 0],
            zoom: 2,
        });

        newMap.on('click', (e) => {
            setLocation({
                lat: e.lngLat.lat,
                lon: e.lngLat.lng,
            });
            setLatitude(e.lngLat.lat);
            setLongitude(e.lngLat.lng);
            fetchLocationName(e.lngLat.lat, e.lngLat.lng); // ✅ AJOUT
        });

        setMap(newMap);
        return () => newMap.remove();
    }, []);

    // Recherche via Mapbox (optionnel)
    const handleSearch = () => {
        if (query) {
            fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q`)
                .then((response) => response.json())
                .then((data) => {
                    if (data.features && data.features.length > 0) {
                        const { center, place_name } = data.features[0];
                        const [lon, lat] = center;
                        setLocation({ lat, lon });
                        setLatitude(lat);
                        setLongitude(lon);
                        setLocationName(place_name); // ✅ AJOUT
                        
                        // Supprime les anciens markers
                        const markers = document.getElementsByClassName('mapboxgl-marker');
                        while(markers[0]) {
                            markers[0].parentNode.removeChild(markers[0]);
                        }
                        
                        map.flyTo({ center: [lon, lat], zoom: 10 });
                        new mapboxgl.Marker().setLngLat([lon, lat]).addTo(map);
                    }
                });
        }
    };

    // Configuration des données pour le graphique météo
    const weatherChartData = {
        labels: ['8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM'],
        datasets: [
            {
                label: 'Temperature (°C)',
                data: weatherData ? weatherData.hourly.temperature_2m.slice(0, 6) : [0, 0, 0, 0, 0, 0],
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
            },
            {
                label: 'Humidity (%)',
                data: weatherData ? weatherData.hourly.relative_humidity_2m.slice(0, 6) : [0, 0, 0, 0, 0, 0],
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
            },
        ],
    };

    return (
        <div className="min-h-screen bg-white-50 p-6">
            <div className="container mx-auto">
                <header className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800">Anomaly Alert Detection</h1>
                </header>

                {/* ✅ AJOUT : Onglets Single Farm / All Farms */}
                <div className="mb-8 inline-flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                    <button
                        onClick={() => setActiveTab('single')}
                        className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                            activeTab === 'single'
                                ? 'bg-blue-600 text-white shadow'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Single Farm
                    </button>
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`relative px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                            activeTab === 'all'
                                ? 'bg-blue-600 text-white shadow'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        All Farms Alerts
                        {allFarmsAlerts.length > 0 && (
                            <span className={`ml-2 inline-flex items-center justify-center text-xs font-bold rounded-full w-5 h-5 ${
                                activeTab === 'all' ? 'bg-white text-blue-700' : 'bg-red-500 text-white'
                            }`}>
                                {allFarmsAlerts.length}
                            </span>
                        )}
                    </button>
                </div>

                {activeTab === 'single' && (
                <>
                {/* Sélection de la ferme ET coordonnées manuelles */}
                <section className="mb-8">
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-8 border border-gray-100">
                        <div className="flex items-center mb-6">
                            <div className="bg-blue-100 p-3 rounded-lg mr-3">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">Location Settings</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Sélection de ferme */}
                            <div className="relative">
                                <label className="flex items-center text-gray-700 mb-2 font-semibold text-sm" htmlFor="farm_id">
                                    <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    Select Farm
                                </label>
                                <select
                                    id="farm_id"
                                    name="farm_id"
                                    value={selectedFarmId}
                                    onChange={handleFarmIdChange}
                                    className="w-full p-3 border-2 border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200 hover:border-blue-300 cursor-pointer"
                                >
                                    <option value="">-- Choose Farm --</option>
                                    {farms.map((farm) => (
                                        <option key={farm.id} value={farm.id}>
                                            {farm.name} - {farm.subcounty}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Latitude */}
                            <div className="relative">
                                <label className="flex items-center text-gray-700 mb-2 font-semibold text-sm">
                                    <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Latitude
                                </label>
                                <input
                                    type="text"
                                    value={latitude}
                                    onChange={(e) => setLatitude(e.target.value)}
                                    className="w-full p-3 border-2 border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200 hover:border-blue-300"
                                    placeholder="e.g., 1.3733"
                                />
                            </div>

                            {/* Longitude */}
                            <div className="relative">
                                <label className="flex items-center text-gray-700 mb-2 font-semibold text-sm">
                                    <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Longitude
                                </label>
                                <input
                                    type="text"
                                    value={longitude}
                                    onChange={(e) => setLongitude(e.target.value)}
                                    className="w-full p-3 border-2 border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition duration-200 hover:border-indigo-300"
                                    placeholder="e.g., 32.2903"
                                />
                            </div>

                            {/* Bouton Apply */}
                            <div className="flex items-end">
                                <button
                                    onClick={handleApplyCoordinates}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Apply
                                </button>
                            </div>
                        </div>

                        {/* ✅ Indicateur visuel des coordonnées actives AVEC NOM DU LIEU + INFOS FARMER */}
                        {latitude && longitude && (
                            <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        {/* ✅ AJOUT : Nom du farmer + téléphone, si une ferme est sélectionnée */}
                                        {selectedFarm && (
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2 text-sm text-blue-900">
                                                <span className="font-bold">👤 {selectedFarm.name}</span>
                                                {selectedFarmPhone && (
                                                    <span className="font-medium">📞 {selectedFarmPhone}</span>
                                                )}
                                            </div>
                                        )}

                                        {/* Affichage du nom du lieu */}
                                        {locationName && (
                                            <p className="text-base text-blue-900 font-bold mb-1">
                                                📍 {locationName}
                                            </p>
                                        )}
                                        <p className="text-sm text-blue-800 font-medium">
                                            Coordinates: <span className="font-bold">{parseFloat(latitude).toFixed(4)}°N, {parseFloat(longitude).toFixed(4)}°E</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Dropdown pour sélectionner la plage de prévision */}
                <section className="mb-8">
                    <div className="bg-white rounded-lg shadow-md p-6 flex items-center space-x-4">
                        <label htmlFor="forecastRange" className="text-lg font-semibold text-gray-700">
                            Forecast Range:
                        </label>
                        <select
                            id="forecastRange"
                            value={forecastRange}
                            onChange={(e) => setForecastRange(parseInt(e.target.value))}
                            className="block w-full max-w-xs py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-150 ease-in-out"
                        >
                            <option value={3}>3-Day Forecast</option>
                            <option value={10}>10-Day Forecast</option>
                        </select>
                    </div>
                </section>

                {/* Contenu principal : Map et cartes de prévision */}
                <section className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Map (occupant 2 colonnes sur grand écran) */}
                    <div className="lg:col-span-2 rounded-lg shadow overflow-hidden">
                        <div id="map" className="h-96"></div>
                    </div>

                    {/* Cartes de prévision */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-2xl font-bold mb-4">{forecastRange}-Day Forecast</h2>
                        {forecastDays.length > 0 ? (
                            <div className="space-y-4">
                                {forecastDays.map((day, index) => (
                                    <div key={index} className="p-4 border rounded hover:shadow-lg transition-shadow duration-200">
                                        <h3 className="text-xl font-semibold mb-2">{day.day}</h3>
                                        <div className="text-gray-700 space-y-2">
                                            {/* Température moyenne */}
                                            <div className="flex items-center">
                                                <WiThermometer className="text-blue-500 w-5 h-5 mr-2" />
                                                <p>Avg Temp: {day.avgTemp}°C</p>
                                            </div>

                                            {/* Température min/max */}
                                            <div className="flex items-center">
                                                <WiThermometerExterior className="text-orange-500 w-5 h-5 mr-2" />
                                                <p>Min: {day.minTemp}°C, Max: {day.maxTemp}°C</p>
                                            </div>

                                            {/* Humidité */}
                                            <div className="flex items-center">
                                                <WiHumidity className="text-teal-500 w-5 h-5 mr-2" />
                                                <p>Humidity: {day.avgHumidity}%</p>
                                            </div>

                                            {/* Vent */}
                                            <div className="flex items-center">
                                                <WiStrongWind className="text-gray-500 w-5 h-5 mr-2" />
                                                <p>Wind: {day.avgWind} km/h</p>
                                            </div>

                                            {/* Précipitations */}
                                            <div className="flex items-center">
                                                <WiRain className="text-blue-700 w-5 h-5 mr-2" />
                                                <p>Precipitation: {day.totalPrecipitation} mm</p>
                                            </div>
                                        </div>

                                        <p className="mt-2 text-blue-600 font-medium">{day.forecastComment}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-600">No forecast available.</p>
                        )}
                    </div>
                </section>

                {/* Graphique météo */}
                <section className="mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-2xl font-bold mb-4">Weather Chart</h2>
                        <Line data={weatherChartData} />
                    </div>
                </section>

                {/* Alerte d'anomalie */}
                {anomalyAlert && (
                    <section className="mb-8">
                        <div className="flex items-start bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-md">
                            <svg
                                className="w-6 h-6 text-red-500 mr-4 flex-shrink-0"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.675-1.36 3.44 0l6.518 11.59c.75 1.334-.213 3.011-1.72 3.011H3.459c-1.507 0-2.47-1.677-1.72-3.011l6.518-11.59zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-2a.75.75 0 01-.75-.75V7a.75.75 0 011.5 0v3.25A.75.75 0 0110 11z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <div className="flex-1">
                                <h3 className="font-bold text-xl text-red-600 mb-1">Alert</h3>
                                <p className="text-red-700 text-sm whitespace-pre-wrap">{anomalyAlert}</p>
                            </div>
                        </div>
                    </section>
                )}
                </>
                )}

                {/* ✅ AJOUT : Dashboard "All Farms Alerts" */}
                {activeTab === 'all' && (
                    <section className="mb-8">
                        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">All Farms — Active Alerts</h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {allFarmsLastChecked
                                            ? `Last checked: ${allFarmsLastChecked.toLocaleTimeString('en-US')} · ${allFarmsAlerts.length} / ${farms.length} farms in alert`
                                            : 'Not checked yet'}
                                    </p>
                                </div>
                                <button
                                    onClick={fetchAllFarmsAlerts}
                                    disabled={allFarmsLoading}
                                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm transition"
                                >
                                    <svg className={`w-4 h-4 ${allFarmsLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    {allFarmsLoading ? 'Checking farms…' : 'Refresh'}
                                </button>
                            </div>

                            {allFarmsLoading ? (
                                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                    <svg className="w-8 h-8 animate-spin mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <p className="text-sm">Checking weather for {farms.length} farms…</p>
                                </div>
                            ) : allFarmsAlerts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                    <svg className="w-10 h-10 mb-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-sm font-medium text-gray-600">No active alerts across all farms</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {allFarmsAlerts.map((item, index) => (
                                        <div key={`${item.farm.id}-${index}`} className="rounded-xl border-2 border-red-200 bg-red-50/50 p-5">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <p className="font-bold text-gray-900">👤 {item.farm.name}</p>
                                                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-500">
                                                        {item.phone && <span>📞 {item.phone}</span>}
                                                        <span>📍 {item.lat.toFixed(4)}°N, {item.lon.toFixed(4)}°E</span>
                                                    </div>
                                                </div>
                                                <span className="inline-flex items-center justify-center text-xs font-bold bg-red-500 text-white rounded-full px-2.5 py-1">
                                                    {item.anomalies.length} anomal{item.anomalies.length > 1 ? 'ies' : 'y'}
                                                </span>
                                            </div>
                                            <div className="bg-white rounded-lg border border-red-100 p-3 max-h-40 overflow-y-auto">
                                                <ul className="space-y-1 text-xs text-red-700">
                                                    {item.anomalies.slice(0, 5).map((a, i) => (
                                                        <li key={i}>• {a}</li>
                                                    ))}
                                                    {item.anomalies.length > 5 && (
                                                        <li className="text-gray-400 italic">+ {item.anomalies.length - 5} more…</li>
                                                    )}
                                                </ul>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setSelectedFarmId(String(item.farm.id));
                                                    setLatitude(item.lat);
                                                    setLongitude(item.lon);
                                                    setLocation({ lat: item.lat, lon: item.lon });
                                                    fetchLocationName(item.lat, item.lon);
                                                    setActiveTab('single');
                                                }}
                                                className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-800"
                                            >
                                                View details →
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};
export default WeatherDashboard;