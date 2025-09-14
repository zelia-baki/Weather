import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import axiosInstance from '../../axiosInstance';
import * as turf from '@turf/turf';
import 'mapbox-gl/dist/mapbox-gl.css';

const MapboxExample = ({ ownerType = null, showControls = true, height = "100%", styleType = "dark" }) => {
  const mapContainerRef = useRef();
  const mapRef = useRef();
  const location = useLocation();
  const popupRef = useRef(new mapboxgl.Popup({ closeButton: false, closeOnClick: false }));
  
  const owner_type = ownerType || location.state?.owner_type || "farmer";
  
  const [notification, setNotification] = useState(null);
  const [mapProps, setMapProps] = useState({
    center: [-32.5825, 0.3476],
    zoom: 5,
  });
  const [polygons, setPolygons] = useState([]);
  const [totalArea, setTotalArea] = useState(0);
  const [polygonCount, setPolygonCount] = useState(0);

  // Différents styles de map
  const getMapStyle = () => {
    switch(styleType) {
      case 'dark':
        return 'mapbox://styles/mapbox/dark-v11';
      case 'satellite':
        return 'mapbox://styles/mapbox/satellite-v9';
      case 'light':
        return 'mapbox://styles/mapbox/light-v11';
      default:
        return 'mapbox://styles/mapbox/dark-v11';
    }
  };

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q';

    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: getMapStyle(),
        center: mapProps.center,
        zoom: mapProps.zoom,
      });

      mapRef.current.on('move', () => {
        const center = mapRef.current.getCenter();
        const zoom = mapRef.current.getZoom();
        setMapProps({
          center: [center.lng, center.lat],
          zoom: zoom.toFixed(2),
        });
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [styleType]);

  useEffect(() => {
    const fetchPolygons = async () => {
      try {
        const response = await axiosInstance.get(`/api/points/getallbyownertype/${owner_type}`);
        const data = response.data;

        if (!data.polygons || data.polygons.length === 0) {
          if (showControls) {
            setNotification({
              type: "info",
              message: "No polygons found.",
            });
          }
          return;
        }

        setNotification(null);
        setPolygons(data.polygons);
        setPolygonCount(data.polygons.length);

      } catch (error) {
        console.error('Error fetching polygons:', error);
        if (showControls) {
          setNotification({
            type: "error",
            message: "Error loading polygons.",
          });
        }
      }
    };

    fetchPolygons();
  }, [owner_type, showControls]);

  // Fonction pour créer un hexagone
  const createHexagon = (center, radius) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60) * Math.PI / 180;
      const x = center[0] + radius * Math.cos(angle);
      const y = center[1] + radius * Math.sin(angle);
      points.push([x, y]);
    }
    points.push(points[0]); // Fermer le polygone
    return points;
  };

  // Couleurs pour le style sombre
  const getGlowColor = (index) => {
    const colors = [
        'rgba(99,102,241,0.7)',
        'rgba(168,85,247,0.7)',
        'rgba(248,113,113,0.7)',
        'rgba(251,191,36,0.7)',

    ];
    return colors[index % colors.length];
  };

  useEffect(() => {
    const addPolygonLayers = () => {
      if (!mapRef.current || polygons.length === 0) return;

      const features = polygons.map((polygon, index) => {
        const coordinates = polygon.points.map(point => [point.longitude, point.latitude]);
        
        // Calculer le centroïde du polygone original
        const originalPolygon = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [coordinates]
          }
        };
        
        const centroid = turf.centroid(originalPolygon);
        const area = turf.area(originalPolygon);
        
        // Créer un hexagone autour du centroïde
        // La taille de l'hexagone dépend de la superficie du polygone
        const radius = Math.sqrt(area) * 0.00001; // Ajustez ce facteur selon vos besoins
        const hexagonCoords = createHexagon(centroid.geometry.coordinates, Math.max(radius, 0.001));
        
        // Ajouter un marqueur lumineux au centre
        const markerEl = document.createElement('div');
        markerEl.className = 'hexagon-marker';
        markerEl.style.cssText = `
          width: 12px;
          height: 12px;
          background-color: ${getGlowColor(index)};
          border-radius: 50%;
          box-shadow: 0 0 20px ${getGlowColor(index)}, 0 0 40px ${getGlowColor(index)};
          animation: pulse 2s infinite;
        `;
        
        new mapboxgl.Marker(markerEl)
          .setLngLat(centroid.geometry.coordinates)
          .addTo(mapRef.current);

        return {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [hexagonCoords],
          },
          properties: {
            id: index,
            owner_type: polygon.owner_type,
            owner_id: polygon.owner_id,
            area: Math.round(area * 100) / 100,
            color: getGlowColor(index),
            originalCoords: coordinates
          },
        };
      });

      const total = features.reduce((sum, feature) => sum + feature.properties.area, 0);
      setTotalArea(total);

      const geojson = {
        type: 'FeatureCollection',
        features,
      };

      // Supprimer les anciennes sources et couches si elles existent
      if (mapRef.current.getSource('hexagonPolygons')) {
        mapRef.current.removeLayer('hexagon-fill');
        mapRef.current.removeLayer('hexagon-outline');
        mapRef.current.removeLayer('hexagon-glow');
        mapRef.current.removeSource('hexagonPolygons');
      }

      mapRef.current.addSource('hexagonPolygons', {
        type: 'geojson',
        data: geojson,
      });

      // Couche de lueur externe
      mapRef.current.addLayer({
        id: 'hexagon-glow',
        type: 'fill',
        source: 'hexagonPolygons',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.1,
        },
      });

      // Couche de remplissage principal
      mapRef.current.addLayer({
        id: 'hexagon-fill',
        type: 'fill',
        source: 'hexagonPolygons',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.3,
        },
      });

      // Contour lumineux
      mapRef.current.addLayer({
        id: 'hexagon-outline',
        type: 'line',
        source: 'hexagonPolygons',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2,
          'line-opacity': 0.8,
        },
      });

      // Gestion des clics
      mapRef.current.on('click', 'hexagon-fill', (e) => {
        const { properties } = e.features[0];

        const popupContent = showControls 
          ? `<div style="background: #1a1a1a; color: white; padding: 15px; border-radius: 8px; border: 1px solid ${properties.color};">
               <h3 style="color: ${properties.color}; margin: 0 0 10px 0;">Owner Type: ${properties.owner_type}</h3>
               <p style="margin: 5px 0; color: #ccc;
               ">Owner ID: ${properties.owner_id}</p>
               <p style="margin: 5px 0; color: #ccc;">Feature ID: ${properties.id}</p>
               <p style="margin: 5px 0; color: #ccc;">Area: ${properties.area} m²</p>
               <button class="delete-btn" data-owner-id="${properties.owner_id}" 
                       style="margin-top: 10px; padding: 8px 16px; background: linear-gradient(45deg, #ff0040, #ff4081); 
                              color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                 Delete Polygon
               </button>
             </div>`
          : `<div style="background: #1a1a1a; color: white; padding: 15px; border-radius: 8px; border: 1px solid ${properties.color};">
               <h3 style="color: ${properties.color}; margin: 0 0 10px 0;">Owner Type: ${properties.owner_type}</h3>
               <p style="margin: 5px 0; color: #ccc;">Owner ID: ${properties.owner_id}</p>
               <p style="margin: 5px 0; color: #ccc;">Area: ${properties.area} m²</p>
             </div>`;

        new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true,
          className: 'dark-popup'
        })
          .setLngLat(e.lngLat)
          .setHTML(popupContent)
          .addTo(mapRef.current);
      });

      mapRef.current.on('mouseenter', 'hexagon-fill', () => {
        mapRef.current.getCanvas().style.cursor = 'pointer';
      });

      mapRef.current.on('mouseleave', 'hexagon-fill', () => {
        mapRef.current.getCanvas().style.cursor = '';
      });

      // Ajuster la vue pour inclure tous les hexagones
      const bounds = new mapboxgl.LngLatBounds();
      features.forEach(feature => {
        feature.geometry.coordinates[0].forEach(coord => bounds.extend(coord));
      });
      mapRef.current.fitBounds(bounds, { padding: 50 });
    };

    if (mapRef.current && polygons.length > 0) {
      if (mapRef.current.isStyleLoaded()) {
        addPolygonLayers();
      } else {
        mapRef.current.on('load', addPolygonLayers);
      }
    }
  }, [polygons, showControls]);

  // Event listener pour le bouton Delete
  useEffect(() => {
    if (!showControls) return;

    const handleDeleteClick = async (event) => {
      if (event.target.classList.contains("delete-btn")) {
        const ownerId = event.target.getAttribute("data-owner-id");

        const isConfirmed = window.confirm(`Are you sure you want to delete the polygon with owner ID: ${ownerId}?`);
        if (!isConfirmed) return;

        try {
          const response = await axiosInstance.delete(`/api/points/owner/${ownerId}`);
          if (response.status === 204) {
            setNotification({
              type: "info",
              message: `Polygon with owner ID: ${ownerId} deleted successfully.`,
            });

            const updatedPolygonsResponse = await axiosInstance.get(`/api/points/getallbyownertype/${owner_type}`);
            const updatedData = updatedPolygonsResponse.data;

            setPolygons(updatedData.polygons);
            setPolygonCount(updatedData.polygons.length);
          } else {
            setNotification({
              type: "error",
              message: `Failed to delete polygon with owner ID: ${ownerId}.`,
            });
          }
        } catch (error) {
          console.error("Error deleting polygon:", error);
          setNotification({
            type: "error",
            message: `Error deleting polygon with owner ID: ${ownerId}.`,
          });
        }
      }
    };

    mapContainerRef.current?.addEventListener("click", handleDeleteClick);

    return () => {
      mapContainerRef.current?.removeEventListener("click", handleDeleteClick);
    };
  }, [polygons, owner_type, showControls]);

  return (
    <div className="relative" style={{ height }}>
      <style jsx>{`
        .mapboxgl-popup-content {
          background: transparent !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
        
        .mapboxgl-popup-tip {
          display: none !important;
        }
      `}</style>
      
      {notification && showControls && (
        <div
          className={`absolute top-4 right-2 z-10 px-4 py-2 rounded-md shadow-lg transition-shadow duration-300 focus:outline-none ${
            notification.type === "info"
              ? "bg-cyan-500 text-black"
              : "bg-red-500 text-white"
          }`}
          style={{
            boxShadow: notification.type === "info" 
              ? "0 0 20px rgba(0, 255, 209, 0.5)" 
              : "0 0 20px rgba(255, 0, 0, 0.5)"
          }}
        >
          {notification.message}
        </div>
      )}
      
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      
      {showControls && (
        <div 
          className="absolute bottom-4 left-4 rounded-lg p-4 shadow-lg"
          style={{
            background: 'rgba(26, 26, 26, 0.9)',
            border: '1px solid #00FFD1',
            boxShadow: '0 0 20px rgba(0, 255, 209, 0.3)'
          }}
        >
          <div className="text-sm text-white">
            <p><strong style={{color: '#00FFD1'}}>Polygons:</strong> {polygonCount}</p>
            <p><strong style={{color: '#00FFD1'}}>Total Area:</strong> {totalArea.toFixed(2)} m²</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapboxExample;