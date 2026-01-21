import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart, Bar } from 'recharts';
import { 
  TrendingUp, BarChart3, RefreshCw, AlertTriangle, ThermometerSun,
  Droplets, Calendar, MapPin, ChevronDown, ChevronUp, Info, Cloud,
  CloudRain, Sun, Thermometer, Activity
} from 'lucide-react';
import axiosInstance from '../../axiosInstance';

const WBIIDashboard = () => {
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [wbiiData, setWbiiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedInfo, setExpandedInfo] = useState(false);
  const [error, setError] = useState(null);

  const fetchFarms = async () => {
    try {
      let allFarms = [];
      let page = 1;
      let totalPages = 1;
      
      // Boucle pour récupérer toutes les pages automatiquement
      while (page <= totalPages) {
        const response = await axiosInstance.get(`/api/farm/?page=${page}&page_size=100`);
        
        let farms = [];
        if (Array.isArray(response.data)) {
          farms = response.data;
          // Si c'est un simple array, on suppose qu'il n'y a qu'une page
          totalPages = 1;
        } else if (response.data?.results) {
          // Structure Django REST Framework
          farms = response.data.results;
          totalPages = Math.ceil(response.data.count / 100);
        } else if (response.data?.farms) {
          farms = response.data.farms;
          totalPages = response.data.total_pages || 1;
        } else if (response.data?.data) {
          farms = response.data.data;
          totalPages = response.data.total_pages || 1;
        } else if (response.data?.items) {
          farms = response.data.items;
          totalPages = response.data.total_pages || 1;
        }
        
        allFarms = [...allFarms, ...farms];
        page++;
        
        // Sécurité: arrêter si on a fait trop de requêtes
        if (page > 50) {
          console.warn('Stopped after 50 pages to prevent infinite loop');
          break;
        }
      }
      
      console.log(`Total farms loaded: ${allFarms.length} from ${page - 1} page(s)`);
      return allFarms;
    } catch (error) {
      console.error('Error fetching farms:', error);
      setError('Failed to load farms. Please try again.');
      return [];
    }
  };

  const fetchHistoricalWeatherData = async (lat, lon) => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);
      
      const formatDate = (date) => date.toISOString().split('T')[0];
      
      // Données historiques (3 derniers mois)
      const historicalUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${formatDate(startDate)}&end_date=${formatDate(endDate)}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
      const historicalResponse = await fetch(historicalUrl);
      const historicalData = await historicalResponse.json();
      
      // Prévisions (10 prochains jours)
      const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=10`;
      const forecastResponse = await fetch(forecastUrl);
      const forecastData = await forecastResponse.json();
      
      // Combiner les données
      if (historicalData?.daily && forecastData?.daily) {
        return {
          daily: {
            time: [...historicalData.daily.time, ...forecastData.daily.time],
            temperature_2m_max: [...historicalData.daily.temperature_2m_max, ...forecastData.daily.temperature_2m_max],
            temperature_2m_min: [...historicalData.daily.temperature_2m_min, ...forecastData.daily.temperature_2m_min],
            precipitation_sum: [...historicalData.daily.precipitation_sum, ...forecastData.daily.precipitation_sum]
          }
        };
      }
      
      return historicalData; // Fallback si les prévisions échouent
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return null;
    }
  };

  const calculateWBII = (weatherData) => {
    if (!weatherData?.daily) return [];

    const daily = weatherData.daily;
    const wbiiTimeSeries = [];
    
    // Déterminer la date actuelle pour savoir où commencent les prévisions
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // WBII calculation parameters
    const OPTIMAL_TEMP_MIN = 20;
    const OPTIMAL_TEMP_MAX = 28;
    const HEAVY_RAIN_THRESHOLD = 10;
    const EXTREME_TEMP_LOW = 15;
    const EXTREME_TEMP_HIGH = 35;
    const DROUGHT_THRESHOLD = 1;

    for (let i = 0; i < daily.time.length; i++) {
      const date = daily.time[i];
      const dateObj = new Date(date);
      const isForecast = dateObj > today; // Vérifier si c'est une prévision
      
      const tempMax = daily.temperature_2m_max[i];
      const tempMin = daily.temperature_2m_min[i];
      const precipitation = daily.precipitation_sum[i];
      const tempAvg = (tempMax + tempMin) / 2;

      // Temperature stress calculation
      let tempStress = 0;
      if (tempAvg < OPTIMAL_TEMP_MIN) {
        tempStress = ((OPTIMAL_TEMP_MIN - tempAvg) / (OPTIMAL_TEMP_MIN - EXTREME_TEMP_LOW)) * 50;
      } else if (tempAvg > OPTIMAL_TEMP_MAX) {
        tempStress = ((tempAvg - OPTIMAL_TEMP_MAX) / (EXTREME_TEMP_HIGH - OPTIMAL_TEMP_MAX)) * 50;
      }

      // Water stress calculation
      let waterStress = 0;
      if (precipitation > HEAVY_RAIN_THRESHOLD) {
        // Heavy rain stress
        waterStress = Math.min(50, ((precipitation - HEAVY_RAIN_THRESHOLD) / HEAVY_RAIN_THRESHOLD) * 50);
      } else if (precipitation < DROUGHT_THRESHOLD) {
        // Drought stress
        waterStress = 25;
      }

      // WBII = weighted combination
      const wbii = Math.min(100, tempStress + waterStress);

      // Risk level determination
      let riskLevel = 'Low';
      let riskColor = '#10b981';
      if (wbii > 60) {
        riskLevel = 'Critical';
        riskColor = '#ef4444';
      } else if (wbii > 40) {
        riskLevel = 'High';
        riskColor = '#f59e0b';
      } else if (wbii > 20) {
        riskLevel = 'Moderate';
        riskColor = '#eab308';
      }

      wbiiTimeSeries.push({
        date,
        wbii: Math.round(wbii * 10) / 10,
        tempAvg: Math.round(tempAvg * 10) / 10,
        tempMax: Math.round(tempMax * 10) / 10,
        tempMin: Math.round(tempMin * 10) / 10,
        precipitation: Math.round(precipitation * 10) / 10,
        tempStress: Math.round(tempStress * 10) / 10,
        waterStress: Math.round(waterStress * 10) / 10,
        riskLevel,
        riskColor,
        isForecast // Nouveau champ pour identifier les prévisions
      });
    }

    return wbiiTimeSeries;
  };

  const loadWBIIForFarm = async (farm) => {
    if (!farm?.geolocation) {
      console.error('Farm missing geolocation:', farm);
      setError('Selected farm is missing location data');
      return;
    }

    setLoading(true);
    setSelectedFarm(farm);
    setError(null);
    
    try {
      const [lat, lon] = farm.geolocation.split(',').map(c => parseFloat(c.trim()));
      
      if (isNaN(lat) || isNaN(lon)) {
        throw new Error('Invalid geolocation format');
      }

      const historicalData = await fetchHistoricalWeatherData(lat, lon);
      
      if (historicalData) {
        const wbiiTimeSeries = calculateWBII(historicalData);
        setWbiiData({
          farm,
          timeSeries: wbiiTimeSeries
        });
      } else {
        setError('Failed to load weather data');
      }
    } catch (error) {
      console.error('Error calculating WBII:', error);
      setError('Error loading WBII data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadFarms = async () => {
      setLoading(true);
      try {
        const farmData = await fetchFarms();
        console.log('Setting farms:', farmData);
        setFarms(farmData);
        if (farmData.length > 0) {
          await loadWBIIForFarm(farmData[0]);
        } else {
          setError('No farms found');
        }
      } catch (err) {
        console.error('Error in loadFarms:', err);
        setError('Failed to initialize dashboard');
      } finally {
        setLoading(false);
      }
    };
    loadFarms();
  }, []);

  const formatChartDate = (dateString) => {
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'short' });
    return `${month} ${date.getDate()}`;
  };

  const formatFullDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Helper function to get stress level description
  const getStressLevel = (stressValue) => {
    if (stressValue === 0) return { label: 'Optimal', color: 'text-green-600' };
    if (stressValue < 15) return { label: 'Low Stress', color: 'text-yellow-600' };
    if (stressValue < 25) return { label: 'Moderate Stress', color: 'text-orange-600' };
    if (stressValue < 35) return { label: 'High Stress', color: 'text-red-600' };
    return { label: 'Critical Stress', color: 'text-red-700' };
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const heatStressLevel = getStressLevel(data.tempStress);
      const moistureStressLevel = getStressLevel(data.waterStress);
      
      return (
        <div className="bg-white p-4 rounded-xl shadow-xl border-2 border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-gray-900 text-sm">{formatFullDate(data.date)}</p>
            {data.isForecast && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                Forecast
              </span>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-gray-600">WBII Index:</span>
              <span className={`font-bold text-sm px-2 py-1 rounded ${
                data.wbii > 60 ? 'bg-red-100 text-red-700' : 
                data.wbii > 40 ? 'bg-orange-100 text-orange-700' : 
                data.wbii > 20 ? 'bg-yellow-100 text-yellow-700' : 
                'bg-green-100 text-green-700'
              }`}>
                {data.wbii}
              </span>
            </div>
            
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-gray-600">Risk Level:</span>
              <span className="font-semibold text-xs">{data.riskLevel}</span>
            </div>
            <div className="border-t border-gray-200 my-2"></div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-gray-600">Temperature:</span>
              <span className="text-xs font-medium">{data.tempMin}°C - {data.tempMax}°C</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-gray-600">Avg Temp:</span>
              <span className="text-xs font-medium">{data.tempAvg}°C</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-gray-600">Rainfall:</span>
              <span className="text-xs font-medium">{data.precipitation}mm</span>
            </div>
            <div className="border-t border-gray-200 my-2"></div>
            <div>
              <div className="flex items-center justify-between gap-4 mb-1">
                <span className="text-xs text-gray-600">Heat Stress:</span>
                <span className={`text-xs font-semibold ${heatStressLevel.color}`}>{data.tempStress}</span>
              </div>
              <p className={`text-xs ${heatStressLevel.color} text-right`}>{heatStressLevel.label}</p>
            </div>
            <div>
              <div className="flex items-center justify-between gap-4 mb-1">
                <span className="text-xs text-gray-600">Moisture Stress:</span>
                <span className={`text-xs font-semibold ${moistureStressLevel.color}`}>{data.waterStress}</span>
              </div>
              <p className={`text-xs ${moistureStressLevel.color} text-right`}>{moistureStressLevel.label}</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const getStatistics = () => {
    if (!wbiiData?.timeSeries) return null;

    const data = wbiiData.timeSeries;
    const avgWBII = data.reduce((sum, d) => sum + d.wbii, 0) / data.length;
    const maxWBII = Math.max(...data.map(d => d.wbii));
    const criticalDays = data.filter(d => d.wbii > 60).length;
    const highRiskDays = data.filter(d => d.wbii > 40).length;

    return {
      avgWBII: Math.round(avgWBII * 10) / 10,
      maxWBII,
      criticalDays,
      highRiskDays
    };
  };

  // NOUVELLE FONCTION: Statistiques détaillées des événements météo
  const getDetailedStatistics = () => {
    if (!wbiiData?.timeSeries) return null;

    const data = wbiiData.timeSeries;
    const totalDays = data.length;
    
    // Calculs des événements
    const heavyRainDays = data.filter(d => d.precipitation > 10).length;
    const moderateRainDays = data.filter(d => d.precipitation >= 5 && d.precipitation <= 10).length;
    const lightRainDays = data.filter(d => d.precipitation > 1 && d.precipitation < 5).length;
    const droughtDays = data.filter(d => d.precipitation < 1).length;
    const hotDays = data.filter(d => d.tempMax > 29).length;
    const veryHotDays = data.filter(d => d.tempMax > 35).length;
    const coldDays = data.filter(d => d.tempMin < 20).length;
    const veryColdDays = data.filter(d => d.tempMin < 15).length;
    
    // Températures
    const avgTemp = data.reduce((sum, d) => sum + d.tempAvg, 0) / totalDays;
    const maxTemp = Math.max(...data.map(d => d.tempMax));
    const minTemp = Math.min(...data.map(d => d.tempMin));
    
    // Précipitations
    const totalPrecip = data.reduce((sum, d) => sum + d.precipitation, 0);
    const avgPrecip = totalPrecip / totalDays;
    const maxPrecip = Math.max(...data.map(d => d.precipitation));
    
    // Calcul des fréquences mensuelles (approximation: 3 mois = ~90 jours)
    const monthlyFactor = totalDays / 3;
    
    return {
      totalDays,
      // Précipitations
      heavyRainDays,
      heavyRainPerMonth: Math.round((heavyRainDays / totalDays) * monthlyFactor * 10) / 10,
      moderateRainDays,
      moderateRainPerMonth: Math.round((moderateRainDays / totalDays) * monthlyFactor * 10) / 10,
      lightRainDays,
      lightRainPerMonth: Math.round((lightRainDays / totalDays) * monthlyFactor * 10) / 10,
      droughtDays,
      droughtPerMonth: Math.round((droughtDays / totalDays) * monthlyFactor * 10) / 10,
      // Températures
      hotDays,
      hotDaysPerMonth: Math.round((hotDays / totalDays) * monthlyFactor * 10) / 10,
      veryHotDays,
      veryHotDaysPerMonth: Math.round((veryHotDays / totalDays) * monthlyFactor * 10) / 10,
      coldDays,
      coldDaysPerMonth: Math.round((coldDays / totalDays) * monthlyFactor * 10) / 10,
      veryColdDays,
      veryColdDaysPerMonth: Math.round((veryColdDays / totalDays) * monthlyFactor * 10) / 10,
      // Moyennes
      avgTemp: Math.round(avgTemp * 10) / 10,
      maxTemp: Math.round(maxTemp * 10) / 10,
      minTemp: Math.round(minTemp * 10) / 10,
      totalPrecip: Math.round(totalPrecip * 10) / 10,
      avgPrecip: Math.round(avgPrecip * 10) / 10,
      maxPrecip: Math.round(maxPrecip * 10) / 10
    };
  };

  const stats = getStatistics();
  const detailedStats = getDetailedStatistics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg border border-purple-100 p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">WBII Dashboard</h1>
                  <p className="text-sm text-gray-500">Weather-Based Impact Index</p>
                </div>
              </div>
              <p className="text-gray-600">Monitor agricultural risk factors across all farms over a 3-month period + 10-day forecast</p>
            </div>
            
            <button
              onClick={() => setExpandedInfo(!expandedInfo)}
              className="inline-flex items-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-700 px-5 py-3 rounded-xl font-medium transition-all"
            >
              <Info className="w-4 h-4" />
              About WBII
              {expandedInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Info Section */}
          {expandedInfo && (
            <div className="mt-6 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
              <h3 className="font-semibold text-gray-900 mb-3">What is WBII?</h3>
              <p className="text-sm text-gray-700 mb-4">
                The Weather-Based Impact Index (WBII) combines temperature and precipitation data to assess agricultural risk. 
                It identifies critical periods where crops may face stress from extreme weather conditions.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl">
                  <h4 className="font-semibold text-sm text-gray-900 mb-2 flex items-center gap-2">
                    <ThermometerSun className="w-4 h-4 text-red-500" />
                    Temperature Stress
                  </h4>
                  <p className="text-xs text-gray-600 mb-3">
                    Measures deviation from optimal temperature range (20-28°C). Extreme heat or cold increases stress levels.
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-green-600">0 - Optimal</span>
                      <span className="text-gray-500">20-28°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-600">&lt;15 - Low Stress</span>
                      <span className="text-gray-500">18-19°C or 29-30°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-600">15-25 - Moderate</span>
                      <span className="text-gray-500">16-17°C or 31-32°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600">25-35 - High</span>
                      <span className="text-gray-500">15°C or 33-34°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-700">35+ - Critical</span>
                      <span className="text-gray-500">&lt;15°C or &gt;35°C</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl">
                  <h4 className="font-semibold text-sm text-gray-900 mb-2 flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    Moisture Stress
                  </h4>
                  <p className="text-xs text-gray-600 mb-3">
                    Tracks both drought conditions and heavy rainfall. Too little or too much water negatively impacts crops.
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-green-600">0 - Optimal</span>
                      <span className="text-gray-500">1-10mm rainfall</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-600">25 - Drought</span>
                      <span className="text-gray-500">&lt;1mm rainfall</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-600">25-40 - Heavy Rain</span>
                      <span className="text-gray-500">10-20mm rainfall</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600">40+ - Extreme Rain</span>
                      <span className="text-gray-500">&gt;20mm rainfall</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Farm Selector */}
        <div className="bg-white rounded-3xl shadow-lg border border-purple-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-600" />
            Select Farm {farms.length > 0 && `(${farms.length} farms)`}
          </h3>
          <select
            value={selectedFarm?.id || ''}
            onChange={(e) => {
              const farmId = e.target.value;
              const farm = farms.find(f => String(f.id) === String(farmId));
              if (farm) loadWBIIForFarm(farm);
            }}
            disabled={loading}
            className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 font-medium focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
          >
            <option value="">-- Select a Farm --</option>
            {farms.map((farm) => (
              <option key={farm.id} value={farm.id}>
                {farm.name} {farm.geolocation ? `(${farm.geolocation})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Avg WBII</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.avgWBII}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Max WBII</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.maxWBII}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">High Risk</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.highRiskDays}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Critical</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.criticalDays}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NEW SECTION: Detailed Weather Event Statistics */}
        {detailedStats && (
          <div className="bg-white rounded-3xl shadow-lg border border-purple-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Detailed Weather Statistics</h3>
                <p className="text-sm text-gray-500">Analysis over {detailedStats.totalDays} days</p>
              </div>
            </div>

            {/* Precipitation */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-600" />
                Precipitation Events
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Heavy Rain */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-2xl border-2 border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <CloudRain className="w-8 h-8 text-blue-600" />
                    <span className="text-xs font-semibold text-blue-700 bg-blue-200 px-2 py-1 rounded-full">
                      &gt; 10mm
                    </span>
                  </div>
                  <h5 className="text-sm font-semibold text-gray-700 mb-1">Heavy Rain</h5>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-900">{detailedStats.heavyRainDays} days</p>
                    <p className="text-xs text-gray-600">≈ {detailedStats.heavyRainPerMonth} days/month</p>
                  </div>
                </div>

                {/* Moderate Rain */}
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-5 rounded-2xl border-2 border-cyan-200">
                  <div className="flex items-center justify-between mb-3">
                    <Cloud className="w-8 h-8 text-cyan-600" />
                    <span className="text-xs font-semibold text-cyan-700 bg-cyan-200 px-2 py-1 rounded-full">
                      5-10mm
                    </span>
                  </div>
                  <h5 className="text-sm font-semibold text-gray-700 mb-1">Moderate Rain</h5>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-900">{detailedStats.moderateRainDays} days</p>
                    <p className="text-xs text-gray-600">≈ {detailedStats.moderateRainPerMonth} days/month</p>
                  </div>
                </div>

                {/* Light Rain */}
                <div className="bg-gradient-to-br from-sky-50 to-sky-100 p-5 rounded-2xl border-2 border-sky-200">
                  <div className="flex items-center justify-between mb-3">
                    <Droplets className="w-8 h-8 text-sky-600" />
                    <span className="text-xs font-semibold text-sky-700 bg-sky-200 px-2 py-1 rounded-full">
                      1-5mm
                    </span>
                  </div>
                  <h5 className="text-sm font-semibold text-gray-700 mb-1">Light Rain</h5>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-900">{detailedStats.lightRainDays} days</p>
                    <p className="text-xs text-gray-600">≈ {detailedStats.lightRainPerMonth} days/month</p>
                  </div>
                </div>

                {/* Drought */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-2xl border-2 border-amber-200">
                  <div className="flex items-center justify-between mb-3">
                    <Sun className="w-8 h-8 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-700 bg-amber-200 px-2 py-1 rounded-full">
                      &lt; 1mm
                    </span>
                  </div>
                  <h5 className="text-sm font-semibold text-gray-700 mb-1">Dry Days</h5>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-900">{detailedStats.droughtDays} days</p>
                    <p className="text-xs text-gray-600">≈ {detailedStats.droughtPerMonth} days/month</p>
                  </div>
                </div>
              </div>

              {/* Precipitation Summary */}
              <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Total precipitation:</span>
                    <span className="ml-2 font-bold text-blue-700">{detailedStats.totalPrecip}mm</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Daily average:</span>
                    <span className="ml-2 font-bold text-blue-700">{detailedStats.avgPrecip}mm</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Maximum recorded:</span>
                    <span className="ml-2 font-bold text-blue-700">{detailedStats.maxPrecip}mm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Temperature */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ThermometerSun className="w-5 h-5 text-red-600" />
                Temperature Events
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Very Hot */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-2xl border-2 border-red-200">
                  <div className="flex items-center justify-between mb-3">
                    <ThermometerSun className="w-8 h-8 text-red-600" />
                    <span className="text-xs font-semibold text-red-700 bg-red-200 px-2 py-1 rounded-full">
                      &gt; 35°C
                    </span>
                  </div>
                  <h5 className="text-sm font-semibold text-gray-700 mb-1">Extreme Heat</h5>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-900">{detailedStats.veryHotDays} days</p>
                    <p className="text-xs text-gray-600">≈ {detailedStats.veryHotDaysPerMonth} days/month</p>
                  </div>
                </div>

                {/* Hot */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-2xl border-2 border-orange-200">
                  <div className="flex items-center justify-between mb-3">
                    <Thermometer className="w-8 h-8 text-orange-600" />
                    <span className="text-xs font-semibold text-orange-700 bg-orange-200 px-2 py-1 rounded-full">
                      &gt; 29°C
                    </span>
                  </div>
                  <h5 className="text-sm font-semibold text-gray-700 mb-1">Hot Days</h5>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-900">{detailedStats.hotDays} days</p>
                    <p className="text-xs text-gray-600">≈ {detailedStats.hotDaysPerMonth} days/month</p>
                  </div>
                </div>

                {/* Cold */}
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-5 rounded-2xl border-2 border-cyan-200">
                  <div className="flex items-center justify-between mb-3">
                    <Thermometer className="w-8 h-8 text-cyan-600" />
                    <span className="text-xs font-semibold text-cyan-700 bg-cyan-200 px-2 py-1 rounded-full">
                      &lt; 20°C
                    </span>
                  </div>
                  <h5 className="text-sm font-semibold text-gray-700 mb-1">Cool Days</h5>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-900">{detailedStats.coldDays} days</p>
                    <p className="text-xs text-gray-600">≈ {detailedStats.coldDaysPerMonth} days/month</p>
                  </div>
                </div>

                {/* Very Cold */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-2xl border-2 border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <Thermometer className="w-8 h-8 text-blue-600" />
                    <span className="text-xs font-semibold text-blue-700 bg-blue-200 px-2 py-1 rounded-full">
                      &lt; 15°C
                    </span>
                  </div>
                  <h5 className="text-sm font-semibold text-gray-700 mb-1">Extreme Cold</h5>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-900">{detailedStats.veryColdDays} days</p>
                    <p className="text-xs text-gray-600">≈ {detailedStats.veryColdDaysPerMonth} days/month</p>
                  </div>
                </div>
              </div>

              {/* Temperature Summary */}
              <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Average temperature:</span>
                    <span className="ml-2 font-bold text-orange-700">{detailedStats.avgTemp}°C</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Maximum recorded:</span>
                    <span className="ml-2 font-bold text-red-700">{detailedStats.maxTemp}°C</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Minimum recorded:</span>
                    <span className="ml-2 font-bold text-blue-700">{detailedStats.minTemp}°C</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Chart */}
        {loading ? (
          <div className="bg-white rounded-3xl shadow-lg border border-purple-100 p-12 flex flex-col items-center justify-center">
            <RefreshCw className="w-12 h-12 text-purple-500 animate-spin mb-4" />
            <p className="text-lg text-gray-600 font-medium">Loading WBII data...</p>
            <p className="text-sm text-gray-400 mt-2">Analyzing 3 months of weather patterns + 10-day forecast</p>
          </div>
        ) : wbiiData ? (
          <div className="bg-white rounded-3xl shadow-lg border border-purple-100 p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  WBII Time Series - {wbiiData.farm.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Last 3 months of historical data + 10-day forecast</p>
              </div>
            </div>

            {/* Risk Level Legend */}
            <div className="mb-6 p-5 bg-gradient-to-r from-gray-50 to-purple-50 rounded-2xl border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Risk Level Guide</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-500 rounded-lg shadow-sm"></div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Low</p>
                    <p className="text-xs text-gray-500">0-20</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-yellow-500 rounded-lg shadow-sm"></div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Moderate</p>
                    <p className="text-xs text-gray-500">20-40</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-orange-500 rounded-lg shadow-sm"></div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">High</p>
                    <p className="text-xs text-gray-500">40-60</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-500 rounded-lg shadow-sm"></div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Critical</p>
                    <p className="text-xs text-gray-500">60+</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={450}>
              <ComposedChart data={wbiiData.timeSeries} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="wbiiGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatChartDate}
                  style={{ fontSize: '11px', fill: '#6b7280' }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  yAxisId="left"
                  label={{ value: 'Index Score', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#374151' } }}
                  style={{ fontSize: '11px', fill: '#6b7280' }}
                  domain={[0, 100]}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  label={{ value: 'Precipitation (mm)', angle: 90, position: 'insideRight', style: { fontSize: '12px', fill: '#374151' } }}
                  style={{ fontSize: '11px', fill: '#6b7280' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                
                {/* WBII Area */}
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="wbii"
                  fill="url(#wbiiGradient)"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  name="WBII Index"
                />
                
                {/* Temperature Stress Line */}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="tempStress"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                  name="Temperature Stress"
                />
                
                {/* Water Stress Line */}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="waterStress"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={false}
                  name="Moisture Stress"
                />
                
                {/* Precipitation Bars */}
                <Bar
                  yAxisId="right"
                  dataKey="precipitation"
                  fill="#3b82f6"
                  opacity={0.6}
                  name="Precipitation (mm)"
                  radius={[8, 8, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : null}

        {/* Critical Days Detail */}
        {wbiiData && wbiiData.timeSeries.filter(d => d.wbii > 60).length > 0 && (
          <div className="bg-white rounded-3xl shadow-lg border border-red-100 p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Critical Days Analysis (WBII &gt; 60)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wbiiData.timeSeries.filter(d => d.wbii > 60).map((day, idx) => {
                const heatStressLevel = getStressLevel(day.tempStress);
                const moistureStressLevel = getStressLevel(day.waterStress);
                
                return (
                  <div key={idx} className="bg-gradient-to-br from-red-50 to-orange-50 p-5 rounded-2xl border-2 border-red-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-bold text-gray-900">{formatChartDate(day.date)}</p>
                      <div className="flex items-center gap-2">
                        <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">
                          WBII: {day.wbii}
                        </span>
                        {day.isForecast && (
                          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                            Forecast
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center gap-1">
                          <ThermometerSun className="w-3.5 h-3.5" />
                          Temperature
                        </span>
                        <span className="font-medium text-gray-900">{day.tempMin}°C - {day.tempMax}°C</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-xs">Avg Temp</span>
                        <span className="font-medium text-gray-900">{day.tempAvg}°C</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Droplets className="w-3.5 h-3.5" />
                          Rainfall
                        </span>
                        <span className="font-medium text-gray-900">{day.precipitation}mm</span>
                      </div>
                      <div className="border-t border-red-200 my-2"></div>
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500">Heat Stress</span>
                          <span className={`font-semibold ${heatStressLevel.color}`}>{day.tempStress}</span>
                        </div>
                        <p className={`text-xs ${heatStressLevel.color} text-right font-medium`}>{heatStressLevel.label}</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500">Moisture Stress</span>
                          <span className={`font-semibold ${moistureStressLevel.color}`}>{day.waterStress}</span>
                        </div>
                        <p className={`text-xs ${moistureStressLevel.color} text-right font-medium`}>{moistureStressLevel.label}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">How to Use This Dashboard</h4>
              <p className="text-sm text-gray-700">
                Select a farm to view its 3-month WBII analysis plus 10-day forecast. Spikes in the graph indicate periods of high agricultural stress. 
                Use this information to plan irrigation, pest control, and other farm management activities. 
                Critical days (WBII &gt; 60) require immediate attention and protective measures.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WBIIDashboard;