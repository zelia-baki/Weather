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
  
  // 🆕 États pour la construction point par point
  const [isPointMode, setIsPointMode] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [currentMarker, setCurrentMarker] = useState(null);
  const [polygonMarkers, setPolygonMarkers] = useState([]);
  
  // ✅ NOUVEAU: Référence pour stocker l'état de `isPointMode`
  const isPointModeRef = useRef(isPointMode);

  // ✅ NOUVEAU: Mettre à jour la référence à chaque fois que `isPointMode` change
  useEffect(() => {
    isPointModeRef.current = isPointMode;
  }, [isPointMode]);


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

    // Fonction pour gérer la recherche de coordonnées
    const coordinatesGeocoder = (query) => {
      const matches = query.match(
        /^[ ]*(?:Lat: )?(-?\d+\.?\d*)[, ]+(?:Lng: )?(-?\d+\.?\d*)[ ]*$/i
      );
      if (!matches) {
        return null;
      }
      
      const coord1 = Number(matches[1]);
      const coord2 = Number(matches[2]);
      
      if (coord1 < -90 || coord1 > 90 || coord2 < -180 || coord2 > 180) {
        return null;
      }
      
      return [
        {
          center: [coord2, coord1],
          geometry: {
            type: 'Point',
            coordinates: [coord2, coord1],
          },
          place_name: `Lat: ${coord1}, Lng: ${coord2}`,
          place_type: ['coordinate'],
          properties: {},
          type: 'Feature',
        },
      ];
    };

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl,
      placeholder: 'Search for places or coordinates (Lat: -12.34, Lng: 56.78)',
      localGeocoder: coordinatesGeocoder,
      reverseGeocode: true,
    });

    map.addControl(geocoder);

    // 🆕 Gestion des résultats de recherche
    geocoder.on('result', (e) => {
      const { geometry, place_name } = e.result;
      const [lng, lat] = geometry.coordinates;
      
      // Supprimer le marqueur précédent s'il existe
      if (currentMarker) {
        currentMarker.remove();
      }
      
      // Créer un nouveau marqueur avec popup cliquable
      const marker = new mapboxgl.Marker({ color: '#ff6b6b' })
        .setLngLat([lng, lat])
        .addTo(map);
      
      const popup = new mapboxgl.Popup({ 
        offset: 25,
        maxWidth: '250px'
      }).setHTML(`
          <div style="text-align: center; padding: 5px; font-size: 12px;">
            <p style="margin: 0; color: #666;">
              ${lng.toFixed(4)}, ${lat.toFixed(4)}
            </p>
            ${isPointModeRef.current ? // ✅ Utilisation de la référence ici
              `<button onclick="window.addPolygonPoint(${lng}, ${lat})" 
                       style="background: #4CAF50; color: white; border: none; 
                              padding: 6px 12px; border-radius: 4px; cursor: pointer; 
                              margin-top: 8px; font-size: 11px; font-weight: bold;">
                ➕ Add Point
               </button>` : ''
            }
          </div>
        `);
      
      marker.setPopup(popup);
      popup.addTo(map);
      setCurrentMarker(marker);
    });

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

    return () => {
      // Nettoyage
      polygonMarkers.forEach(marker => marker.remove());
      if (currentMarker) currentMarker.remove();
      map.remove();
    };
  }, []); // <-- Les dépendances sont correctes ici

  // 🆕 Fonction pour ajouter un point au polygone (accessible globalement)
  useEffect(() => {
    window.addPolygonPoint = (lng, lat) => {
      const newPoints = [...polygonPoints, [lng, lat]];
      setPolygonPoints(newPoints);
      
      // Créer un marqueur permanent pour ce point
      const marker = new mapboxgl.Marker({ color: '#4CAF50', scale: 0.8 })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);
      
      setPolygonMarkers(prev => [...prev, marker]);
      
      // Supprimer le marqueur temporaire de recherche
      if (currentMarker) {
        currentMarker.remove();
        setCurrentMarker(null);
      }
      
      // Si on a au moins 3 points, créer le polygone
      if (newPoints.length >= 3) {
        // Fermer le polygone en ajoutant le premier point à la fin
        const closedCoords = [...newPoints, newPoints[0]];
        
        const polygonFeature = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [closedCoords]
          }
        };
        
        // Supprimer l'ancien polygone et créer le nouveau
        drawRef.current.deleteAll();
        drawRef.current.add(polygonFeature);
        
        const polyArea = turf.area(polygonFeature);
        setArea(Math.round(polyArea));
        setPolygonGeoJSON(polygonFeature);
        
        if (onChange) onChange(polygonFeature);
      }
    };

    return () => {
      delete window.addPolygonPoint;
    };
  }, [polygonPoints, currentMarker, onChange]);

  // 🆕 Activer/désactiver le mode point par point
  const togglePointMode = () => {
    setIsPointMode(!isPointMode);
    if (isPointMode) {
      // Réinitialiser si on désactive le mode
      resetPolygonConstruction();
    }
  };

  // 🆕 Réinitialiser la construction point par point
  const resetPolygonConstruction = () => {
    setPolygonPoints([]);
    polygonMarkers.forEach(marker => marker.remove());
    setPolygonMarkers([]);
    if (currentMarker) {
      currentMarker.remove();
      setCurrentMarker(null);
    }
    drawRef.current.deleteAll();
    setArea(null);
    setPolygonGeoJSON(null);
    if (onChange) onChange(null);
  };

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

      {/* 📋 Panneau de contrôle */}
      <div className="w-80 bg-white border-l p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-3">Polygon Creator</h2>
        
        {/* 🆕 Mode de construction */}
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Construction Mode:</span>
            <button
              onClick={togglePointMode}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                isPointMode 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              {isPointMode ? '🎯 Point Mode' : '✏️ Draw Mode'}
            </button>
          </div>
          
          {isPointMode && (
            <div className="text-xs text-gray-600 space-y-1">
              <p>• Search for coordinates</p>
              <p>• Click "Add Point" on markers</p>
              <p>• Need 3+ points to create polygon</p>
              <p className="text-green-600 font-medium">
                Points added: {polygonPoints.length}
              </p>
            </div>
          )}
          
          {isPointMode && polygonPoints.length > 0 && (
            <button
              onClick={resetPolygonConstruction}
              className="w-full mt-2 bg-red-500 text-white py-1 px-2 rounded text-sm hover:bg-red-600"
            >
              🗑️ Reset Points
            </button>
          )}
        </div>

        {/* Instructions */}
        <div className="mb-4 p-2 bg-blue-50 rounded text-sm text-blue-800">
          <strong>Search tips:</strong><br/>
          • Place names: "Paris", "New York"<br/>
          • Coordinates: "Lat: -12.34, Lng: 56.78"<br/>
          • Or simply: "-12.34, 56.78"
        </div>

        {/* Points du polygone en cours */}
        {isPointMode && polygonPoints.length > 0 && (
          <div className="mb-4 p-3 bg-green-50 rounded">
            <h3 className="text-sm font-semibold mb-2">Polygon Points:</h3>
            <div className="max-h-32 overflow-y-auto">
              {polygonPoints.map((point, index) => (
                <div key={index} className="text-xs text-gray-600 mb-1">
                  {index + 1}. Lng: {point[0].toFixed(4)}, Lat: {point[1].toFixed(4)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Propriétés du polygone */}
        <div className="border-t pt-3">
          <h3 className="text-sm font-semibold mb-2">Properties:</h3>
          
          {properties.map((prop, i) => (
            <div key={i} className="mb-3 border-b pb-2">
              <input
                type="text"
                placeholder="Property Name"
                value={prop.name}
                onChange={(e) => updateProperty(i, "name", e.target.value)}
                className="border p-2 rounded w-full mb-1 text-sm"
              />
              <input
                type="text"
                placeholder="Property Value"
                value={prop.value}
                onChange={(e) => updateProperty(i, "value", e.target.value)}
                className="border p-2 rounded w-full mb-1 text-sm"
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
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mb-4"
          >
            ➕ Add property
          </button>
        </div>

        {/* Informations sur l'aire */}
        {area && (
          <div className="mt-4 p-3 bg-green-50 rounded">
            <div className="text-sm text-gray-700">
              <strong>Area:</strong> {area.toLocaleString()} m²
            </div>
            <div className="text-xs text-gray-500 mt-1">
              ({(area / 10000).toFixed(2)} hectares)
            </div>
          </div>
        )}

        {polygonGeoJSON && (
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-700 mb-2">
              <strong>Polygon completed!</strong>
            </div>
            <div className="text-xs text-gray-500">
              Vertices: {polygonGeoJSON.geometry.coordinates[0].length - 1} points
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PolygonDrawer;