import React, { useState, useEffect } from 'react';
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';
import axios from 'axios';

function Graph() {
  const [farmData, setFarmData] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/farm_data')
      .then(response => {
        const { data } = response.data;
        setFarmData(data || []); // Ensure farmData is always an array
      })
      .catch(error => {
        console.error('Erreur lors de la récupération des données :', error);
      });
  }, []);

  const labels = (farmData || []).map(item => item.name);
  const quantities = (farmData || []).map(item => item.quantity);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: "Production",
        data: quantities,
        backgroundColor: 'rgba(255, 159, 64, 0.2)', // Vibrant orange color with transparency
        borderColor: 'rgba(255, 159, 64, 1)', // Darker orange color for border
        borderWidth: 2,
        tension: 0.4, // Smooth curve for Line chart
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#333', // Color for the legend text
        },
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => `Quantity: ${tooltipItem.raw}`, // Customize tooltip label
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#333', // Color for x-axis labels
        },
      },
      y: {
        ticks: {
          color: '#333', // Color for y-axis labels
        },
      },
    },
  };

  return (
    <div className='bg-gray-100 min-h-screen p-6'>
      <div className='container mx-auto grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='bg-white p-4 rounded-lg shadow-lg'>
          <h2 className='text-xl font-semibold mb-4 text-blue-500'>Bar Chart</h2>
          <Bar data={chartData} options={options} />
        </div>
        <div className='bg-white p-4 rounded-lg shadow-lg'>
          <h2 className='text-xl font-semibold mb-4 text-green-500'>Line Chart</h2>
          <Line data={chartData} options={options} />
        </div>
        <div className='bg-white p-4 rounded-lg shadow-lg mt-6 md:mt-0'>
          <h2 className='text-xl font-semibold mb-4 text-pink-500'>Doughnut Chart</h2>
          <Doughnut data={chartData} options={options} />
        </div>
        <div className='bg-white p-4 rounded-lg shadow-lg mt-6 md:mt-0'>
          <h2 className='text-xl font-semibold mb-4 text-purple-500'>Pie Chart</h2>
          <Pie data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
}

export default Graph;
