import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosInstance';
import { 
  AlertTriangle, Cloud, Wind, Droplets, ThermometerSun, 
  Bug, MapPin, Phone, Calendar, Send, RefreshCw, CheckCircle, XCircle 
} from 'lucide-react';

const PEST_TO_CROPS = {
  // Maize/Corn pests
  "Fall Armyworm": ["Maize", "Corn", "Sorghum", "Millet"],
  "Stem Borers": ["Maize", "Corn", "Rice", "Sorghum", "Sugarcane"],
  "Corn Earworm": ["Maize", "Corn", "Tomato", "Cotton", "Sorghum"],
  "Black Cutworm": ["Maize", "Corn", "Beans", "Vegetables", "Tobacco", "Cassava"],
  
  // Coffee pests
  "Coffee Berry Borer": ["Coffee"],
  "Coffee Leaf Miner": ["Coffee"],
  
  // Generalist pests (multiple crops)
  "Aphids": ["Beans", "Coffee", "Maize", "Corn", "Cassava", "Vegetables", "Groundnut", "Soybean", "Cabbage", "Tomato"],
  
  // Fruit tree pests
  "Peach Twig Borer": ["Peach", "Apple", "Fruit Trees", "Plum", "Apricot", "Mango"]
};

const AlertMessaging = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingStatus, setSendingStatus] = useState({});
  const [selectedAlerts, setSelectedAlerts] = useState([]);
  const [sendToFarmers, setSendToFarmers] = useState(true);
  const [sendToAdmin, setSendToAdmin] = useState(true);

  const fetchFarms = async () => {
    try {
      const response = await axiosInstance.get('/api/farm/');
      return response.data;
    } catch (error) {
      console.error('Error fetching farms:', error);
      return [];
    }
  };

  const fetchWeatherData = async (lat, lon) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&forecast_days=10`;
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error('Error fetching weather:', error);
      return null;
    }
  };

  const getDayName = (dateString) => {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const detectWeatherAnomalies = (data) => {
    const alerts = [];
    const hours = data.hourly || {};
    const time = hours.time || [];
    const temperature = hours.temperature_2m || [];
    const humidity = hours.relative_humidity_2m || [];
    const precipitation = hours.precipitation || [];
    const wind_speed = hours.wind_speed_10m || [];

    const TEMP_THRESHOLD_LOW = 15;
    const TEMP_THRESHOLD_HIGH = 30;
    const HEAVY_RAIN_THRESHOLD = 10;
    const STRONG_WIND_THRESHOLD = 20;
    const DRYNESS_HUMIDITY_THRESHOLD = 30;

    const dailyData = {};
    
    for (let i = 0; i < time.length; i++) {
      const date = new Date(time[i]);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date: dateKey,
          dayName: getDayName(time[i]),
          alerts: new Set(),
          maxTemp: temperature[i],
          minTemp: temperature[i],
          totalPrecipitation: 0,
          maxWindSpeed: 0,
          minHumidity: 100
        };
      }
      
      const day = dailyData[dateKey];
      day.maxTemp = Math.max(day.maxTemp, temperature[i]);
      day.minTemp = Math.min(day.minTemp, temperature[i]);
      day.totalPrecipitation += precipitation[i] || 0;
      day.maxWindSpeed = Math.max(day.maxWindSpeed, wind_speed[i]);
      day.minHumidity = Math.min(day.minHumidity, humidity[i]);
      
      if (precipitation[i] > HEAVY_RAIN_THRESHOLD) day.alerts.add("Heavy Rain");
      if (temperature[i] > TEMP_THRESHOLD_HIGH) day.alerts.add("Extreme Heat");
      if (temperature[i] < TEMP_THRESHOLD_LOW) day.alerts.add("Extreme Cold");
      if (wind_speed[i] > STRONG_WIND_THRESHOLD) day.alerts.add("Strong Wind");
      if (humidity[i] < DRYNESS_HUMIDITY_THRESHOLD) day.alerts.add("Dryness Alert");
    }

    Object.values(dailyData).forEach(day => {
      if (day.alerts.size > 0) {
        alerts.push({
          date: day.date,
          dayName: day.dayName,
          formattedDate: formatDate(day.date),
          alerts: Array.from(day.alerts),
          maxTemp: Math.round(day.maxTemp * 10) / 10,
          minTemp: Math.round(day.minTemp * 10) / 10,
          totalPrecipitation: Math.round(day.totalPrecipitation * 10) / 10,
          maxWindSpeed: Math.round(day.maxWindSpeed * 10) / 10,
          minHumidity: Math.round(day.minHumidity * 10) / 10
        });
      }
    });

    return alerts;
  };

  const detectPestAlerts = (data) => {
    const alerts = [];
    const hours = data.hourly || {};
    const times = hours.time || [];
    const temperatures = hours.temperature_2m || [];

    const GDD_BASE_TEMP = 10;
    const PEST_GDD_THRESHOLDS = {
      "Fall Armyworm": 140,
      "Aphids": 100,
      "Stem Borers": 180,
      "Corn Earworm": 220,
      "Black Cutworm": 280,
      "Peach Twig Borer": 350,
      "Coffee Berry Borer": 120,
      "Coffee Leaf Miner": 150 
    };

    let gdd_cumulative = 0;
    const triggered_pests = new Set();

    for (let i = 0; i < times.length; i++) {
      const temp = temperatures[i];
      if (temp == null) continue;

      const gdd = Math.max(0, temp - GDD_BASE_TEMP);
      gdd_cumulative += gdd;

      const current_alerts = [];
      for (const [pest, threshold] of Object.entries(PEST_GDD_THRESHOLDS)) {
        if (gdd_cumulative >= threshold && !triggered_pests.has(pest)) {
          current_alerts.push(pest);
          triggered_pests.add(pest);
        }
      }

      if (current_alerts.length > 0) {
        alerts.push({
          time: new Date(times[i]).toLocaleString(),
          dayName: getDayName(times[i]),
          formattedDate: formatDate(times[i]),
          alerts: current_alerts,
          gdd: Math.round(gdd_cumulative * 10) / 10,
          temperature: temp
        });
      }
    }

    return alerts;
  };

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const farmsResponse = await fetchFarms();
      let farms = [];
      
      if (Array.isArray(farmsResponse)) {
        farms = farmsResponse;
      } else if (farmsResponse?.farms) {
        farms = farmsResponse.farms;
      } else if (farmsResponse?.data) {
        farms = farmsResponse.data;
      } else if (farmsResponse?.items) {
        farms = farmsResponse.items;
      }
      
      if (farms.length === 0) {
        setAlerts([]);
        return;
      }
      
      const results = [];
      for (const farm of farms) {
        try {
          if (!farm.geolocation) continue;
          
          const [lat, lon] = farm.geolocation.split(',').map(c => parseFloat(c.trim()));
          if (isNaN(lat) || isNaN(lon)) continue;

          // ✅ Fetch farm crops
          let farmCrops = [];
          try {
            const farmDataResponse = await axiosInstance.get(`/api/farmdata/?farm_id=${farm.id}`);
            if (farmDataResponse.data?.farmdata_list) {
              const cropIds = farmDataResponse.data.farmdata_list.map(fd => fd.crop_id);
              const uniqueCropIds = [...new Set(cropIds)];
              
              for (const cropId of uniqueCropIds) {
                const cropResponse = await axiosInstance.get(`/api/crop/${cropId}`);
                if (cropResponse.data?.name) {
                  farmCrops.push(cropResponse.data.name);
                }
              }
            }
          } catch (error) {
            console.error(`Error fetching crops for farm ${farm.name}:`, error);
          }

          const weatherData = await fetchWeatherData(lat, lon);
          if (!weatherData) continue;

          const weather_alerts = detectWeatherAnomalies(weatherData);
          let pest_alerts = detectPestAlerts(weatherData);

          // ✅ Filter pest alerts based on farm crops
          if (farmCrops.length > 0) {
            pest_alerts = pest_alerts.map(alert => ({
              ...alert,
              alerts: alert.alerts.filter(pestName => {
                const affectedCrops = PEST_TO_CROPS[pestName] || [];
                return affectedCrops.some(crop => farmCrops.includes(crop));
              })
            })).filter(alert => alert.alerts.length > 0);
          }

          if (weather_alerts.length > 0 || pest_alerts.length > 0) {
            results.push({
              farm: {
                id: farm.id,
                name: farm.name,
                geolocation: farm.geolocation,
                phonenumber: farm.phonenumber1 || farm.phonenumber,
                crops: farmCrops
              },
              weather_alerts,
              pest_alerts
            });
          }
        } catch (error) {
          console.error(`Error for ${farm.name}:`, error);
        }
      }
      setAlerts(results);
    } catch (error) {
      console.error('General error:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

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

  // ✅ NEW UNIFIED MESSAGE GENERATION
  const generateAlertMessage = (farmName, weatherAlerts, pestAlerts) => {
    const parts = [];
    
    // WEATHER - Top 3 alerts
    if (weatherAlerts.length > 0) {
      const alertsByType = {};
      weatherAlerts.forEach(day => {
        day.alerts.forEach(type => {
          if (!alertsByType[type]) alertsByType[type] = 0;
          alertsByType[type]++;
        });
      });
      
      const shortNames = {
        "Heavy Rain": "Rain",
        "Extreme Heat": "Heat",
        "Extreme Cold": "Cold",
        "Strong Wind": "Wind",
        "Dryness Alert": "Dry"
      };
      
      const weatherParts = Object.entries(alertsByType)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([type, count]) => {
          if (count === 1) {
            const day = weatherAlerts.find(w => w.alerts.includes(type));
            return `${shortNames[type]} ${day.dayName.slice(0,3)}`;
          } else {
            return `${shortNames[type]} x${count}d`;
          }
        });
      
      parts.push(...weatherParts);
    }
    
    // PESTS - Only first one detected
    if (pestAlerts.length > 0) {
      const firstPest = pestAlerts[0].alerts[0].split(' ')[0];
      parts.push(`PEST: ${firstPest}`);
    }
    
    return `${farmName}: ${parts.join(', ')}`;
  };

  const sendSelectedAlerts = async () => {
    if (selectedAlerts.length === 0) {
      alert('Please select at least one alert');
      return;
    }

    setSendingStatus({ sending: true });
    const adminPhone = "256783130358";
    let successCount = 0;
    let totalSent = 0;

    for (const alertIndex of selectedAlerts) {
      const alert = alerts[alertIndex];
      if (!alert) continue;

      const cleanText = (text) => text.replace(/[^\x00-\x7F]/g, '').replace(/\s+/g, ' ').trim();

      // ✅ Generate single unified message
      let message = generateAlertMessage(
        alert.farm.name, 
        alert.weather_alerts || [], 
        alert.pest_alerts || []
      );
      message = cleanText(message);

      // Send only if there's something to send
      if (message.includes(':') && message.split(':')[1].trim()) {
        const recipients = [];
        if (sendToAdmin) recipients.push(adminPhone);
        if (sendToFarmers && alert.farm.phonenumber) recipients.push(alert.farm.phonenumber);

        for (const phone of recipients) {
          totalSent++;
          if (await sendSMS(phone, message)) successCount++;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    setSendingStatus({ sending: false, completed: true, success: successCount, total: totalSent });
    setTimeout(() => setSendingStatus({}), 5000);
  };

  const toggleAlert = (index) => {
    setSelectedAlerts(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const selectAllAlerts = () => {
    setSelectedAlerts(selectedAlerts.length === alerts.length ? [] : alerts.map((_, i) => i));
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getAlertIcon = (type) => {
    const icons = {
      "Heavy Rain": <Droplets className="w-4 h-4" />,
      "Extreme Heat": <ThermometerSun className="w-4 h-4" />,
      "Extreme Cold": <ThermometerSun className="w-4 h-4" />,
      "Strong Wind": <Wind className="w-4 h-4" />,
      "Dryness Alert": <Cloud className="w-4 h-4" />
    };
    return icons[type] || <AlertTriangle className="w-4 h-4" />;
  };

  const getAlertColor = (type) => {
    const colors = {
      "Heavy Rain": "bg-blue-100 text-blue-800 border-blue-200",
      "Extreme Heat": "bg-red-100 text-red-800 border-red-200",
      "Extreme Cold": "bg-cyan-100 text-cyan-800 border-cyan-200",
      "Strong Wind": "bg-purple-100 text-purple-800 border-purple-200",
      "Dryness Alert": "bg-orange-100 text-orange-800 border-orange-200"
    };
    return colors[type] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Agricultural Alert System</h1>
              <p className="text-gray-500 text-sm">Monitor weather and pest risks across your farms</p>
            </div>
            <button 
              onClick={fetchAlerts} 
              disabled={loading}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {/* Configuration */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Send className="w-5 h-5" />
            Message Configuration
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide">Recipients</h4>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-200 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={sendToAdmin}
                    onChange={(e) => setSendToAdmin(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <div className="flex-1">
                    <span className="text-gray-900 font-medium">Administrator</span>
                    <p className="text-xs text-gray-500 mt-1">Send alerts to system administrator</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-200 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={sendToFarmers}
                    onChange={(e) => setSendToFarmers(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <div className="flex-1">
                    <span className="text-gray-900 font-medium">Farm Owners</span>
                    <p className="text-xs text-gray-500 mt-1">Send alerts to individual farmers</p>
                  </div>
                </label>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide">Message Preview</h4>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Example Format</p>
                <div className="space-y-2 font-mono text-sm text-gray-700">
                  <p className="bg-white p-3 rounded-lg shadow-sm">
                    FarmName: Rain x10d, Heat x3d, PEST: Fall
                  </p>
                  <p className="bg-white p-3 rounded-lg shadow-sm">
                    FarmName: Wind x5d, PEST: Coffee
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={selectAllAlerts}
                disabled={alerts.length === 0}
                className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl font-medium"
              >
                {selectedAlerts.length === alerts.length ? 'Deselect All' : 'Select All'}
              </button>
              
              <div className="text-sm">
                <span className="font-semibold text-gray-900">{selectedAlerts.length}</span>
                <span className="text-gray-500"> of </span>
                <span className="font-semibold text-gray-900">{alerts.length}</span>
                <span className="text-gray-500"> selected</span>
              </div>
            </div>
            
            <button 
              onClick={sendSelectedAlerts}
              disabled={selectedAlerts.length === 0 || sendingStatus.sending || (!sendToAdmin && !sendToFarmers)}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-xl font-medium shadow-sm"
            >
              {sendingStatus.sending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sending Messages...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send {selectedAlerts.length > 0 ? `(${selectedAlerts.length})` : 'Alerts'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status */}
        {sendingStatus.completed && (
          <div className={`rounded-2xl shadow-sm border p-6 ${
            sendingStatus.success === sendingStatus.total 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center gap-3">
              {sendingStatus.success === sendingStatus.total ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-yellow-600" />
              )}
              <div>
                <p className={`font-semibold ${
                  sendingStatus.success === sendingStatus.total ? 'text-green-900' : 'text-yellow-900'
                }`}>
                  {sendingStatus.success === sendingStatus.total ? 'Success!' : 'Partially Completed'}
                </p>
                <p className={`text-sm ${
                  sendingStatus.success === sendingStatus.total ? 'text-green-700' : 'text-yellow-700'
                }`}>
                  {sendingStatus.success} of {sendingStatus.total} messages sent
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alerts List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Active Alerts
            </h3>
            <span className="text-sm text-gray-500">10-day forecast</span>
          </div>
          
          {loading ? (
            <div className="flex flex-col justify-center items-center py-20">
              <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-lg text-gray-600 font-medium">Loading weather data...</p>
              <p className="text-sm text-gray-400 mt-2">Analyzing conditions across all farms</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">All Clear</h4>
              <p className="text-gray-500">No active weather or pest alerts</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {alerts.map((alert, index) => (
                <div 
                  key={`${alert.farm.id}-${index}`}
                  className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                    selectedAlerts.includes(index) 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={() => toggleAlert(index)}
                >
                  <div className="flex items-start gap-4 mb-6">
                    <input
                      type="checkbox"
                      checked={selectedAlerts.includes(index)}
                      onChange={() => toggleAlert(index)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 w-5 h-5 text-blue-600 rounded"
                    />
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900 mb-2">{alert.farm.name}</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{alert.farm.geolocation}</span>
                        </div>
                        {alert.farm.phonenumber && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>{alert.farm.phonenumber}</span>
                          </div>
                        )}
                        {alert.farm.crops && alert.farm.crops.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Bug className="w-4 h-4" />
                            <span className="capitalize">{alert.farm.crops.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Weather Alerts */}
                  {alert.weather_alerts?.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Cloud className="w-4 h-4 text-blue-600" />
                        <h5 className="font-semibold text-gray-900 text-sm">Weather Conditions</h5>
                      </div>
                      <div className="space-y-3">
                        {alert.weather_alerts.map((wa, i) => (
                          <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-3.5 h-3.5 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">
                                {wa.dayName}, {wa.formattedDate}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {wa.alerts.map((type, j) => (
                                <span key={j} className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${getAlertColor(type)}`}>
                                  {getAlertIcon(type)}
                                  {type}
                                </span>
                              ))}
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                              <div className="flex items-center gap-1.5">
                                <ThermometerSun className="w-3.5 h-3.5" />
                                <span>{wa.minTemp}°C - {wa.maxTemp}°C</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Droplets className="w-3.5 h-3.5" />
                                <span>{wa.minHumidity}% humidity</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Cloud className="w-3.5 h-3.5" />
                                <span>{wa.totalPrecipitation}mm rain</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Wind className="w-3.5 h-3.5" />
                                <span>{wa.maxWindSpeed}km/h wind</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pest Alerts */}
                  {alert.pest_alerts?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Bug className="w-4 h-4 text-orange-600" />
                        <h5 className="font-semibold text-gray-900 text-sm">Pest Risks</h5>
                      </div>
                      <div className="space-y-3">
                        {alert.pest_alerts.map((pa, i) => (
                          <div key={i} className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-3.5 h-3.5 text-orange-600" />
                              <span className="text-sm font-medium text-gray-700">
                                {pa.dayName}, {pa.formattedDate}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                              <span>GDD: {pa.gdd}</span>
                              <span>Temp: {pa.temperature}°C</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {pa.alerts.map((pest, j) => (
                                <span key={j} className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-800 text-xs px-2.5 py-1 rounded-full border border-orange-200">
                                  <Bug className="w-3.5 h-3.5" />
                                  {pest}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertMessaging;
