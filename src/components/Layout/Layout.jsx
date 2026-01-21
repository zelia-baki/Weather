import React, { useState, useEffect, useCallback, useMemo } from "react";
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
        dashDropdown: false,
        eudrDropdown: false,
    });
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const decodedToken = jwtDecode(token);
            const role = decodedToken.sub?.user_type || '';
            const adminStatus = decodedToken.sub?.is_admin || false;
            console.log('User role:', role);
            setUserRole(role);
            setIsAdmin(adminStatus);
            console.log("ato amin'ny layout ", adminStatus);
        }
    }, []);

    // ============================================
    // FONCTIONS DE VÉRIFICATION D'ACCÈS PAR MENU
    // ============================================

    // Weather: Admin + Weather users + Farmer users
    const canAccessWeather = useMemo(() => {
        return isAdmin || userRole === 'weather' || userRole === 'farmer';
    }, [isAdmin, userRole]);

    // Farm: Admin + Farmer users ONLY (weather users cannot access)
    const canAccessFarm = useMemo(() => {
        return isAdmin || userRole === 'farmer';
    }, [isAdmin, userRole]);

    // Forest: Admin + Forest users
    const canAccessForest = useMemo(() => {
        return isAdmin || userRole === 'forest';
    }, [isAdmin, userRole]);

    // Digital Trace (QR): Tous les users (weather, farmer, forest)
    const canAccessDigitalTrace = useMemo(() => {
        return isAdmin || ['weather', 'farmer', 'forest'].includes(userRole);
    }, [isAdmin, userRole]);

    // Dashboard: Tous les users
    const canAccessDashboard = useMemo(() => {
        return isAdmin || ['weather', 'farmer', 'forest'].includes(userRole);
    }, [isAdmin, userRole]);

    // EUDR (DDS): Tous les users
    const canAccessEUDR = useMemo(() => {
        return isAdmin || ['weather', 'farmer', 'forest'].includes(userRole);
    }, [isAdmin, userRole]);
    
    
    // Toggle dropdown
    const toggleDropdown = (dropdown, value) => {
        setDropdownsVisible((prevState) => ({
            ...prevState,
            [dropdown]: value,
        }));
    };

    const handleLogOut = () => {
        localStorage.removeItem("token");
        sessionStorage.clear();
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
                    dashDropdown: false,
                    eudrDropdown: false,
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
        }, 200);
    };

    const handleMouseLeave = (dropdown) => {
        setTimeout(() => {
            setDropdownsVisible((prevState) => ({
                ...prevState,
                [dropdown]: false,
            }));
        }, 200);
    };

    return (
        <div className="bg-white min-h-screen font-poppins text-gray-800">
            {/* Header */}
            <header className="bg-gradient-to-r from-teal-700 to-blue-800 text-white px-6 py-4 flex items-center justify-between shadow-lg sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
                {/* Logo */}
                <h1 className="text-4xl font-extrabold flex items-center gap-3 group">
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
                    {/* Forest Dropdown - ADMIN + FOREST USERS ONLY ⬅️ */}
                    {canAccessForest && (
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
                                        <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                            <a href="/treemanager" className="block w-full h-full">
                                                Tree Manager
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Farm Dropdown - ADMIN + FARMER USERS ONLY ⬅️ */}
                    {canAccessFarm && (
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
                    )}

                    {/* Digital Trace Dropdown - TOUS LES USERS */}
                    {canAccessDigitalTrace && (
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
                    )}

                    {/* Weather Dropdown - ADMIN + WEATHER USERS ONLY ⬅️ */}
                    {canAccessWeather && (
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
                                            <a href="/weathermapfarm" className="block w-full h-full">
                                                Map Weather
                                            </a>
                                        </li>
                                        <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                            <a href="/weatherhistory" className="block w-full h-full">
                                                Weather History
                                            </a>
                                        </li>
                                        <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                            <a href="/onemonth" className="block w-full h-full">
                                                HDD & CDD
                                            </a>
                                        </li>
                                        <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                            <a href="/graphpest" className="block w-full h-full">
                                                GDD for Pest
                                            </a>
                                        </li>
                                        <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                            <a href="/plantingdate" className="block w-full h-full">
                                                Planting Date
                                            </a>
                                        </li>
                                        <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                            <a href="/weatherdas" className="block w-full h-full">
                                                Anomaly Alert
                                            </a>
                                        </li>
                                        <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                            <a href="/alertmessage" className="block w-full h-full">
                                                Alert Messaging
                                            </a>
                                        </li>
                                         <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                            <a href="/wateradvisory" className="block w-full h-full">
                                                Water Advisory
                                            </a>
                                        </li>
                                       
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Dashboard Dropdown - TOUS LES USERS */}
                    {canAccessDashboard && (
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
                                          <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                            <a href="/wbiidashboard" className="block w-full h-full">
                                                WBII Dashboard
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* EUDR (DDS) - TOUS LES USERS */}
                    {canAccessEUDR && (
                        <div
                            className="relative"
                            onMouseEnter={() => handleMouseEnter("eudrDropdown")}
                            onMouseLeave={() => handleMouseLeave("eudrDropdown")}
                        >
                            <button
                                className="dropdown-btn text-white bg-transparent border-none py-2 px-4 rounded-full focus:outline-none transition-all duration-300 hover:underline"
                            >
                                DDS
                            </button>
                            {dropdownsVisible.eudrDropdown && (
                                <div className="dropdown absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg">
                                    <ul className="text-gray-700 font-light text-base font-sans" style={{ fontFamily: 'Arial, sans-serif' }}>
                                        <li className="px-4 py-2 hover:bg-teal-100 hover:text-teal-700 cursor-pointer">
                                            <a href="/EUDRSubmission" className="block w-full h-full">
                                                DDS
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </nav>

                {/* User Actions */}
                <div className="flex items-center gap-4">
                    {/* User Type Badge */}
                    {userRole && (
                        <div className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                            {userRole === 'weather' && '🌤️'}
                            {userRole === 'farmer' && '🌾'}
                            {userRole === 'forest' && '🌲'}
                            {isAdmin && '👑'}
                            <span className="capitalize">{isAdmin ? 'Admin' : userRole}</span>
                        </div>
                    )}

                    {/* Admin Links */}
                    {isAdmin && (
                        <>
                            <Link to="/usermanager" className="text-white bg-transparent border-none py-2 px-4 rounded-full focus:outline-none transition-all duration-300 hover:underline">
                                <MdManageAccounts className="inline-block" /> User Manager
                            </Link>
                            <Link to="/featuresManager" className="text-white bg-transparent border-none py-2 px-4 rounded-full focus:outline-none transition-all duration-300 hover:underline">
                                <MdManageAccounts className="inline-block" /> Feature Manager
                            </Link>
                        </>
                    )}

                    {/* Logout Button */}
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