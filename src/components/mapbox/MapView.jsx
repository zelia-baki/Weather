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
  const owner_id = location.state?.owner_id;
  const owner_type = location.state?.owner_type;
  const geolocation = location.state?.geolocation;
  const [latitude, longitude] = geolocation.split(',');
  const [notification, setNotification] = useState(null);
  const [mapProps, setMapProps] = useState({
    center: [longitude, latitude],
    zoom: 15,
  });
  const [area, setArea] = useState(null);

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q';

    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/satellite-v9',
        center: [longitude, latitude],
        zoom: 15,
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

    const fetchPoints = async () => {
      try {
        const response = await axiosInstance.get(`/api/points/getbyownerid/${owner_type}/${owner_id}`);
        const points = response.data.points;

        if (points.length === 0) {
          setNotification({
            type: "info",
            message: "No points found. Please create a point first.",
          });
          return;
        }

        setNotification(null);

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

          if (points.length > 0) {
            const [firstPoint] = points;
            new mapboxgl.Marker()
              .setLngLat([firstPoint.longitude, firstPoint.latitude])
              .addTo(mapRef.current);
          }

          const bounds = new mapboxgl.LngLatBounds();

          points.forEach(point => {
            bounds.extend([point.longitude, point.latitude]);
          });

          mapRef.current.fitBounds(bounds, {
            padding: 20,
          });

          // Calculate the area of the polygon
          const area = turf.area(geojson.features[0]);
          setArea(Math.round(area * 100) / 100); // Round area to 2 decimal places
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
              <p><strong>Area m²:</strong> {area ? area : 'Calculating...'}</p>
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
