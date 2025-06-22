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

  const normalize = (name) =>
    name
      .toLowerCase()
      .split(" ")
      .map(w => w[0].toUpperCase() + w.slice(1))
      .join(" ");

  const cropThresholds = {
    Cocoa: 250,
    "Coffee Robusta": 300,
    "Coffee Arabica": 280,
    "Oil Palm": 350,
    "Soya Bean": 200,
    Rubber: 300,
    "Hass Avocado": 250,
    Macadamia: 280,
    Maize: 200,
    Sunflower: 180,
    "Sweet Potato": 200,
    Potato: 200,
    Tomato: 220,
    Millet: 180,
    Sorghum: 200,
    Groundnut: 200,
    Ginger: 280,
    Pineapple: 300
  };

  useEffect(() => {
    axiosInstance.get("/api/crop/")
      .then(res => setCrops(res.data.crops || []))
      .catch(console.error);
    axiosInstance.get("/api/farm/all")
      .then(res => setFarms(res.data.farms || []))
      .catch(console.error);
  }, []);

  const fetchLatestPlantingDate = async (farmId) => {
    try {
      const { data } = await axiosInstance.get(`/api/farmdata/latest-planting-date/${farmId}`);
      setSelectedPlantingDate(data.planting_date || "");
      setCrop(data.crop_name || "");
      setIsDateSaved(true);
    } catch {
      setSelectedPlantingDate("");
      setIsDateSaved(false);
    }
  };

  const fetchDefaultWeatherDates = async (lat, lon) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto&past_days=30`;
      const resp = await fetch(url);
      const json = await resp.json();
      if (json.daily && json.daily.time) {
        setDates(json.daily.time);
      }
    } catch (err) {
      console.error("Erreur lors du fetch météo par défaut:", err);
    }
  };

  const handleFarmChange = (e) => {
    const farmId = e.target.value;
    setSelectedFarmId(farmId);
    setIsDateSaved(false);
    if (!farmId) return;

    axiosInstance.get(`/api/farm/${farmId}`)
      .then(({ data }) => {
        const geo = data.data.geolocation;
        if (geo && geo.includes(",")) {
          const [lon, lat] = geo.split(",");
          const latFloat = parseFloat(lat);
          const lonFloat = parseFloat(lon);
          setLatitude(latFloat);
          setLongitude(lonFloat);
          fetchDefaultWeatherDates(latFloat, lonFloat);
        }
      })
      .catch(console.error);

    fetchLatestPlantingDate(farmId);
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
      console.error(err);
    }
  };

  useEffect(() => {
    if (!latitude || !longitude || !selectedPlantingDate) return;

    const fetchWeatherData = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const selectedDate = new Date(selectedPlantingDate);
        const now = new Date(today);

        let url = "";
if (selectedDate < now) {
  // La date de plantation est dans le passé → utiliser l'API archive
  const today = new Date().toISOString().split("T")[0];
  const start = new Date(selectedDate).toISOString().split("T")[0];

  url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${start}&end_date=${today}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
  console.log("Archive URL:", url);

} else {
  // La date de plantation est aujourd'hui ou dans le futur → utiliser l'API forecast
  const today = new Date();
  const startDate = today.toISOString().split("T")[0];

  const endDate = new Date();
  endDate.setDate(today.getDate() + 15); // max = 16 jours
  const formattedEndDate = endDate.toISOString().split("T")[0];

  url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${startDate}&end_date=${formattedEndDate}`;
  console.log("Forecast URL:", url);
}


        const resp = await fetch(url);
        const json = await resp.json();
        if (!json.daily) return;

        const { temperature_2m_max, temperature_2m_min, time } = json.daily;
        const temps = temperature_2m_max.map((max, i) => ({
          max,
          min: temperature_2m_min[i],
          avg: (max + temperature_2m_min[i]) / 2
        }));

        const baseTemp = 18;
        setDates(time);
        setHdd(temps.map(t => Math.max(0, baseTemp - t.avg)));
        setCdd(temps.map(t => Math.max(0, t.avg - baseTemp)));
        const gVals = temps.map(t => Math.max(0, t.avg - 10));
        setGdd(gVals);

        const cumul = [];
        gVals.forEach((v, i) => cumul.push((cumul[i - 1] || 0) + v));
        setCumulativeGDD(cumul);
      } catch (e) {
        console.error(e);
      }
    };

    fetchWeatherData();
  }, [latitude, longitude, selectedPlantingDate]);

  useEffect(() => {
    if (!crop || cumulativeGDD.length === 0) return;

    const key = normalize(crop);
    const threshold = cropThresholds[key];
    if (!threshold) {
      setFavorableDate("");
      setFavorableDateInterval(null);
      return;
    }

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
    labels: dates.length > 0 ? dates : [""],
    datasets: [
      {
        label: "HDD",
        data: hdd.length > 0 ? hdd : [0],
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: "CDD",
        data: cdd.length > 0 ? cdd : [0],
        borderColor: "rgba(153, 102, 255, 1)",
        backgroundColor: "rgba(153, 102, 255, 0.2)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: "GDD",
        data: gdd.length > 0 ? gdd : [0],
        borderColor: "rgba(255, 159, 64, 1)",
        backgroundColor: "rgba(255, 159, 64, 0.2)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      tooltip: { mode: "index", intersect: false },
      annotation: {
        annotations: selectedPlantingDate
          ? {
              plantingLine: {
                type: "line",
                scaleID: "x",
                value: selectedPlantingDate,
                borderColor: "red",
                borderWidth: 2,
                label: {
                  content: "Planting Date",
                  enabled: true,
                  position: "start",
                  backgroundColor: "rgba(255, 0, 0, 0.1)",
                  color: "red",
                },
              },
            }
          : {},
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Dates" },
        ticks: {
          maxRotation: 45,
          minRotation: 30,
        },
      },
      y: {
        title: { display: true, text: "Degree Days" },
      },
    },
  };

  return (
    <div className="max-w-5xl mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold text-center mb-6">Planting Date</h1>

      <div className="mb-6 flex flex-wrap gap-2 items-center">
        <select value={selectedFarmId} onChange={handleFarmChange} className="p-2 border rounded">
          <option value="">Select a farm</option>
          {farms.map(f => (
            <option key={f.id} value={f.id}>
              {f.name} – {f.subcounty}
            </option>
          ))}
        </select>

        <select value={crop} onChange={e => { setCrop(e.target.value); setIsDateSaved(false); }} className="p-2 border rounded">
          <option value="">Select a crop</option>
          {crops.map(c => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <input
         type="date"
          value={selectedPlantingDate}
          onChange={onPlantDateChange}
          disabled={isDateSaved}
          className="p-2 border rounded"
/>
        <button
          onClick={handleSaveClick}
          disabled={!selectedPlantingDate || !crop || isDateSaved}
          className={`ml-2 px-6 py-2 rounded-lg font-medium text-white shadow-sm transition-colors
            ${
              isDateSaved
                ? "bg-green-500 opacity-75 cursor-default"
                : "bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            }`}
        >
          {isDateSaved ? "Saved ✓" : "Save Date"}
        </button>
      </div>

      {selectedPlantingDate && crop && (
        <p className="mb-4 text-center text-lg font-medium text-gray-600">
          {isDateFavorable
            ? `${selectedPlantingDate} is ideal for planting ${crop}.`
            : `${selectedPlantingDate} is not within the ideal planting window for ${crop}.`}
        </p>
      )}

      {favorableDate && (
        <p className="mb-6 text-center text-lg font-medium text-gray-600">
          Recommended planting date for <span className="underline decoration-gray-400">{crop}</span>: <span className="font-bold">{favorableDate}</span>
        </p>
      )}

      {favorableDateInterval && (
        <>
          <p className="mb-2 text-center text-gray-600">You can plant {crop} between these dates:</p>
          <div className="mb-8 flex justify-center space-x-4">
            <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-amber-700 font-medium">
              {favorableDateInterval.start}
            </div>
            <div className="text-2xl font-bold text-gray-400">→</div>
            <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-amber-700 font-medium">
              {favorableDateInterval.end}
            </div>
          </div>
        </>
      )}

      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default DegreeDaysLineChart;
