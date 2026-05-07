import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import axiosInstance from "../axiosInstance";

// ─── Helper : vérifie si le token courant est admin ───────────────────────────
const isCurrentUserAdmin = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;
    const { sub } = jwtDecode(token);
    return sub?.is_admin === true;
  } catch {
    return false;
  }
};

// =============================================================================
// useFeatureAccess
// – Si featureName est null/undefined  → hasAccess: false, loading: false
// – Si l'utilisateur est admin          → hasAccess: true,  loading: false (pas d'appel API)
// – Sinon                               → appel API /api/payments/access/:featureName
// =============================================================================
export default function useFeatureAccess(featureName, guestPhone = null) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    // Pas de feature à vérifier
    if (!featureName) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    // Admin → accès immédiat sans appel API
    if (isCurrentUserAdmin()) {
      setHasAccess(true);
      setLoading(false);
      return;
    }

    // Utilisateur normal → vérification paiement
    const fetchAccess = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = `/api/payments/access/${featureName}`;
        if (guestPhone) url += `?phone_number=${encodeURIComponent(guestPhone)}`;
        const res = await axiosInstance.get(url);
        setHasAccess(res.data?.access === true);
      } catch (err) {
        setHasAccess(false);
        setError(err.response?.data?.error || "Error during access verification.");
      } finally {
        setLoading(false);
      }
    };

    fetchAccess();
  }, [featureName, guestPhone]);

  return { hasAccess, loading, error };
}