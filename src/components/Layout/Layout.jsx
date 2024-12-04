import React, { useState, useEffect } from "react";
import { FaFeather } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import { jwtDecode } from 'jwt-decode';  // Correct import

const Layout = ({ children }) => {
    const [dropdownsVisible, setDropdownsVisible] = useState({
        forestDropdown: false,
        farmDropdown: false,
        digitalTraceDropdown: false,
        weatherDropdown: false,
    });
    const [isAdmin, setIsAdmin] = useState(false);
    const [userType, setUserType] = useState('');

    const toggleDropdown = (dropdown, value) => {
        setDropdownsVisible((prevState) => ({
            ...prevState,
            [dropdown]: value,
        }));
    };

    const handleLogOut = () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
    };


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                !event.target.closest(".dropdown") &&
                !event.target.closest(".dropdown-btn")
            ) {
                setDropdownsVisible({
                    forestDropdown: false,
                    farmDropdown: false,
                    digitalTraceDropdown: false,
                    weatherDropdown: false,
                });
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="bg-white min-h-screen font-poppins text-gray-800">
            {/* Header */}
            <header className="bg-gradient-to-r from-teal-700 to-blue-800 text-white px-6 py-4 flex items-center justify-between shadow-lg sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
                {/* Logo */}
                <h1 className="text-4xl font-extrabold flex items-center gap-3 group">
                    <span className="bg-white text-teal-700 p-2 rounded-full shadow-md group-hover:rotate-12 group-hover:scale-110 transform transition-all duration-300">
                        <FaFeather />
                    </span>
                    <span className="group-hover:text-teal-300 transition-all duration-300">
                        Nkusu
                    </span>
                </h1>

                {/* Navigation */}
                <nav className="hidden md:flex space-x-8 text-lg font-medium">
                    {/* Forest Dropdown */}
                    <div
                        className="relative"
                        onMouseEnter={() => toggleDropdown("forestDropdown", true)}
                        onMouseLeave={() => toggleDropdown("forestDropdown", false)}
                    >
                        <button
                            className="dropdown-btn text-white bg-transparent border-none py-2 px-4 rounded-full focus:outline-none transition-all duration-300 hover:underline"
                        >
                            Forest
                        </button>
                        {dropdownsVisible.forestDropdown && (
                            <div className="dropdown absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg">
                                <ul className="text-gray-700">
                                    <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                        <a href="/forestpage" className="block w-full h-full">
                                            Forest Data
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Farm Dropdown */}
                    <div
                        className="relative"
                        onMouseEnter={() => toggleDropdown("farmDropdown", true)}
                        onMouseLeave={() => toggleDropdown("farmDropdown", false)}
                    >                        <button
                        onClick={() => toggleDropdown("farmDropdown")}
                        className="dropdown-btn text-white bg-transparent border-none py-2 px-4 rounded-full focus:outline-none transition-all duration-300 hover:underline"
                    >
                            Farm
                        </button>
                        {dropdownsVisible.farmDropdown && (
                            <div className="dropdown absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg">
                                <ul className="text-gray-700">
                                    <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                        <a href="/farmergroup" className="block w-full h-full">
                                            Farmer Group
                                        </a>
                                    </li>
                                    <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                        <a href="/farmmanager" className="block w-full h-full">
                                            Farmer Manager
                                        </a>
                                    </li>
                                    <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                        <a href="/cropmanage" className="block w-full h-full">
                                            Crop
                                        </a>
                                    </li>
                                    <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                        <a href="district" className="block w-full h-full">
                                            District
                                        </a>
                                    </li>
                                    <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                        <a href="/mapviewall" className="block w-full h-full">
                                            View All
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Digital Trace Dropdown */}
                    <div
                        className="relative"
                        onMouseEnter={() => toggleDropdown("digitalTraceDropdown", true)}
                        onMouseLeave={() => toggleDropdown("digitalTraceDropdown", false)}
                    >                        <button
                        onClick={() => toggleDropdown("digitalTraceDropdown")}
                        className="dropdown-btn text-white bg-transparent border-none py-2 px-4 rounded-full focus:outline-none transition-all duration-300 hover:underline"
                    >
                            Digital Trace
                        </button>
                        {dropdownsVisible.digitalTraceDropdown && (
                            <div className="dropdown absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg">
                                <ul className="text-gray-700">
                                    <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                        <a href="/qrproduce" className="block w-full h-full">
                                            Produce Stamps
                                        </a>
                                    </li>
                                    <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                        <a href="/qrconservation" className="block w-full h-full">
                                            Forest Conservation Stamps
                                        </a>
                                    </li>
                                    <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                        <a href="qrexport" className="block w-full h-full">
                                            Export Stamps
                                        </a>
                                    </li>
                                    <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                        <a href="/qrfertilizer" className="block w-full h-full">
                                            Fertilizer Stamps
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Weather Dropdown */}
                    <div
                        className="relative"
                        onMouseEnter={() => toggleDropdown("weatherDropdown", true)}
                        onMouseLeave={() => toggleDropdown("weatherDropdown", false)}
                    >                        <button
                        onClick={() => toggleDropdown("weatherDropdown")}
                        className="dropdown-btn text-white bg-transparent border-none py-2 px-4 rounded-full focus:outline-none transition-all duration-300 hover:underline"
                    >
                            Weather
                        </button>
                        {dropdownsVisible.weatherDropdown && (
                            <div className="dropdown absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg">
                                <ul className="text-gray-700">
                                    <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                        <a href="/weathermap" className="block w-full h-full">
                                            Map Weather
                                        </a>
                                    </li>
                                    <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                        <a href="/graph" className="block w-full h-full">
                                            Weather Data
                                        </a>
                                    </li>
                                    <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                        <a href="/graphcgd" className="block w-full h-full">
                                            Graph HDD and CDD
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                </nav>


                <div className="flex items-center gap-4">
                    {isAdmin && (
                        <Link
                            to="/usermanager"
                            className="flex items-center p-2 text-sm font-medium text-white bg-teal-500 rounded-lg shadow-md hover:bg-teal-600 transition-all duration-300"
                        >
                            <FaUser className="mr-2" />
                            Manage account
                        </Link>
                    )}
                    <button
                        onClick={handleLogOut}
                        className="bg-teal-100 text-teal-700 font-semibold px-4 py-2 rounded-lg shadow-md flex items-center gap-2 hover:bg-gray-300 hover:text-gray-900 transition-all duration-200"
                    >
                        <FiLogOut className="text-xl" />
                        Log Out
                    </button>
                </div>

            </header>

            {/* Content Below Navbar */}
            <div className="mt-12 px-6">
                {children}
            </div>
        </div>
    );

};



export default Layout;
