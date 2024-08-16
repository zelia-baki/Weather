import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaTree, FaQrcode, FaSeedling, FaSun, FaChevronDown, FaSignOutAlt } from 'react-icons/fa';

const Sidebar = () => {
  const [openDropdown, setOpenDropdown] = useState(false);

  const toggleDropdown = () => {
    setOpenDropdown(!openDropdown);
  };

  return (
    <div className="h-screen w-64 bg-gradient-to-r from-teal-50 via-green-50 to-yellow-50 text-gray-900 flex flex-col justify-between rounded-xl shadow-lg overflow-hidden">
      <div>
        <div className="flex items-center justify-center h-16 bg-gradient-to-r from-teal-400 via-green-400 to-yellow-400 rounded-t-xl shadow-lg">
          <span className="text-2xl font-bold text-white">Agriyields</span>
        </div>
        <nav className="mt-10 space-y-2">
          <Link to="/" className="flex items-center p-3 text-base font-medium text-gray-800 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105">
            <FaTree className="text-green-700 text-xl" />
            <span className="ml-4">Forest</span>
          </Link>
          <Link to="/digital-trace" className="flex items-center p-3 text-base font-medium text-gray-800 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105">
            <FaQrcode className="text-blue-700 text-xl" />
            <span className="ml-4">Digital Trace</span>
          </Link>
          <Link to="/farmer" className="flex items-center p-3 text-base font-medium text-gray-800 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105">
            <FaSeedling className="text-yellow-700 text-xl" />
            <span className="ml-4">Farmer</span>
          </Link>
          <div>
            <button
              onClick={toggleDropdown}
              className="flex items-center justify-between w-full p-3 text-base font-medium text-gray-800 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105"
            >
              <span className="flex items-center">
                <FaSun className="text-orange-600 text-xl" />
                <span className="ml-4">Weather</span>
              </span>
              <FaChevronDown className={`ml-4 transition-transform ${openDropdown ? 'rotate-180' : ''}`} />
            </button>
            <div className={`ml-8 mt-2 space-y-1 transition-all duration-300 ease-in-out ${openDropdown ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
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
