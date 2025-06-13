import React, { useEffect, useState, useMemo } from "react";
import { Line } from "react-chartjs-2";
import axiosInstance from "../../axiosInstance";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin
);

const DegreeDaysLineChart = () => {
  const [dailyTemps, setDailyTemps] = useState([]);
  const [dates, setDates] = useState([]);
  const [hdd, setHdd] = useState([]);
  const [cdd, setCdd] = useState([]);
  const [gdd, setGdd] = useState([]);
  const [cumulativeGDD, setCumulativeGDD] = useState([]);
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);

  const [crops, setCrops] = useState([]);
  const [farms, setFarms] = useState([]);
  const [crop, setCrop] = useState("");
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [selectedPlantingDate, setSelectedPlantingDate] = useState("");
  const [isDateSaved, setIsDateSaved] = useState(false);

  const [favorableDate, setFavorableDate] = useState("");
  const [favorableDateInterval, setFavorableDateInterval] = useState(null);

  const cropThresholds = {
    corn: 100,
    wheat: 150,
    soybeans: 120,
    cocoa: 200,
    coffee_robusta: 180,
    coffee_arabica: 170,
    Oil_Palm: 250,
    rubber: 300,
    hass_avocado: 220
  };

  // Initial loading of crops and farms list
  useEffect(() => {
    axiosInstance.get("/api/crop/")
      .then(res => setCrops(res.data.crops || []))
      .catch(console.error);
    axiosInstance.get("/api/farm/all")
      .then(res => setFarms(res.data.farms || []))
      .catch(console.error);
  }, []);

  // Fetch farm geolocation and latest planting date when selecting a farm
  const fetchLatestPlantingDate = async (farm_id) => {
    try {
      const { data } = await axiosInstance.get(
        `/api/farmdata/latest-planting-date/${farm_id}`
      );
      setSelectedPlantingDate(data.planting_date || "");
      setIsDateSaved(true);
    } catch (err) {
      console.error("Error fetching latest planting date:", err);
      setSelectedPlantingDate("");
      setIsDateSaved(false);
    }
  };

  const handleFarmChange = (e) => {
    const farmId = e.target.value;
    setSelectedFarmId(farmId);
    setIsDateSaved(false);
    if (farmId) {
      axiosInstance.get(`/api/farm/${farmId}`)
        .then(({ data }) => {
          const geo = data.data.geolocation;
          if (geo && geo.includes(",")) {
            const [lon, lat] = geo.split(",");
            setLatitude(parseFloat(lat));
            setLongitude(parseFloat(lon));
          }
        })
        .catch(console.error);

      fetchLatestPlantingDate(farmId);
    }
  };

  const onPlantDateChange = (e) => {
    setSelectedPlantingDate(e.target.value);
    setIsDateSaved(false);
  };

  const handleSaveClick = async () => {
    if (!selectedFarmId || !crop || !selectedPlantingDate) return;
    const cropObj = crops.find(c => c.name.toLowerCase() === crop.toLowerCase());
    if (!cropObj) return;
    try {
      await axiosInstance.get("/api/farmdata/save-planting-date", {
        params: {
          farm_id: selectedFarmId,
          crop_id: cropObj.id,
          planting_date: selectedPlantingDate
        }
      });
      setIsDateSaved(true);
      fetchLatestPlantingDate(selectedFarmId);
    } catch (err) {
      console.error("Error saving planting date:", err);
    }
  };

  useEffect(() => {
    if (!latitude || !longitude) return;
    const fetchWeatherData = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min&timezone=auto&past_days=30`;
        const resp = await fetch(url);
        const json = await resp.json();
        if (!json.daily) return;
        const { temperature_2m_max, temperature_2m_min, time } = json.daily;
        const temps = temperature_2m_max.map((max, i) => ({
          max, min: temperature_2m_min[i], avg: (max + temperature_2m_min[i]) / 2
        }));
        const baseTemp = 18;
        setDates(time);
        setHdd(temps.map(t => Math.max(0, baseTemp - t.avg)));
        setCdd(temps.map(t => Math.max(0, t.avg - baseTemp)));
        const gVals = temps.map(t => Math.max(0, t.avg - 10));
        setGdd(gVals);
        const cumul = [];
        gVals.forEach((v, i) => cumul.push((cumul[i-1]||0) + v));
        setCumulativeGDD(cumul);
      } catch (e) {
        console.error(e);
      }
    };
    fetchWeatherData();
  }, [latitude, longitude]);

  useEffect(() => {
    if (!crop || cumulativeGDD.length === 0) return;
    const threshold = cropThresholds[crop.toLowerCase()];
    if (!threshold) return;
    const idx = cumulativeGDD.findIndex(sum => sum >= threshold);
    if (idx === -1) {
      setFavorableDate("");
      setFavorableDateInterval(null);
      return;
    }
    const start = dates[idx];
    let end = start;
    for (let j = idx; j < dates.length; j++) {
      if (cumulativeGDD[j] >= threshold) end = dates[j];
    }
    setFavorableDate(start);
    setFavorableDateInterval({ start, end });
  }, [crop, cumulativeGDD, dates]);

  const isDateFavorable = useMemo(() => {
    if (!selectedPlantingDate || !favorableDateInterval) return false;
    const sel = new Date(selectedPlantingDate);
    const start = new Date(favorableDateInterval.start);
    const end = new Date(favorableDateInterval.end);
    return sel >= start && sel <= end;
  }, [selectedPlantingDate, favorableDateInterval]);

  const chartData = {
    labels: dates,
    datasets: [
      { label: "HDD", data: hdd, tension: 0.4 },
      { label: "CDD", data: cdd, tension: 0.4 },
      { label: "GDD", data: gdd, tension: 0.4 }
    ]
  };
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      annotation: {
        annotations: selectedPlantingDate
          ? {
              plantingLine: {
                type: "line",
                scaleID: "x",
                value: selectedPlantingDate,
                borderColor: "red",
                borderWidth: 2,
                label: { content: "Planting Date", enabled: true, position: "start" }
              }
            }
          : {}
      }
    },
    scales: {
      x: { title: { display: true, text: "Dates" } },
      y: { title: { display: true, text: "Degree Days" } }
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold text-center mb-6">
        Tracking HDD, CDD, and GDD over 30 Days
      </h1>

      <div className="mb-6 flex flex-wrap gap-2 items-center">
        <select
          value={selectedFarmId}
          onChange={handleFarmChange}
          className="p-2 border rounded"
        >
          <option value="">Select a farm</option>
          {farms.map(f => (
            <option key={f.id} value={f.id}>
              {f.name} – {f.subcounty}
            </option>
          ))}
        </select>

        <select
          value={crop}
          onChange={e => { setCrop(e.target.value); setIsDateSaved(false); }}
          className="p-2 border rounded"
        >
          <option value="">Select a crop</option>
          {crops.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>

        <select
          value={selectedPlantingDate}
          onChange={onPlantDateChange}
          disabled={isDateSaved}
          className="p-2 border rounded"
        >
          <option value="">Choose planting date</option>
          {dates.map((date, i) => (
            <option key={i} value={date}>
              {date}{date === favorableDate ? " (Recommended)" : ""}
            </option>
          ))}
        </select>

        <button
         onClick={handleSaveClick}
          disabled={!selectedPlantingDate || !crop || isDateSaved}
           className="ml-2 px-4 py-2 bg-blue-600 text-white rounded"
         >
          {isDateSaved ? "Saved ✓" : "Save date"}
        </button>
      </div>

      {selectedPlantingDate && crop && (
        <p className={`mt-2 text-center font-semibold ${
          isDateFavorable ? 'text-green-700' : 'text-red-600'
        }`}>
          {isDateFavorable
            ? `👍 ${selectedPlantingDate} is favorable for planting ${crop}.`
            : `⚠️ ${selectedPlantingDate} is not within the favorable period for ${crop}.`}
        </p>
      )}

      {favorableDate && (
        <p className="mt-4 text-center text-blue-600 font-bold">
          ✅ Recommended date for {crop}: <span className="text-green-700">{favorableDate}</span>
        </p>
      )}
      {favorableDateInterval && (
        <div className="text-green-600 font-medium mt-2 text-center">
          🌱 Favorable period: from {favorableDateInterval.start} to {favorableDateInterval.end}
        </div>
      )}

      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default DegreeDaysLineChart;
