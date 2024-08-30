import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import axiosInstance from '../../axiosInstance'; // Import your axios instance\
import { useLocation } from "react-router-dom";  // Import useLocation to access the passed state


import 'mapbox-gl/dist/mapbox-gl.css';

const MapboxExample = () => {
  const mapContainerRef = useRef();
  const mapRef = useRef();
  const location = useLocation(); 
  const owner_id = location.state?.owner_id;
  const owner_type = location.state?.owner_type;
  const geolocation = location.state?.geolocation;

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q';

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [-91.874, 42.76],
      zoom: 5
    });

    // Fetch points from the backend and add them to the map
    const fetchPoints = async () => {
      try {
        const response = await axiosInstance.get(`/api/points/getbyownerid/${owner_type}/${owner_id}`);
        const points = response.data.points;

        const geojson = {
          type: 'FeatureCollection',
          features: points.map(point => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [point.longitude, point.latitude],
            },
            properties: {
              id: point.id,
              owner_type: point.owner_type,
              forest_id: point.forest_id,
              farmer_id: point.farmer_id,
            },
          })),
        };

        mapRef.current.on('load', () => {
          mapRef.current.addSource('points', {
            type: 'geojson',
            data: geojson,
          });

          mapRef.current.addLayer({
            id: 'points',
            type: 'circle',
            source: 'points',
            paint: {
              'circle-radius': 5,
              'circle-color': '#007cbf',
            },
          });
        });
      } catch (error) {
        console.error('Error fetching points:', error);
      }
    };

    fetchPoints();

  }, []);

  return <div id="map" ref={mapContainerRef} style={{ height: '100%' }} />;
};

export default MapboxExample;
