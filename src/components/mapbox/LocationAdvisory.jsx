/**
 * LocationAdvisory.jsx — CAMARA Open Gateway Integration
 * Redesign professionnel — Agri-Tech Enterprise Dashboard
 */

import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../axiosInstance';
import {
  MapPin, Phone, RefreshCw, CheckCircle, AlertTriangle,
  Zap, Shield, Clock, ChevronRight,
  Droplets, Wind, ThermometerSun, Bug, Send, Signal,
  Navigation, Radio, CloudRain, Leaf
} from 'lucide-react';
import {
  WiDaySunny, WiHumidity, WiRain, WiWindy, WiCloud, WiSolarEclipse
} from 'react-icons/wi';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const USE_MOCK_API = true;
const CAMARA_API_BASE = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_TELCO_API_BASE : undefined) || 'https://api.operator.example.com';
const CAMARA_TOKEN_URL    = `${CAMARA_API_BASE}/oauth2/token`;
const CAMARA_LOCATION_URL = `${CAMARA_API_BASE}/location-retrieval/v0.5/retrieve`;
const CAMARA_CLIENT_ID     = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_TELCO_CLIENT_ID     : undefined) || 'your-client-id';
const CAMARA_CLIENT_SECRET = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_TELCO_CLIENT_SECRET : undefined) || 'your-client-secret';

const WEATHER_THRESHOLDS = { TEMP_LOW: 15, TEMP_HIGH: 30, HEAVY_RAIN: 10, STRONG_WIND: 20, DRY_HUMIDITY: 30 };
const PEST_GDD = { 'Fall Armyworm': 140, 'Aphids': 100, 'Stem Borers': 180, 'Corn Earworm': 220, 'Coffee Berry Borer': 120 };

// ─── MOCK ─────────────────────────────────────────────────────────────────────
const mockLocate = async (phone) => {
  await new Promise(r => setTimeout(r, 1400 + Math.random() * 600));
  const locs = {
    default:        { latitude: 0.3476,  longitude: 32.5825, radius: 250 },
    '256700000001': { latitude: 1.2916,  longitude: 32.1036, radius: 400 },
    '256700000002': { latitude: 0.6721,  longitude: 30.2144, radius: 150 },
  };
  const loc = locs[phone] || locs.default;
  return { lastLocationTime: new Date().toISOString(), area: { areaType: 'CIRCLE', center: { latitude: loc.latitude, longitude: loc.longitude }, radius: loc.radius }, _mock: true };
};

let _tok = null, _tokExp = 0;
const getCamaraToken = async () => {
  if (_tok && Date.now() < _tokExp) return _tok;
  const body = new URLSearchParams({ grant_type: 'client_credentials', client_id: CAMARA_CLIENT_ID, client_secret: CAMARA_CLIENT_SECRET, scope: 'location-retrieval:read' });
  const res = await fetch(CAMARA_TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  if (!res.ok) throw new Error(`Token error: ${res.status}`);
  const data = await res.json();
  _tok = data.access_token; _tokExp = Date.now() + (data.expires_in - 60) * 1000;
  return _tok;
};

const retrieveLocation = async (phone) => {
  if (USE_MOCK_API) return mockLocate(phone);
  const token = await getCamaraToken();
  const res = await fetch(CAMARA_LOCATION_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-Correlator': `req-${Date.now()}` }, body: JSON.stringify({ device: { phoneNumber: phone }, maxAge: 120 }) });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || `CAMARA ${res.status}`); }
  return res.json();
};

const fetchWeather = async (lat, lon) => {
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,et0_fao_evapotranspiration&forecast_days=10`);
  return res.json();
};

const analyzeWeather = (data) => {
  const h = data.hourly || {};
  const times = h.time || [], temps = h.temperature_2m || [], hum = h.relative_humidity_2m || [],
        precip = h.precipitation || [], wind = h.wind_speed_10m || [], et0 = h.et0_fao_evapotranspiration || [];
  const daily = {};
  for (let i = 0; i < times.length; i++) {
    const dk = times[i].split('T')[0];
    if (!daily[dk]) daily[dk] = { alerts: new Set(), maxT: -Infinity, minT: Infinity, rain: 0, maxW: 0, et0: 0 };
    const d = daily[dk];
    d.maxT = Math.max(d.maxT, temps[i]); d.minT = Math.min(d.minT, temps[i]);
    d.rain += precip[i] || 0; d.maxW = Math.max(d.maxW, wind[i]); d.et0 += et0[i] || 0;
    if (precip[i] > WEATHER_THRESHOLDS.HEAVY_RAIN) d.alerts.add('Heavy Rain');
    if (temps[i] > WEATHER_THRESHOLDS.TEMP_HIGH)   d.alerts.add('Extreme Heat');
    if (temps[i] < WEATHER_THRESHOLDS.TEMP_LOW)    d.alerts.add('Extreme Cold');
    if (wind[i]  > WEATHER_THRESHOLDS.STRONG_WIND) d.alerts.add('Strong Wind');
    if (hum[i]   < WEATHER_THRESHOLDS.DRY_HUMIDITY) d.alerts.add('Dryness Alert');
  }
  const weatherAlerts = Object.entries(daily)
    .filter(([, d]) => d.alerts.size > 0)
    .map(([date, d]) => ({ date, alerts: [...d.alerts], maxTemp: d.maxT.toFixed(1), minTemp: d.minT.toFixed(1), totalRain: d.rain.toFixed(1), maxWind: d.maxW.toFixed(1) }));
  const first = Object.values(daily)[0] || {};
  let gdd = 0; const pestAlerts = []; const seen = new Set();
  for (let i = 0; i < times.length; i++) {
    gdd += Math.max(0, (temps[i] || 0) - 10);
    for (const [pest, thr] of Object.entries(PEST_GDD)) {
      if (gdd >= thr && !seen.has(pest)) { pestAlerts.push({ pest, gdd: Math.round(gdd), date: times[i].split('T')[0] }); seen.add(pest); }
    }
  }
  return { weatherAlerts, pestAlerts, dailyEt0: first.et0 || 0, dailyRain: first.rain || 0 };
};

// ─── ALERT CONFIG ─────────────────────────────────────────────────────────────
const ALERT_CONFIG = {
  'Heavy Rain':    { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   dot: 'bg-blue-500',   icon: <CloudRain size={13} /> },
  'Extreme Heat':  { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    dot: 'bg-red-500',    icon: <ThermometerSun size={13} /> },
  'Extreme Cold':  { bg: 'bg-sky-50',    border: 'border-sky-200',    text: 'text-sky-700',    dot: 'bg-sky-500',    icon: <ThermometerSun size={13} /> },
  'Strong Wind':   { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', dot: 'bg-violet-500', icon: <Wind size={13} /> },
  'Dryness Alert': { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  dot: 'bg-amber-500',  icon: <WiDaySunny size={15} /> },
};
const getAlertCfg = (type) => ALERT_CONFIG[type] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', dot: 'bg-gray-400', icon: <AlertTriangle size={13} /> };

// ─── STEP INDICATOR ───────────────────────────────────────────────────────────
const StepBadge = ({ n, label, active, done }) => (
  <div className={`flex items-center gap-2 text-xs font-medium transition-colors ${active ? 'text-teal-700' : done ? 'text-green-600' : 'text-gray-400'}`}>
    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold transition-all
      ${done ? 'bg-green-100 text-green-700' : active ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
      {done ? <CheckCircle size={11} /> : n}
    </span>
    {label}
  </div>
);

// ─── METRIC CARD ──────────────────────────────────────────────────────────────
const MetricCard = ({ label, value, unit, icon, accent, sub }) => (
  <div className={`rounded-xl p-4 border ${accent || 'bg-gray-50 border-gray-100'}`}>
    <div className="flex items-start justify-between mb-2">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      <span className="text-gray-400">{icon}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-semibold text-gray-900">{value}</span>
      {unit && <span className="text-sm text-gray-500">{unit}</span>}
    </div>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

// ─── PIPELINE STEPS ───────────────────────────────────────────────────────────
const Pipeline = () => {
  const steps = [
    { icon: <Phone size={11} />, label: 'Phone ID' },
    { icon: <Shield size={11} />, label: 'OAuth2' },
    { icon: <Radio size={11} />, label: 'CAMARA API' },
    { icon: <MapPin size={11} />, label: 'GPS coords' },
    { icon: <ThermometerSun size={11} />, label: 'Weather' },
    { icon: <Send size={11} />, label: 'SMS' },
  ];
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-500">
            {s.icon}<span>{s.label}</span>
          </div>
          {i < steps.length - 1 && <ChevronRight size={12} className="text-gray-300" />}
        </React.Fragment>
      ))}
    </div>
  );
};

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
const SectionCard = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>
    {children}
  </div>
);

const SectionHeader = ({ icon, title, badge }) => (
  <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-50">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
    </div>
    {badge}
  </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const LocationAdvisory = () => {
  const [farms, setFarms]               = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [phoneInput, setPhoneInput]     = useState('');
  const [locationResult, setLocationResult] = useState(null);
  const [status, setStatus]     = useState('idle');
  const [error, setError]       = useState(null);
  const [advisory, setAdvisory] = useState(null);
  const [smsPhone, setSmsPhone] = useState('');
  const [smsSending, setSmsSending] = useState(false);
  const [smsResult, setSmsResult]   = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    axiosInstance.get('/api/farm/all').then(r => setFarms(r.data.farms || [])).catch(console.error);
  }, []);

  const showNotif = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const onFarmChange = (id) => {
    const farm = farms.find(f => String(f.id) === id);
    setSelectedFarm(farm || null);
    if (farm) setPhoneInput(farm.phonenumber || farm.phonenumber2 || '');
    setLocationResult(null); setAdvisory(null); setStatus('idle'); setError(null);
  };

  const runFlow = useCallback(async () => {
    if (!phoneInput.trim()) return;
    setError(null); setLocationResult(null); setAdvisory(null);
    setStatus('locating');
    let loc;
    try {
      loc = await retrieveLocation(phoneInput.trim());
      setLocationResult(loc);
      setStatus('located');
      showNotif('success', `Location retrieved : ${loc.area.center.latitude.toFixed(4)}, ${loc.area.center.longitude.toFixed(4)}`);
    } catch (err) {
      setError(err.message); setStatus('error');
      showNotif('error', 'Location failed : ' + err.message);
      return;
    }
    setStatus('analyzing');
    try {
      const { latitude, longitude } = loc.area.center;
      const raw = await fetchWeather(latitude, longitude);
      const analysis = analyzeWeather(raw);
      let placeName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      try {
        const gr = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q&types=place`);
        const gd = await gr.json();
        if (gd.features?.[0]) placeName = gd.features[0].place_name;
      } catch (_) {}
      setAdvisory({ ...analysis, latitude, longitude, placeName, radius: loc.area.radius });
      setStatus('done');
      showNotif('success', 'Advisory generated successfully');
    } catch (err) {
      setError('Weather analysis failed : ' + err.message); setStatus('error');
    }
  }, [phoneInput]);

  const smsText = () => {
    if (!advisory || !selectedFarm) return '';
    const wa = advisory.weatherAlerts.slice(0, 2).map(a => a.alerts[0]).join(', ');
    const pest = advisory.pestAlerts[0]?.pest || '';
    const irr  = Math.max(0, advisory.dailyEt0 - advisory.dailyRain).toFixed(1);
    return `${selectedFarm.name}: GPS located. ${wa ? `Weather: ${wa}. ` : ''}${pest ? `Pest risk: ${pest}. ` : ''}Irrigation: ${irr}mm.`.substring(0, 160);
  };

  const sendSms = async () => {
    const phone = (smsPhone || phoneInput).replace(/\s/g, '');
    if (!phone) return;
    setSmsSending(true); setSmsResult(null);
    try {
      const res = await axiosInstance.post('/api/notifications/sms', { phone, message: smsText() });
      setSmsResult({ ok: res.status === 200 });
      if (res.status === 200) showNotif('success', 'SMS sent successfully');
    } catch (err) {
      setSmsResult({ ok: false, error: err.message });
      showNotif('error', 'Échec d\'envoi SMS');
    } finally { setSmsSending(false); }
  };

  const busy = status === 'locating' || status === 'analyzing';
  const isLocating = status === 'locating';
  const isAnalyzing = status === 'analyzing';
  const isDone = status === 'done';
  const isError = status === 'error';
  const net_irr = advisory ? Math.max(0, advisory.dailyEt0 - advisory.dailyRain) : 0;

  return (
    <div className="min-h-screen bg-gray-50/60 font-sans">

      {/* ── Toast Notification ── */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border transition-all
          ${notification.type === 'success'
            ? 'bg-white border-green-200 text-green-800'
            : 'bg-white border-red-200 text-red-800'}`}>
          {notification.type === 'success'
            ? <CheckCircle size={15} className="text-green-500 shrink-0" />
            : <AlertTriangle size={15} className="text-red-500 shrink-0" />}
          {notification.message}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-5">

        {/* ── Page header ── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <Navigation size={16} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">CAMARA Open Gateway</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">GPS Auto-Location & Advisory</h1>
          <p className="text-sm text-gray-500">Retrieve farmer location via the CAMARA telco API and trigger agronomic alerts automatically.</p>
        </div>

        {/* ── Step indicators ── */}
        <div className="flex items-center gap-6 px-1 mb-2">
          <StepBadge n="1" label="Selection" active={status === 'idle'} done={status !== 'idle'} />
          <div className="h-px w-6 bg-gray-200" />
          <StepBadge n="2" label="Location" active={isLocating || isAnalyzing} done={isDone || isError && locationResult} />
          <div className="h-px w-6 bg-gray-200" />
          <StepBadge n="3" label="Analysis" active={isAnalyzing} done={isDone} />
          <div className="h-px w-6 bg-gray-200" />
          <StepBadge n="4" label="Advisory & SMS" active={isDone} done={false} />
        </div>

        {/* ── SECTION 1 — Farm & Phone ── */}
        <SectionCard>
          <SectionHeader
            icon={<Phone size={16} />}
            title="Farm Selection"
            badge={USE_MOCK_API && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Simulation mode
              </span>
            )}
          />
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Farm</label>
                <select
                  className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all appearance-none cursor-pointer"
                  onChange={e => onFarmChange(e.target.value)}
                >
                  <option value="">Select a farm…</option>
                  {farms.map(f => <option key={f.id} value={f.id}>{f.name}{f.subcounty ? ` — ${f.subcounty}` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Numéro de téléphone
                  <span className="text-gray-400 font-normal ml-1 normal-case">(CAMARA identifier)</span>
                </label>
                <input
                  type="tel"
                  placeholder="256XXXXXXXXX"
                  value={phoneInput}
                  onChange={e => setPhoneInput(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
                />
              </div>
            </div>

            {USE_MOCK_API && (
              <div className="flex items-center gap-6 p-3 bg-amber-50 rounded-lg border border-amber-100 text-xs">
                <span className="font-semibold text-amber-700">Simulation config</span>
                <label className="flex items-center gap-2 text-amber-700 cursor-pointer">
                  <input type="checkbox" className="accent-amber-500 rounded" />
                  Simulate location error
                </label>
                <span className="text-amber-600/70 ml-auto">Test numbers : 256700000001 · 256700000002</span>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── SECTION 2 — Locate ── */}
        <SectionCard>
          <SectionHeader icon={<Signal size={16} />} title="GPS Location via CAMARA API" />
          <div className="p-6 space-y-5">

            <Pipeline />

            <div className="flex items-center gap-4">
              <button
                onClick={runFlow}
                disabled={!phoneInput.trim() || busy}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 disabled:bg-gray-200 disabled:text-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              >
                {busy
                  ? <><RefreshCw size={14} className="animate-spin" />Processing…</>
                  : <><Zap size={14} />Locate &amp; Generate Advisory</>}
              </button>

              {status !== 'idle' && (
                <div className="flex items-center gap-2 text-sm">
                  {busy && <RefreshCw size={13} className="animate-spin text-teal-500" />}
                  {isError && <AlertTriangle size={13} className="text-red-500" />}
                  {isDone && <CheckCircle size={13} className="text-green-500" />}
                  <span className={`font-medium ${isError ? 'text-red-600' : isDone ? 'text-green-600' : 'text-teal-600'}`}>
                    {{
                      locating:  'Retrieving GPS via CAMARA API…',
                      located:   'GPS located — Fetching weather…',
                      analyzing: 'Analyzing weather & pest conditions…',
                      done:      'Advisory generated successfully.',
                      error:     error,
                    }[status]}
                  </span>
                </div>
              )}
            </div>

            {/* GPS result */}
            {locationResult && (
              <div className="grid grid-cols-3 gap-3 pt-2">
                <MetricCard
                  label="Latitude"
                  value={locationResult.area.center.latitude.toFixed(5)}
                  icon={<MapPin size={15} />}
                  accent="bg-violet-50 border-violet-100"
                  sub="N/S coordinate"
                />
                <MetricCard
                  label="Longitude"
                  value={locationResult.area.center.longitude.toFixed(5)}
                  icon={<MapPin size={15} />}
                  accent="bg-blue-50 border-blue-100"
                  sub="E/W coordinate"
                />
                <MetricCard
                  label="Précision"
                  value={`± ${locationResult.area.radius}`}
                  unit="m"
                  icon={<Signal size={15} />}
                  accent="bg-gray-50 border-gray-100"
                  sub="Accuracy radius"
                />
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── SECTION 3 — Results ── */}
        {advisory && (
          <>
            {/* Location banner */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                <MapPin size={14} className="text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{advisory.placeName}</p>
                <p className="text-xs text-gray-400">{advisory.latitude.toFixed(5)}, {advisory.longitude.toFixed(5)} · ±{advisory.radius}m</p>
              </div>
              <span className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">
                Located
              </span>
            </div>

            <div className="grid grid-cols-2 gap-5">

              {/* LEFT — Water Advisory */}
              <SectionCard>
                <SectionHeader icon={<Droplets size={16} />} title="Water Balance (24h)" />
                <div className="p-6 space-y-3">
                  <MetricCard
                    label="Evapotranspiration ET₀"
                    value={advisory.dailyEt0.toFixed(2)}
                    unit="mm/j"
                    icon={<WiCloud size={18} />}
                    sub="Potential water need"
                  />
                  <MetricCard
                    label="Expected Rainfall"
                    value={advisory.dailyRain.toFixed(1)}
                    unit="mm"
                    icon={<CloudRain size={15} />}
                    accent="bg-blue-50 border-blue-100"
                    sub="24h precipitation"
                  />
                  <div className={`rounded-xl p-4 border ${net_irr > 0 ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Net Irrigation Required</span>
                      <Droplets size={15} className={net_irr > 0 ? 'text-orange-400' : 'text-green-400'} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl font-semibold ${net_irr > 0 ? 'text-orange-700' : 'text-green-700'}`}>
                        {net_irr.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500">mm</span>
                    </div>
                    <p className="text-xs mt-1 text-gray-400">{net_irr > 0 ? 'Additional input required' : 'Pluie suffisante — pas d\'irrigation'}</p>
                  </div>
                </div>
              </SectionCard>

              {/* RIGHT — Pest Alerts */}
              <SectionCard>
                <SectionHeader icon={<Bug size={16} />} title="Pest Risk Alerts" badge={
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${advisory.pestAlerts.length > 0 ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                    {advisory.pestAlerts.length > 0 ? `${advisory.pestAlerts.length} alerte${advisory.pestAlerts.length > 1 ? 's' : ''}` : 'No alerts'}
                  </span>
                } />
                <div className="p-6">
                  {advisory.pestAlerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-3">
                        <CheckCircle size={22} className="text-green-500" />
                      </div>
                      <p className="text-sm font-semibold text-gray-800">No risk detected</p>
                      <p className="text-xs text-gray-400 mt-1">GDD thresholds not reached in the next 10 days</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {advisory.pestAlerts.map((pa, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                          <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                            <Bug size={13} className="text-red-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-gray-900 truncate">{pa.pest}</p>
                              <span className="text-xs font-medium shrink-0 px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                                GDD {pa.gdd}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">Threshold expected on {pa.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </SectionCard>
            </div>

            {/* Weather alerts */}
            {advisory.weatherAlerts.length > 0 && (
              <SectionCard>
                <SectionHeader
                  icon={<WiDaySunny size={20} />}
                  title="Weather Alerts — 10-day forecast"
                  badge={
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                      {advisory.weatherAlerts.length} day{advisory.weatherAlerts.length > 1 ? 's' : ''} flagged
                    </span>
                  }
                />
                <div className="p-6 space-y-2">
                  {advisory.weatherAlerts.slice(0, 6).map((wa, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                      <div className="shrink-0 text-xs font-semibold text-gray-500 w-20 pt-0.5">{wa.date}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {wa.alerts.map(type => {
                            const cfg = getAlertCfg(type);
                            return (
                              <span key={type} className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                                {cfg.icon}{type}
                              </span>
                            );
                          })}
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <ThermometerSun size={12} className="text-gray-400" />
                            <span>{wa.minTemp}° – {wa.maxTemp}°C</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CloudRain size={12} className="text-gray-400" />
                            <span>{wa.totalRain} mm</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Wind size={12} className="text-gray-400" />
                            <span>{wa.maxWind} km/h</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* All clear */}
            {advisory.weatherAlerts.length === 0 && advisory.pestAlerts.length === 0 && (
              <SectionCard>
                <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                  <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
                    <CheckCircle size={26} className="text-green-500" />
                  </div>
                  <h4 className="text-base font-semibold text-gray-900 mb-1">All Clear</h4>
                  <p className="text-sm text-gray-500 max-w-xs">No alerts météo ni risque ravageur détecté sur les 10 prochains jours</p>
                </div>
              </SectionCard>
            )}

            {/* SMS Section */}
            <SectionCard>
              <SectionHeader icon={<Send size={16} />} title="Send Advisory via SMS" />
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recipient Number</label>
                    <input
                      type="tel"
                      placeholder={phoneInput || '256XXXXXXXXX'}
                      value={smsPhone}
                      onChange={e => setSmsPhone(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
                    />
                    <p className="text-xs text-gray-400 mt-1">Format: 256783130358</p>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={sendSms}
                      disabled={smsSending || (!smsPhone && !phoneInput)}
                      className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 disabled:bg-gray-100 disabled:text-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    >
                      {smsSending
                        ? <><RefreshCw size={14} className="animate-spin" />Sending…</>
                        : <><Send size={14} />Send Advisory</>}
                    </button>
                  </div>
                </div>

                {smsResult && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium mb-4 ${smsResult.ok ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-red-50 text-red-800 border border-red-100'}`}>
                    {smsResult.ok ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                    {smsResult.ok ? 'SMS sent successfully' : `Error: ${smsResult.error}`}
                  </div>
                )}

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Message Preview</span>
                    <span className="text-xs text-gray-400 tabular-nums">{smsText().length} / 160</span>
                  </div>
                  <p className="font-mono text-xs text-gray-700 leading-relaxed">
                    {smsText() || 'Select a farm and complete location to preview…'}
                  </p>
                  {smsText().length > 0 && (
                    <div className="mt-2 h-1 rounded-full bg-gray-200 overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${(smsText().length / 160) * 100}%` }} />
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* Integration guide */}
            <details className="bg-white rounded-2xl border border-gray-100 shadow-sm group">
              <summary className="flex items-center gap-3 px-6 py-4 cursor-pointer select-none list-none">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
                  <Shield size={15} />
                </div>
                <span className="text-sm font-semibold text-gray-700">Integration guide — Switching from simulation to live operator API</span>
                <ChevronRight size={15} className="text-gray-400 ml-auto group-open:rotate-90 transition-transform" />
              </summary>
              <div className="px-6 pb-6">
                <div className="bg-gray-950 rounded-xl p-4 font-mono text-xs leading-relaxed space-y-1.5">
                  <p><span className="text-green-400">1.</span> <span className="text-gray-300">Set</span> <span className="text-amber-300">USE_MOCK_API = false</span> <span className="text-gray-500">in LocationAdvisory.jsx</span></p>
                  <p><span className="text-green-400">2.</span> <span className="text-gray-300">Add to</span> <span className="text-amber-300">.env</span> <span className="text-gray-500">:</span></p>
                  <p className="pl-4 text-blue-300">VITE_TELCO_API_BASE=https://api.your-operator.com</p>
                  <p className="pl-4 text-blue-300">VITE_TELCO_CLIENT_ID=your-client-id</p>
                  <p className="pl-4 text-blue-300">VITE_TELCO_CLIENT_SECRET=your-client-secret</p>
                  <p><span className="text-green-400">3.</span> <span className="text-gray-300">Get credentials from the MTN / Airtel Uganda Open Gateway</span></p>
                  <p><span className="text-green-400">4.</span> <span className="text-gray-300">Required scope :</span> <span className="text-violet-300">location-retrieval:read</span></p>
                </div>
              </div>
            </details>
          </>
        )}
      </div>
    </div>
  );
};

export default LocationAdvisory;