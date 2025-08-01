import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import parrot from '../img/parrot.jpg';


import {
  FaTree,
  FaQrcode,
  FaSeedling,
  FaCloudSunRain,
  FaFeather,
  FaLeaf,
} from 'react-icons/fa';
import { jwtDecode } from 'jwt-decode';
import 'tailwindcss/tailwind.css';

const HomePage = () => {
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode(token);
      const role = decodedToken.sub?.user_type || '';
      setUserRole(role);
    }
  }, []);

  const cardData = [
    {
      Icon: FaTree,
      title: 'Forest Management',
      description: 'Manage and monitor your forest areas efficiently.',
      textColor: 'text-green-700',
      buttonText: 'Manage Forest',
      color: 'bg-teal-500',
      link: '/forestpage',
      isBlurred: !(userRole === 'admin' || userRole === 'forest'),
    },
    {
      Icon: FaCloudSunRain,
      title: 'Weather',
      description: 'Monitor and manage weather data efficiently.',
      textColor: 'text-blue-700',
      color: 'bg-blue-500',
      buttonText: 'View Weather',
      link: '/weathermap',
      isBlurred: false,
    },
    {
      Icon: FaQrcode,
      title: 'Digital Trace ID',
      description: 'Generate secure digital marks and certificates.',
      textColor: 'text-indigo-700',
      color: 'bg-indigo-500',
      buttonText: 'Generate Codes',
      link: '/qr',
      isBlurred: false,
    },
    {
      Icon: FaLeaf,
      title: 'Farm Management',
      description: 'Track and manage your farm data effectively.',
      textColor: 'text-yellow-700',
      color: 'bg-yellow-500',
      buttonText: 'Manage Farm',
      link: '/farmmanager',
      isBlurred: !(userRole === 'admin' || userRole === 'farmer'),
    },
  ];

  return (
    <div className="bg-gradient-to-br from-teal-50 via-green-50 to-yellow-50 min-h-screen font-poppins text-gray-800 relative">
      {/* Plumes de fond */}
      <div className="absolute top-5 left-5 text-yellow-300 opacity-50 animate-pulse">
        <FaFeather size={200} />
      </div>
      <div className="absolute top-10 right-5 text-blue-300 opacity-40 animate-pulse">
        <FaFeather size={150} />
      </div>
      <div className="absolute top-20 left-20 text-white opacity-60 animate-pulse">
        <FaFeather size={180} />
      </div>
      <div className="absolute top-40 left-40 text-white opacity-50 animate-pulse">
        <FaFeather size={140} />
      </div>
      <div className="absolute bottom-20 right-10 text-white opacity-60 animate-pulse">
        <FaFeather size={150} />
      </div>

      {/* Header */}
      <header className="bg-gradient-to-r from-teal-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between shadow-lg sticky top-0 z-50 backdrop-blur-md bg-opacity-90 w-full">
        <h1 className="text-4xl font-extrabold flex items-center gap-3 group">
          <span className="bg-white p-2 rounded-full shadow-md group-hover:rotate-12 group-hover:scale-110 transform transition-all duration-300">
            <img
              src={parrot}
              alt="Nkusu Logo"
              className="w-16 h-16 rounded-full object-cover"
            />
          </span>
          <span className="group-hover:text-teal-300 transition-all duration-300">
            Nkusu
          </span>
        </h1>

        {/* Navigation */}
        <nav className="hidden md:flex space-x-8 text-lg font-medium animate-fade-in">
          {[
            { label: 'Features', href: '#features' },
            { label: 'Contact', href: '#contact' },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="relative text-white after:absolute after:w-0 after:h-[2px] after:bg-teal-300 after:bottom-0 after:left-1/2 after:transform after:-translate-x-1/2 hover:after:w-full hover:after:left-0 transition-all duration-300"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Get Started Button */}
        <a
          href="/login"
          className="hidden md:inline-block bg-teal-600 hover:bg-teal-500 text-white font-semibold px-6 py-2 rounded-full shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
        >
          Get Started
        </a>
      </header>

      {/* Hero Section */}
      <div className="text-center max-w-6xl mx-auto mt-10">
        <h2 className="text-5xl font-bold text-teal-700 mb-10 animate-fade-in-up-zoom">
          Welcome to the Agriyields
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8 animate-fade-in-color">
          Choose an option below to get started:
        </p>
      </div>

      {/* Features Section */}
      <div id="features" className="pt-24">
        <h2 className="text-4xl font-bold text-teal-700 text-center mb-10">
          Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto px-6">
          {cardData.map(
            (
              { Icon, title, description, textColor, buttonText, color, link, isBlurred },
              index
            ) => (
              <div
                key={index}
                className={`flex flex-col items-center p-6 rounded-lg shadow-lg transition-shadow duration-300 bg-white ${
                  isBlurred ? 'opacity-50 pointer-events-none' : 'hover:shadow-xl'
                }`}
              >
                <div className="flex items-center mb-4">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 mr-4">
                    <Icon className={`text-3xl ${textColor}`} />
                  </div>
                  <h3 className={`text-xl font-semibold ${textColor}`}>{title}</h3>
                </div>
                <p className="text-gray-700 text-center mb-4">{description}</p>
                <a
                  href={link}
                  className={`mt-auto px-4 py-2 text-sm font-semibold text-white rounded ${
                    isBlurred ? 'bg-gray-400' : color
                  } ${textColor}`}
                >
                  {buttonText}
                </a>
              </div>
            )
          )}
        </div>
      </div>


            {/* Contact Section */}
      <div id="contact" className="py-20 bg-gradient-to-tl from-teal-200 to-white mt-20">
        <h3 className="text-4xl font-bold text-center text-teal-700 mb-10">
          Contact Us
        </h3>
        <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto mb-12">
          Have a question or want to get in touch? We'd love to hear from you.
        </p>
        <div className="flex justify-center gap-8">
          <a
            href="mailto:nkusu@agriyields.com"
            className="bg-teal-500 text-white px-10 py-3 rounded-full font-medium flex items-center gap-2 shadow-lg hover:bg-teal-700 transition-transform transform hover:scale-105"
          >
            <FaFeather /> Email Us
          </a>
          <a
            href="/signup"
            className="bg-white text-teal-600 border border-teal-500 px-10 py-3 rounded-full font-medium flex items-center gap-2 shadow-lg hover:bg-teal-500 hover:text-white transition-transform transform hover:scale-105"
          >
            <FaSeedling /> Sign Up
          </a>
        </div>
      </div>

    </div>
  );
};

export default HomePage;
