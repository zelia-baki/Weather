import React, { useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { Line } from 'react-chartjs-2';
import axiosInstance from '../../axiosInstance.jsx';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const WeatherDashboard = () => {
    const [location, setLocation] = useState({ lat: 0, lon: 0 });
    const [weatherData, setWeatherData] = useState(null);
    const [forecastData, setForecastData] = useState(null);
    const [query, setQuery] = useState('');
    const [map, setMap] = useState(null);
    const [anomalyAlert, setAnomalyAlert] = useState(null);
    const [farms, setFarms] = useState([]);
    const [selectedFarmId, setSelectedFarmId] = useState(''); // Added state for selected farm ID
    const [weatherReport, setWeatherReport] = useState("");


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

    const handleFarmIdChange = async (e) => {
        const farm_id = e.target.value;
        setSelectedFarmId(farm_id); // Update selected farm ID
        console.log(farm_id);
        if (farm_id) {
            try {
                const response = await axiosInstance.get(`/api/farm/${farm_id}`);
                if (response.data.status === 'success') {
                    const geolocation = response.data.data.geolocation;
                    console.log(geolocation);
                    if (geolocation && geolocation.includes(',')) {
                        const [longitude, latitude] = geolocation.split(',');
                        setLocation({
                            lat: parseFloat(latitude),
                            lon: parseFloat(longitude)
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching farm properties:', error);
            }
        }
    };

    useEffect(() => {
        if (location.lat && location.lon) {
            console.log(location.lat, location.lon);
            fetchWeatherData(location.lat, location.lon);
            fetchForecastData(location.lat, location.lon);

            // Update the map center when location changes
            if (map) {
                map.flyTo({
                    center: [location.lat, location.lon],
                    zoom: 10,
                    essential: true
                });

                // Add marker at the new location
                new mapboxgl.Marker()
                    .setLngLat([location.lat, location.lon])
                    .addTo(map);
            }
        }
    }, [location, map]);

    const fetchWeatherData = (lat, lon) => {
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lon}&longitude=${lat}&hourly=temperature_2m,relative_humidity_2m,precipitation,et0_fao_evapotranspiration,shortwave_radiation,wind_speed_1000hPa&forecast_days=3`)
            .then(response => response.json())
            .then(data => {
                setWeatherData(data);
                console.log(data.hourly);
            });
    };

    const fetchForecastData = (lat, lon) => {
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lon}&longitude=${lat}&hourly=temperature_2m,relative_humidity_2m,precipitation,et0_fao_evapotranspiration,shortwave_radiation,wind_speed_1000hPa&forecast_days=3`)
            .then(response => response.json())
            .then(data => {
                console.log(data);
                generateWeatherReport(data);
            });
    };
    const generateWeatherReport = (data) => {
        if (!data || !data.hourly || !data.hourly.time) {
            setWeatherReport("Weather data unavailable.");
            return;
        }

        let report = "Weather forecast for the next 3 days:\n\n";

        for (let day = 0; day < 3; day++) {
            const date = new Date();
            date.setDate(date.getDate() + day);
            const dayString = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

            const temps = [];
            const humidities = [];
            const precipitations = [];
            const winds = [];

            data.hourly.time.forEach((time, index) => {
                const forecastDate = new Date(time);
                if (forecastDate.getDate() === date.getDate()) {
                    temps.push(data.hourly.temperature_2m[index]);
                    humidities.push(data.hourly.relative_humidity_2m[index]);
                    precipitations.push(data.hourly.precipitation[index]);
                    winds.push(data.hourly.wind_speed_1000hPa[index]);
                }
            });

            if (temps.length === 0) continue;

            const avgTemp = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
            const maxTemp = Math.max(...temps).toFixed(1);
            const minTemp = Math.min(...temps).toFixed(1);
            const avgHumidity = (humidities.reduce((a, b) => a + b, 0) / humidities.length).toFixed(1);
            const totalPrecipitation = precipitations.reduce((a, b) => a + b, 0).toFixed(1);
            const avgWind = (winds.reduce((a, b) => a + b, 0) / winds.length).toFixed(1);
            
            report += `📅 **${dayString}** :\n`;
            report += `🌡 Average Temperature: ${avgTemp}°C (Min: ${minTemp}°C, Max: ${maxTemp}°C)\n`;
            report += `💧 Average Humidity: ${avgHumidity}%\n`;
            report += `🌬 Wind Speed: ${avgWind} km/h\n`;
            if (totalPrecipitation > 0) {
                report += `🌧 Expected Precipitation: ${totalPrecipitation} mm\n`;
            } else {
                report += `☀ No precipitation expected\n`;
            }
            
            // Qualitative analysis
            if (totalPrecipitation > 10) {
                report += `🌧 **Forecast:** Heavy rain expected, don't forget your umbrella!\n\n`;
            } else if (avgTemp > 30) {
                report += `🔥 **Forecast:** Hot day ahead, stay hydrated.\n\n`;
            } else if (avgTemp < 10) {
                report += `❄ **Forecast:** Cold weather, dress warmly.\n\n`;
            } else {
                report += `🌤 **Forecast:** Pleasant weather with stable conditions.\n\n`;
            }
            
        }

        setWeatherReport(report);
        console.log(report);
    };

    const detectAnomalies = (data) => {
        const thresholdLow = 10;
        const thresholdHigh = 30;

        if (data && data.hourly && data.hourly.time) {
            const twoDaysForecast = data.hourly.time.filter((_, index) => {
                const date = new Date(data.hourly.time[index]);
                return date.getHours() === 12 && date.getDate() === new Date().getDate() + 2;
            });

            if (twoDaysForecast.length > 0) {
                const temp = data.hourly.temperature_2m[twoDaysForecast[0]];
                if (temp < thresholdLow || temp > thresholdHigh) {
                    setAnomalyAlert(`Anomaly detected: Temperature forecast for 2 days later is ${temp.toFixed(1)}°C. Caution!`);
                } else {
                    setAnomalyAlert(null);
                }
            }
        }
    };

    useEffect(() => {
        mapboxgl.accessToken = 'pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q';
        const newMap = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [0, 0],
            zoom: 2
        });

        newMap.on('click', (e) => {
            setLocation({
                lat: e.lngLat.lat,
                lon: e.lngLat.lng
            });
        });

        setMap(newMap);

        return () => newMap.remove();
    }, []);

    const handleSearch = () => {
        if (query) {
            fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q`)
                .then(response => response.json())
                .then(data => {
                    if (data.features && data.features.length > 0) {
                        const { center } = data.features[0];
                        const [lon, lat] = center;
                        setLocation({ lat, lon });
                        map.flyTo({ center: [lon, lat], zoom: 10 });

                        // Add marker on search location
                        new mapboxgl.Marker()
                            .setLngLat([lon, lat])
                            .addTo(map);
                    }
                });
        }
    };

    const weatherChartData = {
        labels: ['8h', '10h', '12h', '14h', '16h', '18h'],
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
        <div className="flex">


            <div className="flex-1 p-6">

                <div className="mb-6">
                    <label className="text-lg text-gray-800 mb-2 block" htmlFor="farm_id">
                        Farm ID:
                    </label>
                    <select
                        id="farm_id"
                        name="farm_id"
                        value={selectedFarmId} // Bind to selectedFarmId state
                        onChange={handleFarmIdChange}
                        className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                        required
                    >
                        <option value="">Select Farm</option>
                        {farms.map(farm => (
                            <option key={farm.id} value={farm.id}>
                                {farm.name} - {farm.subcounty}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="col-span-1">
                        <div id="map" className="h-96"></div>
                    </div>

                    <div className="col-span-1 h-100">
                        <h1 className="text-2xl font-bold mb-4">Weather Forecast (3 Days)</h1>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <pre>{weatherReport}</pre>
                        </div>
                    </div>


                    <div className="col-span-1">
                        <Line data={weatherChartData} />
                    </div>

                </div>
            </div>
        </div>
    );
};

export default WeatherDashboard;
