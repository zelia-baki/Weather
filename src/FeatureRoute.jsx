import { Navigate } from "react-router-dom";
import useFeatureAccess from "./hooks/useFeatureAccess";

export default function FeatureRoute({ feature, children }) {
  const { hasAccess, loading } = useFeatureAccess(feature);
  console.log('ato amin featureRoute ', feature);

  if (loading) return <p className="p-4">Loading permissions...</p>;
  if (!hasAccess) return <Navigate to="/payment-required" 
  state={{ featureName: feature, }}
  replace />;

  return children;
}
