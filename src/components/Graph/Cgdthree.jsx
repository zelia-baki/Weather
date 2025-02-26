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

    const fetchWeatherData = async (lat, lon) => {
        // URL pour récupérer les prévisions météo des 90 jours à venir
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto&past_days=90`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.daily) {
                const { temperature_2m_max: maxTemps, temperature_2m_min: minTemps, time } = data.daily;
                setDates(time); // Dates pour les 90 jours à venir

                const baseTempHDD_CDD = 18; // Température de base pour HDD et CDD
                const thresholdGDD = 10; // Seuil pour GDD

                // Calculer les températures maximales, minimales et moyennes
                const temps = maxTemps.map((max, i) => ({
                    max,
                    min: minTemps[i],
                    avg: (max + minTemps[i]) / 2, // Température moyenne
                }));

                setDailyTemps(temps);

                // Calcul des valeurs HDD, CDD, GDD
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
            }
        } catch (error) {
            console.error("Erreur lors de la récupération des données météo :", error);
        }
    };

    useEffect(() => {
        if (latitude && longitude) {
            fetchWeatherData(latitude, longitude);
        }
    }, [latitude, longitude]);

    const data = {
        labels: dates, // Dates pour 90 jours à venir
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
                HDD, CDD, GDD for the Past 90 Days
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
            </div>
            <Line data={data} options={options} />
        </div>
    );
};

export default DegreeDaysLineChart;
