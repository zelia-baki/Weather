import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';

const DegreeDaysPage = () => {
  const [dailyTemperatures, setDailyTemperatures] = useState([]);
  const [dates, setDates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [latitude, setLatitude] = useState(''); // Default value
  const [longitude, setLongitude] = useState(''); // Default value
  const [baseTemp, setBaseTemp] = useState(null); // Base temperature
  const [cityName, setCityName] = useState(''); // City name from Mapbox API
  const [provinceName, setProvinceName] = useState(''); // Province name from Mapbox API
  const [countryName, setCountryName] = useState(''); // Country name from Mapbox API
  const [crop, setCrop] = useState(''); // Crop selection


  const mapboxToken = 'pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q'; // Replace with your Mapbox API key

  // Function to fetch the city, province, and country name using Mapbox reverse geocoding
  const fetchCityProvinceCountry = async (lat, lon) => {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${mapboxToken}&language=EN`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      // Get the city, province, and country from the results
      const city = data.features.find((feature) => feature.place_type.includes('place'));
      const province = data.features.find((feature) => feature.place_type.includes('region'));
      const country = data.features.find((feature) => feature.place_type.includes('country'));

      setCityName(city ? city.text : 'Ville inconnue');
      setProvinceName(province ? province.text : 'Province inconnue');
      setCountryName(country ? country.text : 'Pays inconnu');
    } catch (error) {
      console.error('Erreur lors de la récupération du nom de la ville, province et pays:', error);
      setCityName('Ville inconnue');
      setProvinceName('Province inconnue');
      setCountryName('Pays inconnu');
    }
  };

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
    if (latitude && longitude) {
      fetchCityProvinceCountry(latitude, longitude); // Fetch city, province, and country name based on the coordinates
      fetchWeatherData(latitude, longitude); // Fetch weather data
    }
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
        backgroundColor: 'rgba(75,192,192,0.5)',
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 1,
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Cooling Degree Days (CDD)',
        data: cdd,
        backgroundColor: 'rgba(153,102,255,0.5)',
        borderColor: 'rgba(153,102,255,1)',
        borderWidth: 1,
        tension: 0.4,
        fill: true,
      },
      {
        label: "Growing Degree Days (GDD)",
        data: gdd,
        backgroundColor: 'rgba(255, 179, 71, 0.5)', // Orange pastel
        borderColor: 'rgba(255, 179, 71, 1)', // Orange pastel plus intense
        
        borderWidth: 1,
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
    <div className="text-center max-w-6xl mx-auto mt-10">
      <h3 className="text-5xl font-bold text-teal-700 mb-10 animate-fade-in-up-zoom">Heating, Cooling, and Growing Degree Days</h3>
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
      
      </div>
      {/* Crop selection */}
      
      {/* {isLoading && <p>Loading data...</p>} */}
      <div className="bg-white shadow-md rounded-lg p-2">
        <h4 className="text-lg font-medium text-gray-700">
          Location: {cityName}, {provinceName}, {countryName}
        </h4> {/* Display the city, province, and country name */}


        <Bar data={data} />
      </div>
    </div>
  );
};

export default DegreeDaysPage;
