import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import axiosInstance from '../../axiosInstance'; // Import your axios instance
import { useLocation } from "react-router-dom";  // Import useLocation to access the passed state
import 'mapbox-gl/dist/mapbox-gl.css';
import * as turf from '@turf/turf'; // Import turf for handling multipolygon

const MapboxExample = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const location = useLocation();
  // const owner_type = location.state?.owner_type;
  const owner_type = "farmer";  // Example owner_type

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q';

    if (!mapRef.current) {
      // Initialize the map only once
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/satellite-v9',
        center: [-91.874, 42.76],
        zoom: 5
      });
    }

    const fetchPolygons = async () => {
      try {
        const response = await axiosInstance.get(`/api/points/getallbyownertype/${owner_type}`);
        const polygons = response.data.polygons; // Array of polygons

        // Ensure polygons data is available
        if (!polygons || polygons.length === 0) {
          console.warn('No polygons data available.');
          return;
        }

        // Create GeoJSON features for each polygon
        const features = polygons.map((polygon, index) => ({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [polygon.points.map(point => [point.longitude, point.latitude])],
          },
          properties: {
            id: index,
            owner_type: polygon.owner_type,
            owner_id: polygon.owner_id,
          },
        }));

        // Create a FeatureCollection GeoJSON object
        const geojson = {
          type: 'FeatureCollection',
          features,
        };

        mapRef.current.on('load', () => {
          // Check if the source already exists before adding
          if (mapRef.current.getSource('multiPolygon')) {
            mapRef.current.getSource('multiPolygon').setData(geojson);
          } else {
            // Add multipolygon source to the map
            mapRef.current.addSource('multiPolygon', {
              type: 'geojson',
              data: geojson,
            });

            // Add a fill layer to represent each polygon
            mapRef.current.addLayer({
              id: 'multiPolygon-fill',
              type: 'fill',
              source: 'multiPolygon',
              paint: {
                'fill-color': '#0080ff',
                'fill-opacity': 0.5,
              },
            });

            // Add a line layer to outline each polygon
            mapRef.current.addLayer({
              id: 'multiPolygon-outline',
              type: 'line',
              source: 'multiPolygon',
              paint: {
                'line-color': '#000',
                'line-width': 2,
              },
            });

            // Fit the map to the bounds of the polygons
            const bounds = new mapboxgl.LngLatBounds();
            features.forEach(feature => {
              feature.geometry.coordinates[0].forEach(coord => bounds.extend(coord));
            });
            mapRef.current.fitBounds(bounds, { padding: 20 });
          }
        });

      } catch (error) {
        console.error('Error fetching polygons:', error);
      }
    };

    fetchPolygons();

    // Cleanup on component unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [owner_type]);

  return <div id="map" ref={mapContainerRef} style={{ height: '100%' }} />;
};

export default MapboxExample;
