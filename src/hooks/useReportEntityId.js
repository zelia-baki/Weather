import { useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

// Les pages de rapport reçoivent l'id (farmId / forestId) via location.state,
// perdu au rechargement : la page retombait alors sur l'id par défaut (rapport
// d'une autre ferme/forêt). On recopie l'id dans l'URL (?farmId=…) pour qu'un
// rechargement ou un lien partagé ouvre le même rapport.
export default function useReportEntityId(name, fallback) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const fromState = location.state?.[name];
  const id = fromState ?? searchParams.get(name) ?? fallback;

  useEffect(() => {
    if (fromState != null && searchParams.get(name) !== String(fromState)) {
      const params = new URLSearchParams(searchParams);
      params.set(name, fromState);
      navigate({ search: params.toString() }, { replace: true, state: location.state });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromState]);

  return id;
}
