/**
 * LocationAdvisory.jsx — CAMARA Open Gateway Integration
 * v4 — Polygon SVG map + enriched SMS (temp, precip, dry days, alerts)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '../../axiosInstance';
import {
  MapPin, Phone, RefreshCw, CheckCircle, AlertTriangle,
  Zap, Shield, Clock, ChevronRight,
  Droplets, Wind, ThermometerSun, Send, Signal,
  Navigation, Radio, CloudRain, Calendar, Bell, BellOff
} from 'lucide-react';
import { WiDaySunny, WiCloud } from 'react-icons/wi';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const USE_MOCK_API   = true;
const MOCK_AREA_TYPE = 'POLYGON'; // 'CIRCLE' | 'POLYGON'

const CAMARA_API_BASE      = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_TELCO_API_BASE      : undefined) || 'https://api.operator.example.com';
const CAMARA_TOKEN_URL     = `${CAMARA_API_BASE}/oauth2/token`;
const CAMARA_LOCATION_URL  = `${CAMARA_API_BASE}/location-retrieval/v0.5/retrieve`;
const CAMARA_CLIENT_ID     = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_TELCO_CLIENT_ID     : undefined) || 'your-client-id';
const CAMARA_CLIENT_SECRET = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_TELCO_CLIENT_SECRET : undefined) || 'your-client-secret';

const WEATHER_THRESHOLDS = {
  TEMP_LOW: 15, TEMP_HIGH: 30,
  HEAVY_RAIN: 10, STRONG_WIND: 20, DRY_HUMIDITY: 30
};

const SMS_SCHEDULE_CONFIG = {
  INTERVAL_DAYS: 10,
  DURATION_MONTHS: 3,
  get TOTAL_SENDS() { return Math.floor((this.DURATION_MONTHS * 30) / this.INTERVAL_DAYS); }
};

// ─── POLYGON HELPERS ──────────────────────────────────────────────────────────
const computeCentroid = (boundary) => {
  const n = boundary.length;
  if (n === 0) throw new Error('Empty polygon boundary');
  return {
    latitude:  boundary.reduce((s, p) => s + p.latitude,  0) / n,
    longitude: boundary.reduce((s, p) => s + p.longitude, 0) / n,
  };
};

const extractCenter = (area) => {
  if (area.areaType === 'CIRCLE')  return area.center;
  if (area.areaType === 'POLYGON') return computeCentroid(area.boundary);
  throw new Error(`Unknown areaType: ${area.areaType}`);
};

const polygonApproxRadius = (area) => {
  if (area.areaType === 'CIRCLE') return area.radius;
  const center = computeCentroid(area.boundary);
  const R = 6371000;
  let maxDist = 0;
  for (const p of area.boundary) {
    const dLat = (p.latitude  - center.latitude)  * (Math.PI / 180);
    const dLon = (p.longitude - center.longitude) * (Math.PI / 180);
    const a = Math.sin(dLat/2)**2
      + Math.cos(center.latitude * Math.PI/180)
      * Math.cos(p.latitude    * Math.PI/180)
      * Math.sin(dLon/2)**2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (dist > maxDist) maxDist = dist;
  }
  return Math.round(maxDist);
};

// ─── MOCK ─────────────────────────────────────────────────────────────────────
const mockLocate = async (phone) => {
  await new Promise(r => setTimeout(r, 1400 + Math.random() * 600));

  if (MOCK_AREA_TYPE === 'POLYGON') {
    const polygonByPhone = {
      '256700000001': [
        { latitude: -21.440, longitude: 47.075 },
        { latitude: -21.438, longitude: 47.098 },
        { latitude: -21.450, longitude: 47.105 },
        { latitude: -21.462, longitude: 47.100 },
        { latitude: -21.465, longitude: 47.082 },
        { latitude: -21.455, longitude: 47.070 },
      ],
      default: [
        { latitude:  0.340, longitude: 32.575 },
        { latitude:  0.342, longitude: 32.590 },
        { latitude:  0.352, longitude: 32.595 },
        { latitude:  0.358, longitude: 32.585 },
        { latitude:  0.355, longitude: 32.572 },
        { latitude:  0.345, longitude: 32.568 },
      ],
    };
    return {
      lastLocationTime: new Date().toISOString(),
      area: { areaType: 'POLYGON', boundary: polygonByPhone[phone] || polygonByPhone.default },
      _mock: true,
    };
  }

  const locs = {
    default:        { latitude: 0.3476,  longitude: 32.5825, radius: 250 },
    '256700000001': { latitude: 1.2916,  longitude: 32.1036, radius: 400 },
    '256700000002': { latitude: 0.6721,  longitude: 30.2144, radius: 150 },
  };
  const loc = locs[phone] || locs.default;
  return {
    lastLocationTime: new Date().toISOString(),
    area: { areaType: 'CIRCLE', center: { latitude: loc.latitude, longitude: loc.longitude }, radius: loc.radius },
    _mock: true,
  };
};

let _tok = null, _tokExp = 0;
const getCamaraToken = async () => {
  if (_tok && Date.now() < _tokExp) return _tok;
  const body = new URLSearchParams({
    grant_type: 'client_credentials', client_id: CAMARA_CLIENT_ID,
    client_secret: CAMARA_CLIENT_SECRET, scope: 'location-retrieval:read'
  });
  const res = await fetch(CAMARA_TOKEN_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body
  });
  if (!res.ok) throw new Error(`Token error: ${res.status}`);
  const data = await res.json();
  _tok = data.access_token;
  _tokExp = Date.now() + (data.expires_in - 60) * 1000;
  return _tok;
};

const retrieveLocation = async (phone) => {
  if (USE_MOCK_API) return mockLocate(phone);
  const token = await getCamaraToken();
  const res = await fetch(CAMARA_LOCATION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-Correlator': `req-${Date.now()}` },
    body: JSON.stringify({ device: { phoneNumber: phone }, maxAge: 120 })
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || `CAMARA ${res.status}`); }
  return res.json();
};

const fetchWeather = async (lat, lon) => {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,et0_fao_evapotranspiration` +
    `&forecast_days=10`
  );
  return res.json();
};

const analyzeWeather = (data) => {
  const h = data.hourly || {};
  const times = h.time || [], temps = h.temperature_2m || [];
  const hum = h.relative_humidity_2m || [], precip = h.precipitation || [];
  const wind = h.wind_speed_10m || [], et0 = h.et0_fao_evapotranspiration || [];

  const daily = {};
  for (let i = 0; i < times.length; i++) {
    const dk = times[i].split('T')[0];
    if (!daily[dk]) daily[dk] = { alerts: new Set(), maxT: -Infinity, minT: Infinity, rain: 0, maxW: 0, et0: 0, count: 0, dryHours: 0 };
    const d = daily[dk];
    d.maxT = Math.max(d.maxT, temps[i]);
    d.minT = Math.min(d.minT, temps[i]);
    d.rain += precip[i] || 0;
    d.maxW = Math.max(d.maxW, wind[i]);
    d.et0  += et0[i]  || 0;
    d.count++;
    if ((precip[i] || 0) < 0.1) d.dryHours++;

    if (precip[i] > WEATHER_THRESHOLDS.HEAVY_RAIN) d.alerts.add('Heavy Rain');
    if (temps[i]  > WEATHER_THRESHOLDS.TEMP_HIGH)  d.alerts.add('Extreme Heat');
    if (temps[i]  < WEATHER_THRESHOLDS.TEMP_LOW)   d.alerts.add('Extreme Cold');
    if (wind[i]   > WEATHER_THRESHOLDS.STRONG_WIND) d.alerts.add('Strong Wind');
    if (hum[i]    < WEATHER_THRESHOLDS.DRY_HUMIDITY) d.alerts.add('Dryness Alert');
  }

  const weatherAlerts = Object.entries(daily)
    .filter(([, d]) => d.alerts.size > 0)
    .map(([date, d]) => ({
      date, alerts: [...d.alerts],
      maxTemp: d.maxT.toFixed(1), minTemp: d.minT.toFixed(1),
      totalRain: d.rain.toFixed(1), maxWind: d.maxW.toFixed(1)
    }));

  const dailyEntries   = Object.entries(daily);
  const totalRain10d   = dailyEntries.reduce((s, [, d]) => s + d.rain, 0);
  const avgDailyRain   = totalRain10d / Math.max(dailyEntries.length, 1);
  const rainyDays      = dailyEntries.filter(([, d]) => d.rain > 0.5).length;
  const dryDays        = dailyEntries.filter(([, d]) => d.rain < 0.1).length;
  const heavyRainDays  = dailyEntries.filter(([, d]) => d.rain > WEATHER_THRESHOLDS.HEAVY_RAIN).length;
  const hotDays        = dailyEntries.filter(([, d]) => d.maxT > WEATHER_THRESHOLDS.TEMP_HIGH).length;
  const droughtRisk    = avgDailyRain < 2 && rainyDays < 3;

  // overall min/max temp over 10 days
  const allMaxT = dailyEntries.map(([, d]) => d.maxT).filter(v => isFinite(v));
  const allMinT = dailyEntries.map(([, d]) => d.minT).filter(v => isFinite(v));
  const overallMaxTemp = allMaxT.length ? Math.max(...allMaxT) : 0;
  const overallMinTemp = allMinT.length ? Math.min(...allMinT) : 0;

  const first = Object.values(daily)[0] || {};
  return {
    weatherAlerts, dailyEt0: first.et0 || 0, dailyRain: first.rain || 0,
    totalRain10d, avgDailyRain, rainyDays, dryDays, heavyRainDays, hotDays,
    droughtRisk, projectedMonthlyRain: avgDailyRain * 30,
    overallMaxTemp, overallMinTemp,
  };
};

// ─── SMS BUILDER — enriched ───────────────────────────────────────────────────
const buildSmsContent = (advisory, selectedFarm) => {
  if (!advisory || !selectedFarm) return '';
  const net    = Math.max(0, advisory.dailyEt0 - advisory.dailyRain);
  const alerts = [];
  if (advisory.droughtRisk)       alerts.push('⚠️DRY');
  if (advisory.hotDays > 0)       alerts.push(`🌡️HOT(${advisory.hotDays}d)`);
  if (advisory.heavyRainDays > 0) alerts.push(`🌧️HEAVY(${advisory.heavyRainDays}d)`);
  const zoneFlag = advisory.areaType === 'POLYGON' ? '[Zone]' : '';

  return (
    `${zoneFlag}[${selectedFarm.name}] ` +
    `Temp:${advisory.overallMinTemp.toFixed(0)}-${advisory.overallMaxTemp.toFixed(0)}°C. ` +
    `Rain:${advisory.totalRain10d.toFixed(0)}mm/10d(avg ${advisory.avgDailyRain.toFixed(1)}mm/d). ` +
    `Dry:${advisory.dryDays}d. ` +
    (alerts.length ? alerts.join(' ') + '. ' : '') +
    `Irrig:${net.toFixed(1)}mm.`
  ).substring(0, 160);
};

// ─── SCHEDULE HELPERS ─────────────────────────────────────────────────────────
const generateSchedule = (startDate = new Date()) => {
  const schedule = [];
  for (let i = 0; i < SMS_SCHEDULE_CONFIG.TOTAL_SENDS; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i * SMS_SCHEDULE_CONFIG.INTERVAL_DAYS);
    schedule.push({
      id: i + 1,
      date: d.toISOString().split('T')[0],
      dateLabel: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: i === 0 ? 'pending' : 'scheduled',
      sent: false,
    });
  }
  return schedule;
};

// ─── ALERT CONFIG ─────────────────────────────────────────────────────────────
const ALERT_CONFIG = {
  'Heavy Rain':    { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   icon: <CloudRain size={13} /> },
  'Extreme Heat':  { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    icon: <ThermometerSun size={13} /> },
  'Extreme Cold':  { bg: 'bg-sky-50',    border: 'border-sky-200',    text: 'text-sky-700',    icon: <ThermometerSun size={13} /> },
  'Strong Wind':   { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', icon: <Wind size={13} /> },
  'Dryness Alert': { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  icon: <WiDaySunny size={15} /> },
};
const getAlertCfg = (type) => ALERT_CONFIG[type] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: <AlertTriangle size={13} /> };

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────
const StepBadge = ({ n, label, active, done }) => (
  <div className={`flex items-center gap-2 text-xs font-medium transition-colors ${active ? 'text-teal-700' : done ? 'text-green-600' : 'text-gray-400'}`}>
    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${done ? 'bg-green-100 text-green-700' : active ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
      {done ? <CheckCircle size={11} /> : n}
    </span>
    {label}
  </div>
);

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

const Pipeline = () => {
  const steps = [
    { icon: <Phone size={11} />, label: 'Phone ID' },
    { icon: <Shield size={11} />, label: 'OAuth2' },
    { icon: <Radio size={11} />, label: 'CAMARA API' },
    { icon: <MapPin size={11} />, label: 'GPS coords' },
    { icon: <CloudRain size={11} />, label: 'Rainfall' },
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

const SectionCard = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>{children}</div>
);

const SectionHeader = ({ icon, title, badge }) => (
  <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-50">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600">{icon}</div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
    </div>
    {badge}
  </div>
);

const AreaTypeBadge = ({ areaType }) => areaType === 'POLYGON' ? (
  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
    <MapPin size={11} /> Polygon zone
  </span>
) : (
  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
    <Signal size={11} /> Circle point
  </span>
);

// ─── AREA MAP — SVG visual for CIRCLE and POLYGON ─────────────────────────────
const AreaMap = ({ locationResult }) => {
  if (!locationResult) return null;
  const { area } = locationResult;
  const W = 400, H = 220, PAD = 30;

  if (area.areaType === 'CIRCLE') {
    const cx = W / 2, cy = H / 2;
    // draw grid + circle
    const gridLines = [];
    for (let x = 0; x <= W; x += 20) gridLines.push(<line key={`vl${x}`} x1={x} y1={0} x2={x} y2={H} stroke="#d1fae5" strokeWidth="0.5" />);
    for (let y = 0; y <= H; y += 20) gridLines.push(<line key={`hl${y}`} x1={0} y1={y} x2={W} y2={y} stroke="#d1fae5" strokeWidth="0.5" />);

    return (
      <div className="rounded-xl overflow-hidden border border-blue-100 bg-blue-50">
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-100/60 border-b border-blue-100">
          <Signal size={13} className="text-blue-600" />
          <span className="text-xs font-semibold text-blue-700">CAMARA Area — CIRCLE</span>
          <span className="ml-auto text-xs text-blue-500">radius: ±{area.radius}m</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 180 }}>
          <rect width={W} height={H} fill="#eff6ff" />
          {gridLines}
          {/* accuracy rings */}
          {[0.25, 0.5, 0.75, 1].map(r => (
            <circle key={r} cx={cx} cy={cy} r={(H / 2 - PAD) * r}
              fill="none" stroke="#bfdbfe" strokeWidth="1" strokeDasharray={r < 1 ? "4 4" : "0"} />
          ))}
          {/* main zone */}
          <circle cx={cx} cy={cy} r={H / 2 - PAD} fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth="2" />
          {/* center dot */}
          <circle cx={cx} cy={cy} r={5} fill="#1d4ed8" />
          <circle cx={cx} cy={cy} r={10} fill="none" stroke="#1d4ed8" strokeWidth="1.5" />
          {/* coords label */}
          <text x={cx} y={cy + 25} textAnchor="middle" fontSize="10" fill="#1e40af" fontFamily="monospace">
            {area.center.latitude.toFixed(4)}, {area.center.longitude.toFixed(4)}
          </text>
          {/* radius label */}
          <line x1={cx} y1={cy} x2={cx + H / 2 - PAD} y2={cy} stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 3" />
          <text x={cx + (H / 2 - PAD) / 2} y={cy - 6} textAnchor="middle" fontSize="9" fill="#3b82f6">±{area.radius}m</text>
        </svg>
      </div>
    );
  }

  if (area.areaType === 'POLYGON') {
    const pts = area.boundary;
    const lats = pts.map(p => p.latitude);
    const lons = pts.map(p => p.longitude);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLon = Math.min(...lons), maxLon = Math.max(...lons);
    const ranLat = maxLat - minLat || 0.001;
    const ranLon = maxLon - minLon || 0.001;

    // project to SVG coords (lat inverted)
    const proj = (p) => ({
      x: PAD + ((p.longitude - minLon) / ranLon) * (W - 2 * PAD),
      y: H - PAD - ((p.latitude  - minLat) / ranLat) * (H - 2 * PAD),
    });

    const svgPts = pts.map(proj);
    const pointsStr = svgPts.map(p => `${p.x},${p.y}`).join(' ');
    const center = computeCentroid(pts);
    const cProj = proj(center);

    // grid
    const gridLines = [];
    for (let x = 0; x <= W; x += 20) gridLines.push(<line key={`vl${x}`} x1={x} y1={0} x2={x} y2={H} stroke="#bbf7d0" strokeWidth="0.5" />);
    for (let y = 0; y <= H; y += 20) gridLines.push(<line key={`hl${y}`} x1={0} y1={y} x2={W} y2={y} stroke="#bbf7d0" strokeWidth="0.5" />);

    return (
      <div className="rounded-xl overflow-hidden border border-green-200 bg-green-50">
        <div className="flex items-center gap-2 px-4 py-2 bg-green-100/60 border-b border-green-100">
          <MapPin size={13} className="text-green-600" />
          <span className="text-xs font-semibold text-green-700">CAMARA Area — POLYGON</span>
          <span className="ml-auto text-xs text-green-500">{pts.length} boundary points</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 180 }}>
          <rect width={W} height={H} fill="#f0fdf4" />
          {gridLines}
          {/* polygon fill */}
          <polygon points={pointsStr} fill="rgba(34,197,94,0.2)" stroke="#16a34a" strokeWidth="2.5" strokeLinejoin="round" />
          {/* boundary points */}
          {svgPts.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={5} fill="#16a34a" stroke="white" strokeWidth="1.5" />
              <text x={p.x + 7} y={p.y + 4} fontSize="8" fill="#166534" fontFamily="monospace">P{i + 1}</text>
            </g>
          ))}
          {/* centroid */}
          <circle cx={cProj.x} cy={cProj.y} r={6} fill="#0f172a" stroke="white" strokeWidth="2" />
          <circle cx={cProj.x} cy={cProj.y} r={14} fill="none" stroke="#0f172a" strokeWidth="1" strokeDasharray="3 3" />
          {/* centroid label */}
          <text x={cProj.x} y={cProj.y + 26} textAnchor="middle" fontSize="9" fill="#0f172a" fontFamily="monospace">
            centroïde {center.latitude.toFixed(4)}, {center.longitude.toFixed(4)}
          </text>
          {/* edges with dashes to show boundary */}
          {svgPts.map((p, i) => {
            const next = svgPts[(i + 1) % svgPts.length];
            return <line key={`edge${i}`} x1={p.x} y1={p.y} x2={next.x} y2={next.y} stroke="#15803d" strokeWidth="1" strokeDasharray="4 3" opacity="0.4" />;
          })}
        </svg>
        {/* boundary coords table */}
        <div className="px-4 pb-3">
          <div className="grid grid-cols-3 gap-1">
            {pts.map((p, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-green-700 bg-green-100/50 rounded px-2 py-1">
                <span className="w-4 h-4 rounded-full bg-green-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">{i + 1}</span>
                <span className="font-mono">{p.latitude.toFixed(3)}, {p.longitude.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// ─── SCHEDULE ROW ─────────────────────────────────────────────────────────────
const ScheduleRow = ({ item, onSend, isSending }) => {
  const statusStyles = {
    sent:      { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-100',  label: 'Sent' },
    pending:   { bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-100',   label: 'Ready to send' },
    scheduled: { bg: 'bg-gray-50',   text: 'text-gray-500',   border: 'border-gray-100',   label: 'Scheduled' },
    failed:    { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-100',    label: 'Failed' },
  };
  const s = statusStyles[item.status] || statusStyles.scheduled;
  const isActive = item.status === 'pending';
  return (
    <div className={`flex items-center gap-4 p-3 rounded-xl border transition-colors ${isActive ? 'bg-teal-50/50 border-teal-100' : 'bg-gray-50/50 border-gray-100'}`}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${isActive ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
        {item.id}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Calendar size={11} className="text-gray-400 shrink-0" />
          <span className="text-sm font-medium text-gray-800">{item.dateLabel}</span>
        </div>
        {item.sentAt && (
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
            <Clock size={10} /> Sent at {item.sentAt}
          </p>
        )}
      </div>
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${s.bg} ${s.text} ${s.border}`}>{s.label}</span>
      {isActive && (
        <button onClick={() => onSend(item.id)} disabled={isSending}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 disabled:bg-gray-200 disabled:text-gray-400 transition-all shrink-0">
          {isSending ? <RefreshCw size={11} className="animate-spin" /> : <Send size={11} />}
          Send now
        </button>
      )}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const LocationAdvisory = () => {
  const [farms, setFarms]               = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [phoneInput, setPhoneInput]     = useState('');
  const [locationResult, setLocationResult] = useState(null);
  const [status, setStatus]   = useState('idle');
  const [error, setError]     = useState(null);
  const [advisory, setAdvisory] = useState(null);
  const [smsPhone, setSmsPhone] = useState('');
  const [schedule, setSchedule] = useState([]);
  const [schedulingEnabled, setSchedulingEnabled] = useState(false);
  const [sendingId, setSendingId]   = useState(null);
  const [scheduleStartDate, setScheduleStartDate] = useState(new Date().toISOString().split('T')[0]);
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
    setLocationResult(null); setAdvisory(null);
    setStatus('idle'); setError(null);
    setSchedule([]); setSchedulingEnabled(false);
  };

  const runFlow = useCallback(async () => {
    if (!phoneInput.trim()) return;
    setError(null); setLocationResult(null); setAdvisory(null);
    setSchedule([]); setSchedulingEnabled(false);
    setStatus('locating');
    let loc;
    try {
      loc = await retrieveLocation(phoneInput.trim());
      setLocationResult(loc);
      setStatus('located');
      const center = extractCenter(loc.area);
      const areaLabel = loc.area.areaType === 'POLYGON'
        ? `Polygon (${loc.area.boundary.length} pts) — centroïde ${center.latitude.toFixed(4)}, ${center.longitude.toFixed(4)}`
        : `Circle — ${center.latitude.toFixed(4)}, ${center.longitude.toFixed(4)}`;
      showNotif('success', `Location retrieved: ${areaLabel}`);
    } catch (err) {
      setError(err.message); setStatus('error');
      showNotif('error', 'Location failed: ' + err.message); return;
    }

    setStatus('analyzing');
    try {
      const { latitude, longitude } = extractCenter(loc.area);
      const raw = await fetchWeather(latitude, longitude);
      const analysis = analyzeWeather(raw);

      let placeName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      try {
        const gr = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json` +
          `?access_token=pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q&types=place`
        );
        const gd = await gr.json();
        if (gd.features?.[0]) placeName = gd.features[0].place_name;
      } catch (_) {}

      setAdvisory({
        ...analysis, latitude, longitude, placeName,
        radius: polygonApproxRadius(loc.area),
        areaType: loc.area.areaType,
        boundary: loc.area.areaType === 'POLYGON' ? loc.area.boundary : null,
      });
      setStatus('done');
      showNotif('success', 'Advisory generated successfully');
    } catch (err) {
      setError('Weather analysis failed: ' + err.message); setStatus('error');
    }
  }, [phoneInput]);

  const smsContent = buildSmsContent(advisory, selectedFarm);

  const enableScheduling = () => {
    setSchedule(generateSchedule(new Date(scheduleStartDate)));
    setSchedulingEnabled(true);
    showNotif('success', `${SMS_SCHEDULE_CONFIG.TOTAL_SENDS} SMS scheduled over ${SMS_SCHEDULE_CONFIG.DURATION_MONTHS} months`);
  };

  const disableScheduling = () => { setSchedulingEnabled(false); setSchedule([]); };

  const sendScheduledSms = async (itemId) => {
    const phone = (smsPhone || phoneInput).replace(/\s/g, '');
    if (!phone) { showNotif('error', 'No recipient phone number'); return; }
    setSendingId(itemId);
    try {
      const res = await axiosInstance.post('/api/notifications/sms', { phone, message: smsContent });
      const sentAt = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      setSchedule(prev => prev.map(item =>
        item.id !== itemId ? item : { ...item, status: res.status === 200 ? 'sent' : 'failed', sent: res.status === 200, sentAt }
      ));
      if (res.status === 200) {
        setSchedule(prev => {
          const idx = prev.findIndex(i => i.id === itemId);
          if (idx < prev.length - 1) return prev.map((item, i) => i === idx + 1 ? { ...item, status: 'pending' } : item);
          return prev;
        });
        showNotif('success', `SMS #${itemId} sent successfully`);
      }
    } catch (err) {
      setSchedule(prev => prev.map(item => item.id === itemId ? { ...item, status: 'failed' } : item));
      showNotif('error', `Send failed: ${err.message}`);
    } finally { setSendingId(null); }
  };

  const busy      = status === 'locating' || status === 'analyzing';
  const isDone    = status === 'done';
  const isError   = status === 'error';
  const net_irr   = advisory ? Math.max(0, advisory.dailyEt0 - advisory.dailyRain) : 0;
  const scheduleStats = schedule.length > 0 ? {
    sent: schedule.filter(s => s.status === 'sent').length,
    next: schedule.find(s => s.status === 'pending'),
  } : null;

  return (
    <div className="min-h-screen bg-gray-50/60 font-sans">

      {notification && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border transition-all
          ${notification.type === 'success' ? 'bg-white border-green-200 text-green-800' : 'bg-white border-red-200 text-red-800'}`}>
          {notification.type === 'success'
            ? <CheckCircle size={15} className="text-green-500 shrink-0" />
            : <AlertTriangle size={15} className="text-red-500 shrink-0" />}
          {notification.message}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-5">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <Navigation size={16} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">CAMARA Open Gateway</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">GPS Auto-Location & Weather Advisory</h1>
          <p className="text-sm text-gray-500">
            Locate farmers via CAMARA (Circle or Polygon), analyze weather data, and schedule automated SMS every {SMS_SCHEDULE_CONFIG.INTERVAL_DAYS} days for {SMS_SCHEDULE_CONFIG.DURATION_MONTHS} months.
          </p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-6 px-1 mb-2">
          <StepBadge n="1" label="Selection"    active={status === 'idle'} done={status !== 'idle'} />
          <div className="h-px w-6 bg-gray-200" />
          <StepBadge n="2" label="Location"     active={status === 'locating' || status === 'analyzing'} done={isDone || (isError && !!locationResult)} />
          <div className="h-px w-6 bg-gray-200" />
          <StepBadge n="3" label="Weather"      active={status === 'analyzing'} done={isDone} />
          <div className="h-px w-6 bg-gray-200" />
          <StepBadge n="4" label="SMS Schedule" active={isDone} done={schedulingEnabled} />
        </div>

        {/* SECTION 1 — Farm & Phone */}
        <SectionCard>
          <SectionHeader
            icon={<Phone size={16} />}
            title="Farm Selection"
            badge={USE_MOCK_API && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Simulation — {MOCK_AREA_TYPE}
              </span>
            )}
          />
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Farm</label>
                <select className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all appearance-none cursor-pointer"
                  onChange={e => onFarmChange(e.target.value)}>
                  <option value="">Select a farm…</option>
                  {farms.map(f => <option key={f.id} value={f.id}>{f.name}{f.subcounty ? ` — ${f.subcounty}` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Phone number <span className="text-gray-400 font-normal ml-1 normal-case">(CAMARA identifier)</span>
                </label>
                <input type="tel" placeholder="256XXXXXXXXX" value={phoneInput}
                  onChange={e => setPhoneInput(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all" />
              </div>
            </div>
            {USE_MOCK_API && (
              <div className="flex items-center gap-6 p-3 bg-amber-50 rounded-lg border border-amber-100 text-xs">
                <span className="font-semibold text-amber-700">Simulation config</span>
                <span className="text-amber-700">
                  Area type: <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded">{MOCK_AREA_TYPE}</code>
                  <span className="text-amber-500 ml-2">(change MOCK_AREA_TYPE in config)</span>
                </span>
                <span className="text-amber-600/70 ml-auto">Test: 256700000001 · 256700000002</span>
              </div>
            )}
          </div>
        </SectionCard>

        {/* SECTION 2 — Locate */}
        <SectionCard>
          <SectionHeader icon={<Signal size={16} />} title="GPS Location via CAMARA API" />
          <div className="p-6 space-y-5">
            <Pipeline />
            <div className="flex items-center gap-4">
              <button onClick={runFlow} disabled={!phoneInput.trim() || busy}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 disabled:bg-gray-200 disabled:text-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/30">
                {busy ? <><RefreshCw size={14} className="animate-spin" />Processing…</> : <><Zap size={14} />Locate &amp; Analyze Weather</>}
              </button>
              {status !== 'idle' && (
                <div className="flex items-center gap-2 text-sm">
                  {busy    && <RefreshCw size={13} className="animate-spin text-teal-500" />}
                  {isError && <AlertTriangle size={13} className="text-red-500" />}
                  {isDone  && <CheckCircle  size={13} className="text-green-500" />}
                  <span className={`font-medium ${isError ? 'text-red-600' : isDone ? 'text-green-600' : 'text-teal-600'}`}>
                    {{ locating: 'Retrieving GPS via CAMARA API…', located: 'GPS located — Fetching weather…', analyzing: 'Analyzing weather data…', done: 'Advisory generated.', error: error }[status]}
                  </span>
                </div>
              )}
            </div>

            {/* GPS metrics for CIRCLE */}
            {locationResult && locationResult.area.areaType === 'CIRCLE' && (
              <div className="grid grid-cols-3 gap-3">
                <MetricCard label="Latitude"  value={locationResult.area.center.latitude.toFixed(5)}  icon={<MapPin  size={15} />} accent="bg-violet-50 border-violet-100" sub="N/S coordinate" />
                <MetricCard label="Longitude" value={locationResult.area.center.longitude.toFixed(5)} icon={<MapPin  size={15} />} accent="bg-blue-50 border-blue-100"     sub="E/W coordinate" />
                <MetricCard label="Accuracy"  value={`± ${locationResult.area.radius}`} unit="m"      icon={<Signal size={15} />} accent="bg-gray-50 border-gray-100"     sub="Accuracy radius" />
              </div>
            )}

            {/* ── AREA MAP — SVG visual ── */}
            {locationResult && <AreaMap locationResult={locationResult} />}
          </div>
        </SectionCard>

        {/* SECTION 3 — Weather Results */}
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
              <AreaTypeBadge areaType={advisory.areaType} />
              <span className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">Located</span>
            </div>

            {/* Summary cards — 5 metrics including temp */}
            <div className="grid grid-cols-5 gap-3">
              <MetricCard label="Temp range 10d"   value={`${advisory.overallMinTemp.toFixed(0)}–${advisory.overallMaxTemp.toFixed(0)}`} unit="°C" icon={<ThermometerSun size={15} />} accent="bg-red-50 border-red-100"   sub="Min–Max" />
              <MetricCard label="Total 10d rain"   value={advisory.totalRain10d.toFixed(0)}   unit="mm"   icon={<CloudRain  size={15} />} accent="bg-blue-50 border-blue-100"   sub="10-day cumulative" />
              <MetricCard label="Avg daily rain"   value={advisory.avgDailyRain.toFixed(1)}   unit="mm/d" icon={<Droplets   size={15} />} accent="bg-sky-50 border-sky-100"    sub="10-day average" />
              <MetricCard label="Dry days"         value={advisory.dryDays}                   unit="/ 10" icon={<WiDaySunny size={18} />} accent={advisory.dryDays > 6 ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'} sub={advisory.dryDays > 6 ? 'Drought risk' : 'Normal'} />
              <MetricCard label="Hot days (>30°C)" value={advisory.hotDays}                   unit="/ 10" icon={<ThermometerSun size={15} />} accent={advisory.hotDays > 3 ? 'bg-orange-50 border-orange-100' : 'bg-gray-50 border-gray-100'} sub={advisory.hotDays > 3 ? 'Heat stress' : 'Normal'} />
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* Water Balance */}
              <SectionCard>
                <SectionHeader icon={<Droplets size={16} />} title="Water Balance (24h)" />
                <div className="p-6 space-y-3">
                  <MetricCard label="Evapotranspiration ET₀" value={advisory.dailyEt0.toFixed(2)}  unit="mm/d" icon={<WiCloud size={18} />} sub="Potential water need" />
                  <MetricCard label="Rainfall today"          value={advisory.dailyRain.toFixed(1)} unit="mm"   icon={<CloudRain size={15} />} accent="bg-blue-50 border-blue-100" sub="24h precipitation" />
                  <div className={`rounded-xl p-4 border ${net_irr > 0 ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Net Irrigation Required</span>
                      <Droplets size={15} className={net_irr > 0 ? 'text-orange-400' : 'text-green-400'} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl font-semibold ${net_irr > 0 ? 'text-orange-700' : 'text-green-700'}`}>{net_irr.toFixed(2)}</span>
                      <span className="text-sm text-gray-500">mm</span>
                    </div>
                    <p className="text-xs mt-1 text-gray-400">{net_irr > 0 ? 'Additional input required' : 'Rainfall sufficient — no irrigation needed'}</p>
                  </div>
                </div>
              </SectionCard>

              {/* Risk Assessment */}
              <SectionCard>
                <SectionHeader icon={<CloudRain size={16} />} title="Rainfall Risk Assessment"
                  badge={
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${advisory.droughtRisk ? 'bg-red-50 text-red-700 border-red-100' : advisory.heavyRainDays > 0 ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                      {advisory.droughtRisk ? 'Drought risk' : advisory.heavyRainDays > 0 ? 'Excess rain' : 'Normal'}
                    </span>
                  }
                />
                <div className="p-6 space-y-3">
                  <div className={`flex items-start gap-3 p-3 rounded-xl border ${advisory.droughtRisk ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${advisory.droughtRisk ? 'bg-amber-100' : 'bg-gray-100'}`}>
                      <WiDaySunny size={16} className={advisory.droughtRisk ? 'text-amber-600' : 'text-gray-400'} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${advisory.droughtRisk ? 'text-amber-800' : 'text-gray-500'}`}>Drought risk</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {advisory.droughtRisk
                          ? `Low rainfall — avg ${advisory.avgDailyRain.toFixed(1)}mm/d, ${advisory.dryDays} dry days`
                          : 'No drought risk in the next 10 days'}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-start gap-3 p-3 rounded-xl border ${advisory.heavyRainDays > 0 ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${advisory.heavyRainDays > 0 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <CloudRain size={13} className={advisory.heavyRainDays > 0 ? 'text-blue-600' : 'text-gray-400'} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${advisory.heavyRainDays > 0 ? 'text-blue-800' : 'text-gray-500'}`}>Heavy rain events</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {advisory.heavyRainDays > 0 ? `${advisory.heavyRainDays} day(s) with >10mm expected` : 'No heavy rain events expected'}
                      </p>
                    </div>
                  </div>
                  {advisory.hotDays > 0 && (
                    <div className="flex items-start gap-3 p-3 rounded-xl border bg-red-50 border-red-100">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-red-100">
                        <ThermometerSun size={13} className="text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-red-800">Heat stress</p>
                        <p className="text-xs text-gray-500 mt-0.5">{advisory.hotDays} day(s) above 30°C — monitor crops closely</p>
                      </div>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {advisory.droughtRisk ? '⚠️ Irrigate regularly. Monitor soil moisture closely.'
                        : advisory.heavyRainDays > 0 ? '🌧️ Ensure proper drainage. Delay fertilizer on heavy rain days.'
                        : '✅ Weather conditions normal for the next 10 days.'}
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Weather alerts */}
            {advisory.weatherAlerts.length > 0 && (
              <SectionCard>
                <SectionHeader icon={<WiDaySunny size={20} />} title="Weather Alerts — 10-day forecast"
                  badge={<span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">{advisory.weatherAlerts.length} day(s) flagged</span>}
                />
                <div className="p-6 space-y-2">
                  {advisory.weatherAlerts.slice(0, 6).map((wa, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                      <div className="shrink-0 text-xs font-semibold text-gray-500 w-20 pt-0.5">{wa.date}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {wa.alerts.map(type => { const cfg = getAlertCfg(type); return (
                            <span key={type} className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.text}`}>{cfg.icon}{type}</span>
                          ); })}
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1.5"><ThermometerSun size={12} className="text-gray-400" /><span>{wa.minTemp}° – {wa.maxTemp}°C</span></div>
                          <div className="flex items-center gap-1.5"><CloudRain size={12} className="text-gray-400" /><span>{wa.totalRain} mm</span></div>
                          <div className="flex items-center gap-1.5"><Wind size={12} className="text-gray-400" /><span>{wa.maxWind} km/h</span></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* All clear */}
            {advisory.weatherAlerts.length === 0 && !advisory.droughtRisk && advisory.heavyRainDays === 0 && advisory.hotDays === 0 && (
              <SectionCard>
                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
                    <CheckCircle size={26} className="text-green-500" />
                  </div>
                  <h4 className="text-base font-semibold text-gray-900 mb-1">All Clear</h4>
                  <p className="text-sm text-gray-500 max-w-xs">No weather alerts detected over the next 10 days.</p>
                </div>
              </SectionCard>
            )}

            {/* SECTION 4 — SMS Scheduling */}
            <SectionCard>
              <SectionHeader icon={<Send size={16} />} title="Weather SMS — Automated Scheduling"
                badge={schedulingEnabled
                  ? <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200"><Bell size={11} />{SMS_SCHEDULE_CONFIG.TOTAL_SENDS} SMS / {SMS_SCHEDULE_CONFIG.DURATION_MONTHS} months</span>
                  : <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-200"><BellOff size={11} />Not scheduled</span>}
              />
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recipient Number</label>
                    <input type="tel" placeholder={phoneInput || '256XXXXXXXXX'} value={smsPhone}
                      onChange={e => setSmsPhone(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all" />
                    <p className="text-xs text-gray-400 mt-1">Format: 256783130358</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Schedule Start Date</label>
                    <input type="date" value={scheduleStartDate} onChange={e => setScheduleStartDate(e.target.value)}
                      disabled={schedulingEnabled}
                      className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 disabled:bg-gray-50 disabled:text-gray-400 transition-all" />
                  </div>
                </div>

                {/* SMS preview — enriched */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">SMS Content — Temp · Rain · Dry · Hot · Alerts</span>
                    <span className="text-xs text-gray-400 tabular-nums">{smsContent.length} / 160 chars</span>
                  </div>
                  <p className="font-mono text-xs text-gray-700 leading-relaxed">
                    {smsContent || 'Select a farm and complete location to preview…'}
                  </p>
                  {smsContent.length > 0 && (
                    <div className="mt-2 h-1 rounded-full bg-gray-200 overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${(smsContent.length / 160) * 100}%` }} />
                    </div>
                  )}
                  {/* legend */}
                  {smsContent.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
                      {[
                        { label: 'Temp min–max', color: 'bg-red-100 text-red-700' },
                        { label: 'Precipitation', color: 'bg-blue-100 text-blue-700' },
                        { label: 'Dry days', color: 'bg-amber-100 text-amber-700' },
                        { label: 'Hot days', color: 'bg-orange-100 text-orange-700' },
                        { label: 'Alerts', color: 'bg-gray-100 text-gray-600' },
                        { label: 'Irrigation need', color: 'bg-teal-100 text-teal-700' },
                      ].map(b => (
                        <span key={b.label} className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.color}`}>{b.label}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <Calendar size={15} className="text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800">Automatic SMS every {SMS_SCHEDULE_CONFIG.INTERVAL_DAYS} days — {SMS_SCHEDULE_CONFIG.TOTAL_SENDS} total</p>
                    <p className="text-xs text-blue-600/80 mt-0.5">Sends weather advisory over {SMS_SCHEDULE_CONFIG.DURATION_MONTHS} months. Can be automated via cron job on your backend.</p>
                  </div>
                </div>

                {!schedulingEnabled ? (
                  <button onClick={enableScheduling} disabled={!smsContent}
                    className="inline-flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 disabled:bg-gray-200 disabled:text-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/30">
                    <Bell size={14} /> Enable {SMS_SCHEDULE_CONFIG.TOTAL_SENDS}-message schedule
                  </button>
                ) : (
                  <div className="flex items-center gap-4">
                    {scheduleStats && (
                      <div className="flex-1 flex items-center gap-4">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${(scheduleStats.sent / SMS_SCHEDULE_CONFIG.TOTAL_SENDS) * 100}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 shrink-0">{scheduleStats.sent} / {SMS_SCHEDULE_CONFIG.TOTAL_SENDS} sent</span>
                      </div>
                    )}
                    <button onClick={disableScheduling}
                      className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-semibold text-gray-500 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
                      <BellOff size={13} /> Cancel schedule
                    </button>
                  </div>
                )}

                {schedulingEnabled && schedule.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">SMS Schedule — {SMS_SCHEDULE_CONFIG.INTERVAL_DAYS}-day intervals</span>
                      {scheduleStats?.next && <span className="text-xs text-teal-600 font-medium">Next: {scheduleStats.next.dateLabel}</span>}
                    </div>
                    {schedule.map(item => (
                      <ScheduleRow key={item.id} item={item} onSend={sendScheduledSms} isSending={sendingId === item.id} />
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Integration guide */}
            <details className="bg-white rounded-2xl border border-gray-100 shadow-sm group">
              <summary className="flex items-center gap-3 px-6 py-4 cursor-pointer select-none list-none">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500"><Shield size={15} /></div>
                <span className="text-sm font-semibold text-gray-700">Integration guide — Switching from simulation to live operator API</span>
                <ChevronRight size={15} className="text-gray-400 ml-auto group-open:rotate-90 transition-transform" />
              </summary>
              <div className="px-6 pb-6">
                <div className="bg-gray-950 rounded-xl p-4 font-mono text-xs leading-relaxed space-y-1.5">
                  <p><span className="text-green-400">1.</span> <span className="text-gray-300">Set</span> <span className="text-amber-300">USE_MOCK_API = false</span></p>
                  <p><span className="text-green-400">2.</span> <span className="text-gray-300">Add to .env:</span></p>
                  <p className="pl-4 text-blue-300">VITE_TELCO_API_BASE=https://api.your-operator.com</p>
                  <p className="pl-4 text-blue-300">VITE_TELCO_CLIENT_ID=your-client-id</p>
                  <p className="pl-4 text-blue-300">VITE_TELCO_CLIENT_SECRET=your-client-secret</p>
                  <p><span className="text-green-400">3.</span> <span className="text-gray-300">Credentials: MTN / Airtel Uganda Open Gateway</span></p>
                  <p><span className="text-green-400">4.</span> <span className="text-gray-300">Scope:</span> <span className="text-violet-300">location-retrieval:read</span></p>
                  <p><span className="text-green-400">5.</span> <span className="text-gray-300">Polygon handled by</span> <span className="text-amber-300">extractCenter(loc.area)</span> <span className="text-gray-500">— auto CIRCLE/POLYGON</span></p>
                  <p><span className="text-green-400">6.</span> <span className="text-gray-300">Cron job:</span> <span className="text-amber-300">POST /api/notifications/sms</span> <span className="text-gray-500">every 10 days</span></p>
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
