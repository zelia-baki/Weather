import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaTree, FaQrcode, FaSeedling, FaSun, FaChevronDown, FaSignOutAlt, FaBars } from 'react-icons/fa';
import { jwtDecode } from 'jwt-decode';  // Correct import

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openForestDropdown, setOpenForestDropdown] = useState(false);
  const [openFarmDropdown, setOpenFarmDropdown] = useState(false);
  const [openDigitalTraceDropdown, setOpenDigitalTraceDropdown] = useState(false);
  const [openWeatherDropdown, setOpenWeatherDropdown] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userType, setUserType] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token); // Decode the JWT token
      setIsAdmin(decoded.sub.is_admin); // Correct access to is_admin in the token's sub object
      setUserType(decoded.sub.user_type);
    }
  }, []);

  const toggleForestDropdown = () => setOpenForestDropdown(!openForestDropdown);
  const toggleFarmDropdown = () => setOpenFarmDropdown(!openFarmDropdown);
  const toggleDigitalTraceDropdown = () => setOpenDigitalTraceDropdown(!openDigitalTraceDropdown);
  const toggleWeatherDropdown = () => setOpenWeatherDropdown(!openWeatherDropdown);

  const handleLogOut = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <div className={`h-lvh ${isCollapsed ? 'w-16' : 'w-64'} bg-gradient-to-r from-teal-50 via-green-50 to-yellow-50 text-gray-900 flex flex-col justify-between rounded-xl shadow-lg overflow-hidden transition-all duration-300 ease-in-out`}>
      <div>
        <div className="flex items-center justify-between h-16 bg-gradient-to-r from-teal-400 via-green-400 to-yellow-400 rounded-t-xl shadow-lg px-3">
          {!isCollapsed && <span className="text-2xl font-bold text-white">Agriyields</span>}
          <button onClick={toggleSidebar} className="text-white">
            <FaBars />
          </button>
        </div>
        <nav className="mt-10 space-y-2">

          {/* Forest Section - displayed only for forest users or admins */}
          {(isAdmin || userType === 'forest') && (
            <div>
              <button
                onClick={toggleForestDropdown}
                className={`flex items-center justify-between w-full p-3 text-base font-medium text-gray-800 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105 ${isCollapsed && 'justify-center'}`}
              >
                <FaTree className="text-green-700 text-xl" />
                {!isCollapsed && (
                  <>
                    <span className="ml-4">Forest</span>
                    <FaChevronDown className={`ml-4 transition-transform ${openForestDropdown ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>
              {!isCollapsed && openForestDropdown && (
                <div className="ml-8 mt-2 space-y-1 transition-all duration-300 ease-in-out">
                  <Link to="/forestpage" className="block p-2 text-sm text-gray-600 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105">
                    Forest Data
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Farm Section - displayed only for farm users or admins */}
          {(isAdmin || userType === 'farmer') && (
            <div className="mb-6">
              <button
                onClick={toggleFarmDropdown}
                className={`flex items-center justify-between w-full p-3 text-base font-medium text-gray-800 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105 ${isCollapsed && 'justify-center'}`}
              >
                <FaSeedling className="text-yellow-700 text-xl" />
                {!isCollapsed && (
                  <>
                    <span className="ml-4">Farm</span>
                    <FaChevronDown className={`ml-4 transition-transform ${openFarmDropdown ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>
              {!isCollapsed && openFarmDropdown && (
                <div className="ml-8 mt-2 space-y-1 transition-all duration-300 ease-in-out">
                  <Link to="/farmergroup" className="block p-2 text-sm text-gray-600 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105">
                    Farmer Group
                  </Link>
                  <Link to="/farmmanager" className="block p-2 text-sm text-gray-600 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105">
                    Farm Manager
                  </Link>
                  <Link to="/cropmanage" className="block p-2 text-sm text-gray-600 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105">
                    Crop
                  </Link>
                  <Link to="/district" className="block p-2 text-sm text-gray-600 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105">
                    District
                  </Link>
                  <Link to="/mapviewall" state={{ owner_type: "farmer" }} className="block p-2 text-sm text-gray-600 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105">
                    View all
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Digital Trace Section */}
          <div className="mb-2">
            <button
              onClick={toggleDigitalTraceDropdown}
              className={`flex items-center justify-between w-full p-3 text-base font-medium text-gray-800 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105 ${isCollapsed && 'justify-center'}`}
            >
              <FaQrcode className="text-blue-700 text-xl" />
              {!isCollapsed && (
                <>
                  <span className="ml-4">Digital Trace</span>
                  <FaChevronDown className={`ml-4 transition-transform ${openDigitalTraceDropdown ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>
            {!isCollapsed && openDigitalTraceDropdown && (
              <div className="ml-8 mt-2 space-y-1 transition-all duration-300 ease-in-out">
                <Link to="/qrproduce" className="block p-2 text-sm text-gray-600 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105">
                  Produce Stamps
                </Link>
                <Link to="/qrconservation" className="block p-2 text-sm text-gray-600 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105">
                  Forest Conservation Stamps
                </Link>
                <Link to="/qrexport" className="block p-2 text-sm text-gray-600 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105">
                  Export Stamps
                </Link>
                <Link to="/qrfertilizer" className="block p-2 text-sm text-gray-600 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105">
                  Fertilizer Stamps
                </Link>
              </div>
            )}
          </div>

          {/* Weather Section */}
          <div>
            <button
              onClick={toggleWeatherDropdown}
              className={`flex items-center justify-between w-full p-3 text-base font-medium text-gray-800 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105 ${isCollapsed && 'justify-center'}`}
            >
              <FaSun className="text-orange-600 text-xl" />
              {!isCollapsed && (
                <>
                  <span className="ml-4">Weather</span>
                  <FaChevronDown className={`ml-4 transition-transform ${openWeatherDropdown ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>
            {!isCollapsed && openWeatherDropdown && (
              <div className="ml-8 mt-2 space-y-1 transition-all duration-300 ease-in-out">
                  <Link to="/cardex" className="block p-2 text-sm text-gray-600 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105">
                  Card
                </Link>
                <Link to="/graph" className="block p-2 text-sm text-gray-600 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105">
                  Weather Data
                </Link>
                <Link to="/graphcgd" className="block p-2 text-sm text-gray-600 hover:bg-teal-200 rounded-md transition duration-300 ease-in-out transform hover:scale-105">
                  Graph HDD and CDD
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
      
      <div>
      {isAdmin && (
            <Link to="/usermanager" className={`flex items-center p-3 text-base font-medium text-gray-800 hover:bg-teal-200 w-full rounded-md transition duration-300 ease-in-out transform hover:scale-105 ${isCollapsed && 'justify-center'}`}>
              <FaUser className="text-red-500 text-xl" />
              {!isCollapsed && <span className="ml-4">Manage account</span>}
            </Link>
          )}


        <button
          onClick={handleLogOut}
          className={`flex items-center p-3 text-base font-medium text-gray-800 hover:bg-teal-200 w-full rounded-md transition duration-300 ease-in-out transform hover:scale-105 ${isCollapsed && 'justify-center'}`}
        >
          <FaSignOutAlt className="text-red-500 text-xl" />
          {!isCollapsed && <span className="ml-4">Log Out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
