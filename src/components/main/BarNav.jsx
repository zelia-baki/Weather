import React, { useState, useEffect } from "react";
import { FaFeather } from "react-icons/fa";

const LandingPage = ({ children }) => {
    const [dropdownsVisible, setDropdownsVisible] = useState({
        forestDropdown: false,
        farmDropdown: false,
        digitalTraceDropdown: false,
        weatherDropdown: false,
    });

    const toggleDropdown = (menu) => {
        setDropdownsVisible((prevState) => ({
            ...prevState,
            [menu]: !prevState[menu],
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
        <div className="bg-gradient-to-br from-green-300 via-teal-100 to-blue-200 min-h-screen font-poppins text-gray-800">
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
                    <div className="relative">
                        <button
                            onClick={() => toggleDropdown("forestDropdown")}
                            className="dropdown-btn text-white bg-transparent border-none py-2 px-4 rounded-full focus:outline-none transition-all duration-300 hover:underline"
                        >
                            Forest
                        </button>
                        {dropdownsVisible.forestDropdown && (
                            <div className="dropdown absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg">
                                <ul className="text-gray-700">
                                    <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                        <a href="/forest" className="block w-full h-full">
                                            Forest Data
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Farm Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => toggleDropdown("farmDropdown")}
                            className="dropdown-btn text-white bg-transparent border-none py-2 px-4 rounded-full focus:outline-none transition-all duration-300 hover:underline"
                        >
                            Farm
                        </button>
                        {dropdownsVisible.farmDropdown && (
                            <div className="dropdown absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg">
                                <ul className="text-gray-700">
                                    <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                        <a href="/farmmanager" className="block w-full h-full">
                                            Farmer Manager
                                        </a>
                                    </li>
                                    <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                        <a href="/crop" className="block w-full h-full">
                                            Crop
                                        </a>
                                    </li>
                                    <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                        <a href="/district" className="block w-full h-full">
                                            District
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Digital Trace Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => toggleDropdown("digitalTraceDropdown")}
                            className="dropdown-btn text-white bg-transparent border-none py-2 px-4 rounded-full focus:outline-none transition-all duration-300 hover:underline"
                        >
                            Digital Trace
                        </button>
                        {dropdownsVisible.digitalTraceDropdown && (
                            <div className="dropdown absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg">
                                <ul className="text-gray-700">
                                    <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                        <a href="/producestamps" className="block w-full h-full">
                                            Produce Stamps
                                        </a>
                                    </li>
                                    <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                        <a href="/export" className="block w-full h-full">
                                            Export Stamps
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Weather Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => toggleDropdown("weatherDropdown")}
                            className="dropdown-btn text-white bg-transparent border-none py-2 px-4 rounded-full focus:outline-none transition-all duration-300 hover:underline"
                        >
                            Weather
                        </button>
                        {dropdownsVisible.weatherDropdown && (
                            <div className="dropdown absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg">
                                <ul className="text-gray-700">
                                    <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                        <a href="/weather2" className="block w-full h-full">
                                            Map Weather
                                        </a>
                                    </li>
                                    <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                        <a href="/weather3" className="block w-full h-full">
                                            Weather Data
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                </nav>

                <button
                    onClick={handleLogOut}
                    className="bg-red-500 hover:bg-red-400 text-white font-semibold px-4 py-2 rounded-full shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                    Log Out
                </button>

                {/* Get Started Button */}
                <a
                    href="/login"
                    className="hidden md:inline-block bg-teal-500 hover:bg-teal-300 text-white font-semibold px-6 py-2 rounded-full shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                    Get Started
                </a>
            </header>

            {/* Content Below Navbar */}
            <div className="mt-12 px-6">
                {children}
            </div>
        </div>
    );
};

export default LandingPage;
