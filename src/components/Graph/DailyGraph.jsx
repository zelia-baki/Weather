import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const DailyChart = ({ temperature, humidity, precipitation }) => {
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

  const data = {
    labels: hours,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: temperature.length ? temperature : new Array(24).fill(null),
        backgroundColor: 'rgba(75,192,192,0.5)',
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 1,
      },
      {
        label: 'Humidity (%)',
        data: humidity.length ? humidity : new Array(24).fill(null),
        backgroundColor: 'rgba(153,102,255,0.5)',
        borderColor: 'rgba(153,102,255,1)',
        borderWidth: 1,
      },
      {
        label: 'Precipitation (mm)',
        data: precipitation.length ? precipitation : new Array(24).fill(null),
        backgroundColor: 'rgba(255,159,64,0.5)',
        borderColor: 'rgba(255,159,64,1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Daily Weather Data',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Hours',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Values',
        },
      },
    },
  };

  return (
    <div className="relative h-[400px] w-full">
      <Bar data={data} options={options} />
    </div>
  );
};

export default DailyChart;
