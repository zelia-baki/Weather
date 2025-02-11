import React from "react";
import { FaCloudSun, FaChartLine, FaSeedling } from "react-icons/fa";

const WeatherLanding = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-green-200 text-gray-800">
      {/* En-tête */}
      <header className="py-10 text-center">
        <h1 className="text-5xl font-extrabold text-blue-800">
          Weather Dashboard
        </h1>
        <p className="text-lg mt-4 font-medium text-gray-700">
        Accurate weather predictions for better planning.
        </p>
      </header>

      {/* Section de fonctionnalités */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
        {/* Graphique Journalier */}
        <div className="bg-white shadow-lg rounded-lg p-6 hover:scale-105 transform transition duration-300">
          <FaCloudSun className="text-blue-500 text-4xl mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-center">Daily Chart</h2>
          <p className="text-center mt-2 text-gray-600">
          View weather variations throughout the day.
          </p>
        </div>

        {/* Prédictions sur 10 jours */}
        <div className="bg-white shadow-lg rounded-lg p-6 hover:scale-105 transform transition duration-300">
          <FaChartLine className="text-green-500 text-4xl mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-center">10-day predictions</h2>
          <p className="text-center mt-2 text-gray-600">
          Discover the weather trends for the coming days.
          </p>
        </div>

        {/* HDD, CDD, GDD */}
        <div className="bg-white shadow-lg rounded-lg p-6 hover:scale-105 transform transition duration-300">
          <FaSeedling className="text-yellow-500 text-4xl mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-center">HDD, CDD, GDD</h2>
          <p className="text-center mt-2 text-gray-600">
          Analyze climate indices for agriculture and energy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WeatherLanding;
