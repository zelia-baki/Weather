import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaTree, FaQrcode, FaSeedling, FaSun } from 'react-icons/fa';
import { jwtDecode } from 'jwt-decode';  // Correct import
import 'tailwindcss/tailwind.css';

const HomePage = () => {
  const [userRole, setUserRole] = useState(null); // État pour stocker le rôle utilisateur

  useEffect(() => {
    // Désactiver le défilement
    document.body.classList.add('no-scroll');

    // Réactiver le défilement lors du démontage du composant
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, []);

  useEffect(() => {
    // Récupérer et décoder le token JWT
    const token = localStorage.getItem('token'); // Ou là où tu stockes ton token
    if (token) {
      const decodedToken = jwtDecode(token);
      const role = decodedToken.sub?.user_type || ''; // Décoder le type d'utilisateur
      setUserRole(role);
    }
  }, []);

  const Card = ({ title, description, link, buttonText, bgColor, hoverColor, icon, iconColor, isBlurred }) => (
    <div
      className={`p-8 rounded-lg border border-gray-200 shadow-lg transform transition-transform ${bgColor} flex flex-col justify-between ${
        isBlurred ? 'filter blur-md opacity-50' : 'hover:scale-105 hover:shadow-xl'
      }`}
      style={{ pointerEvents: isBlurred ? 'none' : 'auto' }} // Désactiver les événements de pointeur si flou
    >
      <div>
        <div className="flex items-center mb-6">
          <div className={`text-5xl mr-4 ${iconColor}`}>{icon}</div>
          <h2 className="text-3xl font-semibold text-gray-800">{title}</h2>
        </div>
        <p className="text-gray-600 mb-6 text-lg">{description}</p>
      </div>
      {!isBlurred && (
        <Link to={link} className={`bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-6 rounded-lg transition-colors ${hoverColor}`}>
          {buttonText}
        </Link>
      )}
    </div>
  );

  return (
    <div className="bg-gradient-to-r from-teal-50 via-green-50 to-yellow-50 min-h-screen flex justify-center items-center p-6 font-sans">
      <div className="text-center max-w-6xl mx-auto">
        <h1 className="text-6xl font-extrabold mb-8 text-teal-800">Welcome to Agriyields</h1>
        <p className="text-gray-700 text-xl mb-12">Choose an option below to get started:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-12">

          {/* Afficher la carte Forest Management si l'utilisateur est admin ou forestier, sinon flou */}
          <Card
            title="Forest Management"
            description="Manage and monitor your forest areas efficiently."
            link="/forest"
            buttonText="Manage Forest"
            bgColor="bg-green-100"
            hoverColor="bg-green-200 hover:bg-green-300"
            icon={<FaTree />}
            iconColor="text-green-600"
            isBlurred={!(userRole === 'admin' || userRole === 'forest')}
          />

          {/* Afficher la carte Weather pour tout le monde */}
          <Card
            title="Weather"
            description="Monitor and manage weather data efficiently."
            link="/cardex"
            buttonText="View Weather"
            bgColor="bg-blue-100"
            hoverColor="bg-blue-200 hover:bg-blue-300"
            icon={<FaSun />}
            iconColor="text-yellow-600"
            isBlurred={false} // Pas flou
          />

          {/* Afficher la carte Digital Trace ID pour tout le monde */}
          <Card
            title="Digital Trace ID"
            description="Generate secure digital marks and certificates."
            link="/qr"
            buttonText="Generate Codes"
            bgColor="bg-gray-100"
            hoverColor="bg-gray-200 hover:bg-gray-300"
            icon={<FaQrcode />}
            iconColor="text-purple-600"
            isBlurred={false} // Pas flou
          />

          {/* Afficher la carte Farm Management si l'utilisateur est admin ou fermier, sinon flou */}
          <Card
            title="Farm Management"
            description="Track and manage your farm data effectively."
            link="/farmmanager"
            buttonText="Manage Farm"
            bgColor="bg-yellow-100"
            hoverColor="bg-yellow-200 hover:bg-yellow-300"
            icon={<FaSeedling />}
            iconColor="text-green-500"
            isBlurred={!(userRole === 'admin' || userRole === 'farmer')}
          />
          
        </div>
      </div>
    </div>
  );
};

export default HomePage;
