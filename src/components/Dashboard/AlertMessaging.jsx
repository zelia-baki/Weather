import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosInstance';
import {
  AlertTriangle, Cloud, Wind, Droplets, ThermometerSun,
  Bug, MapPin, Phone, Calendar, Send, RefreshCw, CheckCircle, XCircle, Leaf, Sun
} from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

const PEST_TO_CROPS = {
  "Fall Armyworm":    ["Maize", "Corn", "Sorghum", "Millet"],
  "Stem Borers":      ["Maize", "Corn", "Rice", "Sorghum", "Sugarcane"],
  "Corn Earworm":     ["Maize", "Corn", "Tomato", "Cotton", "Sorghum"],
  "Black Cutworm":    ["Maize", "Corn", "Beans", "Vegetables", "Tobacco", "Cassava"],
  "Coffee Berry Borer": ["Coffee"],
  "Coffee Leaf Miner":  ["Coffee"],
  "Aphids":           ["Beans", "Coffee", "Maize", "Corn", "Cassava", "Vegetables", "Groundnut", "Soybean", "Cabbage", "Tomato"],
  "Peach Twig Borer": ["Peach", "Apple", "Fruit Trees", "Plum", "Apricot", "Mango"],
};

const PEST_GDD_THRESHOLDS = {
  "Fall Armyworm":    140,
  "Aphids":           100,
  "Stem Borers":      180,
  "Corn Earworm":     220,
  "Black Cutworm":    280,
  "Peach Twig Borer": 350,
  "Coffee Berry Borer": 120,
  "Coffee Leaf Miner":  150,
};

// Pest-specific scouting/treatment advice, used in place of a generic
// "Inspect fields now" line so farmers get something actionable for the
// specific pest that triggered the alert.
const PEST_ACTIONS = {
  "Fall Armyworm":     "Scout leaves for larvae, apply Bt if found",
  "Aphids":            "Check leaf undersides, monitor 3 days",
  "Stem Borers":       "Inspect stems for entry holes",
  "Corn Earworm":      "Check ear tips, spray at silking if needed",
  "Black Cutworm":     "Check seedling base at soil line",
  "Peach Twig Borer":  "Inspect shoot tips for wilting",
  "Coffee Berry Borer": "Check berries for holes, harvest ripe fruit",
  "Coffee Leaf Miner":  "Inspect leaves for mines, remove affected ones",
};

const WEATHER_SHORT = {
  "Heavy Rain":    "RAIN",
  "Extreme Heat":  "HEAT",
  "Extreme Cold":  "COLD",
  "Strong Wind":   "WIND",
  "Dryness Alert": "DRY",
};

const ALERT_ACTIONS = {
  "Heavy Rain":    "Check drainage, protect seedlings",
  "Extreme Heat":  "Irrigate early morning, provide shade",
  "Extreme Cold":  "Cover crops overnight",
  "Strong Wind":   "Stake plants, delay spraying",
  "Dryness Alert": "Irrigate immediately, mulch soil",
};

const WEATHER_COLORS = {
  "Heavy Rain":    { bg: "bg-blue-50",   badge: "bg-blue-100 text-blue-800 border-blue-200" },
  "Extreme Heat":  { bg: "bg-red-50",    badge: "bg-red-100 text-red-800 border-red-200" },
  "Extreme Cold":  { bg: "bg-cyan-50",   badge: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  "Strong Wind":   { bg: "bg-purple-50", badge: "bg-purple-100 text-purple-800 border-purple-200" },
  "Dryness Alert": { bg: "bg-orange-50", badge: "bg-orange-100 text-orange-800 border-orange-200" },
};

// Daily total precipitation (mm) above which a day counts as "rain expected"
// for the 10-day outlook notification. This is intentionally lower than the
// Heavy Rain alert threshold (10mm) — it's meant to catch any day worth
// planning around, not just anomalies. >1mm filters out trace/dew noise.
const OUTLOOK_RAIN_THRESHOLD = 1;

const TAB_COLORS = {
  weather: { active: 'border-blue-500 text-blue-700 bg-blue-50',   badge: 'bg-blue-200 text-blue-800',   button: 'bg-blue-600 hover:bg-blue-700' },
  pest:    { active: 'border-orange-500 text-orange-700 bg-orange-50', badge: 'bg-orange-200 text-orange-800', button: 'bg-orange-600 hover:bg-orange-700' },
  outlook: { active: 'border-sky-500 text-sky-700 bg-sky-50',      badge: 'bg-sky-200 text-sky-800',     button: 'bg-sky-600 hover:bg-sky-700' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getDayName = (dateString) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date(dateString).getDay()];
};

const formatDate = (dateString) => {
  const d = new Date(dateString);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const cleanText = (text) =>
  text.replace(/[^\x00-\x7F]/g, '').replace(/\s+/g, ' ').trim();

// ─── Weather detection ────────────────────────────────────────────────────────

const detectWeatherAnomalies = (data) => {
  const hours = data.hourly || {};
  const time        = hours.time || [];
  const temperature = hours.temperature_2m || [];
  const humidity    = hours.relative_humidity_2m || [];
  const precipitation = hours.precipitation || [];
  const wind_speed  = hours.wind_speed_10m || [];

  const THRESHOLDS = {
    HEAVY_RAIN:  10,
    HEAT:        30,
    COLD:        15,
    WIND:        20,
    DRY_HUM:     30,
  };

  const dailyData = {};

  for (let i = 0; i < time.length; i++) {
    const dateKey = new Date(time[i]).toISOString().split('T')[0];
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        date: dateKey,
        dayName: getDayName(time[i]),
        formattedDate: formatDate(time[i]),
        alerts: new Set(),
        maxTemp: temperature[i],
        minTemp: temperature[i],
        totalPrecipitation: 0,
        maxWindSpeed: 0,
        minHumidity: 100,
      };
    }
    const day = dailyData[dateKey];
    day.maxTemp = Math.max(day.maxTemp, temperature[i]);
    day.minTemp = Math.min(day.minTemp, temperature[i]);
    day.totalPrecipitation += precipitation[i] || 0;
    day.maxWindSpeed = Math.max(day.maxWindSpeed, wind_speed[i]);
    day.minHumidity = Math.min(day.minHumidity, humidity[i]);

    if (precipitation[i] > THRESHOLDS.HEAVY_RAIN) day.alerts.add("Heavy Rain");
    if (temperature[i] > THRESHOLDS.HEAT)         day.alerts.add("Extreme Heat");
    if (temperature[i] < THRESHOLDS.COLD)          day.alerts.add("Extreme Cold");
    if (wind_speed[i] > THRESHOLDS.WIND)           day.alerts.add("Strong Wind");
    if (humidity[i] < THRESHOLDS.DRY_HUM)          day.alerts.add("Dryness Alert");
  }

  return Object.values(dailyData)
    .filter(day => day.alerts.size > 0)
    .map(day => ({
      ...day,
      alerts: Array.from(day.alerts),
      maxTemp: Math.round(day.maxTemp * 10) / 10,
      minTemp: Math.round(day.minTemp * 10) / 10,
      totalPrecipitation: Math.round(day.totalPrecipitation * 10) / 10,
      maxWindSpeed: Math.round(day.maxWindSpeed * 10) / 10,
      minHumidity: Math.round(day.minHumidity * 10) / 10,
    }));
};

// ─── Pest detection ───────────────────────────────────────────────────────────

const detectPestAlerts = (data) => {
  const hours = data.hourly || {};
  const times = hours.time || [];
  const temperatures = hours.temperature_2m || [];

  let gdd = 0;
  const triggered = new Set();
  const alerts = [];

  for (let i = 0; i < times.length; i++) {
    const temp = temperatures[i];
    if (temp == null) continue;
    gdd += Math.max(0, temp - 10);

    const newPests = [];
    for (const [pest, threshold] of Object.entries(PEST_GDD_THRESHOLDS)) {
      if (gdd >= threshold && !triggered.has(pest)) {
        newPests.push(pest);
        triggered.add(pest);
      }
    }
    if (newPests.length > 0) {
      alerts.push({
        time: new Date(times[i]).toLocaleString(),
        dayName: getDayName(times[i]),
        formattedDate: formatDate(times[i]),
        alerts: newPests,
        gdd: Math.round(gdd * 10) / 10,
        temperature: temp,
      });
    }
  }
  return alerts;
};

// ─── Daily outlook (notification, not alert) ─────────────────────────────────
// Unlike detectWeatherAnomalies, this always returns all 10 days, regardless
// of whether any threshold was crossed. Used to tell farmers in advance which
// days to expect rain vs. dry weather, even when nothing is "alert-worthy".

const buildDailyOutlook = (data) => {
  const hours = data.hourly || {};
  const time = hours.time || [];
  const precipitation = hours.precipitation || [];

  const dailyData = {};

  for (let i = 0; i < time.length; i++) {
    const dateKey = new Date(time[i]).toISOString().split('T')[0];
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        date: dateKey,
        dayName: getDayName(time[i]),
        formattedDate: formatDate(time[i]),
        totalPrecipitation: 0,
      };
    }
    dailyData[dateKey].totalPrecipitation += precipitation[i] || 0;
  }

  return Object.values(dailyData).map(day => {
    const totalPrecipitation = Math.round(day.totalPrecipitation * 10) / 10;
    return {
      ...day,
      totalPrecipitation,
      hasRain: totalPrecipitation > OUTLOOK_RAIN_THRESHOLD,
    };
  });
};

// ─── Group consecutive alert days into ranges ─────────────────────────────────
const groupConsecutiveDays = (days) => {
  if (!days.length) return '';

  const ranges = [];
  let rangeStart = days[0];
  let rangePrev  = days[0];

  const toMonthDay = (fd) => {
    const [m, d] = fd.split('/').map(Number);
    return m * 100 + d;
  };

  for (let i = 1; i < days.length; i++) {
    const cur  = toMonthDay(days[i].formattedDate);
    const prev = toMonthDay(days[i - 1].formattedDate);
    if (cur - prev === 1) {
      rangePrev = days[i];
    } else {
      ranges.push({ start: rangeStart, end: rangePrev });
      rangeStart = days[i];
      rangePrev  = days[i];
    }
  }
  ranges.push({ start: rangeStart, end: rangePrev });

  return ranges.map(({ start, end }) => {
    const s = `${start.dayName}${start.formattedDate.split('/')[1]}`;
    const e = `${end.dayName}${end.formattedDate.split('/')[1]}`;
    return start === end ? s : `${s}-${e}`;
  }).join(', ');
};

// ─── Build structured weather lines per alert type ────────────────────────────
const buildWeatherLines = (weatherAlerts) => {
  const byType = {};
  weatherAlerts.forEach(day => {
    day.alerts.forEach(type => {
      if (!byType[type]) byType[type] = { days: [], maxMm: 0, maxTemp: 0 };
      byType[type].days.push({ dayName: day.dayName, formattedDate: day.formattedDate });
      byType[type].maxMm   = Math.max(byType[type].maxMm,   day.totalPrecipitation);
      byType[type].maxTemp = Math.max(byType[type].maxTemp, day.maxTemp);
    });
  });

  return Object.entries(byType).map(([type, data]) => {
    const count     = data.days.length;
    const rangeStr  = groupConsecutiveDays(data.days);
    const short     = WEATHER_SHORT[type];

    let detail = '';
    if (type === 'Heavy Rain')   detail = `peak ${Math.round(data.maxMm)}mm`;
    if (type === 'Extreme Heat') detail = `up to ${Math.round(data.maxTemp)}C`;
    if (type === 'Extreme Cold') detail = `down to ${Math.round(data.maxTemp)}C`;

    const summaryLine = count <= 5
      ? `${short}: ${rangeStr}${detail ? ` (${detail})` : ''}`
      : `${short}: ${count}/10 days (peak ${detail || rangeStr.split(',')[0]})`;

    return { type, count, summaryLine, action: ALERT_ACTIONS[type] };
  });
};

// ─── Determine dominant alert type for action advice ─────────────────────────
const getDominantAction = (lines) => {
  if (!lines.length) return null;
  const priority = ["Heavy Rain", "Extreme Heat", "Extreme Cold", "Strong Wind", "Dryness Alert"];
  const sorted = [...lines].sort(
    (a, b) => priority.indexOf(a.type) - priority.indexOf(b.type)
  );
  return sorted[0].action;
};

// ─── Generic SMS splitter ──────────────────────────────────────────────────────
// Packs body lines into 160-char segments, prefixing each with
// "(n/total)" once more than one segment is needed. Used so pest/outlook
// SMS can carry full detail instead of being silently truncated.
const splitIntoSmsParts = (header, bodyLines, maxLen = 153) => {
  const full = cleanText([header, ...bodyLines].join('\n'));
  if (full.length <= 160) return [full];

  const parts = [];
  let current = [];
  let currentLen = header.length;

  for (const line of bodyLines) {
    const addedLen = line.length + 1;
    if (currentLen + addedLen > maxLen && current.length > 0) {
      parts.push(current);
      current = [line];
      currentLen = header.length + line.length;
    } else {
      current.push(line);
      currentLen += addedLen;
    }
  }
  if (current.length) parts.push(current);

  return parts.map((linesGroup, i) =>
    cleanText(`${header} (${i + 1}/${parts.length})\n${linesGroup.join('\n')}`).substring(0, 160)
  );
};

// ─── SMS builders ─────────────────────────────────────────────────────────────

const buildWeatherSMS = (farmName, weatherAlerts) => {
  if (!weatherAlerts.length) return [];

  const lines      = buildWeatherLines(weatherAlerts);
  const totalDays  = weatherAlerts.length;
  const action     = getDominantAction(lines);
  const isExtended = totalDays > 5;

  const header     = `[WEATHER] ${farmName} - 10day`;
  const bodyLines  = lines.map(l => l.summaryLine);
  const actionLine = `Action: ${action}`;

  if (!isExtended) {
    const msg = cleanText([header, ...bodyLines, actionLine].join('\n'));
    return [msg.substring(0, 160)];
  } else {
    const week1Alerts = weatherAlerts.slice(0, 5);
    const week2Alerts = weatherAlerts.slice(5);

    const lines1 = buildWeatherLines(week1Alerts);
    const lines2 = buildWeatherLines(week2Alerts);

    const sms1 = cleanText(
      [`[WEATHER 1/2] ${farmName}`, ...lines1.map(l => l.summaryLine), actionLine].join('\n')
    ).substring(0, 160);

    const sms2 = cleanText(
      [`[WEATHER 2/2] ${farmName} (days 6-10)`, ...lines2.map(l => l.summaryLine)].join('\n')
    ).substring(0, 160);

    return [sms1, sms2];
  }
};

// Richer pest SMS: full pest list (not capped at 3), GDD context, crops at
// risk, and a pest-specific action instead of a generic one. Falls back to
// multi-part splitting if content doesn't fit in one 160-char message.
const buildPestSMS = (farmName, pestAlerts, farmCrops) => {
  if (!pestAlerts.length) return [];

  const allPests  = [...new Set(pestAlerts.flatMap(pa => pa.alerts))];
  const topPest   = allPests[0];
  const latest    = pestAlerts[pestAlerts.length - 1];

  const header    = `[PEST] ${farmName}`;
  const riskLine  = `Risk: ${allPests.join(', ')}`;
  const gddLine   = `Since ${latest.dayName}${latest.formattedDate.split('/')[1]} (GDD ${latest.gdd}, ${latest.temperature}C)`;
  const cropsLine = farmCrops?.length ? `Crops: ${farmCrops.join(', ')}` : '';
  const actionLine = `Action: ${PEST_ACTIONS[topPest] || 'Inspect fields now'}`;

  const bodyLines = [riskLine, gddLine, cropsLine, actionLine].filter(Boolean);

  return splitIntoSmsParts(header, bodyLines);
};

// Richer outlook SMS than the original (rain range + dry range + a
// suggestion, instead of just a range + total) but ALWAYS a single
// 160-char SMS — never splits into multiple parts. Lines are added in
// priority order and dropped from the end if the message runs long, so it
// degrades gracefully instead of getting cut off mid-word.
const buildOutlookSMS = (farmName, outlookDays) => {
  if (!outlookDays.length) return [];

  const rainDays = outlookDays.filter(d => d.hasRain);
  const dryDays  = outlookDays.filter(d => !d.hasRain);
  const totalMm  = Math.round(outlookDays.reduce((s, d) => s + d.totalPrecipitation, 0) * 10) / 10;
  const header   = `[FORECAST] ${farmName} - 10day`;

  let candidateLines;
  if (rainDays.length === 0) {
    candidateLines = [
      'Dry: all 10 days, no rain expected',
      'Suggest: plan irrigation',
    ];
  } else if (rainDays.length === outlookDays.length) {
    candidateLines = [
      `Rain: all 10 days (${totalMm}mm total)`,
    ];
  } else {
    const dryStretchLonger = dryDays.length > rainDays.length;
    candidateLines = [
      `Rain: ${groupConsecutiveDays(rainDays)} (${totalMm}mm)`,
      `Dry: ${groupConsecutiveDays(dryDays)}`,
      `Suggest: ${dryStretchLonger ? 'irrigate dry stretch' : 'plan around rain days'}`,
    ];
  }

  // Add lines one at a time, in priority order, stopping before 160 chars.
  // Guarantees a single SMS: no multi-part splitting, no mid-word cutoff.
  const kept = [];
  for (const line of candidateLines) {
    const attempt = cleanText([header, ...kept, line].join('\n'));
    if (attempt.length > 160) break;
    kept.push(line);
  }

  return [cleanText([header, ...kept].join('\n')).substring(0, 160)];
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const WeatherBadge = ({ type }) => (
  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${WEATHER_COLORS[type]?.badge || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
    {type}
  </span>
);

const FarmCard = ({ alert, index, selected, onToggle, mode }) => {
  const smsParts = mode === 'weather'
    ? buildWeatherSMS(alert.farm.name, alert.weather_alerts || [])
    : mode === 'pest'
    ? buildPestSMS(alert.farm.name, alert.pest_alerts || [], alert.farm.crops)
    : buildOutlookSMS(alert.farm.name, alert.outlook || []);

  const hasData = mode === 'weather'
    ? (alert.weather_alerts?.length > 0)
    : mode === 'pest'
    ? (alert.pest_alerts?.length > 0)
    : (alert.outlook?.length > 0);

  if (!hasData) return null;

  const isMultiPart = smsParts.length > 1;

  return (
    <div
      onClick={() => onToggle(index)}
      className={`rounded-xl border-2 p-5 cursor-pointer transition-all ${
        selected
          ? 'border-emerald-500 bg-emerald-50 shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {/* Farm header */}
      <div className="flex items-start gap-3 mb-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(index)}
          onClick={e => e.stopPropagation()}
          className="mt-0.5 w-4 h-4 accent-emerald-600"
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{alert.farm.name}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-500">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{alert.farm.geolocation}</span>
            {alert.farm.phonenumber && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{alert.farm.phonenumber}</span>}
            {alert.farm.crops?.length > 0 && <span className="flex items-center gap-1"><Leaf className="w-3 h-3" />{alert.farm.crops.join(', ')}</span>}
          </div>
        </div>
      </div>

      {/* Weather alerts */}
      {mode === 'weather' && alert.weather_alerts?.length > 0 && (
        <div className="space-y-2 mb-4">
          {alert.weather_alerts.map((wa, i) => (
            <div key={i} className="bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />{wa.dayName} {wa.formattedDate}
                </span>
                <div className="flex flex-wrap gap-1">
                  {wa.alerts.map((type, j) => <WeatherBadge key={j} type={type} />)}
                </div>
              </div>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>{wa.minTemp}–{wa.maxTemp}°C</span>
                <span>{wa.totalPrecipitation}mm</span>
                <span>{wa.maxWindSpeed}km/h</span>
                <span>{wa.minHumidity}% hum</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pest alerts */}
      {mode === 'pest' && alert.pest_alerts?.length > 0 && (
        <div className="space-y-2 mb-4">
          {alert.pest_alerts.map((pa, i) => (
            <div key={i} className="bg-orange-50 rounded-lg px-3 py-2.5 border border-orange-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />{pa.dayName} {pa.formattedDate}
                </span>
                <span className="text-xs text-gray-500">GDD {pa.gdd} · {pa.temperature}°C</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {pa.alerts.map((pest, j) => (
                  <span key={j} className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full border border-orange-200 font-medium">
                    <Bug className="w-3 h-3" />{pest}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 10-day outlook (rain / dry, informational) */}
      {mode === 'outlook' && alert.outlook?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {alert.outlook.map((day, i) => (
            <div
              key={i}
              className={`flex flex-col items-center justify-center rounded-lg px-2 py-2 w-14 border text-center ${
                day.hasRain ? 'bg-sky-50 border-sky-200' : 'bg-gray-50 border-gray-100'
              }`}
            >
              <span className="text-[10px] font-medium text-gray-500">
                {day.dayName}{day.formattedDate.split('/')[1]}
              </span>
              {day.hasRain
                ? <Droplets className="w-4 h-4 text-sky-600 my-1" />
                : <Sun className="w-4 h-4 text-amber-400 my-1" />
              }
              <span className="text-[10px] text-gray-500">
                {day.hasRain ? `${day.totalPrecipitation}mm` : 'dry'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* SMS preview */}
      {smsParts.length > 0 && (
        <div className="mt-3 space-y-2">
          {isMultiPart && (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Extended forecast — will send {smsParts.length} SMS
            </div>
          )}
          {smsParts.map((sms, i) => (
            <div key={i} className="bg-gray-100 rounded-lg px-3 py-2.5 border border-gray-200">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">
                {isMultiPart ? `SMS ${i + 1}/${smsParts.length}` : 'SMS preview'} · {sms.length}/160 chars
              </p>
              <p className="text-xs text-gray-800 font-mono whitespace-pre-line leading-relaxed">{sms}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const AlertMessaging = () => {
  const [alerts, setAlerts]           = useState([]);
  const [loading, setLoading]         = useState(false);
  const [tab, setTab]                 = useState('weather'); // 'weather' | 'pest' | 'outlook'
  const [selectedWeather, setSelectedWeather] = useState([]);
  const [selectedPest, setSelectedPest]       = useState([]);
  const [selectedOutlook, setSelectedOutlook] = useState([]);
  const [sendToFarmers, setSendToFarmers]     = useState(true);
  const [sendToAdmin, setSendToAdmin]         = useState(true);
  const [sendStatus, setSendStatus]           = useState(null); // null | {sending} | {done, success, total}
  const [skippedFarms, setSkippedFarms]       = useState([]); // farms excluded from results + why

  // ── Data fetching ───────────────────────────────────────────────────────────

  const fetchFarms = async () => {
    try {
      const res = await axiosInstance.get('/api/farm/all');
      const d = res.data;
      // NOTE: if your backend paginates (e.g. returns { farms, page, total_pages }),
      // this only grabs the first page. Log the raw response shape below to check.
      console.log('[fetchFarms] raw response:', d);
      if (Array.isArray(d)) return d;
      return d?.farms || d?.data || d?.items || [];
    } catch (err) {
      console.error('[fetchFarms] request failed:', err);
      return [];
    }
  };

  const fetchWeatherData = async (lat, lon) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&forecast_days=10`;
      return await (await fetch(url)).json();
    } catch {
      return null;
    }
  };

  const fetchAlerts = async () => {
    setLoading(true);
    setSelectedWeather([]);
    setSelectedPest([]);
    setSelectedOutlook([]);
    const skipped = [];
    try {
      const farms = await fetchFarms();
      console.log(`[fetchAlerts] total farms returned by API: ${farms.length}`);

      if (!farms.length) { setAlerts([]); setSkippedFarms([]); return; }

      const results = [];
      for (const farm of farms) {
        if (!farm.geolocation) {
          console.warn(`[fetchAlerts] SKIPPED farm "${farm.name}" (id=${farm.id}): no geolocation field`);
          skipped.push({ id: farm.id, name: farm.name, reason: 'missing geolocation' });
          continue;
        }
        const [lat, lon] = farm.geolocation.split(',').map(c => parseFloat(c.trim()));
        if (isNaN(lat) || isNaN(lon)) {
          console.warn(`[fetchAlerts] SKIPPED farm "${farm.name}" (id=${farm.id}): invalid geolocation "${farm.geolocation}"`);
          skipped.push({ id: farm.id, name: farm.name, reason: `invalid geolocation "${farm.geolocation}"` });
          continue;
        }

        // Fetch crops
        let farmCrops = [];
        try {
          const fdRes = await axiosInstance.get(`/api/farmdata/?farm_id=${farm.farm_id}`);
          const cropIds = [...new Set((fdRes.data?.farmdata_list || []).map(fd => fd.crop_id))];
          for (const id of cropIds) {
            const cr = await axiosInstance.get(`/api/crop/${id}`);
            if (cr.data?.name) farmCrops.push(cr.data.name);
          }
        } catch (err) {
          console.warn(`[fetchAlerts] crop fetch failed for farm "${farm.name}" (id=${farm.id}):`, err);
        }

        const weatherData = await fetchWeatherData(lat, lon);
        if (!weatherData) {
          console.warn(`[fetchAlerts] SKIPPED farm "${farm.name}" (id=${farm.id}): weather fetch failed`);
          skipped.push({ id: farm.id, name: farm.name, reason: 'weather fetch failed' });
          continue;
        }

        const weather_alerts = detectWeatherAnomalies(weatherData);
        let pest_alerts = detectPestAlerts(weatherData);
        const outlook = buildDailyOutlook(weatherData);

        if (farmCrops.length > 0) {
          pest_alerts = pest_alerts
            .map(pa => ({
              ...pa,
              alerts: pa.alerts.filter(pest =>
                (PEST_TO_CROPS[pest] || []).some(c => farmCrops.includes(c))
              ),
            }))
            .filter(pa => pa.alerts.length > 0);
        }

        // Note: unlike weather/pest alerts, the outlook is always included —
        // it's a routine notification, not conditional on anomalies existing.
        results.push({
          farm: {
            id: farm.id,
            name: farm.name,
            geolocation: farm.geolocation,
            phonenumber: farm.phonenumber1 || farm.phonenumber,
            crops: farmCrops,
          },
          weather_alerts,
          pest_alerts,
          outlook,
        });
      }

      console.log(`[fetchAlerts] farms included in results: ${results.length} / ${farms.length}`);
      if (skipped.length) {
        console.warn('[fetchAlerts] skipped farms summary:', skipped);
      }

      setAlerts(results);
      setSkippedFarms(skipped);
    } catch (err) {
      console.error('[fetchAlerts] unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // ── Selection helpers ───────────────────────────────────────────────────────

  const visibleIndexes = (mode) =>
    alerts.reduce((acc, a, i) => {
      const has = mode === 'weather' ? a.weather_alerts?.length > 0
        : mode === 'pest' ? a.pest_alerts?.length > 0
        : a.outlook?.length > 0;
      if (has) acc.push(i);
      return acc;
    }, []);

  const selected = tab === 'weather' ? selectedWeather
    : tab === 'pest' ? selectedPest
    : selectedOutlook;
  const setSelected = tab === 'weather' ? setSelectedWeather
    : tab === 'pest' ? setSelectedPest
    : setSelectedOutlook;

  const toggle = (index) =>
    setSelected(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);

  const toggleAll = () => {
    const vis = visibleIndexes(tab);
    setSelected(selected.length === vis.length ? [] : vis);
  };

  // ── Send ────────────────────────────────────────────────────────────────────

  const sendSMS = async (phone, message) => {
    try {
      const res = await axiosInstance.post('/api/notifications/sms', { phone, message });
      return res.status === 200;
    } catch {
      return false;
    }
  };

  const sendSelected = async () => {
    if (!selected.length) return;
    const ADMIN = "256783130358";
    setSendStatus({ sending: true });
    let success = 0, total = 0;

    for (const idx of selected) {
      const a = alerts[idx];
      if (!a) continue;

      const msgs = tab === 'weather'
        ? buildWeatherSMS(a.farm.name, a.weather_alerts || [])
        : tab === 'pest'
        ? buildPestSMS(a.farm.name, a.pest_alerts || [], a.farm.crops)
        : buildOutlookSMS(a.farm.name, a.outlook || []);

      if (!msgs.length) continue;

      const recipients = [];
      if (sendToAdmin) recipients.push(ADMIN);
      if (sendToFarmers && a.farm.phonenumber) recipients.push(a.farm.phonenumber);

      for (const phone of recipients) {
        for (const msg of msgs) {
          total++;
          if (await sendSMS(phone, msg)) success++;
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }

    setSendStatus({ done: true, success, total });
    setTimeout(() => setSendStatus(null), 5000);
  };

  // ── Counts ──────────────────────────────────────────────────────────────────

  const weatherCount = alerts.filter(a => a.weather_alerts?.length > 0).length;
  const pestCount    = alerts.filter(a => a.pest_alerts?.length > 0).length;
  const outlookCount = alerts.filter(a => a.outlook?.length > 0).length;
  const visCount     = visibleIndexes(tab).length;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Farm Alert System</h1>
            <p className="text-sm text-gray-500 mt-0.5">10-day forecast · weather, pest & outlook</p>
          </div>
          <button
            onClick={fetchAlerts}
            disabled={loading}
            className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-700 text-sm px-4 py-2 rounded-lg font-medium shadow-sm transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {/* ── Skipped farms warning (diagnostic) ── */}
        {skippedFarms.length > 0 && (
          <div className="flex flex-col gap-1.5 rounded-xl p-4 border bg-amber-50 border-amber-200 text-amber-800 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4" />
              {skippedFarms.length} farm(s) excluded — see console for details
            </div>
            <ul className="list-disc list-inside text-xs space-y-0.5">
              {skippedFarms.map((s, i) => (
                <li key={i}>{s.name || `Farm #${s.id}`}: {s.reason}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Recipients row ── */}
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-600">Send to:</span>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
            <input type="checkbox" checked={sendToAdmin} onChange={e => setSendToAdmin(e.target.checked)} className="w-4 h-4 accent-emerald-600" />
            Admin
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
            <input type="checkbox" checked={sendToFarmers} onChange={e => setSendToFarmers(e.target.checked)} className="w-4 h-4 accent-emerald-600" />
            Farmers
          </label>
        </div>

        {/* ── Send status ── */}
        {sendStatus?.done && (
          <div className={`flex items-center gap-3 rounded-xl p-4 border text-sm font-medium ${
            sendStatus.success === sendStatus.total
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}>
            {sendStatus.success === sendStatus.total
              ? <CheckCircle className="w-5 h-5 text-green-600" />
              : <XCircle className="w-5 h-5 text-yellow-600" />
            }
            {sendStatus.success} of {sendStatus.total} messages sent
          </div>
        )}

        {/* ── Tab switcher ── */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex border-b border-gray-200">
            {[
              { key: 'weather', label: 'Weather Alerts', count: weatherCount, icon: <Cloud className="w-4 h-4" /> },
              { key: 'pest',    label: 'Pest Risks',     count: pestCount,    icon: <Bug className="w-4 h-4" /> },
              { key: 'outlook', label: '10-Day Outlook', count: outlookCount, icon: <Sun className="w-4 h-4" /> },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition border-b-2 ${
                  tab === t.key
                    ? TAB_COLORS[t.key].active
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t.icon}
                {t.label}
                {t.count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    tab === t.key ? TAB_COLORS[t.key].badge : 'bg-gray-200 text-gray-600'
                  }`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Toolbar ── */}
          <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleAll}
                disabled={visCount === 0}
                className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 font-medium"
              >
                {selected.length === visCount && visCount > 0 ? 'Deselect all' : 'Select all'}
              </button>
              <span className="text-sm text-gray-400">{selected.length} / {visCount} selected</span>
            </div>
            <button
              onClick={sendSelected}
              disabled={!selected.length || sendStatus?.sending || (!sendToAdmin && !sendToFarmers)}
              className={`inline-flex items-center gap-1.5 text-white text-sm px-4 py-2 rounded-lg font-medium shadow-sm transition disabled:opacity-40 ${TAB_COLORS[tab].button}`}
            >
              {sendStatus?.sending
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Sending…</>
                : <><Send className="w-4 h-4" /> Send {selected.length > 0 ? `(${selected.length})` : ''}</>
              }
            </button>
          </div>

          {/* ── Cards ── */}
          <div className="p-5">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <RefreshCw className="w-8 h-8 animate-spin mb-3" />
                <p className="text-sm">Fetching forecast data…</p>
              </div>
            ) : visCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <CheckCircle className="w-10 h-10 mb-3 text-green-400" />
                <p className="text-sm font-medium text-gray-600">No active {tab} alerts</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {alerts.map((alert, index) => (
                  <FarmCard
                    key={`${alert.farm.id}-${index}`}
                    alert={alert}
                    index={index}
                    selected={selected.includes(index)}
                    onToggle={toggle}
                    mode={tab}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AlertMessaging;