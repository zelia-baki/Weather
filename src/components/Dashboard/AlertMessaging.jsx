import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosInstance';

const AlertMessaging = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingStatus, setSendingStatus] = useState({});
  const [selectedAlerts, setSelectedAlerts] = useState([]);
  const [customMessage, setCustomMessage] = useState('');
  const [sendToFarmers, setSendToFarmers] = useState(true);
  const [sendToAdmin, setSendToAdmin] = useState(true);

  // Weather alert descriptions (in English)
  const ALERT_DESCRIPTIONS = {
    "Strong Wind": "Strong winds expected. Secure or cover your crops and keep them safe.",
    "Extreme Heat": "Extreme heat conditions. Water your crops and stay in shade.",
    "Heavy Rain": "Heavy rainfall expected. Check water drainage and cover young crops.",
    "Cold Temperatures": "Cold weather conditions. Cover crops to keep them warm.",
    "Extreme Cold": "Extreme cold conditions. Protect your crops from frost.",
    "Storm": "Storm conditions. Stay indoors and protect your farm.",
    "Dryness Alert": "Drought alert. Increase watering of your crops."
  };

  // Pest alert descriptions (in English)
  const PEST_ALERT_DESCRIPTIONS = {
    "Fall Armyworm": "Fall armyworm development due to environmental conditions. Monitor crops for leaf damage and take preventive measures.",
    "Aphids": "Possible aphid activity due to environmental conditions. Inspect for sticky residue on leaves and consider appropriate treatment measures.",
    "Stem Borers": "Stem borer risk due to environmental conditions. Inspect stems for holes or damage and implement necessary corrective actions.",
    "Corn Earworm": "Corn earworm risk due to environmental conditions. Conduct spot inspections for tunneling in kernels and take corrective measures.",
    "Black Cutworm": "Black cutworm risk due to environmental conditions. Check for feeding holes in leaves, cut stems, wilted plants and take corrective measures.",
    "Peach Twig Borer": "Peach twig borer risk due to environmental conditions. Conduct spot inspections for wilting of young shoots.",
    "Coffee Berry Borer": "Coffee berry borer development due to environmental conditions. Check for fruit drop of young green cherries and inspect cherries on branches.",
    "Coffee Leaf Miner": "Coffee leaf miner development favored by environmental conditions. Monitor for serpentine leaf mines on young coffee leaves and check for premature leaf drop."

  };

  // Récupérer les fermes depuis l'API
  const fetchFarms = async () => {
    try {
      console.log('[DEBUG] Tentative de récupération des fermes...');
      const response = await axiosInstance.get('/api/farm/');
      console.log('[DEBUG] Réponse API fermes:', response);
      console.log('[DEBUG] Données fermes:', response.data);
      return response.data;
    } catch (error) {
      console.error('[ERREUR] Lors de la récupération des fermes:', error);
      console.error('[ERREUR] Status:', error.response?.status);
      console.error('[ERREUR] Data:', error.response?.data);
      console.error('[ERREUR] Message:', error.message);
      return [];
    }
  };

  // Récupérer les données météo pour une ferme
  const fetchWeatherData = async (lat, lon) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&forecast_days=10`;
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error('Erreur récupération météo:', error);
      return null;
    }
  };

  // Détecter les anomalies météo (basé sur alerts.py)
  const detectWeatherAnomalies = (data) => {
    const alerts = [];
    const hours = data.hourly || {};
    
    const time = hours.time || [];
    const temperature = hours.temperature_2m || [];
    const humidity = hours.relative_humidity_2m || [];
    const precipitation = hours.precipitation || [];
    const wind_speed = hours.wind_speed_10m || [];

    // Seuils météo (basés sur alerts.py)
    const TEMP_THRESHOLD_LOW = 15;
    const TEMP_THRESHOLD_HIGH = 30;
    const HEAVY_RAIN_THRESHOLD = 10;
    const STRONG_WIND_THRESHOLD = 20;
    const DRYNESS_HUMIDITY_THRESHOLD = 30;

    for (let i = 0; i < time.length; i++) {
      const alert_types = [];

      if (precipitation[i] > HEAVY_RAIN_THRESHOLD) {
        alert_types.push("Heavy Rain");
      }
      if (temperature[i] > TEMP_THRESHOLD_HIGH) {
        alert_types.push("Extreme Heat");
      }
      if (temperature[i] < TEMP_THRESHOLD_LOW) {
        alert_types.push("Extreme Cold");
      }
      if (wind_speed[i] > STRONG_WIND_THRESHOLD) {
        alert_types.push("Strong Wind");
      }
      if (humidity[i] < DRYNESS_HUMIDITY_THRESHOLD) {
        alert_types.push("Dryness Alert");
      }

      if (alert_types.length > 0) {
        alerts.push({
          time: new Date(time[i]).toLocaleString(),
          alerts: alert_types,
          temperature: temperature[i],
          humidity: humidity[i],
          precipitation: precipitation[i],
          wind_speed: wind_speed[i]
        });
      }
    }

    return alerts;
  };

  // Détecter les alertes parasitaires (basé sur alertspest.py)
  const detectPestAlerts = (data) => {
    const alerts = [];
    const hours = data.hourly || {};
    const times = hours.time || [];
    const temperatures = hours.temperature_2m || [];

    // Seuils GDD pour les ravageurs (basés sur alertspest.py)
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
          alerts: current_alerts,
          gdd: Math.round(gdd_cumulative * 10) / 10,
          temperature: temp
        });
      }
    }

    return alerts;
  };

  // Récupérer et analyser toutes les alertes
  const fetchAlerts = async () => {
    console.log('[DEBUG] ===== DÉBUT FETCH ALERTS =====');
    setLoading(true);
    try {
      // Récupérer toutes les fermes
      console.log('[DEBUG] 1. Récupération des fermes...');
      const farmsResponse = await fetchFarms();
      console.log('[DEBUG] 2. Réponse fermes reçue:', farmsResponse);
      
      // Essayer différentes structures de réponse
      let farms = [];
      if (Array.isArray(farmsResponse)) {
        farms = farmsResponse;
      } else if (farmsResponse && farmsResponse.farms) {
        farms = farmsResponse.farms;
      } else if (farmsResponse && farmsResponse.data) {
        farms = farmsResponse.data;
      } else if (farmsResponse && Array.isArray(farmsResponse.items)) {
        farms = farmsResponse.items;
      }
      
      console.log('[DEBUG] 3. Fermes extraites:', farms);
      console.log('[DEBUG] 4. Nombre de fermes:', farms.length);
      
      if (farms.length === 0) {
        console.log('[WARNING] Aucune ferme trouvée!');
        setAlerts([]);
        return;
      }
      
      const results = [];

      for (let i = 0; i < farms.length; i++) {
        const farm = farms[i];
        console.log(`[DEBUG] 5.${i+1}. Traitement ferme:`, farm);
        
        try {
          // Extraire les coordonnées
          if (!farm.geolocation) {
            console.log(`[WARNING] Pas de géolocalisation pour ${farm.name || 'ferme inconnue'}`);
            continue;
          }
          
          console.log(`[DEBUG] Géolocalisation: ${farm.geolocation}`);
          const [lat, lon] = farm.geolocation.split(',').map(coord => parseFloat(coord.trim()));
          
          if (isNaN(lat) || isNaN(lon)) {
            console.log(`[ERROR] Coordonnées invalides: lat=${lat}, lon=${lon}`);
            continue;
          }
          
          console.log(`[DEBUG] Coordonnées valides: lat=${lat}, lon=${lon}`);

          // Récupérer les données météo
          console.log(`[DEBUG] Récupération météo pour ${farm.name}...`);
          const weatherData = await fetchWeatherData(lat, lon);
          if (!weatherData) {
            console.log(`[ERROR] Pas de données météo pour ${farm.name}`);
            continue;
          }
          
          console.log(`[DEBUG] Données météo reçues pour ${farm.name}:`, weatherData.hourly ? 'OK' : 'VIDE');

          // Détecter les alertes météo et parasitaires
          console.log(`[DEBUG] Détection alertes météo pour ${farm.name}...`);
          const weather_alerts = detectWeatherAnomalies(weatherData);
          console.log(`[DEBUG] Alertes météo trouvées: ${weather_alerts.length}`, weather_alerts);
          
          console.log(`[DEBUG] Détection alertes parasitaires pour ${farm.name}...`);
          const pest_alerts = detectPestAlerts(weatherData);
          console.log(`[DEBUG] Alertes parasitaires trouvées: ${pest_alerts.length}`, pest_alerts);

          // Ajouter aux résultats si il y a des alertes
          if (weather_alerts.length > 0 || pest_alerts.length > 0) {
            console.log(`[SUCCESS] Ferme ${farm.name} a des alertes!`);
            results.push({
              farm: {
                id: farm.id,
                name: farm.name,
                geolocation: farm.geolocation,
                phonenumber: farm.phonenumber1 || farm.phonenumber,
                phonenumber2: farm.phonenumber2
              },
              weather_alerts,
              pest_alerts
            });
          } else {
            console.log(`[INFO] Aucune alerte pour ${farm.name}`);
          }
        } catch (error) {
          console.error(`[ERROR] Erreur pour la ferme ${farm.name}:`, error);
        }
      }

      console.log(`[DEBUG] 6. Total résultats: ${results.length}`, results);
      setAlerts(results);
      console.log('[DEBUG] ===== FIN FETCH ALERTS =====');
    } catch (error) {
      console.error('[ERROR] Erreur générale lors de la récupération des alertes:', error);
      alert('Erreur lors de la récupération des alertes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

// Envoyer un SMS à un numéro spécifique
  const sendSMS = async (phone, message) => {
    try {
      // Limiter la taille du message à 160 caractères
      const truncatedMessage = message.substring(0, 160);
      const response = await axiosInstance.post('/api/notifications/sms', {
        phone: phone,
        message: truncatedMessage
      });
      return response.status === 200;
    } catch (error) {
      console.error('Erreur envoi SMS:', error);
      return false;
    }
  };

  // Send selected alerts
  const sendSelectedAlerts = async () => {
    if (selectedAlerts.length === 0) {
      alert('Please select at least one alert to send');
      return;
    }

    setSendingStatus({ sending: true });
    const adminPhone = "256783130358";
    let successCount = 0;
    let totalSent = 0;

    for (const alertIndex of selectedAlerts) {
      const alert = alerts[alertIndex];
      if (!alert) continue;

      // Function to clean text from special characters and emojis
      const cleanText = (text) => {
        return text
          .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
          .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc symbols
          .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport
          .replace(/[\u{1F700}-\u{1F77F}]/gu, '') // Alchemical
          .replace(/[\u{1F780}-\u{1F7FF}]/gu, '') // Geometric
          .replace(/[\u{1F800}-\u{1F8FF}]/gu, '') // Supplemental
          .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental
          .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Extended symbols
          .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Extended symbols
          .replace(/[\u{2600}-\u{26FF}]/gu, '')  // Misc symbols
          .replace(/[\u{2700}-\u{27BF}]/gu, '')  // Dingbats
          .replace(/[^\x00-\x7F]/g, '') // Remove all non-ASCII characters
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .trim();
      };

// Combine all alerts into two messages: one for weather, one for pests
      let weatherSummary = '';
      let pestSummary = '';

      // Build weather summary
      if (alert.weather_alerts && alert.weather_alerts.length > 0) {
        // Combine all unique weather alert types
        const allWeatherAlerts = alert.weather_alerts.flatMap(wa => wa.alerts);
        const uniqueWeatherAlerts = Array.from(new Set(allWeatherAlerts));
        weatherSummary = cleanText(
          `WEATHER ALERT for ${alert.farm.name}: ${uniqueWeatherAlerts.join(', ')}.`
        );
      }

      // Build pest summary
      if (alert.pest_alerts && alert.pest_alerts.length > 0) {
        // Combine all unique pest alert types
        const allPestAlerts = alert.pest_alerts.flatMap(pa => pa.alerts);
        const uniquePestAlerts = Array.from(new Set(allPestAlerts));
        pestSummary = cleanText(
          `PEST ALERT for ${alert.farm.name}: ${uniquePestAlerts.join(', ')}.`
        );
      }

      // Ensure both messages are sent
      let messagesToSend = [];
      if (weatherSummary) {
        messagesToSend.push(weatherSummary);
      }
      if (pestSummary) {
        messagesToSend.push(pestSummary);
      }

      // Liste des destinataires
      const recipients = [];
      
      if (sendToAdmin) {
        recipients.push(adminPhone);
      }
      
      if (sendToFarmers) {
        if (alert.farm.phonenumber) {
          recipients.push(alert.farm.phonenumber);
        }
      }

      // Send each message separately to recipients
      for (const phone of recipients) {
        // Send each message individually
        for (const message of messagesToSend) {
          totalSent++;
          const success = await sendSMS(phone, message);
          if (success) {
            successCount++;
          }
          
          // Pause between messages
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    setSendingStatus({
      sending: false,
      completed: true,
      success: successCount,
      total: totalSent
    });

    setTimeout(() => {
      setSendingStatus({});
    }, 5000);
  };

  // Sélectionner/désélectionner une alerte
  const toggleAlert = (index) => {
    setSelectedAlerts(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  // Sélectionner toutes les alertes
  const selectAllAlerts = () => {
    if (selectedAlerts.length === alerts.length) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts(alerts.map((_, index) => index));
    }
  };

  // Charger les alertes au montage du composant
  useEffect(() => {
    fetchAlerts();
    
    // Actualiser automatiquement toutes les 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">
              Agricultural Alert System
            </h1>
            <button 
              onClick={fetchAlerts} 
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg font-medium transition duration-200 flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                <>Refresh</>
              )}
            </button>
          </div>
        </div>

        {/* Send Configuration */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Send Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Recipients</h4>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendToAdmin}
                  onChange={(e) => setSendToAdmin(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">Send to administrator</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendToFarmers}
                  onChange={(e) => setSendToFarmers(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">Send to farmers</span>
              </label>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Custom Message (optional)</h4>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Add a custom message that will be sent with the alerts..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Selection Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <button 
                onClick={selectAllAlerts}
                disabled={alerts.length === 0}
                className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
              >
                {selectedAlerts.length === alerts.length ? 'Deselect All' : 'Select All'}
              </button>
              
              <span className="text-gray-600 font-medium">
                {selectedAlerts.length} / {alerts.length} alerts selected
              </span>
            </div>
            
            <button 
              onClick={sendSelectedAlerts}
              disabled={selectedAlerts.length === 0 || sendingStatus.sending || (!sendToAdmin && !sendToFarmers)}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-medium transition duration-200 flex items-center"
            >
              {sendingStatus.sending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                <>Send ({selectedAlerts.length})</>
              )}
            </button>
          </div>
        </div>

        {/* Statut d'envoi */}
        {sendingStatus.completed && (
          <div className={`rounded-xl shadow-lg p-4 mb-6 ${
            sendingStatus.success === sendingStatus.total 
              ? 'bg-green-100 border border-green-300' 
              : 'bg-yellow-100 border border-yellow-300'
          }`}>
            <div className="flex items-center">
              <span className="text-2xl mr-3">
                {sendingStatus.success === sendingStatus.total ? '✅' : '⚠️'}
              </span>
              <span className={`font-medium ${
                sendingStatus.success === sendingStatus.total 
                  ? 'text-green-800' 
                  : 'text-yellow-800'
              }`}>
                Send completed: {sendingStatus.success}/{sendingStatus.total} messages sent successfully
              </span>
            </div>
          </div>
        )}

        {/* Alerts List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Available Alerts</h3>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex items-center space-x-3">
                <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-lg text-gray-600">Loading alerts...</span>
              </div>
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🌟</div>
              <h4 className="text-xl font-medium text-gray-600 mb-2">No active alerts currently</h4>
              <p className="text-gray-500">All your farms are safe!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {alerts.map((alert, index) => (
                <div 
                  key={`${alert.farm.id}-${index}`}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition duration-200 ${
                    selectedAlerts.includes(index) 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleAlert(index)}
                >
                  {/* Header de la carte */}
                  <div className="flex items-start space-x-3 mb-4">
                    <input
                      type="checkbox"
                      checked={selectedAlerts.includes(index)}
                      onChange={() => toggleAlert(index)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                        🏡 {alert.farm.name}
                      </h4>
                      <p className="text-sm text-gray-500 flex items-center">
                        📍 {alert.farm.geolocation}
                      </p>
                      {alert.farm.phonenumber && (
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                          📞 {alert.farm.phonenumber}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Contenu des alertes */}
                  <div className="space-y-4">
                    {/* Alertes météo */}
                    {alert.weather_alerts && alert.weather_alerts.length > 0 && (
                      <div className="bg-yellow-50 rounded-lg p-3">
                        <h5 className="font-medium text-gray-800 mb-2 flex items-center">
                          Weather Alerts
                        </h5>
                        {alert.weather_alerts.map((weatherAlert, wIndex) => (
                          <div key={wIndex} className="mb-3 last:mb-0">
                            <div className="text-sm text-gray-600 mb-2">
                              ⏰ {weatherAlert.time}
                            </div>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {weatherAlert.alerts.map((alertType, aIndex) => (
                                <span key={aIndex} className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                  {alertType}
                                </span>
                              ))}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                              <span>🌡️ {weatherAlert.temperature}°C</span>
                              <span>💧 {weatherAlert.humidity}%</span>
                              <span>🌧️ {weatherAlert.precipitation}mm</span>
                              <span>💨 {weatherAlert.wind_speed}km/h</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Alertes parasitaires */}
                    {alert.pest_alerts && alert.pest_alerts.length > 0 && (
                      <div className="bg-orange-50 rounded-lg p-3">
                        <h5 className="font-medium text-gray-800 mb-2 flex items-center">
                          Pest Alerts
                        </h5>
                        {alert.pest_alerts.map((pestAlert, pIndex) => (
                          <div key={pIndex} className="mb-3 last:mb-0">
                            <div className="text-sm text-gray-600 mb-2">
                              ⏰ {pestAlert.time}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                              <span>🌡️ GDD: {pestAlert.gdd}</span>
                              <span>🌡️ Temp: {pestAlert.temperature}°C</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {pestAlert.alerts.map((pest, pestIndex) => (
                                <span key={pestIndex} className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                                  🐛 {pest}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
