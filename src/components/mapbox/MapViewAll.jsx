import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import axiosInstance from '../../axiosInstance';
import * as turf from '@turf/turf';
import 'mapbox-gl/dist/mapbox-gl.css';

const MapboxExample = () => {
  const mapContainerRef = useRef();
  const mapRef = useRef();
  const location = useLocation();
  const owner_type = "farmer";  // Example owner_type
  const [notification, setNotification] = useState(null);
  const [mapProps, setMapProps] = useState({
    center: [-91.874, 42.76], // Default center if geolocation is not provided
    zoom: 5, // Default zoom if geolocation is not provided
  });
  const [polygons, setPolygons] = useState([]);
  const [totalArea, setTotalArea] = useState(0);
  const [polygonCount, setPolygonCount] = useState(0); // New state for polygon count

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q';

    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/satellite-v9',
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
  }, [mapProps.center, mapProps.zoom]);

  useEffect(() => {
    const fetchPolygons = async () => {
      try {
        const response = await axiosInstance.get(`/api/points/getallbyownertype/${owner_type}`);
        const data = response.data;

        if (!data.polygons || data.polygons.length === 0) {
          setNotification({
            type: "info",
            message: "No polygons found.",
          });
          return;
        }

        setNotification(null);
        setPolygons(data.polygons);

        // Update the number of polygons
        setPolygonCount(data.polygons.length);

      } catch (error) {
        console.error('Error fetching polygons:', error);
      }
    };

    fetchPolygons();
  }, [owner_type]);

  useEffect(() => {
    const getRandomColor = () => {
      // Function to generate a random hex color
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    };

    const addPolygonLayers = () => {
      if (!mapRef.current || polygons.length === 0) return;

      const features = polygons.map((polygon, index) => {
        const coordinates = polygon.points.map(point => [point.longitude, point.latitude]);
        const polygonGeoJSON = {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [coordinates]
            },
            properties: {
              id: index,
              owner_type: polygon.owner_type,
              owner_id: polygon.owner_id,
              area: Math.round(turf.area({
                type: 'FeatureCollection',
                features: [{
                  type: 'Feature',
                  geometry: {
                    type: 'Polygon',
                    coordinates: [coordinates]
                  }
                }]
              }) * 100) / 100
            }
          }]
        };

        const centroid = turf.centroid(polygonGeoJSON.features[0]);

        // Add marker for the centroid
        new mapboxgl.Marker()
          .setLngLat([centroid.geometry.coordinates[0], centroid.geometry.coordinates[1]])
          .addTo(mapRef.current);

        return {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [coordinates],
          },
          properties: {
            id: index,
            owner_type: polygon.owner_type,
            owner_id: polygon.owner_id,
            area: Math.round(turf.area(polygonGeoJSON.features[0]) * 100) / 100,
            color: getRandomColor()  // Assign a random color
          },
        };
      });

      // Calculate total area
      const total = features.reduce((sum, feature) => sum + feature.properties.area, 0);
      setTotalArea(total);

      const geojson = {
        type: 'FeatureCollection',
        features,
      };

      if (!mapRef.current.getSource('multiPolygon')) {
        mapRef.current.addSource('multiPolygon', {
          type: 'geojson',
          data: geojson,
        });

        mapRef.current.addLayer({
          id: 'multiPolygon-fill',
          type: 'fill',
          source: 'multiPolygon',
          paint: {
            'fill-color': ['get', 'color'],  // Use the color from properties
            'fill-opacity': 0.5,
          },
        });

        mapRef.current.addLayer({
          id: 'multiPolygon-outline',
          type: 'line',
          source: 'multiPolygon',
          paint: {
            'line-color': '#000',
            'line-width': 2,
          },
        });

        mapRef.current.on('click', 'multiPolygon-fill', (e) => {
          const { properties } = e.features[0];

          new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(` <h3>Owner Type: ${properties.owner_type}</h3>
              <p>Owner ID: ${properties.owner_id}</p>
              <p>Feature ID: ${properties.id}</p>
              <p>Area: ${properties.area} m²</p>
              <button class="delete-btn" data-owner-id="${properties.owner_id}" style="margin-top: 10px; padding: 5px 10px; background-color: red; color: white; border: none; border-radius: 3px; cursor: pointer;">Delete Polygon</button>`)
            .addTo(mapRef.current);
        });

        mapRef.current.on('mouseenter', 'multiPolygon-fill', () => {
          mapRef.current.getCanvas().style.cursor = 'pointer';
        });

        mapRef.current.on('mouseleave', 'multiPolygon-fill', () => {
          mapRef.current.getCanvas().style.cursor = '';
        });

        const bounds = new mapboxgl.LngLatBounds();
        features.forEach(feature => {
          feature.geometry.coordinates[0].forEach(coord => bounds.extend(coord));
        });
        mapRef.current.fitBounds(bounds, { padding: 20 });
      } else {
        mapRef.current.getSource('multiPolygon').setData(geojson);
      }
    };

    if (mapRef.current && polygons.length > 0) {
      if (mapRef.current.isStyleLoaded()) {
        addPolygonLayers();
      } else {
        mapRef.current.on('load', addPolygonLayers);
      }
    }
  }, [polygons]);

  // Event listener for Delete button
  useEffect(() => {
    // Function to handle the delete button click event
    const handleDeleteClick = async (event) => {
      if (event.target.classList.contains("delete-btn")) {
        const ownerId = event.target.getAttribute("data-owner-id");

        // Confirm the deletion
        const isConfirmed = window.confirm(`Are you sure you want to delete the polygon with owner ID: ${ownerId}?`);
        if (!isConfirmed) {
          return; // Abort the delete operation
        }

        console.log("Owner ID:", ownerId);
  
        // Send DELETE request to the backend
        try {
          const response = await axiosInstance.delete(`/api/points/owner/${ownerId}`);
          if (response.status === 204) {
            console.log(`Polygon with owner ID: ${ownerId} deleted successfully.`);
  
            // Optionally, show a notification or update the UI
            setNotification({
              type: "info",
              message: `Polygon with owner ID: ${ownerId} deleted successfully.`,
            });
  
            // Fetch the polygons again to update the map
            const updatedPolygonsResponse = await axiosInstance.get(`/api/points/getallbyownertype/${owner_type}`);
            const updatedData = updatedPolygonsResponse.data;
  
            setPolygons(updatedData.polygons);
            setPolygonCount(updatedData.polygons.length);  // Update the number of polygons
  
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
  
    // Add event listener for click events on the map container
    mapContainerRef.current.addEventListener("click", handleDeleteClick);
  
    // Cleanup event listener on component unmount
    return () => {
      if (mapContainerRef.current) {
        mapContainerRef.current.removeEventListener("click", handleDeleteClick);
      }
    };
  }, [polygons]);

  return (
    <div className="relative h-full">
      {notification && (
        <div
          className={`absolute top-20 right-2 z-10 px-4 py-2 rounded-md shadow-lg transition-shadow duration-300 focus:outline-none ${notification.type === "info"
            ? "bg-blue-500 text-white"
            : "bg-red-500 text-white"
            }`}
        >
          {notification.message}
        </div>
      )}

      <div ref={mapContainerRef} id="map" className="h-[80vh]" />
      <div className="flex">
        <div className="border border-blue-300 shadow rounded-md mt-4 p-4 max-w-sm w-full">
          <div className="flex space-x-4">
            <div className="rounded-full bg-slate-700 h-10 w-10"></div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Map Properties</h3>
              <p><strong>Total Area:</strong> {totalArea ? `${totalArea} m²` : 'Calculating...'}</p>
              <p><strong>Number of Polygons:</strong> {polygonCount}</p> {/* Display the number of polygons */}
              <p><strong>Zoom:</strong> {mapProps.zoom}</p>
            </div>
          </div>
        </div>
        <div className="border border-blue-300 shadow rounded-md mt-4 ms-4 p-4 flex-1">
          <div className="flex space-x-4">
            <div className="rounded-full bg-slate-700 h-10 w-10"></div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Additional Information</h3>
              <p>This is where you can add more details related to the map or your application.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapboxExample;
