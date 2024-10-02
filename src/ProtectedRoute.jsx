import React from 'react';
import { Navigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode'; // Correct import

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const token = localStorage.getItem('token');

  // If no token exists, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decodedToken = jwtDecode(token); // Decode the token
    const currentTime = Date.now() / 1000; // Current time in seconds

    // Check if the token has expired
    if (decodedToken.exp < currentTime) {
      localStorage.removeItem('token'); // Clear invalid token
      return <Navigate to="/login" replace />;
    }

    // If the route is admin only, check if the user is an admin
    if (adminOnly && !decodedToken.is_admin) {
      return <Navigate to="/unauthorized" replace />;
    }

    // If everything is valid, render the protected component
    return children;
  } catch (error) {
    // Handle any errors with decoding the token (e.g., token is corrupted)
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
