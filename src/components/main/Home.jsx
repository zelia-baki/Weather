import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaTree, FaQrcode, FaSeedling, FaSun } from 'react-icons/fa';
import 'tailwindcss/tailwind.css';

const HomePage = () => {
  useEffect(() => {
    // Désactiver le défilement
    document.body.classList.add('no-scroll');

    // Réactiver le défilement lors du démontage du composant
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, []);

  const Card = ({ title, description, link, buttonText, bgColor, hoverColor, icon, iconColor }) => (
    <div className={`p-8 rounded-lg border border-gray-200 shadow-lg transform transition-transform hover:scale-105 hover:shadow-xl ${bgColor} flex flex-col justify-between`}>
      <div>
        <div className="flex items-center mb-6">
          <div className={`text-5xl mr-4 ${iconColor}`}>{icon}</div>
          <h2 className="text-3xl font-semibold text-gray-800">{title}</h2>
        </div>
        <p className="text-gray-600 mb-6 text-lg">{description}</p>
      </div>
      <Link to={link} className={`bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-6 rounded-lg transition-colors ${hoverColor}`}>
        {buttonText}
      </Link>
    </div>
  );

  return (
    <div className="bg-gradient-to-r from-teal-50 via-green-50 to-yellow-50 min-h-screen flex justify-center items-center p-6 font-sans">
      <div className="text-center max-w-6xl mx-auto">
        <h1 className="text-6xl font-extrabold mb-8 text-teal-800">Welcome to Agriyields</h1>
        <p className="text-gray-700 text-xl mb-12">Choose an option below to get started:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-12">
          <Card
            title="Forest Management"
            description="Manage and monitor your forest areas efficiently."
            link="/forest"
            buttonText="Manage Forest"
            bgColor="bg-green-100"
            hoverColor="bg-green-200 hover:bg-green-300"
            icon={<FaTree />}
            iconColor="text-green-600"
          />
          <Card
            title="Weather"
            description="Monitor and manage weather data efficiently."
            link="/card"
            buttonText="View Weather"
            bgColor="bg-blue-100"
            hoverColor="bg-blue-200 hover:bg-blue-300"
            icon={<FaSun />}
            iconColor="text-yellow-600"
          />
          <Card
            title="Digital Trace ID"
            description="Generate secure digital marks and certificates."
            link="/qr"
            buttonText="Generate Codes"
            bgColor="bg-gray-100"
            hoverColor="bg-gray-200 hover:bg-gray-300"
            icon={<FaQrcode />}
            iconColor="text-purple-600"
          />
          <Card
            title="Farm Management"
            description="Track and manage your farm data effectively."
            link="/farm"
            buttonText="Manage Farm"
            bgColor="bg-yellow-100"
            hoverColor="bg-yellow-200 hover:bg-yellow-300"
            icon={<FaSeedling />}
            iconColor="text-green-500"
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
