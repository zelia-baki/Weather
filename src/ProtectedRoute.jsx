import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';  // Correct import

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  // If token is not available, redirect to login page
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    // Decode the token to check its validity
    const decodedToken = jwtDecode(token);

    // Optionally, you could add logic to check if the token is expired
    const currentTime = Date.now() / 1000;
    if (decodedToken.exp < currentTime) {
      localStorage.removeItem('token');
      return <Navigate to="/login" replace />;
    }

    return children;
  } catch (error) {
    // If token is invalid or any error occurs, remove token and redirect to login
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
