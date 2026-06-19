// WaterAdvisory.jsx
// Original fixes preserved:
//   Fix 1: source unifiée (daily endpoint) pour 24h + 10 jours → plus d'écart entre les deux panneaux
//   Fix 2: Kc par stade de croissance (ini/mid/end) selon FAO-56 → plus de surestimation sur café jeune
//   Fix 3: affichage mm/jour uniquement, plus de confusion mm/h
// Updated: 7-day → 10-day advisory window
// New: 30-day precipitation + ETc bar/line chart (Chart.js via react-chartjs-2)
// New: dynamic Kc — FAO-56 climate adjustment (RH min + wind) on Kc_mid/Kc_end,
//      plus a manual intra-stage progression slider that interpolates toward the next stage's Kc.

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { FiMapPin } from 'react-icons/fi';
import axiosInstance from '../../axiosInstance.jsx';
import * as turf from '@turf/turf';
import { WiDaySunny, WiHumidity, WiRain, WiWindy, WiCloud, WiSolarEclipse } from 'react-icons/wi';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

// ─────────────────────────────────────────────────────────────────────────────
// FAO-56 GROWTH STAGES
// ─────────────────────────────────────────────────────────────────────────────
export const GROWTH_STAGES = [
  { id: 'ini', label: 'Initial (Kc_ini)',     desc: 'Germination / young plants — sparse canopy' },
  { id: 'mid', label: 'Mid-season (Kc_mid)',  desc: 'Full canopy / flowering' },
  { id: 'end', label: 'Late season (Kc_end)', desc: 'Ripening / harvest' },
];

// Stage that follows each stage, used for intra-stage interpolation.
// 'ini' progresses toward 'mid'; 'mid' progresses toward 'end'; 'end' has nothing after it.
const NEXT_STAGE = { ini: 'mid', mid: 'end', end: null };

// Default crop height (m) used in the FAO-56 climate adjustment formula
// when no crop-specific height is available. 3m is a reasonable generic
// default for tree/shrub crops (e.g. coffee); adjust per-crop later if needed.
const DEFAULT_CROP_HEIGHT_M = 3;

// ─────────────────────────────────────────────────────────────────────────────
// FAO-56 CLIMATE ADJUSTMENT FOR Kc_mid / Kc_end
// Kc_adj = Kc_tab + [0.04(u2 - 2) - 0.004(RHmin - 45)] * (h / 3)^0.3
//   u2     = mean wind speed at 2m (m/s) — approximated from available wind data
//   RHmin  = mean minimum relative humidity (%) during the stage — approximated
//            from available average relative humidity (we don't have a true daily
//            min, so this is a practical estimate, not a strict FAO-56 RHmin)
//   h      = mean plant height (m) during the stage
// Only applied to Kc_mid and Kc_end, per FAO-56 (Kc_ini is not climate-adjusted).
// ─────────────────────────────────────────────────────────────────────────────
const adjustKcForClimate = (kcTab, windSpeed, humidity, cropHeight = DEFAULT_CROP_HEIGHT_M) => {
  if (kcTab === null || kcTab === undefined) return null;

  const u2 = windSpeed ?? 2;       // fallback to neutral 2 m/s if unknown
  const rhMin = humidity ?? 45;    // fallback to neutral 45% if unknown
  const h = cropHeight ?? DEFAULT_CROP_HEIGHT_M;

  const adjustment = (0.04 * (u2 - 2) - 0.004 * (rhMin - 45)) * Math.pow(h / 3, 0.3);
  return kcTab + adjustment;
};

// ─────────────────────────────────────────────────────────────────────────────
// RESOLVE ACTIVE Kc
// Combines:
//   1. FAO-56 climate adjustment (mid/end only)
//   2. Manual intra-stage progression slider (0-100%) — interpolates toward
//      the next stage's (climate-adjusted) Kc as the slider increases.
// ─────────────────────────────────────────────────────────────────────────────
const resolveActiveKc = (kcValues, stage, progressPct, windSpeed, humidity, defaultKc) => {
  if (!kcValues) return defaultKc;

  const rawCurrent = kcValues[stage] ?? kcValues.mid ?? defaultKc;
  const currentAdj = (stage === 'mid' || stage === 'end')
    ? adjustKcForClimate(rawCurrent, windSpeed, humidity)
    : rawCurrent; // Kc_ini not climate-adjusted

  const nextStage = NEXT_STAGE[stage];
  if (!nextStage || progressPct <= 0) {
    return currentAdj;
  }

  const rawNext = kcValues[nextStage];
  if (rawNext === null || rawNext === undefined) {
    return currentAdj; // nothing to interpolate toward
  }

  const nextAdj = (nextStage === 'mid' || nextStage === 'end')
    ? adjustKcForClimate(rawNext, windSpeed, humidity)
    : rawNext;

  const t = Math.min(100, Math.max(0, progressPct)) / 100;
  return currentAdj + (nextAdj - currentAdj) * t;
};

// ─────────────────────────────────────────────────────────────────────────────
// FUNCTION 1 — Net Water Deficit
// ─────────────────────────────────────────────────────────────────────────────
const calculateNetWaterDeficit = (dailyEtC, dailyPrecipitation, landSurface) => {
  if (dailyEtC === null || dailyPrecipitation === null || !landSurface) return null;

  const surface        = parseFloat(landSurface);
  const totalWaterNeed = dailyEtC * surface;
  const rainContrib    = dailyPrecipitation * surface;
  const netDeficitL    = Math.max(0, totalWaterNeed - rainContrib);
  const surplusL       = Math.max(0, rainContrib - totalWaterNeed);
  const netDeficitMm   = Math.max(0, dailyEtC - dailyPrecipitation);
  const coveragePct    = totalWaterNeed > 0
    ? Math.min(100, (rainContrib / totalWaterNeed) * 100)
    : 0;

  let status = 'critical';
  if (netDeficitL === 0)                       status = 'sufficient';
  else if (netDeficitL < totalWaterNeed * 0.3) status = 'light';

  return {
    totalWaterNeed:   totalWaterNeed.toFixed(0),
    rainContribution: rainContrib.toFixed(0),
    netDeficit:       netDeficitL.toFixed(0),
    netDeficitMm:     netDeficitMm.toFixed(2),
    surplus:          surplusL.toFixed(0),
    coveragePercent:  coveragePct.toFixed(0),
    status,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// FUNCTION 2 — Daily weather + 10-day advisory (unified daily endpoint)
// ─────────────────────────────────────────────────────────────────────────────
const fetchDailyWeatherAndAdvisory = async (latitude, longitude, kc = 0.95) => {
  const dailyUrl =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${latitude}&longitude=${longitude}` +
    `&daily=precipitation_sum,et0_fao_evapotranspiration_sum,` +
    `temperature_2m_max,temperature_2m_min` +
    `&hourly=temperature_2m,relative_humidity_2m,` +
    `shortwave_radiation,wind_speed_1000hPa` +
    `&timezone=auto&forecast_days=10`;

  try {
    const response = await fetch(dailyUrl);
    const data     = await response.json();

    const todayEt0  = data.daily.et0_fao_evapotranspiration_sum[0] ?? 0;
    const todayEtC  = todayEt0 * kc;
    const todayRain = data.daily.precipitation_sum[0] ?? 0;
    const todayTMax = data.daily.temperature_2m_max[0] ?? null;
    const todayTMin = data.daily.temperature_2m_min[0] ?? null;

    const currentHour = new Date().toISOString().slice(0, 13) + ':00';
    const startIndex  = data.hourly.time.indexOf(currentHour);
    const next24      = data.hourly.time
      .map((t, i) => ({ t, i }))
      .filter(x => x.i >= startIndex && x.i < startIndex + 24);

    const avg = (key) =>
      next24.length > 0
        ? next24.reduce((s, x) => s + (data.hourly[key][x.i] ?? 0), 0) / next24.length
        : null;

    const weeklyAdvisory = data.daily.time.map((date, i) => {
      const et0Day      = data.daily.et0_fao_evapotranspiration_sum[i] ?? 0;
      const etcDay      = et0Day * kc;
      const rainDay     = data.daily.precipitation_sum[i] ?? 0;
      const netDeficitMm = Math.max(0, etcDay - rainDay);

      let status = 'no_irrigation';
      if (netDeficitMm > 0 && netDeficitMm < etcDay * 0.5) status = 'light';
      else if (netDeficitMm >= etcDay * 0.5)               status = 'irrigate';

      return {
        date,
        tempMax:       data.daily.temperature_2m_max[i]  ?? null,
        tempMin:       data.daily.temperature_2m_min[i]  ?? null,
        et0:           et0Day.toFixed(2),
        etc:           etcDay.toFixed(2),
        rain:          rainDay.toFixed(1),
        netDeficitMm:  netDeficitMm.toFixed(2),
        status,
      };
    });

    return {
      todayWeather: {
        temperature:        avg('temperature_2m'),
        humidity:           avg('relative_humidity_2m'),
        shortwaveRadiation: avg('shortwave_radiation'),
        windSpeed:          avg('wind_speed_1000hPa'),
        tempMax:            todayTMax,
        tempMin:            todayTMin,
        precipitation:      todayRain,
        dailyEt0:           todayEt0,
        dailyEtC:           todayEtC,
      },
      weeklyAdvisory,
    };
  } catch (error) {
    console.error('Failed to fetch daily weather + advisory:', error);
    return { todayWeather: null, weeklyAdvisory: [] };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FUNCTION 3 — 30-day historical precipitation + ETc
// Uses past_days=29 + forecast_days=1 to get a full rolling 30-day window.
// ─────────────────────────────────────────────────────────────────────────────
const fetchMonthlyPrecipitation = async (latitude, longitude, kc = 0.95) => {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${latitude}&longitude=${longitude}` +
    `&daily=precipitation_sum,et0_fao_evapotranspiration_sum` +
    `&timezone=auto&past_days=29&forecast_days=1`;

  try {
    const response = await fetch(url);
    const data     = await response.json();

    const labels = data.daily.time.map(t => {
      const d = new Date(t + 'T00:00:00');
      return d.getDate() + '/' + (d.getMonth() + 1);
    });

    const rain = data.daily.precipitation_sum.map(v => v ?? 0);
    const etc  = data.daily.et0_fao_evapotranspiration_sum.map(v =>
      v != null ? parseFloat((v * kc).toFixed(2)) : 0
    );

    return { labels, rain, etc };
  } catch (error) {
    console.error('Failed to fetch monthly precipitation:', error);
    return { labels: [], rain: [], etc: [] };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const WaterAdvisory = () => {
  const mapContainerRef = useRef(null);
  const mapRef          = useRef(null);
  const popupRef        = useRef(null);

  const [notification,    setNotification]    = useState(null);
  const [placeName,       setPlaceName]       = useState('');

  const [temperature,        setTemperature]        = useState(null);
  const [humidity,           setHumidity]           = useState(null);
  const [shortwaveRadiation, setShortwaveRadiation] = useState(null);
  const [windSpeed,          setWindSpeed]          = useState(null);

  const [dailyPrecipitation, setDailyPrecipitation] = useState(null);
  const [dailyEt0,           setDailyEt0]           = useState(null);
  const [dailyEtC,           setDailyEtC]           = useState(null);

  const [netWaterDeficit, setNetWaterDeficit] = useState(null);
  const [weeklyAdvisory,  setWeeklyAdvisory]  = useState([]);
  const [loadingWeekly,   setLoadingWeekly]   = useState(false);

  // ── 30-day chart state ────────────────────────────────────────────────────
  const [monthlyLabels,   setMonthlyLabels]   = useState([]);
  const [monthlyRain,     setMonthlyRain]     = useState([]);
  const [monthlyEtc,      setMonthlyEtc]      = useState([]);
  const [loadingMonthly,  setLoadingMonthly]  = useState(false);

  const [cropsList,      setCropsList]      = useState([]);
  const [selectedCrop,   setSelectedCrop]   = useState('');
  const [kcValues,       setKcValues]       = useState({ ini: null, mid: null, end: null });
  const [growthStage,    setGrowthStage]    = useState('mid');
  const [stageProgress,  setStageProgress]  = useState(0); // 0-100, manual intra-stage slider
  const [activeKc,       setActiveKc]       = useState(null);

  const [latitude,       setLatitude]       = useState(0);
  const [longitude,      setLongitude]      = useState(0);
  const [farms,          setFarms]          = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [landSurface,    setLandSurface]    = useState(1800);
  const [phoneNumber,    setPhoneNumber]    = useState('');
  const [sendingStatus,  setSendingStatus]  = useState({});

  const defaultKc = 0.95;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const notify = (type, message, delay = 3000) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), delay);
  };

  const interpret_precipitation = (mm) => {
    if (mm < 1)   return 'No rain expected; irrigation required.';
    if (mm <= 2)  return 'Light rain, minimal moisture.';
    if (mm <= 10) return 'Moderate rain, good for soil moisture.';
    if (mm <= 20) return 'Abundant rain, favorable for crops.';
    if (mm <= 50) return 'Heavy rain, monitor drainage.';
    return 'Torrential rain, flood risk.';
  };

  // ── Unified refresh (today + 10-day + 30-day) ────────────────────────────
  const refreshAllData = async (lat, lon, kc) => {
    if (!lat || !lon) return;
    setLoadingWeekly(true);
    setLoadingMonthly(true);

    const resolvedKc = kc ?? defaultKc;

    // Today + 10-day
    const { todayWeather, weeklyAdvisory: weekly } =
      await fetchDailyWeatherAndAdvisory(lat, lon, resolvedKc);

    if (todayWeather) {
      setTemperature(todayWeather.temperature);
      setHumidity(todayWeather.humidity);
      setShortwaveRadiation(todayWeather.shortwaveRadiation);
      setWindSpeed(todayWeather.windSpeed);
      setDailyPrecipitation(todayWeather.precipitation);
      setDailyEt0(todayWeather.dailyEt0);
      setDailyEtC(todayWeather.dailyEtC);
    }
    setWeeklyAdvisory(weekly);
    setLoadingWeekly(false);

    // 30-day chart
    const { labels, rain, etc } = await fetchMonthlyPrecipitation(lat, lon, resolvedKc);
    setMonthlyLabels(labels);
    setMonthlyRain(rain);
    setMonthlyEtc(etc);
    setLoadingMonthly(false);
  };

  // ── Kc resolution (climate-adjusted + intra-stage progression) ───────────
  const resolveKc = (kv, stage, progress = stageProgress) =>
    resolveActiveKc(kv, stage, progress, windSpeed, humidity, defaultKc);

  useEffect(() => {
    const kc = resolveKc(kcValues, growthStage, stageProgress);
    setActiveKc(kc);
    if (dailyEt0 !== null) setDailyEtC(dailyEt0 * kc);
    if (latitude && longitude) refreshAllData(latitude, longitude, kc);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [growthStage, kcValues, stageProgress]);

  useEffect(() => {
    if (dailyEtC !== null && dailyPrecipitation !== null) {
      setNetWaterDeficit(
        calculateNetWaterDeficit(dailyEtC, dailyPrecipitation, landSurface)
      );
    }
  }, [dailyEtC, dailyPrecipitation, landSurface]);

  useEffect(() => {
    axiosInstance.get('/api/farm/all')
      .then(({ data }) => setFarms(data.farms || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    axiosInstance.get('/api/crop/')
      .then(r => setCropsList(r.data.crops))
      .catch(console.error);
  }, []);

  // Normalizes a free-text stage name from the DB ('debut', 'Initial', 'Mid',
  // 'Late', 'End', etc.) to one of the 3 keys used by the frontend: ini/mid/end.
  // 'Late' and 'End' are treated as the same bucket since GROWTH_STAGES only
  // has 3 stages (no separate dev/late split in this app).
  const normalizeStageKey = (stage) => {
    const s = (stage || '').toLowerCase().trim();
    if (s === 'debut' || s === 'initial' || s === 'ini')      return 'ini';
    if (s === 'mid' || s === 'mid-season' || s === 'midseason') return 'mid';
    if (s === 'late' || s === 'end' || s === 'late-season')   return 'end';
    return null; // unrecognized/custom stage name — ignored for Kc resolution
  };

  const fetchKcValues = async (cropId) => {
    if (!cropId) return;
    try {
      const response = await axiosInstance.get(`/api/kc/getbycrop/${cropId}`);
      const raw = response.data;

      // Expected real shape: an array of rows like
      // [{ id, crop_id, stage: 'Initial', kc_value: 1.05 }, { stage: 'Mid', kc_value: 1.10 }, ...]
      // It may come back directly as an array, or wrapped under a key
      // (e.g. raw.coefficients or raw.kc_value) depending on the endpoint.
      const rows = Array.isArray(raw)
        ? raw
        : Array.isArray(raw.coefficients)
          ? raw.coefficients
          : Array.isArray(raw.kc_value)
            ? raw.kc_value
            : [];

      const next = { ini: null, mid: null, end: null };
      rows.forEach(row => {
        const key = normalizeStageKey(row.stage);
        const value = row.kc_value != null ? parseFloat(row.kc_value) : null;
        if (key && value != null && !Number.isNaN(value)) {
          next[key] = value;
        }
      });

      setKcValues(next);
    } catch (error) {
      console.error('Error fetching Kc values:', error);
      setKcValues({ ini: null, mid: null, end: null });
    }
  };

  const handleCropSelect = (e) => {
    const cropId = e.target.value;
    setSelectedCrop(cropId);
    setStageProgress(0);
    if (cropId) fetchKcValues(cropId);
    else setKcValues({ ini: null, mid: null, end: null });
  };

  const handleStageSelect = (stageId) => {
    setGrowthStage(stageId);
    setStageProgress(0); // reset progression when switching stage manually
  };

  // ── SMS ───────────────────────────────────────────────────────────────────
  const sendSMS = async (phone, message) => {
    try {
      const response = await axiosInstance.post('/api/notifications/sms', {
        phone,
        message: message.substring(0, 160),
      });
      return response.status === 200;
    } catch (error) {
      console.error('Error sending SMS:', error);
      return false;
    }
  };

  const generateWaterAdvisoryMessage = () => {
    const farmName  = farms.find(f => f.id === parseInt(selectedFarmId))?.name ?? 'Farm';
    const cropName  = cropsList.find(c => c.id === parseInt(selectedCrop))?.name ?? 'Crop';
    const stageName = GROWTH_STAGES.find(s => s.id === growthStage)?.id?.toUpperCase() ?? 'MID';
    const surface   = parseFloat(landSurface);
    const etcLitres = (dailyEtC * surface).toFixed(0);
    const etcMm     = dailyEtC.toFixed(2);
    const rainL     = (dailyPrecipitation * surface).toFixed(0);
    const netL      = Math.max(0, dailyEtC * surface - dailyPrecipitation * surface).toFixed(0);

    let action = '';
    if (dailyPrecipitation >= dailyEtC)
      action = 'No irrigation needed';
    else if (dailyPrecipitation > dailyEtC * 0.5)
      action = `Light irrigation: ${netL}L`;
    else
      action = `Irrigation: ${netL}L`;

    return (
      `${farmName} - ${cropName} (${stageName})\n` +
      `Kc: ${(activeKc ?? defaultKc).toFixed(2)}\n` +
      `24h ETc: ${etcLitres}L (${etcMm}mm)\n` +
      `Rain: ${dailyPrecipitation.toFixed(1)}mm (${rainL}L)\n` +
      `Deficit: ${netL}L\n` +
      `${action}`
    );
  };

  const sendWaterAdvisory = async () => {
    if (!phoneNumber || !selectedCrop || !selectedFarmId) {
      notify('error', 'Please fill all fields (farm, crop, phone)');
      return;
    }
    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    if (!/^256\d{9}$/.test(cleanPhone)) {
      notify('error', 'Phone must be format: 256XXXXXXXXX');
      return;
    }
    setSendingStatus({ sending: true });
    try {
      const message = generateWaterAdvisoryMessage();
      const success = await sendSMS(cleanPhone, message);
      if (success) {
        setSendingStatus({ sending: false, completed: true, success: 1, total: 1 });
        notify('success', 'Water advisory sent successfully!', 5000);
        setPhoneNumber('');
      } else {
        setSendingStatus({ sending: false, completed: true, success: 0, total: 1 });
        notify('error', 'Failed to send SMS', 5000);
      }
    } catch (error) {
      setSendingStatus({ sending: false });
      notify('error', 'Error: ' + error.message, 5000);
    }
    setTimeout(() => setSendingStatus({}), 5000);
  };

  // ── Farm selection ────────────────────────────────────────────────────────
  const handleFarmChange = async (e) => {
    const farmId = e.target.value;
    setSelectedFarmId(farmId);
    if (!farmId) { setLandSurface(1800); return; }

    try {
      const response = await axiosInstance.get(`/api/farm/${farmId}`);
      if (response.data.status !== 'success') return;
      const farmData = response.data.data;

      const possibleFields = ['polygon','geojson','boundary','coordinates','shape','geometry'];
      const polygonField = possibleFields.find(
        f => farmData[f] !== undefined && farmData[f] !== null && farmData[f] !== ''
      );

      if (polygonField) {
        try {
          const polygonData = farmData[polygonField];
          const parsed = typeof polygonData === 'string' ? JSON.parse(polygonData) : polygonData;
          let turfPolygon;

          if (parsed.type === 'Feature' && parsed.geometry) {
            turfPolygon = turf.polygon(parsed.geometry.coordinates);
          } else if (parsed.type === 'Polygon' && parsed.coordinates) {
            turfPolygon = turf.polygon(parsed.coordinates);
          } else if (Array.isArray(parsed) && parsed.length > 0) {
            const first = parsed[0];
            if (Array.isArray(first)) {
              const isLatLon = Math.abs(first[0]) <= 90;
              let coords = isLatLon ? parsed.map(p => [p[1], p[0]]) : parsed;
              if (coords[0][0] !== coords[coords.length-1][0] || coords[0][1] !== coords[coords.length-1][1]) {
                coords.push([...coords[0]]);
              }
              turfPolygon = turf.polygon([coords]);
            }
          }

          if (turfPolygon) {
            const area = Math.round(turf.area(turfPolygon));
            setLandSurface(area);
            notify('success', `Surface calculated: ${area} m²`);

            if (mapRef.current) {
              if (mapRef.current.getLayer('farm-polygon')) {
                mapRef.current.removeLayer('farm-polygon');
                mapRef.current.removeLayer('farm-polygon-outline');
                mapRef.current.removeSource('farm-polygon');
              }
              mapRef.current.addSource('farm-polygon', { type: 'geojson', data: turfPolygon });
              mapRef.current.addLayer({ id: 'farm-polygon', type: 'fill', source: 'farm-polygon', paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.3 } });
              mapRef.current.addLayer({ id: 'farm-polygon-outline', type: 'line', source: 'farm-polygon', paint: { 'line-color': '#2563eb', 'line-width': 2 } });
              mapRef.current.fitBounds(turf.bbox(turfPolygon), { padding: 50 });
            }
          } else {
            setLandSurface(1800);
          }
        } catch {
          setLandSurface(1800);
        }
      } else {
        setLandSurface(1800);
      }

      const geolocation = farmData.geolocation;
      if (geolocation?.includes(',')) {
        const [lat, lon] = geolocation.split(',');
        const latN = parseFloat(lat);
        const lonN = parseFloat(lon);
        setLatitude(latN);
        setLongitude(lonN);

        if (mapRef.current) {
          mapRef.current.flyTo({ center: [lonN, latN], zoom: 15 });
          if (!polygonField) {
            new mapboxgl.Marker({ color: 'red' })
              .setLngLat([lonN, latN])
              .setPopup(new mapboxgl.Popup().setHTML(`<strong>${farmData.name}</strong>`))
              .addTo(mapRef.current);
          }
        }

        const kc = resolveKc(kcValues, growthStage, stageProgress);
        await refreshAllData(latN, lonN, kc);
      }
    } catch (error) {
      console.error('Error fetching farm:', error);
      setLandSurface(1800);
    }
  };

  // ── Mapbox init ───────────────────────────────────────────────────────────
  useEffect(() => {
    mapboxgl.accessToken =
      'pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q';

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style:     'mapbox://styles/mapbox/satellite-v9',
      center:    [-79.4512, 43.6568],
      zoom:      8,
    });

    const coordinatesGeocoder = (query) => {
      const matches = query.match(/^[ ]*(?:Lat: )?(-?\d+\.?\d*)[, ]+(?:Lng: )?(-?\d+\.?\d*)[ ]*$/i);
      if (!matches) return null;
      const c1 = Number(matches[1]), c2 = Number(matches[2]);
      if (c1 < -90 || c1 > 90 || c2 < -180 || c2 > 180) return null;
      return [{
        center:     [c2, c1],
        geometry:   { type: 'Point', coordinates: [c2, c1] },
        place_name: `Lat: ${c1}, Lng: ${c2}`,
        place_type: ['coordinate'],
        properties: {},
        type:       'Feature',
      }];
    };

    const geocoder = new MapboxGeocoder({
      accessToken:   mapboxgl.accessToken,
      mapboxgl,
      placeholder:   'Search for places...',
      localGeocoder: coordinatesGeocoder,
    });
    mapRef.current.addControl(geocoder);

    geocoder.on('result', async (e) => {
      const { place_name, geometry } = e.result;
      setPlaceName(place_name);
      notify('success', `Location found: ${place_name}`);
      mapRef.current.flyTo({ center: geometry.coordinates, zoom: 15 });
      const lat = geometry.coordinates[1];
      const lon = geometry.coordinates[0];
      setLatitude(lat);
      setLongitude(lon);
      const kc = resolveKc(kcValues, growthStage, stageProgress);
      await refreshAllData(lat, lon, kc);
    });

    mapRef.current.on('click', async (event) => {
      const { lng, lat } = event.lngLat;
      try {
        const geo = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
          `?access_token=${mapboxgl.accessToken}`
        );
        const geoData = await geo.json();
        const city = geoData.features[0]?.place_name ?? 'Unknown location';
        setPlaceName(city);
        setLatitude(lat);
        setLongitude(lng);

        const kc = resolveKc(kcValues, growthStage, stageProgress);
        const { todayWeather } = await fetchDailyWeatherAndAdvisory(lat, lng, kc);

        await refreshAllData(lat, lng, kc);

        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new mapboxgl.Popup()
          .setLngLat([lng, lat])
          .setHTML(`
            <p><strong>Coordinates:</strong> Lng: ${lng.toFixed(4)}, Lat: ${lat.toFixed(4)}</p>
            <p><strong>City:</strong> ${city}</p>
            <p><strong>Avg Temperature (24h):</strong> ${todayWeather?.temperature?.toFixed(1) ?? 'N/A'}°C</p>
            <p><strong>Avg Humidity (24h):</strong> ${todayWeather?.humidity?.toFixed(1) ?? 'N/A'}%</p>
            <p><strong>Total Precipitation (24h):</strong> ${todayWeather?.precipitation?.toFixed(1) ?? 'N/A'} mm</p>
            <p><strong>~</strong> ${todayWeather?.precipitation != null ? interpret_precipitation(todayWeather.precipitation) : 'N/A'}</p>
            <p><strong>Avg Radiation (24h):</strong> ${todayWeather?.shortwaveRadiation?.toFixed(0) ?? 'N/A'} W/m²</p>
            <p><strong>Avg Wind Speed (24h):</strong> ${todayWeather?.windSpeed?.toFixed(1) ?? 'N/A'} m/s</p>
          `)
          .addTo(mapRef.current);
      } catch (error) {
        console.error('Error fetching data:', error);
        notify('error', 'Failed to fetch weather data.');
      }
    });

    return () => mapRef.current.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Status configs ─────────────────────────────────────────────────────────
  const deficitStatusConfig = {
    sufficient: { border: 'border-l-gray-400',   text: 'text-gray-700',   label: '✅ Rain sufficient' },
    light:      { border: 'border-l-yellow-400', text: 'text-yellow-700', label: '⚠️ Light irrigation needed' },
    critical:   { border: 'border-l-red-400',    text: 'text-red-700',    label: '🚿 Irrigation required' },
  };
  const weeklyStatusBadge = {
    no_irrigation: 'bg-gray-100 text-gray-600',
    light:         'bg-gray-100 text-yellow-700 border border-yellow-200',
    irrigate:      'bg-gray-100 text-red-700 border border-red-200',
  };
  const weeklyStatusLabel = {
    no_irrigation: '✅ No irrigation',
    light:         '⚠️ Light',
    irrigate:      '🚿 Irrigate',
  };

  const canShowAdvisory    = selectedCrop && dailyEtC !== null && landSurface > 0;
  const currentKcDisplay   = (activeKc ?? defaultKc).toFixed(2);
  const nextStageId        = NEXT_STAGE[growthStage];
  const nextStageLabel     = nextStageId
    ? GROWTH_STAGES.find(s => s.id === nextStageId)?.label
    : null;

  // ── 30-day chart derived stats ─────────────────────────────────────────────
  const monthlyTotalRain = monthlyRain.reduce((s, v) => s + v, 0);
  const monthlyPeakRain  = monthlyRain.length > 0 ? Math.max(...monthlyRain) : 0;
  const rainyDaysCount   = monthlyRain.filter(v => v >= 1).length;

  // ── Chart.js data + options ────────────────────────────────────────────────
  const monthlyChartData = {
    labels: monthlyLabels,
    datasets: [
      {
        type: 'bar',
        label: 'Precipitation (mm)',
        data: monthlyRain,
        backgroundColor: 'rgba(55,138,221,0.75)',
        borderColor: '#185FA5',
        borderWidth: 0.5,
        borderRadius: 3,
        order: 2,
      },
      {
        type: 'line',
        label: 'ETc (mm)',
        data: monthlyEtc,
        borderColor: '#E24B4A',
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        tension: 0.3,
        order: 1,
      },
    ],
  };

  const monthlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => ctx.dataset.label + ': ' + ctx.parsed.y.toFixed(1) + ' mm',
        },
      },
    },
    scales: {
      x: {
        ticks: {
          autoSkip: true,
          maxTicksLimit: 15,
          maxRotation: 45,
          font: { size: 11 },
        },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: v => v + ' mm',
          font: { size: 11 },
        },
        grid: { color: 'rgba(128,128,128,0.1)' },
      },
    },
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative h-full">
      {/* Notification */}
      {notification && (
        <div className={`absolute top-20 right-2 z-10 px-4 py-2 rounded-md shadow-lg ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      <p className="text-xl text-gray-600 italic mb-4">
        Water Advisory System — Calculate irrigation needs and send SMS alerts
      </p>

      {/* Map */}
      <div className="relative h-[600px] mb-8">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-2 gap-6 max-w-6xl mx-auto">

        {/* LEFT — Weather */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
            <WiDaySunny className="mr-2 text-yellow-500" size={24} />
            Weather Forecast (daily values)
          </h3>

          <div className="space-y-4">
            <div className="flex items-center text-gray-700 space-x-2 pb-4 border-b">
              <FiMapPin className="text-red-500" size={24} />
              <span className="font-semibold text-lg">Location:</span>
              <span className="text-gray-600">{placeName || '—'}</span>
            </div>

            <div className="space-y-2">
              {[
                {
                  icon:  <WiDaySunny className="text-gray-400 mr-3" size={32} />,
                  label: 'Avg Temperature (24h)',
                  value: temperature !== null ? `${temperature.toFixed(1)}°C` : 'N/A',
                },
                {
                  icon:  <WiHumidity className="text-gray-400 mr-3" size={32} />,
                  label: 'Avg Humidity (24h)',
                  value: humidity !== null ? `${humidity.toFixed(1)}%` : 'N/A',
                },
                {
                  icon:  <WiRain className="text-gray-400 mr-3" size={32} />,
                  label: 'Total Precipitation (day)',
                  value: dailyPrecipitation !== null ? `${dailyPrecipitation.toFixed(1)} mm/day` : 'N/A',
                },
                {
                  icon:  <WiCloud className="text-gray-400 mr-3" size={32} />,
                  label: 'ET₀ (day, daily endpoint)',
                  value: dailyEt0 !== null ? `${dailyEt0.toFixed(2)} mm/day` : 'N/A',
                },
                {
                  icon:  <WiSolarEclipse className="text-gray-400 mr-3" size={32} />,
                  label: 'Avg Radiation (24h)',
                  value: shortwaveRadiation !== null ? `${shortwaveRadiation.toFixed(0)} W/m²` : 'N/A',
                },
                {
                  icon:  <WiWindy className="text-gray-400 mr-3" size={32} />,
                  label: 'Avg Wind Speed (24h)',
                  value: windSpeed !== null ? `${windSpeed.toFixed(1)} m/s` : 'N/A',
                },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  {icon}
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="font-semibold text-gray-900">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Farm & Crop */}
        <div className="w-full bg-white p-6 rounded-xl shadow-md border border-gray-150">
          <h3 className="text-2xl font-bold text-gray-950 mb-6 tracking-tight">
            Farm &amp; Crop Selection
          </h3>

          <div className="space-y-5">
            {/* Farm */}
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-bold text-gray-900">Select Farm:</label>
              <select
                value={selectedFarmId}
                onChange={handleFarmChange}
                className="w-full p-3 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-base"
              >
                <option value="">Select a farm</option>
                {farms.map(farm => (
                  <option key={farm.id} value={farm.id}>{farm.name} - {farm.subcounty}</option>
                ))}
              </select>
            </div>

            {/* Crop */}
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-bold text-gray-900">Select Crop:</label>
              <select
                value={selectedCrop}
                onChange={handleCropSelect}
                className="w-full p-3 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-base"
              >
                <option value="">Select a crop</option>
                {cropsList.map(crop => (
                  <option key={crop.id} value={crop.id}>{crop.name}</option>
                ))}
              </select>
            </div>

            {/* Growth stage selector (FIX 2) */}
            {selectedCrop && (
              <div className="flex flex-col gap-1.5">
                <label className="block text-sm font-bold text-gray-900">Growth Stage (FAO-56):</label>
                <div className="grid grid-cols-3 gap-2">
                  {GROWTH_STAGES.map(stage => {
                    const rawKc    = kcValues[stage.id];
                    const isActive = growthStage === stage.id;

                    // Each badge shows the REAL Kc that would be used if this stage
                    // is/were active: climate-adjusted for mid/end, and including the
                    // slider interpolation if this happens to be the currently active stage.
                    const displayedKc = isActive
                      ? activeKc
                      : (rawKc != null
                          ? ((stage.id === 'mid' || stage.id === 'end')
                              ? adjustKcForClimate(rawKc, windSpeed, humidity)
                              : rawKc)
                          : null);

                    return (
                      <button
                        key={stage.id}
                        onClick={() => handleStageSelect(stage.id)}
                        className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-blue-600 border-blue-600 text-white shadow'
                            : 'bg-gray-50 border-gray-300 text-gray-700 hover:border-blue-400'
                        }`}
                      >
                        <div>{stage.id === 'ini' ? 'Initial' : stage.id === 'mid' ? 'Mid-season' : 'Late season'}</div>
                        <div className={`mt-0.5 font-bold ${isActive ? 'text-blue-100' : 'text-blue-600'}`}>
                          Kc = {displayedKc != null ? displayedKc.toFixed(2) : '—'}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 pl-1">
                  {GROWTH_STAGES.find(s => s.id === growthStage)?.desc}
                  &nbsp;— Active Kc: <strong>{currentKcDisplay}</strong>
                  {(growthStage === 'mid' || growthStage === 'end') && (
                    <span className="text-gray-400"> (climate-adjusted)</span>
                  )}
                </p>

                {/* Intra-stage progression slider */}
                {nextStageId && (
                  <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-gray-700">
                        Progress within stage
                      </label>
                      <span className="text-xs font-bold text-blue-600">{stageProgress}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={stageProgress}
                      onChange={e => setStageProgress(parseInt(e.target.value, 10))}
                      className="w-full accent-blue-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Slide right as the crop approaches{' '}
                      <strong>{nextStageLabel}</strong> — Kc gradually shifts toward that stage's value
                      instead of jumping abruptly.
                    </p>
                  </div>
                )}

                {(kcValues.ini === null || kcValues.mid === null || kcValues.end === null) && (
                  <div className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
                    ⚠️ Missing Kc value(s) for this crop:{' '}
                    {[
                      kcValues.ini === null && 'Initial',
                      kcValues.mid === null && 'Mid',
                      kcValues.end === null && 'Late',
                    ].filter(Boolean).join(', ')}.
                    Add the missing stage(s) in the Crop Coefficient Manager (FAO-56 Table 12)
                    for accurate climate adjustment and stage-transition results.
                  </div>
                )}
              </div>
            )}

            {/* Land Surface */}
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">Land Surface (m²):</span>
                {selectedFarmId && landSurface !== 1800 && (
                  <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded-md border border-green-200">
                    ✓ Auto-calculated (editable)
                  </span>
                )}
              </label>
              <input
                type="number"
                value={landSurface}
                onChange={e => setLandSurface(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-base"
                placeholder="Enter land surface in m²"
              />
              <p className="text-xs font-semibold text-gray-600 mt-1 pl-1">
                {selectedFarmId && landSurface !== 1800
                  ? '💡 Calculated from polygon, editable manually'
                  : 'ℹ️ Enter farm surface area'}
              </p>
            </div>

            {/* Advisory panels */}
            {canShowAdvisory && (
              <div className="space-y-3 mt-4">

                {/* 24h totals */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <WiCloud className="text-gray-400 mr-2" size={24} />
                    <span className="font-semibold text-gray-800">24-Hour Daily Total</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ET₀ (daily endpoint):</span>
                      <span className="font-semibold text-gray-900">{dailyEt0?.toFixed(2)} mm/day</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ETc (ET₀ × Kc {currentKcDisplay}):</span>
                      <span className="font-semibold text-gray-900">{dailyEtC?.toFixed(2)} mm/day</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total water need:</span>
                      <span className="font-semibold text-gray-900">
                        {(dailyEtC * parseFloat(landSurface)).toFixed(0)} L
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expected rain:</span>
                      <span className="font-semibold text-gray-900">{dailyPrecipitation?.toFixed(1)} mm</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-300 pt-2 mt-2">
                      <span className="text-gray-600">Net irrigation needed:</span>
                      <span className="font-bold text-gray-900">
                        {Math.max(
                          0,
                          (dailyEtC * parseFloat(landSurface)) -
                          (dailyPrecipitation * parseFloat(landSurface))
                        ).toFixed(0)} L
                      </span>
                    </div>
                  </div>
                </div>

                {/* Net Water Deficit */}
                {netWaterDeficit && (() => {
                  const cfg = deficitStatusConfig[netWaterDeficit.status];
                  return (
                    <div className={`p-4 bg-gray-50 border border-gray-200 border-l-4 ${cfg.border} rounded-lg`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-gray-800">💧 Net Water Deficit</h4>
                        <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Crop water need (ETc):</span>
                          <span className="font-semibold text-gray-900">{netWaterDeficit.totalWaterNeed} L</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Rain contribution:</span>
                          <span className="font-semibold text-gray-700">
                            {netWaterDeficit.rainContribution} L ({netWaterDeficit.coveragePercent}%)
                          </span>
                        </div>
                        {parseFloat(netWaterDeficit.surplus) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Rain surplus:</span>
                            <span className="font-semibold text-gray-700">+{netWaterDeficit.surplus} L</span>
                          </div>
                        )}
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-slate-500"
                              style={{ width: `${Math.min(100, parseFloat(netWaterDeficit.coveragePercent))}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Rain covers {netWaterDeficit.coveragePercent}% of crop water need
                          </p>
                        </div>
                        <div className="flex justify-between border-t border-gray-300 pt-2 mt-2">
                          <span className="font-bold text-gray-800">Net deficit to irrigate:</span>
                          <span className={`font-bold text-lg ${cfg.text}`}>
                            {netWaterDeficit.netDeficit} L
                            <span className="text-sm font-normal ml-1">({netWaterDeficit.netDeficitMm} mm)</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* SMS */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
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
                        onChange={e => setPhoneNumber(e.target.value)}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Format: 256783130358</p>
                    </div>

                    <button
                      onClick={sendWaterAdvisory}
                      disabled={sendingStatus.sending || !phoneNumber || !selectedCrop}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white py-2.5 rounded-lg font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      {sendingStatus.sending
                        ? <><WiCloud className="animate-spin" size={20} /> Sending SMS...</>
                        : <>📤 Send Water Advisory</>}
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
                      <p className="text-xs text-gray-500 mb-1">Message preview:</p>
                      <div className="font-mono text-xs text-gray-700 whitespace-pre-line">
                        {selectedCrop && selectedFarmId && dailyEtC !== null
                          ? generateWaterAdvisoryMessage()
                          : 'Select farm and crop to preview message...'}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 10-Day Advisory Table ── */}
      {(weeklyAdvisory.length > 0 || loadingWeekly) && selectedCrop && (
        <div className="max-w-6xl mx-auto mt-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800">📅 10-Day Water Advisory</h3>
              {activeKc && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Kc = {currentKcDisplay} ({GROWTH_STAGES.find(s => s.id === growthStage)?.label})
                  — source: Open-Meteo daily endpoint
                </p>
              )}
            </div>
            {loadingWeekly && (
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <WiCloud className="animate-spin" size={20} /> Loading...
              </span>
            )}
          </div>

          {weeklyAdvisory.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="py-3 px-4 text-left font-semibold">Date</th>
                    <th className="py-3 px-4 text-center font-semibold">Temp</th>
                    <th className="py-3 px-4 text-right font-semibold">ET₀ (mm)</th>
                    <th className="py-3 px-4 text-right font-semibold">ETc (mm)</th>
                    <th className="py-3 px-4 text-right font-semibold">Rain (mm)</th>
                    <th className="py-3 px-4 text-right font-semibold">Deficit (mm)</th>
                    <th className="py-3 px-4 text-right font-semibold">To Irrigate (L)</th>
                    <th className="py-3 px-4 text-center font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {weeklyAdvisory.map((day, i) => {
                    const irrigateL = (
                      parseFloat(day.netDeficitMm) * parseFloat(landSurface)
                    ).toFixed(0);
                    const isToday  = i === 0;
                    const dateObj  = new Date(day.date + 'T00:00:00');
                    const dayName  = dateObj.toLocaleDateString('en-GB', { weekday: 'short' });
                    const dayNum   = dateObj.getDate();
                    const monthName = dateObj.toLocaleDateString('en-GB', { month: 'short' });

                    return (
                      <tr
                        key={day.date}
                        className={`${isToday ? 'bg-slate-50' : 'bg-white'} hover:bg-gray-50 transition-colors`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className={`text-center w-10 ${isToday ? 'text-slate-700' : 'text-gray-800'}`}>
                              <div className="text-xs font-medium text-gray-400 uppercase">{dayName}</div>
                              <div className="text-xl font-bold leading-tight">{dayNum}</div>
                              <div className="text-xs text-gray-400">{monthName}</div>
                            </div>
                            {isToday && (
                              <span className="text-xs bg-slate-700 text-white px-1.5 py-0.5 rounded font-medium">
                                Today
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-700">
                          <span className="font-medium">{day.tempMax ?? '—'}°</span>
                          <span className="text-gray-400 mx-0.5">/</span>
                          <span className="text-gray-500">{day.tempMin ?? '—'}°</span>
                        </td>
                        <td className="py-3 px-4 text-right text-gray-500">{day.et0}</td>
                        <td className="py-3 px-4 text-right text-gray-800 font-medium">{day.etc}</td>
                        <td className="py-3 px-4 text-right text-gray-700">{day.rain}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={parseFloat(day.netDeficitMm) > 0 ? 'text-gray-900 font-semibold' : 'text-gray-400'}>
                            {day.netDeficitMm}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">{irrigateL}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${weeklyStatusBadge[day.status]}`}>
                            {weeklyStatusLabel[day.status]}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700">
                    <td className="py-3 px-4" colSpan={3}>10-Day Totals</td>
                    <td className="py-3 px-4 text-right">
                      {weeklyAdvisory.reduce((s, d) => s + parseFloat(d.etc), 0).toFixed(2)} mm
                    </td>
                    <td className="py-3 px-4 text-right">
                      {weeklyAdvisory.reduce((s, d) => s + parseFloat(d.rain), 0).toFixed(1)} mm
                    </td>
                    <td className="py-3 px-4 text-right">
                      {weeklyAdvisory.reduce((s, d) => s + parseFloat(d.netDeficitMm), 0).toFixed(2)} mm
                    </td>
                    <td className="py-3 px-4 text-right">
                      {weeklyAdvisory
                        .reduce((s, d) => s + parseFloat(d.netDeficitMm) * parseFloat(landSurface), 0)
                        .toFixed(0)} L
                    </td>
                    <td className="py-3 px-4" />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── 30-Day Precipitation Chart ── */}
      {(monthlyLabels.length > 0 || loadingMonthly) && (
        <div className="max-w-6xl mx-auto mt-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800">🌧 Precipitation — Last 30 Days</h3>
              {activeKc && (
                <p className="text-xs text-gray-500 mt-0.5">
                  ETc curve uses Kc = {currentKcDisplay} ({GROWTH_STAGES.find(s => s.id === growthStage)?.label})
                  — source: Open-Meteo daily endpoint
                </p>
              )}
            </div>
            {loadingMonthly && (
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <WiCloud className="animate-spin" size={20} /> Loading...
              </span>
            )}
          </div>

          {/* Summary cards */}
          {monthlyLabels.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">30-day total</p>
                  <p className="text-2xl font-bold text-blue-600">{monthlyTotalRain.toFixed(1)}</p>
                  <p className="text-xs text-gray-400">mm</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Daily peak</p>
                  <p className="text-2xl font-bold text-blue-800">{monthlyPeakRain.toFixed(1)}</p>
                  <p className="text-xs text-gray-400">mm</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Rainy days</p>
                  <p className="text-2xl font-bold text-gray-700">{rainyDaysCount}</p>
                  <p className="text-xs text-gray-400">days ≥ 1 mm</p>
                </div>
              </div>

              {/* Legend */}
              <div className="flex gap-5 mb-3">
                <span className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="inline-block w-3 h-3 rounded-sm bg-[rgba(55,138,221,0.75)]" />
                  Precipitation (mm)
                </span>
                <span className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="inline-block w-5 h-0.5 bg-[#E24B4A] rounded" />
                  ETc (mm)
                </span>
              </div>

              {/* Chart */}
              <div style={{ position: 'relative', width: '100%', height: '280px' }}>
                <Bar
                  data={monthlyChartData}
                  options={monthlyChartOptions}
                />
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
};

export default WaterAdvisory;