import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import axiosInstance from '../../axiosInstance'; // Import your axios instance
import { useLocation } from "react-router-dom";  // Import useLocation to access the passed state

import 'mapbox-gl/dist/mapbox-gl.css';

const MapboxExample = () => {
  const mapContainerRef = useRef();
  const mapRef = useRef();
  const location = useLocation(); 
  const owner_id = location.state?.owner_id;
  const owner_type = location.state?.owner_type;
  const geolocation = location.state?.geolocation;
  const [longitude, latitude] = geolocation.split(',');



  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q';

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [latitude, longitude],
      zoom: 5
    });

    // Fetch points from the backend and add them to the map
    const fetchPoints = async () => {
      try {
        const response = await axiosInstance.get(`/api/points/getbyownerid/${owner_type}/${owner_id}`);
        const points = response.data.points;

        // Create a GeoJSON object for the polygon
        const geojson = {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                points.map(point => [point.longitude, point.latitude])
              ],
            },
            properties: {
              owner_type,
              owner_id
            },
          }],
        };

        mapRef.current.on('load', () => {
          // Add the polygon source to the map
          mapRef.current.addSource('polygon', {
            type: 'geojson',
            data: geojson,
          });

          // Add a fill layer to represent the polygon
          mapRef.current.addLayer({
            id: 'polygon-fill',
            type: 'fill',
            source: 'polygon',
            paint: {
              'fill-color': '#0080ff',
              'fill-opacity': 0.5
            }
          });

          // Add a line layer to outline the polygon
          mapRef.current.addLayer({
            id: 'polygon-outline',
            type: 'line',
            source: 'polygon',
            paint: {
              'line-color': '#000',
              'line-width': 2
            }
          });
        });
      } catch (error) {
        console.error('Error fetching points:', error);
      }
    };

    fetchPoints();

  }, [owner_id, owner_type]);

  return <div id="map" ref={mapContainerRef} style={{ height: '100%' }} />;
};

export default MapboxExample;
