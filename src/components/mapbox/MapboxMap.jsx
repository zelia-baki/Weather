import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MapboxMap = ({ coordinates }) => {
  const mapContainerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q';

    const initializeMap = () => {
      const mapInstance = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v11', // Choose your Mapbox style
        center: [coordinates[0][0], coordinates[0][1]],
        zoom: 10,
      });

      mapInstance.on('load', () => {
        mapInstance.addSource('polygon', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: [coordinates],
                },
              },
            ],
          },
        });

        mapInstance.addLayer({
          id: 'polygon-layer',
          type: 'fill',
          source: 'polygon',
          layout: {},
          paint: {
            'fill-color': '#888888',
            'fill-opacity': 0.5,
          },
        });

        // Capture the image when the map is loaded
        setTimeout(() => {
          const canvas = mapInstance.getCanvas();
          const dataURL = canvas.toDataURL('image/png');
          setImageUrl(dataURL);
        }, 1000); // Delay to ensure map is fully loaded
      });

      setMap(mapInstance);
    };

    if (!map) initializeMap();

    return () => map && map.remove();
  }, [map, coordinates]);

  return (
    <div>
      <div ref={mapContainerRef} className="map-container" style={{ height: '300px', width: '100%' }} />
      {imageUrl && <img src={imageUrl} alt="Map Polygon" />}
    </div>
  );
};

export default MapboxMap;
