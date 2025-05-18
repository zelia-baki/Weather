import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';  // Correct import

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decodedToken = jwtDecode(token);
    const currentTime = Date.now() / 1000;

    if (decodedToken.exp < currentTime) {
      localStorage.removeItem('token');
      return <Navigate to="/login" replace />;
    }

    if (adminOnly && decodedToken.sub?.user_type !== "admin") {
      return <Navigate to="/login" replace />;
    }

    return children;
  } catch (error) {
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
