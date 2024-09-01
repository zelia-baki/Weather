import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import axiosInstance from '../../axiosInstance';
import { useLocation } from "react-router-dom";
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

    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/satellite-v9',
        center: [longitude, latitude],
        zoom: 15,
      });
    }

    const fetchPoints = async () => {
      try {
        const response = await axiosInstance.get(`/api/points/getbyownerid/${owner_type}/${owner_id}`);
        const points = response.data.points;

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
              owner_id,
            },
          }],
        };

        const addPolygonLayers = () => {
          if (!mapRef.current.getSource('polygon')) {
            mapRef.current.addSource('polygon', {
              type: 'geojson',
              data: geojson,
            });

            mapRef.current.addLayer({
              id: 'polygon-fill',
              type: 'fill',
              source: 'polygon',
              paint: {
                'fill-color': '#0080ff',
                'fill-opacity': 0.5,
              },
            });

            mapRef.current.addLayer({
              id: 'polygon-outline',
              type: 'line',
              source: 'polygon',
              paint: {
                'line-color': '#000',
                'line-width': 2,
              },
            });
          } else {
            mapRef.current.getSource('polygon').setData(geojson);
          }

          // Ajouter une épingle au premier point du polygone
          if (points.length > 0) {
            const [firstPoint] = points;
            new mapboxgl.Marker()
              .setLngLat([firstPoint.longitude, firstPoint.latitude])
              .addTo(mapRef.current);
          }

          // Calculer le bounding box et ajuster la vue de la carte
          const bounds = new mapboxgl.LngLatBounds();

          points.forEach(point => {
            bounds.extend([point.longitude, point.latitude]);
          });

          mapRef.current.fitBounds(bounds, {
            padding: 20,  // padding autour du bounding box
          });
        };

        if (mapRef.current.isStyleLoaded()) {
          addPolygonLayers();
        } else {
          mapRef.current.on('load', addPolygonLayers);
        }

      } catch (error) {
        console.error('Error fetching points:', error);
      }
    };

    fetchPoints();

  }, [owner_id, owner_type, longitude, latitude]);

  return <div id="map" ref={mapContainerRef} style={{ height: '80%' }} />;
};

export default MapboxExample;
