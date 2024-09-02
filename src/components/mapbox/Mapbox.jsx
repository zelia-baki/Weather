import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";
import axiosInstance from '../../axiosInstance';

import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

const MapboxExample = () => {
  const mapContainerRef = useRef();
  const mapRef = useRef();
  const location = useLocation(); 
  const owner_id = location.state?.owner_id;
  const geolocation = location.state?.geolocation;
  const owner_type = location.state?.owner_type;
  const [roundedArea, setRoundedArea] = useState();
  const [polygonCoordinates, setPolygonCoordinates] = useState([]);
  const [placeName, setPlaceName] = useState('');
  const [notification, setNotification] = useState(null); // State for notification
  const [longitude, latitude] = geolocation.split(',');

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q';

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/satellite-v9",
      center: [latitude, longitude],
      zoom: 8,
    });

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
      defaultMode: "draw_polygon",
    });
    mapRef.current.addControl(draw);

    const coordinatesGeocoder = (query) => {
      const matches = query.match(
        /^[ ]*(?:Lat: )?(-?\d+\.?\d*)[, ]+(?:Lng: )?(-?\d+\.?\d*)[ ]*$/i
      );
      if (!matches) {
        return null;
      }

      function coordinateFeature(lng, lat) {
        return {
          center: [lng, lat],
          geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          place_name: "Lat: " + lat + " Lng: " + lng,
          place_type: ["coordinate"],
          properties: {},
          type: "Feature",
        };
      }

      const coord1 = Number(matches[1]);
      const coord2 = Number(matches[2]);
      const geocodes = [];

      if (coord1 < -90 || coord1 > 90) {
        geocodes.push(coordinateFeature(coord1, coord2));
      }

      if (coord2 < -90 || coord2 > 90) {
        geocodes.push(coordinateFeature(coord2, coord1));
      }

      if (geocodes.length === 0) {
        geocodes.push(coordinateFeature(coord1, coord2));
        geocodes.push(coordinateFeature(coord2, coord1));
      }

      return geocodes;
    };

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      localGeocoder: coordinatesGeocoder,
      zoom: 4,
      placeholder: "Search coordinates",
      mapboxgl: mapboxgl,
      reverseGeocode: true,
    });

    mapRef.current.addControl(geocoder);

    // Event listener for when a search result is selected
    geocoder.on('result', (e) => {
      const { place_name, geometry } = e.result;
      setPlaceName(place_name);
      console.log("Place Name:", place_name);
      console.log("Coordinates:", geometry.coordinates);
      mapRef.current.flyTo({
        center: geometry.coordinates,
        zoom: 15
      });
    });

    mapRef.current.on("draw.create", updateArea);
    mapRef.current.on("draw.delete", updateArea);
    mapRef.current.on("draw.update", updateArea);

    function updateArea(e) {
      const data = draw.getAll();
      if (data.features.length > 0) {
        const area = turf.area(data);
        setRoundedArea(Math.round(area * 100) / 100);

        const coordinates = data.features[0].geometry.coordinates;
        setPolygonCoordinates(coordinates);
        console.log("Polygon Coordinates:", coordinates);

        // Add or update the polygon source and layers
        const sourceId = `polygon-${owner_id}`;
        if (mapRef.current.getSource(sourceId)) {
          mapRef.current.getSource(sourceId).setData({
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: coordinates,
              },
              properties: {
                owner_id
              },
            }]
          });
        } else {
          mapRef.current.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [{
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: coordinates,
                },
                properties: {
                  owner_id
                },
              }]
            }
          });

          mapRef.current.addLayer({
            id: `polygon-fill-${owner_id}`,
            type: 'fill',
            source: sourceId,
            paint: {
              'fill-color': '#0080ff',
              'fill-opacity': 0.5
            }
          });

          mapRef.current.addLayer({
            id: `polygon-outline-${owner_id}`,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': '#000',
              'line-width': 2
            }
          });
        }
      } else {
        setRoundedArea();
        if (e.type !== "draw.delete")
          alert("Please draw a polygon.");
      }
    }
  }, [owner_id]);

  const handleValidate = async () => {
    console.log("Selection validated:", roundedArea, "Owner ID:", owner_id);

    try {
      // Check if any points already exist for the given owner_id
      const { data } = await axiosInstance.get(`/api/points/exists/${owner_type}/${owner_id}`);
      if (data.exists) {
        // Set notification if points already exist
        setNotification({
          type: "error",
          message: "Points for this owner already exist.",
        });
        return;
      }

      // Extract all points from the polygon
      const points = polygonCoordinates[0].map(coord => ({
        longitude: coord[0],
        latitude: coord[1]
      }));
      console.log(owner_id, owner_type);

      // Send each point to the backend
      for (const point of points) {
        await axiosInstance.post('/api/points/create', {
          longitude: point.longitude,
          latitude: point.latitude,
          owner_id: owner_id,
          owner_type: owner_type, // Adjust based on your logic
        });
      }

      // Set success notification
      setNotification({
        type: "success",
        message: "All points created successfully!",
      });

    } catch (error) {
      // Set error notification
      setNotification({
        type: "error",
        message: error.response ? error.response.data : error.message,
      });
      console.error('Error sending request:', error.response ? error.response.data : error.message);
    } finally {
      // Clear notification after 5 seconds
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    }
  };

  return (
    <div className="relative h-full">
      {notification && (
        <div
          className={`absolute top-20 right-2 z-10 px-4 py-2 rounded-md shadow-lg transition-shadow duration-300 focus:outline-none ${
            notification.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {notification.message}
        </div>
      )}

      <button
        onClick={handleValidate}
        className="absolute top-40 right-2 z-10 px-4 py-2 bg-white text-black border-2 border-black rounded-md shadow-lg hover:bg-gray-100 hover:shadow-2xl transition-shadow duration-300 focus:outline-none"
        style={{ boxShadow: '0 12px 24px rgba(0, 0, 0, 1)' }}
      >
        Valider
      </button>

      <div ref={mapContainerRef} id="map" className="h-[80vh]"></div>
      
    </div>
  );
};

export default MapboxExample;
