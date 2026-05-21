import React, { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axiosInstance from './axiosInstance';

// Refresh si le token a plus de TOKEN_MAX_AGE_MINUTES minutes
const TOKEN_MAX_AGE_MINUTES = 5;

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const token = localStorage.getItem('token');
  const refreshing = useRef(false);

  useEffect(() => {
    if (!token || refreshing.current) return;

    try {
      const decoded = jwtDecode(token);
      const ageMinutes = (Date.now() / 1000 - decoded.iat) / 60;

      if (ageMinutes > TOKEN_MAX_AGE_MINUTES) {
        refreshing.current = true;
        axiosInstance
          .post('/api/token/refresh')
          .then(({ data }) => {
            if (data.token) {
              localStorage.setItem('token', data.token);
            }
          })
          .catch(() => {
            // Echec silencieux — le token existant reste valide
          })
          .finally(() => {
            refreshing.current = false;
          });
      }
    } catch {
      // Token malformé → la vérification sync ci-dessous gère la redirection
    }
  }, [token]);

  // ── Vérification synchrone (redirection immédiate si nécessaire) ──────────
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;

    if (decoded.exp < currentTime) {
      localStorage.removeItem('token');
      return <Navigate to="/login" replace />;
    }

    if (adminOnly && !decoded.sub?.is_admin) {
      return <Navigate to="/home" replace />;
    }

    return children;
  } catch {
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;