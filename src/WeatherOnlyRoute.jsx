import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { FaCloudSun } from 'react-icons/fa';

/**
 * Composant simple pour restreindre l'accès aux pages weather
 * Accessible uniquement par: admin et weather users
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenu à afficher si accès autorisé
 * 
 * @example
 * <WeatherOnlyRoute>
 *   <WeatherMap />
 * </WeatherOnlyRoute>
 */
const WeatherOnlyRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  // Pas de token = rediriger vers login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decodedToken = jwtDecode(token);
    
    // Extraire user_type et is_admin du token
    const userType = decodedToken.sub?.user_type || '';
    const isAdmin = decodedToken.sub?.is_admin || false;

    // Admin a toujours accès
    if (isAdmin) {
      return children;
    }

    // Vérifier si l'utilisateur est de type 'weather'
    if (userType === 'weather') {
      return children;
    }

    // Accès refusé - afficher une page d'erreur
    return <AccessDeniedPage userType={userType} />;

  } catch (error) {
    console.error('Erreur de décodage du token:', error);
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }
};

/**
 * Page d'accès refusé pour les non-weather users
 */
const AccessDeniedPage = ({ userType }) => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-sky-100">
    <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-lg text-center">
      {/* Icon Weather */}
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-100 text-blue-500 mb-4">
          <FaCloudSun className="text-5xl" />
        </div>
      </div>

      {/* Title */}
      <h2 className="text-3xl font-bold text-gray-800 mb-3">
        Fonctionnalité Réservée
      </h2>

      {/* Description */}
      <p className="text-gray-600 mb-6 text-lg">
        Cette fonctionnalité météo est réservée aux utilisateurs de type <strong className="text-blue-600">Weather</strong>.
      </p>

      {/* Info Card */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-gray-500">Type requis:</span>
          <span className="text-sm font-bold text-blue-600 px-3 py-1 bg-blue-50 rounded-full">
            Weather
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500">Votre type:</span>
          <span className="text-sm font-bold text-red-600 px-3 py-1 bg-red-50 rounded-full capitalize">
            {userType || 'Non défini'}
          </span>
        </div>
      </div>

      {/* Alert Box */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 text-left">
        <p className="text-sm text-blue-800">
          <strong>💡 Info:</strong> Contactez votre administrateur pour obtenir un accès aux fonctionnalités météo.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => window.history.back()}
          className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          ← Retour
        </button>
        <button
          onClick={() => window.location.href = '/home'}
          className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          🏠 Accueil
        </button>
      </div>

      {/* Support Link */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <a 
          href="mailto:support@agriyields.com" 
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Contacter le Support
        </a>
      </div>
    </div>
  </div>
);

export default WeatherOnlyRoute;