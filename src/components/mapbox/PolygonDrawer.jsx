import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import * as turf from "@turf/turf";

import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

const PolygonDrawer = ({
  initialCenter = [32.5825, 0.3476],
  zoom = 8,
  onChange,
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const drawRef = useRef(null);

  const [polygonGeoJSON, setPolygonGeoJSON] = useState(null);
  const [area, setArea] = useState(null);
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q";

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/satellite-v9",
      center: initialCenter,
      zoom,
    });
    mapRef.current = map;

    // Controls
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
    });
    map.addControl(draw);
    drawRef.current = draw;

    // ➕ Fonction pour gérer la recherche de coordonnées brutes
    function coordinatesGeocoder(query) {
      // Supprimer espaces superflus
      const match = query.trim().match(
        /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/
      );
      if (!match) return null;

      const lng = parseFloat(match[1]);
      const lat = parseFloat(match[3]);

      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null;

      return [
        {
          center: [lng, lat],
          geometry: { type: "Point", coordinates: [lng, lat] },
          place_name: `Coordinates [${lat}, ${lng}]`,
          place_type: ["coordinate"],
          properties: {},
          type: "Feature",
        },
      ];
    }

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl,
      placeholder: "Search location or coordinates",
      localGeocoder: coordinatesGeocoder, // 👈 ajout pour gérer les coords
      reverseGeocode: true,
    });

    map.addControl(geocoder);

    const updatePolygon = () => {
      const data = draw.getAll();
      if (data.features.length > 0) {
        const poly = data.features[0];
        const polyArea = turf.area(poly);

        setArea(Math.round(polyArea));
        setPolygonGeoJSON(poly);

        if (onChange) onChange(poly);
      } else {
        setArea(null);
        setPolygonGeoJSON(null);
        if (onChange) onChange(null);
      }
    };

    map.on("draw.create", updatePolygon);
    map.on("draw.update", updatePolygon);
    map.on("draw.delete", updatePolygon);

    return () => map.remove();
  }, []);

  // ➕ Ajouter une propriété dynamique
  const addProperty = () => {
    setProperties([...properties, { name: "", value: "" }]);
  };

  // 🔄 Modifier une propriété
  const updateProperty = (index, key, val) => {
    const updated = [...properties];
    updated[index][key] = val;
    setProperties(updated);
    syncProperties(updated);
  };

  // ❌ Supprimer une propriété
  const removeProperty = (index) => {
    const updated = properties.filter((_, i) => i !== index);
    setProperties(updated);
    syncProperties(updated);
  };

  // 🔗 Met à jour polygonGeoJSON avec les props
  const syncProperties = (updatedProps) => {
    if (polygonGeoJSON) {
      const newPolygon = {
        ...polygonGeoJSON,
        properties: Object.fromEntries(
          updatedProps.map((p) => [p.name || "undefined", p.value])
        ),
      };
      setPolygonGeoJSON(newPolygon);
      if (onChange) onChange(newPolygon);
    }
  };

  return (
    <div className="relative h-[500px] w-full flex">
      {/* 🗺️ Map */}
      <div
        ref={mapContainerRef}
        className="flex-1 rounded-xl shadow-md relative"
      />

      {/* 📋 Panneau propriétés */}
      <div className="w-80 bg-white border-l p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-2">Polygon Properties</h2>

        {properties.map((prop, i) => (
          <div key={i} className="mb-3 border-b pb-2">
            <input
              type="text"
              placeholder="Name"
              value={prop.name}
              onChange={(e) => updateProperty(i, "name", e.target.value)}
              className="border p-1 rounded w-full mb-1"
            />
            <input
              type="text"
              placeholder="Value"
              value={prop.value}
              onChange={(e) => updateProperty(i, "value", e.target.value)}
              className="border p-1 rounded w-full mb-1"
            />
            <button
              onClick={() => removeProperty(i)}
              className="text-red-600 text-sm hover:underline"
            >
              ❌ Remove
            </button>
          </div>
        ))}

        <button
          onClick={addProperty}
          className="w-full bg-blue-600 text-white py-1 rounded hover:bg-blue-700"
        >
          ➕ Add property
        </button>

        {area && (
          <div className="mt-4 text-sm text-gray-700">
            <strong>Area:</strong> {area} m²
          </div>
        )}
      </div>
    </div>
  );
};

export default PolygonDrawer;
