import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import useFeatureAccess from "./hooks/useFeatureAccess";
import useConsumeOnce from "./hooks/useConsumeOnce"; // 👈

export default function FeatureRoute({ feature, children }) {
  const { hasAccess, loading } = useFeatureAccess(feature);

  useConsumeOnce(hasAccess ? feature : null); // 👈 seulement si accès OK

  if (loading) return <p className="p-4">Chargement des autorisations...</p>;
  if (!hasAccess) {
    return (
      <Navigate
        to="/payment-required"
        state={{ featureName: feature }}
        replace
      />
    );
  }

  return children;
}
