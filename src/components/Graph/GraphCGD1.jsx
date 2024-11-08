import React, { useState, useEffect } from 'react';
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';
import axiosInstance from '../../axiosInstance';

function Graph() {
  const [farmData, setFarmData] = useState([]);
  const [weatherData, setWeatherData] = useState([]);

  useEffect(() => {
    // Fetch farm data
    axiosInstance.get('/farm_data')
      .then(response => {
        const { data } = response.data;
        setFarmData(data || []);
      })
      .catch(error => {
        console.error('Error fetching farm data:', error);
      });

    // Fetch weather data
    const fetchWeatherData = async () => {
      const region = 'some-region-id';  // replace with actual region
      const crop = 'some-crop-id';      // replace with actual crop
      const latitude = '0.358261';        // replace with actual latitude
      const longitude = '32.654738';      // replace with actual longitude

      try {
        console.log(`Fetching weather data for region: ${region}, crop: ${crop}, latitude: ${latitude}, longitude: ${longitude}`);
        const response = await axiosInstance.get('/WeatherWeekly', {
          params: {
            region_id: region,
            crop_id: crop,
            latitude: latitude,
            longitude: longitude
          }
        });

        const weatherData = response.data.data;
        setWeatherData(weatherData || []);
        console.log('Weather data fetched successfully:', weatherData);
      } catch (error) {
        console.error('Error fetching weather data:', error);
      }
    };

    fetchWeatherData();
  }, []);

  // Extract labels and values for farm data
  const farmLabels = (farmData || []).map(item => item.name);
  const farmQuantities = (farmData || []).map(item => item.quantity);

  // Extract labels and values for weather data
  const weatherLabels = (weatherData || []).map(item => {
    const date = new Date(item.date);
    return `${date.getMonth() + 1}/${date.getDate()}`; // Format as MM/DD
  });
  const GrowingDegreeDays = (weatherData || []).map(item => item.gdd);
  const HeatingDegreeDays = (weatherData || []).map(item => item.hdd); 
  const CoolingDegreeDays = (weatherData || []).map(item => item.cdd);

  const chartData = {
    labels: weatherLabels, // Use formatted weather dates as x-axis labels
    datasets: [
      {
        label: "Growing Degree Days",
        data: GrowingDegreeDays,
        backgroundColor: 'rgba(75, 192, 192, 0.2)', // Transparent teal
        borderColor: 'rgba(75, 192, 192, 1)', // Solid teal
        borderWidth: 2,
        tension: 0.4,
      },
      {
        label: "Heating Degree Days",
        data: HeatingDegreeDays,
        backgroundColor: 'rgba(153, 102, 255, 0.2)', // Transparent purple
        borderColor: 'rgba(153, 102, 255, 1)', // Solid purple
        borderWidth: 2,
        tension: 0.4,
      },
      {
        label: "Cooling Degree Days",
        data: CoolingDegreeDays,
        backgroundColor: 'rgba(255, 206, 86, 0.2)', // Transparent yellow
        borderColor: 'rgba(255, 206, 86, 1)', // Solid yellow
        borderWidth: 2,
        tension: 0.4,
      },
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
          label: (tooltipItem) => `Value: ${tooltipItem.raw}`, // Customize tooltip label
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
      <div className='container mx-auto gap-6'>
        <div className='bg-white p-4 rounded-lg shadow-lg'>
          <h2 className='text-xl font-semibold mb-4 text-blue-500'>Bar Chart</h2>
          <Bar data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
}

export default Graph;
