import { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";

export default function useFeatureAccess(featureName, guestPhone = null) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  console.log('ato amin use feature access hook ', featureName);

  useEffect(() => {
    const fetchAccess = async () => {
      try {
        let url = `/api/payments/access/${featureName}`;
        if (guestPhone) url += `?phone_number=${encodeURIComponent(guestPhone)}`;

        const res = await axiosInstance.get(url);
        setHasAccess(res.data.access);
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
