import React, { useState, useEffect } from 'react';
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';
import axiosInstance from '../../axiosInstance';
import { clearStorage } from 'mapbox-gl';

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
      const latitude = '0.292225';        // replace with actual latitude
      const longitude = '32.576809';      // replace with actual longitude
      const time = new Date('2024-08-11T04:00:00');

      try {
        console.log(`Fetching data for region: ${region}, crop: ${crop}, latitude: ${latitude}, longitude: ${longitude}, time: ${time}`);
        const response = await axiosInstance.get('/weather', {
          params: {
            region_id: region,
            crop_id: crop,
            latitude: latitude,
            longitude: longitude,
            time: time.toISOString() // Convert Date object to ISO string
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

  // Extract values from weather data (assuming structure, adapt as necessary)
  const weatherTemperature = weatherData.temperature || 0;
  console.log(weatherTemperature);
   // replace with actual field
  const weatherHumidity = weatherData.humidity || 0;
  console.log(weatherHumidity)       // replace with actual field
  const weatherWindSpeed = weatherData.windSpeed || 0;  
  console.log(weatherWindSpeed)       // replace with actual field
  const weatherWindPrecipitation = weatherData.precipitaion || 0;  
  console.log(weatherWindPrecipitation)       // replace with actual field


  const chartData = {
    labels: farmLabels,
    datasets: [
      {
        label: "Farm Production",
        data: farmQuantities,
        backgroundColor: 'rgba(255, 159, 64, 0.2)', // Vibrant orange color with transparency
        borderColor: 'rgba(255, 159, 64, 1)', // Darker orange color for border
        borderWidth: 2,
        tension: 0.4, // Smooth curve for Line chart
      },
      {
        label: "Temperature",
        data: farmLabels.map(() => weatherTemperature), // Use the same labels, replace with actual mapping logic if needed
        backgroundColor: 'rgba(75, 192, 192, 0.2)', // Transparent teal
        borderColor: 'rgba(75, 192, 192, 1)', // Solid teal
        borderWidth: 2,
        tension: 0.4,
      },
      {
        label: "Humidity",
        data: farmLabels.map(() => weatherHumidity), // Same as above
        backgroundColor: 'rgba(153, 102, 255, 0.2)', // Transparent purple
        borderColor: 'rgba(153, 102, 255, 1)', // Solid purple
        borderWidth: 2,
        tension: 0.4,
      },
      {
        label: "Wind Speed",
        data: farmLabels.map(() => weatherWindSpeed), // Same as above
        backgroundColor: 'rgba(255, 206, 86, 0.2)', // Transparent yellow
        borderColor: 'rgba(255, 206, 86, 1)', // Solid yellow
        borderWidth: 2,
        tension: 0.4,
      },
      {
        label: "Precipitation",
        data: farmLabels.map(() => weatherWindPrecipitation), // Same as above
        backgroundColor: 'rgba(255, 206, 83, 0.2)', // Transparent yellow
        borderColor: 'rgba(255, 206, 83, 1)', // Solid yellow
        borderWidth: 2,
        tension: 0.4,
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
