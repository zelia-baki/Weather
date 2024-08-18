import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaTree, FaQrcode, FaSeedling, FaSun, FaChevronDown, FaSignOutAlt } from 'react-icons/fa';

const Sidebar = () => {
  const [openForestDropdown, setOpenForestDropdown] = useState(false);
  const [openFarmDropdown, setOpenFarmDropdown] = useState(false);
  const [openDigitalTraceDropdown, setOpenDigitalTraceDropdown] = useState(false);
  const [openWeatherDropdown, setOpenWeatherDropdown] = useState(false);

  const toggleForestDropdown = () => {
    setOpenForestDropdown(!openForestDropdown);
  };

  const toggleFarmDropdown = () => {
    setOpenFarmDropdown(!openFarmDropdown);
  };

  const toggleDigitalTraceDropdown = () => {
    setOpenDigitalTraceDropdown(!openDigitalTraceDropdown);
  };

  const toggleWeatherDropdown = () => {
    setOpenWeatherDropdown(!openWeatherDropdown);
  };

  return (
    <div className="h-screen w-64 bg-gradient-to-r from-teal-50 via-green-50 to-yellow-50 text-gray-900 flex flex-col justify-between rounded-xl shadow-lg overflow-hidden">
      <div>
        <div className="flex items-center justify-center h-16 bg-gradient-to-r from-teal-400 via-green-400 to-yellow-400 rounded-t-xl shadow-lg">
          <span className="text-2xl font-bold text-white">Agriyields</span>
        </div>
        <nav className="mt-10 space-y-2">
          <div>
            <button
              onClick={toggleForestDropdown}
              className="flex items-center justify-between w-full p-3 text-base font-medium text-gray-800 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105"
            >
              <span className="flex items-center">
                <FaTree className="text-green-700 text-xl" />
                <span className="ml-4">Forest</span>
              </span>
              <FaChevronDown className={`ml-4 transition-transform ${openForestDropdown ? 'rotate-180' : ''}`} />
            </button>
            <div className={`ml-8 mt-2 space-y-1 transition-all duration-300 ease-in-out ${openForestDropdown ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
              <Link to="/forestpage" className="block p-2 text-sm text-gray-600 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105">
                Forest Data
              </Link>
              <Link to="/forest-management" className="block p-2 text-sm text-gray-600 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105">
                Forest Management
              </Link>
              <Link to="/tree-species" className="block p-2 text-sm text-gray-600 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105">
                Tree Species
              </Link>
            </div>
          </div>

          <div>
            <button
              onClick={toggleFarmDropdown}
              className="flex items-center justify-between w-full p-3 text-base font-medium text-gray-800 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105"
            >
              <span className="flex items-center">
                <FaSeedling className="text-yellow-700 text-xl" />
                <span className="ml-4">Farm</span>
              </span>
              <FaChevronDown className={`ml-4 transition-transform ${openFarmDropdown ? 'rotate-180' : ''}`} />
            </button>
            <div className={`ml-8 mt-2 space-y-1 transition-all duration-300 ease-in-out ${openFarmDropdown ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
              <Link to="/createfarm" className="block p-2 text-sm text-gray-600 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105">
                Farm Data
              </Link>
              <Link to="/farmer-group" className="block p-2 text-sm text-gray-600 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105">
                Farmer Group
              </Link>
              <Link to="/cropmanage" className="block p-2 text-sm text-gray-600 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105">
                Crop
              </Link>
              <Link to="/district" className="block p-2 text-sm text-gray-600 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105">
                District
              </Link>
            </div>
          </div>

          <div>
            <button
              onClick={toggleDigitalTraceDropdown}
              className="flex items-center justify-between w-full p-3 text-base font-medium text-gray-800 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105"
            >
              <span className="flex items-center">
                <FaQrcode className="text-blue-700 text-xl" />
                <span className="ml-4">Digital Trace</span>
              </span>
              <FaChevronDown className={`ml-4 transition-transform ${openDigitalTraceDropdown ? 'rotate-180' : ''}`} />
            </button>
            <div className={`ml-8 mt-2 space-y-1 transition-all duration-300 ease-in-out ${openDigitalTraceDropdown ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
              <Link to="/digital-trace-data" className="block p-2 text-sm text-gray-600 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105">
                Digital Trace Data
              </Link>
              <Link to="/trace-management" className="block p-2 text-sm text-gray-600 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105">
                Trace Management
              </Link>
              <Link to="/trace-logs" className="block p-2 text-sm text-gray-600 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105">
                Trace Logs
              </Link>
            </div>
          </div>

          <div>
            <button
              onClick={toggleWeatherDropdown}
              className="flex items-center justify-between w-full p-3 text-base font-medium text-gray-800 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105"
            >
              <span className="flex items-center">
                <FaSun className="text-orange-600 text-xl" />
                <span className="ml-4">Weather</span>
              </span>
              <FaChevronDown className={`ml-4 transition-transform ${openWeatherDropdown ? 'rotate-180' : ''}`} />
            </button>
            <div className={`ml-8 mt-2 space-y-1 transition-all duration-300 ease-in-out ${openWeatherDropdown ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
              <Link to="/graph" className="block p-2 text-sm text-gray-600 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105">
                Graph
              </Link>
              <Link to="/card" className="block p-2 text-sm text-gray-600 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105">
                Card ET0 and ETc
              </Link>
              <Link to="/weather-details" className="block p-2 text-sm text-gray-600 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105">
                Weather Details
              </Link>
            </div>
          </div>
        </nav>
      </div>
      <div className="p-4">
        <button className="mt-2 w-full py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors duration-300 flex items-center justify-center transform hover:scale-105">
          <FaSignOutAlt className="mr-2" />
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
