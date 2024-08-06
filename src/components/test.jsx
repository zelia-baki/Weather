import React, { useState, useEffect } from 'react';
import { FaThermometerHalf, FaTint, FaSun, FaWind, FaTachometerAlt, FaMapPin } from 'react-icons/fa';
import axios from 'axios';

const Card = ({ initialRegion, initialCrop }) => {
  const [region, setRegion] = useState(initialRegion);
  const [crop, setCrop] = useState(initialCrop);
  const [data, setData] = useState({});

  useEffect(() => {
    axios.get('http://localhost:5000/weather')
      .then(response => {
        console.log('Weather data:', response.data);
        setData(response.data);
      })
      .catch(error => console.error('Error fetching weather data:', error));
  }, []);

  const currentData = data[region] || {};

  return (
    <div className="w-full max-w-4xl mx-auto rounded-lg overflow-hidden shadow-lg bg-white border border-gray-200 transition-transform transform hover:scale-105 hover:shadow-2xl mt-4">

      <div className="px-6 py-4 bg-gray-100">
        <h1 className="text-3xl font-bold text-blue-700 mb-4">{region}</h1>
        <div className="flex flex-col gap-6 mb-6">
          <div className="flex items-center gap-4">
            <label htmlFor="region" className="text-gray-800 font-semibold w-1/3">Region:</label>
            <select
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="flex-1 p-4 border border-gray-300 rounded-lg shadow-md focus:border-blue-600 focus:ring focus:ring-blue-600 focus:ring-opacity-50 text-lg"
            >
              <option value="Butambal">Butambala</option>
              <option value="Lwengo">Lwengo</option>
              <option value="Mukono">Mukono</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <label htmlFor="crop" className="text-gray-800 font-semibold w-1/3">Crop:</label>
            <select
              id="crop"
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="flex-1 p-4 border border-gray-300 rounded-lg shadow-md focus:border-blue-600 focus:ring focus:ring-blue-600 focus:ring-opacity-50 text-lg"
            >
              <option value="Rice">Rice</option>
              <option value="Coffee">Coffee</option>
              <option value="Cocoa">Cocoa</option>
            </select>
          </div>
        </div>
        <div className="text-gray-800 text-lg mb-6">
          <p className="mb-2">
            <strong className="text-gray-600">Crop:</strong> {crop}
          </p>
          <p>
            <strong className="text-gray-600">Farm Name:</strong> {currentData.farmName}
          </p>
        </div>
      </div>
      <img className="w-full h-48 object-cover" src={currentData.imageUrl} alt={`Photo of ${region}`} />

      <div className="px-6 py-4 bg-gray-50">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center text-gray-600">
            <FaThermometerHalf className="text-red-500 mr-3 text-2xl" />
            <div className="font-semibold w-1/2">Temperature:</div>
            <div className="text-gray-800 text-xl w-1/2 text-right">{currentData.temperature} °C</div>
          </div>
          <div className="flex items-center text-gray-600">
            <FaTint className="text-blue-500 mr-3 text-2xl" />
            <div className="font-semibold w-1/2">Humidity:</div>
            <div className="text-gray-800 text-xl w-1/2 text-right">{currentData.humidity} %</div>
          </div>
          <div className="flex items-center text-gray-600">
            <FaSun className="text-yellow-500 mr-3 text-2xl" />
            <div className="font-semibold w-1/2">Solar Radiation:</div>
            <div className="text-gray-800 text-xl w-1/2 text-right">{currentData.solarRadiation} W/m²</div>
          </div>
          <div className="flex items-center text-gray-600">
            <FaWind className="text-gray-600 mr-3 text-2xl" />
            <div className="font-semibold w-1/2">Wind Speed:</div>
            <div className="text-gray-800 text-xl w-1/2 text-right">{currentData.windSpeed} m/s</div>
          </div>
          <div className="flex items-center text-gray-600">
            <FaTachometerAlt className="text-green-500 mr-3 text-2xl" />
            <div className="font-semibold w-1/2">Pressure:</div>
            <div className="text-gray-800 text-xl w-1/2 text-right">{currentData.pressure} Pa</div>
          </div>
          <div className="flex items-center text-gray-600">
            <FaMapPin className="text-gray-700 mr-3 text-2xl" />
            <div className="font-semibold w-1/2">Latitude:</div>
            <div className="text-gray-800 text-xl w-1/2 text-right">{currentData.latitude}</div>
          </div>
          <div className="flex items-center text-gray-600">
            <FaMapPin className="text-gray-700 mr-3 text-2xl" />
            <div className="font-semibold w-1/2">Longitude:</div>
            <div className="text-gray-800 text-xl w-1/2 text-right">{currentData.longitude}</div>
          </div>
        </div>
        <div className="px-4 py-2 bg-gray-100 mt-4 rounded-lg shadow-md">
          <div className="flex items-center text-gray-600 mb-2">
            <FaSun className="text-yellow-500 mr-3 text-2xl" />
            <div className="font-semibold w-1/2">ET₀:</div>
            <div className="text-gray-800 text-xl w-1/2 text-right">{currentData.ET0} mm/day</div>
          </div>
          <div className="flex items-center text-gray-600">
            <FaSun className="text-yellow-500 mr-3 text-2xl" />
            <div className="font-semibold w-1/2">ETc:</div>
            <div className="text-gray-800 text-xl w-1/2 text-right">{currentData.ETc} mm/day</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
