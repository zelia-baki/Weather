import { useState } from "react";

export const useFileUpload = () => {
  const [files, setFiles] = useState({ eudr: null, carbon: null, geojson: null });

  const handleFileChange = (inputName, e) => {
    const file = e.target.files[0];
    setFiles((prev) => ({ ...prev, [inputName]: file }));
  };

  return { files, handleFileChange };
};
