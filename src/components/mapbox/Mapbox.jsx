import { useLocation } from "react-router-dom";
import { useState } from "react";
import useMapbox from "../../hooks/useMapbox";
import CoordinateForm from "./CoordinateForm";
import axiosInstance from "../../axiosInstance";

const MapboxExample = () => {
  const location = useLocation();
  const owner_id = location.state?.owner_id;
  const geolocation = location.state?.geolocation;
  const owner_type = location.state?.owner_type;

  let longitude = "32.5825";
  let latitude = "0.3476";
  if (geolocation && geolocation.includes(",")) {
    [longitude, latitude] = geolocation.split(",");
  }

  const [polygonCoordinates, setPolygonCoordinates] = useState([]);
  const [notification, setNotification] = useState(null);

  const { mapContainerRef, mapRef, drawRef } = useMapbox({
    longitude,
    latitude,
    onPolygonChange: setPolygonCoordinates,
    onPlaceSelect: (place) => console.log("Selected place:", place),
  });

  const handleAddCoordinate = (coord) => {
    setPolygonCoordinates((prev) => {
      const updated = prev.length ? [...prev] : [[]];
      updated[0].push(coord);
      return updated;
    });
  };

  const handleValidate = async () => {
    if (polygonCoordinates.length === 0 || polygonCoordinates[0].length < 4) {
      setNotification({ type: "error", message: "Invalid polygon" });
      return;
    }

    try {
      const { data } = await axiosInstance.get(
        `/api/points/exists/${owner_type}/${owner_id}`
      );
      if (data.exists) {
        setNotification({ type: "error", message: "GeoMap already exists" });
        return;
      }

      const points = polygonCoordinates[0].map(([lng, lat]) => ({
        longitude: lng,
        latitude: lat,
      }));

      for (const point of points) {
        await axiosInstance.post("/api/points/create", {
          ...point,
          owner_id,
          owner_type,
        });
      }

      setNotification({ type: "success", message: "Points saved!" });
    } catch (err) {
      setNotification({
        type: "error",
        message: err.response ? err.response.data : err.message,
      });
    }
  };

  return (
    <div className="relative h-full">
      {notification && (
        <div
          className={`absolute top-20 right-2 z-10 px-4 py-2 rounded-md shadow-lg ${
            notification.type === "success"
              ? "bg-green-500"
              : "bg-red-500"
          } text-white`}
        >
          {notification.message}
        </div>
      )}

      <div className="absolute top-10 left-2 z-10">
        <CoordinateForm
          onAdd={handleAddCoordinate}
          onValidate={handleValidate}
        />
      </div>

      <div className="relative h-[600px]">
        <div ref={mapContainerRef} className="absolute inset-0" />
      </div>
    </div>
  );
};

export default MapboxExample;
