import React, { useState } from "react";

const GeoJsonForm = () => {
  const [coordinates, setCoordinates] = useState([]);
  const [newCoordinate, setNewCoordinate] = useState({ lng: "", lat: "" });
  const [notification, setNotification] = useState(null);

  const handleAddCoordinate = () => {
    const { lng, lat } = newCoordinate;
    if (!lng || !lat) {
      setNotification({ type: "error", message: "Veuillez entrer des coordonnées valides." });
      return;
    }

    const coord = [parseFloat(lng), parseFloat(lat)];
    let updated = [...coordinates];

    // ajouter le point
    updated.push(coord);

    // refermer le polygone si au moins 3 points
    if (updated.length >= 3) {
      const first = updated[0];
      const last = updated[updated.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        updated.push([first[0], first[1]]);
      }
    }

    setCoordinates(updated);
    setNewCoordinate({ lng: "", lat: "" });
    setNotification(null);
  };

  const handleExportGeoJSON = () => {
    if (coordinates.length < 4) {
      setNotification({ type: "error", message: "Ajoutez au moins 3 points pour former un polygone." });
      return;
    }

    const geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [coordinates] },
          properties: {},
        },
      ],
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "polygon.geojson";
    link.click();

    setNotification({ type: "success", message: "Fichier GeoJSON exporté !" });
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white shadow-md rounded-md">
      <h2 className="text-xl font-bold mb-4">Créer un GeoJSON</h2>

      {notification && (
        <div className={`mb-4 p-2 rounded ${notification.type === "success" ? "bg-green-200" : "bg-red-200"}`}>
          {notification.message}
        </div>
      )}

      <div className="mb-2">
        <label>Longitude:</label>
        <input
          type="number"
          value={newCoordinate.lng}
          onChange={(e) => setNewCoordinate({ ...newCoordinate, lng: e.target.value })}
          className="border p-2 w-full rounded"
        />
      </div>

      <div className="mb-2">
        <label>Latitude:</label>
        <input
          type="number"
          value={newCoordinate.lat}
          onChange={(e) => setNewCoordinate({ ...newCoordinate, lat: e.target.value })}
          className="border p-2 w-full rounded"
        />
      </div>

      <button
        onClick={handleAddCoordinate}
        className="bg-blue-600 text-white px-4 py-2 rounded-md w-full mb-2"
      >
        Ajouter un point
      </button>

      <button
        onClick={handleExportGeoJSON}
        className="bg-green-600 text-white px-4 py-2 rounded-md w-full"
      >
        Exporter en GeoJSON
      </button>

      {/* Liste des points ajoutés */}
      <h3 className="mt-4 font-semibold">Points ajoutés :</h3>
      <ul className="list-disc pl-5">
        {coordinates.map((c, i) => (
          <li key={i}>
            {c[0]}, {c[1]}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GeoJsonForm;
