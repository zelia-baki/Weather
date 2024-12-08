import React, { useState, useEffect } from 'react';
import { FaThermometerHalf, FaTint, FaSun, FaWind, FaTachometerAlt, FaMapPin } from 'react-icons/fa';
import axiosInstance from '../../axiosInstance';
import { Link } from 'react-router-dom';
import 'react-datetime-picker/dist/DateTimePicker.css'; // Vous pouvez supprimer cette ligne si vous n'utilisez plus DateTimePicker

const Card = ({ initialRegion, initialCrop }) => {
  const [region, setRegion] = useState(initialRegion);
  const [crop, setCrop] = useState(initialCrop);
  const [data, setData] = useState({});
  const [time, setTime] = useState(new Date());
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/weather', {
        params: {
          region_id: region,
          crop_id: crop,
          latitude: latitude,
          longitude: longitude,
          time: time.toISOString(),
        },
      });
      console.log(response);
      setData(response.data.data || {});
    } catch (error) {
      setError('Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchClick = () => {
    fetchData();
  };

  return (
    <div className="w-full max-w-7xl mx-auto rounded-xl overflow-hidden shadow-2xl bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 border border-blue-300 mt-4 mb-8 p-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Column */}
        <div className="md:w-2/5 p-6 bg-white rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300">

          <h1 className="text-4xl font-extrabold text-blue-700 mb-4">{region}</h1>
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <label htmlFor="latitude" className="text-gray-700 font-semibold w-1/3">Latitude:</label>
              <input
                id="latitude"
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                placeholder="Enter latitude"
                className="flex-1 p-3 border border-gray-300 rounded-lg shadow-md text-lg bg-gradient-to-r from-white to-blue-50"
              />
            </div>
            <div className="flex items-center gap-4">
              <label htmlFor="longitude" className="text-gray-700 font-semibold w-1/3">Longitude:</label>
              <input
                id="longitude"
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                placeholder="Enter longitude"
                className="flex-1 p-3 border border-gray-300 rounded-lg shadow-md text-lg bg-gradient-to-r from-white to-blue-50"
              />
            </div>
            <div className="flex items-center gap-4">
              <label htmlFor="time" className="text-gray-700 font-semibold w-1/3">Time:</label>
              <input
                type="datetime-local"
                id="time"
                name="time"
                value={time.toISOString().slice(0, 16)}
                onChange={(e) => setTime(new Date(e.target.value))}
                className="flex-1 p-3 border border-gray-300 rounded-lg shadow-md text-lg bg-gradient-to-r from-white to-blue-50"
                required
              />
            </div>
            <div className="flex items-center gap-4">
              <label htmlFor="crop" className="text-gray-700 font-semibold w-1/3">Crop:</label>
              <select
                id="crop"
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-lg shadow-md focus:border-blue-600 focus:ring focus:ring-blue-600 focus:ring-opacity-50 text-lg bg-gradient-to-r from-white to-blue-50"
              >
                <option value=" ">Select a Crop</option>
                <option value="Rice">Rice</option>
                <option value="Coffee">Coffee</option>
                <option value="Cocoa">Cocoa</option>
                <option value="Maize">Maize</option>
                <option value="Soybean">Soybean</option>
                <option value="Sorghum">Sorghum</option>
                <option value="Sunflower">Sunflower</option>
              </select>
            </div>
            <button
              onClick={handleFetchClick}
              className="w-full py-2 bg-blue-700 text-white rounded-lg shadow-md hover:bg-blue-800 transition duration-300 mt-4 transform hover:translate-y-1 hover:shadow-xl"
            >
              Fetch Data
            </button>
          </div>
          <div className="text-gray-800 text-lg mt-4">
            <p className="mb-2">
              <strong className="text-gray-600">Crop:</strong> {crop}
            </p>
            <p>
              <strong className="text-gray-600">Farm Name:</strong> {data.farmName || 'Adhil Morgan'}
            </p>
            <p>
              <strong className="text-gray-600">Latitude:</strong> {data.latitude || 'N/A'}
            </p>
            <p>
              <strong className="text-gray-600">Longitude:</strong> {data.longitude || 'N/A'}
            </p>
            <p>
              <strong className="text-gray-600">Time:</strong> {data.timestamp || 'N/A'}
            </p>
          </div>

        </div>

        {/* Right Column */}
        <div className="md:w-3/5 p-6 bg-white rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300">
          {loading ? (
            <div className="text-center text-gray-500">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : (
            <>
              <br />
              <img className="w-full h-40 object-cover rounded-lg shadow-md mb-4" src={data.imageUrl || '/default-image.jpg'} alt={`Photo of ${region}`} />
              <div className="flex flex-col gap-4">
                <div className="flex items-center text-gray-600">
                  <FaThermometerHalf className="text-red-500 mr-2 text-xl" />
                  <div className="font-semibold w-1/2">Temperature:</div>
                  <div className="text-gray-800 text-lg w-1/2 text-right"> {data.average_temperature ? data.average_temperature.toFixed(2) : 'N/A'} °C</div>
                 

                </div>
                <div className="flex items-center text-gray-600">
                  <FaTint className="text-blue-500 mr-2 text-xl" />
                  <div className="font-semibold w-1/2">Humidity:</div>
                  <div className="text-gray-800 text-lg w-1/2 text-right">{data.humidity ? data.humidity.toFixed(2) : 'N/A'} %
                  </div>
                </div>
                <div className="flex items-center text-gray-600">
                  <FaSun className="text-yellow-500 mr-2 text-xl" />
                  <div className="font-semibold w-1/2">Solar Radiation:</div>
                  <div className="text-gray-800 text-lg w-1/2 text-right">{data.solarRadiation ? data.solarRadiation.toFixed(2) :  'N/A'} W/m²</div>
                </div>
                <div className="flex items-center text-gray-600">
                  <FaWind className="text-gray-600 mr-2 text-xl" />
                  <div className="font-semibold w-1/2">Wind Speed:</div>
                  <div className="text-gray-800 text-lg w-1/2 text-right">{data.windSpeed ? data.windSpeed.toFixed(2) :  'N/A'} m/s</div>
                </div>
                {/* Precipitation */}
                <div className="flex items-center text-gray-600">
                  <FaTint className="text-green-500 mr-3 text-2xl" />
                  <div className="font-semibold w-1/2">Precipitation:</div>
                  <div className="text-gray-800 text-xl w-1/2 text-right">{data.precipitation ? data.precipitation.toFixed(2) :  'N/A'} Pa</div>
                </div>
                <div className="flex items-center text-gray-600">
                  <FaTachometerAlt className="text-purple-500 mr-2 text-xl" />
                  <div className="font-semibold w-1/2">ET0 :</div>
                  <div className="text-gray-800 text-xl w-1/2 text-right">{data.ET0 ? data.ET0.toFixed(2) : 'N/A'} mm/day</div>
                  </div>
                  <div className="flex items-center text-gray-600">

                  <FaTachometerAlt className="text-purple-500 mr-2 text-xl" />
                  <div className="font-semibold w-1/2">ETc :</div>
                  <div className="text-gray-800 text-xl w-1/2 text-right">{data.ETc ? data.ETc.toFixed(2) : 'N/A'} mm/day</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card;
