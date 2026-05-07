import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import useFeatureAccess from "./hooks/useFeatureAccess";
import useConsumeOnce from "./hooks/useConsumeOnce";

// ─── Helper : lit le token et retourne les infos utiles ──────────────────────
const getTokenPayload = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const { sub } = jwtDecode(token);
    return sub ?? null;
  } catch {
    return null;
  }
};

// =============================================================================
// FeatureRoute
// – Admin            → accès direct, sans vérification paiement
// – Rôle autorisé    → vérifie le paiement via useFeatureAccess
// – Pas d'accès      → redirige vers /payment-required
// =============================================================================
export default function FeatureRoute({ feature, children }) {
  const payload = getTokenPayload();
  const isAdmin = payload?.is_admin === true;

  // ── Les admins bypasse complètement le système de features ───────────────
  // On appelle le hook inconditionnellement (règle des hooks React),
  // mais on ignore son résultat si l'utilisateur est admin.
  const { hasAccess, loading } = useFeatureAccess(isAdmin ? null : feature);
  useConsumeOnce(!isAdmin && hasAccess ? feature : null);

  // Admin → accès immédiat, pas d'appel API, pas de spinner
  if (isAdmin) return children;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="flex items-center gap-3 text-gray-500">
        <svg className="animate-spin h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <span className="text-sm">Checking access…</span>
      </div>
    </div>
  );

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