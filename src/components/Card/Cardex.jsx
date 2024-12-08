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
          Prédictions météorologiques précises pour une meilleure planification.
        </p>
      </header>

      {/* Section de fonctionnalités */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
        {/* Graphique Journalier */}
        <div className="bg-white shadow-lg rounded-lg p-6 hover:scale-105 transform transition duration-300">
          <FaCloudSun className="text-blue-500 text-4xl mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-center">Graphique Journalier</h2>
          <p className="text-center mt-2 text-gray-600">
            Visualisez les variations météorologiques au cours de la journée.
          </p>
        </div>

        {/* Prédictions sur 10 jours */}
        <div className="bg-white shadow-lg rounded-lg p-6 hover:scale-105 transform transition duration-300">
          <FaChartLine className="text-green-500 text-4xl mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-center">Prédictions sur 10 jours</h2>
          <p className="text-center mt-2 text-gray-600">
            Découvrez les tendances météo pour les jours à venir.
          </p>
        </div>

        {/* HDD, CDD, GDD */}
        <div className="bg-white shadow-lg rounded-lg p-6 hover:scale-105 transform transition duration-300">
          <FaSeedling className="text-yellow-500 text-4xl mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-center">HDD, CDD, GDD</h2>
          <p className="text-center mt-2 text-gray-600">
            Analysez les indices climatiques pour l'agriculture et l'énergie.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WeatherLanding;
