import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import axiosInstance from '../../axiosInstance'; // Import your axios instance
import { useLocation } from "react-router-dom";  // Import useLocation to access the passed state
import 'mapbox-gl/dist/mapbox-gl.css';

const MapboxExample = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const location = useLocation(); 
  const owner_type = location.state?.owner_type;

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

        // Generate a GeoJSON object containing multiple polygon features
        const geojson = {
          type: 'FeatureCollection',
          features: polygons.map(polygon => ({
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                polygon.points.map(point => [point.longitude, point.latitude])
              ],
            },
            properties: {
              owner_type: polygon.owner_type,
              group_id: polygon[owner_type] // This could be forest_id, farmer_id, etc.
            },
          })),
        };

        mapRef.current.on('load', () => {
          // Check if the source already exists before adding
          if (mapRef.current.getSource('polygons')) {
            mapRef.current.getSource('polygons').setData(geojson);
          } else {
            // Add polygons source to the map
            mapRef.current.addSource('polygons', {
              type: 'geojson',
              data: geojson,
            });

            // Add a fill layer to represent the polygons
            mapRef.current.addLayer({
              id: 'polygons-fill',
              type: 'fill',
              source: 'polygons',
              paint: {
                'fill-color': '#0080ff',
                'fill-opacity': 0.5
              }
            });

            // Add a line layer to outline the polygons
            mapRef.current.addLayer({
              id: 'polygons-outline',
              type: 'line',
              source: 'polygons',
              paint: {
                'line-color': '#000',
                'line-width': 2
              }
            });
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
