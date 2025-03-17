import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const DegreeDaysLineChart = () => {
  const [dailyTemps, setDailyTemps] = useState([]);
  const [dates, setDates] = useState([]);
  const [hdd, setHdd] = useState([]);
  const [cdd, setCdd] = useState([]);
  const [gdd, setGdd] = useState([]);
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [cumulativeGDD, setCumulativeGDD] = useState([]);
  const [isPlantingFavorable, setIsPlantingFavorable] = useState(false);
  const [favorableDate, setFavorableDate] = useState(""); // Date favorable pour la plantation
  const [crop, setCrop] = useState(""); // Culture sélectionnée

  // Seuils de GDD spécifiques à chaque culture
  const cropThresholds = {
    corn: 100, // Example threshold for corn
    wheat: 150, // Example threshold for wheat
    soybeans: 120, // Example threshold for soybeans
    cocoa: 200, // Example threshold for cocoa
    coffee_robusta: 180, // Example threshold for coffee robusta
    coffee_arabica: 170, // Example threshold for coffee arabica
    oil_palm: 250, // Example threshold for oil palm
    soya_bean: 120, // Example threshold for soya bean
    rubber: 300, // Example threshold for rubber
    hass_avocado: 220, // Example threshold for hass avocado
    snickerdoodle: 10, // Example threshold for snickerdoodle
    test: 50, // Example threshold for test
    liter: 1000, // Example threshold for liter
  };

  // Récupérer les données météorologiques depuis l'API Open-Meteo
  const fetchWeatherData = async (lat, lon) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto&past_days=30`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.daily) {
        const { temperature_2m_max: maxTemps, temperature_2m_min: minTemps, time } = data.daily;
        setDates(time);

        const baseTempHDD_CDD = 18; // Température de base pour HDD et CDD
        const thresholdGDD = 10; // Seuil de température pour GDD

        const temps = maxTemps.map((max, i) => ({
          max,
          min: minTemps[i],
          avg: (max + minTemps[i]) / 2, // Température moyenne
        }));

        setDailyTemps(temps);

        // Calculer HDD, CDD, GDD
        const hddValues = temps.map((temp) =>
          Math.max(0, baseTempHDD_CDD - temp.avg)
        );
        const cddValues = temps.map((temp) =>
          Math.max(0, temp.avg - baseTempHDD_CDD)
        );
        const gddValues = temps.map((temp) =>
          Math.max(0, temp.avg - thresholdGDD)
        );

        setHdd(hddValues);
        setCdd(cddValues);
        setGdd(gddValues);

        // Calculer le cumul des GDD
        const cumulativeGDDValues = gddValues.reduce((acc, curr, index) => {
          acc.push((acc.length > 0 ? acc[acc.length - 1] : 0) + curr);
          return acc;
        }, []);

        setCumulativeGDD(cumulativeGDDValues);

        // Vérifier si les conditions sont favorables pour la plantation
        if (crop && cropThresholds[crop]) {
          const threshold = cropThresholds[crop];
          const favorableIndex = cumulativeGDDValues.findIndex((value) => value >= threshold);

          if (favorableIndex !== -1) {
            setIsPlantingFavorable(true);
            setFavorableDate(time[favorableIndex]); // Date favorable
          } else {
            setIsPlantingFavorable(false);
            setFavorableDate("");
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des données météorologiques:", error);
    }
  };

  // Récupérer les données lorsque la latitude ou la longitude change
  useEffect(() => {
    if (latitude && longitude) {
      fetchWeatherData(latitude, longitude);
    }
  }, [latitude, longitude]);

  // Mettre à jour les conditions de plantation lorsque la culture change
  useEffect(() => {
    if (crop && cumulativeGDD.length > 0) {
      const threshold = cropThresholds[crop];
      const favorableIndex = cumulativeGDD.findIndex((value) => value >= threshold);

      if (favorableIndex !== -1) {
        setIsPlantingFavorable(true);
        setFavorableDate(dates[favorableIndex]); // Date favorable
      } else {
        setIsPlantingFavorable(false);
        setFavorableDate("");
      }
    }
  }, [crop, cumulativeGDD]);

  // Données pour le graphique
  const data = {
    labels: dates, // Dates (30 jours)
    datasets: [
      {
        label: "HDD (Heating Degree Days)",
        data: hdd, // Valeurs HDD
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderWidth: 2,
        tension: 0.4, // Ligne lissée
        fill: true,
      },
      {
        label: "CDD (Cooling Degree Days)",
        data: cdd, // Valeurs CDD
        borderColor: "rgba(153, 102, 255, 1)",
        backgroundColor: "rgba(153, 102, 255, 0.2)",
        borderWidth: 2,
        tension: 0.4, // Ligne lissée
        fill: true,
      },
      {
        label: "GDD (Growing Degree Days)",
        data: gdd, // Valeurs GDD
        borderColor: "rgba(255, 159, 64, 1)",
        backgroundColor: "rgba(255, 159, 64, 0.2)",
        borderWidth: 2,
        tension: 0.4, // Ligne lissée
        fill: true,
      },
    ],
  };

  // Options du graphique
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Dates",
        },
      },
      y: {
        title: {
          display: true,
          text: "Degree Days",
        },
      },
    },
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-2xl font-bold text-center mb-6">
        HDD, CDD, GDD over 30 Days
      </h1>
      <div className="mb-4">
        <input
          type="number"
          placeholder="Latitude"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          className="p-2 border rounded mr-2"
        />
        <input
          type="number"
          placeholder="Longitude"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          className="p-2 border rounded"
        />
        <select
          value={crop}
          onChange={(e) => setCrop(e.target.value)}
          className="p-2 border rounded ml-2"
        >
          <option value="">Select a crop</option>
          <option value="corn">Corn</option>
          <option value="wheat">Wheat</option>
          <option value="soybeans">Soybeans</option>
          <option value="cocoa">Cocoa</option>
          <option value="coffee_robusta">Coffee Robusta</option>
          <option value="coffee_arabica">Coffee Arabica</option>
          <option value="oil_palm">Oil Palm</option>
          <option value="soya_bean">Soya Bean</option>
          <option value="rubber">Rubber</option>
          <option value="hass_avocado">Hass Avocado</option>
          <option value="snickerdoodle">Snickerdoodle</option>
        </select>
      </div>
      <Line data={data} options={options} />
      {crop && (
        <div className="mt-4 text-center">
          <p className="text-lg font-medium">
            Cumulative GDD: {cumulativeGDD[cumulativeGDD.length - 1] || 0}
          </p>
          {isPlantingFavorable ? (
            <p className="text-lg font-medium">
              Conditions are favorable for planting {crop} starting from <strong>{favorableDate}</strong>.
            </p>
          ) : (
            <p className="text-lg font-medium">
              Conditions are not yet favorable for planting {crop}.
            </p>
          )}
        </div>
      )}
    </div>
  );
  
};

export default DegreeDaysLineChart;