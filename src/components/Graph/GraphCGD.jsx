import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';

const DegreeDaysPage = () => {
  const [dailyTemperatures, setDailyTemperatures] = useState([]);
  const [dates, setDates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [latitude, setLatitude] = useState(''); // Default value
  const [longitude, setLongitude] = useState(''); // Default value
  const [baseTemp, setBaseTemp] = useState(null); // Base temperature

  const fetchWeatherData = async (lat, lon) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
    console.log('Fetching URL:', url); // Log the URL for debugging
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      console.log('Data received from API:', data); // Log the data received

      if (data.daily) {
        if (data.daily.temperature_2m_max && data.daily.temperature_2m_min && data.daily.time) {
          const newDailyTemps = data.daily.temperature_2m_max.map((maxTemp, index) => ({
            max: maxTemp,
            min: data.daily.temperature_2m_min[index],
          }));

          setDates(data.daily.time);
          setDailyTemperatures(newDailyTemps);

          // Calculate the average temperature to set as the base temperature
          const averageTemperature = newDailyTemps.reduce((acc, curr) => {
            const avg = (curr.max + curr.min) / 2;
            return acc + avg;
          }, 0) / newDailyTemps.length;

          setBaseTemp(averageTemperature); // Set the base temperature
        }
      } else {
        console.error('Invalid data format from API');
      }
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to load initial data
  useEffect(() => {
    fetchWeatherData(latitude, longitude);
  }, [latitude, longitude]);

// Function to calculate degree days
const calculateDegreeDays = () => {
  if (baseTemp === null) return { hdd: [], cdd: [], gdd: [] }; // Return empty arrays if baseTemp is not defined

  const hdd = dailyTemperatures.map((temp) => {
    const avgTemp = (temp.max + temp.min) / 2;
    return baseTemp - avgTemp; // HDD, peut être négatif
  });

  const cdd = dailyTemperatures.map((temp) => {
    const avgTemp = (temp.max + temp.min) / 2;
    return avgTemp - baseTemp; // CDD, peut être négatif
  });

  const gdd = dailyTemperatures.map((temp) => {
    const avgTemp = (temp.max + temp.min) / 2;
    return avgTemp - baseTemp; // GDD, utilisant baseTemp
  });

  return { hdd, cdd, gdd };
};


  // Retrieve degree days data
  const { hdd, cdd, gdd } = calculateDegreeDays();

  const data = {
    labels: dates,
    datasets: [
      {
        label: 'Heating Degree Days (HDD)',
        data: hdd,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Cooling Degree Days (CDD)',
        data: cdd,
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        borderColor: 'rgba(255, 206, 86, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Heating, Cooling, and Growing Degree Days</h1>
      <div className="mb-4">
        <input
          type="number"
          value={latitude}
          onChange={(e) => setLatitude(parseFloat(e.target.value))}
          placeholder="Latitude"
          className="mr-2 p-2 border rounded"
        />
        <input
          type="number"
          value={longitude}
          onChange={(e) => setLongitude(parseFloat(e.target.value))}
          placeholder="Longitude"
          className="mr-2 p-2 border rounded"
        />
        <button onClick={handleFetch} className="p-2 bg-blue-500 text-white rounded">Fetch Data</button>
      </div>
      {isLoading && <p>Loading data...</p>}
      <div className="bg-white shadow-md rounded-lg p-6">
        <Bar data={data} />
      </div>
    </div>
  );
};

export default Graph;
