import React, { useState, useEffect, useCallback } from "react";
import { FaFeather } from "react-icons/fa";
import { MdManageAccounts } from "react-icons/md";
import { FiLogOut } from "react-icons/fi";
import parrot from '../img/parrot.jpg';
import { Link } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';


const Layout = ({ children }) => {
    const [userRole, setUserRole] = useState(null);
    const [dropdownsVisible, setDropdownsVisible] = useState({
        forestDropdown: false,
        farmDropdown: false,
        digitalTraceDropdown: false,
        weatherDropdown: false,
    });
    const [isAdmin, setIsAdmin] = useState(false);
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const decodedToken = jwtDecode(token);
            const role = decodedToken.sub?.user_type || '';
            console.log(role);
            setUserRole(role);
            setIsAdmin(role === "admin"); // Directly setting isAdmin
            console.log(isAdmin);
        }
    }, []);


    // Utilisation de useCallback pour empêcher les redémarrages inutiles de la fonction
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

    // Ferme les menus si l'utilisateur clique en dehors
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

    // Délai d'affichage pour empêcher la disparition trop rapide du menu
    const handleMouseEnter = (dropdown) => {
        setTimeout(() => {
            setDropdownsVisible((prevState) => ({
                ...prevState,
                [dropdown]: true,
            }));
        }, 200); // Délai de 200 ms avant d'afficher le menu
    };

    const handleMouseLeave = (dropdown) => {
        setTimeout(() => {
            setDropdownsVisible((prevState) => ({
                ...prevState,
                [dropdown]: false,
            }));
        }, 200); // Délai de 200 ms avant de masquer le menu
    };

    return (
        <div className="bg-white min-h-screen font-poppins text-gray-800">
            {/* Header */}
            <header className="bg-gradient-to-r from-teal-700 to-blue-800 text-white px-6 py-4 flex items-center justify-between shadow-lg sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
                {/* Logo */}
                <h1 className="text-4xl font-extrabold flex items-center gap-3 group">
                    {/* <span className="bg-white text-teal-700 p-2 rounded-full shadow-md group-hover:rotate-12 group-hover:scale-110 transform transition-all duration-300">
                        <FaFeather />
                    </span> */}
                    <span className="bg-white p-2 rounded-full shadow-md group-hover:rotate-12 group-hover:scale-110 transform transition-all duration-300">
                        <img 
                          src={parrot} 
                          alt="Description de l'image" 
                          className="w-16 h-16 rounded-full object-cover" 
                        />
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
                        onMouseEnter={() => handleMouseEnter("forestDropdown")}
                        onMouseLeave={() => handleMouseLeave("forestDropdown")}
                    >
                        <button
                            className="dropdown-btn text-white bg-transparent border-none py-2 px-4 rounded-full focus:outline-none transition-all duration-300 hover:underline"
                        >
                            Forest
                        </button>
                        {dropdownsVisible.forestDropdown && (
                            <div className="dropdown absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg">
                                <ul className="text-gray-700 font-light text-base font-sans" style={{ fontFamily: 'Arial, sans-serif' }}>
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
                        onMouseEnter={() => handleMouseEnter("farmDropdown")}
                        onMouseLeave={() => handleMouseLeave("farmDropdown")}
                    >
                        <button
                            className="dropdown-btn text-white bg-transparent border-none py-2 px-4 rounded-full focus:outline-none transition-all duration-300 hover:underline"
                        >
                            Farm
                        </button>
                        {dropdownsVisible.farmDropdown && (
                            <div className="dropdown absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg">
                                <ul className="text-gray-700 font-light text-base font-sans" style={{ fontFamily: 'Arial, sans-serif' }}>
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
                                        <Link to="/mapviewall" state={{ owner_type: 'farmer' }} className="block w-full h-full">
                                            View all
                                        </Link>
                                    </li>
                                    <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                        <Link to="/storeProductManager" state={{ owner_type: 'farmer' }} className="block w-full h-full">
                                            Store
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Digital Trace Dropdown */}
                    <div
                        className="relative"
                        onMouseEnter={() => handleMouseEnter("digitalTraceDropdown")}
                        onMouseLeave={() => handleMouseLeave("digitalTraceDropdown")}
                    >
                        <button
                            className="dropdown-btn text-white bg-transparent border-none py-2 px-4 rounded-full focus:outline-none transition-all duration-300 hover:underline"
                        >
                            Digital Trace
                        </button>
                        {dropdownsVisible.digitalTraceDropdown && (
                            <div className="dropdown absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg">
                                <ul className="text-gray-700 font-light text-base font-sans" style={{ fontFamily: 'Arial, sans-serif' }}>
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
                        onMouseEnter={() => handleMouseEnter("weatherDropdown")}
                        onMouseLeave={() => handleMouseLeave("weatherDropdown")}
                    >
                        <button
                            className="dropdown-btn text-white bg-transparent border-none py-2 px-4 rounded-full focus:outline-none transition-all duration-300 hover:underline"
                        >
                            Weather
                        </button>
                        {dropdownsVisible.weatherDropdown && (
                            <div className="dropdown absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg">
                                <ul className="text-gray-700 font-light text-base font-sans" style={{ fontFamily: 'Arial, sans-serif' }}>
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
                                    <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                        <a href="/onemonth" className="block w-full h-full">
                                        HDD & CDD (1 Months)                                        </a>
                                    </li>
                                    <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                        <a href="/threemonth" className="block w-full h-full">
                                        HDD & CDD (3 Months)                                        </a>
                                    </li>
                                    <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                        <a href="/graphpest" className="block w-full h-full">
                                        GDD for Pest                                        </a>
                                    </li>
                                    <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                        <a href="/weatherdas" className="block w-full h-full">
                                            Anomaly Alert
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                    {/* Dashboard Dropdown */}
                    <div
                        className="relative"
                        onMouseEnter={() => handleMouseEnter("dashDropdown")}
                        onMouseLeave={() => handleMouseLeave("dashDropdown")}
                    >
                        <button
                            className="dropdown-btn text-white bg-transparent border-none py-2 px-4 rounded-full focus:outline-none transition-all duration-300 hover:underline"
                        >
                            Dashboard
                        </button>
                        {dropdownsVisible.dashDropdown && (
                            <div className="dropdown absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg">
                                <ul className="text-gray-700 font-light text-base font-sans" style={{ fontFamily: 'Arial, sans-serif' }}>
                                    <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                        <a href="/userDash" className="block w-full h-full">
                                            Dashboard
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                    {/* EUDR */}
                    <div
                        className="relative"
                        onMouseEnter={() => handleMouseEnter("eudrDropdown")}
                        onMouseLeave={() => handleMouseLeave("eudrDropdown")}
                    >
                        <button
                            className="dropdown-btn text-white bg-transparent border-none py-2 px-4 rounded-full focus:outline-none transition-all duration-300 hover:underline"
                        >
                            EUDR
                        </button>
                        {dropdownsVisible.eudrDropdown && (
                            <div className="dropdown absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg">
                                <ul className="text-gray-700 font-light text-base font-sans" style={{ fontFamily: 'Arial, sans-serif' }}>
                                    <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                        <a href="/EUDRSubmission" className="block w-full h-full">
                                            EUDR
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                </nav>

                <div className="flex items-center gap-4">

                    {isAdmin && (
                        <Link to="/usermanager" className="text-white bg-transparent border-none py-2 px-4 rounded-full focus:outline-none transition-all duration-300 hover:underline">
                            <MdManageAccounts className="inline-block" /> User Manager
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
            <div className="mt-12 px-6">{children}</div>
        </div>
    );
};

export default Layout;
