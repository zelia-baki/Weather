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
  const drawRef = useRef(); // Add a ref to keep track of MapboxDraw
  const location = useLocation(); 
  const owner_id = location.state?.owner_id;
  const geolocation = location.state?.geolocation;
  const owner_type = location.state?.owner_type;
  const [roundedArea, setRoundedArea] = useState();
  const [polygonCoordinates, setPolygonCoordinates] = useState([]);
  const [placeName, setPlaceName] = useState('');
  const [notification, setNotification] = useState(null);
  const [newCoordinate, setNewCoordinate] = useState({ lng: "", lat: "" });
  
  let longitude = "32.5825"; // Default longitude for Kampala, Uganda
    let latitude = "0.3476";   // Default latitude for Kampala, Uganda

    if (geolocation && geolocation.includes(',')) {
      [longitude, latitude] = geolocation.split(',');
    }


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
    drawRef.current = draw; // Store draw instance in the ref

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
      } else {
        setRoundedArea();
        if (e.type !== "draw.delete")
          alert("Please draw a polygon.");
      }
    }
  }, [owner_id]);

  // Update the polygon on the map with new coordinates
  const updatePolygon = (newCoords) => {
    const draw = drawRef.current;
    const existingPolygon = draw.getAll();

    if (existingPolygon.features.length > 0) {
      // Update existing polygon's coordinates
      draw.delete(existingPolygon.features[0].id);
    }

    draw.add({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: newCoords,
      },
    });
  };

  // Handle adding new coordinates to the polygon
  const handleAddCoordinate = () => {
    const { lng, lat } = newCoordinate;
    if (!lng || !lat) {
      alert("Please enter valid coordinates.");
      return;
    }

    const newCoord = [parseFloat(lng), parseFloat(lat)];

    setPolygonCoordinates((prevCoords) => {
      const updatedCoords = [...prevCoords];
      if (updatedCoords.length > 0) {
        updatedCoords[0].push(newCoord); // Add new point to existing polygon
      } else {
        updatedCoords.push([newCoord]); // Start new polygon
      }

      updatePolygon(updatedCoords); // Update polygon on the map

      return updatedCoords;
    });

    // Clear input fields
    setNewCoordinate({ lng: "", lat: "" });
  };

  const handleValidate = async () => {
    console.log("Selection validated:", roundedArea, "Owner ID:", owner_id);

    try {
      const { data } = await axiosInstance.get(`/api/points/exists/${owner_type}/${owner_id}`);
      if (data.exists) {
        setNotification({
          type: "error",
          message: "Points for this owner already exist.",
        });
        return;
      }

      const points = polygonCoordinates[0].map(coord => ({
        longitude: coord[0],
        latitude: coord[1]
      }));
      console.log(owner_id, owner_type);

      for (const point of points) {
        await axiosInstance.post('/api/points/create', {
          longitude: point.longitude,
          latitude: point.latitude,
          owner_id: owner_id,
          owner_type: owner_type,
        });
      }

      setNotification({
        type: "success",
        message: "All points created successfully!",
      });

    } catch (error) {
      setNotification({
        type: "error",
        message: error.response ? error.response.data : error.message,
      });
      console.error('Error sending request:', error.response ? error.response.data : error.message);
    } finally {
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    }
  };

  return (
    <div className="relative h-full">
      {notification && (
        <div
          className={`absolute top-20 right-2 z-10 px-4 py-2 rounded-md shadow-lg transition-shadow duration-300 focus:outline-none ${notification.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
        >
          {notification.message}
        </div>
      )}

      <div className="absolute top-10 left-2 z-10 bg-white p-4 rounded-md shadow-lg">
        <div>
          <label>
            Longitude:
            <input
              type="number"
              value={newCoordinate.lng}
              onChange={(e) => setNewCoordinate({ ...newCoordinate, lng: e.target.value })}
              className="border p-2 rounded-md ml-2"
            />
          </label>
        </div>
        <div className="mt-2">
          <label>
            Latitude:
            <input
              type="number"
              value={newCoordinate.lat}
              onChange={(e) => setNewCoordinate({ ...newCoordinate, lat: e.target.value })}
              className="border p-2 rounded-md ml-2"
            />
          </label>
        </div>

        <button
          onClick={handleAddCoordinate}
          className="mt-4 bg-blue-500 text-white p-2 rounded-md"
        >
          Add Coordinate
        </button>

        <button
          onClick={handleValidate}
          className="mt-4 bg-green-500 text-white p-2 rounded-md ml-2"
        >
          Validate Selection
        </button>
      </div>

      <div className="relative h-[600px]">
        <div ref={mapContainerRef} className="absolute inset-0" />
      </div>
    </div>
  );
};

export default MapboxExample;
