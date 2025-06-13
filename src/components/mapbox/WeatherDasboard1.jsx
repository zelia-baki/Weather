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
    const [weatherData, setWeatherData] = useState(null);
    const [map, setMap] = useState(null);
    const [anomalyAlert, setAnomalyAlert] = useState(null);
    const [farms, setFarms] = useState([]);
    const [selectedFarmId, setSelectedFarmId] = useState('');
    const [forecastDays, setForecastDays] = useState([]);
    const [query, setQuery] = useState('');
    const [forecastRange, setForecastRange] = useState(3); // Nouvel état pour la plage de prévision

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
                        const [longitude, latitude] = geolocation.split(',');
                        setLocation({ lat: parseFloat(latitude), lon: parseFloat(longitude) });
                    }
                }
            } catch (error) {
                console.error('Error fetching farm properties:', error);
            }
        }
    };

    // Mise à jour de la map et récupération des données lorsque la localisation ou la plage de prévision change
    useEffect(() => {
        if (location.lat && location.lon) {
            fetchWeatherData(location.lat, location.lon);
            fetchForecastData(location.lat, location.lon);

            if (map) {
                map.flyTo({
                    center: [location.lat, location.lon],
                    zoom: 10,
                    essential: true,
                });
                new mapboxgl.Marker().setLngLat([location.lat, location.lon]).addTo(map);
            }
        }
    }, [location, map, forecastRange]);

    // Récupération des données météo actuelles
    const fetchWeatherData = (lat, lon) => {
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lon}&longitude=${lat}&hourly=temperature_2m,relative_humidity_2m,precipitation,shortwave_radiation,wind_speed_1000hPa&forecast_days=${forecastRange}`)
            .then(response => response.json())
            .then(data => {
                setWeatherData(data);
            });
    };

    // Récupération des données de prévision et génération du tableau des jours
    const fetchForecastData = (lat, lon) => {
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lon}&longitude=${lat}&hourly=temperature_2m,relative_humidity_2m,precipitation,shortwave_radiation,wind_speed_1000hPa&forecast_days=${forecastRange}`)
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
            let forecastComment = "";
            if (totalPrecipitation > 10) {
                forecastComment = "Heavy rain expected, don't forget your umbrella!";
            } else if (avgTemp > 30) {
                forecastComment = "Hot day ahead, stay hydrated.";
            } else if (avgTemp < 10) {
                forecastComment = "Cold weather, dress warmly.";
            } else {
                forecastComment = "Pleasant weather with stable conditions.";
            }
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

    // Détection des anomalies et envoi d'une alerte par EmailJS
    const detectAnomalies = (data) => {
        const tempThresholdLow = 10;
        const tempThresholdHigh = 30;
        const drynessHumidityThreshold = 30;
        const heavyRainThreshold = 5;
        const strongWindThreshold = 20;

        if (!data || !data.hourly || !data.hourly.time) return;

        let anomalies = [];
        data.hourly.time.forEach((time, index) => {
            const forecastDate = new Date(time);
            const temperature = data.hourly.temperature_2m[index];
            const humidity = data.hourly.relative_humidity_2m[index];
            const precipitation = data.hourly.precipitation[index];
            const windSpeed = data.hourly.wind_speed_1000hPa[index];

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
                        const { center } = data.features[0];
                        const [lon, lat] = center;
                        setLocation({ lat, lon });
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

                {/* Sélection de la ferme */}
                <section className="mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <label className="block text-gray-700 mb-2" htmlFor="farm_id">
                            Farm ID:
                        </label>
                        <select
                            id="farm_id"
                            name="farm_id"
                            value={selectedFarmId}
                            onChange={handleFarmIdChange}
                            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        >
                            <option value="">Select Farm</option>
                            {farms.map((farm) => (
                                <option key={farm.id} value={farm.id}>
                                    {farm.name} - {farm.subcounty}
                                </option>
                            ))}
                        </select>
                    </div>
                </section>

                {/* Dropdown pour sélectionner la plage de prévision */}
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
                            <div>
                                <h3 className="font-bold text-xl text-red-600 mb-1">Alert</h3>
                                <p className="text-red-700 text-sm whitespace-pre-wrap">{anomalyAlert}</p>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};
export default WeatherDashboard;
