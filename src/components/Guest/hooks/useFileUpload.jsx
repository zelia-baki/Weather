import { useState } from "react";

// Le GeoJSON importé est aussi gardé en localStorage : le paiement par carte
// quitte la page (DPO dans le même onglet) et le rapport doit pouvoir être
// généré au retour sans réimporter le fichier.
const STORE_KEY = "guest_uploaded_files";
const MAX_STORED_CHARS = 2_000_000;

const restoreFiles = () => {
  const files = { eudr: null, carbon: null, geojson: null };
  try {
    const stored = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    Object.entries(stored).forEach(([key, f]) => {
      if (f?.text && key in files) {
        files[key] = new File([f.text], f.name || "upload.geojson", { type: "application/json" });
      }
    });
  } catch {
    // stockage illisible : on repart sans fichier
  }
  return files;
};

const storeFile = async (inputName, file) => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    if (!file) {
      delete stored[inputName];
    } else {
      const text = await file.text();
      if (text.length > MAX_STORED_CHARS) return; // trop gros pour localStorage
      stored[inputName] = { name: file.name, text };
    }
    localStorage.setItem(STORE_KEY, JSON.stringify(stored));
  } catch {
    // stockage plein / indisponible : le fichier reste en mémoire seulement
  }
};

export const useFileUpload = () => {
  const [files, setFiles] = useState(restoreFiles);

  const handleFileChange = (inputName, e) => {
    const file = e.target.files[0];
    setFiles((prev) => ({ ...prev, [inputName]: file }));
    storeFile(inputName, file);
  };

  const clearFiles = () => {
    setFiles({ eudr: null, carbon: null, geojson: null });
    try { localStorage.removeItem(STORE_KEY); } catch { /* stockage indisponible */ }
  };

  return { files, handleFileChange, clearFiles };
};
