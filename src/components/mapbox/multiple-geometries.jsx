import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

import 'mapbox-gl/dist/mapbox-gl.css';

const MapboxExample = () => {
  const mapContainerRef = useRef();
  const mapRef = useRef();

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q';

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [-121.403732, 40.492392],
      zoom: 10
    });

    mapRef.current.on('load', () => {
      mapRef.current.addSource('national-park', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [
                    [-121.353637, 40.584978],
                    [-121.284551, 40.584758],
                    [-121.275349, 40.541646],
                    [-121.246768, 40.541017],
                    [-121.251343, 40.423383],
                    [-121.32687, 40.423768],
                    [-121.360619, 40.43479],
                    [-121.363694, 40.409124],
                    [-121.439713, 40.409197],
                    [-121.439711, 40.423791],
                    [-121.572133, 40.423548],
                    [-121.577415, 40.550766],
                    [-121.539486, 40.558107],
                    [-121.520284, 40.572459],
                    [-121.487219, 40.550822],
                    [-121.446951, 40.56319],
                    [-121.370644, 40.563267],
                    [-121.353637, 40.584978]
                  ]
                ]
              }
            },
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [-121.415061, 40.506229]
              }
            },
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [-121.505184, 40.488084]
              }
            },
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [-121.354465, 40.488737]
              }
            }
          ]
        }
      });

      mapRef.current.addLayer({
        id: 'park-boundary',
        type: 'fill',
        source: 'national-park',
        paint: {
          'fill-color': '#888888',
          'fill-opacity': 0.4
        },
        filter: ['==', '$type', 'Polygon']
      });

      mapRef.current.addLayer({
        id: 'park-volcanoes',
        type: 'circle',
        source: 'national-park',
        paint: {
          'circle-radius': 6,
          'circle-color': '#B42222'
        },
        filter: ['==', '$type', 'Point']
      });
    });
  }, []);

  return <div id="map" ref={mapContainerRef} style={{ height: '100%' }} />;
};

export default MapboxExample;