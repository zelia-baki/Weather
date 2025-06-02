import { useEffect } from "react";
import axiosInstance from "../axiosInstance";

export default function useConsumeOnce(featureName) {
  useEffect(() => {
    if (!featureName) return;

    const key = `used_${featureName}`;
    const lastUsed = sessionStorage.getItem(key);

    const EXPIRATION_MINUTES = 2; // 🕒 modifiable selon besoin

    if (lastUsed) {
      const elapsed = (Date.now() - parseInt(lastUsed, 10)) / (1000 * 60); // minutes
      if (elapsed < EXPIRATION_MINUTES) {
        console.log("⏳ Accès récent, pas besoin de reconsommer.");
        return; // 🚫 trop tôt pour reconsommer
      }
    }

    // ✅ Consommation
    axiosInstance.post(`/api/payments/consume/${featureName}`)
      .then(() => {
        console.log("✅ Usage consommé.");
        sessionStorage.setItem(key, Date.now().toString()); // 🕒 on stocke le moment
      })
      .catch((err) => {
        console.error("❌ Erreur de consommation :", err.response?.data?.error || err.message);
      });

  }, [featureName]);
}
